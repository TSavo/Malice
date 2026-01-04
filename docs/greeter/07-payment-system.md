# Stage 7: Payment System

The player learns how the credit economy works: earning, spending, deductions, and what happens when they don't work.

---

## Context

**Where this happens:** Payroll Office at City Services, or with a clerk at the workplace

**Trigger:** Stage 6 complete, player has worked at least one permanent shift

**State at start:**
- Player has permanent employment
- Player is about to receive their first regular paycheck
- Player has been spending credits informally
- Player may not understand the full system

**Goal:** Player understands the credit lifecycle and their economic position within the system

---

## The Credit Lifecycle

### Income

**Sources:**
- **Work shifts:** Primary income for most citizens
- **Bonuses:** Extra pay for exceptional work
- **Initial grant:** Small amount given at registration
- **Transfers:** Credits from other citizens

### Deductions

**Automatic deductions (in order):**
1. **Housing rent** — Monthly, based on tier
2. **Ration surcharges** — If using upgraded rations
3. **Fines** — If any outstanding penalties
4. **Taxes** — Small percentage for "maintenance fund"

### Spending

**Common expenses:**
- **Rations** — Free basic, credits for upgrades
- **Clothing** — Replacements and upgrades
- **Equipment** — Tools, gear for work or personal use
- **Services** — Medical priority, training, entertainment
- **Transfers** — Paying other citizens

### What Happens When Empty

If credits run out:
- Basic rations still available (free)
- Housing at risk if rent is due
- No purchases possible
- Work becomes survival

---

## The Scene

### Payroll Office

A small office with terminals and a clerk who handles payment inquiries.

**Room Description:**
```
Payroll Office

A cramped room dominated by terminals and filing cabinets. The walls are
covered with schedules, rate sheets, and policy notices. A clerk sits
behind a counter, processing the endless flow of credit transactions.

A screen displays: "CURRENT PAY PERIOD: [dates]. DISTRIBUTION: END OF WEEK."
```

### The Payroll Clerk

**Clerk's Notes (for AI prompt):**
```javascript
await $.notes.add(payrollClerk.id, `
  ROLE: Payroll Clerk
  NAME: Clerk Oduya

  CURRENT CASE: ${player.name}
  - New permanent employee
  - First regular pay period coming up
  - Needs orientation to pay system

  PLAYER FINANCIALS:
  - Current balance: ${balance} credits
  - Employment: ${position} at ${workplace}
  - Pay rate: ${payRate} credits/shift
  - Scheduled shifts this period: ${shiftCount}
  - Projected earnings: ${projectedPay} credits
  - Deductions: Housing ${housingCost}, Taxes ${taxAmount}

  DEMEANOR:
  - Patient with new employees (they all ask the same questions)
  - Precise about numbers
  - Not emotional about money — it's just math to them

  KEY POINTS TO COVER:
  - When pay arrives (end of week)
  - How to check balance
  - What gets deducted automatically
  - What happens if balance goes negative
  - How to report pay discrepancies
`, ['job', 'current']);
```

---

## Dialogue Script

### Opening

Player enters the Payroll Office or is approached by the clerk:

> "New permanent employee? Let me guess — first pay period coming up?"
>
> *Gestures to a seat.*
>
> "Sit. I'll walk you through how this works."

### The Basics

> "Everything runs on credits. You earn them, we track them, you spend them. Simple."
>
> *Pulls up something on a terminal.*
>
> "Your account balance is here. Check it anytime at any terminal — just scan your hand."

**Showing the balance:**
> "Right now you've got [X] credits. That'll change when payday hits."

### Earning

> "You work, you get paid. End of each week, your earnings deposit automatically."
>
> *Points at a calculation.*
>
> "You're at [pay rate] per shift. You worked [number] shifts this period. That's [total] credits, minus deductions."

**If player asks about bonuses:**
> "Bonuses happen. Extra pay for extra work, or for doing something notable. Your supervisor recommends, Payroll processes."
>
> "Don't count on them. But they're nice when they come."

### Deductions

> "Before you see your credits, some things come out automatically."
>
> *Lists them:*
>
> "Housing rent — that's first. Whatever your tier costs, it pulls at the end of the month."
>
> "If you're using upgraded rations, that cost comes out too."
>
> "Any fines or penalties — those deduct immediately."
>
> "And there's a small tax. Maintenance fund. Keeps the lights on."

**Showing the calculation:**
> "So: [gross pay] minus [housing] minus [rations] minus [tax] equals [net pay]."
>
> "That's what hits your account."

### Spending

> "Spending is up to you. Ration dispensers, shops, services — they all take credits. Just scan your hand."
>
> *Shrugs.*
>
> "Some people spend as fast as they earn. Some people save. The system doesn't care, as long as you can pay your rent."

