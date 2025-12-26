import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

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
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Weapon',
        description: 'Base prototype for weapons',

        // The skill used when fighting with this weapon
        skill: 'improvised',

        // Base damage modifier (0-100 scale)
        damage: 0,

        // Default damage type: cut, bruise, puncture, laceration, burn
        damageType: 'bruise',

        // Whether requires two hands for effective use
        twoHanded: false,

        // Whether this is a ranged weapon
        ranged: false,

        // Effective range in meters (ranged only)
        range: 0,

        // Current ammo count (ranged only)
        ammo: 0,

        // Max ammo capacity (ranged only)
        maxAmmo: 0,

        // Ammo type required for reloading
        ammoType: null,

        // Abilities - weapon physics for AI interpretation
        abilities: `Object that can be used to inflict damage in combat.

COMBAT TRACKING: When attacking someone, call $combat.start(attacker, defender) to set up exclusions. This prevents sleep, travel, etc. during the fight. Call $combat.log(combatId, message) to record events. Call $combat.end(combatId, reason, winner) when combat concludes.

WIELDING: Must be held in hand to use. Check 'twoHanded' - if true, effective use requires BOTH hands free. Using two-handed weapon one-handed imposes severe accuracy penalty and risk of self-injury.

STRIKING: Melee attack using this weapon. Damage based on 'damage' property + wielder strength + skill check. Create wounds on target body parts directly. Damage type from 'damageType' determines wound characteristics.

SKILL: The 'skill' property names what combat skill is used and gains XP. e.g., "knife", "club", "sword". Higher skill improves accuracy and damage.

DAMAGE SCALE:
- 0-10: Improvised (fist, bottle)
- 10-20: Small (pocket knife, brass knuckles)
- 20-35: Medium (combat knife, baton, machete)
- 35-50: Large (sword, baseball bat, axe)
- 40-60: Firearms
- 60+: Heavy weapons

CONDITION: Weapons can degrade with use. Broken weapons have reduced damage or may fail.`,
      },
      methods: {},
    });

    // Add property descriptions
    obj.setPropertyDescription(
      'skill',
      'Combat skill used and trained: improvised, knife, club, sword, etc.',
    );
    obj.setPropertyDescription(
      'damage',
      'Base damage modifier 0-100. Added to attack severity.',
    );
    obj.setPropertyDescription(
      'damageType',
      'Wound type inflicted: cut, bruise, puncture, laceration, burn.',
    );
    obj.setPropertyDescription(
      'twoHanded',
      'If true, requires both hands for effective use. One-handed use has penalties.',
    );
    obj.setPropertyDescription(
      'ranged',
      'If true, this is a ranged weapon (gun, bow).',
    );
    obj.setPropertyDescription(
      'range',
      'Effective range in meters for ranged weapons.',
    );
    obj.setPropertyDescription(
      'ammo',
      'Current ammunition count for ranged weapons.',
    );
    obj.setPropertyDescription(
      'maxAmmo',
      'Maximum ammo capacity for ranged weapons.',
    );
    obj.setPropertyDescription(
      'ammoType',
      "Required ammunition type for reloading (e.g., '9mm', '12gauge').",
    );

    // ═══════════════════════════════════════════════════════════════════
    // COMBAT INTERFACE
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'getSkill',
      `
      /** Get the combat skill name for this weapon.
       *  @returns Skill name (e.g., "knife", "pistol")
       */
      return self.skill || 'improvised';
    `,
    );

    obj.setMethod(
      'getDamage',
      `
      /** Get base damage modifier for this weapon.
       *  @returns Damage value 0-100
       */
      return self.damage || 0;
    `,
    );

    obj.setMethod(
      'getDamageType',
      `
      /** Get the type of damage this weapon inflicts.
       *  @returns Damage type: cut, bruise, puncture, laceration, burn
       */
      return self.damageType || 'bruise';
    `,
    );

    obj.setMethod(
      'isTwoHanded',
      `
      /** Check if this weapon requires two hands for effective use.
       *  @returns true if two-handed, false otherwise
       */
      return self.twoHanded || false;
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // RANGED WEAPON METHODS
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'canFire',
      `
      /** Check if this ranged weapon can fire.
       *  @returns { success: boolean, reason?: string }
       */
      if (!self.ranged) {
        return { success: false, reason: 'This is not a ranged weapon.' };
      }
      if ((self.ammo || 0) <= 0) {
        return { success: false, reason: 'Out of ammo.' };
      }
      return { success: true };
    `,
    );

    obj.setMethod(
      'fire',
      `
      /** Expend one round of ammo (infrastructure method).
       *  @returns { success: boolean, ammoRemaining?: number, reason?: string }
       */
      const canFire = await self.canFire();
      if (!canFire.success) {
        return canFire;
      }

      self.ammo = (self.ammo || 0) - 1;
      return { success: true, ammoRemaining: self.ammo };
    `,
    );

    obj.setMethod(
      'reload',
      `
      /** Reload from an ammo source (infrastructure method).
       *  @param ammoSource - Ammo object to load from
       *  @returns { success: boolean, loaded?: number, ammoRemaining?: number, reason?: string }
       */
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
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'describe',
      `
      let desc = self.name + '\\r\\n' + self.description;
      
      if (self.ranged && self.maxAmmo > 0) {
        desc += '\\r\\n[' + (self.ammo || 0) + '/' + self.maxAmmo + ' rounds]';
      }
      
      return desc;
    `,
    );

    return obj;
  }
}
