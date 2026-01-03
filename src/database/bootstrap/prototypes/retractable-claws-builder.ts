import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Retractable Claws prototype
 * Monomolecular blades that extend from knuckles
 */
export class RetractableClawsBuilder implements Builder {
  static provides = ['retractableClaws'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('retractableClaws');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('retractableClaws', cyberware, {
        properties: {
          name: 'Retractable Claws',
          description: 'Three monomolecular blades that extend from knuckles',
          weight: 300,
          slot: 'hand',
          side: 'right',
          bladeLength: 15,
          extended: false,

          installAbilities: `RETRACTABLE CLAWS: 15cm monomolecular blades from knuckles.
Slice through flesh, leather, thin metal. Cannot be disarmed.
Extend by flexing. Retract to hide. Hand works normally when retracted.
Airport scanners detect. Snikt.`,

          abilities: `Three monomolecular blades housed in forearm, emerge from knuckles.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Blade housing installed in forearm. Actuators in wrist. Exit ports
at knuckles (scarring visible). Add installAbilities to host abilities.
Recovery: 1 week. Wrist sore, grip weak until healed.

REMOVAL: Surgical extraction. Leaves exit scars at knuckles.

EXTENSION: Flex specific muscle to deploy. Takes 0.5 seconds.
Audible snikt sound. Blades lock in place. Cannot accidentally retract.

RETRACTION: Flex again to retract. Blades fold back into forearm.
Hand fully functional when retracted. Slight bulge at forearm.

CUTTING: Monomolecular edge. Cuts flesh like butter. Leather, fabric,
thin sheet metal - sliced. Bone takes effort. Concrete, thick steel - no.

COMBAT: Cannot be disarmed. Always armed. Surprise advantage.
Devastating in close quarters. Less reach than knife but faster draw.

MAINTENANCE: Blades dull eventually. Ripper can resharpen.
Jamming: debris in housing can prevent extension. Keep clean.

DETECTION: Metal scanners find them. X-ray shows clearly.
Cannot hide from security. Some establishments ban entry.

REJECTION: Uncommon. Signs: wrist pain, weak grip, jammed extension.
May require removal if mechanisms fail.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('side', 'Which hand: left or right');
      this.obj.setPropertyDescription(
        'bladeLength',
        'Blade length in centimeters',
      );
      this.obj.setPropertyDescription(
        'extended',
        'Whether blades are currently extended',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log(
      "[RetractableClawsBuilder] Type 'retractableClaws' auto-aliased",
    );
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(RetractableClawsBuilder);
