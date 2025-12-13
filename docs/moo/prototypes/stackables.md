# Stackables and Vendables

Physical commodities and vending machines.

## Overview

**Stackables** are physical goods that combine and split:
- Cash, ammo, drugs, scrap materials
- Auto-merge when placed together
- Integer quantities only

**Vendables** are vending containers that sell items:
- Accept bank payment
- Sell physical items or spawn new ones
- Configurable prices

## $.stackable - Physical Commodities

Physical goods that can be combined and split. Enables commodity-based value transfer outside the banking system.

### Properties

```javascript
{
  name: 'Stackable',
  description: 'A quantity of something.',

  // Type identifier for stacking
  stackType: null,        // e.g., 'cash:usd', 'ammo:9mm', 'drug:synth'

  // Amount (integer only)
  quantity: 0,

  // Display unit
  unit: '',               // e.g., 'USD', 'rounds', 'g', 'oz'

  // Legal status
  contraband: false,      // Illegal to possess
}
```

### Stack Types

Common stack type patterns:
- `cash:usd`, `cash:mxn`, `cash:eur` - Physical currency
- `ammo:9mm`, `ammo:shotgun`, `ammo:rifle` - Ammunition
- `drug:synth`, `drug:stim`, `drug:painkiller` - Substances
- `scrap:copper`, `scrap:steel`, `scrap:circuit` - Materials

### Key Methods

#### canStackWith(other)
Check if two stacks can merge.

```javascript
const canMerge = await stack1.canStackWith(stack2);
// true if same stackType
```

#### merge(other)
Combine quantities, recycle the other stack.

```javascript
const result = await stack1.merge(stack2);
// { success: true, quantity: 150 }
// stack2 is recycled
```

#### split(amount)
Create a new stack with the given amount.

```javascript
const result = await stack.split(50);
// {
//   success: true,
//   newStack: <RuntimeObject>,  // New stack with 50
//   remaining: 100              // Original now has 100
// }
```

**Errors:**
- Amount must be positive integer
- Cannot split more than available
- Cannot split entire stack (just move it)

#### add(amount) / remove(amount)
Modify quantity directly.

```javascript
await stack.add(100);
// { success: true, quantity: 200 }

await stack.remove(50);
// { success: true, quantity: 150, empty: false }

await stack.remove(150);
// { success: true, quantity: 0, empty: true }
// Caller should recycle if empty
```

#### isEmpty()
Check if stack should be recycled.

```javascript
if (await stack.isEmpty()) {
  await $.recycler.recycle(stack);
}
```

### Auto-Merge

When a stackable arrives in a location, it automatically merges with matching stacks:

```javascript
// Player has 50 USD cash
// Player picks up 25 USD cash from ground
// → Auto-merges into single 75 USD stack
```

The `onArrived` hook handles this:
1. Check all items in destination
2. Find matching stackType
3. Merge into existing stack
4. Original stack is recycled

### Creating Stacks

```javascript
// Physical cash
const cash = await $.recycler.create($.stackable, {
  name: 'US Dollars',
  stackType: 'cash:usd',
  quantity: 500,
  unit: 'USD',
  contraband: true,       // Physical cash is illegal in 2110
});

// Ammunition
const ammo = await $.recycler.create($.stackable, {
  name: '9mm rounds',
  stackType: 'ammo:9mm',
  quantity: 30,
  unit: 'rounds',
  contraband: true,
});

// Legal scrap
const copper = await $.recycler.create($.stackable, {
  name: 'copper wire',
  stackType: 'scrap:copper',
  quantity: 500,
  unit: 'g',
  contraband: false,
});
```

### Description Output

```
US Dollars
500 USD [CONTRABAND]

9mm rounds
30 rounds [CONTRABAND]

copper wire
500 g
```

## $.vendable - Vending Machines

Containers that sell items using bank payment.

### Properties

```javascript
{
  name: 'Vendable',
  description: 'A vending container that sells the items it holds.',

  // Payment configuration
  bankAccount: null,      // Account ID to receive funds
  bank: null,             // Bank object id/alias
  defaultPrice: 0,        // Default price if item has no price

  // Access control
  owner: null,            // Agent ID that can manage
  locks: [],              // Composable locks for manage access

  // Spawn-on-demand items
  spawnables: [
    // { protoId, price, name, properties, autoNumber, numberPrefix }
  ],

  // Phone integration
  phoneDb: null,          // Phone directory for auto-numbering
}
```

### Two Sale Modes

**1. Physical Inventory**
Items stored in `contents` array. Removed when purchased.

**2. Spawnable Items**
Configured templates that create new items on purchase. Never runs out.

### Key Methods

#### listItems(viewer)
Show available items and prices.

```javascript
const list = await vendor.listItems(player);
// "Available items:
//    1) a snack bar - 5
//    2) bottled water - 3
//    3) phone - 50"
```

#### vend(buyer)
Purchase flow with prompts.

```javascript
const result = await vendor.vend(player);
// Prompts for selection
// Prompts for confirmation
// Processes bank transfer
// Delivers item to buyer's inventory
```

