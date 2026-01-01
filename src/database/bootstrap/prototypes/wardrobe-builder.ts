import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Wardrobe prototype
 * Large cabinet that opens/closes, can hide inside
 */
export class WardrobeBuilder implements Builder {
  static provides = ['wardrobe'];
  static depends = ['furniture', 'pocket'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('wardrobe');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('wardrobe', furniture, {
        properties: {
          name: 'Wardrobe',
          description: 'A tall cabinet for storing clothes',
          weight: 60000,
          open: false,
          contents: null, // pocket objref
          hiddenOccupant: null,

          abilities: `Tall cabinet with doors. Open to access contents or hide inside.
Stores clothing and items. Person can hide inside if empty enough.
Doors creak when opened. Can be locked with padlock on handles.
Hiding inside - can't see out, limited air, heard if moving.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('open', 'Whether doors are open');
      this.obj.setPropertyDescription('contents', 'Pocket objref for stored items');
      this.obj.setPropertyDescription('hiddenOccupant', 'Objref to person hiding inside');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[WardrobeBuilder] Type 'wardrobe' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(WardrobeBuilder);
