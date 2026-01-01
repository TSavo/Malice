import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Trunk prototype
 * Lockable storage chest
 */
export class TrunkBuilder implements Builder {
  static provides = ['trunk'];
  static depends = ['furniture', 'pocket', 'lock'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('trunk');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('trunk', furniture, {
        properties: {
          name: 'Trunk',
          description: 'A sturdy storage chest',
          weight: 15000,
          open: false,
          lock: null,
          contents: null,

          abilities: `Hinged chest with lid. Open to access contents.
'lock' holds a $lock object - must unlock before opening.
Sturdy construction. Can sit on when closed. 
Can be carried when empty (heavy when full).`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('open', 'Whether lid is open');
      this.obj.setPropertyDescription('lock', 'Objref to lock object, null if unlocked');
      this.obj.setPropertyDescription('contents', 'Pocket objref for stored items');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[TrunkBuilder] Type 'trunk' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TrunkBuilder);
