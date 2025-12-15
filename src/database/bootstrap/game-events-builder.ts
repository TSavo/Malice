import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds GameEvents object for emitting game events to MongoDB
 *
 * Events are stored in a `game_events` collection with TTL for auto-cleanup.
 * External services (like NPC agents) watch this collection via change streams.
 *
 * Usage from MOO code:
 *   await $.events.emit('speech', { speakerId: self.id, message: 'Hello', locationId: location.id })
 */
export class GameEventsBuilder {
  private events: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.events) {
      this.events = await this.manager.load(aliases.events);
      if (this.events) return; // Already exists
    }

    // Create new GameEvents object
    this.events = await this.manager.create({
      parent: 1,
      properties: {
        name: 'GameEvents',
        description: 'Game event emission system for external services',
      },
      methods: {},
    });

    // Emit method - inserts event into game_events collection
    this.events.setMethod('emit', `
      /** Emit a game event for external services to consume.
       *  @param eventType - Type of event (speech, emote, movement, etc.)
       *  @param data - Event data object
       *  @returns The created event ID
       */
      const eventType = args[0];
      const data = args[1] || {};

      if (!eventType) {
        throw new Error('Event type is required');
      }

      // Create event document
      const event = {
        type: eventType,
        data: data,
        timestamp: new Date().toISOString(),
        processed: false,
      };

      // Insert into game_events collection via ObjectManager
      // The _emitGameEvent method is added to ObjectManager to handle this
      const eventId = await $._emitGameEvent(event);

      return eventId;
    `);

    // Register alias
    aliases.events = this.events.id;
    objectManager.set('aliases', aliases);

    console.log(`✅ Registered $.events alias to #${this.events.id}`);
  }
}
