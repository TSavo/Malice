# Plots and Storylines

Creating narrative containers that unfold over time.

## What Is A Plot?

A plot is a narrative container - a story that plays out through:
- Jobs (tasks for players to complete)
- NPCs (characters who interact with players)
- Events (things that happen in the world)
- Hooks (triggers that watch for player actions)

Plots give meaning to work. Instead of "repair pipe," it becomes "restore water to the refugee camp before disease spreads."

## The Critical Rule: NPCs Are The Continuation

**Every plot phase needs an NPC to carry it forward.**

The NPC is not decoration — it's the mechanism. When a player completes a task, they talk to an NPC. That NPC's system prompt contains:
- How to evaluate what the player did
- What success and failure look like
- What to do next in either case
- Who to hand off to, if anyone

Plots can be open-ended. You don't need to pre-script every beat. You just need NPCs with detailed enough prompts to handle whatever comes.

**Example:** Instead of scripting a five-job sequence, you spawn one NPC with instructions: "Evaluate this player. If they pass, assign [next job] or send them to [next NPC]. If they fail, [consequences]."

The NPC carries the state. The plot continues through conversation.

See [SCENARIOS.md](./SCENARIOS.md) for detailed NPC prompt templates.

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
const result = await $plotSpawner.createPlot( name: 'Water Crisis: Refugee Camp', metadata: {
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
await plot.addEvent({ plotId, message: 'Water main serving the refugee camp has failed. Estimated 200 people without clean water. Disease risk escalating.', from: 'system' });

await plot.addEvent({ plotId, message: 'Work order issued. Repair crew requested.', from: 'handler' });
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
const result = await $plotSpawner.createPlot( name: 'Construction: The Rusty Nail Bar', metadata: {
  type: 'construction',
  owner: playerId,
  location: { x: -5, y: 8, z: 0 },
  estimated_days: 3,
  day: 0
}});
const plotId = result.plotId;

await plot.addEvent({ plotId, message: 'Construction request received. Site survey scheduled.' });
```

**Day 1: Work Begins**
```javascript
// Update adjacent room description
const adjacentRoom = await $load(adjacentRoomId);
adjacentRoom.description = originalDescription + '\n\nThe sound of construction echoes from the east. A section of wall has been marked for demolition.';

// Spawn work crew
const foreman = await $ai.spawn({ role: 'supervisor', name: 'Construction Foreman', location: adjacentRoom });

// Log progress
await plot.addEvent({ plotId, message: 'Day 1: Demolition begun. Wall section removed. Debris clearing in progress.' });

// Update metadata
await plot.setMetadata('day', 1);
```

**Day 2: Progress**
```javascript
// Update site description
const adjacentRoom = await $load(adjacentRoomId);
adjacentRoom.description = originalDescription + '\n\nThrough the new opening to the east, you can see workers framing walls and running conduit.';

await plot.addEvent({ plotId, message: 'Day 2: Framing complete. Electrical rough-in started. Plumbing connections made.' });

await plot.setMetadata('day', 2);
```

**Day 3: Completion**
```javascript
// Create the actual room
const adjacentRoom = await $load(adjacentRoomId);
const bar = await $builder.build(adjacentRoom, { x: adjacentRoom.x + 1, y: adjacentRoom.y, z: adjacentRoom.z }, 'bar interior');
bar.name = 'The Rusty Nail';
bar.description = 'A small bar carved out of what was once storage space. The walls are raw concrete, the fixtures salvaged, but it has character. A wooden bar top, polished smooth by previous use, dominates the space. Mismatched stools line up in front of it.';

// Spawn furnishings
const menuBoard = await $recycler.create($sign, { name: 'Menu Board', text: 'DRINKS\nWater - 1 credit\nBrew - 3 credits\n...' });
await menuBoard.moveTo(bar);

// Remove construction references from adjacent room
adjacentRoom.description = originalDescription + '\n\nAn opening to the east leads to The Rusty Nail.';

// Despawn work crew (walk them out first!)
const foremanRoom = foreman.location;
await foreman.go('west');
await foremanRoom.announce(foreman, null, {
  others: '%A %av{say}, "Construction complete. Good luck with the place."'
});
await foreman.go('south');
await $ai.despawn(foreman.id);

// Complete the plot
await plot.addEvent({ plotId, message: 'Day 3: Construction complete. The Rusty Nail is open for business.' });

await plot.close('completed', 'Construction successful.');
```

## Using Hooks

Hooks watch for in-game events and notify the plot system.

### Registering a Hook

```javascript
await plot.registerJobHook('repair_pipe', brokenPipeId, 'repaired', {});
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
const result = await $plotDB.getNext();

if (result.plot) {
  // Check what happened
  const events = result.plot.events;

  // Respond appropriately
  await plot.addEvent({ plotId: result.plot.id, message: 'Hook triggered. Processing completion.' });

  // Complete the job
  await plot.completeJob( plotId: result.plot.id, jobId: 'repair_pipe', reason: 'Repair verified.' });
}
```

## Plot Management

### Listing Active Plots

```javascript
const active = await $plotDB.byStatus('active');
```

### Checking Plot Status

```javascript
const events = await plot.getEventLog();
```

### Searching Plot History

```javascript
// Note: Search by text not available directly - use getEventLog() and filter
const results = []; // TODO: implement search
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
await plot.close('failed', 'Worker abandoned site. Deadline exceeded.');
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
const result = await $plotSpawner.createPlot( name: 'Recruitment: ' + playerName, metadata: {
  type: 'recruitment',
  playerId: player.id,
  stage: 'initial_contact'
}});
const plotId = result.plotId;

