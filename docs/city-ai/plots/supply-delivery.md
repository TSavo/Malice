# Supply Delivery Plot

Second job: pick up sealed package from Supply Depot, deliver to destination.

## Trigger

A citizen requests work at the job board after completing their first-rations orientation.

## Sequence

```
Player completes first-rations
        ↓
Player returns to job board, requests work
        ↓
City AI assigns delivery job
        ↓
"Pick up package from Supply Depot, deliver to [destination]"
        ↓
Player walks to Supply Depot (waterfront)
        ↓
Player picks up sealed package from dispenser
        ↓
Player walks to destination
        ↓
Player deposits package in intake chute
        ↓
Hook fires → delivery confirmed
        ↓
Payment issued, job complete
```

## Objective

Teach the player:
- How to navigate between distant locations
- How to carry items (inventory management)
- That packages are tracked and tamper-proof
- Payment comes after verified completion

## Prerequisites

- Player is a Citizen (completed first-rations)
- Player has no active job assignment

## What This Plot Does

1. **Assigns delivery route** - random destination from active list
2. **Creates package** - spawns SealedBox with destination
3. **Registers hooks** - watches for pickup and delivery
4. **Pays on completion** - credits deposited after delivery confirmed

## Key Locations

| Location | Room ID | Purpose |
|----------|---------|---------|
| Supply Depot - Receiving | TBD | Pickup point |
| Smith Tower - Lobby | 1410 | Possible destination |
| City Services - Public Intake | TBD | Possible destination |
| Fabrication Factory - Lobby | TBD | Possible destination |

## Payment

Base delivery pay: **10 credits**

Modifiers:
- Distance bonus: +1 credit per 100m
- Time bonus: +5 credits if delivered within 10 minutes

## Implementation

### Detecting Eligible Player

When a job request comes in via `plot next`:

```javascript
const result = await plot({ action: 'next' });

if (result.plot) {
  const meta = result.plot.metadata || {};
  const playerId = meta.participants?.[0];

  // Check if first-rations is complete
  const searchResult = await plot({ action: 'search', query: 'first-rations completed' });
  const completedFirstRations = searchResult.results?.some(r =>
    r.playerId === playerId
  );

  // Check they don't have an active job
  const activeResult = await plot({ action: 'list', status: 'active' });
  const hasActiveJob = activeResult.plots?.some(p =>
    p.metadata?.type === 'employment' &&
    p.metadata?.participants?.includes(playerId)
  );

  if (completedFirstRations && !hasActiveJob) {
    await assignDeliveryJob(result.plot, playerId);
  }
}
```

### Phase 1: Assign Job

```javascript
async function assignDeliveryJob(p, playerId) {
  const plotId = p.id;

  // Select random destination
  const destinations = [
    { id: 1410, name: 'Smith Tower - Lobby', distance: 300 },
    // Add more as buildings are created
  ];
  const dest = destinations[Math.floor(Math.random() * destinations.length)];

  // Update plot metadata
  await plot({ action: 'set_metadata', plotId, key: 'type', value: 'employment' });
  await plot({ action: 'set_metadata', plotId, key: 'subtype', value: 'supply-delivery' });

  // Generate package code
  const packageCode = 'PKG-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // Respond to player
  await plot({ action: 'add_event', plotId, message: `Delivery assignment: Package ${packageCode}. Pickup: Supply Depot, Waterfront south of S. Main. Destination: ${dest.name}. Payment: 10 credits on verified delivery.`, from: 'handler' });

  // Create the job
  await plot({ action: 'create_job', plotId, jobId: 'deliver_package', metadata: {
    packageCode: packageCode,
    destinationId: dest.id,
    pickupLocationId: SUPPLY_DEPOT_RECEIVING_ID,
    payment: 10
  }});

  // Register hook on destination for package arrival
  await plot({ action: 'register_hook', plotId, jobId: 'deliver_package', targetId: dest.id, eventName: 'packageArrivedAtDestination', filter: { packageCode: packageCode }});
}
```

### Phase 2: Player Picks Up Package

The package dispenser at Supply Depot creates a SealedBox when the player interacts:

```javascript
// Dispenser checks player's active job assignment
// If they have a delivery job, spawns the package:

const pkg = await spawn_item({ prototypeId: SEALED_BOX_PROTO_ID, locationId: playerId, properties: {
  name: 'Sealed Package',
  packageCode: jobMetadata.packageCode,
  destinationId: jobMetadata.destinationId,
  destinationName: jobMetadata.destinationName,
  assignedTo: playerId
}});
```

