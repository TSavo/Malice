import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Explosive prototype
 * Base for all explosives
 */
export class ExplosiveBuilder implements Builder {
  static provides = ['explosive'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('explosive');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('explosive', describable, {
        properties: {
          name: 'Explosive',
          description: 'An explosive device',
          weight: 500,
          armed: false,
          damage: 100,
          blastRadius: 5,
          contraband: true,

          abilities: `Explodes when triggered. 'damage' at center, decreases with distance.
'blastRadius' in meters. Must be 'armed' to detonate.
Shrapnel, fire, concussion depending on type. Destroys cover.
Contraband - illegal to possess. Can be defused if skilled.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('armed', 'Whether ready to detonate');
      this.obj.setPropertyDescription('damage', 'Damage at blast center');
      this.obj.setPropertyDescription('blastRadius', 'Blast radius in meters');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ExplosiveBuilder] Type 'explosive' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ExplosiveBuilder);
