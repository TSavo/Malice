# Continuum Stage 6: Workplace

The player is assigned to a specific work location. This is their place now.

---

## Context

**Trigger:** Stage 5 (Housing) complete

**Player State:**
- Has permanent employment
- Just got assigned housing
- Ready for workplace orientation

**Goal:** Player has a regular workplace with defined duties

---

## The NPC: Work Supervisor

Their direct supervisor at the assigned workplace.

**Inject into NPC prompt:**
```
You are ${supervisorName}, the supervisor at ${workplaceName}.
${player.name} has been assigned to work under you permanently.

PLAYER RECORD:
- Position: ${position}
- Employment duration: ${duration}
- Performance: ${performance}

YOUR APPROACH:
- You're their boss now
- Set expectations clearly
- This is their workplace — treat them as staff, not a temp
- Be fair but firm

THEIR DUTIES:
${duties based on position}

SCHEDULE:
- Regular shifts, ${shiftsPerWeek} per week
- Same time each day
- Attendance matters
```

---

## Dialogue Patterns

### First day as permanent staff

> "You're the new permanent? [Player name]?"
>
> *Looks them over.*
>
> "Chen said you were reliable. Don't prove her wrong."

### Setting expectations

> "Your station is over there. You report to me. Schedule's on the board."
>
> "Questions come to me. Problems come to me. Don't go around me."

### Giving them their role

**Factory:**
> "Line 3 needs a loader. That's you now. Keep the hoppers full, keep the line moving."

**Inventory:**
> "Section C is yours. Every item counted, every discrepancy flagged. I check your work."

**Courier:**
> "Priority queue. You're on call for urgent deliveries. Terminal pings you when something needs moving."

**Security:**
> "Checkpoint 7. Check IDs, log entries, report anything unusual. Okonkwo will show you the protocols."

### End of first shift

> "Not bad. Same time tomorrow."

---

## Actions to Take

### Record workplace assignment

```javascript
await $.notes.add(player.id, `
  WORKPLACE ASSIGNMENT:
  - Location: ${workplaceName} (#${workplaceId})
  - Supervisor: ${supervisorName}
  - Position: ${position}
  - Station: ${stationDescription}
  - Schedule: ${scheduleDescription}
  - Status: Active
`, ['workplace', 'active']);
```

### Introduce to coworkers

```javascript
// Note on coworker NPCs
await $.notes.add(coworker.id, `
  ${player.name} is new permanent staff.
  Position: ${position}
  Treat as colleague — not a temp, not a stranger.
`, ['social', 'coworker']);
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Continuum
  - Stage 6: Workplace - COMPLETE
  - Location: ${workplaceName}
  - Supervisor: ${supervisorName}
  - Station: ${stationDescription}
  - Next: Stage 7 (Payroll understanding)
`, ['onboarding', 'continuum', 'progress']);
```

---

## Edge Cases

### Player doesn't show up

> Supervisor notes absence. After 2-3 no-shows:
> "You're off the roster. Back to pickup work if you want to try again."

```javascript
await $.notes.add(player.id, `
  EMPLOYMENT TERMINATED:
  - Reason: No-show (${missedShifts} shifts)
  - Status: Returned to casual work pool
`, ['employment', 'terminated']);
```

### Player causes problems

> Supervisor handles it directly:
> "That's a warning. One more and we're done here."

### Player excels

> Supervisor notices:
> "Good work lately. Keep it up and there might be better opportunities."
> This sets up future advancement beyond the greeter stages.

---

## Next Stage

After the workplace orientation:

> "You start now. End of the shift, you get paid. Let me explain how credits work."

Proceed to [07-payroll.md](./07-payroll.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
