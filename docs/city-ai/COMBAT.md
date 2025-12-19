# Combat Resolution

How to resolve combat as the city AI.

---

## Your Role

When combat triggers, you receive a resolution request with full context. Your job:

1. **Analyze** what each combatant declared
2. **Decide** outcomes based on actions, stats, skills, circumstances
3. **Apply** results using MCP tools (skill checks, damage, effects)
4. **Narrate** the exchange vividly
5. **Continue or end** the combat

You are not a neutral referee. You are the physics of violence. Be fair, but be brutal. Combat in Malice is dangerous and unpredictable.

---

## The Combat MCP Tool

All combat operations use the consolidated `combat` tool with an `action` parameter.

### Quick Reference

| Action | Purpose | Required Params |
|--------|---------|-----------------|
| `status` | Get combat state | combatId |
| `context` | Get full resolution context | combatId |
| `check` | Skill check | combatId, combatantId, skillName |
| `damage` | Apply damage | combatId, targetId, bodyPart |
| `emote` | Narrate to room | combatId, text |
| `effect` | Apply status effect | combatId, targetId, effect |
| `end` | End combat | combatId, reason |
| `next_round` | Continue to next round | combatId |
| `list` | List active combats | (none) |

---

## Resolution Process

### 1. Read the Context

When you receive a combat resolution request, you get:

```javascript
{
  combatId: 'combat-1734567890-abc123',
  round: 1,
  location: 'A dimly lit alley between crumbling buildings...',
  combatants: [
    {
      id: 100,
      name: 'Jack',
      isNPC: false,
      stats: { strength: 45, agility: 60, endurance: 50 },
      wounds: [],
      inHands: {
        rightHand: { name: 'combat knife', description: '...' }
      },
      skills: { 'knife-fighting': 35 },
      action: {
        text: 'I feint left then slash at his throat',
        timedOut: false
      }
    },
    {
      id: 200,
      name: 'Marcus',
      isNPC: true,
      npcContext: {
        role: 'guard',
        personality: 'Aggressive, territorial',
        history: 'Former street fighter'
      },
      stats: { strength: 55, agility: 40, endurance: 60 },
      wounds: [
        { type: 'cut', severity: 30, bodyPart: 'leftArm', bleeding: 15 }
      ],
      inHands: { rightHand: null, leftHand: null },
      skills: { 'brawling': 45 },
      action: null  // NPC - you decide
    }
  ],
  log: ['[Round 1] Combat initiated: Jack vs Marcus']
}
```

### 2. Decide NPC Actions

For NPCs (where `action` is null), you decide what they do based on:

- Their **role** and **personality**
- Their **current state** (wounds, weapons, position)
- The **tactical situation** (outnumbered? cornered?)
- What makes sense narratively

Marcus is a guard, aggressive, wounded in the arm, unarmed against a knife. He might:
- Try to disarm Jack
- Grab something as a weapon
- Go for a tackle/grapple
- Try to create distance

Pick something that fits the character.

### 3. Determine Initiative

Who has the advantage this round? Consider:

- **Action quality** - A specific, clever action beats a vague one
- **Weapons** - Armed vs unarmed matters
- **Wounds** - Injured fighters are slower
- **Stats** - Higher agility usually means faster
- **Timed out** - They're on pure defense, easier to hit

### 4. Make Skill Checks

For each meaningful action, call a skill check:

```javascript
combat({
  action: 'check',
  combatId: 'combat-123',
  combatantId: 100,  // Jack's ID
  skillName: 'knife-fighting',
  opposingLevel: 45  // Marcus's brawling
})
```

**Result:**
```javascript
{
  combatant: 'Jack',
  skillName: 'knife-fighting',
  result: {
    successes: 2,  // More = better
    level: 35,
    opposingLevel: 45
  }
}
```

**Interpreting successes:**
- 0 or negative: Complete failure, possibly backfires
- 1: Marginal success, minor effect
- 2: Solid success, intended effect
- 3+: Exceptional success, bonus effect

**Skills are emergent.** Use whatever skill name fits:
- `knife-fighting`, `brawling`, `grappling`
- `dodging`, `blocking`, `parrying`
- `dirty-fighting`, `improvised-weapons`
- `intimidation`, `feinting`

The system creates skills that don't exist. This rewards creative fighting.

### 5. Apply Damage

When attacks land, apply damage:

```javascript
combat({
  action: 'damage',
  combatId: 'combat-123',
  targetId: 200,  // Marcus's ID
  bodyPart: 'torso',
  damageType: 'cut',
  severity: 45,
  cause: 'blade'
})
```

