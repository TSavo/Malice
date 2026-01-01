import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the Disposal type
 * Base class for objects that accept and destroy/process items.
 *
 * Inherits from Describable.
 *
 * Properties:
 * - name: Disposal unit name
 * - description: Physical description
 * - capacity: Max items that can be processed at once (0 = unlimited)
 * - processingTime: Seconds to process items (0 = instant)
 * - acceptedTypes: Array of type names this disposal accepts (empty = all)
 * - rejectedTypes: Array of type names this disposal rejects
 * - processing: Array of items currently being processed
 * - destroyMessage: Message shown when item is destroyed
 *
 * Methods:
 * - deposit(agent, item): Put an item into the disposal
 * - canAccept(item): Check if disposal accepts this item type
 * - process(): Process/destroy items (called by scheduler or instantly)
 */
export class DisposalBuilder implements Builder {
  static provides = ['disposal'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {

    const existing = await this.manager.load('disposal');
    if (existing) {
      this.obj = existing;
    } else {
      const parent = await this.manager.load('describable');
      if (!parent) {
        throw new Error('Describable type not found - required for Disposal');
      }
      this.obj = await this.manager.define('disposal', parent, {
        properties: {
          name: 'Disposal',
          description: 'A generic disposal unit.',
        capacity: 0,
        processingTime: 0,
        acceptedTypes: [],
        rejectedTypes: [],
        processing: [],
        destroyMessage: 'The item is destroyed.',
        boltedDown: true,

        abilities: `Device that accepts and destroys items. Base for incinerators, crushers, etc.

DEPOSIT: deposit(agent, item) accepts item, either destroys instantly or queues for processing.

FILTERING: 'acceptedTypes' whitelist, 'rejectedTypes' blacklist. Empty acceptedTypes = accept all.

CAPACITY: 'capacity' limits concurrent processing (0 = unlimited).

PROCESSING: 'processingTime' seconds to destroy. 0 = instant. 'processing' queue holds pending items.

DESTRUCTION: Items recycled via $.recycler.recycle(). Permanent removal from game.

DEPOSIT: deposit(item, agent) destroys item. AI invokes directly.

IMMOVABLE: 'boltedDown' true by default.`,
        },
        methods: {},
      });
    }
    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    obj.setMethod(
      'canAccept',
      `
      /** Check if this disposal accepts the given item. */
      const item = args[0];
      if (!item) return false;

      // Check rejected types first
      if (self.rejectedTypes && self.rejectedTypes.length > 0) {
        for (const rejected of self.rejectedTypes) {
          if (await item.inheritsFrom(rejected)) {
            return false;
          }
        }
      }

      // If acceptedTypes is empty, accept everything not rejected
      if (!self.acceptedTypes || self.acceptedTypes.length === 0) {
        return true;
      }

      // Check if item matches any accepted type
      for (const accepted of self.acceptedTypes) {
        if (await item.inheritsFrom(accepted)) {
          return true;
        }
      }

      return false;
    `,
    );

    obj.setMethod(
      'deposit',
      `
      /** Deposit an item into the disposal. */
      const agent = args[0];
      const item = args[1];

      if (!item) {
        return { success: false, message: 'Deposit what?' };
      }

      // Check if we can accept this item
      const canAccept = await self.canAccept(item);
      if (!canAccept) {
        return { success: false, message: 'This disposal does not accept that type of item.' };
      }

      // Check capacity
      if (self.capacity > 0 && self.processing && self.processing.length >= self.capacity) {
        return { success: false, message: 'The disposal is full. Wait for it to finish processing.' };
      }

      // Remove item from agent's inventory or location
      if (agent.removeFromInventory) {
        await agent.removeFromInventory(item);
      } else if (agent.location && agent.location.removeContent) {
        await agent.location.removeContent(item);
      }

      // Process immediately or queue for processing
      if (self.processingTime <= 0) {
        // Instant destruction
        const message = self.destroyMessage || 'The item is destroyed.';

        // Recycle the item
        if ($.recycler && $.recycler.recycle) {
          await $.recycler.recycle(item);
        }

        return { success: true, message: message };
      } else {
        // Queue for processing
        const processing = self.processing || [];
        processing.push({
          item: item,
          startTime: Date.now(),
          endTime: Date.now() + (self.processingTime * 1000),
        });
        self.processing = processing;

        return { success: true, message: 'Item deposited. Processing...' };
      }
    `,
    );

    obj.setMethod(
      'process',
      `
      /** Process queued items. Called by scheduler. */
      const now = Date.now();
      const processing = self.processing || [];
      const stillProcessing = [];

      for (const entry of processing) {
        if (now >= entry.endTime) {
          // Processing complete - destroy item
          if ($.recycler && $.recycler.recycle) {
            await $.recycler.recycle(entry.item);
          }
        } else {
          // Still processing
          stillProcessing.push(entry);
        }
      }

      self.processing = stillProcessing;
      return { processed: processing.length - stillProcessing.length };
    `,
    );

    // Add property descriptions
    obj.setPropertyDescription(
      'capacity',
      'Maximum number of items that can be processed simultaneously (0 = unlimited)',
    );
    obj.setPropertyDescription(
      'processingTime',
      'Seconds required to process each item (0 = instant destruction)',
    );
    obj.setPropertyDescription(
      'acceptedTypes',
      'Whitelist array of prototype names this disposal accepts (empty = accept all)',
    );
    obj.setPropertyDescription(
      'rejectedTypes',
      'Blacklist array of prototype names this disposal rejects',
    );
    obj.setPropertyDescription(
      'processing',
      'Array of items currently queued for processing with timestamps',
    );
    obj.setPropertyDescription(
      'destroyMessage',
      'Message displayed when an item is destroyed',
    );
  }

  async registerAliases(): Promise<void> {
    console.log('[DisposalBuilder] Type \'disposal\' auto-aliased');
  }
}

// Self-register
registerBuilder(DisposalBuilder);
