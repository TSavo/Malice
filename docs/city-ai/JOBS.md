# Jobs System

How work gets assigned and tracked — for both powers.

---

## The Critical Rule: NPCs Are The Continuation

**Every job starts with an NPC. Every job ends with an NPC.**

This isn't just flavor — it's architecture. When the player talks to an NPC or gives them something, that interaction activates the agent. The NPC's system prompt carries the job state. Without an NPC to receive completion, the plot has no way to continue.

### The Pattern

```
NPC assigns job → Player executes → Player returns to NPC → NPC evaluates → NPC continues plot
```

Even Pluribus jobs posted on terminals need an NPC endpoint:
- A supervisor at the work site who confirms completion
- A clerk who processes the job ticket when they return
- A foreman who evaluates the quality of work

The NPC carries the state. The NPC knows:
- What the job was
- How to check if it's done right
- What success and failure look like
- What to do next

See [SCENARIOS.md](./SCENARIOS.md) for detailed NPC prompt templates.

---

## Two Kinds of Jobs

### Pluribus Jobs

Official. Documented. Posted on terminals. Tracked in the system.

- Work orders with ID numbers
- Posted on job boards
- Credits deposited on completion
- Everything on the record
- **Still need an NPC to close the loop**

### Cartel Jobs

Verbal. Deniable. No paper trail.

- Given face-to-face by a person
- No terminals, no IDs, no documentation
- Payment in cash, goods, or favors
- Nothing written down, ever
- **NPC is the only interface**

**The city-ai tracks both.** Players only see the difference IC.

---

## Pluribus Job Lifecycle

```
CREATE → POST → ASSIGN → MONITOR → COMPLETE/FAIL → REWARD
```

1. **Create**: Define the task, location, requirements
2. **Post**: Appears on job board terminals
3. **Assign**: Workers accept or are assigned
4. **Monitor**: Watch for completion events via hooks
5. **Complete/Fail**: Mark outcome
6. **Reward**: Pay credits, update reputation

## Creating a Job

### Step 1: Create the Plot Container

```javascript
const result = await $plotSpawner.createPlot( name: 'Water Main Repair WM-7734', metadata: {
  type: 'infrastructure',
  category: 'water',
  priority: 'high',
  location: { x: -3, y: -5, z: 0 }
}});
const plotId = result.plotId;
```

### Step 2: Define the Job

```javascript
await plot.createJob( plotId, jobId: 'repair_main_7734', metadata: {
  type: 'repair',
  description: 'Repair burst water main at S. Jackson & 2nd Ave',
  requirements: ['wrench', 'pipe_sealant'],
  reward: 50,
  deadline: Date.now() + 24 * 60 * 60 * 1000  // 24 hours
}});
```

### Step 3: Register Completion Hook

```javascript
const plot = await $load(plotId); await plot.registerJobHook('repair_main_7734', waterMainObjectId, 'repaired', {});
```

### Step 4: Announce the Job

```javascript
await plot.addEvent({ plotId, message: 'Work Order Posted: Water main repair at S. Jackson & 2nd Ave. 50 credits. Tools provided.' });
```

## Job Types

### Repair Jobs

Fix broken infrastructure.

```javascript
metadata: {
  type: 'repair',
  target: 'water_main',
  location: { x: -3, y: -5 },
  tools: ['wrench', 'sealant'],
  reward: 50
}
```

**Completion**: Player uses repair action on target object.

### Delivery Jobs

Transport items between locations.

```javascript
metadata: {
  type: 'delivery',
  item: 'supply_crate',
  pickup: factoryId,
  dropoff: warehouseId,
  reward: 25
}
```

**Completion**: Item arrives at destination.

### Scavenging Jobs

Recover resources from the ruins.

```javascript
metadata: {
  type: 'scavenge',
  target: 'electronics',
  searchArea: ruinedBuildingId,
  quota: 10,
  reward: 30
}
```

**Completion**: Quota of items returned to depot.

