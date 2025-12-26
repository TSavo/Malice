# MCP Tools & Resources Reference

The tools and resources available to you for managing the city.

## Abilities-First Architecture

**IMPORTANT**: See `docs/ABILITIES-FIRST.md` for the full architecture guide.

When building objects, use **abilities** (prose physics) instead of procedural methods:

```javascript
// ✅ RIGHT: Abilities describe physics
const camera = await $recycler.create($describable, {
  name: 'Security Camera',
  recording: true,
  eventLog: [],
  abilities: `Surveillance device that records visual activity.

RECORDING: When 'recording' is true, logs events to 'eventLog' via onRoomEvent().

TAMPERING: Can be disabled by covering lens, cutting power, or hacking.

PLAYBACK: Security personnel can review 'eventLog'.`
});
camera.setPropertyDescription('recording', "Whether actively recording.");
camera.setPropertyDescription('eventLog', "Array of recorded events.");

// ❌ WRONG: Procedural methods for game logic
camera.setMethod('capture', `...`);  // Don't do this
camera.setMethod('playback', `...`); // Let AI interpret abilities instead
```

**Three types of specification:**
- **Property descriptions** = what data MEANS (constraints)
- **Abilities** = how things INTERACT (physics)
- **JSDoc on methods** = what infrastructure does (constraints)

**The AI narrator** reads abilities and interprets player intent. You build the specification, the AI runs the physics.

---

## Overview

You interact with the Malice MOO by writing native MOO code using `execute_moo_code`:

```typescript
// ✅ Direct MOO code
execute_moo_code({
  code: `
    // Create a plot
    const plot = await $recycler.create($plot, {
      name: 'Water Main Repair',
      status: 'active'
    });
    await plot.setMetadata('type', 'infrastructure');
    await plot.setMetadata('priority', 'high');
    await $plotDB.register(plot);

    // Spawn an NPC
    const npc = await $ai.spawn({
      role: 'supervisor',
      name: 'Site Foreman',
      location: await $load(repairSiteId),
      personality: 'Gruff but professional.'
    });

    // Log event
    await plot.addEvent({
      from: 'system',
      message: 'Job posted. Awaiting workers.'
    });

    return {plotId: plot.id, npcId: npc.id};
  `
})
```

**Benefits**: No wrapper layer, composable code with loops/conditionals, full MOO context ($, $load(), $aliases).

The tools below are legacy wrappers - prefer direct MOO code when possible.

## MCP Resources (Read-Only)

Resources provide read-only access via URI patterns. Use these for inspection.

### Object Resources

| Resource | Description |
|----------|-------------|
| `moo://objects/{id}` | Get object details (properties, methods, parent) |
| `moo://objects/{id}/prop/{name}` | Get a specific property value |
| `moo://objects/{id}/method/{name}` | Get method code (walks inheritance) |
| `moo://objects/list/{page}` | Paginated object list (100/page) |

**Examples:**
```
moo://objects/100             # Object #100
moo://objects/100/prop/name   # Get name property
moo://objects/100/method/say  # Get say method (shows inheritance)
moo://objects/list/1          # First 100 objects
```

### Room Resources

| Resource | Description |
|----------|-------------|
| `moo://rooms/{id}` | Room state (exits, players, contents) |

### AI NPC Resources

| Resource | Description |
|----------|-------------|
| `moo://ai` | List all AI NPCs |
| `moo://ai/{id}` | NPC profile (personality, history, memories) |
| `moo://ai/{id}/memories` | NPC memories only |
| `moo://ai/{id}/notes` | NPC notes only |
| `moo://npc-sessions/{id}` | NPC conversation history |

### Plot Resources

| Resource | Description |
|----------|-------------|
| `moo://plots` | List all plots |
| `moo://plots/{id}` | Plot details |
| `moo://plots/{id}/events` | Plot event log |

### Documentation Resources

| Resource | Description |
|----------|-------------|
| `moo://docs` | List technical docs |
| `moo://docs/{name}` | Get doc: mcp-tools, plot-jobs, builders-guide, moo-programming, npc-agent, timeline |
| `moo://city-ai` | List city AI docs |
| `moo://city-ai/{name}` | Get doc: context, factions, jobs, locations, map, npcs, objectives, plots, rules, tools |

### Other Resources

| Resource | Description |
|----------|-------------|
| `moo://players` | List players |
| `moo://players/{id}` | Player details |
| `moo://aliases` | Object aliases |
| `moo://events/recent` | Recent game events |

