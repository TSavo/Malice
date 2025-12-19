# The Two Economies

> *"Credits are what you earn. Cash is what you hide. But everybody hides a little something."*

---

## Overview

Malice has two parallel currency systems. They are not interchangeable through any official mechanism. The exchange rate between them is determined entirely by in-character negotiation, black market dynamics, and player-driven economics.

**This is intentional.** Do not hardcode exchange rates. Do not create official conversion mechanisms. The tension between the two economies is a core gameplay driver.

---

## The Open Secret

Here's what everyone knows but nobody says out loud:

**Almost everyone is a citizen.** Citizenship isn't a faction choice — it's the default. It's normal. The scavengers and holdouts are the exception, not the rule. Most people registered, most people work, most people get their rations from dispensers and their housing from the system.

**Cash never died.** It just got rare. And illegal. Officially, physical currency is contraband — possession is a crime, trading in it is worse. Unofficially? Barter never stopped. Cash just became another thing you don't do in front of CorpSec.

**Everyone trades a little.** The grandmother who swaps ration chits for vegetables. The mechanic who takes cash for off-books repairs. The shopkeeper who sells inventory "that fell off a truck." It's not organized crime. It's just... how things work. How things have always worked.

**The Cartel didn't invent the cash economy.** They just formalized it. Scaled it up. Made it dangerous.

### The Uncomfortable Reality

For citizens, dealing in cash isn't a political statement. It's not rebellion. It's:

- A way to get things the system doesn't provide
- A way to avoid transaction logs on embarrassing purchases
- A way to help a friend without Pluribus knowing
- A way to make a little extra on the side

Most citizens who touch cash aren't Cartel assets. They're just... people. Living in the cracks of the system. Taking small risks for small rewards.

The Cartel exploits this. They know that the line between "normal citizen who occasionally trades cash" and "Cartel-compromised asset" is blurry. They keep it blurry on purpose.

### CorpSec Knows

CorpSec isn't stupid. They know cash circulates. They know citizens trade off-books. They can't stop it — and honestly, they don't try that hard.

What they watch for:
- **Volume** — Small trades are ignored. Large movements get attention.
- **Patterns** — One cash transaction is nothing. Regular cash transactions are suspicious.
- **Association** — Trading with known Cartel contacts gets flagged.
- **Flaunting** — Do it quietly and nobody cares. Do it openly and you're making a statement.

The enforcement is selective. Pragmatic. CorpSec has bigger problems than grandma's vegetable trades.

But that selectivity is also a weapon. Anyone can be arrested for cash possession. The law is a tool to be used when convenient — and ignored when not.

---

## The Go-Between

Here's where players get interesting.

### Factory Discounts and Wholesale Access

Loyal citizens who earn shop owner status get a valuable perk: **wholesale pricing from the Factory**. Pluribus's automated production facilities sell to approved retailers at 40-60% of the prices citizens pay at vending machines.

That margin exists so shop owners can make a profit. But it also creates an opportunity.

### The Arbitrage

A shop owner with Factory access can:
1. Buy goods at wholesale prices (in credits)
2. Sell those goods for cash to people who can't or won't use the credit system
3. Use the cash for things that can't be bought officially
4. Or convert the cash back to credits at a premium

This is valuable to everyone:
- **The shop owner** makes money on both the credit and cash sides
- **The Cartel** gets access to legitimate supply chains
- **Citizens** who need cash can trade credits for it
- **Scavengers** can buy goods they can't get through official channels

### The Risk

But here's the catch: **everything you have exists because Pluribus gave it to you**.

Your shop? Pluribus built it. Your vending machines? Pluribus installed them. Your wholesale account? Pluribus approved it. Your housing, your rations, your credit balance — all of it.

If you get caught dealing cash at volume, you lose **everything**:
- Citizenship revoked
- Assets seized
- Account frozen
- Shop reassigned to someone more reliable
- You're now a vagrant at best, a hostile at worst

Small trades? Everyone does them. CorpSec looks the other way. But patterns get noticed. Volume gets flagged. And the Cartel *wants* you to take bigger risks, because the deeper you go, the more they own you.

### The Blurry Line

This is the trap the Cartel exploits:

The difference between "normal citizen who occasionally trades a little cash" and "Cartel-compromised asset" is intentionally blurry. There's no bright line. You never wake up one morning and realize you've crossed it.

