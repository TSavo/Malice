import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Crowbar prototype
 */
export class CrowbarBuilder implements Builder {
  static provides = ['crowbar'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('crowbar');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('crowbar', tool, {
        properties: {
          name: 'Crowbar',
          description: 'A steel prying bar',
          weight: 1500,

          abilities: `Pry things open. Force doors, crates, windows, locked containers.
Leverage multiplies force. Effective blunt weapon - solid steel.
Leaves obvious pry marks. Loud when forcing things open.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CrowbarBuilder] Type 'crowbar' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CrowbarBuilder);
