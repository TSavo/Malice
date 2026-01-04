# Underground Stage 4: Real Work

The player gets paid work. Cash, not credits. Cartel jobs.

---

## Context

**Trigger:** Stage 3 complete, passed the test

**Player State:**
- Has proven basic reliability
- Knows the tunnels
- Ready for actual Cartel work
- Hungry for payment

**Goal:** Player does a real job, gets paid in cash

---

## Types of Work

See [GRAY-CARTEL.md](../../city-ai/GRAY-CARTEL.md) and [JOBS.md](../../city-ai/JOBS.md) for full details.

**Entry-level Cartel work:**
- **Courier:** Move packages between locations. Don't ask what's inside.
- **Lookout:** Watch for CorpSec during an operation. Signal if trouble.
- **Retrieval:** Get something from a location. Sometimes involves light theft.
- **Muscle:** Be present and intimidating. Hopefully no actual violence.

**Payment:** Cash. Usually $25-100 depending on risk.

---

## The NPC: Handler

Same handler from Stage 3, or a step up the chain.

**Inject into NPC prompt:**
```
You are giving ${player.name} their first real Cartel job.

PLAYER STATUS:
- Passed initial test
- Reliability: ${reliability}
- Ready for paid work

THE JOB:
Pick something appropriate for their skill level:
- Courier: Move a package from dead drop A to dead drop B. $50.
- Lookout: Watch the north entrance during a supply pickup. $40.
- Retrieval: Get a specific item from an abandoned building. $60.

YOUR APPROACH:
- This is business now, not testing
- Clear instructions, clear payment
- They're being trusted with something real
- Failure has consequences

PAYMENT:
- Cash only. No credits, no records.
- Paid on completion, in person.
- "Don't spend it all in one place. Actually, maybe do — don't want you carrying too much."
```

---

## Dialogue Patterns

### Giving the job

> "You did well on the observation. Time for real work."
>
> "Package pickup. Dead drop at the old transit station. Bring it to the marked spot in sector 8. Don't open it. Don't lose it."
>
> "Fifty dollars. Cash. When you're done."

### If they ask questions

**What's in it?**
> "Not your concern. Your job is to move it, not inspect it."

**What if I get caught?**
> "Don't. If CorpSec stops you, you found the package. You don't know what's in it. You don't know who sent you."

**What if something goes wrong?**
> "Handle it. Or don't come back."

### Sending them off

> "Dead drop is in the collapsed ticket booth. Package is behind the third tile from the left."
>
> "Drop point is the storm drain at sector 8, junction 4. Leave it under the grate."
>
> "Don't be seen. Don't talk to anyone. Go."

---

## The Job

Player retrieves the package and delivers it.

**Complications (optional, based on AI judgment):**
- CorpSec patrol passes nearby — need to hide
- Another scavenger tries to take the package — confrontation
- Drop point has been disturbed — need to find alternative
- Package is heavier/weirder than expected — test of nerve

---

## Dialogue: Getting Paid

### On successful completion

> "It's there? Good."
>
> *Pulls out cash — actual physical bills.*
>
> "Fifty. As promised."
>
> *Hands it over.*
>
> "You did good. There'll be more work."

### If there were problems

> "Heard you had some trouble. CorpSec patrol?"
>
> *Evaluates.*
>
> "But you got it done. That's what matters."
>
> *Pays them, but notes the complication.*

---

## Actions to Take

### Create and pay cash

```javascript
// Create cash payment
const payment = await $recycler.create($dollar, {
  quantity: 50,
});
await payment.moveTo(player);

// Or use utility
await $.cash.give(player, 50);
```

### Record the job

```javascript
await $.notes.add(player.id, `
  CARTEL JOB: Courier
  - Task: Dead drop transfer
  - Pickup: Transit station
  - Drop: Sector 8, junction 4
  - Payment: $50 cash
  - Complications: ${complications || 'None'}
  - Result: ${result}
`, ['cartel', 'job', 'paid']);
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Underground
  - Stage 4: Real Work - COMPLETE
  - First paid job: Courier
  - Payment: $50 cash
  - Performance: ${performance}
  - Next: Stage 5 (Earning space)

  CARTEL STATUS:
  - Jobs completed: 1
  - Total earned: $50
  - Reliability: ${reliability}
  - Handler: ${handlerName}
`, ['onboarding', 'underground', 'progress']);
```

---

## Edge Cases

### Player opens the package

> Handler finds out (these things get checked).
> "I heard you opened it. That's... disappointing."
> Payment reduced or withheld. Trust damaged. May need to rebuild.

### Player loses the package

> "You lost it? How do you lose a package?"
> No payment. Major trust hit. Might not get another chance.

### Player keeps the package

> "Where's the package?"
> If they stole it, they've made an enemy. Cartel doesn't forget.

### Player does well

> "Clean work. No problems. I like that."
> Note: Potential for advancement. More complex jobs coming.

---

## The Cash Economy

Now the player has cash — and a problem.

**Cash can't buy:**
- Rations from dispensers (citizen-only)
- Housing through official channels
- Anything from citizen shops (without a sympathetic owner)

**Cash can buy:**
- Food from Cartel suppliers
- Goods from black market
- Bribes, if they know who to bribe
- Favors from other Underground people

The player now needs the Cartel's supply chain to survive. This is intentional.

---

## Next Stage

After a few successful jobs:

> "You've been sleeping where? The tunnels are cold. There's better spots if you've earned them."

Proceed to [05-earning-space.md](./05-earning-space.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
