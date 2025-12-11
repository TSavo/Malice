# Item Types

Wearables, consumables, stackables, and decayable items in Malice.

## Overview

Malice supports a rich item system with multiple prototypes:
- **$.wearable / $.clothing** - Items that can be worn (clothing, armor)
- **$.edible / $.food / $.drink** - Items that can be consumed (food, drink)
- **$.decayable** - Items that degrade over time (spoilage, wear)
- **$.stackable** - Items that can be stacked (currency, ammo, resources)

## $.wearable / $.clothing - Clothing System

### Purpose

Wearable items provide warmth, protection, and style. Clothing is a specialized wearable with additional properties.

### Properties

```javascript
{
  name: 'leather jacket',
  description: 'A rugged leather jacket.',
  worn: false,           // Is the item currently worn?
  warmth: 20,            // Warmth provided
  coverage: ['torso', 'arms'], // Body parts covered
  durability: 100,       // Current durability
  maxDurability: 100,    // Maximum durability
}
```

### Key Methods

#### doWear(player)
Player wears the item.

```javascript
const result = await jacket.doWear(player);
if (result.success) {
  await player.tell('You put on the leather jacket.');
}
```

#### doRemove(player)
Player removes the item.

```javascript
await jacket.doRemove(player);
```

## $.edible / $.food / $.drink - Consumables

### Purpose

Edible items restore hunger, thirst, or provide effects. Food and drink are specialized edibles.

### Properties

```javascript
{
  name: 'apple',
  description: 'A crisp red apple.',
  bites: 3,              // Number of bites left
  calories: 95,          // Nutrition value
  nutrition: {
    carbs: 25,
    protein: 0,
    fat: 0
  },
  spoiled: false,        // Is the item spoiled?
}
```

### Key Methods

#### doEat(player)
Player eats a bite.

```javascript
const result = await apple.doEat(player);
if (result.success) {
  await player.tell('You take a bite of the apple.');
}
```

#### doDrink(player)
Player drinks from the item.

```javascript
const result = await waterBottle.doDrink(player);
```

## $.decayable - Time-Based Decay

### Purpose

Items that spoil, rot, or degrade over time.

### Properties

```javascript
{
  decayRate: 0.01,       // Percent per hour
  decayType: 'spoilage', // Type of decay (spoilage, rust, wear)
  spoiled: false,        // Has the item spoiled?
}
```

### Key Methods

#### tick()
Advance decay based on time.

```javascript
await item.tick();
if (item.spoiled) {
  await player.tell('The apple has spoiled.');
}
```

## $.stackable - Stackable Items

### Purpose

Items that can be grouped together (currency, ammo, resources).

### Properties

```javascript
{
  count: 10,             // Number of items in stack
  maxStack: 100,         // Maximum stack size
}
```

### Key Methods

#### addToStack(amount)
Add items to the stack.

```javascript
await coins.addToStack(5);
```

#### removeFromStack(amount)
Remove items from the stack.

```javascript
await coins.removeFromStack(3);
```

## Real-World Examples

### Clothing

```javascript
const jacket = await $.recycler.create($.clothing, {
  name: 'leather jacket',
  warmth: 20,
  coverage: ['torso', 'arms'],
  durability: 100,
  maxDurability: 100
});
await jacket.moveTo(player);
await jacket.doWear(player);
```

### Food

```javascript
const apple = await $.recycler.create($.food, {
  name: 'apple',
  bites: 3,
  calories: 95,
  nutrition: { carbs: 25, protein: 0, fat: 0 }
});
await apple.moveTo(player);
await apple.doEat(player);
```

### Stackable Currency

```javascript
const coins = await $.recycler.create($.stackable, {
  name: 'credit chip',
  count: 10,
  maxStack: 100
});
await coins.addToStack(5);
await coins.removeFromStack(3);
```

### Decayable Food

```javascript
const bread = await $.recycler.create($.decayable, {
  name: 'bread',
  decayRate: 0.02,
  decayType: 'spoilage'
});
await bread.tick();
if (bread.spoiled) {
  await player.tell('The bread has spoiled.');
}
```

## Tips & Best Practices

1. **Use prototypes for item types** - Clothing, food, drink, stackable, decayable
2. **Always check worn state** - Only allow wearing if not already worn
3. **Decayable items should tick** - Use scheduler for time-based decay
4. **Stackable items for resources** - Currency, ammo, etc.
5. **Nutrition for food/drink** - Track calories, carbs, protein, fat
6. **Durability for wearables** - Items should degrade with use
7. **Spoilage for food** - Mark spoiled items and prevent eating
8. **Custom verbs for special items** - Add doUse, doActivate, etc.

## See Also

- [Body System](./body.md) - How items interact with body parts
- [Security System](./security.md) - Lockable containers
- [Objects](../advanced/objects.md) - Creating and placing items
