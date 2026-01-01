import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Firearm Types
 *
 * Hierarchy:
 * $.weapon
 *   $.gun (base for all firearms)
 *     $.pistol (handguns - skill: pistol)
 *       $.revolver, $.magnum, $.semiAutoPistol, $.compactPistol, $.derringer, $.m1911
 *     $.rifle (long guns - skill: rifle)
 *       $.boltActionRifle, $.leverActionRifle, $.huntingRifle, $.rifle22
 *     $.shotgun (scatterguns - skill: shotgun)
 *       $.pumpShotgun, $.sawnOffShotgun, $.doubleBarrel, $.coachGun
 *     $.smg (submachine guns - skill: smg)
 *       $.machinePistol, $.uzi, $.mac10, $.tec9
 */

// ═══════════════════════════════════════════════════════════════════════════
// BASE GUN
// ═══════════════════════════════════════════════════════════════════════════

export class GunBuilder implements Builder {
  static provides = ['gun'];
  static depends = ['weapon'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('gun')) return;

    const parent = await this.manager.load('weapon');
    if (!parent) throw new Error('GunBuilder: weapon type not found');

    const obj = await this.manager.define('gun', parent, {
      properties: {
        name: 'Gun',
        description: 'A firearm.',
        skill: 'gun',
        damageType: 'puncture',
        ranged: true,
        range: 25,
        ammo: 0,
        maxAmmo: 6,
        ammoType: 'generic',
        usesMagazine: false,

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

    obj.setMethod(
      'getLoadedMagazine',
      `
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
      const item = args[0];

      if (!item) {
        return { success: false, error: 'Load what?' };
      }

      if (self.usesMagazine) {
        if (item.ammoType && item.quantity !== undefined) {
          return { success: false, error: 'This gun uses magazines. Load a magazine, not loose ammo.' };
        }

        if (item.maxAmmo === undefined || item.ammo === undefined) {
          return { success: false, error: 'That is not a magazine.' };
        }

        if (self.ammoType && item.ammoType !== self.ammoType) {
          return { success: false, error: 'Wrong magazine type. This gun takes ' + self.ammoType + '.' };
        }

        const currentMag = await self.getLoadedMagazine();
        if (currentMag) {
          return { success: false, error: 'Eject the current magazine first.' };
        }

        await item.moveTo(self);

        return { success: true, loaded: 'magazine', rounds: item.ammo };

      } else {
        if (item.maxAmmo !== undefined && item.quantity === undefined) {
          return { success: false, error: 'This gun does not use magazines. Load ammunition directly.' };
        }

        if (!item.ammoType || item.quantity === undefined) {
          return { success: false, error: 'That is not ammunition.' };
        }

        if (self.ammoType && item.ammoType !== self.ammoType) {
          return { success: false, error: 'Wrong ammunition. This gun takes ' + self.ammoType + '.' };
        }

        const currentAmmo = self.ammo || 0;
        const maxAmmo = self.maxAmmo || 6;
        const spaceAvailable = maxAmmo - currentAmmo;

        if (spaceAvailable <= 0) {
          return { success: false, error: 'Already fully loaded.' };
        }

        const available = item.quantity || 0;
        const toLoad = Math.min(available, spaceAvailable);

        if (toLoad <= 0) {
          return { success: false, error: 'No ammunition to load.' };
        }

        self.ammo = currentAmmo + toLoad;

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
      const caller = args[0];

      if (self.usesMagazine) {
        const magazine = await self.getLoadedMagazine();
        if (!magazine) {
          return { success: false, error: 'No magazine loaded.' };
        }

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
          await magazine.moveTo(destination);
        }

        return { success: true, ejected: 'magazine', magazine: magazine, rounds: magazine.ammo };

      } else {
        const currentAmmo = self.ammo || 0;

        if (currentAmmo <= 0) {
          return { success: false, error: 'Gun is empty.' };
        }

        const newAmmo = await $.recycler.create($.ammo, {
          ammoType: self.ammoType,
          quantity: currentAmmo,
          name: self.ammoType + ' Ammunition',
          description: 'Loose ammunition.',
        });

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

    obj.setMethod(
      'getAmmoCount',
      `
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
  }

  async registerAliases(): Promise<void> {
    console.log("[GunBuilder] Type 'gun' auto-aliased");
  }
}

registerBuilder(GunBuilder);

// ═══════════════════════════════════════════════════════════════════════════
// PISTOLS (skill: pistol)
// ═══════════════════════════════════════════════════════════════════════════

export class PistolBuilder implements Builder {
  static provides = ['pistol'];
  static depends = ['gun'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('pistol')) return;

    const parent = await this.manager.load('gun');
    if (!parent) throw new Error('PistolBuilder: gun type not found');

    await this.manager.define('pistol', parent, {
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
        usesMagazine: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[PistolBuilder] Type 'pistol' auto-aliased");
  }
}

export class RevolverBuilder implements Builder {
  static provides = ['revolver'];
  static depends = ['pistol'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('revolver')) return;

    const parent = await this.manager.load('pistol');
    if (!parent) throw new Error('RevolverBuilder: pistol type not found');

    await this.manager.define('revolver', parent, {
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
        usesMagazine: false,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[RevolverBuilder] Type 'revolver' auto-aliased");
  }
}

export class MagnumBuilder implements Builder {
  static provides = ['magnum'];
  static depends = ['pistol'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('magnum')) return;

    const parent = await this.manager.load('pistol');
    if (!parent) throw new Error('MagnumBuilder: pistol type not found');

    await this.manager.define('magnum', parent, {
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
        usesMagazine: false,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[MagnumBuilder] Type 'magnum' auto-aliased");
  }
}

export class SemiAutoPistolBuilder implements Builder {
  static provides = ['semiAutoPistol'];
  static depends = ['pistol'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('semiAutoPistol')) return;

    const parent = await this.manager.load('pistol');
    if (!parent)
      throw new Error('SemiAutoPistolBuilder: pistol type not found');

    await this.manager.define('semiAutoPistol', parent, {
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
        usesMagazine: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[SemiAutoPistolBuilder] Type 'semiAutoPistol' auto-aliased");
  }
}

export class CompactPistolBuilder implements Builder {
  static provides = ['compactPistol'];
  static depends = ['pistol'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('compactPistol')) return;

    const parent = await this.manager.load('pistol');
    if (!parent) throw new Error('CompactPistolBuilder: pistol type not found');

    await this.manager.define('compactPistol', parent, {
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
        usesMagazine: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[CompactPistolBuilder] Type 'compactPistol' auto-aliased");
  }
}

export class DerringerBuilder implements Builder {
  static provides = ['derringer'];
  static depends = ['pistol'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('derringer')) return;

    const parent = await this.manager.load('pistol');
    if (!parent) throw new Error('DerringerBuilder: pistol type not found');

    await this.manager.define('derringer', parent, {
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
        usesMagazine: false,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[DerringerBuilder] Type 'derringer' auto-aliased");
  }
}

export class M1911Builder implements Builder {
  static provides = ['m1911'];
  static depends = ['pistol'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('m1911')) return;

    const parent = await this.manager.load('pistol');
    if (!parent) throw new Error('M1911Builder: pistol type not found');

    await this.manager.define('m1911', parent, {
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
        usesMagazine: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[M1911Builder] Type 'm1911' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RIFLES (skill: rifle)
// ═══════════════════════════════════════════════════════════════════════════

export class RifleBuilder implements Builder {
  static provides = ['rifle'];
  static depends = ['gun'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('rifle')) return;

    const parent = await this.manager.load('gun');
    if (!parent) throw new Error('RifleBuilder: gun type not found');

    await this.manager.define('rifle', parent, {
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
        usesMagazine: false,
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[RifleBuilder] Type 'rifle' auto-aliased");
  }
}

export class BoltActionRifleBuilder implements Builder {
  static provides = ['boltActionRifle'];
  static depends = ['rifle'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('boltActionRifle')) return;

    const parent = await this.manager.load('rifle');
    if (!parent)
      throw new Error('BoltActionRifleBuilder: rifle type not found');

    await this.manager.define('boltActionRifle', parent, {
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
        usesMagazine: false,
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[BoltActionRifleBuilder] Type 'boltActionRifle' auto-aliased");
  }
}

export class LeverActionRifleBuilder implements Builder {
  static provides = ['leverActionRifle'];
  static depends = ['rifle'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('leverActionRifle')) return;

    const parent = await this.manager.load('rifle');
    if (!parent)
      throw new Error('LeverActionRifleBuilder: rifle type not found');

    await this.manager.define('leverActionRifle', parent, {
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
        usesMagazine: false,
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log(
      "[LeverActionRifleBuilder] Type 'leverActionRifle' auto-aliased",
    );
  }
}

export class HuntingRifleBuilder implements Builder {
  static provides = ['huntingRifle'];
  static depends = ['rifle'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('huntingRifle')) return;

    const parent = await this.manager.load('rifle');
    if (!parent) throw new Error('HuntingRifleBuilder: rifle type not found');

    await this.manager.define('huntingRifle', parent, {
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
        usesMagazine: false,
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[HuntingRifleBuilder] Type 'huntingRifle' auto-aliased");
  }
}

export class Rifle22Builder implements Builder {
  static provides = ['rifle22'];
  static depends = ['rifle'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('rifle22')) return;

    const parent = await this.manager.load('rifle');
    if (!parent) throw new Error('Rifle22Builder: rifle type not found');

    await this.manager.define('rifle22', parent, {
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
        usesMagazine: false,
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[Rifle22Builder] Type 'rifle22' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOTGUNS (skill: shotgun)
// ═══════════════════════════════════════════════════════════════════════════

export class ShotgunBuilder implements Builder {
  static provides = ['shotgun'];
  static depends = ['gun'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('shotgun')) return;

    const parent = await this.manager.load('gun');
    if (!parent) throw new Error('ShotgunBuilder: gun type not found');

    await this.manager.define('shotgun', parent, {
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
        usesMagazine: false,
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[ShotgunBuilder] Type 'shotgun' auto-aliased");
  }
}

export class PumpShotgunBuilder implements Builder {
  static provides = ['pumpShotgun'];
  static depends = ['shotgun'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('pumpShotgun')) return;

    const parent = await this.manager.load('shotgun');
    if (!parent) throw new Error('PumpShotgunBuilder: shotgun type not found');

    await this.manager.define('pumpShotgun', parent, {
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
        usesMagazine: false,
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[PumpShotgunBuilder] Type 'pumpShotgun' auto-aliased");
  }
}

export class SawnOffShotgunBuilder implements Builder {
  static provides = ['sawnOffShotgun'];
  static depends = ['shotgun'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('sawnOffShotgun')) return;

    const parent = await this.manager.load('shotgun');
    if (!parent)
      throw new Error('SawnOffShotgunBuilder: shotgun type not found');

    await this.manager.define('sawnOffShotgun', parent, {
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
        usesMagazine: false,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[SawnOffShotgunBuilder] Type 'sawnOffShotgun' auto-aliased");
  }
}

export class DoubleBarrelBuilder implements Builder {
  static provides = ['doubleBarrel'];
  static depends = ['shotgun'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('doubleBarrel')) return;

    const parent = await this.manager.load('shotgun');
    if (!parent) throw new Error('DoubleBarrelBuilder: shotgun type not found');

    await this.manager.define('doubleBarrel', parent, {
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
        usesMagazine: false,
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[DoubleBarrelBuilder] Type 'doubleBarrel' auto-aliased");
  }
}

export class CoachGunBuilder implements Builder {
  static provides = ['coachGun'];
  static depends = ['shotgun'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('coachGun')) return;

    const parent = await this.manager.load('shotgun');
    if (!parent) throw new Error('CoachGunBuilder: shotgun type not found');

    await this.manager.define('coachGun', parent, {
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
        usesMagazine: false,
        twoHanded: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[CoachGunBuilder] Type 'coachGun' auto-aliased");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBMACHINE GUNS (skill: smg)
// ═══════════════════════════════════════════════════════════════════════════

export class SmgBuilder implements Builder {
  static provides = ['smg'];
  static depends = ['gun'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('smg')) return;

    const parent = await this.manager.load('gun');
    if (!parent) throw new Error('SmgBuilder: gun type not found');

    await this.manager.define('smg', parent, {
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
        usesMagazine: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[SmgBuilder] Type 'smg' auto-aliased");
  }
}

export class MachinePistolBuilder implements Builder {
  static provides = ['machinePistol'];
  static depends = ['smg'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('machinePistol')) return;

    const parent = await this.manager.load('smg');
    if (!parent) throw new Error('MachinePistolBuilder: smg type not found');

    await this.manager.define('machinePistol', parent, {
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
        usesMagazine: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[MachinePistolBuilder] Type 'machinePistol' auto-aliased");
  }
}

export class UziBuilder implements Builder {
  static provides = ['uzi'];
  static depends = ['smg'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('uzi')) return;

    const parent = await this.manager.load('smg');
    if (!parent) throw new Error('UziBuilder: smg type not found');

    await this.manager.define('uzi', parent, {
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
        usesMagazine: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[UziBuilder] Type 'uzi' auto-aliased");
  }
}

export class Mac10Builder implements Builder {
  static provides = ['mac10'];
  static depends = ['smg'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('mac10')) return;

    const parent = await this.manager.load('smg');
    if (!parent) throw new Error('Mac10Builder: smg type not found');

    await this.manager.define('mac10', parent, {
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
        usesMagazine: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[Mac10Builder] Type 'mac10' auto-aliased");
  }
}

export class Tec9Builder implements Builder {
  static provides = ['tec9'];
  static depends = ['smg'];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    if (await this.manager.load('tec9')) return;

    const parent = await this.manager.load('smg');
    if (!parent) throw new Error('Tec9Builder: smg type not found');

    await this.manager.define('tec9', parent, {
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
        usesMagazine: true,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    console.log("[Tec9Builder] Type 'tec9' auto-aliased");
  }
}

// Self-register all builders
registerBuilder(PistolBuilder);
registerBuilder(RevolverBuilder);
registerBuilder(MagnumBuilder);
registerBuilder(SemiAutoPistolBuilder);
registerBuilder(CompactPistolBuilder);
registerBuilder(DerringerBuilder);
registerBuilder(M1911Builder);
registerBuilder(RifleBuilder);
registerBuilder(BoltActionRifleBuilder);
registerBuilder(LeverActionRifleBuilder);
registerBuilder(HuntingRifleBuilder);
registerBuilder(Rifle22Builder);
registerBuilder(ShotgunBuilder);
registerBuilder(PumpShotgunBuilder);
registerBuilder(SawnOffShotgunBuilder);
registerBuilder(DoubleBarrelBuilder);
registerBuilder(CoachGunBuilder);
registerBuilder(SmgBuilder);
registerBuilder(MachinePistolBuilder);
registerBuilder(UziBuilder);
registerBuilder(Mac10Builder);
registerBuilder(Tec9Builder);
