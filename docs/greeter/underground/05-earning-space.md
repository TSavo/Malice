# Underground Stage 5: Earning Space

The player gets a place to stay. Not housing allocation — earned territory.

---

## Context

**Trigger:** Multiple successful jobs, handler vouches for them

**Player State:**
- Has completed 3-4 Cartel jobs
- Has proven reliable
- Has cash but no permanent shelter
- Is becoming known to the organization

**Goal:** Player gets assigned to a Cartel-controlled space

---

## How It Works

Unlike Continuum housing (assigned by bureaucracy), Underground space is:
- **Earned** through work and loyalty
- **Granted** by someone with authority
- **Defensible** only as long as you're useful
- **Not on any record** — you just... live there

---

## The NPC: Handler or Cell Leader

Someone with authority to grant access to Cartel spaces.

**Inject into NPC prompt:**
```
You are granting ${player.name} access to Cartel housing.

PLAYER STATUS:
- Jobs completed: ${jobCount}
- Reliability: High
- Handler assessment: ${assessment}
- Current housing: Sleeping in tunnels

YOUR APPROACH:
- This is a reward for good work
- Make it clear this is earned, not given
- Explain the expectations
- This comes with responsibility

WHAT THEY GET:
- A corner in a safe house, or
- Access to a defended section, or
- A room in a Cartel-controlled building

EXPECTATIONS:
- Keep it clean
- Don't bring outsiders
- Defend the space if needed
- Continue being useful
```

---

## Dialogue Patterns

### Making the offer

> "You've been sleeping rough. That ends now."
>
> "We've got a place in sector 12. Safe house. You get a corner."
>
> "It's not luxury. But it's dry, it's warm, and nobody's going to bother you there."

### Explaining the terms

> "This isn't free. You've earned it with work. You keep earning it."
>
> "You stop being useful, you lose the space. Simple."
>
> "Someone threatens the house, you help defend it. That's the deal."

### If they ask about paying rent

> *Slight laugh.*
>
> "Rent? We're not Pluribus. You don't pay. You contribute."
>
> "Your work is your payment. Keep doing it."

### Showing them the space

> *Leads to a hidden door, a camouflaged entrance, a forgotten basement.*
>
> "Through here. Watch your step."
>
> *The space is rough but functional. Cots, supplies, other people.*
>
> "That corner's yours. Don't touch anyone else's stuff."

---

## The Space

**Typical Cartel housing:**
- Safe house in the Underground tunnels
- Abandoned building with defended access
- Basement of a surface building (Cartel-controlled)
- A section of the old Seattle Underground

**Features:**
- Defensible entrance
- Basic amenities (water, light, maybe heat)
- Shared with other Cartel members
- Hidden from CorpSec

**Not features:**
- Privacy
- Comfort
- Permanence (beyond your usefulness)

---

## Actions to Take

### Grant access

```javascript
await $.notes.add(player.id, `
  CARTEL HOUSING:
  - Location: Safe house, sector 12
  - Type: Shared space, assigned corner
  - Access granted by: ${handler.name}
  - Date: ${new Date().toISOString()}
  - Status: Active
  - Expectations: Continued work, defense if needed
`, ['cartel', 'housing', 'active']);
```

### Note on the safe house

```javascript
await $.notes.add(SAFE_HOUSE_ID, `
  NEW RESIDENT: ${player.name}
  - Vouched by: ${handler.name}
  - Space assigned: Corner near east wall
  - Status: Probationary
`, ['residents', 'new']);
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Underground
  - Stage 5: Earning Space - COMPLETE
  - Housing: Safe house, sector 12
  - Granted by: ${handler.name}
  - Next: Stage 6 (Cell assignment)

  CARTEL STATUS:
  - Jobs completed: ${jobCount}
  - Total earned: $${totalCash}
  - Housing: Yes
  - Standing: Good
`, ['onboarding', 'underground', 'progress']);
```

---

## Edge Cases

### Player doesn't want to live with others

> "Privacy is for citizens. We share because we survive together."
> They can refuse, but then they're still sleeping rough.

### Player causes problems with roommates

> "I heard about the incident. Sort it out, or you're back in the tunnels."
> Internal disputes are handled internally — but causing problems has consequences.

### Player wants to bring someone

> "Who? And why should we trust them?"
> Can be done, but the new person needs vetting too.

### Safe house gets raided

> CorpSec finds the location. Everyone scatters.
> New housing needs to be found. Player's reliability in crisis is noted.

---

## The Social Web

Living in Cartel housing means:
- Seeing other Cartel members regularly
- Building relationships (good and bad)
- Being part of the community
- Having backup — and obligations

The player is no longer alone. They're part of something.

---

## Next Stage

After settling in:

> "You've got a place. You've got work. Time to make it official."
>
> "Someone wants to meet you. Talk about your future with us."

Proceed to [06-cell-assignment.md](./06-cell-assignment.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