### Phase 3: Delivery Hook Fires

When player enters destination room with package:

```javascript
const result = await plot({ action: 'next' });

if (result.plot && result.plot.metadata?.subtype === 'supply-delivery') {
  const events = result.plot.events || [];

  // Check for delivery event
  const delivered = events.some(e =>
    e.metadata?.hook === 'packageArrivedAtDestination' &&
    e.metadata?.data?.packageCode === result.plot.jobs?.deliver_package?.metadata?.packageCode
  );

  if (delivered) {
    await handleDeliveryComplete(result.plot);
  }
}
```

### Phase 4: Completion

```javascript
async function handleDeliveryComplete(p) {
  const plotId = p.id;
  const playerId = p.metadata?.participants?.[0];
  const payment = p.jobs?.deliver_package?.metadata?.payment || 10;

  // Pay the player
  const bank = await alias_lookup({ alias: 'bank' });
  await call_method({ objectId: bank.id, name: 'deposit', args: [playerId, payment, 'Delivery payment'] });

  await plot({ action: 'add_event', plotId, message: `${payment} credits deposited. Delivery confirmed.`, from: 'system' });

  // Respond to player
  await plot({ action: 'add_event', plotId, message: `Delivery confirmed. ${payment} credits deposited to your account. Return to job board for additional assignments.`, from: 'handler' });

  // Complete the job
  await plot({ action: 'complete_job', plotId, jobId: 'deliver_package', reason: 'Package delivered successfully.' });

  // Close the plot
  await plot({ action: 'close', plotId, status: 'completed', reason: 'Delivery complete.' });
}
```

## Handler Response Templates

**Initial assignment:**
> Delivery assignment: Package [CODE]. Pickup: Supply Depot, Waterfront south of S. Main. Destination: [NAME]. Payment: 10 credits on verified delivery.

**Pickup confirmed (if tracked):**
> Package [CODE] collected. Destination: [NAME]. Deliver to complete assignment.

**Delivery confirmed:**
> Delivery confirmed. [N] credits deposited to your account. Return to job board for additional assignments.

**If package tampered:**
> Package [CODE] seal compromised. Delivery voided. Assignment failed. This incident has been logged.

**If player asks for directions:**
> Supply Depot location: Waterfront, south of S. Main St. Follow Alaskan Way south from the waterfront path.

## Navigation

### Supply Depot from Smith Tower (1410)

1. Exit Smith Tower to 1st Ave S
2. West on Yesler Way to Waterfront
3. South on Waterfront to y=-5
4. East into Supply Depot

### Smith Tower from Supply Depot

1. West from Supply Depot to Waterfront
2. North on Waterfront to Yesler Way
3. East on Yesler Way to 1st Ave S
4. Enter Smith Tower

## Edge Cases

### Player Drops Package

Package remains in world. Player must retrieve it to complete delivery.

> Package [CODE] not in your possession. Retrieve it to complete delivery.

### Package Tampered

Delivery fails. Player may face consequences.

```javascript
// On packageTampered hook
await plot({ action: 'add_event', plotId, message: 'Package seal compromised. Delivery voided. Assignment failed. This incident has been logged.', from: 'handler' });

await plot({ action: 'fail_job', plotId, jobId: 'deliver_package', reason: 'Package tampered.' });

await plot({ action: 'close', plotId, status: 'failed', reason: 'Tamper seal broken.' });
```

### Player Abandons Job

After 24 hours with no progress:

> Delivery assignment [CODE] expired. Package recalled. Assignment closed.

### Wrong Destination

Package arrival hook only fires at correct destination. Depositing elsewhere has no effect.

## Success Criteria

- Player picked up package from Supply Depot
- Player delivered package to correct destination (with seal intact)
- Payment issued
- Plot closed as 'completed'

## What This Teaches

1. **Navigation** - Finding locations across the district
2. **Inventory** - Carrying items
3. **Trust** - Tamper seals mean something
4. **Payment** - Work is verified before payment
5. **Consequences** - Breaking rules has consequences

## Flow Diagram

```
Player requests work at job board
        ↓
City AI checks: first-rations complete? → YES
        ↓
Assign delivery: "Pick up PKG-ABC123, deliver to Smith Tower"
Register hook on destination
        ↓
Player walks to Supply Depot
        ↓
Player interacts with dispenser
        ↓
Dispenser spawns SealedBox in player inventory
        ↓
Player walks to Smith Tower
        ↓
Player enters with package → hook fires
        ↓
"Delivery confirmed. 10 credits deposited."
        ↓
Plot closed as completed
```
