import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Recycler object (dynamic ID)
 * Handles object deletion, recovery, and cache cleanup
 */
export class RecyclerBuilder {
  private recycler: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};


    if (aliases.recycler) {
      this.recycler = await this.manager.load(aliases.recycler);
      if (this.recycler) return; // Already exists
    }

    // Create new Recycler
    this.recycler = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Recycler',
        description: 'Object deletion and recovery system',
        recycleBin: [],
      },
      methods: {},
    });

    this.recycler.setMethod('create', `
          const params = args[0];
          const caller = args[1]; // Optional - can be null for system-created objects

          // Validate parameters
          if (!params || typeof params !== 'object') {
            throw new Error('Invalid create parameters');
          }

          if (params.parent === undefined) {
            throw new Error('Parent must be specified');
          }

          // Check if caller has permission to create objects
          // Allow creation if:
          // - No caller (system creation like CharGen)
          // - Caller is wizard
          // - Caller has canBuild flag
          if (caller && caller.get) {
            const isWizard = caller.get('isWizard');
            const canBuild = caller.get('canBuild');


            if (!isWizard && !canBuild) {
              throw new Error('Permission denied: You do not have build privileges');
            }
          }


          // Set ownership if caller provided
          if (!params.properties) {
            params.properties = {};
          }

          if (caller && !params.properties.owner) {
            params.properties.owner = caller.id;
          }

          // Set creation metadata
          if (!params.properties.createdAt) {
            params.properties.createdAt = new Date();
          }

          if (caller && !params.properties.createdBy) {
            params.properties.createdBy = caller.id;
          }

          // Create the object through ObjectManager
          const newObject = await $.create(params);


          // Call onCreate hook if it exists
          if (newObject.hasMethod && newObject.hasMethod('onCreate')) {
            await newObject.onCreate(caller);
          }

          // Log creation
          const ownerInfo = params.properties.owner ? \`owner: #\${params.properties.owner}\` : 'system';
          console.log(\`[Recycler] Created object #\${newObject.id} (\${ownerInfo})\`);

          return newObject;
        `);

    this.recycler.setMethod('recycle', `
          const objectOrId = args[0];
          const caller = args[1];

          // Accept either object or ID
          const objectId = typeof objectOrId === 'number' ? objectOrId : objectOrId.id;

          // Load the object
          const obj = typeof objectOrId === 'number' ? await $.load(objectId) : objectOrId;
          if (!obj) {
            throw new Error('Object not found');
          }

          // Check permissions
          if (!self.canRecycle(caller, obj)) {
            throw new Error('Permission denied');
          }

          // Notify object it's being deleted
          if (obj.hasMethod && obj.hasMethod('beforeRecycle')) {
            await obj.beforeRecycle();
          }

          // Clear all aliases pointing to this object
          $.clearAliasesForObject(objectId);

          // Evict from cache
          $.evictFromCache(objectId);

          // Move to recycle bin (soft delete)
          const bin = self.recycleBin || [];
          bin.push({
            id: objectId,
            deletedAt: new Date(),
            deletedBy: caller ? caller.id : 0,
            data: obj.properties
          });
          self.recycleBin = bin;

          // Mark as deleted in database
          await $.db.update(objectId, {
            $set: {
              'properties._deleted': true,
              'properties._deletedAt': new Date()
            }
          });

          console.log(\`Recycled object #\${objectId}\`);
        `);

    this.recycler.setMethod('canRecycle', `
          const caller = args[0];
          const obj = args[1];

          // Wizards can recycle anything
          if (caller && caller.get('isWizard')) return true;


          // Can't recycle core system objects
          if (obj.id < 20) return false;

          // Owner can recycle their own objects
          const owner = obj.get('owner');
          if (caller && owner === caller.id) return true;



          return false;
        `);

    this.recycler.setMethod('unrecycle', `
          const objectId = args[0];

          // Find in recycle bin
          const bin = self.recycleBin || [];
          const index = bin.findIndex(item => item.id === objectId);

          if (index === -1) {
            throw new Error('Object not in recycle bin');
          }

          // Restore
          await $.db.update(objectId, {
            $unset: {
              'properties._deleted': '',
              'properties._deletedAt': ''
            }
          });

          // Remove from bin
          bin.splice(index, 1);
          self.recycleBin = bin;

          console.log(\`Restored object #\${objectId}\`);
        `);

    // Recursively recycle an object and all nested parts (for body trees)
    this.recycler.setMethod('recycleTree', `
      const objectId = args[0];
      const caller = args[1];

      const obj = await $.load(objectId);
      if (!obj) return;

      // Recursively delete all parts first
      const parts = obj.parts || {};
      for (const key of Object.keys(parts)) {
        await self.recycleTree(parts[key], caller);
      }

      // Also check contents
      const contents = obj.contents || [];
      for (const childId of contents) {
        await self.recycleTree(childId, caller);
      }

      // Now recycle this object
      await self.recycle(objectId, caller);
    `);

    this.recycler.setMethod('purge', `
          const objectId = args[0];
          const caller = args[1];

          // Only wizards can purge
          if (!caller || !caller.get('isWizard')) {
            throw new Error('Only wizards can permanently delete objects');
          }


          // Clear caches
          $.clearAliasesForObject(objectId);
          $.evictFromCache(objectId);

          // Delete from database
          await $.db.delete(objectId);

          // Remove from recycle bin
          const bin = self.recycleBin || [];
          const index = bin.findIndex(item => item.id === objectId);
          if (index !== -1) {
            bin.splice(index, 1);
            self.recycleBin = bin;
          }

          console.log(\`Purged object #\${objectId}\`);
        `);
  }

  async registerAlias(): Promise<void> {
    if (!this.recycler) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'recycler', this.recycler.id);
    console.log(`✅ Registered recycler alias -> #${this.recycler.id}`);
  }
}
