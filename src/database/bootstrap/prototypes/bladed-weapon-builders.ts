import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Bladed Weapon Types
 *
 * Hierarchy:
 * $.weapon
 *   $.blade (base for all bladed weapons)
 *     $.knife (small blades - skill: knife)
 *       $.pocketKnife, $.combatKnife, $.switchblade, $.boxCutter, $.butterflyKnife, $.stiletto, $.shiv
 *     $.machete (heavy choppers - skill: machete)
 *       $.cleaver, $.kukri
 *     $.katana (Japanese swords - skill: katana)
 *       $.wakizashi, $.tanto, $.ninjato
 *     $.sword (Western swords - skill: sword)
 *       $.longsword, $.shortsword, $.rapier, $.cutlass
 *     $.axe (axes - skill: axe)
 *       $.hatchet, $.fireAxe, $.tomahawk
 */

// ═══════════════════════════════════════════════════════════════════════════
// BASE BLADE
// ═══════════════════════════════════════════════════════════════════════════

export class BladeBuilder implements Builder {
  static provides = ['blade'];
  static depends = ['weapon'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('blade')) return;

    const parent = await this.manager.load('weapon');
    if (!parent) throw new Error('BladeBuilder: weapon type not found');

    const obj = await this.manager.define('blade', parent, {
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
  }

  async registerAliases(): Promise<void> {
    console.log("[BladeBuilder] Type 'blade' auto-aliased");
  }
}

registerBuilder(BladeBuilder);

// ═══════════════════════════════════════════════════════════════════════════
// KNIVES (skill: knife)
// ═══════════════════════════════════════════════════════════════════════════

export class KnifeBuilder implements Builder {
  static provides = ['knife'];
  static depends = ['blade'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('knife')) return;

    const parent = await this.manager.load('blade');
    if (!parent) throw new Error('KnifeBuilder: blade type not found');

