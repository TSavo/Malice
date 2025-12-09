import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Emote object (dynamic ID)
 * Handles freeform emote parsing and formatting with sensory awareness
 *
 * Usage from MOO code:
 *   $.emote.broadcast('.fall and .say "Hello!"', actor, room)
 *
 * Five input modes:
 *   " text    - say: Speech only (audible) -> Bob says, "text"
 *   . emote   - emote: Visual action with optional speech
 *   , amote   - amote: Audible non-speech (growl, sigh, footsteps)
 *   ~ smote   - smote: Olfactory (smell) action (perfume, stench, etc.)
 *   ^ tmote   - tmote: Gustatory (taste) action (bitter, sweet, metallic)
 *
 * Emote syntax:
 *   .verb phrase - verb is conjugated (you fall / Bob falls)
 *   ,verb phrase - audible action (heard, not seen)
 *   ~verb phrase - olfactory action (smelled, not seen/heard)
 *   ^verb phrase - gustatory action (tasted, requires tongue)
 *   Names - shift currentTarget, e.g., "Player2" makes pronouns refer to Player2
 *   Pronouns (him/her/them) - refer to currentTarget
 *   Reflexives (myself/yourself) - always refer to actor
 *   .say "text" - speech (audible)
 *
 * Sensory routing:
 *   - Visual actions (.) route through viewer.see()
 *   - Audible actions (,) route through viewer.hear()
 *   - Olfactory actions (~) route through viewer.smell()
 *   - Speech routes through viewer.hear()
 *   - Blind players hear speech and amotes, miss visual emotes
 *   - Deaf players see visual emotes with "*inaudible*" for speech/amotes
 *   - Anosmic players miss smotes but see/hear other components
 *   - Tongueless players miss tmotes but perceive other components
 *
 * Example:
 *   Input: .fall on my knees and .say "Hey!" to Player2
 *   Sighted+Hearing: Bob falls on his knees and says, "Hey!" to Player2.
 *   Blind: Bob says, "Hey!"
 *   Deaf: Bob falls on his knees and says, "*inaudible*" to Player2.
 *
 *   Input: ~reek of garlic
 *   Can smell: Bob reeks of garlic.
 *   Anosmic: (nothing)
 *
 *   Input: ^taste metallic on your tongue
 *   Has tongue: You taste metallic on your tongue.
 *   No tongue: (nothing)
 */
