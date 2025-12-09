import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Wearable prototype
 * Base prototype for items that can be worn on body parts.
 * Inherits from Describable - wearables have name, description, aliases.
 *
 * Wearables:
 * - Cover specific body part slots (torso, head, hands, feet, etc.)
 * - Have layers for stacking (underwear < shirt < sweater < jacket)
 * - Provide warmth and/or protection
 * - Override the "naked" description of body parts they cover
 *
 * When worn, the wearable's description replaces the body part's
 * nakedDescription in the owner's visible appearance.
 *
 * Subprototypes: $.clothing, $.armor, $.jewelry
 */
export class WearableBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Wearable',
        description: 'Something that can be worn',
        // Which body part slots this covers
        // Common slots: head, face, neck, torso, back, waist,
        //               leftArm, rightArm, hands, leftLeg, rightLeg, feet
        covers: [],
        // Layer for stacking (lower = closer to skin)
        // 1=underwear, 2=base layer, 3=mid layer, 4=outer layer, 5=outerwear
        layer: 2,
        // Warmth provided (0-100, affects cold survival)
        warmth: 0,
        // Protection provided (0-100, damage reduction)
        protection: 0,
        // Currently worn on which body part (null if not worn)
        wornOn: null,
        // Currently worn by which player (null if not worn)
        wornBy: null,
        // Description shown when worn (replaces naked description)
        // If null, uses the item's name in a generic phrase
        wornDescription: null,
      },
      methods: {},
    });

    obj.setMethod('canWear', `
      /** Check if this item can be worn by the given wearer.
       *  @param wearer - The player trying to wear this
       *  @returns { success: boolean, error?: string }
       */
      const wearer = args[0];

      // Already worn by someone?
      if (self.wornBy !== null && self.wornBy !== wearer.id) {
        const currentWearer = await $.load(self.wornBy);
        return { success: false, error: 'That is already being worn by ' + (currentWearer?.name || 'someone') + '.' };
      }

      // Already wearing it?
      if (self.wornBy === wearer.id) {
        return { success: false, error: 'You are already wearing that.' };
      }

      // Check that wearer has the required body parts
      const covers = self.covers || [];
      if (covers.length === 0) {
        return { success: false, error: 'That cannot be worn.' };
      }

      const body = await wearer.getBody();
      if (!body) {
        return { success: false, error: 'You have no body to wear that on.' };
      }

      // Map cover slots to body part paths
      const slotToPart = {
        head: ['head'],
        face: ['head', 'face'],
        neck: ['head', 'neck'],
        torso: [],  // torso is the body itself
        back: [],   // back is on torso
        waist: [],  // waist is on torso
        leftArm: ['leftShoulder', 'arm'],
        rightArm: ['rightShoulder', 'arm'],
        leftHand: ['leftShoulder', 'arm', 'forearm', 'hand'],
        rightHand: ['rightShoulder', 'arm', 'forearm', 'hand'],
        hands: ['leftShoulder', 'arm', 'forearm', 'hand'], // Check one hand exists
        leftLeg: ['leftThigh', 'knee', 'leg'],
        rightLeg: ['rightThigh', 'knee', 'leg'],
        leftFoot: ['leftThigh', 'knee', 'leg', 'foot'],
        rightFoot: ['rightThigh', 'knee', 'leg', 'foot'],
        feet: ['leftThigh', 'knee', 'leg', 'foot'], // Check one foot exists
      };

      for (const slot of covers) {
        const path = slotToPart[slot];
        if (path === undefined) {
          continue; // Unknown slot, skip
        }

        // Navigate to the body part
        let part = body;
        for (const partName of path) {
          part = await part.getPart(partName);
          if (!part) {
            return { success: false, error: 'You are missing the body part needed to wear that.' };
          }
        }

        // Check if the part is coverable
        if (!part.coverable) {
          return { success: false, error: 'That body part cannot wear clothing.' };
        }
      }

      // Check layer conflicts - can't wear two items on same layer on same slot
      for (const slot of covers) {
        const wornItems = await self.getWornOnSlot(wearer, slot);
        for (const worn of wornItems) {
          if (worn.layer === self.layer) {
            return { success: false, error: 'You are already wearing something at that layer (' + worn.name + ').' };
          }
        }
      }

      return { success: true };
    `);

    obj.setMethod('getWornOnSlot', `
      /** Get items worn on a specific slot by a wearer.
       *  @param wearer - The player
       *  @param slot - The slot name (e.g., 'torso', 'head')
       *  @returns Array of worn items on that slot
       */
      const wearer = args[0];
      const slot = args[1];

      const body = await wearer.getBody();
      if (!body) return [];

      // Get the body part for this slot
      const slotToPart = {
        head: ['head'],
        face: ['head', 'face'],
        neck: ['head', 'neck'],
        torso: [],
        back: [],
        waist: [],
        leftArm: ['leftShoulder', 'arm'],
        rightArm: ['rightShoulder', 'arm'],
        leftHand: ['leftShoulder', 'arm', 'forearm', 'hand'],
        rightHand: ['rightShoulder', 'arm', 'forearm', 'hand'],
        hands: ['leftShoulder', 'arm', 'forearm', 'hand'],
        leftLeg: ['leftThigh', 'knee', 'leg'],
        rightLeg: ['rightThigh', 'knee', 'leg'],
        leftFoot: ['leftThigh', 'knee', 'leg', 'foot'],
        rightFoot: ['rightThigh', 'knee', 'leg', 'foot'],
        feet: ['leftThigh', 'knee', 'leg', 'foot'],
      };

      const path = slotToPart[slot];
      if (path === undefined) return [];

      let part = body;
      for (const partName of path) {
        part = await part.getPart(partName);
        if (!part) return [];
      }

      // Get worn items from this part
      const wornIds = part.worn || [];
      const worn = [];
      for (const id of wornIds) {
        const item = await $.load(id);
        if (item) {
          worn.push(item);
        }
      }

      return worn;
    `);

    obj.setMethod('wear', `
      /** Wear this item.
       *  @param wearer - The player wearing this
       *  @returns { success: boolean, message: string }
       */
      const wearer = args[0];

      // First check if we can wear it
      const canWearResult = await self.canWear(wearer);
      if (!canWearResult.success) {
        return canWearResult;
      }

      const body = await wearer.getBody();
      const covers = self.covers || [];

      // Map cover slots to body part paths
      const slotToPart = {
        head: ['head'],
        face: ['head', 'face'],
        neck: ['head', 'neck'],
        torso: [],
        back: [],
        waist: [],
        leftArm: ['leftShoulder', 'arm'],
        rightArm: ['rightShoulder', 'arm'],
        leftHand: ['leftShoulder', 'arm', 'forearm', 'hand'],
        rightHand: ['rightShoulder', 'arm', 'forearm', 'hand'],
        hands: ['leftShoulder', 'arm', 'forearm', 'hand'],
        leftLeg: ['leftThigh', 'knee', 'leg'],
        rightLeg: ['rightThigh', 'knee', 'leg'],
        leftFoot: ['leftThigh', 'knee', 'leg', 'foot'],
        rightFoot: ['rightThigh', 'knee', 'leg', 'foot'],
        feet: ['leftThigh', 'knee', 'leg', 'foot'],
      };

      // Add to worn array on each covered body part
      for (const slot of covers) {
        const path = slotToPart[slot];
        if (path === undefined) continue;

        let part = body;
        for (const partName of path) {
          part = await part.getPart(partName);
          if (!part) break;
        }

        if (part) {
          const worn = part.worn || [];
          if (!worn.includes(self.id)) {
            worn.push(self.id);
            part.worn = worn;
          }
        }
      }

      // Update wearable state
      self.wornBy = wearer.id;
      self.wornOn = body.id;

      // Remove from hands/ground if held
      if (self.location) {
        const loc = await $.load(self.location);
        if (loc && loc.removeContent) {
          await loc.removeContent(self.id);
        }
      }

      // Move to wearer's worn container (or just update location)
      self.location = wearer.id;

      return { success: true, message: 'You put on ' + self.name + '.' };
    `);

    obj.setMethod('remove', `
      /** Remove this item (take it off).
       *  @param wearer - The player removing this (optional, defaults to wornBy)
       *  @returns { success: boolean, message: string }
       */
      const wearer = args[0] || (self.wornBy ? await $.load(self.wornBy) : null);

      if (!self.wornBy) {
        return { success: false, error: 'That is not being worn.' };
      }

      if (wearer && self.wornBy !== wearer.id) {
        return { success: false, error: 'You are not wearing that.' };
      }

      const actualWearer = await $.load(self.wornBy);
      if (!actualWearer) {
        // Orphaned - just clear state
        self.wornBy = null;
        self.wornOn = null;
        return { success: true, message: 'Removed ' + self.name + '.' };
      }

      const body = await actualWearer.getBody();
      const covers = self.covers || [];

      // Map cover slots to body part paths
      const slotToPart = {
        head: ['head'],
        face: ['head', 'face'],
        neck: ['head', 'neck'],
        torso: [],
        back: [],
        waist: [],
        leftArm: ['leftShoulder', 'arm'],
        rightArm: ['rightShoulder', 'arm'],
        leftHand: ['leftShoulder', 'arm', 'forearm', 'hand'],
        rightHand: ['rightShoulder', 'arm', 'forearm', 'hand'],
        hands: ['leftShoulder', 'arm', 'forearm', 'hand'],
        leftLeg: ['leftThigh', 'knee', 'leg'],
        rightLeg: ['rightThigh', 'knee', 'leg'],
        leftFoot: ['leftThigh', 'knee', 'leg', 'foot'],
        rightFoot: ['rightThigh', 'knee', 'leg', 'foot'],
        feet: ['leftThigh', 'knee', 'leg', 'foot'],
      };

      // Remove from worn array on each covered body part
      if (body) {
        for (const slot of covers) {
          const path = slotToPart[slot];
          if (path === undefined) continue;

          let part = body;
          for (const partName of path) {
            part = await part.getPart(partName);
            if (!part) break;
          }

          if (part) {
            const worn = part.worn || [];
            const idx = worn.indexOf(self.id);
            if (idx !== -1) {
              worn.splice(idx, 1);
              part.worn = worn;
            }
          }
        }
      }

      // Clear wearable state
      self.wornBy = null;
      self.wornOn = null;

      return { success: true, message: 'You take off ' + self.name + '.' };
    `);

    obj.setMethod('getWornDescription', `
      /** Get the description shown when this is worn.
       *  @returns Description string
       */
      if (self.wornDescription) {
        return self.wornDescription;
      }
      // Default: just the item name
      return self.name;
    `);

    obj.setMethod('describe', `
      /** Get full description of this wearable.
       *  @returns Description string
       */
      let desc = self.name + '\\r\\n';

      if (self.description) {
        desc += self.description + '\\r\\n';
      }

      // Show what it covers
      const covers = self.covers || [];
      if (covers.length > 0) {
        desc += 'Covers: ' + covers.join(', ') + '\\r\\n';
      }

      // Show layer
      const layerNames = ['', 'underwear', 'base layer', 'mid layer', 'outer layer', 'outerwear'];
      const layerName = layerNames[self.layer] || 'layer ' + self.layer;
      desc += 'Layer: ' + layerName + '\\r\\n';

      // Show warmth if any
      if (self.warmth > 0) {
        desc += 'Warmth: ' + self.warmth + '\\r\\n';
      }

      // Show protection if any
      if (self.protection > 0) {
        desc += 'Protection: ' + self.protection + '\\r\\n';
      }

      // Show if worn
      if (self.wornBy) {
        const wearer = await $.load(self.wornBy);
        if (wearer) {
          desc += 'Currently worn by: ' + wearer.name + '\\r\\n';
        }
      }

      return desc.trim();
    `);

    return obj;
  }
}
