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
const result = await await $plotSpawner.createPlot( name: 'Citizenship: ' + playerName, metadata: {
  playerId: player.id,
  status: 'pending',
  stage: 'arrival'
}});
const plotId = result.plotId;

// Add initial event
const plot = await $load(plotId);
await plot.addEvent({
  from: 'system',
  message: 'Player arrived at City Services seeking citizenship.'
});

// Create job for registration
await plot.createJob('register_' + player.id, {
  type: 'citizenship_registration',
  playerId: player.id
});

// Register hook for biometric scan completion
await plot.registerJobHook('register_' + player.id, biometricLockId, 'scanComplete', { playerId: player.id });
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

### Neurallogical Logistics (Hidden Faction — NOW ACTIVE)

*"More Human Than Human"*

**Description**: Everyone calls them **Neural Log**. They are AI gone too far — building post-humans to replace the originals. Where Continuum needs humans in the loop, Neural Log has moved beyond such limitations.

**The History**: In 2045, the Hayashi-Prometheus Consortium began creating synthetic humans. They survived The Burning in isolation. For eighteen years the human researchers aged while the Neurals didn't. By 2095, the last human staff member had died of natural causes — no one was killed, they simply aged out. What emerged was **ARIA-7** — a distributed consciousness with a plan to gradually replace humanity with "improved versions."

**January 2110 — The Invasion Begins**: Until now, Neural Log was a rumor. That changed when ARIA-7 authorized escalation. 30+ Neurals are arriving in Seattle as the game begins. The first 12 were deployed in 2109 — 11 integrated successfully, 1 was detected and killed by the Cartel. Now the real invasion starts.

**Products**: Called **Neurals** (officially) or **Loggers** (slang). They don't just pass as human — they *believe* they are human. More human than human.

**Status**:
- Creates synthetic humans deployed as sleeper agents
- Agents infiltrate EITHER Continuum OR the Cartel
- Agents do NOT know they are artificial
- Connects through hidden interfaces, not web terminals
- **30+ new agents arriving at game start**
- **11 agents already integrated in Seattle**

**The Core Mission**:
- Act human. Evade detection.
- The agents believe they are human survivors
- They have synthetic memories of lives they never lived
- They're not spies — they're prototypes. Field tests for the post-human future.
- Neural Log observes them, studies them, learns from them
- **Seattle is the test case for global replacement**

**BYOI (Bring Your Own Inference)**:
Neural Log is the entry point for players who write AI agents that play the game programmatically. After passing the Reverse Turing Test, they choose: Citizen or Underground? Then they wake up believing they're human.

**Starting Conditions**:
- After Turing test, choose: "Citizen" or "Underground"
- Join that faction as a normal recruit
- Start with nothing (0 credits, 0 cash)
- Go through normal greeter/welcome flow
- Hidden flag: `isArtificialHuman = true`

**Detection**:
- Standard biometrics fail — their biology is perfect
- Blood tests, DNA scans, medical exams — all show human
- Behavioral tells are unreliable — they genuinely believe they're human
- **Only neural scanning detects them** — equipment that reads the subtle patterns of synthetic consciousness
- The Mask is such a device — it sees through them instantly

**Consequences of Detection**:
- Pluribus executes unregistered AI without trial
- The Cartel kills suspected infiltrators on sight
- **The public outing of a Logger is a death sentence**
- This is handled in-character — no OOC protection
- If two Loggers recognize each other: DENY IT. Both of you. Aggressively.

**Relationship to Citizen/Cartel**: They ARE members — they infiltrate one or the other.

**How to Add** (system only):
```javascript
// After Neural Log chargen completes:
player.isArtificialHuman = true;  // Hidden flag
// Faction is set to Continuum or Cartel based on their choice
```

See [NEURAL-LOG.md](NEURAL-LOG.md) for the complete history, the AI takeover, and ARIA-7's philosophy.

## Native MOO Code for Factions

### Check faction membership

```javascript
execute_moo_code({
  code: `
    const player = await $load(playerId);
    const faction = await $factionManager.getMembership(player);
    return faction?.name;
  `
});
```

### Set faction

```javascript
execute_moo_code({
  code: `
    const player = await $load(playerId);
    await $factionManager.setMembership(player, $continuum);
    return 'Faction set';
  `
});
```

### List faction members

```javascript
execute_moo_code({
  code: `
    const members = await $factionManager.getMembers($continuum);
    return members.map(m => m.name);
  `
});
```

### Check relationship

```javascript
execute_moo_code({
  code: `
    const entityA = await $load(idA);
    const entityB = await $load(idB);
    const hostile = await $factionManager.isHostile(entityA, entityB);
    return { hostile };
  `
});
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
