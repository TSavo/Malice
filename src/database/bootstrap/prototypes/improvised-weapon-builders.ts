import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Improvised & Miscellaneous Weapon Prototypes
 * 
 * These are weapons of opportunity - things not designed as weapons
 * but used as such in desperation or criminal activity.
 * 
 * Hierarchy:
 * $.weapon
 *   $.improvised (base for all improvised weapons)
 *     $.bottle (glass bottles - skill: improvised)
 *     $.brick (thrown debris - skill: improvised)
 *     $.screwdriver (stabbing tools - skill: improvised)
 *   $.thrown (ranged improvised - skill: throwing)
 *     $.throwingKnife
 *     $.rock
 *   $.exotic (unusual weapons - various skills)
 *     $.garotte (strangulation wire - skill: garrote)
 *     $.whip (flexible striking - skill: whip)
 *     $.taser (electrical - skill: taser)
 */

// ═══════════════════════════════════════════════════════════════════════════
// BASE IMPROVISED
// ═══════════════════════════════════════════════════════════════════════════

export class ImprovisedBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Improvised Weapon',
        description: 'Something repurposed as a weapon.',
        skill: 'improvised',
        damage: 8,
        damageType: 'bruise',

        abilities: `Everyday object used as a weapon. Desperate or opportunistic.

VERSATILITY: Found anywhere. Bottles, tools, furniture. Skill: 'improvised' covers all.

FRAGILITY: Many improvised weapons break on impact. Bottles shatter (creates cutting edges). Chairs splinter.

DAMAGE: Lower 'damage' than purpose-built weapons. Compensated by availability and surprise.

SURPRISE: Using mundane objects as weapons may catch targets off-guard. First strike advantage.

DISPOSAL: Can be dropped at scene without connecting to attacker. No registered weapons.

TYPES:
- Glass (bottles, jars): Shatters to 'cut' damage
- Tools (screwdrivers, hammers): 'puncture' or 'bruise'
- Blunt objects (bats, pipes): 'bruise', may break bones
- Thrown (rocks, bricks): Ranged, 'bruise'

LEGAL: Most improvised weapons are not contraband until used criminally.`,
      },
      methods: {},
    });

    obj.setPropertyDescription('skill', 'The combat skill used with this weapon (improvised, throwing, etc.).');
    obj.setPropertyDescription('damage', 'Base damage value. Lower than purpose-built weapons but compensated by availability.');
    obj.setPropertyDescription('damageType', 'Type of damage inflicted (bruise, cut, puncture, burn).');

    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS / BOTTLES (skill: improvised)
// ═══════════════════════════════════════════════════════════════════════════

export class BottleBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Bottle',
        description: 'A glass bottle. Breaks on impact for cutting edges.',
        skill: 'improvised',
        damage: 10,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class BrokenBottleBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Broken Bottle',
        description: 'A shattered bottle with jagged glass edges. Bar fight classic.',
        skill: 'improvised',
        damage: 14,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class BeerBottleBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Beer Bottle',
        description: 'A heavy glass beer bottle. Solid swing weight.',
        skill: 'improvised',
        damage: 12,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBRIS / THROWN (skill: improvised or throwing)
// ═══════════════════════════════════════════════════════════════════════════

export class BrickBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Brick',
        description: 'A common red brick. Heavy, angular, effective.',
        skill: 'improvised',
        damage: 15,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class RockBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Rock',
        description: 'A fist-sized stone. The original weapon.',
        skill: 'throwing',
        damage: 10,
        damageType: 'bruise',
        ranged: true,
        range: 15,
        ammo: 1,
        maxAmmo: 1,
      },
      methods: {},
    });
    return obj;
  }
}

export class CinderBlockBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Cinder Block',
        description: 'A heavy concrete block. Requires two hands.',
        skill: 'improvised',
        damage: 25,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOLS AS WEAPONS (skill: improvised)
// ═══════════════════════════════════════════════════════════════════════════

export class ScrewdriverBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Screwdriver',
        description: 'A flathead screwdriver. Improvised stabbing tool.',
        skill: 'improvised',
        damage: 12,
        damageType: 'puncture',
      },
      methods: {},
    });
    return obj;
  }
}

export class IcepickBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Ice Pick',
        description: 'A pointed metal spike with a handle. Silent killer.',
        skill: 'improvised',
        damage: 16,
        damageType: 'puncture',
      },
      methods: {},
    });
    return obj;
  }
}

export class AwlBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Awl',
        description: 'A leather-working tool. Sharp metal spike.',
        skill: 'improvised',
        damage: 10,
        damageType: 'puncture',
      },
      methods: {},
    });
    return obj;
  }
}

