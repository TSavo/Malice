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
    parts.tongue = await this.buildTongue(bodyPartId);
    parts.arm = await this.buildArm(bodyPartId);
    parts.hand = await this.buildHand(bodyPartId);
    parts.finger = await this.buildFinger(bodyPartId);
    parts.leg = await this.buildLeg(bodyPartId);
    parts.foot = await this.buildFoot(bodyPartId);

    return parts;
  }

  async buildTorso(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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

        abilities: `Central body trunk. Root of body part hierarchy.

ENERGY HUB: Main calorie storage ('calories', 'maxCalories'). Limbs draw from torso when depleted. Stomach is inside torso.

FAT RESERVES: 'fat' stores excess calories. Burns when out of food. High fat slows movement.

CRITICAL: Cannot be removed (it IS the body). Destroying torso = death.

BONES: Spine (posture, movement), ribs (protect organs), pelvis (support legs).

VITAL ORGANS: Contains stomach, heart, lungs (internal, protected by ribs). Puncture wounds can hit organs.`,
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

    obj.setPropertyDescription('calories', 'Current available energy stored in the torso (kcal).');
    obj.setPropertyDescription('maxCalories', 'Maximum calorie storage capacity. Excess becomes fat.');
    obj.setPropertyDescription('fat', 'Fat reserves in units. 1 unit = ~100 calories when burned. High fat impairs movement.');
    obj.setPropertyDescription('maxFat', 'Maximum fat storage before severe health penalties.');

    return obj;
  }

  async buildStomach(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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
        // 5 cal/tick = enough to sustain activity and slowly gain
        // Activity burns more, so healthy eating matters
        digestionRate: 5, // kcal per tick

        abilities: `Internal digestive organ.

DIGESTION: Processes contents via digest(). Extracts 'digestionRate' calories per tick. Fully digested items are recycled.

CAPACITY: 'maxContents' item limit, 'maxVolume' ml volume limit. Check getFullness() for current state.

VOMITING: Can forcibly empty via vomit(). Useful for expelling poison before absorption.

INTERNAL: Protected by torso. Not coverable. Cannot be directly attacked without penetrating torso first.`,
      },
      methods: {},
    });

    // Get current total volume of stomach contents
    obj.setMethod('getCurrentVolume', `
      const contents = self.contents || [];
      let total = 0;
      for (const item of contents) {
        if (item) {
          total += (item.volume || 0);
        }
      }
      return total;
    `);

    // Check if there's room for a given volume (ml)
    obj.setMethod('hasRoomFor', `
      const volumeToAdd = args[0] || 0;
      const currentVolume = await self.getCurrentVolume();
      const maxVolume = self.maxVolume || 1000;
      return (currentVolume + volumeToAdd) <= maxVolume;
    `);

    // Stomach can contain food/drink
    obj.setMethod('canContain', `
      const item = args[0];
      const contents = self.contents || [];

      // Check item count
      if (contents.length >= (self.maxContents || 10)) {
        return 'Your stomach is too full.';
      }

      // Check volume capacity
      const itemVolume = item.volume || 0;
      if (itemVolume > 0) {
        const hasRoom = await self.hasRoomFor(itemVolume);
        if (!hasRoom) {
          return 'Your stomach is too full.';
        }
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

      for (const item of contents) {
        if (!item) {
          continue;
        }

        // Use StomachContents.digestTick if available
        if (item.digestTick) {
          const result = await item.digestTick(digestionRate);
          // Handle both old (number) and new ({calories, volume}) return format
          const extracted = typeof result === 'number' ? result : (result.calories || 0);
          totalCalories += extracted;

          // Check if fully digested
          if (item.isFullyDigested && await item.isFullyDigested()) {
            toRemove.push(item);
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
            toRemove.push(item);
          }
        }
      }

      // Remove fully digested items - recycle them
      for (const item of toRemove) {
        if (item) {
          // Move to recycler
          if ($.recycler && $.recycler.recycle) {
            await $.recycler.recycle(item);
          }
        }
        // Remove from contents
        const idx = (self.contents || []).findIndex(c => c === item);
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
        for (const item of contents) {
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

    // Get fullness as a proportion (by count and volume)
    obj.setMethod('getFullness', `
      const contents = self.contents || [];
      const maxCount = self.maxContents || 10;
      const maxVolume = self.maxVolume || 1000;
      const currentVolume = await self.getCurrentVolume();
      return {
        count: contents.length,
        maxCount: maxCount,
        volume: currentVolume,
        maxVolume: maxVolume,
        // Overall fullness is the higher of the two ratios
        ratio: Math.max(contents.length / maxCount, currentVolume / maxVolume),
      };
    `);

    obj.setPropertyDescription('maxContents', 'Maximum number of food items the stomach can hold simultaneously.');
    obj.setPropertyDescription('maxVolume', 'Maximum volume in ml the stomach can stretch to hold (~1 liter).');
    obj.setPropertyDescription('digestionRate', 'Calories extracted per tick from stomach contents.');
    obj.setPropertyDescription('internal', 'This is an internal organ, protected by the torso.');

    return obj;
  }

  async buildHead(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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

        abilities: `Sensory and cognitive center. Contains brain (consciousness, intelligence).

HIERARCHY: Contains face (eyes, ears, nose, mouth→tongue). All sensory organs are here.

SENSES: Vision (eyes), hearing (ears), smell (nose), taste (tongue). Uses canSmell(), canTaste(), canHear() to check working organs.

SPEECH: Mouth contains tongue. Without head, cannot speak or perceive world.

CRITICAL: Destroying head = instant death. Brain death, sensory shutdown.

BONES: Skull (protects brain), jaw (enables eating/speech). Skull fracture can cause brain damage.

INTELLIGENCE: 'iq' property affects learning, problem solving, tech use.`,
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
        const part = parts[partName];
        if (part && part.shortDesc) {
          features.push(await part.shortDesc());
        }
      }

      if (features.length > 0) {
        desc += ' with ' + features.join(', ');
      }

      return desc;
    `);

    obj.setPropertyDescription('iq', 'Intelligence quotient. Affects learning, problem solving, and technology use.');

    // Check if can smell (needs working nose in face)
    obj.setMethod('canSmell', `
      const face = await self.getPart('face');
      if (!face) return false;

      const nose = await face.getPart('nose');
      if (!nose || !nose.canSmell) return false;

      return await nose.canSmell();
    `);

    // Check if can taste (needs tongue in mouth in face)
    obj.setMethod('canTaste', `
      const face = await self.getPart('face');
      if (!face) return false;

      const mouth = await face.getPart('mouth');
      if (!mouth || !mouth.canTaste) return false;

      return await mouth.canTaste();
    `);

    // Check if can hear (needs working ears in face)
    obj.setMethod('canHear', `
      const face = await self.getPart('face');
      if (!face) return false;

      const leftEar = await face.getPart('leftEar');
      const rightEar = await face.getPart('rightEar');

      // Can hear if at least one ear works
      if (leftEar && leftEar.hear) return true;
      if (rightEar && rightEar.hear) return true;
      return false;
    `);

    return obj;
  }

  async buildEye(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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

        abilities: `Visual sensory organ. Provides sight capability.

VISION: 'canSense' includes 'sight'. Enables look/glance verbs and environmental awareness.

APPEARANCE: 'color' and 'shape' define cosmetic features. Chrome eyes may have different colors (cybernetic blue, etc).

PERCEPTION: 'perception' stat affects visual acuity, noticing details, spotting hidden objects.

DAMAGE: Losing eye reduces perception, impairs depth perception. Losing both = blindness.

REMOVABLE: Eyes can be gouged out in combat or surgically extracted. Chrome eyes can be swapped.`,
      },
      methods: {},
    });

    obj.setMethod('shortDesc', `
      return self.color + ' ' + self.shape + ' eye';
    `);

    obj.setMethod('describe', `
      return 'A ' + self.color + ' ' + self.shape + '-shaped eye';
    `);

    obj.setPropertyDescription('color', 'Eye color (brown, blue, green, etc.).');
    obj.setPropertyDescription('shape', 'Eye shape (almond, round, hooded, etc.).');
    obj.setPropertyDescription('perception', 'Visual acuity. Affects noticing details and spotting hidden objects.');

    return obj;
  }

  async buildEar(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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

        abilities: `Auditory sensory organ. Receives sound and speech.

HEARING: hear() method processes incoming speech. Checks if deaf/destroyed/blocked before passing through.

LANGUAGE: Ears receive raw speech objects. Understanding depends on listener's knownLanguages, not the ear.

BLOCKING: Contents (earplugs, bugs) muffle sound. Sets 'muffled' flag on speech object.

DAMAGE: 'deaf' condition or destruction = cannot hear. Need at least one working ear.

PERCEPTION: 'perception' stat affects hearing acuity, detecting whispers, identifying speakers.`,
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

    obj.setPropertyDescription('shape', 'Ear shape (normal, pointed, large, etc.).');
    obj.setPropertyDescription('perception', 'Hearing acuity. Affects detecting whispers and identifying speakers.');

    return obj;
  }

  async buildNose(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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

        abilities: `Olfactory sensory organ. Detects scents and odors.

SMELL: canSmell() checks if functional. Returns false if destroyed/missing/stuffed or if contents block airway.

BLOCKING: Items shoved into nose (drugs, implants, plugs) prevent smelling.

DAMAGE: Losing nose or 'stuffed' condition = cannot smell. Impairs taste (smell/taste linked).

APPEARANCE: 'shape' property (straight, hooked, flat, etc) is cosmetic.

BREATHING: Nose also handles respiration. Blocked nose forces mouth breathing.`,
      },
      methods: {},
    });

    obj.setMethod('shortDesc', `
      return 'a ' + self.shape + ' nose';
    `);

    // Can smell if nose exists and not blocked
    obj.setMethod('canSmell', `
      const condition = self.condition || {};
      if (condition.destroyed || condition.missing || condition.stuffed) {
        return false;
      }
      // Can't smell if something is shoved up there
      const contents = self.contents || [];
      if (contents.length > 0) {
        return false;
      }
      return true;
    `);

    obj.setPropertyDescription('shape', 'Nose shape (straight, hooked, flat, etc.).');

    return obj;
  }

  async buildMouth(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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

        abilities: `Oral cavity for speech, eating, breathing.

SPEECH: speak() method creates speech objects. Requires working tongue. 'language' property determines spoken language.

VOICE: 'volume' (whisper/normal/loud/booming) and 'tone' (natural/synthetic/robotic) modify speech. Chrome can augment.

EATING: Gateway to stomach. canContain() checks size (only tiny/small items fit).

TASTE: Delegates to tongue via canTaste(). Requires functional tongue.

BLOCKING: Contents (gag, food) prevent speech. Must be empty to speak.

BREATHING: Secondary airway when nose blocked. Cannot breathe underwater without equipment.`,
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

    // Can taste if tongue is present and functional
    obj.setMethod('canTaste', `
      const tongue = await self.getPart('tongue');
      if (!tongue) return false;
      if (tongue.canTaste) {
        return await tongue.canTaste();
      }
      // Default to true if tongue exists but has no canTaste method
      return true;
    `);

    obj.setPropertyDescription('canSpeak', 'Whether this mouth can produce speech. Requires working tongue.');
    obj.setPropertyDescription('language', 'The language spoken by this mouth (English, Spanish, etc.).');
    obj.setPropertyDescription('volume', 'Voice volume (whisper, normal, loud, booming).');
    obj.setPropertyDescription('tone', 'Voice tone (natural, synthetic, robotic). Modified by chrome.');

    return obj;
  }

  async buildTongue(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Tongue',
        description: 'A tongue',
        aliases: [],
        size: 'tiny',
        weight: 0.07, // ~70g
        coverable: false,
        removable: true,
        critical: false,
        canSense: ['taste'],

        abilities: `Muscular organ for taste and speech articulation.

TASTE: canTaste() returns true unless destroyed/missing. Enables flavor detection.

SPEECH: canSpeak() required for mouth.speak(). Without tongue, cannot articulate words (mute).

DAMAGE: Losing tongue = cannot speak, cannot taste. 'mute' condition silences speech.

REMOVABLE: Can be cut out (torture, combat). Chrome replacement possible (synth-tongue).

WEIGHT: ~70g. Small but dense muscle tissue.`,
      },
      methods: {},
    });

    // Can speak if tongue exists and not damaged
    obj.setMethod('canSpeak', `
      const condition = self.condition || {};
      if (condition.destroyed || condition.missing || condition.mute) {
        return false;
      }
      return true;
    `);

    // Can taste if tongue exists
    obj.setMethod('canTaste', `
      const condition = self.condition || {};
      if (condition.destroyed || condition.missing) {
        return false;
      }
      return true;
    `);

    obj.setPropertyDescription('canSense', 'Array of senses this organ provides (taste).');

    return obj;
  }

  async buildArm(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Arm',
        description: 'An arm',
        aliases: [],
        size: 'medium',
        weight: 4,
        coverable: true,
        removable: true,
        bones: ['humerus', 'radius', 'ulna'],
        // Local muscle energy (glycogen in arm muscles)
        calories: 100, // Current arm calories
        maxCalories: 150, // Max arm calorie storage

        abilities: `Limb for reaching, carrying, striking.

HIERARCHY: Contains forearm→hand→fingers. Losing arm loses all child parts.

STRENGTH: Local 'calories' power arm actions. Depletes with heavy use, refills from torso.

COMBAT: Can punch, block, grapple. Weapons held in hand use arm strength.

AMPUTATION: 'removable' is true. Severing drops arm (with hand attached) to ground.

BONES: Humerus (upper), radius/ulna (forearm). Breaking impairs use.`,
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

    obj.setPropertyDescription('calories', 'Current energy stored in arm muscles.');
    obj.setPropertyDescription('maxCalories', 'Maximum calorie storage in arm. Refills from torso when depleted.');

    return obj;
  }

  async buildHand(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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
        // Local muscle energy (hand/forearm muscles)
        calories: 50, // Current hand calories
        maxCalories: 75, // Max hand calorie storage

        abilities: `Grasping appendage at end of arm. Enables object manipulation.

HIERARCHY: Contains fingers (5 typically). Losing hand loses all fingers.

GRASP: 'canGrasp' enables holding items. 'maxItems' (2) limit - can hold 2 objects at once.

CAPACITY: 'maxWeight' (10kg base). Effective capacity = maxCalories - decayLevel (~133g per calorie).

STRENGTH: Local 'calories' power grip strength. Depletes with sustained holding, refills from arm.

TOUCH: 'canSense' includes 'touch'. Tactile feedback for texture, temperature, pressure.

DAMAGE: Broken hand (bone damage) = cannot grasp. Losing fingers reduces dexterity.

BONES: Carpals (wrist), metacarpals (palm). Fractures impair grip.`,
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

      // Check weight - effective capacity determines max carry weight
      // effectiveCapacity = maxCalories - decayLevel
      const maxCal = self.maxCalories || 75;
      const decay = self.decayLevel || 0;
      const effectiveCapacity = Math.max(0, maxCal - decay);

      // ~133g per calorie of capacity (75 cal = 10kg)
      const maxWeight = self.maxWeight || Math.floor(effectiveCapacity * 133);

      let currentWeight = 0;
      for (const item of contents) {
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
        for (const item of contents) {
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
      return contents.filter(item => item);
    `);

    obj.setPropertyDescription('canGrasp', 'Whether this hand can grasp and hold items.');
    obj.setPropertyDescription('maxItems', 'Maximum number of items this hand can hold simultaneously (typically 2).');
    obj.setPropertyDescription('maxWeight', 'Maximum weight in grams this hand can hold. Reduced by decay and damage.');
    obj.setPropertyDescription('width', 'Palm width in cm. Affects what can be grasped.');
    obj.setPropertyDescription('height', 'Hand length in cm (fingers extended).');
    obj.setPropertyDescription('depth', 'Grip thickness in cm.');
    obj.setPropertyDescription('calories', 'Current energy in hand/forearm muscles.');
    obj.setPropertyDescription('maxCalories', 'Maximum calorie storage in hand. Powers grip strength.');

    return obj;
  }

  async buildFinger(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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

        abilities: `Digit for fine manipulation. Part of hand.

DEXTERITY: Enables precise actions (typing, lockpicking, trigger pulling). Losing fingers reduces dexterity.

TOUCH: High-density tactile receptors. 'canSense' includes 'touch'. Sensitive to texture, pressure, temperature.

DAMAGE: Individual fingers can be severed. Losing thumb = major grip impairment. Losing multiple fingers = cannot hold items.

BONES: Phalanges (3 per finger, 2 for thumb). Breaking disables finger.

REMOVABLE: Can be cut/shot off individually. Chrome fingers are modular replacements.

WEIGHT: ~20g each. Tiny but crucial for hand function.`,
      },
      methods: {},
    });

    obj.setPropertyDescription('canSense', 'Array of senses this organ provides (touch).');

    return obj;
  }

  async buildLeg(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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
        // Local muscle energy (leg muscles - largest muscle group)
        calories: 200, // Current leg calories
        maxCalories: 300, // Max leg calorie storage

        abilities: `Primary locomotion limb. Largest muscle group in body.

HIERARCHY: Contains knee→foot→toes. Losing leg loses all child parts.

MOVEMENT: 'canMove' enables walking/running. Need at least one leg to stand. Two legs = normal speed.

STRENGTH: Massive 'maxCalories' (300) - legs are strongest muscles. Powers movement, jumping, kicking.

COMBAT: Can kick with devastating force. Leg sweeps, stomps. Heavy weapons.

DAMAGE: Losing one leg = reduced mobility (crutch/prosthetic needed). Losing both = cannot walk.

BONES: Femur (thigh, strongest bone), tibia/fibula (shin). Femur break = immobilized.

AMPUTATION: 'removable' is true. Severing drops leg (with foot attached) to ground. Chrome legs common.`,
      },
      methods: {},
    });

    obj.setPropertyDescription('canMove', 'Whether this leg enables locomotion. Requires working joints and bones.');
    obj.setPropertyDescription('calories', 'Current energy in leg muscles. Legs have the highest capacity (largest muscles).');
    obj.setPropertyDescription('maxCalories', 'Maximum calorie storage in leg. Powers movement, jumping, and kicking.');

    return obj;
  }

  async buildFoot(bodyPartId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(bodyPartId);
    const obj = await this.manager.create({
      parent: parentObj!,
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

        abilities: `Ground contact point for leg. Enables balance and propulsion.

MOVEMENT: 'canMove' links to leg locomotion. Feet provide traction, balance, push-off.

TOUCH: 'canSense' includes 'touch'. Ground texture, temperature feedback. Barefoot = tactile awareness.

COVERAGE: 'coverable' is true. Shoes/boots provide protection, reduce noise. Bare feet = stealthy but vulnerable.

DAMAGE: Losing foot = impaired balance, reduced speed. Can use peg leg or prosthetic.

COMBAT: Can stomp/kick. Less force than full leg but still effective.

BONES: Tarsals (ankle/heel), metatarsals (arch), phalanges (toes). Broken ankle = cannot walk.

REMOVABLE: Can be severed at ankle. Chrome feet provide enhanced grip, shock absorption.`,
      },
      methods: {},
    });

    obj.setPropertyDescription('canMove', 'Whether this foot contributes to leg locomotion. Provides traction and balance.');

    return obj;
  }
}
