import { MongoClient, Db, Collection } from 'mongodb';
import type { GameObject, ObjId } from '../../types/object.js';

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
    console.error(`[ObjectDB] Circular reference detected at ${path}, replacing with null`);
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
 * MongoDB persistence layer for game objects
 */
export class ObjectDatabase {
  private client!: MongoClient;
  private db!: Db;
  private objects!: Collection<GameObject>;
  private connected = false;


  constructor(private uri: string, private dbName: string = 'malice') { }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    this.client = new MongoClient(this.uri);
    await this.client.connect();

    this.db = this.client.db(this.dbName);
    this.objects = this.db.collection<GameObject>('objects');

    // Ensure indexes (_id is unique by default, no need to specify)
    await this.objects.createIndex({ parent: 1 });

    this.connected = true;
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    await this.client.close();
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
  async create(obj: Omit<GameObject, 'created' | 'modified'>): Promise<GameObject> {
    const now = new Date();
    // Sanitize the object to prevent circular reference errors
    const sanitizedObj = sanitizeForMongo(obj, new WeakSet(), `create#${obj._id}`) as typeof obj;

    // Check if we're reusing a recycled object
    const existing = await this.objects.findOne({ _id: sanitizedObj._id, recycled: true });

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
   * Update existing object
   */
  async update(
    id: ObjId,
    updates: Partial<Omit<GameObject, '_id' | 'created'>>
  ): Promise<void> {
    // Sanitize updates to prevent circular reference errors
    const sanitized = sanitizeForMongo(updates, new WeakSet(), `#${id}`);

    // Debug: try JSON.stringify to detect circular refs before BSON does
    try {
      JSON.stringify(sanitized);
    } catch (jsonErr) {
      console.error(`[ObjectDB] JSON.stringify failed for #${id}, trying to find circular ref`);
      console.error(`[ObjectDB] Updates keys: ${Object.keys(updates).join(', ')}`);
      // Try to identify the problematic key
      for (const key of Object.keys(sanitized)) {
        try {
          JSON.stringify((sanitized as any)[key]);
        } catch {
          console.error(`[ObjectDB] Circular reference in key: ${key}`);
        }
      }
    }

    await this.objects.updateOne(
      { _id: id },
      {
        $set: {
          ...sanitized,
          modified: new Date(),
        },
      }
    );
  }

  /**
   * Get all children of an object
   */
  async getChildren(parentId: ObjId): Promise<GameObject[]> {
    return await this.objects.find({ parent: parentId }).toArray();
  }

  /**
   * Mark object as recycled (soft delete)
   */
  async recycle(id: ObjId): Promise<void> {
    await this.objects.updateOne(
      { _id: id },
      {
        $set: {
          recycled: true,
          modified: new Date(),
        },
      }
    );
  }

  /**
   * Get next available object ID
   * Prioritizes recycled objects for reuse
   */
  async getNextId(): Promise<ObjId> {
    // First check for recycled objects
    const recycled = await this.objects.findOne(
      { recycled: true },
      { sort: { _id: 1 } }
    );

    if (recycled) {
      return recycled._id;
    }

    // Otherwise get next sequential ID
    const result = await this.objects
      .find({})
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    return result.length > 0 ? result[0]._id + 1 : 1;
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
        parent: 0, // Root has no parent
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
}
