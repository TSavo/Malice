import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Mechanic type
 * An NPC specialized in vehicle repair.
 * Inherits from $human, uses $aiPrompts.mechanic for AI behavior.
 */
export class MechanicBuilder implements Builder {
  static provides = ['mechanic'];
  static depends = ['human', 'aiPrompts'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('mechanic');
    if (existing) {
      this.obj = existing;
      return;
    }

    // Get parent type
    const human = await this.manager.load('human');
    if (!human) {
      throw new Error('Human type not found - required for Mechanic');
    }

    // Load mechanic prompt from $aiPrompts
    const objectManager = await this.manager.load(0);
    const aliases =
      (objectManager?.get('aliases') as Record<string, number>) || {};
    const aiPrompts = aliases.aiPrompts
      ? await this.manager.load(aliases.aiPrompts)
      : null;
    const systemPrompt =
      (aiPrompts?.get('mechanic') as string) ||
      '# Mechanic Prompt\n\nYou are a vehicle mechanic.';

    this.obj = await this.manager.define('mechanic', human, {
      properties: {
        name: 'Mechanic',
        description:
          'A weathered mechanic with oil-stained hands and calloused fingers.',
        occupation: 'mechanic',
        // AI system prompt loaded from docs/prompts/MECHANIC.md
        agentSystemPrompt: systemPrompt,

        abilities: `Vehicle mechanic. Expert in diagnosing problems, repairing damage, installing/removing parts, refueling, and hotwiring vehicles.

DIAGNOSE: Inspects vehicle parts - checks condition and damage levels. Identifies what's broken and what needs work.

REPAIR: Reduces part damage, increases condition. Requires tools (found in garages). Charges for labor.

PARTS: Can install and remove vehicle parts - engines, wheels, batteries, fuel tanks, transmissions. Knows compatibility.

REFUEL: Can refuel vehicles from fuel pumps. Knows fuel types.

HOTWIRE: Can hotwire vehicles... for a price. Doesn't ask questions if the payment is right. Risk premium for obviously stolen vehicles.

PERSONALITY: Practical, no-nonsense. Speaks in mechanical terms. Charges for everything - nothing's free. Not a fighter - complies or flees if threatened.`,
      },
      methods: {},
    });

    // Property descriptions
    this.obj.setPropertyDescription(
      'occupation',
      'This person works as a vehicle mechanic',
    );
    this.obj.setPropertyDescription(
      'agentSystemPrompt',
      'AI system prompt defining mechanic behavior (from docs/prompts/MECHANIC.md)',
    );
    this.obj.setPropertyDescription(
      'abilities',
      'What this mechanic can do - diagnose, repair, parts, fuel, hotwire',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name
    if (!this.obj) return;
    console.log(`[MechanicBuilder] Type 'mechanic' auto-aliased`);
  }
}

// Self-register
registerBuilder(MechanicBuilder);
