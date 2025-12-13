# Security System

Composable locks, biometric authentication, banks, and lockers in Malice.

## Overview

Security in Malice is built on composable lock objects. Locks can be attached to exits, elevators, containers, or any object needing restricted access. The system supports:
- **$.lock** - Base lock interface
- **$.biometricLock** - Fingerprint/retinal scan authentication
- **$.bank / $.bankTerminal** - Banking system, accounts, transactions
- **$.locker / $.oneTimeLocker** - Storage containers with locks

## $.lock - Base Lock Prototype

### Purpose

Defines the interface for all locks. Can be extended for keycard, biometric, code, or multi-factor locks.

### Key Method

#### canAccess(agent, target)
Checks if agent can access the target (room, floor, container, etc.).

```javascript
const result = await lock.canAccess(player, 35); // e.g., floor 35
if (result === true) {
  // Access granted
} else {
  await player.tell(result); // Rejection message
}
```

## $.biometricLock - Biometric Authentication

Inherits from: **$.lock**

### Purpose

Requires agents to pass biometric scans (fingerprint, retinal, etc.) and be authorized for the target.

### Properties

```javascript
{
  authorizedUsers: {
    1: [player1, player2],   // Floor 1
    35: [adminPlayer],       // Floor 35
    // ...
  },
  scanners: [
    { type: 'retinal', part: 'eye', message: 'Retinal scan failed.' },
    { type: 'fingerprint', part: 'hand', message: 'Fingerprint scan failed.' }
  ],
  // Legacy fields for single-scan configs
  scannerType: 'retinal',
  requiredBodyPart: 'eye',
}
```

### Key Methods

#### canAccess(agent, target)
Checks all required scans and authorization.

```javascript
const result = await biometricLock.canAccess(player, 35); // Floor 35
if (result === true) {
  // Access granted
} else {
  await player.tell(result); // "Retinal scan failed." or "Access denied."
}
```

#### authorize(user, target)
Add a user to the authorized list for a target.

```javascript
await biometricLock.authorize(player, 35); // Authorize for floor 35
```

#### deauthorize(user, target)
Remove a user from the authorized list.

```javascript
await biometricLock.deauthorize(player, 35);
```

## Composing Locks

Locks can be stacked for multi-factor security:

```javascript
const bioLock = await $.recycler.create($.biometricLock, {
  scanners: [
    { type: 'retinal', part: 'eye' },
    { type: 'fingerprint', part: 'hand' }
  ],
  authorizedUsers: { 35: [adminId] }
});

const codeLock = await $.recycler.create($.lock, {
  code: '1234',
  // ...
});

// Attach both to elevator
await elevator.addLock(bioLock);
await elevator.addLock(codeLock);
```

## $.bank / $.bankTerminal - Banking System

### Purpose

Provides secure accounts, transactions, and terminals for players.

### Properties

```javascript
{
  accounts: {
    playerId: {
      balance: 1000,
      transactions: [ ... ]
    },
    // ...
  },
  terminals: [terminalId1, terminalId2, ...]
}
```

### Key Methods

#### deposit(player, amount)
Add funds to player's account.

```javascript
await bank.deposit(player, 500);
```

#### withdraw(player, amount)
Remove funds from player's account.

```javascript
await bank.withdraw(player, 200);
```

#### transfer(fromPlayer, toPlayer, amount)
Transfer funds between accounts.

```javascript
await bank.transfer(alice, bob, 100);
```

#### getBalance(player)
Check account balance.

```javascript
const balance = await bank.getBalance(player);
```

## $.locker / $.oneTimeLocker - Storage Containers

### Purpose

Lockable containers for storing items. Can use any lock type (key, code, biometric).

### Properties

```javascript
{
  locked: true,
  lock: lockId, // Reference to lock object
  contents: [itemId1, itemId2, ...]
}
```

### Key Methods

#### open(agent)
Attempt to open locker (checks lock).

```javascript
const result = await locker.open(player);
if (result.success) {
  // Access contents
} else {
  await player.tell(result.message);
}
```

