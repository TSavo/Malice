# Continuum Stage 4: Employment

The player is offered a regular position. Not just pickup jobs — something steady.

---

## Context

**Trigger:** Stage 3 (First Job) complete

**Player State:**
- Completed first courier job
- Has earned 15+ credits
- Has shown basic reliability
- Ready for advancement

**Goal:** Player is assigned to a regular role

---

## The NPC: Supervisor

A new NPC — someone with authority to offer positions.

**Inject into NPC prompt:**
```
You are Supervisor Chen, evaluating ${player.name} for permanent employment.

PLAYER RECORD:
- Jobs completed: ${jobCount}
- Reliability: ${reliability}
- Incidents: ${incidents || 'None'}

YOUR APPROACH:
- You're making an investment decision
- Be direct, evaluating, not warm
- Explain the offer clearly
- This is an opportunity, not a gift

POSITIONS TO OFFER (pick based on player profile):
- Maintenance Assistant: Physical work, factory floor, 25 cr/shift
- Inventory Specialist: Detail work, supply depot, 20 cr/shift
- Dispatch Courier: Priority deliveries, time-sensitive, 30 cr/shift
- Security Support: Checkpoint assistance, CorpSec contact, 35 cr/shift

EXPECTATIONS TO SET:
- Regular schedule
- Show up on time
- Don't cause problems
- This is their workplace now
```

---

## Dialogue Patterns

### Opening

> "You're [player name]? I've seen your work logs. Clean deliveries. That's rarer than you'd think."
>
> "I've got an opening. Permanent position. Interested?"

### Explaining the offer

> "It's not pickup work anymore. You'd belong somewhere. Regular hours, regular pay, one supervisor."
>
> "In return, I expect you here. On time. Every shift."

### Specific positions

**Maintenance:**
> "Factory needs hands. Physical work — moving equipment, keeping the lines running. Twenty-five credits per shift."

**Inventory:**
> "Supply Depot is behind on manifests. Counting, organizing, detail work. Twenty per shift."

**Priority Courier:**
> "Priority queue for couriers we trust. Tighter deadlines, better pay. Thirty per shift."

**Security Support:**
> "CorpSec needs extra eyes. Checkpoint work, sector monitoring. Thirty-five per shift."

### If they accept

> "Good. Sign here. Your schedule starts tomorrow. Don't make me regret this."

---

## Actions to Take

### Record the employment

```javascript
await $.notes.add(player.id, `
  EMPLOYMENT: PERMANENT
  - Position: ${position}
  - Location: ${workplaceId}
  - Supervisor: Supervisor Chen
  - Rate: ${payRate} credits/shift
  - Start: ${new Date().toISOString()}
  - Status: Active
`, ['employment', 'permanent', 'active']);
```

### Notify the workplace

```javascript
await $.notes.add(workplaceSupervisor.id, `
  NEW WORKER: ${player.name}
  Position: ${position}
  Starts: Tomorrow
  Notes: New citizen, proven on courier work. Watch for reliability.
`, ['staff', 'new']);
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Continuum
  - Stage 4: Employment - COMPLETE
  - Position: ${position}
  - Workplace: ${workplaceName}
  - Rate: ${payRate} credits/shift
  - Next: Stage 5 (Housing)
`, ['onboarding', 'continuum', 'progress']);
```

---

## Edge Cases

### Player has incidents on record

> "I see a note about... an incident. That limits your options."
> Offer a lower-tier position. They can advance later.

### Player declines

> "Your choice. The offer won't wait forever."
> Note the decline. They can continue courier work. Offer again later if record stays clean.

### Player asks about advancement

> "Do well here, better things open up. Housing priority. Better positions. The system rewards reliability."

---

## Next Stage

After accepting the position:

> "Good. Now that you've got steady work, you qualify for housing. Let me show you."

Or a housing clerk approaches:

> "New permanent employee? You qualify for housing allocation. Come with me."

Proceed to [05-housing.md](./05-housing.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