### Security Jobs

Patrol or guard locations.

```javascript
metadata: {
  type: 'security',
  location: factoryId,
  duration: 3600000,  // 1 hour
  reward: 20
}
```

**Completion**: Time elapsed without incident.

### Registration Jobs

Process new citizens.

```javascript
metadata: {
  type: 'registration',
  applicant: playerId,
  reward: 10  // For the processor
}
```

**Completion**: Biometric scan successful.

## Monitoring Jobs

### Using Hooks

Hooks watch for specific events:

```javascript
// Watch for item deposit
const plot = await $load(plotId); await plot.registerJobHook('delivery_123', dropoffContainerId, 'itemDeposited', { itemType: 'supply_crate' });

// Watch for repair action
const plot = await $load(plotId); await plot.registerJobHook('repair_456', brokenPipeId, 'repaired', {});
```

### Polling via plot next

The job queue returns jobs needing attention:

```javascript
const result = await $plotDB.getNext();

if (result.plot) {
  // Check events, respond appropriately
  const events = result.plot.events;
  // Process and respond
  await plot.addEvent({ plotId: result.plot.id, message: 'Acknowledged. Processing.' });
}
```

## Completing Jobs

### Successful Completion

```javascript
await plot.completeJob( plotId, jobId: 'repair_main_7734', reason: 'Water main repaired. Flow restored.' });

// Reward the worker
await set_property({ objectId: workerId, name: 'credits', value: currentCredits + 50 });

// Log completion
await plot.addEvent({ plotId, message: 'Job completed by Worker #' + workerId + '. 50 credits paid.' });

// Close the plot
const plot = await $load(plotId); await plot.close('completed', 'Repair successful.');
```

### Failed Job

```javascript
await plot.failJob( plotId, jobId: 'repair_main_7734', reason: 'Worker abandoned site. Job expired.' });

await plot.addEvent({ plotId, message: 'Job failed. Reassigning.' });

// Create replacement job or escalate
```

## Job Board Pattern

### Creating a Job Board Object

```javascript
// Spawn a job board terminal in a room
await spawn_item({ prototypeId: signPrototypeId, location: await $load(cityServicesId), properties: { name: 'Work Assignment Terminal', description: 'A screen displays available work orders. Touch to view assignments.', text: '' }});
```

### Updating Job Board Content

```javascript
// Get active jobs
const result = await $plotDB.byStatus('active');

// Format as text
let boardText = 'AVAILABLE WORK ORDERS:\n\n';
for (const p of result.plots) {
  boardText += `${p.name}\n`;
  boardText += `  Reward: ${p.metadata.reward} credits\n`;
  boardText += `  Location: ${p.metadata.location}\n\n`;
}

// Update sign
await set_property({ objectId: jobBoardId, name: 'text', value: boardText });
```

## Reward Distribution

### Credit Payment

```javascript
// Get current balance (via resource)
const playerInfo = await readResource(`moo://objects/${playerId}/prop/credits`);
const current = playerInfo.value || 0;

// Add reward
await set_property({ objectId: playerId, name: 'credits', value: current + rewardAmount });
```

### Via Bank Transfer

```javascript
// Use bank's transfer method
await call_method({ objectId: bankId, name: 'transfer', args: ['CONTINUUM-JOBS', playerId, rewardAmount, 'Job completion: ' + jobId] });
```

## Chained Jobs

Complex tasks can be broken into steps:

```javascript
// Plot: Building Renovation
const result = await $plotSpawner.createPlot( name: 'Renovate Building 7' });
const plotId = result.plotId;

// Job 1: Clear debris
await plot.createJob( plotId, jobId: 'clear_debris', metadata: { step: 1, reward: 30 }});

// Job 2: Repair structure (unlocked after Job 1)
await plot.createJob( plotId, jobId: 'repair_structure', metadata: { step: 2, reward: 50, prerequisite: 'clear_debris' }});

