import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds Plot prototype - simplified for abilities-first architecture
 *
 * $.plot - A narrative event log with metadata
 *   - Tracks quests, jobs, assignments
 *   - NPCs create plots directly via $recycler.create($plot, {...})
 *   - Players track their plots via player.activePlots[]
 *
 * No $plotSpawner - NPCs create plots directly
 * No $jobBoard - NPCs handle job requests conversationally
 * Minimal $plotDB - just for Pluribus to find plots needing attention
 */
export class PlotBuilder implements Builder {
  static provides = ['plot', 'plotDB'];
  static depends: string[] = [];

  private plotPrototype: RuntimeObject | null = null;
  private plotDB: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    await this.buildPlotPrototype();
    await this.buildPlotDB();
  }

  /**
   * Build the Plot prototype - a narrative event log
   */
  private async buildPlotPrototype(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.plot) {
      this.plotPrototype = await this.manager.load(aliases.plot);
      if (this.plotPrototype) return;
    }

    // Create Plot prototype
    const root = await this.manager.load('root');
    this.plotPrototype = await this.manager.create({
      parent: root!,
      properties: {
        name: 'Plot',
        description: 'Narrative event log for tracking quests and assignments',
        events: [],
        metadata: {},
        status: 'active', // active, completed, abandoned, failed
        // Abilities - plot mechanics for AI interpretation
        abilities: `Narrative tracking object for quests, jobs, and assignments.

CREATING: NPCs create plots via $recycler.create($plot, { name, metadata }). Add plot to player.activePlots array to track.

EVENTS: Call addEvent({ from, message, ... }) to log what happens. Events have timestamp, sender (player/handler/system), and message.

METADATA: Use setMetadata(key, value) and getMetadata(key) for arbitrary data like participants, objectives, rewards, deadlines.

STATUS: The 'status' property tracks state: active, completed, abandoned, failed. Update when plot resolves.

READING: getEventLog() returns all events. getEventLogAsText() formats for display.

ATTENTION: Set metadata.needsAttentionAt to ISO timestamp when handler (city AI) should respond. $plotDB.needsAttention() finds these.`,
      },
      methods: {},
    });

    // Add property descriptions
    this.plotPrototype.setPropertyDescription(
      'events',
      'Array of { timestamp, from, message, ... } event objects.',
    );
    this.plotPrototype.setPropertyDescription(
      'metadata',
      'Arbitrary key/value storage: participants, objectives, rewards, etc.',
    );
    this.plotPrototype.setPropertyDescription(
      'status',
      'Plot state: active, completed, abandoned, failed.',
    );

    // addEvent(event) - append a structured event
    this.plotPrototype.setMethod(
      'addEvent',
      `
      /** Add an event to this plot's log.
       *  @param event - { from: 'player'|'handler'|'system', message: string, playerId?, playerName? }
       *  @returns Event count
       */
      const event = args[0];
      if (!event || typeof event !== 'object') {
        throw new Error('addEvent requires an event object');
      }
      if (!event.from || !event.message) {
        throw new Error('addEvent requires from and message fields');
      }

      const events = self.events || [];
      events.push({
        ...event,
        timestamp: new Date().toISOString(),
      });
      self.events = events;

      return events.length;
    `,
    );

    // getEventLog() - return all events
    this.plotPrototype.setMethod(
      'getEventLog',
      `
      /** Get all events in this plot.
       *  @returns Array of event objects
       */
      return self.events || [];
    `,
    );

    // getEventLogAsText() - return events as formatted text
    this.plotPrototype.setMethod(
      'getEventLogAsText',
      `
      /** Get events formatted as text for display.
       *  @returns Formatted string of all events
       */
      const events = self.events || [];
      if (events.length === 0) {
        return '[No events yet]';
      }

      return events.map(e => {
        const date = new Date(e.timestamp);
        const timeStr = date.toLocaleString();
        let sender = e.from;
        if (e.from === 'player' && e.playerName) {
          sender = e.playerName;
        } else if (e.from === 'handler') {
          sender = 'HANDLER';
        } else if (e.from === 'system') {
          sender = 'SYSTEM';
        }
        return '[' + timeStr + '] ' + sender + ': ' + e.message;
      }).join('\\n');
    `,
    );

    // setMetadata(key, value) - store arbitrary metadata
    this.plotPrototype.setMethod(
      'setMetadata',
      `
      /** Set a metadata value on this plot.
       *  @param key - Metadata key
       *  @param value - Any value
       *  @returns The value set
       */
      const key = args[0];
      const value = args[1];

      if (!key || typeof key !== 'string') {
        throw new Error('setMetadata requires a string key');
      }

      const metadata = self.metadata || {};
      metadata[key] = value;
      self.metadata = metadata;

      return value;
    `,
    );

    // getMetadata(key) - retrieve metadata
    this.plotPrototype.setMethod(
      'getMetadata',
      `
      /** Get a metadata value from this plot.
       *  @param key - Metadata key
       *  @returns The value or undefined
       */
      const key = args[0];
      const metadata = self.metadata || {};
      return metadata[key];
    `,
    );

    // complete(outcome) - mark plot as completed
    this.plotPrototype.setMethod(
      'complete',
      `
      /** Mark this plot as completed.
       *  @param outcome - Optional outcome description
       */
      const outcome = args[0] || 'completed';
      self.status = 'completed';
      await self.setMetadata('completedAt', new Date().toISOString());
      await self.setMetadata('outcome', outcome);
      await self.addEvent({ from: 'system', message: 'Plot completed: ' + outcome });
    `,
    );

    // abandon(reason) - mark plot as abandoned
    this.plotPrototype.setMethod(
      'abandon',
      `
      /** Mark this plot as abandoned.
       *  @param reason - Optional reason
       */
      const reason = args[0] || 'abandoned';
      self.status = 'abandoned';
      await self.setMetadata('abandonedAt', new Date().toISOString());
      await self.setMetadata('reason', reason);
      await self.addEvent({ from: 'system', message: 'Plot abandoned: ' + reason });
    `,
    );

    // fail(reason) - mark plot as failed
    this.plotPrototype.setMethod(
      'fail',
      `
      /** Mark this plot as failed.
       *  @param reason - Optional failure reason
       */
      const reason = args[0] || 'failed';
      self.status = 'failed';
      await self.setMetadata('failedAt', new Date().toISOString());
      await self.setMetadata('reason', reason);
      await self.addEvent({ from: 'system', message: 'Plot failed: ' + reason });
    `,
    );
  }

  /**
   * Build minimal PlotDB - just for finding plots needing attention
   */
  private async buildPlotDB(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.plotDB) {
      this.plotDB = await this.manager.load(aliases.plotDB);
      if (this.plotDB) return;
    }

    // Create minimal PlotDB
    const root = await this.manager.load('root');
    this.plotDB = await this.manager.create({
      parent: root!,
      properties: {
        name: 'PlotDB',
        description: 'Minimal plot index for finding plots needing attention',
        index: {}, // plotId -> true
        abilities: `Index of all plots for the city AI to poll.

REGISTERING: Call register(plot) when creating a plot. Call unregister(plotId) when removing.

FINDING WORK: Call needsAttention() to get plots where metadata.needsAttentionAt <= now, sorted FIFO.

This is infrastructure for Pluribus (city AI) to find player requests that need responses.`,
      },
      methods: {},
    });

    // Add property description
    this.plotDB.setPropertyDescription(
      'index',
      'Map of plotId -> true for all registered plots. Used for iteration.',
    );

    // register(plot) - add a plot to the index
    this.plotDB.setMethod(
      'register',
      `
      /** Register a plot in the index.
       *  @param plot - The plot object
       *  @returns The plot ID
       */
      const plot = args[0];
      if (!plot || !plot.id) {
        throw new Error('register requires a plot object');
      }

      const index = self.index || {};
      index[plot.id] = true;
      self.index = index;

      return plot.id;
    `,
    );

    // unregister(plotId) - remove from index
    this.plotDB.setMethod(
      'unregister',
      `
      /** Remove a plot from the index.
       *  @param plotId - The plot ID to remove
       */
      const plotId = args[0];
      const index = self.index || {};
      delete index[plotId];
      self.index = index;
    `,
    );

    // needsAttention() - find plots needing handler response (FIFO)
    this.plotDB.setMethod(
      'needsAttention',
      `
      /** Find plots needing attention, sorted FIFO by needsAttentionAt.
       *  @returns Array of plots where metadata.needsAttentionAt <= now
       */
      const index = self.index || {};
      const now = new Date();
      const needing = [];

      for (const id of Object.keys(index)) {
        const plot = await $load(parseInt(id));
        if (!plot) {
          delete index[id];
          continue;
        }

        const metadata = plot.metadata || {};
        const needsAt = metadata.needsAttentionAt;
        if (needsAt && new Date(needsAt) <= now) {
          needing.push({ plot, needsAt: new Date(needsAt) });
        }
      }

      self.index = index;

      // Sort FIFO - oldest first
      needing.sort((a, b) => a.needsAt - b.needsAt);
      return needing.map(n => n.plot);
    `,
    );

    // all() - get all registered plots
    this.plotDB.setMethod(
      'all',
      `
      /** Get all registered plots.
       *  @returns Array of plot objects
       */
      const index = self.index || {};
      const plots = [];

      for (const id of Object.keys(index)) {
        const plot = await $load(parseInt(id));
        if (plot) {
          plots.push(plot);
        } else {
          delete index[id];
        }
      }

      self.index = index;
      return plots;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    if (this.plotPrototype) {
      await objectManager.call('addAlias', 'plot', this.plotPrototype.id);
      console.log(`Registered plot alias -> #${this.plotPrototype.id}`);
    }

    if (this.plotDB) {
      await objectManager.call('addAlias', 'plotDB', this.plotDB.id);
      console.log(`Registered plotDB alias -> #${this.plotDB.id}`);
    }
  }
}

// Self-register
registerBuilder(PlotBuilder);