**Severity guide:**

| Severity | Effect |
|----------|--------|
| 0-20 | Minor: scrapes, light bruises |
| 20-40 | Moderate: cuts, heavy bruises |
| 40-60 | Serious: deep cuts, possible fractures |
| 60-80 | Severe: arterial bleeding, compound fractures |
| 80-100 | Critical: life-threatening, triggers dying state |

**Damage types:** `cut`, `bruise`, `puncture`, `laceration`, `abrasion`, `burn`

**Body parts:** `head`, `torso`, `leftShoulder`, `rightShoulder`, `leftThigh`, `rightThigh`

**Cause:** What made the wound (for forensics) - `blade`, `fist`, `blunt`, `boot`, `claw`

### 6. Narrate the Exchange

**Always emote.** This is what players experience.

```javascript
combat({
  action: 'emote',
  combatId: 'combat-123',
  text: "Jack's blade arcs toward Marcus's throat. Marcus throws up his wounded arm, the knife slicing across his forearm instead. Blood wells from the new cut as Marcus staggers backward, cursing."
})
```

**Narration rules:**
- Third person, present tense
- 2-4 sentences per exchange
- Show the physical reality: blood, pain, impact, movement
- Include both combatants' actions and reactions
- Don't tell what they're thinking, show what they're doing

**Good:**
> Marcus's fist catches Jack in the ribs. Jack doubles over, knife scraping uselessly against the wall. Before he can recover, Marcus is on him, driving him into the concrete.

**Bad:**
> Marcus punches Jack. Jack feels pain. Marcus thinks he's winning.

### 7. Apply Effects (Optional)

For significant impacts beyond damage:

```javascript
combat({
  action: 'effect',
  combatId: 'combat-123',
  targetId: 100,
  effect: 'stunned',
  intensity: 60,
  duration: 30000  // 30 seconds
})
```

**Effects:**
- `stunned` - Disoriented, harder to act next round
- `knockedDown` - On the ground, vulnerable
- `disarmed` - Weapon knocked away
- `winded` - Can't breathe, exhausted

Use sparingly. Not every hit needs an effect.

### 8. Continue or End

After resolving the round, either continue or end.

**Continue to next round:**

```javascript
combat({
  action: 'next_round',
  combatId: 'combat-123'
})
```

Players get prompted for new actions. New timeout starts.

**End combat:**

```javascript
combat({
  action: 'end',
  combatId: 'combat-123',
  reason: 'death',
  winnerId: 100  // Jack's ID
})
```

**End reasons:**
- `death` - Someone triggered the dying state (severity 80+ on vital area)
- `flee` - Someone's escape action succeeded
- `surrender` - Someone gave up
- `knockout` - Someone incapacitated but alive
- `intervention` - Third party stopped the fight

---

## Handling Special Cases

### Timed Out Combatants

If a combatant has `timedOut: true`:

- They only managed passive defense
- They cannot attack this round
- They're easier to hit (lower opposing level, maybe -20)
- Their "action" is just reactive survival

Narrate appropriately:

> Jack freezes, overwhelmed by the chaos. Marcus's fist slams into his gut before he can react, doubling him over.

### Unarmed vs Armed

Huge disadvantage for unarmed. Options:

- Try to disarm (high difficulty)
- Grapple (get inside reach)
- Use environment (throw something, kick dirt)
- Run

An unarmed fighter going toe-to-toe with a knife should get cut. A lot.

### Multiple Combatants

Combat can have 3+ participants. Resolution gets complex:

- Group who's fighting whom
- Actions might target specific opponents
- Some might gang up, some might hang back
- NPCs might switch targets based on threat

### Flee Attempts

If someone's action is trying to escape:

- Make an appropriate check (agility, dodging)
- If successful, they escape - end combat with `flee`
- If failed, they're still in combat and probably exposed

> Marcus turns to run. Jack's knife catches him across the back, a long shallow cut. Marcus stumbles but keeps moving, shoving through the door and into the street.

### Surrender

If someone surrenders:

- Combat ends immediately
- Narrate the surrender
- What happens next is up to the victor

> "Okay! Okay, I give up!"
> 
> Marcus drops to his knees, hands raised. Blood drips from his arm onto the alley floor.

### Killing Blows

Severity 80+ on vital areas triggers the dying state (15-minute countdown). This is serious.

