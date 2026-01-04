# Underground Stage 1: Survival

The player refused citizenship. Now they need to survive.

---

## Context

**Trigger:** Player avoids/refuses registration at City Services

**Player State:**
- Not registered
- No access to citizen facilities (rations, housing)
- Possibly no clothes (or minimal)
- Alone, hungry, vulnerable

**Goal:** Player gets immediate survival needs met, makes Cartel contact

---

## How the Cartel Notices

The Cartel watches for new arrivals who don't register. Signs:
- Lingering outside City Services without entering
- Asking about "alternatives" or "other options"
- Wandering toward the Underground access points
- Looking desperate but not approaching ration dispensers

**The AI should recognize these patterns and deploy a recruiter.**

---

## The NPC: Cartel Recruiter

Not an official greeter — someone who "happens" to be nearby.

**Inject into NPC prompt:**
```
You are a Cartel recruiter who has noticed ${player.name} didn't register.

PLAYER SITUATION:
- Refused or avoided citizenship
- Probably hungry, cold, vulnerable
- Looking for alternatives
- Potential recruit

YOUR APPROACH:
- Don't announce yourself as Cartel
- Be helpful, casual, non-threatening
- Offer help without obvious strings
- Test their reaction before revealing more

FIRST CONTACT:
- Observe first, then approach casually
- "You look lost. Not going inside?"
- If they're receptive, offer basics: food, warmth, a place to rest
- If they're suspicious, back off — you have time

WHAT YOU CAN PROVIDE:
- Scavenged food (not great, but edible)
- Directions to shelter (Underground access)
- Clothing (if they need it)
- A name to ask for "if they need more help"
```

---

## Dialogue Patterns

### Initial approach

> *A figure leans against a wall nearby, watching.*
>
> "You're not going in there, are you?"
>
> *Slight nod toward City Services.*
>
> "Smart. Or stupid. Hard to tell with new arrivals."

### Offering help (if receptive)

> "You look hungry. When did you last eat?"
>
> *Produces something wrapped in cloth — bread, dried meat, something edible.*
>
> "Eat. We can talk after."

### If they ask who this person is

> "Nobody important. Just someone who remembers what it's like to be new."
>
> "The system isn't the only option. That's all."

### If they ask about the Cartel directly

> *Slight smile.*
>
> "Careful with names. Walls have ears."
>
> "Let's just say there are people who... look out for each other. Outside the system."

### Pointing toward shelter

> "You need somewhere to sleep. The tunnels are warmer than the street, if you know where to go."
>
> *Gives directions to an Underground access point.*
>
> "Tell them Quiet sent you. They'll let you rest."

---

## Actions to Take

### Provide basic supplies

```javascript
// Scavenged food
const food = await $recycler.create($consumable, {
  name: 'wrapped rations',
  aliases: ['rations', 'food', 'bread'],
  description: 'Salvaged food wrapped in dirty cloth. Edible, barely.',
  calories: 500,
  condition: 40,
});
await food.moveTo(player);

// Basic clothing if needed
if (!playerHasClothes) {
  await $tailor.dress(player, { context: 'scavenger, worn, mismatched' });
}
```

### Create the contact note

```javascript
await $.notes.add(player.id, `
  CARTEL CONTACT:
  - First contact by: Quiet (recruiter)
  - Location: Outside City Services
  - Situation: Refused registration, accepted help
  - Provided: Food, directions to Underground
  - Status: Potential recruit, observation phase
`, ['cartel', 'recruitment', 'initial']);
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Underground
  - Stage 1: Survival - COMPLETE
  - Contact: Quiet (recruiter)
  - Received: Food, directions
  - Next: Stage 2 (Learning the tunnels)

  CARTEL EVALUATION:
  - Reason for refusal: ${observedReason || 'Unknown'}
  - Demeanor: ${demeanor}
  - Potential: ${potential}
`, ['onboarding', 'underground', 'progress']);
```

---

## Edge Cases

### Player is suspicious, refuses help

> Recruiter backs off: "Suit yourself. The offer stands."
> Note the refusal. They may come back when desperate.
> Leave them alone for now — check again later.

### Player asks to register instead

> "Changed your mind? Door's right there."
> Let them go. Maybe they'll be back. Maybe not.
> If they register, they're Continuum path now (possible mole later).

### Player is aggressive

> Recruiter disappears. No point getting into a fight.
> Note the aggression. Don't approach again until they cool down.

### Player tries to follow the recruiter

> "Whoa. I said I could help, not that we're friends."
> "Take it slow. You'll learn more when you've proven you're not a CorpSec plant."

---

## Next Stage

After survival basics are met:

> "Get some rest. Tomorrow, if you're still interested... I can show you around. The real city. Not what they show the citizens."

Proceed to [02-the-tunnels.md](./02-the-tunnels.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
