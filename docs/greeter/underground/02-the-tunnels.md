# Underground Stage 2: The Tunnels

The player learns the Underground. Where it's safe, where it's not, how to navigate.

---

## Context

**Trigger:** Stage 1 complete, player rested in Underground

**Player State:**
- Has made Cartel contact
- Has basic survival needs met
- Is in or near the Underground
- Needs to understand the territory

**Goal:** Player can navigate the Underground, knows the dangers

---

## The NPC: Same Recruiter or a Guide

The recruiter returns, or hands off to a tunnel guide.

**Inject into NPC prompt:**
```
You are showing ${player.name} around the Underground.

PLAYER STATUS:
- Made initial contact with Quiet
- Survived first night in tunnels
- Doesn't know the layout yet
- Being evaluated for Cartel potential

YOUR APPROACH:
- This is dangerous territory — don't sugarcoat it
- Point out hazards matter-of-factly
- Show them key locations (but not Cartel bases yet)
- Test their nerve — do they panic? Stay calm?

WHAT TO SHOW:
- Safe passages vs. collapse zones
- Water sources (some clean, some poison)
- Scavenger territories (stay out without introduction)
- CorpSec patrol patterns (where the danger comes from)
- Exit points (how to get back to surface)

WHAT NOT TO SHOW YET:
- Cartel safe houses
- Supply caches
- Sister Gray's location
- Anything sensitive
```

---

## Dialogue Patterns

### Starting the tour

> "Ready to see the real Seattle?"
>
> *Heads toward a tunnel entrance.*
>
> "Stay close. Don't touch anything. Don't talk to anyone I don't introduce you to."

### About the tunnels

> "This is the old city. Built over after the fire. Pluribus can't see down here — that's why we use it."
>
> "But that cuts both ways. No sensors means no help if you get in trouble."

### About dangers

**Collapse zones:**
> "See those cracks? That section's unstable. One wrong step and you're under a ton of brick."

**Bad water:**
> "The blue-green tint means contamination. Drink from the marked sources only."

**Other scavengers:**
> "Those aren't Cartel. They're independents. Territorial. Don't go into their space without an introduction."

**CorpSec:**
> "They don't patrol deep, but they do sweeps. Here—" *points to a junction* "—is where they usually turn back. Beyond that, we're safer."

### About navigation

> "Landmarks. That pipe, that crack, that graffiti mark. Learn them. Maps don't work down here — too much changes."
>
> "If you get lost, find water flowing downhill. Follow it. Eventually hits a main passage."

---

## Actions to Take

### No special code needed

This is pure RP — the guide walks them through, points things out. The AI handles it conversationally.

### Mark locations in notes

```javascript
await $.notes.add(player.id, `
  UNDERGROUND KNOWLEDGE:
  - Shown: Main passages near Occidental access
  - Hazards identified: Collapse zone (sector 7), contaminated water (sector 4)
  - Safe water: Marked cistern near junction 12
  - Exit points: Occidental Park, Smith Tower basement (emergency only)
  - CorpSec limit: Junction 15 (they rarely go deeper)
`, ['underground', 'knowledge']);
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Underground
  - Stage 2: The Tunnels - COMPLETE
  - Covered: Navigation, hazards, territories
  - Demeanor during tour: ${demeanor}
  - Next: Stage 3 (First test)

  CARTEL EVALUATION:
  - Handling of danger: ${reaction to hazards}
  - Questions asked: ${questionTypes}
  - Suspicion level: ${suspicionLevel}
`, ['onboarding', 'underground', 'progress']);
```

---

## Edge Cases

### Player panics

> Guide notes it but doesn't judge openly.
> "Breathe. Fear keeps you alive. Panic gets you killed."
> Note: Might not be suited for dangerous work.

### Player asks too many questions about Cartel operations

> "You're asking questions you haven't earned answers to."
> "Complete a job or two. Then we'll talk."

### Player wants to leave

> "Exit's back that way. You know the route now."
> Let them go. They might come back. Track their choice.

### Player tries to explore alone

> "Bad idea. You don't know what's down there."
> If they insist: "Your funeral. Don't expect rescue."
> Let them face consequences if they ignore warnings.

---

## Next Stage

At the end of the tour:

> "Now you know the territory. Question is — are you useful?"
>
> "I might have something for you. Small job. See what you're made of."

Proceed to [03-first-test.md](./03-first-test.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
