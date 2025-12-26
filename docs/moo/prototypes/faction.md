# Faction System

> **Abilities-First**: Factions use abilities to describe membership, reputation, and access rights. See `docs/ABILITIES-FIRST.md`.

Group membership and inter-faction relationships in Malice.

## Overview

The **$faction** singleton manages faction memberships and relationships between factions. Use it to:
- Assign entities (players, NPCs) to factions
- Define relationships between factions (friendly, hostile, neutral)
- Query whether two entities are friendly or hostile
- Restrict access to areas based on faction membership

## $faction - Faction Manager

**Type:** Singleton (inherits from $root)

### Properties

```javascript
{
  factions: {
    'Citizen': {
      members: [playerId1, playerId2, ...],
      description: 'Registered citizens of the Continuum',
      leader: null,
      created: 1699999999999
    },
    'Scavenger': { ... }
  },

  relationships: {
    'Citizen:Scavenger': 'hostile',  // Sorted key for bidirectional lookup
    'Citizen:Corporate': 'friendly'
  },

  memberships: {
    [playerId1]: 'Citizen',  // Quick lookup: entity -> faction
    [npcId]: 'Scavenger'
  }
}
```

### Key Methods

#### createFaction(name, description)
Create a new faction.

```javascript
await $faction.createFaction('Citizen', 'Registered citizens of the Continuum');
// { success: true, faction: 'Citizen' }
```

#### setFaction(entity, factionName)
Assign an entity to a faction. Removes from previous faction if any.

```javascript
await $faction.setFaction(player, 'Citizen');
// { success: true, faction: 'Citizen' }

// Remove from all factions
await $faction.setFaction(player, null);
```

#### getFaction(entity)
Get an entity's current faction.

```javascript
const faction = await $faction.getFaction(player);
// 'Citizen' or null
```

#### setRelationship(factionA, factionB, relationship)
Set the relationship between two factions.

```javascript
await $faction.setRelationship('Citizen', 'Scavenger', 'hostile');
await $faction.setRelationship('Citizen', 'Corporate', 'friendly');
await $faction.setRelationship('Citizen', 'Neutral', 'neutral');
// { success: true, relationship: 'hostile' }
```

**Relationship types:**
- `'friendly'` - Allied factions
- `'hostile'` - Enemy factions
- `'neutral'` - Default, no special relationship

#### getRelationship(factionA, factionB)
Get the relationship between two factions.

```javascript
const rel = await $faction.getRelationship('Citizen', 'Scavenger');
// 'hostile', 'friendly', or 'neutral'
```

#### isFriendly(entityA, entityB)
Check if two entities are friendly (same faction or allied factions).

```javascript
const friendly = await $faction.isFriendly(player, npc);
// true if same faction or factions are 'friendly'
```

#### isHostile(entityA, entityB)
Check if two entities are hostile (enemy factions).

```javascript
const hostile = await $faction.isHostile(player, npc);
// true if factions are 'hostile'
```

#### getMembers(factionName)
Get all members of a faction.

```javascript
const members = await $faction.getMembers('Citizen');
// [playerId1, playerId2, npcId3, ...]
```

#### setLeader(factionName, entity)
Set the leader of a faction.

```javascript
await $faction.setLeader('Citizen', adminPlayer);
```

#### getLeader(factionName)
Get the leader of a faction.

```javascript
const leader = await $faction.getLeader('Citizen');
// entity ID or null
```

#### listFactions()
Get all faction names.

```javascript
const factions = await $faction.listFactions();
// ['Citizen', 'Scavenger', 'Corporate', ...]
```

#### getFactionInfo(factionName)
Get detailed info about a faction.

```javascript
const info = await $faction.getFactionInfo('Citizen');
// { members: [...], description: '...', leader: null, created: ... }
```

## $guardedExit - Faction-Restricted Passage

**Inherits from:** $exit

An exit that only allows passage for members of a specific faction.

### Properties

```javascript
{
  allowedFaction: 'Citizen',  // Faction that can use this exit (null = unrestricted)
  denyMessage: 'Citizens only.'  // Message shown when access denied
}
```

### Key Methods

#### canUse(agent)
Checks faction membership before checking doors/locks.

```javascript
const result = await guardedExit.canUse(player);
// { allowed: true } or { allowed: false, reason: 'Citizens only.' }
```

#### setAllowedFaction(factionName)
Set which faction can use this exit.

```javascript
await guardedExit.setAllowedFaction('Citizen');
// null to remove restriction
```

#### setDenyMessage(message)
Set the denial message.

```javascript
await guardedExit.setDenyMessage('Authorized personnel only.');
```

### Building Definition

In building files, use `prototype: 'guardedExit'`:

```javascript
exits: {
  north: {
    to: 'waterfront/y10.ts',
    prototype: 'guardedExit',
    allowedFaction: 'Citizen',
    denyMessage: 'The door scanner flashes red. "Citizens only."',
    description: 'Glass doors open onto the Waterfront',
  },
}
```

## Example: Faction-Based Access Control

```javascript
// Create factions
await $faction.createFaction('Citizen', 'Registered citizens');
await $faction.createFaction('Scavenger', 'Outcasts and survivors');
await $faction.setRelationship('Citizen', 'Scavenger', 'hostile');

// Assign players to factions
await $faction.setFaction(player1, 'Citizen');
await $faction.setFaction(player2, 'Scavenger');

// Check relationships
await $faction.isFriendly(player1, player2);  // false
await $faction.isHostile(player1, player2);   // true

// Create guarded exit
const guardedExit = await $recycler.create($guardedExit, {
  name: 'north',
  destRoom: nutrientDispensary.id,
  allowedFaction: 'Citizen',
  denyMessage: 'Citizens only.',
});

// Citizen can enter
await guardedExit.canUse(player1);  // { allowed: true }

// Scavenger cannot
await guardedExit.canUse(player2);  // { allowed: false, reason: 'Citizens only.' }
```

## Use Cases

### 1. Restricted Areas
Faction members only can enter certain buildings (e.g., Continuum facilities).

### 2. NPC Behavior
NPCs can check faction relationships to determine hostility:
```javascript
if (await $faction.isHostile(npc, player)) {
  await npc.attack(player);
}
```

### 3. Quest Eligibility
Certain quests only available to faction members:
```javascript
const faction = await $faction.getFaction(player);
if (faction !== 'Citizen') {
  return 'You must be a Citizen to accept this job.';
}
```

### 4. Pricing/Services
Different prices or services based on faction:
```javascript
const faction = await $faction.getFaction(player);
const price = faction === 'Citizen' ? 2 : 5;  // Citizens get discount
```

## See Also

- [Security System](./security.md) - Locks and access control
- [Room System](./rooms.md) - Exits and navigation
- [Agents](./agents.md) - Players and NPCs
