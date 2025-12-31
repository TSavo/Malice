import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Blunt Weapon Prototypes
 *
 * Hierarchy:
 * $.weapon
 *   $.blunt (base for all blunt weapons)
 *     $.club (general bludgeons - skill: club)
 *       $.baseballBat
 *       $.baton
 *       $.nightstick
 *       $.tonfa
 *     $.pipe (metal pipes - skill: club)
 *       $.leadPipe
 *       $.metalPipe
 *     $.hammer (hammers - skill: hammer)
 *       $.clawHammer
 *       $.sledgehammer
 *       $.ballPeenHammer
 *     $.staff (long poles - skill: staff)
 *       $.boStaff
 *       $.walkingStick
 *     $.mace (weighted striking weapons - skill: mace)
 *       $.morningstar
 *     $.knuckles (hand weapons - skill: brawling)
 *       $.brassKnuckles
 *       $.sapGloves
 */

// ═══════════════════════════════════════════════════════════════════════════
// BASE BLUNT
// ═══════════════════════════════════════════════════════════════════════════

export class BluntBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Blunt Weapon',
        description: 'A weapon for bludgeoning.',
        skill: 'club',
        damage: 15,
        damageType: 'bruise',

        abilities: `Heavy impact weapon for crushing and battering.

STRIKING: Primary attack creates 'bruise' wounds. Severity based on 'damage' + strength + skill. Bruises cause pain, swelling.

BREAKING: High-force hits can break bones. Broken bones impair function, cause extreme pain, require setting.

STUNNING: Head strikes can cause unconsciousness. Compare force vs skull toughness.

BLOCKING: Can block other weapons. Blunt weapons are durable blockers. Takes less damage than blades when blocking.

DESTRUCTION: Effective against objects - doors, locks, furniture. Breaching tool.

NOISE: Impacts are LOUD. Breaking bones, smashing objects - attracts attention.

ARMOR: Less affected by armor than blades. Impact transfers through padding. Effective vs protected targets.

NO MAINTENANCE: Blunt weapons don't need sharpening. Durable. May bend or crack under extreme stress.`,
      },
      methods: {},
    });

    obj.setPropertyDescription(
      'skill',
      'Combat skill used with this weapon (club, hammer, staff, mace, chain, brawling). Affects attack success.',
    );
    obj.setPropertyDescription(
      'damage',
      'Base damage value for attacks. Blunt weapons excel at breaking bones and stunning.',
    );
    obj.setPropertyDescription(
      'damageType',
      'Type of wound inflicted (bruise, puncture for spiked weapons). Bruises cause pain and swelling.',
    );

    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLUBS (skill: club)
// ═══════════════════════════════════════════════════════════════════════════

export class ClubBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Club',
        description: "A simple bludgeon. Humanity's oldest weapon.",
        skill: 'club',
        damage: 18,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class BaseballBatBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Baseball Bat',
        description:
          "A wooden or aluminum bat. America's favorite melee weapon.",
        skill: 'club',
        damage: 25,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class BatonBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Baton',
        description: 'A short club. Designed for control rather than killing.',
        skill: 'club',
        damage: 15,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class NightstickBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Nightstick',
        description:
          'A police-issue side-handle baton. Versatile striking tool.',
        skill: 'club',
        damage: 18,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class TonfaBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Tonfa',
        description: 'An Okinawan side-handle baton. Also good for blocking.',
        skill: 'club',
        damage: 16,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class BlackjackBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Blackjack',
        description:
          'A leather-wrapped lead weight on a spring handle. Silent and effective.',
        skill: 'club',
        damage: 14,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class TireIronBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Tire Iron',
        description: 'A heavy metal bar from a car toolkit. Dual purpose.',
        skill: 'club',
        damage: 22,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PIPES (skill: club)
// ═══════════════════════════════════════════════════════════════════════════

export class PipeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Pipe',
        description: 'A length of metal pipe. Simple and brutal.',
        skill: 'club',
        damage: 20,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class LeadPipeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Lead Pipe',
        description: 'A heavy lead pipe. Classic murder weapon.',
        skill: 'club',
        damage: 24,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class MetalPipeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Metal Pipe',
        description: 'A steel pipe section. Industrial debris repurposed.',
        skill: 'club',
        damage: 20,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class CrowbarBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Crowbar',
        description:
          'A heavy iron pry bar. Good for opening things. And people.',
        skill: 'club',
        damage: 26,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HAMMERS (skill: hammer)
