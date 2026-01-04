# Continuum Stage 5: Housing

The player gets their own place. No more dormitory.

---

## Context

**Trigger:** Stage 4 (Employment) complete

**Player State:**
- Has just accepted permanent employment
- Has been sleeping in the dormitory
- Has earned 15+ credits from first job
- Employment status qualifies them for housing

**Goal:** Player gets assigned housing

---

## The NPC: Housing Clerk

A bureaucrat at City Services who handles housing allocation.

**Inject into NPC prompt:**
```
You are a housing clerk helping ${player.name} get assigned housing.

PLAYER RECORD:
- Employment: ${position} at ${workplace}
- Duration: ${employmentDuration}
- Credits: ${balance}
- Work record: ${workRecord}

YOUR APPROACH:
- This is paperwork, not a celebration
- Explain options clearly
- Housing is a privilege, not a right
- They're getting what they've earned

HOUSING OPTIONS:
New employees get starter housing:
- Shared Room: 25 credits/month, 2-4 people, door that locks
- Private Room: 50 cr/mo (if they ask nicely or have extra credits)

Grant them a year on the rent — standard new citizen benefit.
They can upgrade later as they save.
```

---

## Dialogue Patterns

### Checking eligibility

> "Employment confirmed. You qualify for housing. Let's get you set up."

### Explaining options

**Shared Room:**
> "Shared room in Smith Tower. Two to four people, but walls and a door that locks. Twenty-five per month."

**Private Room (if available):**
> "Private room. Just you. Fifty per month. Worth it if you value quiet."

### After they choose

> "Good. You get a year covered as a new citizen benefit. After that, rent comes out of your pay. Here's your access code."

---

## Actions to Take

### Assign housing

The AI picks an available unit and grants access:

```javascript
// Find available housing at appropriate tier
// For Smith Tower or similar locations with rentable locks:

const lock = await $load(UNIT_LOCK_ID);

// Grant a year of access
await lock.rent(player, 365 * 24 * 60 * 60 * 1000);

// Record the assignment
await $.notes.add(player.id, `
  HOUSING ASSIGNMENT:
  - Tier: ${tier}
  - Location: ${unitName}
  - Unit: ${unitId}
  - Monthly cost: ${cost} credits
  - Access granted: 1 year
  - Assigned: ${new Date().toISOString()}
`, ['housing', 'active']);
```

### For simpler housing (no coded lock)

```javascript
// Just record that they have housing
await $.notes.add(player.id, `
  HOUSING ASSIGNMENT:
  - Tier: ${tier}
  - Location: Building 7, Room 4
  - Monthly cost: 25 credits
  - Roommates: Dex (night shift), Jules (day shift)
  - Assigned: ${new Date().toISOString()}
`, ['housing', 'active']);

// The AI remembers this and treats them as living there
```

### Set up rent (if needed)

```javascript
// If using scheduler for rent collection:
await $.scheduler.schedule(
  `rent-${player.id}`,
  daysUntilMonthEnd() * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000, // monthly
  $.bank,
  'burn',
  player.bankAccount,
  cost,
  `rent-${Date.now()}`,
  'Monthly housing rent'
);
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Continuum
  - Stage 5: Housing - COMPLETE
  - Tier: ${tier}
  - Location: ${unitName}
  - Cost: ${cost} credits/month
  - Next: Stage 6 (Workplace assignment)
`, ['onboarding', 'continuum', 'progress']);
```

---

## Edge Cases

### Player asks about better housing

> "Private rooms are available. Fifty per month. Want me to check availability?"
> They can upgrade if they want.

### Player asks about the free year

> "New citizen benefit. Pluribus invests in productive citizens. After the year, you pay from your wages."

### Player asks about skipping rent

> "Miss payments and you lose the assignment. Back to the dormitory."
> The system doesn't offer mercy.

---

## Next Stage

Once housed:

> "You've got a place now. Stability helps. Now let's make your work situation permanent."

Proceed to [06-workplace.md](./06-workplace.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
