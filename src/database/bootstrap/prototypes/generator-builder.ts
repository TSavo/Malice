import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Generator prototype
 * Portable power source
 */
export class GeneratorBuilder implements Builder {
  static provides = ['generator'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('generator');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('generator', describable, {
        properties: {
          name: 'Generator',
          description: 'A portable fuel-powered generator',
          running: false,
          fuel: 100,
          output: 5000, // watts
          weight: 25000,

          abilities: `Produces electricity from fuel. Powers devices, lights, tools.
Loud when running - audible from adjacent rooms. Exhaust fumes dangerous indoors.
Consumes fuel while running. Can be connected to building power grid.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'running',
        'Whether generator is running',
      );
      this.obj.setPropertyDescription('fuel', 'Fuel level 0-100');
      this.obj.setPropertyDescription('output', 'Power output in watts');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[GeneratorBuilder] Type 'generator' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(GeneratorBuilder);
