import { ObjectDatabase } from './object-db.js';
import { RuntimeObjectImpl } from './runtime-object.js';
import { ObjectCache } from './object-cache.js';
import { getLoggerFacade, RESERVED_ALIASES } from './logger-facade.js';
import * as bcrypt from 'bcrypt';
import type {
  GameObject,
  ObjId,
  RuntimeObject,
  CreateObjectParams,
  PropertyValue,
} from '../../types/object.js';

/**
 * Object manager - coordinates ObjectDatabase and RuntimeObjects
 * Provides in-memory caching with change stream invalidation
 *
 * Caching Strategy:
 * - Cache everything in memory, never evict
 * - Rely 100% on MongoDB change streams for invalidation
 * - Cache compiled method code to avoid repeated TypeScript compilation
 * - Cache parent chains for fast inheritance lookups
 * - Preload critical objects (prototypes, system) on startup
 *
 * Dynamic Alias System:
 * - Core objects ($.system, $.authManager, etc.) are registered during bootstrap
 * - Custom aliases can be set: $.myAlias = object
 * - All aliases are loaded from MongoDB, not hardcoded in TypeScript
 * - Aliases can be configured via MOO code for maximum flexibility
 *
 * Watches MongoDB change streams for multi-server cache invalidation
 */
export class ObjectManager {
  private cache: ObjectCache;
  private aliases = new Map<string, RuntimeObject>();
  public readonly db: ObjectDatabase; // Expose for DevTools direct access

  // Track our own writes to avoid invalidating cache for them
  private pendingWrites = new Map<ObjId, NodeJS.Timeout>();

  constructor(db: ObjectDatabase) {
    this.db = db;
    this.cache = new ObjectCache();

    // Watch for changes from other servers/processes
    this.setupChangeStreamWatcher();
    // Return a Proxy to enable dynamic property access
    return new Proxy(this, {
      get: (target, prop: string | symbol) => {
        if (typeof prop === 'symbol' || prop in target) {
          return (target as any)[prop];
        }

        // Infrastructure objects (not stored in MongoDB)
        if (prop === 'logger') {
          return getLoggerFacade();
        }

        // Check if it's a registered alias
        if (target.aliases.has(prop)) {
          return target.aliases.get(prop);
        }

        return undefined;
      },

      set: (target, prop: string | symbol, value: any) => {
        if (typeof prop === 'symbol') {
          (target as any)[prop] = value;
          return true;
        }

        // Block reserved infrastructure aliases
        if (RESERVED_ALIASES.has(prop)) {
          console.warn(`[ObjectManager] Cannot overwrite reserved alias: ${prop}`);
          return false;
        }

        // Don't allow overwriting internal properties
        if (prop in target) {
          return false;
        }

        // Register as an alias
        if (value && typeof value === 'object' && 'id' in value) {
          target.aliases.set(prop, value as RuntimeObject);
          return true;
        }

        return false;
      }
    }) as any;
  }


