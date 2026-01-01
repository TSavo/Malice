import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the SmokeGrenade prototype
 */
export class SmokeGrenadeBuilder implements Builder {
  static provides = ['smokeGrenade'];
  static depends = ['grenade'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('smokeGrenade');
    if (existing) {
      this.obj = existing;
    } else {
      const grenade = await this.manager.load('grenade');
      if (!grenade) throw new Error('Grenade type not found');

      this.obj = await this.manager.define('smokeGrenade', grenade, {
        properties: {
          name: 'Smoke Grenade',
          description: 'Smoke screen grenade',
          damage: 0,
          blastRadius: 0,
          smokeRadius: 10,
          smokeDuration: 60,
          smokeColor: 'white',

          abilities: `Creates smoke cloud for concealment. Blocks line of sight.
Smoke spreads over seconds, lasts about a minute. Wind disperses faster.
Colored smoke for signaling. Inhaling irritates lungs.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('smokeRadius', 'Radius of smoke cloud in meters');
      this.obj.setPropertyDescription('smokeDuration', 'How long smoke lasts in seconds');
      this.obj.setPropertyDescription('smokeColor', 'Smoke color for signaling');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SmokeGrenadeBuilder] Type 'smokeGrenade' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SmokeGrenadeBuilder);
