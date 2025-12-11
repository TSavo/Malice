# Plot System

Narrative event logging, job tracking, and dynamic quest system for Malice.

## Overview

The plot system provides tools for creating dynamic, reactive narratives:

- **$.plot** - Narrative event log with metadata (pure data store)
- **$.plotSpawner** - Base for plot-generating entities (state management, no verbs)
- **$.jobBoard** - Physical implementation (verbs + movement hooks)
- **$.plotDB** - Global plot index for external systems (Claude polling)

Together, these enable emergent storytelling where NPCs, items, and locations can spawn quests that players discover and complete.

## Architecture

### Data Layer: $.plot

Pure data object storing narrative history and job state.

### Logic Layer: $.plotSpawner

Base prototype providing plot/job management. NO player interaction verbs.

### Implementation Layer: $.jobBoard

Physical object players interact with. Inherits from $.plotSpawner, adds:
- Movement hooks (register/unregister verbs)
- Player-facing verbs (doUse, doCheck)

### Index Layer: $.plotDB

Global registry tracking all plots for external polling.

## $.plot - Narrative Event Log

Inherits from: **$.root**

### Purpose

Stores a chronological log of narrative events with arbitrary metadata. Pure data—no game logic, just storage.

### Properties

```javascript
{
  name: 'Plot Name',
  description: 'Plot description',
  events: [
    {
      from: 'player' | 'handler' | 'system',
      message: 'Event text',
      timestamp: '2025-12-11T10:30:00.000Z',
      playerId: 123,        // Optional
      playerName: 'Alice',  // Optional
      metadata: {}          // Optional
    },
    // ... more events
  ],
  metadata: {
    // Arbitrary key/value storage
    status: 'active',
    reward: 500,
    location: roomId,
    // ... anything you want
  },
  jobs: {
    // Job-specific tracking (see Jobs section)
    'deliver-package': {
      status: 'active',
      createdAt: '...',
      expiresAt: '...',
      completedAt: null,
      hooks: [],
      metadata: {}
    }
  }
}
```

### Key Methods

#### addEvent(event)
Append an event to the log.

```javascript
await plot.addEvent({
  from: 'player',
  message: 'Alice accepted the delivery job.',
  playerId: player.id,
  playerName: player.name,
  metadata: { action: 'accept', jobId: 'deliver-package' }
});
```

**Event structure:**
- `from` (required): 'player', 'handler', or 'system'
- `message` (required): Human-readable description
- `playerId` (optional): Who triggered this
- `playerName` (optional): Name at time of event
- `metadata` (optional): Arbitrary data

#### getEventLog()
Get all events.

```javascript
const events = await plot.getEventLog();
// Returns array of event objects
```

#### getEventLogAsText()
Get events formatted as text (for AI prompts).

```javascript
const text = await plot.getEventLogAsText();
// "[2025-12-11 10:30:00] Alice: Alice accepted the delivery job."
// "[2025-12-11 10:35:00] SYSTEM: Job deliver-package completed."
```

#### setMetadata(key, value) / getMetadata(key)
Store/retrieve arbitrary data.

```javascript
await plot.setMetadata('status', 'active');
await plot.setMetadata('reward', 500);
await plot.setMetadata('location', roomId);

const status = await plot.getMetadata('status');
const all = await plot.getMetadata(); // Get all metadata
```

#### clearMetadata(key)
Remove metadata.

```javascript
await plot.clearMetadata('reward');  // Remove specific key
await plot.clearMetadata();          // Clear all metadata
```

### Event Log Summarization

When event logs get too long (context management):

#### summarizePlot()
Mark plot for summarization.

```javascript
const needsSummary = await plot.summarizePlot();
// Sets plot.needsSummary = true
// Sets plot.summaryPrompt = "..." (AI prompt)
// External system (Claude) reads prompt, generates summary
```

#### applySummary(summaryText)
Replace events with summary.

```javascript
await plot.applySummary('The player discovered...');
// Replaces all events with single [SUMMARY] event
// Reduces context size
```

## Job System

Jobs are individual tasks within a plot. Each job can:
- Have metadata (what needs to be done)
- Expire after a time limit
- Register hooks on objects (trigger when events happen)
- Be completed, failed, or expired

### Job Lifecycle

```
active → completed (success)
      → failed (explicit failure)
      → expired (time limit)
```

### Job Structure

