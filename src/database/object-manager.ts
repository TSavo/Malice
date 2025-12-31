import * as bcrypt from 'bcrypt';
import { EventEmitter } from 'events';
import type {
  CreateObjectParams,
  GameObject,
  ObjId,
  PropertyValue,
  RuntimeObject,
} from '../../types/object';
import type { MCPTelnetClient } from '../mcp/telnet-client';
import { getLoggerFacade, RESERVED_ALIASES } from './logger-facade';
import { ObjectCache } from './object-cache';
import type { ObjectDatabase } from './object-db';
import { RuntimeObjectImpl } from './runtime-object';

/**
 * Event types emitted by ObjectManager for change notifications
 */
export type ObjectChangeEvent =
  | { type: 'method.changed'; objectId: number; name: string }
  | { type: 'method.deleted'; objectId: number; name: string }
  | { type: 'property.changed'; objectId: number; name: string }
  | { type: 'property.deleted'; objectId: number; name: string }
  | { type: 'object.created'; objectId: number }
  | { type: 'object.changed'; objectId: number };

/**
 * Selector for property predicates in fluent query builder
 */
class PropertySelector {
  private negate = false;

  constructor(
    private query: QueryBuilder,
    private propName: string,
  ) {}

  /** Negate the next predicate */
  not(): this {
    this.negate = true;
    return this;
  }

  /** Property equals value */
  equals(value: unknown): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const objValue = obj.get(propName);
      // Handle RuntimeObject comparison (compare by ID)
      let result: boolean;
      if (
        value &&
        typeof value === 'object' &&
        'id' in value &&
        objValue &&
        typeof objValue === 'object' &&
        'id' in objValue
      ) {
        result = (value as RuntimeObject).id === (objValue as RuntimeObject).id;
      } else {
        result = objValue === value;
      }
      return negate ? !result : result;
    });
  }

  /** Property exists (is not undefined) */
  exists(): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const result = obj.get(propName) !== undefined;
      return negate ? !result : result;
    });
  }

  /** Property contains text (string) or value (array). Use '*' to search all string properties. */
  contains(text: string): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    const lowerText = text.toLowerCase();
    return this.query.addPredicate((obj) => {
      let result = false;
      if (propName === '*') {
        // Search all string properties
        const ownProps = obj.getOwnProperties();
        for (const [, val] of Object.entries(ownProps)) {
          if (
            typeof val === 'string' &&
            val.toLowerCase().includes(lowerText)
          ) {
            result = true;
            break;
          }
        }
      } else {
        const val = obj.get(propName);
        if (typeof val === 'string') {
          result = val.toLowerCase().includes(lowerText);
        } else if (Array.isArray(val)) {
          result = val.includes(text);
        }
      }
      return negate ? !result : result;
    });
  }

  /** Property greater than value */
  gt(n: number): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const val = obj.get(propName);
      const result = typeof val === 'number' && val > n;
      return negate ? !result : result;
    });
  }

  /** Property greater than or equal to value */
  gte(n: number): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const val = obj.get(propName);
      const result = typeof val === 'number' && val >= n;
      return negate ? !result : result;
    });
  }

  /** Property less than value */
  lt(n: number): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const val = obj.get(propName);
      const result = typeof val === 'number' && val < n;
      return negate ? !result : result;
    });
  }

  /** Property less than or equal to value */
  lte(n: number): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const val = obj.get(propName);
      const result = typeof val === 'number' && val <= n;
      return negate ? !result : result;
    });
  }

  /** Property value is in the given set */
  in(values: unknown[]): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const val = obj.get(propName);
      const result = values.includes(val);
      return negate ? !result : result;
    });
  }

  /** Property matches regex pattern */
  matches(pattern: string | RegExp): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.query.addPredicate((obj) => {
      const val = obj.get(propName);
      const result = typeof val === 'string' && regex.test(val);
      return negate ? !result : result;
    });
  }

  /** Property starts with text */
  startsWith(text: string): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const val = obj.get(propName);
      const result = typeof val === 'string' && val.startsWith(text);
      return negate ? !result : result;
    });
  }

  /** Property ends with text */
  endsWith(text: string): QueryBuilder {
    const propName = this.propName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const val = obj.get(propName);
      const result = typeof val === 'string' && val.endsWith(text);
      return negate ? !result : result;
    });
  }
}

/**
 * Selector for method predicates in fluent query builder
 */
class MethodSelector {
  private negate = false;

