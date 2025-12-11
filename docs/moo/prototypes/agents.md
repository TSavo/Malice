# Agent System

Players, NPCs, and embodied entities in Malice.

## Overview

The agent system models all entities that can act, perceive, and interact:
- **$.agent** - Base for acting entities
- **$.embodied** - Has a body (body parts, health)
- **$.human** - Human-type body structure
- **$.player** - Player character
- **$.admin** - Admin player with extra commands

## $.agent - Base Prototype

### Purpose

Represents any entity capable of action (players, NPCs, robots).

### Properties

```javascript
{
  name: 'Agent',
  verbs: ['look', 'move', 'get', ...], // Registered verbs
  location: roomId,                    // Current location
  health: 100,                         // Health (if embodied)
  body: bodyId,                        // Reference to body object
}
```

### Key Methods

#### registerVerb(patterns, source, handler)
Register a verb for this agent.

```javascript
await agent.registerVerb(['look', 'examine %t'], agent, 'doLook');
```

#### unregisterVerbsFrom(source)
Remove verbs registered from a source object.

```javascript
await agent.unregisterVerbsFrom(item);
```

#### moveTo(destination)
Move agent to a new location.

```javascript
await agent.moveTo(room);
```

## $.embodied - Entities with Bodies

### Purpose

Adds body parts, health, and metabolism to agents.

### Properties

```javascript
{
  bodyParts: {
    leftHand: handId,
    rightHand: handId,
    head: headId,
    stomach: stomachId,
    // ...
  },
  health: 100,
  maxHealth: 100,
  metabolism: {
    calories: 2000,
    hydration: 1000,
    // ...
  }
}
```

### Key Methods

#### takeDamage(amount, part)
Apply damage to a body part.

```javascript
await player.takeDamage(10, 'leftHand');
```

#### heal(amount, part)
Heal a body part.

```javascript
await player.heal(5, 'head');
```

## $.human - Human-Type Body

### Purpose

Defines standard human anatomy and stats.

### Properties

```javascript
{
  bodyParts: {
    leftHand: handId,
    rightHand: handId,
    head: headId,
    stomach: stomachId,
    // ...
  },
  health: 100,
  maxHealth: 100,
  metabolism: {
    calories: 2000,
    hydration: 1000,
    // ...
  },
  gender: 'female',
  age: 30,
}
```

## $.player - Player Character

### Purpose

Represents a human-controlled character. Inherits from $.human.

### Properties

```javascript
{
  name: 'Alice',
  verbs: [...],
  location: roomId,
  health: 100,
  body: bodyId,
  inventory: [itemId1, itemId2, ...],
  credits: 500,
  isAdmin: false,
}
```

### Key Methods

#### tell(message)
Send a message to the player.

```javascript
await player.tell('Welcome to Malice!');
```

#### see(message)
Send a visual message (respects blindness).

```javascript
await player.see('You see a bright light.');
```

#### hear(message)
Send an audio message (respects deafness).

```javascript
await player.hear('You hear footsteps.');
```

## $.admin - Admin Player

### Purpose

Player with elevated privileges and admin commands.

### Properties

```javascript
{
  isAdmin: true,
  adminVerbs: ['@dig', '@create', '@set', '@eval'],
}
```

### Key Methods

#### doAdminCommand(command)
Execute an admin command.

```javascript
await admin.doAdminCommand('@dig Lobby');
```

## Real-World Example: Player Creation

```javascript
const body = await $.recycler.create($.human, {
  gender: 'female',
  age: 30
});

const player = await $.recycler.create($.player, {
  name: 'Alice',
  body: body.id,
  location: startRoom.id,
  credits: 500
});
```

## Tips & Best Practices

1. **Use agent for all actors** - Players, NPCs, robots
2. **Embodied for health and body parts** - Track damage and healing
3. **Human for standard anatomy** - Extend for non-humans
4. **Player for user-controlled** - Inventory, credits, verbs
5. **Admin for elevated privileges** - Separate admin verbs
6. **Register/unregister verbs on movement** - Keep commands accurate
7. **Use sensory methods for output** - see(), hear(), tell()
8. **Test damage and healing** - Simulate combat and recovery
9. **Inventory for items** - Track what player carries
10. **Credits for economy** - Use for transactions

## See Also

- [Body System](./body.md) - Anatomy, wounds, metabolism
- [Items](./items.md) - Wearables, consumables, stackables
- [Security](./security.md) - Admin commands, lock systems
- [Objects](../advanced/objects.md) - Creating and placing agents
