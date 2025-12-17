// @ts-nocheck

// Note: these prototypes are not part of the runtime TypeScript build.
// They are parsed by `src/database/bootstrap/prototype-ts/extract.ts` and applied via `npm run bootstrap:apply`.

function prototype(_opts: any) {
  return (_target: any) => {};
}

@prototype({ alias: 'recycler', parent: 'root' })
export class Recycler {
  static defaults = {
    name: 'Recycler',
    description: 'Object deletion and recovery system',
    recycleBin: [],
  };

  async create(self, $, pass, arg0, arg1, arg2) {
    let params;
    let caller = null;

    // Support two calling conventions
    if (arg0 && typeof arg0 === 'object' && arg0.parent !== undefined) {
      // New format: single params object
      params = arg0;
      caller = arg1;
    } else if (arg0 !== undefined && arg1 && typeof arg1 === 'object') {
      // Legacy format: parent as first arg, properties as second
      const parentId = typeof arg0 === 'object' ? arg0.id : arg0;
      params = {
        parent: parentId,
        properties: arg1,
      };
      caller = arg2;
    } else {
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

    // Auto-generate aliases from name if not provided
    if (!params.properties.aliases && params.properties.name) {
      const name = params.properties.name;
      // Strip leading articles (a, an, the)
      const strippedName = name.replace(/^(a|an|the)\s+/i, '').trim();

      // Split into words and filter out empty strings
      const words = strippedName
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0);

      // Build aliases: each word + full stripped name
      const aliasSet = new Set();
      for (const word of words) {
        aliasSet.add(word);
      }
      // Add full name (without article)
      if (words.length > 1) {
        aliasSet.add(words.join(' '));
      }
      // Add progressive combinations for multi-word names
      // e.g. "brown ragged coat" -> "brown", "ragged", "coat", "ragged coat", "brown ragged coat"
      if (words.length > 2) {
        for (let i = 1; i < words.length; i++) {
          aliasSet.add(words.slice(i).join(' '));
        }
      }

      params.properties.aliases = Array.from(aliasSet);
    }

    // Create the object through ObjectManager
    const newObject = await $.create(params);

    // Call onCreate hook if it exists
    if (newObject.hasMethod && newObject.hasMethod('onCreate')) {
      await newObject.onCreate(caller);
    }

    // Log creation
    const ownerInfo = params.properties.owner ? `owner: #${params.properties.owner}` : 'system';
    console.log(`[Recycler] Created object #${newObject.id} (${ownerInfo})`);

    return newObject;
  }

  async recycle(self, $, pass, objectOrId, caller) {
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
    await $.clearAliasesForObject(objectId);

    // Move to recycle bin (soft delete)
    const bin = self.recycleBin || [];
    bin.push({
      id: objectId,
      deletedAt: new Date(),
      deletedBy: caller ? caller.id : 0,
    });
    self.recycleBin = bin;

    // Mark as deleted on the object (persists via proxy)
    obj.set('_deleted', true);
    obj.set('_deletedAt', new Date().toISOString());

    // Evict from cache AFTER saving
    $.evictFromCache(objectId);

    console.log(`Recycled object #${objectId}`);
    return { recycled: objectId };
  }

  canRecycle(self, $, pass, caller, obj) {
    // Wizards can recycle anything
    if (caller && caller.get('isWizard')) return true;

    // Can't recycle core system objects
    if (obj.id < 20) return false;

    // Owner can recycle their own objects
    const owner = obj.get('owner');
    if (caller && owner === caller.id) return true;

    return false;
  }

  async unrecycle(self, $, pass, objectId) {
    // Find in recycle bin
    const bin = self.recycleBin || [];
    const index = bin.findIndex((item) => item.id === objectId);

    if (index === -1) {
      throw new Error('Object not in recycle bin');
    }

    // Load and restore the object
    const obj = await $.load(objectId);
    if (!obj) {
      throw new Error('Object not found in database');
    }

    // Remove deleted flags
    obj.set('_deleted', false);
    obj.set('_deletedAt', null);

    // Remove from bin
    bin.splice(index, 1);
    self.recycleBin = bin;

    console.log(`Restored object #${objectId}`);
    return { restored: objectId };
  }

  // Recursively recycle an object and all nested parts (for body trees)
  async recycleTree(self, $, pass, objectId, caller) {
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
  }

  async purge(self, $, pass, objectId, caller) {
    // Only wizards can purge
    if (!caller || !caller.get('isWizard')) {
      throw new Error('Only wizards can permanently delete objects');
    }

    // Clear aliases pointing to this object
    await $.clearAliasesForObject(objectId);

    // Evict from cache
    $.evictFromCache(objectId);

    // Delete from database
    await $.db.delete(objectId);

    // Remove from recycle bin
    const bin = self.recycleBin || [];
    const index = bin.findIndex((item) => item.id === objectId);
    if (index !== -1) {
      bin.splice(index, 1);
      self.recycleBin = bin;
    }

    console.log(`Purged object #${objectId}`);
    return { purged: objectId };
  }
}
