import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Morphine prototype
 */
export class MorphineBuilder implements Builder {
  static provides = ['morphine'];
  static depends = ['drug'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('morphine');
    if (existing) {
      this.obj = existing;
    } else {
      const drug = await this.manager.load('drug');
      if (!drug) throw new Error('Drug type not found');

      this.obj = await this.manager.define('morphine', drug, {
        properties: {
          name: 'Morphine',
          description: 'A powerful opioid painkiller',
          weight: 10,
          addictive: true,
          contraband: true,
          effects: {
            pain: { intensity: -80, decay: 0.05 },
            drowsy: { intensity: 40, decay: 0.1 },
          },

          abilities: `Eliminates severe pain. Inject for immediate effect.
Highly addictive. Causes drowsiness, slowed reactions.
Overdose causes respiratory failure. Controlled substance.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[MorphineBuilder] Type 'morphine' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(MorphineBuilder);
