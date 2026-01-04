# Stage 6: Permanent Employment

The player transitions from shift work to a permanent position with a fixed workplace and regular duties.

---

## Context

**Where this happens:** Current workplace or City Services

**Trigger:** Stage 5 complete, player has stable housing and work history

**State at start:**
- Player has been doing shift work for 1-2 weeks (game time)
- Player has stable housing
- Player has accumulated 100+ credits
- Player has a good work record

**Goal:** Player is assigned to a permanent workplace with defined responsibilities

---

## The Difference

### Shift Work vs. Permanent Employment

**Shift Work (Stages 3-4):**
- Pick up jobs when available
- Work for different supervisors
- Pay varies by job
- No guaranteed hours
- No seniority or advancement

**Permanent Employment (Stage 6):**
- Assigned to a specific location
- Work for one supervisor
- Fixed pay schedule
- Regular hours expected
- Path to advancement
- Benefits (better housing access, priority rations)

---

## The Offer

### How It Happens

The offer comes from the player's current work supervisor:

**Foreman Vasquez (Factory):**
> "You've been consistent. That counts for something in this place."
>
> *Leans against a support beam.*
>
> "I've got an opening on the floor crew. Permanent. Same work you've been doing, but it's yours. Steady pay, regular hours."

**Depot Chief Morrison (Inventory):**
> "Your counts have been accurate. We don't see that often."
>
> *Sets down a tablet.*
>
> "I need a permanent inventory specialist. Someone I don't have to double-check. Interested?"

**Dispatch Coordinator (Courier):**
> "You've never missed a deadline. That's rare."
>
> "I want you on the priority roster full-time. Permanent position. Better assignments, better pay, and your name goes on the trusted list."

**Sergeant Okonkwo (Security):**
> "You've got good instincts. You pay attention."
>
> *Pauses.*
>
> "CorpSec is offering support positions to qualified citizens. Not patrol — that requires training. But checkpoint operations, sector monitoring. Steady work, good pay."

---

## The Scene

### The Formal Offer

After the initial approach, there's a formal meeting. This can happen in an office or at the workplace.

