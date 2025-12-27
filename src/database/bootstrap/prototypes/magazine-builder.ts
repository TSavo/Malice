import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the Magazine prototype
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
 * Verbs:
 * - put <ammo> in <magazine>: Load ammo into the magazine
 * - remove <amount> from <magazine>: Unload ammo from the magazine
 *
 * Inherits from $.describable.
 */
export class MagazineBuilder {
  static readonly alias = 'magazine';
  static readonly parent = 'describable';

  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Magazine',
        description: 'A detachable ammunition magazine.',

        // What type of ammo this magazine holds
        ammoType: 'generic',

        // Current ammo count (rounds in the magazine)
        ammo: 0,

        // Maximum capacity
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

    // ═══════════════════════════════════════════════════════════════════════
    // AMMO MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

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

    // ═══════════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════════

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

    return obj;
  }
}

/**
 * Specific magazine type builders
 */

export class PistolMagazineBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
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
}

export class ExtendedMagazineBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
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
}

export class M1911MagazineBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
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
}

export class RifleMagazineBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
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
}

export class SmgMagazineBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
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
}

export class Mac10MagazineBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    return await this.manager.create({
      parent: parentObj!,
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
}

export class SpeedloaderBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Speedloader',
        description: 'A revolver speedloader. Loads all chambers at once.',
        ammoType: '.38',
        ammo: 0,
        maxAmmo: 6,
      },
      methods: {},
    });
    return obj;
  }
}

/**
 * Builds all magazine sub-prototypes
 *
 * This creates a hierarchy of magazine prototypes under $.magazine:
 *
 * $.magazine (base - inherits from $.describable)
 *   $.pistolMagazine (9mm, 17 rounds)
 *   $.extendedMagazine (9mm, 30 rounds)
 *   $.m1911Magazine (.45, 7 rounds)
 *   $.rifleMagazine (.308, 10 rounds)
 *   $.smgMagazine (9mm, 32 rounds)
 *   $.mac10Magazine (.45, 30 rounds)
 *   $.speedloader (.38, 6 rounds)
 */
export class MagazinePrototypesBuilder {
  static readonly aliases = [
    'pistolMagazine', 'extendedMagazine', 'm1911Magazine',
    'rifleMagazine', 'smgMagazine', 'mac10Magazine', 'speedloader',
  ] as const;
  static readonly parent = 'magazine';

  constructor(private manager: ObjectManager) {}

  /**
   * Build all magazine sub-prototypes
   * @param magazineId - ID of the base $.magazine prototype
   * @returns Record of magazine name -> RuntimeObject
   */
  async buildAll(magazineId: number): Promise<Record<string, RuntimeObject>> {
    const magazines: Record<string, RuntimeObject> = {};

    // Pistol magazines
    magazines.pistolMagazine = await new PistolMagazineBuilder(
      this.manager,
    ).build(magazineId);
    magazines.extendedMagazine = await new ExtendedMagazineBuilder(
      this.manager,
    ).build(magazineId);
    magazines.m1911Magazine = await new M1911MagazineBuilder(
      this.manager,
    ).build(magazineId);

    // Rifle magazines
    magazines.rifleMagazine = await new RifleMagazineBuilder(
      this.manager,
    ).build(magazineId);

    // SMG magazines
    magazines.smgMagazine = await new SmgMagazineBuilder(this.manager).build(
      magazineId,
    );
    magazines.mac10Magazine = await new Mac10MagazineBuilder(
      this.manager,
    ).build(magazineId);

    // Revolver speedloader
    magazines.speedloader = await new SpeedloaderBuilder(this.manager).build(
      magazineId,
    );

    console.log(
      `✅ Built ${Object.keys(magazines).length} magazine prototypes`,
    );
    return magazines;
  }
}
