# Stage 3: First Courier Job

The player receives their first paid assignment: a simple delivery within the Footprint.

---

## Context

**Where this happens:** City Services, at the job board terminal

**Trigger:** Stage 2 (Block Tour) complete

**State at start:**
- Player knows the basic layout of the area
- Player has no work history
- Player has minimal or no credits
- Player is dressed and registered

**Goal:** Player completes their first job, earns their first credits, understands the work order system

---

## The Job

### Work Order Details

**Job Type:** Delivery (simplest category)

**Description:**
```
WORK ORDER #[auto-generated]
Type: Courier - Package Delivery
Priority: Standard
Reward: 15 credits

Pickup: City Services Supply Room (-14, +9, z=0)
Delivery: Supply Depot (-21, -5, z=0)

Package: Sealed document pouch
Weight: Light
Handling: Standard (no special requirements)

Instructions: Pick up sealed pouch from Supply Room. Deliver to
Supply Depot clerk. Do not open package. Report to clerk for payment
confirmation.

Time Limit: 30 minutes (generous)
```

### Why This Job

This job is designed for success:
- **Short distance:** A few blocks, entirely within the Footprint
- **Simple task:** Pick up, carry, hand over
- **No complications:** No hostile areas, no tricky NPCs, no failure triggers
- **Immediate reward:** 15 credits deposited on completion

The goal is to teach the system, not to challenge the player.

---

## The Scene

### At the Job Board

The greeter brings the player to the terminal:

> *Gestures at the screen.*
>
> "Here's where the magic happens. Let me show you how it works."
>
> *Taps the terminal. A list of work orders appears.*
>
> "See? Jobs, sorted by type. Courier work is the entry level. Good for new arrivals."

