import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the RiotShield prototype
 */
export class RiotShieldBuilder implements Builder {
  static provides = ['riotShield'];
  static depends = ['armor'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('riotShield');
    if (existing) {
      this.obj = existing;
    } else {
      const armor = await this.manager.load('armor');
      if (!armor) throw new Error('Armor type not found');

      this.obj = await this.manager.define('riotShield', armor, {
        properties: {
          name: 'Riot Shield',
          description: 'A large ballistic shield',
          covers: [],
          protection: 60,
          armorType: 'composite',
          weight: 6000,
          held: true,

          abilities: `Handheld ballistic shield. Covers front of body when held.
Blocks bullets, blades, thrown objects. Clear window to see through.
Occupies one hand. Heavy. Can bash with shield edge.
Useless from behind or sides. Fatiguing to hold up.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('held', 'Shield must be held, not worn');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[RiotShieldBuilder] Type 'riotShield' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(RiotShieldBuilder);
