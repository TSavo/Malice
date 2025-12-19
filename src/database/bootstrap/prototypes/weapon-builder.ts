import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Weapon prototype
 * 
 * Base prototype for all weapons. Weapons have:
 * - skill: The skill name used when fighting with this weapon (e.g., "knife", "pistol", "katana")
 * - damage: Base damage modifier (added to combat damage rolls)
 * - damageType: Default damage type inflicted (cut, bruise, puncture, etc.)
 * - twoHanded: Whether the weapon requires two hands for effective use
 * 
 * Two-Handed Weapons:
 * All weapons can be HELD with one hand, but twoHanded weapons require a free
 * second hand to use effectively. Using a two-handed weapon one-handed results in:
 * - Severe accuracy/skill penalty
 * - Risk of injury to the wielder (recoil, loss of control)
 * - Reduced damage effectiveness
 * 
 * The $.combat system checks twoHanded and caller.getHands() to determine penalties.
 * 
 * The skill system is use-to-advance: every time you make a skill check in combat,
 * you gain XP in that skill. So the weapon's .skill property is critical - it determines
 * what skill improves when you fight with this weapon.
 * 
 * Examples:
 * - Combat knife: skill="knife", damage=15, damageType="cut", twoHanded=false
 * - Baseball bat: skill="club", damage=20, damageType="bruise", twoHanded=false
 * - Katana: skill="katana", damage=30, damageType="cut", twoHanded=true
 * - Pistol: skill="pistol", damage=40, damageType="puncture", twoHanded=false
 * - Rifle: skill="rifle", damage=55, damageType="puncture", twoHanded=true
 * - Sledgehammer: skill="hammer", damage=45, damageType="bruise", twoHanded=true
 */
export class WeaponBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parentId,
      properties: {
        name: 'Weapon',
        description: 'Base prototype for weapons',
        
        // The skill used when fighting with this weapon
        // This is what gets checked and gains XP in combat
        skill: 'improvised',
        
        // Base damage modifier (0-100 scale, added to severity)
        // 0 = bare hands equivalent
        // 10-20 = small weapons (pocket knife, brass knuckles)
        // 20-35 = medium weapons (combat knife, baton, machete)
        // 35-50 = large weapons (sword, baseball bat, axe)
        // 40-60 = firearms
        // 60+ = heavy weapons
        damage: 0,
        
        // Default damage type this weapon inflicts
        // cut, bruise, puncture, laceration, burn
        damageType: 'bruise',
        
        // Whether this weapon requires two hands for effective use
        // All weapons can be HELD one-handed, but twoHanded weapons
        // impose severe penalties when used without a free second hand:
        // - Accuracy/skill penalty
        // - Risk of self-injury (recoil, loss of control)
        // - Reduced damage
        twoHanded: false,
        
        // Whether this is a ranged weapon
        ranged: false,
        
        // For ranged weapons: effective range in meters
        range: 0,
        
        // For ranged weapons: current ammo count
        ammo: 0,
        
        // For ranged weapons: max ammo capacity
        maxAmmo: 0,
        
        // Ammo type required (for reloading)
        ammoType: null,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // COMBAT INTERFACE
    // ═══════════════════════════════════════════════════════════════════

    // getSkill() - returns the skill name for combat checks
    obj.setMethod('getSkill', `
      return self.skill || 'improvised';
    `);

    // getDamage() - returns base damage modifier
    obj.setMethod('getDamage', `
      return self.damage || 0;
    `);

    // getDamageType() - returns the type of damage this weapon deals
    obj.setMethod('getDamageType', `
      return self.damageType || 'bruise';
    `);

    // isTwoHanded() - returns whether this weapon requires two hands for effective use
    obj.setMethod('isTwoHanded', `
      return self.twoHanded || false;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // RANGED WEAPON METHODS
    // ═══════════════════════════════════════════════════════════════════

    // canFire() - check if ranged weapon can fire
    obj.setMethod('canFire', `
      if (!self.ranged) {
        return { success: false, reason: 'This is not a ranged weapon.' };
      }
      if ((self.ammo || 0) <= 0) {
        return { success: false, reason: 'Out of ammo.' };
      }
      return { success: true };
    `);

    // fire() - expend one round of ammo
    obj.setMethod('fire', `
      const canFire = await self.canFire();
      if (!canFire.success) {
        return canFire;
      }
      
      self.ammo = (self.ammo || 0) - 1;
      return { success: true, ammoRemaining: self.ammo };
    `);

    // reload(ammoSource) - reload from an ammo source
    obj.setMethod('reload', `
      const ammoSource = args[0];
      
      if (!self.ranged) {
        return { success: false, reason: 'This is not a ranged weapon.' };
      }
      
      if (!ammoSource) {
        return { success: false, reason: 'Reload with what?' };
      }
      
      // Check ammo type compatibility
      if (self.ammoType && ammoSource.ammoType !== self.ammoType) {
        return { success: false, reason: 'Wrong ammunition type.' };
      }
      
      const maxAmmo = self.maxAmmo || 0;
      const currentAmmo = self.ammo || 0;
      const spaceAvailable = maxAmmo - currentAmmo;
      
      if (spaceAvailable <= 0) {
        return { success: false, reason: 'Already fully loaded.' };
      }
      
      // Take ammo from source
      const available = ammoSource.quantity || ammoSource.ammo || 0;
      const toLoad = Math.min(available, spaceAvailable);
      
      if (toLoad <= 0) {
        return { success: false, reason: 'Ammo source is empty.' };
      }
      
      self.ammo = currentAmmo + toLoad;
      
      // Reduce source ammo
      if (ammoSource.quantity !== undefined) {
        ammoSource.quantity -= toLoad;
      } else if (ammoSource.ammo !== undefined) {
        ammoSource.ammo -= toLoad;
      }
      
      return { success: true, loaded: toLoad, ammoRemaining: self.ammo };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('describe', `
      let desc = self.name + '\\r\\n' + self.description;
      
      if (self.ranged && self.maxAmmo > 0) {
        desc += '\\r\\n[' + (self.ammo || 0) + '/' + self.maxAmmo + ' rounds]';
      }
      
      return desc;
    `);

    return obj;
  }
}
