import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Pain Editor prototype
 * Neural filter that can toggle pain off
 */
export class PainEditorBuilder implements Builder {
  static provides = ['painEditor'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('painEditor');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('painEditor', cyberware, {
        properties: {
          name: 'Pain Editor',
          description: 'A neural filter that intercepts pain signals',
          weight: 50,
          slot: 'spine',
          painSuppressed: false,

          installAbilities: `PAIN EDITOR: Neural filter on spine. Toggle pain off.
Fight through wounds that would drop others. Danger: without pain,
don't know when to stop. Can push body past breaking point.
Wounds still exist - just don't feel them. Remember to check yourself.`,

          abilities: `Neural filter that intercepts pain signals before they reach brain.

INSTALLATION: Requires surgical-kit + neural-probe + anesthetic.
High risk - interfaces with spinal cord. Paralysis possible if botched.
Add installAbilities to host abilities under "PAIN EDITOR".
Recovery: 48 hours of phantom sensations, numbness.

REMOVAL: Dangerous. Can leave chronic pain if done wrong.
Some hosts live with it forever rather than risk removal.

TOGGLE: Mental command switches pain on/off. Off = feel pressure, not pain.
Wounds still there, blood still flows, bones still broken - just no pain.
Some keep it off always. Dangerous lifestyle.

COMBAT: Fight through injuries. No shock. No distraction.
Keep shooting with a bullet in your gut. Finish the fight, then collapse.
Terrifying to opponents who expect you to fall.

DANGER: Pain exists for a reason. Without it, push too hard.
Run on broken leg = permanent damage. Internal bleeding unnoticed.
Exhaustion unfelt until you drop. Check yourself regularly.

ADDICTION: Some become dependent. Cannot handle normal pain anymore.
Editor failure = agony from years of suppressed signals flooding back.
Psychological dependence common.

REJECTION: Rare but severe. Phantom pain syndrome - pain that isn't there.
Constant agony with no physical cause. Requires removal or medication.
Suicide risk if not treated.

MAINTENANCE: Neural calibration yearly. Degraded filter leaks pain
or blocks too much (numbness). Either is dangerous.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'painSuppressed',
        'Whether pain signals are currently being blocked',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[PainEditorBuilder] Type 'painEditor' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(PainEditorBuilder);
