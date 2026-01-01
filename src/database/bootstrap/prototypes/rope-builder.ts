import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Rope prototype
 */
export class RopeBuilder implements Builder {
  static provides = ['rope'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('rope');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('rope', tool, {
        properties: {
          name: 'Rope',
          description: 'A coil of rope',
          weight: 2000,
          length: 15, // meters

          abilities: `Tie, bind, climb, lower. 15m standard length.
Tie people up, secure loads, climb down, make snares.
Can be cut. Wet rope is weaker. Knot skill affects security.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('length', 'Length in meters');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[RopeBuilder] Type 'rope' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(RopeBuilder);
