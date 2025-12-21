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
  constructor(private manager: ObjectManager) { }

  /**
   * Build the Human prototype or rebuild methods on existing object
   * @param embodiedId - Parent embodied ID (only used when creating new)
   * @param existingObj - Optional existing object to rebuild methods on
   */
  async build(embodiedId: number, existingObj?: RuntimeObject): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(embodiedId);
    const obj = existingObj || await this.manager.create({
      parent: parentObj!,
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
      let source = null;
      if (typeof messageOrSpeech === 'string') {
        // Called as hear(message, language?, source?)
        const language = typeof languageOrSource === 'string' ? languageOrSource : 'English';
        source = typeof languageOrSource === 'object' ? languageOrSource : sourceArg;
        speech = {
          type: 'speech',
          content: messageOrSpeech,
          language: language,
          speaker: source || null,
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

      // Record to sensory history for AI awareness
      if (self.recordSensory && result) {
        await self.recordSensory('hear', result.content, source);
      }

      // Call perception filter onHear hooks
      const filters = self.perceptionFilters || [];
      for (const entry of filters) {
        const filter = entry.filter;
        if (filter && filter.onHear) {
          await filter.onHear(result.content, source);
        }
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
        for (const item of contents) {
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
      await self.registerVerb(['to %s'], self, 'to');
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
        const location = self.location;
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
      const location = self.location || null;
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

    // NOTE: 'to' verb moved to agent-builder.ts (includes perception filter support)

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
      const location = self.location || null;
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
      const location = self.location || null;
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

    // Get method for AI humans - uses hands properly for verb registration
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

      // Get hands
      const hands = await self.getHands();
      if (!hands || hands.both.length === 0) {
        return 'You have no hands to pick things up with.';
      }

      // Find an empty hand (primary first)
      let targetHand = null;
      if (hands.primary && (hands.primary.contents || []).length === 0) {
        targetHand = hands.primary;
      } else if (hands.secondary && (hands.secondary.contents || []).length === 0) {
        targetHand = hands.secondary;
      }

      if (!targetHand) {
        return 'Your hands are full.';
      }

      // Move item to hand - this triggers onArrived for verb registration
      const result = await item.moveTo(targetHand, self);
      if (typeof result === 'string') {
        return result; // Move was rejected
      }

      // Announce to room with proper message structure
      const location = self.location || null;
      if (location && location.announce) {
        await location.announce(self, null, {
          actor: 'You pick up ' + item.name + '.',
          others: self.name + ' picks up ' + item.name + '.'
        });
      }

      return ''; // Actor already received message via announce
    `);

    // Drop method for AI humans - uses moveTo properly
    obj.setMethod('drop', `
      /** Drop an item.
       *  Usage: drop <item>
       */
      const item = args[0]; // Resolved item from %i

      if (!item) {
        return 'Drop what?';
      }

      // Check if item is in one of our hands
      const hands = await self.getHands();
      if (!hands || hands.both.length === 0) {
        return 'You have no hands.';
      }

      let holdingHand = null;
      for (const hand of hands.both) {
        const contents = hand.contents || [];
        if (contents.includes(item.id)) {
          holdingHand = hand;
          break;
        }
      }

      if (!holdingHand) {
        return 'You are not holding ' + item.name + '.';
      }

      // Move to current location using moveTo
      const location = self.location || null;
      if (!location) {
        return 'You are nowhere.';
      }

      const result = await item.moveTo(location, self);
      if (typeof result === 'string') {
        return result; // Move was rejected
      }

      // Announce with proper message structure
      if (location.announce) {
        await location.announce(self, null, {
          actor: 'You drop ' + item.name + '.',
          others: self.name + ' drops ' + item.name + '.'
        });
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
      if (recipient === self) {
        return 'You already have it.';
      }

      // Get our hands and check if we're holding the item
      const ourHands = await self.getHands();
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
      const location = self.location || null;
      if (location && location.announce) {
        await location.announce(self, recipient, {
          actor: 'You give ' + item.name + ' to ' + recipient.name + '.',
          target: self.name + ' gives you ' + item.name + '.',
          others: self.name + ' gives ' + item.name + ' to ' + recipient.name + '.'
        });
      }

      // Trigger AI response if recipient has onItemReceived handler
      if (recipient.onItemReceived) {
        recipient.onItemReceived(self, item);
      }

      return '';
    `);

    // ═══════════════════════════════════════════════════════════════════
    // AI AGENT METHODS
    // These enable AI-controlled NPCs to respond to interactions
    // ═══════════════════════════════════════════════════════════════════

    // Format personality for system prompt
    obj.setMethod('formatPersonality', `
      /** Format personality object/string for system prompt injection. */
      const personality = args[0];
      if (!personality) return '';

      const lines = ['\\nPERSONALITY:'];

      if (typeof personality === 'string') {
        lines.push(personality);
      } else {
        if (personality.traits && personality.traits.length > 0) {
          lines.push('Traits: ' + personality.traits.join(', '));
        }
        if (personality.quirks && personality.quirks.length > 0) {
          lines.push('Quirks: ' + personality.quirks.join(', '));
        }
        if (personality.values && personality.values.length > 0) {
          lines.push('Values: ' + personality.values.join(', '));
        }
        if (personality.motivations && personality.motivations.length > 0) {
          lines.push('Motivations: ' + personality.motivations.join(', '));
        }
        if (personality.fears && personality.fears.length > 0) {
          lines.push('Fears: ' + personality.fears.join(', '));
        }
      }

      return lines.join('\\n');
    `);

    // Format history for system prompt
    obj.setMethod('formatHistory', `
      /** Format history object/string for system prompt injection. */
      const history = args[0];
      if (!history) return '';

      const lines = ['\\nHISTORY/BACKSTORY:'];

      if (typeof history === 'string') {
        lines.push(history);
      } else {
        if (history.backstory) {
          lines.push(history.backstory);
        }
        if (history.events && history.events.length > 0) {
          lines.push('\\nKey Events:');
          for (const event of history.events) {
            lines.push('- ' + event);
          }
        }
        if (history.relationships && Object.keys(history.relationships).length > 0) {
          lines.push('\\nRelationships:');
          for (const [person, relation] of Object.entries(history.relationships)) {
            lines.push('- ' + person + ': ' + relation);
          }
        }
        if (history.secrets && history.secrets.length > 0) {
          lines.push('\\nSecrets (do not reveal unless dramatically appropriate):');
          for (const secret of history.secrets) {
            lines.push('- ' + secret);
          }
        }
      }

      return lines.join('\\n');
    `);

    // Format memories for system prompt
    obj.setMethod('formatMemories', `
      /** Format memories array for system prompt injection. */
      const memories = args[0];
      if (!memories || memories.length === 0) return '';

      // Sort by importance: critical first, then important, then normal
      const sorted = [...memories].sort((a, b) => {
        const order = { critical: 0, important: 1, normal: 2 };
        return (order[a.importance] || 2) - (order[b.importance] || 2);
      });

      const lines = ['\\nPERSISTENT MEMORIES:'];
      lines.push('These are critical memories that persist across sessions. Reference them when relevant.\\n');

      for (const memory of sorted) {
        const prefix = memory.importance === 'critical' ? '⚠️ CRITICAL: '
          : memory.importance === 'important' ? '❗ IMPORTANT: '
          : '• ';
        const tags = memory.tags && memory.tags.length > 0 ? ' [' + memory.tags.join(', ') + ']' : '';
        lines.push(prefix + memory.text + tags);
      }

      return lines.join('\\n');
    `);

    // Format notes for system prompt
    obj.setMethod('formatNotes', `
      /** Format notes array for system prompt injection. */
      const notes = args[0];
      if (!notes || notes.length === 0) return '';

      const lines = ['\\nBUILDER NOTES:'];
      lines.push('These notes are from the game builders about your character:\\n');

      for (const note of notes) {
        const author = note.author ? ' (' + note.author + ')' : '';
        const tags = note.tags && note.tags.length > 0 ? ' [' + note.tags.join(', ') + ']' : '';
        lines.push('• ' + note.text + author + tags);
      }

      return lines.join('\\n');
    `);

    // Format sensory history for system prompt
    obj.setMethod('formatSensoryHistory', `
      /** Format sensory history for AI system prompt. */
      const history = self.sensoryHistory || [];
      if (history.length === 0) return '';

      const lines = ['\\nRECENT OBSERVATIONS:'];
      lines.push('Things you recently saw and heard. Use as context.\\n');

      // Show most recent 20 events
      const recent = history.slice(-20);

      for (const event of recent) {
        const ago = Math.round((Date.now() - event.timestamp) / 1000);
        const timeStr = ago < 60 ? ago + 's ago' : Math.round(ago/60) + 'm ago';
        const sourceName = event.source?.name || null;

        if (event.type === 'hear' && sourceName) {
          lines.push('[' + timeStr + '] ' + sourceName + ': "' + event.content + '"');
        } else if (event.type === 'hear') {
          lines.push('[' + timeStr + '] Heard: ' + event.content);
        } else {
          lines.push('[' + timeStr + '] ' + event.content);
        }
      }

      return lines.join('\\n');
    `);

    // Build the full system prompt from template
    obj.setMethod('buildAgentPrompt', `
      /** Build the system prompt for AI agent from this NPC's template.
       *  @returns Full system prompt string, or null if not AI-controlled
       */
      // Check if AI-controlled
      const ai = await $.ai;
      if (!ai || !ai.isAiControlled) return null;

      const isAI = await ai.isAiControlled(self.id);
      if (!isAI) return null;

      // Get template from this NPC's property
      const template = self.agentSystemPrompt;
      if (!template) return null;

      // Get profile from $.ai
      const profile = await ai.getProfile(self.id);
      if (!profile || !profile.success) return null;

      // Get in-game datetime (Pacific time + 85 years)
      const now = new Date();
      const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      const mooYear = pacificTime.getFullYear() + 85;
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      const datetime = months[pacificTime.getMonth()] + ' ' + pacificTime.getDate() + ', ' + mooYear;

      // Format profile sections
      const personalitySection = profile.personality ? await self.formatPersonality(profile.personality) : '';
      const historySection = profile.history ? await self.formatHistory(profile.history) : '';
      const memoriesSection = profile.memories && profile.memories.length > 0 ? await self.formatMemories(profile.memories) : '';
      const notesSection = profile.notes && profile.notes.length > 0 ? await self.formatNotes(profile.notes) : '';
      const sensorySection = await self.formatSensoryHistory();

      // Substitute template variables
      let prompt = template;
      prompt = prompt.replace(/\\{\\{name\\}\\}/g, self.name);
      prompt = prompt.replace(/\\{\\{role\\}\\}/g, profile.role || 'generic');
      prompt = prompt.replace(/\\{\\{id\\}\\}/g, String(self.id));
      prompt = prompt.replace(/\\{\\{datetime\\}\\}/g, datetime);
      prompt = prompt.replace(/\\{\\{personality\\}\\}/g, personalitySection);
      prompt = prompt.replace(/\\{\\{history\\}\\}/g, historySection);
      prompt = prompt.replace(/\\{\\{memories\\}\\}/g, memoriesSection);
      prompt = prompt.replace(/\\{\\{notes\\}\\}/g, notesSection);
      prompt = prompt.replace(/\\{\\{sensoryHistory\\}\\}/g, sensorySection);

      return prompt;
    `);

    // Called when someone speaks directly to this NPC (via "to" verb)
    // Uses mutex to serialize queries and queue incoming messages
    obj.setMethod('onSpokenTo', `
      /** Handle being spoken to directly.
       *  @param speaker - The RuntimeObject speaking to us
       *  @param message - What they said
       */
      const speaker = args[0];
      const message = args[1];

      if (!speaker || !message) return;

      // Build system prompt (returns null if not AI-controlled)
      const systemPrompt = await self.buildAgentPrompt();
      if (!systemPrompt) return; // Not AI-controlled, do nothing

      // Try to acquire the query mutex on this NPC
      // If acquired (returns false), we process immediately
      // If blocked (returns pending queue), add our message to the queue
      const pending = await $mutex.acquire(self, 'query', []);

      if (pending !== false) {
        // Query already in progress - queue this message
        pending.push({ speakerId: speaker.id, speakerName: speaker.name, message: message });
        await $mutex.update(self, 'query', pending);
        return;
      }

      // We got the lock - process this message
      await self._processSpokenMessage(speaker.id, speaker.name, message, systemPrompt);
    `);

    // Internal method to process spoken message(s)
    // After processing, checks queue and batches any pending messages into one
    obj.setMethod('_processSpokenMessage', `
      const speakerId = args[0];
      const speakerName = args[1];
      const message = args[2];
      const systemPrompt = args[3];

      // Build user prompt
      const userPrompt = speakerName + ' says to you: "' + message + '"\\n\\nRespond in character.';

      // Check if this is a chargen interviewer to add additional MCP servers
      const ai = await $.ai;
      const profile = await ai.getProfile(self.id);
      const options = {};
      if (profile && profile.role === 'chargen-interviewer') {
        options.additionalMcpServers = {
          'malice-chargen': { type: 'http', url: 'http://localhost:3002/mcp' }
        };
      }

      try {
        // Run the query (awaited, not fire-and-forget)
        const result = await $query(systemPrompt, userPrompt, self.agentSession, options);
        self.agentSession = result.session;
      } catch (err) {
        console.error('[onSpokenTo] AI error for #' + self.id + ':', err?.message || err);
      }

      // Check if there are queued messages - batch them all into one
      const pending = await $mutex.check(self, 'query');
      if (pending && pending.length > 0) {
        // Group messages by speaker and combine
        // Format: "Speaker1 says: msg1" Then "Speaker2 says: msg2"
        const parts = pending.map(p => p.speakerName + ' says: "' + p.message + '"');
        const combined = parts.join('" Then ');
        // Clear the queue
        await $mutex.update(self, 'query', []);

        // Get fresh system prompt (in case NPC state changed)
        const freshPrompt = await self.buildAgentPrompt();
        if (freshPrompt) {
          // Process combined messages - use first speaker's info for the wrapper
          await self._processSpokenMessage(pending[0].speakerId, 'Multiple speakers', combined, freshPrompt);
        } else {
          // NPC is no longer AI-controlled, release lock
          await $mutex.release(self, 'query');
        }
      } else {
        // Queue is empty, release the lock
        await $mutex.release(self, 'query');
      }
    `);

    // Action queue system - meters out say/emote actions with timing delays
    // Timing constants per action type
    obj.set('_actionTimings', {
      say: { baseDelay: 1500, msPerChar: 50 },      // Speech is slow, deliberate
      emote: { baseDelay: 800, msPerChar: 30 },     // Physical actions faster
      default: { baseDelay: 1000, msPerChar: 40 }   // Fallback
    });
    obj.set('_actionVariance', 500); // Random 0-500ms added

    // Queue an action for metered execution
    obj.setMethod('queueAction', `
      /** Queue a say/emote action for metered execution.
       *  @param command - The full command string (e.g., "say Hello")
       */
      const command = args[0];
      if (!command) return;

      // Initialize queue if needed
      const queue = self._actionQueue || [];
      queue.push({ command, queuedAt: Date.now() });
      self._actionQueue = queue;

      // If not already processing, start the queue processor
      if (!self._actionProcessing) {
        await self._processActionQueue();
      }
    `);

    // Process the action queue - executes one action, schedules next
    obj.setMethod('_processActionQueue', `
      const queue = self._actionQueue || [];

      if (queue.length === 0) {
        self._actionProcessing = false;
        return;
      }

      self._actionProcessing = true;

      // Pop first action
      const action = queue.shift();
      self._actionQueue = queue;

      // Execute the action
      try {
        const match = await self.matchVerb(action.command);
        if (match && match.handler) {
          await match.handler.callVerb(
            match.verbInfo.method,
            null,      // context
            self,      // player (the NPC)
            action.command,
            match.args
          );
        }
      } catch (err) {
        console.error('[ActionQueue] Error executing action:', err?.message || err);
      }

      // Calculate delay for next action based on type
      const verb = action.command.split(/\\s+/)[0].toLowerCase();
      const timings = self._actionTimings || {};
      let timing = timings.default || { baseDelay: 1000, msPerChar: 40 };

      // Map verb shortcuts to their types
      if (verb === 'say' || verb === '"' || verb === "'") {
        timing = timings.say || timing;
      } else if (verb === 'emote' || verb === ':') {
        timing = timings.emote || timing;
      }

      // Calculate delay: base + (length * msPerChar) + random variance
      const textLength = action.command.length;
      const variance = self._actionVariance || 500;
      const delay = timing.baseDelay + (textLength * timing.msPerChar) + Math.floor(Math.random() * variance);

      // If more actions in queue, schedule next processing
      if (self._actionQueue && self._actionQueue.length > 0) {
        const jobName = 'actionQueue_' + self.id + '_' + Date.now();
        await $.scheduler.schedule(jobName, delay, 0, self, '_processActionQueue');
      } else {
        self._actionProcessing = false;
      }
    `);

    // Get current queue length (for MCP response)
    obj.setMethod('getActionQueueLength', `
      return (self._actionQueue || []).length;
    `);

    // Clear the action queue (admin/emergency use)
    obj.setMethod('clearActionQueue', `
      self._actionQueue = [];
      self._actionProcessing = false;
    `);

    // Called when someone gives an item to this NPC
    obj.setMethod('onItemReceived', `
      /** Handle receiving an item from someone.
       *  @param giver - The RuntimeObject giving us the item
       *  @param item - The item being given
       */
      const giver = args[0];
      const item = args[1];

      if (!giver || !item) return;

      // Build system prompt (returns null if not AI-controlled)
      const systemPrompt = await self.buildAgentPrompt();
      if (!systemPrompt) return; // Not AI-controlled, do nothing

      // Build user prompt
      const userPrompt = giver.name + ' just gave you ' + item.name + '.\\n\\nReact appropriately - thank them, examine the item, or respond based on your role.';

      // Fire-and-forget query
      $query(systemPrompt, userPrompt, self.agentSession)
        .then(async (result) => {
          self.agentSession = result.session;
        })
        .catch((err) => {
          console.error('[onItemReceived] AI error for #' + self.id + ':', err?.message || err);
        });
    `);

    return obj;
  }
}