// 2. Spawn recruiter NPC (in adjacent room)
const recruiter = await $ai.spawn({ role: 'recruiter', name: 'Outreach Worker', location: await $load(adjacentRoomId) });

// 3. Walk recruiter to player's location and speak
await recruiter.go('north');
const recruiterRoom = recruiter.location;
await recruiterRoom.announce(recruiter, null, {
  others: '%A %av{say}, "You look hungry. Citizenship can help."'
});

// 4. Recruiter delivers pitch
await recruiterRoom.announce(recruiter, null, {
  others: '%A %av{say}, "Citizenship means food, shelter, work. Register at City Services. Tell them I sent you."'
});

// 5. Log event
await plot.addEvent({ plotId, message: 'Initial contact made. Player informed of citizenship benefits.' });

// 6. Update stage
await plot.setMetadata('stage', 'referred');

// 7. Create job to watch for registration
await plot.createJob( plotId, jobId: 'await_registration', metadata: { type: 'registration_watch' }});

// 8. Register hook on biometric scanner at City Services
const plot = await $load(plotId);
await plot.registerJobHook('await_registration', biometricScannerId, 'scanComplete', { playerId: player.id });

// 9. Recruiter exits naturally
await recruiterRoom.announce(recruiter, null, {
  others: '%A %av{say}, "Think about it."'
});
await recruiter.go('south');
await $ai.despawn(recruiter.id);

// 10. When hook fires (player registered)
// ... complete job, update faction, close plot
```

## Internal Mechanics

Understanding how $.plot works under the hood.

### The $.plot Prototype

Every plot is an instance of `$.plot` (object #72). When you call `$plotSpawner.createPlot()`, it creates a child of this prototype.

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
const plot = await $load(123); await plot.registerJobHook('repair_pipe', 456, 'repaired', {});
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
5. Next `$plotDB.getNext()` call returns this plot

### The Attention Queue

Plots needing attention have `needsAttentionAt` set in metadata.

**How `$plotDB.getNext()` works:**
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
await plot.completeJob( plotId: 123, jobId: 'repair_pipe', reason: 'Repair verified.' });
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

4. You call $plotDB.getNext()
   └── Returns plot 123 with full event log

5. You respond and complete the job
   └── Hook auto-removed from pipe.plotHooks
   └── Job marked completed
   └── Plot ready for next phase or closure
```

## Remember

Plots are stories. They unfold over time. They involve characters. They have beginnings, middles, and ends.

A job without a plot is just work.
A job within a plot is a chapter in someone's story.

---

## Cartel Plots

Cartel plots work the same way mechanically — but look completely different to players.

### Key Differences

| Pluribus Plots | Cartel Plots |
|----------------|--------------|
| Work orders on terminals | Verbal instructions only |
| Formal job acceptance | Handshake deals |
| System-tracked progress | Handler observation |
| Credit rewards | Cash, goods, favors |
| Official records | Nothing written down |

The city-ai tracks both. Players only see the surface difference.

### Cartel Recruitment Arc

A new player catches the Cartel's attention.

```javascript
// Phase 1: Observation
const result = await $plotSpawner.createPlot( name: 'Cartel Eval: ' + playerName, metadata: {
  type: 'cartel_recruitment',
  playerId: player.id,
  stage: 'observation'
}});
const plotId = result.plotId;

await plot.addEvent({ plotId, 
  message: 'Subject identified. New arrival. Doesn\'t seem to fit the citizen mold.',
  from: 'handler'
});

// Phase 2: First Contact
// Spawn recruiter, approach player, give first test job
// See JOBS.md for job mechanics

await plot.setMetadata('stage', 'first_contact');

// Phase 3: Evaluation
// Did they complete the job? Accurately? On time?
// Update stage based on outcome

// Phase 4: Decision
// If passed: invite to second test, deeper involvement
// If failed: cut contact, mark as unreliable
// If betrayed: mark as burned, initiate consequences

const plot = await $load(plotId);
await plot.close('completed', 'Subject evaluated. Outcome: [recruited/rejected/burned]');
```

### Cartel Sabotage Plot

Sister Gray wants something broken.

