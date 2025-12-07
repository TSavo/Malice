import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds PronounSub object (dynamic ID)
 * Handles pronoun and name substitution in message templates
 *
 * Usage from MOO code:
 *   const msg = await $.pronoun.sub("%N picks up %t and puts it in %p pocket.", actor, null, item);
 *
 * Substitution codes:
 *   %s - subject pronoun: he/she/they
 *   %o - object pronoun: him/her/them
 *   %p - possessive (adjective): his/her/their
 *   %q - possessive (noun): his/hers/theirs
 *   %r - reflexive: himself/herself/themselves
 *   %n - actor name
 *   %t - this object (item) name
 *   %d - direct object name
 *   %i - indirect object name
 *   %l - location name
 *   %% - literal %
 *
 * Capitalize the code for capitalized output: %S, %N, etc.
 */
export class PronounSubBuilder {
  private pronounSub: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.pronoun) {
      this.pronounSub = await this.manager.load(aliases.pronoun);
      if (this.pronounSub) return; // Already exists
    }

    // Create new PronounSub
    this.pronounSub = await this.manager.create({
      parent: 1,
      properties: {
        name: 'PronounSub',
        description: 'Pronoun and name substitution system',
      },
      methods: {},
    });

    // Main substitution method
    // sub(template, actor, directObj?, indirectObj?, item?)
    this.pronounSub.setMethod('sub', `
      const template = args[0];
      const actor = args[1];
      const directObj = args[2];
      const indirectObj = args[3];
      const item = args[4];

      if (!template || typeof template !== 'string') {
        return template;
      }

      // Get pronouns from actor
      const pronouns = actor?.pronouns || {
        subject: 'they',
        object: 'them',
        possessive: 'their',
      };

      // Build reflexive from subject
      const reflexiveMap = {
        'he': 'himself',
        'she': 'herself',
        'they': 'themselves',
        'it': 'itself',
      };
      const reflexive = reflexiveMap[pronouns.subject] || 'themselves';

      // Build possessive noun from possessive adjective
      const possNounMap = {
        'his': 'his',
        'her': 'hers',
        'their': 'theirs',
        'its': 'its',
      };
      const possNoun = possNounMap[pronouns.possessive] || 'theirs';

      // Get names
      const actorName = actor?.name || 'someone';
      const itemName = item?.name || 'something';
      const directName = directObj?.name || 'something';
      const indirectName = indirectObj?.name || 'someone';

      // Get location
      let locationName = 'somewhere';
      if (actor?.location) {
        const loc = await $.load(actor.location);
        if (loc) locationName = loc.name || 'somewhere';
      }

      // Substitution map
      const subs = {
        // Pronouns (lowercase)
        's': pronouns.subject,
        'o': pronouns.object,
        'p': pronouns.possessive,
        'q': possNoun,
        'r': reflexive,
        // Names (lowercase)
        'n': actorName,
        't': itemName,
        'd': directName,
        'i': indirectName,
        'l': locationName,
      };

      // Capitalize helper
      const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

      // Replace all %X patterns
      let result = template.replace(/%(.)/g, (match, code) => {
        if (code === '%') return '%'; // Literal %

        const lower = code.toLowerCase();
        const sub = subs[lower];

        if (sub === undefined) {
          return match; // Unknown code, leave as-is
        }

        // Capitalize if code was uppercase
        if (code === code.toUpperCase()) {
          return capitalize(sub);
        }
        return sub;
      });

      return result;
    `);

    // Convenience methods for direct pronoun access
    this.pronounSub.setMethod('subject', `
      const actor = args[0];
      const pronouns = actor?.pronouns || { subject: 'they' };
      return pronouns.subject;
    `);

    this.pronounSub.setMethod('object', `
      const actor = args[0];
      const pronouns = actor?.pronouns || { object: 'them' };
      return pronouns.object;
    `);

    this.pronounSub.setMethod('possessive', `
      const actor = args[0];
      const pronouns = actor?.pronouns || { possessive: 'their' };
      return pronouns.possessive;
    `);

    this.pronounSub.setMethod('reflexive', `
      const actor = args[0];
      const pronouns = actor?.pronouns || { subject: 'they' };
      const map = {
        'he': 'himself',
        'she': 'herself',
        'they': 'themselves',
        'it': 'itself',
      };
      return map[pronouns.subject] || 'themselves';
    `);

    // === MULTI-PERSPECTIVE SUBSTITUTION ===

    // Substitute with perspective - handles "you" when viewer is actor or target
    // Template codes:
    //   Actor codes (use actor's pronouns, or "you" if viewer is actor):
    //     %A = actor name/You (capitalized)
    //     %a = actor name/you
    //     %as = actor subject pronoun (they/you)
    //     %ao = actor object pronoun (them/you)
    //     %ap = actor possessive (their/your)
    //     %ar = actor reflexive (themselves/yourself)
    //   Target codes (use target's pronouns, or "you" if viewer is target):
    //     %T = target name/You (capitalized)
    //     %t = target name/you
    //     %ts = target subject pronoun (they/you)
    //     %to = target object pronoun (them/you)
    //     %tp = target possessive (their/your)
    //     %tr = target reflexive (themselves/yourself)
    //   Verb conjugation:
    //     %v{base} = conjugated verb (cut/cuts based on actor being you or third person)
    //   Other:
    //     %i = item/indirect object name
    //     %l = location name
    this.pronounSub.setMethod('perspective', `
      const template = args[0];
      const actor = args[1];
      const target = args[2];
      const viewer = args[3];
      const item = args[4];

      if (!template || typeof template !== 'string') {
        return template;
      }

      const isActorViewer = viewer?.id === actor?.id;
      const isTargetViewer = viewer?.id === target?.id;

      // Get pronouns
      const getPronouns = (obj) => {
        if (!obj) return { subject: 'it', object: 'it', possessive: 'its' };
        return obj.pronouns || { subject: 'they', object: 'them', possessive: 'their' };
      };

      const actorPronouns = getPronouns(actor);
      const targetPronouns = getPronouns(target);

      // Reflexive maps
      const reflexiveMap = {
        'he': 'himself', 'she': 'herself', 'they': 'themselves', 'it': 'itself',
        'you': 'yourself'
      };

      // Get names
      const actorName = actor?.name || 'someone';
      const targetName = target?.name || 'someone';
      const itemName = item?.name || 'something';

      // Get location
      let locationName = 'somewhere';
      if (actor?.location) {
        const loc = await $.load(actor.location);
        if (loc) locationName = loc.name || 'somewhere';
      }

      // Capitalize helper
      const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

      let result = template;

      // Actor substitutions
      if (isActorViewer) {
        result = result.replace(/%A/g, 'You');
        result = result.replace(/%a(?![oprs])/g, 'you');
        result = result.replace(/%as/g, 'you');
        result = result.replace(/%ao/g, 'you');
        result = result.replace(/%ap/g, 'your');
        result = result.replace(/%ar/g, 'yourself');
      } else {
        result = result.replace(/%A/g, cap(actorName));
        result = result.replace(/%a(?![oprs])/g, actorName);
        result = result.replace(/%as/g, actorPronouns.subject);
        result = result.replace(/%ao/g, actorPronouns.object);
        result = result.replace(/%ap/g, actorPronouns.possessive);
        result = result.replace(/%ar/g, reflexiveMap[actorPronouns.subject] || 'themselves');
      }

      // Target substitutions
      if (isTargetViewer) {
        result = result.replace(/%T/g, 'You');
        result = result.replace(/%t(?![oprs])/g, 'you');
        result = result.replace(/%ts/g, 'you');
        result = result.replace(/%to/g, 'you');
        result = result.replace(/%tp/g, 'your');
        result = result.replace(/%tr/g, 'yourself');
      } else {
        result = result.replace(/%T/g, cap(targetName));
        result = result.replace(/%t(?![oprs])/g, targetName);
        result = result.replace(/%ts/g, targetPronouns.subject);
        result = result.replace(/%to/g, targetPronouns.object);
        result = result.replace(/%tp/g, targetPronouns.possessive);
        result = result.replace(/%tr/g, reflexiveMap[targetPronouns.subject] || 'themselves');
      }

      // Item and location
      result = result.replace(/%i/g, itemName);
      result = result.replace(/%l/g, locationName);

      // Verb conjugation: %v{base} -> base for "you", base+s for third person
      result = result.replace(/%v\\{([^}]+)\\}/g, (match, verb) => {
        if (isActorViewer) return verb; // "you cut"
        // Third person singular
        if (verb.endsWith('s') || verb.endsWith('x') || verb.endsWith('ch') || verb.endsWith('sh') || verb.endsWith('o')) {
          return verb + 'es';
        }
        if (verb.endsWith('y') && !'aeiou'.includes(verb[verb.length - 2])) {
          return verb.slice(0, -1) + 'ies';
        }
        return verb + 's';
      });

      // Literal %
      result = result.replace(/%%/g, '%');

      return result;
    `);

    // Announce to a room with multi-perspective messages
    // messages object has optional actor/target/others keys
    // If a key is missing, falls back to others -> actor
    this.pronounSub.setMethod('announce', `
      const room = args[0];
      const actor = args[1];
      const target = args[2];
      const messages = args[3]; // { actor?, target?, others? }
      const sound = args[4];
      const item = args[5];

      if (!room) return;

      const contents = room.contents || [];
      const defaultMsg = messages.others || messages.actor || '';

      for (const objId of contents) {
        const viewer = await $.load(objId);
        if (!viewer) continue;

        // Pick appropriate message template
        let template;
        if (viewer.id === actor?.id) {
          template = messages.actor || defaultMsg;
        } else if (viewer.id === target?.id) {
          template = messages.target || defaultMsg;
        } else {
          template = messages.others || defaultMsg;
        }

        // Format with perspective
        const formatted = await self.perspective(template, actor, target, viewer, item);

        // Send visual message (via see)
        if (formatted && viewer.see) {
          await viewer.see(formatted);
        }

        // Send sound (via hear)
        if (sound && viewer.hear) {
          await viewer.hear(sound, null, actor);
        }
      }
    `);

    // Send sensation to a target
    this.pronounSub.setMethod('sensation', `
      const target = args[0];
      const sensation = args[1]; // { type, intensity, partName, ... }

      if (target && target.onSensation) {
        await target.onSensation(sensation);
      }
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.pronounSub) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.pronoun = this.pronounSub.id;
    objectManager.set('aliases', aliases);

    console.log(`✅ Registered pronoun alias -> #${this.pronounSub.id}`);
  }
}
