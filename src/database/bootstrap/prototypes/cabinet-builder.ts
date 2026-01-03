import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Cabinet prototype
 * Storage with doors/drawers
 */
export class CabinetBuilder implements Builder {
  static provides = ['cabinet'];
  static depends = ['furniture', 'pocket'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('cabinet');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('cabinet', furniture, {
        properties: {
          name: 'Cabinet',
          description: 'A storage cabinet with doors',
          weight: 30000,
          open: false,
          lock: null,
          contents: null,

          abilities: `Storage with doors. Open to access contents.
Can be locked. Wall-mounted or freestanding.
Kitchen cabinets, filing cabinets, medicine cabinets - all variations.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('open', 'Whether doors are open');
      this.obj.setPropertyDescription(
        'lock',
        'Objref to lock, null if unlockable',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CabinetBuilder] Type 'cabinet' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CabinetBuilder);
