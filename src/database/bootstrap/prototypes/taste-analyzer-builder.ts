import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Taste Analyzer prototype
 * Cybernetic tongue with chemical analysis
 */
export class TasteAnalyzerBuilder implements Builder {
  static provides = ['tasteAnalyzer'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('tasteAnalyzer');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('tasteAnalyzer', cyberware, {
        properties: {
          name: 'Taste Analyzer',
          description: 'A cybernetic tongue with chemical analysis capability',
          weight: 40,
          slot: 'tongue',

          installAbilities: `TASTE ANALYZER: Chemical analysis via tongue.
Detect poisons in food before swallowing. Identify drugs, chemicals.
Analyze substances by taste. Useful for chemists, assassins, paranoid.
Food tastes slightly metallic - the price of paranoia.`,

          abilities: `Cybernetic tongue with chemical analysis capability.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Biological tongue replaced with cybernetic analogue.
Add installAbilities text to host abilities under "TASTE ANALYZER".
Recovery: 1 week. Difficulty eating, speech slightly off. Adapts.

REMOVAL: Tongue extraction. Speech impaired until replacement.

POISON: Taste anything, know if it will kill you.
Detects common poisons, toxins, harmful chemicals.
Warning before you swallow. Cannot detect everything - new poisons exist.

DRUGS: Identify recreational and pharmaceutical compounds.
Purity testing. Know what you're taking. Detect cutting agents.

ANALYSIS: General chemical breakdown of substances.
Not laboratory precision but good enough for field work.
Taste tells you what something is made of.

FOOD: Knows if meat is spoiled. Detects contamination.
Can navigate food safely in dangerous environments.

TASTE: Side effect - everything tastes slightly metallic.
Chrome tongue, chrome taste. Some find food less enjoyable.
A price for safety. Most adapt.

REJECTION: Rare. Signs: numbness, loss of taste, speech difficulty.
May require replacement.

MAINTENANCE: Self-cleaning but calibration needed yearly.
Damaged analyzer gives false readings - dangerous.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[TasteAnalyzerBuilder] Type 'tasteAnalyzer' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TasteAnalyzerBuilder);