  /**
   * Load object from database (with caching)
   * Special cases:
   * - load(-1) returns $.nothing - immutable null object reference
   * - load(0) returns the ObjectManager itself as a RuntimeObject
   */
  async load(id: ObjId): Promise<RuntimeObject | null> {
    // Special case: #-1 is the null object reference ($.nothing)
    if (id === -1) {
      // Check if we've already created it
      const cached = this.cache.getObject(-1);
      if (cached) {
        return cached;
      }

      // Load or create #-1 in database
      let obj = await this.db.get(-1);
      if (!obj) {
        // Create #-1 as immutable null object with empty properties
        obj = await this.db.create({
          _id: -1,
          parent: -1, // Self-parented
          properties: {},
          methods: {},
        });

        // Wrap as RuntimeObject and cache THE PROXY
        const runtime = new RuntimeObjectImpl(obj, this);
        const proxy = runtime.getProxy();
        this.cache.setObject(-1, proxy);

        // Set properties through proxy to auto-convert to typed Values
        proxy.set('name', 'nothing');
        proxy.set('description', 'The null object reference - immutable, no properties or methods');

        return proxy;
      }

      // Wrap as RuntimeObject and cache THE PROXY
      const runtime = new RuntimeObjectImpl(obj, this);
      const proxy = runtime.getProxy();
      this.cache.setObject(-1, proxy);
      return proxy;
    }

    // Special case: #0 is the ObjectManager itself
    if (id === 0) {
      // Check if we've already wrapped ourselves
      const cached = this.cache.getObject(0);
      if (cached) {
        return cached;
      }

      // Load or create #0 in database
      let obj = await this.db.get(0);
      if (!obj) {
        // Create #0 on first access with empty properties
        obj = await this.db.create({
          _id: 0,
          parent: 0, // Self-parented
          properties: {},
          methods: {},
        });

        // Wrap ourselves as a RuntimeObject and cache THE PROXY
        const runtime = new RuntimeObjectImpl(obj, this);
        const proxy = runtime.getProxy();
        this.cache.setObject(0, proxy);

        // Set properties through proxy to auto-convert to typed Values
        proxy.set('name', 'ObjectManager');
        proxy.set('description', 'The root system object - provides object management and global aliases');
        proxy.set('aliases', {});

        return proxy;
      }

      // Wrap ourselves as a RuntimeObject and cache THE PROXY
      const runtime = new RuntimeObjectImpl(obj, this);
      const proxy = runtime.getProxy();
      this.cache.setObject(0, proxy);
      return proxy;
    }

    // Check cache first (always hit after first load)
    const cached = this.cache.getObject(id);
    if (cached) {
      return cached;
    }

    // Cache miss - load from database
    const obj = await this.db.get(id);
    if (!obj) return null;

    // Wrap in RuntimeObject and cache THE PROXY (never evicts)
    const runtime = new RuntimeObjectImpl(obj, this);
    const proxy = runtime.getProxy();
    this.cache.setObject(id, proxy);
    return proxy;
  }

  /**
   * Synchronous cache-only get (for inheritance chain walking)
   */
  getSync(id: ObjId): RuntimeObject | null {
    return this.cache.getObject(id) || null;
  }

  /**
   * Create new object
   */
  async create(params: CreateObjectParams): Promise<RuntimeObject> {
    const id = await this.db.getNextId();

    // Convert properties to typed Values upfront
    const typedProperties: Record<string, any> = {};
    if (params.properties) {
      for (const [key, value] of Object.entries(params.properties)) {
        typedProperties[key] = this.toValue(value);
      }
    }

    // Create object with all properties in one atomic operation
    const obj = await this.db.create({
      _id: id,
      parent: params.parent,
      properties: typedProperties,
      methods: params.methods || {},
    });

    const runtime = new RuntimeObjectImpl(obj, this);
    const proxy = runtime.getProxy();
    this.cache.setObject(id, proxy);

    return proxy;
  }

  /**
   * Convert a JavaScript value to a typed Value
   * Duplicated from RuntimeObjectImpl for use in create()
   */
  private toValue(jsValue: any): any {
    // Handle null
    if (jsValue === null) {
      return { type: 'null', value: null };
    }

    // Handle undefined (treat as null)
    if (jsValue === undefined) {
      return { type: 'null', value: null };
    }

    // Already a typed Value - return as-is to avoid double-wrapping
    if (jsValue && typeof jsValue === 'object' && 'type' in jsValue && 'value' in jsValue) {
      const validTypes = ['null', 'string', 'number', 'boolean', 'objref', 'array', 'object'];
      if (validTypes.includes(jsValue.type)) {
        return jsValue;
      }
    }

    // Handle RuntimeObject (store as objref)
    if (jsValue && typeof jsValue === 'object' && 'id' in jsValue && typeof jsValue.id === 'number') {
      return { type: 'objref', value: jsValue.id };
    }

    // Handle primitives
    const jsType = typeof jsValue;

    if (jsType === 'string') {
      return { type: 'string', value: jsValue };
    }

    if (jsType === 'number') {
      return { type: 'number', value: jsValue };
    }

    if (jsType === 'boolean') {
      return { type: 'boolean', value: jsValue };
    }

    // Handle arrays (recursively convert elements)
    if (Array.isArray(jsValue)) {
      return {
        type: 'array',
        value: jsValue.map(item => this.toValue(item))
      };
    }

    // Handle objects (recursively convert properties)
    if (jsType === 'object') {
      const objValue: Record<string, any> = {};
      for (const [key, val] of Object.entries(jsValue)) {
        objValue[key] = this.toValue(val);
      }
      return { type: 'object', value: objValue };
    }

    // Fallback to null for unknown types
    return { type: 'null', value: null };
  }

