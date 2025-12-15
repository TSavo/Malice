# Plots and Storylines

Creating narrative containers that unfold over time.

## What Is A Plot?

A plot is a narrative container - a story that plays out through:
- Jobs (tasks for players to complete)
- NPCs (characters who interact with players)
- Events (things that happen in the world)
- Hooks (triggers that watch for player actions)

Plots give meaning to work. Instead of "repair pipe," it becomes "restore water to the refugee camp before disease spreads."

## Plot Structure

```
PLOT
├── Metadata (type, priority, participants)
├── Event Log (narrative history)
├── Jobs (discrete tasks)
│   ├── Job 1
│   │   └── Hooks (event watchers)
│   ├── Job 2
│   └── ...
└── Status (active, completed, failed, abandoned)
```

## Creating Plots

### Basic Plot

```javascript
const result = await plot({ action: 'create', name: 'Water Crisis: Refugee Camp', metadata: {
  type: 'infrastructure',
  priority: 'high',
  location: { x: 5, y: -3 },
  participants: [],
  deadline: Date.now() + 7 * 24 * 60 * 60 * 1000  // 7 days
}});
const plotId = result.plotId;
```

### Adding Narrative Events

```javascript
await plot({ action: 'add_event', plotId, message: 'Water main serving the refugee camp has failed. Estimated 200 people without clean water. Disease risk escalating.', from: 'system' });

await plot({ action: 'add_event', plotId, message: 'Work order issued. Repair crew requested.', from: 'handler' });
```

## Plot Types

### Infrastructure Plots

Repair or build physical systems.

```javascript
{
  type: 'infrastructure',
  subtype: 'repair',  // or 'construction', 'upgrade'
  system: 'water',    // water, power, sewage, etc.
  priority: 'critical',
  location: { x: -3, y: -5 }
}
```

**Narrative arc:**
1. Problem detected
2. Work order issued
3. Workers assigned
4. Repair attempted
5. Success or complications
6. Resolution

### Recruitment Plots

Bring scavengers into the system.

```javascript
{
  type: 'recruitment',
  target: playerId,
  stage: 'initial_contact'  // or 'processing', 'registered'
}
```

**Narrative arc:**
1. Scavenger identified
2. Initial contact (NPC interaction)
3. Benefits explained
4. Registration offered
5. Processing (biometrics)
6. Citizenship granted

### Security Plots

Respond to threats or incidents.

```javascript
{
  type: 'security',
  subtype: 'incident',  // or 'patrol', 'investigation'
  threat_level: 'medium',
  location: factoryId
}
```

**Narrative arc:**
1. Incident detected
2. Security responds
3. Situation assessed
4. Action taken
5. Resolution
6. Report filed

### Employment Plots

Assign ongoing work to citizens.

```javascript
{
  type: 'employment',
  position: 'bar_owner',
  location: null,  // To be built
  construction_days: 3
}
```

**Narrative arc:**
1. Position requested
2. Space identified
3. Construction begins (multi-day)
4. Daily progress updates
5. Construction completes
6. Position activated

## Multi-Day Plots

Plots that unfold over realistic timeframes.

### Construction Plot Example

**Day 0: Request**
```javascript
const result = await plot({ action: 'create', name: 'Construction: The Rusty Nail Bar', metadata: {
  type: 'construction',
  owner: playerId,
  location: { x: -5, y: 8, z: 0 },
  estimated_days: 3,
  day: 0
}});
const plotId = result.plotId;

await plot({ action: 'add_event', plotId, message: 'Construction request received. Site survey scheduled.' });
```

**Day 1: Work Begins**
```javascript
// Update adjacent room description
await set_property({ objectId: adjacentRoomId, name: 'description', value: originalDescription + '\n\nThe sound of construction echoes from the east. A section of wall has been marked for demolition.' });

// Spawn work crew
const foreman = await ai({ action: 'spawn', role: 'supervisor', name: 'Construction Foreman', locationId: adjacentRoomId });

// Log progress
await plot({ action: 'add_event', plotId, message: 'Day 1: Demolition begun. Wall section removed. Debris clearing in progress.' });

// Update metadata
await plot({ action: 'set_metadata', plotId, key: 'day', value: 1 });
```

