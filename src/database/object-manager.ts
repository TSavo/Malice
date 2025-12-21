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
 * Sanitize an object for MongoDB storage, removing circular references
 */
function sanitizeForMongo(value: any, seen: WeakSet<object> = new WeakSet(), path: string = 'root'): any {
  if (value === null || value === undefined) {
    return value;
  }

  const type = typeof value;
  if (type !== 'object') {
    return value;
  }

  // Check for circular reference
  if (seen.has(value)) {
    console.error(`[ObjectManager] Circular reference detected at ${path}, replacing with null`);
    return null;
  }
  seen.add(value);

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item, i) => sanitizeForMongo(item, seen, `${path}[${i}]`));
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value;
  }

  // Handle plain objects
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = sanitizeForMongo(val, seen, `${path}.${key}`);
  }
  return result;
}

/**
 * Object manager - coordinates ObjectDatabase and RuntimeObjects
 * Provides in-memory source of truth with database persistence
 *
 * Caching Strategy (Stable Proxy Architecture):
 * - Full Warmup: The entire database is loaded into memory at startup (loadAll)
 * - Array-Backed: O(1) access for positive IDs using a dense array
 * - Stable Proxies: References never change and are never evicted
 * - Async Write-Through: Memory is primary, DB is persisted in background
 * - Method Caching: Compiled code and parent chains are cached for performance
 *
 * Dynamic Alias System:
 * - Core objects ($.system, $.authManager, etc.) are registered during bootstrap
 * - Custom aliases can be set: $.myAlias = object
 * - All aliases are loaded from MongoDB, not hardcoded in TypeScript
 * - Aliases can be configured via MOO code for maximum flexibility
 */
export class ObjectManager {
  private cache: ObjectCache;
  private aliases = new Map<string, RuntimeObject>();
  public readonly db: ObjectDatabase; // Expose for DevTools direct access

  // Track in-flight update operations (fire-and-forget writes from RuntimeObject)
  private pendingUpdateOperations = new Set<Promise<void>>();

  constructor(db: ObjectDatabase) {
    this.db = db;
    this.cache = new ObjectCache();

    // Return a Proxy to enable dynamic property access
    return new Proxy(this, {
      get: (target, prop: string | symbol) => {
        if (typeof prop === 'string' && prop.startsWith('$') && prop.length > 1) {
          const id = parseInt(prop.slice(1), 10);
          if (!isNaN(id)) {
            return target.load(id);
          }
        }

        if (typeof prop === 'symbol' || prop in target) {
          return (target as any)[prop];
        }

        // Infrastructure objects (not stored in MongoDB)
        if (prop === 'logger') {
          return getLoggerFacade();
        }

        // Check if it's a registered alias
        if (target.aliases.has(prop as string)) {
          return target.aliases.get(prop as string);
        }

        return undefined;
      },
      set: (target, prop: string | symbol, value: any) => {
        // Protect internal properties from being overwritten via proxy
        if (typeof prop === 'symbol') {
          (target as any)[prop] = value;
          return true;
        }

        // Block overwriting internal properties
        const internalProps = ['db', 'cache', 'aliases', 'pendingUpdateOperations'];
        if (internalProps.includes(prop)) {
          return false;
        }

        // Allow setting other existing properties
        if (prop in target) {
          (target as any)[prop] = value;
          return true;
        }

        // Allow registering aliases (objects with id property)
        if (value && typeof value === 'object' && 'id' in value) {
          target.aliases.set(prop, value as RuntimeObject);
          return true;
        }

        return false;
      }
    }) as any;
  }

  /**
   * Get the underlying database
   */
  getDatabase(): ObjectDatabase {
    return this.db;
  }

