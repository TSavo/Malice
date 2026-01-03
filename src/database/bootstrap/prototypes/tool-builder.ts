import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Tool prototype
 * Base for all tools
 */
export class ToolBuilder implements Builder {
  static provides = ['tool'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('tool');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('tool', describable, {
        properties: {
          name: 'Tool',
          description: 'A handheld tool',
          weight: 500,
          condition: 100,

          abilities: `Handheld implement for tasks. Condition degrades with use.
Most tools can double as improvised weapons. Metal tools conduct electricity.
Quality affects effectiveness. Broken tools may injure user.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'condition',
        'Tool condition 0-100, degrades with use',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ToolBuilder] Type 'tool' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ToolBuilder);
