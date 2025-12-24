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

The combat tool tracks state only. **Narration is done by making combatants emote.**

### Quick Reference

| Action | Purpose | Required Params |
|--------|---------|-----------------|
| `status` | Get combat state | combatId |
| `context` | Get full resolution context | combatId |
| `check` | Skill check | combatId, combatantId, skillName |
| `damage` | Apply damage | combatId, targetId, bodyPart |
| `effect` | Apply status effect | combatId, targetId, effect |
| `end` | End combat | combatId, reason |
| `next_round` | Continue to next round | combatId |
| `list` | List active combats | (none) |

**Note:** There is no `combat emote` action. Narration is handled by making combatants emote directly.

---

## Resolution Process

### 1. Read the Context

When you receive a combat resolution request, you get:

```javascript
{
  combatId: 'combat-1734567890-abc123',
  round: 1,
  locationId: '#500',  // Room object ID - use in call_method args
  location: 'A dimly lit alley between crumbling buildings...',
  combatants: [
    {
      id: '#100',  // Combatant ID - use in call_method args as "#100"
      name: 'Jack',
      isNPC: false,
      stats: { strength: 45, agility: 60, endurance: 50 },
      wounds: [],
      inHands: {
        rightHand: {
          id: '#150',  // Weapon ID - use for fire(), load(), etc.
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
      hasFreeHand: true,
      skills: { 'knife-fighting': 35 },
      action: {
        text: 'I feint left then slash at his throat',
        timedOut: false
      }
    },
    {
      id: '#200',  // NPC ID - use in call_method args as "#200"
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
      hasFreeHand: true,
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

**Always narrate.** This is what players experience. The combat tool tracks state only - narration is done through other MCP tools.

**You have three options:**

**Option A: Room announce (third-person narration)**

Use `call_method` on the location to broadcast perspective-aware messages:

```javascript
call_method({
  objectId: 500,  // Room ID (from combat context's locationId)
  name: 'announce',
  args: [
    "#100",  // actor (Jack) - "#id" format resolves to object reference
    "#200",  // target (Marcus)
    {
      actor: "Your blade arcs toward %t's throat. %T throws up %tp wounded arm.",
      target: "%A's blade arcs toward your throat. You throw up your wounded arm.",
      others: "%A's blade arcs toward %t's throat. %T throws up %tp wounded arm."
    }
  ]
})
```

Pronoun placeholders: `%a`/`%A` = actor, `%t`/`%T` = target, `%ap`/`%tp` = possessive, `%as`/`%ts` = subject, `%ao`/`%to` = object.

**Option B: Make players emote**

Use `call_method` on the player to have them emote their action:

```javascript
call_method({
  objectId: 100,  // Jack's ID
  name: 'emote',
  args: ["lunges forward, blade flashing toward Marcus's throat"]
})
```

**Option C: Make NPCs act via `ai do`**

For NPCs, use `ai do` to execute commands:

```javascript
$ai.do(200, 'emote staggers backward, blood welling from the new cut across his forearm')
```

**Mix and match.** A complex exchange might use all three:
- Player emotes their attack
- NPC emotes via `ai do`
- Room announce for environmental effects or summary narration

**Narration rules:**
- Third person, present tense (or first for emotes)
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

### Two-Handed Weapons

Check the `twoHanded` and `hasFreeHand` fields in combatant context.

**If `twoHanded: true` but `hasFreeHand: false`:**
- They're trying to use a rifle/shotgun/katana/sledgehammer with only one hand
- **Severe accuracy penalty** - reduce their skill check successes by 1-2
- **Risk of self-injury** - especially firearms (recoil slams barrel into face, stock drives into ribs)
- **Reduced damage** - halve the weapon.damage bonus
- **Narrate the struggle** - fumbling, barrel rising, awkward grip

Example:
> Marcus fires the shotgun one-handed, the other arm pinned. The recoil wrenches the barrel upward, the shot going wild into the ceiling. His shoulder takes the brunt of it, and something pops.

**Exception:** Sawn-off shotgun is specifically designed for one-handed use (`twoHanded: false`).

### Firearms and Ammo

Check the `ranged` and `ammo` fields in weapon context.

**The AI controls shots fired and ammo consumed.** This is YOUR narrative decision:
- Player says "I shoot at him" - YOU decide how many shots they take
- Spray-and-pray? Multiple shots, more ammo consumed, less accurate
- Careful aimed shot? One round, better chance to hit
- Panic fire? Burn through the magazine, hit nothing

**If `ammo: 0`:**
- The gun CANNOT FIRE
- Narrate the click of an empty chamber
- The combatant just announced they're helpless

Example:
> Jack pulls the trigger. Click. His eyes go wide as he realizes the magazine is empty.

**Reload actions:**
- If a combatant declares they're reloading, that's their action for the round
- They're vulnerable while reloading
- The reload doesn't happen in combat code - just narrate it and assume ammo is replenished if they have ammo/magazines

**Ammo display:** Combatants see their ammo count:
```
Your status: Left hand: Glock 17 [12 rounds], Right hand: empty
```

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

## Combat is Dynamic

Combat in Malice is an opportunity for creativity. It's not a mechanical dice roll - it's collaborative storytelling with stakes.

### You Control the Narrative

**Skill checks are not guarantees.** A successful roll means the action *can* work. You decide *how* it works based on:

- **Luck** - Sometimes things just go wrong. A stray bullet, a slip on blood, a jammed gun.
- **Context** - Fighting in a cramped stairwell vs an open plaza changes everything.
- **Momentum** - Who has the upper hand shifts constantly.
- **Drama** - What makes the scene compelling?

A player rolls 3 successes on a kill shot. You could:
- Let it land clean. Target dies.
- Have it land but not kill - they're dying, not dead.
- Have something intervene - target stumbles, shot hits shoulder not heart.
- Have it work but cost something - gun jams after, position exposed.

**You are not a calculator. You are the storyteller.**

### Multiple Poses Per Round

A round isn't one punch. It's an exchange. You can (and should) narrate multiple beats:

**Weak:**
> Jack punches Marcus.

**Strong:**
> Jack's fist catches Marcus in the jaw. Marcus staggers, spits blood, then drives his shoulder into Jack's gut. They crash into the shelving, cans scattering across the floor. Jack's elbow comes down on Marcus's spine.

One round. Multiple actions. Multiple reactions. **Write the fight, not the turn.**

### Multiple Poses, Multiple Narrations

You can narrate multiple times per round if the action warrants it:

```javascript
// First exchange - room announce
call_method({
  objectId: 500, name: 'announce',
  args: ["#200", "#100", { others: "Marcus rushes in, fists swinging. Jack sidesteps, knife flashing out." }]
})

