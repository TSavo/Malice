import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Echolocation Module prototype
 * Sonar sense added to hearing
 */
export class EcholocationModuleBuilder implements Builder {
  static provides = ['echolocationModule'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('echolocationModule');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('echolocationModule', cyberware, {
        properties: {
          name: 'Echolocation Module',
          description: 'Ultrasonic emitter and enhanced auditory processing for sonar',
          weight: 25,
          slot: 'ear',
          active: false,

          installAbilities: `ECHOLOCATION: Sonar sense added to hearing.
See in total darkness via sound. Detect movement through thin walls.
Ultrasonic pulses - inaudible to normal hearing.
Disorienting at first. Some never adapt. Others become blind-fighters.`,

          abilities: `Ultrasonic emitter and enhanced auditory processing for sonar.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Emitter behind ear. Processing augments auditory cortex.
Add installAbilities to host abilities under "ECHOLOCATION".
Recovery: 2-4 weeks learning to interpret. Headaches common.

REMOVAL: Standard chrome extraction. Emitter removed, processing remains
dormant (no harm).

DARKNESS: Emit pulses, hear reflections. "See" in total dark.
Resolution depends on surface texture. Smooth walls = clear.
Rough surfaces = fuzzy. Moving targets = very clear.

THROUGH WALLS: Thin walls, doors - pulse penetrates.
Detect movement on other side. Not detail, just presence.
Concrete, steel - too thick. Soundproofing blocks.

STEALTH: Ultrasonic - normal humans can't hear your pings.
Animals may react. Other chromed with audio enhancers may detect.

DISORIENTATION: New users nauseous, confused. Two senses conflict.
Brain learns to integrate. 2-4 weeks of training to use well.
Some never adapt. Rejection = constant vertigo.

LIMITS: Loud environments drown out echoes. Combat noise problematic.
Works best in quiet. Moving carefully, listening.

REJECTION: More common than other chrome. Brain struggles to integrate
new sense. Signs: persistent vertigo, nausea, spatial confusion.
May require removal if adaptation fails.

MAINTENANCE: Emitter calibration every 3 months. Damaged emitter
causes inaccurate echo returns - dangerous in combat.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('active', 'Whether actively emitting ultrasonic pulses');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[EcholocationModuleBuilder] Type 'echolocationModule' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(EcholocationModuleBuilder);