**Supervisor's Notes (for AI prompt):**
```javascript
await $.notes.add(supervisor.id, `
  CURRENT TASK: Permanent Employment Offer
  Player: ${player.name} (#${player.id})

  EMPLOYMENT HISTORY:
  - Type: ${currentJobType}
  - Duration: ${workDuration}
  - Performance: ${performanceRating}
  - Incidents: ${incidents || 'None'}

  OFFER DETAILS:
  - Position: ${positionTitle}
  - Location: ${workplaceLocation}
  - Rate: ${payRate} credits per shift
  - Schedule: ${schedule}
  - Supervisor: ${supervisorName}

  DEMEANOR:
  - This is an investment decision
  - Explaining benefits and expectations
  - Wants commitment in return

  KEY POINTS TO COVER:
  - Regular schedule (when to report)
  - Pay structure (shift rate vs. monthly)
  - Expectations (attendance, performance)
  - Benefits (housing priority, ration upgrades)
  - Consequences (what happens if they fail)
`, ['job', 'offer']);
```

### Dialogue Script

**Opening:**
> "Let me explain what permanent employment means."
>
> *Sits down. Gestures for the player to sit.*
>
> "Right now, you're shift work. You show up, you work, you get paid. No guarantees."

**The Offer:**
> "Permanent means you belong here. This is your workplace. I'm your supervisor. Your schedule is set."
>
> "In return, I expect you here. On time. Every shift. No excuses."

**The Benefits:**
> "What you get: steady credits. Priority for housing upgrades — the Housing Office looks at permanent employees first. Better ration access. And after six months, you qualify for vacation credits."
>
> *Slight smile.*
>
> "That last one matters more than you think."

**The Expectations:**
> "What I expect: show up. Do your job. Don't cause problems. If something goes wrong, tell me first — not after it's too late."
>
> "Miss shifts without notice, and you're out. Back to the pickup queue. Clear?"

**The Question:**
> "So. Are you in, or are you out?"

---

## Player Response

### If Player Accepts

> "Good choice."
>
> *Pulls out paperwork or a tablet.*
>
> "Sign here. This registers you as permanent staff. Your schedule starts [tomorrow/next shift cycle]."
>
> *After signing:*
>
> "Welcome to the team. Don't make me regret this."

```javascript
// Create permanent employment record
await $.notes.add(player.id, `
  EMPLOYMENT STATUS: PERMANENT
  - Position: ${positionTitle}
  - Location: ${workplaceId}
  - Supervisor: ${supervisor.id}
  - Start date: ${new Date().toISOString()}
  - Schedule: ${scheduleDetails}
  - Pay rate: ${payRate} credits/shift
  - Status: Active
`, ['employment', 'permanent', 'active']);

// Register with workplace
const workplace = await $load(workplaceId);
workplace.employees = workplace.employees || [];
workplace.employees.push({
  id: player.id,
  position: positionTitle,
  startDate: new Date().toISOString(),
  status: 'active',
});
```

### If Player Asks Questions

**"What if I need to miss a shift?"**
> "Tell me in advance. We can work around planned absences. Unplanned? You better have a good reason, and you better tell me as soon as possible."

**"Can I still take other jobs?"**
> "On your off hours, if you have the energy. But your primary obligation is here. If I find out you're too tired to work because you're moonlighting, we have a problem."

**"What's the pay exactly?"**
> "[X] credits per shift. Shifts are [duration]. You work [number] shifts per week. Do the math."

**"What happens if things don't work out?"**
> "First time, we talk. Second time, you're on probation. Third time, you're back to shift work with a note in your file."
>
> "Don't let it get to that."

### If Player Declines

> *Neutral expression.*
>
> "Your choice. The offer's not permanent though. Someone else will take it."
>
> "Come back when you're ready to commit."

```javascript
await $.notes.add(player.id, `
  EMPLOYMENT NOTE:
  - Offered: Permanent position at ${workplaceName}
  - Response: Declined
  - Reason: ${reason || 'Not stated'}
  - Next opportunity: Unclear - may need to rebuild trust
`, ['employment', 'declined']);
```

---

## The Workplace Assignment

### Assigning to a Location

Each permanent employee is tied to a specific location in the game world:

**Factory Workers:**
- Fabrication Factory (-20 to -18, +8 to +11)
- Specific work station or section
- Foreman Vasquez's crew

**Supply Workers:**
- Supply Depot (-21, -5)
- Assigned section (Receiving, Inventory, Dispatch)
- Chief Morrison's team

**Priority Couriers:**
- Dispatch Hub at City Services
- Access to priority job queue
- Higher-value deliveries

**Security Support:**
- Assigned checkpoint or sector
- Rotation with other support staff
- Reports to Sergeant Okonkwo

### The Workplace as Home Base

Once assigned, the workplace becomes a second home:

```javascript
// Player can return to their workplace
player.workplace = workplaceId;

// NPCs at the workplace know them
await $.notes.add(coworkerA.id, `
  COWORKER NOTE:
  - ${player.name} is now permanent staff
  - Position: ${positionTitle}
  - Impression: New but seems okay
`, ['social', 'coworker']);
```

---

## First Day as Permanent Staff

### Reporting In

The player arrives for their first official shift:

**Supervisor greeting:**
> "You're here. Good start."
>
> *Hands over something — a badge, a tool, a tablet.*
>
> "This is yours now. Don't lose it."
>
> "[Explanation of the tool/badge for their role]"

### The Work

The player performs their duties. This should feel slightly different from shift work:

- They have a specific station/area
- Coworkers acknowledge them by name
- The supervisor checks in but doesn't hover
- There's a sense of routine forming

### End of Shift

> *Supervisor nods as they leave.*
>
> "Same time tomorrow. Good work."

---

## Technical Implementation

### Employment Registration

```javascript
async function registerPermanentEmployee(player, workplace, position, supervisor) {
  // Create employment record
  const employment = {
    type: 'permanent',
    position,
    workplaceId: workplace.id,
    supervisorId: supervisor.id,
    startDate: new Date().toISOString(),
    schedule: generateSchedule(position),
    payRate: getPayRate(position),
    status: 'active',
    probation: false,
  };

  // Store in player notes
  await $.notes.add(player.id, `
    PERMANENT EMPLOYMENT: ${JSON.stringify(employment)}
  `, ['employment', 'permanent', 'active']);

  // Update workplace roster
  workplace.roster = workplace.roster || [];
  workplace.roster.push(player.id);

  // Notify housing of status change
  await $.notes.add(HOUSING_OFFICE_ID, `
    EMPLOYMENT STATUS UPDATE:
    - Citizen: ${player.name} (#${player.id})
    - Status: Permanent employee
    - Workplace: ${workplace.name}
    - Implication: Priority housing eligibility
  `, ['housing', 'employment-update']);

  return employment;
}
```

### Shift Scheduling

```javascript
// Schedule regular shifts for permanent employees
async function scheduleShifts(player, employment) {
  const schedule = employment.schedule;

  // Create recurring shift reminders
  for (const shift of schedule.weekly) {
    await $.scheduler.schedule(
      `shift-${player.id}-${shift.day}`,
      calculateNextOccurrence(shift),
      7 * 24 * 60 * 60 * 1000, // Weekly
      player,
      'notifyShift',
      employment.workplaceId,
      shift
    );
  }
}

// Track attendance
async function recordAttendance(player, shift, status) {
  await $.notes.add(player.id, `
    ATTENDANCE:
    - Date: ${new Date().toISOString()}
    - Shift: ${shift.day} ${shift.time}
    - Status: ${status} // 'present', 'late', 'absent', 'excused'
    - Workplace: ${employment.workplaceId}
  `, ['employment', 'attendance', status]);
}
```

### Updating Player Progress

```javascript
await $.notes.add(player.id, `
  GREETER PROGRESS:
  - Stage: 6 (Permanent Employment) COMPLETE
  - Position: ${positionTitle}
  - Workplace: ${workplaceName}
  - Supervisor: ${supervisorName}
  - Schedule: ${scheduleDescription}
  - Ready for: Stage 7 (Payment System)
`, ['greeter', 'onboarding', 'progress']);
```

---

## Edge Cases

### Player Has Poor Work Record

If the player has incidents or missed shifts:

> "I've been watching your work. It's... inconsistent."
>
> *Pauses.*
>
> "Normally, I'd offer you permanent. But with your record, I'm not sure you're ready."
>
> "Prove me wrong. Another two weeks of clean work, and we'll talk again."

### Player Already Has Two Jobs

If the player is working multiple positions:

> "I see you're already doing shifts at [other location]. That's going to be a problem."
>
> "Permanent means primary. You can't split your attention. Pick one."

### Player Quits After Accepting

If the player stops showing up:

```javascript
async function handleAbandonedPosition(player, employment) {
  // Mark as terminated
  employment.status = 'terminated';
  employment.terminationReason = 'abandoned';
  employment.terminationDate = new Date().toISOString();

  // Update notes
  await $.notes.add(player.id, `
    EMPLOYMENT TERMINATED:
    - Position: ${employment.position}
    - Reason: Abandoned - no-show without notice
    - Date: ${employment.terminationDate}
    - Impact: Work record flagged, housing status at risk
  `, ['employment', 'terminated', 'abandoned']);

  // Notify housing
  await $.notes.add(HOUSING_OFFICE_ID, `
    EMPLOYMENT ALERT:
    - Citizen: ${player.name}
    - Issue: Terminated from permanent position (abandoned)
    - Housing implications: Review eligibility
  `, ['housing', 'alert']);
}
```

---

## Transition to Stage 7

Once the player has worked a few permanent shifts:

**Supervisor mentions pay:**
> "Payday is coming up. You know how the system works?"
>
> "Credits hit your account at the end of each week. Automatic. Just make sure you understand your deductions."

**Or payroll clerk contacts:**
> "New permanent employee? Let me make sure your pay is set up correctly."
>
> "Come by the payroll office. I'll walk you through it."

Proceed to [07-payment-system.md](./07-payment-system.md).

---

## Related Documentation

- [JOBS.md](../city-ai/JOBS.md) — Job system reference
- [PLURIBUS.md](../city-ai/PLURIBUS.md) — Citizenship advancement
- [00-overview.md](./00-overview.md) — Greeter system overview
- [05-housing.md](./05-housing.md) — Previous stage

---

*This document is builder-facing canon. Do not share with players.*