### What Happens When You Can't Pay

> *Expression becomes more serious.*
>
> "If your balance goes too low to cover rent... you get a warning. Then another warning. Then you lose your housing."
>
> "If you can't afford rations upgrades, you go back to basics. Basic is free, so you won't starve."
>
> "If you stop working entirely..."
>
> *Pauses.*
>
> "The system notices. Eventually someone comes asking why. You don't want that."

### Checking Your Account

> "Any terminal can show you your balance. Just look for 'Account Status.'"
>
> *Demonstrates:*
>
> "Current balance, pending deductions, transaction history. All here."

**Player's account screen:**
```
CITIZEN ACCOUNT - [Player Name]

Balance: [X] credits
Pending: Housing rent (-[Y] credits, due [date])

Recent Transactions:
  [date] Work payment: +[amount] (Shift at [workplace])
  [date] Ration dispenser: -5
  [date] Work payment: +[amount]

Next pay period ends: [date]
Projected earnings: [amount]
```

---

## Player Questions

### Common Questions

**"What if I think I was paid wrong?"**
> "File a discrepancy report. Here, or at any terminal. Someone reviews it within 48 hours."
>
> "Keep your own count. Compare to the system. If it doesn't match, we look into it."

**"Can I save credits?"**
> "Your account is your account. Credits sit there until you spend them. No limit."
>
> "Smart people save. For emergencies. For housing upgrades. For things they want."

**"What if I want to transfer credits to someone else?"**
> "You can. Any terminal, 'Transfer' option. Enter their citizen ID, enter the amount."
>
> "Everything's logged. The system sees every transfer. Just so you know."

**"Is there any other way to pay for things?"**
> *Slight pause. Careful expression.*
>
> "Credits are the official currency. That's what the system uses."
>
> *Doesn't elaborate on cash.*

**If player asks directly about cash:**
> "Physical currency is... not something Payroll handles."
>
> *Lowers voice slightly.*
>
> "If someone's offering you cash, that's your business. Just know it's not on the books."

**"What happens if I don't work at all?"**
> "Your credits run out. Your housing lapses. You end up in the dormitory, eating basics, waiting for the system to decide what to do with you."
>
> "Some people survive like that. Most people work."

---

## Technical Implementation

### Pay Processing

```javascript
async function processPayroll(player) {
  const employment = await getEmployment(player);
  if (!employment || employment.status !== 'active') return;

  // Calculate gross pay
  const attendance = await getAttendance(player, currentPayPeriod);
  const shiftsWorked = attendance.filter(a => a.status === 'present').length;
  const grossPay = shiftsWorked * employment.payRate;

  // Calculate deductions
  const deductions = {
    housing: await getHousingCost(player),
    rations: await getRationsSurcharge(player),
    fines: await getPendingFines(player),
    tax: Math.floor(grossPay * 0.05), // 5% tax
  };

  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
  const netPay = grossPay - totalDeductions;

  // Issue payment
  await $.bank.issue(
    player.bankAccount,
    netPay,
    `pay-${employment.workplaceId}-${currentPayPeriod}`,
    `Wages for ${shiftsWorked} shifts at ${employment.position}`
  );

  // Process deductions
  for (const [type, amount] of Object.entries(deductions)) {
    if (amount > 0) {
      await $.bank.burn(
        player.bankAccount,
        amount,
        `deduction-${type}-${currentPayPeriod}`,
        `${type} deduction`
      );
    }
  }

  // Record pay stub
  await $.notes.add(player.id, `
    PAY STUB - ${currentPayPeriod}:
    - Gross pay: ${grossPay} credits (${shiftsWorked} shifts @ ${employment.payRate})
    - Deductions:
      - Housing: ${deductions.housing}
      - Rations: ${deductions.rations}
      - Fines: ${deductions.fines}
      - Tax: ${deductions.tax}
    - Net pay: ${netPay} credits
  `, ['pay', 'stub', currentPayPeriod]);

  return { grossPay, deductions, netPay };
}
```

### Account Balance Check

```javascript
// Verb for checking account balance
player.registerVerb('balance', async (context) => {
  const balance = await $.bank.getBalance(player.bankAccount);
  const pending = await getPendingDeductions(player);
  const history = await $.bank.getAccountHistory(player.bankAccount, 5);

  let output = `\nCITIZEN ACCOUNT - ${player.name}\n\n`;
  output += `Balance: ${balance.balance} credits\n`;

  if (pending.total > 0) {
    output += `Pending deductions: ${pending.total} credits\n`;
    for (const d of pending.items) {
      output += `  - ${d.type}: ${d.amount} (due ${d.dueDate})\n`;
    }
  }

  output += `\nRecent Transactions:\n`;
  for (const tx of history) {
    const sign = tx.type === 'credit' ? '+' : '-';
    output += `  ${tx.date}: ${sign}${tx.amount} (${tx.memo})\n`;
  }

  context.send(output);
});
```