#### close(agent)
Close and lock the locker.

```javascript
await locker.close(player);
```

## Real-World Example: Elevator Security

```javascript
// Create biometric lock for elevator
const bioLock = await $.recycler.create($.biometricLock, {
  scanners: [
    { type: 'retinal', part: 'eye' },
    { type: 'fingerprint', part: 'hand' }
  ],
  authorizedUsers: { 35: [adminId], 42: [vipId] }
});

await elevator.addLock(bioLock);

// Player tries to access floor 35
const result = await elevator.canAccessFloor(player, 35);
if (result === true) {
  // Elevator moves
} else {
  await player.tell(result); // "Access denied. Biometric signature not recognized."
}
```

## Tips & Best Practices

1. **Use composable locks** - Stack multiple lock types for high security
2. **Biometric locks for VIP areas** - Restrict access to specific players
3. **Bank terminals for economy** - Centralize transactions
4. **Lockers for player storage** - Use one-time lockers for quest rewards
5. **Always check canAccess()** - Never bypass lock checks
6. **Deauthorize on role change** - Remove access when player loses privilege
7. **Test all lock scenarios** - Ensure correct rejection messages

## See Also

- [Room System](./rooms.md) - How locks integrate with rooms and elevators
- [Bootstrap](../advanced/bootstrap.md) - Adding custom lock types
- [Objects](../advanced/objects.md) - Creating and placing lockable objects

# Elevator Prototype

Vertical transport system with composable lock security.

## Properties
- `currentFloor`: Current floor number
- `floors`: Array of accessible floor numbers
- `floorRooms`: Map of floor number to room object
- `moving`: True while elevator is in motion
- `destination`: Floor number being traveled to (or null)
- `locks`: Array of lock objects (composable security)
- `doorsOpen`: True when doors are open
- `travelTimePerFloor`: ms per floor (default 2000)
- `capacity`: Max passengers

## Key Methods
- `canAccessFloor(agent, floor)`: Checks all locks for access
- `addLock(lock)`: Add a lock object
- `removeLock(lock)`: Remove a lock object
- `selectFloor(agent, floor)`: Request to move to a floor (checks locks, moves elevator)
- `startMovement(floor)`: Begin movement to a floor

---

# Lock Prototype

Base prototype for access control systems. Can be attached to elevators, doors, containers, etc.

## Properties
- `name`: Lock type name
- `description`: Description

## Key Method
- `canAccess(agent, target)`: Returns true or rejection string (base lock allows all access)

## Subclasses
- `$.biometricLock`: Scans body parts
- `$.keycardLock`: Requires keycard item
- `$.passwordLock`: Requires password
- `$.timeLock`: Restricts by time
- `$.rentableLock`: Bank-based rental access

---

# Rentable Lock Prototype

Combines lock access control with bank-based rental/payment logic.

## Properties

```javascript
{
  name: 'Rentable Lock',
  description: 'A lock that can be rented for a fee.',

  // Rental configuration
  price: 100,              // Rental price
  duration: 3600000,       // Duration in ms (1 hour default)

  // Payment
  bank: null,              // Bank object reference
  account: null,           // Account to receive payments

  // Active renters
  renters: {},             // { agentId: expirationTimestamp }

  // Access code (generated on rental)
  code: null,
  linkedLockId: null,      // Paired lock for code sync

  // Composable locks
  locks: [],
}
```

## Key Methods

### canAccess(agent, target, inputCode)
Checks rental status, code, and composable locks.

```javascript
const result = await rentableLock.canAccess(player, room, '1234ABCD');
if (result === true) {
  // Access granted
} else {
  // 'Access denied. Please rent to unlock.'
  // 'Access denied. Incorrect code.'
}
```

**Checks:**
1. Agent has valid (non-expired) rental
2. Input code matches lock code (if set)
3. All composable locks pass

### rent(agent, idempotencyKey)
Process payment and grant access.

