import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Cyber-Tools prototype
 * Maintenance kit for cybernetic limbs and large implants
 */
export class CyberToolsBuilder implements Builder {
  static provides = ['cyberTools'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('cyberTools');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('cyberTools', tool, {
        properties: {
          name: 'Cyber-Tools',
          description: 'A maintenance kit for cybernetic limbs and large implants',
          weight: 800,
          condition: 100,
          lubricantLevel: 100,

          abilities: `Maintenance kit for cybernetic limbs and implants.

CONTENTS: Servo lubricant (medical grade).
Joint cleaners and brushes.
Diagnostic cables for limb ports.
Replacement seals and gaskets.
Calibration software on datachip.
Torque wrenches for structural bolts.
Myomer fiber repair kit.

REQUIRED FOR: Cyberlimb installation (cyber arm, cyber leg).
Arm blade installation (forearm housing).
Major structural chrome maintenance and repair.
Self-maintenance if host is skilled.

INSTALLATION USE: Prepare limb socket. Attach structural mounts.
Connect myomer bundles. Seal joints. Run calibration.
Test full range of motion. Verify nerve response.

MAINTENANCE USE: Connect diagnostic cable to limb port.
Run calibration software. Check for errors.
Apply lubricant to joints. Clean debris from seams.
Replace worn seals. Keeps chrome running smooth.

SELF-MAINTENANCE: Cyberlimb hosts can maintain their own chrome.
Requires skill and practice. Difficult one-handed for arm.
Recommended: have someone help. Especially for hard-to-reach joints.

LUBRICANT: Medical-grade servo lubricant included.
lubricantLevel tracks remaining supply.
Refill from ripperdoc or medical supplier.
Dry joints = grinding, stiffness, eventual seizure.

CONDITION: Heavy duty tools. More durable than micro-tools.
condition property tracks overall kit state.
Replace worn components as needed.

FIELD USE: Can perform emergency repairs outside clinic.
Not ideal - clean environment preferred.
Combat damage sometimes requires immediate attention.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('condition', 'Tool kit condition (0-100)');
      this.obj.setPropertyDescription('lubricantLevel', 'Remaining servo lubricant percentage (0-100)');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CyberToolsBuilder] Type 'cyberTools' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CyberToolsBuilder);
