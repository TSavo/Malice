import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Desk prototype
 */
export class DeskBuilder implements Builder {
  static provides = ['desk'];
  static depends = ['table'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('desk');
    if (existing) {
      this.obj = existing;
    } else {
      const table = await this.manager.load('table');
      if (!table) throw new Error('Table type not found');

      this.obj = await this.manager.define('desk', table, {
        properties: {
          name: 'Desk',
          description: 'A work surface with drawers',
          weight: 25000,
          drawers: [],
          locked: false,

          abilities: `Work surface with storage. Drawers can hold items, may be locked.
Heavier than table, harder to flip. Solid front provides better cover.
Knee space underneath - can hide there.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('drawers', 'Array of drawer contents');
      this.obj.setPropertyDescription('locked', 'Whether drawers are locked');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[DeskBuilder] Type 'desk' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(DeskBuilder);
