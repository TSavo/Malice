import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the FragGrenade prototype
 */
export class FragGrenadeBuilder implements Builder {
  static provides = ['fragGrenade'];
  static depends = ['grenade'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('fragGrenade');
    if (existing) {
      this.obj = existing;
    } else {
      const grenade = await this.manager.load('grenade');
      if (!grenade) throw new Error('Grenade type not found');

      this.obj = await this.manager.define('fragGrenade', grenade, {
        properties: {
          name: 'Frag Grenade',
          description: 'Fragmentation grenade',
          damage: 150,
          blastRadius: 15,

          abilities: `Shrapnel grenade. Lethal fragments spray in all directions.
Kills in 5m, wounds out to 15m. Fragments penetrate light cover.
Bounce off hard surfaces. Devastating in enclosed spaces.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[FragGrenadeBuilder] Type 'fragGrenade' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FragGrenadeBuilder);
