# Plot Jobs and Hooks

This document explains how to set up jobs within plots that can watch for events in the game world.

## Architecture

```
Plot (narrative arc)
├── events[]        - Event log for the whole plot
├── metadata{}      - Plot-level data
└── jobs{}          - Individual tasks within the plot
    └── job
        ├── status      - active | completed | expired | failed
        ├── expiresAt   - Optional deadline
        ├── hooks[]     - What this job is watching for
        └── metadata{}  - Job-specific data
```

**Key concepts:**
- A **plot** is a narrative container (e.g., "Yamamoto Corp Delivery Run")
- A **job** is a specific task within a plot (e.g., "deliver-package", "collect-payment")
- A **hook** watches for events on objects (e.g., "when code XYZ789 is used on locker #100")
- **Filters** ensure only the right events trigger the hook

## Example: Courier Delivery Job

A player requests work. The handler creates a delivery job: pick up a package and deliver it to a locker. When the courier deposits the package, the job completes.

### Step 1: Create the Plot and Job

```javascript
// Assume we have plot #54
const plot = await $.load(54);

// Create a job within the plot
await plot.createJob('deliver-package', {
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  metadata: {
    description: 'Deliver package to locker',
    packageId: 55,
    lockerId: 100,
  }
});
```

### Step 2: Create a One-Time Code on the Locker

```javascript
const locker = await $.load(100);

// Generate a one-time code
const result = await locker.createOneTimeCode();
// result = { success: true, code: 'XYZ789' }

const code = result.code;

// Store the code in the job metadata
await plot.setJobMetadata('deliver-package', 'accessCode', code);
```

### Step 3: Register a Hook with Filter

```javascript
// Watch for THIS specific code being used
await plot.registerJobHook(
  'deliver-package',     // jobId
  100,                   // targetId (locker)
  'oneTimeCodeUsed',     // eventName
  { code: code }         // filter - only trigger when data.code matches
);
```

The hook is now registered. When someone uses code `XYZ789` on locker #100, this job will be notified.

### Step 4: Tell the Player

```javascript
await plot.addEvent({
  from: 'handler',
  message: 'Deliver the package to the locker at Grid Square 7. Access code: ' + code,
});
```

### Step 5: Wait for the Hook to Fire

When the courier:
1. Goes to the locker
2. Types `open locker`
3. Enters code `XYZ789`
4. Puts the package in

The locker triggers `oneTimeCodeUsed` with data:
```javascript
{
  player: 42,
  playerName: 'CourierBob',
  code: 'XYZ789'
}
```

The filter `{ code: 'XYZ789' }` matches, so `plot.onJobHookTriggered()` is called.

This automatically:
- Adds an event to the plot log
- Sets `needsAttentionAt` to now (so `get_next_job` returns it)

### Step 6: Check the Event and Complete the Job

When checking on the plot:

```javascript
const job = await plot.getJob('deliver-package');
// job.status === 'active'

// Check the events
const events = await plot.getEventLog();
// Last event: "Job deliver-package: oneTimeCodeUsed by CourierBob"

// Complete the job
await plot.completeJob('deliver-package', 'Package delivered successfully');
```

Completing the job:
- Sets status to `completed`
- Unregisters all hooks for this job
- Adds a completion event to the log

## Available Events on Locker Banks

Locker banks contain multiple compartments. Events include the compartment ID.

| Event | Trigger | Data |
|-------|---------|------|
| `itemDeposited` | Item placed in compartment | `{ compartment, item, itemName }` |
| `itemRemoved` | Item taken from compartment | `{ compartment, item, itemName }` |
| `opened` | Compartment unlocked | `{ compartment, player, playerName, usedOneTimeCode, code }` |
| `closed` | Compartment locked | `{ compartment, player, playerName }` |
| `oneTimeCodeUsed` | One-time code consumed | `{ compartment, player, playerName, code }` |

## Filter Matching

Filters are key-value pairs that must ALL match the trigger data:

