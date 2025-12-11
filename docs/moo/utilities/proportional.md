# $.proportional - Value-Based Message Selection

Use `$.proportional` to select messages based on a value within a range. Perfect for health bars, hunger, thirst, capacity indicators, damage levels, etc.

## Purpose

Provides mathematically correct proportional message selection. Given a value and a maximum, selects the appropriate message from an array based on percentage ranges—with special handling for exactly 0 and exactly max.

## Why Use This?

**Bad: If/else chains with edge cases**
```javascript
function getHealthStatus(hp, maxHp) {
  const pct = hp / maxHp * 100;
  if (hp === 0) return 'dead';
  if (pct < 10) return 'near death';
  if (pct < 25) return 'critical';
  if (pct < 50) return 'wounded';
  if (pct < 75) return 'hurt';
  if (pct < 100) return 'scratched';
  return 'healthy';
  // Edge cases? Rounding errors? Off-by-one? Good luck debugging.
}
```

**Good: Mathematical distribution**
```javascript
const status = await $.proportional.sub(
  ['dead', 'near death', 'critical', 'wounded', 'hurt', 'scratched', 'healthy'],
  hp, maxHp
);
// First message only at 0, last only at max, rest evenly distributed
```

## What $.proportional Handles

- ✅ First message only at exactly 0
- ✅ Last message only at exactly max
- ✅ Even distribution of middle messages
- ✅ No rounding errors or off-by-one bugs
- ✅ Consistent percentage calculations

## How It Works

- **First message (index 0)**: Returned ONLY when `amount = 0`
- **Last message (index n-1)**: Returned ONLY when `amount = total`
- **Middle messages**: Distributed evenly across remaining range (0 < amount < total)

## API Reference

### sub() - Select Message

```javascript
await $.proportional.sub(messages, amount, total)
```

Returns message based on amount/total ratio.

| Parameter | Type | Description |
|-----------|------|-------------|
| `messages` | string[] | Array of messages (min 2) |
| `amount` | number | Current value |
| `total` | number | Maximum value |

**Returns:** One message from the array

**Examples:**
```javascript
const healthMsg = await $.proportional.sub(
  ['dead', 'critical', 'wounded', 'hurt', 'healthy'],
  player.hp,
  player.maxHp
);

// With hp=15, maxHp=100:
//   hp=0:      'dead'
//   hp=1-24:   'critical'
//   hp=25-49:  'wounded'
//   hp=50-74:  'hurt'
//   hp=75-99:  'hurt' (still not at max)
//   hp=100:    'healthy' (exactly at max)
```

### index() - Get Index

```javascript
await $.proportional.index(messages, amount, total)
```

Returns which message index (0-based) would be selected.

**Examples:**
```javascript
const idx = await $.proportional.index(['empty', 'low', 'half', 'full'], 50, 100);
// idx = 2 (would select 'half')
```

### fromPercent() - Use Percentage

```javascript
await $.proportional.fromPercent(messages, percentage)
```

Use percentage directly (0-100 scale) instead of amount/total.

**Examples:**
```javascript
const msg = await $.proportional.fromPercent(
  ['empty', 'quarter', 'half', 'three-quarters', 'full'],
  75
);
// Returns 'three-quarters'
```

## Real-World Examples

### Health Display

```javascript
async showHealth(player, target) {
  const status = await $.proportional.sub(
    ['dead', 'near death', 'critical', 'wounded', 'hurt', 'scratched', 'healthy'],
    target.hp,
    target.maxHp
  );
  
  await player.tell(`${target.name} is ${status}.`);
}
```

### Hunger System

```javascript
async tickHunger(player) {
  player.food = Math.max(0, player.food - 1);
  
  const status = await $.proportional.sub(
    ['starving', 'famished', 'hungry', 'peckish', 'satisfied', 'full', 'stuffed'],
    player.food,
    player.maxFood
  );
  
  if (status === 'starving') {
    await player.takeDamage(5);
    await player.tell('You are starving!');
  } else if (player.food < player.maxFood * 0.25) {
    await player.tell(`You feel ${status}.`);
  }
}
```

### Container Capacity

