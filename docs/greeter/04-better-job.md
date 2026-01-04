# Stage 4: Better Job

The player has proven they can complete basic courier work. Now they're offered something with more responsibility, more pay, or more interest.

---

## Context

**Where this happens:** City Services or a new location (depending on job type)

**Trigger:** Completed 2-3 courier deliveries with good reliability

**State at start:**
- Player has work history (2-3 jobs completed)
- Player has earned 30-45 credits
- Player knows basic navigation
- Player understands the job system

**Goal:** Player experiences job variety and understands advancement is possible

---

## The Upgrade Meeting

### Setting Up the Meeting

After their initial courier work, the player gets noticed. This can happen several ways:

**Option A: Job Board Notification**
```
PRIORITY ASSIGNMENT AVAILABLE
Report to City Services Supervisor - Office 2B
Reference: Citizen Advancement Program
```

**Option B: Greeter Contact**
The greeter finds the player during their day:

> "Good timing. I've been looking for you."
>
> "Your work's been noticed. Someone wants to talk to you about more interesting assignments."

**Option C: Direct Approach from Supervisor**
A new NPC approaches the player:

> *A woman in a cleaner uniform approaches. Supervisor insignia on her collar.*
>
> "You're the new courier, right? [Player name]?"
>
> "I've seen your work logs. Clean deliveries. No incidents. That's rarer than you'd think."

---

## The Scene

### City Services Supervisor's Office

A small office with a desk, two chairs, and walls covered in schedules and status boards.

**Room Description:**
```
Supervisor's Office - 2B

A cramped office that manages to feel both efficient and tired. A metal
desk dominates the space, covered in tablets and paper schedules. Status
boards on the walls show colored pins marking something — deliveries,
personnel, who knows.

A window looks out onto the main City Services floor. The supervisor can
see everything from here.
```

### The Supervisor

**Supervisor's Notes (for AI prompt):**
```javascript
await $.notes.add(supervisor.id, `
  ROLE: City Services Work Supervisor
  NAME: Supervisor Chen

  CURRENT TASK: Evaluate ${player.name} for job advancement

  PLAYER PROFILE:
  - Completed ${jobCount} courier deliveries
  - Reliability: ${reliability}
  - Total earned: ${totalCredits} credits
  - No major incidents (or list incidents)

  DEMEANOR:
  - Practical, evaluating, slightly impressed
  - Sees potential but won't oversell
  - Making an investment decision

  JOB OPTIONS TO OFFER (pick one based on player profile):
  1. Maintenance Assistant - Physical work, regular hours, 25 cr/job
  2. Inventory Specialist - Counting, organizing, detail work, 20 cr/job
  3. Dispatch Courier - Priority deliveries, time-sensitive, 30 cr/job
  4. Security Support - Light patrol assistance, CorpSec contact, 35 cr/job

  GOAL: Assign player to a recurring role, not just one-off jobs
`, ['job', 'current']);
```

---

## Dialogue Script

### Opening

Supervisor reviews a tablet as the player enters:

> *Looks up. Gestures to a chair.*
>
> "Sit. I'm Chen. I manage work assignments for this sector."
>
> *Sets down the tablet.*
>
> "I've been watching the new arrivals. Most of them... adequate. Some of them useless. You're neither."

### The Evaluation

Supervisor asks questions to gauge the player:

> "Tell me — those deliveries you did. Any problems? Anything you'd do differently?"

**If player is honest about any issues:**
> *Nods slowly.*
>
> "Good. Self-awareness matters more than a perfect record."

**If player claims everything was perfect:**
> "Really? No delays? No getting lost? First day in the city and you knew exactly where everything was?"
>
> *Slight smile.*
>
> "Confidence is good. Overconfidence gets people killed."

### The Offer

Based on the player's profile and responses, Chen offers one of several job types:

#### Option 1: Maintenance Assistant

> "Fabrication Factory needs extra hands. Physical work — moving equipment, basic repairs, keeping the lines running."
>
> "Pays better than courier work. Twenty-five credits per shift. Regular hours. You work for Foreman Vasquez; she's tough but fair."
>
> "Interested?"