```javascript
// Only fires when code is 'XYZ789'
{ code: 'XYZ789' }

// Only fires for compartment 'A1' with code 'XYZ789'
{ compartment: 'A1', code: 'XYZ789' }

// Only fires when code is 'XYZ789' AND player is #42
{ code: 'XYZ789', player: 42 }

// Empty filter = fires on ANY event of this type
{}
```

## Job Lifecycle Methods

### Creating Jobs

```javascript
await plot.createJob(jobId, {
  expiresAt: '2024-12-15T00:00:00Z',  // Optional deadline
  metadata: { ... },                   // Optional initial metadata
  status: 'active',                    // Default: 'active'
});
```

### Querying Jobs

```javascript
const job = await plot.getJob('deliver-package');
const activeJobs = await plot.getActiveJobs();  // Auto-expires overdue jobs
```

### Completing Jobs

```javascript
// Success
await plot.completeJob('deliver-package', 'Package delivered');

// Failure
await plot.failJob('deliver-package', 'Courier was killed');

// Expiration (called automatically by getActiveJobs, or manually)
await plot.expireJob('deliver-package');
```

All three methods:
- Change job status
- Unregister all hooks for that job
- Add an event to the plot log

### Job Metadata

```javascript
await plot.setJobMetadata('deliver-package', 'accessCode', 'XYZ789');
await plot.setJobMetadata('deliver-package', 'reward', 500);

const job = await plot.getJob('deliver-package');
console.log(job.metadata.accessCode);  // 'XYZ789'
```

## Hook Management

### Registering Hooks

```javascript
// Per-job hook (recommended)
await plot.registerJobHook(jobId, targetId, eventName, filter);

// Plot-level hook (legacy, no job association)
await plot.registerHook(targetId, eventName, filter);
```

### Unregistering Hooks

```javascript
// Single hook
await plot.unregisterJobHook(jobId, targetId, eventName);

// All hooks for a job (done automatically by completeJob/failJob/expireJob)
// (hooks are stored on the job and cleaned up on status change)

// All plot-level hooks
await plot.unregisterAllHooks();
```

### Listing Hooks

```javascript
const hooks = await plot.getJobHooks('deliver-package');
// [{ targetId: 100, eventName: 'oneTimeCodeUsed' }]
```

## MCP Workflow

From Claude's perspective using MCP tools:

```
1. get_next_job
   → Returns plot with player's request

2. respond_to_job (give instructions)
   → "Pick up package #55 from warehouse"

3. call_method on plot
   → createJob('deliver-package', {...})

4. call_method on locker
   → createOneTimeCode()

5. call_method on plot
   → registerJobHook('deliver-package', lockerId, 'oneTimeCodeUsed', { code })

6. respond_to_job (give code to player)
   → "Deliver to locker #100. Code: XYZ789"

7. [Wait for hook to fire - player does the delivery]

8. get_next_job
   → Returns same plot (hook triggered needsAttentionAt)

9. [Check events, see delivery confirmed]

10. call_method on plot
    → completeJob('deliver-package', 'Success')

11. respond_to_job
    → "Payment transferred. Job complete."
```

## Multiple Jobs Example

A complex plot might have sequential jobs:

```javascript
// Job 1: Pick up package
await plot.createJob('pickup', { metadata: { warehouseId: 200 } });

// Job 2: Deliver package (starts pending, activated after pickup)
await plot.createJob('deliver', {
  status: 'pending',  // Not active yet
  metadata: { lockerId: 100 }
});

// When pickup completes, activate delivery
await plot.completeJob('pickup', 'Package acquired');
// Manually update deliver job
const jobs = plot.jobs;
jobs['deliver'].status = 'active';
plot.jobs = jobs;
// Now register hooks for delivery...
```

## Best Practices

1. **Always use job hooks, not plot hooks** - Jobs auto-cleanup when completed
2. **Set expiration times** - Prevents orphaned hooks on abandoned plots
3. **Use specific filters** - `{ code: 'XYZ789' }` not `{}`
4. **Store codes in job metadata** - Makes it easy to reference later
5. **Complete jobs explicitly** - Don't leave them hanging
6. **Check job status before acting** - Jobs might have expired
