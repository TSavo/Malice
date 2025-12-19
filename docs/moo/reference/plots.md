# Plot System Reference

The plot system provides narrative management for quests, missions, and storylines. It consists of plots (event logs with metadata), jobs (individual tasks), phases (progression stages), and hooks (event watchers).

## Overview

The plot system has these key components:

- **Plot** (`$plot`) - A narrative event log with metadata
- **Job** - A specific task within a plot (e.g., delivery, mission)
- **Phase** - A stage of progression within a job
- **Hook** - Event watchers that trigger when things happen in the world
- **PlotDB** (`$plotDB`) - Global index of all plots
- **JobBoard** (`$jobBoard`) - Physical object players interact with

## Creating Plots

### Via MCP Tool

```javascript
// Create a new plot
const plot = await $plot.create({ name: 'Delivery Mission' });

// Create via MCP tool
plot({ action: 'create', name: 'Escort Mission', metadata: { difficulty: 'hard' } })
```

### Plot Properties

| Property | Type | Description |
|----------|------|-------------|
| `events` | array | Event log entries |
| `metadata` | object | Arbitrary key-value data |
| `phases` | array | Phase definitions |
| `jobs` | object | Jobs keyed by jobId |
| `status` | string | 'active', 'completed', 'abandoned', 'failed' |

## Event Logging

### Adding Events

```javascript
// Add a structured event
await plot.addEvent({
  from: 'player',        // 'player', 'handler', or 'system'
  message: 'Picked up the package',
  playerId: player.id,
  playerName: player.name,
  metadata: { itemId: package.id },
});

// System event
await plot.addEvent({
  from: 'system',
  message: 'Timer started: 30 minutes remaining',
  metadata: { deadline: new Date(Date.now() + 30*60*1000).toISOString() },
});
```

### Event Structure

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Source: 'player', 'handler', 'system' |
| `message` | string | Event description |
| `timestamp` | string | ISO timestamp (auto-added) |
| `playerId` | number | Player's object ID (optional) |
| `playerName` | string | Player's name (optional) |
| `metadata` | object | Additional data (optional) |

### Retrieving Events

```javascript
// Get all events
const events = await plot.getEventLog();

// Get formatted text for prompts
const text = await plot.getEventLogAsText();
// [1/15/2024 3:30 PM] Bob: Picked up the package
// [1/15/2024 3:31 PM] SYSTEM: Timer started: 30 minutes remaining
```

### Summarizing (Context Management)

```javascript
// Mark for summarization (when log gets too long)
await plot.summarizePlot();
// Sets plot.needsSummary = true
// Sets plot.summaryPrompt = prompt for Claude

// Apply the summary (after external Claude call)
await plot.applySummary("Summary text replacing event log...");
```

## Metadata

Store arbitrary data on plots:

```javascript
// Set metadata
await plot.setMetadata('targetLocation', locker.id);
await plot.setMetadata('reward', { credits: 500 });
await plot.setMetadata('participants', [player1.id, player2.id]);

// Get metadata
const location = await plot.getMetadata('targetLocation');
const allMetadata = await plot.getMetadata(); // Get all

// Clear metadata
await plot.clearMetadata('targetLocation'); // Clear one
await plot.clearMetadata(); // Clear all
```

## Phases

Phases define the narrative structure of a plot. Jobs progress through phases.

### Defining Phases

```javascript
await plot.setPhases([
  {
    id: 'accept',
    name: 'Accept Mission',
    description: 'Player accepts the job at the board',
    prompt: 'Waiting for player to accept the mission',
    metadata: { reward: 100 },
  },
  {
    id: 'pickup',
    name: 'Pickup Package',
    description: 'Player retrieves the package',
    prompt: 'Package is at locker #123. Player must retrieve it.',
    metadata: { lockerId: 123 },
  },
  {
    id: 'deliver',
    name: 'Deliver Package',
    description: 'Player delivers to destination',
    prompt: 'Deliver package to drop point #456',
    metadata: { destinationId: 456 },
  },
  {
    id: 'complete',
    name: 'Complete',
    description: 'Mission completed',
    prompt: 'Pay the player and close the job',
  },
]);
```

### Phase Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Display name |
| `description` | string | What happens in this phase |
| `prompt` | string | Instructions for AI handler |
| `metadata` | object | Phase-specific data |

### Phase Methods

```javascript
// Get all phases
const phases = await plot.getPhases();

// Get specific phase
const phase = await plot.getPhase('pickup');

// Get phase index
const idx = await plot.getPhaseIndex('deliver'); // 2

// Get next phase
const next = await plot.getNextPhase('pickup'); // deliver phase

// Add phase dynamically
await plot.addPhase({
  id: 'bonus',
  name: 'Bonus Objective',
  description: 'Optional side task',
});

// Add after specific phase
await plot.addPhase({ id: 'checkpoint', name: 'Checkpoint' }, 'pickup');

// Update phase
await plot.updatePhase('deliver', { prompt: 'Updated instructions...' });

// Remove phase
await plot.removePhase('bonus');
```