**Day 2: Progress**
```javascript
// Update site description
await set_property({ objectId: adjacentRoomId, name: 'description', value: originalDescription + '\n\nThrough the new opening to the east, you can see workers framing walls and running conduit.' });

await plot({ action: 'add_event', plotId, message: 'Day 2: Framing complete. Electrical rough-in started. Plumbing connections made.' });

await plot({ action: 'set_metadata', plotId, key: 'day', value: 2 });
```

**Day 3: Completion**
```javascript
// Create the actual room
const bar = await dig({ name: 'The Rusty Nail', description: 'A small bar carved out of what was once storage space. The walls are raw concrete, the fixtures salvaged, but it has character. A wooden bar top, polished smooth by previous use, dominates the space. Mismatched stools line up in front of it.', fromRoomId: adjacentRoomId, exitDirection: 'east', returnDirection: 'west' });

// Spawn furnishings
await spawn_item({ prototypeId: signPrototypeId, locationId: bar.id, properties: { name: 'Menu Board', text: 'DRINKS\nWater - 1 credit\nBrew - 3 credits\n...' }});

// Remove construction references from adjacent room
await set_property({ objectId: adjacentRoomId, name: 'description', value: originalDescription + '\n\nAn opening to the east leads to The Rusty Nail.' });

// Despawn work crew (walk them out first!)
await ai({ action: 'do', humanId: foreman.id, command: 'west' });
await ai({ action: 'do', humanId: foreman.id, command: 'say Construction complete. Good luck with the place.' });
await ai({ action: 'do', humanId: foreman.id, command: 'south' });
await ai({ action: 'despawn', humanId: foreman.id });

// Complete the plot
await plot({ action: 'add_event', plotId, message: 'Day 3: Construction complete. The Rusty Nail is open for business.' });

await plot({ action: 'close', plotId, status: 'completed', reason: 'Construction successful.' });
```

## Using Hooks

Hooks watch for in-game events and notify the plot system.

### Registering a Hook

```javascript
await plot({ action: 'register_hook', plotId, jobId: 'repair_pipe', targetId: brokenPipeId, eventName: 'repaired', filter: {} });
```

### Common Hook Events

| Event | Trigger |
|-------|---------|
| `repaired` | Object fixed |
| `itemDeposited` | Item placed in container |
| `entered` | Someone entered a room |
| `scanComplete` | Biometric scan finished |
| `oneTimeCodeUsed` | Locker code used |

### Responding to Hooks

When a hook fires, the plot needs attention:

```javascript
const result = await plot({ action: 'next' });

if (result.plot) {
  // Check what happened
  const events = result.plot.events;

  // Respond appropriately
  await plot({ action: 'add_event', plotId: result.plot.id, message: 'Hook triggered. Processing completion.' });

  // Complete the job
  await plot({ action: 'complete_job', plotId: result.plot.id, jobId: 'repair_pipe', reason: 'Repair verified.' });
}
```

## Plot Management

### Listing Active Plots

```javascript
const active = await plot({ action: 'list', status: 'active' });
```

### Checking Plot Status

```javascript
const events = await plot({ action: 'get_events', plotId });
```

### Searching Plot History

```javascript
const results = await plot({ action: 'search', query: 'water main', limit: 10 });
```

## Plot Lifecycle

### Active
Plot is in progress. Jobs pending or in progress.

### Completed
All objectives achieved. Plot archived.

### Failed
Objectives not met. Deadline passed or critical failure.

### Abandoned
Plot cancelled before completion.

```javascript
await plot({ action: 'close', plotId, status: 'failed', reason: 'Worker abandoned site. Deadline exceeded.' });
// status can be: 'completed', 'failed', 'abandoned'
```

## Ambient Effects

While plots are active, maintain immersion with ambient effects.

