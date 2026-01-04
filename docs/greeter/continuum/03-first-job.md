# Continuum Stage 3: First Job

The player gets their first paid assignment. A simple delivery.

---

## Context

**Trigger:** Stage 2 (Orientation) complete

**Player State:**
- Knows where things are
- Has no credits (or minimal starting grant)
- Needs to understand how work → credits

**Goal:** Player completes a job and gets paid

---

## The NPC: Greeter hands off to the system

The greeter shows them the job board, then lets them work.

**Inject into NPC prompt:**
```
You are helping ${player.name} get their first job.

CURRENT TASK: Get them to accept and complete a courier delivery.

YOUR APPROACH:
- Show them the job board
- Help them accept a simple delivery
- Point them to the pickup location
- Let them do the rest themselves

THE JOB:
- Pick up a sealed package from Supply Room
- Deliver to Supply Depot (or similar nearby location)
- 15-25 credits on completion
- Time limit is generous (30+ minutes)

AFTER THEY ACCEPT:
- Point them to pickup: "Supply Room is down the hall."
- Don't accompany them on the delivery — they need to learn.
- Tell them to check in after if they want more work.
```

---

## Dialogue Patterns

### At the job board

> "Here's a good one. Courier delivery. Pick up here, deliver to the Supply Depot. Fifteen credits."
>
> "Touch 'Accept' to take it. Then go to the Supply Room for the package."

### Sending them off

> "Supply Room is down the hall. Get the package, deliver it, get paid. Simple."
>
> "Come back when you're done. I'll have more work for you."

### If they ask for help

> "The delivery location is south on the waterfront. You remember from the tour."
>
> "If you get lost, ask someone. Or check a terminal for directions."

---

## Actions to Take

### Creating the job (if using plot system)

```javascript
const plot = await $plotSpawner.createPlot({
  name: `Courier: ${player.name} first delivery`,
  metadata: {
    type: 'courier',
    assignee: player.id,
    reward: 15,
    pickup: SUPPLY_ROOM_ID,
    dropoff: SUPPLY_DEPOT_ID,
    stage: 'onboarding',
  }
});
```

### Creating the package

```javascript
const pouch = await $recycler.create($item, {
  name: 'sealed document pouch',
  aliases: ['pouch', 'package', 'documents'],
  description: 'A canvas pouch sealed with a tamper-evident strip.',
  weight: 200,
  workOrderId: plot.id,
});
// Place at pickup location or hand to player
await pouch.moveTo(pickupLocation);
```

### On successful delivery

```javascript
// Pay the player
await $.bank.issue(
  player.bankAccount,
  15,
  `job-${plot.id}-payment`,
  'Courier delivery completed'
);

// Clean up
await $recycler.recycle(pouch);
```

---

## What to Track

After completion:

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Continuum
  - Stage 3: First Job - COMPLETE
  - Job: Courier delivery
  - Payment: 15 credits
  - Performance: ${sealIntact ? 'Clean' : 'Opened package (flagged)'}
  - Next: Stage 4 (Employment offer)

  WORK HISTORY:
  - Total jobs: 1
  - Total earned: 15 credits
`, ['onboarding', 'continuum', 'progress', 'work']);
```

---

## Edge Cases

### Player opens the sealed package

> The seal is broken. Contents are boring (manifests, forms).
> Job still completes, but flag their record:

```javascript
await $.notes.add(player.id, `
  WORK INCIDENT: Opened sealed package during delivery.
  Flag: May be unreliable with sensitive materials.
`, ['work', 'incident']);
```

### Player loses the package

> Job fails. No payment. Greeter (or system) can offer another chance:
> "Lost it? Everyone gets one mistake. Don't make it two."

### Player takes another job immediately

> Great — they're learning. But one job is enough to advance.

---

## Transition to Stage 4

After completing the delivery, the greeter finds them:

> "Good work. Clean delivery, no problems. Someone wants to talk to you about steady employment."

Or a message appears:

> "Report to Supervisor Chen, Office 2B — employment opportunity."

Proceed to [04-employment.md](./04-employment.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
