import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Subdermal Armor prototype
 * Carbon fiber mesh implanted beneath the skin
 */
export class SubdermalArmorBuilder implements Builder {
  static provides = ['subdermalArmor'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('subdermalArmor');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('subdermalArmor', cyberware, {
        properties: {
          name: 'Subdermal Armor',
          description: 'Carbon fiber mesh implanted beneath the skin',
          weight: 5000,
          slot: 'skin',
          armorRating: 2,
          coverage: 100,

          installAbilities: `SUBDERMAL ARMOR: Woven carbon mesh beneath skin.
Stops small caliber rounds, reduces knife damage. Doesn't stop rifles
or armor-piercing. Skin looks slightly off - shiny, too smooth.
Heavy impacts still hurt (blunt trauma) but less cutting/piercing.`,

          abilities: `Carbon fiber mesh implanted beneath the skin.

INSTALLATION: Requires surgical-kit + armor-mesh + anesthetic.
Multiple incisions across torso, limbs. Mesh woven under dermis.
Long procedure - 4+ hours. Multiple sessions for full coverage.
Add installAbilities text to host abilities under "SUBDERMAL ARMOR".
Recovery: 1 week of tenderness, limited movement.

REMOVAL: Not practical. Mesh integrates with tissue.
Removal would require flaying. Usually left in place.
Damaged sections can be patched, not removed.

PROTECTION: Stops small caliber pistol rounds (.22, 9mm at range).
Reduces damage from knives, glass, shrapnel.
Does NOT stop: rifle rounds, shotgun slugs, armor-piercing, close-range magnum.
Blunt trauma still hurts - mesh stops penetration, not impact.

COVERAGE: Full body coverage standard. Face and hands usually excluded.
Incomplete coverage = weak points. Head and hands remain vulnerable.

APPEARANCE: Skin has slight sheen. Moves slightly wrong.
Observant people notice something's off. Medical scans reveal mesh.
Cannot pass as unaugmented under close examination.

WEIGHT: Adds 5kg to body weight. Slightly slower, slightly less agile.
Swimming harder - slight negative buoyancy. Benefits outweigh costs.

REJECTION: Rare but serious. Signs: skin inflammation, mesh migration.
Can cause chronic pain, disfigurement. Partial removal possible but difficult.

MAINTENANCE: None required. Mesh is permanent. Damaged sections
can be reinforced with additional mesh (more surgery).`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('armorRating', 'Ballistic protection level 1-5');
      this.obj.setPropertyDescription('coverage', 'Body coverage percentage 0-100');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SubdermalArmorBuilder] Type 'subdermalArmor' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SubdermalArmorBuilder);
