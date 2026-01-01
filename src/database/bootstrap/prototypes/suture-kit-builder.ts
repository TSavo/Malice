import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the SutureKit prototype
 */
export class SutureKitBuilder implements Builder {
  static provides = ['sutureKit'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('sutureKit');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('sutureKit', medical, {
        properties: {
          name: 'Suture Kit',
          description: 'Surgical suturing supplies',
          weight: 50,
          stitches: 10,

          abilities: `Close deep wounds with stitches. Needle and thread for flesh.
Requires skill - bad stitching causes scarring, reopening, infection.
Each wound uses 1-3 stitches depending on size. Painful without anesthetic.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('stitches', 'Number of sutures remaining');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SutureKitBuilder] Type 'sutureKit' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SutureKitBuilder);
