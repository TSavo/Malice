import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Firearm Prototypes
 *
 * Hierarchy:
 * $.weapon
 *   $.gun (base for all firearms)
 *     $.pistol (handguns - skill: pistol)
 *       $.revolver
 *       $.semiAutoPistol
 *       $.compactPistol
 *     $.rifle (long guns - skill: rifle)
 *       $.boltActionRifle
 *       $.leverActionRifle
 *       $.huntingRifle
 *     $.shotgun (scatterguns - skill: shotgun)
 *       $.pumpShotgun
 *       $.sawnOffShotgun
 *       $.doubleBarrel
 *     $.smg (submachine guns - skill: smg)
 *       $.machinePistol
 *
 * All firearms are ranged, have ammo, and use puncture damage.
 * Low-tech focus: no assault rifles, no military hardware (yet).
 */

// ═══════════════════════════════════════════════════════════════════════════
// BASE GUN
// ═══════════════════════════════════════════════════════════════════════════

export class GunBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Gun',
        description: 'A firearm.',
        skill: 'gun',
        damageType: 'puncture',
        ranged: true,
        range: 25,

        // Ammo system
        ammo: 0,
        maxAmmo: 6,
        ammoType: 'generic',

        // Magazine system
        usesMagazine: false,

        // Abilities - firearm physics for AI interpretation
        abilities: `Ranged weapon that fires projectiles using gunpowder.

COMBAT TRACKING: When shooting at someone, call $combat.start(shooter, target) to set up exclusions. Call $combat.log(combatId, message) to record events. Call $combat.end(combatId, reason, winner) when combat concludes.

FIRING: Point and shoot. Requires ammo (check via getAmmoCount()). Call fire() to expend one round. Create wounds on target body parts directly. Missed shots go somewhere - may hit unintended targets or objects.

AIMING: Accuracy based on 'skill' + distance vs 'range'. Beyond effective range, accuracy drops sharply. Cover and movement affect hit chance.

RELOADING: If 'usesMagazine' is true, call unload() to eject, then load(magazine). Otherwise load(ammo) directly (revolvers, shotguns). Reloading takes time - vulnerable while doing it.

NOISE: Gunfire is LOUD. Everyone nearby hears it. Suppressed weapons are quieter but not silent. Gunshots attract attention.

RECOIL: Heavier calibers kick more. Rapid fire reduces accuracy. 'twoHanded' weapons are harder to control one-handed.

AMMUNITION: Check 'ammoType' for compatible ammo. Wrong ammo won't load. Different ammo types may exist (hollow point, FMJ, etc).

MALFUNCTIONS: Guns can jam, especially if dirty or damaged. Clearing a jam takes time.

CONCEALMENT: Smaller guns ('compactPistol', 'derringer') easier to hide. Long guns obvious.`,
      },
      methods: {},
    });

    // Add property descriptions
    obj.setPropertyDescription(
      'usesMagazine',
      'If true, uses detachable magazines. If false, loads ammo directly (revolver, shotgun).',
    );
    obj.setPropertyDescription(
      'ammo',
      'Current rounds loaded (direct-load guns only). Magazine-fed guns check the magazine.',
    );
    obj.setPropertyDescription('maxAmmo', 'Capacity when fully loaded.');
    obj.setPropertyDescription(
      'ammoType',
      'Required ammo type: 9mm, .45, 12gauge, .308, etc.',
    );

    // ═══════════════════════════════════════════════════════════════════════
    // AMMO MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    obj.setMethod(
      'getLoadedMagazine',
      `
      /** Get the magazine currently loaded in this gun.
       *  @returns Magazine RuntimeObject or null if none loaded
       */
      if (!self.usesMagazine) return null;

      const contents = self.contents || [];
      for (const item of contents) {
        if (item.maxAmmo !== undefined && item.ammo !== undefined && item.quantity === undefined) {
          return item;
        }
      }
      return null;
    `,
    );

    obj.setMethod(
      'load',
      `
      /** Load a magazine or ammo into this gun (infrastructure method).
       *  @param item - Magazine or ammo object to load
       *  @returns { success: boolean, loaded?: string|number, rounds?: number, error?: string }
       */
      const item = args[0];

      if (!item) {
        return { success: false, error: 'Load what?' };
      }
      
      // Check if this gun uses magazines
      if (self.usesMagazine) {
        // Must load a magazine, not loose ammo
        if (item.ammoType && item.quantity !== undefined) {
          return { success: false, error: 'This gun uses magazines. Load a magazine, not loose ammo.' };
        }
        
        // Check if it's a magazine
        if (item.maxAmmo === undefined || item.ammo === undefined) {
          return { success: false, error: 'That is not a magazine.' };
        }
        
        // Check ammo type compatibility
        if (self.ammoType && item.ammoType !== self.ammoType) {
          return { success: false, error: 'Wrong magazine type. This gun takes ' + self.ammoType + '.' };
        }
        
        // Check if already loaded
        const currentMag = await self.getLoadedMagazine();
        if (currentMag) {
          return { success: false, error: 'Eject the current magazine first.' };
        }
        
        // Load the magazine - move it into the gun via containment
        await item.moveTo(self);
        
        return { success: true, loaded: 'magazine', rounds: item.ammo };
        
      } else {
        // Direct load (shotguns, revolvers, etc.)
        // Must load ammo, not a magazine
        if (item.maxAmmo !== undefined && item.quantity === undefined) {
          return { success: false, error: 'This gun does not use magazines. Load ammunition directly.' };
        }
        
        // Check if it's ammo
        if (!item.ammoType || item.quantity === undefined) {
          return { success: false, error: 'That is not ammunition.' };
        }
        
        // Check ammo type compatibility
        if (self.ammoType && item.ammoType !== self.ammoType) {
          return { success: false, error: 'Wrong ammunition. This gun takes ' + self.ammoType + '.' };
        }
        
        const currentAmmo = self.ammo || 0;
        const maxAmmo = self.maxAmmo || 6;
        const spaceAvailable = maxAmmo - currentAmmo;
        
        if (spaceAvailable <= 0) {
          return { success: false, error: 'Already fully loaded.' };
        }
        
        // How much to load
        const available = item.quantity || 0;
        const toLoad = Math.min(available, spaceAvailable);
        
        if (toLoad <= 0) {
          return { success: false, error: 'No ammunition to load.' };
        }
        
        // Add to gun
        self.ammo = currentAmmo + toLoad;
        
        // Recycle ammo if used all, otherwise reduce quantity
        if (toLoad >= available) {
          await $.recycler.recycle(item);
          return { success: true, loaded: toLoad, remaining: self.ammo, recycled: true };
        } else {
          item.quantity = available - toLoad;
          return { success: true, loaded: toLoad, remaining: self.ammo, recycled: false };
        }
      }
    `,
    );

    obj.setMethod(
      'unload',
      `
      /** Eject magazine or unload direct ammo (infrastructure method).
       *  @param caller - Who is unloading (for hand/room placement)
       *  @returns { success: boolean, ejected?: string, magazine?: object, rounds?: number, error?: string }
       */
      const caller = args[0];

      if (self.usesMagazine) {
        // Eject the magazine
        const magazine = await self.getLoadedMagazine();
        if (!magazine) {
          return { success: false, error: 'No magazine loaded.' };
        }
        
        // Try to put magazine in caller's free hand, otherwise drop to room
        let destination = null;
        if (caller && caller.getHands) {
          const hands = await caller.getHands();
          // Find a free hand
          for (const hand of hands.both) {
            if (hand && await hand.isFree()) {
              destination = hand;
              break;
            }
          }
        }
        
        // Fall back to room if no free hand
        if (!destination) {
          destination = (caller && caller.location) || self.location;
        }
        
        if (destination) {
          await magazine.moveTo(destination);
        }
        
        return { success: true, ejected: 'magazine', magazine: magazine, rounds: magazine.ammo };
        
      } else {
        // Unload direct ammo
        const currentAmmo = self.ammo || 0;
        
        if (currentAmmo <= 0) {
          return { success: false, error: 'Gun is empty.' };
        }
        
        // Create ammo object via recycler
        const newAmmo = await $.recycler.create($.ammo, {
          ammoType: self.ammoType,
          quantity: currentAmmo,
          name: self.ammoType + ' Ammunition',
          description: 'Loose ammunition.',
        });
        
        // Try to put ammo in caller's free hand, otherwise drop to room
        let destination = null;
        if (caller && caller.getHands) {
          const hands = await caller.getHands();
          for (const hand of hands.both) {
            if (hand && await hand.isFree()) {
              destination = hand;
              break;
            }
          }
        }
        
        if (!destination) {
          destination = (caller && caller.location) || self.location;
        }
        
        if (destination) {
          await newAmmo.moveTo(destination);
        }
        
        self.ammo = 0;
        
        return { success: true, unloaded: currentAmmo, ammo: newAmmo };
      }
    `,
    );

    // ═══════════════════════════════════════════════════════════════════════
    // FIRING
    // ═══════════════════════════════════════════════════════════════════════

    obj.setMethod(
      'getAmmoCount',
      `
      /** Get current ammo count, checking magazine if applicable.
       *  @returns Number of rounds available
       */
      if (self.usesMagazine) {
        const magazine = await self.getLoadedMagazine();
        return magazine ? (magazine.ammo || 0) : 0;
      }
      return self.ammo || 0;
    `,
    );

    obj.setMethod(
      'canFire',
      `
      /** Check if this gun can fire.
       *  @returns { success: boolean, reason?: string }
       */
      if (!self.ranged) {
        return { success: false, reason: 'This is not a ranged weapon.' };
      }

      const ammoCount = await self.getAmmoCount();
      if (ammoCount <= 0) {
        return { success: false, reason: 'Out of ammo.' };
      }

      return { success: true };
    `,
    );

    obj.setMethod(
      'fire',
      `
      /** Fire the gun, expending one round (infrastructure method).
       *  @returns { success: boolean, ammoRemaining?: number, reason?: string }
       */
      const canFire = await self.canFire();
      if (!canFire.success) {
        return canFire;
      }

      if (self.usesMagazine) {
        const magazine = await self.getLoadedMagazine();
        if (magazine) {
          magazine.ammo = (magazine.ammo || 0) - 1;
          return { success: true, ammoRemaining: magazine.ammo };
        }
      }

      self.ammo = (self.ammo || 0) - 1;
      return { success: true, ammoRemaining: self.ammo };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════════

    obj.setMethod(
      'describe',
      `
      let desc = self.name + '\\r\\n' + self.description;
      
      if (self.ranged) {
        const ammoCount = await self.getAmmoCount();
        let maxAmmo = self.maxAmmo;
        
        if (self.usesMagazine) {
          const magazine = await self.getLoadedMagazine();
          if (magazine) {
            maxAmmo = magazine.maxAmmo || self.maxAmmo;
            desc += '\\r\\n[' + ammoCount + '/' + maxAmmo + ' rounds] (magazine loaded)';
          } else {
            desc += '\\r\\n[no magazine]';
          }
        } else {
          desc += '\\r\\n[' + ammoCount + '/' + maxAmmo + ' rounds]';
        }
      }
      
      return desc;
    `,
    );

    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PISTOLS (skill: pistol)
// ═══════════════════════════════════════════════════════════════════════════

export class PistolBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Pistol',
        description: 'A handgun.',
        skill: 'pistol',
        damage: 35,
        damageType: 'puncture',
        ranged: true,
        range: 25,
        maxAmmo: 15,
        ammoType: '9mm',
        usesMagazine: true, // Magazine-fed
      },
      methods: {},
    });
    return obj;
  }
}

export class RevolverBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Revolver',
        description: 'A six-shot wheel gun. Reliable and powerful.',
        skill: 'pistol',
        damage: 40,
        damageType: 'puncture',
        ranged: true,
        range: 30,
        ammo: 0,
        maxAmmo: 6,
        ammoType: '.38',
        usesMagazine: false, // Direct load (cylinder)
      },
      methods: {},
    });
    return obj;
  }
}

export class MagnumBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Magnum Revolver',
        description: 'A large-bore revolver. Hand cannon.',
        skill: 'pistol',
        damage: 55,
        damageType: 'puncture',
        ranged: true,
        range: 35,
        ammo: 0,
        maxAmmo: 6,
        ammoType: '.44',
        usesMagazine: false, // Direct load (cylinder)
      },
      methods: {},
    });
    return obj;
  }
}

export class SemiAutoPistolBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Semi-Auto Pistol',
        description: 'A magazine-fed automatic handgun. Standard issue.',
        skill: 'pistol',
        damage: 35,
        damageType: 'puncture',
        ranged: true,
        range: 25,
        maxAmmo: 17,
        ammoType: '9mm',
        usesMagazine: true, // Magazine-fed
      },
      methods: {},
    });
    return obj;
  }
}

export class CompactPistolBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Compact Pistol',
        description: 'A small concealed-carry pistol. Easy to hide.',
        skill: 'pistol',
        damage: 28,
        damageType: 'puncture',
        ranged: true,
        range: 15,
        maxAmmo: 7,
        ammoType: '.380',
        usesMagazine: true, // Magazine-fed
      },
      methods: {},
    });
    return obj;
  }
}

export class DerringerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Derringer',
        description: 'A tiny two-shot pistol. Pocket backup gun.',
        skill: 'pistol',
        damage: 25,
        damageType: 'puncture',
        ranged: true,
        range: 5,
        ammo: 0,
        maxAmmo: 2,
        ammoType: '.22',
        usesMagazine: false, // Break-action, direct load
      },
      methods: {},
    });
    return obj;
  }
}

export class M1911Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'M1911',
        description:
          'The classic .45 ACP semi-automatic. American military icon.',
        skill: 'pistol',
        damage: 42,
        damageType: 'puncture',
        ranged: true,
        range: 25,
        maxAmmo: 7,
        ammoType: '.45',
        usesMagazine: true, // Magazine-fed
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RIFLES (skill: rifle)
// ═══════════════════════════════════════════════════════════════════════════

export class RifleBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Rifle',
        description: 'A long-barreled firearm for accurate shooting.',
        skill: 'rifle',
        damage: 50,
        damageType: 'puncture',
        ranged: true,
        range: 200,
        ammo: 0,
        maxAmmo: 5,
        ammoType: '.308',
        usesMagazine: false, // Internal magazine, direct load
        twoHanded: true, // Long gun requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class BoltActionRifleBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Bolt Action Rifle',
        description: 'A manually-cycled rifle. Slow but accurate.',
        skill: 'rifle',
        damage: 55,
        damageType: 'puncture',
        ranged: true,
        range: 300,
        ammo: 0,
        maxAmmo: 5,
        ammoType: '.308',
        usesMagazine: false, // Internal magazine, direct load
        twoHanded: true, // Long gun requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class LeverActionRifleBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Lever Action Rifle',
        description: 'A cowboy rifle. Tubular magazine, lever cycling.',
        skill: 'rifle',
        damage: 45,
        damageType: 'puncture',
        ranged: true,
        range: 150,
        ammo: 0,
        maxAmmo: 10,
        ammoType: '.30-30',
        usesMagazine: false, // Tubular magazine, direct load
        twoHanded: true, // Long gun requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class HuntingRifleBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Hunting Rifle',
        description: 'A civilian sporting rifle. Wood stock, scope mount.',
        skill: 'rifle',
        damage: 50,
        damageType: 'puncture',
        ranged: true,
        range: 250,
        ammo: 0,
        maxAmmo: 4,
        ammoType: '.308',
        usesMagazine: false, // Internal magazine, direct load
        twoHanded: true, // Long gun requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class Rifle22Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: '.22 Rifle',
        description: 'A small-caliber plinking rifle. Cheap ammo, low power.',
        skill: 'rifle',
        damage: 25,
        damageType: 'puncture',
        ranged: true,
        range: 100,
        ammo: 0,
        maxAmmo: 10,
        ammoType: '.22',
        usesMagazine: false, // Internal magazine, direct load
        twoHanded: true, // Long gun requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOTGUNS (skill: shotgun)
// ═══════════════════════════════════════════════════════════════════════════

export class ShotgunBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Shotgun',
        description:
          'A smoothbore long gun firing shot shells. Devastating up close.',
        skill: 'shotgun',
        damage: 55,
        damageType: 'puncture',
        ranged: true,
        range: 30,
        ammo: 0,
        maxAmmo: 5,
        ammoType: '12gauge',
        usesMagazine: false, // Tube magazine, direct load
        twoHanded: true, // Long gun requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class PumpShotgunBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Pump Shotgun',
        description: 'A pump-action shotgun. The iconic rack sound.',
        skill: 'shotgun',
        damage: 55,
        damageType: 'puncture',
        ranged: true,
        range: 30,
        ammo: 0,
        maxAmmo: 8,
        ammoType: '12gauge',
        usesMagazine: false, // Tube magazine, direct load
        twoHanded: true, // Long gun requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class SawnOffShotgunBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Sawn-Off Shotgun',
        description:
          'A shotgun with the barrel cut down. Concealable, brutal spread.',
        skill: 'shotgun',
        damage: 50,
        damageType: 'puncture',
        ranged: true,
        range: 10,
        ammo: 0,
        maxAmmo: 2,
        ammoType: '12gauge',
        usesMagazine: false, // Break-action, direct load
      },
      methods: {},
    });
    return obj;
  }
}

export class DoubleBarrelBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Double Barrel Shotgun',
        description:
          'A break-action two-barrel shotgun. Two shots, then reload.',
        skill: 'shotgun',
        damage: 55,
        damageType: 'puncture',
        ranged: true,
        range: 25,
        ammo: 0,
        maxAmmo: 2,
        ammoType: '12gauge',
        usesMagazine: false, // Break-action, direct load
        twoHanded: true, // Long gun requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

export class CoachGunBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Coach Gun',
        description: 'A short double-barrel shotgun. Western classic.',
        skill: 'shotgun',
        damage: 52,
        damageType: 'puncture',
        ranged: true,
        range: 20,
        ammo: 0,
        maxAmmo: 2,
        ammoType: '12gauge',
        usesMagazine: false, // Break-action, direct load
        twoHanded: true, // Long gun requires two hands
      },
      methods: {},
    });
    return obj;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBMACHINE GUNS (skill: smg)
// ═══════════════════════════════════════════════════════════════════════════

export class SmgBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Submachine Gun',
        description: 'A compact automatic weapon. High rate of fire.',
        skill: 'smg',
        damage: 32,
        damageType: 'puncture',
        ranged: true,
        range: 50,
        maxAmmo: 30,
        ammoType: '9mm',
        usesMagazine: true, // Detachable magazine
      },
      methods: {},
    });
    return obj;
  }
}

export class MachinePistolBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Machine Pistol',
        description: 'A fully-automatic pistol. Sprays bullets.',
        skill: 'smg',
        damage: 28,
        damageType: 'puncture',
        ranged: true,
        range: 25,
        maxAmmo: 20,
        ammoType: '9mm',
        usesMagazine: true, // Detachable magazine
      },
      methods: {},
    });
    return obj;
  }
}

export class UziBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Uzi',
        description: 'An iconic Israeli submachine gun. Compact and reliable.',
        skill: 'smg',
        damage: 30,
        damageType: 'puncture',
        ranged: true,
        range: 40,
        maxAmmo: 32,
        ammoType: '9mm',
        usesMagazine: true, // Detachable magazine
      },
      methods: {},
    });
    return obj;
  }
}

export class Mac10Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'MAC-10',
        description: 'A cheap, boxy machine pistol. Street favorite.',
        skill: 'smg',
        damage: 28,
        damageType: 'puncture',
        ranged: true,
        range: 30,
        maxAmmo: 30,
        ammoType: '.45',
        usesMagazine: true, // Detachable magazine
      },
      methods: {},
    });
    return obj;
  }
}

export class TecBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'TEC-9',
        description:
          'A semi-auto pistol easily converted to full-auto. Gang gun.',
        skill: 'smg',
        damage: 30,
        damageType: 'puncture',
        ranged: true,
        range: 35,
        maxAmmo: 32,
        ammoType: '9mm',
        usesMagazine: true, // Detachable magazine
      },
      methods: {},
    });
    return obj;
  }
}
