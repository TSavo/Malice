import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Subdermal Pocket prototype
 * Surgically created cavity beneath the skin with sealable opening
 */
export class SubdermalPocketBuilder implements Builder {
  static provides = ['subdermalPocket'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('subdermalPocket');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('subdermalPocket', cyberware, {
        properties: {
          name: 'Subdermal Pocket',
          description:
            'A surgically created cavity beneath the skin with sealable opening',
          weight: 50,
          slot: 'torso',
          contents: [],

          installAbilities: `SUBDERMAL POCKET: Hidden compartment under skin.
Conceal small items - knife, compact pistol, drugs, data chips.
Undetectable by pat-down. X-ray and deep scan finds it.
Access by pressing specific spot - skin parts, pocket opens.`,

          abilities: `Surgically created cavity beneath the skin with sealable opening.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Cavity created in torso, reinforced with synthetic lining.
Magnetic seal keeps closed. Add installAbilities to host.
Recovery: 2 weeks. Area tender, cannot carry items until healed.

REMOVAL: Simple surgery. Cavity closes naturally.
Scar tissue fills in over weeks. Leaves slight mark.

CAPACITY: Fits small items. Compact pistol, knife, syringe, data chips.
Not large items. Not multiple weapons. About a fist-sized space.
Items must be flat or small - bulky objects show through skin.

CONCEALMENT: Skin looks normal when pocket closed.
Pat-down finds nothing. Metal detectors triggered by metal inside.
X-ray reveals cavity and contents clearly.
Deep body scans show everything. Not foolproof against thorough search.

ACCESS: Press magnetic catch point on skin. Seam opens.
Reach in, retrieve item. Close by pressing seal shut.
Practice to do quickly. Drawing weapon = 1-2 seconds extra vs holster.

LOCATION: Usually torso side or abdomen. Less movement stress.
Some install in thigh - harder to access but more hidden.
Location affects retrieval speed and concealment.

INFECTION: Cavity can become infected if items not clean.
Signs: redness, swelling, fever, pus.
Needs antibiotics, maybe surgical cleaning.
Keep items sterile when possible. Wipe before storing.

LIMITATIONS: Cannot store liquids - leakage risk.
Sharp items should be sheathed. Electronics may malfunction.
Body heat affects temperature-sensitive items.

REJECTION: Rare. Signs: chronic tenderness, seal failure.
Requires removal if seal won't hold. Infection risk increases.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'contents',
        'Array of items currently stored in the pocket',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SubdermalPocketBuilder] Type 'subdermalPocket' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SubdermalPocketBuilder);