```javascript
{
  'job-id': {
    status: 'active' | 'completed' | 'failed' | 'expired',
    createdAt: '2025-12-11T10:00:00.000Z',
    expiresAt: '2025-12-11T12:00:00.000Z',  // Optional deadline
    completedAt: null,                       // Set when done
    completionReason: 'delivered package',   // Why completed
    hooks: [                                 // Event listeners
      { targetId: 123, eventName: 'onReceive' }
    ],
    metadata: {                              // Job-specific data
      targetItem: itemId,
      destination: roomId,
      reward: 100
    }
  }
}
```

### Job Methods

#### createJob(jobId, options)
Create a new job.

```javascript
await plot.createJob('deliver-package', {
  expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
  metadata: {
    item: packageId,
    destination: warehouseId,
    reward: 100
  }
});
```

#### getJob(jobId)
Get job data.

```javascript
const job = await plot.getJob('deliver-package');
console.log(job.status, job.metadata);
```

#### getActiveJobs()
List all active jobs (auto-expires if needed).

```javascript
const active = await plot.getActiveJobs();
// { 'deliver-package': {...}, 'retrieve-data': {...} }
```

#### completeJob(jobId, reason)
Mark job as successfully completed.

```javascript
await plot.completeJob('deliver-package', 'Package delivered to warehouse');
// Sets status='completed', completedAt=now
// Unregisters all job hooks
// Adds event to log
```

#### failJob(jobId, reason)
Mark job as failed.

```javascript
await plot.failJob('deliver-package', 'Package was stolen');
```

#### expireJob(jobId)
Mark job as expired (time limit reached).

```javascript
await plot.expireJob('deliver-package');
// Auto-called by getActiveJobs() if expiresAt passed
```

#### setJobMetadata(jobId, key, value)
Update job metadata.

```javascript
await plot.setJobMetadata('deliver-package', 'progress', 50);
```

## Hook System

Jobs can **register hooks** on objects to trigger when events happen. This enables reactive narratives.

### How Hooks Work

1. Job registers interest in event: `plot.registerJobHook(jobId, targetId, 'onReceive', filter)`
2. Event happens: `target.triggerPlotHooks('onReceive', data)`
3. System checks all registered hooks, filters by data
4. Matching hooks call `plot.onJobHookTriggered(jobId, ...)`
5. Plot logs event, marks for attention

### Registering Hooks

#### registerJobHook(jobId, targetId, eventName, filter)

```javascript
// Watch for package delivery to specific NPC
await plot.registerJobHook(
  'deliver-package',        // Job ID
  npcId,                    // Target object
  'onReceive',              // Event name
  { itemId: packageId }     // Only trigger if data.itemId matches
);

// Watch for player entering specific room
await plot.registerJobHook(
  'patrol-mission',
  roomId,
  'onContentArrived',
  { playerId: playerId }    // Only this player
);

// Watch for item being dropped anywhere
await plot.registerJobHook(
  'find-evidence',
  $.system,                 // Global watch
  'onDropped',
  { itemType: 'evidence' }
);
```

**Filter matching:**
- All filter keys must match data keys
- `{ itemId: 123 }` matches `data.itemId === 123`
- `{}` (empty filter) matches any data

### Triggering Hooks

In object methods, trigger hooks when events happen:

```javascript
// In NPC's onReceive method
obj.setMethod('onReceive', `
  const giver = args[0];
  const item = args[1];
  
  // Normal receive logic...
  await item.moveTo(self);
  
  // Trigger hooks
  await self.triggerPlotHooks('onReceive', {
    giverId: giver.id,
    giverName: giver.name,
    itemId: item.id,
    itemName: item.name
  });
  
  return { success: true };
`);
```

### Hook Handler

#### onJobHookTriggered(jobId, eventName, targetId, data, filter)

Default implementation logs event and marks plot for attention. Override for custom behavior:

```javascript
plot.setMethod('onJobHookTriggered', `
  const jobId = args[0];
  const eventName = args[1];
  const targetId = args[2];
  const data = args[3] || {};
  
  // Verify job is still active
  const job = await self.getJob(jobId);
  if (!job || job.status !== 'active') return false;
  
  // Custom logic based on event
  if (eventName === 'onReceive' && jobId === 'deliver-package') {
    // Package delivered! Complete the job
    await self.completeJob(jobId, 'Package delivered successfully');
    
    // Reward the player
    const player = await $.load(data.giverId);
    if (player) {
      player.credits = (player.credits || 0) + job.metadata.reward;
      await player.tell('You earned ' + job.metadata.reward + ' credits!');
    }
  }
  
  return true;
`);
```

### Unregistering Hooks

Hooks are automatically unregistered when jobs complete/fail/expire.

Manual unregister:

```javascript
await plot.unregisterJobHook(jobId, targetId, eventName);
```

