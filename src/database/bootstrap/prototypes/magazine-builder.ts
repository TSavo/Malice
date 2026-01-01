import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the Magazine type
 *
 * A magazine holds ammunition for firearms. When ammo is loaded into a magazine,
 * the ammo object is recycled and the magazine's ammo count increases. When unloaded,
 * new ammo objects are created.
 *
 * Magazines have:
 * - ammoType: What type of ammo it holds (must match gun)
 * - ammo: Current round count
 * - maxAmmo: Capacity
 *
 * Inherits from $.describable.
 */
export class MagazineBuilder implements Builder {
  static provides = ['magazine'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('magazine');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) {
        throw new Error('Describable type not found - required for Magazine');
      }

      this.obj = await this.manager.define('magazine', describable, {
        properties: {
          name: 'Magazine',
          description: 'A detachable ammunition magazine.',
          ammoType: 'generic',
          ammo: 0,
          maxAmmo: 15,
          abilities: `Detachable ammunition container for firearms.

LOADING: put(ammoObj) loads rounds into magazine. Ammo must match 'ammoType'. Consumes ammo object when fully loaded.

UNLOADING: remove(amount) ejects rounds, creates new ammo object at caller's location.

CAPACITY: 'maxAmmo' is limit. Cannot exceed. 'ammo' is current count.

INSERTION: Magazines slot into compatible guns. Gun's usesMagazine must be true. Ammo types must match.

TYPES:
- Pistol magazines (7-17 rounds typical)
- Extended magazines (30+ rounds)
- Rifle magazines (10-30 rounds)
- SMG magazines (30-50 rounds)
- Speedloaders (revolver, 5-8 rounds)

COMPATIBILITY: Each magazine fits specific guns. Glock mag won't fit 1911.

RELOAD SPEED: Swapping magazines is faster than loading individual rounds. Tactical advantage.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    // put(ammoObj) - load ammo into the magazine, recycles the ammo object
    obj.setMethod(
      'put',
      `
      const ammoObj = args[0];

      if (!ammoObj) {
        return { success: false, error: 'Put what in the magazine?' };
      }

      // Check if it's ammo
      if (!ammoObj.ammoType) {
        return { success: false, error: 'That is not ammunition.' };
      }

      // Check ammo type compatibility
      if (self.ammoType && ammoObj.ammoType !== self.ammoType) {
        return { success: false, error: 'Wrong ammunition type. This magazine takes ' + self.ammoType + '.' };
      }

      const currentAmmo = self.ammo || 0;
      const maxAmmo = self.maxAmmo || 15;
      const spaceAvailable = maxAmmo - currentAmmo;

      if (spaceAvailable <= 0) {
        return { success: false, error: 'The magazine is full.' };
      }

      // How much ammo to load
      const available = ammoObj.quantity || 1;
      const toLoad = Math.min(available, spaceAvailable);

      if (toLoad <= 0) {
        return { success: false, error: 'No ammunition to load.' };
      }

      // Add to magazine
      self.ammo = currentAmmo + toLoad;

      // If we used all the ammo, recycle the object
      if (toLoad >= available) {
        await $.recycler.recycle(ammoObj);
        return { success: true, loaded: toLoad, remaining: self.ammo, recycled: true };
      } else {
        // Reduce the ammo object's quantity
        ammoObj.quantity = available - toLoad;
        return { success: true, loaded: toLoad, remaining: self.ammo, recycled: false };
      }
    `,
    );

    // remove(amount, caller) - unload ammo from the magazine, creates new ammo object
    obj.setMethod(
      'remove',
      `
      const amount = args[0];
      const caller = args[1]; // Who is removing (to find the room)

      const currentAmmo = self.ammo || 0;

      if (currentAmmo <= 0) {
        return { success: false, error: 'The magazine is empty.' };
      }

      // Default to removing all
      const toRemove = (amount && amount > 0) ? Math.min(amount, currentAmmo) : currentAmmo;

      // Reduce magazine ammo
      self.ammo = currentAmmo - toRemove;

      // Create new ammo object via recycler
      const newAmmo = await $.recycler.create($.ammo, {
        ammoType: self.ammoType,
        quantity: toRemove,
        name: self.ammoType + ' Ammunition',
        description: 'Loose ammunition.',
      });

      // Place ammo in the room (caller's location or magazine's location)
      const room = (caller && caller.location) || self.location;
      if (room) {
        await newAmmo.moveTo(room);
      }

      return { success: true, removed: toRemove, remaining: self.ammo, ammo: newAmmo };
    `,
    );

    // isEmpty() - check if magazine is empty
    obj.setMethod(
      'isEmpty',
      `
      return (self.ammo || 0) <= 0;
    `,
    );

    // isFull() - check if magazine is full
    obj.setMethod(
      'isFull',
      `
      return (self.ammo || 0) >= (self.maxAmmo || 15);
    `,
    );

    obj.setMethod(
      'describe',
      `
      const ammo = self.ammo || 0;
      const maxAmmo = self.maxAmmo || 15;
      const type = self.ammoType || 'generic';

      let desc = self.name || 'Magazine';
      desc += '\\r\\n' + (self.description || 'A detachable ammunition magazine.');
      desc += '\\r\\n[' + ammo + '/' + maxAmmo + ' rounds of ' + type + ']';

      return desc;
    `,
    );

    obj.setMethod(
      'shortDesc',
      `
      const ammo = self.ammo || 0;
      const maxAmmo = self.maxAmmo || 15;
      const name = self.name || 'magazine';
      return name + ' [' + ammo + '/' + maxAmmo + ']';
    `,
    );

    obj.setPropertyDescription(
      'ammoType',
      'The caliber of ammunition this magazine holds. Must match gun ammoType.',
    );
    obj.setPropertyDescription(
      'ammo',
      'Current number of rounds loaded in the magazine.',
    );
    obj.setPropertyDescription(
      'maxAmmo',
      'Maximum capacity - how many rounds this magazine can hold.',
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[MagazineBuilder] Type 'magazine' auto-aliased");
  }
}

registerBuilder(MagazineBuilder);

/**
 * Magazine sub-type builders
 * Each follows the same pattern as ammo types - proper Builders using define()
 */

export class PistolMagazineBuilder implements Builder {
  static provides = ['pistolMagazine'];
  static depends = ['magazine'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('pistolMagazine')) return;

    const parent = await this.manager.load('magazine');
    if (!parent)
      throw new Error('PistolMagazineBuilder: magazine type not found');

    await this.manager.define('pistolMagazine', parent, {
      properties: {
        name: 'Pistol Magazine',
        description: 'A standard pistol magazine.',
        ammoType: '9mm',
        ammo: 0,
        maxAmmo: 17,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[PistolMagazineBuilder] Type 'pistolMagazine' auto-aliased");
  }
}

export class ExtendedMagazineBuilder implements Builder {
  static provides = ['extendedMagazine'];
  static depends = ['magazine'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('extendedMagazine')) return;

    const parent = await this.manager.load('magazine');
    if (!parent)
      throw new Error('ExtendedMagazineBuilder: magazine type not found');

    await this.manager.define('extendedMagazine', parent, {
      properties: {
        name: 'Extended Magazine',
        description: 'A high-capacity extended magazine.',
        ammoType: '9mm',
        ammo: 0,
        maxAmmo: 30,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log(
      "[ExtendedMagazineBuilder] Type 'extendedMagazine' auto-aliased",
    );
  }
}

export class M1911MagazineBuilder implements Builder {
  static provides = ['m1911Magazine'];
  static depends = ['magazine'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('m1911Magazine')) return;

    const parent = await this.manager.load('magazine');
    if (!parent)
      throw new Error('M1911MagazineBuilder: magazine type not found');

    await this.manager.define('m1911Magazine', parent, {
      properties: {
        name: '1911 Magazine',
        description: 'A single-stack .45 magazine.',
        ammoType: '.45',
        ammo: 0,
        maxAmmo: 7,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[M1911MagazineBuilder] Type 'm1911Magazine' auto-aliased");
  }
}

export class RifleMagazineBuilder implements Builder {
  static provides = ['rifleMagazine'];
  static depends = ['magazine'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('rifleMagazine')) return;

    const parent = await this.manager.load('magazine');
    if (!parent)
      throw new Error('RifleMagazineBuilder: magazine type not found');

    await this.manager.define('rifleMagazine', parent, {
      properties: {
        name: 'Rifle Magazine',
        description: 'A detachable rifle magazine.',
        ammoType: '.308',
        ammo: 0,
        maxAmmo: 10,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[RifleMagazineBuilder] Type 'rifleMagazine' auto-aliased");
  }
}

export class SmgMagazineBuilder implements Builder {
  static provides = ['smgMagazine'];
  static depends = ['magazine'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('smgMagazine')) return;

    const parent = await this.manager.load('magazine');
    if (!parent)
      throw new Error('SmgMagazineBuilder: magazine type not found');

    await this.manager.define('smgMagazine', parent, {
      properties: {
        name: 'SMG Magazine',
        description: 'A submachine gun magazine.',
        ammoType: '9mm',
        ammo: 0,
        maxAmmo: 32,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[SmgMagazineBuilder] Type 'smgMagazine' auto-aliased");
  }
}

export class Mac10MagazineBuilder implements Builder {
  static provides = ['mac10Magazine'];
  static depends = ['magazine'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('mac10Magazine')) return;

    const parent = await this.manager.load('magazine');
    if (!parent)
      throw new Error('Mac10MagazineBuilder: magazine type not found');

    await this.manager.define('mac10Magazine', parent, {
      properties: {
        name: 'MAC-10 Magazine',
        description: 'A boxy .45 magazine for the MAC-10.',
        ammoType: '.45',
        ammo: 0,
        maxAmmo: 30,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[Mac10MagazineBuilder] Type 'mac10Magazine' auto-aliased");
  }
}

export class SpeedloaderBuilder implements Builder {
  static provides = ['speedloader'];
  static depends = ['magazine'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('speedloader')) return;

    const parent = await this.manager.load('magazine');
    if (!parent)
      throw new Error('SpeedloaderBuilder: magazine type not found');

    await this.manager.define('speedloader', parent, {
      properties: {
        name: 'Speedloader',
        description: 'A revolver speedloader. Loads all chambers at once.',
        ammoType: '.38',
        ammo: 0,
        maxAmmo: 6,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[SpeedloaderBuilder] Type 'speedloader' auto-aliased");
  }
}

// Self-register all magazine type builders
registerBuilder(PistolMagazineBuilder);
registerBuilder(ExtendedMagazineBuilder);
registerBuilder(M1911MagazineBuilder);
registerBuilder(RifleMagazineBuilder);
registerBuilder(SmgMagazineBuilder);
registerBuilder(Mac10MagazineBuilder);
registerBuilder(SpeedloaderBuilder);