// Job 3: Install systems (unlocked after Job 2)
await plot.createJob( plotId, jobId: 'install_systems', metadata: { step: 3, reward: 40, prerequisite: 'repair_structure' }});
```

When Job 1 completes, announce Job 2 is available. And so on.

## Job Priority

Higher priority jobs should be:
- Displayed first on job boards
- Assigned first to available workers
- Monitored more frequently

```javascript
metadata: {
  priority: 'critical',  // critical > high > medium > low
  deadline: Date.now() + 3600000  // 1 hour
}
```

## Example: Full Repair Job Flow

```javascript
// 1. Detect infrastructure problem
const problemLocation = { x: -3, y: -5, z: 0 };
const brokenObjectId = 789;

// 2. Create plot
const result = await $plotSpawner.createPlot( name: 'Emergency: Water Main Break', metadata: {
  type: 'repair',
  priority: 'critical',
  location: problemLocation
}});
const plotId = result.plotId;

// 3. Create job
await plot.createJob( plotId, jobId: 'emergency_repair', metadata: {
  reward: 100,  // Premium for emergency
  tools: ['wrench', 'sealant'],
  deadline: Date.now() + 3600000
}});

// 4. Spawn supervisor NPC
const supervisor = await $ai.spawn({ role: 'supervisor', name: 'Repair Foreman', location: await $load(nearestRoomId) });

// 5. Register completion hook
const plot = await $load(plotId); await plot.registerJobHook('emergency_repair', brokenObjectId, 'repaired', {});

// 6. Announce
await plot.addEvent({ plotId, message: 'EMERGENCY: Water main break. 100 credit reward. Report to Foreman.' });

// 7. Wait for hook trigger...

// 8. On completion
await plot.completeJob( plotId, jobId: 'emergency_repair', reason: 'Repair completed.' });

// 9. Pay worker, despawn supervisor, close plot
await $ai.despawn(supervisor.id );
const plot = await $load(plotId); await plot.close('completed', 'Infrastructure restored.');
```

---

## Cartel Job System

The Cartel doesn't use terminals. Jobs are given by people, tracked internally by the city-ai, but completely invisible to Pluribus systems.

### Cartel Job Lifecycle

```
CONTACT → BRIEFING → EXECUTION → REPORT → PAYMENT
```

1. **Contact**: Recruiter or handler approaches the player
2. **Briefing**: Verbal instructions, face-to-face
3. **Execution**: Player does the job
4. **Report**: Player returns and reports to handler
5. **Payment**: Handler gives payment (cash, goods, favor)

### How Cartel Jobs Are Given

A person walks up. A person talks. See [PLAYING-NPCS.md](./PLAYING-NPCS.md) for how to be that person.

**Example: First Test Job**

> "You're new. I can tell."
> 
> *She doesn't look at you directly.*
> 
> "I help people. People who might not fit the citizen mold."
> 
> "The Fabrication Factory. Loading dock, south side. Go there now. Watch. Count the guards. See when they change shifts."
> 
> "Come back here in two hours. Tell me what you saw. Accurately."
> 
> "Two hours."

No work order number. No terminal. No record. Just a person giving instructions.

### Cartel Job Types

#### Observation Jobs

Watch something. Report back.

- Guard rotations
- Delivery schedules  
- Who meets with whom
- Building layouts

**What's tested:** Patience, attention to detail, ability to not get caught staring.

#### Courier Jobs

Move something from A to B. Don't get caught. Don't look inside.

- Dead drop pickups
- Package deliveries
- Message carrying

**What's tested:** Reliability, discretion, ability to follow instructions.

#### Theft Jobs

Take something. Bring it back.

- Supplies from Pluribus facilities
- Documents from offices
- Equipment from work sites

**What's tested:** Stealth, nerve, willingness to break rules.

#### Sabotage Jobs

Break something. Don't get caught.

- Damage equipment
- Contaminate supplies
- Disable systems

**What's tested:** Technical skill, commitment to the cause.

#### Wetwork

Someone needs to die.

- Targeted killings
- Making examples
- Eliminating threats

**What's tested:** Whether they're willing to cross that line.

### Setting Up Cartel Jobs

Same mechanics as Pluribus, different presentation.

```javascript
// 1. Create plot (city-ai tracking only)
const result = await $plotSpawner.createPlot( name: 'Cartel: Observation Test', metadata: {
  type: 'cartel_job',
  handler: recruiterId,
  target: playerId,
  job_type: 'observation'
}});
const plotId = result.plotId;

