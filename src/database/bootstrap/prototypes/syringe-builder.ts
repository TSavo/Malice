import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Syringe prototype
 */
export class SyringeBuilder implements Builder {
  static provides = ['syringe'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('syringe');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('syringe', medical, {
        properties: {
          name: 'Syringe',
          description: 'A hypodermic syringe',
          weight: 10,
          contents: null,
          used: false,

          abilities: `Inject substances directly into bloodstream. Instant effect.
Fill from vial or bottle. Reusing dirty needles risks disease.
Can inject willing or restrained targets. Air bubbles lethal.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('contents', 'What substance is loaded');
      this.obj.setPropertyDescription('used', 'Whether needle has been used');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SyringeBuilder] Type 'syringe' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SyringeBuilder);
