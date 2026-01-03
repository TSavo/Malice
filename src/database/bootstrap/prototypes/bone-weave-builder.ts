import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Bone Weave prototype
 * Metal mesh for bone lacing procedure (consumable)
 */
export class BoneWeaveBuilder implements Builder {
  static provides = ['boneWeave'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('boneWeave');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('boneWeave', medical, {
        properties: {
          name: 'Bone Weave Kit',
          description: 'Surgical-grade titanium mesh for bone lacing procedure',
          weight: 300,
          material: 'titanium',
          sealed: true,
          expirationMonths: 60,

          abilities: `Titanium mesh for bone lacing procedure.

MATERIAL: Surgical-grade titanium mesh.
Designed to bond with living bone tissue.
Reinforces entire skeleton when installed.
Kit contains enough for one full skeleton.

REQUIRED FOR: Bone lacing installation.
Single use - entire kit consumed in procedure.
One kit = one patient = permanent modification.

STERILE: Sealed container required for medical use.
Contamination causes bone infection (osteomyelitis).
Potentially fatal. Never use compromised kit.
Check seal integrity before purchase.

MATERIALS: Titanium is standard - hypoallergenic.
Ceramic variants exist for special cases.
Aluminum alloy (lighter, weaker) for weight-conscious.
Match material to patient allergies.

BONDING: Mesh chemically bonds with bone surface.
Process takes 4 weeks to complete.
During recovery, bones are weaker than normal.
After bonding, bones are virtually unbreakable.

PROCEDURE: Longest cyberware installation - 8+ hours.
Multiple incisions across entire body.
Mesh applied to every major bone.
Incredibly invasive. Significant recovery time.

WEIGHT: Adds approximately 10kg to body weight.
Titanium is dense. This is unavoidable.
Patient must adjust to new weight.

PERMANENCE: Once bonded, cannot be removed.
Mesh becomes part of bone structure.
This is a one-way procedure. Permanent decision.
Make sure patient understands before proceeding.

STORAGE: Room temperature. Keep dry.
Titanium doesn't degrade easily.
Long shelf life - 5+ years if sealed.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'material',
        "Mesh material type ('titanium', 'ceramic', 'aluminum')",
      );
      this.obj.setPropertyDescription(
        'sealed',
        'Whether the sterile packaging is intact',
      );
      this.obj.setPropertyDescription(
        'expirationMonths',
        'Months until expiration',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[BoneWeaveBuilder] Type 'boneWeave' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BoneWeaveBuilder);
