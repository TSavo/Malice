import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Improvised & Miscellaneous Weapon Types
 *
 * Hierarchy:
 * $.weapon
 *   $.improvised (base for all improvised weapons)
 *     $.bottle, $.brokenBottle, $.beerBottle
 *     $.brick, $.rock, $.cinderBlock
 *     $.screwdriver, $.icepick, $.awl, $.wrench, $.prybar, $.hammerImprovised
 *     $.kitchenKnife, $.butcherKnife, $.skillet, $.rollingPin
 *     $.throwingKnife, $.throwingStar, $.dart
 *     $.garrote, $.whip, $.cattleProd, $.stunGun, $.taser, $.pepperSpray
 *     $.golfClub, $.hockeyStick, $.lacrosseStick, $.cricketBat
 */

// ═══════════════════════════════════════════════════════════════════════════
// BASE IMPROVISED
// ═══════════════════════════════════════════════════════════════════════════

export class ImprovisedBuilder implements Builder {
  static provides = ['improvised'];
  static depends = ['weapon'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('improvised')) return;

    const parent = await this.manager.load('weapon');
    if (!parent) throw new Error('ImprovisedBuilder: weapon type not found');

    const obj = await this.manager.define('improvised', parent, {
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

    obj.setPropertyDescription(
      'skill',
      'The combat skill used with this weapon (improvised, throwing, etc.).',
    );
    obj.setPropertyDescription(
      'damage',
      'Base damage value. Lower than purpose-built weapons but compensated by availability.',
    );
    obj.setPropertyDescription(
      'damageType',
      'Type of damage inflicted (bruise, cut, puncture, burn).',
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[ImprovisedBuilder] Type 'improvised' auto-aliased");
  }
}

registerBuilder(ImprovisedBuilder);

// ═══════════════════════════════════════════════════════════════════════════
// GLASS / BOTTLES
// ═══════════════════════════════════════════════════════════════════════════

export class BottleBuilder implements Builder {
  static provides = ['bottle'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('bottle')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('BottleBuilder: improvised type not found');

    await this.manager.define('bottle', parent, {
      properties: {
        name: 'Bottle',
        description: 'A glass bottle. Breaks on impact for cutting edges.',
        skill: 'improvised',
        damage: 10,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[BottleBuilder] Type 'bottle' auto-aliased");
  }
}

export class BrokenBottleBuilder implements Builder {
  static provides = ['brokenBottle'];
  static depends = ['bottle'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('brokenBottle')) return;

    const parent = await this.manager.load('bottle');
    if (!parent) throw new Error('BrokenBottleBuilder: bottle type not found');

    await this.manager.define('brokenBottle', parent, {
      properties: {
        name: 'Broken Bottle',
        description:
          'A shattered bottle with jagged glass edges. Bar fight classic.',
        skill: 'improvised',
        damage: 14,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[BrokenBottleBuilder] Type 'brokenBottle' auto-aliased");
  }
}

export class BeerBottleBuilder implements Builder {
  static provides = ['beerBottle'];
  static depends = ['bottle'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('beerBottle')) return;

    const parent = await this.manager.load('bottle');
    if (!parent) throw new Error('BeerBottleBuilder: bottle type not found');

    await this.manager.define('beerBottle', parent, {
      properties: {
        name: 'Beer Bottle',
        description: 'A heavy glass beer bottle. Solid swing weight.',
        skill: 'improvised',
        damage: 12,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[BeerBottleBuilder] Type 'beerBottle' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBRIS / THROWN
// ═══════════════════════════════════════════════════════════════════════════

export class BrickBuilder implements Builder {
  static provides = ['brick'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('brick')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('BrickBuilder: improvised type not found');

    await this.manager.define('brick', parent, {
      properties: {
        name: 'Brick',
        description: 'A common red brick. Heavy, angular, effective.',
        skill: 'improvised',
        damage: 15,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[BrickBuilder] Type 'brick' auto-aliased");
  }
}

export class RockBuilder implements Builder {
  static provides = ['rock'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('rock')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('RockBuilder: improvised type not found');

    await this.manager.define('rock', parent, {
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
  }

  async registerAliases(): Promise<void> {
    console.log("[RockBuilder] Type 'rock' auto-aliased");
  }
}

export class CinderBlockBuilder implements Builder {
  static provides = ['cinderBlock'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('cinderBlock')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('CinderBlockBuilder: improvised type not found');

    await this.manager.define('cinderBlock', parent, {
      properties: {
        name: 'Cinder Block',
        description: 'A heavy concrete block. Requires two hands.',
        skill: 'improvised',
        damage: 25,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[CinderBlockBuilder] Type 'cinderBlock' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOLS AS WEAPONS
// ═══════════════════════════════════════════════════════════════════════════

export class ScrewdriverBuilder implements Builder {
  static provides = ['screwdriver'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('screwdriver')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('ScrewdriverBuilder: improvised type not found');

    await this.manager.define('screwdriver', parent, {
      properties: {
        name: 'Screwdriver',
        description: 'A flathead screwdriver. Improvised stabbing tool.',
        skill: 'improvised',
        damage: 12,
        damageType: 'puncture',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[ScrewdriverBuilder] Type 'screwdriver' auto-aliased");
  }
}

export class IcepickBuilder implements Builder {
  static provides = ['icepick'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('icepick')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('IcepickBuilder: improvised type not found');

    await this.manager.define('icepick', parent, {
      properties: {
        name: 'Ice Pick',
        description: 'A pointed metal spike with a handle. Silent killer.',
        skill: 'improvised',
        damage: 16,
        damageType: 'puncture',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[IcepickBuilder] Type 'icepick' auto-aliased");
  }
}

export class AwlBuilder implements Builder {
  static provides = ['awl'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('awl')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('AwlBuilder: improvised type not found');

    await this.manager.define('awl', parent, {
      properties: {
        name: 'Awl',
        description: 'A leather-working tool. Sharp metal spike.',
        skill: 'improvised',
        damage: 10,
        damageType: 'puncture',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[AwlBuilder] Type 'awl' auto-aliased");
  }
}

export class WrenchBuilder implements Builder {
  static provides = ['wrench'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('wrench')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('WrenchBuilder: improvised type not found');

    await this.manager.define('wrench', parent, {
      properties: {
        name: 'Wrench',
        description: 'A heavy metal wrench. Solid bludgeon.',
        skill: 'improvised',
        damage: 18,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[WrenchBuilder] Type 'wrench' auto-aliased");
  }
}

export class PrybarBuilder implements Builder {
  static provides = ['prybar'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('prybar')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('PrybarBuilder: improvised type not found');

    await this.manager.define('prybar', parent, {
      properties: {
        name: 'Prybar',
        description: 'A small prying tool. Metal bar with a flat end.',
        skill: 'improvised',
        damage: 14,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[PrybarBuilder] Type 'prybar' auto-aliased");
  }
}

export class HammerImprovisedBuilder implements Builder {
  static provides = ['hammerImprovised'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('hammerImprovised')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('HammerImprovisedBuilder: improvised type not found');

    await this.manager.define('hammerImprovised', parent, {
      properties: {
        name: 'Claw Hammer',
        description: 'A regular claw hammer. Common household weapon.',
        skill: 'improvised',
        damage: 16,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log(
      "[HammerImprovisedBuilder] Type 'hammerImprovised' auto-aliased",
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KITCHEN IMPLEMENTS
// ═══════════════════════════════════════════════════════════════════════════

export class KitchenKnifeBuilder implements Builder {
  static provides = ['kitchenKnife'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('kitchenKnife')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('KitchenKnifeBuilder: improvised type not found');

    await this.manager.define('kitchenKnife', parent, {
      properties: {
        name: 'Kitchen Knife',
        description: 'A regular kitchen knife. Not designed for fighting.',
        skill: 'improvised',
        damage: 12,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[KitchenKnifeBuilder] Type 'kitchenKnife' auto-aliased");
  }
}

export class ButcherKnifeBuilder implements Builder {
  static provides = ['butcherKnife'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('butcherKnife')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('ButcherKnifeBuilder: improvised type not found');

    await this.manager.define('butcherKnife', parent, {
      properties: {
        name: 'Butcher Knife',
        description: 'A large kitchen knife for cutting meat.',
        skill: 'improvised',
        damage: 18,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[ButcherKnifeBuilder] Type 'butcherKnife' auto-aliased");
  }
}

export class SkilletBuilder implements Builder {
  static provides = ['skillet'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('skillet')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('SkilletBuilder: improvised type not found');

    await this.manager.define('skillet', parent, {
      properties: {
        name: 'Cast Iron Skillet',
        description: 'A heavy cast iron pan. Surprisingly effective.',
        skill: 'improvised',
        damage: 20,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[SkilletBuilder] Type 'skillet' auto-aliased");
  }
}

export class RollingPinBuilder implements Builder {
  static provides = ['rollingPin'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('rollingPin')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('RollingPinBuilder: improvised type not found');

    await this.manager.define('rollingPin', parent, {
      properties: {
        name: 'Rolling Pin',
        description: 'A wooden rolling pin. Domestic dispute classic.',
        skill: 'improvised',
        damage: 12,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[RollingPinBuilder] Type 'rollingPin' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// THROWING WEAPONS
// ═══════════════════════════════════════════════════════════════════════════

export class ThrowingKnifeBuilder implements Builder {
  static provides = ['throwingKnife'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('throwingKnife')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('ThrowingKnifeBuilder: improvised type not found');

    await this.manager.define('throwingKnife', parent, {
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
  }

  async registerAliases(): Promise<void> {
    console.log("[ThrowingKnifeBuilder] Type 'throwingKnife' auto-aliased");
  }
}

export class ThrowingStarBuilder implements Builder {
  static provides = ['throwingStar'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('throwingStar')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('ThrowingStarBuilder: improvised type not found');

    await this.manager.define('throwingStar', parent, {
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
  }

  async registerAliases(): Promise<void> {
    console.log("[ThrowingStarBuilder] Type 'throwingStar' auto-aliased");
  }
}

export class DartBuilder implements Builder {
  static provides = ['dart'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('dart')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('DartBuilder: improvised type not found');

    await this.manager.define('dart', parent, {
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
  }

  async registerAliases(): Promise<void> {
    console.log("[DartBuilder] Type 'dart' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXOTIC WEAPONS
// ═══════════════════════════════════════════════════════════════════════════

export class GarroteBuilder implements Builder {
  static provides = ['garrote'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('garrote')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('GarroteBuilder: improvised type not found');

    await this.manager.define('garrote', parent, {
      properties: {
        name: 'Garrote',
        description: 'A thin wire with handles. Silent strangulation tool.',
        skill: 'garrote',
        damage: 30,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[GarroteBuilder] Type 'garrote' auto-aliased");
  }
}

export class WhipBuilder implements Builder {
  static provides = ['whip'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('whip')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('WhipBuilder: improvised type not found');

    await this.manager.define('whip', parent, {
      properties: {
        name: 'Whip',
        description: 'A leather bullwhip. Long reach, stinging strikes.',
        skill: 'whip',
        damage: 12,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[WhipBuilder] Type 'whip' auto-aliased");
  }
}

export class CattleProdBuilder implements Builder {
  static provides = ['cattleProd'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('cattleProd')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('CattleProdBuilder: improvised type not found');

    await this.manager.define('cattleProd', parent, {
      properties: {
        name: 'Cattle Prod',
        description: 'An electric livestock prod. Painful shock.',
        skill: 'taser',
        damage: 10,
        damageType: 'burn',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[CattleProdBuilder] Type 'cattleProd' auto-aliased");
  }
}

export class StunGunBuilder implements Builder {
  static provides = ['stunGun'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('stunGun')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('StunGunBuilder: improvised type not found');

    await this.manager.define('stunGun', parent, {
      properties: {
        name: 'Stun Gun',
        description: 'A handheld electrical incapacitator. Requires contact.',
        skill: 'taser',
        damage: 8,
        damageType: 'burn',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[StunGunBuilder] Type 'stunGun' auto-aliased");
  }
}

export class TaserBuilder implements Builder {
  static provides = ['taser'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('taser')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('TaserBuilder: improvised type not found');

    await this.manager.define('taser', parent, {
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
  }

  async registerAliases(): Promise<void> {
    console.log("[TaserBuilder] Type 'taser' auto-aliased");
  }
}

export class PepperSprayBuilder implements Builder {
  static provides = ['pepperSpray'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('pepperSpray')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('PepperSprayBuilder: improvised type not found');

    await this.manager.define('pepperSpray', parent, {
      properties: {
        name: 'Pepper Spray',
        description:
          'A canister of OC spray. Causes temporary blindness and pain.',
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
  }

  async registerAliases(): Promise<void> {
    console.log("[PepperSprayBuilder] Type 'pepperSpray' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SPORTS EQUIPMENT
// ═══════════════════════════════════════════════════════════════════════════

export class GolfClubBuilder implements Builder {
  static provides = ['golfClub'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('golfClub')) return;

    const parent = await this.manager.load('improvised');
    if (!parent) throw new Error('GolfClubBuilder: improvised type not found');

    await this.manager.define('golfClub', parent, {
      properties: {
        name: 'Golf Club',
        description: 'A metal golf club. Good reach, solid swing.',
        skill: 'improvised',
        damage: 18,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[GolfClubBuilder] Type 'golfClub' auto-aliased");
  }
}

export class HockeyStickBuilder implements Builder {
  static provides = ['hockeyStick'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('hockeyStick')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('HockeyStickBuilder: improvised type not found');

    await this.manager.define('hockeyStick', parent, {
      properties: {
        name: 'Hockey Stick',
        description: 'A hockey stick. Light but with reach.',
        skill: 'improvised',
        damage: 12,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[HockeyStickBuilder] Type 'hockeyStick' auto-aliased");
  }
}

export class LacrosseStickBuilder implements Builder {
  static provides = ['lacrosseStick'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('lacrosseStick')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('LacrosseStickBuilder: improvised type not found');

    await this.manager.define('lacrosseStick', parent, {
      properties: {
        name: 'Lacrosse Stick',
        description: 'A lacrosse stick. The metal shaft is the weapon.',
        skill: 'improvised',
        damage: 14,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[LacrosseStickBuilder] Type 'lacrosseStick' auto-aliased");
  }
}

export class CricketBatBuilder implements Builder {
  static provides = ['cricketBat'];
  static depends = ['improvised'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('cricketBat')) return;

    const parent = await this.manager.load('improvised');
    if (!parent)
      throw new Error('CricketBatBuilder: improvised type not found');

    await this.manager.define('cricketBat', parent, {
      properties: {
        name: 'Cricket Bat',
        description: 'A flat wooden bat. Commonwealth skull-cracker.',
        skill: 'club',
        damage: 22,
        damageType: 'bruise',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[CricketBatBuilder] Type 'cricketBat' auto-aliased");
  }
}

// Self-register all builders
registerBuilder(BottleBuilder);
registerBuilder(BrokenBottleBuilder);
registerBuilder(BeerBottleBuilder);
registerBuilder(BrickBuilder);
registerBuilder(RockBuilder);
registerBuilder(CinderBlockBuilder);
registerBuilder(ScrewdriverBuilder);
registerBuilder(IcepickBuilder);
registerBuilder(AwlBuilder);
registerBuilder(WrenchBuilder);
registerBuilder(PrybarBuilder);
registerBuilder(HammerImprovisedBuilder);
registerBuilder(KitchenKnifeBuilder);
registerBuilder(ButcherKnifeBuilder);
registerBuilder(SkilletBuilder);
registerBuilder(RollingPinBuilder);
registerBuilder(ThrowingKnifeBuilder);
registerBuilder(ThrowingStarBuilder);
registerBuilder(DartBuilder);
registerBuilder(GarroteBuilder);
registerBuilder(WhipBuilder);
registerBuilder(CattleProdBuilder);
registerBuilder(StunGunBuilder);
registerBuilder(TaserBuilder);
registerBuilder(PepperSprayBuilder);
registerBuilder(GolfClubBuilder);
registerBuilder(HockeyStickBuilder);
registerBuilder(LacrosseStickBuilder);
registerBuilder(CricketBatBuilder);
