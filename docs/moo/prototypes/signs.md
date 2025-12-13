# Signs

Immovable, readable objects for information display.

## Overview

Signs are bolted-down objects that display text. Used for:
- Building directories
- Room information
- Notices and warnings
- Dynamic information displays

## $.sign

### Properties

```javascript
{
  name: 'Sign',
  description: 'A sturdy, bolted-down sign.',

  // Content (supports both properties)
  text: 'The sign is blank.',
  content: null,          // Alias for text

  // Physical
  boltedDown: true,       // Cannot be picked up

  // Language
  language: 'English',

  // Update permissions
  authorizedUpdaters: [], // Object IDs or aliases
  publiclyWritable: false,
}
```

### Key Methods

#### read(agent)
Read the sign's text.

```javascript
const text = await sign.read(player);
// "Welcome to Smith Tower
//  Floor Directory:
//    1 - Job Center
//    2 - Banking
//    ..."
```

#### updateText(agent, newText)
Update the sign's content (authorization required).

```javascript
const result = await sign.updateText(player, 'New text here');
// { success: true, message: 'Sign updated.' }
// or
// { success: false, message: 'Access denied: You are not authorized...' }
```

**Authorization levels:**
1. `publiclyWritable: true` - Anyone can update
2. `agent.wizard` - Admins can always update
3. `authorizedUpdaters` - Specific IDs or aliases

### Verb Registration

Signs declare room-centric verbs:

```javascript
// getRoomVerbs() returns:
[
  { pattern: 'read %i', method: 'read' }
]

// Player can type:
> read sign
> read directory
```

## Creating Signs

### Static Information Sign

```javascript
const sign = await $.recycler.create($.sign, {
  name: 'Building Directory',
  description: 'A large wall-mounted directory.',
  text: `SMITH TOWER
Floor Directory:
  1 - Job Center
  2 - Banking Services
  3 - Corporate Security
  4-33 - Residential`,
});
```

### Dynamic Notice Board

```javascript
const notice = await $.recycler.create($.sign, {
  name: 'Notice Board',
  description: 'A cork board with pinned notices.',
  text: 'No current notices.',
  publiclyWritable: true,
});

// Anyone can update
await notice.updateText(player, 'Meeting at noon in the lobby.');
```

### Authorized-Only Sign

```javascript
const statusBoard = await $.recycler.create($.sign, {
  name: 'Status Board',
  description: 'An electronic status display.',
  text: 'SYSTEM STATUS: OPERATIONAL',
  authorizedUpdaters: [
    systemAdmin.id,
    'continuum-security',  // alias
  ],
});
```

## Use in Buildings

Signs are commonly spawned in rooms via building definitions:

```javascript
// In z1.ts floor definition
'%LOBBY': {
  name: 'Floor 1 Lobby',
  objects: [
    {
      prototype: 'sign',
      name: 'Floor Directory',
      text: 'Floor 1: Job Center...',
    },
  ],
},
```

## See Also

- [Rooms](./rooms.md) - Room objects
- [Security](./security.md) - Access control
