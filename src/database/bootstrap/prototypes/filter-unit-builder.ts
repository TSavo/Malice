import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Filter Unit prototype
 * Replacement filter membrane for internal filter chrome (consumable)
 */
export class FilterUnitBuilder implements Builder {
  static provides = ['filterUnit'];
  static depends = ['item'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('filterUnit');
    if (existing) {
      this.obj = existing;
    } else {
      const item = await this.manager.load('item');
      if (!item) throw new Error('Item type not found');

      this.obj = await this.manager.define('filterUnit', item, {
        properties: {
          name: 'Filter Unit',
          description: 'Biocompatible filtration mesh for internal filter installation',
          weight: 150,
          filterType: 'universal',
          sealed: true,
          expirationMonths: 12,

          abilities: `Replacement filter membrane for internal filter chrome.

MATERIAL: Biocompatible filtration mesh.
Designed for implantation in airways or liver.
Captures particles, neutralizes toxins.
Single unit - one installation or replacement.

REQUIRED FOR: Air filter installation.
Toxin filter installation.
Filter replacement maintenance.
Any internal filtration chrome.

TYPES: Universal filter works for both applications.
Specialized lung filters have finer mesh.
Specialized liver filters have different chemistry.
Using wrong type increases rejection risk.

filterType property indicates filter specialization:
- 'universal' - works for air or toxin filter
- 'pulmonary' - optimized for lung installation
- 'hepatic' - optimized for liver installation

STERILE: Medical-grade packaging required.
Compromised seal = contaminated filter.
Contaminated filter causes severe infection.
Lung infection can be fatal. Liver infection worse.

INSTALLATION: Doc inserts through surgical incision.
Air filter: membrane lines bronchial passages.
Toxin filter: mesh integrates with liver tissue.
Precise placement critical for function.

REPLACEMENT: Existing chrome has filter that degrades.
Air filters last ~6 months. Toxin filters last longer.
Degraded filter = reduced protection.
Schedule replacement before filter fails.

EXPIRATION: Check date. Filters degrade in storage.
Expired filter may not function properly.
Fresh stock from medical suppliers preferred.

STORAGE: Cool, dry, sealed. Away from chemicals.
Short shelf life compared to other supplies.
Order as needed rather than stockpiling.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('filterType', "Filter specialization: 'universal', 'pulmonary', or 'hepatic'");
      this.obj.setPropertyDescription('sealed', 'Whether the sterile packaging is intact');
      this.obj.setPropertyDescription('expirationMonths', 'Months until expiration');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[FilterUnitBuilder] Type 'filterUnit' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FilterUnitBuilder);