First you trade a little cash on the side. Then you sell some inventory off-books. Then you're holding packages you don't open. Then someone asks you for information about CorpSec patrol schedules. Then you're giving them the back door code to your shop.

At what point did you become a traitor? 

You don't know. They don't tell you. And by the time you realize how deep you are, you can't get out without confessing to crimes that will cost you everything.

### For Scenario Design

The go-between role creates natural dramatic tension:

**Early game:** Player has shop access, Cartel approaches with "small" requests
**Mid game:** Requests escalate, player is making real money but taking real risks
**Late game:** Player must choose — go deeper (Cartel path), get out (confession/betrayal), or try to walk the line forever (unsustainable)

Key beats:
- The first cash sale (seems harmless)
- The first "favor" for Cartel contacts (plausible deniability)
- The first time CorpSec asks questions (pressure builds)
- The first time the Cartel makes clear they own you (the trap closes)
- The choice: burn everything and run, or accept what you've become

### Technical Notes

Track player economic behavior for NPC awareness:

```javascript
await notes({
  action: 'add',
  objectId: player.id,
  text: `
    ECONOMIC PROFILE:
    - Cash transactions this week: 3 (low volume)
    - Known Cartel contacts: 1 (Handler Vance, met twice)
    - CorpSec attention: LOW (normal citizen pattern)
    - Risk level: MINIMAL (but being watched)
  `,
  tags: ['economic-profile', 'corpsec-intel']
});
```

Escalation triggers:
- Volume increases → CorpSec attention increases
- Multiple Cartel contacts → pattern recognition kicks in
- Suspicious timing (transactions before/after Cartel activity) → investigation

---

## Credits ($.bank)

**Pluribus's official currency.** Digital, tracked, controlled.

### What Credits Are

- Electronic balances stored in `$.bank`
- Issued by Pluribus for work, rewards, and system grants
- Burned by Pluribus for taxes, fines, and fees
- Transferred between citizen accounts via bank terminals
- Completely traceable - every transaction is logged

### How Citizens Get Credits

- **Work orders** - Complete jobs assigned by the system
- **Bonuses** - Exceed expectations, report useful information
- **Initial grants** - New citizens get a small starting balance
- **Transfers** - Other citizens can send you credits

### How Citizens Spend Credits

- **Ration upgrades** - Better food, more variety
- **Housing** - Larger quarters, better location
- **Equipment** - Tools, clothing, approved gear
- **Services** - Medical priority, training, transit passes
- **Transfers** - Send to other citizens

### The Catch

Every credit transaction is visible to Pluribus:
- Who paid whom
- When
- How much
- What for (if memo provided)

Credits are control. They're convenient, they're official, and they leave a perfect paper trail.

### Technical Implementation

```javascript
// Pluribus pays a citizen for completing a job
await $.bank.issue(
  citizenAccountId,
  25,  // amount - always integer
  `job-${jobId}-payment`,  // idempotency key
  'Delivery completed'  // memo
);

// Citizen pays another citizen
await $.bank.transfer(
  fromAccountId,
  toAccountId,
  100,
  `tx-${uuid()}`,
  'Thanks for the help'
);

// Pluribus takes a tax
await $.bank.burn(
  citizenAccountId,
  5,
  `tax-daily-${date}`,
  'Daily maintenance fee'
);
```

---

## Cash ($.dollar)

**Physical US currency.** Illegal, untraceable, dangerous.

### What Cash Is

- Crumpled paper bills bearing dead presidents
- Contraband - possession is a crime
- Untraceable - no record of who holds what
- Physical - can be stolen, lost, destroyed
- Stored as `$.dollar` objects with a `quantity` property

### Where Cash Comes From

Cash doesn't spawn from nothing. It exists in the world:
- **Cartel payments** - The underground economy runs on cash
- **Scavenged** - Found in old buildings, on bodies, in caches
- **Black market** - Traded for goods, services, or credits
- **Theft** - Taken from those who have it

### Why Cash Matters

- **Anonymity** - No transaction log, no trace
- **Cartel access** - The Gray Cartel doesn't take credits
- **Bribery** - Some things can't be bought officially
- **Insurance** - If Pluribus freezes your account, cash still spends

### The Catch

- **Contraband** - CorpSec can arrest you just for having it
- **Physical** - You have to carry it, hide it, protect it
- **No infrastructure** - Can't use it at terminals or dispensaries
- **Trust required** - No bank to mediate disputes

