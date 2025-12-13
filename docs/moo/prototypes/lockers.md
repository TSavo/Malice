# Locker System

Rentable storage compartments with code-based access.

## Overview

The locker system provides secure storage for players:

- **Compartments** - Individual lockable storage units
- **Ownership** - Rent compartments with expiration
- **Master codes** - Owner's permanent access code
- **One-time codes** - Single-use codes for couriers
- **Plot hooks** - Integration with job/event system

**Prototype Hierarchy:**
```
$.location
└── $.locker            ← Base locker bank (state only)
    └── $.oneTimeLocker ← With verbs and messaging
```

## $.locker - Base Locker Bank

A bank of compartments (like at a train station or gym). Handles state and validation only - no verbs.

### Properties

```javascript
{
  name: 'Locker Bank',
  description: 'A wall of storage lockers.',

  // Compartments keyed by ID
  compartments: {
    'A1': {
      owner: null,          // Player objref
      masterCode: null,     // Permanent access code
      oneTimeCodes: [],     // Single-use codes
      locked: true,
      contents: [],         // Items inside
      rentedAt: null,       // ISO timestamp
      expiresAt: null,      // ISO timestamp
    },
    // ...
  },

  // Configuration
  compartmentPrefix: '',    // e.g., 'A' for A1, A2...
  nextCompartmentNum: 1,
  rentalDurationMs: 7 * 24 * 60 * 60 * 1000,  // 7 days
}
```

### Compartment Management

#### createCompartment(id?)
Create a new empty compartment.

```javascript
const result = await locker.createCompartment('B1');
// { success: true, id: 'B1' }

// Or auto-generate ID
const result = await locker.createCompartment();
// { success: true, id: 'A1' }  // Uses prefix + next number
```

#### getCompartment(id)
Get compartment data.

```javascript
const comp = await locker.getCompartment('A1');
// { owner: null, masterCode: null, locked: true, contents: [], ... }
```

#### listCompartments() / listAvailable()
List compartment IDs.

```javascript
const all = await locker.listCompartments();
// ['A1', 'A2', 'A3']

const available = await locker.listAvailable();
// ['A2', 'A3']  // Unrented only
```

### Ownership

#### rentCompartment(id, player)
Assign ownership to player.

```javascript
const result = await locker.rentCompartment('A1', player);
// { success: true, expiresAt: '2024-01-15T12:00:00.000Z' }
```

#### releaseCompartment(id, player)
Give up ownership.

```javascript
const result = await locker.releaseCompartment('A1', player);
// { success: true }
```

#### isOwner(id, player)
Check if player owns compartment.

```javascript
const owns = await locker.isOwner('A1', player);
// true or false
```

#### renewCompartment(id)
Extend rental by another duration.

```javascript
const result = await locker.renewCompartment('A1');
// { success: true, expiresAt: '2024-01-22T12:00:00.000Z' }
```

### Expiration

#### isExpired(id)
Check if rental has expired.

```javascript
const expired = await locker.isExpired('A1');
// true or false
```

#### checkExpired()
Check all compartments, expire any past due.

```javascript
const expiredIds = await locker.checkExpired();
// ['A3', 'B1']  // Compartments that were expired
```

#### expireCompartment(id)
Force expire - recycles contents, clears ownership.

```javascript
const result = await locker.expireCompartment('A1');
// { success: true, recycledItems: ['package', 'key'] }
```

#### getExpirationInfo(id)
Get time remaining on rental.

```javascript
const info = await locker.getExpirationInfo('A1');
// {
//   expired: false,
//   remaining: 172800000,        // ms
//   expiresAt: '2024-01-15T...',
//   timeRemaining: '2 days'
// }
```

### Codes

#### setMasterCode(id, code)
Set permanent access code (owner only).

```javascript
const result = await locker.setMasterCode('A1', 'SECRET123');
// { success: true }
```

#### generateCode()
Generate random 6-character code.

```javascript
const code = await locker.generateCode();
// 'X7KM2P'
```

#### createOneTimeCode(id)
Create single-use access code.

```javascript
const result = await locker.createOneTimeCode('A1');
// { success: true, code: 'H4JK9Q' }
```

#### validateCode(id, code)
Check if code is valid.

```javascript
const result = await locker.validateCode('A1', 'H4JK9Q');
// { valid: true, isMaster: false, isOneTime: true }
```

#### consumeOneTimeCode(id, code)
Mark one-time code as used.

```javascript
await locker.consumeOneTimeCode('A1', 'H4JK9Q');
// Code can no longer be used
```

### Lock State

#### isLocked(id) / lock(id) / unlock(id, code)

```javascript
const locked = await locker.isLocked('A1');  // true

await locker.unlock('A1', 'SECRET123');
// { success: true, usedOneTime: false }

await locker.lock('A1');
// { success: true }
```

### Contents

#### getContents(id)
Get items in compartment.

```javascript
const items = await locker.getContents('A1');
// [packageObj, keyObj, ...]
```

#### addContent(id, item) / removeContent(id, item)

```javascript
await locker.addContent('A1', package);
// { success: true }

await locker.removeContent('A1', package);
// { success: true }
```

