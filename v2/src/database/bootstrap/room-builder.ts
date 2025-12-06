import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

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

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.room) {
      this.room = await this.manager.load(aliases.room);
      if (this.room) return; // Already exists
    }

    // Create new Room utility
    this.room = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Room',
        description: 'Room utility for announcements',
      },
      methods: {},
    });

    // Main announce method
    // announce({ room, actor, target?, see?, hear?, item? })
    // Both see and hear are templates that get pronoun-substituted
    this.room.setMethod('announce', `
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
        const viewer = await $.load(objId);
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
    `);

    // Announce with different messages for actor/target/others
    // announceMulti({ room, actor, target?, see: { actor?, target?, others }, hear: { actor?, target?, others }?, item? })
    this.room.setMethod('announceMulti', `
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
        const viewer = await $.load(objId);
        if (!viewer) continue;

        // Pick appropriate templates based on viewer
        let seeTemplate, hearTemplate;
        if (viewer.id === actor?.id) {
          seeTemplate = seeTemplates.actor || defaultSee;
          hearTemplate = hearTemplates.actor || defaultHear;
        } else if (viewer.id === target?.id) {
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
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.room) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.room = this.room.id;
    objectManager.set('aliases', aliases);

    console.log(`Registered room alias -> #${this.room.id}`);
  }
}
