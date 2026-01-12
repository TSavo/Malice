import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Neural Scanner prototype
 * Room-sized installation for detecting Neural Log agents (Loggers/Neurals).
 *
 * Per lore: "Neural scanning devices detect the subtle patterns that distinguish
 * synthetic consciousness from organic. The patterns are invisible to standard
 * observation - you need specialized equipment designed to read the architecture
 * of thought itself."
 *
 * Detects `isArtificialHuman` property - the hidden flag marking Loggers.
 * The Mask is the only portable device with this capability.
 * Neural scanners are massive, expensive installations - think MRI machine.
 */
export class NeuralScannerBuilder implements Builder {
  static provides = ['neuralScanner'];
  static depends = ['furniture'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('neuralScanner');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('neuralScanner', furniture, {
        properties: {
          name: 'Neural Scanner',
          description:
            'A massive cylindrical chamber dominates the room - brushed steel and carbon fiber, ' +
            'covered in warning labels in six languages. Thick cables snake across the floor to ' +
            'humming power units. A motorized bed extends from the scanner bore, padded restraints ' +
            'ready for the subject. Holographic displays flicker with diagnostic readouts. ' +
            'The air smells of ozone and antiseptic. This is a machine for reading minds.',
          weight: 850000, // 850kg - not moving this
          powered: true,
          operational: true,
          calibrated: true,
          lastCalibration: null,
          scanInProgress: false,
          cooldownUntil: 0,

          abilities: `NEURAL SCANNING INSTALLATION - Synthetic consciousness detection equipment.

THE ONLY RELIABLE DETECTION METHOD for Neural Log agents (Neurals/Loggers).
This machine reads the architecture of thought itself - patterns invisible to
standard observation, biometrics, or behavioral analysis.

SIZE: Room-sized installation. Think MRI machine. Cannot be moved without
industrial equipment and specialized technicians. Requires dedicated power.
Installation cost: millions of credits. Operating cost: substantial.

LOCATIONS: Only a handful exist in the city:
- Immigration Services (mandatory screening for new arrivals)
- CorpSec Central (interrogation facility)
- Smith Tower medical wing (rumored)
- The Cartel may have captured one (unconfirmed)

OPERATION: Subject must lie inside the scanner bore for 3-5 minutes.
Full-body immobilization required - movement corrupts readings.
Trained technician operates the control console.
Cannot be self-administered. Requires cooperation or restraint.

DETECTION: Reads subject's 'isArtificialHuman' property directly.
- TRUE = Synthetic consciousness detected. Subject is a Neural Logger.
- FALSE or ABSENT = Organic consciousness. Human.

DISPLAY RESULTS:
- Green hologram: ORGANIC - Subject confirmed human.
- Red hologram with klaxon: SYNTHETIC - Neural architecture detected.
- Yellow hologram: INCONCLUSIVE - Subject moved, interference, or equipment fault.

ACCURACY: 99.97% when properly calibrated and subject is still.
False positives essentially impossible - organic brains cannot mimic synthetic patterns.
False negatives only occur with subject movement or equipment malfunction.

COOLDOWN: Machine requires 15 minutes between scans to recalibrate sensors.
Superconducting coils must stabilize. cooldownUntil tracks timestamp.
Rushing scans risks damaging the equipment or corrupting results.

POWER: Requires dedicated industrial power supply. 50kW draw during scan.
Power fluctuations corrupt readings. Backup generators mandatory.
powered property tracks whether main power is connected.

COST: These machines are extraordinarily expensive. Building one requires:
- Rare earth superconductors
- Quantum processing units
- Pre-Burning neural mapping algorithms (lost technology, few copies remain)
- Specialized installation by trained engineers

Estimated replacement cost: 15-20 million credits. Maybe more.
There may be fewer than a dozen functioning units in the entire Pacific Northwest.

COUNTERMEASURES: Loggers have no defense against neural scanning.
They cannot fake organic patterns - the synthetic architecture is fundamental.
The only protection is avoiding being scanned in the first place.
Some rumors of experimental neural shielding implants, but unconfirmed.

POLITICAL IMPLICATIONS: Scanner readings are admissible evidence.
A positive scan = execution by either faction. No trial, no appeal.
Pluribus and the Cartel both consider Loggers existential threats.
Operating this equipment carries immense responsibility.

COERCION: Subjects can refuse scanning. But refusal raises suspicion.
CorpSec can compel scanning with warrant. The Cartel doesn't ask nicely.
"If you have nothing to hide, you have nothing to fear" - but everyone fears it.

MAINTENANCE: Requires quarterly calibration by certified technician.
calibrated property tracks whether machine is currently reliable.
Uncalibrated machine may produce false negatives - dangerous.
lastCalibration stores timestamp of most recent calibration.

THE MASK: The only portable neural scanning device is the Mask itself.
Sister Gray holds it. If she ever finds a wearer she trusts, the game changes.
Until then, these room-sized installations are the only option.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'powered',
        'Whether main power is connected. Requires industrial 50kW supply',
      );
      this.obj.setPropertyDescription(
        'operational',
        'Whether machine is functioning. False if damaged or missing components',
      );
      this.obj.setPropertyDescription(
        'calibrated',
        'Whether sensors are calibrated. Requires quarterly maintenance',
      );
      this.obj.setPropertyDescription(
        'lastCalibration',
        'Timestamp of most recent calibration. Null if never calibrated',
      );
      this.obj.setPropertyDescription(
        'scanInProgress',
        'Whether a scan is currently running. Subject must remain still',
      );
      this.obj.setPropertyDescription(
        'cooldownUntil',
        'Timestamp when machine will be ready for next scan. 15 minute cooldown',
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
