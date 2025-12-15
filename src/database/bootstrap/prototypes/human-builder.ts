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

      // Describe what they're holding
      const hands = await self.getHands();
      const body = await self.getBody();
      const primarySide = body?.primaryHand || 'right';
      const secondarySide = primarySide === 'right' ? 'left' : 'right';

      const heldItems = [];

      // Helper to get items from a hand
      const getHandItems = async (hand, side) => {
        if (!hand) return [];
        const contents = hand.contents || [];
        const items = [];
        for (const itemId of contents) {
          const item = await $.load(itemId);
          if (item) {
            items.push({ name: item.name, side: side });
          }
        }
        return items;
      };

      // Get items from each hand
      if (hands.primary) {
        const primaryItems = await getHandItems(hands.primary, primarySide);
        heldItems.push(...primaryItems);
      }
      if (hands.secondary) {
        const secondaryItems = await getHandItems(hands.secondary, secondarySide);
        heldItems.push(...secondaryItems);
      }

      if (heldItems.length > 0) {
        // Format each item with its hand location
        const itemDescriptions = heldItems.map(i => i.name + ' in ' + self.pronoun('possessive') + ' ' + i.side + ' hand');
        const itemList = await $.format.prose(itemDescriptions);
        const subject = self.pronoun('subject');
        // Capitalize first letter
        const capSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
        desc += capSubject + ' is holding ' + itemList + '.\\r\\n';
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

    // Initialize basic verbs for AI-controlled humans
    // Players get verbs in connect(), but AI humans need them set up explicitly
    obj.setMethod('initVerbs', `
      /** Initialize basic communication and interaction verbs for AI-controlled humans.
       *  Call this after spawning an AI human so they can speak, emote, look, etc.
       */
      // Communication verbs
      await self.registerVerb(['say %s', '"%s', "'" + "%s"], self, 'say');
      await self.registerVerb(['emote %s', ':%s'], self, 'emote');

      // Looking verbs
      await self.registerVerb(['look', 'l'], self, 'look');
      await self.registerVerb(['look %i', 'look at %i', 'l %i', 'examine %i', 'ex %i'], self, 'lookAt');

      // Movement verbs - will be added by room when AI enters
      // Pickup/drop verbs
      await self.registerVerb(['get %i', 'take %i', 'pick up %i', 'grab %i'], self, 'get');
      await self.registerVerb(['drop %i', 'put down %i', 'release %i'], self, 'drop');
      await self.registerVerb(['give %i to %i'], self, 'give');

      // If we have a location, trigger onArrived to register room verbs
      if (self.location && self.location !== 0) {
        const location = await $.load(self.location);
        if (location && self.onArrived) {
          await self.onArrived(location, null, null);
        }
      }

      return true;
    `);

    // Say method for AI humans (players have this in player-builder)
    obj.setMethod('say', `
      /** Say something out loud.
       *  Usage: say <message>
       *  Speaks to everyone in the current room.
       */
      const message = args[0]; // First captured %s from verb pattern

      if (!message || !message.trim()) {
        return 'Say what?';
      }

      // Get current location
      const location = self.location ? await $.load(self.location) : null;
      if (!location) {
        return 'You have nowhere to speak.';
      }

      // Announce to room with proper message structure
      const trimmedMessage = message.trim();
      if (location.announce) {
        await location.announce(self, null, {
          actor: 'You say, "' + trimmedMessage + '"',
          others: self.name + ' says, "' + trimmedMessage + '"'
        });
      }

      return ''; // Actor already received message via announce
    `);

    // Directed speech - "to <target> <message>" - triggers NPC reactions
    obj.setMethod('to', `
      /** Speak directly to someone.
       *  Usage: to <name> <message>
       *  Addresses a specific person, triggering their attention.
       */
      const targetName = args[0];
      const message = args[1];

      if (!targetName) {
        return 'Speak to whom?';
      }
      if (!message || !message.trim()) {
        return 'Say what to ' + targetName + '?';
      }

      // Get current location
      const location = self.location ? await $.load(self.location) : null;
      if (!location) {
        return 'You have nowhere to speak.';
      }

      // Find target in location
      const contents = location.contents || [];
      let target = null;
      for (const ref of contents) {
        const contentId = typeof ref === 'object' ? ref.value : ref;
        const obj = await $.load(contentId);
        if (obj && obj.name && obj.name.toLowerCase().includes(targetName.toLowerCase())) {
          target = obj;
          break;
        }
      }

      if (!target) {
        return 'You don\\'t see anyone named "' + targetName + '" here.';
      }

      const trimmedMessage = message.trim();

      // Announce to room
      if (location.announce) {
        await location.announce(self, target, {
          actor: 'You say to ' + target.name + ', "' + trimmedMessage + '"',
          target: self.name + ' says to you, "' + trimmedMessage + '"',
          others: self.name + ' says to ' + target.name + ', "' + trimmedMessage + '"'
        });
      }

      // Emit directed speech event for NPC agent service
      if ($._emitGameEvent) {
        await $._emitGameEvent({
          type: 'directed_speech',
          data: {
            speakerId: self.id,
            speakerName: self.name,
            targetId: target.id,
            targetName: target.name,
            message: trimmedMessage,
            locationId: location.id,
          },
          timestamp: new Date().toISOString(),
          processed: false,
        });
      }

      return '';
    `);

    // Emote method for AI humans
    obj.setMethod('emote', `
      /** Perform an emote/action.
       *  Usage: emote <action>, :<action>
       *  Shows your character performing an action.
       */
      const action = args[0]; // First captured %s from verb pattern

      if (!action || !action.trim()) {
        return 'Emote what?';
      }

      // Get current location
      const location = self.location ? await $.load(self.location) : null;
      if (!location) {
        return;
      }

      // Announce to room with proper message structure
      const trimmedAction = action.trim();
      const announcement = self.name + ' ' + trimmedAction;
      if (location.announce) {
        await location.announce(self, null, {
          actor: announcement,
          others: announcement
        });
      }
    `);

    // Look method for AI humans
    obj.setMethod('look', `
      /** Look at the current room.
       *  Usage: look, l
       *  Describes your surroundings.
       */
      const location = self.location ? await $.load(self.location) : null;
      if (!location) {
        return 'You are in a void.';
      }

      const desc = await location.describe(self);
      return desc;
    `);

    // Look at specific item/person
    obj.setMethod('lookAt', `
      /** Look at something specific.
       *  Usage: look <target>, examine <target>
       */
      const target = args[0]; // Resolved item from %i

      if (!target) {
        return 'Look at what?';
      }

      if (target.describe) {
        return await target.describe(self);
      }

      return target.description || 'You see nothing special.';
    `);

    // Get method for AI humans
    obj.setMethod('get', `
      /** Pick up an item.
       *  Usage: get <item>, take <item>
       */
      const item = args[0]; // Resolved item from %i

      if (!item) {
        return 'Get what?';
      }

      // Check if bolted down
      if (item.boltedDown) {
        return 'That is firmly attached and cannot be moved.';
      }

      // Simple pickup - add to inventory
      const inventory = self.inventory || [];
      inventory.push(item.id);
      self.inventory = inventory;

      // Update item location
      item.set('location', self.id);

      // Announce to room with proper message structure
      const location = self.location ? await $.load(self.location) : null;
      if (location && location.announce) {
        await location.announce(self, null, {
          actor: 'You pick up ' + item.name + '.',
          others: self.name + ' picks up ' + item.name + '.'
        });
      }

      return ''; // Actor already received message via announce
    `);

    // Drop method for AI humans
    obj.setMethod('drop', `
      /** Drop an item.
       *  Usage: drop <item>
       */
      const item = args[0]; // Resolved item from %i

      if (!item) {
        return 'Drop what?';
      }

      // Check if we have it
      const inventory = self.inventory || [];
      const idx = inventory.indexOf(item.id);
      if (idx === -1) {
        return 'You are not carrying ' + item.name + '.';
      }

      // Remove from inventory
      inventory.splice(idx, 1);
      self.inventory = inventory;

      // Move to current location
      const location = self.location ? await $.load(self.location) : null;
      if (location) {
        item.set('location', location.id);

        // Add to room contents
        const contents = location.contents || [];
        if (!contents.includes(item.id)) {
          contents.push(item.id);
          location.set('contents', contents);
        }

        // Announce with proper message structure
        if (location.announce) {
          await location.announce(self, null, {
            actor: 'You drop ' + item.name + '.',
            others: self.name + ' drops ' + item.name + '.'
          });
        }
      }

      return ''; // Actor already received message via announce
    `);

    // Give method - transfer item to someone using hands
    obj.setMethod('give', `
      /** Give an item to someone.
       *  Usage: give <item> to <recipient>
       *  Transfers an item from your hand to another person's hand.
       */
      const item = args[0];      // Resolved item from %i
      const recipient = args[1]; // Resolved recipient from %i

      if (!item) {
        return 'Give what?';
      }
      if (!recipient) {
        return 'Give ' + item.name + ' to whom?';
      }
      if (recipient.id === player.id) {
        return 'You already have it.';
      }

      // Get our hands and check if we're holding the item
      const ourHands = await player.getHands();
      if (!ourHands || ourHands.both.length === 0) {
        return 'You have no hands.';
      }

      let holdingHand = null;
      for (const hand of ourHands.both) {
        const contents = hand.contents || [];
        if (contents.includes(item.id)) {
          holdingHand = hand;
          break;
        }
      }

      if (!holdingHand) {
        return 'You are not holding ' + item.name + '.';
      }

      // Get recipient's hands
      const theirHands = await recipient.getHands();
      if (!theirHands || theirHands.both.length === 0) {
        return recipient.name + ' has no hands to receive with.';
      }

      // Find an empty hand on recipient (primary first)
      let targetHand = null;
      const body = await recipient.getBody();
      const primaryHand = body?.primaryHand || 'right';

      if (theirHands.primary && (theirHands.primary.contents || []).length === 0) {
        targetHand = theirHands.primary;
      } else if (theirHands.secondary && (theirHands.secondary.contents || []).length === 0) {
        targetHand = theirHands.secondary;
      }

      if (!targetHand) {
        return recipient.name + "'s hands are full.";
      }

      // Move item from our hand to their hand
      const result = await item.moveTo(targetHand, recipient);
      if (typeof result === 'string') {
        return result; // Move was rejected
      }

      // Announce to room
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        await location.announce(player, recipient, {
          actor: 'You give ' + item.name + ' to ' + recipient.name + '.',
          target: player.name + ' gives you ' + item.name + '.',
          others: player.name + ' gives ' + item.name + ' to ' + recipient.name + '.'
        });
      }

      // Emit game event for NPC agent service
      if ($._emitGameEvent) {
        await $._emitGameEvent({
          type: 'item_received',
          data: {
            giverId: player.id,
            giverName: player.name,
            recipientId: recipient.id,
            recipientName: recipient.name,
            itemId: item.id,
            itemName: item.name,
            locationId: location ? location.id : null,
          },
          timestamp: new Date().toISOString(),
          processed: false,
        });
      }

      return '';
    `);

    return obj;
  }
}
