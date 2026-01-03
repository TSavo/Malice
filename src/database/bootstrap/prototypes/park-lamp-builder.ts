import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the ParkLamp type
 * Decorative lamp for parks and pedestrian areas.
 *
 * Unlike utilitarian street lampposts, park lamps are designed for
 * aesthetics—Victorian-style cast iron with ornate detailing, the kind
 * of thing Seattle installed during the Pioneer Square revitalization.
 * They're shorter, dimmer, and meant to create atmosphere rather than
 * flood an intersection with light.
 *
 * Inherits from Lamppost (shares damage, lighting, reporting behavior).
 */
export class ParkLampBuilder implements Builder {
  static provides = ['parkLamp'];
  static depends = ['lamppost'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('parkLamp');
    if (existing) {
      this.obj = existing;
    } else {
      const lamppost = await this.manager.load('lamppost');
      if (!lamppost) {
        throw new Error('Lamppost type not found - required for ParkLamp');
      }

      this.obj = await this.manager.define('parkLamp', lamppost, {
        properties: {
          name: 'Park Lamp',
          description: `A decorative cast-iron lamp, Victorian in style—fluted column, ornate base, glass globe housing the light. The design dates to Pioneer Square's 1970s revitalization, when the city decided to embrace its history rather than demolish it. The iron is painted black, though rust bleeds through where the paint has chipped. The glass globe is clouded with age but intact.`,
          // Shorter than street lamps
          height: 300, // ~10 feet
          // Decorative style
          lightType: 'warm', // Warmer light than LED street lamps
          // Less surveillance in park lamps (but still possible)
          hasSurveillance: false,
          // Abilities override
          abilities: `Decorative park lamp providing warm illumination.

LIGHTING: When 'lit' is true, provides soft warm light to the area.
Less intense than street lamps—meant for ambiance, not security.
Illuminates the immediate area at night but doesn't flood it.

DAMAGE: Cast iron is sturdy but the glass globe is vulnerable.
'durability' 0-100. Below 30, light flickers. At 0, globe shatters
and light fails.

SELF-REPORTING: Like all city infrastructure, these lamps phone home
when broken. Pluribus knows when they fail. The parks department
used to send someone to fix them. Now Pluribus just... knows.

CLIMBING: The ornate base provides handholds. Can be climbed with
some effort, unlike the smooth street lampposts.`,
        },
        methods: {},
      });
    }

    const obj = this.obj!;

    // Property descriptions
    obj.setPropertyDescription(
      'lightType',
      "Style of light: 'warm' for the amber glow of decorative lamps",
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[ParkLampBuilder] Type 'parkLamp' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

// Self-register
registerBuilder(ParkLampBuilder);
