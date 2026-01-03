import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Turret prototype
 * Rotating weapon mount, installs on $hardpoint
 */
export class TurretBuilder implements Builder {
  static provides = ['turret'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('turret');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('turret', describable, {
        properties: {
          name: 'Turret',
          description: 'A rotating weapon mount',
          mountType: 'turret', // For hardpoint.supportedMounts matching
          hardpoint: null, // objref to parent hardpoint
          weapon: null, // objref to mounted $gun
          arc: [0, 360], // Horizontal firing arc (degrees)
          elevation: [-10, 45], // Vertical arc (degrees)
          rotation: 0, // Current facing (degrees)
          condition: 100,
          damage: 0,
          weight: 20000, // 20kg

          abilities: `Rotating weapon mount. Installs on $hardpoint, holds one $gun.

'arc' = horizontal firing range (degrees). 'elevation' = vertical range.
Set 'weapon' to mount a gun. 'rotation' = current facing.
Damaged turrets rotate slower or jam.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    obj.setMethod(
      'isFunctional',
      `
      /**
       * Check if this turret is functional.
       * @returns true if turret can rotate and fire, false otherwise
       */
      const condition = self.condition ?? 100;
      const damage = self.damage ?? 0;
      return condition > 20 && damage < 80;
    `,
    );

    obj.setMethod(
      'takeDamage',
      `
      /**
       * Apply damage to this turret.
       * @param amount - Amount of damage to apply (0-100 scale)
       */
      const amount = args[0] ?? 0;
      self.damage = Math.min(100, (self.damage ?? 0) + amount);
      if (self.damage > 50) {
        const conditionLoss = (self.damage - 50) * 0.5;
        self.condition = Math.max(0, (self.condition ?? 100) - conditionLoss);
      }
      return { damage: self.damage, condition: self.condition };
    `,
    );

    obj.setPropertyDescription(
      'mountType',
      'Type identifier for hardpoint matching',
    );
    obj.setPropertyDescription(
      'hardpoint',
      'Parent hardpoint this turret is installed on',
    );
    obj.setPropertyDescription('weapon', 'Mounted $gun or null');
    obj.setPropertyDescription(
      'arc',
      'Horizontal firing arc [min, max] in degrees',
    );
    obj.setPropertyDescription(
      'elevation',
      'Vertical firing arc [min, max] in degrees',
    );
    obj.setPropertyDescription(
      'rotation',
      'Current turret facing in degrees (0 = forward)',
    );
    obj.setPropertyDescription(
      'condition',
      'Functional state 0-100. Affects rotation speed.',
    );
    obj.setPropertyDescription(
      'damage',
      'Physical damage 0-100. High damage jams turret.',
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[TurretBuilder] Type 'turret' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TurretBuilder);