```javascript
const result = await rentableLock.rent(player, 'rental-' + Date.now());
// {
//   success: true,
//   message: 'Access granted for 60 minutes. Code: 1234ABCD',
//   code: '1234ABCD'
// }
```

**What it does:**
1. Find agent's bank account
2. Transfer `price` to lock's `account`
3. If already renting: extend duration, keep same code
4. If new rental: generate new code, set expiration
5. Sync code to linked lock (if configured)

### revoke(agent)
Remove agent's access.

```javascript
await rentableLock.revoke(player);
```

### isRenter(agent)
Check if agent currently has access.

```javascript
const hasAccess = await rentableLock.isRenter(player);
// true or false
```

### promptForCode(agent, target)
Interactive code entry via $.prompt.

```javascript
const result = await rentableLock.promptForCode(player, room);
// Prompts: 'Enter your access code:'
// Returns canAccess result
```

### syncCode(code)
Set code and sync to linked lock.

```javascript
await rentableLock.syncCode('NEWCODE1');
// Updates self.code and linkedLock.code
```

## Linked Locks

For bidirectional doors/exits, link two rentable locks:

```javascript
const lockA = await $.recycler.create($.rentableLock, { ... });
const lockB = await $.recycler.create($.rentableLock, { ... });

lockA.linkedLockId = lockB.id;
lockB.linkedLockId = lockA.id;

// Now when lockA.rent() generates a code, it syncs to lockB
// Same code works on both sides
```

## Example: Rentable Storage Room

```javascript
const storageLock = await $.recycler.create($.rentableLock, {
  name: 'Storage Room Lock',
  price: 50,                      // 50 credits per rental
  duration: 24 * 60 * 60 * 1000,  // 24 hours
  bank: $.bank.id,
  account: 'STORAGE-REVENUE-001',
});

// Attach to exit
storageExit.locks = [storageLock.id];

// Player rents access
> rent storage
'Access granted for 1440 minutes. Code: K7MX9P2L'

// Player enters with code
> enter storage
'Enter your access code: K7MX9P2L'
// Access granted
```

---

# Biometric Lock Prototype

Scans body parts for authorization. Inherits from Lock.

## Properties
- `authorizedUsers`: Map of target (e.g., floor) to array of authorized player objects
- `scanners`: Array of scan requirements (type, part, message)
- `scannerType`, `requiredBodyPart`: Legacy single-scan config

## Key Methods
- `canAccess(agent, target)`: Checks all required scans and authorization
  - Checks for required body part
  - Checks for clothing blocking scan
  - Checks if agent is authorized for target
- `authorize(user, target)`: Add user to authorized list for target
- `revoke(user, target)`: Remove user from authorized list for target

---

# Example Usage

```javascript
// Create elevator with biometric lock
const elevator = await $.recycler.create($.elevator, {
  floors: [1, 2, 35, 42],
  floorRooms: { 1: lobbyId, 35: vipLoungeId, 42: penthouseId },
});

const bioLock = await $.recycler.create($.biometricLock, {
  scanners: [
    { type: 'retinal', part: 'eye', message: 'Retinal scan failed.' },
    { type: 'fingerprint', part: 'hand', message: 'Fingerprint scan failed.' }
  ],
  authorizedUsers: { 35: [adminId], 42: [vipId] }
});

await elevator.addLock(bioLock);

// Player tries to access floor 35
const result = await elevator.canAccessFloor(player, 35);
if (result === true) {
  // Elevator moves
} else {
  await player.tell(result); // "Access denied. Biometric signature not recognized."
}
```

---

# See Also
- [Security System](./security.md)
- [Room System](./rooms.md)
- [Body System](./body.md)

## Door Integration

Exits now support a `door` property. If present, all access checks are delegated to the referenced `$.door` object. This enables unified, bidirectional access control, lock state, and messaging for doors and exits.

**Example:**
```javascript
// Create a door object
const door = await $.recycler.create($.door, { ... });
// Attach to both exits
exitAtoB.door = door.id;
exitBtoA.door = door.id;
```

See [door.md](./door.md) for details.
