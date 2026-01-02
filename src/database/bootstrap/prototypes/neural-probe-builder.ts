import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Neural Probe prototype
 * Diagnostic and installation tool for neural interfaces
 */
export class NeuralProbeBuilder implements Builder {
  static provides = ['neuralProbe'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('neuralProbe');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('neuralProbe', tool, {
        properties: {
          name: 'Neural Probe',
          description: 'A diagnostic and installation tool for neural interfaces',
          weight: 150,
          charge: 100,
          condition: 100,

          abilities: `Diagnostic and installation tool for neural interfaces.

FUNCTION: Maps neural pathways non-invasively.
Tests nerve response before and during surgery.
Guides fiber placement for neural connections.
Essential for brain/spine cyberware - without it, installation is blind.

REQUIRED FOR: Pain editor installation (spine).
Reflex booster installation (spine).
Any neural interface or brain-adjacent chrome.
Spinal procedures of any kind.

USE: Apply probe tip to exposed tissue. Read neural activity.
Follow guidance on screen for fiber placement.
Verify connections before closing. Test response.

CHARGE: Battery powered. Single procedure uses ~20% charge.
Recharge between surgeries. Dead probe = blind surgery.
Emergency hand-crank backup provides minimal function.

DANGER: This tool interfaces with nervous system.
Misuse causes neural damage. Training required.
Incorrect placement = paralysis, brain damage, death.
Not for untrained operators. Street rippers sometimes skip it.

MODES: Mapping mode - visualize nerve paths.
Testing mode - verify neural response.
Guidance mode - real-time placement assistance.
Diagnostic mode - check existing chrome function.

CONDITION: Precision instrument. Handle carefully.
condition property tracks calibration accuracy.
Below 50% = unreliable readings, increased surgery risk.

MAINTENANCE: Calibrate before each use. Check probe tips.
Clean contact surfaces. Full recalibration yearly.
Replace probe tips if corroded.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('charge', 'Battery charge percentage (0-100). Uses ~20% per procedure');
      this.obj.setPropertyDescription('condition', 'Calibration accuracy (0-100). Below 50% causes unreliable readings');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[NeuralProbeBuilder] Type 'neuralProbe' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(NeuralProbeBuilder);
