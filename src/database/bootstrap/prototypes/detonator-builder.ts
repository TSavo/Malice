import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Detonator prototype
 */
export class DetonatorBuilder implements Builder {
  static provides = ['detonator'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('detonator');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('detonator', tool, {
        properties: {
          name: 'Detonator',
          description: 'Remote detonation trigger',
          weight: 100,
          linkedExplosives: [],
          range: 100,
          armed: false,

          abilities: `Triggers explosives remotely. Radio, cell phone, or wired.
Link to C4, mines, IEDs. Press button to detonate all linked.
Range limited - signal can be jammed. Wired is reliable but obvious.
Safety prevents accidental trigger. Multiple channels available.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'linkedExplosives',
        'Array of objrefs to linked explosives',
      );
      this.obj.setPropertyDescription(
        'range',
        'Maximum detonation range in meters',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[DetonatorBuilder] Type 'detonator' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(DetonatorBuilder);
