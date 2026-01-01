import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the GrapplingHook prototype
 * Tool for climbing and accessing elevated areas
 */
export class GrapplingHookBuilder implements Builder {
  static provides = ['grapplingHook'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('grapplingHook');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('grapplingHook', describable, {
        properties: {
          name: 'Grappling Hook',
          description: 'A metal hook with rope for climbing',
          weight: 2000, // grams
          ropeLength: 30, // meters

          abilities: `Climb between z-levels. Throw to anchor point, climb rope.

30m rope = 10 z-levels. Needs anchor point (ledge, railing, window).
Requires arm calories to climb. Loud on impact. Can fail if anchor breaks. Retrievable.`,
        },
        methods: {},
      });
    }

    this.obj.setPropertyDescription('ropeLength', 'Max climb height in meters');
  }

  async registerAliases(): Promise<void> {
    console.log("[GrapplingHookBuilder] Type 'grapplingHook' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(GrapplingHookBuilder);