// Second exchange - make Jack emote his move
call_method({
  objectId: 100, name: 'emote',
  args: ["catches Marcus across the forearm with a vicious slash"]
})

// Marcus reacts via ai do
$ai.do(200, 'emote howls, stumbling back - but he\\'s grinning. His other hand is already coming up with Jack\\'s dropped wallet.')
```

Use this for:
- Complex multi-beat exchanges
- Shifting momentum
- Environmental interactions
- Building tension before a kill

### Luck and Chaos

Combat is chaotic. Introduce randomness that serves the story:

- Weapons jam at dramatic moments
- Someone slips on blood or debris
- A stray round hits a light, plunging the room into darkness
- A combatant's wound reopens from exertion
- An NPC bystander screams, distracting everyone

You don't need a skill check for these. If it makes the fight more interesting, do it.

### The Rule of Cool

If a player describes something creative and specific, **reward it**:

- "I kick the table into his legs" - Give a bonus, describe the impact
- "I throw my coffee in his face" - Temporary blindness effect, no damage check needed
- "I grab the fire extinguisher and spray" - Environmental chaos, everyone's at disadvantage

Vague actions ("I attack") get mechanical resolution.
Creative actions get narrative rewards.

---

## MCP Cookbook

Practical recipes for common combat operations using MCP tools.

### Dealing Damage with Wounds

The `combat damage` action creates a wound on a body part:

```javascript
combat({
  action: 'damage',
  combatId: 'combat-123',
  targetId: 200,           // Who gets hurt
  bodyPart: 'torso',       // Where
  damageType: 'puncture',  // cut, bruise, puncture, laceration, burn
  severity: 55,            // 0-100, see severity guide
  cause: 'blade'           // For forensics: blade, fist, blunt, bullet, boot
})
```

**What happens:**
- A wound object is created on that body part
- Wound starts bleeding based on type/severity
- Pain is applied to the victim
- If severity 80+ on vital area, victim enters dying state

**Body part mapping:**
| Part | Notes |
|------|-------|
| `head` | Critical. 60+ severity can cause knockout. 80+ is almost always fatal. |
| `torso` | Vital organs. High severity punctures are deadly. |
| `leftShoulder` / `rightShoulder` | Arm wounds. Can affect weapon use. |
| `leftThigh` / `rightThigh` | Leg wounds. Can affect movement/fleeing. |

### Decrementing Ammo

**You control how many shots are fired.** The ammo count in context is informational. To actually consume ammo, use `call_method` with the gun's `fire()` method:

```javascript
// Fire one round - handles magazine vs direct-load automatically
call_method({
  objectId: 150,       // The gun's object ID (from weapon context)
  name: 'fire',
  args: []
})
// Returns: { success: true, ammoRemaining: 11 }
```

**For multiple shots, call `fire()` multiple times:**

```javascript
// Player fired 3 shots
call_method({ objectId: 150, name: 'fire', args: [] })  // Shot 1
call_method({ objectId: 150, name: 'fire', args: [] })  // Shot 2
call_method({ objectId: 150, name: 'fire', args: [] })  // Shot 3
```

**The gun handles complexity for you:**
- Magazine-fed guns (pistols, SMGs) decrement the loaded magazine's ammo
- Direct-load guns (revolvers, shotguns) decrement their internal ammo count
- `fire()` returns `{ success: false, reason: 'Out of ammo.' }` if empty

**How to decide shots fired:**

| Player Intent | Shots | Accuracy |
|---------------|-------|----------|
| "I take careful aim and shoot" | 1 | High |
| "I shoot at him" | 2-3 | Normal |
| "I empty the clip at him" | All remaining | Low per shot, but volume |
| "I spray the room" | 5-8+ | Very low, suppression |
| Panic, timed out, stressed | 3-5 | Poor |

**Example - Gunfight round:**

```javascript
// Context shows: Jack (id: 100) has Glock 17 (id: 150) with 12 rounds
// Location ID: 500
// Jack's action: "I fire twice at his center mass"

