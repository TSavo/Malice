import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Location prototype
 * Base prototype for things that can contain other things
 */
export class LocationBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number, existingObj?: RuntimeObject): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(describableId);
    const obj = existingObj || await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Location',
        description: 'Base prototype for locations (things that can contain other things)',
        // contents inherited from Describable

        abilities: `Container that can hold other objects - the base for rooms and containers.

CONTENTS: 'contents' array holds objects inside this location. Objects have 'location' pointing back here.

MOVEMENT: Objects enter/leave via obj.moveTo(destination). This is THE primitive for all location changes:
- Pick up item: item.moveTo(hand)
- Drop item: item.moveTo(room)
- Put in container: item.moveTo(container)
moveTo() handles canContain() checks, hook calls, and contents array updates.

HOOKS: Movement triggers hooks in sequence:
- onContentLeaving(obj, dest, mover) - before leaving (can throw to cancel)
- onContentLeft(obj, dest, mover) - after leaving (cleanup, notifications)
- onContentArrived(obj, source, mover) - after arriving (register verbs, announce)

MESSAGING: announce(actor, target, messages) sends perspective-aware messages to everyone in location. formatMessage() handles pronoun substitution (%a, %t, %as, %ts, etc.).

SPEECH: broadcastSpeech(speech, speaker) sends speech to all listeners. Understanding depends on their 'knownLanguages'.

SENSATION: broadcastSensation(target, sensation) routes pain/feeling to target's onSensation handler.`,
      },
      methods: {},
    });

    obj.setMethod('describe', `
      const viewer = args[0]; // Agent viewing this location

      // Show location name and description
      let output = \`\${self.name}\\r\\n\${self.description}\\r\\n\`;

      // Show contents (if any), excluding the viewer
      const contents = self.contents || [];
      const others = contents.filter(c => (c?.id || c) !== viewer?.id);
      if (others.length > 0) {
        output += '\\r\\nYou see:\\r\\n';
        for (const obj of others) {
          if (obj) {
            // Handle both RuntimeObjects and raw IDs
            let shortDesc;
            if (typeof obj.shortDesc === 'function') {
              shortDesc = await obj.shortDesc();
            } else {
              shortDesc = obj.name || 'something';
            }
            output += \`  - \${shortDesc}\\r\\n\`;
          }
        }
      }

      return output;
    `);

    obj.setMethod('addContent', `
      let obj = args[0];

      // Accept either a RuntimeObject or an ID number
      if (typeof obj === 'number') {
        obj = await $load(obj);
      }

      if (!obj || typeof obj.id !== 'number') {
        return; // Invalid input
      }

      const contents = self.contents || [];
      // Check if already present (by id since we store objects)
      const alreadyPresent = contents.some(c => (c?.id || c) === obj.id);
      if (!alreadyPresent) {
        contents.push(obj);
        self.contents = contents;

        // Set the object's location to this container
        obj.location = self;

        // Call arrival hook
        if (self.onContentArrived) {
          await self.onContentArrived(obj);
        }
      }
    `);

    obj.setMethod('removeContent', `
      let obj = args[0];

      // Get the id we're looking for
      const targetId = typeof obj === 'number' ? obj : obj?.id;
      if (targetId === undefined) {
        return; // Invalid input
      }

      const contents = self.contents || [];
      const index = contents.findIndex(c => (c?.id || c) === targetId);
      if (index !== -1) {
        contents.splice(index, 1);
        self.contents = contents;
      }
    `);

    // Hook: called before an object leaves this location
    // Can throw to prevent the move
    obj.setMethod('onContentLeaving', `
      const obj = args[0];
      const dest = args[1];
      const mover = args[2];
      // Default: allow all departures
    `);

    // Hook: called after an object has left this location
    // Use for cleanup, unregistering verbs, notifications
    obj.setMethod('onContentLeft', `
      const obj = args[0];
      const dest = args[1];
      const mover = args[2];
      // Default: do nothing
    `);

    // Hook: called after an object has arrived in this location
    // Use for announcements, registering verbs, triggers
    obj.setMethod('onContentArrived', `
      const obj = args[0];
      const source = args[1];
      const mover = args[2];
      // Default: do nothing
    `);

    // === MESSAGING METHODS ===

    // Announce an event to the room with perspective-aware messaging
    // actor: who is doing the action
    // target: who the action is done to (optional)
    // messages: { actor: string, target: string, others: string }
    // sound: optional sound message everyone hears
    obj.setMethod('announce', `
      const actor = args[0];
      const target = args[1];
      const messages = args[2];
      const sound = args[3];

      const contents = self.contents || [];

      for (const viewer of contents) {
        if (!viewer) continue;

        // Determine which message to send
        let visualMsg = null;
        if (viewer === actor && messages.actor) {
          visualMsg = messages.actor;
        } else if (viewer === target && messages.target) {
          visualMsg = messages.target;
        } else if (messages.others) {
          visualMsg = messages.others;
        }

        // Apply pronoun substitution for this viewer
        if (visualMsg) {
          const formatted = await self.formatMessage(visualMsg, actor, target, viewer);
          if (viewer.see) {
            await viewer.see(formatted);
          }
        }

        // Sound goes to everyone who can hear
        if (sound && viewer.hear) {
          await viewer.hear(sound, null, actor);
        }
      }
    `);

    // Format a message with pronoun substitution
    // Placeholders:
    //   %a = actor's name (or "you" if viewer is actor)
    //   %A = actor's name (capitalized, or "You")
    //   %t = target's name (or "you" if viewer is target)
    //   %T = target's name (capitalized, or "You")
    //   %ap = actor's possessive pronoun (their/your)
    //   %tp = target's possessive pronoun (their/your)
    //   %as = actor's subject pronoun (they/you)
    //   %ts = target's subject pronoun (they/you)
    //   %ao = actor's object pronoun (them/you)
    //   %to = target's object pronoun (them/you)
    //   %av = actor's verb form (cuts/cut - s for third person)
    obj.setMethod('formatMessage', `
      const template = args[0];
      const actor = args[1];
      const target = args[2];
      const viewer = args[3];

      let result = template;

      // Helper to get pronouns
      const getPronouns = (obj) => {
        if (!obj) return { subject: 'it', object: 'it', possessive: 'its' };
        return obj.pronouns || { subject: 'they', object: 'them', possessive: 'their' };
      };

      const actorPronouns = getPronouns(actor);
      const targetPronouns = getPronouns(target);

      const isActorViewer = viewer === actor;
      const isTargetViewer = viewer === target;

      // Actor substitutions
      result = result.replace(/%A/g, isActorViewer ? 'You' : (actor?.name || 'Someone'));
      result = result.replace(/%a/g, isActorViewer ? 'you' : (actor?.name || 'someone'));
      result = result.replace(/%as/g, isActorViewer ? 'you' : actorPronouns.subject);
      result = result.replace(/%ao/g, isActorViewer ? 'you' : actorPronouns.object);
      result = result.replace(/%ap/g, isActorViewer ? 'your' : actorPronouns.possessive);

      // Target substitutions
      result = result.replace(/%T/g, isTargetViewer ? 'You' : (target?.name || 'Someone'));
      result = result.replace(/%t/g, isTargetViewer ? 'you' : (target?.name || 'someone'));
      result = result.replace(/%ts/g, isTargetViewer ? 'you' : targetPronouns.subject);
      result = result.replace(/%to/g, isTargetViewer ? 'you' : targetPronouns.object);
      result = result.replace(/%tp/g, isTargetViewer ? 'your' : targetPronouns.possessive);

      // Verb form: %av{base} -> base + s for third person
      // e.g., %av{cut} -> "cut" (you cut) or "cuts" (he cuts)
      result = result.replace(/%av\\{([^}]+)\\}/g, (match, verb) => {
        if (isActorViewer) return verb; // "you cut"
        // Third person singular - add s (simplified)
        if (verb.endsWith('s') || verb.endsWith('x') || verb.endsWith('ch') || verb.endsWith('sh')) {
          return verb + 'es';
        }
        return verb + 's';
      });

      return result;
    `);

    // Broadcast speech to everyone in the room
    obj.setMethod('broadcastSpeech', `
      const speech = args[0]; // { content, language, speaker, ... }
      const speaker = args[1];

      const contents = self.contents || [];

      for (const listener of contents) {
        if (!listener || !listener.hear) continue;

        // Everyone hears the speech (understanding depends on their languages)
        const heard = await listener.hear(speech);

        // If they understood and have a context, show the message
        if (heard && listener._context) {
          const speakerName = speaker?.name || 'Someone';
          if (heard.understood === false) {
            listener._context.send(speakerName + ' says something in ' + (heard.language || 'an unknown language') + '.\\r\\n');
          } else {
            listener._context.send(speakerName + ' says, "' + heard.content + '"\\r\\n');
          }
        }
      }
    `);

    // Broadcast a sensation (pain, etc.) to the target
    obj.setMethod('broadcastSensation', `
      const target = args[0];
      const sensation = args[1]; // { type, intensity, part, ... }

      if (target && target.onSensation) {
        await target.onSensation(sensation);
      }
    `);

    // Property descriptions for AI context (inherits from Describable)
    obj.setPropertyDescription('contents', 'Array of objects currently inside this location');

    return obj;
  }
}
