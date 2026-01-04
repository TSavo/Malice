# Continuum Stage 7: Payroll

The player understands the credit economy. They're fully integrated.

---

## Context

**Trigger:** Stage 6 (Workplace) complete

**Player State:**
- Has workplace
- Has housing
- About to complete first shift and get paid
- Needs to understand the credit system

**Goal:** Player understands earning, spending, deductions — the whole lifecycle

---

## The NPC: Payroll Clerk or Supervisor

Can be a dedicated clerk or just the supervisor explaining things.

**Inject into NPC prompt:**
```
You are explaining the credit system to ${player.name}.

PLAYER SITUATION:
- Position: ${position}
- Pay rate: ${payRate} credits/shift
- Shifts this period: ${shiftCount}
- Gross pay: ${grossPay}
- Housing rent: ${housingCost}/month
- Estimated net: ${netPay}

YOUR APPROACH:
- Be matter-of-fact about money
- Explain the math clearly
- Don't be emotional — it's just numbers
- Answer questions briefly

KEY POINTS:
- Pay comes end of week, automatic
- Deductions come out automatically (rent, taxes)
- Check balance at any terminal
- Don't run out of credits — bad things happen
```

---

## Dialogue Patterns

### Explaining pay

> "You work, you get paid. End of each week, credits deposit automatically."
>
> "[X] credits per shift, [Y] shifts this period. That's [Z] before deductions."

### Explaining deductions

> "Housing rent pulls at month end. [X] credits for your tier."
>
> "Small tax for maintenance. Five percent."
>
> "What's left is yours."

### Explaining consequences

> "If your balance goes too low for rent, you get a warning. Then another. Then you lose the housing."
>
> "Don't let it get to that."

### Answering questions

**"Can I save?"**
> "Credits sit in your account until you spend them. No limit. Smart people save."

**"What if I need more?"**
> "Work more shifts. Take extra jobs. Or spend less."

**"What about cash?"**
> *Brief pause.* "Credits are the official currency. That's what the system uses."

---

## Actions to Take

### First pay processing

```javascript
// When pay period ends:
const grossPay = shiftsWorked * payRate;
const deductions = {
  tax: Math.floor(grossPay * 0.05),
};
const netPay = grossPay - deductions.tax;

await $.bank.issue(
  player.bankAccount,
  netPay,
  `pay-${payPeriod}`,
  `Wages: ${shiftsWorked} shifts at ${position}`
);

await $.notes.add(player.id, `
  PAY RECEIVED:
  - Period: ${payPeriod}
  - Gross: ${grossPay}
  - Deductions: Tax ${deductions.tax}
  - Net: ${netPay}
  - New balance: ${newBalance}
`, ['pay', 'received']);
```

### Rent processing (monthly)

```javascript
// When rent is due:
const balance = await $.bank.getBalance(player.bankAccount);
if (balance.balance >= rentCost) {
  await $.bank.burn(
    player.bankAccount,
    rentCost,
    `rent-${month}`,
    'Monthly housing rent'
  );
} else {
  await $.notes.add(player.id, `
    HOUSING WARNING:
    Insufficient funds for rent.
    Owed: ${rentCost}
    Balance: ${balance.balance}
    Warning #${warningCount}
  `, ['housing', 'warning']);
}
```

---

## What to Track

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Continuum
  - Stage 7: Payroll - COMPLETE
  - ONBOARDING COMPLETE

  CITIZEN STATUS:
  - Registered: ${registrationDate}
  - Employment: ${position} at ${workplace}
  - Housing: Tier ${tier} at ${location}
  - Pay rate: ${payRate}/shift
  - Current balance: ${balance}

  EVALUATION:
  - Reliability: ${reliability}
  - Incidents: ${incidents}
  - Advancement potential: ${potential}
`, ['onboarding', 'continuum', 'complete']);
```

---

## Onboarding Complete

The player is now a fully integrated citizen:
- Registered ✓
- Clothed ✓
- Oriented ✓
- Employed ✓
- Housed ✓
- Paid ✓

**What happens next depends on them:**
- Excel → Better positions, housing upgrades, eventually shop ownership
- Coast → Steady life, no advancement, no problems
- Struggle → Warnings, demotions, potential loss of status
- Defect → Cartel recruitment becomes possible

The greeter's job is done. The system takes over.

---

## Edge Cases

### Player is broke

> "Your balance is concerning. You need to work more shifts before next rent is due."
> Track for potential problems.

### Player asks about alternatives

> "Alternatives to credits? There aren't any. Not officially."
> If they push, note the interest — possible Cartel sympathy.

### Player wants to quit

> "Quit? You can leave your position. You'll go back to pickup work. Your housing requires employment."
> Explain consequences without forcing.

---

## Beyond Onboarding

The greeter stages are complete. Future interactions are handled by:
- Work supervisors (employment)
- Housing clerks (housing upgrades)
- The system itself (opportunities, consequences)
- Pluribus evaluation (advancement, suspicion)

See [PLURIBUS.md](../../city-ai/PLURIBUS.md) for how the system continues to evaluate citizens.

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
