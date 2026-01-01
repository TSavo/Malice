import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Flashbang prototype
 */
export class FlashbangBuilder implements Builder {
  static provides = ['flashbang'];
  static depends = ['grenade'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('flashbang');
    if (existing) {
      this.obj = existing;
    } else {
      const grenade = await this.manager.load('grenade');
      if (!grenade) throw new Error('Grenade type not found');

      this.obj = await this.manager.define('flashbang', grenade, {
        properties: {
          name: 'Flashbang',
          description: 'Stun grenade',
          damage: 5,
          blastRadius: 10,
          fuseTime: 2,

          abilities: `Blinds and deafens temporarily. Non-lethal but disorienting.
Bright flash blinds for 5-10 seconds. Bang deafens, disrupts balance.
Look away or cover ears to reduce effect. Very loud - heard far away.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[FlashbangBuilder] Type 'flashbang' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FlashbangBuilder);
