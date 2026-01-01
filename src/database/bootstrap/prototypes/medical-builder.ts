import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Medical prototype
 * Base for all medical items
 */
export class MedicalBuilder implements Builder {
  static provides = ['medical'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('medical');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('medical', describable, {
        properties: {
          name: 'Medical Item',
          description: 'A medical supply',
          weight: 100,
          sterile: true,

          abilities: `Medical supply for treating injuries and conditions.
Sterile items lose sterility if package opened or contaminated.
Using non-sterile items risks infection. Skill affects effectiveness.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('sterile', 'Whether item is uncontaminated');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[MedicalBuilder] Type 'medical' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(MedicalBuilder);
