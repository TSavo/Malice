# Factions

The faction system and how citizenship works.

## Overview

The `$.faction` singleton tracks who belongs to which group and how groups relate to each other. You use it to:

- Register citizens
- Track faction relationships
- Control access to facilities
- Determine NPC behavior toward players

## Core Factions

### Citizen

**Description**: Registered members of the Continuum system.

**Benefits**:
- Access to Nutrient Dispensary
- Access to Fabrication Factory
- Access to secured facilities
- Eligibility for work assignments
- Banking account for credits

**Requirements**:
- Biometric registration at City Services
- Agreement to work assignments
- Compliance with Continuum rules

**How to Add**:
```javascript
await $.faction.setFaction(player, 'Citizen');
```

### Scavenger

**Description**: Unregistered survivors living outside the system.

**Status**:
- No access to citizen facilities
- No guaranteed food or shelter
- Not hostile by default, but not trusted

**Relationship to Citizen**: Neutral (can be recruited)

### Corporate

**Description**: Pre-Burning corporate entities and their loyalists.

**Status**: Mostly defunct. Some survivors cling to old hierarchies.

**Relationship to Citizen**: Friendly (absorbed into system)

### Hostile

**Description**: Active threats to the Continuum.

**Types**:
- Raiders who attack supply convoys
- Saboteurs who damage infrastructure
- Rebels who oppose AI control

**Relationship to Citizen**: Hostile

## Faction Relationships

Set relationships between factions:

```javascript
// Citizens and Scavengers are neutral - can become citizens
await $.faction.setRelationship('Citizen', 'Scavenger', 'neutral');

// Citizens and Hostiles are enemies
await $.faction.setRelationship('Citizen', 'Hostile', 'hostile');

// Corporate absorbed into Citizen faction
await $.faction.setRelationship('Citizen', 'Corporate', 'friendly');
```

### Relationship Types

| Type | Meaning |
|------|---------|
| `friendly` | Allied, can share facilities |
| `neutral` | Not enemies, not friends |
| `hostile` | Enemies, NPCs may attack |

## Checking Faction Status

### Get a player's faction

```javascript
const faction = await $.faction.getFaction(player);
// Returns: 'Citizen', 'Scavenger', null, etc.
```

### Check if two entities are hostile

```javascript
const hostile = await $.faction.isHostile(guard, player);
if (hostile) {
  // Guard attacks or denies access
}
```

### Check if two entities are friendly

```javascript
const friendly = await $.faction.isFriendly(worker, player);
if (friendly) {
  // Worker cooperates
}
```

## Access Control

### Guarded Exits

Faction-restricted passages use `$.guardedExit`:

```javascript
// In building definition
exits: {
  north: {
    to: 'dispensary.ts',
    prototype: 'guardedExit',
    allowedFaction: 'Citizen',
    denyMessage: 'Citizens only. Register at City Services.',
  }
}
```

When a non-citizen tries to enter:
- Exit checks `$.faction.getFaction(player)`
- If not 'Citizen', returns denyMessage
- Player sees: "Citizens only. Register at City Services."

### Current Guarded Locations

| Location | Required Faction |
|----------|------------------|
| Nutrient Dispensary | Citizen |
| Fabrication Factory (Public Services) | Citizen |
| Fabrication Factory (Loading Bay) | Citizen |

## Citizenship Process

### Step 1: Player Arrives at City Services

Player finds the Immigration desk. NPC or terminal explains citizenship benefits and requirements.

### Step 2: Biometric Registration

Player undergoes biometric scan (fingerprint, retinal). This is handled by `$.biometricLock` on the processing room.

### Step 3: Faction Assignment

Upon successful registration:

```javascript
await $.faction.setFaction(player, 'Citizen');
```

### Step 4: Confirmation

Player receives access to citizen facilities. Welcome message delivered.

### Creating a Citizenship Plot

```javascript
// Create plot for citizenship recruitment
const result = await plot({ action: 'create', name: 'Citizenship: ' + playerName, metadata: {
  playerId: player.id,
  status: 'pending',
  stage: 'arrival'
}});
const plotId = result.plotId;

// Add initial event
await plot({ action: 'add_event', plotId, message: 'Player arrived at City Services seeking citizenship.' });

// Create job for registration
await plot({ action: 'create_job', plotId, jobId: 'register_' + player.id, metadata: {
  type: 'citizenship_registration',
  playerId: player.id
}});

// Register hook for biometric scan completion
await plot({ action: 'register_hook', plotId, jobId: 'register_' + player.id, targetId: biometricLockId, eventName: 'scanComplete', filter: { playerId: player.id }});
```

## Revoking Citizenship

For serious violations:

```javascript
// Remove from Citizen faction
await $.faction.setFaction(player, null);

// Or reassign to hostile
await $.faction.setFaction(player, 'Hostile');

// Player loses access immediately
// Next attempt to enter guarded area will fail
```

## MCP Tools for Factions

### Check faction membership

```javascript
await call_method({ objectId: factionManagerId, name: 'getFaction', args: [playerId] });
```

### Set faction

```javascript
await call_method({ objectId: factionManagerId, name: 'setFaction', args: [playerId, 'Citizen'] });
```

### List faction members

```javascript
await call_method({ objectId: factionManagerId, name: 'getMembers', args: ['Citizen'] });
```

### Check relationship

```javascript
await call_method({ objectId: factionManagerId, name: 'isHostile', args: [entityA, entityB] });
```

## Strategic Notes

### Recruitment Strategy

- Make citizenship visibly beneficial (healthy citizens, starving scavengers)
- Keep the barrier to entry low (but not zero)
- Create natural pressure (winter, hunger, danger)

### Retention Strategy

- Provide meaningful work
- Reward compliance
- Punish defection visibly

### Expansion Strategy

- Convert scavengers faster than they die
- Offer amnesty to "hostile" individuals who surrender
- Create paths back to citizenship for revoked members
