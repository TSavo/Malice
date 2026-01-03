import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Chrome Eye prototype
 * Cybernetic eye with thermal imaging
 */
export class ChromeEyeBuilder implements Builder {
  static provides = ['chromeEye'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('chromeEye');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('chromeEye', cyberware, {
        properties: {
          name: 'Chrome Eye',
          description: 'A cybernetic eye with thermal imaging capability',
          weight: 50,
          slot: 'eye',
          color: 'electric blue',
          glowing: true,

          installAbilities: `CHROME EYE - THERMAL VISION: Heat signatures visible
as orange-red glow. Living beings cannot hide - their warmth betrays them.
Works in total darkness. Can see through thin walls (heat bleeds through).
Glowing iris visible to others - marks you as chromed.`,

          abilities: `Cybernetic eye replacement with thermal imaging.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Doc removes biological eye, keeps it. Chrome eye connects to optic nerve.
Add installAbilities text to host abilities under "CHROME LEFT/RIGHT EYE".
Recovery: 24 hours of blurred vision, then full function.

REMOVAL: Surgical extraction. Host loses thermal vision.
Remove the chrome eye ability block from host abilities.

THERMAL: See heat signatures. Living beings glow orange-red. Recently
touched objects show warmth. Engine heat, body heat, gunfire heat - all visible.
Cannot hide from thermal scan. Thin walls don't block - heat bleeds through.

LOW-LIGHT: Works in total darkness. Amplifies available light.
Sudden bright light causes momentary flash-blindness (chrome adjusts slower).

APPEARANCE: Glowing iris, chrome visible at socket edge.
Others can see you're augmented. Some find it unsettling.

POWER: Passive draw from host bioelectricity. No external power needed.

REJECTION: Rare. Signs: persistent visual artifacts, headaches behind eye.
Recovery impaired if rejection occurs. May require removal.

MAINTENANCE: Lens cleaning, calibration every 6 months.
Damaged chrome causes visual glitches, thermal false positives.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'color',
        'Iris color when powered (electric blue, crimson, gold, etc.)',
      );
      this.obj.setPropertyDescription(
        'glowing',
        'Whether iris visibly glows when active',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ChromeEyeBuilder] Type 'chromeEye' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ChromeEyeBuilder);
