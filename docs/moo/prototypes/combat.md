# Combat System

Simultaneous-action combat with AI resolution.

## Overview

Combat in Malice is designed for dramatic, dangerous encounters. Both combatants declare their actions simultaneously, then an AI resolves the exchange based on:

- Declared actions
- Stats, skills, and physical state
- Wounds, exhaustion, positioning
- What's in their hands
- Environmental context

Combat is **forced** - you don't need consent to attack someone. This is Malice.

## $combat - Combat Manager

### Properties

```javascript
{
  // Active combats keyed by combatId
  activeCombats: {},
  
  // Time limit for action submission (ms)
  actionTimeout: 60000,  // 60 seconds
  
  // System prompt for AI resolution
  systemPrompt: '...',
}
```

### Combat State Object

Each active combat is tracked with:

```javascript
{
  id: 'combat-1734567890-abc123',
  combatants: [attacker, defender, ...],
  actions: {
    [combatantId]: {
      text: 'I swing my knife at his throat',
      timestamp: 1734567900000,
      timedOut: false,
    }
  },
  round: 1,
  status: 'awaiting_actions', // or 'resolving', 'ended'
  location: roomObject,
  session: 'claude-session-id',
  startedAt: 1734567890000,
  log: ['[Round 1] Combat initiated...'],
  timeoutJobName: 'combat-timeout-combat-123',
}
```

## Combat Flow

```
1. INITIATE
   Player A: "attack B"
   → $combat.initiate(A, B)
   → Both get 'fighting' exclusion
   → Room notified
   → Timeout scheduled

2. DECLARE ACTIONS
   Both players prompted: "Type 'action <what you do>'"
   
   Player A: "action I fake left and stab at his ribs"
   Player B: "action I grab a bottle and swing at his head"
   
   → Actions stored, players can only submit once per round

3. RESOLUTION (triggered when all actions in, or timeout)
   → $combat.resolve(combatId)
   → gatherContext() collects all relevant info
   → $query() calls AI with combat MCP tool access
   → AI performs skill checks, applies damage, narrates
   → AI calls next_round or end

4. NEXT ROUND (if combat continues)
   → Actions cleared
   → Round incremented
   → New timeout scheduled
   → Players prompted again

5. END COMBAT
   → 'fighting' exclusion removed
   → Room notified of outcome
   → Combat state preserved in log
```

## Player Commands

### attack / fight

Initiate combat with a target.

```
> attack Marcus
*** COMBAT STARTED ***
You attack Marcus!
Type "action <what you do>" to declare your action.

> fight the guard
*** COMBAT STARTED ***
You attack the guard!
Type "action <what you do>" to declare your action.
```

If the target is already in combat, you **join** that combat instead.

### action

Declare your action for the current round.

```
> action I swing my knife at his throat
Action submitted: I swing my knife at his throat

> action I dodge left and kick at his knee
Action submitted: I dodge left and kick at his knee

> action I try to run away
Action submitted: I try to run away
```

**Tip:** Be descriptive. The AI resolves based on what you describe. "I attack" is weaker than "I feint high then slash at his thigh."

## Timeout Behavior

If a combatant fails to submit an action within the timeout (default 60 seconds):

- Their action becomes **"passive defense"**
- They're marked as `timedOut: true`
- The AI is told they failed to act, making them easier to hit
- They get a warning: "You failed to act in time! Taking defensive stance."

This prevents combat from stalling indefinitely.

## Key Methods

### initiate(attacker, defender)

Start combat between two combatants.

```javascript
const result = await $combat.initiate(player, target);
// { combatId: 'combat-...', combat: {...} }
// or { error: 'Already in combat' }
```

**Effects:**
- Creates combat state
- Adds 'fighting' exclusion to both
- Notifies room
- Schedules action timeout

### join(combatId, combatant)

Join an existing combat.

```javascript
const result = await $combat.join(combatId, player);
// { combatId, combat }
```

**Effects:**
- Adds combatant to the fight
- Adds 'fighting' exclusion
- Prompts for action

### submitAction(combatId, combatant, actionText)

Submit an action for the current round.

```javascript
const result = await $combat.submitAction(combatId, player, 'I lunge with my knife');
// { success: true }
// or { error: 'Already submitted action' }
```

**Effects:**
- Stores action with timestamp
- If all non-NPC combatants have acted, triggers resolution

### resolve(combatId)

Resolve the current round via AI.

```javascript
await $combat.resolve(combatId);
```

This is called automatically when all actions are in or timeout expires.

**Resolution process:**
1. Set status to 'resolving'
2. Gather context (stats, wounds, weapons, actions)
3. Call $query with combat system prompt
4. AI uses MCP combat tool to apply results
5. AI calls next_round or end

### applyDamage(combatId, target, bodyPartName, damageType, severity, cause)

Apply damage to a combatant's body part.