```javascript
// 1. Create plot
const result = await $plotSpawner.createPlot( name: 'Cartel Op: Fabrication Delay', metadata: {
  type: 'cartel_operation',
  objective: 'sabotage',
  target: 'fabrication_factory',
  priority: 'high'
}});
const plotId = result.plotId;

// 2. Briefing phase
await plot.createJob( plotId, jobId: 'briefing', metadata: {
  type: 'contact',
  handler: 'Ghost operative',
  instructions: 'Meet asset at location, provide intel on target, deliver sabotage materials'
}});

// 3. Spawn handler, conduct briefing face-to-face
// Handler gives verbal instructions: target, method, timeline
// Handler provides materials (smoke bomb, corrosive, whatever)

// 4. Execution phase
await plot.createJob( plotId, jobId: 'execution', metadata: {
  type: 'sabotage',
  target: factoryMachineId,
  deadline: Date.now() + 4 * 60 * 60 * 1000  // 4 hours
}});

// 5. Register hook on target
const plot = await $load(plotId);
await plot.registerJobHook('execution', factoryMachineId, 'damaged', {});

// 6. Exfiltration phase
// Did they get out clean? Did anyone see them?
// Pluribus investigation may follow

// 7. Payment
// Handler meets asset, delivers payment, debriefs
const plot = await $load(plotId);
await plot.close('completed', 'Target damaged. Asset exfiltrated. No attribution.');
```

### Cartel Infiltration Plot

Someone needs to get inside Pluribus and stay there.

**Arc:**
1. Asset recruited from outside
2. Asset coached on how to pass citizenship vetting
3. Asset becomes a citizen (genuine registration)
4. Asset assigned a position (through legitimate channels)
5. Asset reports back to handler
6. Asset feeds intel to Cartel
7. Eventually: asset activated for specific operation

**Key point:** The infiltrator IS a citizen. They passed real vetting. They do real work. The difference is loyalty.

```javascript
const result = await $plotSpawner.createPlot( name: 'Cartel Mole: ' + playerName, metadata: {
  type: 'cartel_infiltration',
  playerId: player.id,
  stage: 'placement'
}});
const plotId = result.plotId;

// Track their progress through citizenship
await plot.addEvent({ plotId, 
  message: 'Asset instructed to register for citizenship. Cover identity established.',
  from: 'handler'
});

// Player goes through normal Pluribus channels
// Pluribus has NO IDEA they're doubled

// Periodic check-ins
await plot.createJob( plotId, jobId: 'checkin_1', metadata: {
  type: 'dead_drop',
  location: deadDropId,
  schedule: 'weekly'
}});
```

### Cartel Hit Plot

Someone needs to die.

**This is rare.** Wetwork is expensive, risky, and draws attention. Sister Gray doesn't order kills lightly.

**Arc:**
1. Target identified, reason established
2. Asset selected (must be trusted, capable)
3. Intel provided (target's schedule, vulnerabilities)
4. Asset plans and executes
5. Asset exfiltrates
6. Asset debriefs, receives payment
7. Consequences unfold (investigation, retaliation)

```javascript
const result = await $plotSpawner.createPlot( name: 'Cartel Sanction: ' + targetName, metadata: {
  type: 'cartel_wetwork',
  target: targetId,
  priority: 'critical',
  authorized_by: 'Sister Gray'
}});
const plotId = result.plotId;

// Intel phase
await plot.addEvent({ plotId, 
  message: 'Target: [name]. Reason: [reason]. Asset: [asset name]. Method: asset discretion.',
  from: 'handler'
});

// Provide target information
// Let the player figure out how to do it

// Register hook for target death
const plot = await $load(plotId);
await plot.registerJobHook('execution', targetId, 'died', {});

// On completion: massive consequences
// Pluribus investigation
// CorpSec manhunt if sloppy
// Cartel cleanup if asset is compromised
```

### Cross-Faction Plots

Some plots involve both powers competing for the same player or objective.

**Example: The Courier**

Pluribus assigns a delivery job. The Cartel wants to intercept.

```javascript
// Pluribus creates delivery plot
const pluribusPlot = await $plotSpawner.createPlot( name: 'Delivery: Medical Supplies', metadata: {
  type: 'delivery',
  faction: 'pluribus',
  package: packageId,
  destination: clinicId
}});

// Cartel creates interception plot
const cartelPlot = await $plotSpawner.createPlot( name: 'Cartel: Intercept Medical', metadata: {
  type: 'cartel_intercept',
  target_plot: pluribusPlot.plotId,
  target_package: packageId
}});

// City-ai sets up the interception
// Cartel operative spawned on delivery route
// Operative approaches player, makes offer

// Outcome depends on player choice:
// - Delivers → Pluribus plot complete, Cartel plot failed
// - Hands over → Cartel plot complete, Pluribus plot failed
// - Fights → Combat resolution
// - Reports contact → Pluribus knows, Cartel burns the operative
```

The city-ai plays both sides honestly. Whichever side wins, wins.

---

*This document is builder-facing canon. Do not share with players.*
