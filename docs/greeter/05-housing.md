# Stage 5: Housing

With steady employment established, the player qualifies for permanent housing. A place of their own.

---

## Context

**Where this happens:** Housing Office at City Services

**Trigger:** Stage 4 complete, player has recurring work assignment

**State at start:**
- Player has steady employment
- Player has been sleeping in the dormitory
- Player has accumulated some credits (50+ typically)
- Player is a known, reliable citizen

**Goal:** Player gets assigned personal housing, understands the housing tier system

---

## The Housing System

### Housing Tiers

Pluribus allocates housing based on citizen status and work record:

| Tier | Type | Monthly Cost | Features |
|------|------|--------------|----------|
| 0 | Dormitory | Free | Shared bunks, no privacy, basic security |
| 1 | Assigned Bunk | 10 credits | Specific bunk, storage locker, same roommates |
| 2 | Shared Room | 25 credits | Room with 2-4 people, shared bathroom |
| 3 | Private Room | 50 credits | Solo room, shared bathroom down the hall |
| 4 | Apartment | 100 credits | Private unit with bathroom, small kitchen |
| 5 | Premium | 200+ credits | Larger unit, better location, amenities |

New arrivals start at Tier 0. This stage advances them to Tier 1 or 2.

### Housing Requirements

To advance tiers, citizens need:
- **Tier 1:** Any registered employment
- **Tier 2:** 2+ weeks of employment, positive work record
- **Tier 3:** 1+ month of employment, savings of 100+ credits
- **Tier 4:** 2+ months of employment, savings of 250+ credits
- **Tier 5:** Special circumstances, management approval

---

## The Scene

### Housing Office

A room in City Services with a counter, waiting chairs, and wall screens showing available units.

**Room Description:**
```
Housing Office

A functional space with plastic chairs along one wall and a service counter
along the other. Screens above the counter display scrolling lists of
available units — most marked "ALLOCATED" or "PENDING."

A tired clerk processes the endless stream of applications. A sign reads:
"HOUSING IS A PRIVILEGE, NOT A RIGHT. MAINTAIN YOUR ELIGIBILITY."
```

### The Housing Clerk

**Clerk's Notes (for AI prompt):**
```javascript
await $.notes.add(housingClerk.id, `
  ROLE: Housing Allocation Clerk
  NAME: Clerk Reyes

  CURRENT CASE: ${player.name}
  - Employment: ${employmentStatus}
  - Current housing: Dormitory (Tier 0)
  - Credits: ${balance}
  - Work record: ${workRecord}

  ELIGIBLE FOR:
  - Tier 1 (Assigned Bunk): Yes
  - Tier 2 (Shared Room): ${tier2Eligible ? 'Yes' : 'Not yet - needs more time'}

  DEMEANOR:
  - Overworked, efficient, not unkind
  - Explains options clearly
  - Pushes paperwork, doesn't make promises
  - Knows the system better than most

  HOUSING AVAILABLE:
  - Tier 1: Several bunks in Dormitory Block C
  - Tier 2: One shared room in Residential Building 7, needs roommate
`, ['job', 'current']);
```

---

## Dialogue Script

### Opening

Player enters the Housing Office. The clerk looks up from paperwork:

> "Housing inquiry? Take a number."
>
> *Glances at the empty waiting area.*
>
> "Actually, just come up. Slow day."

**When player approaches:**
> "Name and citizen ID?"
>
> *Types on a terminal.*
>
> "Let's see... New arrival. Dormitory assignment. Employment confirmed."
>
> *Looks up.*
>
> "You're here to upgrade?"

### The Assessment

The clerk reviews the player's record:

> "Work history looks good. Steady employment with [employer]. No major incidents."
>
> *Scrolls through something.*
>
> "Credit balance is... sufficient. You qualify for Tier 1 housing. Maybe Tier 2 if you're willing to share."

### Explaining Options

**Tier 1 - Assigned Bunk:**
> "Tier 1 is an assigned bunk. Same dormitory, but a specific bed that's yours. Nobody else uses it. You get a locker — actual lock, not just a hook."
>
> "Ten credits per month. Deducted automatically."

**Tier 2 - Shared Room:**
> "Tier 2 is a shared room. Two to four people, depending on the unit. Walls. A door. Still shared bathroom, but down the hall, not in the room."
>
> "Twenty-five credits per month. Better than it sounds."

**If Tier 2 isn't available:**
> "Tier 2 would require a roommate match, and nothing's open right now. Check back in a week."

