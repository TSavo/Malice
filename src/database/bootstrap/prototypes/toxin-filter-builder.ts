import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Toxin Filter prototype
 * Augmented liver with enhanced chemical processing
 */
export class ToxinFilterBuilder implements Builder {
  static provides = ['toxinFilter'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('toxinFilter');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('toxinFilter', cyberware, {
        properties: {
          name: 'Toxin Filter',
          description: 'An augmented liver with enhanced chemical processing',
          weight: 300,
          slot: 'liver',
          processingRate: 3,

          installAbilities: `TOXIN FILTER: Liver enhancement processes toxins faster.
Poisons metabolized quickly - not immune but resistant. Drugs processed
faster - shorter high, less addiction risk. Alcohol tolerance sky high.
Downside: medications less effective, need higher doses.`,

          abilities: `Augmented liver with enhanced chemical processing.

INSTALLATION: Requires surgical-kit + filter-unit + anesthetic.
Cybernetic mesh integrates with existing liver tissue.
Add installAbilities text to host abilities under "TOXIN FILTER".
Recovery: 1 week of nausea, yellow skin. Liver adjusting to enhancement.

REMOVAL: Difficult. Mesh integrated with organ. Partial removal possible.
Full removal risks liver damage. Most hosts keep it.

POISON: Toxins processed at 3x normal rate. Lethal dose becomes survivable.
Not immune - enough poison still kills. Just need much more.
Buys time to get treatment. Delayed symptoms give warning.
Venom, ingested poisons, injected toxins - all processed faster.

DRUGS: Recreational substances metabolized faster.
High shorter, crash sooner. Harder to get addicted.
Substance leaves system quickly. Less buildup.
Also harder to enjoy drugs - tolerance builds fast.

ALCOHOL: Tolerance dramatically increased. Can drink most under table.
Still get drunk eventually - just takes a lot more.
Hangovers less severe. Alcohol leaves system faster.
Some use this for drinking contests or social manipulation.

MEDICATION: Drugs meant to help also metabolized faster.
Painkillers wear off quick. Anesthetics need higher doses.
Antibiotics may need more frequent dosing.
ALWAYS inform doctors before any medical procedure.

OVERDOSE: Harder to overdose on most substances.
Filter kicks in, processes excess. Not foolproof.
Massive overdose still fatal - just takes more.

REJECTION: Liver tissue can reject mesh.
Signs: jaundice, nausea, fatigue, dark urine.
Requires partial removal before liver fails.
Usually stabilizes after reducing mesh.

MAINTENANCE: None required. Mesh integrates permanently.
Liver regenerates around it. Self-maintaining.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('processingRate', 'Toxin processing speed multiplier');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ToxinFilterBuilder] Type 'toxinFilter' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ToxinFilterBuilder);