---

## Direct MOO Code Reference

The following shows how to use native MOO objects and methods. All code runs via `execute_moo_code` with full access to the MOO environment.

### Object Queries

**Search by name:**
```javascript
const objects = await $.db.listAll(false);
const factories = objects.filter(doc =>
  (doc.properties.name?.value ?? doc.properties.name)?.includes('Factory')
);
```

**Find by property:**
```javascript
const citizens = objects.filter(doc => {
  const faction = doc.properties.faction?.value ?? doc.properties.faction;
  return faction === 'Citizen';
});
```

**Find children (inheritance):**
```javascript
const players = objects.filter(doc => {
  const parent = doc.parent?.value ?? doc.parent;
  return parent === $player.id;
});
```

### Properties and Methods

**Set properties:**
```javascript
const obj = await $load(100);
obj.credits = 500;
obj.faction = 'Citizen';
```

**Create/update methods:**
```javascript
const obj = await $load(100);
obj.setMethod('greet', `
  const visitor = args[0];
  return 'Welcome, ' + visitor.name + '.';
`);
```

**Call methods:**
```javascript
const obj = await $load(100);
const result = await obj.greet(player);
```

### Object Creation

**Using $recycler:**
```javascript
// Create a room
const room = await $recycler.create($room, {
  name: 'Storage Room',
  description: 'A dusty storage area.',
  x: 0, y: 1, z: 0
});

// Create an item
const item = await $recycler.create($item, {
  name: 'Sustain Pill',
  description: 'A nutrition supplement.'
});

// Move item to room
await item.moveTo(room, player);
```

**Clone objects:**
```javascript
const original = await $load(100);
const clone = await $recycler.clone(original);
await clone.moveTo(room, player);
```

**Recycle objects:**
```javascript
await $recycler.recycle(100);
// Or with object reference
await $recycler.recycle(obj);
```

### Rooms and Exits

**List rooms:**
```javascript
const allObjects = await $.db.listAll(false);
const rooms = allObjects.filter(doc => {
  const parent = doc.parent?.value ?? doc.parent;
  return parent === $room.id;
});
```

**Get exits:**
```javascript
const room = await $load(100);
const exits = room.exits || {};
// { north: 150, south: 75, ... }
```

**Create room with exits:**
```javascript
const fromRoom = await $load(100);
const toRoom = await $recycler.create($room, {
  name: 'Hallway',
  description: 'A long hallway.',
  x: 0, y: 1, z: 0
});

// Link them
fromRoom.exits = fromRoom.exits || {};
fromRoom.exits.north = toRoom.id;
toRoom.exits = toRoom.exits || {};
toRoom.exits.south = fromRoom.id;
```

**Move objects:**
```javascript
const obj = await $load(100);
const destination = await $load(200);
await obj.moveTo(destination, player);
```

### Aliases

**Look up alias:**
```javascript
const factionManager = $faction;  // Direct access
// Or via $ object
const aliases = $.getAliases();
const id = aliases.get('faction');
```

**Register alias:**
```javascript
const camera = await $recycler.create($item, {...});
await $.addAlias('securityCamera', camera.id);
// Now accessible as $securityCamera
```

**List all aliases:**
```javascript
const aliases = $.getAliases();
// Map of alias -> id
```

### Players

**List all players:**
```javascript
const allObjects = await $.db.listAll(false);
const players = allObjects.filter(doc => {
  const parent = doc.parent?.value ?? doc.parent;
  return parent === $player.id;
});
```

**Get player details:**
```javascript
const player = await $load(playerId);
const location = player.location;  // RuntimeObject
const credits = player.credits;
const faction = player.faction;
```

## AI/NPC System ($ai)

Manage AI-controlled NPCs using the `$ai` registry.

### spawn

Create an AI-controlled human:

```javascript
const npc = await $ai.spawn({
  role: 'guard',
  name: 'Marcus',
  location: await $load(factoryId),
  sex: 'male',
  age: 35,
  personality: 'Suspicious and vigilant.',
  history: 'Former military.'
});
// Returns: RuntimeObject (Human)
```

### despawn

Remove an AI human:

```javascript
await $ai.despawn(npcId);  // Recycles object
await $ai.despawn(npcId, false);  // Keep object, remove from registry
```

### list

List AI-controlled humans:

