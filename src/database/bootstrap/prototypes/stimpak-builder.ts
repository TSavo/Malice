import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Stimpak prototype
 * Cyberpunk healing injector
 */
export class StimpakBuilder implements Builder {
  static provides = ['stimpak'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('stimpak');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('stimpak', medical, {
        properties: {
          name: 'Stimpak',
          description: 'Combat healing injector',
          weight: 50,

          abilities: `Rapid healing injection. Jab into wound, nanites do the rest.
Closes wounds, stops bleeding, numbs pain in seconds.
Not for internal injuries or disease. Expensive. Single use.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[StimpakBuilder] Type 'stimpak' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(StimpakBuilder);
