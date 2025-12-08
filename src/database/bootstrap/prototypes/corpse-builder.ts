import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Corpse prototype
 * A dead body left behind when a player dies.
 *
 * Corpses:
 * - Inherit from Decayable (they rot over time)
 * - Have contents (lootable inventory from dead player)
 * - Can be examined
 * - Eventually decay completely and are recycled
 *
 * Decay timeline (1 tick = 1 minute):
 * - Fresh: 0-10% - recently dead
 * - Stiff: 10-30% - rigor mortis
 * - Bloated: 30-50% - decomposition gases
 * - Decaying: 50-80% - advanced decomposition
 * - Skeletal: 80-100% - mostly bones
 * - At 100%: recycled
 */
export class CorpseBuilder {
  constructor(private manager: ObjectManager) {}

  async build(decayableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: decayableId,
      properties: {
        name: 'Corpse',
        description: 'A lifeless body.',
        // Original identity
        originalName: null,
        // Physical - average human body
        width: 50, // cm
        height: 180,
        depth: 30,
        weight: 70000, // grams (~70kg)
        // Inventory from dead player
        contents: [],
        // Corpse-specific decay (slower than food, faster than buildings)
        // ~24 hours to fully decompose at room temperature
        // 24 hours = 1440 ticks, 100% / 1440 = ~0.07% per tick
        decayRate: 0.07,
        decayCondition: 'always', // Always decaying
        // Can be searched/looted
        searched: false,
      },
      methods: {},
    });

    // Describe corpse with decay state
    obj.setMethod('describe', `
      const decay = self.decayLevel || 0;
      const name = self.originalName || 'someone';
      let desc = '';

      if (decay < 10) {
        desc = 'The body of ' + name + ' lies here, seemingly at peace.';
        desc += ' The skin is pale but otherwise the body looks intact.';
      } else if (decay < 30) {
        desc = 'The stiff body of ' + name + ' lies here.';
        desc += ' Rigor mortis has set in, and the skin has taken on a waxy pallor.';
      } else if (decay < 50) {
        desc = 'The bloated remains of ' + name + ' lie here.';
        desc += ' Decomposition gases have swollen the body, and the smell is unpleasant.';
      } else if (decay < 80) {
        desc = 'The decaying remains of what was once ' + name + ' lie here.';
        desc += ' The flesh is discolored and falling away in places. The stench is overwhelming.';
      } else {
        desc = 'The skeletal remains of ' + name + ' lie here.';
        desc += ' Little flesh remains on the bones.';
      }

      // Show if has items
      const contents = self.contents || [];
      if (contents.length > 0 && !self.searched) {
        desc += '\\r\\nThe body appears to have belongings that could be searched.';
      } else if (contents.length > 0) {
        desc += '\\r\\nThe body has been searched.';
      }

      return desc;
    `);

    // Search/loot the corpse
    obj.setMethod('search', `
      /** Search the corpse for items.
       *  @param searcher - The person searching
       *  @returns List of items found
       */
      const searcher = args[0];
      const contents = self.contents || [];

      if (contents.length === 0) {
        return { success: false, message: 'The body has nothing of value.' };
      }

      // Mark as searched
      self.set('searched', true);

      // List what's there
      const items = [];
      for (const itemId of contents) {
        const item = await $.load(itemId);
        if (item) {
          items.push({ id: itemId, name: item.name || 'something' });
        }
      }

      return {
        success: true,
        message: 'You search the body and find:',
        items,
      };
    `);

    // Take an item from the corpse
    obj.setMethod('loot', `
      /** Take an item from the corpse.
       *  @param itemName - Name of item to take
       *  @param looter - The person looting
       *  @returns Result of looting
       */
      const itemName = args[0];
      const looter = args[1];

      const contents = self.contents || [];
      if (contents.length === 0) {
        return { success: false, message: 'The body has nothing to take.' };
      }

      // Find matching item
      const itemNameLower = (itemName || '').toLowerCase();
      for (const itemId of contents) {
        const item = await $.load(itemId);
        if (!item) continue;

        const name = (item.name || '').toLowerCase();
        const aliases = (item.aliases || []).map(a => a.toLowerCase());

        if (name === itemNameLower || aliases.includes(itemNameLower)) {
          // Move item to looter
          await item.moveTo(looter);
          return {
            success: true,
            message: 'You take the ' + item.name + ' from the corpse.',
            item,
          };
        }
      }

      return { success: false, message: 'You don\\'t see that on the body.' };
    `);

    // Check if this can contain something (corpses can hold inventory)
    obj.setMethod('canContain', `
      // Corpses can contain items (dead player's inventory)
      return true;
    `);

    // When decay reaches 100%, recycle the corpse and its contents
    obj.setMethod('onFullyDecayed', `
      /** Called when corpse is fully decomposed.
       *  Recycles the corpse and dumps remaining contents.
       */
      const contents = self.contents || [];
      const location = self.location;

      // Dump remaining contents to location
      if (location && contents.length > 0) {
        const room = await $.load(location);
        if (room) {
          for (const itemId of contents) {
            const item = await $.load(itemId);
            if (item) {
              await item.moveTo(location);
            }
          }
          // Announce if room has announce
          if (room.announce) {
            const name = self.originalName || 'someone';
            await room.announce('The remains of ' + name + ' crumble to dust, leaving behind some belongings.');
          }
        }
      }

      // Recycle self
      if ($.recycler) {
        await $.recycler.recycle(self);
      }
    `);

    return obj;
  }
}
