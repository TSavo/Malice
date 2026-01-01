import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Armor prototype
 * Protective gear extending wearable
 */
export class ArmorBuilder implements Builder {
  static provides = ['armor'];
  static depends = ['wearable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('armor');
    if (existing) {
      this.obj = existing;
    } else {
      const wearable = await this.manager.load('wearable');
      if (!wearable) throw new Error('Wearable type not found');

      this.obj = await this.manager.define('armor', wearable, {
        properties: {
          name: 'Armor',
          description: 'Protective body armor',
          covers: ['torso'],
          layer: 4,
          protection: 30,
          warmth: 5,
          armorType: 'ballistic',
          condition: 100,
          weight: 5000,

          abilities: `Reduces damage to covered body parts.
'protection' = damage reduction %. 'armorType' = what it stops (ballistic, stab, blunt).
Ballistic stops bullets, stab stops blades, blunt stops impacts.
Condition degrades when hit. Damaged armor protects less. Heavy armor slows movement.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('armorType', 'Protection type: ballistic, stab, blunt, or composite');
      this.obj.setPropertyDescription('condition', 'Armor integrity 0-100, degrades when hit');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ArmorBuilder] Type 'armor' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ArmorBuilder);