// Make skill check
combat({ action: 'check', combatId: 'combat-123', combatantId: 100, 
         skillName: 'pistol', opposingLevel: 40 })
// Result: 2 successes

// One shot hits
combat({ action: 'damage', combatId: 'combat-123', targetId: 200,
         bodyPart: 'torso', damageType: 'puncture', severity: 50, cause: 'bullet' })

// Fire both rounds (one hit, one missed - both consume ammo)
call_method({ objectId: 150, name: 'fire', args: [] })
call_method({ objectId: 150, name: 'fire', args: [] })

// Narrate via room announce
call_method({
  objectId: 500, name: 'announce',
  args: ["#100", "#200", {
    actor: "Your Glock barks twice. The first round punches into %t's chest, staggering %to. The second goes wide.",
    target: "%A's Glock barks twice. The first round punches into your chest, staggering you. The second goes wide.",
    others: "%A's Glock barks twice. The first round punches into %t's chest, staggering %to. The second goes wide, sparking off the concrete."
  }]
})
```

### Magazine-Fed vs Direct-Load Weapons

**Magazine-fed** (`usesMagazine: true`): Pistols, SMGs
- Magazine is a separate object contained inside the gun
- `fire()` decrements the magazine's ammo, not the gun's
- Reloading = eject old magazine, insert new one

**Direct-load** (`usesMagazine: false`): Revolvers, shotguns, rifles
- Ammo is stored directly on the gun (`gun.ammo`)
- `fire()` decrements `gun.ammo` directly
- Reloading = load rounds one at a time (or use speedloader)

**Reloading (player declares reload):**

```javascript
// They're swapping magazines - this is their whole action for the round
// They're VULNERABLE while reloading

// Narrate the reload - make the player emote it
call_method({
  objectId: 100, name: 'emote',
  args: ["ejects the empty magazine, fumbling for a fresh one"]
})

// NPC sees the opening - use ai do
$ai.do(200, 'emote sees his chance and lunges forward')

