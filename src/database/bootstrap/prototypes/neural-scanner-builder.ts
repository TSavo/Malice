import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Neural Scanner prototype
 * The only reliable detection method for Neural Log agents (Loggers/Neurals).
 *
 * Per lore: "Neural scanning devices detect the subtle patterns that distinguish
 * synthetic consciousness from organic. The patterns are invisible to standard
 * observation - you need specialized equipment designed to read the architecture
 * of thought itself."
 *
 * Detects `isArtificialHuman` property - the hidden flag marking Loggers.
 * The Mask is also such a device, but neural scanners are standalone equipment.
 */
export class NeuralScannerBuilder implements Builder {
  static provides = ['neuralScanner'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('neuralScanner');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('neuralScanner', tool, {
        properties: {
          name: 'Neural Scanner',
          description:
            'A sleek handheld device with a sensor array and small display screen. ' +
            'Military-grade technology rarely seen outside CorpSec and high-level Cartel operations. ' +
            'The surface is brushed titanium, covered in warning labels in three languages.',
          weight: 350,
          charge: 100,
          condition: 100,
          scanCooldown: 0,

          abilities: `NEURAL SCANNING DEVICE - Synthetic consciousness detection equipment.

THE ONLY RELIABLE DETECTION METHOD for Neural Log agents (Neurals/Loggers).
This device reads the architecture of thought itself - patterns invisible to
standard observation, biometrics, or behavioral analysis.

FUNCTION: Point at target within 3 meters. Activate scan. Device reads neural
activity patterns and compares against organic baseline.

DETECTION: Reads target's 'isArtificialHuman' property directly.
- TRUE = Synthetic consciousness detected. Subject is a Neural Logger.
- FALSE or ABSENT = Organic consciousness. Human.

DISPLAY RESULTS:
- Green indicator: ORGANIC - Subject confirmed human.
- Red indicator with alert: SYNTHETIC - Neural architecture detected.
- Yellow indicator: INCONCLUSIVE - Target shielded, too far, or interference.

ACCURACY: 99.7% when properly calibrated and within range.
False positives extremely rare - organic brains cannot mimic synthetic patterns.
False negatives possible if target has neural shielding (extremely rare tech).

COOLDOWN: Each scan requires 30 seconds between uses. Neural pattern analysis
is computationally intensive. scanCooldown tracks remaining cooldown time.

CHARGE: Battery powered. Each scan uses ~5% charge. Recharge via standard
power outlet or vehicle port. Dead scanner = no detection capability.

RARITY: Military-grade equipment. Not available commercially.
Sources: CorpSec armories, high-level Cartel contacts, black market (rare).
Possession without authorization = instant detention by CorpSec.

COUNTERMEASURES: Loggers have no defense against neural scanning.
They cannot fake organic patterns - the synthetic architecture is fundamental.
The only protection is avoiding scanning situations entirely.
Some rumors of experimental neural shielding, but unconfirmed.

POLITICAL IMPLICATIONS: Scanner readings are admissible evidence.
A positive scan = execution by either faction. No trial, no appeal.
Pluribus and the Cartel both consider Loggers existential threats.
Using this device carries immense responsibility.

WARNING: Scanning an innocent human is deeply invasive. The device probes
their neural patterns without consent. Many consider it a violation.
Scan only with probable cause. Routine scanning damages public trust.

MAINTENANCE: Precision instrument. Requires annual calibration.
condition property tracks calibration drift.
Below 70% = increased false negative risk. Recalibrate immediately.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'charge',
        'Battery charge percentage (0-100). Each scan uses ~5%'
      );
      this.obj.setPropertyDescription(
        'condition',
        'Calibration accuracy (0-100). Below 70% = unreliable readings'
      );
      this.obj.setPropertyDescription(
        'scanCooldown',
        'Seconds until next scan available. 30 second cooldown between scans'
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[NeuralScannerBuilder] Type 'neuralScanner' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(NeuralScannerBuilder);