```javascript
const result = await $combat.applyDamage(
  combatId,
  victim,
  'torso',
  'cut',
  45,
  'blade'
);
// {
//   success: true,
//   target: 'Marcus',
//   bodyPart: 'torso',
//   damageType: 'cut',
//   severity: 45,
//   wound: {...},
//   isDying: false
// }
```

Called by AI during resolution.

### skillCheck(combatId, combatant, skillName, opposingLevel)

Perform a skill check for a combatant.

```javascript
const result = await $combat.skillCheck(
  combatId,
  attacker,
  'knife-fighting',
  50
);
// {
//   success: true,
//   combatant: 'Jack',
//   skillName: 'knife-fighting',
//   result: { successes: 2, level: 35, opposingLevel: 50 }
// }
```

**Skills are emergent** - any skill name is valid. The system creates it if it doesn't exist. This lets the AI choose contextually appropriate skills:

- `brawling` - Unarmed fighting
- `knife-fighting` - Blade work
- `grappling` - Holds, throws, chokes
- `dodging` - Avoiding attacks
- `blocking` - Parrying, deflecting
- `intimidation` - Psychological warfare
- `dirty-fighting` - Eye gouges, groin kicks
- `improvised-weapons` - Bottles, chairs, etc.

### emote(combatId, text)

Narrate combat action to the room.

```javascript
await $combat.emote(combatId, 
  "Jack's blade arcs toward Marcus. Marcus throws up an arm, the knife slicing across his forearm. Blood wells from the cut."
);
```

All combatants and room occupants see the narration.

### applyEffect(combatId, target, effect, intensity, duration)

Apply a status effect to a combatant.

```javascript
await $combat.applyEffect(combatId, victim, 'stunned', 60, 30000);
```

**Effects:**
- `stunned` - Disoriented, harder to act
- `knockedDown` - On the ground
- `disarmed` - Weapon knocked away
- `winded` - Can't breathe, exhausted

### nextRound(combatId)

Advance to the next round.

```javascript
await $combat.nextRound(combatId);
```

**Effects:**
- Increments round counter
- Clears actions
- Sets status to 'awaiting_actions'
- Schedules new timeout
- Prompts combatants

### endCombat(combatId, reason, winner)

End the combat.

```javascript
await $combat.endCombat(combatId, 'death', winner);
```

**Reasons:**
- `death` - Someone is dying (startDying triggered)
- `flee` - Someone escaped
- `surrender` - Someone gave up
- `knockout` - Someone incapacitated but alive
- `intervention` - Third party stopped the fight

**Effects:**
- Cancels timeout
- Removes 'fighting' exclusion from all
- Notifies combatants and room
- Logs final outcome

### Query Methods

```javascript
// Get combat by ID
const combat = await $combat.getCombat(combatId);

// Get combat a person is in
const combat = await $combat.getCombatByParticipant(player);

// Check if someone is in combat
const inCombat = await $combat.isInCombat(player);

// Get combat log
const log = await $combat.getLog(combatId);
```

## Context Gathering

When resolution triggers, `gatherContext` collects:

```javascript
{
  combatId: 'combat-...',
  round: 2,
  status: 'resolving',
  location: 'A dimly lit alley between two buildings...',
  combatants: [
    {
      id: 100,
      name: 'Jack',
      description: 'A wiry man with quick eyes...',
      isNPC: false,
      stats: { strength: 45, agility: 60, ... },
      wounds: [
        { type: 'cut', severity: 30, bodyPart: 'leftArm', bleeding: 15 }
      ],
      calories: { current: 1800, max: 2000, status: 'satisfied' },
      inHands: {
        leftHand: null,
        rightHand: {
          id: 500,
          name: 'combat knife',
          description: '...',
          skill: 'knife',
          damage: 18,
          damageType: 'cut',
          twoHanded: false,
          ranged: false,
          ammo: null
        }
      },
      hasFreeHand: true,  // Left hand empty, so true
      skills: { 'knife-fighting': 35, 'dodging': 20 },
      action: {
        text: 'I lunge at his chest',
        timestamp: 1734567900000,
        timedOut: false
      },
      npcContext: null
    },
    {
      id: 200,
      name: 'Marcus',
      isNPC: true,
      npcContext: {
        role: 'guard',
        personality: 'Aggressive and territorial',
        history: 'Former street fighter'
      },
      action: null,  // AI decides NPC actions
      ...
    }
  ],
  log: ['[Round 1] Combat initiated...', '[Round 1] Jack knife-fighting check: 2 successes']
}
```

### Weapon Context Fields

When a combatant holds a weapon, the context includes:

| Field | Type | Description |
|-------|------|-------------|
| `skill` | string | Skill used for this weapon (e.g., "knife", "pistol") |
| `damage` | number | Weapon's base damage modifier |
| `damageType` | string | Type of damage (cut, bruise, puncture) |
| `twoHanded` | boolean | Whether weapon needs two hands for effective use |
| `ranged` | boolean | Whether it's a firearm |
| `ammo` | number/null | Current rounds (firearms only, via `getAmmoCount()`) |

### hasFreeHand

