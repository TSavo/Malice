import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds specialized body part prototypes
 * All inherit from BodyPart prototype
 *
 * Hierarchy:
 * - Torso (critical, central hub)
 *   - Stomach (digestion, internal organ)
 *   - Head (critical, sense hub)
 *     - Eye (sight)
 *     - Ear (hearing)
 *     - Nose (smell)
 *     - Mouth (taste, speech)
 *   - Arm
 *     - Hand (grasp)
 *       - Finger
 *   - Leg (locomotion)
 *     - Foot
 */
export class BodyPartsBuilder {
  constructor(private manager: ObjectManager) {}

  /**
   * Build all specialized body part prototypes
   * Returns map of part name -> prototype ID
   */
  async buildAll(bodyPartId: number): Promise<Record<string, RuntimeObject>> {
    const parts: Record<string, RuntimeObject> = {};

    // Build in dependency order
    parts.torso = await this.buildTorso(bodyPartId);
    parts.stomach = await this.buildStomach(bodyPartId);
    parts.head = await this.buildHead(bodyPartId);
    parts.eye = await this.buildEye(bodyPartId);
    parts.ear = await this.buildEar(bodyPartId);
    parts.nose = await this.buildNose(bodyPartId);
    parts.mouth = await this.buildMouth(bodyPartId);
    parts.arm = await this.buildArm(bodyPartId);
    parts.hand = await this.buildHand(bodyPartId);
    parts.finger = await this.buildFinger(bodyPartId);
    parts.leg = await this.buildLeg(bodyPartId);
    parts.foot = await this.buildFoot(bodyPartId);

    return parts;
  }

