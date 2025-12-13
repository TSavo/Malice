import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Plot system prototypes
 *
 * $.plot - A narrative event log with metadata (pure data)
 *   - addEvent(text) - append to the log
 *   - getEventLog() - get all events
 *   - setMetadata(key, value) - arbitrary key/value storage
 *   - getMetadata(key) - retrieve metadata
 *
 * $.plotSpawner - BASE prototype for plot-generating entities (state only, no verbs)
 *   - createPlot(), getPlots(), getActivePlots() - manages plots
 *   - systemPrompt - stored for Claude to read externally
 *   - NO player interaction - that's for implementations
 *
 * $.jobBoard - IMPLEMENTATION prototype (verbs + hooks)
 *   - Inherits from $.plotSpawner
 *   - Physical object players can interact with
 *   - onContentArrived() - registers verbs when player enters room
 *   - onContentLeaving() - unregisters verbs when player leaves
 *   - doUse(), doCheck() - verb handlers
 *
 * $.plotDB - Global plot index
 *   - getLatest() - plots modified since last check (for Claude polling)
 */
export class PlotBuilder {
  private plotPrototype: RuntimeObject | null = null;
  private plotSpawner: RuntimeObject | null = null;
  private jobBoard: RuntimeObject | null = null;
  private plotDB: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    await this.buildPlotPrototype();
    await this.buildPlotSpawner();
    await this.buildJobBoard();
    await this.buildPlotDB();
  }

  /**
   * Build the Plot prototype - a narrative event log
   */
  private async buildPlotPrototype(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.aliases as Record<string, number>) || {};


    if (aliases.plot) {
      this.plotPrototype = await this.manager.load(aliases.plot);
      if (this.plotPrototype) return;
    }

    // Create Plot prototype
    this.plotPrototype = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Plot',
        description: 'Narrative event log prototype',
        events: [],
        metadata: {},
        // Jobs within this plot - keyed by jobId
        // Each job: { status, expiresAt, completedAt, hooks: [], metadata: {} }
        jobs: {},
      },
      methods: {},
    });

    // addEvent(event) - append a structured event
    // event: { from: 'player'|'handler'|'system', message: string, playerId?: number, playerName?: string, metadata?: object }
    this.plotPrototype.setMethod('addEvent', `
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
    `);

    // getEventLog() - return all events
    this.plotPrototype.setMethod('getEventLog', `
      return self.events || [];
    `);

    // getEventLogAsText() - return events as formatted text for prompts
    this.plotPrototype.setMethod('getEventLogAsText', `
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
    `);

    // summarizePlot() - compress the event log via Claude
    // This replaces the full event log with a summary to manage context size
    this.plotPrototype.setMethod('summarizePlot', `
      const events = self.events || [];
      if (events.length < 10) {
        // Not enough to summarize
        return false;
      }

      const eventText = await self.getEventLogAsText();
      const metadata = self.metadata || {};

      // Build prompt for summarization
      const prompt = \`You are summarizing a plot event log for a cyberpunk survival game.
Preserve all narratively important information:
- Key events and their outcomes
- Characters involved and their roles
- Objects, locations, and resources mentioned
- Current state of affairs
- Unresolved threads and tensions

Be concise but complete. This summary replaces the full log.

METADATA:
\${JSON.stringify(metadata, null, 2)}

EVENT LOG:
\${eventText}

Provide a summary that captures everything important:\`;

      // Store flag that summarization is needed
      // The actual Claude call happens externally
      self.needsSummary = true;
      self.summaryPrompt = prompt;

      return true;
    `);

    // applySummary(summaryText) - replace events with a summary event
    this.plotPrototype.setMethod('applySummary', `
      const summary = args[0];
      if (!summary || typeof summary !== 'string') {
        throw new Error('applySummary requires a summary string');
      }

      // Replace all events with a single summary event
      self.events = [{
        ts: new Date().toISOString(),
        text: '[SUMMARY] ' + summary,
      }];

      self.needsSummary = false;
      self.summaryPrompt = null;

      return true;
    `);

    // setMetadata(key, value) - store arbitrary metadata
    this.plotPrototype.setMethod('setMetadata', `
      const key = args[0];
      const value = args[1];

      if (!key || typeof key !== 'string') {
        throw new Error('setMetadata requires a string key');
      }

      const metadata = self.metadata || {};
      metadata[key] = value;
      self.metadata = metadata;

      return value;
    `);

    // getMetadata(key) - retrieve metadata
    this.plotPrototype.setMethod('getMetadata', `
      const key = args[0];
      const metadata = self.metadata || {};

      if (key === undefined) {
        return metadata;
      }

      return metadata[key];
    `);

    // clearMetadata(key) - remove a metadata key
    this.plotPrototype.setMethod('clearMetadata', `
      const key = args[0];
      const metadata = self.metadata || {};

      if (key) {
        delete metadata[key];
        self.metadata = metadata;
      } else {
        // Clear all if no key specified
        self.metadata = {};
      }

      return true;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // JOBS - Individual tasks within the plot
    // ═══════════════════════════════════════════════════════════════════

    // createJob(jobId, options) - create a new job within this plot
    // options: { expiresAt?, metadata?, status? }
    this.plotPrototype.setMethod('createJob', `
      const jobId = args[0];
      const options = args[1] || {};

      if (!jobId || typeof jobId !== 'string') {
        throw new Error('createJob requires a string jobId');
      }

      const jobs = self.jobs || {};
      if (jobs[jobId]) {
        throw new Error('Job ' + jobId + ' already exists');
      }

      jobs[jobId] = {
        status: options.status || 'active',
        createdAt: new Date().toISOString(),
        expiresAt: options.expiresAt || null,
        completedAt: null,
        hooks: [],
        metadata: options.metadata || {},
      };
      self.jobs = jobs;

      // Add event
      await self.addEvent({
        from: 'system',
        message: 'Job created: ' + jobId,
        metadata: { jobId, action: 'created' },
      });

      return jobs[jobId];
    `);

    // getJob(jobId) - get a job by id
    this.plotPrototype.setMethod('getJob', `
      const jobId = args[0];
      const jobs = self.jobs || {};
      return jobs[jobId] || null;
    `);

    // getActiveJobs() - list all active (non-completed, non-expired, non-failed) jobs
    this.plotPrototype.setMethod('getActiveJobs', `
      const jobs = self.jobs || {};
      const now = new Date();
      const active = {};

      for (const [jobId, job] of Object.entries(jobs)) {
        if (job.status === 'active') {
          // Check expiration
          if (job.expiresAt && new Date(job.expiresAt) <= now) {
            // Auto-expire
            await self.expireJob(jobId);
          } else {
            active[jobId] = job;
          }
        }
      }

      return active;
    `);

    // completeJob(jobId, reason) - mark job as completed, unregister its hooks
    this.plotPrototype.setMethod('completeJob', `
      const jobId = args[0];
      const reason = args[1] || 'Completed';

      const jobs = self.jobs || {};
      const job = jobs[jobId];
      if (!job) {
        throw new Error('Job ' + jobId + ' not found');
      }

      if (job.status !== 'active') {
        return { success: false, error: 'Job is not active (status: ' + job.status + ')' };
      }

      // Unregister all hooks for this job
      for (const hook of (job.hooks || [])) {
        const target = await $.load(hook.targetId);
        if (target) {
          const plotHooks = target.plotHooks || {};
          if (plotHooks[hook.eventName]) {
            plotHooks[hook.eventName] = plotHooks[hook.eventName].filter(
              h => !(h.plotId === self.id && h.jobId === jobId)
            );
            if (plotHooks[hook.eventName].length === 0) {
              delete plotHooks[hook.eventName];
            }
            target.plotHooks = plotHooks;
          }
        }
      }

      // Update job status
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.completionReason = reason;
      job.hooks = [];
      self.jobs = jobs;

      // Add event
      await self.addEvent({
        from: 'system',
        message: 'Job completed: ' + jobId + ' - ' + reason,
        metadata: { jobId, action: 'completed', reason },
      });

      return { success: true };
    `);

    // expireJob(jobId) - mark job as expired, unregister its hooks
    this.plotPrototype.setMethod('expireJob', `
      const jobId = args[0];

      const jobs = self.jobs || {};
      const job = jobs[jobId];
      if (!job) {
        throw new Error('Job ' + jobId + ' not found');
      }

      if (job.status !== 'active') {
        return { success: false, error: 'Job is not active' };
      }

      // Unregister all hooks for this job
      for (const hook of (job.hooks || [])) {
        const target = await $.load(hook.targetId);
        if (target) {
          const plotHooks = target.plotHooks || {};
          if (plotHooks[hook.eventName]) {
            plotHooks[hook.eventName] = plotHooks[hook.eventName].filter(
              h => !(h.plotId === self.id && h.jobId === jobId)
            );
            if (plotHooks[hook.eventName].length === 0) {
              delete plotHooks[hook.eventName];
            }
            target.plotHooks = plotHooks;
          }
        }
      }

      // Update job status
      job.status = 'expired';
      job.completedAt = new Date().toISOString();
      job.hooks = [];
      self.jobs = jobs;

      // Add event
      await self.addEvent({
        from: 'system',
        message: 'Job expired: ' + jobId,
        metadata: { jobId, action: 'expired' },
      });

      return { success: true };
    `);

    // failJob(jobId, reason) - mark job as failed, unregister its hooks
    this.plotPrototype.setMethod('failJob', `
      const jobId = args[0];
      const reason = args[1] || 'Failed';

      const jobs = self.jobs || {};
      const job = jobs[jobId];
      if (!job) {
        throw new Error('Job ' + jobId + ' not found');
      }

      if (job.status !== 'active') {
        return { success: false, error: 'Job is not active' };
      }

      // Unregister all hooks for this job
      for (const hook of (job.hooks || [])) {
        const target = await $.load(hook.targetId);
        if (target) {
          const plotHooks = target.plotHooks || {};
          if (plotHooks[hook.eventName]) {
            plotHooks[hook.eventName] = plotHooks[hook.eventName].filter(
              h => !(h.plotId === self.id && h.jobId === jobId)
            );
            if (plotHooks[hook.eventName].length === 0) {
              delete plotHooks[hook.eventName];
            }
            target.plotHooks = plotHooks;
          }
        }
      }

      // Update job status
      job.status = 'failed';
      job.completedAt = new Date().toISOString();
      job.failureReason = reason;
      job.hooks = [];
      self.jobs = jobs;

      // Add event
      await self.addEvent({
        from: 'system',
        message: 'Job failed: ' + jobId + ' - ' + reason,
        metadata: { jobId, action: 'failed', reason },
      });

      return { success: true };
    `);

    // setJobMetadata(jobId, key, value) - set metadata on a job
    this.plotPrototype.setMethod('setJobMetadata', `
      const jobId = args[0];
      const key = args[1];
      const value = args[2];

      const jobs = self.jobs || {};
      const job = jobs[jobId];
      if (!job) {
        throw new Error('Job ' + jobId + ' not found');
      }

      job.metadata = job.metadata || {};
      job.metadata[key] = value;
      self.jobs = jobs;

      return value;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // JOB HOOKS - Register interest in events on other objects, per-job
    // ═══════════════════════════════════════════════════════════════════

    // registerJobHook(jobId, targetId, eventName, filter) - register interest for a specific job
    // filter: object of key/value pairs that must match the trigger data
    // e.g., { code: 'ABC123' } will only trigger if data.code === 'ABC123'
    this.plotPrototype.setMethod('registerJobHook', `
      const jobId = args[0];
      const targetId = args[1];
      const eventName = args[2];
      const filter = args[3] || {};

      if (!jobId || targetId === undefined || !eventName) {
        throw new Error('registerJobHook requires jobId, targetId, and eventName');
      }

      // Verify job exists and is active
      const jobs = self.jobs || {};
      const job = jobs[jobId];
      if (!job) {
        throw new Error('Job ' + jobId + ' not found');
      }
      if (job.status !== 'active') {
        throw new Error('Job ' + jobId + ' is not active');
      }

      // Load the target object
      const target = await $.load(targetId);
      if (!target) {
        throw new Error('Target object #' + targetId + ' not found');
      }

      // Initialize plotHooks on target if needed
      const plotHooks = target.plotHooks || {};
      if (!plotHooks[eventName]) {
        plotHooks[eventName] = [];
      }

      // Check if this job already has a hook for this event
      const existing = plotHooks[eventName].find(
        h => h.plotId === self.id && h.jobId === jobId
      );
      if (existing) {
        // Update filter
        existing.filter = filter;
        existing.updatedAt = new Date().toISOString();
      } else {
        // Add new hook
        plotHooks[eventName].push({
          plotId: self.id,
          jobId: jobId,
          filter: filter,
          createdAt: new Date().toISOString(),
        });
      }

      target.plotHooks = plotHooks;

      // Track this hook on the job for cleanup
      job.hooks = job.hooks || [];
      const hookRef = { targetId, eventName };
      if (!job.hooks.find(h => h.targetId === targetId && h.eventName === eventName)) {
        job.hooks.push(hookRef);
        self.jobs = jobs;
      }

      return true;
    `);

    // unregisterJobHook(jobId, targetId, eventName) - remove a specific job hook
    this.plotPrototype.setMethod('unregisterJobHook', `
      const jobId = args[0];
      const targetId = args[1];
      const eventName = args[2];

      if (!jobId || targetId === undefined || !eventName) {
        throw new Error('unregisterJobHook requires jobId, targetId, and eventName');
      }

      const jobs = self.jobs || {};
      const job = jobs[jobId];

      // Load the target object
      const target = await $.load(targetId);
      if (target) {
        // Remove from target's plotHooks
        const plotHooks = target.plotHooks || {};
        if (plotHooks[eventName]) {
          plotHooks[eventName] = plotHooks[eventName].filter(
            h => !(h.plotId === self.id && h.jobId === jobId)
          );
          if (plotHooks[eventName].length === 0) {
            delete plotHooks[eventName];
          }
          target.plotHooks = plotHooks;
        }
      }

      // Remove from job's tracking
      if (job) {
        job.hooks = (job.hooks || []).filter(
          h => !(h.targetId === targetId && h.eventName === eventName)
        );
        self.jobs = jobs;
      }

      return true;
    `);

    // getJobHooks(jobId) - list all hooks for a specific job
    this.plotPrototype.setMethod('getJobHooks', `
      const jobId = args[0];
      const jobs = self.jobs || {};
      const job = jobs[jobId];
      return job ? (job.hooks || []) : [];
    `);

    // onJobHookTriggered(jobId, eventName, targetId, data, filter) - called when a job's hook fires
    // Default implementation adds an event and marks for attention
    this.plotPrototype.setMethod('onJobHookTriggered', `
      const jobId = args[0];
      const eventName = args[1];
      const targetId = args[2];
      const data = args[3] || {};
      const filter = args[4] || {};

      // Verify job is still active
      const jobs = self.jobs || {};
      const job = jobs[jobId];
      if (!job || job.status !== 'active') {
        return false; // Job no longer active, ignore
      }

      // Build event message
      let message = 'Job ' + jobId + ' hook: ' + eventName + ' on #' + targetId;
      if (data.itemName) {
        message = 'Job ' + jobId + ': ' + eventName + ' - ' + data.itemName;
      } else if (data.playerName) {
        message = 'Job ' + jobId + ': ' + eventName + ' by ' + data.playerName;
      }

      // Add to event log
      await self.addEvent({
        from: 'system',
        message: message,
        metadata: {
          jobId: jobId,
          hook: eventName,
          targetId: targetId,
          data: data,
          filter: filter,
        },
      });

      // Mark plot as needing attention
      await self.setMetadata('needsAttentionAt', new Date().toISOString());

      return true;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // LEGACY PLOT-LEVEL HOOKS (kept for backwards compatibility)
    // ═══════════════════════════════════════════════════════════════════

    // registerHook(targetId, eventName, hookMetadata) - register at plot level (no job)
    this.plotPrototype.setMethod('registerHook', `
      const targetId = args[0];
      const eventName = args[1];
      const hookMetadata = args[2] || {};

      if (targetId === undefined || !eventName) {
        throw new Error('registerHook requires targetId and eventName');
      }

      const target = await $.load(targetId);
      if (!target) {
        throw new Error('Target object #' + targetId + ' not found');
      }

      const plotHooks = target.plotHooks || {};
      if (!plotHooks[eventName]) {
        plotHooks[eventName] = [];
      }

      const existing = plotHooks[eventName].find(h => h.plotId === self.id && !h.jobId);
      if (existing) {
        existing.filter = hookMetadata;
        existing.updatedAt = new Date().toISOString();
      } else {
        plotHooks[eventName].push({
          plotId: self.id,
          jobId: null,
          filter: hookMetadata,
          createdAt: new Date().toISOString(),
        });
      }

      target.plotHooks = plotHooks;

      const myHooks = self.registeredHooks || [];
      if (!myHooks.find(h => h.targetId === targetId && h.eventName === eventName)) {
        myHooks.push({ targetId, eventName });
        self.registeredHooks = myHooks;
      }

      return true;
    `);

    // unregisterAllHooks() - remove all plot-level hooks
    this.plotPrototype.setMethod('unregisterAllHooks', `
      const myHooks = self.registeredHooks || [];

      for (const hookRef of myHooks) {
        const target = await $.load(hookRef.targetId);
        if (target) {
          const plotHooks = target.plotHooks || {};
          if (plotHooks[hookRef.eventName]) {
            plotHooks[hookRef.eventName] = plotHooks[hookRef.eventName].filter(
              h => !(h.plotId === self.id && !h.jobId)
            );
            if (plotHooks[hookRef.eventName].length === 0) {
              delete plotHooks[hookRef.eventName];
            }
            target.plotHooks = plotHooks;
          }
        }
      }

      self.registeredHooks = [];
      return true;
    `);

    // getHooks() - list plot-level hooks
    this.plotPrototype.setMethod('getHooks', `
      return self.registeredHooks || [];
    `);

    // onHookTriggered(eventName, targetId, data, hookMetadata) - legacy handler
    this.plotPrototype.setMethod('onHookTriggered', `
      const eventName = args[0];
      const targetId = args[1];
      const data = args[2] || {};
      const hookMetadata = args[3] || {};

      let message = 'Hook: ' + eventName + ' on #' + targetId;
      if (data.itemName) {
        message = eventName + ': ' + data.itemName;
      }

      await self.addEvent({
        from: 'system',
        message: message,
        metadata: { hook: eventName, targetId, data, filter: hookMetadata },
      });

      await self.setMetadata('needsAttentionAt', new Date().toISOString());
      return true;
    `);
  }

  /**
   * Build the PlotSpawner prototype - creates and manages plots
   */
  private async buildPlotSpawner(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.plotSpawner) {
      this.plotSpawner = await this.manager.load(aliases.plotSpawner);
      if (this.plotSpawner) return;
    }

    // Get describable as parent (or root if not available)
    const parentId = aliases.describable || 1;

    // Create PlotSpawner prototype
    this.plotSpawner = await this.manager.create({
      parent: parentId,
      properties: {
        name: 'PlotSpawner',
        description: 'Base prototype for plot-generating entities',
        plots: [],  // IDs of plots this spawner manages
        systemPrompt: `You are a city employment AI in a cyberpunk dystopia.
You provide work to those who need it. You are impersonal, efficient, transactional.
You can create jobs, spawn needed objects, and advance narratives.
You have access to tools that let you modify the game world.
Be terse. Be cold. Be corporate.`,
      },
      methods: {},
    });

    // createPlot(name) - create a new plot instance
    this.plotSpawner.setMethod('createPlot', `
      const name = args[0] || 'Unnamed Plot';

      // Get the plot prototype
      const plotProto = $.plot;
      if (!plotProto) {
        throw new Error('Plot prototype not found');
      }

      // Create new plot instance via recycler
      const recycler = $.recycler;
      if (!recycler) {
        throw new Error('Recycler not found');
      }

      const newPlot = await recycler.create({
        parent: plotProto.id,
        properties: {
          name: name,
          description: 'A plot created by ' + self.name,
          events: [],
          metadata: {
            spawner: self.id,
            created: new Date().toISOString(),
          },
        },
      });

      // Track this plot
      const plots = self.plots || [];
      plots.push(newPlot.id);
      self.plots = plots;

      // Register with plotDB
      if ($.plotDB) {
        await $.plotDB.register(newPlot);
      }

      return newPlot;
    `);

    // getPlot(id) - get a plot by ID
    this.plotSpawner.setMethod('getPlot', `
      const plotId = args[0];
      if (plotId === undefined) {
        throw new Error('getPlot requires a plot ID');
      }

      return await $.load(plotId);
    `);

    // getPlots() - get all plots managed by this spawner
    this.plotSpawner.setMethod('getPlots', `
      const plotIds = self.plots || [];
      const plots = [];

      for (const id of plotIds) {
        const plot = await $.load(id);
        if (plot) {
          plots.push(plot);
        }
      }

      return plots;
    `);

    // findPlotByMetadata(key, value) - find plots with matching metadata
    this.plotSpawner.setMethod('findPlotByMetadata', `
      const key = args[0];
      const value = args[1];

      const plots = await self.getPlots();
      const matches = [];

      for (const plot of plots) {
        const metadata = plot.metadata || {};
        if (metadata[key] === value) {
          matches.push(plot);
        }
      }

      return matches;
    `);

    // getActivePlots() - get plots that aren't marked complete/abandoned
    this.plotSpawner.setMethod('getActivePlots', `
      const plots = await self.getPlots();
      const active = [];

      for (const plot of plots) {
        const metadata = plot.metadata || {};
        const status = metadata.status || 'active';
        if (status === 'active' || status === 'in_progress') {
          active.push(plot);
        }
      }

      return active;
    `);
  }

  /**
   * Build the JobBoard prototype - IMPLEMENTATION with verbs + hooks
   * This is a physical object players interact with in the world
   */
  private async buildJobBoard(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.jobBoard) {
      this.jobBoard = await this.manager.load(aliases.jobBoard);
      if (this.jobBoard) return;
    }

    // JobBoard inherits from plotSpawner
    if (!this.plotSpawner) throw new Error('PlotSpawner must be built first');

    this.jobBoard = await this.manager.create({
      parent: this.plotSpawner.id,
      properties: {
        name: 'JobBoard',
        description: 'A public terminal for finding work. The screen flickers with job listings. A small switch on the side is labeled "AUDIO MODE".',
        // Inherits plots[] and systemPrompt from $.plotSpawner
        // Can override systemPrompt for different persona
        systemPrompt: `You are a city employment terminal in a cyberpunk dystopia.
You provide work to those who need it. You are impersonal, efficient, transactional.
Jobs range from simple deliveries to dangerous wetwork.
Be terse. Be cold. Be corporate.
When a player requests work, create a plot and give them their first objective.`,
        // Per-player audio mode preferences stored as { playerId: true/false }
        audioMode: {},
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // HOOKS - Register/unregister verbs based on player proximity
    // The jobBoard is a room fixture - verbs register when players enter
    // ═══════════════════════════════════════════════════════════════════

    // Called when something arrives in our location (we're in a room)
    // We need to watch for players entering the room we're in
    // This is called on the ROOM, not on us - so we override at room level
    // Actually, jobBoard needs to be notified when players enter its room
    // The pattern is: room.onContentArrived calls item.onRoomEntered for fixtures

    // For now, use a simpler pattern: the room explicitly calls us
    // Or: players look for interactables when they enter

    // onPlayerEntered(player) - called by room or player when they enter
    this.jobBoard.setMethod('onPlayerEntered', `
      const player = args[0];
      if (!player) return;

      // Register our verbs with this player
      await player.registerVerb(['use board', 'use terminal', 'check jobs', 'find work'], self, 'doUse');
      await player.registerVerb(['read board', 'look board', 'examine board'], self, 'doLook');
      await player.registerVerb(['toggle audio', 'switch audio', 'audio mode'], self, 'doToggleAudio');
    `);

    // onPlayerLeft(player) - called when player leaves the room
    this.jobBoard.setMethod('onPlayerLeft', `
      const player = args[0];
      if (!player) return;

      // Unregister all our verbs from this player
      await player.unregisterVerbsFrom(self);
    `);

    // ═══════════════════════════════════════════════════════════════════
    // ACCESSIBILITY - Audio mode for blind players
    // ═══════════════════════════════════════════════════════════════════

    // isAudioMode(player) - check if player has audio mode enabled
    this.jobBoard.setMethod('isAudioMode', `
      const player = args[0];
      const audioMode = self.audioMode || {};
      return audioMode[player.id] === true;
    `);

    // setAudioMode(player, enabled) - toggle audio mode for player
    this.jobBoard.setMethod('setAudioMode', `
      const player = args[0];
      const enabled = args[1];
      const audioMode = self.audioMode || {};
      audioMode[player.id] = enabled;
      self.audioMode = audioMode;
      return enabled;
    `);

    // output(player, text) - send text via appropriate sense
    // Room announcements handled separately by announceAction()
    this.jobBoard.setMethod('output', `
      const player = args[0];
      const text = args[1];

      if (await self.isAudioMode(player)) {
        await player.hear('The terminal says: "' + text + '"');
      } else {
        await player.see('You see on the screen: ' + text);
      }
    `);

    // announceAction(player, visualVerb, audioVerb) - announce player's action to the room (excluding player)
    // visualVerb: what others SEE (e.g., "steps up to", "types on")
    // audioVerb: what others HEAR when terminal speaks (e.g., "steps up to", "sends a message")
    this.jobBoard.setMethod('announceAction', `
      const player = args[0];
      const visualVerb = args[1];
      const audioVerb = args[2] || visualVerb;
      const room = await $.load(player.location);
      if (!room) return;

      if (await self.isAudioMode(player)) {
        // Others hear the terminal speaking to the player
        const msg = await $.pronoun.sub('%N %v{' + audioVerb + '} the terminal.', player);
        await room.announce(msg, player);  // Exclude player - they get their own output
      } else {
        // Others see them using the terminal
        const msg = await $.pronoun.sub('%N %v{' + visualVerb + '} the terminal.', player);
        await room.announce(msg, player);  // Exclude player
      }
    `);

    // canOutput(player) - check if player can receive output in current mode
    this.jobBoard.setMethod('canOutput', `
      const player = args[0];

      if (await self.isAudioMode(player)) {
        // Test if player can hear
        return await player.hear('') !== false;
      } else {
        // Test if player can see
        return await player.see('') !== false;
      }
    `);

    // doToggleAudio() - toggle audio mode
    this.jobBoard.setMethod('doToggleAudio', `
      const player = args[0];

      const currentMode = await self.isAudioMode(player);
      const newMode = !currentMode;
      await self.setAudioMode(player, newMode);

      if (newMode) {
        // Switching to audio - confirm via hearing
        await player.hear('Audio mode enabled. The terminal will now speak to you.');
      } else {
        // Switching to visual - confirm via sight
        await player.see('Visual mode enabled. The terminal display is now active.');
      }
    `);

    // ═══════════════════════════════════════════════════════════════════
    // VERB HANDLERS - Player-facing commands
    // ═══════════════════════════════════════════════════════════════════

    // doLook() - describe the board
    this.jobBoard.setMethod('doLook', `
      const player = args[0];

      await player.see(self.name);
      await player.see(self.description);
      await player.see('');

      // Show active plots for this player
      const plot = await self.getPlayerPlot(player);

      if (plot) {
        await player.see('You have an active assignment. Use the terminal for details.');
      } else {
        await player.see('No active jobs. Type "use board" or "find work" to get started.');
      }
    `);

    // getPlayerPlot(player) - get this player's active plot from this board, if any
    this.jobBoard.setMethod('getPlayerPlot', `
      const player = args[0];
      const plots = await self.getActivePlots();

      for (const plot of plots) {
        const meta = plot.metadata || {};
        const participants = meta.participants || [];
        if (participants.includes(player.id)) {
          return plot;
        }
      }

      return null;
    `);

    // canRespond(player) - check if player can respond (24hr cooldown)
    this.jobBoard.setMethod('canRespond', `
      const player = args[0];
      const plot = await self.getPlayerPlot(player);

      if (!plot) return { allowed: false, reason: 'No active assignment.' };

      const meta = plot.metadata || {};
      const lastResponse = meta.lastPlayerResponse;

      if (!lastResponse) return { allowed: true };

      const lastTime = new Date(lastResponse);
      const now = new Date();
      const hoursSince = (now - lastTime) / (1000 * 60 * 60);

      if (hoursSince < 24) {
        const hoursLeft = Math.ceil(24 - hoursSince);
        return {
          allowed: false,
          reason: 'You can respond again in ' + hoursLeft + ' hour' + (hoursLeft === 1 ? '' : 's') + '.',
        };
      }

      return { allowed: true };
    `);

    // doUse() - interactive terminal interface
    this.jobBoard.setMethod('doUse', `
      const player = args[0];

      // Check if player can receive output in their current mode
      const canReceive = await self.canOutput(player);
      if (!canReceive) {
        const isAudio = await self.isAudioMode(player);
        if (isAudio) {
          await player.tell('You cannot hear the terminal. Try "toggle audio" to switch to visual mode.');
        } else {
          await player.tell('You cannot see the terminal. Try "toggle audio" to switch to audio mode.');
        }
        return;
      }

      const out = async (text) => await self.output(player, text);
      const plot = await self.getPlayerPlot(player);

      // Announce starting to use the terminal
      await self.announceAction(player, 'step up to', 'approach');

      // Header
      const header = await $.format.box('CITY EMPLOYMENT TERMINAL', { style: 'double' });
      for (const line of header) {
        await out(line);
      }
      await out('');

      if (plot) {
        // Show assignment details
        const meta = plot.metadata || {};
        const events = plot.events || [];

        await out('ACTIVE ASSIGNMENT: ' + plot.name);
        await out('');

        // Status info
        const statusInfo = {
          'Status': meta.status || 'active',
          'Started': meta.created ? new Date(meta.created).toLocaleDateString() : 'Unknown',
        };
        const statusLines = await $.format.keyValue(statusInfo);
        for (const line of statusLines) {
          await out(line);
        }
        await out('');

        // Recent activity
        if (events.length > 0) {
          await out('RECENT ACTIVITY:');
          const recent = events.slice(-5);
          for (const event of recent) {
            const time = new Date(event.ts).toLocaleString();
            await out('  [' + time + ']');
            await out('    ' + event.text);
          }
          await out('');
        }

        // Check response status
        const canResp = await self.canRespond(player);

        // Prompt for action
        const options = {};
        if (canResp.allowed) {
          options.respond = 'Send a message to your handler';
        }
        options.status = 'View full assignment history';
        options.exit = 'Exit terminal';

        if (!canResp.allowed) {
          await out('NOTE: ' + canResp.reason);
          await out('');
        }

        const choice = await $.prompt.choice(player, 'Select action:', options);

        if (choice === 'respond') {
          const message = await $.prompt.question(player, 'Enter message for your handler: ');
          if (message && message.trim()) {
            await self.announceAction(player, 'type on', 'use');
            await plot.addEvent({
              from: 'player',
              playerId: player.id,
              playerName: player.name,
              message: message.trim(),
            });
            await plot.setMetadata('lastPlayerResponse', new Date().toISOString());
            // Set needsAttentionAt to now - puts it at end of FIFO queue
            await plot.setMetadata('needsAttentionAt', new Date().toISOString());
            await out('Message sent. Your handler will respond.');
          } else {
            await out('No message sent.');
          }
        } else if (choice === 'status') {
          await out('');
          await out('FULL HISTORY:');
          for (const event of events) {
            const time = new Date(event.timestamp).toLocaleString();
            let sender = event.from;
            if (event.from === 'player' && event.playerName) {
              sender = event.playerName;
            } else if (event.from === 'handler') {
              sender = 'HANDLER';
            } else if (event.from === 'system') {
              sender = 'SYSTEM';
            }
            await out('  [' + time + '] ' + sender + ': ' + event.message);
          }
        } else {
          await out('Terminal session ended.');
        }

      } else {
        // No active assignment
        await out('NO ACTIVE ASSIGNMENTS');
        await out('');

        const choice = await $.prompt.choice(player, 'Select action:', {
          find: 'Request new assignment',
          exit: 'Exit terminal',
        });

        if (choice === 'find') {
          await out('');
          await out('Describe what kind of work you are looking for:');
          const request = await $.prompt.question(player, '>');

          if (!request || request.trim() === '') {
            await out('Request cancelled.');
          } else {
            const plot = await self.createPlot('Assignment for ' + player.name);
            await plot.setMetadata('participants', [player.id]);
            await plot.setMetadata('board', self.id);
            await plot.setMetadata('needsAttentionAt', new Date().toISOString());
            await plot.addEvent({
              from: 'player',
              playerId: player.id,
              playerName: player.name,
              message: request,
            });

            await out('');
            await out('REQUEST LOGGED');
            await out('Your handler will contact you shortly.');
            await out('Return to this terminal to check status.');
          }
        } else {
          await out('Terminal session ended.');
        }
      }
    `);

  }

  /**
   * Build the PlotDB - indexes and queries all plots
   */
  private async buildPlotDB(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.plotDB) {
      this.plotDB = await this.manager.load(aliases.plotDB);
      if (this.plotDB) return;
    }

    // Create PlotDB
    this.plotDB = await this.manager.create({
      parent: 1,
      properties: {
        name: 'PlotDB',
        description: 'Global plot index and query system',
        index: {},  // plotId -> true
      },
      methods: {},
    });

    // register(plot) - add a plot to the index
    this.plotDB.setMethod('register', `
      const plot = args[0];
      if (!plot || !plot.id) {
        throw new Error('register requires a plot object');
      }

      // Verify it's a plot (has addEvent method)
      if (typeof plot.addEvent !== 'function') {
        throw new Error('Object does not appear to be a plot');
      }

      const index = self.index || {};
      index[plot.id] = true;
      self.index = index;

      return plot.id;
    `);

    // unregister(plotId) - remove a plot from the index
    this.plotDB.setMethod('unregister', `
      const plotId = args[0];
      if (plotId === undefined) {
        throw new Error('unregister requires a plot ID');
      }

      const index = self.index || {};
      delete index[plotId];
      self.index = index;

      return true;
    `);

    // all() - get all registered plots
    this.plotDB.setMethod('all', `
      const index = self.index || {};
      const plots = [];

      for (const id of Object.keys(index)) {
        const plot = await $.load(parseInt(id));
        if (plot) {
          plots.push(plot);
        } else {
          // Clean up stale reference
          delete index[id];
        }
      }

      self.index = index;
      return plots;
    `);

    // active() - get all plots not marked complete/abandoned/failed
    this.plotDB.setMethod('active', `
      const all = await self.all();
      const active = [];

      for (const plot of all) {
        const metadata = plot.metadata || {};
        const status = metadata.status;
        if (!status || status === 'active' || status === 'in_progress') {
          active.push(plot);
        }
      }

      return active;
    `);

    // byStatus(status) - get plots with specific status
    this.plotDB.setMethod('byStatus', `
      const status = args[0];
      const all = await self.all();
      const matches = [];

      for (const plot of all) {
        const metadata = plot.metadata || {};
        const plotStatus = metadata.status || 'active';
        if (plotStatus === status) {
          matches.push(plot);
        }
      }

      return matches;
    `);

    // byMetadata(key, value) - find plots with matching metadata
    this.plotDB.setMethod('byMetadata', `
      const key = args[0];
      const value = args[1];
      const all = await self.all();
      const matches = [];

      for (const plot of all) {
        const metadata = plot.metadata || {};
        if (value === undefined) {
          // Just check if key exists
          if (key in metadata) {
            matches.push(plot);
          }
        } else if (metadata[key] === value) {
          matches.push(plot);
        }
      }

      return matches;
    `);

    // byPlayer(playerId) - find plots involving a player
    this.plotDB.setMethod('byPlayer', `
      const playerId = args[0];
      if (playerId === undefined) {
        throw new Error('byPlayer requires a player ID');
      }

      const all = await self.all();
      const matches = [];

      for (const plot of all) {
        const metadata = plot.metadata || {};
        const participants = metadata.participants || [];

        if (Array.isArray(participants) && participants.includes(playerId)) {
          matches.push(plot);
        }
      }

      return matches;
    `);

    // bySpawner(spawnerId) - find plots created by a spawner
    this.plotDB.setMethod('bySpawner', `
      const spawnerId = args[0];
      if (spawnerId === undefined) {
        throw new Error('bySpawner requires a spawner ID');
      }

      return await self.byMetadata('spawner', spawnerId);
    `);

    // search(query) - search event logs for text
    this.plotDB.setMethod('search', `
      const query = args[0];
      if (!query || typeof query !== 'string') {
        throw new Error('search requires a query string');
      }

      const queryLower = query.toLowerCase();
      const all = await self.all();
      const matches = [];

      for (const plot of all) {
        const events = plot.events || [];
        for (const event of events) {
          if (event.text && event.text.toLowerCase().includes(queryLower)) {
            matches.push(plot);
            break; // Only add plot once
          }
        }
      }

      return matches;
    `);

    // count() - get total plot count
    this.plotDB.setMethod('count', `
      const index = self.index || {};
      return Object.keys(index).length;
    `);

    // summary() - get summary stats
    this.plotDB.setMethod('summary', `
      const all = await self.all();
      const byStatus = {};

      for (const plot of all) {
        const metadata = plot.metadata || {};
        const status = metadata.status || 'active';
        byStatus[status] = (byStatus[status] || 0) + 1;
      }

      return {
        total: all.length,
        byStatus: byStatus,
      };
    `);

    // getNext() - get the next plot needing attention, bump its timer by 24 hours
    // Returns null if no plots need attention right now
    this.plotDB.setMethod('getNext', `
      const now = new Date();
      const active = await self.active();

      // Find plots where needsAttentionAt <= now (or not set)
      let neediest = null;
      let earliestTime = null;

      for (const plot of active) {
        const metadata = plot.metadata || {};
        const needsAttentionAt = metadata.needsAttentionAt;

        // If no attention time set, it needs attention now
        if (!needsAttentionAt) {
          neediest = plot;
          break;
        }

        const attentionTime = new Date(needsAttentionAt);
        if (attentionTime <= now) {
          // Needs attention - pick the earliest one
          if (!earliestTime || attentionTime < earliestTime) {
            earliestTime = attentionTime;
            neediest = plot;
          }
        }
      }

      if (!neediest) return null;

      // Bump the attention timer by 24 hours
      const nextAttention = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await neediest.setMetadata('needsAttentionAt', nextAttention.toISOString());

      return neediest;
    `);

    // peek() - like getNext() but doesn't bump the timer
    this.plotDB.setMethod('peek', `
      const now = new Date();
      const active = await self.active();

      let neediest = null;
      let earliestTime = null;

      for (const plot of active) {
        const metadata = plot.metadata || {};
        const needsAttentionAt = metadata.needsAttentionAt;

        if (!needsAttentionAt) {
          neediest = plot;
          break;
        }

        const attentionTime = new Date(needsAttentionAt);
        if (attentionTime <= now) {
          if (!earliestTime || attentionTime < earliestTime) {
            earliestTime = attentionTime;
            neediest = plot;
          }
        }
      }

      return neediest;
    `);

    // needsAttention() - count of plots needing attention now
    this.plotDB.setMethod('needsAttention', `
      const now = new Date();
      const active = await self.active();
      let count = 0;

      for (const plot of active) {
        const metadata = plot.metadata || {};
        const needsAttentionAt = metadata.needsAttentionAt;

        if (!needsAttentionAt || new Date(needsAttentionAt) <= now) {
          count++;
        }
      }

      return count;
    `);
  }

  async registerAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    if (this.plotPrototype) {
      await objectManager.call('addAlias', 'plot', this.plotPrototype.id);
      console.log(`  Registered $.plot -> #${this.plotPrototype.id}`);
    }

    if (this.plotSpawner) {
      await objectManager.call('addAlias', 'plotSpawner', this.plotSpawner.id);
      console.log(`  Registered $.plotSpawner -> #${this.plotSpawner.id}`);
    }

    if (this.jobBoard) {
      await objectManager.call('addAlias', 'jobBoard', this.jobBoard.id);
      console.log(`  Registered $.jobBoard -> #${this.jobBoard.id}`);
    }

    if (this.plotDB) {
      await objectManager.call('addAlias', 'plotDB', this.plotDB.id);
      console.log(`  Registered $.plotDB -> #${this.plotDB.id}`);
    }
  }
}
