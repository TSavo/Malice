import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Handcuffs prototype
 * Restraint device
 */
export class HandcuffsBuilder implements Builder {
  static provides = ['handcuffs'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('handcuffs');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('handcuffs', describable, {
        properties: {
          name: 'Handcuffs',
          description: 'Metal restraints for wrists',
          locked: false,
          target: null,
          weight: 250,

          abilities: `Restrains wrists together. Requires key or pick to remove.
Target can't use hands while cuffed. Can cuff to objects (pipes, rails).
Struggling causes wrist damage. Can be cut with bolt cutters.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('locked', 'Whether cuffs are locked');
      this.obj.setPropertyDescription('target', 'Objref to restrained person');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[HandcuffsBuilder] Type 'handcuffs' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(HandcuffsBuilder);
