# Door Prototype

> **Abilities-First**: Doors use abilities to describe locking, picking, and forcing physics. The AI narrator interprets player actions like "pick the lock" or "force the door open" by reading abilities, then modifies properties directly. See `docs/ABILITIES-FIRST.md`.

A shared object for bidirectional access between rooms, used by both exits and elevators.

## Properties
- `name`: Door name (e.g., 'Suite 1 Door')
- `description`: Description
- `locked`: Boolean - whether the door is locked
- `open`: Boolean - whether the door is swung open
- `locks`: Array of composable lock objects (each with canAccess() method)
- `lockDifficulty`: Number - resistance to picking (1-10 scale)
- `durability`: Number - structural integrity (0-100, forcing reduces it)
- `material`: String - what the door is made of (wood, metal, glass, etc.)
- `autolockOnClose`: Boolean - if true, door automatically locks when closed

## Methods
- `canPass()`: Returns true if passage allowed (open=true, locked=false)
- `getBlockedReason()`: Returns human-readable reason why passage is blocked
- `canAccess(agent, target)`: Legacy compatibility - checks locked/open state

## Integration with Exits and Elevators
- Both `$exit` and `$elevator` now support a `door` property.
- If present, all access checks (`canUse` for exit, `canAccessFloor` for elevator) are delegated to the referenced `$door` object.
- This enables unified, bidirectional access control, lock state, and messaging for doors, exits, and elevators.

## Example Usage
```javascript
// Create a door object
const door = await $recycler.create($door, {
  name: 'Suite 1 Door',
  description: 'A heavy wooden door with brass hinges.',
  locked: true,
  open: false,
  lockDifficulty: 6,
  durability: 80,
  material: 'wood',
  autolockOnClose: true
});

// Attach the same door to both exits (A→B and B→A)
exitAtoB.door = door;
exitBtoA.door = door;

// Movement verbs check canPass()
if (await door.canPass()) {
  // Allow passage
} else {
  const reason = await door.getBlockedReason();
  await player.tell(reason); // "The door is locked."
}
```

### Adding Composable Locks
```javascript
// Add a biometric lock to the door
const bioLock = await $recycler.create($biometricLock, {
  scanType: 'fingerprint',
  scanLocation: 'beside the door handle'
});
await bioLock.authorize(player);
door.locks = [bioLock];

// Now the AI narrator checks bioLock.abilities when player tries to unlock
```

## Benefits
- One lock state, one durability, one material per door
- AI narrator handles unlock/pick/force by reading abilities
- Works for any bidirectional passage: rooms, suites, elevators

---

# See Also
- [Room System](./rooms.md) - Exits and navigation
- [Elevator Prototype](./elevator.md)
- [Security System](./security.md)