  async buildTorso(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Torso',
        description: 'The central body trunk',
        aliases: ['body', 'trunk', 'chest', 'abdomen'],
        size: 'large',
        weight: 40,
        coverable: true,
        critical: true,
        removable: false, // Torso is the root - you amputate FROM it, not it itself
        bones: ['spine', 'ribs', 'pelvis'],
        // Stats
        strength: 1, // Core strength
        // Calories - main body store (where digestion happens)
        // Average adult has ~2000 kcal/day needs, store represents available energy
        calories: 2000, // Current calories available
        maxCalories: 3000, // Max calorie storage (glycogen)
        // Fat - overflow calorie storage, acts as reserves but imposes penalties
        // 1 unit of fat = ~100 calories when burned
        // Accumulates when calories are maxed but still eating
        // Burns when out of digestible food and calories
        fat: 0, // Current fat reserves (0 = lean)
        maxFat: 100, // Max fat storage (100 = severely overweight)
      },
      methods: {},
    });

    obj.setMethod('describe', `
      let desc = self.description;
      const condition = self.condition || {};

      if (condition.wounded) {
        desc += ', bearing wounds';
      }

      return desc;
    `);

    return obj;
  }

  async buildStomach(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Stomach',
        description: 'The stomach',
        aliases: ['belly', 'gut'],
        size: 'medium',
        weight: 0.15, // ~150g empty
        coverable: false,
        removable: false,
        internal: true, // Internal organ
        // Stomach capacity
        maxContents: 10, // Max number of items
        maxVolume: 1000, // ml (about 1 liter when stretched)
        // Digestion rate - calories extracted per tick
        digestionRate: 50, // kcal per tick
      },
      methods: {},
    });

    // Stomach can contain food/drink
    obj.setMethod('canContain', `
      const item = args[0];
      const contents = self.contents || [];

      // Check item count
      if (contents.length >= (self.maxContents || 10)) {
        return 'Your stomach is too full.';
      }

      // Only edible items can be in stomach
      // Check if item has calories (simplified check for edibility)
      if (item.calories === undefined) {
        return 'That is not digestible.';
      }

      return true;
    `);

    // Digest one tick - process StomachContents and extract calories
    // Returns calories extracted this tick
    obj.setMethod('digest', `
      const contents = self.contents || [];
      if (contents.length === 0) {
        return 0;
      }

      let totalCalories = 0;
      const toRemove = [];
      const digestionRate = self.digestionRate || 50;

      for (const itemId of contents) {
        const item = await $.load(itemId);
        if (!item) {
          toRemove.push(itemId);
          continue;
        }

        // Use StomachContents.digestTick if available
        if (item.digestTick) {
          const extracted = await item.digestTick(digestionRate);
          totalCalories += extracted;

          // Check if fully digested
          if (item.isFullyDigested && await item.isFullyDigested()) {
            toRemove.push(itemId);
          }
        } else {
          // Fallback for old-style items (direct edibles)
          const itemCalories = item.calories || 0;
          const itemBites = item.bites || 1;
          const caloriesPerBite = Math.ceil(itemCalories / itemBites);

          if (item.bitesRemaining > 0) {
            item.bitesRemaining = (item.bitesRemaining || 1) - 1;
            totalCalories += caloriesPerBite;
          }

          if ((item.bitesRemaining || 0) <= 0) {
            toRemove.push(itemId);
          }
        }
      }

      // Remove fully digested items - recycle them
      for (const itemId of toRemove) {
        const item = await $.load(itemId);
        if (item) {
          // Move to recycler
          if ($.recycler && $.recycler.recycle) {
            await $.recycler.recycle(item);
          }
        }
        // Remove from contents
        const idx = (self.contents || []).indexOf(itemId);
        if (idx >= 0) {
          self.contents.splice(idx, 1);
        }
      }

      return totalCalories;
    `);

    // Describe stomach contents (for autopsy)
    obj.setMethod('describe', `
      const contents = self.contents || [];
      let desc = self.description;

      if (contents.length === 0) {
        desc += '\\r\\nIt is empty.';
      } else {
        const items = [];
        for (const itemId of contents) {
          const item = await $.load(itemId);
          if (item) {
            // Use StomachContents describe if available
            if (item.describe) {
              const itemDesc = await item.describe();
              items.push(itemDesc);
            } else {
              items.push(item.name || 'something');
            }
          }
        }
        desc += '\\r\\nContents:\\r\\n  - ' + items.join('\\r\\n  - ');
      }

      return desc;
    `);

    // Get fullness as a proportion
    obj.setMethod('getFullness', `
      const contents = self.contents || [];
      const max = self.maxContents || 10;
      return { current: contents.length, max: max };
    `);

    return obj;
  }

  async buildHead(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Head',
        description: 'The head',
        aliases: ['face'],
        size: 'medium',
        weight: 5,
        coverable: true,
        critical: true,
        bones: ['skull', 'jaw'],
        // Stats
        iq: 1, // Intelligence
      },
      methods: {},
    });

    obj.setMethod('describe', `
      const viewer = args[0];
      let desc = self.description;

      // Describe face features from child parts
      const features = [];
      const parts = self.parts || {};

      for (const partName of Object.keys(parts)) {
        const part = await $.load(parts[partName]);
        if (part && part.shortDesc) {
          features.push(await part.shortDesc());
        }
      }

      if (features.length > 0) {
        desc += ' with ' + features.join(', ');
      }

      return desc;
    `);

    return obj;
  }

  async buildEye(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Eye',
        description: 'An eye',
        aliases: [],
        size: 'tiny',
        weight: 0.01,
        coverable: false,
        removable: true,
        canSense: ['sight'],
        // Appearance
        color: 'brown',
        shape: 'almond',
        // Stats
        perception: 1,
      },
      methods: {},
    });

    obj.setMethod('shortDesc', `
      return self.color + ' ' + self.shape + ' eye';
    `);

    obj.setMethod('describe', `
      return 'A ' + self.color + ' ' + self.shape + '-shaped eye';
    `);

    return obj;
  }

  async buildEar(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Ear',
        description: 'An ear',
        aliases: [],
        size: 'small',
        weight: 0.02,
        coverable: false,
        removable: true,
        canSense: ['hearing'],
        // Appearance
        shape: 'normal',
        // Stats
        perception: 1, // Hearing acuity
      },
      methods: {},
    });

    obj.setMethod('shortDesc', `
      return self.shape + ' ear';
    `);

    // DELEGATION: hear() - process incoming speech
    // Ears just hear - they pass through what they receive
    // Translation/understanding is handled by the listener (Human) based on knownLanguages
    obj.setMethod('hear', `
      const speech = args[0]; // { type, content, language, volume, speaker }

      // Check if ear is damaged
      const condition = self.condition || {};
      if (condition.deaf || condition.destroyed) {
        return null; // Can't hear anything
      }

      // Check if blocked (earplugs, etc.)
      if ((self.contents || []).length > 0) {
        return {
          ...speech,
          muffled: true,
        };
      }

      // Ears just pass through what they hear
      // The Human.hear() method checks knownLanguages for understanding
      return speech;
    `);

    return obj;
  }

  async buildNose(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Nose',
        description: 'A nose',
        aliases: [],
        size: 'small',
        weight: 0.02,
        coverable: false,
        canSense: ['smell'],
        // Appearance
        shape: 'straight',
      },
      methods: {},
    });

    obj.setMethod('shortDesc', `
      return 'a ' + self.shape + ' nose';
    `);

    return obj;
  }

  async buildMouth(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Mouth',
        description: 'A mouth',
        aliases: ['lips'],
        size: 'small',
        weight: 0.01,
        coverable: false,
        canSense: ['taste'],
        canSpeak: true,
        // Language spoken by this mouth
        language: 'English',
        // Voice modifiers (chrome mods can change these)
        volume: 'normal', // whisper, normal, loud, booming
        tone: 'natural', // natural, synthetic, robotic, etc.
      },
      methods: {},
    });

    // Mouth can contain things (food, etc.)
    obj.setMethod('canContain', `
      const obj = args[0];
      // Can only contain small things
      if (obj.size === 'tiny' || obj.size === 'small') {
        return true;
      }
      return 'That is too large to fit in your mouth.';
    `);

    // DELEGATION: speak() - transform and emit speech
    // Returns a speech object with language, volume, content, speaker
    obj.setMethod('speak', `
      const message = args[0];
      const speaker = args[1]; // The owner who's speaking

      // Check if we can speak (tongue present, mouth not full)
      const tongue = await self.getPart('tongue');
      if (!tongue) {
        return { error: 'You have no tongue to speak with.' };
      }
      if ((self.contents || []).length > 0) {
        return { error: 'You cannot speak with your mouth full.' };
      }

      // Create speech object - can be modified by chrome/implants
      return {
        type: 'speech',
        content: message,
        language: self.language || 'English',
        volume: self.volume || 'normal',
        tone: self.tone || 'natural',
        speaker: speaker?.id || self.owner,
      };
    `);

    // Set the language this mouth speaks
    obj.setMethod('setLanguage', `
      const lang = args[0];
      self.language = lang;
    `);

    return obj;
  }

  async buildArm(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Arm',
        description: 'An arm',
        aliases: [],
        size: 'medium',
        weight: 4,
        coverable: true,
        removable: true,
        bones: ['humerus', 'radius', 'ulna'],
        // Stats
        strength: 1, // Arm strength
        // Local muscle energy (glycogen in arm muscles)
        calories: 100, // Current arm calories
        maxCalories: 150, // Max arm calorie storage
      },
      methods: {},
    });

    obj.setMethod('describe', `
      let desc = self.description;

      // Check if hand is attached and what it holds
      const hand = await self.getPart('hand');
      if (hand) {
        const handDesc = await hand.describe();
        desc += ', ending in ' + handDesc;
      }

      return desc;
    `);

    return obj;
  }

  async buildHand(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Hand',
        description: 'A hand',
        aliases: [],
        size: 'small',
        // Physical dimensions in cm
        width: 10, // palm width
        height: 20, // fingers extended
        depth: 5, // grip thickness
        weight: 500, // grams
        coverable: true,
        removable: true,
        canGrasp: true,
        canSense: ['touch'],
        bones: ['carpals', 'metacarpals'],
        // Grasp capacity
        maxItems: 2,
        maxWeight: 10000, // 10kg in grams
        // Stats
        strength: 1, // Grip strength
        dexterity: 1, // Fine motor control
        // Local muscle energy (hand/forearm muscles)
        calories: 50, // Current hand calories
        maxCalories: 75, // Max hand calorie storage
      },
      methods: {},
    });

    // Hands can hold items
    obj.setMethod('canContain', `
      const obj = args[0];
      const contents = self.contents || [];

      // Check item count
      if (contents.length >= (self.maxItems || 2)) {
        return 'Your hand is already full.';
      }

      // Check weight (in grams) - strength affects max carry weight
      const strengthMult = (self.strength || 1) * 5000; // 5kg per strength point
      const maxWeight = self.maxWeight || strengthMult;

      let currentWeight = 0;
      for (const itemId of contents) {
        const item = await $.load(itemId);
        if (item) {
          currentWeight += item.weight || 0;
        }
      }

      if (currentWeight + (obj.weight || 0) > maxWeight) {
        return 'That is too heavy to hold.';
      }

      return true;
    `);

    obj.setMethod('describe', `
      let desc = 'a hand';
      const contents = self.contents || [];

      if (contents.length > 0) {
        const items = [];
        for (const itemId of contents) {
          const item = await $.load(itemId);
          if (item) {
            items.push(item.name || 'something');
          }
        }
        desc += ' holding ' + items.join(' and ');
      }

      return desc;
    `);

    // Get items held by this hand
    obj.setMethod('getHeld', `
      const contents = self.contents || [];
      const items = [];
      for (const itemId of contents) {
        const item = await $.load(itemId);
        if (item) {
          items.push(item);
        }
      }
      return items;
    `);

    return obj;
  }

  async buildFinger(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Finger',
        description: 'A finger',
        aliases: [],
        size: 'tiny',
        weight: 0.02,
        coverable: false,
        removable: true,
        canSense: ['touch'],
        bones: ['phalanges'],
      },
      methods: {},
    });

    return obj;
  }

  async buildLeg(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Leg',
        description: 'A leg',
        aliases: [],
        size: 'large',
        weight: 10,
        coverable: true,
        removable: true,
        canMove: true,
        bones: ['femur', 'tibia', 'fibula'],
        // Stats
        strength: 1, // Leg power
        dexterity: 1, // Coordination/balance
        // Local muscle energy (leg muscles - largest muscle group)
        calories: 200, // Current leg calories
        maxCalories: 300, // Max leg calorie storage
      },
      methods: {},
    });

    return obj;
  }

  async buildFoot(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Foot',
        description: 'A foot',
        aliases: [],
        size: 'small',
        weight: 1,
        coverable: true,
        removable: true,
        canMove: true,
        canSense: ['touch'],
        bones: ['tarsals', 'metatarsals', 'phalanges'],
        // Stats
        dexterity: 1, // Balance/footwork
      },
      methods: {},
    });

    return obj;
  }
}