  constructor(
    private query: QueryBuilder,
    private methodName: string,
  ) {}

  /** Negate the next predicate */
  not(): this {
    this.negate = true;
    return this;
  }

  /** Method exists (walks inheritance chain) */
  exists(): QueryBuilder {
    const methodName = this.methodName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      let found = false;
      let current: RuntimeObject | null = obj;
      while (current) {
        const ownMethods = current.getOwnMethods();
        if (ownMethods[methodName]) {
          found = true;
          break;
        }
        current = current.getParent();
      }
      return negate ? !found : found;
    });
  }

  /** Method exists locally (not inherited) */
  existsLocal(): QueryBuilder {
    const methodName = this.methodName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const ownMethods = obj.getOwnMethods();
      const result = !!ownMethods[methodName];
      return negate ? !result : result;
    });
  }

  /** Method code contains text. Use '*' to search all methods. */
  contains(text: string): QueryBuilder {
    const methodName = this.methodName;
    const negate = this.negate;
    return this.query.addPredicate((obj) => {
      const ownMethods = obj.getOwnMethods();
      let found = false;

      if (methodName === '*') {
        // Search all methods
        for (const method of Object.values(ownMethods)) {
          const code = typeof method === 'string' ? method : method?.code;
          if (typeof code === 'string' && code.includes(text)) {
            found = true;
            break;
          }
        }
      } else {
        // Search specific method
        const method = ownMethods[methodName];
        if (method) {
          const code = typeof method === 'string' ? method : method?.code;
          if (typeof code === 'string' && code.includes(text)) {
            found = true;
          }
        }
      }
      return negate ? !found : found;
    });
  }

  /** Method code matches regex pattern. Use '*' to search all methods. */
  matches(pattern: string | RegExp): QueryBuilder {
    const methodName = this.methodName;
    const negate = this.negate;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.query.addPredicate((obj) => {
      const ownMethods = obj.getOwnMethods();
      let found = false;

      if (methodName === '*') {
        for (const method of Object.values(ownMethods)) {
          const code = typeof method === 'string' ? method : method?.code;
          if (typeof code === 'string' && regex.test(code)) {
            found = true;
            break;
          }
        }
      } else {
        const method = ownMethods[methodName];
        if (method) {
          const code = typeof method === 'string' ? method : method?.code;
          if (typeof code === 'string' && regex.test(code)) {
            found = true;
          }
        }
      }
      return negate ? !found : found;
    });
  }
}

/**
 * Fluent query builder for MOO objects
 *
 * @example
 * // Find outdoor rooms
 * $query().prop('outdoor').equals(true).all()
 *
 * // Find weapons OR high-damage items
 * $query().parent($weapon).or().prop('damage').gt(10).all()
 *
 * // Find non-recycled items
 * $query().prop('recycled').not().equals(true).all()
 *
 * // Find objects without tick method
 * $query().method('tick').not().exists().all()
 *
 * // Find objects where any method uses $recycler
 * $query().method('*').contains('$recycler').all()
 *
 * // Find objects where any property contains 'secret'
 * $query().prop('*').contains('secret').all()
 *
 * // With .and() for readability
 * $query().prop('x').equals(1).and().prop('y').equals(2).all()
 *
 * // Complex: (outdoor AND z>0) OR (indoor AND z<0)
 * $query()
 *   .prop('outdoor').equals(true).and().prop('z').gt(0)
 *   .or()
 *   .prop('outdoor').equals(false).and().prop('z').lt(0)
 *   .all()
 */
export class QueryBuilder {
  private groups: Array<Array<(obj: RuntimeObject) => boolean>> = [[]];
  private _limit?: number;
  private _parent?: RuntimeObject | number;
  private _inheritedFrom?: RuntimeObject | number;

  constructor(private cache: ObjectCache) {}

  /** Start a property selector. Use '*' to search all properties. */
  prop(name: string): PropertySelector {
    return new PropertySelector(this, name);
  }

  /** Start a method selector. Use '*' to search all methods. */
  method(name: string): MethodSelector {
    return new MethodSelector(this, name);
  }

  /** Filter by parent prototype */
  parent(proto: RuntimeObject | number): this {
    this._parent = proto;
    return this;
  }

  /** Filter by ancestor in prototype chain */
  inheritedFrom(proto: RuntimeObject | number): this {
    this._inheritedFrom = proto;
    return this;
  }

