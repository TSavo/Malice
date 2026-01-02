import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Anesthetic prototype
 * Surgical anesthetic for cyberware installation (consumable)
 */
export class AnestheticBuilder implements Builder {
  static provides = ['anesthetic'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('anesthetic');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('anesthetic', medical, {
        properties: {
          name: 'Anesthetic',
          description: 'Surgical anesthetic for cyberware installation',
          weight: 50,
          doses: 3,
          potency: 'standard',
          expirationMonths: 6,

          abilities: `Surgical anesthetic for cyberware installation.

PURPOSE: Renders patient unconscious for procedures.
Essential for most chrome installation.
Without it: patient feels everything. Movement risks complications.
Some street rippers skip it. Quality rippers don't.

REQUIRED FOR: Nearly all cyberware procedures.
Only exceptions: very minor installations, patient refusal.
Conscious surgery is possible but extremely painful.
Patient movement during surgery = botched installation.

DOSAGE: One dose per procedure. Lasts 2-4 hours.
doses property tracks remaining doses in container.
Most containers hold 3 doses.
One dose = one unconscious patient.

PATIENT FACTORS: Body weight affects dosage.
Larger patients may need adjustment.
Toxin filter chrome = need higher dose.
Patient metabolizes anesthetic faster.
ALWAYS check for existing chrome before dosing.

OVERDOSE: Lethal if too much given.
Respiratory depression, cardiac arrest.
Calculate dose carefully. Err on side of caution.
Better to add more than start with too much.

ADMINISTRATION: IV injection preferred.
Takes 30 seconds to work. Patient counts backward from 10.
Intramuscular possible but slower onset.
Patient unconscious until drug wears off.

MONITORING: Watch breathing during procedure.
Anesthetized patients cannot report problems.
Pulse, respiration, color - monitor continuously.
Crash cart should be available.

POTENCY: Standard potency for normal patients.
High potency available for chrome users.
Low potency for minor procedures.
Match potency to procedure and patient.

RECOVERY: Patient wakes groggy, confused.
Nausea common. Keep them still.
Full recovery: 2-4 hours after waking.
Do not discharge until alert.

EXPIRATION: Short shelf life. Check date.
Expired anesthetic has unpredictable effects.
May not work. May work too well.
Always use fresh stock for surgery.

CONTROLLED: This is a controlled substance.
Legal for licensed medical practitioners.
Street possession is illegal. Rippers acquire through gray market.
Law enforcement watches for bulk purchases.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('doses', 'Number of doses remaining in container');
      this.obj.setPropertyDescription('potency', "Anesthetic strength: 'low', 'standard', or 'high'");
      this.obj.setPropertyDescription('expirationMonths', 'Months until expiration');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[AnestheticBuilder] Type 'anesthetic' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AnestheticBuilder);