### Construction Sounds

Add random emotes to adjacent rooms:

```javascript
// Set up ambient emote on room
// (This would be a method on the room object)
// Fires periodically while construction is active
```

Example ambient messages:
- "The sound of hammering echoes from nearby."
- "A worker carrying lumber passes through."
- "You hear the whine of a power drill."
- "Dust drifts from the construction area."

### Progress Descriptions

Update room descriptions to reflect ongoing work:

**Day 1:** "A section of wall is being demolished."
**Day 2:** "New walls are being framed."
**Day 3:** "The space is nearly complete. Workers are finishing details."

### NPC Activity

Workers should be visible:
- Spawned at the site during "work hours"
- Performing visible tasks
- Answering basic questions
- Walking to/from the site

## Example: Complete Recruitment Plot

```javascript
// 1. Create plot
const result = await plot({ action: 'create', name: 'Recruitment: ' + playerName, metadata: {
  type: 'recruitment',
  playerId: player.id,
  stage: 'initial_contact'
}});
const plotId = result.plotId;

// 2. Spawn recruiter NPC (in adjacent room)
const recruiter = await ai({ action: 'spawn', role: 'recruiter', name: 'Outreach Worker', locationId: adjacentRoomId });

// 3. Walk recruiter to player's location
await ai({ action: 'do', humanId: recruiter.id, command: 'north' });
await ai({ action: 'do', humanId: recruiter.id, command: 'say You look hungry. The Continuum can help.' });

// 4. Recruiter delivers pitch
await ai({ action: 'do', humanId: recruiter.id, command: 'say Citizenship means food, shelter, work. Register at City Services. Tell them I sent you.' });

// 5. Log event
await plot({ action: 'add_event', plotId, message: 'Initial contact made. Player informed of citizenship benefits.' });

// 6. Update stage
await plot({ action: 'set_metadata', plotId, key: 'stage', value: 'referred' });

// 7. Create job to watch for registration
await plot({ action: 'create_job', plotId, jobId: 'await_registration', metadata: { type: 'registration_watch' }});

// 8. Register hook on biometric scanner at City Services
await plot({ action: 'register_hook', plotId, jobId: 'await_registration', targetId: biometricScannerId, eventName: 'scanComplete', filter: { playerId: player.id }});

// 9. Recruiter exits naturally
await ai({ action: 'do', humanId: recruiter.id, command: 'say Think about it.' });
await ai({ action: 'do', humanId: recruiter.id, command: 'south' });
await ai({ action: 'despawn', humanId: recruiter.id });

// 10. When hook fires (player registered)
// ... complete job, update faction, close plot
```

## Internal Mechanics

Understanding how $.plot works under the hood.

### The $.plot Prototype

