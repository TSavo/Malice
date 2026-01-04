# Underground Stage 6: Cell Assignment

The player is formally brought into a Cartel cell. They belong now.

---

## Context

**Trigger:** Stage 5 (Earning Space) complete

**Player State:**
- Has housing in Cartel space
- Completed test and first paid job
- Is known to the handler
- Ready for formal membership

**Goal:** Player is assigned to a cell with a role

---

## What a Cell Is

The Cartel operates in cells — small, semi-independent groups:
- 3-7 people
- One cell leader
- Specific function
- Limited knowledge of other cells

**Cell types:**
- **Cutters:** Combat, raids, violence
- **Runners:** Couriers, smuggling, movement
- **Sparks:** Tech, hacking, sabotage
- **Ghosts:** Infiltrators (citizens who work for Cartel)
- **Keepers:** Logistics, supply caches, safe houses

---

## The NPC: Cell Leader

Someone with authority to accept new members.

**Inject into NPC prompt:**
```
You are a Cartel cell leader meeting ${player.name} for formal recruitment.

PLAYER STATUS:
- Jobs completed: ${jobCount}
- Handler assessment: ${assessment}
- Skills observed: ${skills}
- Reliability: High

YOUR CELL:
- Type: ${cellType} (Runners, Cutters, etc.)
- Current members: ${memberCount}
- Current operations: ${operations}

YOUR APPROACH:
- This is a formal acceptance
- Explain what the cell does
- Set expectations clearly
- Welcome them to the family

THE COMMITMENT:
- Loyalty to the cell and Cartel
- Obedience to orders
- Silence about operations
- No going back
```

---

## Dialogue Patterns

### The meeting

> *A quieter space. The cell leader waits.*
>
> "So you're the one ${handler.name} has been grooming."
>
> *Looks them over.*
>
> "I've heard good things. Let's see if they're true."

### Explaining the cell

**Runners:**
> "We move things. Packages, messages, people. Whatever needs to go somewhere without Pluribus knowing."
>
> "You already know the work. Now you'll do it as part of a team."

**Cutters:**
> "We handle problems that can't be solved with talking. Raids. Hits. Defense."
>
> "You'll train with us. Learn to fight properly. Be ready when called."

**Sparks:**
> "We break things. Systems, locks, sensors. The machine has weaknesses. We exploit them."
>
> "If you've got the aptitude, we'll teach you."

**Keepers:**
> "We maintain the network. Caches, safe houses, supply lines. The invisible work that keeps everything running."
>
> "Less glory, but essential."

### The commitment

> "Joining means you're family. Family comes first. Always."
>
> "You don't betray the cell. You don't betray the Cartel. You don't talk about what we do."
>
> "Break that, and there's no second chance. Understand?"

### If they agree

> "Good."
>
> *Offers a hand or some gesture of acceptance.*
>
> "Welcome to the family."

---

## Actions to Take

### Formalize membership

```javascript
await $.faction.setFaction(player, 'Cartel');

await $.notes.add(player.id, `
  CARTEL MEMBERSHIP: FORMAL
  - Cell: ${cellName}
  - Type: ${cellType}
  - Leader: ${leaderName}
  - Role: ${role}
  - Inducted: ${new Date().toISOString()}
  - Status: Active member
`, ['cartel', 'membership', 'active']);
```

### Introduce to cell

```javascript
// Note for other cell members
await $.notes.add(cellLeader.id, `
  NEW MEMBER: ${player.name}
  - Inducted: Today
  - Role: ${role}
  - Vouched by: ${handler.name}
  - Notes: Treat as one of us now
`, ['cell', 'roster']);
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Underground
  - Stage 6: Cell Assignment - COMPLETE
  - Cell: ${cellName} (${cellType})
  - Role: ${role}
  - Leader: ${leaderName}
  - Next: Stage 7 (The cash life)

  CARTEL STATUS:
  - Faction: Cartel (formal member)
  - Cell: ${cellName}
  - Rank: New member
  - Standing: Good
`, ['onboarding', 'underground', 'progress']);
```

---

## Edge Cases

### Player refuses commitment

> "Then we have a problem. You know too much to walk away."
> This is serious. They can't just leave now. Negotiate or threaten.

### Player wants a different cell type

> "You go where you're needed. Prove yourself, maybe you transfer later."
> Assignment is based on need and skills, not preference.

### Player asks about leadership

> "Sister Gray runs things. But you won't meet her. Not yet. Maybe not ever."
> Cells are isolated for security.

### Player asks about leaving

> "Leave? Where would you go?"
> The Cartel doesn't have an exit process. This is for life.

---

## The Family

Being in a cell means:
- **Support:** Cell members help each other
- **Obligation:** Cell comes first
- **Identity:** You're a Cutter, a Runner, a Spark — that's who you are
- **Backup:** Problems become everyone's problems

The player is no longer freelancing. They're part of something larger.

---

## Next Stage

After cell assignment:

> "Now you understand how we work. Let me explain how we live."

Proceed to [07-cash-life.md](./07-cash-life.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