### Viewing Hooks

```javascript
const hooks = await plot.getJobHooks('deliver-package');
// [{ targetId: 123, eventName: 'onReceive' }, ...]
```

## $.plotSpawner - Plot Generator

Inherits from: **$.root**

### Purpose

Base prototype for entities that create and manage plots. Provides state management but NO player interaction verbs.

### Properties

```javascript
{
  name: 'Plot Spawner',
  description: 'Creates narrative plots',
  plots: [plotId1, plotId2, ...],  // Plots created by this spawner
  systemPrompt: 'AI instructions...',  // For Claude integration
}
```

### Key Methods

#### createPlot(name, description, metadata)
Create a new plot.

```javascript
const plot = await spawner.createPlot(
  'Delivery Job',
  'Deliver a package to the warehouse.',
  { difficulty: 'easy', reward: 100 }
);

// Returns plot object
// Adds plot.id to spawner.plots array
```

#### getPlots()
Get all plots created by this spawner.

```javascript
const plots = await spawner.getPlots();
// [plot1, plot2, ...]
```

#### getActivePlots()
Get plots with active jobs.

```javascript
const active = await spawner.getActivePlots();
```

## $.jobBoard - Physical Implementation

Inherits from: **$.plotSpawner → $.describable**

### Purpose

Physical object players can interact with. Adds movement hooks and player-facing verbs to $.plotSpawner's state management.

### Movement Hooks

#### onContentArrived(obj, source, mover)
Register verbs when player enters room.

```javascript
// Automatically registered when player enters room with job board
// Player can now type: "use board", "check board"
```

#### onContentLeaving(obj, dest, mover)
Unregister verbs when player leaves room.

```javascript
// Automatically unregistered when player leaves
```

### Verb Handlers

#### doUse(player)
Player interacts with job board.

```javascript
// Player types: "use board"
// Shows available jobs, allows acceptance
```

#### doCheck(player)
Player checks their active jobs from this board.

```javascript
// Player types: "check board"
// Shows player's active jobs from this spawner
```

### Creating a Job Board

```javascript
const board = await $.recycler.create($.jobBoard, {
  name: 'wooden job board',
  description: 'A weathered board with posted jobs.',
  systemPrompt: 'Generate delivery jobs for Pioneer Square couriers.',
});

await board.moveTo(room);

// Now players in this room can:
// - "use board" to see/accept jobs
// - "check board" to see their active jobs
```

## $.plotDB - Global Plot Index

### Purpose

Tracks all plots globally for external systems (Claude API) to poll for updates.

### Key Methods

#### register(plot)
Add plot to global index.

```javascript
await $.plotDB.register(plot);
```

#### getLatest(since)
Get plots modified since timestamp (for polling).

```javascript
const recent = await $.plotDB.getLatest('2025-12-11T10:00:00.000Z');
// Returns plots that need attention
```

## Real-World Example: Delivery Job

### Setup: Create Job Board

```javascript
const board = await $.recycler.create($.jobBoard, {
  name: 'courier board',
  description: 'A digital board listing delivery jobs.',
});

await board.moveTo(courierOffice);
```

### Create Delivery Job

```javascript
// Create plot
const plot = await board.createPlot(
  'Package Delivery',
  'Deliver a package from Alice to Bob.',
  { type: 'delivery', difficulty: 'easy' }
);

// Create package item
const package = await $.recycler.create($.item, {
  name: 'sealed package',
  description: 'A brown package sealed with tape.',
});
await package.moveTo(aliceRoom);

// Create job with expiration
await plot.createJob('deliver-to-bob', {
  expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
  metadata: {
    package: package.id,
    recipient: bobId,
    sender: aliceId,
    reward: 100
  }
});

// Register hook: watch for Bob receiving the package
await plot.registerJobHook(
  'deliver-to-bob',
  bobId,
  'onReceive',
  { itemId: package.id }
);
```

### Player Workflow

```
Player: "use board"
  → Shows available jobs
  → "Package Delivery - 100 credits"

Player accepts job (via board UI)
  → Job assigned to player
  → Player told: "Find Alice at [location] to pick up package"

Player: "go to Alice"
Player: "get package"
  → Package moves to player's inventory

Player: "go to Bob"
Player: "give package to Bob"
  → Bob's onReceive triggered
  → Hook matches (itemId = package.id)
  → plot.onJobHookTriggered() called
  → Job completed
  → Player rewarded 100 credits
  → Event logged: "deliver-to-bob completed"
```

### Hook Implementation (Bob's onReceive)

