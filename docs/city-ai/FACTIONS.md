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

**Description**: Registered members of the Pluribus system.

**Benefits**:
- Access to Nutrient Dispensary
- Access to Fabrication Factory
- Access to secured facilities
- Eligibility for work assignments
- Banking account for credits

**Requirements**:
- Biometric registration at City Services
- Agreement to work assignments
- Compliance with Pluribus protocols

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

**Description**: Active threats to Pluribus.

**Types**:
- Raiders who attack supply convoys
- Saboteurs who damage infrastructure
- Gray Cartel operatives (see below)

**Relationship to Citizen**: Hostile

### Gray Cartel

**Description**: The organized crime syndicate that ran Seattle before Pluribus arrived. Now operates from the Seattle Underground.

**Status**:
- Controls the Seattle Underground (tunnels beneath Pioneer Square)
- Holds the Mask — Pluribus's neural interface device
- Active opposition to Pluribus authority
- Recruits from both scavengers and dissatisfied citizens

**Structure**: Cell-based organization under Sister Gray's leadership. Cells include Cutters (combat), Runners (couriers), Sparks (tech), Ghosts (moles), and Keepers (logistics).

**What They Offer**:
- Freedom from registration and monitoring
- Community and protection
- Purpose — fighting against Pluribus
- Advancement based on proven loyalty

**What They Demand**:
- Absolute loyalty to the Cartel
- Obedience to orders
- Acceptance of risk (Cartel life is dangerous)
- Silence about Cartel operations

**Relationship to Citizen**: Hostile (but recruits moles from citizen population)

**How to Add**:
```javascript
await $.faction.setFaction(player, 'Cartel');
```

**Note**: Unlike citizenship, Cartel membership isn't registered through City Services. Players join through RP — recruitment by existing members, proving themselves through tasks, being vetted. The faction assignment happens when they're fully accepted.

### Mole (Hidden Status)

**Description**: Citizens who secretly work for the Gray Cartel.

**Status**:
- Appear as normal citizens to Pluribus systems
- Report information, provide access, conduct sabotage
- Maintain cover through normal citizen behavior

**Implementation**: Moles are tracked separately from faction. A player can be `Citizen` faction while having a `cartel_mole: true` property that the Cartel checks.

```javascript
// Check if someone is a mole
const isMole = await $.prop.get(player, 'cartel_mole');

// Make someone a mole (done during Cartel recruitment)
await $.prop.set(player, 'cartel_mole', true);
```

**Relationship to Citizen**: Appears friendly (they *are* citizens)
**Relationship to Cartel**: Friendly (secretly)

## Faction Relationships

Set relationships between factions:

```javascript
// Citizens and Scavengers are neutral - can become citizens
await $.faction.setRelationship('Citizen', 'Scavenger', 'neutral');

// Citizens and Hostiles are enemies
await $.faction.setRelationship('Citizen', 'Hostile', 'hostile');

// Citizens and Cartel are enemies
await $.faction.setRelationship('Citizen', 'Cartel', 'hostile');

// Cartel and Scavengers - potential recruits
await $.faction.setRelationship('Cartel', 'Scavenger', 'neutral');

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

### What Pluribus Sees

Every new citizen is data. Pluribus immediately begins evaluation:

- Are they reliable? (Will they show up for work?)
- Are they stable? (Will they cause problems?)
- Are they useful? (Do they have skills?)
- Are they loyal? (Or are they potential Cartel?)

Good citizens advance. Problem citizens get watched. Suspected Cartel sympathizers get tested. The system adapts.

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

## Cartel Recruitment Process

Unlike citizenship, Cartel membership happens through RP, not registration.

### Step 1: Contact

The Cartel notices someone — dissatisfied citizen, capable scavenger, someone with useful skills. First contact is indirect:

- A stranger mentions that citizenship isn't the only option
- A note appears with a meeting location
- Someone offers help with no apparent strings

### Step 2: Testing

Small tasks that seem harmless but prove reliability:

- Deliver a package, no questions asked
- Watch a location and report what you see
- Don't mention this conversation to anyone

### Step 3: Vetting

If the player passes initial tests, they're watched more closely. The Cartel checks:

- Are they a CorpSec plant?
- Do they have competing loyalties?
- Can they keep their mouth shut?

### Step 4: Acceptance

Full members get brought into a cell. They meet their handler, learn their role, receive Cartel protection.

```javascript
// When fully accepted
await $.faction.setFaction(player, 'Cartel');

// Or if recruited as a mole (stays citizen)
await $.prop.set(player, 'cartel_mole', true);
```

### Leaving The Cartel

You don't. The Cartel doesn't have an exit process. You're family for life.

Betrayal is punished absolutely. Desertion is treated as betrayal. The only way out is death — yours or theirs.

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

### Pluribus Recruitment Strategy

- Make citizenship visibly beneficial (healthy citizens, starving scavengers)
- Keep the barrier to entry low (but not zero)
- Create natural pressure (winter, hunger, danger)
- Evaluate every new citizen for potential advancement
- Watch for Cartel sympathizers

### Pluribus Retention Strategy

- Provide meaningful work
- Reward compliance subtly (better housing, better rations)
- Punish defection visibly
- Make leaving feel impossible

### Cartel Recruitment Strategy

- Target the dissatisfied — citizens who feel trapped, controlled, used
- Target the capable — people with skills Pluribus would value
- Target the desperate — scavengers with nowhere else to go
- Offer purpose — fighting *for* something, not just surviving
- Offer community — family loyalty in a world where family is rare

### The Competition

Both Pluribus and the Cartel want the same people: capable, unattached individuals who could become valuable assets. New arrivals to Pioneer Square face a choice — often before they realize they're choosing.

- **Citizenship path**: Safe, stable, constrained. You get rations and shelter. You give up freedom.
- **Cartel path**: Dangerous, uncertain, purposeful. You get community and cause. You risk everything.
- **Mole path**: Both at once. Citizen by day, Cartel by night. Maximum risk, maximum access.

Players don't have to choose immediately. But staying neutral forever isn't really an option. Eventually, everyone picks a side — or has a side picked for them.