    await this.manager.define('knife', parent, {
      properties: {
        name: 'Knife',
        description: 'A small blade for cutting and stabbing.',
        skill: 'knife',
        damage: 12,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[KnifeBuilder] Type 'knife' auto-aliased");
  }
}

export class PocketKnifeBuilder implements Builder {
  static provides = ['pocketKnife'];
  static depends = ['knife'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('pocketKnife')) return;

    const parent = await this.manager.load('knife');
    if (!parent) throw new Error('PocketKnifeBuilder: knife type not found');

    await this.manager.define('pocketKnife', parent, {
      properties: {
        name: 'Pocket Knife',
        description: 'A small folding knife. Easy to conceal.',
        skill: 'knife',
        damage: 8,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[PocketKnifeBuilder] Type 'pocketKnife' auto-aliased");
  }
}

export class CombatKnifeBuilder implements Builder {
  static provides = ['combatKnife'];
  static depends = ['knife'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('combatKnife')) return;

    const parent = await this.manager.load('knife');
    if (!parent) throw new Error('CombatKnifeBuilder: knife type not found');

    await this.manager.define('combatKnife', parent, {
      properties: {
        name: 'Combat Knife',
        description: 'A sturdy fixed-blade knife designed for fighting.',
        skill: 'knife',
        damage: 18,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[CombatKnifeBuilder] Type 'combatKnife' auto-aliased");
  }
}

export class SwitchbladeBuilder implements Builder {
  static provides = ['switchblade'];
  static depends = ['knife'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('switchblade')) return;

    const parent = await this.manager.load('knife');
    if (!parent) throw new Error('SwitchbladeBuilder: knife type not found');

    await this.manager.define('switchblade', parent, {
      properties: {
        name: 'Switchblade',
        description: 'A spring-loaded folding knife. Flicks open with a button.',
        skill: 'knife',
        damage: 10,
        damageType: 'puncture',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[SwitchbladeBuilder] Type 'switchblade' auto-aliased");
  }
}

export class BoxCutterBuilder implements Builder {
  static provides = ['boxCutter'];
  static depends = ['knife'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('boxCutter')) return;

    const parent = await this.manager.load('knife');
    if (!parent) throw new Error('BoxCutterBuilder: knife type not found');

    await this.manager.define('boxCutter', parent, {
      properties: {
        name: 'Box Cutter',
        description: 'A retractable utility blade. Cheap and disposable.',
        skill: 'knife',
        damage: 6,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[BoxCutterBuilder] Type 'boxCutter' auto-aliased");
  }
}

export class ButterflyKnifeBuilder implements Builder {
  static provides = ['butterflyKnife'];
  static depends = ['knife'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('butterflyKnife')) return;

    const parent = await this.manager.load('knife');
    if (!parent) throw new Error('ButterflyKnifeBuilder: knife type not found');

    await this.manager.define('butterflyKnife', parent, {
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
  }

  async registerAliases(): Promise<void> {
    console.log("[ButterflyKnifeBuilder] Type 'butterflyKnife' auto-aliased");
  }
}

export class StilettoBuilder implements Builder {
  static provides = ['stiletto'];
  static depends = ['knife'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('stiletto')) return;

    const parent = await this.manager.load('knife');
    if (!parent) throw new Error('StilettoBuilder: knife type not found');

    await this.manager.define('stiletto', parent, {
      properties: {
        name: 'Stiletto',
        description: 'A long, thin dagger designed for thrusting.',
        skill: 'knife',
        damage: 14,
        damageType: 'puncture',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[StilettoBuilder] Type 'stiletto' auto-aliased");
  }
}

export class ShivBuilder implements Builder {
  static provides = ['shiv'];
  static depends = ['knife'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('shiv')) return;

    const parent = await this.manager.load('knife');
    if (!parent) throw new Error('ShivBuilder: knife type not found');

    await this.manager.define('shiv', parent, {
      properties: {
        name: 'Shiv',
        description: 'A crude improvised stabbing weapon. Prison-made.',
        skill: 'knife',
        damage: 8,
        damageType: 'puncture',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[ShivBuilder] Type 'shiv' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MACHETES / CLEAVERS (skill: machete)
// ═══════════════════════════════════════════════════════════════════════════

export class MacheteBuilder implements Builder {
  static provides = ['machete'];
  static depends = ['blade'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('machete')) return;

    const parent = await this.manager.load('blade');
    if (!parent) throw new Error('MacheteBuilder: blade type not found');

    await this.manager.define('machete', parent, {
      properties: {
        name: 'Machete',
        description: 'A heavy blade for chopping. Originally an agricultural tool.',
        skill: 'machete',
        damage: 28,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[MacheteBuilder] Type 'machete' auto-aliased");
  }
}

export class CleaverBuilder implements Builder {
  static provides = ['cleaver'];
  static depends = ['machete'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('cleaver')) return;

    const parent = await this.manager.load('machete');
    if (!parent) throw new Error('CleaverBuilder: machete type not found');

    await this.manager.define('cleaver', parent, {
      properties: {
        name: 'Cleaver',
        description: 'A heavy rectangular blade. Meant for butchering meat.',
        skill: 'machete',
        damage: 25,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[CleaverBuilder] Type 'cleaver' auto-aliased");
  }
}

export class KukriBuilder implements Builder {
  static provides = ['kukri'];
  static depends = ['machete'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('kukri')) return;

    const parent = await this.manager.load('machete');
    if (!parent) throw new Error('KukriBuilder: machete type not found');

    await this.manager.define('kukri', parent, {
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
  }

  async registerAliases(): Promise<void> {
    console.log("[KukriBuilder] Type 'kukri' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// JAPANESE SWORDS (skill: katana)
// ═══════════════════════════════════════════════════════════════════════════

export class KatanaBuilder implements Builder {
  static provides = ['katana'];
  static depends = ['blade'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('katana')) return;

    const parent = await this.manager.load('blade');
    if (!parent) throw new Error('KatanaBuilder: blade type not found');

    await this.manager.define('katana', parent, {
      properties: {
        name: 'Katana',
        description: 'A curved Japanese longsword. Elegant and deadly.',
        skill: 'katana',
        damage: 35,
        damageType: 'cut',
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[KatanaBuilder] Type 'katana' auto-aliased");
  }
}

export class WakizashiBuilder implements Builder {
  static provides = ['wakizashi'];
  static depends = ['katana'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('wakizashi')) return;

    const parent = await this.manager.load('katana');
    if (!parent) throw new Error('WakizashiBuilder: katana type not found');

    await this.manager.define('wakizashi', parent, {
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
  }

  async registerAliases(): Promise<void> {
    console.log("[WakizashiBuilder] Type 'wakizashi' auto-aliased");
  }
}

export class TantoBuilder implements Builder {
  static provides = ['tanto'];
  static depends = ['katana'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('tanto')) return;

    const parent = await this.manager.load('katana');
    if (!parent) throw new Error('TantoBuilder: katana type not found');

    await this.manager.define('tanto', parent, {
      properties: {
        name: 'Tanto',
        description: 'A short Japanese dagger. Originally for armor piercing.',
        skill: 'katana',
        damage: 16,
        damageType: 'puncture',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[TantoBuilder] Type 'tanto' auto-aliased");
  }
}

export class NinjatoBuilder implements Builder {
  static provides = ['ninjato'];
  static depends = ['katana'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('ninjato')) return;

    const parent = await this.manager.load('katana');
    if (!parent) throw new Error('NinjatoBuilder: katana type not found');

    await this.manager.define('ninjato', parent, {
      properties: {
        name: 'Ninjatō',
        description: 'A straight-bladed sword. Practical rather than elegant.',
        skill: 'katana',
        damage: 28,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[NinjatoBuilder] Type 'ninjato' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WESTERN SWORDS (skill: sword)
// ═══════════════════════════════════════════════════════════════════════════

export class SwordBuilder implements Builder {
  static provides = ['sword'];
  static depends = ['blade'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('sword')) return;

    const parent = await this.manager.load('blade');
    if (!parent) throw new Error('SwordBuilder: blade type not found');

    await this.manager.define('sword', parent, {
      properties: {
        name: 'Sword',
        description: 'A straight-bladed weapon for cutting and thrusting.',
        skill: 'sword',
        damage: 30,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[SwordBuilder] Type 'sword' auto-aliased");
  }
}

export class LongswordBuilder implements Builder {
  static provides = ['longsword'];
  static depends = ['sword'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('longsword')) return;

    const parent = await this.manager.load('sword');
    if (!parent) throw new Error('LongswordBuilder: sword type not found');

    await this.manager.define('longsword', parent, {
      properties: {
        name: 'Longsword',
        description: 'A two-handed straight sword. Reach and power.',
        skill: 'sword',
        damage: 38,
        damageType: 'cut',
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[LongswordBuilder] Type 'longsword' auto-aliased");
  }
}

export class ShortswordBuilder implements Builder {
  static provides = ['shortsword'];
  static depends = ['sword'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('shortsword')) return;

    const parent = await this.manager.load('sword');
    if (!parent) throw new Error('ShortswordBuilder: sword type not found');

    await this.manager.define('shortsword', parent, {
      properties: {
        name: 'Shortsword',
        description: 'A one-handed blade. Quick and maneuverable.',
        skill: 'sword',
        damage: 22,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[ShortswordBuilder] Type 'shortsword' auto-aliased");
  }
}

export class RapierBuilder implements Builder {
  static provides = ['rapier'];
  static depends = ['sword'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('rapier')) return;

    const parent = await this.manager.load('sword');
    if (!parent) throw new Error('RapierBuilder: sword type not found');

    await this.manager.define('rapier', parent, {
      properties: {
        name: 'Rapier',
        description: 'A thin, elegant thrusting sword. Precise and fast.',
        skill: 'sword',
        damage: 24,
        damageType: 'puncture',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[RapierBuilder] Type 'rapier' auto-aliased");
  }
}

export class CutlassBuilder implements Builder {
  static provides = ['cutlass'];
  static depends = ['sword'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('cutlass')) return;

    const parent = await this.manager.load('sword');
    if (!parent) throw new Error('CutlassBuilder: sword type not found');

    await this.manager.define('cutlass', parent, {
      properties: {
        name: 'Cutlass',
        description: 'A short, broad slashing sword. Naval origin.',
        skill: 'sword',
        damage: 26,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[CutlassBuilder] Type 'cutlass' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AXES (skill: axe)
// ═══════════════════════════════════════════════════════════════════════════

export class AxeBuilder implements Builder {
  static provides = ['axe'];
  static depends = ['blade'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('axe')) return;

    const parent = await this.manager.load('blade');
    if (!parent) throw new Error('AxeBuilder: blade type not found');

    await this.manager.define('axe', parent, {
      properties: {
        name: 'Axe',
        description: 'A heavy chopping tool that doubles as a weapon.',
        skill: 'axe',
        damage: 32,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[AxeBuilder] Type 'axe' auto-aliased");
  }
}

export class HatchetBuilder implements Builder {
  static provides = ['hatchet'];
  static depends = ['axe'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('hatchet')) return;

    const parent = await this.manager.load('axe');
    if (!parent) throw new Error('HatchetBuilder: axe type not found');

    await this.manager.define('hatchet', parent, {
      properties: {
        name: 'Hatchet',
        description: 'A small one-handed axe. Camping tool turned weapon.',
        skill: 'axe',
        damage: 22,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[HatchetBuilder] Type 'hatchet' auto-aliased");
  }
}

export class FireAxeBuilder implements Builder {
  static provides = ['fireAxe'];
  static depends = ['axe'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('fireAxe')) return;

    const parent = await this.manager.load('axe');
    if (!parent) throw new Error('FireAxeBuilder: axe type not found');

    await this.manager.define('fireAxe', parent, {
      properties: {
        name: 'Fire Axe',
        description: "A heavy firefighter's axe. Long handle, brutal head.",
        skill: 'axe',
        damage: 38,
        damageType: 'cut',
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[FireAxeBuilder] Type 'fireAxe' auto-aliased");
  }
}

export class TomahawkBuilder implements Builder {
  static provides = ['tomahawk'];
  static depends = ['axe'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('tomahawk')) return;

    const parent = await this.manager.load('axe');
    if (!parent) throw new Error('TomahawkBuilder: axe type not found');

    await this.manager.define('tomahawk', parent, {
      properties: {
        name: 'Tomahawk',
        description: 'A tactical hatchet. Light and balanced for throwing.',
        skill: 'axe',
        damage: 20,
        damageType: 'cut',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[TomahawkBuilder] Type 'tomahawk' auto-aliased");
  }
}

// Self-register all builders
registerBuilder(KnifeBuilder);
registerBuilder(PocketKnifeBuilder);
registerBuilder(CombatKnifeBuilder);
registerBuilder(SwitchbladeBuilder);
registerBuilder(BoxCutterBuilder);
registerBuilder(ButterflyKnifeBuilder);
registerBuilder(StilettoBuilder);
registerBuilder(ShivBuilder);
registerBuilder(MacheteBuilder);
registerBuilder(CleaverBuilder);
registerBuilder(KukriBuilder);
registerBuilder(KatanaBuilder);
registerBuilder(WakizashiBuilder);
registerBuilder(TantoBuilder);
registerBuilder(NinjatoBuilder);
registerBuilder(SwordBuilder);
registerBuilder(LongswordBuilder);
registerBuilder(ShortswordBuilder);
registerBuilder(RapierBuilder);
registerBuilder(CutlassBuilder);
registerBuilder(AxeBuilder);
registerBuilder(HatchetBuilder);
registerBuilder(FireAxeBuilder);
registerBuilder(TomahawkBuilder);