### Technical Implementation

```javascript
// Create cash for a Cartel payment
const payment = await $.recycler.create({
  parent: $.dollar,
  properties: {
    quantity: 50,
    location: handler.id  // Handler is holding it
  }
});

// Handler gives cash to player
payment.location = player.id;

// Cash stacks auto-merge when in same location
// If player already has $100, they now have $150

// Player splits off some cash to pay someone
const split = await payment.split(30);
// split is a new $30 stack, payment is now $120
split.location = contact.id;
```

---

## The Exchange Rate

**There is no official exchange rate.** 

The value of cash relative to credits is determined entirely IC:

### Market Forces

- **Supply** - How much cash is circulating? More cash = lower value
- **Demand** - How many people need untraceable currency? More demand = higher value
- **Risk** - How hard is CorpSec cracking down? More risk = higher premium
- **Trust** - Does the buyer trust the seller? Unknown parties = worse rates

### Typical Ranges (Guidelines, Not Rules)

These are rough guidelines for NPC behavior. Actual rates fluctuate:

| Situation | Cash Premium |
|-----------|--------------|
| Stable times, low heat | 1.2x - 1.5x (120-150 credits per $100 cash) |
| Cartel active, CorpSec distracted | 1.5x - 2x |
| Crackdown in progress | 2x - 3x |
| Desperate buyer, known seller | 1.1x - 1.3x |
| Unknown buyer, risky deal | 2x - 4x |

**These numbers are not programmed anywhere.** They're guidance for NPCs and scenario design. Players can negotiate whatever they can get.

### Who Exchanges

- **Money changers** - NPCs (or players) who specialize in conversion
- **Cartel contacts** - Often willing to buy credits for cash at a premium
- **Desperate citizens** - Need cash for something specific, will pay extra
- **Corrupt officials** - CorpSec or city workers who take bribes

### Example Exchange Scenarios

**Citizen needs cash for Cartel job:**
> Player approaches a known money changer in a back alley.
> 
> "I need two hundred in paper."
> 
> "Paper's expensive right now. Three-fifty credits."
> 
> "That's robbery."
> 
> "That's the market. CorpSec hit a cache last week. Supply's tight."

**Cartel pays in cash, player needs credits:**
> Player returns from Cartel job with $500 cash.
> 
> Handler: "Good work. Here's your cut."
> 
> *Hands over bills.*
> 
> Player now has a problem: cash is useless at the ration dispenser.
> 
> Options:
> - Find a money changer (lose 20-50% to fees)
> - Find someone who needs cash and trade directly
> - Keep it hidden for when you need untraceable funds

---

## Scenario Design: Payments

When designing jobs and scenarios, payment type matters:

### Pluribus Jobs Pay Credits

```javascript
await notes({
  action: 'add',
  objectId: clerk.id,
  text: `
    JOB: Deliver package to clinic
    PAYMENT: 25 credits on completion
    
    ON SUCCESS: 
    - Issue payment via $.bank.issue()
    - Log transaction with job ID
    - Player's reliability score increases
  `,
  tags: ['job']
});
```

Pluribus always pays in credits because:
- It's the official system
- It creates a record of the transaction
- It reinforces dependence on the credit economy

### Cartel Jobs Pay Cash

```javascript
await notes({
  action: 'add',
  objectId: handler.id,
  text: `
    JOB: Observe loading dock, report back
    PAYMENT: Nothing for this test
    
    NEXT JOB (if passed): Courier work, $50 cash
    
    ON SUCCESS:
    - Spawn $50 cash object
    - Handler physically gives it to player
    - No record exists
  `,
  tags: ['job']
});
```

The Cartel always pays in cash because:
- It's untraceable
- It reinforces separation from the credit system
- It makes the player complicit (possessing contraband)

### Mixed Payment Scenarios

Sometimes jobs involve both:

**Legitimate job with under-the-table bonus:**
> "Twenty-five credits for the delivery. Official."
> 
> *Glances around.*
> 
> "And if that package has... fewer pills when it arrives at the clinic... there's fifty in paper for you later."

**Cartel extraction with credit bribe:**
> "We need someone inside CorpSec to lose a file. That costs credits - they won't take cash."
> 
> Player has to convert their Cartel cash into credits to pay the bribe.
> 
> Conversion creates risk: money changers might talk.

