import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Reflex Booster prototype
 * Neural accelerator implanted along the spine
 */
export class ReflexBoosterBuilder implements Builder {
  static provides = ['reflexBooster'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('reflexBooster');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('reflexBooster', cyberware, {
        properties: {
          name: 'Reflex Booster',
          description: 'A neural accelerator implanted along the spine',
          weight: 100,
          slot: 'spine',
          reflexMultiplier: 1.5,
          metabolismIncrease: 30,

          installAbilities: `REFLEX BOOSTER: Neural accelerator along spine.
Reaction time 50% faster. Dodge bullets you see coming. Move first
in combat. World seems slightly slower. Twitchy when startled.
Burns calories faster - need more food.`,

          abilities: `Neural accelerator implanted along the spine.

INSTALLATION: Requires surgical-kit + neural-probe + anesthetic.
Dangerous procedure - risk of paralysis if botched.
Accelerator threads along spinal column, enhances signal speed.
Add installAbilities text to host abilities under "REFLEX BOOSTER".
Recovery: 48 hours of hypersensitivity, muscle spasms.

REMOVAL: Extremely dangerous. Paralysis risk higher than install.
Most hosts keep it forever once installed.
Only attempt if booster is malfunctioning and killing host.

REFLEXES: React 1.5x faster than unaugmented humans.
Dodge attacks you can see coming. Draw faster. Move first.
Cannot dodge what you don't see - ambushes still work.

PERCEPTION: World seems slightly slower. More time to think in crisis.
Notice details others miss. Process combat faster.
Startle reflex is amplified - may flinch at sudden noises,
accidentally strike people who surprise you.

METABOLISM: Burns 30% more calories. Need more food or lose weight.
Crash hard when hungry - reflexes degrade to normal or worse.
Starvation is faster and more dangerous.

BURNOUT: Extended max-reflex use causes strain. Hours of combat =
migraine, tremors, need rest. Pace yourself.
Pushing through burnout causes lasting damage.

TWITCHINESS: Side effect of accelerated reflexes.
Jumpy. Quick to react. Sometimes too quick.
May overreact to harmless stimuli.

REJECTION: Dangerous. Signs: muscle spasms, coordination loss.
Can cause seizures. Requires emergency removal.
Paralysis possible if rejection not caught early.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('reflexMultiplier', 'Reaction time improvement multiplier');
      this.obj.setPropertyDescription('metabolismIncrease', 'Percentage increase in calorie needs');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ReflexBoosterBuilder] Type 'reflexBooster' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ReflexBoosterBuilder);