### Player Questions

**"What's the difference, really?"**
> "Privacy. Security. The dormitory is open — anyone can walk through. An assigned bunk means your stuff stays where you put it. A room means nobody walks past you while you sleep."

**"How do I get to Tier 3 or 4?"**
> "Time and credits. Keep working, keep saving, keep your record clean. In a month or two, you'll qualify for a private room. After that... apartments are possible."

**"What if I can't pay?"**
> "You get a warning. Then another warning. Then you lose the assignment and go back to Tier 0."
>
> *Matter-of-fact.*
>
> "Don't miss payments."

**"What about living outside the system?"**
> *Slight pause.*
>
> "You mean the Underground? Abandoned buildings?"
>
> "That's... an option. Not one I can help you with. Not one I'd recommend."

### Making the Choice

**If player chooses Tier 1:**
> "Tier 1 it is. Block C, Bunk 27. I'll update your file."
>
> *Prints something.*
>
> "This is your assignment confirmation. Show it to the Block C supervisor. They'll point you to your bunk and locker."
>
> "First payment deducts at the end of the month."

**If player chooses Tier 2:**
> "Tier 2. Let me check roommate compatibility..."
>
> *Types for a moment.*
>
> "Building 7, Room 4. You'll be sharing with two others. Work schedules shouldn't overlap too badly."
>
> *Prints something.*
>
> "Same process — show this to the building supervisor. They'll give you a key."

**If player declines:**
> "Your choice. Dormitory is free."
>
> *Makes a note.*
>
> "Come back when you want something better."

---

## The New Housing

### Moving In

The player goes to their new housing location. They're greeted by a building supervisor or just find their space.

**Tier 1 - Block C, Bunk 27:**
```
Block C Dormitory - Bunk 27

Rows of metal bunk beds fill this section of the dormitory. Your assigned
bunk is against the wall — lower level, slightly more privacy than the
aisle beds. A metal locker stands at the foot of the bed, secured with a
combination lock.

A small label reads "C-27" on both the bed frame and locker.
```

The player now has:
- A specific respawn point
- A locker for storage
- A sense of permanence

**Tier 2 - Building 7, Room 4:**
```
Building 7, Room 4

A small room with three cots, three footlockers, and a single window
looking out onto a narrow alley. The walls are concrete block painted
a faded beige. A ceiling light buzzes softly.

Two of the cots show signs of occupancy — personal items, rumpled blankets.
The third is bare, waiting for you.
```

The player now has:
- Roommates (NPCs or other players)
- A door that locks
- More storage space
- Potential social connections

### Meeting Roommates (Tier 2)

If the player takes Tier 2, they have roommates:

**Roommate A's Notes:**
```javascript
await $.notes.add(roommateA.id, `
  ROLE: Roommate (NPC)
  NAME: Dex
  OCCUPATION: Maintenance Worker, night shift

  PERSONALITY:
  - Quiet, keeps to themselves
  - Comes and goes at odd hours
  - Polite but not chatty
  - Has been here 6 months

  ON NEW ROOMMATE:
  - Brief acknowledgment
  - "That's your cot. Don't touch my stuff."
  - Not hostile, just private
`, ['character']);
```

**Roommate B's Notes:**
```javascript
await $.notes.add(roommateB.id, `
  ROLE: Roommate (NPC)
  NAME: Jules
  OCCUPATION: Supply Depot worker, day shift

  PERSONALITY:
  - More social than Dex
  - Will answer questions about the building, neighborhood
  - Complains about rent, food, the system
  - Harmless grumbling, not actual dissent

  ON NEW ROOMMATE:
  - "Hey, new blood. Welcome to paradise."
  - Offers basic orientation if asked
  - Friendly enough
`, ['character']);
```

---

## Technical Implementation

### Housing Assignment

```javascript
async function assignHousing(player, tier) {
  const availableUnits = await findAvailableHousing(tier);
  if (availableUnits.length === 0) {
    return { success: false, error: 'No units available at this tier' };
  }

  const unit = availableUnits[0];

  // Update player's housing record
  await $.notes.add(player.id, `
    HOUSING ASSIGNMENT:
    - Tier: ${tier}
    - Location: ${unit.name}
    - Room/Bunk: ${unit.identifier}
    - Monthly cost: ${tierCosts[tier]} credits
    - Assigned: ${new Date().toISOString()}
    - Status: Active
  `, ['housing', 'active']);

  // Mark unit as occupied
  unit.occupants = unit.occupants || [];
  unit.occupants.push(player.id);

  // Set player's home location
  player.homeLocation = unit.id;

  // Schedule monthly rent deduction
  await $.scheduler.schedule(
    `rent-${player.id}`,
    daysUntilMonthEnd() * 24 * 60 * 60 * 1000, // delay until end of month
    30 * 24 * 60 * 60 * 1000, // monthly interval
    $.bank,
    'burn',
    player.bankAccount,
    tierCosts[tier],
    `rent-${new Date().toISOString().slice(0, 7)}`,
    'Monthly housing rent'
  );

  return { success: true, unit };
}
```

