import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Cyber Leg prototype
 * Cybernetic leg replacement with enhanced speed and strength
 */
export class CyberLegBuilder implements Builder {
  static provides = ['cyberLeg'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('cyberLeg');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('cyberLeg', cyberware, {
        properties: {
          name: 'Cyber Leg',
          description: 'A full cybernetic leg replacement with enhanced speed and power',
          weight: 8000,
          slot: 'leg',
          side: 'right',
          speedBoost: 1.5,
          jumpBoost: 2,

          installAbilities: `CYBER LEG: Enhanced speed and jumping.
Run 50% faster. Jump twice as high. Kicks can shatter bones.
Leg is obvious chrome below knee. Running sounds mechanical.
Maintenance required or hydraulics fail.`,

          abilities: `Cybernetic leg replacement. Enhanced speed, jumping, kicking power.

INSTALLATION: Requires surgical-kit + cyber-tools + anesthetic.
Doc amputates biological leg at hip (if present), keeps it.
Cyber leg attaches to hip socket, neural connections established.
Add installAbilities text to host abilities under "CYBER LEFT/RIGHT LEG".
Recovery: 48 hours of calibration, learning new gait.

REMOVAL: Disconnect from hip. Host cannot walk until replacement.

SPEED: Run 50% faster than biological leg allows.
Sprinting more efficient. Less fatigue over distance.
One cyber leg = awkward gait. Two = smooth, fast.

JUMPING: Hydraulic boost allows 2x normal jump height.
Leap onto low rooftops, over cars. Soft landing too.
Impressive but loud - not stealthy.

KICKING: Devastating force. Kick through doors.
Break bones, dent metal. Combat advantage.

DURABILITY: Chrome doesn't break. Resistant to damage.
Can take bullets (dents, not penetration). Keeps working.

MAINTENANCE: Hydraulics need fluid. Joints need lubrication.
Neglected leg stutters, loses power, eventually locks up.
Ripper service or self-service with cyber-tools.

APPEARANCE: Obviously artificial below knee.
Chrome and carbon fiber. Mechanical sounds when moving.

REJECTION: Rare for limbs. Signs: phantom pain, poor balance.
Usually resolves. Rejection = removal, wheelchair.

POWER: Draws from host metabolism. Burns more calories.
Running = hungry. Jumping = very hungry. Eat accordingly.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('side', 'Which leg: left or right');
      this.obj.setPropertyDescription('speedBoost', 'Speed multiplier when running');
      this.obj.setPropertyDescription('jumpBoost', 'Jump height multiplier');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CyberLegBuilder] Type 'cyberLeg' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CyberLegBuilder);
