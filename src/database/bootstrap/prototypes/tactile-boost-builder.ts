import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Tactile Boost prototype
 * Enhanced touch sensitivity in fingertips
 */
export class TactileBoostBuilder implements Builder {
  static provides = ['tactileBoost'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('tactileBoost');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('tactileBoost', cyberware, {
        properties: {
          name: 'Tactile Boost',
          description: 'Enhanced touch sensitivity in fingertips',
          weight: 15,
          slot: 'fingertips',
          sensitivity: 5,

          installAbilities: `TACTILE BOOST: Enhanced touch sensitivity in fingertips.
Feel tumblers in locks (safecracking). Detect vibrations (approaching footsteps).
Read texture invisible to eyes. Feel heartbeat through skin contact.
Extreme sensitivity - rough surfaces uncomfortable, pain from impacts.`,

          abilities: `Nerve amplification and pressure sensors in fingertips.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Sensors woven into fingerpad tissue. Nerve amplification in hand.
Add installAbilities text to host abilities under "TACTILE BOOST".
Recovery: 1 week of hypersensitivity. Wearing gloves helps.

REMOVAL: Sensor removal, nerve dampening reverts to normal.

SAFECRACKING: Feel tumbler positions in mechanical locks.
Combined with skill, open safes by touch. Electronic locks immune.
Need patience and practice. Not instant mastery.

VIBRATION: Detect footsteps through floors. Approaching vehicles.
Sense when machine is running wrong (maintenance use).
Feel shake of nearby gunfire, explosions.

TEXTURE: Read surfaces eyes miss. Worn keys. Faded engravings.
Fingerprints. Subtle differences. Forensic applications.

HEARTBEAT: Skin contact = feel their pulse. Stress detection.
Crude lie detection via elevated heart rate.

SENSITIVITY: Double-edged. Rough textures unpleasant.
Impacts hurt more. Some wear thin gloves constantly.
Cold and heat more intense. Learn to manage.

REJECTION: Uncommon. Signs: numbness, tingling, loss of fine motor control.
Usually resolves. May require removal if persistent.

MAINTENANCE: Minimal. Sensors are durable. Nerve amplification stable.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('sensitivity', 'Touch sensitivity multiplier 1-10');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[TactileBoostBuilder] Type 'tactileBoost' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TactileBoostBuilder);
