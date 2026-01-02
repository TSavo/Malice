import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Targeting System prototype
 * Combat-focused chrome eye with ballistic computer
 */
export class TargetingSystemBuilder implements Builder {
  static provides = ['targetingSystem'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('targetingSystem');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('targetingSystem', cyberware, {
        properties: {
          name: 'Targeting System',
          description: 'A combat-enhanced chrome eye with ballistic computer',
          weight: 60,
          slot: 'eye',
          color: 'crimson',
          maxTargets: 5,
          trackedTargets: [],

          installAbilities: `TARGETING SYSTEM: Combat-enhanced chrome eye.
Ballistic prediction - see where bullets will go. Range finding.
Track multiple targets. Highlight threats. Lead indicator for moving targets.
HUD overlays tactical data. Linked to smartgun if equipped.`,

          abilities: `Combat-focused chrome eye with ballistic computer.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Replaces biological eye. Connects to visual cortex.
Add installAbilities to host abilities under "TARGETING SYSTEM".
Recovery: 24-48 hours adjusting to data overlay.

REMOVAL: Standard eye extraction. Lose all targeting features.

PREDICTION: Aim at target, see predicted bullet path.
Accounts for drop, wind, movement. Not perfect - still need skill.
Dramatically improves accuracy at range.

RANGE: Distance to any point you look at. Displayed in HUD.
Useful for sniping, throwing, judging jumps.

TRACKING: Tag up to 5 targets. HUD highlights even when not looking.
Know where enemies are. Aware of flanking attempts.
Tracked targets show through walls (last known position).

THREAT: Motion detection highlights potential dangers.
Armed individuals glow red. Weapons drawn = brighter.
Not foolproof - concealed weapons not detected.

SMARTGUN: If equipped with smartgun, direct link.
Crosshair overlay, ammo count, jam detection.
Point and shoot - computer handles fine aim.

APPEARANCE: Crimson iris with visible data patterns.
Obviously combat chrome. Intimidating.

REJECTION: Rare. Signs: HUD glitches, false positives.
May require recalibration or removal.

MAINTENANCE: Software updates, calibration quarterly.
Damaged system causes targeting errors - dangerous.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('color', 'Iris color (typically crimson for targeting systems)');
      this.obj.setPropertyDescription('maxTargets', 'Maximum number of targets that can be tracked');
      this.obj.setPropertyDescription('trackedTargets', 'Array of currently tracked target IDs');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[TargetingSystemBuilder] Type 'targetingSystem' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TargetingSystemBuilder);