### Low Balance Warnings

```javascript
async function checkBalanceWarnings(player) {
  const balance = await $.bank.getBalance(player.bankAccount);
  const pending = await getPendingDeductions(player);

  if (balance.balance < pending.total) {
    // Player can't cover pending deductions
    await $.notes.add(player.id, `
      FINANCIAL WARNING:
      - Balance: ${balance.balance}
      - Pending: ${pending.total}
      - Shortfall: ${pending.total - balance.balance}
      - Risk: Housing/services at risk
    `, ['financial', 'warning']);

    // Send in-game notification
    player.tell(`
      [CITY SERVICES NOTICE]
      Your account balance is insufficient to cover pending deductions.
      Work additional shifts or reduce expenses to avoid service interruption.
    `);
  }
}
```

### Updating Player Progress

```javascript
await $.notes.add(player.id, `
  GREETER PROGRESS:
  - Stage: 7 (Payment System) COMPLETE
  - Onboarding: COMPLETE
  - Status: Fully integrated citizen
  - Employment: ${position} at ${workplace}
  - Housing: Tier ${housingTier} at ${housingLocation}
  - First paycheck: ${firstPayAmount} credits

  CITIZEN PROFILE ESTABLISHED:
  - Registration date: ${registrationDate}
  - Onboarding complete: ${new Date().toISOString()}
  - Current balance: ${balance} credits
  - Work history: ${totalJobsCompleted} jobs
  - Reliability rating: ${reliabilityScore}
`, ['greeter', 'onboarding', 'complete']);
```

---

## Edge Cases

### Player Is Already Broke

If the player has zero or negative credits:

> "Your balance is... concerning."
>
> *Frowns at the screen.*
>
> "You're going to need to work more shifts before you can cover your deductions. I'd recommend picking up extra work."

### Player Asks About Loans

> "The system doesn't do loans. You earn, you spend, you save. No credit."
>
> *Pause.*
>
> "Some people borrow from other citizens. Privately. That's their business."

### Player Wants to Avoid Deductions

> "Deductions are automatic. You can't opt out of housing rent unless you give up your housing."
>
> "You can downgrade your rations to basic — that's free. But you still pay rent and taxes."

---

## Onboarding Complete

After Stage 7, the player's formal onboarding is complete. They are now:

- **Registered citizen** with full access
- **Housed** at their assigned tier
- **Employed** at a permanent position
- **Paid** on a regular schedule
- **Integrated** into the credit economy

### What Happens Next

The greeter's job is done. The player is now a functioning citizen of Pioneer Square. Future interactions depend on:

- **Their choices** — Do they climb the ladder or look for alternatives?
- **Their reliability** — Do they maintain their position or slip?
- **Opportunities** — Will Pluribus or the Cartel notice them?
- **Events** — What plots and scenarios will they encounter?

The greeter may check in occasionally:

> "Saw your name on the work roster. Settling in?"
>
> "Good. The first month is always the hardest. It gets easier."
>
> "Or it doesn't. Depends on you."

### Graduation Note

```javascript
await $.notes.add(GREETER_SYSTEM_ID, `
  ONBOARDING COMPLETE:
  - Citizen: ${player.name} (#${player.id})
  - Completed: ${new Date().toISOString()}
  - Duration: ${onboardingDuration}
  - Stages completed: 7/7
  - Final status: Fully integrated
  - Notes: ${assessmentNotes}
`, ['greeter', 'graduation', player.id]);
```

---

## Summary

The greeter system takes a new arrival from naked registration to functioning citizen through seven stages:

1. **Clothing** — Basic necessities and inventory introduction
2. **Block Tour** — Navigation and essential services
3. **First Courier Job** — Understanding work and credits
4. **Better Job** — Advancement possibilities
5. **Housing** — Permanent residence
6. **Permanent Employment** — Regular work assignment
7. **Payment System** — Full economic integration

Each stage builds on the previous, creating a natural progression that:
- Teaches game mechanics organically
- Establishes the player's position in the world
- Creates investment in the system (and potential resentment)
- Provides evaluation data for future opportunities

The player emerges as a citizen of Pluribus — for better or worse.

---

## Related Documentation

- [ECONOMY.md](../city-ai/ECONOMY.md) — Full credit/cash economy
- [PLURIBUS.md](../city-ai/PLURIBUS.md) — The system they've joined
- [JOBS.md](../city-ai/JOBS.md) — Work order system
- [00-overview.md](./00-overview.md) — Greeter system overview
- [06-permanent-employment.md](./06-permanent-employment.md) — Previous stage

---

*This document is builder-facing canon. Do not share with players.*
