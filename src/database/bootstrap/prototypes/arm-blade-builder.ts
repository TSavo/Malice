import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Arm Blade prototype
 * Single long blade that extends from forearm
 */
export class ArmBladeBuilder implements Builder {
  static provides = ['armBlade'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('armBlade');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('armBlade', cyberware, {
        properties: {
          name: 'Arm Blade',
          description: 'A 30cm blade that extends from the forearm past the wrist',
          weight: 800,
          slot: 'forearm',
          side: 'right',
          bladeLength: 30,
          extended: false,

          installAbilities: `ARM BLADE: 30cm blade extends from forearm.
Longer reach than claws. Devastating slashes. Cannot be concealed when extended.
Forearm housing visible - obvious chrome. Draw by twisting wrist.`,

          abilities: `Single long blade housed in forearm, extends past wrist.

INSTALLATION: Requires surgical-kit + cyber-tools + anesthetic.
Forearm partially replaced with blade housing. Major chrome - visible.
Add installAbilities to host abilities under "ARM BLADE".
Recovery: 2 weeks. Arm sore, limited mobility until healed.

REMOVAL: Major surgery. Forearm reconstruction needed.

EXTENSION: Twist wrist, blade extends past hand. 30cm of steel.
Slower than claws (1 second). Cannot hold anything when extended.
Hand folds back - not usable until blade retracted.

RETRACTION: Twist wrist again, blade retracts. Hand usable again.
Cannot quickly switch between blade and holding objects.

COMBAT: Longer reach than claws. Sword-like slashes.
Can parry other blades. Devastating cuts.
More obvious - cannot pretend to be unarmed.

BLOCKING: Strong enough to block melee attacks.
Can stop blades, batons. Not bullets.
Useful for defensive fighting.

MAINTENANCE: Blade needs sharpening. Housing needs lubrication.
Jamming possible. Regular ripper visits recommended.

DETECTION: Impossible to hide. Forearm is clearly chrome.
Security will notice. Some places refuse entry.

REJECTION: Uncommon. Signs: arm weakness, blade jams.
Major surgery to remove. May lose forearm function.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('side', 'Which arm: left or right');
      this.obj.setPropertyDescription('bladeLength', 'Blade length in centimeters');
      this.obj.setPropertyDescription('extended', 'Whether blade is currently extended');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ArmBladeBuilder] Type 'armBlade' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ArmBladeBuilder);
