import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the Ammo type
 *
 * Ammunition is a stackable commodity. When loaded into a gun (directly or via clip),
 * the ammo is recycled - it doesn't exist as a separate object while loaded.
 *
 * Ammo types must match the gun's ammoType property:
 * - 9mm, .38, .44, .45, .380, .22
 * - .308, .30-30
 * - 12gauge, 20gauge
 * - etc.
 *
 * Inherits from stackable type for quantity management.
 */
export class AmmoBuilder implements Builder {
  static provides = ['ammo'];
  static depends = ['stackable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('ammo');
    if (existing) {
      this.obj = existing;
    } else {
      const parent = await this.manager.load('stackable');
      if (!parent) throw new Error('AmmoBuilder: stackable type not found');

      this.obj = await this.manager.define('ammo', parent, {
        properties: {
          name: 'Ammunition',
          description: 'A quantity of ammunition.',

          // What type of ammo (must match gun.ammoType)
          ammoType: 'generic',

          // Inherits quantity from stackable
          // quantity: 0,

          // Display unit
          unit: 'rounds',

          // Ammo is often contraband
          contraband: false,

          abilities: `Stackable commodity - cartridges for firearms.

STACKING: Ammo of same 'ammoType' stacks together. 'quantity' tracks count.

LOADING: Put ammo into magazine or directly into gun. Consumed when loaded (quantity decreases or object recycled).

COMPATIBILITY: 'ammoType' must match weapon's ammoType. 9mm != .45. Wrong ammo won't fit.

TYPES: 9mm, .38, .44, .45, .22, .380, .308, .30-30, 12gauge, etc. Each for specific weapon classes.

CONTRABAND: 'contraband' flag if illegal to possess. May be searched for, confiscated.

WEIGHT: Bullets are heavy in quantity. 1000 rounds = significant weight.

EXPOSED: Loose ammo can be damaged by water, fire. Store in sealed containers.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;
    // Override stackType to use ammoType for stacking
    obj.setMethod(
      'canStackWith',
      `
      const other = args[0];
      if (!other) return false;
      if (!self.ammoType || !other.ammoType) return false;
      return self.ammoType === other.ammoType;
    `,
    );

    // Override shortDesc for ammo display
    obj.setMethod(
      'shortDesc',
      `
      const qty = self.quantity || 0;
      const type = self.ammoType || 'generic';
      return qty + ' rounds of ' + type;
    `,
    );

    // describe - show ammo details
    obj.setMethod(
      'describe',
      `
      const qty = self.quantity || 0;
      const type = self.ammoType || 'generic';

      let desc = self.name || 'Ammunition';
      desc += '\\r\\n' + qty + ' rounds of ' + type + ' ammunition.';

      if (self.description && self.description !== 'A quantity of ammunition.') {
        desc += '\\r\\n' + self.description;
      }

      if (self.contraband) {
        desc += '\\r\\n[CONTRABAND]';
      }

      return desc;
    `,
    );

    obj.setPropertyDescription(
      'ammoType',
      'The caliber or type of ammunition (e.g., 9mm, .45, 12gauge). Must match weapon ammoType.',
    );
    obj.setPropertyDescription(
      'unit',
      'Display unit for this ammo type (rounds, shells, etc.).',
    );
    obj.setPropertyDescription(
      'contraband',
      'Whether this ammunition is illegal to possess.',
    );
  }

  async registerAliases(): Promise<void> {
    console.log('[AmmoBuilder] Type \'ammo\' auto-aliased');
  }
}

// Self-register
registerBuilder(AmmoBuilder);

/**
 * Specific ammo type builders
 */

export class Ammo9mmBuilder implements Builder {
  static provides = ['ammo9mm'];
  static depends = ['ammo'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('ammo9mm')) return;

    const parent = await this.manager.load('ammo');
    if (!parent) throw new Error('Ammo9mmBuilder: ammo type not found');

    await this.manager.define('ammo9mm', parent, {
      properties: {
        name: '9mm Ammunition',
        description: 'Standard 9x19mm Parabellum cartridges.',
        ammoType: '9mm',
        unit: 'rounds',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log('[Ammo9mmBuilder] Type \'ammo9mm\' auto-aliased');
  }
}

export class Ammo38Builder implements Builder {
  static provides = ['ammo38'];
  static depends = ['ammo'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('ammo38')) return;

    const parent = await this.manager.load('ammo');
    if (!parent) throw new Error('Ammo38Builder: ammo type not found');

    await this.manager.define('ammo38', parent, {
      properties: {
        name: '.38 Special Ammunition',
        description: 'Revolver cartridges.',
        ammoType: '.38',
        unit: 'rounds',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log('[Ammo38Builder] Type \'ammo38\' auto-aliased');
  }
}

export class Ammo44Builder implements Builder {
  static provides = ['ammo44'];
  static depends = ['ammo'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('ammo44')) return;

    const parent = await this.manager.load('ammo');
    if (!parent) throw new Error('Ammo44Builder: ammo type not found');

    await this.manager.define('ammo44', parent, {
      properties: {
        name: '.44 Magnum Ammunition',
        description: 'Large-bore revolver cartridges.',
        ammoType: '.44',
        unit: 'rounds',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log('[Ammo44Builder] Type \'ammo44\' auto-aliased');
  }
}

export class Ammo45Builder implements Builder {
  static provides = ['ammo45'];
  static depends = ['ammo'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('ammo45')) return;

    const parent = await this.manager.load('ammo');
    if (!parent) throw new Error('Ammo45Builder: ammo type not found');

    await this.manager.define('ammo45', parent, {
      properties: {
        name: '.45 ACP Ammunition',
        description: 'Heavy pistol cartridges.',
        ammoType: '.45',
        unit: 'rounds',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log('[Ammo45Builder] Type \'ammo45\' auto-aliased');
  }
}

export class Ammo22Builder implements Builder {
  static provides = ['ammo22'];
  static depends = ['ammo'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('ammo22')) return;

    const parent = await this.manager.load('ammo');
    if (!parent) throw new Error('Ammo22Builder: ammo type not found');

    await this.manager.define('ammo22', parent, {
      properties: {
        name: '.22 LR Ammunition',
        description: 'Small-caliber rimfire cartridges.',
        ammoType: '.22',
        unit: 'rounds',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log('[Ammo22Builder] Type \'ammo22\' auto-aliased');
  }
}

export class Ammo380Builder implements Builder {
  static provides = ['ammo380'];
  static depends = ['ammo'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('ammo380')) return;

    const parent = await this.manager.load('ammo');
    if (!parent) throw new Error('Ammo380Builder: ammo type not found');

    await this.manager.define('ammo380', parent, {
      properties: {
        name: '.380 ACP Ammunition',
        description: 'Compact pistol cartridges.',
        ammoType: '.380',
        unit: 'rounds',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log('[Ammo380Builder] Type \'ammo380\' auto-aliased');
  }
}

export class Ammo308Builder implements Builder {
  static provides = ['ammo308'];
  static depends = ['ammo'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('ammo308')) return;

    const parent = await this.manager.load('ammo');
    if (!parent) throw new Error('Ammo308Builder: ammo type not found');

    await this.manager.define('ammo308', parent, {
      properties: {
        name: '.308 Winchester Ammunition',
        description: 'Full-power rifle cartridges.',
        ammoType: '.308',
        unit: 'rounds',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log('[Ammo308Builder] Type \'ammo308\' auto-aliased');
  }
}

export class Ammo3030Builder implements Builder {
  static provides = ['ammo3030'];
  static depends = ['ammo'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('ammo3030')) return;

    const parent = await this.manager.load('ammo');
    if (!parent) throw new Error('Ammo3030Builder: ammo type not found');

    await this.manager.define('ammo3030', parent, {
      properties: {
        name: '.30-30 Winchester Ammunition',
        description: 'Lever-action rifle cartridges.',
        ammoType: '.30-30',
        unit: 'rounds',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log('[Ammo3030Builder] Type \'ammo3030\' auto-aliased');
  }
}

export class Ammo12GaugeBuilder implements Builder {
  static provides = ['ammo12gauge'];
  static depends = ['ammo'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('ammo12gauge')) return;

    const parent = await this.manager.load('ammo');
    if (!parent) throw new Error('Ammo12GaugeBuilder: ammo type not found');

    await this.manager.define('ammo12gauge', parent, {
      properties: {
        name: '12 Gauge Shells',
        description: 'Shotgun shells.',
        ammoType: '12gauge',
        unit: 'shells',
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log('[Ammo12GaugeBuilder] Type \'ammo12gauge\' auto-aliased');
  }
}

// Self-register all ammo type builders
registerBuilder(Ammo9mmBuilder);
registerBuilder(Ammo38Builder);
registerBuilder(Ammo44Builder);
registerBuilder(Ammo45Builder);
registerBuilder(Ammo22Builder);
registerBuilder(Ammo380Builder);
registerBuilder(Ammo308Builder);
registerBuilder(Ammo3030Builder);
registerBuilder(Ammo12GaugeBuilder);
