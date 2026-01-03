import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Mine prototype
 */
export class MineBuilder implements Builder {
  static provides = ['mine'];
  static depends = ['explosive'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('mine');
    if (existing) {
      this.obj = existing;
    } else {
      const explosive = await this.manager.load('explosive');
      if (!explosive) throw new Error('Explosive type not found');

      this.obj = await this.manager.define('mine', explosive, {
        properties: {
          name: 'Mine',
          description: 'Pressure-triggered explosive',
          weight: 2000,
          damage: 180,
          blastRadius: 8,
          triggerWeight: 5,
          buried: false,

          abilities: `Explodes when stepped on. Bury to conceal, or place visible as deterrent.
Trigger weight threshold - won't trigger for small animals.
Can be disarmed carefully. Tripwire variants trigger on contact.
Anti-personnel or anti-vehicle types. Area denial weapon.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('triggerWeight', 'Minimum kg to trigger');
      this.obj.setPropertyDescription(
        'buried',
        'Whether mine is buried/concealed',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[MineBuilder] Type 'mine' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(MineBuilder);