  /**
   * Update object in database
   * @param invalidateCache - Whether to invalidate cache after update (default: true)
   *   Set to false when called by RuntimeObject's auto-persist (in-memory is source of truth)
   *   Set to true for external updates (DevTools, tests, etc)
   */
  async update(
    id: ObjId,
    updates: Partial<Omit<GameObject, '_id' | 'created'>>,
    invalidateCache = true
  ): Promise<void> {
    // Track this write as ours so change stream doesn't invalidate it
    this.trackWrite(id);

    await this.db.update(id, updates);

    if (invalidateCache) {
      this.cache.invalidate(id);
    }
  }

  /**
   * Track a write as belonging to this session
   * Change stream will ignore changes to tracked writes
   */
  private trackWrite(id: ObjId): void {
    // Clear existing timeout if present
    if (this.pendingWrites.has(id)) {
      clearTimeout(this.pendingWrites.get(id)!);
    }

    // Track this write for 2 seconds (change streams are usually fast)
    const timeout = setTimeout(() => {
      this.pendingWrites.delete(id);
    }, 2000);

    this.pendingWrites.set(id, timeout);
  }

  /**
   * Delete object
   */
  async delete(id: ObjId): Promise<void> {
    await this.db.delete(id);

    // Invalidate everything related to this object
    this.cache.invalidate(id);
  }

  /**
   * Find object by property value
   */
  async findByProperty(prop: string, value: PropertyValue): Promise<RuntimeObject[]> {
    // This is inefficient for now - we'd need proper indexing in MongoDB
    // For MVP, just scan all objects in memory
    const results: RuntimeObject[] = [];

    for (const obj of this.cache.values()) {
      if (obj.get(prop) === value) {
        results.push(obj);
      }
    }

    return results;
  }

  /**
   * Get all children of an object
   */
  async getChildren(parentId: ObjId): Promise<RuntimeObject[]> {
    const children = await this.db.getChildren(parentId);
    const runtimes: RuntimeObject[] = [];

    for (const child of children) {
      let runtime = this.cache.get(child._id);
      if (!runtime) {
        runtime = new RuntimeObjectImpl(child, this);
        this.cache.set(child._id, runtime);
      }
      runtimes.push(runtime);
    }

    return runtimes;
  }

  /**
   * Clear cache (force reload from DB)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get compiled method code from cache
   */
  getCompiledMethod(objId: ObjId, methodName: string): string | undefined {
    return this.cache.getCompiledMethod(objId, methodName);
  }

  /**
   * Store compiled method code in cache
   */
  setCompiledMethod(objId: ObjId, methodName: string, compiledCode: string): void {
    this.cache.setCompiledMethod(objId, methodName, compiledCode);
  }

  /**
   * Invalidate a specific compiled method from cache
   */
  invalidateCompiledMethod(objId: ObjId, methodName: string): void {
    this.cache.invalidateCompiledMethod(objId, methodName);
  }

  /**
   * Preload objects into cache
   * Marks them as preloaded for statistics
   */
  async preload(ids: ObjId[]): Promise<void> {
    await Promise.all(ids.map((id) => this.load(id)));
    ids.forEach(() => this.cache.markPreloaded());
  }

  /**
   * Register an alias for an object by ID
   * Loads the object and registers it with the given alias name
   * Used during bootstrap to set up core system aliases ($.system, $.authManager, etc.)
   */
  async registerAliasById(name: string, id: ObjId): Promise<void> {
    // Block reserved infrastructure aliases
    if (RESERVED_ALIASES.has(name)) {
      console.warn(`[ObjectManager] Cannot register reserved alias: ${name}`);
      return;
    }

    const obj = await this.load(id);
    if (obj) {
      this.aliases.set(name, obj);
    }
  }

  /**
   * Register an alias for an object
   * Enables: $.alias = object; then later: await $.alias
   */
  registerAlias(name: string, obj: RuntimeObject): void {
    // Block reserved infrastructure aliases
    if (RESERVED_ALIASES.has(name)) {
      console.warn(`[ObjectManager] Cannot register reserved alias: ${name}`);
      return;
    }

    this.aliases.set(name, obj);
  }

