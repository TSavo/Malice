import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Human prototype
 * Base prototype for human-like agents with pronouns, age, etc.
 *
 * Humans have bodies and delegate actions through body parts:
 * - speak() → mouth.speak()
 * - hear() → ears.hear()
 * - see() → eyes.see()
 * - feel() → body parts report sensations
 */
export class HumanBuilder {
  constructor(private manager: ObjectManager) {}

  async build(agentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: agentId,
      properties: {
        name: 'Human',
        description: 'Base prototype for human-like agents',
        sex: 'non-binary',
        pronouns: {
          subject: 'they',
          object: 'them',
          possessive: 'their',
        },
        age: 25,
        species: 'human',
        // Body reference - set when body is created
        body: null, // ObjRef to torso (root of body tree)
        // Appearance properties
        height: 1.7, // meters
        weight: 75, // kg
        // Known languages (for understanding speech)
        knownLanguages: ['English'],
        nativeLanguage: 'English',
        // Consciousness state
        conscious: true,
      },
      methods: {},
    });

    obj.setMethod('pronoun', `
      /** Get a pronoun for this human.
       *  @param type - 'subject', 'object', or 'possessive'
       *  @returns The appropriate pronoun (e.g., 'they', 'them', 'their')
       */
      const type = args[0]; // 'subject', 'object', 'possessive'
      return self.pronouns[type] || 'they';
    `);

    obj.setMethod('getBody', `
      /** Get the body (torso root) of this human.
       *  @returns The torso RuntimeObject or null if no body
       */
      if (self.body) {
        return await $.load(self.body);
      }
      return null;
    `);

    obj.setMethod('getTorso', `
      /** Get the torso (alias for getBody).
       *  @returns The torso RuntimeObject or null
       */
      return await self.getBody();
    `);

    obj.setMethod('getHead', `
      /** Get the head body part.
       *  @returns The head RuntimeObject or null
       */
      const body = await self.getBody();
      if (body) {
        return await body.getPart('head');
      }
      return null;
    `);

    obj.setMethod('getMouth', `
      /** Get the mouth body part (for speaking).
       *  @returns The mouth RuntimeObject or null
       */
      const head = await self.getHead();
      if (head) {
        const face = await head.getPart('face');
        if (face) {
          return await face.getPart('mouth');
        }
      }
      return null;
    `);

    obj.setMethod('getEars', `
      /** Get all ear body parts (for hearing).
       *  @returns Array of ear RuntimeObjects
       */
      const head = await self.getHead();
      if (head) {
        const face = await head.getPart('face');
        if (face) {
          const leftEar = await face.getPart('leftEar');
          const rightEar = await face.getPart('rightEar');
          return [leftEar, rightEar].filter(e => e !== null);
        }
      }
      return [];
    `);

    obj.setMethod('getEyes', `
      /** Get all eye body parts (for seeing).
       *  @returns Array of eye RuntimeObjects
       */
      const head = await self.getHead();
      if (head) {
        const face = await head.getPart('face');
        if (face) {
          const leftEye = await face.getPart('leftEye');
          const rightEye = await face.getPart('rightEye');
          return [leftEye, rightEye].filter(e => e !== null);
        }
      }
      return [];
    `);

    obj.setMethod('getHands', `
      /** Get hand body parts.
       *  @returns Object with primary, secondary, and both hand arrays
       */
      const body = await self.getBody();
      if (!body) return { primary: null, secondary: null, both: [] };

      const primaryHand = body.primaryHand || 'right';

      const getHand = async (side) => {
        const shoulder = await body.getPart(side + 'Shoulder');
        if (!shoulder) return null;
        const arm = await shoulder.getPart('arm');
        if (!arm) return null;
        const forearm = await arm.getPart('forearm');
        if (!forearm) return null;
        return await forearm.getPart('hand');
      };

      const rightHand = await getHand('right');
      const leftHand = await getHand('left');

      return {
        primary: primaryHand === 'right' ? rightHand : leftHand,
        secondary: primaryHand === 'right' ? leftHand : rightHand,
        both: [rightHand, leftHand].filter(h => h !== null),
      };
    `);

    obj.setMethod('speak', `
      /** Speak a message through the mouth.
       *  Routes through mouth body part and broadcasts to room.
       *  @param message - The text to speak
       *  @returns Speech object or error
       */
      const message = args[0];

      if (!self.conscious) {
        return { error: 'You are unconscious.' };
      }

      const mouth = await self.getMouth();
      if (!mouth) {
        return { error: 'You have no mouth.' };
      }

      // Delegate to mouth - it handles language, voice modifiers, etc.
      const speech = await mouth.speak(message, self);

      if (speech.error) {
        return speech;
      }

      // Broadcast speech to location
      // The room/location will distribute to nearby players
      if (self.location) {
        const location = await $.load(self.location);
        if (location && location.broadcastSpeech) {
          await location.broadcastSpeech(speech, self);
        }
      }

      return speech;
    `);

    obj.setMethod('hear', `
      /** Hear a sound or speech through the ears.
       *  Routes through ear body parts. Language understanding based on knownLanguages.
       *  @param message - String or speech object
       *  @param language - Optional language (default: English)
       *  @param source - Optional source object (speaker)
       *  @returns Heard speech object or null if deaf/unconscious
       */
      const messageOrSpeech = args[0];
      const languageOrSource = args[1];
      const sourceArg = args[2];

      if (!self.conscious) {
        return null; // Can't hear when unconscious
      }

      // Build speech object from args
      let speech;
      if (typeof messageOrSpeech === 'string') {
        // Called as hear(message, language?, source?)
        const language = typeof languageOrSource === 'string' ? languageOrSource : 'English';
        const source = typeof languageOrSource === 'object' ? languageOrSource : sourceArg;
        speech = {
          type: 'speech',
          content: messageOrSpeech,
          language: language,
          speaker: source?.id || null,
        };
      } else {
        // Called with speech object directly
        speech = messageOrSpeech;
      }

      const ears = await self.getEars();
      if (ears.length === 0) {
        return null; // No ears - can't hear
      }

      // Try each ear - use first that can hear
      let heard = null;
      for (const ear of ears) {
        if (ear && ear.hear) {
          const result = await ear.hear(speech);
          if (result) {
            heard = result;
            break;
          }
        }
      }

      if (!heard) {
        return null; // Couldn't hear anything (all ears blocked/deaf)
      }

      // Check if we understand the language
      const speechLang = heard.language || 'English';
      const knownLanguages = self.knownLanguages || ['English'];

      let result;
      if (knownLanguages.includes(speechLang)) {
        // We understand this language
        result = heard;
      } else {
        // Foreign language - we hear it but don't understand
        result = {
          ...heard,
          understood: false,
        };
      }

      // Output what was heard via tell()
      if (self.tell) {
        const options = self.options || {};
        const prefix = options.hearPrompt || '';
        await self.tell(prefix + result.content);
      }

      return result;
    `);

    obj.setMethod('see', `
      /** See a visual message through the eyes.
       *  If can see, sends message via tell() and returns true.
       *  @param message - The visual message to see
       *  @param source - Optional source of the message
       *  @returns true if seen, false if blind/unconscious
       */
      const message = args[0];
      const source = args[1];

      if (!self.conscious) {
        return false;
      }

      const eyes = await self.getEyes();
      if (eyes.length === 0) {
        return false;
      }

      // Check if at least one eye can see
      for (const eye of eyes) {
        if (eye) {
          const condition = eye.condition || {};
          if (!condition.blind && !condition.destroyed) {
            // Can see - send the message
            if (self.tell) {
              const options = self.options || {};
              const prefix = options.seePrompt || '';
              await self.tell(prefix + message);
            }
            return true;
          }
        }
      }

      return false; // All eyes blocked/blind
    `);

    obj.setMethod('onSensation', `
      /** Handle incoming sensation from body parts.
       *  @param sensation - Object with part, partName, type, intensity
       */
      const sensation = args[0]; // { part, partName, type, intensity, ... }

      if (!self.conscious) {
        return; // No sensation when unconscious
      }

      // Different handling based on sensation type
      if (sensation.type === 'pain') {
        // Pain sensation - could trigger reactions
        // For now, just acknowledge it
        // Future: pain tolerance, shock, etc.
      }
    `);

    obj.setMethod('onCriticalDamage', `
      /** Handle critical damage to body parts (may cause death).
       *  @param part - The body part that was critically damaged
       */
      const part = args[0]; // The body part that was critically damaged

      // Critical parts being destroyed = death
      // Head, torso, etc.
      if (part.critical) {
        self.conscious = false;
        // Trigger death sequence
        if (self.onDeath) {
          await self.onDeath(part);
        }
      }
    `);

    obj.setMethod('resolveAllContents', `
      /** Get all contents including items in body (hands, etc).
       *  @returns Array of object IDs
       */
      // Start with direct contents
      let allContents = [...(self.contents || [])];

      // Add body contents (items held in hands, etc.)
      const body = await self.getBody();
      if (body && body.resolveAllContents) {
        const bodyContents = await body.resolveAllContents();
        allContents = allContents.concat(bodyContents);
      }

      // Add location contents for searching
      if (self.location) {
        const location = await $.load(self.location);
        if (location) {
          allContents = allContents.concat(location.contents || []);
        }
      }

      return allContents;
    `);

    obj.setMethod('describeAppearance', `
      /** Generate appearance description from body parts.
       *  @param viewer - Who is looking at this human
       *  @returns Descriptive string of appearance
       */
      const viewer = args[0]; // Who is looking
      const parts = [];

      // Body composition (fat level) - most noticeable physical trait
      const fatInfo = await self.getFat();
      const bodyDesc = await $.proportional.sub(
        ['very lean', 'lean', 'fit', 'healthy-looking', 'soft', 'heavyset', 'overweight', 'obese', 'morbidly obese'],
        fatInfo.fat,
        fatInfo.maxFat
      );
      parts.push(bodyDesc);

      // Basic description
      const heightDesc = self.height >= 1.9 ? 'tall' :
                        self.height >= 1.8 ? 'above average height' :
                        self.height >= 1.65 ? 'average height' :
                        self.height >= 1.55 ? 'short' : 'very short';
      parts.push(heightDesc);

      // Age description
      const ageDesc = self.age >= 56 ? 'elderly' :
                     self.age >= 36 ? 'middle-aged' :
                     self.age >= 20 ? 'adult' :
                     self.age >= 13 ? 'teenage' : 'young';
      parts.push(ageDesc);

      // Sex/species
      if (self.sex !== 'non-binary') {
        parts.push(self.sex);
      }
      parts.push(self.species || 'human');

      // Get eye description from body
      const eyes = await self.getEyes();
      if (eyes.length > 0 && eyes[0]) {
        const eye = eyes[0];
        const eyeColor = eye.color || 'brown';
        const eyeShape = eye.shape || 'almond';
        parts.push('with ' + eyeColor + ' ' + eyeShape + ' eyes');
      }

      // Get hair from head
      const head = await self.getHead();
      if (head) {
        const scalp = await head.getPart('scalp');
        if (scalp && scalp.hairColor && scalp.hairStyle) {
          parts.push('and ' + scalp.hairColor + ' ' + scalp.hairStyle + ' hair');
        }
      }

      return parts.join(' ');
    `);

    obj.setMethod('describe', `
      /** Generate full description including appearance.
       *  @param viewer - Who is looking at this human
       *  @returns Full description string
       */
      const viewer = args[0];
      let desc = self.name;

      if (self.title) {
        desc += ' ' + self.title;
      }

      desc += '\\r\\n';

      // Add custom description if set
      if (self.description && self.description !== 'Base prototype for human-like agents') {
        desc += self.description + '\\r\\n';
      }

      // Add appearance
      const appearance = await self.describeAppearance(viewer);
      if (appearance) {
        desc += 'A ' + appearance + '.\\r\\n';
      }

      // Describe what they're wearing/holding
      const hands = await self.getHands();
      if (hands.both.length > 0) {
        for (const hand of hands.both) {
          if (hand) {
            const contents = hand.contents || [];
            if (contents.length > 0) {
              for (const itemId of contents) {
                const item = await $.load(itemId);
                if (item) {
                  const handSide = hand === hands.primary ? 'primary' : 'secondary';
                  desc += self.pronoun('subject') + ' ' + (handSide === 'primary' ? 'holds' : 'also holds') + ' ' + item.name + '.\\r\\n';
                }
              }
            }
          }
        }
      }

      return desc.trim();
    `);

    // === STAT AGGREGATION METHODS ===

    obj.setMethod('getStrength', `
      /** Get total strength (torso + arms + hands + legs).
       *  @returns Total strength stat
       */
      let total = 0;
      const body = await self.getBody();
      if (!body) return 0;

      // Torso core strength
      total += body.strength || 0;

      // Arms (shoulders contain the arm chain)
      const parts = body.parts || {};
      for (const partName of ['rightShoulder', 'leftShoulder']) {
        const shoulder = await body.getPart(partName);
        if (shoulder) {
          const arm = await shoulder.getPart('arm');
          if (arm) {
            total += arm.strength || 0;
            const forearm = await arm.getPart('forearm');
            if (forearm) {
              const hand = await forearm.getPart('hand');
              if (hand) {
                total += hand.strength || 0;
              }
            }
          }
        }
      }

      // Legs
      for (const partName of ['rightThigh', 'leftThigh']) {
        const thigh = await body.getPart(partName);
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              total += leg.strength || 0;
            }
          }
        }
      }

      return total;
    `);

    obj.setMethod('getDexterity', `
      /** Get total dexterity (hands + legs + feet).
       *  Affected by fat modifier.
       *  @returns Total dexterity stat
       */
      let total = 0;
      const body = await self.getBody();
      if (!body) return 0;

      // Hands
      for (const partName of ['rightShoulder', 'leftShoulder']) {
        const shoulder = await body.getPart(partName);
        if (shoulder) {
          const arm = await shoulder.getPart('arm');
          if (arm) {
            const forearm = await arm.getPart('forearm');
            if (forearm) {
              const hand = await forearm.getPart('hand');
              if (hand) {
                total += hand.dexterity || 0;
              }
            }
          }
        }
      }

      // Legs and feet
      for (const partName of ['rightThigh', 'leftThigh']) {
        const thigh = await body.getPart(partName);
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              total += leg.dexterity || 0;
              const foot = await leg.getPart('foot');
              if (foot) {
                total += foot.dexterity || 0;
              }
            }
          }
        }
      }

      // Apply fat penalty
      const fatMod = await self.getFatModifier();
      return Math.floor(total * fatMod);
    `);

    obj.setMethod('getIntelligence', `
      /** Get intelligence stat (from head).
       *  @returns Intelligence stat
       */
      const head = await self.getHead();
      if (!head) return 0;
      return head.iq || 0;
    `);

    obj.setMethod('getPerception', `
      /** Get total perception stat (eyes + ears).
       *  @returns Total perception stat
       */
      let total = 0;

      const eyes = await self.getEyes();
      for (const eye of eyes) {
        if (eye) {
          total += eye.perception || 0;
        }
      }

      const ears = await self.getEars();
      for (const ear of ears) {
        if (ear) {
          total += ear.perception || 0;
        }
      }

      return total;
    `);

    obj.setMethod('getSpeed', `
      /** Get derived speed stat (leg strength + leg dexterity).
       *  Heavily affected by fat modifier.
       *  @returns Speed stat
       */
      let legStrength = 0;
      let legDexterity = 0;

      const body = await self.getBody();
      if (!body) return 0;

      for (const partName of ['rightThigh', 'leftThigh']) {
        const thigh = await body.getPart(partName);
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              legStrength += leg.strength || 0;
              legDexterity += leg.dexterity || 0;
            }
          }
        }
      }

      // Speed is average of leg strength and dexterity
      const base = Math.floor((legStrength + legDexterity) / 2);

      // Apply fat penalty (speed is more affected by fat)
      const fatMod = await self.getFatModifier();
      // Speed penalty is double the normal fat penalty
      const speedMod = 1.0 - ((1.0 - fatMod) * 2);
      return Math.floor(base * Math.max(0.25, speedMod));
    `);

    obj.setMethod('getStats', `
      /** Get all stats as an object.
       *  @returns Object with all stat values
       */
      const fat = await self.getFat();
      return {
        strength: await self.getStrength(),
        dexterity: await self.getDexterity(),
        intelligence: await self.getIntelligence(),
        perception: await self.getPerception(),
        speed: await self.getSpeed(),
        fatModifier: await self.getFatModifier(),
        fat: fat.fat,
        fatStatus: fat.status,
      };
    `);

    // === CALORIE AND STRENGTH CHECK METHODS ===

    obj.setMethod('getArmPath', `
      /** Get the arm path from hand to torso for a given side.
       *  @param side - 'right' or 'left'
       *  @returns Array of parts: [hand, forearm, arm, shoulder, torso]
       */
      const side = args[0]; // 'right' or 'left'
      const body = await self.getBody();
      if (!body) return [];

      const path = [];
      const shoulder = await body.getPart(side + 'Shoulder');
      if (!shoulder) return [];

      const arm = await shoulder.getPart('arm');
      if (!arm) return [shoulder, body];

      const forearm = await arm.getPart('forearm');
      if (!forearm) return [arm, shoulder, body];

      const hand = await forearm.getPart('hand');
      if (!hand) return [forearm, arm, shoulder, body];

      return [hand, forearm, arm, shoulder, body];
    `);

    obj.setMethod('getBothArmPaths', `
      /** Get both arm paths for two-handed operations.
       *  @returns Object with right and left arm paths
       */
      const rightPath = await self.getArmPath('right');
      const leftPath = await self.getArmPath('left');
      return { right: rightPath, left: leftPath };
    `);

    obj.setMethod('getTotalCalories', `
      /** Get total calories stored in the body.
       *  @returns Total calorie count across all body parts
       */
      const body = await self.getBody();
      if (!body) return 0;

      let total = body.calories || 0;

      // Add limb calories
      const armPaths = await self.getBothArmPaths();
      for (const path of [armPaths.right, armPaths.left]) {
        for (const part of path) {
          if (part && part !== body) {
            total += part.calories || 0;
          }
        }
      }

      // Add leg calories
      for (const side of ['right', 'left']) {
        const thigh = await body.getPart(side + 'Thigh');
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              total += leg.calories || 0;
            }
          }
        }
      }

      return total;
    `);

    obj.setMethod('strengthCheck', `
      /** Check if a body part path can handle a given weight.
       *  @param weight - Weight in grams
       *  @param path - Array of body parts from extremity to torso
       *  @returns Object with canLift, canHold, canDrag, capacities, calories
       */
      const weight = args[0]; // in grams
      const path = args[1]; // array of body parts from extremity to torso

      if (!path || path.length === 0) {
        return { canLift: false, canHold: false, canDrag: false, error: 'No body path available' };
      }

      // Find the weakest link in the chain
      let minStrength = Infinity;
      let minCalories = Infinity;
      let weakestPart = null;
      let lowestCaloriePart = null;
      let totalPathStrength = 0;

      for (const part of path) {
        if (!part) continue;
        const str = part.strength || 0;
        const cal = part.calories || 0;

        totalPathStrength += str;

        if (str > 0 && str < minStrength) {
          minStrength = str;
          weakestPart = part;
        }
        if (cal < minCalories) {
          minCalories = cal;
          lowestCaloriePart = part;
        }
      }

      // Each strength point gives ~5kg lift capacity
      // Weakest link determines max lift
      const liftCapacity = minStrength * 5000; // grams
      // Can hold longer at lower weights - hold capacity is 2x lift
      const holdCapacity = minStrength * 10000;
      // Dragging uses legs primarily but arms help - much higher capacity
      const dragCapacity = minStrength * 25000;

      // Calorie cost scales with weight relative to capacity
      // Lifting something at max capacity costs ~10 cal/action
      // Holding costs ~1 cal/second at max capacity
      const liftCaloriesNeeded = Math.ceil((weight / liftCapacity) * 10);
      const holdCaloriesPerSecond = Math.ceil((weight / holdCapacity) * 1);

      // Check if we have enough calories
      const hasCalories = minCalories >= liftCaloriesNeeded;

      return {
        canLift: weight <= liftCapacity && hasCalories,
        canHold: weight <= holdCapacity && hasCalories,
        canDrag: weight <= dragCapacity && hasCalories,
        liftCapacity,
        holdCapacity,
        dragCapacity,
        weight,
        weakestPart: weakestPart?.name || 'unknown',
        lowestCaloriePart: lowestCaloriePart?.name || 'unknown',
        minCalories,
        liftCaloriesNeeded,
        holdCaloriesPerSecond,
        hasCalories,
      };
    `);

    obj.setMethod('burnCalories', `
      /** Burn calories from body parts doing work.
       *  Distributes calorie burn across the path proportionally.
       *  @param path - Array of body parts
       *  @param amount - Total calories to burn
       */
      const path = args[0]; // array of body parts
      const amount = args[1]; // total calories to burn
      const body = await self.getBody();

      if (!path || path.length === 0 || !body) return;

      // Distribute burn across parts with calories
      const partsWithCalories = path.filter(p => p && (p.calories || 0) > 0);
      if (partsWithCalories.length === 0) {
        // Fall back to torso
        body.calories = Math.max(0, (body.calories || 0) - amount);
        return;
      }

      const perPart = Math.ceil(amount / partsWithCalories.length);
      for (const part of partsWithCalories) {
        const current = part.calories || 0;
        const burned = Math.min(current, perPart);
        part.set('calories', current - burned);
      }
    `);

    obj.setMethod('replenishCalories', `
      /** Replenish calories from eating (distributes to body and limbs).
       *  Excess calories stored as fat.
       *  @param amount - Calories from food
       *  @returns Object with absorbed and storedAsFat counts
       */
      const amount = args[0]; // calories from food
      const body = await self.getBody();
      if (!body) return { absorbed: 0, storedAsFat: 0 };

      // First fill torso (main storage), then distribute to limbs
      const torsoMax = body.maxCalories || 3000;
      const torsoCurrent = body.calories || 0;
      const torsoSpace = torsoMax - torsoCurrent;
      const toTorso = Math.min(amount, torsoSpace);
      body.set('calories', torsoCurrent + toTorso);

      let remaining = amount - toTorso;
      if (remaining <= 0) return { absorbed: amount, storedAsFat: 0 };

      // Distribute remainder to limbs
      const limbs = [];
      const armPaths = await self.getBothArmPaths();
      for (const path of [armPaths.right, armPaths.left]) {
        for (const part of path) {
          if (part && part !== body && (part.maxCalories || 0) > 0) {
            limbs.push(part);
          }
        }
      }

      // Add legs
      for (const side of ['right', 'left']) {
        const thigh = await body.getPart(side + 'Thigh');
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg && (leg.maxCalories || 0) > 0) {
              limbs.push(leg);
            }
          }
        }
      }

      // Distribute evenly to limbs
      if (limbs.length > 0) {
        const perLimb = Math.floor(remaining / limbs.length);
        for (const limb of limbs) {
          const max = limb.maxCalories || 0;
          const current = limb.calories || 0;
          const space = max - current;
          const toLimb = Math.min(perLimb, space);
          limb.set('calories', current + toLimb);
          remaining -= toLimb;
        }
      }

      // If still remaining, store as fat (1 fat = 100 calories)
      let storedAsFat = 0;
      if (remaining > 0) {
        const currentFat = body.fat || 0;
        const maxFat = body.maxFat || 100;
        const fatSpace = maxFat - currentFat;

        // Convert calories to fat: 100 cal = 1 fat unit
        const fatToAdd = Math.min(Math.floor(remaining / 100), fatSpace);
        if (fatToAdd > 0) {
          body.set('fat', currentFat + fatToAdd);
          storedAsFat = fatToAdd;
          remaining -= fatToAdd * 100;
        }
      }

      return { absorbed: amount - remaining, storedAsFat };
    `);

    obj.setMethod('digestTick', `
      /** Process stomach contents and absorb calories.
       *  Called periodically by heartbeat. Burns fat if needed.
       *  @returns Object with digested calories, fatBurned, fatGained
       */
      const body = await self.getBody();
      if (!body) return { digested: 0, fatBurned: 0 };

      const stomach = await body.getPart('digestiveStomach');
      let digestedCalories = 0;

      // First try to digest food in stomach
      if (stomach && stomach.digest) {
        digestedCalories = await stomach.digest();
      }

      // Replenish body with extracted calories
      let fatGained = 0;
      if (digestedCalories > 0) {
        const result = await self.replenishCalories(digestedCalories);
        fatGained = result.storedAsFat || 0;
      }

      // If stomach is empty and we're low on calories, burn fat
      let fatBurned = 0;
      const stomachContents = stomach ? (stomach.contents || []) : [];
      const currentCalories = body.calories || 0;
      const maxCalories = body.maxCalories || 3000;
      const caloriePercent = currentCalories / maxCalories;

      // Start burning fat when below 50% calories and stomach is empty
      if (stomachContents.length === 0 && caloriePercent < 0.5) {
        const currentFat = body.fat || 0;
        if (currentFat > 0) {
          // Burn fat to replenish calories
          // Burn more aggressively when more depleted
          const urgency = 1 - (caloriePercent * 2); // 1.0 at 0%, 0.0 at 50%
          const fatToBurn = Math.max(1, Math.ceil(urgency * 3)); // 1-3 fat per tick
          const actualBurn = Math.min(fatToBurn, currentFat);

          body.set('fat', currentFat - actualBurn);
          fatBurned = actualBurn;

          // Convert fat back to calories (1 fat = 100 cal)
          const caloriesFromFat = actualBurn * 100;
          await self.replenishCalories(caloriesFromFat);
        }
      }

      return { digested: digestedCalories, fatBurned, fatGained };
    `);

    obj.setMethod('getStomachContents', `
      /** Get stomach contents (for examining corpses, etc).
       *  @returns Array of item RuntimeObjects in stomach
       */
      const body = await self.getBody();
      if (!body) return [];

      const stomach = await body.getPart('digestiveStomach');
      if (!stomach) return [];

      const contents = stomach.contents || [];
      const items = [];
      for (const itemId of contents) {
        const item = await $.load(itemId);
        if (item) {
          items.push(item);
        }
      }
      return items;
    `);

    obj.setMethod('getFat', `
      /** Get current fat level and status.
       *  @returns Object with fat, maxFat, percentage, status
       */
      const body = await self.getBody();
      if (!body) return { fat: 0, maxFat: 100, percentage: 0, status: 'lean' };

      const fat = body.fat || 0;
      const maxFat = body.maxFat || 100;
      const percentage = Math.round((fat / maxFat) * 100);

      // Status description based on fat percentage
      const status = await $.proportional.sub(
        ['lean', 'fit', 'soft', 'overweight', 'obese', 'morbidly obese'],
        fat,
        maxFat
      );

      return { fat, maxFat, percentage, status };
    `);

    obj.setMethod('getFatModifier', `
      /** Get fat modifier for stats (dexterity, speed, stealth).
       *  Returns multiplier: 1.0 = no penalty, lower = penalty.
       *  No penalty for fat <= 20% (healthy weight).
       *  @returns Modifier between 0.5 and 1.0
       */
      const body = await self.getBody();
      if (!body) return 1.0;

      const fat = body.fat || 0;
      const maxFat = body.maxFat || 100;

      // No penalty for healthy weight (very lean through healthy-looking)
      // ~20% of maxFat is the threshold
      const healthyThreshold = Math.floor(maxFat * 0.2); // 20 for maxFat=100
      if (fat <= healthyThreshold) return 1.0;

      // Penalty only applies to fat above healthy threshold
      // Scales from 1.0 at threshold to 0.5 at max fat
      const excessFat = fat - healthyThreshold;
      const excessRange = maxFat - healthyThreshold; // 80 for maxFat=100
      const penalty = (excessFat / excessRange) * 0.5; // 0 to 0.5

      return Math.max(0.5, 1.0 - penalty);
    `);

    obj.setMethod('getCalorieStatus', `
      /** Get calorie status for display.
       *  @returns Object with status, percentage, total, maxTotal, feeling
       */
      const body = await self.getBody();
      if (!body) return { status: 'no body', percentage: 0, feeling: '' };

      const total = await self.getTotalCalories();
      // Rough max based on body + 2 arms + 2 legs
      // torso: 3000 + 2*(arm:150 + hand:75) + 2*(leg:300) = 3000 + 450 + 600 = 4050
      const maxTotal = 4050;
      const percentage = Math.round((total / maxTotal) * 100);

      const status = await $.proportional.sub(
        ['exhausted', 'starving', 'very hungry', 'hungry', 'satisfied', 'well-fed'],
        total,
        maxTotal
      );

      // Feeling is how the player experiences their calorie level
      const feeling = await $.proportional.sub(
        [
          'completely drained, barely able to move',
          'weak and shaky from hunger',
          'very hungry, stomach growling',
          'hungry, could use a meal',
          'comfortable and satisfied',
          'energized and well-fed'
        ],
        total,
        maxTotal
      );

      return { status, percentage, total, maxTotal, feeling };
    `);

    obj.setMethod('getFeeling', `
      /** Get how the player feels overall.
       *  Combines calorie status, sleep, fat, sedation.
       *  @returns Description string of current feeling
       */
      const calorieStatus = await self.getCalorieStatus();
      const fatInfo = await self.getFat();
      const sleepState = self.sleepState || 'awake';

      const parts = [];

      // Sleep state feeling
      if (sleepState === 'falling_asleep') {
        parts.push('drowsy and drifting off');
      } else if (sleepState === 'waking_up') {
        parts.push('groggy and waking');
      } else if (sleepState === 'asleep') {
        parts.push('asleep');
      }

      // Calorie feeling (only mention if notable)
      if (calorieStatus.percentage < 50) {
        parts.push(calorieStatus.feeling);
      } else if (calorieStatus.percentage >= 90) {
        parts.push('well-fed');
      }

      // Fat feeling (only mention if notable)
      if (fatInfo.fat >= 50) {
        const fatFeeling = await $.proportional.sub(
          ['sluggish', 'heavy', 'labored'],
          fatInfo.fat - 50,
          50
        );
        parts.push(fatFeeling);
      }

      // Sedation
      const sedation = self.sedation || 0;
      if (sedation > 0) {
        const sedFeeling = await $.proportional.sub(
          ['slightly foggy', 'sedated', 'heavily drugged'],
          sedation,
          10
        );
        parts.push(sedFeeling);
      }

      if (parts.length === 0) {
        return 'normal';
      }

      return parts.join(', ');
    `);

    return obj;
  }
}
