import { ObjectManager } from '../object-manager.js';

/**
 * Builds Recycler object (#20)
 * Handles object deletion, recovery, and cache cleanup
 */
export class RecyclerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load(20);
    if (existing) return;

    await this.manager.create({
      parent: 1,
      properties: {
        name: 'Recycler',
        description: 'Object deletion and recovery system',
        recycleBin: [],
      },
      methods: {
        recycle: `
          const objectId = args[0];
          const caller = args[1];

          // Load the object
          const obj = await $.load(objectId);
          if (!obj) {
            throw new Error('Object not found');
          }

          // Check permissions
          if (!self.canRecycle(caller, obj)) {
            throw new Error('Permission denied');
          }

          // Notify object it's being deleted
          if (obj.hasMethod && obj.hasMethod('beforeRecycle')) {
            await obj.call('beforeRecycle');
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
          await self.save();

          // Mark as deleted in database
          await $.db.update(objectId, {
            $set: {
              'properties._deleted': true,
              'properties._deletedAt': new Date()
            }
          });

          console.log(\`Recycled object #\${objectId}\`);
        `,

        canRecycle: `
          const caller = args[0];
          const obj = args[1];

          // Wizards can recycle anything
          if (caller && caller.get && caller.get('isWizard')) return true;

          // Can't recycle core system objects
          if (obj.id < 20) return false;

          // Owner can recycle their own objects
          const owner = obj.get('owner');
          if (caller && owner === caller.id) return true;

          return false;
        `,

        unrecycle: `
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
          await self.save();

          console.log(\`Restored object #\${objectId}\`);
        `,

        purge: `
          const objectId = args[0];
          const caller = args[1];

          // Only wizards can purge
          if (!caller || !caller.get || !caller.get('isWizard')) {
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
            await self.save();
          }

          console.log(\`Purged object #\${objectId}\`);
        `,
      },
    });
  }

  async registerAlias(): Promise<void> {
    const root = await this.manager.load(1);
    if (!root) return;

    const aliases = (root.get('aliases') as Record<string, number>) || {};
    aliases.recycler = 20;
    root.set('aliases', aliases);
    await root.save();
  }
}
