import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Antibiotics prototype
 */
export class AntibioticsBuilder implements Builder {
  static provides = ['antibiotics'];
  static depends = ['pill'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('antibiotics');
    if (existing) {
      this.obj = existing;
    } else {
      const pill = await this.manager.load('pill');
      if (!pill) throw new Error('Pill type not found');

      this.obj = await this.manager.define('antibiotics', pill, {
        properties: {
          name: 'Antibiotics',
          description: 'Infection-fighting medication',
          weight: 20,
          doses: 14,

          abilities: `Fights bacterial infection. Must complete full course.
Take for infected wounds, illness. Stopping early creates resistance.
Won't work on viruses. Takes days to clear infection.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('doses', 'Doses remaining in course');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[AntibioticsBuilder] Type 'antibiotics' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AntibioticsBuilder);
