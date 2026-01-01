import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the BloodBag prototype
 */
export class BloodBagBuilder implements Builder {
  static provides = ['bloodBag'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('bloodBag');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('bloodBag', medical, {
        properties: {
          name: 'Blood Bag',
          description: 'A unit of stored blood',
          weight: 500,
          bloodType: 'O-',
          expired: false,

          abilities: `Replaces blood loss from injury. Must match blood type or use O-.
Requires IV setup to transfuse. Wrong type causes fatal reaction.
Must be refrigerated or expires. Takes time to transfuse.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('bloodType', 'A+, A-, B+, B-, AB+, AB-, O+, O-');
      this.obj.setPropertyDescription('expired', 'Whether blood has gone bad');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[BloodBagBuilder] Type 'bloodBag' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BloodBagBuilder);
