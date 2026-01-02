import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Bone Lacing prototype
 * Metal mesh surgically bonded to bones throughout body
 */
export class BoneLacingBuilder implements Builder {
  static provides = ['boneLacing'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('boneLacing');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('boneLacing', cyberware, {
        properties: {
          name: 'Bone Lacing',
          description: 'Titanium mesh surgically bonded to bones throughout body',
          weight: 10000,
          slot: 'skeleton',
          material: 'titanium',
          addedWeight: 10,

          installAbilities: `BONE LACING: Titanium mesh woven through skeleton.
Bones cannot break. Punches and kicks hit harder.
Body heavier - 10kg added weight. Drowning risk increased.
Cannot be detected externally. X-ray or deep scan reveals.`,

          abilities: `Metal mesh surgically bonded to bones throughout body.

INSTALLATION: Requires surgical-kit + bone-weave + anesthetic.
Longest procedure - 8+ hours. Multiple incisions.
Mesh bonds to every major bone. Add installAbilities to host.
Recovery: 4 weeks. Entire body aches. Cannot move much at first.

REMOVAL: Not possible. Mesh integrated with bone. Permanent.
This is a one-way procedure. Choose carefully.

DURABILITY: Bones don't break. Falls, impacts, fights - bones hold.
Still feel pain. Still bruise. Ligaments and tendons still tear.
But bones stay intact. Fractures impossible.

IMPACT: Punches and kicks hit harder. Fist backed by titanium.
Headbutt devastating. Elbow strikes bone-crushing.
Martial arts more effective. Unarmed becomes dangerous.

WEIGHT: 10kg added to body weight. Heavier footsteps.
Swimming harder - sink faster. Noticeable in water.
Vehicles notice added weight. Chairs creak more.
Joints work harder - more calories burned moving.

DETECTION: Cannot feel from outside. Looks normal.
Deep body scans reveal lacing. X-rays show clearly.
Security at high-end facilities will detect.

METABOLISM: Burns more calories just existing.
Heavy exercise = much more hungry. Eat accordingly.
Starvation more dangerous with lacing.

REJECTION: Rare. Signs: bone pain, weakness, swelling.
Cannot remove if rejection occurs. Immunosuppressants help.
Severe rejection = chronic pain, reduced mobility. No fix.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('material', 'Lacing material (titanium, ceramic, etc.)');
      this.obj.setPropertyDescription('addedWeight', 'Additional body weight in kilograms');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[BoneLacingBuilder] Type 'boneLacing' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BoneLacingBuilder);
