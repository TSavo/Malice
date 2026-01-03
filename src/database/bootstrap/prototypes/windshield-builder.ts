import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Windshield prototype
 * Vehicle glass panel - breakable, optional
 */
export class WindshieldBuilder implements Builder {
  static provides = ['windshield'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('windshield');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('windshield', vehiclePart, {
        properties: {
          name: 'Windshield',
          description: 'A vehicle glass panel',
          partType: 'windshield',
          position: 'front', // front, rear, side-left, side-right
          tinted: false,
          bulletResistant: false,
          shattered: false,
          weight: 15000, // 15kg

          abilities: `Vehicle glass panel. Provides visibility and protection.

Breakable - high damage shatters it ('shattered' = true).
'bulletResistant' = armored glass, harder to break.
'tinted' reduces visibility from outside.
Optional - vehicle works without it.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    obj.setPropertyDescription(
      'position',
      'Glass position: front, rear, side-left, side-right',
    );
    obj.setPropertyDescription(
      'tinted',
      'Darkened glass, reduces visibility from outside',
    );
    obj.setPropertyDescription(
      'bulletResistant',
      'Armored glass, harder to break',
    );
    obj.setPropertyDescription(
      'shattered',
      'true when broken, impairs visibility',
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[WindshieldBuilder] Type 'windshield' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(WindshieldBuilder);
