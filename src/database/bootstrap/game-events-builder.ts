import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds GameEvents object for emitting game events to MongoDB
 *
 * Events are stored in a `game_events` collection with TTL for auto-cleanup.
 * External services (like NPC agents) can poll or watch this collection.
 *
 * Usage from MOO code:
 *   await $.events.emit('speech', { speakerId: self.id, message: 'Hello', locationId: location.id })
 */
export class GameEventsBuilder implements Builder {
  static provides = ['events'];
  static depends: string[] = [];

  private events: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.events) {
      this.events = await this.manager.load(aliases.events);
      if (this.events) return; // Already exists
    }

    // Create new GameEvents object
    const root = await this.manager.load('root');
    this.events = await this.manager.create({
      parent: root!,
      properties: {
        name: 'GameEvents',
        description: 'Game event emission system for external services',
      },
      methods: {},
    });

    // Emit method - inserts event into game_events collection
    this.events.setMethod(
      'emit',
      `
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
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.events) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'events', this.events.id);
    console.log(`Registered events alias -> #${this.events.id}`);
  }
}

// Self-register
registerBuilder(GameEventsBuilder);
