import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Grenade prototype
 * Base throwable explosive
 */
export class GrenadeBuilder implements Builder {
  static provides = ['grenade'];
  static depends = ['explosive'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('grenade');
    if (existing) {
      this.obj = existing;
    } else {
      const explosive = await this.manager.load('explosive');
      if (!explosive) throw new Error('Explosive type not found');

      this.obj = await this.manager.define('grenade', explosive, {
        properties: {
          name: 'Grenade',
          description: 'A hand grenade',
          weight: 400,
          fuseTime: 4,
          pinPulled: false,

          abilities: `Pull pin, throw, explodes after fuse time. 4 second fuse standard.
Can cook (hold after pulling pin) for shorter enemy reaction time.
Cook too long = explodes in hand. Can be thrown back if quick.
Bounces off walls. Roll under doors, through windows.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'fuseTime',
        'Seconds until detonation after pin pull',
      );
      this.obj.setPropertyDescription(
        'pinPulled',
        'Whether pin has been pulled',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[GrenadeBuilder] Type 'grenade' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(GrenadeBuilder);
