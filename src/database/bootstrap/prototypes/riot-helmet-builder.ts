import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the RiotHelmet prototype
 */
export class RiotHelmetBuilder implements Builder {
  static provides = ['riotHelmet'];
  static depends = ['helmet'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('riotHelmet');
    if (existing) {
      this.obj = existing;
    } else {
      const helmet = await this.manager.load('helmet');
      if (!helmet) throw new Error('Helmet type not found');

      this.obj = await this.manager.define('riotHelmet', helmet, {
        properties: {
          name: 'Riot Helmet',
          description: 'Full-face riot control helmet',
          covers: ['head', 'face'],
          protection: 30,
          armorType: 'blunt',
          weight: 1800,
          visorDown: true,

          abilities: `Full face protection with clear visor. Designed for blunt impacts.
Visor protects from thrown objects, spit, chemicals.
Won't stop bullets. Intimidating appearance. Muffles voice.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'visorDown',
        'Whether face visor is lowered',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[RiotHelmetBuilder] Type 'riotHelmet' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(RiotHelmetBuilder);
