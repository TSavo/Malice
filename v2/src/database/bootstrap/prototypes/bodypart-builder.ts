import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the BodyPart prototype
 * Base prototype for body parts that make up a body.
 * Inherits from Edible - severed body parts can be consumed (cannibalism).
 *
 * BodyParts:
 * - Are Edible (can be eaten when severed, provide calories based on mass)
 * - Are Decayable (decay when severed, becoming rotten meat)
 * - Have an owner (the player/agent whose body this is part of)
 * - Can contain items (hands hold things, stomach contains food)
 * - Can have child parts (arm -> forearm -> hand -> fingers)
 * - Can be damaged, have conditions
 * - Can be coverable (clothing), removable (severed), critical (death if destroyed)
 *
 * Decay:
 * - decayCondition: 'severed' - decay starts when severed from owner
 * - decayRate: 2% per tick (body parts decay faster than preserved food)
 * - Calories based on weight (meat ~2 kcal/gram)
 */
export class BodyPartBuilder {
  constructor(private manager: ObjectManager) {}

  async build(edibleId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: edibleId,
      properties: {
        name: 'BodyPart',
        description: 'A body part',
        owner: null, // ObjRef to the player/agent who owns this body
        parts: {}, // { partName: ObjId } - child body parts
        bones: [], // string[] - bones in this part (for damage)
        coverable: false, // Can wear clothing on this part
        removable: false, // Can be severed/detached
        critical: false, // Death if destroyed
        condition: {}, // { conditionName: severity } - injuries/status
        // Decay overrides - body parts decay when severed
        decayCondition: 'severed', // Only decay when severed
        decayRate: 2, // Faster decay than preserved food (2% per tick)
        // Edible overrides - meat is ~2 kcal/gram, set by weight
        // calories will be calculated from weight in getCaloriesPerPortion override
        portions: 4, // A body part is multiple portions
      },
      methods: {},
    });

    obj.setMethod('canContain', `
      /** Check if this body part can contain items.
       *  Override in specific parts (e.g., Hand has limited capacity).
       *  @returns true if can contain
       */
      // By default, body parts can contain things
      // Override in specific parts (e.g., Hand has limited capacity)
      return true;
    `);

    obj.setMethod('getOwner', `
      /** Get the player/agent who owns this body part.
       *  @returns The owner RuntimeObject or null
       */
      if (self.owner) {
        return await $.load(self.owner);
      }
      return null;
    `);

    obj.setMethod('setOwner', `
      /** Set owner recursively for all child parts.
       *  @param ownerId - Owner ID or RuntimeObject
       */
      const ownerId = args[0];
      self.owner = typeof ownerId === 'number' ? ownerId : ownerId?.id;

      // Set owner on all child parts
      const parts = self.parts || {};
      for (const partName of Object.keys(parts)) {
        const partId = parts[partName];
        if (partId) {
          const part = await $.load(partId);
          if (part && part.setOwner) {
            await part.setOwner(self.owner);
          }
        }
      }
    `);

    obj.setMethod('findPart', `
      /** Find a part by name (recursive search).
       *  @param name - Part name to find
       *  @returns The found part or null
       */
      const name = args[0]?.toLowerCase();
      if (!name) return null;

      // Check if this part matches
      if (self.name?.toLowerCase() === name) return self;

      // Check aliases
      const aliases = self.aliases || [];
      for (const alias of aliases) {
        if (alias?.toLowerCase() === name) return self;
      }

      // Search child parts
      const parts = self.parts || {};
      for (const partName of Object.keys(parts)) {
        const partId = parts[partName];
        if (partId) {
          const part = await $.load(partId);
          if (part && part.findPart) {
            const found = await part.findPart(name);
            if (found) return found;
          }
        }
      }

      return null;
    `);

    obj.setMethod('randomPart', `
      /** Get a random part (for random targeting).
       *  @returns Random child part or self
       */
      const parts = self.parts || {};
      const partNames = Object.keys(parts);
      if (partNames.length === 0) return self;

      const randomName = partNames[Math.floor(Math.random() * partNames.length)];
      const partId = parts[randomName];
      if (partId) {
        const part = await $.load(partId);
        if (part && part.randomPart) {
          return await part.randomPart();
        }
      }
      return self;
    `);

    obj.setMethod('resolveAllContents', `
      /** Get all contents recursively (this part + all child parts).
       *  @returns Array of all object IDs
       */
      let allContents = [...(self.contents || [])];

      const parts = self.parts || {};
      for (const partName of Object.keys(parts)) {
        const partId = parts[partName];
        if (partId) {
          const part = await $.load(partId);
          if (part && part.resolveAllContents) {
            const partContents = await part.resolveAllContents();
            allContents = allContents.concat(partContents);
          }
        }
      }

      return allContents;
    `);

    obj.setMethod('coverageMap', `
      /** Build a map of all coverable parts (for clothing).
       *  @param map - Accumulator map (optional)
       *  @returns Map of partName -> part
       */
      const map = args[0] || {};

      if (self.coverable) {
        map[self.name] = self;
      }

      const parts = self.parts || {};
      for (const partName of Object.keys(parts)) {
        const partId = parts[partName];
        if (partId) {
          const part = await $.load(partId);
          if (part && part.coverageMap) {
            await part.coverageMap(map);
          }
        }
      }

      return map;
    `);

    obj.setMethod('canFeel', `
      /** Check if this part can feel (tactile sense).
       *  @returns true if can feel (not numb, destroyed, or severed)
       */
      // Most body parts can feel by default
      const condition = self.condition || {};
      // Can't feel if numb, destroyed, or severed
      if (condition.numb || condition.destroyed || condition.severed) {
        return false;
      }
      return true;
    `);

    obj.setMethod('feel', `
      /** Process tactile input (touch, pain, temperature).
       *  Reports sensation to owner.
       *  @param sensation - Object with type, intensity, source
       *  @returns Sensation report or null
       */
      const sensation = args[0]; // { type: 'pain'|'touch'|'temperature', intensity, source }

      // Check if we can feel
      if (!await self.canFeel()) {
        return null; // Numb/severed - no sensation
      }

      // Create sensation report for owner
      const report = {
        part: self.id,
        partName: self.name,
        ...sensation,
      };

      // Report to owner
      const owner = await self.getOwner();
      if (owner && owner.onSensation) {
        await owner.onSensation(report);
      }

      return report;
    `);

    obj.setMethod('takeDamage', `
      /** Receive and process damage to this body part.
       *  @param damage - Object with type, force (0-100), breakChance, bleedChance
       *  @param attacker - Who/what caused the damage
       *  @returns Object with part, type, bleeding, bonesBroken, description
       */
      const damage = args[0];
      const attacker = args[1];

      const condition = self.condition || {};
      const damageType = damage.type || 'wound';
      const force = damage.force || 0; // 0-100, how much impact force
      const breakChance = damage.breakChance || 0; // 0-1, base chance to break bone
      const bleedChance = damage.bleedChance || 0; // 0-1, base chance to bleed

      // wounds: { [type]: [] of { bleeding, healed } }
      // brokenBones: [] of { bone, set, healed }
      const wounds = condition.wounds || {};
      const existingDamage = Object.values(wounds).flat().length;

      // Determine if this wound bleeds
      // More damaged = higher chance to bleed (each existing wound adds 0.1 to chance)
      let bleeding = false;
      if (bleedChance > 0) {
        const damageBonus = existingDamage * 0.1;
        const finalBleedChance = Math.min(1, bleedChance + damageBonus);
        bleeding = Math.random() < finalBleedChance;
      }

      const typeWounds = wounds[damageType] || [];
      typeWounds.push({ bleeding, healed: false });
      wounds[damageType] = typeWounds;
      condition.wounds = wounds;

      let resultDesc = damage.description || (self.name + ' receives a ' + damageType + '.');
      let bonesBroken = [];

      // Check for bone breaks if this part has bones
      if (self.bones && self.bones.length > 0 && breakChance > 0) {
        const brokenBones = condition.brokenBones || [];

        // Force threshold: need sufficient force OR weakened by prior damage
        const forceThreshold = 50; // Base threshold
        const weakenedThreshold = forceThreshold - (existingDamage * 10); // Each wound lowers threshold by 10
        const effectiveThreshold = Math.max(10, weakenedThreshold); // Minimum threshold of 10

        if (force >= effectiveThreshold) {
          // Roll for each bone based on breakChance
          for (const bone of self.bones) {
            // Skip already broken bones
            if (brokenBones.some(b => b.bone === bone && !b.healed)) continue;

            // Higher force = higher chance, scaled by breakChance
            const forceBonus = (force - effectiveThreshold) / 100;
            const finalChance = breakChance + forceBonus;

            if (Math.random() < finalChance) {
              brokenBones.push({ bone, set: false, healed: false });
              bonesBroken.push(bone);
            }
          }
          condition.brokenBones = brokenBones;
        }
      }

      self.condition = condition;

      // Generate pain sensation
      const painIntensity = 5 + (bonesBroken.length * 5);
      await self.feel({
        type: 'pain',
        intensity: painIntensity,
        damageType: damageType,
        source: attacker?.id,
      });

      // Build result description
      if (bleeding) {
        resultDesc += ' It bleeds profusely.';
      }
      if (bonesBroken.length > 0) {
        resultDesc += ' The ' + bonesBroken.join(' and ') + ' breaks with a sickening crack!';
      }

      return {
        part: self.name,
        type: damageType,
        bleeding,
        bonesBroken,
        description: resultDesc,
      };
    `);

    obj.setMethod('heal', `
      /** Heal a wound by type, or heal a set bone.
       *  @param healType - Wound type to heal, or 'bone' for bones
       *  @returns Object with part, type, healed item
       */
      const healType = args[0];
      const condition = self.condition || {};

      let healed = null;

      if (healType === 'bone') {
        const bones = condition.brokenBones || [];
        const idx = bones.findIndex(b => b.set && !b.healed);
        if (idx >= 0) {
          bones[idx].healed = true;
          healed = bones[idx];
        }
        condition.brokenBones = bones.filter(b => !b.healed);
      } else if (healType) {
        // Heal a specific wound type
        const wounds = condition.wounds || {};
        const typeWounds = wounds[healType] || [];
        const idx = typeWounds.findIndex(w => !w.healed);
        if (idx >= 0) {
          typeWounds[idx].bleeding = false;
          typeWounds[idx].healed = true;
          healed = typeWounds[idx];
        }
        wounds[healType] = typeWounds.filter(w => !w.healed);
        if (wounds[healType].length === 0) {
          delete wounds[healType];
        }
        condition.wounds = wounds;
      }

      self.condition = condition;

      return {
        part: self.name,
        type: healType,
        healed: healed,
      };
    `);

    obj.setMethod('setBone', `
      /** Set a broken bone (required before healing).
       *  @param boneName - Optional specific bone to set
       *  @returns Object with success, bone, message
       */
      const boneName = args[0]; // optional - specific bone to set
      const condition = self.condition || {};
      const bones = condition.brokenBones || [];

      // Find unset bone to set
      let idx = -1;
      if (boneName) {
        idx = bones.findIndex(b => b.bone === boneName && !b.set);
      } else {
        idx = bones.findIndex(b => !b.set);
      }

      if (idx >= 0) {
        bones[idx].set = true;
        condition.brokenBones = bones;
        self.condition = condition;
        return {
          success: true,
          bone: bones[idx].bone,
          message: 'The ' + bones[idx].bone + ' has been set.',
        };
      }

      return { success: false, message: 'No broken bone to set.' };
    `);

    obj.setMethod('stopBleeding', `
      /** Stop all bleeding wounds on this part.
       *  @returns Object with stopped count and message
       */
      const condition = self.condition || {};
      const wounds = condition.wounds || {};
      let stopped = 0;

      for (const type of Object.keys(wounds)) {
        for (const wound of wounds[type]) {
          if (wound.bleeding) {
            wound.bleeding = false;
            stopped++;
          }
        }
      }

      condition.wounds = wounds;
      self.condition = condition;

      return {
        stopped,
        message: stopped > 0 ? 'The bleeding has been stopped.' : 'No bleeding to stop.',
      };
    `);

    obj.setMethod('isEmpty', `
      /** Check if this part is empty (no contents).
       *  @returns true if empty
       */
      return (self.contents || []).length === 0;
    `);

    obj.setMethod('addPart', `
      /** Add a child part to this body part.
       *  @param partName - Slot name for the part
       *  @param partId - ID or RuntimeObject of the part
       */
      const partName = args[0];
      const partId = args[1];
      const parts = self.parts || {};
      parts[partName] = typeof partId === 'number' ? partId : partId?.id;
      self.parts = parts;

      // Set owner on the new part
      if (self.owner) {
        const part = await $.load(parts[partName]);
        if (part && part.setOwner) {
          await part.setOwner(self.owner);
        }
      }
    `);

    obj.setMethod('getPart', `
      /** Get a specific child part by name.
       *  @param partName - Name of the part slot
       *  @returns The part RuntimeObject or null
       */
      const partName = args[0];
      const parts = self.parts || {};
      const partId = parts[partName];
      if (partId) {
        return await $.load(partId);
      }
      return null;
    `);

    obj.setMethod('removePart', `
      /** Remove a child part by name (internal, doesn't handle consequences).
       *  @param partName - Name of the part slot
       *  @returns The removed part ID or null
       */
      const partName = args[0];
      const parts = self.parts || {};
      const partId = parts[partName];
      if (partId) {
        delete parts[partName];
        self.parts = parts;
        return partId;
      }
      return null;
    `);

    obj.setMethod('amputate', `
      /** Amputate a child part - severs it from this body part.
       *  The severed part drops to the ground.
       *  @param partName - Name of the part to amputate
       *  @param amputator - Who/what is doing the amputation
       *  @returns Object with success, part, victim, amputator or error
       */
      const partName = args[0];
      const amputator = args[1]; // Who/what is doing the amputation

      const parts = self.parts || {};
      const partId = parts[partName];

      if (!partId) {
        return { error: 'No such part: ' + partName };
      }

      const part = await $.load(partId);
      if (!part) {
        return { error: 'Part not found.' };
      }

      // Check if part can be removed
      if (part.removable === false) {
        return { error: 'The ' + part.name + ' cannot be removed.' };
      }

      // Get owner and their location before we sever
      const owner = await self.getOwner();
      let dropLocation = null;
      if (owner && owner.location) {
        dropLocation = await $.load(owner.location);
      }

      // Remove from parent's parts list
      delete parts[partName];
      self.parts = parts;

      // Mark the severed part with condition
      const condition = part.condition || {};
      condition.severed = true;
      part.condition = condition;

      // Clear owner from severed part (and all its children)
      // The child parts stay attached - arm keeps its hand, fingers, etc.
      if (part.setOwner) {
        await part.setOwner(null);
      }

      // Drop the severed part to the ground (move to owner's location)
      if (dropLocation && dropLocation.addContent) {
        await dropLocation.addContent(part.id);
      }

      // === MULTI-PERSPECTIVE MESSAGING ===
      // Actor SEES: "You cut off Bob's left arm!"
      // Target SEES: "Alice cuts off your left arm!"
      // Others SEE: "Alice cuts off Bob's left arm!"
      // Everyone HEARS: *SCHLICK* The wet sound of flesh separating.
      // Target FEELS: Intense pain

      const partDesc = part.name.toLowerCase();

      if (dropLocation) {
        await $.room.announce({
          room: dropLocation,
          actor: amputator,
          target: owner,
          see: '%A %v{cut} off %tp ' + partDesc + '! It falls to the ground.',
          hear: '*SCHLICK* The wet sound of flesh separating.',
          item: part,
        });
      }

      // Generate pain in the remaining stump - victim FEELS this via bodyPart.feel()
      await self.feel({
        type: 'pain',
        intensity: 10,
        damageType: 'amputation',
        source: amputator?.id,
        partName: partDesc,
      });

      // If the severed part was critical, trigger critical damage
      if (part.critical) {
        if (owner && owner.onCriticalDamage) {
          await owner.onCriticalDamage(part);
        }
      }

      return {
        success: true,
        part: part,
        victim: owner,
        amputator: amputator,
      };
    `);

    obj.setMethod('reattach', `
      /** Reattach a previously severed part.
       *  @param part - The part RuntimeObject to reattach
       *  @param partName - The slot name (e.g., 'leftArm')
       *  @returns Object with part, message or error
       */
      const part = args[0]; // The part object to reattach
      const partName = args[1]; // The slot name (e.g., 'leftArm')

      if (!part) {
        return { error: 'No part to reattach.' };
      }

      // Check if part is actually severed
      const condition = part.condition || {};
      if (!condition.severed) {
        return { error: 'That part is not severed.' };
      }

      // Check if slot is available
      const parts = self.parts || {};
      if (parts[partName]) {
        return { error: 'There is already a part attached there.' };
      }

      // Attach the part
      parts[partName] = part.id;
      self.parts = parts;

      // Clear severed condition
      delete condition.severed;
      part.condition = condition;

      // Set owner to match parent's owner
      if (self.owner && part.setOwner) {
        await part.setOwner(self.owner);
      }

      return {
        part: part,
        message: 'The ' + part.name + ' has been reattached.',
      };
    `);

    obj.setMethod('onContentArrived', `
      /** Called when something arrives in this body part.
       *  Registers verbs on the owner.
       *  @param obj - The arriving object
       *  @param source - Where it came from
       *  @param mover - Who moved it
       */
      const obj = args[0];
      const source = args[1];
      const mover = args[2];

      // If this body part has an owner and the arriving object has verbs to register
      const owner = await self.getOwner();
      if (owner && owner.registerVerb && obj.getVerbsToRegister) {
        const verbs = await obj.getVerbsToRegister();
        for (const verbInfo of verbs) {
          await owner.registerVerb(verbInfo.patterns, obj, verbInfo.method);
        }
      }
    `);

    // When something leaves this body part
    // Unregister verbs from the owner
    obj.setMethod('onContentLeft', `
      const obj = args[0];
      const dest = args[1];
      const mover = args[2];

      // Unregister any verbs this object had registered
      const owner = await self.getOwner();
      if (owner && owner.unregisterVerbsFrom) {
        await owner.unregisterVerbsFrom(obj.id);
      }
    `);

    // Describe this body part with damage
    // Uses $.pronoun for "Her head", $.proportional for wound count descriptions
    // Output example: "Her head is covered in severe bruises, has a few minor cuts, and is missing an eye."
    obj.setMethod('describe', `
      const viewer = args[0]; // Who is looking (for pronouns)
      const condition = self.condition || {};
      const owner = self.owner ? await $.load(self.owner) : null;

      // Get possessive pronoun for owner ("Her head", "His arm", "Your leg")
      let partName = self.name;
      if (owner) {
        partName = await $.pronoun.sub('%p ' + self.name.toLowerCase(), owner, viewer);
      }

      const phrases = [];

      // Count wounds by type (type includes severity, e.g. "severe bruise", "minor cut")
      const wounds = condition.wounds || {};
      const woundTypes = Object.keys(wounds);
      let hasBleeding = false;

      for (const type of woundTypes) {
        const typeWounds = wounds[type].filter(w => !w.healed);
        if (typeWounds.length === 0) continue;

        // Check for bleeding
        if (typeWounds.some(w => w.bleeding)) {
          hasBleeding = true;
        }

        // Use proportional for count description
        // 1 = "has a", 2-3 = "has a few", 4-6 = "has several", 7+ = "is covered in"
        const count = typeWounds.length;
        const plural = count > 1 ? 's' : '';
        const countPhrase = await $.proportional.sub(
          ['has a ' + type, 'has a few ' + type + 's', 'has several ' + type + 's', 'is covered in ' + type + 's'],
          count,
          7
        );
        phrases.push(countPhrase);
      }

      // Bleeding as a phrase
      if (hasBleeding) {
        phrases.push('is bleeding');
      }

      // Broken bones
      const brokenBones = (condition.brokenBones || []).filter(b => !b.healed);
      if (brokenBones.length > 0) {
        const unset = brokenBones.filter(b => !b.set);
        const set = brokenBones.filter(b => b.set);
        if (unset.length > 0) {
          phrases.push('has a broken ' + unset.map(b => b.bone).join(' and '));
        }
        if (set.length > 0) {
          phrases.push('has a splinted ' + set.map(b => b.bone).join(' and '));
        }
      }

      // Severed
      if (condition.severed) {
        phrases.push('has been severed');
      }

      // Missing parts (check for expected parts that are gone)
      const missingParts = condition.missingParts || [];
      for (const missing of missingParts) {
        phrases.push('is missing ' + missing);
      }

      // Build final description
      if (phrases.length === 0) {
        return partName + ' looks healthy.';
      }

      // Join phrases naturally using $.english.list: "X, Y, and Z"
      const joined = await $.english.list(phrases);
      let desc = partName + ' ' + joined + '.';

      // Add contents if any
      const contents = self.contents || [];
      if (contents.length > 0) {
        const items = [];
        for (const itemId of contents) {
          const item = await $.load(itemId);
          if (item) {
            items.push(item.name || 'something');
          }
        }
        if (items.length > 0) {
          desc += ' Holding ' + items.join(', ') + '.';
        }
      }

      return desc;
    `);

    // Override getCaloriesPerPortion - body parts calculate calories from weight
    // Meat is approximately 2 kcal/gram (accounting for bones, non-edible parts)
    obj.setMethod('getCaloriesPerPortion', `
      /** Calculate calories per portion based on body part weight.
       *  Uses meat calorie density (~2 kcal/g) adjusted for decay.
       *  Body parts are only edible when severed.
       *  @returns Calories (adjusted for decay, can be negative if rotten)
       */
      const condition = self.condition || {};
      if (!condition.severed) {
        return 0; // Can't eat an attached body part
      }

      // Calculate base calories from weight (meat ~2 kcal/gram)
      const weight = self.weight || 500; // Default 500g
      const totalCal = weight * 2; // 2 kcal per gram
      const totalPortions = self.portions || 4;
      const baseCal = Math.ceil(totalCal / totalPortions);

      // Apply decay penalty (inherited from Edible logic)
      const decayLevel = self.decayLevel || 0;
      const decayMultiplier = 1 - (decayLevel / 50);
      return Math.round(baseCal * decayMultiplier);
    `);

    // Override shouldDecay - only decay when severed from owner
    obj.setMethod('shouldDecay', `
      /** Body parts only decay when severed.
       *  Attached body parts don't decay (maintained by living body).
       */
      const condition = self.condition || {};
      return condition.severed === true || self.owner === null || self.owner === 0;
    `);

    return obj;
  }
}