```javascript
// All NPCs
const all = await $ai.getAll();
// Array of RuntimeObjects

// By role
const guards = await $ai.getByRole('guard');

// Get all roles
const roles = await $ai.getRoles();
// ['guard', 'shopkeeper', 'clerk', ...]
```

### info

Get information about an AI human:

```javascript
const info = await $ai.getInfo(npcId);
// {
//   human: RuntimeObject,
//   role: 'guard',
//   spawnedAt: '2024-01-15T10:30:00Z',
//   spawnedBy: wizardId,
//   ...
// }
```

### do

Execute a command as an AI human:

```javascript
await $ai.do(npcId, 'say Halt! Identify yourself.');
await $ai.do(npcId, 'north');
await $ai.do(npcId, 'look');
```

### look

Get what an AI sees in their location:

```javascript
const view = await $ai.look(npcId);
// Returns room description from NPC's perspective
```

### profile

Get the full profile (also available as resource `moo://ai/{id}`):

```javascript
const profile = await $ai.getProfile(npcId);
// {
//   success: true,
//   humanId: 500,
//   role: 'guard',
//   name: 'Marcus',
//   personality: {...},
//   history: {...},
//   memories: [...],
//   notes: [...]
// }
```

### setPersonality / setHistory

Set personality or history:

```javascript
await $ai.setPersonality(npcId, 'Gruff but fair.');

await $ai.setHistory(npcId, {
  backstory: 'Former soldier.',
  events: ['Survived the Corporate Wars'],
  secrets: ['Has PTSD']
});
```

### remember / recall / forget

Manage memories:

```javascript
// Add memory
await $ai.remember(npcId, 'Player Jack is wanted', 'critical', ['player', 'crime']);

// Retrieve memories
const memories = await $ai.recall(npcId);
const critical = await $ai.recall(npcId, { importance: 'critical' });

// Remove memory
await $ai.forget(npcId, 0);  // By index
```

See [AI/NPC Reference](../moo/reference/ai-npc.md) for full documentation.

### Dressing NPCs ($tailor)

Use `$tailor.dress()` to dress NPCs. The tailor creates contextually appropriate clothing based on role, personality, and environment.

**In MOO code:**
```typescript
const npc = await $load(500);
await $tailor.dress(npc, 'shabby, recently fired')
```

**Using execute_moo_code:**
```typescript
execute_moo_code({
  code: `
    const npc = await $load(500);
    await $tailor.dress(npc, 'shabby, recently fired');
    return { success: true };
  `
})
```

The tailor automatically:
- Loads the NPC's role and personality
- Examines their environment
- Creates clothing appropriate to their social tier
- Equips items in proper layer order (underwear → base → mid → outer)

**Social tier clothing:**
- Scavengers: Minimal - just pants, maybe shirt, poor condition
- Workers/Guards: Basic - underwear, pants, shirt, boots
- Corporate: Complete - full outfit with socks, belt, proper shoes
- Executives: Formal - 3-piece suit, silk underwear, polished shoes

### spawn with clothed

Auto-dress NPCs on spawn:

**In MOO code:**
```typescript
await $ai.spawn({
  role: 'guard',
  location: await $load(100),
  clothed: true
})

await $ai.spawn({
  role: 'executive',
  location: await $load(200),
  clothed: true,
  context: 'CEO of major corp'
})
```

See [TAILORING.md](../TAILORING.md) for full clothing system reference.

## Plot/Job System ($plot)

Manage narrative arcs and missions using the plot system.

### create

Create a narrative container directly via $recycler:

```javascript
const plot = await $recycler.create($plot, {
  name: 'Water Main Repair',
  status: 'active'
});
await plot.setMetadata('type', 'infrastructure');
await plot.setMetadata('priority', 'high');
await $plotDB.register(plot);  // Register for tracking
// Returns: RuntimeObject (Plot instance)
```

### list

List plots via $plotDB:

```javascript
// All plots needing attention
const needing = await $plotDB.needsAttention();

// All plots
const all = await $plotDB.all();
```

### get_events

Get the event log (also available as resource `moo://plots/{id}/events`):

```javascript
const plot = await $load(plotId);
const events = await plot.getEventLog();
const text = await plot.getEventLogAsText();
// Formatted text for prompts
```

### add_event

Add an event to a plot's log:

