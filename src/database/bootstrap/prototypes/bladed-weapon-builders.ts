import type { ObjId, RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Bladed Weapon Prototypes
 *
 * Hierarchy:
 * $.weapon
 *   $.blade (base for all bladed weapons)
 *     $.knife (small blades - skill: knife)
 *       $.pocketKnife
 *       $.combatKnife
 *       $.switchblade
 *       $.boxCutter
 *       $.butterflyKnife
 *     $.machete (heavy choppers - skill: machete)
 *       $.cleaver
 *     $.katana (Japanese swords - skill: katana)
 *       $.wakizashi
 *       $.tanto
 *     $.sword (Western swords - skill: sword)
 *       $.longsword
 *       $.shortsword
 *     $.axe (axes - skill: axe)
 *       $.hatchet
 *       $.fireAxe
 */

// ═══════════════════════════════════════════════════════════════════════════
// BASE BLADE
// ═══════════════════════════════════════════════════════════════════════════

export class BladeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Blade',
        description: 'A bladed weapon.',
        skill: 'blade',
        damage: 15,
        damageType: 'cut',

        abilities: `Sharp-edged weapon for cutting and stabbing.

CUTTING: Primary attack creates 'cut' wounds. Severity based on 'damage' + strength + skill check. Cuts bleed freely.

STABBING: Thrust attack creates 'puncture' wounds. Deep punctures can hit organs. Less bleeding but more internal damage.

SLASHING: Wide swings can hit multiple targets or create longer wounds. More bleeding, less depth.

BLOCKING: Can parry other blades. Edge damage degrades weapon. Blocking blunt weapons risks blade breakage.

UTILITY: Outside combat, blades cut rope, fabric, leather. Can be used for butchering, whittling, prying (poorly).

MAINTENANCE: 'sharpness' degrades with use. Dull blade = reduced damage. Can be sharpened with proper tools.

CONCEALMENT: Smaller blades easier to hide. Folding blades even more so. Draw time varies by type.`,
      },
      methods: {},
    });

    obj.setPropertyDescription(
      'skill',
      'Combat skill used with this weapon (blade, knife, machete, katana, sword, axe). Affects attack success and damage.',
    );
    obj.setPropertyDescription(
      'damage',
      'Base damage value for attacks. Combined with strength and skill check for final wound severity.',
    );
    obj.setPropertyDescription(
      'damageType',
      'Type of wound inflicted (cut, puncture). Cuts bleed more, punctures go deeper.',
    );

    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KNIVES (skill: knife)
// ═══════════════════════════════════════════════════════════════════════════

export class KnifeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Knife',
        description: 'A small blade for cutting and stabbing.',
        skill: 'knife',
        damage: 12,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class PocketKnifeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Pocket Knife',
        description: 'A small folding knife. Easy to conceal.',
        skill: 'knife',
        damage: 8,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class CombatKnifeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Combat Knife',
        description: 'A sturdy fixed-blade knife designed for fighting.',
        skill: 'knife',
        damage: 18,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class SwitchbladeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Switchblade',
        description:
          'A spring-loaded folding knife. Flicks open with a button.',
        skill: 'knife',
        damage: 10,
        damageType: 'puncture',
      },
      methods: {},
    });
    return obj;
  }
}

export class BoxCutterBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Box Cutter',
        description: 'A retractable utility blade. Cheap and disposable.',
        skill: 'knife',
        damage: 6,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class ButterflyKnifeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Butterfly Knife',
        description:
          'A folding knife with split handles that rotate around the blade.',
        skill: 'knife',
        damage: 10,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class StilettoBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Stiletto',
        description: 'A long, thin dagger designed for thrusting.',
        skill: 'knife',
        damage: 14,
        damageType: 'puncture',
      },
      methods: {},
    });
    return obj;
  }
}

export class ShivBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Shiv',
        description: 'A crude improvised stabbing weapon. Prison-made.',
        skill: 'knife',
        damage: 8,
        damageType: 'puncture',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MACHETES / CLEAVERS (skill: machete)
// ═══════════════════════════════════════════════════════════════════════════

export class MacheteBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Machete',
        description:
          'A heavy blade for chopping. Originally an agricultural tool.',
        skill: 'machete',
        damage: 28,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class CleaverBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Cleaver',
        description: 'A heavy rectangular blade. Meant for butchering meat.',
        skill: 'machete',
        damage: 25,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class KukriBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Kukri',
        description:
          'A curved Nepalese blade with a heavy forward edge. Brutal chopper.',
        skill: 'machete',
        damage: 30,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// JAPANESE SWORDS (skill: katana)
// ═══════════════════════════════════════════════════════════════════════════

export class KatanaBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Katana',
        description: 'A curved Japanese longsword. Elegant and deadly.',
        skill: 'katana',
        damage: 35,
        damageType: 'cut',
        twoHanded: true, // Traditional two-handed grip
      },
      methods: {},
    });
    return obj;
  }
}

export class WakizashiBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Wakizashi',
        description:
          'A shorter companion sword to the katana. Traditional samurai sidearm.',
        skill: 'katana',
        damage: 25,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class TantoBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Tanto',
        description: 'A short Japanese dagger. Originally for armor piercing.',
        skill: 'katana',
        damage: 16,
        damageType: 'puncture',
      },
      methods: {},
    });
    return obj;
  }
}

export class NinjatōBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Ninjatō',
        description: 'A straight-bladed sword. Practical rather than elegant.',
        skill: 'katana',
        damage: 28,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WESTERN SWORDS (skill: sword)
// ═══════════════════════════════════════════════════════════════════════════