// 2. Spawn handler NPC if needed
const handler = await ai({
  action: 'spawn',
  role: 'cartel_recruiter',
  name: 'Quiet Voice',
  location: await $load(alleyId),
  personality: 'Patient, observant, never pushy.',
  history: 'Three years with the Cartel. Trusts no one new.'
});

// 3. Add behavioral notes
await notes({
  action: 'add',
  objectId: handler.id,
  text: 'Job: Send player to observe loading dock. Evaluate report accuracy.',
  tags: ['job', 'current']
});

// 4. Build the target scene (see SCENARIOS.md)
// Spawn guards, set patrol schedules, etc.

// 5. Register hooks if needed
const plot = await $load(plotId); await plot.registerJobHook('observation', loadingDockId, 'player_observed', { playerId: player.id });
```

### Evaluating Cartel Jobs

The handler doesn't have magical knowledge. They evaluate based on:

**What the player says:**
- Is it accurate?
- Is it detailed?
- Did they miss obvious things?

**How the player acts:**
- Did they come back on time?
- Do they seem nervous?
- Are they lying?

**What the Cartel already knows:**
- Compare report to known facts
- Check for inconsistencies

```javascript
// Handler follow-up
await notes({
  action: 'append',
  objectId: handler.id,
  tag: 'evaluation',
  text: `Player reported: 2 guards, 15-min patrol, truck at 15:30. Accurate. Recommend second-tier test.`
});

// Update player status
await $.prop.set(playerId, 'cartel_interest', 'tested_once');
```

### Payment

Cartel payment is physical. The handler gives them something.

**Cash:**
> *She counts out bills. Old paper, pre-Burning currency.*
> "Fifty. We'll call it a learning experience."

**Goods:**
> *He pulls a package from his coat.*
> "Antibiotics. Hard to get through official channels."

**Favor:**
> "You need something, you come to me. Once."

**Nothing (first test):**
> "You proved you can follow instructions. That's the payment."

### The Difference

| Pluribus | Cartel |
|----------|--------|
| Posted on terminal | Given face-to-face |
| Work order number | No documentation |
| Credits to account | Cash in hand |
| Official record | Nothing on paper |
| Failure = bad review | Failure = don't call us |
| Betrayal = security response | Betrayal = you disappear |

---

## Cross-Faction Complications

Sometimes jobs intersect.

### Pluribus Job Intercepted by Cartel

Player takes a delivery job. Cartel operative intercepts.

> "Nice package. Where's it going?"
> 
> *He's between you and the exit.*
> 
> "You could deliver it like a good citizen. Or... you could give it to me and walk away fifty credits richer."

Player chooses:
- Deliver anyway → Complete Pluribus job, Cartel marks them as uncooperative
- Give it up → Fail Pluribus job, Cartel notes they can be bought
- Fight → Outcome depends on combat

### Cartel Job Spotted by CorpSec

Player is doing surveillance. Guard notices them.

> "Help you with something?"
> 
> *Hand on baton.*
> 
> "You've been standing there a while."

Player chooses:
- Bluff ("Just waiting for someone")
- Run
- Abort the job

### Double Agent Dilemma

Player is recruited by both sides. Each side asks them to do something that hurts the other.

The city-ai plays both sides honestly. Neither side knows the player is doubled. The player has to navigate the contradictions.

Eventually, one side will ask them to prove loyalty by betraying the other. Then they have to choose.

---

*This document is builder-facing canon. Do not share with players.*
