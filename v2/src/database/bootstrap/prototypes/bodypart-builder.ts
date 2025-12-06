import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the BodyPart prototype
 * Base prototype for body parts that make up a body
 *
 * BodyParts:
 * - Are Describable (have name, description, can be looked at)
 * - Have an owner (the player/agent whose body this is part of)
 * - Can contain items (hands hold things, stomach contains food)
 * - Can have child parts (arm -> forearm -> hand -> fingers)
 * - Can be damaged, have conditions
 * - Can be coverable (clothing), removable (severed), critical (death if destroyed)
 */
export class BodyPartBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
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
      },
      methods: {},
    });

    // Override canContain - body parts can hold things
    obj.setMethod('canContain', `
      // By default, body parts can contain things
      // Override in specific parts (e.g., Hand has limited capacity)
      return true;
    `);

    // Get the player/agent who owns this body part
    obj.setMethod('getOwner', `
      if (self.owner) {
        return await $.load(self.owner);
      }
      return null;
    `);

    // Set owner recursively for all child parts
    obj.setMethod('setOwner', `
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

    // Find a part by name (recursive)
    obj.setMethod('findPart', `
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

    // Get a random part (for random targeting)
    obj.setMethod('randomPart', `
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

    // Get all contents recursively (this part + all child parts)
    obj.setMethod('resolveAllContents', `
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

    // Build a map of all coverable parts (for clothing)
    obj.setMethod('coverageMap', `
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

    // Check if this part can feel (tactile sense)
    obj.setMethod('canFeel', `
      // Most body parts can feel by default
      const condition = self.condition || {};
      // Can't feel if numb, destroyed, or severed
      if (condition.numb || condition.destroyed || condition.severed) {
        return false;
      }
      return true;
    `);

    // DELEGATION: feel() - process tactile input (touch, pain, temperature)
    // Every body part can feel, and reports to owner
    obj.setMethod('feel', `
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

    // DAMAGE: takeDamage() - receive and process damage
    // Body parts can take damage, which may cause conditions and pain
    obj.setMethod('takeDamage', `
      const damage = args[0]; // { type: 'blunt'|'slash'|'pierce'|'burn'|etc., amount, source }
      const attacker = args[1];

      const condition = self.condition || {};

      // Already destroyed - no further damage
      if (condition.destroyed) {
        return { absorbed: true, message: 'The ' + self.name + ' is already destroyed.' };
      }

      // Apply damage based on type
      const damageType = damage.type || 'blunt';
      const damageAmount = damage.amount || 1;

      // Track health/damage (simple model)
      const currentDamage = condition.damage || 0;
      const newDamage = currentDamage + damageAmount;
      condition.damage = newDamage;

      // Determine severity and add conditions
      let severity = 'minor';
      if (newDamage >= 10) {
        severity = 'destroyed';
        condition.destroyed = true;
      } else if (newDamage >= 7) {
        severity = 'critical';
        condition.critical = true;
      } else if (newDamage >= 4) {
        severity = 'wounded';
        condition.wounded = true;
      } else if (newDamage >= 2) {
        severity = 'bruised';
        condition.bruised = true;
      }

      self.condition = condition;

      // Generate pain sensation
      await self.feel({
        type: 'pain',
        intensity: damageAmount,
        damageType: damageType,
        source: attacker?.id,
      });

      // Check for critical damage (death)
      if (condition.destroyed && self.critical) {
        const owner = await self.getOwner();
        if (owner && owner.onCriticalDamage) {
          await owner.onCriticalDamage(self);
        }
      }

      return {
        part: self.name,
        severity: severity,
        totalDamage: newDamage,
        conditions: Object.keys(condition).filter(k => condition[k] === true),
      };
    `);

    // Heal damage/conditions
    obj.setMethod('heal', `
      const amount = args[0] || 1;
      const condition = self.condition || {};

      const currentDamage = condition.damage || 0;
      const newDamage = Math.max(0, currentDamage - amount);
      condition.damage = newDamage;

      // Clear conditions based on healing
      if (newDamage < 2) {
        delete condition.bruised;
      }
      if (newDamage < 4) {
        delete condition.wounded;
      }
      if (newDamage < 7) {
        delete condition.critical;
      }
      // Note: destroyed parts don't heal without special treatment

      self.condition = condition;

      return {
        part: self.name,
        healed: amount,
        remaining: newDamage,
      };
    `);

    // Is this part empty (no contents)
    obj.setMethod('isEmpty', `
      return (self.contents || []).length === 0;
    `);

    // Add a child part
    obj.setMethod('addPart', `
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

    // Get a specific child part by name
    obj.setMethod('getPart', `
      const partName = args[0];
      const parts = self.parts || {};
      const partId = parts[partName];
      if (partId) {
        return await $.load(partId);
      }
      return null;
    `);

    // Remove a child part by name (internal, doesn't handle consequences)
    obj.setMethod('removePart', `
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

    // Amputate a child part - severs it from this body part
    // The severed part (with all its sub-parts) drops to the ground
    // Uses player.tell(), player.hear(), bodyPart.feel() for multi-perspective messaging
    // Everyone SEEs (tell) the amputation, HEARs the sound, victim FEELs the pain
    obj.setMethod('amputate', `
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

    // Reattach a previously severed part
    obj.setMethod('reattach', `
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

    // When something arrives in this body part (e.g., item placed in hand)
    // Register verbs on the owner
    obj.setMethod('onContentArrived', `
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

    // Describe this body part
    obj.setMethod('describe', `
      let desc = self.name;

      // Add condition descriptions
      const condition = self.condition || {};
      const conditions = Object.keys(condition);
      if (conditions.length > 0) {
        desc += ' (' + conditions.join(', ') + ')';
      }

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
          desc += ' holding ' + items.join(', ');
        }
      }

      return desc;
    `);

    return obj;
  }
}