  /**
   * Load object from database (with caching)
   * Special cases:
   * - load(-1) returns $.nothing - immutable null object reference
   * - load(0) returns the ObjectManager itself as a RuntimeObject
   */
  async load(id: ObjId | RuntimeObject): Promise<RuntimeObject | null> {
    // Handle RuntimeObject being passed - extract the ID
    if (id && typeof id === 'object' && 'id' in id) {
      // Already a RuntimeObject - just return it
      return id as RuntimeObject;
    }

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
          parent: { type: 'objref', value: -1 }, // Self-parented
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
          parent: { type: 'objref', value: 0 }, // Self-parented
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

    // Check cache first (should always hit after loadAll at startup)
    const cached = this.cache.getObject(id);
    if (cached) {
      return cached;
    }

    // Cache miss - this should only happen for newly created objects
    // or objects created after startup. Log a warning for debugging.
    console.warn(`[ObjectManager] Cache miss for #${id} - loading from database`);

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

    // Validate parent is a RuntimeObject, not a number
    if (typeof params.parent === 'number') {
      throw new Error('Parent must be a RuntimeObject, not a number. Use manager.load(id) to get the parent object.');
    }
    if (!params.parent || typeof params.parent.id !== 'number') {
      throw new Error('Parent must be a RuntimeObject with a valid id property.');
    }

    // Extract parent ID from RuntimeObject and store as ObjRefValue
    const parentId = params.parent.id as ObjId;

    // Convert properties to typed Values upfront
    const typedProperties: Record<string, any> = {};
    if (params.properties) {
      for (const [key, value] of Object.entries(params.properties)) {
        typedProperties[key] = this.toValue(value);
      }
    }

    // Convert methods to proper format ({ code: string })
    // Methods may be passed as plain strings or as { code: string, ... } objects
    const wrappedMethods: Record<string, any> = {};
    if (params.methods) {
      for (const [name, method] of Object.entries(params.methods)) {
        if (typeof method === 'string') {
          wrappedMethods[name] = { code: method };
        } else {
          wrappedMethods[name] = method;
        }
      }
    }

    // Create object with all properties in one atomic operation
    const obj = await this.db.create({
      _id: id,
      parent: { type: 'objref', value: parentId },
      properties: typedProperties,
      methods: wrappedMethods,
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
      // Check for objref string format "#N" (e.g., "#5", "#123")
      // This allows MCP and external systems to pass objrefs as strings
      if (/^#\d+$/.test(jsValue)) {
        const objId = parseInt(jsValue.slice(1), 10);
        return { type: 'objref', value: objId };
      }
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
   * @param invalidateCache - Whether to invalidate transient caches (methods/parents)
   */
  async update(
    id: ObjId,
    updates: Partial<Omit<GameObject, '_id' | 'created'>>,
    invalidateCache = true
  ): Promise<void> {
    // Track in-flight writes so tests can flush them before teardown.
    const updatePromise = this.db.update(id, updates);
    this.pendingUpdateOperations.add(updatePromise);
    try {
      await updatePromise;
    } finally {
      this.pendingUpdateOperations.delete(updatePromise);
    }

    if (invalidateCache) {
      this.cache.invalidate(id);
    }
  }

  /**
   * Find object by property value
   */
  async findByProperty(prop: string, value: PropertyValue): Promise<RuntimeObject[]> {
    const results: RuntimeObject[] = [];

    // Scan cache - all objects are loaded at startup
    for (const obj of this.cache.values()) {
      if (obj.get(prop) === value) {
        results.push(obj);
      }
    }

    return results;
  }

  /**
   * Get all children of an object
   * Scans in-memory cache (all objects loaded at startup)
   */
  async getChildren(parentId: ObjId): Promise<RuntimeObject[]> {
    const results: RuntimeObject[] = [];

    // Scan cache - all objects are loaded at startup
    for (const obj of this.cache.values()) {
      const parent = obj.getParent();
      if (parent && parent.id === parentId) {
        results.push(obj);
      }
    }

    return results;
  }

  /**
   * Wait for all in-flight RuntimeObject auto-persist writes to complete.
   *
   * This is primarily intended for tests, to avoid disconnecting Mongo while
   * fire-and-forget writes are still pending.
   */

  async flushWrites(): Promise<void> {
    // Drain in waves in case awaiting one write triggers others.
    while (this.pendingUpdateOperations.size > 0) {
      const pending = Array.from(this.pendingUpdateOperations);
      await Promise.allSettled(pending);
    }
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
   * Invalidate transient caches (compiled methods, parent chains)
   * Does NOT remove the object proxy (Stable Proxy Pattern)
   */
  invalidateTransientCache(id: ObjId): void {
    this.cache.invalidate(id);
  }

  /**
   * Legacy alias for invalidating transient caches.
   *
   * Older tests and tooling call `manager.invalidate(id)`.
   */
  invalidate(id: ObjId): void {
    this.invalidateTransientCache(id);
  }

  /**
   * Pull fresh data from database for an object (updates in-place)
   * Used to sync memory when DB is modified externally
   */
  async pull(id: ObjId): Promise<void> {
    const obj = this.cache.getObject(id);
    if (obj) {
      await obj.pull();
    }
  }

  /**
   * Push current memory state to database for an object
   * Forces a write of the in-memory object data
   */
  async push(id: ObjId): Promise<void> {
    const obj = this.cache.getObject(id);
    if (obj) {
      await obj.push();
    }
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
   * Load ALL objects into memory at startup
   * This ensures synchronous property access via getSync() always works
   * In-memory state is the single source of truth; DB is only for persistence.
   */
  async loadAll(): Promise<number> {
    console.log('[ObjectManager] Loading all objects into memory...');
    const start = Date.now();

    // Ensure core infrastructure objects are loaded first (special logic)
    await this.load(-1); // $.nothing
    await this.load(0);  // $ (ObjectManager)

    const allObjects = await this.db.listAll(false); // exclude recycled
    let count = 0;

    for (const obj of allObjects) {
      // Skip if already cached
      if (this.cache.getObject(obj._id)) {
        continue;
      }

      // Wrap in RuntimeObject and cache
      const runtime = new RuntimeObjectImpl(obj, this);
      const proxy = runtime.getProxy();
      this.cache.setObject(obj._id, proxy);
      count++;
    }

    const elapsed = Date.now() - start;
    console.log(`[ObjectManager] Loaded ${count} objects in ${elapsed}ms (${allObjects.length} total in DB)`);

    return count;
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
   * Query Claude AI with optional session resumption
   * Provides full MCP tool access to the AI
   *
   * @param systemPrompt - System prompt defining AI behavior
   * @param prompt - User prompt / query
   * @param session - Optional session ID to resume conversation
   * @param options - Optional configuration including additional MCP servers
   * @returns { response: string, session: string }
   *
   * @example
   * // First call - new session
   * const { response, session } = await $query(
   *   "You are a guard. Be suspicious.",
   *   "A stranger approaches."
   * );
   * self.agentSession = session;
   *
   * // Later - resume session
   * const result = await $query(systemPrompt, input, self.agentSession);
   */
  async query(
    systemPrompt: string,
    prompt: string,
    session?: string,
    options?: { additionalMcpServers?: Record<string, { type: string; url: string }> }
  ): Promise<{ response: string; session: string }> {
    console.log('[ObjectManager.$query] Importing SDK...');
    // Dynamic import to avoid loading SDK at startup
    const { query: sdkQuery } = await import('@anthropic-ai/claude-agent-sdk');
    console.log('[ObjectManager.$query] SDK imported successfully');

    const mcpServers: Record<string, { type: string; url: string }> = {
      'malice-moo': {
        type: 'http',
        url: 'http://localhost:3001/mcp',
      },
    };

    if (options?.additionalMcpServers) {
      Object.assign(mcpServers, options.additionalMcpServers);
    }
    console.log('[ObjectManager.$query] MCP servers:', Object.keys(mcpServers).join(', '));

    const queryOptions: Record<string, unknown> = {
      systemPrompt,
      mcpServers,
      allowedTools: ['*'],
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      cwd: process.env.HOME || '/home/node',
      persistSession: true,
    };

    if (session) {
      queryOptions.resume = session;
      console.log('[ObjectManager.$query] Resuming session:', session.substring(0, 20) + '...');
    }

    let response = '';
    let newSessionId: string | null = null;

    console.log('[ObjectManager.$query] Calling sdkQuery with prompt length:', prompt.length);
    try {
      for await (const message of sdkQuery({ prompt, options: queryOptions })) {
        const msg = message as Record<string, unknown>;
        console.log('[ObjectManager.$query] Message type:', msg.type, (msg as any).subtype || '');

        // Capture session ID from init message
        if (msg.type === 'system' && (msg as any).subtype === 'init') {
          newSessionId = (msg as any).session_id || (msg as any).data?.session_id;
          console.log('[ObjectManager.$query] Got session:', newSessionId?.substring(0, 20) + '...');
        }

        // Capture text responses from assistant messages
        if (msg.type === 'assistant' && (msg as any).message?.content) {
          for (const block of (msg as any).message.content) {
            if (block.type === 'text') {
              response += block.text;
            }
          }
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[ObjectManager.$query] Error:', error?.message || err);
      throw err;
    }

    console.log('[ObjectManager.$query] Completed, response length:', response.length);
    return {
      response,
      session: newSessionId || session || '',
    };
  }

  /**
   * Emit a game event to the game_events collection
   * Used by $.events.emit() for NPC agent service and other external consumers
   * @param event - Event object with type, data, timestamp
   * @returns The inserted event's _id as string
   */
  async _emitGameEvent(event: {
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
    processed: boolean;
  }): Promise<string> {
    const collection = this.db.getCollection('game_events');
    // Sanitize event data to prevent circular reference errors
    const sanitizedEvent = sanitizeForMongo(event, new WeakSet(), `event.${event.type}`);
    const result = await collection.insertOne({
      ...sanitizedEvent,
      createdAt: new Date(), // For TTL index
    });
    return result.insertedId.toString();
  }

}
