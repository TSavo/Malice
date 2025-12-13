# AI Registry

Registry for AI-controlled humans.

## Overview

The `$.ai` object is a registry that tracks AI-controlled humans. These are **indistinguishable from player characters** - they are regular `$.human` instances, just tracked here by role.

Key principles:
- **Not NPCs** - They're "agent-controlled players" using the same prototype as human players
- **Registry only** - $.ai just tracks mappings, doesn't manage behavior
- **Role-based** - Humans are organized by role (guard, shopkeeper, etc.)

## Properties

```javascript
{
  name: 'AI',
  description: 'Registry for AI-controlled humans',

  // Role → Human ID[] mapping
  roles: {
    'guard': [123, 456],
    'shopkeeper': [789],
  },

  // Human ID → metadata mapping
  registry: {
    123: {
      role: 'guard',
      spawnedAt: '2024-01-15T12:00:00.000Z',
      spawnedBy: 100,
      originalLocation: 50,
    },
    // ...
  },
}
```

## Key Methods

### spawn(role, options)

Create a new AI-controlled human with body.

```javascript
const human = await $.ai.spawn('guard', {
  name: 'Marcus',
  description: 'A grizzled guard',
  sex: 'male',
  age: 35,
  height: 1.85,
  weight: 90,
  appearance: {
    eyeColor: 'brown',
    hairColor: 'black',
    hairStyle: 'short',
    skinTone: 'tan',
    buildType: 'muscular',
  },
  location: roomId,
  spawnedBy: wizardId,
});
// Returns the created $.human instance
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | 'Unnamed' | Human's name |
| `description` | string | auto | Human's description |
| `sex` | string | 'non-binary' | 'male', 'female', or 'non-binary' |
| `age` | number | 30 | Age in years |
| `height` | number | 1.7 | Height in meters |
| `weight` | number | 70 | Weight in kilograms |
| `appearance` | object | {} | Appearance properties |
| `location` | number | null | Room ID to place in |
| `spawnedBy` | number | null | ID of wizard who spawned |

**What spawn() does:**
1. Creates a full body via `$.bodyFactory.createHumanBody()`
2. Creates a `$.human` instance with all properties
3. Links body to human
4. Registers in AI registry with role and metadata
5. Returns the human object

### despawn(humanId, recycle?)

Remove an AI-controlled human.

```javascript
await $.ai.despawn(567);        // Remove and recycle
await $.ai.despawn(567, false); // Remove from registry only
```

When `recycle` is true (default):
- Recycles the body tree (all body parts)
- Recycles the human object
- Removes from registry

### register(humanId, role, metadata?)

Add an existing human to the AI registry.

```javascript
await $.ai.register(existingHumanId, 'merchant', {
  spawnedAt: new Date().toISOString(),
  faction: 'traders-guild',
});
```

### unregister(humanId)

Remove from registry without recycling.

```javascript
await $.ai.unregister(567);
// Human still exists but is no longer tracked
```

### setRole(humanId, newRole)

Change a human's role.

```javascript
await $.ai.setRole(567, 'captain');
// Moves from old role to new role in mappings
```

### Query Methods

```javascript
// Check if AI-controlled
await $.ai.isAiControlled(567);  // true or false

// Get all humans with a role
await $.ai.getByRole('guard');   // [123, 456]

// List all roles
await $.ai.getRoles();           // ['guard', 'shopkeeper']

// Get all AI-controlled human IDs
await $.ai.getAll();             // [123, 456, 789]

// Get metadata for a human
await $.ai.getInfo(567);
// { role: 'guard', spawnedAt: '...', spawnedBy: 100 }

// Count
await $.ai.count();              // 3
await $.ai.countByRole('guard'); // 2
```

### describe()

Get a formatted summary.

```javascript
const desc = await $.ai.describe();
// "AI Registry
//  ===========
//  Total AI-controlled humans: 3
//
//  By Role:
//    guard: 2 humans
//      - Marcus (#567)
//      - Elena (#568)
//    shopkeeper: 1 humans
//      - Wong (#570)"
```

## Wizard Commands

### @spawn

Create an AI-controlled human interactively.

```
> @spawn guard
Creating AI-controlled human with role: guard

Name: Marcus
Sex:
  1) Male
  2) Female
  3) Non-binary
Choose: 1

Age (18-100): 35

Appearance:
  1) Quick - random appearance
  2) Detailed - full customization
Choose: 1

Generated random appearance.

Creating human...

Created: Marcus (#567) as guard
Placed in: Smith Tower Lobby
```

With name on command line:

```
> @spawn shopkeeper Wong
```

### @despawn

Remove an AI-controlled human.

```
> @despawn Marcus
Despawned: Marcus (#567)

> @despawn 568
Despawned: Elena (#568)
```

### @ai

List AI-controlled humans.

```
> @ai
AI Registry
===========
Total AI-controlled humans: 3

By Role:
  guard: 2 humans
    - Marcus (#567) - Smith Tower Lobby
    - Elena (#568) - Smith Tower Floor 2
  shopkeeper: 1 humans
    - Wong (#570) - Market Square

> @ai guard
AI humans with role "guard":
  Marcus (#567) - Smith Tower Lobby
  Elena (#568) - Smith Tower Floor 2
```

## MCP Integration

AI-controlled humans can also be created via MCP tools:

```javascript
// Using MCP call_method on $.ai
await $.ai.spawn('guard', {
  name: 'Marcus',
  sex: 'male',
  age: 35,
  location: roomId,
});

// Or create manually and register
const human = await $.recycler.create($.human, { ... });
await $.ai.register(human.id, 'guard');
```

## Use Cases

### Populating a Location

```javascript
// Spawn multiple guards for a building
const lobby = await $.load(lobbyRoomId);

for (let i = 0; i < 3; i++) {
  await $.ai.spawn('guard', {
    name: 'Guard ' + (i + 1),
    sex: Math.random() > 0.5 ? 'male' : 'female',
    age: 25 + Math.floor(Math.random() * 20),
    location: lobby.id,
  });
}
```

### Role-Based Actions

```javascript
// Alert all guards in a building
const guardIds = await $.ai.getByRole('guard');

for (const id of guardIds) {
  const guard = await $.load(id);
  if (guard && guard.location === alarmRoomId) {
    await guard.speak('Intruder alert!');
  }
}
```

### Checking AI Status

```javascript
// In a plot or interaction
const isAi = await $.ai.isAiControlled(target.id);
if (isAi) {
  // AI-controlled - use scripted response
} else {
  // Player-controlled - different handling
}
```

## See Also

- [Human Prototype](./prototypes/agents.md) - The $.human prototype
- [Body System](./prototypes/body.md) - Body creation
- [Auth System](./auth.md) - Player character creation
