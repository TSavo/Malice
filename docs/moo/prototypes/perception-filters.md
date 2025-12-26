# Perception Filters

> **Abilities-First**: Perception filters are infrastructure that modifies what agents see/hear. They work alongside abilities. See `docs/ABILITIES-FIRST.md`.

Perception filters are objects that modify how agents perceive the world. They can inject content into room descriptions, provide virtual addressable entities, and receive callbacks when the agent experiences sensory input.

## Overview

Perception filters enable:
- **Augmented Reality**: Overlay information onto room descriptions
- **Virtual Entities**: Create addressable NPCs/entities that only the agent can see
- **Sensory Hooks**: React to what the agent sees, hears, smells, tastes, or feels
- **Neural Interfaces**: Connect agents to AI systems (like Pluribus via The Mask)

## Adding/Removing Filters

```javascript
// Add a perception filter
await agent.addPerceptionFilter(source, filter);

// Remove a perception filter by source
await agent.removePerceptionFilter(source);

// Access current filters
const filters = agent.perceptionFilters; // Array of { source, filter } entries
```

**Parameters:**
- `source` - The object providing the filter (e.g., The Mask wearable)
- `filter` - The object containing filter methods (often same as source)

## Filter Interface

A perception filter can implement any of these methods:

### `modifyRoomDescription(output, room, viewer)`

Called when the agent looks at a room. Allows injecting or modifying content.

```javascript
obj.setMethod('modifyRoomDescription', `
  const output = args[0];   // Current room description string
  const room = args[1];     // The room being described
  const viewer = args[2];   // The agent viewing (your wearer)

  // Inject augmented reality overlay
  return output + '\\r\\nYou see a glowing waypoint marker to the north.';
`);
```

### `getAddressableEntities()`

Returns an array of names that can be addressed via the `to` verb.

```javascript
obj.setMethod('getAddressableEntities', `
  // Return entities this filter provides
  return ['ghost', 'demon', 'oracle'];
`);
```

When the agent types `to ghost Hello there`, the filter's `onAddressed` method will be called.

### `onAddressed(speaker, targetName, message)`

Called when the agent uses `to <entity> <message>` to address a virtual entity.

```javascript
obj.setMethod('onAddressed', `
  const speaker = args[0];    // The agent speaking
  const targetName = args[1]; // 'ghost', 'demon', etc.
  const message = args[2];    // What they said

  if (targetName === 'ghost') {
    await speaker.tell('The ghost whispers back: "I hear you..."');
    return 'The ghost acknowledges your words.';
  }

  return null; // Not handled by this filter
`);
```

### Sensory Hooks

These are called when the agent experiences sensory input:

#### `onSee(message, source)`
Called when the agent sees something (via `agent.see()`).

```javascript
obj.setMethod('onSee', `
  const message = args[0];  // What was seen
  const source = args[1];   // Optional source object

  // Log to external system, react to visual stimuli, etc.
  console.log('Agent saw:', message);
`);
```

#### `onHear(message, source)`
Called when the agent hears something (via `agent.hear()`).

```javascript
obj.setMethod('onHear', `
  const message = args[0];  // What was heard
  const source = args[1];   // Speaker or source

  // Record conversation, translate, react, etc.
`);
```

#### `onSmell(message, source)`
Called when the agent smells something (via `agent.smell()`).

```javascript
obj.setMethod('onSmell', `
  const message = args[0];  // Smell description
  const source = args[1];   // Source of smell
`);
```

#### `onTaste(message, source)`
Called when the agent tastes something (via `agent.taste()`).

```javascript
obj.setMethod('onTaste', `
  const message = args[0];  // Taste description
  const source = args[1];   // Food/drink source
`);
```

#### `onFeel(message, source)`
Called when the agent feels something (via `agent.feel()`).

```javascript
obj.setMethod('onFeel', `
  const message = args[0];  // Tactile description
  const source = args[1];   // Source of sensation
`);
```

## Example: Simple Ghost Filter

A filter that lets the agent see and speak to a ghost:

```javascript
const ghostFilter = await $.recycler.create({
  parent: $.describable,
  properties: {
    name: 'Ghost Perception',
  },
  methods: {
    modifyRoomDescription: `
      const output = args[0];
      const viewer = args[2];

      return output + '\\r\\nA translucent ghost hovers in the corner, watching you.';
    `,

    getAddressableEntities: `
      return ['ghost'];
    `,

    onAddressed: `
      const speaker = args[0];
      const targetName = args[1];
      const message = args[2];

      if (targetName === 'ghost') {
        await speaker.tell('The ghost tilts its head and replies: "Hello, living one."');
        return 'You speak to the ghost.';
      }
      return null;
    `,
  },
}, null);

// Add to an agent
await player.addPerceptionFilter(ghostFilter, ghostFilter);
```

## Example: The Mask (Neural Interface)

The Mask is a wearable that implements perception filters to connect the wearer with Pluribus, the city AI:

```javascript
// When worn, The Mask:
// 1. Adds itself as a perception filter
await wearer.addPerceptionFilter(self, self);

// 2. Registers a 'think' verb for silent communication
await wearer.registerVerb(['think %s'], self, 'onThink');

// 3. Modifies room descriptions to show Pluribus's presence
// 4. Provides 'pluribus' as an addressable entity
// 5. Forwards all sensory input to Pluribus's history

// See: src/database/bootstrap/mask-builder.ts
```

## Filter Lifecycle

### Adding Filters

Filters are typically added when:
- A wearable with filter capabilities is worn
- A drug/effect takes hold
- An implant is activated
- A skill is used

### Removing Filters

Filters are removed when:
- The wearable is removed
- The drug/effect wears off
- The implant is deactivated
- The filter source is destroyed

```javascript
// In a wearable's remove method:
if (wearer.removePerceptionFilter) {
  await wearer.removePerceptionFilter(self);
}
```

## Multiple Filters

Agents can have multiple perception filters active simultaneously:

```javascript
await agent.addPerceptionFilter(maskFilter, maskFilter);
await agent.addPerceptionFilter(drugFilter, drugFilter);
await agent.addPerceptionFilter(implantFilter, implantFilter);

// All filters' modifyRoomDescription methods are called in order
// All filters' sensory hooks are called for each sensory event
// All filters' addressable entities are combined
```

## Best Practices

1. **Check bond state**: Filters should verify they're still active before modifying perception
2. **Use ID comparison**: Compare objects by `.id` not direct reference (proxy instances vary)
3. **Handle null gracefully**: Viewer/source may be null in some contexts
4. **Clean up on removal**: Unregister verbs and clear state when filter is removed
5. **Don't block sensory methods**: Hooks should be fast; queue heavy processing

## Related Documentation

- [The Mask & Pluribus](./mask-pluribus.md) - Neural interface implementation
- [Agents](./agents.md) - Agent prototype and sensory methods
- [Body Parts](./body.md) - Sensory organ hierarchy
- [Wearables](./wearables.md) - Wearable prototype for filter-providing items