Both trigger plot hooks (`itemDeposited`, `itemRemoved`).

## $.oneTimeLocker - Courier-Friendly Lockers

Inherits from $.locker, adds player-facing verbs and 24-hour default rental.

### Verb Commands

| Command | Handler | Description |
|---------|---------|-------------|
| `rent locker` | doRent | Claim available compartment |
| `open locker A1` | doOpen | Unlock with code prompt |
| `close locker A1` | doClose | Lock compartment |
| `set code on locker A1` | doSetCode | Set master code (owner) |
| `get code from locker A1` | doGetCode | Generate one-time code (owner) |
| `check locker A1` | doCheck | View status (owner) |
| `release locker A1` | doRelease | Give up ownership |
| `renew locker A1` | doRenew | Extend rental |
| `put item in locker A1` | doPut | Store item |
| `get item from locker A1` | doGet | Retrieve item |

### Verb Registration

Verbs register automatically when:
- Locker is placed in room (`onArrived`)
- Player enters room with locker (`onPlayerArrived`)

Verbs unregister when:
- Locker leaves room (`onLeaving`)

### Plot Hooks

The locker triggers plot hooks for game events:

```javascript
// When compartment is opened
await self.triggerPlotHooks('opened', {
  compartment: 'A1',
  player: playerId,
  playerName: 'Bob',
  usedOneTimeCode: true,
  code: 'H4JK9Q',
});

// When one-time code is used
await self.triggerPlotHooks('oneTimeCodeUsed', {
  compartment: 'A1',
  player: playerId,
  playerName: 'Bob',
  code: 'H4JK9Q',
});

// When item is deposited
await self.triggerPlotHooks('itemDeposited', {
  compartment: 'A1',
  item: itemId,
  itemName: 'package',
});

// When item is removed
await self.triggerPlotHooks('itemRemoved', {
  compartment: 'A1',
  item: itemId,
  itemName: 'package',
});

// When compartment is closed
await self.triggerPlotHooks('closed', {
  compartment: 'A1',
  player: playerId,
  playerName: 'Bob',
});
```

## Courier Workflow

### Sender (Owner) Flow

```
1. Find locker bank
> look at locker
"A bank of storage lockers. 10 compartments (5 available)."

2. Rent a compartment
> rent locker
"You now own compartment A3. Set a master code with: set code on locker A3"

3. Set master code
> set code on locker A3
"Enter new master code (at least 4 characters): ****"
"Master code set for compartment A3."

4. Put item inside
> open locker A3
"Enter code: ****"
"Compartment A3 - Unlocked. Empty."

> put package in locker A3
"You put package in compartment A3."

> close locker A3
"Compartment A3 is now locked."

5. Generate one-time code for courier
> get code from locker A3
"One-time code for A3: H4JK9Q"
"Give this to a courier. It can only be used once."
```

### Courier Flow

```
1. Arrive at locker location
> look at locker
"A bank of storage lockers."

2. Open with one-time code
> open locker A3
"Enter code: H4JK9Q"
"Compartment A3 - Unlocked.
Contents:
  - package"

3. Take item
> get package from locker A3
"You take package."

4. Close locker
> close locker A3
"Compartment A3 is now locked."

// Note: One-time code is now consumed
```

## Creating Locker Banks

### Basic Locker Bank

```javascript
const lockerBank = await $.recycler.create($.oneTimeLocker, {
  name: 'Transit Station Lockers',
  description: 'A row of battered metal lockers.',
  compartmentPrefix: 'T',
  rentalDurationMs: 24 * 60 * 60 * 1000,  // 24 hours
});

// Create compartments
for (let i = 1; i <= 20; i++) {
  await lockerBank.createCompartment();
  // Creates T1, T2, T3... T20
}
```

### Premium Lockers (Longer Rental)

```javascript
const premiumLockers = await $.recycler.create($.oneTimeLocker, {
  name: 'Premium Storage Units',
  description: 'Large, climate-controlled storage compartments.',
  compartmentPrefix: 'P',
  rentalDurationMs: 30 * 24 * 60 * 60 * 1000,  // 30 days
});
```

## Security Considerations

### Code Format
- 6 characters from: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Excludes confusing characters (0/O, 1/I/L)
- ~1 billion possible combinations

### One-Time Codes
- Can only be used once
- Marked as used after unlock
- Stored with creation timestamp

### Expiration
- Expired compartments recycle all contents
- Clears ownership and codes
- Compartment becomes available again

## Integration with Jobs

Lockers integrate with the plot/job system for courier missions:

```javascript
// Job creates a locker drop
const job = {
  type: 'courier',
  description: 'Deliver package to locker A3 at Transit Station',
  locker: {
    id: lockerBankId,
    compartment: 'A3',
    code: 'H4JK9Q',  // One-time code for courier
  },
  targetItem: packageId,
};

// When courier deposits item, plot hook fires
// Job system can detect completion
```

## See Also

- [Security](./security.md) - Lock and key systems
- [Items](./items.md) - Item handling
- [Plot Jobs](../../plot-jobs.md) - Job integration