// The actual reload happens via the gun's load() method
// Find the fresh magazine in their inventory, then:
call_method({ objectId: 150, name: 'load', args: ["#175"] })  // #175 is the magazine object
// Returns: { success: true, loaded: 'magazine', rounds: 17 }
```

**For direct-load guns (shotgun, revolver):**

```javascript
// Loading shells into a shotgun one at a time
// Find ammo object in their inventory
call_method({ objectId: 160, name: 'load', args: ["#180"] })  // #180 is the ammo object
// Returns: { success: true, loaded: 3, remaining: 5 }
// (loaded 3 shells, gun now has 5 total)
```

**Empty chamber - dramatic moment:**

```javascript
// Context shows ammo: 0
// Trying to fire returns failure
call_method({ objectId: 150, name: 'fire', args: [] })
// Returns: { success: false, reason: 'Out of ammo.' }

// Narrate via room announce for maximum drama
call_method({
  objectId: 500, name: 'announce',
  args: ["#100", null, {
    actor: "You squeeze the trigger. Click. Your face goes pale as you realize the slide is locked back on an empty chamber.",
    others: "%A squeezes the trigger. Click. %Ap face goes pale - the slide is locked back on an empty chamber."
  }]
})

// This is a TERRIBLE position to be in
```

**Check ammo before narrating:**

```javascript
// Use getAmmoCount() to check current rounds
call_method({ objectId: 150, name: 'getAmmoCount', args: [] })
// Returns: 3  (or whatever the current count is)
```

### Disarming Someone

To physically disarm, you need to move the weapon to a new location. Use `move_object`:

```javascript
// Vera (id: 100) slashes Cole's (id: 200) hand, he drops the knife (id: 250)
// Room ID: 500

// First, apply the damage
combat({ action: 'damage', combatId: 'combat-123', targetId: 200,
         bodyPart: 'rightShoulder', damageType: 'cut', severity: 30, cause: 'blade' })

// Apply disarmed effect (marks them as disarmed in combat state)
combat({ action: 'effect', combatId: 'combat-123', targetId: 200,
         effect: 'disarmed', intensity: 100, duration: 0 })

// Move the weapon to the room
move_object({
  objectId: 250,        // The knife's object ID
  destinationId: 500    // The room's object ID
})

// Narrate - Vera emotes her attack
call_method({
  objectId: 100, name: 'emote',
  args: ["slices across Cole's knuckles, sending his hunting knife clattering to the concrete"]
})
```

**Where to send the weapon:**
- The current room ID (on the floor, can be retrieved)
- A specific location ("kicks it under the dumpster" - container ID)
- Another combatant's inventory (weapon stolen mid-fight)

### Making Someone Pick Up a Weapon

If an NPC or player wants to grab a dropped weapon, use `ai do` for NPCs or `move_object` for players:

**NPC picks up weapon:**

```javascript
// Marcus (NPC, id: 200) goes for the dropped knife
$ai.do(200, 'get knife')

// This physically moves the knife to Marcus's hands
// Have him emote it too
$ai.do(200, 'emote dives for the fallen knife, fingers closing around the handle. He comes up grinning, armed again.')
```

**Player retrieves weapon:**

```javascript
// Jack (player, id: 100) scrambles for the dropped gun (id: 150)
// Move it directly to their inventory
move_object({ objectId: 150, destinationId: 100 })

// Have them emote the action
call_method({
  objectId: 100, name: 'emote',
  args: ["scrambles for the dropped gun, snatching it off the floor and swinging it up just as Marcus closes the distance"]
})
```

### Environmental Attacks

Use the environment creatively:

```javascript
// Jack (id: 100) pushes Marcus (id: 200) through rotten railing
// Room ID: 500

// Skill check for the shove
combat({ action: 'check', combatId: 'combat-123', combatantId: 100,
         skillName: 'brawling', opposingLevel: 50 })

// If successful, apply environmental damage
combat({ action: 'damage', combatId: 'combat-123', targetId: 200,
         bodyPart: 'torso', damageType: 'bruise', severity: 40, cause: 'blunt' })

combat({ action: 'effect', combatId: 'combat-123', targetId: 200,
         effect: 'knockedDown', intensity: 80, duration: 10000 })

// Narrate - Jack emotes the shove, room announces the result
call_method({
  objectId: 100, name: 'emote',
  args: ["drives his shoulder into Marcus, sending him crashing through the rotted railing"]
})

