import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Air Filter prototype
 * Filtration membrane implanted in bronchial passages
 */
export class AirFilterBuilder implements Builder {
  static provides = ['airFilter'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('airFilter');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('airFilter', cyberware, {
        properties: {
          name: 'Air Filter',
          description: 'A filtration membrane implanted in bronchial passages',
          weight: 150,
          slot: 'lungs',
          filterLife: 100,

          installAbilities: `AIR FILTER: Lung implant filters incoming air.
Breathe in smoke, tear gas, toxic fumes. Not underwater - still need air.
Airborne diseases blocked. Pollution ignored.
Filter degrades - needs replacement every 6 months.`,

          abilities: `Filtration membrane implanted in bronchial passages.

INSTALLATION: Requires surgical-kit + filter-unit + anesthetic.
Non-invasive as chrome goes. Filter membrane lines airways.
Add installAbilities text to host abilities under "AIR FILTER".
Recovery: 1 week of coughing, shortness of breath. Then normal function.

REMOVAL: Easy compared to most chrome. Outpatient procedure.
Membrane detaches, coughed out over several days.
Temporary breathing difficulty during expulsion.

FILTERING: Smoke, tear gas, pepper spray - filtered out.
Breathe normally in burning buildings. Tear gas is just mist.
Toxins, most airborne chemicals - neutralized.
Industrial pollution, smog, dust storms - no problem.

LIMITS: Still need oxygen. Underwater = drowning. Vacuum = death.
Filters particles, not lack of atmosphere.
Nerve agents may overwhelm - filter helps but not immunity.
Concentrated chemical weapons still dangerous.

DISEASE: Airborne pathogens blocked. Flu, plague, bioweapons - filtered.
Not 100% but dramatically reduced infection risk.
Spores, viruses, bacteria - caught by membrane.
Still vulnerable to blood-borne and contact diseases.

MAINTENANCE: Filter membrane degrades. 6 months typical lifespan.
filterLife property tracks percentage remaining.
Degraded filter = reduced effectiveness, coughing, wheezing.
Replacement quick if you have filter-unit.

INDICATOR: Slight pressure when filter is saturated.
Know when replacement needed. Don't push a failing filter.

REJECTION: Rare. Signs: persistent coughing, fluid in lungs.
Requires removal. Host breathes normally after rejection cleared.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('filterLife', 'Percentage of filter capacity remaining (0-100)');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[AirFilterBuilder] Type 'airFilter' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AirFilterBuilder);