## Jobs

Jobs are individual tasks within a plot. Multiple players can have jobs in the same plot.

### Creating Jobs

```javascript
// Create a job
const job = await plot.createJob('delivery-001', {
  expiresAt: new Date(Date.now() + 60*60*1000).toISOString(), // 1 hour
  metadata: {
    playerId: player.id,
    playerName: player.name,
    packageId: package.id,
  },
});

// Job auto-starts on first phase if phases are defined
```

### Job Structure

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | 'active', 'completed', 'failed', 'expired' |
| `createdAt` | string | ISO timestamp |
| `expiresAt` | string | Optional expiration time |
| `completedAt` | string | When finished |
| `hooks` | array | Registered event hooks |
| `metadata` | object | Job-specific data |
| `currentPhase` | string | Current phase ID |
| `phaseStartedAt` | string | When current phase began |
| `phaseHistory` | array | Completed phases |

### Job Operations

```javascript
// Get a job
const job = await plot.getJob('delivery-001');

// Get all active jobs
const active = await plot.getActiveJobs();

// Complete a job
await plot.completeJob('delivery-001', 'Package delivered successfully');

// Fail a job
await plot.failJob('delivery-001', 'Package was destroyed');

// Set job metadata
await plot.setJobMetadata('delivery-001', 'bonusEarned', true);
```

## Job Phase Tracking

Track player progression through phases:

```javascript
// Start on a specific phase
await plot.startJobPhase('delivery-001', 'pickup');

// Advance to next phase
const result = await plot.advanceJobPhase('delivery-001');
// { advanced: true, newPhase: 'deliver' }
// or { advanced: false, complete: true } if no more phases

// Jump to specific phase
await plot.setJobPhase('delivery-001', 'complete');

// Get current phase info
const phaseInfo = await plot.getJobPhase('delivery-001');
// {
//   phase: { id, name, description, prompt, metadata },
//   phaseId: 'deliver',
//   startedAt: '2024-01-15T15:30:00Z',
//   history: [{ phaseId: 'pickup', startedAt, completedAt, outcome }]
// }
```

### Phase Hooks

Override these methods for custom behavior:

```javascript
// Called when a phase starts
plot.setMethod('onPhaseStarted', `
  const jobId = args[0];
  const phaseId = args[1];

  if (phaseId === 'pickup') {
    // Create the package, set up the locker, etc.
  }
`);

// Called when a phase completes
plot.setMethod('onPhaseCompleted', `
  const jobId = args[0];
  const phaseId = args[1];

  if (phaseId === 'deliver') {
    // Give reward, update reputation, etc.
  }
`);

// Called when a phase fails
plot.setMethod('onPhaseFailed', `
  const jobId = args[0];
  const phaseId = args[1];
  const reason = args[2];

  // Handle failure (cleanup, penalties, etc.)
`);
```

## Hooks - Event Watching

Register hooks on objects to be notified when events occur.

### Registering Job Hooks

```javascript
// Watch for item deposited in locker
await plot.registerJobHook(
  'delivery-001',     // jobId
  locker.id,          // targetId
  'itemDeposited',    // eventName
  { code: 'PKG-001' } // filter (optional)
);

// Watch for player entering room
await plot.registerJobHook(
  'escort-001',
  saferoom.id,
  'playerEntered',
  { playerId: player.id }
);
```

### Triggering Hooks

From the target object, trigger when events occur:

```javascript
// In locker's deposit method
await self.triggerPlotHooks('itemDeposited', {
  itemId: item.id,
  itemName: item.name,
  code: item.code,
  depositorId: player.id,
  depositorName: player.name,
});
```

### Hook Callback

Override to handle hook triggers:

```javascript
plot.setMethod('onJobHookTriggered', `
  const jobId = args[0];
  const eventName = args[1];
  const targetId = args[2];
  const data = args[3];
  const filter = args[4];

  if (eventName === 'itemDeposited') {
    // Package delivered! Advance to next phase
    await self.advanceJobPhase(jobId);
  }
`);
```

### Unregistering Hooks

```javascript
// Remove specific hook
await plot.unregisterJobHook('delivery-001', locker.id, 'itemDeposited');

// Hooks are auto-cleaned when job completes/fails/expires
```

## Plot Status

### Closing Plots

```javascript
// Mark as completed
await $plotDB.closePlot(plot.id, 'completed', 'All jobs finished');

// Mark as abandoned
await $plotDB.closePlot(plot.id, 'abandoned', 'No participants left');

// Mark as failed
await $plotDB.closePlot(plot.id, 'failed', 'Critical failure');
```