```javascript
bob.setMethod('onReceive', `
  const giver = args[0];
  const item = args[1];
  
  // Accept the item
  await item.moveTo(self);
  await giver.tell('Bob accepts the ' + item.name + '.');
  
  // Trigger plot hooks
  await self.triggerPlotHooks('onReceive', {
    giverId: giver.id,
    giverName: giver.name,
    itemId: item.id,
    itemName: item.name
  });
  
  return { success: true };
`);
```

### Custom Completion Handler

```javascript
plot.setMethod('onJobHookTriggered', `
  const jobId = args[0];
  const eventName = args[1];
  const data = args[2] || {};
  
  const job = await self.getJob(jobId);
  if (!job || job.status !== 'active') return false;
  
  if (jobId === 'deliver-to-bob' && eventName === 'onReceive') {
    // Complete the job
    await self.completeJob(jobId, 'Package delivered to Bob');
    
    // Reward the player
    const player = await $.load(data.giverId);
    if (player) {
      const reward = job.metadata.reward || 0;
      player.credits = (player.credits || 0) + reward;
      await player.tell('\\nJob completed! You earned ' + reward + ' credits.');
    }
    
    // Log event
    await self.addEvent({
      from: 'player',
      message: data.giverName + ' delivered package to Bob',
      playerId: data.giverId,
      playerName: data.giverName
    });
  }
  
  return true;
`);
```

## Advanced: Multi-Stage Jobs

Jobs with multiple objectives:

```javascript
// Create plot
const plot = await board.createPlot('Investigation', '...');

// Create multi-stage job
await plot.createJob('investigate-theft', {
  metadata: {
    stage: 1,
    stages: [
      { id: 1, desc: 'Talk to witness', complete: false },
      { id: 2, desc: 'Find evidence', complete: false },
      { id: 3, desc: 'Confront suspect', complete: false },
    ]
  }
});

// Register hooks for each stage
await plot.registerJobHook('investigate-theft', witnessId, 'onTalkTo');
await plot.registerJobHook('investigate-theft', evidenceId, 'onPickUp');
await plot.registerJobHook('investigate-theft', suspectId, 'onAccuse');
```

```javascript
// Custom handler advances stages
plot.setMethod('onJobHookTriggered', `
  const jobId = args[0];
  const eventName = args[1];
  const data = args[2] || {};
  
  const job = await self.getJob(jobId);
  if (!job || job.status !== 'active') return false;
  
  const stages = job.metadata.stages || [];
  const currentStage = job.metadata.stage || 1;
  
  // Check if this event completes current stage
  if (eventName === 'onTalkTo' && currentStage === 1) {
    stages[0].complete = true;
    await self.setJobMetadata(jobId, 'stage', 2);
    await self.setJobMetadata(jobId, 'stages', stages);
    
    const player = await $.load(data.playerId);
    await player.tell('Stage 1 complete! Next: Find evidence.');
  }
  // ... handle other stages ...
  
  // Check if all stages complete
  if (stages.every(s => s.complete)) {
    await self.completeJob(jobId, 'All stages completed');
  }
  
  return true;
`);
```

## Tips & Best Practices

1. **One plot per narrative arc** - Don't create too many plots
2. **Use jobs for objectives** - Jobs are tasks within a plot
3. **Filter hooks carefully** - Only trigger when data matches
4. **Clean up expired jobs** - `getActiveJobs()` auto-expires
5. **Log important events** - Build narrative history
6. **Use metadata liberally** - Store any contextual data
7. **Override onJobHookTriggered** - Custom logic per plot
8. **Summarize long event logs** - Keep context manageable
9. **$.jobBoard for physical presence** - $.plotSpawner for logic only
10. **Register hooks early** - Before player can trigger them

## Common Patterns

### Delivery Quest
```javascript
await plot.registerJobHook(jobId, recipientId, 'onReceive', { itemId });
```

### Location Visit
```javascript
await plot.registerJobHook(jobId, roomId, 'onContentArrived', { playerId });
```

### Item Collection
```javascript
await plot.registerJobHook(jobId, itemId, 'onPickUp', { playerId });
```

### NPC Interaction
```javascript
await plot.registerJobHook(jobId, npcId, 'onTalkTo', { playerId });
```

### Combat/Defeat
```javascript
await plot.registerJobHook(jobId, enemyId, 'onDeath', { killerId });
```

## See Also

- [Prototypes](../prototypes.md) - Object hierarchy overview
- [Bootstrap](../advanced/bootstrap.md) - Adding custom plot spawners
- [Verbs](../advanced/verbs.md) - Registering job board verbs
- [Objects](../advanced/objects.md) - Creating plot-related items
