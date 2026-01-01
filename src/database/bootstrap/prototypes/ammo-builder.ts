import type { ObjId, RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the Ammo prototype
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
 * Inherits from $.stackable for quantity management.
 */
export class AmmoBuilder implements Builder {
  static provides = ['ammo'];
  static depends = ['stackable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.ammo && !forceRebuild) {
      this.obj = $.ammo;
      return;
    }

    const parentObj = $.stackable;
    if (!parentObj) throw new Error('AmmoBuilder: $stackable not found');

    this.obj = await this.manager.create({
      parent: parentObj,
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

    const obj = this.obj;
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
    // Register in memory for immediate access
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'ammo', this.obj.id);
  }
}

// Self-register
registerBuilder(AmmoBuilder);

/**
 * Specific ammo type builders
 */

export class Ammo9mmBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
      properties: {
        name: '9mm Ammunition',
        description: 'Standard 9x19mm Parabellum cartridges.',
        ammoType: '9mm',
        unit: 'rounds',
      },
      methods: {},
    });
  }
}

export class Ammo38Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
      properties: {
        name: '.38 Special Ammunition',
        description: 'Revolver cartridges.',
        ammoType: '.38',
        unit: 'rounds',
      },
      methods: {},
    });
  }
}

export class Ammo44Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
      properties: {
        name: '.44 Magnum Ammunition',
        description: 'Large-bore revolver cartridges.',
        ammoType: '.44',
        unit: 'rounds',
      },
      methods: {},
    });
  }
}

export class Ammo45Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
      properties: {
        name: '.45 ACP Ammunition',
        description: 'Heavy pistol cartridges.',
        ammoType: '.45',
        unit: 'rounds',
      },
      methods: {},
    });
  }
}

export class Ammo22Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
      properties: {
        name: '.22 LR Ammunition',
        description: 'Small-caliber rimfire cartridges.',
        ammoType: '.22',
        unit: 'rounds',
      },
      methods: {},
    });
  }
}

export class Ammo380Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
      properties: {
        name: '.380 ACP Ammunition',
        description: 'Compact pistol cartridges.',
        ammoType: '.380',
        unit: 'rounds',
      },
      methods: {},
    });
  }
}

export class Ammo308Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
      properties: {
        name: '.308 Winchester Ammunition',
        description: 'Full-power rifle cartridges.',
        ammoType: '.308',
        unit: 'rounds',
      },
      methods: {},
    });
  }
}

export class Ammo3030Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
      properties: {
        name: '.30-30 Winchester Ammunition',
        description: 'Lever-action rifle cartridges.',
        ammoType: '.30-30',
        unit: 'rounds',
      },
      methods: {},
    });
  }
}

export class Ammo12GaugeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: ObjId): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
      properties: {
        name: '12 Gauge Shells',
        description: 'Shotgun shells.',
        ammoType: '12gauge',
        unit: 'shells',
      },
      methods: {},
    });
  }
}

/**
 * Builds all ammo sub-prototypes
 *
 * This creates a hierarchy of ammo prototypes under $.ammo:
 *
 * $.ammo (base - inherits from $.stackable)
 *   $.ammo9mm
 *   $.ammo38
 *   $.ammo44
 *   $.ammo45
 *   $.ammo22
 *   $.ammo380
 *   $.ammo308
 *   $.ammo3030
 *   $.ammo12gauge
 */
export class AmmoPrototypesBuilder implements Builder {
  static provides = [
    'ammo9mm',
    'ammo38',
    'ammo44',
    'ammo45',
    'ammo22',
    'ammo380',
    'ammo308',
    'ammo3030',
    'ammo12gauge',
  ];
  static depends = ['ammo'];

  private ammoTypes: Record<string, RuntimeObject> = {};

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.ammo9mm && !forceRebuild) {
      for (const alias of AmmoPrototypesBuilder.provides) {
        if ($[alias]) this.ammoTypes[alias] = $[alias];
      }
      return;
    }

    const parentObj = $.ammo;
    if (!parentObj) throw new Error('AmmoPrototypesBuilder: $ammo not found');

    const ammoId = parentObj.id;

    // Pistol calibers
    this.ammoTypes.ammo9mm = await new Ammo9mmBuilder(this.manager).build(ammoId);
    this.ammoTypes.ammo38 = await new Ammo38Builder(this.manager).build(ammoId);
    this.ammoTypes.ammo44 = await new Ammo44Builder(this.manager).build(ammoId);
    this.ammoTypes.ammo45 = await new Ammo45Builder(this.manager).build(ammoId);
    this.ammoTypes.ammo22 = await new Ammo22Builder(this.manager).build(ammoId);
    this.ammoTypes.ammo380 = await new Ammo380Builder(this.manager).build(ammoId);

    // Rifle calibers
    this.ammoTypes.ammo308 = await new Ammo308Builder(this.manager).build(ammoId);
    this.ammoTypes.ammo3030 = await new Ammo3030Builder(this.manager).build(ammoId);

    // Shotgun
    this.ammoTypes.ammo12gauge = await new Ammo12GaugeBuilder(this.manager).build(ammoId);

    console.log(`✅ Built ${Object.keys(this.ammoTypes).length} ammo prototypes`);
  }

  async registerAliases(): Promise<void> {
    // Register in memory for immediate access
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    for (const [name, obj] of Object.entries(this.ammoTypes)) {
      if (obj) {
        await objectManager.call('addAlias', name, obj.id);
      }
    }
  }
}

// Self-register
registerBuilder(AmmoPrototypesBuilder);
