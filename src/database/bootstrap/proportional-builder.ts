import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Proportional object (dynamic ID)
 * Handles proportional message selection based on a value within a range
 *
 * Usage from MOO code:
 *   const msg = await $.proportional.sub(['empty', 'almost empty', 'half full', 'mostly full', 'full'], current, max);
 *
 * Logic:
 * - First message (index 0) is returned ONLY when amount = 0
 * - Last message (index n-1) is returned ONLY when amount = total
 * - Middle messages are distributed evenly across the remaining range (1 to total-1)
 *
 * Example with 5 messages and total=20:
 *   amount=0:     'empty'         (message 0)
 *   amount=1-6:   'almost empty'  (message 1)
 *   amount=7-13:  'half full'     (message 2)
 *   amount=14-19: 'mostly full'   (message 3)
 *   amount=20:    'full'          (message 4)
 *
 * The middle 3 messages divide range 1-19 (19 values) into 3 buckets of ~6.33 each.
 */
export class ProportionalBuilder {
  private proportional: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.proportional) {
      this.proportional = await this.manager.load(aliases.proportional);
      if (this.proportional) return; // Already exists
    }

    // Create new Proportional
    this.proportional = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Proportional',
        description: 'Proportional message selection system',
      },
      methods: {},
    });

    // Main selection method
    // sub(messages, amount, total)
    // Returns the message at the appropriate index based on proportion
    //
    // Logic:
    // - messages[0] ONLY when amount = 0
    // - messages[n-1] ONLY when amount = total
    // - messages[1..n-2] distributed evenly across range (1 to total-1)
    //
    // Example: 5 messages, total=20
    // - amount=0: messages[0] "empty"
    // - amount=1-6: messages[1] "almost empty"
    // - amount=7-13: messages[2] "half"
    // - amount=14-19: messages[3] "mostly full"
    // - amount=20: messages[4] "full"
    this.proportional.setMethod('sub', `
      const messages = args[0];
      const amount = args[1];
      const total = args[2];

      // Validate inputs
      if (!Array.isArray(messages) || messages.length === 0) {
        return '';
      }
      if (messages.length === 1) {
        return messages[0];
      }

      const count = messages.length;
      const safeAmount = Math.max(0, Math.min(amount || 0, total || 1));
      const safeTotal = Math.max(1, total || 1);

      // Special case: exactly 0 -> first message
      if (safeAmount === 0) {
        return messages[0];
      }

      // Special case: exactly at max -> last message
      if (safeAmount >= safeTotal) {
        return messages[count - 1];
      }

      // Only 2 messages: 0 -> first, total -> last, anything in between -> first
      if (count === 2) {
        return messages[0];
      }

      // For middle messages (indices 1 to count-2), divide range (1, total-1) evenly
      // Number of middle messages = count - 2
      const middleCount = count - 2;

      // Range of values to distribute: 1 to total-1 (inclusive)
      // That's (total - 1) values to distribute across middleCount buckets
      const rangeSize = safeTotal - 1; // e.g., 19 for total=20
      const bucketSize = rangeSize / middleCount; // e.g., 19/3 = 6.33

      // Which bucket does (amount - 1) fall into? (subtract 1 because range starts at 1)
      const bucketIndex = Math.floor((safeAmount - 1) / bucketSize);

      // Clamp to valid middle range and add 1 (since middle starts at index 1)
      const index = Math.min(bucketIndex, middleCount - 1) + 1;

      return messages[index];
    `);

    // Variant that returns the index instead of the message
    this.proportional.setMethod('index', `
      const messages = args[0];
      const amount = args[1];
      const total = args[2];

      if (!Array.isArray(messages) || messages.length === 0) {
        return 0;
      }
      if (messages.length === 1) {
        return 0;
      }

      const count = messages.length;
      const safeAmount = Math.max(0, Math.min(amount || 0, total || 1));
      const safeTotal = Math.max(1, total || 1);

      if (safeAmount === 0) {
        return 0;
      }
      if (safeAmount >= safeTotal) {
        return count - 1;
      }
      if (count === 2) {
        return 0;
      }

      const middleCount = count - 2;
      const rangeSize = safeTotal - 1;
      const bucketSize = rangeSize / middleCount;
      const bucketIndex = Math.floor((safeAmount - 1) / bucketSize);
      return Math.min(bucketIndex, middleCount - 1) + 1;
    `);

    // Percentage helper - returns which message for a given percentage (0-100)
    this.proportional.setMethod('fromPercent', `
      const messages = args[0];
      const percent = args[1];

      return await self.sub(messages, percent, 100);
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.proportional) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.proportional = this.proportional.id;
    objectManager.set('aliases', aliases);

    console.log(`✅ Registered proportional alias -> #${this.proportional.id}`);
  }
}
