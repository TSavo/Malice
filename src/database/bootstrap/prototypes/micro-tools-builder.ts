import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Micro-Tools prototype
 * Precision instruments for cyberware installation
 */
export class MicroToolsBuilder implements Builder {
  static provides = ['microTools'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('microTools');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('microTools', tool, {
        properties: {
          name: 'Micro-Tools',
          description: 'A precision instrument kit for cyberware installation',
          weight: 200,
          condition: 100,

          abilities: `Precision instruments for cyberware installation.

CONTENTS: Micro-screwdrivers (magnetic, non-magnetic).
Fiber optic scope for internal visualization.
Neural calipers for measuring nerve bundles.
Servo alignment tools for cyberlimb calibration.
Connector crimpers for neural fiber attachment.
Magnification loupe with light.

REQUIRED FOR: Eye installations (chrome eye, targeting system).
Sensory chrome (audio enhancer, olfactory booster, etc.).
Small implants (internal clock, data storage, dermal display).
Any chrome requiring fine manipulation.

USE: Open case, select appropriate tool. Work under magnification.
Steady hands required. Rushed work causes complications.
Clean tools between uses. Sterilize before surgery.

CONDITION: Delicate tools. Degrade with heavy use.
condition property tracks wear. Below 50% = increased complication risk.
Replace tips regularly. Sharpen micro-blades.

QUALITY: Cheap tools cause problems. These are medical-grade.
Street rippers often use inferior equipment - higher risk.
Quality micro-tools make the difference between clean install and botch.

MAINTENANCE: Clean after each use. Store in case.
Check alignment of calipers. Replace worn tips.
Full service every 20 procedures recommended.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('condition', 'Tool condition percentage (0-100). Below 50% increases complication risk');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[MicroToolsBuilder] Type 'microTools' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(MicroToolsBuilder);