### Querying Plots

```javascript
// List all plots by status
const activePlots = await $plotDB.list('active');
const completedPlots = await $plotDB.list('completed');

// Get plots needing attention (bumps attention timer)
const nextPlot = await $plotDB.next();

// Search plot events
const results = await $plotDB.search('package');
```

## MCP Tool Integration

The MCP server provides the `plot` tool:

```javascript
// Create plot
plot({ action: 'create', name: 'Mission', metadata: { type: 'delivery' } })

// Get plot details
plot({ action: 'get', plotId: 123 })

// List plots
plot({ action: 'list', status: 'active' })

// Add event
plot({ action: 'add_event', plotId: 123, message: 'Something happened', from: 'handler' })

// Set metadata
plot({ action: 'set_metadata', plotId: 123, key: 'reward', value: 500 })

// Create job
plot({ action: 'create_job', plotId: 123, jobId: 'delivery-1', expiresAt: '...' })

// Set phases
plot({ action: 'set_phases', plotId: 123, phases: [...] })

// Advance phase
plot({ action: 'advance_phase', plotId: 123, jobId: 'delivery-1' })

// Register hook
plot({ action: 'register_hook', plotId: 123, jobId: 'delivery-1', targetId: 456, eventName: 'itemDeposited' })

// Complete job
plot({ action: 'complete_job', plotId: 123, jobId: 'delivery-1', reason: 'Success' })

// Get next plot needing attention
plot({ action: 'next' })
```

## Job Board

The JobBoard is a physical object players interact with to get jobs:

```javascript
// Create a job board instance
const board = await $recycler.create({
  parent: $jobBoard.id,
  properties: {
    name: 'City Jobs Board',
    description: 'A bulletin board listing available work.',
  },
});

// When player enters room, verbs are registered:
// - 'check board', 'look board' -> shows available jobs
// - 'use board' -> starts job application
```

## Example: Delivery Mission

```javascript
// 1. Create plot with phases
const plot = await createPlot('Delivery Mission');
await plot.setPhases([
  { id: 'accept', name: 'Accept Job', prompt: 'Waiting for acceptance' },
  { id: 'pickup', name: 'Pickup', prompt: 'Get package from locker #123' },
  { id: 'deliver', name: 'Deliver', prompt: 'Take to dropbox #456' },
  { id: 'done', name: 'Complete', prompt: 'Pay reward and close' },
]);

// 2. Create job when player accepts
const job = await plot.createJob('player-' + player.id, {
  metadata: { playerId: player.id },
  expiresAt: oneHourFromNow,
});

// 3. Register hooks
await plot.registerJobHook(job.id, pickupLocker.id, 'itemRemoved');
await plot.registerJobHook(job.id, dropbox.id, 'itemDeposited');

// 4. Handle hook triggers
plot.setMethod('onJobHookTriggered', `
  const jobId = args[0];
  const eventName = args[1];

  if (eventName === 'itemRemoved') {
    await self.advanceJobPhase(jobId); // pickup -> deliver
  }
  if (eventName === 'itemDeposited') {
    await self.advanceJobPhase(jobId); // deliver -> done
    await self.completeJob(jobId, 'Delivered successfully');
    // Pay player, etc.
  }
`);
```

## Best Practices

### 1. Use Phases for Structure

Define clear phases so AI handlers and monitoring can track progress:

```javascript
// Good - clear progression
['accept', 'travel', 'complete-task', 'return', 'reward']

// Less useful - vague
['start', 'middle', 'end']
```

### 2. Log Important Events

```javascript
// Log player actions
await plot.addEvent({
  from: 'player',
  message: player.name + ' entered the restricted area',
  playerId: player.id,
});

// Log system decisions
await plot.addEvent({
  from: 'handler',
  message: 'Increasing difficulty due to time bonus',
});
```

### 3. Use Hooks for Automation

Let hooks trigger phase transitions instead of polling:

```javascript
// Good - reactive
await plot.registerJobHook(jobId, target.id, 'itemDeposited');

// Less efficient - polling
// setInterval(() => checkIfDelivered(), 5000);
```

### 4. Clean Up Resources

Jobs auto-clean hooks on completion/failure, but for plot-level resources:

```javascript
// In onPhaseCompleted for final phase
if (phaseId === 'done') {
  // Recycle any created objects
  await $recycler.recycle(tempPackageId);
  // Remove any room modifications
}
```

## See Also

- [Event Hooks](./hooks.md) - triggerPlotHooks
- [AI/NPC System](./ai-npc.md) - AI handling of plots
- [$ Globals Reference](./globals.md) - $plot, $plotDB
