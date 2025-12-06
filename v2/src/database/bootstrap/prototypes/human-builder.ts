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
      const type = args[0]; // 'subject', 'object', 'possessive'
      return self.pronouns[type] || 'they';
    `);

    // Get the body (torso root)
    obj.setMethod('getBody', `
      if (self.body) {
        return await $.load(self.body);
      }
      return null;
    `);

    // Get head (for sensory access)
    obj.setMethod('getHead', `
      const body = await self.getBody();
      if (body) {
        return await body.getPart('head');
      }
      return null;
    `);

    // Get mouth (for speaking)
    obj.setMethod('getMouth', `
      const head = await self.getHead();
      if (head) {
        const face = await head.getPart('face');
        if (face) {
          return await face.getPart('mouth');
        }
      }
      return null;
    `);

    // Get ears (for hearing) - returns array of ear parts
    obj.setMethod('getEars', `
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

    // Get eyes (for seeing) - returns array of eye parts
    obj.setMethod('getEyes', `
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

    // Get hands - returns { primary, secondary, both }
    obj.setMethod('getHands', `
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

    // DELEGATION: speak() - route through mouth
    // Returns the speech object that gets broadcast to the room
    obj.setMethod('speak', `
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

    // DELEGATION: hear() - route through ears
    // Ears pass through sound, understanding is based on knownLanguages
    // Usage: player.hear(message, language, source)
    //   - message: string or speech object
    //   - language: optional language string (default: English)
    //   - source: optional source object (who is speaking)
    obj.setMethod('hear', `
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

    // DELEGATION: see() - route through eyes
    // If can see, sends message via tell() and returns true
    // If blind/unconscious, returns false (message not delivered)
    obj.setMethod('see', `
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

    // Handle incoming sensation from body parts
    obj.setMethod('onSensation', `
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

    // Handle critical damage (death)
    obj.setMethod('onCriticalDamage', `
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

    // Resolve all contents including body
    obj.setMethod('resolveAllContents', `
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

    // Generate appearance description from body parts
    obj.setMethod('describeAppearance', `
      const viewer = args[0]; // Who is looking
      const parts = [];

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

    // Override describe to include appearance
    obj.setMethod('describe', `
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

    // Get total strength (torso + arms + hands + legs)
    obj.setMethod('getStrength', `
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

    // Get total dexterity (hands + legs + feet)
    obj.setMethod('getDexterity', `
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

      return total;
    `);

    // Get intelligence (from head)
    obj.setMethod('getIntelligence', `
      const head = await self.getHead();
      if (!head) return 0;
      return head.iq || 0;
    `);

    // Get perception (eyes + ears)
    obj.setMethod('getPerception', `
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

    // Get derived speed (leg strength + leg dexterity)
    obj.setMethod('getSpeed', `
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
      return Math.floor((legStrength + legDexterity) / 2);
    `);

    // Get all stats as an object
    obj.setMethod('getStats', `
      return {
        strength: await self.getStrength(),
        dexterity: await self.getDexterity(),
        intelligence: await self.getIntelligence(),
        perception: await self.getPerception(),
        speed: await self.getSpeed(),
      };
    `);

    return obj;
  }
}
