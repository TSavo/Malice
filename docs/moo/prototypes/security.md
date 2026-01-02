# Security System

> **Abilities-First**: Security systems use abilities to describe access control, authentication, and bypassing. The AI interprets unlock/bypass attempts. See `docs/ABILITIES-FIRST.md`.

Composable locks, biometric authentication, faction access, banks, and lockers in Malice.

## Overview

Security in Malice is built on composable lock objects. Locks can be attached to exits, elevators, containers, or any object needing restricted access. The system supports:
- **$lock** - Base lock interface
- **$biometricLock** - Fingerprint/retinal scan authentication
- **$guardedExit** - Faction-based access control for exits
- **$bank / $bankTerminal** - Banking system, accounts, transactions
- **$locker / $oneTimeLocker** - Storage containers with locks

## $lock - Base Lock Prototype

### Purpose

Defines the interface for all locks. Uses abilities-first architecture where the AI narrator interprets unlock/pick/bypass attempts.

### Properties

- `verifiedUsers`: Array of player objects authorized to pass this lock
- `difficulty`: Resistance to picking/bypassing (1-10 scale)

### Key Methods

#### isAuthorized(player)
Check if player is in verifiedUsers array.

#### authorize(player)
Add player to verifiedUsers.

#### revoke(player)
Remove player from verifiedUsers.

#### canAccess(agent, target)
Checks if agent can access the target. Returns `true` or rejection string.

```javascript
const result = await lock.canAccess(player, exit);
if (result === true) {
  // Access granted
} else {
  await player.tell(result); // "Access denied."
}
```

## $biometricLock - Biometric Authentication

Inherits from: **$lock**

### Purpose

Requires agents to pass biometric scans (fingerprint, retinal, etc.) and be in the verifiedUsers list.

### Properties

- `verifiedUsers`: (inherited) Array of player objects authorized
- `scanType`: Type of biometric scan - 'fingerprint', 'retinal', 'palm', 'voice'
- `scanLocation`: Physical location of scanner (e.g., "beside the door")

### Abilities

The AI narrator interprets biometric scan attempts by reading the lock's abilities:
- Player must be in `verifiedUsers` array
- Player must have appropriate body part uncovered (gloves block fingerprints, eyewear may block retinal)
- Cannot be picked like mechanical locks
- Can be bypassed with severed authorized body parts (grim) or hacking

### Key Methods

#### canAccess(agent, target)
Checks if agent is authorized. Returns `true` or rejection string.

```javascript
const result = await biometricLock.canAccess(player, exit);
if (result === true) {
  // Access granted
} else {
  await player.tell(result); // "Access denied. Biometric signature not recognized."
}
```

#### authorize(player) / revoke(player)
Inherited from $lock - add/remove from verifiedUsers.

```javascript
await biometricLock.authorize(player);
await biometricLock.revoke(player);
```

## $guardedExit - Faction-Based Access Control

Inherits from: **$exit**

### Purpose

Restricts passage to members of a specific faction. Uses the $faction singleton to check membership.

### Properties

```javascript
{
  allowedFaction: 'Citizen',  // Faction that can pass (null = unrestricted)
  denyMessage: 'Citizens only.'  // Shown when access denied
}
```

### Key Methods

#### canUse(agent)
Checks faction membership, then delegates to parent exit checks (doors, locks).

```javascript
const result = await guardedExit.canUse(player);
if (result.allowed) {
  // Player can pass
} else {
  await player.tell(result.reason); // 'Citizens only.'
}
```

#### setAllowedFaction(factionName)
Set which faction can use this exit.

```javascript
await guardedExit.setAllowedFaction('Citizen');
await guardedExit.setAllowedFaction(null);  // Remove restriction
```

### Building Definition

```javascript
exits: {
  north: {
    to: 'waterfront/y10.ts',
    prototype: 'guardedExit',
    allowedFaction: 'Citizen',
    denyMessage: 'The scanner flashes red. "Citizens only."',
    description: 'Glass doors open onto the Waterfront',
  },
}
```

### See Also

- [Faction System](./faction.md) - Full faction documentation

## Composing Locks

Locks can be stacked for multi-factor security:

```javascript
const bioLock = await $recycler.create($biometricLock, {
  scanType: 'fingerprint',
  scanLocation: 'beside the control panel'
});
await bioLock.authorize(adminPlayer);

const standardLock = await $recycler.create($lock, {
  difficulty: 7
});
await standardLock.authorize(adminPlayer);

// Attach both to elevator
await elevator.addLock(bioLock);
await elevator.addLock(standardLock);
```

## $bank / $bankTerminal - Banking System

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

## $locker / $oneTimeLocker - Storage Containers

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
const bioLock = await $recycler.create($biometricLock, {
  scanType: 'fingerprint',
  scanLocation: 'beside the floor buttons'
});

// Authorize specific users
await bioLock.authorize(adminPlayer);
await bioLock.authorize(vipPlayer);

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

- [Faction System](./faction.md) - Faction memberships and relationships
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
- `verifiedUsers`: Array of player objects authorized to pass
- `difficulty`: Resistance to picking/bypassing (1-10 scale)

## Key Methods
- `isAuthorized(player)`: Check if player is in verifiedUsers
- `authorize(player)`: Add player to verifiedUsers
- `revoke(player)`: Remove player from verifiedUsers
- `canAccess(agent, target)`: Returns true or rejection string

## Subclasses
- `$biometricLock`: Scans body parts (fingerprint, retinal, etc.)
- `$rentableLock`: Bank-based rental access with time limits

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
Interactive code entry via $prompt.

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
const lockA = await $recycler.create($rentableLock, { ... });
const lockB = await $recycler.create($rentableLock, { ... });

lockA.linkedLockId = lockB.id;
lockB.linkedLockId = lockA.id;

// Now when lockA.rent() generates a code, it syncs to lockB
// Same code works on both sides
```

## Example: Rentable Storage Room

```javascript
const storageLock = await $recycler.create($rentableLock, {
  name: 'Storage Room Lock',
  price: 50,                      // 50 credits per rental
  duration: 24 * 60 * 60 * 1000,  // 24 hours
  bank: $bank.id,
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
- `verifiedUsers`: (inherited) Array of player objects authorized
- `scanType`: Type of biometric scan - 'fingerprint', 'retinal', 'palm', 'voice'
- `scanLocation`: Physical location of scanner

## Key Methods
- `canAccess(agent, target)`: Checks if agent is in verifiedUsers
- `isAuthorized(player)`: Check if player is authorized
- `authorize(player)`: Add player to verifiedUsers
- `revoke(player)`: Remove player from verifiedUsers

---

# Example Usage

```javascript
// Create elevator with biometric lock
const elevator = await $recycler.create($elevator, {
  floors: [1, 2, 35, 42],
  floorRooms: { 1: lobbyRoom, 35: vipLounge, 42: penthouse },
});

const bioLock = await $recycler.create($biometricLock, {
  scanType: 'retinal',
  scanLocation: 'beside the control panel'
});

// Authorize specific players
await bioLock.authorize(adminPlayer);
await bioLock.authorize(vipPlayer);

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

Exits now support a `door` property. If present, all access checks are delegated to the referenced `$door` object. This enables unified, bidirectional access control, lock state, and messaging for doors and exits.

**Example:**
```javascript
// Create a door object
const door = await $recycler.create($door, { ... });
// Attach to both exits
exitAtoB.door = door.id;
exitBtoA.door = door.id;
```

See [door.md](./door.md) for details.
