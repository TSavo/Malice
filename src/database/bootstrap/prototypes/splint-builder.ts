import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Splint prototype
 */
export class SplintBuilder implements Builder {
  static provides = ['splint'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('splint');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('splint', medical, {
        properties: {
          name: 'Splint',
          description: 'A bone immobilization splint',
          weight: 100,
          applied: false,

          abilities: `Immobilizes broken bones. Prevents further damage during movement.
Apply to fracture, secure with bandages. Allows limited mobility.
Not a fix - just stabilizes until proper medical care. Improvise from sticks.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('applied', 'Whether currently in use');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SplintBuilder] Type 'splint' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SplintBuilder);
