import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Table prototype
 */
export class TableBuilder implements Builder {
  static provides = ['table'];
  static depends = ['furniture'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('table');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('table', furniture, {
        properties: {
          name: 'Table',
          description: 'A flat surface for placing items',
          weight: 15000,
          surface: [],

          abilities: `Flat surface. Place items on top. Flip for cover.
Items on table are visible and accessible. Can hide under table.
Flipped table provides partial cover but blocks movement.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('surface', 'Array of objrefs to items on the table');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[TableBuilder] Type 'table' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TableBuilder);
