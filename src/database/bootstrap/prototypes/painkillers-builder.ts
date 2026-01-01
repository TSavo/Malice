import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Painkillers prototype
 */
export class PainkillersBuilder implements Builder {
  static provides = ['painkillers'];
  static depends = ['pill'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('painkillers');
    if (existing) {
      this.obj = existing;
    } else {
      const pill = await this.manager.load('pill');
      if (!pill) throw new Error('Pill type not found');

      this.obj = await this.manager.define('painkillers', pill, {
        properties: {
          name: 'Painkillers',
          description: 'Over-the-counter pain relief',
          weight: 20,
          doses: 10,
          effects: {
            pain: { intensity: -30, decay: 0.1 },
          },

          abilities: `Reduces pain. Allows function despite injuries.
Masks pain but doesn't heal. Risk of ignoring serious injury.
Too many damages liver. Takes 20 min to kick in.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('doses', 'Number of doses remaining');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[PainkillersBuilder] Type 'painkillers' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(PainkillersBuilder);
