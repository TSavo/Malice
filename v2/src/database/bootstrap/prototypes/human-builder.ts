import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Human prototype
 * Base prototype for human-like agents with pronouns, age, etc.
 *
 * Inherits from Embodied, which provides:
 * - Body access methods (getBody, getHead, getHands, etc.)
 * - Sensory methods (see, hear, smell, taste, speak)
 * - Calorie/fat/decay metabolism
 *
 * Human adds:
 * - Human-specific properties (sex, pronouns, age, species, height, weight)
 * - Language understanding
 * - Human body structure (2 arms, 2 legs)
 * - Stat aggregation (strength, dexterity, etc.)
 * - Appearance description
 */
export class HumanBuilder {
  constructor(private manager: ObjectManager) {}

  async build(embodiedId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: embodiedId,
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
        // Appearance properties
        height: 1.7, // meters
        weight: 75, // kg
        // Known languages (for understanding speech)
        knownLanguages: ['English'],
        nativeLanguage: 'English',
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

    // Override hear to add language understanding
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

    // === STAT AGGREGATION METHODS (calorie-based) ===
    // All stats derive from effective capacity: maxCalories - decayLevel
    // This represents muscle mass minus injury damage

    // Helper to get effective capacity of a body part
    obj.setMethod('getEffectiveCapacity', `
      /** Get effective capacity of a body part.
       *  effectiveCapacity = maxCalories - decayLevel
       *  @param part - The body part to check
       *  @returns Effective capacity (0 if missing)
       */
      const part = args[0];
      if (!part) return 0;
      const maxCal = part.maxCalories || 0;
      const decay = part.decayLevel || 0;
      return Math.max(0, maxCal - decay);
    `);

    obj.setMethod('getStrength', `
      /** Get total strength (torso + arms + legs effective capacity).
       *  Based on calorie system - larger muscles = more strength.
       *  @returns Total strength (sum of effective capacities)
       */
      let total = 0;
      const body = await self.getBody();
      if (!body) return 0;

      // Torso core strength
      total += await self.getEffectiveCapacity(body);

      // Arms (shoulders contain the arm chain)
      for (const partName of ['rightShoulder', 'leftShoulder']) {
        const shoulder = await body.getPart(partName);
        if (shoulder) {
          const arm = await shoulder.getPart('arm');
          if (arm) {
            total += await self.getEffectiveCapacity(arm);
          }
        }
      }

      // Legs (largest muscle group)
      for (const partName of ['rightThigh', 'leftThigh']) {
        const thigh = await body.getPart(partName);
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              total += await self.getEffectiveCapacity(leg);
            }
          }
        }
      }

      return total;
    `);

    obj.setMethod('getDexterity', `
      /** Get total dexterity (hands + feet effective capacity).
       *  Fine motor control from extremities. Affected by fat.
       *  @returns Total dexterity
       */
      let total = 0;
      const body = await self.getBody();
      if (!body) return 0;

      // Hands (primary dexterity)
      for (const partName of ['rightShoulder', 'leftShoulder']) {
        const shoulder = await body.getPart(partName);
        if (shoulder) {
          const arm = await shoulder.getPart('arm');
          if (arm) {
            const forearm = await arm.getPart('forearm');
            if (forearm) {
              const hand = await forearm.getPart('hand');
              if (hand) {
                total += await self.getEffectiveCapacity(hand);
              }
            }
          }
        }
      }

      // Feet (balance/coordination)
      for (const partName of ['rightThigh', 'leftThigh']) {
        const thigh = await body.getPart(partName);
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              const foot = await leg.getPart('foot');
              if (foot) {
                // Feet don't have calories, use existence as binary
                total += 25; // Base dexterity contribution from each foot
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
      /** Get intelligence stat (from head effective capacity).
       *  @returns Intelligence stat
       */
      const head = await self.getHead();
      if (!head) return 0;
      return await self.getEffectiveCapacity(head);
    `);

    obj.setMethod('getPerception', `
      /** Get total perception stat (eyes + ears effective capacity).
       *  @returns Total perception stat
       */
      let total = 0;

      const eyes = await self.getEyes();
      for (const eye of eyes) {
        if (eye) {
          total += await self.getEffectiveCapacity(eye);
        }
      }

      const ears = await self.getEars();
      for (const ear of ears) {
        if (ear) {
          total += await self.getEffectiveCapacity(ear);
        }
      }

      return total;
    `);

    obj.setMethod('getSpeed', `
      /** Get derived speed stat (leg effective capacity).
       *  Heavily affected by fat modifier.
       *  @returns Speed stat
       */
      let legTotal = 0;

      const body = await self.getBody();
      if (!body) return 0;

      for (const partName of ['rightThigh', 'leftThigh']) {
        const thigh = await body.getPart(partName);
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              legTotal += await self.getEffectiveCapacity(leg);
            }
          }
        }
      }

      // Apply fat penalty (speed is more affected by fat)
      const fatMod = await self.getFatModifier();
      // Speed penalty is double the normal fat penalty
      const speedMod = 1.0 - ((1.0 - fatMod) * 2);
      return Math.floor(legTotal * Math.max(0.25, speedMod));
    `);

    obj.setMethod('getStats', `
      /** Get all stats as an object.
       *  All stats derived from effective capacity (maxCalories - decayLevel).
       *  @returns Object with all stat values
       */
      const fat = await self.getFat();
      const calories = await self.getCalorieStatus();
      return {
        strength: await self.getStrength(),
        dexterity: await self.getDexterity(),
        intelligence: await self.getIntelligence(),
        perception: await self.getPerception(),
        speed: await self.getSpeed(),
        fatModifier: await self.getFatModifier(),
        fat: fat.fat,
        fatStatus: fat.status,
        calories: calories.total,
        calorieStatus: calories.status,
      };
    `);

    return obj;
  }
}