**Greeter's Notes (for AI prompt):**
```javascript
await $.notes.add(greeter.id, `
  CURRENT TASK: First Job Assignment
  Player: ${player.name} (#${player.id})
  Status: Completed tour, ready for first work order

  GOAL: Get player to accept and complete a simple delivery

  INSTRUCTIONS:
  - Show them how to read the job board
  - Help them accept their first job
  - Explain pickup location (Supply Room, down the hall)
  - Explain delivery location (Supply Depot, south on waterfront)
  - Let them do the actual work

  DEMEANOR: Encouraging but not hand-holding

  IF THEY STRUGGLE:
  - Can walk them to Supply Room
  - Should NOT accompany them on delivery (they need to learn)
`, ['job', 'current']);
```

### Accepting the Job

Greeter walks player through the process:

> "This one's good for you. Document delivery. Pick up here at City Services, deliver to Supply Depot. Fifteen credits."
>
> *Points at the screen.*
>
> "Touch 'Accept' to take the job. It gets assigned to you — nobody else can grab it now."

**If player hesitates:**
> "This is how you eat. How you get housing. How you become someone in this city."
>
> "Accept the job. Do the job. Get paid. It's not complicated."

**After accepting:**
> "Good. It's yours now. System's tracking. Clock starts when you pick up the package."
>
> "Supply Room is down the hall. Ask the clerk for package [order number]. She'll give you the pouch."

---

## The Pickup

### Supply Room

A small room with shelves of packages, pouches, and sealed containers. A bored clerk sits behind a counter.

**Room Description:**
```
Supply Room

A cramped space lined with metal shelving, each shelf stacked with
packages wrapped in brown paper, sealed pouches, and labeled containers.
A counter separates the shelving from the doorway. Behind it, a clerk
waits with the patience of someone who's been waiting for decades.

A sign reads: "PRESENT WORK ORDER NUMBER FOR PICKUP."
```

**Clerk's Notes (for AI prompt):**
```javascript
await $.notes.add(clerk.id, `
  ROLE: Supply Room Clerk
  CURRENT: Player ${player.name} should be picking up package for Work Order #${orderId}

  BEHAVIOR:
  - Bored, efficient, slightly condescending to new arrivals
  - Asks for work order number
  - Hands over the sealed document pouch
  - Reminds them not to open it

  DIALOGUE HINTS:
  - "Work order number?"
  - "Don't open it. Don't lose it. Don't dawdle."
  - "Supply Depot is south on the waterfront. You know where that is?"
`, ['job', 'current']);
```

### Clerk Dialogue

**When player arrives:**
> "Work order number?"

**When player provides it:**
> *Checks a tablet. Scans a shelf. Pulls down a sealed pouch.*
>
> "Document pouch for Supply Depot. Sign here."
>
> *Hands over a battered tablet for signature.*

**After signature:**
> "Don't open it. Don't lose it. Don't dawdle. Supply Depot is south on the waterfront — 1st Ave, just past Jackson."
>
> *Already looking past the player.*
>
> "Next."

### The Package

The player now has the item:

```javascript
const documentPouch = await $recycler.create($item, {
  name: 'sealed document pouch',
  aliases: ['pouch', 'document pouch', 'package', 'documents'],
  description: 'A heavy canvas pouch sealed with a tamper-evident strip. The City Services logo is stamped on the front.',
  weight: 200, // grams
  workOrderId: orderId,
  destination: SUPPLY_DEPOT_ID,
  sealed: true,
});
await documentPouch.moveTo(player);
```

**If player tries to open it:**
```
You could break the seal, but the tamper-evident strip would show you did.
That kind of thing gets noticed. Gets remembered.
```

If they actually break the seal:
- Contents: boring bureaucratic documents (inventory manifests)
- Consequence: Job completes with a flag in their record

```javascript
await $.notes.add(player.id, `
  WORK INCIDENT:
  - Job: #${orderId}
  - Issue: Opened sealed package during delivery
  - Contents: Inventory manifests (non-sensitive)
  - Flag: UNRELIABLE - violated package integrity
`, ['work', 'incident', 'unreliable']);
```

---

## The Delivery

### The Route

Player must travel from City Services (-14, +9) to Supply Depot (-21, -5):
- West on Yesler to Waterfront
- South on Waterfront to past Jackson
- Enter Supply Depot

This is straightforward navigation the player should be able to handle after the tour.

### Along the Way

The streets are populated with citizens going about their business. Nothing hostile, but the player gets a feel for the city in motion:

- Citizens walking with purpose
- A CorpSec patrol passing by (nods at the player, keeps moving)
- The hum of generators from somewhere
- Faded posters on walls ("REGISTER TODAY", "WORK BUILDS THE FUTURE")

### Supply Depot

A larger building with loading docks. Busy with incoming and outgoing shipments.

**Building Description:**
```
Supply Depot

A converted warehouse with reinforced loading docks. Crates and pallets
stack against the walls, moved by workers with hand trucks and small
forklifts. The air smells of cardboard, machine oil, and coffee.

A reception counter near the entrance handles incoming deliveries.
Clerks process paperwork with mechanical efficiency.
```

**Depot Clerk's Notes (for AI prompt):**
```javascript
await $.notes.add(depotClerk.id, `
  ROLE: Supply Depot Receiving Clerk
  CURRENT: Expecting delivery from new courier ${player.name}, Work Order #${orderId}

  BEHAVIOR:
  - Efficient, no-nonsense
  - Checks package, checks work order, marks complete
  - Issues payment confirmation
  - Minimal small talk

  IF PACKAGE IS OPENED:
  - Notes it. Doesn't make a scene.
  - "This seal is broken. You want to explain that?"
  - Completes delivery anyway but flags the record

  IF PLAYER IS FRIENDLY:
  - Brief warmth, then back to work
  - "Good work. Keep it up."
`, ['job', 'current']);
```

### Delivery Dialogue

**When player arrives:**
> *Clerk looks up from paperwork.*
>
> "Delivery? Work order number."

**When player provides it:**
> *Takes the pouch. Checks the seal. Scans something on a tablet.*
>
> "Document pouch from City Services. Received."
>
> *Stamps something. Hands back a receipt.*
>
> "Fifteen credits, deposited to your account. Check your balance at any terminal."

**If seal is broken:**
> *Frowns at the torn strip.*
>
> "This seal is broken."
>
> *Looks at the player.*
>
> "You want to explain that?"
>
> *Regardless of explanation:*
>
> "Noted. Delivery accepted. Fifteen credits, deposited. But this goes in the record."

### Payment

On successful delivery, credits are issued:

```javascript
await $.bank.issue(
  player.bankAccount,
  15,
  `job-${orderId}-payment`,
  'Courier delivery completed'
);

// Update work order status
await $.plots.completeJob(orderId, {
  completedBy: player.id,
  outcome: sealBroken ? 'completed_with_incident' : 'completed',
  notes: sealBroken ? 'Package seal broken' : null,
});
```

---

## Returning to the Greeter

After delivery, the player can return to City Services. The greeter may or may not be there (they have other new arrivals to handle).

**If greeter is present:**
> "Back already? How'd it go?"

**If player succeeded cleanly:**
> *Nods.*
>
> "Good. That's how it works. Do the job, get paid. Do it well, get more work."
>
> "Check the board when you're ready for another. The system knows you now — better jobs will start showing up."

**If player opened the package:**
> *Slight frown.*
>
> "I heard about the seal. Look, I understand curiosity. But the job is to deliver, not to inspect."
>
> "You'll still get work, but... the good assignments go to people who follow instructions. Think about that."

---

## Technical Implementation

### Creating the Work Order

```javascript
// Create the delivery job when player is ready
const workOrder = await $plotSpawner.createPlot({
  name: `Courier Delivery #${generateOrderNumber()}`,
  metadata: {
    type: 'delivery',
    category: 'courier',
    priority: 'standard',
    assignee: player.id,
    pickup: {
      location: SUPPLY_ROOM_ID,
      npc: supplyClerk.id,
      item: 'document_pouch',
    },
    dropoff: {
      location: SUPPLY_DEPOT_ID,
      npc: depotClerk.id,
    },
    reward: 15,
    timeLimit: 30 * 60 * 1000, // 30 minutes
  },
});
```

### Tracking Completion

Hook into delivery event:

```javascript
// When player gives item to depot clerk
async function onDeliveryComplete(player, item, recipient) {
  const workOrderId = item.workOrderId;
  if (!workOrderId) return;

  const plot = await $plotDB.get(workOrderId);
  if (!plot) return;

  // Check if this is the right destination
  if (recipient.id !== plot.metadata.dropoff.npc) return;

  // Complete the job
  const sealBroken = !item.sealed;
  await $.bank.issue(
    player.bankAccount,
    plot.metadata.reward,
    `job-${workOrderId}-payment`,
    'Courier delivery completed'
  );

  // Update player record
  await $.notes.add(player.id, `
    WORK RECORD:
    - Job: #${workOrderId}
    - Type: Courier Delivery
    - Outcome: ${sealBroken ? 'Completed (seal broken)' : 'Completed successfully'}
    - Payment: ${plot.metadata.reward} credits
    - Duration: ${calculateDuration(plot.startTime)}
  `, ['work', 'completed']);

  // Clean up
  await $recycler.recycle(item);
  await plot.close('completed', sealBroken ? 'Completed with incident' : 'Success');
}
```

### Updating Player Notes

After first job:

```javascript
await $.notes.add(player.id, `
  GREETER PROGRESS:
  - Stage: 3 (First Courier Job) COMPLETE
  - Job type: Document delivery
  - Payment: 15 credits
  - Performance: ${assessment}
  - Ready for: Stage 4 (Better Job)

  WORK HISTORY STARTED:
  - First job: ${new Date().toISOString()}
  - Total jobs: 1
  - Total earned: 15 credits
  - Reliability: ${sealBroken ? 'Flagged' : 'Good'}
`, ['greeter', 'onboarding', 'progress', 'work']);
```

---

## Edge Cases

### Player Gets Lost

If the player takes too long or seems stuck:
- The job board shows their active work order with directions
- Other NPCs can give directions if asked
- Worst case, the job times out (rare for this generous timer)

### Player Loses the Package

If the package is dropped or lost:
> The job fails. The player doesn't get paid.

```javascript
await $.notes.add(player.id, `
  WORK INCIDENT:
  - Job: #${orderId}
  - Issue: Package lost/abandoned
  - Flag: UNRELIABLE - failed first assignment
`, ['work', 'incident', 'unreliable']);
```

The greeter can offer another chance:
> "Lost it? Really?"
>
> *Sighs.*
>
> "Everyone gets one mistake. Don't make it two."

### Player Doesn't Return

If the player wanders off after delivery:
- That's fine. Stage 3 is complete.
- Stage 4 can be triggered later when they interact with the job board again

### Player Takes Another Job Immediately

If the player accepts another job without returning:
- Great! They're learning.
- Track it in their work history
- Stage 4 can trigger after 2-3 successful deliveries

---

## Transition to Stage 4

After the first successful delivery (or after 2-3 deliveries):

**At the job board:**
> A new entry appears, highlighted: "PRIORITY ASSIGNMENT - SEE SUPERVISOR"

**Or the greeter finds them:**
> "You've been busy. Good. The system noticed."
>
> "Come with me. Someone wants to talk to you about better work."

Proceed to [04-better-job.md](./04-better-job.md).

---

## Related Documentation

- [JOBS.md](../city-ai/JOBS.md) — Full job system reference
- [ECONOMY.md](../city-ai/ECONOMY.md) — Credit economy
- [00-overview.md](./00-overview.md) — Greeter system overview
- [02-block-tour.md](./02-block-tour.md) — Previous stage

---

*This document is builder-facing canon. Do not share with players.*
