import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the BoltCutters prototype
 */
export class BoltCuttersBuilder implements Builder {
  static provides = ['boltCutters'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('boltCutters');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('boltCutters', tool, {
        properties: {
          name: 'Bolt Cutters',
          description: 'Heavy-duty bolt cutters',
          weight: 3000,

          abilities: `Cut through padlocks, chains, bolts, fences. Long handles for leverage.
Snaps most padlocks instantly. Cut chain-link fence quickly.
Too large to conceal easily. Obvious tool for break-ins.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[BoltCuttersBuilder] Type 'boltCutters' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BoltCuttersBuilder);
