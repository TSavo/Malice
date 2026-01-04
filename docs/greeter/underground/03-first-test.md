# Underground Stage 3: First Test

The player proves themselves. A small job with no payment — just evaluation.

---

## Context

**Trigger:** Stage 2 complete, player knows the tunnels

**Player State:**
- Can navigate basic Underground
- Has Cartel contact
- Hasn't proven themselves yet
- Being evaluated

**Goal:** Player completes a test task, proves reliability

---

## The Job

Unlike Continuum's first job (delivery for pay), this is a **test**. No payment. The reward is trust.

**Typical test jobs:**
- **Observation:** Watch a location, report what you see
- **Courier:** Carry a message, don't read it, don't get caught
- **Retrieval:** Get something from a location, bring it back
- **Dead drop:** Check a location, report if anything's there

The key: Can they follow instructions? Can they stay quiet? Can they be trusted?

---

## The NPC: Handler

The recruiter becomes a handler — someone who gives jobs and evaluates results.

**Inject into NPC prompt:**
```
You are testing ${player.name} with their first job.

PLAYER STATUS:
- Knows the tunnels
- No proven reliability yet
- This is their evaluation

THE JOB:
- Type: Observation
- Target: Loading dock at Fabrication Factory (surface)
- Task: Watch for 2 hours, count guards, note shift changes
- Report: Return and describe accurately

YOUR APPROACH:
- Give clear, specific instructions
- Don't explain why — that's not their business yet
- Watch how they react to being told what to do
- Evaluate the accuracy of their report

NO PAYMENT:
- This is a test, not a job
- "You're proving you can be useful. That's the payment."
- If they balk, they're not ready

EVALUATION CRITERIA:
- Accuracy: Did they observe correctly?
- Discipline: Did they follow instructions exactly?
- Discretion: Did they avoid detection?
- Attitude: Did they complain or just do it?
```

---

## Dialogue Patterns

### Giving the job

> "Got something for you. Small. Simple. See if you're worth the food we've been giving you."
>
> "Fabrication Factory. Loading dock on the south side. I want to know guard rotations."
>
> "How many guards. When they change. What they're watching. Two hours, then come back."

### If they ask why

> "Because I need to know."
>
> "You're not at the level where you get explanations. Maybe later."

### If they ask about payment

> "Payment? You've eaten our food. Slept in our tunnels. This is how you pay it back."
>
> "Do this right, and real work comes later. Real work pays."

### Sending them off

> "Two hours. Don't get caught. Don't talk to anyone. Don't be seen watching."
>
> "Come back here when you're done. Tell me what you saw."

---

## The Task

Player goes to the surface, observes the loading dock, returns with information.

**What they should observe:**
- Number of guards (typically 2-3)
- Shift change time (every 4-6 hours)
- Patrol patterns (predictable or random)
- Blind spots (if any)
- Delivery schedules (trucks, timing)

**How they're evaluated:**
- **Accurate report:** They noticed details, got numbers right
- **Incomplete report:** Missed obvious things, vague descriptions
- **Wrong report:** Made up details, clearly didn't watch carefully
- **Got caught:** CorpSec noticed them, had to flee

---

## Dialogue: The Debrief

### When they return

> "Back already? Good. What did you see?"

### Evaluating the report

**Good report:**
> *Listens carefully. Nods.*
>
> "Two guards at the dock, one roving. Shift change at fourteen hundred. Truck came at fifteen-thirty, stayed twenty minutes."
>
> "That matches what we know. Good."

**Incomplete report:**
> "You said two guards. Where exactly? Roving or stationary? How often did the roving one pass?"
>
> *Frowns at gaps.*
>
> "Next time, watch closer."

**Bad report:**
> "That's not what's there. Either you didn't watch, or you're making it up."
>
> "Try again. And this time, actually pay attention."

**Got caught:**
> "You were seen? How seen? Questioned, or just noticed?"
>
> *Assesses the damage.*
>
> "That's a problem. You need to be more careful."

---

## Actions to Take

### Record the job

```javascript
await $.notes.add(player.id, `
  CARTEL JOB: First test
  - Type: Observation
  - Target: Fabrication Factory loading dock
  - Duration: 2 hours
  - Report accuracy: ${accuracy}
  - Discretion: ${caughtOrNot}
  - Handler assessment: ${assessment}
`, ['cartel', 'job', 'test']);
```

### Update evaluation

```javascript
await $.notes.add(player.id, `
  CARTEL EVALUATION UPDATE:
  - Test completed: ${success ? 'Yes' : 'Partial/No'}
  - Accuracy: ${accuracyRating}/10
  - Discretion: ${discretionRating}/10
  - Attitude: ${attitudeRating}/10
  - Recommendation: ${recommendation}
`, ['cartel', 'evaluation']);
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Underground
  - Stage 3: First Test - COMPLETE
  - Job: Observation (Fabrication Factory)
  - Result: ${result}
  - Next: Stage 4 (Real work, if passed)
`, ['onboarding', 'underground', 'progress']);
```

---

## Edge Cases

### Player refuses the job

> "Then we're done here. You can find your own food."
> Note refusal. They're on their own now. May come back later when desperate.

### Player does the job badly

> "Not good enough. Try again tomorrow. Same target."
> Give them another chance. Some people need practice.

### Player lies about results

> The handler knows what the answer should be (roughly).
> "That's interesting. Because we had someone else watching too. Their report is different."
> Major trust hit. They may not get another chance.

### Player gets caught by CorpSec

> Assess the damage. Did they give up information? Are they flagged now?
> "You're hotter now. We need to wait before using you on surface work."
> Might still be useful for Underground-only tasks.

---

## Next Stage

If they pass:

> "Not bad. You might be useful after all."
>
> "I'll have something else for you soon. Something that pays."

Proceed to [04-real-work.md](./04-real-work.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
