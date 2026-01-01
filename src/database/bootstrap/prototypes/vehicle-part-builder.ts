import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the VehiclePart prototype
 * Base prototype for all vehicle parts (engine, wheels, battery, etc.)
 */
export class VehiclePartBuilder implements Builder {
  static provides = ['vehiclePart'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('vehiclePart');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('vehiclePart', describable, {
        properties: {
          name: 'Vehicle Part',
          description: 'A component that can be installed in a vehicle',
          // Part identification
          partType: 'generic', // Matches vehicle.requiredParts entries
          // Condition and damage
          condition: 100, // 0-100, functional state (affects performance)
          damage: 0, // 0-100, physical damage (high damage lowers condition)
          // Physical
          weight: 10000, // grams (10kg default)
          // Installation state
          installed: null, // objref to vehicle when installed, null when loose
          // AI-readable abilities
          abilities: `Vehicle component with condition and damage tracking.

CONDITION: 'condition' (0-100) represents functional state. Higher is better.
Affects part performance. Degrades from use and damage.

DAMAGE: 'damage' (0-100) represents physical damage. Lower is better.
High damage reduces condition. Can be repaired.

FUNCTIONAL: Part is functional if condition > 20 AND damage < 80.
Non-functional parts may prevent vehicle from starting if required.

INSTALLATION: 'installed' points to vehicle when installed, null when loose.
Parts can be installed/removed when vehicle is parked.

REPAIR: Repairing increases condition and/or reduces damage.
May require tools, skills, or resources.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Check if part is functional
    obj.setMethod(
      'isFunctional',
      `
      /**
       * Check if this part is functional enough to operate.
       * @returns true if part can function, false otherwise
       */
      const condition = self.condition ?? 100;
      const damage = self.damage ?? 0;
      return condition > 20 && damage < 80;
    `,
    );

    // Take damage
    obj.setMethod(
      'takeDamage',
      `
      /**
       * Apply damage to this part.
       * @param amount - Amount of damage to apply (0-100 scale)
       */
      const amount = args[0] ?? 0;

      // Increase damage, cap at 100
      self.damage = Math.min(100, (self.damage ?? 0) + amount);

      // High damage reduces condition
      if (self.damage > 50) {
        const conditionLoss = (self.damage - 50) * 0.5;
        self.condition = Math.max(0, (self.condition ?? 100) - conditionLoss);
      }

      return { damage: self.damage, condition: self.condition };
    `,
    );

    // Repair part
    obj.setMethod(
      'repair',
      `
      /**
       * Repair this part, improving condition and/or reducing damage.
       * @param conditionAmount - Amount to restore condition (optional)
       * @param damageRepair - Amount of damage to fix (optional)
       */
      const conditionAmount = args[0] ?? 0;
      const damageRepair = args[1] ?? 0;

      // Improve condition
      if (conditionAmount > 0) {
        self.condition = Math.min(100, (self.condition ?? 100) + conditionAmount);
      }

      // Reduce damage
      if (damageRepair > 0) {
        self.damage = Math.max(0, (self.damage ?? 0) - damageRepair);
      }

      return { damage: self.damage, condition: self.condition };
    `,
    );

    // Describe the part
    obj.setMethod(
      'describe',
      `
      const condition = self.condition ?? 100;
      const damage = self.damage ?? 0;

      let state = '';
      if (damage > 80) state = ' (severely damaged)';
      else if (damage > 50) state = ' (damaged)';
      else if (damage > 20) state = ' (worn)';
      else if (condition < 50) state = ' (degraded)';
      else if (condition < 80) state = ' (used)';

      const installed = self.installed
        ? \` [installed in \${self.installed.name}]\`
        : '';

      return \`\${self.name}\${state}\${installed}\\r\\n\${self.description}\`;
    `,
    );

    // Short description
    obj.setMethod(
      'shortDesc',
      `
      const damage = self.damage ?? 0;
      let state = '';
      if (damage > 50) state = ' (damaged)';
      else if (damage > 20) state = ' (worn)';
      return self.name + state;
    `,
    );

    // Set property descriptions for AI
    obj.setPropertyDescription(
      'condition',
      'Functional state 0-100. Higher is better. Affects performance.',
    );
    obj.setPropertyDescription(
      'damage',
      'Physical damage 0-100. Lower is better. High damage impairs function.',
    );
    obj.setPropertyDescription(
      'partType',
      'Category string matching vehicle requiredParts (e.g., "engine", "wheel").',
    );
    obj.setPropertyDescription(
      'installed',
      'Objref to vehicle when installed, null when loose/in inventory.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(VehiclePartBuilder);
