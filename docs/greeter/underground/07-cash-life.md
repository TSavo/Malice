# Underground Stage 7: The Cash Life

The player understands the cash economy. How to earn, spend, survive outside the system.

---

## Context

**Trigger:** Stage 6 complete, formally inducted

**Player State:**
- Formal Cartel member
- Assigned to a cell
- Has been earning cash
- Needs to understand long-term survival

**Goal:** Player understands the cash economy and Cartel supply chains

---

## The Problem With Cash

Cash is untraceable. Cash is freedom. Cash is also **inconvenient**.

**Cash cannot buy:**
- Rations from Pluribus dispensers
- Official housing
- Medical care through the system
- Anything that requires citizenship

**Cash can buy:**
- Food from Cartel suppliers
- Goods from the black market
- Bribes (if you know who takes them)
- Favors from fellow Cartel members
- Services from sympathetic citizens

The player needs the Cartel's infrastructure to convert cash into survival.

---

## The NPC: Cell Leader or Supply Contact

Someone who explains how the economy works.

**Inject into NPC prompt:**
```
You are explaining the cash economy to ${player.name}.

PLAYER STATUS:
- Formal Cartel member
- Has earned cash from jobs
- Needs to understand how to live on cash

YOUR APPROACH:
- Be practical — this is survival information
- Don't romanticize — cash life is harder than credits
- Explain the supply chains
- Point them to the right contacts

KEY POINTS:
- Cash can't buy citizen services
- Cartel has supply networks for food, goods
- Some citizens take bribes — carefully
- Exchange rate with credits is expensive
- Don't flash cash on the surface
```

---

## Dialogue Patterns

### The basics

> "You've got cash now. Good. But cash is tricky."
>
> "Can't walk into a ration dispenser and pay with paper. Can't rent a citizen apartment. The system doesn't see cash."
>
> "So we have our own system."

### About food

> "Food comes through Cartel channels. Scavenged, stolen, traded from sympathetic farmers outside the Footprint."
>
> "There's a supply point in sector 9. Show up, pay cash, get food. Not fancy, but it works."
>
> "Or find a citizen who'll buy food for you. Costs more — they take a cut."

### About goods

> "Black market in sector 14. Weapons, tools, medicine, clothing. Everything has a price."
>
> "Quality varies. Don't buy anything without checking it first."

### About converting cash

> "Sometimes you need credits. Rare, but it happens."
>
> "Money changers will convert, but the rates are bad. 60% if you're lucky. Less if you're desperate."
>
> "Better to stay in cash as much as possible."

### About safety

> "Don't carry too much. Don't flash it. Don't trust anyone you haven't worked with."
>
> "Cash gets stolen. People get killed for a hundred dollars."
>
> "The tunnels are safer than the surface, but nowhere is completely safe."

---

## The Supply Network

**Where to get things:**

| Need | Source | Location |
|------|--------|----------|
| Food | Cartel supply point | Sector 9 |
| Goods | Black market | Sector 14 |
| Medicine | Underground clinic | Sector 6 |
| Weapons | Cell armorer | Via cell leader |
| Cash → Credits | Money changers | Various (risky) |

**Prices (rough guidelines):**
- Day's food: $10-20
- Week's food: $50-100
- Basic medicine: $25-50
- Weapon: $100-500
- Cash-to-credit: 50-60% rate

---

## Actions to Take

### Record understanding

```javascript
await $.notes.add(player.id, `
  UNDERGROUND ECONOMICS:
  - Supply point: Sector 9 (food)
  - Black market: Sector 14 (goods)
  - Clinic: Sector 6 (medicine)
  - Money changer contacts: ${contacts || 'None yet'}
  - Current cash: $${cashAmount}
`, ['cartel', 'economics']);
```

### Introduce to key contacts

```javascript
await $.notes.add(supplyContact.id, `
  ${player.name} is approved for supply access.
  Cell: ${cellName}
  Vouched by: ${cellLeader.name}
`, ['approved', 'customer']);
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Underground
  - Stage 7: Cash Life - COMPLETE
  - ONBOARDING COMPLETE

  CARTEL STATUS:
  - Faction: Cartel (formal member)
  - Cell: ${cellName} (${cellType})
  - Role: ${role}
  - Housing: Safe house, sector 12
  - Cash on hand: $${cashAmount}
  - Total earned: $${totalEarned}

  SUPPLY ACCESS:
  - Food: Sector 9
  - Goods: Sector 14
  - Medicine: Sector 6
`, ['onboarding', 'underground', 'complete']);
```

---

## Onboarding Complete

The player is now a fully integrated Cartel member:
- Inducted ✓
- Cell assigned ✓
- Housing earned ✓
- Economy understood ✓

**What happens next depends on them:**
- Excel → Rise in the cell, more responsibility, eventually territory
- Coast → Steady member, steady work, steady cash
- Fail → Lose standing, lose housing, possibly lose life
- Betray → The Cartel doesn't forgive. Ever.

**Potential advancement:**
- Cell second-in-command
- Own crew
- Territory control
- Inner circle access

See [GRAY-CARTEL.md](../../city-ai/GRAY-CARTEL.md) → "The Cartel Endgame" for where this can lead.

---

## Edge Cases

### Player wants to go back to Continuum

> "Back? To citizenship? You're flagged now. They'd arrest you on sight."
> Too late. They're Cartel. The only way back is through a deal (betrayal) or death.

### Player wants to be a mole

> "Interesting. Risky. Could be useful."
> This is possible but complex. Would need a clean identity, cover story, ongoing deception.
> See [../00-overview.md](../00-overview.md) → "Path C: The Mole"

### Player is broke

> "Then work more. Or sell something. Or find a citizen who needs something done."
> The Cartel doesn't do welfare. Earn or suffer.

### Player gets caught by CorpSec

> Depends on what they know and what they reveal.
> If they talk → Cartel handles the traitor.
> If they stay silent → Cell may attempt rescue. Or not.

---

## The Contrast

| Continuum Endgame | Underground Endgame |
|-------------------|---------------------|
| Shop owner with passive income | Territory boss with crew |
| Wealth in credits (tracked) | Wealth in cash (hidden) |
| Security through system | Security through reputation |
| Status through compliance | Status through respect/fear |
| Everything can be taken | Nothing was ever yours anyway |

Both paths offer power. Both paths trap you. The player chose their cage.

---

## Beyond Onboarding

The greeter stages are complete. Future interactions are handled by:
- Cell leader (jobs, advancement)
- Cell members (social, backup)
- Cartel hierarchy (if they rise high enough)
- Sister Gray (if they become important)

See [GRAY-CARTEL.md](../../city-ai/GRAY-CARTEL.md) for the full picture.

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
