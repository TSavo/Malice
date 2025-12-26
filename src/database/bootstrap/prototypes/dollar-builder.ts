import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Dollar prototype
 * Physical US currency - illegal contraband in Malice's dystopian Seattle.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - Abilities describe how physical cash works for AI interpretation
 * - Cash is contraband - possession is a crime
 * - Use $.cash utility for taking/giving cash to players
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
        // Abilities - physical cash for AI interpretation
        abilities: `Physical US currency - illegal contraband in this world.

POSSESSION: Having cash is a crime. Police will confiscate and arrest. Hide it well. The 'contraband' property marks this as illegal.

VALUE: The 'quantity' property is the dollar amount. Cash stacks automatically merge when in same location.

HANDLING: Cash can be held in hand, stored in pockets, hidden in containers. Use $cash utility:
- $cash.find(player) - locate all cash on a player
- $cash.has(player, amount) - check if player has enough
- $cash.take(player, amount) - remove cash from player
- $cash.give(player, amount) - add cash to player
- $cash.transfer(from, to, amount) - move cash between players

TRANSACTIONS: Some vendors accept cash (currency='cash'). Black market prefers cash for anonymity. Cash leaves no audit trail unlike bank transfers.

SPLITTING: To give partial amount, take the full stack and give the remainder back.

ANONYMITY: Cash cannot be traced. Unlike bank credits, no transaction history exists.`,
      },
      methods: {},
    });

    // Add property descriptions
    obj.setPropertyDescription('quantity', "Dollar amount in this stack. Integer only.");
    obj.setPropertyDescription('contraband', "True = illegal to possess. Police will confiscate.");
    obj.setPropertyDescription('stackType', "Identifies this as cash for auto-stacking.");

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
