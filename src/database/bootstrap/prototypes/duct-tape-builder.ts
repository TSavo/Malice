import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the DuctTape prototype
 */
export class DuctTapeBuilder implements Builder {
  static provides = ['ductTape'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('ductTape');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('ductTape', tool, {
        properties: {
          name: 'Duct Tape',
          description: 'A roll of duct tape',
          weight: 300,
          remaining: 100,

          abilities: `Universal fix-all. Bind, seal, repair, silence.
Tape mouths shut, bind wrists, patch holes, secure items.
Sticky residue remains. Can be torn by hand. Weakens when wet.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('remaining', 'Percentage of tape left on roll');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[DuctTapeBuilder] Type 'ductTape' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(DuctTapeBuilder);
