import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the SurgicalKit prototype
 */
export class SurgicalKitBuilder implements Builder {
  static provides = ['surgicalKit'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('surgicalKit');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('surgicalKit', medical, {
        properties: {
          name: 'Surgical Kit',
          description: 'Professional surgical instruments',
          weight: 1500,

          abilities: `Full surgical tools. Scalpels, clamps, retractors, forceps.
Required for bullet extraction, internal repair, amputation.
Needs trained surgeon. Sterile environment preferred. Hours of work.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SurgicalKitBuilder] Type 'surgicalKit' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SurgicalKitBuilder);
