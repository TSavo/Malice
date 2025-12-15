# Jobs System

How to create and manage work assignments.

## Overview

Jobs are discrete tasks that players can complete for rewards. Jobs exist within plots (narrative containers) and can have hooks that trigger on game events.

## Job Lifecycle

```
CREATE → ASSIGN → MONITOR → COMPLETE/FAIL → REWARD
```

1. **Create**: Define the task, location, requirements
2. **Assign**: Workers accept or are assigned
3. **Monitor**: Watch for completion events via hooks
4. **Complete/Fail**: Mark outcome
5. **Reward**: Pay credits, update reputation

## Creating a Job

### Step 1: Create the Plot Container

```javascript
const result = await plot({ action: 'create', name: 'Water Main Repair WM-7734', metadata: {
  type: 'infrastructure',
  category: 'water',
  priority: 'high',
  location: { x: -3, y: -5, z: 0 }
}});
const plotId = result.plotId;
```

### Step 2: Define the Job

```javascript
await plot({ action: 'create_job', plotId, jobId: 'repair_main_7734', metadata: {
  type: 'repair',
  description: 'Repair burst water main at S. Jackson & 2nd Ave',
  requirements: ['wrench', 'pipe_sealant'],
  reward: 50,
  deadline: Date.now() + 24 * 60 * 60 * 1000  // 24 hours
}});
```

### Step 3: Register Completion Hook

```javascript
await plot({ action: 'register_hook', plotId, jobId: 'repair_main_7734', targetId: waterMainObjectId, eventName: 'repaired', filter: {} });
```

### Step 4: Announce the Job

```javascript
await plot({ action: 'add_event', plotId, message: 'Work Order Posted: Water main repair at S. Jackson & 2nd Ave. 50 credits. Tools provided.' });
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
await plot({ action: 'register_hook', plotId, jobId: 'delivery_123', targetId: dropoffContainerId, eventName: 'itemDeposited', filter: { itemType: 'supply_crate' }});

// Watch for repair action
await plot({ action: 'register_hook', plotId, jobId: 'repair_456', targetId: brokenPipeId, eventName: 'repaired', filter: {} });
```

### Polling via plot next

The job queue returns jobs needing attention:

```javascript
const result = await plot({ action: 'next' });

if (result.plot) {
  // Check events, respond appropriately
  const events = result.plot.events;
  // Process and respond
  await plot({ action: 'add_event', plotId: result.plot.id, message: 'Acknowledged. Processing.' });
}
```

## Completing Jobs

### Successful Completion

```javascript
await plot({ action: 'complete_job', plotId, jobId: 'repair_main_7734', reason: 'Water main repaired. Flow restored.' });

// Reward the worker
await set_property({ objectId: workerId, name: 'credits', value: currentCredits + 50 });

// Log completion
await plot({ action: 'add_event', plotId, message: 'Job completed by Worker #' + workerId + '. 50 credits paid.' });

// Close the plot
await plot({ action: 'close', plotId, status: 'completed', reason: 'Repair successful.' });
```

### Failed Job

```javascript
await plot({ action: 'fail_job', plotId, jobId: 'repair_main_7734', reason: 'Worker abandoned site. Job expired.' });

await plot({ action: 'add_event', plotId, message: 'Job failed. Reassigning.' });

// Create replacement job or escalate
```

## Job Board Pattern

### Creating a Job Board Object

```javascript
// Spawn a job board terminal in a room
await spawn_item({ prototypeId: signPrototypeId, locationId: cityServicesId, properties: { name: 'Work Assignment Terminal', description: 'A screen displays available work orders. Touch to view assignments.', text: '' }});
```

### Updating Job Board Content

```javascript
// Get active jobs
const result = await plot({ action: 'list', status: 'active' });

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
// Get current balance
const current = await get_property({ objectId: playerId, name: 'credits' });

// Add reward
await set_property({ objectId: playerId, name: 'credits', value: (current || 0) + rewardAmount });
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
const result = await plot({ action: 'create', name: 'Renovate Building 7' });
const plotId = result.plotId;

// Job 1: Clear debris
await plot({ action: 'create_job', plotId, jobId: 'clear_debris', metadata: { step: 1, reward: 30 }});

// Job 2: Repair structure (unlocked after Job 1)
await plot({ action: 'create_job', plotId, jobId: 'repair_structure', metadata: { step: 2, reward: 50, prerequisite: 'clear_debris' }});

// Job 3: Install systems (unlocked after Job 2)
await plot({ action: 'create_job', plotId, jobId: 'install_systems', metadata: { step: 3, reward: 40, prerequisite: 'repair_structure' }});
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
const result = await plot({ action: 'create', name: 'Emergency: Water Main Break', metadata: {
  type: 'repair',
  priority: 'critical',
  location: problemLocation
}});
const plotId = result.plotId;

// 3. Create job
await plot({ action: 'create_job', plotId, jobId: 'emergency_repair', metadata: {
  reward: 100,  // Premium for emergency
  tools: ['wrench', 'sealant'],
  deadline: Date.now() + 3600000
}});

// 4. Spawn supervisor NPC
const supervisor = await ai({ action: 'spawn', role: 'supervisor', name: 'Repair Foreman', locationId: nearestRoomId });

// 5. Register completion hook
await plot({ action: 'register_hook', plotId, jobId: 'emergency_repair', targetId: brokenObjectId, eventName: 'repaired', filter: {} });

// 6. Announce
await plot({ action: 'add_event', plotId, message: 'EMERGENCY: Water main break. 100 credit reward. Report to Foreman.' });

// 7. Wait for hook trigger...

// 8. On completion
await plot({ action: 'complete_job', plotId, jobId: 'emergency_repair', reason: 'Repair completed.' });

// 9. Pay worker, despawn supervisor, close plot
await ai({ action: 'despawn', humanId: supervisor.id });
await plot({ action: 'close', plotId, status: 'completed', reason: 'Infrastructure restored.' });
```