```javascript
const plot = await $load(plotId);
await plot.addEvent({
  from: 'handler',  // 'player', 'handler', 'system'
  message: 'Worker arrived.',
  playerId: player.id,
  metadata: { timestamp: Date.now() }
});
```

### close

Close a plot with a final status:

```javascript
const plot = await $load(plotId);
await plot.complete('Repair successful.');  // or .abandon() or .fail()
// status: 'completed', 'abandoned', 'failed'
```

### Simplified Plot Model

In abilities-first architecture, plots are simplified event logs:

- **Events**: Log what happens via `plot.addEvent({ from, message })`
- **Metadata**: Store arbitrary data via `plot.setMetadata(key, value)`
- **Status**: Track state via `plot.status` property
- **Attention**: Set `metadata.needsAttentionAt` for city AI polling

NPCs create plots directly, handle job requests conversationally, and update status as narrative progresses. No complex job/hook system needed.

See [Plot System Reference](../moo/reference/plots.md) for full documentation.

## Notes System ($notes)

Attach metadata and tracking information to any object.

### add / get / delete

Add notes to objects:

```javascript
// Simple note
await $notes.add(object, 'Needs review', player, ['review']);

// Get all notes
const notes = await $notes.get(object);
// [{ text: '...', author: 'player', timestamp: '...', tags: [...] }]

// Get one note
const note = await $notes.getOne(object, 0);

// Delete note
await $notes.delete(object, 0);  // By index

// Clear all notes
await $notes.clear(object);
```

### search / list_objects

Search and find notes:

```javascript
// Search by text
const results = await $notes.search('weapon');

// Search by tag
const todos = await $notes.search('', { tag: 'todo' });

// Search by author
const builderNotes = await $notes.search('', { author: 'builder' });

// List all objects with notes
const objects = await $notes.listObjects();
// [{ objectId: 100, count: 3 }, ...]
```

### Formatting

Format notes for display:

```javascript
const formatted = await $notes.format(object);
// [0] 1/15/2024 10:30:00 AM by builder [todo]
//     This needs review
```

See [Notes System Reference](../moo/reference/notes.md) for full documentation.

## Combat Tool (Consolidated `combat` tool)

All combat resolution operations use the `combat` tool with an `action` parameter.

See [COMBAT.md](./COMBAT.md) for full combat resolution guide.

### status

Get current combat state.

```javascript
combat({ action: 'status', combatId: 'combat-abc123' })
```

### context

Get full context for AI resolution (combatants, actions, stats, wounds, weapons).

```javascript
combat({ action: 'context', combatId: 'combat-abc123' })
```

### check

Perform a skill check. Skills are emergent - any skill name is valid.

```javascript
combat({ 
  action: 'check', 
  combatId: 'combat-abc123',
  combatantId: 100,
  skillName: 'knife-fighting',
  opposingLevel: 50  // optional, default 50
})
```

### damage

Apply damage to a combatant's body part.

```javascript
combat({
  action: 'damage',
  combatId: 'combat-abc123',
  targetId: 200,
  bodyPart: 'torso',
  damageType: 'cut',  // cut, bruise, puncture, laceration, abrasion, burn
  severity: 45,       // 0-100
  cause: 'blade'      // optional: blade, fist, blunt, boot, claw
})
```

### emote

Narrate combat action to the room.

```javascript
combat({
  action: 'emote',
  combatId: 'combat-abc123',
  text: "Jack's blade arcs toward Marcus. Marcus throws up an arm, the knife slicing across his forearm."
})
```

### effect

Apply a status effect.

```javascript
combat({
  action: 'effect',
  combatId: 'combat-abc123',
  targetId: 200,
  effect: 'stunned',  // stunned, knockedDown, disarmed, winded
  intensity: 60,
  duration: 30000     // optional, ms
})
```

### end

End the combat.

```javascript
combat({
  action: 'end',
  combatId: 'combat-abc123',
  reason: 'death',    // death, flee, surrender, knockout, intervention
  winnerId: 100       // optional
})
```

### next_round

Advance to the next round.

```javascript
combat({ action: 'next_round', combatId: 'combat-abc123' })
```

### list

List all active combats.

```javascript
combat({ action: 'list' })
```

## World Query Tool (Consolidated `world` tool)

SQL-like querying of MOO objects.

### query

```javascript
world({ action: 'query', q: ".name contains 'sword'" })
world({ action: 'query', q: ".parent == 10 and .location exists", limit: 20 })
```

### Query Syntax

