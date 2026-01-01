import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Cigar prototype
 */
export class CigarBuilder implements Builder {
  static provides = ['cigar'];
  static depends = ['smokable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('cigar');
    if (existing) {
      this.obj = existing;
    } else {
      const smokable = await this.manager.load('smokable');
      if (!smokable) throw new Error('Smokable type not found');

      this.obj = await this.manager.define('cigar', smokable, {
        properties: {
          name: 'Cigar',
          description: 'A hand-rolled tobacco cigar',
          portions: 30, // Long smoke
          remaining: 30,
          weight: 20,
          hydration: -10, // More dehydrating
          effects: {
            calm: { intensity: 25, decay: 0.15 },
            focus: { intensity: 10, decay: 0.2 },
            nausea: { intensity: 5, decay: 0.4 }, // If not used to it
          },

          abilities: `Long smoke. ~30 drags. Strong calming effect.

Can cause nausea if unaccustomed. Status symbol. Strong smell.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CigarBuilder] Type 'cigar' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CigarBuilder);