Every plot is an instance of `$.plot` (object #72). When you call `plot({ action: 'create' })`, it creates a child of this prototype.

**Core properties:**
```javascript
{
  name: 'Plot Name',
  events: [],           // Narrative event log
  metadata: {},         // Arbitrary key/value store
  jobs: {}              // Map of jobId → job state
}
```

### Event Structure

Events are timestamped entries in the narrative log:

```javascript
{
  from: 'handler',      // 'system', 'handler', or 'player'
  message: 'Work order issued.',
  timestamp: '2110-03-15T14:30:00.000Z',
  metadata: {}          // Optional structured data
}
```

**Event sources:**
- `system` - Automated events (hook triggers, job state changes)
- `handler` - Your responses and actions
- `player` - Player-initiated events (if captured)

### Job Structure

Jobs are discrete tasks within a plot:

```javascript
{
  status: 'active',     // 'active', 'completed', 'failed', 'expired'
  createdAt: '...',
  expiresAt: null,      // Optional deadline
  completedAt: null,
  hooks: [],            // Registered hook references
  metadata: {}          // Job-specific state
}
```

### The Hook Mechanism

This is the key to reactive plots.

**Registration:**
```javascript
await plot({ action: 'register_hook', plotId: 123, jobId: 'repair_pipe', targetId: 456, eventName: 'repaired', filter: {} });
```

**What happens internally:**
1. The target object (#456) gains a `plotHooks` property
2. This property maps event names to arrays of watchers
3. When the object emits the event, it checks `plotHooks`
4. Matching hooks call `plot.onJobHookTriggered()`

**Target object after registration:**
```javascript
target.plotHooks = {
  'repaired': [
    {
      plotId: 123,
      jobId: 'repair_pipe',
      filter: {},
      createdAt: '...'
    }
  ]
}
```

**When the event fires:**
1. Object code calls something like `await self.emit('repaired', data)`
2. Emit checks `self.plotHooks['repaired']`
3. For each matching hook, loads the plot and calls `onJobHookTriggered`
4. Plot adds event to log, sets `needsAttentionAt` metadata
5. Next `plot({ action: 'next' })` call returns this plot

### The Attention Queue

Plots needing attention have `needsAttentionAt` set in metadata.

**How `plot({ action: 'next' })` works:**
1. Finds all active plots
2. Filters to those with `needsAttentionAt` set
3. Returns the oldest (FIFO queue)
4. Bumps `needsAttentionAt` forward 24 hours (prevents re-processing)

This means:
- Hooks trigger immediate attention
- You process one plot at a time
- Plots wait patiently in queue
- 24-hour cooldown prevents spam

### Job Cleanup

When a job completes:

```javascript
await plot({ action: 'complete_job', plotId: 123, jobId: 'repair_pipe', reason: 'Repair verified.' });
```

**Internally:**
1. Iterates through `job.hooks[]`
2. Loads each target object
3. Removes this job's entries from `target.plotHooks`
4. Marks job status as 'completed'
5. Adds event to plot log

This automatic cleanup prevents orphaned hooks.

### Context Summarization

As event logs grow, they consume context. The plot system handles this:

```javascript
// Check if summarization needed
if (events.length > 10) {
  await plot.summarizePlot();  // Generates summary prompt
  // External process calls Claude with the prompt
  await plot.applySummary(summaryText);  // Replaces log
}
```

The summary preserves:
- Key events and outcomes
- Characters and their roles
- Objects, locations, resources
- Current state
- Unresolved threads

### Direct Method Access

While MCP tools are preferred, plots have direct methods:

```javascript
// These are called internally by MCP tools
plot.addEvent({ from, message })
plot.getEventLog()
plot.getEventLogAsText()
plot.setMetadata(key, value)
plot.getMetadata(key)
plot.createJob(jobId, options)
plot.completeJob(jobId, reason)
plot.failJob(jobId, reason)
plot.registerJobHook(jobId, targetId, eventName, filter)
plot.unregisterJobHook(jobId, targetId, eventName)
```

### Example: Hook Flow

```
1. You register hook on broken pipe for 'repaired' event
   └── pipe.plotHooks.repaired = [{ plotId: 123, jobId: 'fix_pipe', ... }]

2. Player repairs the pipe
   └── pipe.emit('repaired', { playerId: 456 })

3. Emit finds the hook, calls plot.onJobHookTriggered()
   └── Adds: "Job fix_pipe: repaired by PlayerName"
   └── Sets: metadata.needsAttentionAt = now

4. You call plot({ action: 'next' })
   └── Returns plot 123 with full event log

5. You respond and complete the job
   └── Hook auto-removed from pipe.plotHooks
   └── Job marked completed
   └── Plot ready for next phase or closure
```

## Plot Templates

Reference implementations for common situations are in the [plots/](plots/) directory:

- [first-rations.md](plots/first-rations.md) - Onboarding: grants citizenship, first job collecting rations
- [supply-delivery.md](plots/supply-delivery.md) - Second job: pick up package, deliver to destination

These templates show complete implementations with hooks, phases, and handler responses. Adapt them to specific circumstances.

## Remember

Plots are stories. They unfold over time. They involve characters. They have beginnings, middles, and ends.

A job without a plot is just work.
A job within a plot is a chapter in someone's story.