  /** Start a new OR group. Predicates within a group are ANDed; groups are ORed. */
  or(): this {
    this.groups.push([]);
    return this;
  }

  /** Noop for readability - predicates are ANDed by default */
  and(): this {
    return this;
  }

  /** Limit number of results */
  limit(n: number): this {
    this._limit = n;
    return this;
  }

  /** Add a predicate to current group (internal use by selectors) */
  addPredicate(pred: (obj: RuntimeObject) => boolean): this {
    this.groups[this.groups.length - 1].push(pred);
    return this;
  }

  /** Execute query and return all matching objects */
  all(): RuntimeObject[] {
    return this.execute();
  }

  /** Execute query and return first matching object (or null) */
  first(): RuntimeObject | null {
    const results = this.execute(1);
    return results[0] ?? null;
  }

  /** Execute query and return count of matching objects */
  count(): number {
    return this.execute().length;
  }

  /** Execute query and return unique parents of all matching objects */
  parents(): RuntimeObject[] {
    const results = this.execute();
    const parentMap = new Map<number, RuntimeObject>();
    for (const obj of results) {
      const parent = obj.getParent();
      if (parent && !parentMap.has(parent.id)) {
        parentMap.set(parent.id, parent);
      }
    }
    return Array.from(parentMap.values());
  }

  /** Execute query and return all direct children of matching objects */
  children(): RuntimeObject[] {
    const results = this.execute();
    const parentIds = new Set(results.map((obj) => obj.id));
    const children: RuntimeObject[] = [];

    for (const obj of this.cache.values()) {
      const parent = obj.getParent();
      if (parent && parentIds.has(parent.id)) {
        children.push(obj);
      }
    }

    return children;
  }

  /** Execute query and return all IDs of matching objects */
  ids(): number[] {
    return this.execute().map((obj) => obj.id);
  }

  /** Execute query and return names of matching objects */
  names(): string[] {
    return this.execute()
      .map((obj) => obj.get('name'))
      .filter((n): n is string => typeof n === 'string');
  }

  /** Check if object matches parent constraint */
  private matchesParent(obj: RuntimeObject): boolean {
    if (this._parent === undefined) return true;
    const parentId =
      typeof this._parent === 'number' ? this._parent : this._parent.id;
    const objParent = obj.getParent();
    return objParent !== null && objParent.id === parentId;
  }

  /** Check if object matches inheritedFrom constraint */
  private matchesInherited(obj: RuntimeObject): boolean {
    if (this._inheritedFrom === undefined) return true;
    const inheritedFromId =
      typeof this._inheritedFrom === 'number'
        ? this._inheritedFrom
        : this._inheritedFrom.id;
    let current: RuntimeObject | null = obj;
    while (current) {
      if (current.id === inheritedFromId) return true;
      current = current.getParent();
    }
    return false;
  }

  /** Execute the query */
  private execute(overrideLimit?: number): RuntimeObject[] {
    const results: RuntimeObject[] = [];
    const limit = overrideLimit ?? this._limit;

    // Check if we have any predicates in any group
    const hasPredicates = this.groups.some((g) => g.length > 0);

    for (const obj of this.cache.values()) {
      // Always check parent constraint
      if (!this.matchesParent(obj)) continue;

      // Always check inheritedFrom constraint
      if (!this.matchesInherited(obj)) continue;

      // Check OR groups: any group must match
      // Each group: all predicates must pass (AND within group)
      let groupsMatch = true;
      if (hasPredicates) {
        groupsMatch = this.groups.some(
          (group) => group.length === 0 || group.every((pred) => pred(obj)),
        );
      }

      if (groupsMatch) {
        results.push(obj);
        if (limit && results.length >= limit) break;
      }
    }

    return results;
  }
}

/**
 * Sanitize an object for MongoDB storage, removing circular references
 */