  /**
   * Remove an alias
   * Cannot remove reserved infrastructure aliases
   */
  removeAlias(name: string): void {
    if (RESERVED_ALIASES.has(name)) {
      console.warn(`[ObjectManager] Cannot remove reserved alias: ${name}`);
      return;
    }
    this.aliases.delete(name);
  }

  /**
   * Check if an object reference is valid
   * Returns false for:
   * - null/undefined
   * - Objects with id < 0 (infrastructure objects like $.logger)
   * - Recycled objects
   * - Objects not in cache/database
   */
  isValid(obj: any): boolean {
    // Null check
    if (obj === null || obj === undefined) {
      return false;
    }

    // Must have an id property
    if (typeof obj !== 'object' || !('id' in obj)) {
      return false;
    }

    const id = obj.id;

    // Infrastructure objects have id < 0
    if (typeof id !== 'number' || id < 0) {
      return false;
    }

    // Check if it's in cache (we cache everything after first load)
    const cached = this.cache.getObject(id);
    if (!cached) {
      return false;
    }

    // Check if recycled
    const recycled = cached.get('recycled');
    if (recycled === true) {
      return false;
    }

    return true;
  }

  /**
   * Get all registered aliases
   */
  getAliases(): Map<string, RuntimeObject> {
    return new Map(this.aliases);
  }

  /**
   * Recycle an object (soft delete, ID can be reused)
   * LambdaMOO-style recycling: marks object as deleted but keeps ID for reuse
   */
  async recycle(objOrId: RuntimeObject | ObjId): Promise<void> {
    const id = typeof objOrId === 'number' ? objOrId : objOrId.id;

    // Mark as recycled in database
    await this.db.recycle(id);

    // Invalidate cache (object, methods, parent chains)
    this.cache.invalidate(id);

    // Remove from aliases
    for (const [name, obj] of this.aliases) {
      if (obj.id === id) {
        this.aliases.delete(name);
      }
    }
  }

  /**
   * Invalidate cache for a specific object
   * Forces reload from database on next access
   * Used by DevTools when external changes are made
   * Invalidates object, compiled methods, and parent chains
   */
  invalidate(id: ObjId): void {
    if (this.cache.hasObject(id)) {
      console.log(`[ObjectManager] Invalidating cache for object #${id}`);
    }
    this.cache.invalidate(id);
  }

  /**
   * Evict object from cache (for recycler to use)
   * Does not reload - just removes from cache
   */
  evictFromCache(id: ObjId): void {
    this.cache.invalidate(id);
  }

  // ==========================================================================
  // MOO Helper Methods
  // These methods are exposed to MOO code via $ and hide infrastructure details
  // ==========================================================================

  /**
   * Count the number of player objects in the database
   * Used by CharGen to determine if this is the first player (admin)
   * Searches for objects that have a non-empty playername property
   */
  async countPlayers(): Promise<number> {
    return await this.db.countPlayers();
  }

  /**
   * Hash a password using bcrypt
   * Used by Player.setPassword and CharGen
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Check a password against a bcrypt hash
   * Used by Player.checkPassword and AuthManager
   * @param password - Plain text password to check
   * @param hash - Bcrypt hash to compare against
   * @returns true if password matches
   */
  async checkPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Setup MongoDB change stream watcher
   * Invalidates cache when objects are modified by other servers/processes
   * Enables multi-server deployment with shared MongoDB
   */
  private setupChangeStreamWatcher(): void {
    this.db.watch((change) => {
      const operationType = change.operationType;

      if (operationType === 'update' || operationType === 'replace') {
        const id = change.documentKey._id as ObjId;

        // Ignore our own writes (tracked by manager.update())
        if (this.pendingWrites.has(id)) {
          // This is our own write - don't invalidate cache
          return;
        }

        // This is an external change (from another server/process)
        if (this.cache.hasObject(id)) {
          console.log(
            `[ObjectManager] External change detected for object #${id} - invalidating cache`
          );
        }
        this.cache.invalidate(id);
      } else if (operationType === 'delete') {
        const id = change.documentKey._id as ObjId;

        // Invalidate everything related to this object
        this.cache.invalidate(id);

        // Remove from aliases
        for (const [name, obj] of this.aliases) {
          if (obj.id === id) {
            this.aliases.delete(name);
          }
        }
      }
    });
  }
}
