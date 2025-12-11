# Door Prototype

A shared object for bidirectional access between rooms, used by both exits and elevators.

## Properties
- `name`: Door name (e.g., 'Suite 1 Door')
- `description`: Description
- `locked`: Boolean (legacy/simple lock)
- `locks`: Array of composable lock objects
- `code`: Access code (optional)
- `open`: Boolean (is door open)
- `messages`: All user-facing messages (locked, unlocked, open, closed, denied, prompt, etc.)

## Methods
- `canAccess(agent, target, code?)`: Checks all locks, code, and open/closed state
- `openDoor(agent)`: Opens the door
- `closeDoor(agent)`: Closes the door
- `lockDoor(agent)`: Locks the door
- `unlockDoor(agent, code?)`: Unlocks the door (checks code/locks)
- `promptForCode(agent)`: Uses $.prompt and messages.prompt

## Integration with Exits and Elevators
- Both `$.exit` and `$.elevator` now support a `door` property.
- If present, all access checks (`canUse` for exit, `canAccessFloor` for elevator) are delegated to the referenced `$.door` object.
- This enables unified, bidirectional access control, lock state, and messaging for doors, exits, and elevators.

## Example Usage
```javascript
// Create a door object
const door = await $.recycler.create($.door, {
  name: 'Suite 1 Door',
  description: 'A heavy, secure door.',
  locked: true,
  code: '1234',
  messages: {
    locked: 'The door is locked.',
    unlocked: 'The door is unlocked.',
    open: 'The door swings open.',
    closed: 'The door closes.',
    denied: 'Access denied.',
    prompt: 'Enter the door code:'
  }
});

// Attach the same door to both exits (A→B and B→A)
exitAtoB.door = door.id;
exitBtoA.door = door.id;

// Or attach to an elevator
myElevator.door = door.id;
```

## Benefits
- One lock state, one code, one rental period per door.
- No need to sync separate lock objects.
- All user-facing messages are customizable per door.
- Works for any bidirectional passage: rooms, suites, elevators, etc.

---

# See Also
- [Exit Prototype](./exit.md)
- [Elevator Prototype](./elevator.md)
- [Security System](./security.md)