```javascript
async describeContainer(container) {
  const capacity = await $.proportional.sub(
    ['empty', 'nearly empty', 'partially filled', 'mostly full', 'full'],
    container.contents.length,
    container.capacity
  );
  
  return `${container.name} is ${capacity}.`;
}
```

### Weapon Durability

```javascript
async showWeaponCondition(weapon) {
  const condition = await $.proportional.sub(
    ['broken', 'badly damaged', 'damaged', 'worn', 'good', 'pristine'],
    weapon.durability,
    weapon.maxDurability
  );
  
  if (condition === 'broken') {
    return `${weapon.name} is broken and useless.`;
  }
  return `${weapon.name} is in ${condition} condition.`;
}
```

### Thirst/Hydration

```javascript
async checkThirst(player) {
  const thirstLevel = await $.proportional.sub(
    ['parched', 'very thirsty', 'thirsty', 'hydrated'],
    player.water,
    player.maxWater
  );
  
  if (thirstLevel === 'parched') {
    await player.takeDamage(10);
    return 'You are dying of thirst!';
  }
  
  return `You are ${thirstLevel}.`;
}
```

### Room Crowding

```javascript
async getRoomDensity(room) {
  const people = room.contents.filter(c => c.type === 'agent');
  
  const crowding = await $.proportional.sub(
    ['empty', 'quiet', 'occupied', 'busy', 'crowded', 'packed'],
    people.length,
    room.capacity || 10
  );
  
  return `The room is ${crowding}.`;
}
```

### Progress Bars

```javascript
async showCraftingProgress(player, recipe) {
  const progress = await $.proportional.sub(
    ['just started', 'making progress', 'halfway done', 'almost finished', 'complete'],
    player.craftingProgress,
    recipe.duration
  );
  
  await player.tell(`Crafting: ${progress}`);
}
```

### Light Levels

```javascript
async describeLighting(room) {
  const lighting = await $.proportional.sub(
    ['pitch black', 'very dark', 'dim', 'well-lit', 'brightly lit'],
    room.lightLevel,
    room.maxLight
  );
  
  return `The area is ${lighting}.`;
}
```

### Decay System

```javascript
async checkItemDecay(item) {
  const state = await $.proportional.sub(
    ['destroyed', 'ruined', 'badly damaged', 'damaged', 'worn', 'good', 'pristine'],
    item.condition,
    item.maxCondition
  );
  
  if (state === 'destroyed') {
    await $.recycler.recycle(item);
    return 'The item crumbles to dust.';
  }
  
  return `The item is ${state}.`;
}
```

## Distribution Examples

With 5 messages `['a', 'b', 'c', 'd', 'e']` and max=100:

| Value | Message | Why |
|-------|---------|-----|
| 0 | a | Exactly 0 (always first message) |
| 1-24 | b | 1-25% range |
| 25-49 | c | 26-50% range |
| 50-74 | d | 51-75% range |
| 75-99 | d | 76-99% range (not at max yet) |
| 100 | e | Exactly max (always last message) |

## Tips & Best Practices

1. **First message = empty/dead/zero state** - Only shows at exactly 0
2. **Last message = full/perfect state** - Only shows at exactly max
3. **Use meaningful gradations** - Each middle message represents a range
4. **Odd number works well** - 5-7 messages gives good granularity
5. **Test edge cases** - Verify 0, 1, max-1, max all work correctly
6. **Combine with colors** - Use ANSI codes for visual indicators

## Common Patterns

### Status Display

```javascript
const status = await $.proportional.sub(messages, current, max);
await player.tell(`Status: ${status}`);
```

### Conditional Actions

```javascript
const status = await $.proportional.sub(messages, amount, total);
if (status === messages[0]) {
  // Handle empty/dead case
} else if (status === messages[messages.length - 1]) {
  // Handle full/perfect case
}
```

### Progressive Messages

```javascript
// Show message only when crossing thresholds
const oldIdx = await $.proportional.index(messages, oldAmount, total);
const newIdx = await $.proportional.index(messages, newAmount, total);

if (newIdx !== oldIdx) {
  const status = messages[newIdx];
  await player.tell(`You are now ${status}.`);
}
```

## See Also

- [$.format](./format.md) - Text formatting and layout
- [$.english](./english.md) - Grammar utilities
- [Best Practices](../best-practices.md) - Use utilities, don't reinvent