### Rent Collection

```javascript
async function collectRent(player) {
  const housing = await getPlayerHousing(player);
  if (!housing) return;

  const cost = tierCosts[housing.tier];
  const balance = await $.bank.getBalance(player.bankAccount);

  if (balance.balance >= cost) {
    await $.bank.burn(
      player.bankAccount,
      cost,
      `rent-${new Date().toISOString().slice(0, 7)}`,
      'Monthly housing rent'
    );
    return { success: true };
  } else {
    // Handle non-payment
    await $.notes.add(player.id, `
      HOUSING WARNING:
      - Issue: Insufficient funds for rent
      - Amount owed: ${cost} credits
      - Balance: ${balance.balance} credits
      - Warning level: ${housing.warnings + 1}
    `, ['housing', 'warning']);

    housing.warnings = (housing.warnings || 0) + 1;

    if (housing.warnings >= 3) {
      await evictPlayer(player);
    }

    return { success: false, warnings: housing.warnings };
  }
}
```

### Updating Player Progress

```javascript
await $.notes.add(player.id, `
  GREETER PROGRESS:
  - Stage: 5 (Housing) COMPLETE
  - Housing tier: ${tier}
  - Location: ${unitName}
  - Monthly cost: ${cost} credits
  - Ready for: Stage 6 (Permanent Employment)
`, ['greeter', 'onboarding', 'progress']);
```

---

## Edge Cases

### Player Can't Afford Tier 1

If the player has less than 10 credits:

> "Your balance is... low. Under ten credits."
>
> *Sighs.*
>
> "Tier 1 needs ten per month. Come back when you've saved up."

### Player Wants Tier 3+

If the player asks about higher tiers:

> "Tier 3 requires a month of steady employment and savings of at least 100 credits. You're not there yet."
>
> "Take what you can get now. Upgrade later."

### Player Misses Rent

After a missed payment:

> *Message from Housing Office*
>
> "NOTICE: Rent payment failed. Insufficient funds. You have 7 days to resolve this matter or face housing reassignment."

After three missed payments:

> "Your housing assignment has been revoked. Report to the dormitory for temporary accommodation."

```javascript
async function evictPlayer(player) {
  const housing = await getPlayerHousing(player);

  await $.notes.add(player.id, `
    HOUSING REVOKED:
    - Previous tier: ${housing.tier}
    - Reason: Non-payment (${housing.warnings} warnings)
    - New status: Tier 0 (Dormitory)
    - Date: ${new Date().toISOString()}
  `, ['housing', 'eviction']);

  // Reset to dormitory
  player.homeLocation = DORMITORY_ID;
  housing.tier = 0;
  housing.warnings = 0;

  // Cancel rent scheduler
  await $.scheduler.unschedule(`rent-${player.id}`);
}
```

### Roommate Conflict (Tier 2)

If the player has issues with roommates:

> The Housing Office doesn't mediate personal disputes.

> "Work it out yourselves or apply for a different room. There's a waitlist."

---

## Transition to Stage 6

Once housed, the player is ready to solidify their employment:

**Work supervisor mentions:**
> "You've got a place now? Good. Stability helps."
>
> "Time to talk about making this permanent. Not just shifts — a real position."

**Or housing clerk mentions:**
> "By the way — your employment record came across my desk. They're talking about permanent placement for you."
>
> "That's a good sign. Means they want to keep you."

Proceed to [06-permanent-employment.md](./06-permanent-employment.md).

---

## Related Documentation

- [ECONOMY.md](../city-ai/ECONOMY.md) — Credit system
- [PLURIBUS.md](../city-ai/PLURIBUS.md) — How Pluribus rewards loyalty
- [00-overview.md](./00-overview.md) — Greeter system overview
- [04-better-job.md](./04-better-job.md) — Previous stage

---

*This document is builder-facing canon. Do not share with players.*
