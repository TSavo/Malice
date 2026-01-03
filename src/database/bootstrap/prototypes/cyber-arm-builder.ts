import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Cyber Arm prototype
 * Cybernetic arm replacement with enhanced strength
 */
export class CyberArmBuilder implements Builder {
  static provides = ['cyberArm'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('cyberArm');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('cyberArm', cyberware, {
        properties: {
          name: 'Cyber Arm',
          description:
            'A full cybernetic arm replacement with enhanced strength',
          weight: 5000,
          slot: 'arm',
          side: 'right',
          strengthMultiplier: 3,

          installAbilities: `CYBER ARM: Strength x3 for this arm.
Can punch through drywall, bend rebar, crush handguns. Grip cannot
be broken by normal humans. Arm is obvious chrome - no hiding it.
Maintenance required or servos seize.`,

          abilities: `Cybernetic arm replacement. Full articulation, enhanced strength.

INSTALLATION: Requires surgical-kit + cyber-tools + anesthetic.
Doc amputates biological arm at shoulder (if present), keeps it.
Cyber arm attaches to shoulder socket, neural connections established.
Add installAbilities text to host abilities under "CYBER LEFT/RIGHT ARM".
Recovery: 24 hours of calibration, learning new proprioception.

REMOVAL: Disconnect from shoulder. Host has no arm until replacement.

STRENGTH: 3x normal human strength for this arm.
Lift heavier, hit harder, grip tighter. Cannot be arm-wrestled by meat.
Punch through: drywall, car windows, wooden doors. Not concrete, not steel.

DURABILITY: Chrome doesn't bruise or break like bone. Resistant to
cuts, impacts. Can block blades (sparks, no damage). Not bulletproof.

COMPARTMENTS: Forearm has small storage. Can conceal knife, syringe,
small pistol. Customs scanners will detect.

MAINTENANCE: Servos need lubrication. Joints collect grit.
Neglected arm stutters, loses strength, eventually seizes.
Ripper can service. Self-service with cyber-tools if skilled.

APPEARANCE: Obviously artificial. Chrome and carbon fiber.
Some get synth-skin overlay to hide it (separate procedure).

REJECTION: Rare for limbs. Signs: phantom pain, poor motor control.
Usually resolves with calibration. Rejection = removal, stump.

POWER: Draws from host metabolism. Burns more calories.
Heavy use = tired faster. Eat more to compensate.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('side', 'Which arm: left or right');
      this.obj.setPropertyDescription(
        'strengthMultiplier',
        'Strength multiplier compared to biological arm',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CyberArmBuilder] Type 'cyberArm' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CyberArmBuilder);
