import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Tourniquet prototype
 */
export class TourniquetBuilder implements Builder {
  static provides = ['tourniquet'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('tourniquet');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('tourniquet', medical, {
        properties: {
          name: 'Tourniquet',
          description: 'A blood flow restrictor',
          weight: 50,
          applied: false,
          appliedTo: null,

          abilities: `Stops arterial bleeding on limbs. Tighten to cut blood flow.
Prevents bleed-out from severe limb wounds. Limb dies if left too long.
Must be loosened periodically or amputate. Last resort measure.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('applied', 'Whether currently in use');
      this.obj.setPropertyDescription('appliedTo', 'Which limb it is on');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[TourniquetBuilder] Type 'tourniquet' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TourniquetBuilder);