**What this teaches:**
- Factory environment and NPCs
- Physical labor mechanics (if any)
- Regular shift structure

#### Option 2: Inventory Specialist

> "Supply Depot is drowning in backlog. They need someone with attention to detail. Counting, organizing, making sure the manifests match reality."
>
> "Twenty credits per shift. More cerebral than hauling packages. You work with Depot Chief Morrison."
>
> "Think you can handle it?"

**What this teaches:**
- Supply chain structure
- Inventory systems
- A different workplace environment

#### Option 3: Dispatch Courier

> "You've proven you can deliver on time. The priority queue is for couriers we trust with time-sensitive materials."
>
> "Thirty credits per run. Tighter deadlines. More important packages. You report directly to Dispatch."
>
> "You up for the pressure?"

**What this teaches:**
- Higher stakes courier work
- Time pressure mechanics
- More valuable cargo

#### Option 4: Security Support

> "CorpSec is always understaffed. They need assistants — not armed patrol, but extra eyes. Checking IDs. Watching sectors. Reporting anomalies."
>
> "Thirty-five credits per shift. You'd shadow Sergeant Okonkwo. It's a foot in the door."
>
> "But you'd be on their radar. Good and bad comes with that."

**What this teaches:**
- CorpSec structure and culture
- Security perspective on the city
- Faction reputation building

---

## Player Choice

The player can:

1. **Accept the offered job** — Move forward with the specific role
2. **Ask for a different option** — Supervisor may offer alternatives if available
3. **Decline for now** — Supervisor notes the hesitation but doesn't push

### If Player Accepts

> "Good. You start tomorrow. Report to [location] at [time]. Don't be late."
>
> *Hands over a small card.*
>
> "This is your work authorization. Show it when you arrive. They're expecting you."

```javascript
// Create recurring work assignment
await $.notes.add(player.id, `
  WORK ASSIGNMENT:
  - Type: ${jobType}
  - Supervisor: ${supervisorName}
  - Location: ${workLocationId}
  - Rate: ${payRate} credits/shift
  - Status: Active
  - Started: ${new Date().toISOString()}
`, ['work', 'assignment', 'active']);
```

### If Player Asks for Alternatives

> *Considers.*
>
> "Fair enough. Let me see what else is available."
>
> *Checks tablet.*
>
> "[Alternative option description]. That more your speed?"

### If Player Declines

> *Neutral expression.*
>
> "Your choice. The courier queue is still open. But don't expect advancement if you don't take opportunities when they come."
>
> "Door's open if you change your mind."

```javascript
await $.notes.add(player.id, `
  ADVANCEMENT NOTE:
  - Offered: ${jobType}
  - Response: Declined
  - Supervisor assessment: Hesitant, possibly unfocused
  - Next opportunity: After further courier work or time
`, ['work', 'advancement', 'declined']);
```

---

## The First Shift

After accepting, the player should experience their new role:

### Reporting to the New Location

The player goes to their assigned workplace. A new NPC (the direct supervisor) greets them:

**Foreman Vasquez (Factory):**
> *Looks the player up and down.*
>
> "New assistant? You're smaller than I expected."
>
> "Don't worry, the machines do the heavy lifting. Your job is keeping them fed. Come on."

**Depot Chief Morrison (Inventory):**
> "Chen sent you? Good. We're three days behind on manifests."
>
> *Hands over a tablet.*
>
> "Section C. Count everything. Flag discrepancies. Don't touch anything marked red."

**Dispatch Coordinator (Priority Courier):**
> "Priority deliveries. Time matters. Package gets there late, you explain why."
>
> *Slides a sealed envelope across the counter.*
>
> "First run. Medical supplies to the clinic. Twenty minutes. Clock starts now."

**Sergeant Okonkwo (Security Support):**
> "Support role means you watch, listen, and report. You don't engage, you don't confront, you don't act without my say-so."
>
> "Clear?"
>
> "Good. We're doing a sweep of the market district. Stay close."

### Completing the First Shift