export class EmoteBuilder {
  private emote: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.emote) {
      this.emote = await this.manager.load(aliases.emote);
      if (this.emote) return; // Already exists
    }

    // Create new Emote
    this.emote = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Emote',
        description: 'Freeform emote parsing and formatting',
        // Object pronouns
        objectPronouns: ['him', 'her', 'them', 'it'],
        // Possessive pronouns
        possessivePronouns: ['his', 'her', 'their', 'its'],
        // Reflexive pronouns
        reflexivePronouns: ['himself', 'herself', 'themselves', 'itself', 'myself', 'yourself', 'yourselves', 'ourselves'],
      },
      methods: {},
    });

    // Main parse method - parses emote string and returns structured sensory data
    this.emote.setMethod('parse', `
      /** Parse an emote string and generate structured sensory data per viewer.
       *  Usage: $.emote.parse(emoteStr, actor, room)
       *  @param emoteStr - The emote string (with or without leading .)
       *  @param actor - The player performing the emote
       *  @param room - The room (to get viewers)
       *  @returns Object mapping viewer IDs to {visual, audible, combined} messages
       *  @example parse('.fall and .say "Hi"', actor, room)
       */
      const emoteStr = args[0];
      const actor = args[1];
      const room = args[2];

      if (!emoteStr || !actor) return {};

      // Get all viewers in the room
      const viewers = [];
      if (room && room.contents) {
        for (const id of room.contents) {
          const obj = await $.load(id);
          if (obj && obj.isPlayer) {
            viewers.push(obj);
          }
        }
      }

      // If no room or no viewers, at least include actor
      if (viewers.length === 0) {
        viewers.push(actor);
      }

      // Build list of known names in room for resolution
      const knownNames = {};
      if (room && room.contents) {
        for (const id of room.contents) {
          const obj = await $.load(id);
          if (obj && obj.name) {
            knownNames[obj.name.toLowerCase()] = obj;
          }
        }
      }
      knownNames[actor.name.toLowerCase()] = actor;

      // Parse for each viewer
      const results = {};
      for (const viewer of viewers) {
        results[viewer.id] = await self.formatSensory(emoteStr, actor, viewer, knownNames);
      }

      return results;
    `);

    // Extract targets mentioned in an emote (for auto-watch)
    this.emote.setMethod('extractTargets', `
      /** Extract people/objects mentioned by name in an emote.
       *  Usage: $.emote.extractTargets(emoteStr, room)
       *  @param emoteStr - The emote string
       *  @param room - The room (to resolve names)
       *  @returns Array of objects that were referenced by name
       */
      const emoteStr = args[0];
      const room = args[1];

      if (!emoteStr || !room) return [];

      // Build list of known names in room
      const knownNames = {};
      if (room.contents) {
        for (const id of room.contents) {
          const obj = await $.load(id);
          if (obj && obj.name) {
            knownNames[obj.name.toLowerCase()] = obj;
          }
        }
      }

      // Find all names mentioned in the emote
      const targets = [];
      const text = emoteStr.toLowerCase();

      for (const [name, obj] of Object.entries(knownNames)) {
        // Check if name appears as a word boundary match
        const regex = new RegExp('\\\\b' + name.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + '\\\\b');
        if (regex.test(text)) {
          targets.push(obj);
        }
      }

      return targets;
    `);

    // Format emote for a specific viewer
    this.emote.setMethod('format', `
      /** Format an emote string for a specific viewer.
       *  Usage: $.emote.format(emoteStr, actor, viewer, room?)
       *  @param emoteStr - The emote string
       *  @param actor - The player performing the emote
       *  @param viewer - The player viewing the emote
       *  @param room - Optional room context for name resolution
       *  @returns The formatted emote string
       *  @example format('.smile at Player2', actor, viewer) -> "You smile at Player2" or "Bob smiles at you"
       */
      const emoteStr = args[0];
      const actor = args[1];
      const viewer = args[2];
      const room = args[3];

      if (!emoteStr || !actor || !viewer) return '';

      const isActor = viewer.id === actor.id;

      // Remove leading dot if present
      let text = emoteStr.startsWith('.') ? emoteStr.slice(1) : emoteStr;

      // Track currentTarget - starts as actor (reflexive)
      let currentTarget = actor;

      // Build list of known names in room for resolution
      const knownNames = {};
      if (room && room.contents) {
        for (const id of room.contents) {
          const obj = await $.load(id);
          if (obj && obj.name) {
            knownNames[obj.name.toLowerCase()] = obj;
          }
        }
      }
      // Always know actor
      knownNames[actor.name.toLowerCase()] = actor;

      // Process the text
      let result = await self.processEmote(text, actor, viewer, currentTarget, knownNames);

      // Capitalize first letter
      result = result.charAt(0).toUpperCase() + result.slice(1);

      // Ensure ends with punctuation
      if (!/[.!?]$/.test(result.trim())) {
        result = result.trim() + '.';
      }

      return result;
    `);

    // Format emote with sensory separation
    this.emote.setMethod('formatSensory', `
      /** Format an emote into separate visual, audible, olfactory, and gustatory components.
       *  Usage: $.emote.formatSensory(emoteStr, actor, viewer, knownNames)
       *  @param emoteStr - The emote string
       *  @param actor - The player performing the emote
       *  @param viewer - The player viewing the emote
       *  @param knownNames - Map of lowercase names to objects
       *  @returns {visual, audible, olfactory, gustatory, visualDeaf, combined}
       */
      const emoteStr = args[0];
      const actor = args[1];
      const viewer = args[2];
      const knownNames = args[3];

      if (!emoteStr || !actor || !viewer) {
        return { visual: '', audible: '', olfactory: '', gustatory: '', visualDeaf: '', combined: '' };
      }

      const isActor = viewer.id === actor.id;

      // Remove leading dot if present
      let text = emoteStr.startsWith('.') ? emoteStr.slice(1) : emoteStr;

      // Parse into segments: visual actions and audible speech
      const segments = await self.parseSegments(text, actor, viewer, knownNames);

      // Build different output versions
      let visual = '';      // Visual-only parts (for blind: nothing visual)
      let audible = '';     // Speech and amote content (for blind)
      let olfactory = '';   // Smell-only parts (for anosmic: nothing)
      let gustatory = '';   // Taste-only parts (for tongueless: nothing)
      let visualDeaf = '';  // Visual actions + "says something" for speech (no amotes)
      let combined = '';    // Full message for sighted+hearing

      for (const seg of segments) {
        if (seg.type === 'speech') {
          // Speech segment: ".say 'Hello!'" -> "says, 'Hello!'"
          combined += seg.text;
          audible += seg.speechOnly; // Just "Bob says, 'Hello!'"
          // Deaf see lips moving but don't hear content
          visualDeaf += seg.deafText; // "says something"
        } else if (seg.type === 'amote') {
          // Amote segment: ",growl" -> audible but not visual
          combined += seg.text;
          audible += seg.audibleText; // What blind hear
          // Deaf get nothing for amotes - they can't hear them
          // Note: amotes don't go in visual (blind can hear them)
        } else if (seg.type === 'smote') {
          // Smote segment: "~reek" -> olfactory, not visual/audible
          combined += seg.text;
          olfactory += seg.olfactoryText; // What those who can smell perceive
          // Anosmic players don't perceive smotes at all
        } else if (seg.type === 'tmote') {
          // Tmote segment: "^taste" -> gustatory, requires tongue
          combined += seg.text;
          gustatory += seg.gustatoryText; // What those with tongues perceive
          // Tongueless players don't perceive tmotes at all
        } else {
          // Visual action segment
          combined += seg.text;
          visual += seg.text;
          visualDeaf += seg.text;
        }
      }

      // Clean up and capitalize
      const finalize = (str) => {
        str = str.trim();
        if (!str) return '';
        str = str.charAt(0).toUpperCase() + str.slice(1);
        if (!/[.!?]$/.test(str)) str += '.';
        return str;
      };

      return {
        visual: finalize(visual),
        audible: finalize(audible),
        olfactory: finalize(olfactory),
        gustatory: finalize(gustatory),
        visualDeaf: finalize(visualDeaf),
        combined: finalize(combined),
      };
    `);

    // Parse emote into typed segments
    this.emote.setMethod('parseSegments', `
      /** Parse emote text into visual, audible, olfactory, and gustatory segments.
       *  @param text - The emote text
       *  @param actor - The emote actor
       *  @param viewer - Who is viewing
       *  @param knownNames - Map of lowercase names to objects
       *  @returns Array of {type: 'visual'|'speech'|'amote'|'smote'|'tmote', text, ...}
       */
      const text = args[0];
      const actor = args[1];
      const viewer = args[2];
      const knownNames = args[3];

      const isActor = viewer.id === actor.id;
      const segments = [];
      let currentTarget = actor;
      let i = 0;
      let currentSegment = { type: 'visual', text: '' };

      // Helper to get actor prefix
      const getActorPrefix = () => {
        if (isActor) return 'you ';
        return actor.name + ' ';
      };

      while (i < text.length) {
        // Check for speech verb (.say, .ask, .whisper, etc.)
        if (text[i] === '.') {
          const speechMatch = text.slice(i + 1).match(/^(say|says|ask|asks|whisper|whispers|shout|shouts|exclaim|exclaims|mutter|mutters|yell|yells)\\b/i);
          if (speechMatch) {
            // Save current visual segment if any
            if (currentSegment.text.trim()) {
              segments.push(currentSegment);
            }

            const speechVerb = speechMatch[1].toLowerCase().replace(/s$/, ''); // Normalize to base
            i += 1 + speechMatch[1].length;

            // Skip whitespace and punctuation before quote
            while (i < text.length && /[\\s,:]/.test(text[i])) i++;

            // Extract quoted speech
            let speechContent = '';
            if (text[i] === '"' || text[i] === "'") {
              const quote = text[i];
              i++;
              const endQuote = text.indexOf(quote, i);
              if (endQuote !== -1) {
                speechContent = text.slice(i, endQuote);
                i = endQuote + 1;
              } else {
                speechContent = text.slice(i);
                i = text.length;
              }
            }

            // Conjugate verb
            let conjugatedVerb;
            if (isActor) {
              conjugatedVerb = speechVerb;
            } else {
              conjugatedVerb = await $.english.conjugate(speechVerb, 3);
            }

            // Build speech segment
            const prefix = (segments.length === 0 && !currentSegment.text.trim()) ? getActorPrefix() : '';
            const speechText = prefix + conjugatedVerb + ', "' + speechContent + '"';
            const speechOnly = getActorPrefix() + conjugatedVerb + ', "' + speechContent + '"';
            // Deaf see lips moving: "says something" instead of the actual words
            const deafText = prefix + conjugatedVerb + ' something';

            segments.push({
              type: 'speech',
              text: speechText,
              speechOnly: speechOnly,
              deafText: deafText,
              content: speechContent,
              verb: speechVerb,
            });

            currentSegment = { type: 'visual', text: '' };
            continue;
          }

          // Regular verb (not speech) - visual action
          const verbMatch = text.slice(i + 1).match(/^(\\w+)/);
          if (verbMatch) {
            const verb = verbMatch[1];
            i += 1 + verb.length;

            let conjugated;
            if (isActor) {
              conjugated = verb;
              if (currentSegment.text === '' && segments.length === 0) {
                conjugated = 'you ' + verb;
              }
            } else {
              conjugated = await $.english.conjugate(verb, 3);
              if (currentSegment.text === '' && segments.length === 0) {
                conjugated = actor.name + ' ' + conjugated;
              }
            }
            currentSegment.text += conjugated;
            continue;
          }
        }

        // Check for amote marker (,) - audible non-speech action
        if (text[i] === ',') {
          const amoteMatch = text.slice(i + 1).match(/^(\\w+)/);
          if (amoteMatch) {
            // Save current visual segment if any
            if (currentSegment.text.trim()) {
              segments.push(currentSegment);
              currentSegment = { type: 'visual', text: '' };
            }

            const verb = amoteMatch[1];
            i += 1 + verb.length;

            // Conjugate verb
            let conjugated;
            if (isActor) {
              conjugated = verb;
            } else {
              conjugated = await $.english.conjugate(verb, 3);
            }

            // Build amote segment - audible action (not speech)
            const prefix = (segments.length === 0 && !currentSegment.text.trim()) ? getActorPrefix() : '';
            const amoteText = prefix + conjugated;

            // Collect the rest of the amote phrase until next marker or end
            let phraseEnd = i;
            while (phraseEnd < text.length && text[phraseEnd] !== '.' && text[phraseEnd] !== ',') {
              phraseEnd++;
            }
            const phrase = text.slice(i, phraseEnd);
            i = phraseEnd;

            // Process phrase for pronouns/names
            let processedPhrase = '';
            let j = 0;
            while (j < phrase.length) {
              const phraseWordMatch = phrase.slice(j).match(/^(\\w+)/);
              if (phraseWordMatch) {
                const word = phraseWordMatch[1];
                const lower = word.toLowerCase();
                j += word.length;

                // Handle pronouns and names in amote phrase
                if (knownNames[lower]) {
                  const named = knownNames[lower];
                  currentTarget = named;
                  if (named.id === viewer.id) {
                    processedPhrase += 'you';
                  } else if (named.id === actor.id && isActor) {
                    processedPhrase += 'yourself';
                  } else {
                    processedPhrase += named.name;
                  }
                } else if (lower === 'my') {
                  processedPhrase += isActor ? 'your' : await self.getPossessive(actor);
                } else if (self.objectPronouns.includes(lower)) {
                  if (currentTarget.id === viewer.id) {
                    processedPhrase += 'you';
                  } else if (currentTarget.id === actor.id && isActor) {
                    processedPhrase += 'yourself';
                  } else {
                    processedPhrase += await self.getObjectPronoun(currentTarget);
                  }
                } else if (self.possessivePronouns.includes(lower)) {
                  if (currentTarget.id === viewer.id) {
                    processedPhrase += 'your';
                  } else if (currentTarget.id === actor.id && isActor) {
                    processedPhrase += 'your';
                  } else {
                    processedPhrase += await self.getPossessive(currentTarget);
                  }
                } else {
                  processedPhrase += word;
                }
                continue;
              }
              processedPhrase += phrase[j];
              j++;
            }

            const fullAmote = amoteText + processedPhrase;
            const amoteOnly = getActorPrefix() + conjugated + processedPhrase;

            segments.push({
              type: 'amote',
              text: fullAmote,
              audibleText: amoteOnly,  // What's heard
              // No deafText - deaf players don't perceive amotes at all
            });

            continue;
          }
        }

        // Check for smote marker (~) - olfactory action
        if (text[i] === '~') {
          const smoteMatch = text.slice(i + 1).match(/^(\\w+)/);
          if (smoteMatch) {
            // Save current visual segment if any
            if (currentSegment.text.trim()) {
              segments.push(currentSegment);
              currentSegment = { type: 'visual', text: '' };
            }

            const verb = smoteMatch[1];
            i += 1 + verb.length;

            // Conjugate verb
            let conjugated;
            if (isActor) {
              conjugated = verb;
            } else {
              conjugated = await $.english.conjugate(verb, 3);
            }

            // Build smote segment - olfactory action
            const prefix = (segments.length === 0 && !currentSegment.text.trim()) ? getActorPrefix() : '';
            const smoteText = prefix + conjugated;

            // Collect the rest of the smote phrase until next marker or end
            let phraseEnd = i;
            while (phraseEnd < text.length && text[phraseEnd] !== '.' && text[phraseEnd] !== ',' && text[phraseEnd] !== '~' && text[phraseEnd] !== '^') {
              phraseEnd++;
            }
            const phrase = text.slice(i, phraseEnd);
            i = phraseEnd;

            // Process phrase for pronouns/names
            let processedPhrase = '';
            let j = 0;
            while (j < phrase.length) {
              const phraseWordMatch = phrase.slice(j).match(/^(\\w+)/);
              if (phraseWordMatch) {
                const word = phraseWordMatch[1];
                const lower = word.toLowerCase();
                j += word.length;

                // Handle pronouns and names in smote phrase
                if (knownNames[lower]) {
                  const named = knownNames[lower];
                  currentTarget = named;
                  if (named.id === viewer.id) {
                    processedPhrase += 'you';
                  } else if (named.id === actor.id && isActor) {
                    processedPhrase += 'yourself';
                  } else {
                    processedPhrase += named.name;
                  }
                } else if (lower === 'my') {
                  processedPhrase += isActor ? 'your' : await self.getPossessive(actor);
                } else if (self.objectPronouns.includes(lower)) {
                  if (currentTarget.id === viewer.id) {
                    processedPhrase += 'you';
                  } else if (currentTarget.id === actor.id && isActor) {
                    processedPhrase += 'yourself';
                  } else {
                    processedPhrase += await self.getObjectPronoun(currentTarget);
                  }
                } else if (self.possessivePronouns.includes(lower)) {
                  if (currentTarget.id === viewer.id) {
                    processedPhrase += 'your';
                  } else if (currentTarget.id === actor.id && isActor) {
                    processedPhrase += 'your';
                  } else {
                    processedPhrase += await self.getPossessive(currentTarget);
                  }
                } else {
                  processedPhrase += word;
                }
                continue;
              }
              processedPhrase += phrase[j];
              j++;
            }

            const fullSmote = smoteText + processedPhrase;
            const smoteOnly = getActorPrefix() + conjugated + processedPhrase;

            segments.push({
              type: 'smote',
              text: fullSmote,
              olfactoryText: smoteOnly,  // What's smelled
            });

            continue;
          }
        }

        // Check for tmote marker (^) - gustatory action
        if (text[i] === '^') {
          const tmoteMatch = text.slice(i + 1).match(/^(\\w+)/);
          if (tmoteMatch) {
            // Save current visual segment if any
            if (currentSegment.text.trim()) {
              segments.push(currentSegment);
              currentSegment = { type: 'visual', text: '' };
            }

            const verb = tmoteMatch[1];
            i += 1 + verb.length;

            // Conjugate verb
            let conjugated;
            if (isActor) {
              conjugated = verb;
            } else {
              conjugated = await $.english.conjugate(verb, 3);
            }

            // Build tmote segment - gustatory action
            const prefix = (segments.length === 0 && !currentSegment.text.trim()) ? getActorPrefix() : '';
            const tmoteText = prefix + conjugated;

            // Collect the rest of the tmote phrase until next marker or end
            let phraseEnd = i;
            while (phraseEnd < text.length && text[phraseEnd] !== '.' && text[phraseEnd] !== ',' && text[phraseEnd] !== '~' && text[phraseEnd] !== '^') {
              phraseEnd++;
            }
            const phrase = text.slice(i, phraseEnd);
            i = phraseEnd;

            // Process phrase for pronouns/names
            let processedPhrase = '';
            let j = 0;
            while (j < phrase.length) {
              const phraseWordMatch = phrase.slice(j).match(/^(\\w+)/);
              if (phraseWordMatch) {
                const word = phraseWordMatch[1];
                const lower = word.toLowerCase();
                j += word.length;

                // Handle pronouns and names in tmote phrase
                if (knownNames[lower]) {
                  const named = knownNames[lower];
                  currentTarget = named;
                  if (named.id === viewer.id) {
                    processedPhrase += 'you';
                  } else if (named.id === actor.id && isActor) {
                    processedPhrase += 'yourself';
                  } else {
                    processedPhrase += named.name;
                  }
                } else if (lower === 'my') {
                  processedPhrase += isActor ? 'your' : await self.getPossessive(actor);
                } else if (self.objectPronouns.includes(lower)) {
                  if (currentTarget.id === viewer.id) {
                    processedPhrase += 'you';
                  } else if (currentTarget.id === actor.id && isActor) {
                    processedPhrase += 'yourself';
                  } else {
                    processedPhrase += await self.getObjectPronoun(currentTarget);
                  }
                } else if (self.possessivePronouns.includes(lower)) {
                  if (currentTarget.id === viewer.id) {
                    processedPhrase += 'your';
                  } else if (currentTarget.id === actor.id && isActor) {
                    processedPhrase += 'your';
                  } else {
                    processedPhrase += await self.getPossessive(currentTarget);
                  }
                } else {
                  processedPhrase += word;
                }
                continue;
              }
              processedPhrase += phrase[j];
              j++;
            }

            const fullTmote = tmoteText + processedPhrase;
            const tmoteOnly = getActorPrefix() + conjugated + processedPhrase;

            segments.push({
              type: 'tmote',
              text: fullTmote,
              gustatoryText: tmoteOnly,  // What's tasted
            });

            continue;
          }
        }

        // Check for quoted text (not preceded by speech verb)
        if (text[i] === '"' || text[i] === "'") {
          const quote = text[i];
          let end = text.indexOf(quote, i + 1);
          if (end === -1) end = text.length;
          currentSegment.text += text.slice(i, end + 1);
          i = end + 1;
          continue;
        }

        // Check for words (names, pronouns)
        const wordMatch = text.slice(i).match(/^(\\w+)/);
        if (wordMatch) {
          const word = wordMatch[1];
          const lower = word.toLowerCase();
          i += word.length;

          // Check if it's a known name
          if (knownNames[lower]) {
            const named = knownNames[lower];
            currentTarget = named;

            if (named.id === viewer.id) {
              currentSegment.text += 'you';
            } else if (named.id === actor.id && isActor) {
              currentSegment.text += 'yourself';
            } else {
              currentSegment.text += named.name;
            }
            continue;
          }

          // Reflexive pronouns
          if (self.reflexivePronouns.includes(lower)) {
            if (isActor) {
              currentSegment.text += 'yourself';
            } else {
              currentSegment.text += await self.getReflexive(actor);
            }
            continue;
          }

          // Possessive "my"
          if (lower === 'my') {
            if (isActor) {
              currentSegment.text += 'your';
            } else {
              currentSegment.text += await self.getPossessive(actor);
            }
            continue;
          }

          // Object pronouns
          if (self.objectPronouns.includes(lower)) {
            if (currentTarget.id === viewer.id) {
              currentSegment.text += 'you';
            } else if (currentTarget.id === actor.id && isActor) {
              currentSegment.text += 'yourself';
            } else {
              currentSegment.text += await self.getObjectPronoun(currentTarget);
            }
            continue;
          }

          // Possessive pronouns
          if (self.possessivePronouns.includes(lower)) {
            if (currentTarget.id === viewer.id) {
              currentSegment.text += 'your';
            } else if (currentTarget.id === actor.id && isActor) {
              currentSegment.text += 'your';
            } else {
              currentSegment.text += await self.getPossessive(currentTarget);
            }
            continue;
          }

          // Regular word
          currentSegment.text += word;
          continue;
        }

        // Regular character
        currentSegment.text += text[i];
        i++;
      }

      // Add final segment if any
      if (currentSegment.text.trim()) {
        segments.push(currentSegment);
      }

      return segments;
    `);

    // Process emote text - handles verbs, names, pronouns
    this.emote.setMethod('processEmote', `
      /** Internal: Process emote text with verb conjugation and pronoun substitution.
       *  @param text - The text to process
       *  @param actor - The emote actor
       *  @param viewer - Who is viewing
       *  @param currentTarget - Current pronoun target (starts as actor)
       *  @param knownNames - Map of lowercase names to objects
       */
      const text = args[0];
      const actor = args[1];
      const viewer = args[2];
      let currentTarget = args[3];
      const knownNames = args[4];

      const isActor = viewer.id === actor.id;
      let result = '';
      let i = 0;

      while (i < text.length) {
        // Check for verb marker (.)
        if (text[i] === '.') {
          // Extract verb
          const verbMatch = text.slice(i + 1).match(/^(\\w+)/);
          if (verbMatch) {
            const verb = verbMatch[1];
            i += 1 + verb.length;

            // Conjugate based on viewer perspective
            let conjugated;
            if (isActor) {
              // Actor sees base form with "you"
              conjugated = verb;
              // Prepend "you" if this is start of emote or after punctuation
              if (result === '' || /[.!?]\\s*$/.test(result)) {
                conjugated = 'you ' + verb;
              }
            } else {
              // Others see third person
              conjugated = await $.english.conjugate(verb, 3);
              // Prepend actor name if start of emote or after punctuation
              if (result === '' || /[.!?]\\s*$/.test(result)) {
                conjugated = actor.name + ' ' + conjugated;
              }
            }
            result += conjugated;
            continue;
          }
        }

        // Check for quoted speech
        if (text[i] === '"' || text[i] === "'") {
          const quote = text[i];
          let end = text.indexOf(quote, i + 1);
          if (end === -1) end = text.length;
          result += text.slice(i, end + 1);
          i = end + 1;
          continue;
        }

        // Check for words (names, pronouns)
        const wordMatch = text.slice(i).match(/^(\\w+)/);
        if (wordMatch) {
          const word = wordMatch[1];
          const lower = word.toLowerCase();
          i += word.length;

          // Check if it's a known name
          if (knownNames[lower]) {
            const named = knownNames[lower];
            currentTarget = named; // Shift target

            // Substitute appropriately
            if (named.id === viewer.id) {
              result += 'you';
            } else if (named.id === actor.id && isActor) {
              result += 'yourself';
            } else {
              result += named.name;
            }
            continue;
          }

          // Check for reflexive pronouns (always = actor)
          if (self.reflexivePronouns.includes(lower)) {
            if (isActor) {
              result += 'yourself';
            } else {
              // Get actor's reflexive
              const reflexive = await self.getReflexive(actor);
              result += reflexive;
            }
            continue;
          }

          // Check for possessive "my" (always = actor)
          if (lower === 'my') {
            if (isActor) {
              result += 'your';
            } else {
              result += await self.getPossessive(actor);
            }
            continue;
          }

          // Check for object pronouns (him/her/them) - refer to currentTarget
          if (self.objectPronouns.includes(lower)) {
            if (currentTarget.id === viewer.id) {
              result += 'you';
            } else if (currentTarget.id === actor.id && isActor) {
              result += 'yourself';
            } else {
              result += await self.getObjectPronoun(currentTarget);
            }
            continue;
          }

          // Check for possessive pronouns (his/her/their) - refer to currentTarget
          if (self.possessivePronouns.includes(lower)) {
            if (currentTarget.id === viewer.id) {
              result += 'your';
            } else if (currentTarget.id === actor.id && isActor) {
              result += 'your';
            } else {
              result += await self.getPossessive(currentTarget);
            }
            continue;
          }

          // Regular word
          result += word;
          continue;
        }

        // Regular character
        result += text[i];
        i++;
      }

      return result;
    `);

    // Get object pronoun for a character
    this.emote.setMethod('getObjectPronoun', `
      /** Get object pronoun (him/her/them) for a character.
       *  @param char - The character
       *  @returns The appropriate object pronoun
       */
      const char = args[0];
      if (!char) return 'them';

      const gender = (char.gender || 'neutral').toLowerCase();
      if (gender === 'male' || gender === 'm') return 'him';
      if (gender === 'female' || gender === 'f') return 'her';
      return 'them';
    `);

    // Get possessive pronoun for a character
    this.emote.setMethod('getPossessive', `
      /** Get possessive pronoun (his/her/their) for a character.
       *  @param char - The character
       *  @returns The appropriate possessive pronoun
       */
      const char = args[0];
      if (!char) return 'their';

      const gender = (char.gender || 'neutral').toLowerCase();
      if (gender === 'male' || gender === 'm') return 'his';
      if (gender === 'female' || gender === 'f') return 'her';
      return 'their';
    `);

    // Get reflexive pronoun for a character
    this.emote.setMethod('getReflexive', `
      /** Get reflexive pronoun (himself/herself/themselves) for a character.
       *  @param char - The character
       *  @returns The appropriate reflexive pronoun
       */
      const char = args[0];
      if (!char) return 'themselves';

      const gender = (char.gender || 'neutral').toLowerCase();
      if (gender === 'male' || gender === 'm') return 'himself';
      if (gender === 'female' || gender === 'f') return 'herself';
      return 'themselves';
    `);

    // Get subject pronoun for a character
    this.emote.setMethod('getSubjectPronoun', `
      /** Get subject pronoun (he/she/they) for a character.
       *  @param char - The character
       *  @returns The appropriate subject pronoun
       */
      const char = args[0];
      if (!char) return 'they';

      const gender = (char.gender || 'neutral').toLowerCase();
      if (gender === 'male' || gender === 'm') return 'he';
      if (gender === 'female' || gender === 'f') return 'she';
      return 'they';
    `);

    // Broadcast emote to room with sensory awareness and crowd perception
    this.emote.setMethod('broadcast', `
      /** Parse emote and send to all viewers via appropriate senses.
       *  Usage: $.emote.broadcast(emoteStr, actor, room, targets?)
       *  Routes visual through viewer.see(), speech through viewer.hear().
       *  Considers crowd level and watch list for perception clarity.
       *  Auto-watches actor for anyone who perceives the emote.
       *  @param emoteStr - The emote string
       *  @param actor - The player performing the emote
       *  @param room - The room to broadcast in
       *  @param targets - Optional array of people mentioned/targeted in emote
       *  @example broadcast('.wave and .say "Hi!"', actor, room, [bob])
       */
      const emoteStr = args[0];
      const actor = args[1];
      const room = args[2];
      const targets = args[3] || []; // People specifically targeted in emote

      const parsed = await self.parse(emoteStr, actor, room);

      for (const [viewerId, sensory] of Object.entries(parsed)) {
        const viewer = await $.load(parseInt(viewerId));
        if (!viewer) continue;

        // Skip if viewer is the actor (they always see their own emote)
        const isSelf = viewer.id === actor.id;

        // Check crowd perception if room supports it
        let perception = { canSee: true, canHear: true, visualClarity: 100, audioClarity: 100 };
        if (!isSelf && room && room.getPerception) {
          perception = await room.getPerception(viewer, actor);
        }

        // Check viewer's sensory capabilities
        const viewerCanSee = viewer.canSee ? await viewer.canSee() : true;
        const viewerCanHear = viewer.canHear ? await viewer.canHear() : true;
        const viewerCanSmell = viewer.canSmell ? await viewer.canSmell() : true;
        const viewerCanTaste = viewer.canTaste ? await viewer.canTaste() : true;

        // Combine physical ability with crowd perception
        const canSee = viewerCanSee && perception.canSee;
        const canHear = viewerCanHear && perception.canHear;
        const canSmell = !!viewerCanSmell;  // No crowd perception for smell (yet)
        const canTaste = !!viewerCanTaste;  // Taste is direct contact, no perception needed

        // Determine if perception is degraded (for potential partial messages)
        const visualDegraded = perception.visualClarity < 50;
        const audioDegraded = perception.audioClarity < 50;

        // Helper to garble speech in text based on audio clarity
        // Uses $.english.garble for realistic audio degradation
        const garbleSpeech = async (text, clarity) => {
          if (clarity >= 80) return text; // Clear enough
          // Convert clarity (0-80) to garble amount (100-0)
          // clarity 80 = 0% garble, clarity 0 = 100% garble
          const garbleAmount = Math.round(100 - (clarity * 100 / 80));
          // Garble only the quoted speech portions
          const parts = [];
          let lastEnd = 0;
          const regex = /(["'])([^"']*?)\\1/g;
          let match;
          while ((match = regex.exec(text)) !== null) {
            // Add text before this quote
            parts.push(text.slice(lastEnd, match.index));
            // Garble the speech content
            const quote = match[1];
            const speech = match[2];
            const garbled = await $.english.garble(speech, garbleAmount);
            parts.push(quote + garbled + quote);
            lastEnd = regex.lastIndex;
          }
          parts.push(text.slice(lastEnd));
          return parts.join('');
        };

        if (canSee && canHear) {
          // Full experience - route through see (visual includes speech text)
          let message = sensory.combined;

          // Degraded visual perception - can't identify who
          if (visualDegraded && !isSelf) {
            message = 'Someone nearby ' + sensory.combined.replace(/^\\w+\\s+/, '');
          }

          // Degraded audio - garble any speech in the message
          if (audioDegraded && !isSelf) {
            message = await garbleSpeech(message, perception.audioClarity);
          }

          if (viewer.see) {
            await viewer.see(message);
          } else if (viewer.tell) {
            await viewer.tell(message);
          }
        } else if (canSee && !canHear) {
          // Deaf - see action with *inaudible* for speech
          let message = sensory.visualDeaf;

          if (visualDegraded && !isSelf) {
            message = 'Someone nearby ' + sensory.visualDeaf.replace(/^\\w+\\s+/, '');
          }

          if (viewer.see) {
            await viewer.see(message);
          } else if (viewer.tell) {
            await viewer.tell(message);
          }
        } else if (!canSee && canHear) {
          // Blind - only hear speech
          if (sensory.audible) {
            let message = sensory.audible;

            // Degraded audio - don't know who's speaking and garble speech
            if (audioDegraded && !isSelf) {
              message = 'Someone says, ' + sensory.audible.replace(/^\\w+\\s+says,?\\s*/, '');
              message = await garbleSpeech(message, perception.audioClarity);
            }

            if (viewer.hear) {
              await viewer.hear(message);
            } else if (viewer.tell) {
              await viewer.tell(message);
            }
          }
        }
        // If both blind and deaf, or can't perceive due to crowd, nothing is perceived

        // Handle olfactory (smote) - routed through viewer.smell()
        if (canSmell && sensory.olfactory) {
          if (viewer.smell) {
            await viewer.smell(sensory.olfactory, actor);
          } else if (viewer.tell) {
            await viewer.tell(sensory.olfactory);
          }
        }

        // Handle gustatory (tmote) - routed through viewer.taste()
        // Requires a tongue to perceive taste
        if (canTaste && sensory.gustatory) {
          if (viewer.taste) {
            await viewer.taste(sensory.gustatory, actor);
          } else if (viewer.tell) {
            await viewer.tell(sensory.gustatory);
          }
        }

        // Only auto-watch if THIS viewer was specifically mentioned in the emote
        const isTarget = targets.some(t => t && t.id === viewer.id);
        if (isTarget && !isSelf && viewer.autoWatch) {
          // I was mentioned - auto-watch the actor back
          await viewer.autoWatch(actor);
        }
      }

      // Actor auto-watches anyone they specifically addressed
      if (actor.autoWatch) {
        for (const target of targets) {
          if (target && target.id !== actor.id) {
            await actor.autoWatch(target);
          }
        }
      }
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.emote) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'emote', this.emote.id);
    console.log(`✅ Registered emote alias -> #${this.emote.id}`);
  }
}
