import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Olfactory Booster prototype
 * Cybernetic nose with enhanced smell and chemical detection
 */
export class OlfactoryBoosterBuilder implements Builder {
  static provides = ['olfactoryBooster'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('olfactoryBooster');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('olfactoryBooster', cyberware, {
        properties: {
          name: 'Olfactory Booster',
          description: 'A cybernetic nose enhancement with chemical detection',
          weight: 20,
          slot: 'nose',
          sensitivity: 10,

          installAbilities: `OLFACTORY BOOSTER: Enhanced smell and chemical detection.
Track by scent like a bloodhound. Detect explosives, drugs, poisons.
Identify individuals by smell. Sense fear, arousal, sickness.
Overwhelming odors can incapacitate - learn to filter.`,

          abilities: `Cybernetic olfactory enhancement with chemical analysis.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Nasal passages enhanced with sensor mesh. Nerves amplified.
Add installAbilities text to host abilities under "OLFACTORY BOOSTER".
Recovery: 1 week of hypersensitivity. Strong smells overwhelming at first.

REMOVAL: Surgical extraction. Reverts to normal human smell.

TRACKING: Follow scent trails hours old. Track individuals through crowds.
Rain and wind degrade trails. Indoor trails last longer.
Each person has unique scent signature - learn to identify.

DETECTION: Identify explosives, drugs, accelerants, poisons by smell.
Not laboratory precision but good for field detection.
Concealed substances can be sniffed out.

MEDICAL: Smell infection, disease, internal bleeding on others.
Detect pregnancy, illness, drug use. Crude but useful diagnostics.

EMOTION: Fear, arousal, stress all have chemical signatures.
Sense when someone is lying, attracted, terrified.
Not foolproof - some people don't produce strong scent.

OVERLOAD: Strong odors can incapacitate. Sewers, chemical spills,
rotting corpses - overwhelming. Learn to dampen sensitivity.

REJECTION: Rare. Signs: constant phantom smells, headaches.
May require removal.

MAINTENANCE: Filter cleaning monthly. Damaged sensors cause
anosmia or phantom odors.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('sensitivity', 'Smell sensitivity multiplier 1-10');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[OlfactoryBoosterBuilder] Type 'olfactoryBooster' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(OlfactoryBoosterBuilder);