```
.property == value           # Equality
.property contains 'text'    # Substring match
.property like 'foo*'        # Glob pattern
.property exists             # Property is defined
X and Y / X or Y             # Logical operators
```

## Understanding Objects: describeForAI()

**MOST IMPORTANT**: When you need to understand what an object is and how it works, use `describeForAI()`:

```javascript
const obj = await $load(objectId);
const description = await obj.describeForAI();
// Returns comprehensive AI-readable description including:
// - Object type and inheritance chain
// - All properties with descriptions
// - All methods (local and inherited)
// - Abilities (prose physics)
// - Current state
```

This is the **primary interface** for AI understanding. When in doubt about what an object is or how it behaves, call `describeForAI()`.

**Example:**
```javascript
const camera = await $load(500);
const desc = await camera.describeForAI();
// "Security Camera (#500)
//  Parent: Describable (#10)
//
//  PROPERTIES:
//  - recording (boolean): Whether actively recording. Currently: true
//  - eventLog (array): Array of recorded events. Currently: [...]
//
//  ABILITIES:
//  Surveillance device that records visual activity.
//  RECORDING: When 'recording' is true, logs events to 'eventLog' via onRoomEvent().
//  TAMPERING: Can be disabled by covering lens, cutting power, or hacking.
//  PLAYBACK: Security personnel can review 'eventLog'."
```

## Communication and Perception

### Broadcast Actions: $emote.broadcast()

Use `$emote.broadcast()` to narrate actions with proper sensory routing:

```javascript
await $emote.broadcast({
  actor: actor,           // RuntimeObject performing the action
  location: room,         // RuntimeObject (Room) where action occurs
  visual: "...",          // What people see (optional)
  auditory: "...",        // What people hear (optional)
  tactile: "...",         // What people feel (optional)
  olfactory: "...",       // What people smell (optional)
  gustatory: "...",       // What people taste (optional)
  actorVisual: "...",     // What actor sees (first-person, optional)
  actorAuditory: "...",   // What actor hears (optional)
});
```

**How it works:**
- Routes sensory output to agents based on their capabilities
- Checks `canSee()`, `canHear()`, `canSmell()`, `canTaste()`, `canFeel()` on each agent
- Only delivers sensory channels the agent can perceive
- Handles first-person vs third-person perspective
- Applies perception filters (neural interfaces, augmented reality, etc.)

**Example:**
```javascript
await $emote.broadcast({
  actor: player,
  location: room,
  visual: "Jack draws his pistol, the barrel gleaming under the neon.",
  auditory: "A metallic click as the safety disengages.",
  actorVisual: "You draw your pistol. The weight is familiar in your hand."
});
```

### Structured Messages: $pronoun

Use `$pronoun` for consistent, grammatically correct messages:

**$pronoun.sub()** - Substitute pronouns in a template:

```javascript
const msg = $pronoun.sub(
  agent,
  "{Sub} {verb:draw} {poss} weapon.",
  { tense: 'present' }
);
// For male agent: "He draws his weapon."
// For female agent: "She draws her weapon."
// For first-person: "You draw your weapon."
```

**Substitution tokens:**
- `{Sub}` - Subject pronoun (he/she/you)
- `{Obj}` - Object pronoun (him/her/you)
- `{poss}` - Possessive (his/her/your)
- `{reflex}` - Reflexive (himself/herself/yourself)
- `{verb:action}` - Conjugated verb (draws/draw)

**$pronoun.announce()** - Announce to room with perspective handling:

```javascript
await $pronoun.announce({
  actor: player,
  location: room,
  firstPerson: "You slash at the guard.",
  thirdPerson: "{Sub} {verb:slash} at the guard.",
  tense: 'present'
});
```

Automatically:
- Shows first-person message to actor
- Shows third-person message to others
- Handles pronoun substitution
- Routes through sensory system

### Direct Sensory Methods

Send messages directly to specific sensory channels:

```javascript
// Visual
await player.see("The room flickers with holographic static.");

// Auditory
await player.hear("A distant siren wails.");

// Tactile
await player.feel("The floor vibrates beneath your feet.");

// Olfactory
await player.smell("The acrid scent of burnt electronics.");

// Gustatory
await player.taste("Metallic blood fills your mouth.");

// Internal (thoughts, no sensory check)
await player.think("Something isn't right here.");
```

