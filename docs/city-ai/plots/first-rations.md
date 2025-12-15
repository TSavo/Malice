# First Rations Plot

Orientation job: collect your first food and water. **Citizenship is granted here.**

## Trigger

A player uses the job board for the first time and requests work. This is their mandatory first assignment before any other work is available.

## Sequence

```
Player enters city (Scavenger)
        ↓
Player finds job board, requests work
        ↓
★ CITIZENSHIP GRANTED ★
        ↓
5 credits deposited
        ↓
"Collect rations from Nutrient Dispensary"
        ↓
Player walks to Factory Row
        ↓
Guarded exit checks faction → Citizen → ALLOWED
        ↓
Player buys Sustain + Water
        ↓
Orientation complete, ready for real work
```

Recruiters pointing players to the job board are handled separately via $.ai roles, not as plots.

## Objective

Guide the new citizen to the Nutrient Dispensary to collect Sustain pills and water, teaching them:
- How to find locations
- How the dispensary works
- That citizenship = access to food (they couldn't enter before!)

## Prerequisites

- Player has no prior completed jobs (first-timer)
- The Nutrient Dispensary entrance is Citizen-only (guarded exit)

## What This Plot Does

1. **Grants citizenship** - setFaction to 'Citizen'
2. **Provides credits** - 5 credit orientation stipend
3. **Assigns first job** - collect rations
4. **Unlocks access** - Citizen-only facilities now accessible

## Key Locations

| Location | Room ID | Purpose |
|----------|---------|---------|
| Nutrient Dispensary | 1344 | Collect rations |
| Nutrient Dispensing Station | 1347 | Vendable kiosk |
| Job Board (Smith Tower) | 1460 | Where they start |

## The Rations

The Nutrient Dispensing Station (1347) sells:
- **Sustain Pill** - 2 credits
- **Bottled Water (500ml)** - 1 credits

New citizens need 3 credits minimum. Options:
1. Grant starter credits on citizenship registration
2. First rations are free (special voucher)
3. They scavenged enough before registering

## Implementation

### Detecting First-Timer

When a job request comes in via `plot next`:

```javascript
const result = await plot({ action: 'next' });

if (result.plot) {
  const events = result.plot.events || [];
  const meta = result.plot.metadata || {};
  const playerId = meta.participants?.[0];

  // Check if this is a first-timer by searching plot events
  const searchResult = await plot({ action: 'search', query: 'first-rations completed' });
  const completedFirstRations = searchResult.results?.some(r =>
    r.playerId === playerId
  );

  if (!completedFirstRations) {
    // This is their first job - give them rations assignment
    await handleFirstRations(result.plot, playerId);
  }
}
```

### Phase 1: Respond to Request

Whatever they asked for, redirect to rations first:

```javascript
async function handleFirstRations(p, playerId) {
  const plotId = p.id;

  // Update plot metadata
  await plot({ action: 'set_metadata', plotId, key: 'type', value: 'employment' });
  await plot({ action: 'set_metadata', plotId, key: 'subtype', value: 'first-rations' });

  // CRITICAL: Grant citizenship when they request their first job
  // This unlocks access to Citizen-only areas like the Nutrient Dispensary
  const faction = await alias_lookup({ alias: 'faction' });
  await call_method({ objectId: faction.id, name: 'setFaction', args: [playerId, 'Citizen'] });

  await plot({ action: 'add_event', plotId, message: 'Citizenship granted. Work eligibility confirmed. Citizen facilities now accessible.', from: 'system' });

  // Respond to their request
  await plot({ action: 'add_event', plotId, message: 'Citizenship confirmed. First assignment: collect daily rations from Nutrient Dispensary. Location: Factory Row, west of S. Washington St. Purchase: 1 Sustain, 1 Water. Credits provided.', from: 'handler' });

  // Grant starter credits
  const bank = await alias_lookup({ alias: 'bank' });
  await call_method({ objectId: bank.id, name: 'deposit', args: [playerId, 5, 'Citizenship orientation stipend'] });

  await plot({ action: 'add_event', plotId, message: '5 credits deposited to citizen account. Orientation stipend.', from: 'system' });

  // Create the job
  await plot({ action: 'create_job', plotId, jobId: 'collect_rations', metadata: {
    required: ['sustain', 'water'],
    dispensaryId: 1344,
    vendorId: 1347
  }});

  // Register hook on the dispensing station for purchases
  await plot({ action: 'register_hook', plotId, jobId: 'collect_rations', targetId: 1347, eventName: 'itemPurchased', filter: { buyerId: playerId }});
}
```

### Phase 2: Player Sees Assignment

When they check the job board, they see:

```
╔══════════════════════════════════════╗
║    CITY EMPLOYMENT TERMINAL          ║
╚══════════════════════════════════════╝

ACTIVE ASSIGNMENT: Assignment for PlayerName

Status: active
Started: 12/13/2110

RECENT ACTIVITY:
  [12/13/2110, 2:30:15 PM]
    HANDLER: Work request received. Before assignment,
    complete orientation. Collect daily rations from
    Nutrient Dispensary. Location: Factory Row, west
    of S. Washington St. Purchase: 1 Sustain, 1 Water.
    Credits provided.

  [12/13/2110, 2:30:15 PM]
    SYSTEM: 5 credits deposited to citizen account.
    Orientation stipend.
```

### Phase 3: Hook Fires on Purchase

When player buys from the dispensing station:

```javascript
// The vendable emits 'itemPurchased' with buyer info
// Hook triggers, plot needs attention

const result = await plot({ action: 'next' });

if (result.plot && result.plot.metadata?.subtype === 'first-rations') {
  const events = result.plot.events || [];

  // Check what was purchased (itemType is the protoId)
  const purchases = events.filter(e =>
    e.metadata?.hook === 'itemPurchased'
  );

  const boughtSustain = purchases.some(e =>
    e.metadata?.data?.itemType === 'sustain'
  );
  const boughtWater = purchases.some(e =>
    e.metadata?.data?.itemType === 'bottledWater'
  );

  // Note: The Vendable.vend() method triggers plotHooks with:
  // { buyerId, buyerName, itemId, itemName, itemType, price, vendorId }

  if (boughtSustain && boughtWater) {
    // Rations collected - complete the job
    await handleRationsComplete(result.plot);
  } else if (boughtSustain || boughtWater) {
    // Partial - acknowledge but wait for both
    await plot({ action: 'add_event', plotId: result.plot.id, message: 'Purchase logged. Collect remaining item to complete orientation.', from: 'handler' });
  }
}
```

### Phase 4: Completion

When both items purchased:

```javascript
async function handleRationsComplete(p) {
  const plotId = p.id;

  await plot({ action: 'add_event', plotId, message: 'Orientation complete. Rations secured. You are now eligible for work assignments. Return to any job board to request employment.', from: 'handler' });

  await plot({ action: 'complete_job', plotId, jobId: 'collect_rations', reason: 'Rations collected successfully.' });

  await plot({ action: 'close', plotId, status: 'completed', reason: 'First rations orientation complete.' });
}
```

## Handler Response Templates

**Initial assignment:**
> Work request received. Before assignment, complete orientation. Collect daily rations from Nutrient Dispensary. Location: Factory Row, west of S. Washington St. Purchase: 1 Sustain, 1 Water. Credits provided.

**Partial completion:**
> Purchase logged. Collect remaining item to complete orientation.

**Full completion:**
> Orientation complete. Rations secured. You are now eligible for work assignments. Return to any job board to request employment.

**If they ask for different work:**
> Orientation required first. Collect rations from Nutrient Dispensary before other assignments are available.

## Navigation Help

If player asks how to get there:

> Nutrient Dispensary location: Exit Smith Tower lobby to 1st Ave S. Go south to S. Washington St. Go west. Dispensary entrance is north, marked "Factory Row."

Approximate route from Smith Tower (1410):
1. Exit lobby → 1st Ave S (south)
2. South on 1st Ave S to S. Washington St
3. West on S. Washington St
4. North into Factory Row - Nutrient Dispensary

## Edge Cases

### Player Has No Credits

If bank check shows insufficient funds:
```javascript
// Grant additional stipend
await plot({ action: 'add_event', plotId, message: 'Insufficient funds detected. Emergency stipend issued. Proceed to dispensary.', from: 'handler' });

await call_method({ objectId: bank.id, name: 'deposit', args: [playerId, 5, 'Emergency stipend'] });
```

### Player Already Has Food

Still require them to complete the orientation:
> Rations in possession noted. Purchase requirement waived. Orientation logged as complete.

Then close the plot.

### Player Tries to Skip

If they request other work while this is active:
> Active orientation in progress. Complete current assignment first. Check terminal for details.

## Success Criteria

- Player purchased Sustain from dispensary
- Player purchased Water from dispensary
- Plot closed as 'completed'

## What This Teaches

1. **Job board workflow** - Request work, check status, complete tasks
2. **Navigation** - Find locations in Pioneer Square
3. **Economy** - Credits, purchases, vendors
4. **Citizenship benefits** - Access to the dispensary (Citizen-only)
5. **Handler communication** - The AI responds to their needs

## Flow Diagram

```
Player uses job board
        ↓
"Request new assignment"
        ↓
City AI sees request via plot({ action: 'next' })
        ↓
Check: first-timer? → YES
        ↓
Respond: "Collect rations from dispensary"
Grant 5 credits
Register hook on dispensing station
        ↓
Player walks to Nutrient Dispensary
        ↓
Player purchases Sustain (2 credits)
        ↓
Hook fires → "Partial, need water too"
        ↓
Player purchases Water (1 credit)
        ↓
Hook fires → Both items purchased
        ↓
"Orientation complete. Ready for work."
        ↓
Plot closed as completed
```
