import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Drug prototype
 * Base for substances with effects (pills, injectables, etc.)
 */
export class DrugBuilder implements Builder {
  static provides = ['drug'];
  static depends = ['edible'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('drug');
    if (existing) {
      this.obj = existing;
    } else {
      const edible = await this.manager.load('edible');
      if (!edible) throw new Error('Edible type not found');

      this.obj = await this.manager.define('drug', edible, {
        properties: {
          name: 'Drug',
          description: 'A substance with pharmacological effects',
          calories: 0,
          hydration: 0,
          portions: 1,
          remaining: 1,
          weight: 5,
          contraband: true, // Most drugs are illegal
          addictive: false,
          overdoseThreshold: 3, // Doses before overdose risk

          abilities: `Substance with effects. Consumed for effect, not nutrition.

'effects' property defines what happens. 'addictive' causes withdrawal.
Multiple doses risk overdose at 'overdoseThreshold'. Contraband if illegal.`,
        },
        methods: {},
      });
    }

    this.obj.setPropertyDescription('contraband', 'Illegal to possess');
    this.obj.setPropertyDescription('addictive', 'Causes withdrawal if stopped');
    this.obj.setPropertyDescription('overdoseThreshold', 'Doses before overdose risk');
  }

  async registerAliases(): Promise<void> {
    console.log("[DrugBuilder] Type 'drug' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(DrugBuilder);