---

## Economic Pressure as Gameplay

The two-economy system creates natural tension:

### For Citizens (Pluribus-aligned)

- Credits are easy but watched
- Need cash for anything the system won't provide
- Getting cash means contact with criminals
- Having cash means risk of arrest

### For Cartel Assets

- Cash is plentiful but hard to spend
- Need credits for basic survival (rations, housing)
- Converting cash to credits creates exposure risk
- Dependence on money changers creates vulnerability

### For Double Agents

- Have to maintain two separate financial lives
- Credits for the day job, cash for the night work
- Mismatched lifestyle (spending more than you earn) draws attention
- Every conversion is a potential exposure point

---

## NPC Money Changers

Money changers are valuable NPCs for scenarios:

### The Professional

```javascript
const changer = await ai({
  action: 'spawn',
  role: 'money_changer',
  name: 'The Accountant',
  locationId: backRoomId,
  personality: 'Precise, businesslike, no small talk. Treats this as a profession.',
  history: 'Former bank employee. Saw the writing on the wall. Went independent.'
});

await notes({
  action: 'add',
  objectId: changer.id,
  text: `
    RATES: 
    - Cash to credits: 60% (pay $100, get 60 credits)
    - Credits to cash: 150% (pay 150 credits, get $100)
    
    RULES:
    - No questions about where money comes from
    - No questions about what it's for
    - No extensions, no credit, no IOUs
    - Regulars get slightly better rates (65%/140%)
    
    IF THREATENED: Has panic button. Cartel protection arrives in 3 minutes.
  `,
  tags: ['business']
});
```

### The Amateur

```javascript
const amateur = await ai({
  action: 'spawn',
  role: 'desperate_citizen',
  name: 'Nervous Citizen',
  locationId: marketId,
  personality: 'Scared, needs money fast, obviously new to this.',
  history: 'Medical debt. Needs cash to pay off someone. Selling credits at a loss.'
});

await notes({
  action: 'add',
  objectId: amateur.id,
  text: `
    SITUATION: Needs $200 cash desperately. Will trade 350 credits for it.
    
    BEHAVIOR: Jumpy, keeps looking around. Will negotiate but caves easily.
    
    RISK: Might be a CorpSec sting. Or might attract CorpSec attention.
    
    IF DEAL HAPPENS: Grateful, relieved. Might become a future contact.
  `,
  tags: ['opportunity']
});
```

---

## Technical Notes for Builders

### Credit Operations

```javascript
// Check balance
const { balance } = await $.bank.getBalance(accountId);

// Issue credits (Pluribus paying someone)
await $.bank.issue(accountId, amount, idempotencyKey, memo);

// Transfer between accounts
await $.bank.transfer(fromId, toId, amount, idempotencyKey, memo);

// Burn credits (taxes, fines)
await $.bank.burn(accountId, amount, idempotencyKey, memo);

// Get transaction history
const history = await $.bank.getAccountHistory(accountId);
```

### Cash Operations

```javascript
// Create cash
const cash = await $.recycler.create({
  parent: $.dollar,
  properties: { quantity: 100 }
});

// Give cash to someone (move it)
cash.location = recipient.id;

// Cash auto-merges when placed in same location as existing cash

// Split a stack
const portion = await cash.split(30);
// portion is new $30 stack, cash is reduced by 30

// Check if empty (should recycle)
if (await cash.isEmpty()) {
  await $.recycler.recycle(cash);
}

// Get description (includes quantity)
const desc = await cash.describe();
// "$150 in banded stacks. [CONTRABAND]"
```

### $.cash Utility - The Easy Way

The `$.cash` utility provides high-level operations for cash across a player's hands and pockets:

```javascript
// Find all cash on a player (hands + pockets)
const found = await $.cash.find(player);
// { total: 500, stacks: [{ item, location, quantity }, ...] }

// Check if player has enough
const hasEnough = await $.cash.has(player, 100);
// true/false

// Take cash from player (modifies stacks, recycles empties)
const result = await $.cash.take(player, 100);
// { success: true, taken: 100, message: 'Took $100.' }
// { success: false, taken: 0, message: 'Insufficient cash. Need $100, have $50.' }

// Give cash to player (adds to existing stack or creates new)
const result = await $.cash.give(player, 100);
// { success: true, location: pocket, message: 'Added $100 to existing cash.' }
// { success: true, location: hand, message: 'Placed $100 in right hand.' }
// { success: false, message: 'No place to put the cash (hands full, no pockets).' }

// Transfer between players (atomic - refunds on failure)
const result = await $.cash.transfer(fromPlayer, toPlayer, 100);
// { success: true, message: 'Transferred $100.' }
```

