# Greeter System: Two Paths

New arrivals to Pioneer Square face a choice — often before they realize they're choosing.

This documentation provides **AI playbooks** for onboarding players down either path. These are not coded systems — the city-ai makes decisions on the fly, using these guides to know what NPCs to deploy, what to offer, what code to execute, and what to track.

---

## The Choice Point

Every player completes chargen the same way: crisis, interview, registration offer. The split happens at **what they do next**.

### Path A: Continuum

The player accepts citizenship. They register at City Services. Pluribus welcomes them with:
- Clothing from the outfitting room
- A greeter NPC who shows them around
- Work assignments through the job board
- Housing through the allocation system
- Credits deposited to their account

This is the **safe path**. Stable. Predictable. Constraining.

See: [continuum/](./continuum/)

### Path B: Underground

The player refuses or avoids citizenship. They slip away from City Services. The Cartel notices them with:
- A recruiter who makes contact
- Survival basics (scavenged, traded, provided)
- Tests to prove their worth
- Eventually, a place in the organization
- Cash, favors, and earned territory

This is the **dangerous path**. Free. Uncertain. Purposeful.

See: [underground/](./underground/)

### Path C: The Mole

The player registers as a citizen but secretly works for the Cartel. They do both onboarding processes simultaneously — citizen by day, Cartel by night.

This is the **double life**. Maximum access. Maximum risk.

See: Both paths, plus [../city-ai/GRAY-CARTEL.md](../city-ai/GRAY-CARTEL.md) → "Moles"

---

## How to Detect the Path

### Signs of Continuum Path

- Player completes registration
- Player asks about work, housing, rations
- Player follows the greeter willingly
- Player expresses interest in "the system"

### Signs of Underground Path

- Player refuses or delays registration
- Player asks about "alternatives" or "other options"
- Player seems suspicious of Pluribus
- Player wanders away from City Services
- Player lingers in areas where Cartel recruiters operate

### Signs of Mole Path

- Player registers but asks too many questions
- Player seems to be playing along
- Player later makes contact with known Cartel areas
- Player accepts Cartel recruitment while maintaining citizen status

---

## What These Docs Provide

Each stage document includes:

### 1. Context
- When this stage triggers
- What the player's state is
- What the goal is

### 2. The NPC
- Who handles this stage
- Their personality and approach
- Notes to inject into their AI prompt

### 3. Dialogue Patterns
- Example conversations
- How to handle common questions
- Edge cases

### 4. Actions to Take
- Actual MOO code to execute
- What objects to create/modify
- What properties to set

### 5. What to Track
- Notes to add to player profile
- Flags that affect future interactions
- Progress markers

---

## The AI's Role

The city-ai doesn't follow a script — it **makes decisions** based on these guidelines.

### For Continuum NPCs (Greeter, Clerks, Supervisors)

- Act like bureaucrats doing their jobs
- Be helpful but not warm
- The system provides, the system expects
- Everything is logged, tracked, evaluated
- Advancement is possible for the reliable

### For Underground NPCs (Recruiters, Handlers, Sister Gray's people)

- Act like criminals vetting a new recruit
- Be cautious, indirect, testing
- Nothing is free — everything is earned
- Trust is built through action, not words
- The Cartel is family, and family demands loyalty

### Making Decisions On The Fly

**Housing example (Continuum):**
> Player just completed their first job. Greeter offers housing immediately.
>
> AI decision: They're cooperating. Give them a place.
> Execute: `await lock.rent(player, 365 * 24 * 60 * 60 * 1000)` for a year.
> Track: Note the assignment in their profile.

**Housing example (Underground):**
> Player just completed their first real Cartel job. Handler offers them a corner.
>
> AI decision: They've proven useful. Assign them space in the safe house.
> Execute: Set a note that they have access to location X.
> Track: Note their status advancement.

The docs tell you *what* to do. The AI decides *when* and *how*.

---

## Pacing: First Session (~4 Hours per Path)

**This is first-session content.** A player who engages completes all 7 stages in their first 3-4 hours. No waiting periods. No "come back next week." Rewards are immediate.

The stages flow continuously — complete one, immediately offered the next.

---

## Stage Comparison

| Stage | Continuum | Underground | Time |
|-------|-----------|-------------|------|
| 1 | **Clothing** — Issued | **Survival** — Provided | ~10 min |
| 2 | **Orientation** — Block tour | **The Tunnels** — Underground tour | ~20 min |
| 3 | **First Job** — Courier (credits) | **First Test** — Observation (no pay) | ~30 min |
| 4 | **Employment** — Position offered | **Real Work** — Paid job (cash) | ~1 hr |
| 5 | **Housing** — Assigned immediately | **Earning Space** — Corner given | ~15 min |
| 6 | **Workplace** — First shift | **Cell Assignment** — Inducted | ~1 hr |
| 7 | **Payroll** — Economy explained | **Cash Life** — Supply network | ~15 min |

---

## Directory Structure

```
docs/greeter/
├── 00-overview.md              ← This file
├── continuum/
│   ├── 01-clothing.md          ← Getting dressed
│   ├── 02-orientation.md       ← Learning the block
│   ├── 03-first-job.md         ← First courier work
│   ├── 04-employment.md        ← Permanent position
│   ├── 05-housing.md           ← Getting assigned housing
│   ├── 06-workplace.md         ← Regular work location
│   └── 07-payroll.md           ← Credit economy
└── underground/
    ├── 01-survival.md          ← Immediate needs
    ├── 02-the-tunnels.md       ← Learning the Underground
    ├── 03-first-test.md        ← Proving yourself
    ├── 04-real-work.md         ← Cartel jobs
    ├── 05-earning-space.md     ← Getting a place
    ├── 06-cell-assignment.md   ← Role in the Cartel
    └── 07-cash-life.md         ← Cash economy
```

---

## Related Documentation

- [FACTIONS.md](../city-ai/FACTIONS.md) — Faction system and citizenship
- [GRAY-CARTEL.md](../city-ai/GRAY-CARTEL.md) — The Cartel organization
- [PLURIBUS.md](../city-ai/PLURIBUS.md) — How Pluribus operates
- [ECONOMY.md](../city-ai/ECONOMY.md) — Credits vs. cash
- [JOBS.md](../city-ai/JOBS.md) — Work order system

---

*This document is builder-facing canon. Do not share with players.*