function sanitizeForMongo(
  value: any,
  seen: WeakSet<object> = new WeakSet(),
  path: string = 'root',
): any {
  if (value === null || value === undefined) {
    return value;
  }

  const type = typeof value;
  if (type !== 'object') {
    return value;
  }

  // Check for circular reference
  if (seen.has(value)) {
    console.error(
      `[ObjectManager] Circular reference detected at ${path}, replacing with null`,
    );
    return null;
  }
  seen.add(value);

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item, i) =>
      sanitizeForMongo(item, seen, `${path}[${i}]`),
    );
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
  private telnetClient?: MCPTelnetClient; // For $.session native methods
  private gameCoordinator?: any; // For $world methods (getAuthenticatedConnections)

  // Track in-flight update operations (fire-and-forget writes from RuntimeObject)
  private pendingUpdateOperations = new Set<Promise<void>>();

  // Event emitter for change notifications (used by DevTools)
  private changeEmitter = new EventEmitter();

  constructor(db: ObjectDatabase) {
    this.db = db;
    this.cache = new ObjectCache();

    // Return a Proxy to enable dynamic property access
    return new Proxy(this, {
      get: (target, prop: string | symbol) => {
        if (
          typeof prop === 'string' &&
          prop.startsWith('$') &&
          prop.length > 1
        ) {
          const id = parseInt(prop.slice(1), 10);
          if (!Number.isNaN(id)) {
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
        const internalProps = [
          'db',
          'cache',
          'aliases',
          'pendingUpdateOperations',
        ];
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
      },
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
        proxy.set(
          'description',
          'The null object reference - immutable, no properties or methods',
        );

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
        proxy.set(
          'description',
          'The root system object - provides object management and global aliases',
        );
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
    console.warn(
      `[ObjectManager] Cache miss for #${id} - loading from database`,
    );

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
   * All mutations go through RuntimeObject for consistent event emission
   */
  async create(params: CreateObjectParams): Promise<RuntimeObject> {
    const id = await this.db.getNextId();

    // Validate parent is a RuntimeObject, not a number
    if (typeof params.parent === 'number') {
      throw new Error(
        'Parent must be a RuntimeObject, not a number. Use manager.load(id) to get the parent object.',
      );
    }
    if (!params.parent || typeof params.parent.id !== 'number') {
      throw new Error(
        'Parent must be a RuntimeObject with a valid id property.',
      );
    }

    // Extract parent ID from RuntimeObject and store as ObjRefValue
    const parentId = params.parent.id as ObjId;

    // Create bare object with just parent - properties/methods set via RuntimeObject
    const obj = await this.db.create({
      _id: id,
      parent: { type: 'objref', value: parentId },
      properties: {},
      methods: {},
    });

    const runtime = new RuntimeObjectImpl(obj, this);
    const proxy = runtime.getProxy();
    this.cache.setObject(id, proxy);

    // Set properties via RuntimeObject (emits property.changed events)
    if (params.properties) {
      for (const [key, value] of Object.entries(params.properties)) {
        proxy.set(key, value);
      }
    }

    // Set methods via RuntimeObject (emits method.changed events)
    if (params.methods) {
      for (const [name, method] of Object.entries(params.methods)) {
        if (typeof method === 'string') {
          proxy.setMethod(name, method);
        } else {
          proxy.setMethod(name, method.code, {
            callable: method.callable,
            aliases: method.aliases,
            help: method.help,
          });
        }
      }
    }

    // Emit object.created after all properties/methods are set
    this.emitChange({
      type: 'object.created',
      objectId: id,
    });

    return proxy;
  }

  /**
   * Update object in database
   * @param invalidateCache - Whether to invalidate transient caches (methods/parents)
   */
  async update(
    id: ObjId,
    updates: Partial<Omit<GameObject, '_id' | 'created'>>,
    invalidateCache = true,
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
   * Atomically set a single method on an object
   * Uses path-based $set to avoid race conditions with concurrent method updates
   */
  async setMethod(
    obj: RuntimeObject,
    name: string,
    methodDef: {
      code: string;
      callable?: boolean;
      aliases?: string[];
      help?: string;
    },
  ): Promise<void> {
    const updatePromise = this.db.setMethod(obj.id, name, methodDef);
    this.pendingUpdateOperations.add(updatePromise);
    try {
      await updatePromise;
    } finally {
      this.pendingUpdateOperations.delete(updatePromise);
    }
    this.invalidateCompiledMethod(obj.id, name);
  }

  /**
   * Atomically set a single property on an object
   * Uses path-based $set to avoid race conditions with concurrent property updates
   */
  async setProperty(
    obj: RuntimeObject,
    name: string,
    value: unknown,
  ): Promise<void> {
    const updatePromise = this.db.setProperty(obj.id, name, value);
    this.pendingUpdateOperations.add(updatePromise);
    try {
      await updatePromise;
    } finally {
      this.pendingUpdateOperations.delete(updatePromise);
    }
  }

  /**
   * Atomically push a value to an array property
   * Uses MongoDB $push to avoid race conditions with concurrent array modifications
   */
  async pushToArray(
    obj: RuntimeObject,
    name: string,
    value: unknown,
  ): Promise<void> {
    const updatePromise = this.db.pushToArray(obj.id, name, value);
    this.pendingUpdateOperations.add(updatePromise);
    try {
      await updatePromise;
    } finally {
      this.pendingUpdateOperations.delete(updatePromise);
    }
  }

  /**
   * Atomically pop (remove last element) from an array property
   */
  async popFromArray(obj: RuntimeObject, name: string): Promise<void> {
    const updatePromise = this.db.popFromArray(obj.id, name);
    this.pendingUpdateOperations.add(updatePromise);
    try {
      await updatePromise;
    } finally {
      this.pendingUpdateOperations.delete(updatePromise);
    }
  }

  /**
   * Atomically shift (remove first element) from an array property
   */
  async shiftFromArray(obj: RuntimeObject, name: string): Promise<void> {
    const updatePromise = this.db.shiftFromArray(obj.id, name);
    this.pendingUpdateOperations.add(updatePromise);
    try {
      await updatePromise;
    } finally {
      this.pendingUpdateOperations.delete(updatePromise);
    }
  }

  /**
   * Atomically remove a value from an array by matching
   */
  async pullFromArray(
    obj: RuntimeObject,
    name: string,
    value: unknown,
  ): Promise<void> {
    const updatePromise = this.db.pullFromArray(obj.id, name, value);
    this.pendingUpdateOperations.add(updatePromise);
    try {
      await updatePromise;
    } finally {
      this.pendingUpdateOperations.delete(updatePromise);
    }
  }

  /**
   * Find object by property value
   */
  async findByProperty(
    prop: string,
    value: PropertyValue,
  ): Promise<RuntimeObject[]> {
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
   * Create a fluent query builder for MOO objects
   *
   * @returns QueryBuilder for fluent chaining
   *
   * @example
   * // Property selectors
   * $query().prop('outdoor').equals(true).all()
   * $query().prop('z').gt(0).all()
   * $query().prop('name').contains('smith').all()
   * $query().prop('*').contains('secret').all()  // search all properties
   *
   * // Method selectors
   * $query().method('tick').exists().all()
   * $query().method('*').contains('$recycler').all()  // search all methods
   *
   * // Negation
   * $query().prop('recycled').not().equals(true).all()
   * $query().method('tick').not().exists().all()
   *
   * // OR groups
   * $query().parent($weapon).or().prop('damage').gt(10).all()
   *
   * // AND for readability (noop)
   * $query().prop('x').equals(1).and().prop('y').equals(2).all()
   */
  query(): QueryBuilder {
    return new QueryBuilder(this.cache);
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
   * Get all object IDs from the cache
   * Returns an array of all object IDs (used by MOO code for iteration)
   */
  getAllIds(): ObjId[] {
    return this.cache.getAllIds();
  }

  /**
   * Wait for all in-flight RuntimeObject auto-persist writes to complete.
   *
   * This is primarily intended for tests, to avoid disconnecting Mongo while
   * fire-and-forget writes are still pending.
   */

  async flushWrites(): Promise<void> {
    // First, flush all object write queues
    const allQueues: Promise<void>[] = [];
    for (const obj of this.cache.values()) {
      allQueues.push(obj.flushQueue());
    }
    await Promise.allSettled(allQueues);

    // Then drain pending operations in waves in case awaiting one write triggers others.
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
  setCompiledMethod(
    objId: ObjId,
    methodName: string,
    compiledCode: string,
  ): void {
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
    await this.load(0); // $ (ObjectManager)

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
    console.log(
      `[ObjectManager] Loaded ${count} objects in ${elapsed}ms (${allObjects.length} total in DB)`,
    );

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
   * const { response, session } = await $aiQuery(
   *   "You are a guard. Be suspicious.",
   *   "A stranger approaches."
   * );
   * self.agentSession = session;
   *
   * // Later - resume session
   * const result = await $aiQuery(systemPrompt, input, self.agentSession);
   */
  async aiQuery(
    systemPrompt: string,
    prompt: string,
    session?: string,
    options?: {
      additionalMcpServers?: Record<string, { type: string; url: string }>;
    },
  ): Promise<{ response: string; session: string }> {
    console.log('[ObjectManager.$aiQuery] Importing SDK...');
    // Dynamic import to avoid loading SDK at startup
    const { query: sdkQuery } = await import('@anthropic-ai/claude-agent-sdk');
    console.log('[ObjectManager.$aiQuery] SDK imported successfully');

    const mcpServers: Record<string, { type: string; url: string }> = {
      'malice-moo': {
        type: 'http',
        url: 'http://localhost:3010/mcp',
      },
    };

    if (options?.additionalMcpServers) {
      Object.assign(mcpServers, options.additionalMcpServers);
    }
    console.log(
      '[ObjectManager.$aiQuery] MCP servers:',
      Object.keys(mcpServers).join(', '),
    );

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
      console.log(
        '[ObjectManager.$aiQuery] Resuming session:',
        `${session.substring(0, 20)}...`,
      );
    }

    let response = '';
    let newSessionId: string | null = null;

    console.log(
      '[ObjectManager.$aiQuery] Calling sdkQuery with prompt length:',
      prompt.length,
    );
    try {
      for await (const message of sdkQuery({ prompt, options: queryOptions })) {
        const msg = message as Record<string, unknown>;
        console.log(
          '[ObjectManager.$aiQuery] Message type:',
          msg.type,
          (msg as any).subtype || '',
        );

        // Capture session ID from init message
        if (msg.type === 'system' && (msg as any).subtype === 'init') {
          newSessionId =
            (msg as any).session_id || (msg as any).data?.session_id;
          console.log(
            '[ObjectManager.$aiQuery] Got session:',
            `${newSessionId?.substring(0, 20)}...`,
          );
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
      console.error('[ObjectManager.$aiQuery] Error:', error?.message || err);
      throw err;
    }

    console.log(
      '[ObjectManager.$aiQuery] Completed, response length:',
      response.length,
    );
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
    const sanitizedEvent = sanitizeForMongo(
      event,
      new WeakSet(),
      `event.${event.type}`,
    );
    const result = await collection.insertOne({
      ...sanitizedEvent,
      createdAt: new Date(), // For TTL index
    });
    return result.insertedId.toString();
  }

  /**
   * Set the telnet client for session management
   * Called by index.ts during server startup
   */
  setTelnetClient(client: MCPTelnetClient): void {
    this.telnetClient = client;
  }

  /**
   * Set the game coordinator for accessing connections
   * Called by index.ts during server startup
   */
  setGameCoordinator(coordinator: any): void {
    this.gameCoordinator = coordinator;
  }

  /**
   * Get game coordinator
   * Used by $world MOO object to access authenticated connections
   */
  getGameCoordinator(): any {
    return this.gameCoordinator;
  }

  /**
   * Get telnet API object
   * Exposed as $.telnet in MOO code
   */
  get telnet() {
    const client = this.telnetClient;
    if (!client) throw new Error('Telnet client not initialized');

    return {
      connect: async () => {
        const result = await client.connect(undefined);
        return {
          sessionId: result.sessionId,
          output: result.output,
          message:
            'Connected to MOO. Use this sessionId for subsequent commands.',
        };
      },

      send: async (sessionId: string, command: string) => {
        if (!sessionId) throw new Error('sessionId required');
        if (!command) throw new Error('command required');
        return await client.send(sessionId, command);
      },

      getLog: async (sessionId: string, lines?: number) => {
        if (!sessionId) throw new Error('sessionId required');
        const log = client.getLog(sessionId, lines);
        const status = client.getStatus(sessionId);
        return { ...status, log };
      },

      list: async () => {
        const sessions = client.listSessions();
        return { sessions, count: sessions.length };
      },

      close: async (sessionId: string) => {
        if (!sessionId) throw new Error('sessionId required');
        client.close(sessionId);
        return { message: `Session ${sessionId} closed` };
      },

      getStatus: async (sessionId: string) => {
        if (!sessionId) throw new Error('sessionId required');
        return client.getStatus(sessionId);
      },
    };
  }

  /**
   * Emit a change event (for DevTools sync)
   * Called by RuntimeObject when methods/properties change
   */
  emitChange(event: ObjectChangeEvent): void {
    this.changeEmitter.emit('change', event);
  }

  /**
   * Subscribe to change events
   * Used by DevTools server to broadcast notifications
   */
  onObjectChange(listener: (event: ObjectChangeEvent) => void): () => void {
    this.changeEmitter.on('change', listener);
    return () => this.changeEmitter.off('change', listener);
  }
}
