import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Bandage prototype
 */
export class BandageBuilder implements Builder {
  static provides = ['bandage'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('bandage');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('bandage', medical, {
        properties: {
          name: 'Bandage',
          description: 'A sterile bandage',
          weight: 30,

          abilities: `Covers and protects wounds. Stops minor bleeding.
Apply to wound to prevent infection and aid healing.
Must be changed when soaked through. Single use.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[BandageBuilder] Type 'bandage' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BandageBuilder);