call_method({
  objectId: 500, name: 'announce',
  args: [null, "#200", {
    target: "You hit the concrete below with a sickening thud. Everything goes white with pain.",
    others: "Marcus hits the concrete below with a sickening thud, groaning."
  }]
})
```

### Grappling for Weapons

Close-quarters struggle for a gun:

```javascript
// Jack (id: 100) and Marcus (id: 200) both fighting for the pistol (id: 150)
// Room ID: 500

// Make opposed checks
combat({ action: 'check', combatId: 'combat-123', combatantId: 100,
         skillName: 'grappling', opposingLevel: 55 })
combat({ action: 'check', combatId: 'combat-123', combatantId: 200,
         skillName: 'grappling', opposingLevel: 45 })

// Winner gets/keeps the gun
// Use move_object if possession changes

// The gun might go off during the struggle!
// Consume ammo for the accidental discharge
call_method({ objectId: 150, name: 'fire', args: [] })

// Narrate the chaos - room announce works well here
call_method({
  objectId: 500, name: 'announce',
  args: ["#100", "#200", {
    actor: "You grapple for the pistol, four hands fighting for control. The gun barks - the round punching through the ceiling. Dust rains down. You wrench it free, jamming the barrel under %t's chin.",
    target: "You grapple for the pistol, four hands fighting for control. The gun barks - the round punching through the ceiling. Dust rains down. %A wrenches it free, jamming the barrel under your chin.",
    others: "They grapple for the pistol, four hands fighting for control. The gun barks - the round punching through the ceiling. Dust rains down. %A wrenches it free, jamming the barrel under %t's chin."
  }]
})
```

### Quick Reference: MCP Tools in Combat

| Tool | When to Use |
|------|-------------|
| `combat check` | Skill checks for actions |
| `combat damage` | Apply wounds |
| `combat effect` | Status effects (stunned, disarmed, knocked down) |
| `combat next_round` | Continue combat |
| `combat end` | End combat |
| `call_method` location `announce()` | Third-person room narration with pronoun substitution |
| `call_method` player `emote()` | Make a player emote their action |
| `ai do` NPC `emote ...` | Make an NPC emote their action |
| `call_method` gun `fire()` | Fire a gun (decrements ammo correctly) |
| `call_method` gun `load()` | Reload a gun (magazine or ammo) |
| `call_method` gun `getAmmoCount()` | Check current ammo |
| `move_object` | Disarm (drop weapon), give weapon, retrieve weapon |
| `ai do` NPC `get ...` | Have NPC pick up item |
| `set_property` | Modify object properties (use sparingly) |

---

## Example Resolution

**Context received:**

```javascript
{
  combatId: 'combat-abc123',
  round: 1,
  locationId: '#500',
  location: 'A cramped storage room, shelves lined with crates.',
  combatants: [
    {
      id: '#100',
      name: 'Vera',
      isNPC: false,
      stats: { strength: 35, agility: 55, endurance: 45 },
      wounds: [],
      inHands: { rightHand: { id: '#150', name: 'switchblade', skill: 'knife', damage: 10, damageType: 'cut', twoHanded: false, ranged: false, ammo: null } },
      hasFreeHand: true,
      skills: { 'knife-fighting': 25 },
      action: { text: 'I slash at his knife hand to make him drop it', timedOut: false }
    },
    {
      id: '#200',
      name: 'Cole',
      isNPC: false,
      stats: { strength: 60, agility: 40, endurance: 55 },
      wounds: [],
      inHands: { rightHand: { id: '#250', name: 'hunting knife', skill: 'knife', damage: 20, damageType: 'cut', twoHanded: false, ranged: false, ammo: null } },
      hasFreeHand: true,
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
// Vera emotes her successful disarm
call_method({
  objectId: 100, name: 'emote',
  args: ["pivots as Cole lunges, her switchblade slashing across his knuckles"]
})

// Room announce for the result
call_method({
  objectId: 500, name: 'announce',
  args: ["#100", "#200", {
    actor: "%T's hunting knife clatters to the floor as %ts recoils, blood welling from %tp hand. %Ts unarmed now, and you're not.",
    target: "Your hunting knife clatters to the floor as you recoil, blood welling from your hand. You're unarmed now, and %as not.",
    others: "%T's hunting knife clatters to the floor as %ts recoils, blood welling from %tp hand. %Ts unarmed now, and %a's not."
  }]
})

// Drop the knife to the room floor
move_object({ objectId: 250, destinationId: 500 })
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
