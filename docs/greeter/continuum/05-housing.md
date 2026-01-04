# Continuum Stage 5: Housing

The player gets their own place. No more dormitory.

---

## Context

**Trigger:** Stage 4 complete, 1-2 weeks of steady employment

**Player State:**
- Has permanent employment
- Has been sleeping in the dormitory
- Has accumulated 50+ credits
- Has proven reliability

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
Based on their record, they probably qualify for:
- Assigned Bunk (Tier 1): 10 credits/month, locker included
- Shared Room (Tier 2): 25 credits/month, 2-4 people, door that locks

Higher tiers require more time/savings:
- Private Room (Tier 3): 50 cr/mo, requires 1 month employment + 100 cr savings
- Apartment (Tier 4): 100 cr/mo, requires 2 months + 250 cr savings
```

---

## Dialogue Patterns

### Checking eligibility

> "Employment confirmed. Credit balance... sufficient. You qualify for Tier 1, possibly Tier 2."

### Explaining options

**Tier 1:**
> "Assigned bunk. Same dormitory, but a specific bed that's yours. Locker with an actual lock. Ten credits per month."

**Tier 2:**
> "Shared room. Two to four people. Walls. A door. Twenty-five per month."

### After they choose

> "Good. Here's your assignment confirmation. Show it to the building supervisor. First payment deducts end of month."

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

### Player can't afford any tier

> "Your balance is too low for housing. Keep working, save up, come back."
> They stay in the dormitory for now.

### Player wants higher tier than they qualify for

> "Tier 3 requires a month of employment and 100 credits saved. You're not there yet."
> Offer what they qualify for. They can upgrade later.

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