export class WrenchBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Wrench',
        description: 'A heavy metal wrench. Solid bludgeon.',
        skill: 'improvised',
        damage: 18,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class PrybarBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Prybar',
        description: 'A small prying tool. Metal bar with a flat end.',
        skill: 'improvised',
        damage: 14,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class HammerImprovisedBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Claw Hammer',
        description: 'A regular claw hammer. Common household weapon.',
        skill: 'improvised',
        damage: 16,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KITCHEN IMPLEMENTS (skill: improvised)
// ═══════════════════════════════════════════════════════════════════════════

export class KitchenKnifeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Kitchen Knife',
        description: 'A regular kitchen knife. Not designed for fighting.',
        skill: 'improvised',
        damage: 12,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class ButcherKnifeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Butcher Knife',
        description: 'A large kitchen knife for cutting meat.',
        skill: 'improvised',
        damage: 18,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class SkilletBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Cast Iron Skillet',
        description: 'A heavy cast iron pan. Surprisingly effective.',
        skill: 'improvised',
        damage: 20,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class RollingPinBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Rolling Pin',
        description: 'A wooden rolling pin. Domestic dispute classic.',
        skill: 'improvised',
        damage: 12,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// THROWING WEAPONS (skill: throwing)
// ═══════════════════════════════════════════════════════════════════════════

export class ThrowingKnifeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Throwing Knife',
        description: 'A balanced knife designed for throwing.',
        skill: 'throwing',
        damage: 15,
        damageType: 'puncture',
        ranged: true,
        range: 10,
        ammo: 1,
        maxAmmo: 1,
      },
      methods: {},
    });
    return obj;
  }
}

export class ThrowingStarBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Throwing Star',
        description: 'A metal shuriken. Ninja movie prop.',
        skill: 'throwing',
        damage: 10,
        damageType: 'cut',
        ranged: true,
        range: 8,
        ammo: 1,
        maxAmmo: 1,
      },
      methods: {},
    });
    return obj;
  }
}

export class DartBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Dart',
        description: 'A steel-tipped throwing dart. Bar game turned weapon.',
        skill: 'throwing',
        damage: 8,
        damageType: 'puncture',
        ranged: true,
        range: 5,
        ammo: 1,
        maxAmmo: 1,
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXOTIC WEAPONS
// ═══════════════════════════════════════════════════════════════════════════

export class GarroteBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Garrote',
        description: 'A thin wire with handles. Silent strangulation tool.',
        skill: 'garrote',
        damage: 30,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class WhipBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Whip',
        description: 'A leather bullwhip. Long reach, stinging strikes.',
        skill: 'whip',
        damage: 12,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class CattleProdBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Cattle Prod',
        description: 'An electric livestock prod. Painful shock.',
        skill: 'taser',
        damage: 10,
        damageType: 'burn',
      },
      methods: {},
    });
    return obj;
  }
}

export class StunGunBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Stun Gun',
        description: 'A handheld electrical incapacitator. Requires contact.',
        skill: 'taser',
        damage: 8,
        damageType: 'burn',
      },
      methods: {},
    });
    return obj;
  }
}

export class TaserBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Taser',
        description: 'A ranged electrical weapon firing barbed probes.',
        skill: 'taser',
        damage: 10,
        damageType: 'burn',
        ranged: true,
        range: 5,
        ammo: 1,
        maxAmmo: 1,
        ammoType: 'taser-cartridge',
      },
      methods: {},
    });
    return obj;
  }
}

export class PepperSprayBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Pepper Spray',
        description: 'A canister of OC spray. Causes temporary blindness and pain.',
        skill: 'improvised',
        damage: 5,
        damageType: 'burn',
        ranged: true,
        range: 3,
        ammo: 10,
        maxAmmo: 10,
        ammoType: 'pepper-spray',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SPORTS EQUIPMENT (skill: varies)
// ═══════════════════════════════════════════════════════════════════════════

export class GolfClubBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Golf Club',
        description: 'A metal golf club. Good reach, solid swing.',
        skill: 'improvised',
        damage: 18,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class HockeyStickBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Hockey Stick',
        description: 'A hockey stick. Light but with reach.',
        skill: 'improvised',
        damage: 12,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class LacrosseStickBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Lacrosse Stick',
        description: 'A lacrosse stick. The metal shaft is the weapon.',
        skill: 'improvised',
        damage: 14,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class CricketBatBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Cricket Bat',
        description: 'A flat wooden bat. Commonwealth skull-cracker.',
        skill: 'club',
        damage: 22,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}
