import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Trap prototype
 * Triggered hazard device
 */
export class TrapBuilder implements Builder {
  static provides = ['trap'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('trap');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('trap', describable, {
        properties: {
          name: 'Trap',
          description: 'A triggered hazard',
          armed: false,
          triggered: false,
          trapType: 'tripwire',
          damage: 50,
          hidden: true,
          weight: 500,

          abilities: `Triggers when victim enters or touches. Types: tripwire, pressure plate, proximity.
When triggered, causes effect based on type - damage, alarm, net, etc.
Must be armed to trigger. Can be detected if looking carefully.
Disarming requires care - failed attempt triggers trap.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'armed',
        'Whether trap is ready to trigger',
      );
      this.obj.setPropertyDescription(
        'trapType',
        'Type: tripwire, pressure, proximity',
      );
      this.obj.setPropertyDescription('hidden', 'Whether trap is concealed');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[TrapBuilder] Type 'trap' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TrapBuilder);
