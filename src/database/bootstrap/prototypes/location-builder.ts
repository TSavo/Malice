import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Location prototype
 * Base prototype for things that can contain other things
 */
export class LocationBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Location',
        description: 'Base prototype for locations (things that can contain other things)',
        // contents inherited from Describable
      },
      methods: {},
    });

    obj.setMethod('describe', `
      const viewer = args[0]; // Agent viewing this location

      // Show location name and description
      let output = \`\${self.name}\\r\\n\${self.description}\\r\\n\`;

      // Show contents (if any), excluding the viewer
      const contents = self.contents || [];
      const others = contents.filter(id => id !== viewer?.id);
      if (others.length > 0) {
        output += '\\r\\nYou see:\\r\\n';
        for (const objId of others) {
          const obj = await $.load(objId);
          if (obj) {
            const shortDesc = await obj.shortDesc();
            output += \`  - \${shortDesc}\\r\\n\`;
          }
        }
      }

      return output;
    `);

    obj.setMethod('addContent', `
      let input = args[0];
      let objId;
      let obj;

      // Accept either ID (number) or RuntimeObject
      if (typeof input === 'number') {
        objId = input;
        obj = await $.load(objId);
      } else if (input && typeof input === 'object' && typeof input.id === 'number') {
        obj = input;
        objId = input.id;
      } else {
        return; // Invalid input
      }

      const contents = self.contents || [];
      if (!contents.includes(objId)) {
        contents.push(objId);
        self.contents = contents;

        // Set the object's location to this container
        if (obj) {
          obj.location = self.id;
        }

        // Call arrival hook
        if (self.onContentArrived) {
          await self.onContentArrived(obj);
        }
      }
    `);

    obj.setMethod('removeContent', `
      let input = args[0];
      let objId;

      // Accept either ID (number) or RuntimeObject
      if (typeof input === 'number') {
        objId = input;
      } else if (input && typeof input === 'object' && typeof input.id === 'number') {
        objId = input.id;
      } else {
        return; // Invalid input
      }

      const contents = self.contents || [];
      const index = contents.indexOf(objId);
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

      for (const objId of contents) {
        const viewer = await $.load(objId);
        if (!viewer) continue;

        // Determine which message to send
        let visualMsg = null;
        if (viewer.id === actor?.id && messages.actor) {
          visualMsg = messages.actor;
        } else if (viewer.id === target?.id && messages.target) {
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

      const isActorViewer = viewer?.id === actor?.id;
      const isTargetViewer = viewer?.id === target?.id;

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

      for (const objId of contents) {
        const listener = await $.load(objId);
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

    return obj;
  }
}