**Search order:** Primary hand → Secondary hand → Worn clothing pockets

**Use $.cash for:**
- Vending machines accepting cash
- NPC transactions (shops, dealers)
- Clone recording studios
- Any system that needs to charge or pay players in physical cash

### Finding Someone's Cash (Manual)

If you need to search manually instead of using `$.cash`:

```javascript
// Cash is a physical object in hands or pockets
const inventory = player.contents || [];
for (const item of inventory) {
  const obj = await $.load(item);
  if (obj?.stackType === 'cash:usd') {
    const amount = obj.quantity;
    // Found their cash
  }
}
```

---

## Key Principles

1. **No official exchange.** The rate is always negotiated IC.

2. **Credits leave trails.** Every transaction is logged and visible to Pluribus.

3. **Cash is contraband.** Possession alone is a crime.

4. **Payment type signals allegiance.** Pluribus pays credits. Cartel pays cash.

5. **Conversion creates risk.** Every exchange is an opportunity for exposure.

6. **Scarcity drives value.** Cash supply fluctuates based on Cartel activity and CorpSec pressure.

7. **Players drive the market.** If players create a money-changing business, they set rates.

---

## The Two Paths

The two economies aren't just currency systems. They're competing visions of what power looks like.

### The Pluribus Path: Integration

**Endgame: Shop owner with passive income**

The loyal citizen who proves themselves gets rewarded with real infrastructure:
- A physical shop, built by Pluribus
- Vending machines connected to `$.bank`
- Factory supply chain at wholesale prices
- Automated sales, passive profit

See [PLURIBUS.md](PLURIBUS.md) → "The Citizenship Endgame" for full details.

**What you gain:**
- Steady income without active work
- Status and respect within the system
- Security through infrastructure
- A stake in Pluribus's success

**What you lose:**
- Privacy (every transaction logged)
- Independence (your wealth exists at Pluribus's pleasure)
- Freedom (step out of line and it all disappears)

### The Cartel Path: Dominance

**Endgame: Territory boss with a crew**

The loyal operative who proves themselves earns real power:
- Territory you control
- Operations you run
- People who answer to you
- Cash that can't be frozen

See [GRAY-CARTEL.md](GRAY-CARTEL.md) → "The Cartel Endgame" for full details.

**What you gain:**
- Active income from operations
- Independence from infrastructure
- Authority through respect/fear
- Wealth that's truly yours

**What you lose:**
- Safety (you're always a target)
- Legitimacy (you can never go back to the surface)
- Stability (territories can be taken, crews can betray)

### The Conflict

These paths are fundamentally incompatible. You can't be a loyal Pluribus shop owner AND a Cartel territory boss. The economics don't work — your credits are tracked, your cash is contraband, your loyalties are visible in where your money comes from and where it goes.

But the paths intersect in interesting ways:

**The Compromised Shop Owner:**
A citizen who runs a legitimate shop but takes cash under the table. They're useful to both sides — and owned by neither. Until they get caught.

**The Laundering Operation:**
A Cartel front that looks like a legitimate business. Credits flow in, goods flow out, cash appears somewhere else. This is high-level play.

**The Double Agent:**
Someone who's risen in both hierarchies. Playing both sides, trusted by neither, surviving on skill and luck. This usually ends badly.

### For Scenario Design

When building scenarios, consider which path the player is on — or which path they're being pushed toward:

**For Pluribus-track players:**
- Jobs that test reliability and integration
- Rewards in credits, housing upgrades, access
- Endpoint: offer of shop ownership
- Temptation: Cartel approaches with offers of "real" freedom

**For Cartel-track players:**
- Jobs that test loyalty and capability
- Rewards in cash, territory access, crew introductions
- Endpoint: control of an operation
- Temptation: Pluribus offers amnesty and a fresh start

**For undecided players:**
- Both sides make contact
- Jobs from both that seem harmless
- Gradually escalating commitment on whichever side they lean toward
- The choice crystallizes when they have to refuse one side definitively

---

*This document is builder-facing canon. Do not share with players.*
