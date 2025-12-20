import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Recycler object (dynamic ID)
 * Handles object deletion, recovery, and cache cleanup
 */
export class RecyclerBuilder {
  private recycler: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) { }

  async build(forceRebuild = false): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};


    if (aliases.recycler) {
      this.recycler = await this.manager.load(aliases.recycler);
      if (this.recycler && !forceRebuild) return; // Already exists
    }

    // Create new Recycler only if it doesn't exist
    if (!this.recycler) {
      const root = await this.manager.load(1);
      this.recycler = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Recycler',
          description: 'Object deletion and recovery system',
          recycledObjects: [],
        },
        methods: {},
      });
    }

    // Supports two calling conventions:
    // 1. create({ parent: id, properties: {...} }, caller?) - new format
    // 2. create(parentId, { name: ..., ... }, caller?) - legacy format
    // Parent can be a number (ID) or an object with .id property (e.g., $.dollar)
    this.recycler.setMethod('create', `
          const arg0 = args[0];
          const arg1 = args[1];

          let params;
          let caller = null;

          // Support two calling conventions
          if (arg0 && typeof arg0 === 'object' && arg0.parent !== undefined) {
            // New format: single params object
            params = arg0;
            caller = arg1;
          } else if (arg0 !== undefined && arg1 && typeof arg1 === 'object') {
            // Legacy format: parent as first arg, properties as second
            // Keep the RuntimeObject, don't extract just the ID
            params = {
              parent: arg0,
              properties: arg1,
            };
            caller = args[2];
          } else {
            throw new Error('Invalid create parameters');
          }

          if (params.parent === undefined) {
            throw new Error('Parent must be specified');
          }

          // Parent must be a RuntimeObject
          if (!params.parent || typeof params.parent !== 'object' || typeof params.parent.id !== 'number') {
            throw new Error('Parent must be a RuntimeObject');
          }

          // Check if caller has permission to create objects
          // Allow creation if:
          // - No caller (system creation like CharGen)
          // - Caller is wizard
          // - Caller has canBuild flag
          if (caller) {
            const isWizard = caller.isWizard;
            const canBuild = caller.canBuild;

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
            const strippedName = name.replace(/^(a|an|the)\\s+/i, '').trim();

            // Split into words and filter out empty strings
            const words = strippedName.toLowerCase().split(/\\s+/).filter(w => w.length > 0);

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
            // e.g., "brown ragged coat" -> "brown", "ragged", "coat", "ragged coat", "brown ragged coat"
            if (words.length > 2) {
              for (let i = 1; i < words.length; i++) {
                aliasSet.add(words.slice(i).join(' '));
              }
            }

            params.properties.aliases = Array.from(aliasSet);
          }

          // Try to reuse a recycled object from the pool
          const pool = self.recycledObjects || [];
          let obj;

          if (pool.length > 0) {
            // Pop an object from the pool and reuse it
            obj = pool.pop();
            self.recycledObjects = pool;

            // Clear recycled state
            obj.recycled = false;
            obj.recycledAt = null;
            obj.recycledBy = null;

            // Set new parent
            obj.setParent(params.parent);

            // Set all properties
            for (const [key, value] of Object.entries(params.properties)) {
              obj[key] = value;
            }

            console.log(\`[Recycler] Reused object #\${obj.id}\`);
          } else {
            // Pool empty - create fresh object
            obj = await $create(params);
            console.log(\`[Recycler] Created new object #\${obj.id}\`);
          }

          // Call onCreate hook if it exists
          if (obj.hasMethod && obj.hasMethod('onCreate')) {
            await obj.onCreate(caller);
          }

          // Log creation
          const ownerInfo = params.properties.owner ? \`owner: #\${params.properties.owner}\` : 'system';
          console.log(\`[Recycler] Object #\${obj.id} ready (\${ownerInfo})\`);

          return obj;
        `);

    this.recycler.setMethod('recycle', `
          const objectOrId = args[0];
          const caller = args[1];

          // Accept either object or ID
          const objectId = typeof objectOrId === 'number' ? objectOrId : objectOrId.id;

          // Load the object
          const obj = typeof objectOrId === 'number' ? await $load(objectId) : objectOrId;
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
          await $clearAliasesForObject(objectId);

          // Reset the object to a blank slate
          // 1. Clear all properties
          const allProps = obj.getPropertyNames ? obj.getPropertyNames() : [];
          for (const prop of allProps) {
            obj[prop] = null;
          }

          // 2. Clear all methods
          const allMethods = obj.getMethodNames ? obj.getMethodNames() : [];
          for (const method of allMethods) {
            obj.deleteMethod(method);
          }

          // 3. Reparent to $.nothing (#-1)
          const nothing = await $load(-1);
          obj.setParent(nothing);

          // 4. Mark as recycled
          obj.recycled = true;
          obj.recycledAt = new Date().toISOString();
          obj.recycledBy = caller ? caller.id : 0;

          // 5. Add to recycled objects pool (stores object references, not IDs)
          const pool = self.recycledObjects || [];
          pool.push(obj);
          self.recycledObjects = pool;

          console.log(\`Recycled object #\${objectId}\`);
          return { recycled: objectId };
        `);

    this.recycler.setMethod('canRecycle', `
          const caller = args[0];
          const obj = args[1];

          // Wizards can recycle anything
          if (caller?.isWizard) return true;

          // Can't recycle core system objects
          if (obj.id < 20) return false;

          // Owner can recycle their own objects
          if (caller && obj.owner === caller) return true;



          return false;
        `);

    this.recycler.setMethod('unrecycle', `
          const objectOrId = args[0];

          // Accept either object or ID
          const objectId = typeof objectOrId === 'number' ? objectOrId : objectOrId.id;

          // Find in recycled objects pool
          const pool = self.recycledObjects || [];
          const index = pool.findIndex(obj => obj.id === objectId);

          if (index === -1) {
            throw new Error('Object not in recycle pool');
          }

          // Get the object from the pool
          const obj = pool[index];

          // Remove recycled flags
          obj.recycled = false;
          obj.recycledAt = null;
          obj.recycledBy = null;

          // Remove from pool
          pool.splice(index, 1);
          self.recycledObjects = pool;

          console.log(\`Restored object #\${objectId}\`);
          return obj;
        `);

    // Recursively recycle an object and all nested parts (for body trees)
    this.recycler.setMethod('recycleTree', `
      const objectId = args[0];
      const caller = args[1];

      const obj = await $load(objectId);
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
  }

  async registerAlias(): Promise<void> {
    if (!this.recycler) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'recycler', this.recycler.id);
    console.log(`✅ Registered recycler alias -> #${this.recycler.id} `);
  }
}