The player performs their assigned tasks. This should be:
- Slightly more complex than courier work
- Introducting new NPCs and locations
- Paying better than basic courier
- Teaching something new about the city

### Getting Paid

At the end of the shift:

```javascript
await $.bank.issue(
  player.bankAccount,
  payRate,
  `shift-${shiftId}-payment`,
  `${jobType} shift completed`
);
```

---

## Technical Implementation

### Tracking Eligibility

Check if player qualifies for advancement:

```javascript
async function checkAdvancementEligibility(player) {
  const workHistory = await $.notes.get(player.id, ['work', 'completed']);
  const completedJobs = workHistory.filter(n =>
    n.tags.includes('completed') &&
    !n.tags.includes('incident')
  );

  return {
    eligible: completedJobs.length >= 2,
    jobCount: completedJobs.length,
    reliability: calculateReliability(workHistory),
  };
}
```

### Creating Work Assignment

```javascript
async function assignRecurringWork(player, jobType, supervisor) {
  // Create assignment record
  const assignment = {
    type: jobType,
    assignee: player.id,
    supervisor: supervisor.id,
    location: getJobLocation(jobType),
    payRate: getPayRate(jobType),
    startDate: new Date().toISOString(),
    status: 'active',
  };

  // Store in player notes
  await $.notes.add(player.id, `
    WORK ASSIGNMENT: ${JSON.stringify(assignment)}
  `, ['work', 'assignment', 'active', jobType]);

  // Notify the supervisor NPC
  await $.notes.add(supervisor.id, `
    NEW WORKER ASSIGNED:
    - Name: ${player.name}
    - Position: ${jobType}
    - Start: Tomorrow
    - Notes: New citizen, proven on courier work
  `, ['staff', 'new-hire']);

  return assignment;
}
```

### Updating Player Progress

```javascript
await $.notes.add(player.id, `
  GREETER PROGRESS:
  - Stage: 4 (Better Job) COMPLETE
  - Job type: ${jobType}
  - Location: ${locationName}
  - Rate: ${payRate} credits/shift
  - Status: First shift completed
  - Ready for: Stage 5 (Housing)
`, ['greeter', 'onboarding', 'progress']);
```

---

## Edge Cases

### Player Has Incidents on Record

If the player opened packages or had other issues:

> "I see a note here about... an incident. A package that was opened?"
>
> *Looks at the player.*
>
> "That's going to limit your options. The trust-dependent jobs aren't available. But if you're willing to work..."
>
> *Offers physical labor option instead.*

### Player Doesn't Show for First Shift

If the player accepts but doesn't report:

```javascript
await $.notes.add(player.id, `
  WORK INCIDENT:
  - Assignment: ${jobType}
  - Issue: No-show on first shift
  - Flag: UNRELIABLE - failed to report for assigned work
  - Status: Assignment voided
`, ['work', 'incident', 'no-show']);
```

Supervisor Chen sends a message:

> "You didn't show. Assignment voided. Back to courier work for you."
>
> "Don't waste opportunities."

### Player Wants to Stay Courier

If the player prefers courier work:

> "Your choice. Some people like the variety. The priority queue pays better, at least."
>
> "Come back when you want something more."

---

## Transition to Stage 5

After completing their first few shifts in the new role:

**Supervisor (or greeter) mentions housing:**
> "You're settling in. Good. Time to think about permanent housing."
>
> "The dormitory is fine for now, but if you're serious about staying... you want your own space."

**Or housing clerk approaches:**
> "I saw your work record. You've got steady employment now. That qualifies you for housing allocation."
>
> "Want me to show you the options?"

Proceed to [05-housing.md](./05-housing.md).

---

## Related Documentation

- [JOBS.md](../city-ai/JOBS.md) — Full job system reference
- [PLURIBUS.md](../city-ai/PLURIBUS.md) — The advancement system
- [00-overview.md](./00-overview.md) — Greeter system overview
- [03-courier-job.md](./03-courier-job.md) — Previous stage

---

*This document is builder-facing canon. Do not share with players.*
