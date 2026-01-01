import { type Collection, type Db, MongoClient } from 'mongodb';
import type { GameObject, ObjId, TypeObject } from '../../types/object';

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
      `[ObjectDB] Circular reference detected at ${path}, replacing with null`,
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
 * MongoDB persistence layer for game objects and types
 *
 * Two collections:
 * - types: Named definitions (TypeObject) - keyed by string name
 * - objects: Numbered instances (GameObject) - keyed by numeric ID
 */
export class ObjectDatabase {
  private client!: MongoClient;
  private db!: Db;
  private objects!: Collection<GameObject>;
  private types!: Collection<TypeObject>;
  private connected = false;

  constructor(
    private uri: string,
    private dbName: string = 'malice',
  ) {}

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    this.client = new MongoClient(this.uri);
    await this.client.connect();

    this.db = this.client.db(this.dbName);
    this.objects = this.db.collection<GameObject>('objects');
    this.types = this.db.collection<TypeObject>('types');

    // Ensure indexes (_id is unique by default, no need to specify)
    await this.objects.createIndex({ 'parent.id': 1 });
    // Types: index on parent.name for type inheritance queries
    await this.types.createIndex({ 'parent.name': 1 });

    this.connected = true;
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.client.close();
    this.connected = false;
    console.log('[ObjectDatabase] Disconnected from MongoDB');
  }

  /**
   * Get object by ID
   */
  async get(id: ObjId): Promise<GameObject | null> {
    return await this.objects.findOne({ _id: id });
  }

  /**
   * Create new object
   * If reusing a recycled ID, replaces the recycled object
   */
  async create(
    obj: Omit<GameObject, 'created' | 'modified'>,
  ): Promise<GameObject> {
    const now = new Date();
    // Sanitize the object to prevent circular reference errors
    const sanitizedObj = sanitizeForMongo(
      obj,
      new WeakSet(),
      `create#${obj._id}`,
    ) as typeof obj;

    // Check if we're reusing a recycled object
    const existing = await this.objects.findOne({
      _id: sanitizedObj._id,
      recycled: true,
    });

    if (existing) {
      // Replace recycled object (keep original creation date)
      const newObj: GameObject = {
        ...sanitizedObj,
        created: existing.created,
        modified: now,
        recycled: false, // Clear recycled flag
      };

      await this.objects.replaceOne({ _id: sanitizedObj._id }, newObj);
      return newObj;
    } else {
      // New object
      const newObj: GameObject = {
        ...sanitizedObj,
        created: now,
        modified: now,
      };

      await this.objects.insertOne(newObj);
      return newObj;
    }
  }

  /**
   * Update existing object or type
   */
  async update(
    id: ObjId,
    updates: Partial<Omit<GameObject, '_id' | 'created'>>,
  ): Promise<void> {
    // Sanitize updates to prevent circular reference errors
    const sanitized = sanitizeForMongo(updates, new WeakSet(), `#${id}`);

    // Debug: try JSON.stringify to detect circular refs before BSON does
    try {
      JSON.stringify(sanitized);
    } catch (_jsonErr) {
      console.error(
        `[ObjectDB] JSON.stringify failed for #${id}, trying to find circular ref`,
      );
      console.error(
        `[ObjectDB] Updates keys: ${Object.keys(updates).join(', ')}`,
      );
      // Try to identify the problematic key
      for (const key of Object.keys(sanitized)) {
        try {
          JSON.stringify((sanitized as any)[key]);
        } catch {
          console.error(`[ObjectDB] Circular reference in key: ${key}`);
        }
      }
    }

    // Use types collection for string IDs, objects collection for numbers
    if (typeof id === 'string') {
      await this.types.updateOne(
        { _id: id },
        { $set: { ...sanitized, modified: new Date() } },
      );
    } else {
      await this.objects.updateOne(
        { _id: id },
        { $set: { ...sanitized, modified: new Date() } },
      );
    }
  }

  /**
   * Atomically set a single method on an object or type
   * Uses path-based $set to avoid race conditions with concurrent method updates
   */
  async setMethod(
    id: ObjId,
    name: string,
    methodDef: {
      code: string;
      callable?: boolean;
      aliases?: string[];
      help?: string;
    },
  ): Promise<void> {
    const sanitized = sanitizeForMongo(
      methodDef,
      new WeakSet(),
      `#${id}.methods.${name}`,
    );

    // Use types collection for string IDs, objects collection for numbers
    const update = {
      $set: {
        [`methods.${name}`]: sanitized,
        modified: new Date(),
      },
    };
    if (typeof id === 'string') {
      await this.types.updateOne({ _id: id }, update);
    } else {
      await this.objects.updateOne({ _id: id }, update);
    }
  }

  /**
   * Atomically set a single property on an object or type
   * Uses path-based $set to avoid race conditions with concurrent property updates
   */
  async setProperty(id: ObjId, name: string, value: unknown): Promise<void> {
    const sanitized = sanitizeForMongo(
      value,
      new WeakSet(),
      `#${id}.properties.${name}`,
    );

    // Use types collection for string IDs, objects collection for numbers
    const update = {
      $set: {
        [`properties.${name}`]: sanitized,
        modified: new Date(),
      },
    };
    if (typeof id === 'string') {
      await this.types.updateOne({ _id: id }, update);
    } else {
      await this.objects.updateOne({ _id: id }, update);
    }
  }

  /**
   * Atomically push a value to an array property
   * Uses MongoDB $push to avoid race conditions with concurrent array modifications
   */
  async pushToArray(id: ObjId, name: string, value: unknown): Promise<void> {
    const sanitized = sanitizeForMongo(
      value,
      new WeakSet(),
      `#${id}.properties.${name}[]`,
    );

    // Use types collection for string IDs, objects collection for numbers
    const update = {
      $push: {
        [`properties.${name}.value`]: sanitized,
      },
      $set: {
        modified: new Date(),
      },
    };
    if (typeof id === 'string') {
      await this.types.updateOne({ _id: id }, update);
    } else {
      await this.objects.updateOne({ _id: id }, update);
    }
  }

  /**
   * Atomically pop (remove last element) from an array property
   * Uses MongoDB $pop to avoid race conditions
   */
  async popFromArray(id: ObjId, name: string): Promise<void> {
    const update = {
      $pop: {
        [`properties.${name}.value`]: 1 as const, // 1 = last, -1 = first
      },
      $set: {
        modified: new Date(),
      },
    };
    if (typeof id === 'string') {
      await this.types.updateOne({ _id: id }, update);
    } else {
      await this.objects.updateOne({ _id: id }, update);
    }
  }

  /**
   * Atomically shift (remove first element) from an array property
   * Uses MongoDB $pop with -1 to avoid race conditions
   */
  async shiftFromArray(id: ObjId, name: string): Promise<void> {
    const update = {
      $pop: {
        [`properties.${name}.value`]: -1 as const, // -1 = first element
      },
      $set: {
        modified: new Date(),
      },
    };
    if (typeof id === 'string') {
      await this.types.updateOne({ _id: id }, update);
    } else {
      await this.objects.updateOne({ _id: id }, update);
    }
  }

  /**
   * Atomically remove a value from an array property by matching
   * Uses MongoDB $pull to avoid race conditions
   */
  async pullFromArray(id: ObjId, name: string, value: unknown): Promise<void> {
    const sanitized = sanitizeForMongo(
      value,
      new WeakSet(),
      `#${id}.properties.${name}[]`,
    );

    const update = {
      $pull: {
        [`properties.${name}.value`]: sanitized,
      },
      $set: {
        modified: new Date(),
      },
    };
    if (typeof id === 'string') {
      await this.types.updateOne({ _id: id }, update);
    } else {
      await this.objects.updateOne({ _id: id }, update);
    }
  }

  /**
   * Get all children of an object
   */
  async getChildren(parentId: ObjId): Promise<GameObject[]> {
    // Query using dot notation for nested ObjRefValue
    return await this.objects.find({ 'parent.id': parentId } as any).toArray();
  }

  /**
   * Get next available object ID (sequential allocation)
   * Note: ID reuse for recycled objects is handled by $.recycler
   */
  async getNextId(): Promise<number> {
    const result = await this.objects
      .find({})
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    return result.length > 0 ? (result[0]._id as number) + 1 : 1;
  }

  /**
   * Check if object exists
   */
  async exists(id: ObjId): Promise<boolean> {
    const count = await this.objects.countDocuments({ _id: id });
    return count > 0;
  }

  /**
   * Get the database instance (for shared access, e.g., logging)
   */
  getDatabase(): Db {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  /**
   * Get a collection by name (for game_events, logs, etc.)
   */
  getCollection(name: string): Collection {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    return this.db.collection(name);
  }

  /**
   * Initialize database with root object #1 if it doesn't exist
   */
  async ensureRoot(): Promise<void> {
    const exists = await this.exists(1);
    if (!exists) {
      await this.create({
        _id: 1,
        parent: { type: 'objref', target: 'object', id: 0 }, // Root's parent is #0 (ObjectManager)
        properties: {},
        methods: {},
      });
    }
  }

  /**
   * Count the number of player objects in the database
   * Used by CharGen to determine if this is the first player (admin)
   * Searches for objects that have a non-empty playername property
   */
  async countPlayers(): Promise<number> {
    return await this.objects.countDocuments({
      'properties.playername.type': 'string',
      'properties.playername.value': { $ne: '' },
    });
  }

  /**
   * List all objects (for DevTools)
   * @param includeRecycled - If true, include recycled objects
   */
  async listAll(includeRecycled = false): Promise<GameObject[]> {
    const query = includeRecycled ? {} : { recycled: { $ne: true } };
    return await this.objects.find(query).toArray();
  }

  // ==========================================================================
  // Type Collection Methods
  // ==========================================================================

  /**
   * Get type by name
   */
  async getType(name: string): Promise<TypeObject | null> {
    return await this.types.findOne({ _id: name });
  }

  /**
   * Create a new type
   */
  async createType(
    type: Omit<TypeObject, 'created' | 'modified'>,
  ): Promise<TypeObject> {
    const now = new Date();
    const sanitizedType = sanitizeForMongo(
      type,
      new WeakSet(),
      `createType:${type._id}`,
    ) as typeof type;

    const newType: TypeObject = {
      ...sanitizedType,
      created: now,
      modified: now,
    };

    await this.types.insertOne(newType as any);
    return newType;
  }

  /**
   * Update existing type
   */
  async updateType(
    name: string,
    updates: Partial<Omit<TypeObject, '_id' | 'created'>>,
  ): Promise<void> {
    const sanitized = sanitizeForMongo(updates, new WeakSet(), `type:${name}`);

    await this.types.updateOne(
      { _id: name },
      {
        $set: {
          ...sanitized,
          modified: new Date(),
        },
      },
    );
  }

  /**
   * Atomically set a single method on a type
   */
  async setTypeMethod(
    name: string,
    methodName: string,
    methodDef: {
      code: string;
      callable?: boolean;
      aliases?: string[];
      help?: string;
    },
  ): Promise<void> {
    const sanitized = sanitizeForMongo(
      methodDef,
      new WeakSet(),
      `type:${name}.methods.${methodName}`,
    );

    await this.types.updateOne(
      { _id: name },
      {
        $set: {
          [`methods.${methodName}`]: sanitized,
          modified: new Date(),
        },
      },
    );
  }

  /**
   * Atomically set a single property on a type
   */
  async setTypeProperty(
    name: string,
    propName: string,
    value: unknown,
  ): Promise<void> {
    const sanitized = sanitizeForMongo(
      value,
      new WeakSet(),
      `type:${name}.properties.${propName}`,
    );

    await this.types.updateOne(
      { _id: name },
      {
        $set: {
          [`properties.${propName}`]: sanitized,
          modified: new Date(),
        },
      },
    );
  }

  /**
   * Check if type exists
   */
  async typeExists(name: string): Promise<boolean> {
    const count = await this.types.countDocuments({ _id: name });
    return count > 0;
  }

  /**
   * Delete a type
   */
  async deleteType(name: string): Promise<void> {
    await this.types.deleteOne({ _id: name });
  }

  /**
   * List all types
   */
  async listAllTypes(): Promise<TypeObject[]> {
    return await this.types.find({}).toArray();
  }

  /**
   * Get children types (types that have this type as parent)
   */
  async getTypeChildren(parentName: string): Promise<TypeObject[]> {
    return await this.types
      .find({ 'parent.name': parentName } as any)
      .toArray();
  }
}
