import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Blunt Weapon Types
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

  async build(): Promise<void> {
    const parent = await this.manager.load('weapon');
    if (!parent)
      throw new Error('BluntWeaponPrototypesBuilder: weapon type not found');

    // Base blunt (inherits from weapon)
    let blunt = await this.manager.load('blunt');
    if (blunt) {
      this.weapons.blunt = blunt;
    } else {
      blunt = await this.manager.define('blunt', parent, {
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
      blunt.setPropertyDescription(
        'skill',
        'Combat skill used with this weapon (club, hammer, staff, mace, chain, brawling). Affects attack success.',
      );
      blunt.setPropertyDescription(
        'damage',
        'Base damage value for attacks. Blunt weapons excel at breaking bones and stunning.',
      );
      blunt.setPropertyDescription(
        'damageType',
        'Type of wound inflicted (bruise, puncture for spiked weapons). Bruises cause pain and swelling.',
      );
      this.weapons.blunt = blunt;
    }

    // Clubs (inherit from blunt)
    let club = await this.manager.load('club');
    if (club) {
      this.weapons.club = club;
    } else {
      club = await this.manager.define('club', blunt, {
        properties: {
          name: 'Club',
          description: "A simple bludgeon. Humanity's oldest weapon.",
          skill: 'club',
          damage: 18,
          damageType: 'bruise',
        },
        methods: {},
      });
      this.weapons.club = club;
    }

    const existing_baseballBat = await this.manager.load('baseballBat');
    if (existing_baseballBat) {
      this.weapons.baseballBat = existing_baseballBat;
    } else {
      this.weapons.baseballBat = await this.manager.define(
        'baseballBat',
        club,
        {
          properties: {
            name: 'Baseball Bat',
            description:
              "A wooden or aluminum bat. America's favorite melee weapon.",
            skill: 'club',
            damage: 25,
            damageType: 'bruise',
          },
          methods: {},
        },
      );
    }

    const existing_baton = await this.manager.load('baton');
    if (existing_baton) {
      this.weapons.baton = existing_baton;
    } else {
      this.weapons.baton = await this.manager.define('baton', club, {
        properties: {
          name: 'Baton',
          description:
            'A short club. Designed for control rather than killing.',
          skill: 'club',
          damage: 15,
          damageType: 'bruise',
        },
        methods: {},
      });
    }

    const existing_nightstick = await this.manager.load('nightstick');
    if (existing_nightstick) {
      this.weapons.nightstick = existing_nightstick;
    } else {
      this.weapons.nightstick = await this.manager.define('nightstick', club, {
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
    }

    const existing_tonfa = await this.manager.load('tonfa');
    if (existing_tonfa) {
      this.weapons.tonfa = existing_tonfa;
    } else {
      this.weapons.tonfa = await this.manager.define('tonfa', club, {
        properties: {
          name: 'Tonfa',
          description: 'An Okinawan side-handle baton. Also good for blocking.',
          skill: 'club',
          damage: 16,
          damageType: 'bruise',
        },
        methods: {},
      });
    }

    const existing_blackjack = await this.manager.load('blackjack');
    if (existing_blackjack) {
      this.weapons.blackjack = existing_blackjack;
    } else {
      this.weapons.blackjack = await this.manager.define('blackjack', club, {
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
    }

    const existing_tireIron = await this.manager.load('tireIron');
    if (existing_tireIron) {
      this.weapons.tireIron = existing_tireIron;
    } else {
      this.weapons.tireIron = await this.manager.define('tireIron', club, {
        properties: {
          name: 'Tire Iron',
          description: 'A heavy metal bar from a car toolkit. Dual purpose.',
          skill: 'club',
          damage: 22,
          damageType: 'bruise',
        },
        methods: {},
      });
    }

    // Pipes (inherit from blunt)
    let pipe = await this.manager.load('pipe');
    if (pipe) {
      this.weapons.pipe = pipe;
    } else {
      pipe = await this.manager.define('pipe', blunt, {
        properties: {
          name: 'Pipe',
          description: 'A length of metal pipe. Simple and brutal.',
          skill: 'club',
          damage: 20,
          damageType: 'bruise',
        },
        methods: {},
      });
      this.weapons.pipe = pipe;
    }

    const existing_leadPipe = await this.manager.load('leadPipe');
    if (existing_leadPipe) {
      this.weapons.leadPipe = existing_leadPipe;
    } else {
      this.weapons.leadPipe = await this.manager.define('leadPipe', pipe, {
        properties: {
          name: 'Lead Pipe',
          description: 'A heavy lead pipe. Classic murder weapon.',
          skill: 'club',
          damage: 24,
          damageType: 'bruise',
        },
        methods: {},
      });
    }

    const existing_metalPipe = await this.manager.load('metalPipe');
    if (existing_metalPipe) {
      this.weapons.metalPipe = existing_metalPipe;
    } else {
      this.weapons.metalPipe = await this.manager.define('metalPipe', pipe, {
        properties: {
          name: 'Metal Pipe',
          description: 'A steel pipe section. Industrial debris repurposed.',
          skill: 'club',
          damage: 20,
          damageType: 'bruise',
        },
        methods: {},
      });
    }

    const existing_crowbar = await this.manager.load('crowbar');
    if (existing_crowbar) {
      this.weapons.crowbar = existing_crowbar;
    } else {
      this.weapons.crowbar = await this.manager.define('crowbar', pipe, {
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
    }

    // Hammers (inherit from blunt)
    let hammer = await this.manager.load('hammer');
    if (hammer) {
      this.weapons.hammer = hammer;
    } else {
      hammer = await this.manager.define('hammer', blunt, {
        properties: {
          name: 'Hammer',
          description: 'A basic hammer. The head does the work.',
          skill: 'hammer',
          damage: 20,
          damageType: 'bruise',
        },
        methods: {},
      });
      this.weapons.hammer = hammer;
    }

    const existing_clawHammer = await this.manager.load('clawHammer');
    if (existing_clawHammer) {
      this.weapons.clawHammer = existing_clawHammer;
    } else {
      this.weapons.clawHammer = await this.manager.define(
        'clawHammer',
        hammer,
        {
          properties: {
            name: 'Claw Hammer',
            description: "A carpenter's hammer with a nail-pulling claw.",
            skill: 'hammer',
            damage: 18,
            damageType: 'bruise',
          },
          methods: {},
        },
      );
    }

    const existing_sledgehammer = await this.manager.load('sledgehammer');
    if (existing_sledgehammer) {
      this.weapons.sledgehammer = existing_sledgehammer;
    } else {
      this.weapons.sledgehammer = await this.manager.define(
        'sledgehammer',
        hammer,
        {
          properties: {
            name: 'Sledgehammer',
            description: 'A massive two-handed hammer. Demolition tool.',
            skill: 'hammer',
            damage: 40,
            damageType: 'bruise',
            twoHanded: true, // Heavy, requires two hands
          },
          methods: {},
        },
      );
    }

    const existing_ballPeenHammer = await this.manager.load('ballPeenHammer');
    if (existing_ballPeenHammer) {
      this.weapons.ballPeenHammer = existing_ballPeenHammer;
    } else {
      this.weapons.ballPeenHammer = await this.manager.define(
        'ballPeenHammer',
        hammer,
        {
          properties: {
            name: 'Ball Peen Hammer',
            description: "A machinist's hammer with a rounded head.",
            skill: 'hammer',
            damage: 16,
            damageType: 'bruise',
          },
          methods: {},
        },
      );
    }

    const existing_mallet = await this.manager.load('mallet');
    if (existing_mallet) {
      this.weapons.mallet = existing_mallet;
    } else {
      this.weapons.mallet = await this.manager.define('mallet', hammer, {
        properties: {
          name: 'Mallet',
          description:
            'A wooden or rubber mallet. Less lethal but still hurts.',
          skill: 'hammer',
          damage: 12,
          damageType: 'bruise',
        },
        methods: {},
      });
    }

    // Staves (inherit from blunt)
    let staff = await this.manager.load('staff');
    if (staff) {
      this.weapons.staff = staff;
    } else {
      staff = await this.manager.define('staff', blunt, {
        properties: {
          name: 'Staff',
          description:
            'A long wooden pole. Simple but effective with training.',
          skill: 'staff',
          damage: 15,
          damageType: 'bruise',
          twoHanded: true, // Long pole requires two hands
        },
        methods: {},
      });
      this.weapons.staff = staff;
    }

    const existing_boStaff = await this.manager.load('boStaff');
    if (existing_boStaff) {
      this.weapons.boStaff = existing_boStaff;
    } else {
      this.weapons.boStaff = await this.manager.define('boStaff', staff, {
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
    }

    const existing_walkingStick = await this.manager.load('walkingStick');
    if (existing_walkingStick) {
      this.weapons.walkingStick = existing_walkingStick;
    } else {
      this.weapons.walkingStick = await this.manager.define(
        'walkingStick',
        staff,
        {
          properties: {
            name: 'Walking Stick',
            description:
              'A sturdy cane or walking stick. Innocuous until swung.',
            skill: 'staff',
            damage: 12,
            damageType: 'bruise',
          },
          methods: {},
        },
      );
    }

    const existing_poolCue = await this.manager.load('poolCue');
    if (existing_poolCue) {
      this.weapons.poolCue = existing_poolCue;
    } else {
      this.weapons.poolCue = await this.manager.define('poolCue', staff, {
        properties: {
          name: 'Pool Cue',
          description:
            'A bar pool cue. Breaks easily but good for a quick jab.',
          skill: 'staff',
          damage: 10,
          damageType: 'bruise',
        },
        methods: {},
      });
    }

    // Maces (inherit from blunt)
    let mace = await this.manager.load('mace');
    if (mace) {
      this.weapons.mace = mace;
    } else {
      mace = await this.manager.define('mace', blunt, {
        properties: {
          name: 'Mace',
          description: 'A weighted striking head on a handle. Armor-crushing.',
          skill: 'mace',
          damage: 30,
          damageType: 'bruise',
        },
        methods: {},
      });
      this.weapons.mace = mace;
    }

    const existing_morningstar = await this.manager.load('morningstar');
    if (existing_morningstar) {
      this.weapons.morningstar = existing_morningstar;
    } else {
      this.weapons.morningstar = await this.manager.define(
        'morningstar',
        mace,
        {
          properties: {
            name: 'Morningstar',
            description: 'A spiked ball on a handle. Medieval brutality.',
            skill: 'mace',
            damage: 35,
            damageType: 'puncture',
          },
          methods: {},
        },
      );
    }

    // Hand weapons (inherit from blunt)
    const existing_brassKnuckles = await this.manager.load('brassKnuckles');
    if (existing_brassKnuckles) {
      this.weapons.brassKnuckles = existing_brassKnuckles;
    } else {
      this.weapons.brassKnuckles = await this.manager.define(
        'brassKnuckles',
        blunt,
        {
          properties: {
            name: 'Brass Knuckles',
            description:
              'Metal rings worn over the fingers. Adds weight to punches.',
            skill: 'brawling',
            damage: 12,
            damageType: 'bruise',
          },
          methods: {},
        },
      );
    }

    const existing_sapGloves = await this.manager.load('sapGloves');
    if (existing_sapGloves) {
      this.weapons.sapGloves = existing_sapGloves;
    } else {
      this.weapons.sapGloves = await this.manager.define('sapGloves', blunt, {
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
    }

    const existing_pushDagger = await this.manager.load('pushDagger');
    if (existing_pushDagger) {
      this.weapons.pushDagger = existing_pushDagger;
    } else {
      this.weapons.pushDagger = await this.manager.define('pushDagger', blunt, {
        properties: {
          name: 'Push Dagger',
          description: 'A T-shaped blade gripped in the fist. Punching stabs.',
          skill: 'brawling',
          damage: 14,
          damageType: 'puncture',
        },
        methods: {},
      });
    }

    // Chains (inherit from blunt)
    let chain = await this.manager.load('chain');
    if (chain) {
      this.weapons.chain = chain;
    } else {
      chain = await this.manager.define('chain', blunt, {
        properties: {
          name: 'Chain',
          description: 'A heavy metal chain. Swung or wrapped for strikes.',
          skill: 'chain',
          damage: 18,
          damageType: 'bruise',
        },
        methods: {},
      });
      this.weapons.chain = chain;
    }

    const existing_bikeChain = await this.manager.load('bikeChain');
    if (existing_bikeChain) {
      this.weapons.bikeChain = existing_bikeChain;
    } else {
      this.weapons.bikeChain = await this.manager.define('bikeChain', chain, {
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
    }

    const existing_nunchaku = await this.manager.load('nunchaku');
    if (existing_nunchaku) {
      this.weapons.nunchaku = existing_nunchaku;
    } else {
      this.weapons.nunchaku = await this.manager.define('nunchaku', chain, {
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
    }

    const existing_flail = await this.manager.load('flail');
    if (existing_flail) {
      this.weapons.flail = existing_flail;
    } else {
      this.weapons.flail = await this.manager.define('flail', chain, {
        properties: {
          name: 'Flail',
          description:
            'A spiked ball on a chain attached to a handle. Medieval.',
          skill: 'chain',
          damage: 28,
          damageType: 'bruise',
          twoHanded: true, // Needs swing room and control
        },
        methods: {},
      });
    }

    console.log(
      `✅ Built ${Object.keys(this.weapons).length} blunt weapon prototypes`,
    );
  }

  async registerAliases(): Promise<void> {
    console.log(
      '[BluntWeaponPrototypesBuilder] Types auto-aliased:',
      BluntWeaponPrototypesBuilder.provides.join(', '),
    );
  }
}

// Self-register
registerBuilder(BluntWeaponPrototypesBuilder);
