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

## Example Usage
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

## Door Integration

Both `$.exit` and `$.elevator` now support a `door` property. If present, all access checks are delegated to the referenced `$.door` object. This enables unified, bidirectional access control, lock state, and messaging for doors, exits, and elevators.

**Example:**
```javascript
// Create a door object
const door = await $.recycler.create($.door, { ... });
// Attach to both exits
exitAtoB.door = door.id;
exitBtoA.door = door.id;
// Or attach to an elevator
myElevator.door = door.id;
```

See [door.md](./door.md) for details.

## Notes
- Elevators can have multiple locks (biometric, keycard, etc.)
- All locks must approve access for movement
- Floor access is managed via `floorRooms` and `floors` arrays

---

# See Also
- [Security System](./security.md)
- [Room System](./rooms.md)
