import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Armor Mesh prototype
 * Carbon fiber mesh for subdermal armor installation (consumable)
 */
export class ArmorMeshBuilder implements Builder {
  static provides = ['armorMesh'];
  static depends = ['item'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('armorMesh');
    if (existing) {
      this.obj = existing;
    } else {
      const item = await this.manager.load('item');
      if (!item) throw new Error('Item type not found');

      this.obj = await this.manager.define('armorMesh', item, {
        properties: {
          name: 'Armor Mesh Roll',
          description: 'Medical-grade carbon fiber mesh for subdermal armor installation',
          weight: 500,
          sealed: true,
          expirationMonths: 24,

          abilities: `Carbon fiber mesh for subdermal armor installation.

MATERIAL: Medical-grade woven carbon fiber.
Designed to integrate with subdermal tissue.
Provides ballistic protection once installed.
Single roll covers one full-body installation.

REQUIRED FOR: Subdermal armor installation.
Consumed entirely during procedure.
One roll = one patient = one procedure.

STERILE: Must remain sealed until use.
Sealed packaging prevents contamination.
Contaminated mesh causes rejection, infection.
Potentially fatal complications from dirty mesh.

EXPIRATION: Check date before use.
Expired mesh may have degraded fibers.
Weaker protection, higher rejection risk.
expirationMonths tracks remaining shelf life.

COVERAGE: Full roll provides 100% body coverage.
Partial installation possible - uses portion of roll.
Remainder can be stored if resealed properly.
Most docs use full roll for maximum protection.

INSTALLATION: Doc cuts mesh to fit body contours.
Woven beneath dermis through multiple incisions.
Slow, careful work. Mesh must lay flat.
Bunched mesh = reduced protection, visible lumps.

GRADES: This is standard military-grade mesh.
Higher grades exist - thicker, heavier, more protective.
Lower grades (civilian) provide less protection.
Price varies with grade.

STORAGE: Cool, dry environment. Away from UV light.
Heat degrades fibers. Moisture causes corrosion.
Proper storage extends usable life.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('sealed', 'Whether the sterile packaging is intact');
      this.obj.setPropertyDescription('expirationMonths', 'Months until expiration');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ArmorMeshBuilder] Type 'armorMesh' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ArmorMeshBuilder);
