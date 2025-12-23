# MCP Tools & Resources Reference

The tools and resources available to you for managing the city.

## Overview

You interact with the Malice MOO by writing native MOO code using `execute_moo_code`:

```typescript
// ✅ Direct MOO code
execute_moo_code({
  code: `
    // Create a plot
    const plotId = await $plot.create('Water Main Repair', {
      type: 'infrastructure',
      priority: 'high'
    });

    // Spawn an NPC
    const npc = await $ai.spawn({
      role: 'supervisor',
      name: 'Site Foreman',
      location: await $load(repairSiteId),
      personality: 'Gruff but professional.'
    });

    // Log event
    await $plot.addEvent(plotId, 'Job posted. Awaiting workers.', 'system');

    return {plotId, npcId: npc.id};
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

Create a narrative container:

```javascript
const plotId = await $plot.create('Water Main Repair', {
  type: 'infrastructure',
  priority: 'high'
});
// Returns: plot ID (number)
```

### list

List plots with optional status filter:

```javascript
// All active plots
const active = await $plotDB.getByStatus('active');

// All plots
const all = await $plotDB.getAll();
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
await plot.close('completed', 'Repair successful.');
// status: 'completed', 'abandoned', 'failed'
```

### create_job / complete_job / fail_job

Manage jobs within plots:

```javascript
const plot = await $load(plotId);

// Create job
await plot.createJob('repair_pipe', {
  expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString(),
  reward: 50
});

// Complete job
await plot.completeJob('repair_pipe', 'Done.');

// Fail job
await plot.failJob('repair_pipe', 'Abandoned.');
```

### Hooks and Filters

Register event hooks to watch for game events:

```javascript
const plot = await $load(plotId);

// Watch for a specific code being used
await plot.registerJobHook(
  'deliver-package',      // jobId
  lockerId,               // targetId
  'oneTimeCodeUsed',      // eventName
  { code: 'XYZ789' }      // filter
);
```

See [Plot System Reference](../moo/reference/plots.md) and [Plot Jobs Guide](../plot-jobs.md) for full documentation.

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
// Create plot
const result = await plot({ action: 'create', name: 'Repair: Water Main', metadata: { type: 'repair' } });
const plotId = result.plotId;

// Create job
await plot({ action: 'create_job', plotId, jobId: 'fix_pipe', metadata: { reward: 50 } });

// Spawn supervisor NPC
await ai({ action: 'spawn', role: 'supervisor', name: 'Site Foreman', locationId: repairSiteId });

// Log event
await plot({ action: 'add_event', plotId, message: 'Job posted. Awaiting workers.' });
```

### Check room contents (using resource)

```javascript
const roomInfo = await readResource('moo://rooms/100');
// roomInfo.players - players in room
// roomInfo.contents - objects in room
// roomInfo.exits - available exits
```
