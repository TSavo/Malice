import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Dollar prototype
 * Physical US currency - illegal contraband in Malice's dystopian Seattle.
 * Inherits from Stackable for merge/split behavior.
 *
 * In the world of Malice, physical cash is:
 * - Contraband: The economy runs on digital credits, physical money is banned
 * - Untraceable: Unlike bank transfers, cash leaves no audit trail
 * - Valuable: Black market premium for anonymity
 * - Dangerous: Possession alone is a crime
 *
 * Usage:
 * - $.recycler.create({ parent: $.dollar.id, properties: { quantity: 500 } })
 * - Stacks auto-merge when in same location
 * - Can be split for transactions
 */
export class DollarBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'US Dollars',
        description:
          'Crumpled bills bearing the faces of dead presidents. In a world of digital credits and biometric banking, physical currency is contraband—anonymous, untraceable, illegal. The paper feels strange, almost archaeological. Each bill represents a crime just by existing in your possession.',
        // Pre-set stackable properties
        stackType: 'cash:usd',
        quantity: 0,
        unit: 'USD',
        // Physical cash is illegal
        contraband: true,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // DISPLAY OVERRIDES
    // ═══════════════════════════════════════════════════════════════════

    // describe - show dollar amount with appropriate formatting
    obj.setMethod(
      'describe',
      `
      const qty = self.quantity || 0;

      let desc = '';

      // Format with dollar sign and commas
      const formatted = '$' + qty.toLocaleString();

      if (qty === 0) {
        desc = 'An empty money clip.';
      } else if (qty < 20) {
        desc = formatted + ' in crumpled singles and fives.';
      } else if (qty < 100) {
        desc = formatted + ' in worn bills.';
      } else if (qty < 1000) {
        desc = formatted + ' in mixed denominations.';
      } else if (qty < 10000) {
        desc = formatted + ' in banded stacks.';
      } else {
        desc = formatted + ' in thick bricks of cash.';
      }

      desc += ' [CONTRABAND]';

      return desc;
    `,
    );

    // shortDesc - brief description for inventory lists
    obj.setMethod(
      'shortDesc',
      `
      const qty = self.quantity || 0;
      if (qty === 0) {
        return 'empty money clip';
      }
      return '$' + qty.toLocaleString() + ' cash';
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // NAME VARIATIONS
    // ═══════════════════════════════════════════════════════════════════

    // getName - dynamic name based on quantity
    obj.setMethod(
      'getName',
      `
      const qty = self.quantity || 0;

      if (qty === 0) return 'empty money clip';
      if (qty < 20) return 'a few crumpled bills';
      if (qty < 100) return 'some cash';
      if (qty < 1000) return 'a roll of bills';
      if (qty < 10000) return 'a stack of cash';
      return 'a brick of cash';
    `,
    );

    return obj;
  }
}