export class SwordBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Sword',
        description: 'A straight-bladed weapon for cutting and thrusting.',
        skill: 'sword',
        damage: 30,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class LongswordBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Longsword',
        description: 'A two-handed straight sword. Reach and power.',
        skill: 'sword',
        damage: 38,
        damageType: 'cut',
        twoHanded: true, // Two-handed sword
      },
      methods: {},
    });
    return obj;
  }
}

export class ShortswordBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Shortsword',
        description: 'A one-handed blade. Quick and maneuverable.',
        skill: 'sword',
        damage: 22,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class RapierBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Rapier',
        description: 'A thin, elegant thrusting sword. Precise and fast.',
        skill: 'sword',
        damage: 24,
        damageType: 'puncture',
      },
      methods: {},
    });
    return obj;
  }
}

export class CutlassBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Cutlass',
        description: 'A short, broad slashing sword. Naval origin.',
        skill: 'sword',
        damage: 26,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AXES (skill: axe)
// ═══════════════════════════════════════════════════════════════════════════

export class AxeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Axe',
        description: 'A heavy chopping tool that doubles as a weapon.',
        skill: 'axe',
        damage: 32,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class HatchetBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Hatchet',
        description: 'A small one-handed axe. Camping tool turned weapon.',
        skill: 'axe',
        damage: 22,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

export class FireAxeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Fire Axe',
        description: "A heavy firefighter's axe. Long handle, brutal head.",
        skill: 'axe',
        damage: 38,
        damageType: 'cut',
        twoHanded: true, // Long handle requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class TomahawkBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Tomahawk',
        description: 'A tactical hatchet. Light and balanced for throwing.',
        skill: 'axe',
        damage: 20,
        damageType: 'cut',
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BLADED WEAPON PROTOTYPES BUILDER (registered builder for all bladed weapons)
// ═══════════════════════════════════════════════════════════════════════════

export class BladedWeaponPrototypesBuilder implements Builder {
  static provides = [
    'blade',
    'knife',
    'pocketKnife',
    'combatKnife',
    'switchblade',
    'boxCutter',
    'butterflyKnife',
    'stiletto',
    'shiv',
    'machete',
    'cleaver',
    'kukri',
    'katana',
    'wakizashi',
    'tanto',
    'ninjato',
    'sword',
    'longsword',
    'shortsword',
    'rapier',
    'cutlass',
    'axe',
    'hatchet',
    'fireAxe',
    'tomahawk',
  ];
  static depends = ['weapon'];

  private weapons: Record<string, RuntimeObject> = {};

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.blade && !forceRebuild) {
      for (const alias of BladedWeaponPrototypesBuilder.provides) {
        if ($[alias]) this.weapons[alias] = $[alias];
      }
      return;
    }

    const parentObj = $.weapon;
    if (!parentObj) throw new Error('BladedWeaponPrototypesBuilder: $weapon not found');

    const weaponId = parentObj.id;

    // Base blade (inherits from weapon)
    const blade = await new BladeBuilder(this.manager).build(weaponId);
    this.weapons.blade = blade;

    // Knives (inherit from blade)
    const knife = await new KnifeBuilder(this.manager).build(blade.id);
    this.weapons.knife = knife;
    this.weapons.pocketKnife = await new PocketKnifeBuilder(this.manager).build(knife.id);
    this.weapons.combatKnife = await new CombatKnifeBuilder(this.manager).build(knife.id);
    this.weapons.switchblade = await new SwitchbladeBuilder(this.manager).build(knife.id);
    this.weapons.boxCutter = await new BoxCutterBuilder(this.manager).build(knife.id);
    this.weapons.butterflyKnife = await new ButterflyKnifeBuilder(this.manager).build(knife.id);
    this.weapons.stiletto = await new StilettoBuilder(this.manager).build(knife.id);
    this.weapons.shiv = await new ShivBuilder(this.manager).build(knife.id);

    // Machetes (inherit from blade)
    const machete = await new MacheteBuilder(this.manager).build(blade.id);
    this.weapons.machete = machete;
    this.weapons.cleaver = await new CleaverBuilder(this.manager).build(machete.id);
    this.weapons.kukri = await new KukriBuilder(this.manager).build(machete.id);

    // Japanese swords (inherit from blade)
    const katana = await new KatanaBuilder(this.manager).build(blade.id);
    this.weapons.katana = katana;
    this.weapons.wakizashi = await new WakizashiBuilder(this.manager).build(katana.id);
    this.weapons.tanto = await new TantoBuilder(this.manager).build(katana.id);
    this.weapons.ninjato = await new NinjatōBuilder(this.manager).build(katana.id);

    // Western swords (inherit from blade)
    const sword = await new SwordBuilder(this.manager).build(blade.id);
    this.weapons.sword = sword;
    this.weapons.longsword = await new LongswordBuilder(this.manager).build(sword.id);
    this.weapons.shortsword = await new ShortswordBuilder(this.manager).build(sword.id);
    this.weapons.rapier = await new RapierBuilder(this.manager).build(sword.id);
    this.weapons.cutlass = await new CutlassBuilder(this.manager).build(sword.id);

    // Axes (inherit from blade)
    const axe = await new AxeBuilder(this.manager).build(blade.id);
    this.weapons.axe = axe;
    this.weapons.hatchet = await new HatchetBuilder(this.manager).build(axe.id);
    this.weapons.fireAxe = await new FireAxeBuilder(this.manager).build(axe.id);
    this.weapons.tomahawk = await new TomahawkBuilder(this.manager).build(axe.id);

    console.log(`✅ Built ${Object.keys(this.weapons).length} bladed weapon prototypes`);
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
registerBuilder(BladedWeaponPrototypesBuilder);
