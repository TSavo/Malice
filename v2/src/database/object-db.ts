import { MongoClient, Db, Collection, ChangeStream } from 'mongodb';
import type { GameObject, ObjId } from '../../types/object.js';

/**
 * MongoDB persistence layer for game objects
 */
export class ObjectDatabase {
  private client!: MongoClient;
  private db!: Db;
  private objects!: Collection<GameObject>;
  private connected = false;
  private changeStream?: ChangeStream;

  constructor(private uri: string, private dbName: string = 'malice') {}

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
    if (this.changeStream) {
      await this.changeStream.close();
      this.changeStream = undefined;
    }
    if (!this.connected) return;
    await this.client.close();
    this.connected = false;
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

    // Check if we're reusing a recycled object
    const existing = await this.objects.findOne({ _id: obj._id, recycled: true });

    if (existing) {
      // Replace recycled object (keep original creation date)
      const newObj: GameObject = {
        ...obj,
        created: existing.created,
        modified: now,
        recycled: false, // Clear recycled flag
      };

      await this.objects.replaceOne({ _id: obj._id }, newObj);
      return newObj;
    } else {
      // New object
      const newObj: GameObject = {
        ...obj,
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
    await this.objects.updateOne(
      { _id: id },
      {
        $set: {
          ...updates,
          modified: new Date(),
        },
      }
    );
  }

  /**
   * Delete object
   */
  async delete(id: ObjId): Promise<void> {
    await this.objects.deleteOne({ _id: id });
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
   * Watch for changes to objects (for cache invalidation across servers)
   * Enables multiple game servers / DevTools to share one MongoDB and stay in sync
   */
  watch(callback: (change: any) => void): void {
    if (this.changeStream) {
      console.warn('[ObjectDatabase] Already watching for changes');
      return;
    }

    console.log('[ObjectDatabase] Watching for changes (multi-server cache sync enabled)');

    // Use setImmediate to avoid blocking the constructor
    setImmediate(() => {
      try {
        this.changeStream = this.objects.watch([], {
          fullDocument: 'updateLookup', // Include full document on updates
        });

        this.changeStream.on('change', (change) => {
          callback(change);
        });

        this.changeStream.on('error', (err) => {
          console.error('[ObjectDatabase] Change stream error:', err);
          // Attempt to reconnect
          this.changeStream = undefined;
          setTimeout(() => {
            if (!this.changeStream) {
              this.watch(callback);
            }
          }, 5000);
        });

        // Handle the 'close' event
        this.changeStream.on('close', () => {
          console.log('[ObjectDatabase] Change stream closed');
        });
      } catch (err) {
        console.error('[ObjectDatabase] Failed to start change stream:', err);
        // Retry after a delay
        setTimeout(() => {
          if (!this.changeStream) {
            this.watch(callback);
          }
        }, 5000);
      }
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