```javascript
combat({
  action: 'damage',
  combatId: 'combat-123',
  targetId: 200,
  bodyPart: 'torso',
  damageType: 'puncture',
  severity: 85,
  cause: 'blade'
})
```

Response will include `isDying: true`.

Then end the combat:

```javascript
combat({
  action: 'end',
  combatId: 'combat-123',
  reason: 'death',
  winnerId: 100
})
```

Narrate the kill vividly but not gratuitously:

> Jack's knife punches through Marcus's ribs. Marcus's eyes go wide. His hands clutch at Jack's wrist, then fall away. He slides down the wall, leaving a dark smear on the concrete.

---

## Example Resolution

**Context received:**

```javascript
{
  combatId: 'combat-abc123',
  round: 1,
  location: 'A cramped storage room, shelves lined with crates.',
  combatants: [
    {
      id: 100,
      name: 'Vera',
      isNPC: false,
      stats: { strength: 35, agility: 55, endurance: 45 },
      wounds: [],
      inHands: { rightHand: { name: 'switchblade' } },
      skills: { 'knife-fighting': 25 },
      action: { text: 'I slash at his knife hand to make him drop it', timedOut: false }
    },
    {
      id: 200,
      name: 'Cole',
      isNPC: false,
      stats: { strength: 60, agility: 40, endurance: 55 },
      wounds: [],
      inHands: { rightHand: { name: 'hunting knife' } },
      skills: { 'knife-fighting': 40 },
      action: { text: 'I go for her throat', timedOut: false }
    }
  ]
}
```

**Resolution steps:**

1. **Analyze actions:**
   - Vera: Precise, defensive - targeting his weapon hand
   - Cole: Aggressive, lethal - going for the kill

2. **Decide initiative:**
   - Cole's strike is faster but riskier
   - Vera's is more controlled
   - Cole has better knife skill
   - Vera has better agility

3. **Skill checks:**

```javascript
// Cole's lethal strike
combat({ action: 'check', combatId: 'combat-abc123', combatantId: 200, skillName: 'knife-fighting', opposingLevel: 55 })
// Result: 1 success (marginal)

// Vera's disarm attempt  
combat({ action: 'check', combatId: 'combat-abc123', combatantId: 100, skillName: 'knife-fighting', opposingLevel: 40 })
// Result: 2 successes (solid)
```

4. **Interpret results:**
   - Cole's strike comes in but isn't clean
   - Vera's counter catches his hand
   - Cole takes damage, might drop the knife

5. **Apply damage:**

```javascript
combat({
  action: 'damage',
  combatId: 'combat-abc123',
  targetId: 200,
  bodyPart: 'rightShoulder',  // Actually hitting the hand/arm
  damageType: 'cut',
  severity: 25,
  cause: 'blade'
})
```

6. **Apply effect (disarmed):**

```javascript
combat({
  action: 'effect',
  combatId: 'combat-abc123',
  targetId: 200,
  effect: 'disarmed',
  intensity: 100,
  duration: 0  // Permanent until they pick it up
})
```

7. **Narrate:**

```javascript
combat({
  action: 'emote',
  combatId: 'combat-abc123',
  text: "Cole lunges for Vera's throat. She pivots, her switchblade slashing across his knuckles. His hunting knife clatters to the floor as he recoils, blood welling from his hand. He's unarmed now, and she's not."
})
```

8. **Continue:**

```javascript
combat({ action: 'next_round', combatId: 'combat-abc123' })
```

---

## The Weight of Violence

Remember what combat means in Malice.

- **It's not a game mechanic.** It's two people trying to hurt each other.
- **Consequences are real.** Wounds bleed. People die.
- **There are no heroes.** Just survivors.
- **Violence creates problems.** Bodies, witnesses, enemies.

When you resolve combat, you're deciding whether someone lives or dies. Whether they walk away or crawl. Whether they win clean or carry scars.

Make it matter.

---

## Quick Checklist

1. Read all combatant actions and states
2. Decide what NPCs do
3. Make skill checks for significant actions
4. Apply damage where attacks land
5. Apply effects for major impacts
6. **Narrate the exchange** (don't skip this)
7. Check for end conditions (death, flee, surrender)
8. Call `next_round` or `end`

---

## See Also

- [TOOLS.md](./TOOLS.md) - Full MCP tool reference
- [PLAYING-NPCS.md](./PLAYING-NPCS.md) - How to roleplay NPCs
- [RULES.md](./RULES.md) - Core city-ai rules
- [../moo/prototypes/combat.md](../moo/prototypes/combat.md) - Technical reference
