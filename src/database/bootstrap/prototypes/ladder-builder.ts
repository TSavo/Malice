import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Ladder prototype
 * Vertical movement between z-levels
 */
export class LadderBuilder implements Builder {
  static provides = ['ladder'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('ladder');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('ladder', describable, {
        properties: {
          name: 'Ladder',
          description: 'A climbing ladder',
          length: 3, // meters, 1 z-level
          portable: true,
          deployed: false,
          weight: 8000,

          abilities: `Climb between z-levels. 3m ladder = 1 z-level.
Must be deployed against wall/edge to use. Portable ladders can be carried.
Fixed ladders are permanently installed. Hands occupied while climbing.
Can be kicked away by someone at top or bottom.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'length',
        'Length in meters. 3m = 1 z-level',
      );
      this.obj.setPropertyDescription(
        'deployed',
        'Whether ladder is set up for climbing',
      );
      this.obj.setPropertyDescription(
        'portable',
        'Whether ladder can be picked up and moved',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[LadderBuilder] Type 'ladder' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(LadderBuilder);