The `hasFreeHand` field is computed:

```javascript
hasFreeHand = !inHands.leftHand || !inHands.rightHand
```

This is critical for **two-handed weapon penalties**. If a combatant is using a `twoHanded: true` weapon but `hasFreeHand: false`, they suffer:
- Severe accuracy penalty
- Risk of self-injury (recoil, loss of control)
- Reduced damage

### Status Display

Each round, combatants see their status:

```
Your status: Left hand: Glock 17 [12 rounds], Right hand: empty
```

Two-handed weapons show `(2H)`:

```
Your status: Left hand: Pump Shotgun [5 rounds] (2H), Right hand: empty
```
```

## NPC Combatants

When an NPC is in combat:

- They are marked with `isNPC: true`
- They don't submit actions (action is null)
- The AI decides what they do during resolution
- Their `npcContext` provides personality/role info

The AI should consider the NPC's role, personality, wounds, and weapons when deciding their action.

## Damage Severity Guide

| Severity | Effect | Example |
|----------|--------|---------|
| 0-20 | Minor | Scrapes, light bruises |
| 20-40 | Moderate | Cuts, heavy bruises |
| 40-60 | Serious | Deep cuts, possible fractures |
| 60-80 | Severe | Arterial bleeding, compound fractures |
| 80-100 | Critical | Life-threatening, triggers dying state |

## Damage Types

| Type | Description | Typical Cause |
|------|-------------|---------------|
| cut | Clean slice | Blade |
| laceration | Ragged tear | Jagged edge, claw |
| puncture | Stabbing wound | Knife thrust, spike |
| bruise | Blunt trauma | Fist, club |
| abrasion | Scrape/graze | Fall, drag |
| burn | Heat/chemical | Fire, acid |

## Body Parts

Valid targets for damage:

- `head` - Most dangerous, small target
- `torso` - Center mass, vital organs
- `leftShoulder` / `rightShoulder`
- `leftThigh` / `rightThigh`
- Deeper parts accessible via body traversal

## Integration

### With Scheduler

Combat uses `$scheduler` for action timeouts:

```javascript
// Schedule timeout
await $scheduler.schedule(
  'combat-timeout-' + combatId,
  60000,  // 60 seconds
  0,      // no repeat
  $combat,
  'onTimeout',
  combatId
);

// Cancel on early resolution
await $scheduler.unschedule('combat-timeout-' + combatId);
```

### With Body System

Damage is applied to body parts:

```javascript
const body = await target.getBody();
const bodyPart = await body.findPart('torso');
await bodyPart.takeDamage({
  type: 'cut',
  severity: 45,
  cause: 'blade',
  force: 45,
});
```

### With Skills

Skills are checked and gain XP through use:

```javascript
// Uses the skill, grants XP
const result = await combatant.skillCheck('knife-fighting', opposingLevel);
// { successes: 2, level: 35, opposingLevel: 50 }
```

### With Dying System

Critical damage triggers the dying state:

```javascript
// If severity >= 80 on vital area
await target.startDying();
// 15-minute countdown begins
```

## Combat Log

Every combat maintains a log for post-fight review:

```
[Round 1] Combat initiated: Jack vs Marcus
[Round 1] Jack knife-fighting check: 2 successes
[Round 1] Marcus brawling check: 1 success
[Round 1] Marcus takes 35 cut damage to leftArm
[Round 1] Jack's blade catches Marcus on the arm, blood welling from the cut.
[Round 2] New round started
[Round 2] Jack dodging check: 3 successes
[Round 2] Marcus misses wildly as Jack dances aside.
[Combat End] Reason: flee, Winner: Jack
```

## Exclusions

The 'fighting' exclusion prevents:

- Leaving the room during combat
- Certain actions that require not being in a fight
- Possibly other context-dependent restrictions

## Example Combat Session

```
Jack types: attack Marcus

*** COMBAT STARTED ***
Jack attacks Marcus!
Type "action <what you do>" to declare your action.

Marcus types: action I grab a bottle from the bar and swing at his head

Jack types: action I duck under the swing and stab at his gut

[AI Resolution]

The bottle whistles over Jack's head as he drops low. His knife 
flashes upward, catching Marcus in the side. Marcus grunts, 
staggering back against the bar, one hand pressed to the wound.

*** ROUND 2 ***
Type "action <what you do>" to declare your action.

Marcus types: action I throw the bottle at him and run for the door

[60 seconds pass, Jack doesn't respond]

You failed to act in time! Taking defensive stance.

[AI Resolution]

Marcus hurls the bottle. Jack flinches back, arms raised to 
protect his face. By the time he looks up, Marcus is already 
shoving through the door, blood trailing behind him.

*** COMBAT ENDED ***
Someone fled!
```

## See Also

- [Wounds](./wounds.md) - Injury system
- [Body](./body.md) - Body part system
- [Agents](./agents.md) - NPC AI system
- [../city-ai/COMBAT.md](../city-ai/COMBAT.md) - AI resolution guide
