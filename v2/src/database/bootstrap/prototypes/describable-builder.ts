import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Describable prototype
 * Base prototype for things that exist in the world
 */
export class DescribableBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parentId,
      properties: {
        name: 'Describable',
        description: 'Base prototype for things that exist in the world',
        aliases: [],
        location: null, // ObjId | null - where this object is located
        contents: [], // ObjId[] - what's inside this object
      },
      methods: {},
    });

    obj.setMethod('describe', `
      return \`\${self.name}\\r\\n\${self.description}\`;
    `);

    obj.setMethod('shortDesc', `
      return self.name;
    `);

    // Check if this object can contain another object
    // Return true to allow, or a string explaining why not
    obj.setMethod('canContain', `
      const obj = args[0];
      const objName = obj?.name || 'that';
      return \`The \${self.name} cannot contain \${objName}.\`;
    `);

    // THE primitive for all location changes
    // Everything that moves goes through this method
    obj.setMethod('moveTo', `
      const destination = args[0]; // ObjId or RuntimeObject
      const mover = args[1]; // Who/what is causing the move (optional)

      const destId = typeof destination === 'number' ? destination : destination?.id;
      if (destId === undefined || destId === null) {
        throw new Error('Invalid destination');
      }

      const sourceId = self.location;
      const source = sourceId ? await $.load(sourceId) : null;
      const dest = await $.load(destId);

      if (!dest) {
        throw new Error(\`Destination #\${destId} not found\`);
      }

      // Check if destination can contain us
      const canContain = await dest.canContain(self);
      if (canContain !== true) {
        return canContain; // Return the rejection reason
      }

      // Pre-move hooks (can throw to cancel the move)
      if (source && source.onContentLeaving) {
        await source.onContentLeaving(self, dest, mover);
      }
      await self.onLeaving(source, dest, mover);

      // Perform the actual move
      if (source && source.removeContent) {
        await source.removeContent(self.id);
      }
      self.location = destId;
      if (dest.addContent) {
        await dest.addContent(self.id);
      }

      // Post-move hooks (for notifications, verb registration, etc.)
      if (source && source.onContentLeft) {
        await source.onContentLeft(self, dest, mover);
      }
      await self.onArrived(dest, source, mover);
      if (dest.onContentArrived) {
        await dest.onContentArrived(self, source, mover);
      }
    `);

    // Hook: called before leaving current location
    // Override to prepare for departure, can throw to cancel
    obj.setMethod('onLeaving', `
      const source = args[0];
      const dest = args[1];
      const mover = args[2];
      // Default: do nothing, allow move
    `);

    // Hook: called after arriving at new location
    // Override to register verbs, announce arrival, etc.
    obj.setMethod('onArrived', `
      const dest = args[0];
      const source = args[1];
      const mover = args[2];
      // Default: do nothing
    `);

    return obj;
  }
}