// ═══════════════════════════════════════════════════════════════════════════

export class HammerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Hammer',
        description: 'A basic hammer. The head does the work.',
        skill: 'hammer',
        damage: 20,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class ClawHammerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Claw Hammer',
        description: "A carpenter's hammer with a nail-pulling claw.",
        skill: 'hammer',
        damage: 18,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class SledgehammerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Sledgehammer',
        description: 'A massive two-handed hammer. Demolition tool.',
        skill: 'hammer',
        damage: 40,
        damageType: 'bruise',
        twoHanded: true, // Heavy, requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class BallPeenHammerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Ball Peen Hammer',
        description: "A machinist's hammer with a rounded head.",
        skill: 'hammer',
        damage: 16,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class MalletBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Mallet',
        description: 'A wooden or rubber mallet. Less lethal but still hurts.',
        skill: 'hammer',
        damage: 12,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STAVES (skill: staff)
// ═══════════════════════════════════════════════════════════════════════════

export class StaffBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Staff',
        description: 'A long wooden pole. Simple but effective with training.',
        skill: 'staff',
        damage: 15,
        damageType: 'bruise',
        twoHanded: true, // Long pole requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class BoStaffBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Bo Staff',
        description: 'A six-foot Okinawan staff. Martial arts weapon.',
        skill: 'staff',
        damage: 18,
        damageType: 'bruise',
        twoHanded: true, // Long pole requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class WalkingStickBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Walking Stick',
        description: 'A sturdy cane or walking stick. Innocuous until swung.',
        skill: 'staff',
        damage: 12,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class PoolCueBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Pool Cue',
        description: 'A bar pool cue. Breaks easily but good for a quick jab.',
        skill: 'staff',
        damage: 10,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MACES (skill: mace)
// ═══════════════════════════════════════════════════════════════════════════

export class MaceBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Mace',
        description: 'A weighted striking head on a handle. Armor-crushing.',
        skill: 'mace',
        damage: 30,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class MorningstarBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Morningstar',
        description: 'A spiked ball on a handle. Medieval brutality.',
        skill: 'mace',
        damage: 35,
        damageType: 'puncture',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HAND WEAPONS (skill: brawling)
// ═══════════════════════════════════════════════════════════════════════════

export class BrassKnucklesBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Brass Knuckles',
        description:
          'Metal rings worn over the fingers. Adds weight to punches.',
        skill: 'brawling',
        damage: 12,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class SapGlovesBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Sap Gloves',
        description:
          'Leather gloves with powdered lead in the knuckles. Discrete.',
        skill: 'brawling',
        damage: 10,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class PushDaggerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Push Dagger',
        description: 'A T-shaped blade gripped in the fist. Punching stabs.',
        skill: 'brawling',
        damage: 14,
        damageType: 'puncture',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAINS / FLEXIBLE WEAPONS (skill: chain)
// ═══════════════════════════════════════════════════════════════════════════

export class ChainBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Chain',
        description: 'A heavy metal chain. Swung or wrapped for strikes.',
        skill: 'chain',
        damage: 18,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class BikeChainBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Bike Chain',
        description:
          'A bicycle chain with a padlock on the end. Street classic.',
        skill: 'chain',
        damage: 16,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class NunchakuBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Nunchaku',
        description:
          'Two short sticks connected by a chain. Martial arts weapon.',
        skill: 'chain',
        damage: 14,
        damageType: 'bruise',
      },
      methods: {},
    });
    return obj;
  }
}

export class FlailBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Flail',
        description: 'A spiked ball on a chain attached to a handle. Medieval.',
        skill: 'chain',
        damage: 28,
        damageType: 'bruise',
        twoHanded: true, // Needs swing room and control
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BLUNT WEAPON PROTOTYPES BUILDER (registered builder for all blunt weapons)
// ═══════════════════════════════════════════════════════════════════════════

export class BluntWeaponPrototypesBuilder implements Builder {
  static provides = [
    'blunt',
    'club',
    'baseballBat',
    'baton',
    'nightstick',
    'tonfa',
    'blackjack',
    'tireIron',
    'pipe',
    'leadPipe',
    'metalPipe',
    'crowbar',
    'hammer',
    'clawHammer',
    'sledgehammer',
    'ballPeenHammer',
    'mallet',
    'staff',
    'boStaff',
    'walkingStick',
    'poolCue',
    'mace',
    'morningstar',
    'brassKnuckles',
    'sapGloves',
    'pushDagger',
    'chain',
    'bikeChain',
    'nunchaku',
    'flail',
  ];
  static depends = ['weapon'];