**Vend Flow:**
1. Build menu from contents + spawnables
2. Prompt buyer to select item
3. Prompt for confirmation
4. Transfer from buyer's bank account
5. Deliver item (remove from contents or spawn)
6. Return success message

#### manage(actor)
Owner management interface.

```javascript
await vendor.manage(owner);
// Menu:
//   1) Stock from inventory
//   2) Set price for item
//   3) Set default price
//   4) Set bank account
//   5) Configure spawnables
//   6) Exit
```

### Spawnables Configuration

For items that spawn on demand (infinite stock):

```javascript
spawnables: [
  {
    protoId: $.phone.id,           // Prototype to create
    name: 'Basic Phone',           // Display name
    price: 50,                     // Price
    properties: {                  // Properties to set
      color: 'black',
    },
    autoNumber: true,              // Assign phone number
    numberPrefix: '555',           // Phone number prefix
  },
]
```

### Phone Integration

When `autoNumber` is true and `phoneDb` is set:

```javascript
// Vendor configured with phoneDb
const vendor = await $.recycler.create($.vendable, {
  name: 'Phone Store',
  phoneDb: phoneDirectory.id,
  spawnables: [
    {
      protoId: $.wirelessPhone.id,
      name: 'Mobile Phone',
      price: 100,
      autoNumber: true,
      numberPrefix: '206',
    },
  ],
});

// When purchased:
// - Creates new phone
// - Generates number like '206123456789'
// - Registers with phone directory
```

### Creating Vendors

#### Basic Snack Machine

```javascript
const snackMachine = await $.recycler.create($.vendable, {
  name: 'Snack Machine',
  description: 'A battered vending machine.',
  bankAccount: 'CORP-SNACKS-001',
  defaultPrice: 5,
});

// Stock items
const snack1 = await $.recycler.create($.food, {
  name: 'synth-bar',
  calories: 150,
  price: 5,
});
await snackMachine.addContent(snack1.id);
```

#### Phone Kiosk

```javascript
const phoneKiosk = await $.recycler.create($.vendable, {
  name: 'Phone Kiosk',
  description: 'Buy prepaid phones here.',
  bankAccount: 'CORP-PHONES-001',
  phoneDb: phoneDb.id,
  spawnables: [
    {
      protoId: $.wirelessPhone.id,
      name: 'Burner Phone',
      price: 25,
      autoNumber: true,
      numberPrefix: '206',
      properties: { minutes: 100 },
    },
    {
      protoId: $.wirelessPhone.id,
      name: 'Premium Phone',
      price: 150,
      autoNumber: true,
      numberPrefix: '206',
      properties: { minutes: 500, color: 'silver' },
    },
  ],
});
```

### Purchase Example

```
> look at vending machine
Snack Machine
A battered vending machine.

> buy from machine
What do you want to buy?
  1) synth-bar - 5
  2) water bottle - 3
Enter number: 1

Buy synth-bar for 5? (y/n): y

You buy synth-bar for 5.
```

### Management Example

```
> manage machine
Manage vending machine:
  1) Stock from inventory
  2) Set price for item
  3) Set default price
  4) Set bank account
  5) Configure spawnables
  6) Exit
Choose: 2

Pick item to price:
  1) synth-bar (current: 5)
  2) water bottle (current: 3)
Enter number: 1

Enter new price: 7

synth-bar priced at 7.
```

## Use Cases

### Physical Cash Economy

Stackables enable an underground economy outside the banking system:

```javascript
// Drug dealer creates product
const drugs = await $.recycler.create($.stackable, {
  name: 'synth',
  stackType: 'drug:synth',
  quantity: 100,
  unit: 'doses',
  contraband: true,
});

// Player pays with physical cash
const payment = await $.recycler.create($.stackable, {
  name: 'cash',
  stackType: 'cash:usd',
  quantity: 500,
  unit: 'USD',
  contraband: true,
});

// Exchange happens in-person
// No banking records
// Risk of theft/loss
```

### Ammunition Tracking

```javascript
// Player loads magazine
const magazine = player.equippedWeapon.magazine;
const ammoNeeded = magazine.capacity - magazine.rounds;

const result = await ammoStack.remove(ammoNeeded);
if (result.success) {
  magazine.rounds = magazine.capacity;
}

if (result.empty) {
  await $.recycler.recycle(ammoStack);
}
```

### Vending Machine Network

```javascript
// Corporate vending throughout the city
// All payments go to same account
// Spawnables ensure infinite stock

const vendorTemplate = {
  bankAccount: 'CONTINUUM-RETAIL-001',
  bank: $.bank.id,
  defaultPrice: 5,
  spawnables: [
    { protoId: $.food.id, name: 'NutriBar', price: 3 },
    { protoId: $.drink.id, name: 'Aqua', price: 2 },
    { protoId: $.wirelessPhone.id, name: 'Burner', price: 25, autoNumber: true },
  ],
};
```

## See Also

- [Bank](./bank.md) - Payment processing
- [Phones](./phones.md) - Phone integration
- [Items](./items.md) - General item handling
- [Security](./security.md) - Lock-based access control
