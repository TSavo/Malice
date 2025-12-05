import { ObjectDatabase } from './object-db.js';
import { RuntimeObjectImpl } from './runtime-object.js';
import type {
  GameObject,
  ObjId,
  RuntimeObject,
  CreateObjectParams,
  PropertyValue,
} from '../../types/object.js';

/**
 * Object manager - coordinates ObjectDatabase and RuntimeObjects
 * Provides caching and high-level object operations
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
  private cache = new Map<ObjId, RuntimeObject>();
  private aliases = new Map<string, RuntimeObject>();
  public readonly db: ObjectDatabase; // Expose for DevTools direct access

  constructor(db: ObjectDatabase) {
    this.db = db;

    // Watch for changes from other servers/processes
    this.setupChangeStreamWatcher();
    // Return a Proxy to enable dynamic property access
    return new Proxy(this, {
      get: (target, prop: string | symbol) => {
        if (typeof prop === 'symbol' || prop in target) {
          return (target as any)[prop];
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
   */
  async load(id: ObjId): Promise<RuntimeObject | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // Load from database
    const obj = await this.db.get(id);
    if (!obj) return null;

    // Wrap in RuntimeObject and cache
    const runtime = new RuntimeObjectImpl(obj, this);
    this.cache.set(id, runtime);
    return runtime;
  }

  /**
   * Synchronous cache-only get (for inheritance chain walking)
   */
  getSync(id: ObjId): RuntimeObject | null {
    return this.cache.get(id) || null;
  }

  /**
   * Create new object
   */
  async create(params: CreateObjectParams): Promise<RuntimeObject> {
    const id = await this.db.getNextId();

    const obj = await this.db.create({
      _id: id,
      parent: params.parent,
      properties: params.properties || {},
      methods: params.methods || {},
    });

    const runtime = new RuntimeObjectImpl(obj, this);
    this.cache.set(id, runtime);
    return runtime;
  }

  /**
   * Update object in database
   */
  async update(
    id: ObjId,
    updates: Partial<Omit<GameObject, '_id' | 'created'>>
  ): Promise<void> {
    await this.db.update(id, updates);

    // Invalidate cache entry to force reload
    this.cache.delete(id);
  }

  /**
   * Delete object
   */
  async delete(id: ObjId): Promise<void> {
    await this.db.delete(id);
    this.cache.delete(id);
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
    return this.cache.size;
  }

  /**
   * Preload objects into cache
   */
  async preload(ids: ObjId[]): Promise<void> {
    await Promise.all(ids.map((id) => this.load(id)));
  }

  /**
   * Register an alias for an object by ID
   * Loads the object and registers it with the given alias name
   * Used during bootstrap to set up core system aliases ($.system, $.authManager, etc.)
   */
  async registerAliasById(name: string, id: ObjId): Promise<void> {
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
    this.aliases.set(name, obj);
  }

  /**
   * Remove an alias
   */
  removeAlias(name: string): void {
    this.aliases.delete(name);
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

    // Remove from cache
    this.cache.delete(id);

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
   */
  invalidate(id: ObjId): void {
    if (this.cache.has(id)) {
      console.log(`[ObjectManager] Invalidating cache for object #${id}`);
      this.cache.delete(id);
    }
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

        // Only log if we actually had it cached
        if (this.cache.has(id)) {
          console.log(
            `[ObjectManager] External change detected for object #${id} - invalidating cache`
          );
          this.cache.delete(id);
        }
      } else if (operationType === 'delete') {
        const id = change.documentKey._id as ObjId;
        this.cache.delete(id);

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