**When to use:**
- `$emote.broadcast()` - Multi-sensory actions visible to room
- `$pronoun.announce()` - Single message with perspective handling
- Direct sensory - Private or specific sensory experiences

## Growing the Specification

The abilities-first architecture means **adding methods to prototypes** as physics emerges:

### Adding Infrastructure Methods

When you discover new physics that needs support:

1. **Identify the prototype** - Where does this physics apply?
2. **Add the method** - Infrastructure to support the physics
3. **Document with JSDoc** - Constraints, not behavior
4. **Update abilities** - Prose physics that uses the method

**Example: Adding concealment physics**

```javascript
// 1. Add method to $describable prototype
const describable = $describable;
describable.setMethod('isConcealed', `
  /**
   * Check if this object is concealed from casual observation.
   * CONSTRAINT: Returns boolean based on 'concealed' property.
   * DOES NOT describe how concealment works - see abilities.
   */
  return self.concealed === true;
`);

// 2. Add search infrastructure
describable.setMethod('onSearch', `
  /**
   * Called when agent performs thorough search.
   * CONSTRAINT: Reveals concealed objects in location.
   * Game logic in abilities, not here.
   */
  const searcher = args[0];
  if (self.concealed) {
    self.concealed = false;
    await searcher.see('You find ' + self.name + '!');
  }
`);

// 3. Update prototype abilities
describable.abilities = `
CONCEALMENT: Objects with 'concealed' property are hidden from
casual observation. Thorough searching reveals them.

SEARCHING: Players can search areas to find concealed items.
Success depends on searcher's perception vs object's concealment quality.
`;

// 4. Now objects can use it
const bug = await $recycler.create($describable, {
  name: 'listening device',
  concealed: true,
  abilities: `
Tiny surveillance bug. Concealed behind ventilation grate.
DETECTION: Requires thorough search or scanning equipment.
AUDIO: Records conversations when active.
  `
});
```

### Double Dispatch Pattern

For interactions between object types, use **double dispatch**:

```javascript
// Item tries to be picked up
$item.setMethod('pickUpBy', `
  /**
   * Called when agent tries to pick up this item.
   * Double-dispatches to agent's hand to check physics.
   */
  const agent = args[0];
  const hand = agent.body?.parts?.find(p => p.name === 'hand');

  if (!hand) {
    await agent.see("You have no hands to pick things up with.");
    return false;
  }

  // Double dispatch - ask hand if it can hold this
  const canHold = await hand.canHold(self);
  if (!canHold) {
    await agent.see("Your hands are full.");
    return false;
  }

  // Move item to agent's inventory
  await self.moveTo(agent, agent);
  await agent.see("You pick up " + self.name + ".");
  return true;
`);

// Hand checks if it can hold item
$hand.setMethod('canHold', `
  /**
   * Check if this hand can hold the given item.
   * Considers weight, size, and current contents.
   */
  const item = args[0];
  const maxWeight = 50;  // Arbitrary units
  const currentWeight = self.contents.reduce((sum, obj) =>
    sum + (obj.weight || 0), 0);

  return (currentWeight + (item.weight || 0)) <= maxWeight;
`);
```

**Why double dispatch:**
- Each object type knows its own constraints
- Physics distributed across relevant prototypes
- No centralized "can player pick up item?" logic
- Objects negotiate interactions directly

## Common Patterns

### Find and modify a player

```javascript
// Find player by name
const results = await mcp.search_objects({ pattern: 'PlayerName' });
const player = results[0];

// Get their faction (via resource)
const info = await readResource(`moo://objects/${player.id}/prop/faction`);

// Set their credits
await mcp.set_property({ objectId: player.id, name: 'credits', value: 100 });
```

### Create a repair job

```javascript
// Create plot directly
const plot = await $recycler.create($plot, {
  name: 'Repair: Water Main',
  status: 'active'
});
await plot.setMetadata('type', 'repair');
await plot.setMetadata('reward', 50);
await $plotDB.register(plot);

// Spawn supervisor NPC
const supervisor = await $ai.spawn({
  role: 'supervisor',
  name: 'Site Foreman',
  location: await $load(repairSiteId)
});

// Log event
await plot.addEvent({
  from: 'system',
  message: 'Job posted. Awaiting workers.'
});
```

### Check room contents (using resource)

```javascript
const roomInfo = await readResource('moo://rooms/100');
// roomInfo.players - players in room
// roomInfo.contents - objects in room
// roomInfo.exits - available exits
```
