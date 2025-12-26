import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds Room utility object (dynamic ID)
 * Handles room-wide announcements with multi-perspective messaging
 *
 * Usage from MOO code:
 *   await $.room.announce({
 *     room: location,
 *     actor: attacker,
 *     target: victim,
 *     see: '%A %v{cut} off %tp arm!',
 *     hear: '*SCHLICK* The wet sound of flesh separating.',
 *     item: severedArm,
 *   });
 *
 * Both see and hear are templates that get pronoun-substituted for each viewer.
 * Each person in the room gets:
 *   - see(formattedVisual, actor)
 *   - hear(formattedSound, actor)
 *
 * For the target:
 *   - feel(sensation) is called separately by the action
 */
export class RoomBuilder {
  private room: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.room) {
      this.room = await this.manager.load(aliases.room);
      if (this.room) return; // Already exists
    }

    // Create new Room utility
    const root = await this.manager.load(1);
    this.room = await this.manager.create({
      parent: root!,
      properties: {
        name: 'Room',
        description: 'Room utility for multi-perspective announcements',
        abilities: `Utility for broadcasting sensory events to room contents.

announce({ room, actor, target?, see?, hear?, item? }):
Single template for all viewers. Templates use $.pronoun.perspective()
for automatic you/they substitution per viewer.

announceMulti({ room, actor, target?, see: {actor?, target?, others}, hear: {...}, item? }):
Different messages for actor/target/others. Use when perspectives differ
significantly (e.g., "You stab them" vs "They stab you" vs "A stabs B").

ROUTING:
- see template → viewer.see() (visual, requires sight)
- hear template → viewer.hear() (auditory, requires hearing)

TEMPLATES use $.pronoun.perspective() codes:
- %A/%a = actor name/you
- %T/%t = target name/you
- %v{verb} = conjugated verb
- %ap/%tp = possessive (your/their)

CRITICAL: Use these for ANY action others could perceive.
Direct player.see() only reaches ONE person.`,
      },
      methods: {},
    });

    // Main announce method
    // announce({ room, actor, target?, see?, hear?, item? })
    // Both see and hear are templates that get pronoun-substituted
    this.room.setMethod(
      'announce',
      `
      const opts = args[0] || {};
      const room = opts.room;
      const actor = opts.actor;
      const target = opts.target;
      const seeTemplate = opts.see;
      const hearTemplate = opts.hear;
      const item = opts.item;

      if (!room) return;

      const contents = room.contents || [];

      for (const objId of contents) {
        const viewer = await $load(objId);
        if (!viewer) continue;

        // Format and send visual message
        if (seeTemplate && viewer.see) {
          const formatted = await $.pronoun.perspective(seeTemplate, actor, target, viewer, item);
          await viewer.see(formatted, actor);
        }

        // Format and send audio message
        if (hearTemplate && viewer.hear) {
          const formatted = await $.pronoun.perspective(hearTemplate, actor, target, viewer, item);
          await viewer.hear(formatted, null, actor);
        }
      }
    `,
    );

    // Announce with different messages for actor/target/others
    // announceMulti({ room, actor, target?, see: { actor?, target?, others }, hear: { actor?, target?, others }?, item? })
    this.room.setMethod(
      'announceMulti',
      `
      const opts = args[0] || {};
      const room = opts.room;
      const actor = opts.actor;
      const target = opts.target;
      const seeTemplates = opts.see || {};
      const hearTemplates = opts.hear || {};
      const item = opts.item;

      if (!room) return;

      const contents = room.contents || [];
      const defaultSee = seeTemplates.others || seeTemplates.actor || '';
      const defaultHear = hearTemplates.others || hearTemplates.actor || '';

      for (const objId of contents) {
        const viewer = await $load(objId);
        if (!viewer) continue;

        // Pick appropriate templates based on viewer
        let seeTemplate, hearTemplate;
        if (viewer === actor) {
          seeTemplate = seeTemplates.actor || defaultSee;
          hearTemplate = hearTemplates.actor || defaultHear;
        } else if (viewer === target) {
          seeTemplate = seeTemplates.target || defaultSee;
          hearTemplate = hearTemplates.target || defaultHear;
        } else {
          seeTemplate = seeTemplates.others || defaultSee;
          hearTemplate = hearTemplates.others || defaultHear;
        }

        // Format and send visual
        if (seeTemplate && viewer.see) {
          const formatted = await $.pronoun.perspective(seeTemplate, actor, target, viewer, item);
          await viewer.see(formatted, actor);
        }

        // Format and send audio
        if (hearTemplate && viewer.hear) {
          const formatted = await $.pronoun.perspective(hearTemplate, actor, target, viewer, item);
          await viewer.hear(formatted, null, actor);
        }
      }
    `,
    );
  }

  async registerAlias(): Promise<void> {
    if (!this.room) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'room', this.room.id);
    console.log(`Registered room alias -> #${this.room.id}`);
  }
}
