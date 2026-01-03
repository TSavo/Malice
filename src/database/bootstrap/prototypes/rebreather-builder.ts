import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Rebreather prototype
 * Compressed oxygen reservoir and recycler in chest cavity
 */
export class RebreatherBuilder implements Builder {
  static provides = ['rebreather'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('rebreather');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('rebreather', cyberware, {
        properties: {
          name: 'Rebreather',
          description:
            'A compressed oxygen reservoir and recycler in chest cavity',
          weight: 800,
          slot: 'chest',
          airSupply: 100,
          maxMinutes: 30,
          active: false,

          installAbilities: `REBREATHER: Internal air supply in chest.
30 minutes of oxygen when activated. Survive vacuum, underwater,
poison gas. Refills by breathing normally over time.
Chest slightly larger - visible under tight clothing.`,

          abilities: `Compressed oxygen reservoir and recycler in chest cavity.

INSTALLATION: Requires surgical-kit + air-tank + anesthetic.
Cavity created in chest. Tank and recycler installed.
Add installAbilities text to host abilities under "REBREATHER".
Recovery: 2 weeks. Breathing feels different. Chest tight. Adapts.

REMOVAL: Major surgery. Chest cavity reconstruction needed.
Significant scarring. 4+ week recovery.

ACTIVATION: Mental command seals airways, switches to internal air.
30 minutes of breathing without external atmosphere.
Can check remaining time mentally. Deactivate to conserve.
Automatic activation if atmosphere becomes toxic (optional setting).

SITUATIONS: Underwater survival - swim without surfacing.
Space vacuum survival - brief exposure only, no pressure protection.
Poison gas, smoke, chemical attack - sealed system, no contamination.
Firefighting, hazmat - continue operating in hostile atmosphere.

REFILL: Breathe normally, tank slowly refills. 1 hour to full charge.
Cannot refill in hostile atmosphere - need clean air.
Emergency only - not for extended underwater living.
Plan operations around recharge time.

RECYCLER: Exhaled CO2 converted back to oxygen.
Extends effective supply. Reduces waste.
Recycler less efficient under heavy exertion - 30 min is light activity.
Hard physical effort = 15-20 minutes max.

BULK: Chest noticeably larger. +2 inches circumference.
Visible under tight shirts. Not visible under jackets.
Some find it attractive - muscular look.
May need larger clothing.

PRESSURE: Does NOT protect against pressure.
Vacuum causes other damage - decompression, cold.
Deep water causes pressure injury. Only provides air, not protection.

REJECTION: Rare. Signs: difficulty breathing, chest pain.
Requires removal. Serious complication if not addressed.

MAINTENANCE: Tank inspection yearly. Recycler filter replacement.
Neglected unit loses efficiency, may fail when needed most.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'airSupply',
        'Percentage of air supply remaining (0-100)',
      );
      this.obj.setPropertyDescription(
        'maxMinutes',
        'Maximum minutes of air when full',
      );
      this.obj.setPropertyDescription(
        'active',
        'Whether rebreather is currently active',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[RebreatherBuilder] Type 'rebreather' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(RebreatherBuilder);
