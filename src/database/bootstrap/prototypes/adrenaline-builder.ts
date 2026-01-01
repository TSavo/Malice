import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Adrenaline prototype
 */
export class AdrenalineBuilder implements Builder {
  static provides = ['adrenaline'];
  static depends = ['drug'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('adrenaline');
    if (existing) {
      this.obj = existing;
    } else {
      const drug = await this.manager.load('drug');
      if (!drug) throw new Error('Drug type not found');

      this.obj = await this.manager.define('adrenaline', drug, {
        properties: {
          name: 'Adrenaline Shot',
          description: 'Epinephrine auto-injector',
          weight: 20,
          effects: {
            alertness: { intensity: 50, decay: 0.3 },
            heartRate: { intensity: 40, decay: 0.2 },
          },

          abilities: `Emergency stimulant. Revives from shock, counters allergic reaction.
Inject to heart in cardiac arrest. Instant surge of energy.
Wears off hard - crash afterwards. Can cause heart attack if overused.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[AdrenalineBuilder] Type 'adrenaline' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AdrenalineBuilder);
