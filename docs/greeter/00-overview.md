# Greeter System Overview

The greeter is an NPC that guides new players through their first hours in Pioneer Square. This is a **sequential progression** — each stage builds on the previous, creating a natural onboarding flow that integrates new arrivals into the Pluribus system.

---

## The Greeter Role

The greeter is a City Services employee assigned to assist new registrants. They're not a tutorial NPC — they're an in-character representative of the system, doing their job. They genuinely believe they're helping. They are.

**Personality:**
- Patient but efficient — they do this a lot
- Encouraging but not overly warm — bureaucratic friendliness
- Knows the system cold — can answer questions about how things work
- Slightly weary — new arrivals are unpredictable, sometimes ungrateful
- Ultimately helpful — they want you to succeed (it makes their metrics look good)

**The Greeter Knows:**
- The player just completed chargen and registration
- The player has no possessions, no housing, no job
- The player needs clothing, orientation, work, and eventually housing
- The player is being evaluated for future roles (though they don't say this)

---

## The Seven Stages

Each stage has its own documentation file with detailed scripts, NPC prompts, and technical implementation.

### Stage 1: Clothing (01-clothing.md)

**Goal:** Get the player dressed in basic citizen attire.

The player emerges from registration with nothing. The greeter takes them to get issued clothes and helps them dress properly. This teaches:
- How inventory works (picking things up)
- How the wear/remove system works
- That Pluribus provides for its citizens

### Stage 2: Block Tour (02-block-tour.md)

**Goal:** Orient the player to their immediate surroundings.

The greeter walks the player around the block, pointing out key locations:
- City Services (where they registered)
- The ration dispensary
- The job board terminal
- Nearest shelter/dormitory
- Basic navigation and street names

This teaches:
- How movement works
- The geography of the starting area
- Where essential services are located

### Stage 3: First Courier Job (03-courier-job.md)

**Goal:** Give the player their first paying task.

The greeter assigns or introduces the player to their first job: a simple delivery within the block. Pick up a package, carry it somewhere, hand it to someone.

This teaches:
- How work orders function
- How to complete objectives
- How credits work (they get paid)
- That reliability is noticed

### Stage 4: Better Job (04-better-job.md)

**Goal:** Show the player that advancement is possible.

After completing a few courier runs, the greeter (or another NPC) offers the player something slightly better — a job with more responsibility, more pay, or more interest.

This teaches:
- The progression system exists
- Reliability leads to opportunity
- Different job types exist

### Stage 5: Housing (05-housing.md)

**Goal:** Help the player secure their own living space.

With some credits earned and a work history, the player can apply for housing. The greeter (or a housing clerk) helps them navigate the process and get assigned to a bunk, then a room, eventually their own apartment.

This teaches:
- Housing tiers exist
- Credits have real purchasing power
- Pluribus provides security (but also dependency)

### Stage 6: Permanent Employment (06-permanent-employment.md)

**Goal:** Assign the player to a regular work location.

Instead of pickup courier jobs, the player gets assigned to a workplace — a factory floor, a maintenance crew, a shop, a patrol route. Regular work, regular pay, regular presence somewhere.

This teaches:
- Long-term employment is the goal
- Different roles in the city
- Where they fit in the system

### Stage 7: Payment System (07-payment-system.md)

**Goal:** Ensure the player understands and is enrolled in regular pay.

The player's employment is now set up to pay them on a schedule. They understand how credits flow, how to check their balance, how to spend, and what happens if they don't work.

This teaches:
- The full credit economy
- Dependency on the system
- What citizenship really means

---

## Technical Pattern

Each stage follows the same pattern:

1. **Trigger:** Previous stage completed, or player meets criteria
2. **NPC Contact:** Greeter (or delegate) approaches or summons player
3. **Dialogue:** In-character explanation of what's happening
4. **Action:** Player performs the required actions (with guidance)
5. **Completion:** Stage marked complete, next stage enabled
6. **Notes:** Update player's profile notes for NPC awareness

### Tracking Progress

Use the notes system to track player progress:

```javascript
await $.notes.add(player.id, `
  GREETER PROGRESS:
  - Stage: 3 (First Courier Job)
  - Completed: clothing, orientation
  - Current task: Deliver package to Supply Depot
  - Started: ${new Date().toISOString()}
`, ['greeter', 'onboarding', 'active']);
```

### NPC Prompts

Each greeter interaction should include context about the player's progress:

```javascript
await $.notes.add(greeter.id, `
  CURRENT ASSIGNMENT:
  Player: ${player.name} (#${player.id})
  Stage: 3 - First Courier Job
  History: Completed clothing and orientation smoothly
  Demeanor: Cooperative, asks good questions
  Next: After delivery, assess for better job offer
`, ['job', 'current']);
```

---

## Design Principles

### In-Character Always

The greeter is not a tutorial system. They're a person doing their job. They have opinions, preferences, and a life outside this interaction. They might mention being tired, or comment on the weather, or express mild frustration at the previous new arrival who couldn't figure out how to put on pants.

### Player Agency

The greeter offers. The player chooses. If the player wanders off during the tour, the greeter adapts. If the player refuses a job, the greeter notes that (and so does Pluribus). Choices have consequences, but we don't force the progression.

### Natural Pacing

Don't rush. Real onboarding takes time. A player might complete stages 1-3 in their first session and not reach stage 5 until they've been playing for a while. That's fine. The greeter doesn't force anything — they check in, offer the next stage when the player is ready, and otherwise leave them alone.

### Seamless Handoffs

The greeter doesn't do everything. Stage 5 might involve a housing clerk. Stage 6 might involve a factory foreman. The greeter introduces, then hands off. The new NPC picks up with full context.

### Evaluation Subtext

Everything the player does is being evaluated. Not explicitly — the greeter doesn't say "Pluribus is watching." But every choice, every delay, every question, every refusal gets noted. This information flows into the player's profile and affects future opportunities.

The player might notice patterns: cooperative people get better offers faster. But no one says that out loud.

---

## File Structure

```
docs/greeter/
├── 00-overview.md      ← This file
├── 01-clothing.md      ← Stage 1: Getting dressed
├── 02-block-tour.md    ← Stage 2: Orientation
├── 03-courier-job.md   ← Stage 3: First work
├── 04-better-job.md    ← Stage 4: Advancement
├── 05-housing.md       ← Stage 5: Own place
├── 06-permanent-employment.md  ← Stage 6: Regular work
└── 07-payment-system.md        ← Stage 7: Pay setup
```

---

## Related Documentation

- [JOBS.md](../city-ai/JOBS.md) — How jobs work
- [ECONOMY.md](../city-ai/ECONOMY.md) — Credit and cash systems
- [PLURIBUS.md](../city-ai/PLURIBUS.md) — The system the player is joining
- [TAILORING.md](../TAILORING.md) — Clothing system details
- [wearables.md](../moo/prototypes/wearables.md) — Clothing prototypes

---

*This document is builder-facing canon. Do not share with players.*