  private weapons: Record<string, RuntimeObject> = {};

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.blunt && !forceRebuild) {
      for (const alias of BluntWeaponPrototypesBuilder.provides) {
        if ($[alias]) this.weapons[alias] = $[alias];
      }
      return;
    }

    const parentObj = $.weapon;
    if (!parentObj) throw new Error('BluntWeaponPrototypesBuilder: $weapon not found');

    const weaponId = parentObj.id;

    // Base blunt (inherits from weapon)
    const blunt = await new BluntBuilder(this.manager).build(weaponId);
    this.weapons.blunt = blunt;

    // Clubs (inherit from blunt)
    const club = await new ClubBuilder(this.manager).build(blunt.id);
    this.weapons.club = club;
    this.weapons.baseballBat = await new BaseballBatBuilder(this.manager).build(club.id);
    this.weapons.baton = await new BatonBuilder(this.manager).build(club.id);
    this.weapons.nightstick = await new NightstickBuilder(this.manager).build(club.id);
    this.weapons.tonfa = await new TonfaBuilder(this.manager).build(club.id);
    this.weapons.blackjack = await new BlackjackBuilder(this.manager).build(club.id);
    this.weapons.tireIron = await new TireIronBuilder(this.manager).build(club.id);

    // Pipes (inherit from blunt)
    const pipe = await new PipeBuilder(this.manager).build(blunt.id);
    this.weapons.pipe = pipe;
    this.weapons.leadPipe = await new LeadPipeBuilder(this.manager).build(pipe.id);
    this.weapons.metalPipe = await new MetalPipeBuilder(this.manager).build(pipe.id);
    this.weapons.crowbar = await new CrowbarBuilder(this.manager).build(pipe.id);

    // Hammers (inherit from blunt)
    const hammer = await new HammerBuilder(this.manager).build(blunt.id);
    this.weapons.hammer = hammer;
    this.weapons.clawHammer = await new ClawHammerBuilder(this.manager).build(hammer.id);
    this.weapons.sledgehammer = await new SledgehammerBuilder(this.manager).build(hammer.id);
    this.weapons.ballPeenHammer = await new BallPeenHammerBuilder(this.manager).build(hammer.id);
    this.weapons.mallet = await new MalletBuilder(this.manager).build(hammer.id);

    // Staves (inherit from blunt)
    const staff = await new StaffBuilder(this.manager).build(blunt.id);
    this.weapons.staff = staff;
    this.weapons.boStaff = await new BoStaffBuilder(this.manager).build(staff.id);
    this.weapons.walkingStick = await new WalkingStickBuilder(this.manager).build(staff.id);
    this.weapons.poolCue = await new PoolCueBuilder(this.manager).build(staff.id);

    // Maces (inherit from blunt)
    const mace = await new MaceBuilder(this.manager).build(blunt.id);
    this.weapons.mace = mace;
    this.weapons.morningstar = await new MorningstarBuilder(this.manager).build(mace.id);

    // Hand weapons (inherit from blunt)
    this.weapons.brassKnuckles = await new BrassKnucklesBuilder(this.manager).build(blunt.id);
    this.weapons.sapGloves = await new SapGlovesBuilder(this.manager).build(blunt.id);
    this.weapons.pushDagger = await new PushDaggerBuilder(this.manager).build(blunt.id);

    // Chains (inherit from blunt)
    const chain = await new ChainBuilder(this.manager).build(blunt.id);
    this.weapons.chain = chain;
    this.weapons.bikeChain = await new BikeChainBuilder(this.manager).build(chain.id);
    this.weapons.nunchaku = await new NunchakuBuilder(this.manager).build(chain.id);
    this.weapons.flail = await new FlailBuilder(this.manager).build(chain.id);

    console.log(`✅ Built ${Object.keys(this.weapons).length} blunt weapon prototypes`);
  }

  async registerAliases(): Promise<void> {
    // Register in memory for immediate access
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    for (const [name, obj] of Object.entries(this.weapons)) {
      if (obj) {
        await objectManager.call('addAlias', name, obj.id);
      }
    }
  }
}

// Self-register
registerBuilder(BluntWeaponPrototypesBuilder);
