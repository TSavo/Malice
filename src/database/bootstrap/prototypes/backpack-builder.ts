import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Backpack prototype
 * Wearable container for carrying items
 */
export class BackpackBuilder implements Builder {
  static provides = ['backpack'];
  static depends = ['pocket', 'wearable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('backpack');
    if (existing) {
      this.obj = existing;
    } else {
      const pocket = await this.manager.load('pocket');
      if (!pocket) throw new Error('Pocket type not found');

      this.obj = await this.manager.define('backpack', pocket, {
        properties: {
          name: 'Backpack',
          description: 'A bag worn on the back',
          maxWeight: 15000,
          maxVolume: 30000,
          wearLocation: 'back',
          worn: false,

          abilities: `Wearable storage. Wear on back, hands stay free.
Access contents while worn. Slows running slightly when heavy.
Can be cut off or grabbed from behind. Waterproof ones exist.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('worn', 'Whether currently being worn');
      this.obj.setPropertyDescription('wearLocation', 'Body slot: back');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[BackpackBuilder] Type 'backpack' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BackpackBuilder);
