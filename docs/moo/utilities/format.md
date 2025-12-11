# $.format - Text Formatting

Use `$.format` for text layout, list formatting, and combining items with pronouns.

## Purpose

Provides comprehensive text formatting utilities: natural language lists, template composition with pronouns, layout (columns, tables, boxes), and text manipulation. The star feature is `compose()` which combines list formatting with pronoun substitution.

## Why Use This?

**Bad: Manual list formatting everywhere**
```javascript
// Different files, different formatting
function formatList1(items) {
  return items.join(', '); // No Oxford comma, no 'and'
}

function formatList2(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  // Missing Oxford comma
}
```

**Good: Consistent formatting**
```javascript
await $.format.prose(['sword', 'shield', 'helm'])
// "sword, shield, and helm" - Always correct
```

## API Reference

### prose() - Natural Language Lists

```javascript
await $.format.prose(items, conjunction = 'and')
```

Formats array as grammatical list with Oxford comma.

| Parameter | Type | Description |
|-----------|------|-------------|
| `items` | string[] | Array of items to format |
| `conjunction` | string | Word to use before last item (default: 'and') |

**Examples:**
```javascript
await $.format.prose(['sword'])                      // "sword"
await $.format.prose(['sword', 'shield'])            // "sword and shield"
await $.format.prose(['sword', 'shield', 'helm'])    // "sword, shield, and helm"
await $.format.prose(['red', 'blue'], 'or')          // "red or blue"
```

### compose() - Template with List + Pronouns

```javascript
await $.format.compose(template, items, options?)
```

The most powerful formatting tool—combines list formatting, count-based verb conjugation, and pronoun substitution in one call.

| Parameter | Type | Description |
|-----------|------|-------------|
| `template` | string | Template with list and pronoun codes |
| `items` | string[] | Array of items to format as list |
| `options` | object | { actor, target, directObj, indirectObj, location, viewer } |

**Template codes for lists:**

| Code | Meaning | 1 item | 2+ items |
|------|---------|--------|----------|
| `%T` | List with "The" | "The sword" | "The sword and shield" |
| `%t` | List with "the" | "the sword" | "the sword and shield" |
| `%A` | List with "A/An" | "A sword" | "A sword and shield" |
| `%a` | List with "a/an" | "a sword" | "a sword and shield" |
| `%v{verb}` | Verb conjugated by count | "falls" | "fall" |

**Plus all `$.pronoun` codes** (`%N`, `%s`, `%p`, `%tN`, etc.) when you pass an actor.

**Examples:**

**Basic list formatting:**
```javascript
// Single item
await $.format.compose('%T %v{fall} to the ground.', ['sword'])
// "The sword falls to the ground."

// Multiple items
await $.format.compose('%T %v{fall} to the ground.', ['sword', 'shield'])
// "The sword and shield fall to the ground."

// Three+ items (Oxford comma)
await $.format.compose('%T %v{clatter} noisily.', ['sword', 'shield', 'helm'])
// "The sword, shield, and helm clatter noisily."
```

**Combining with pronouns:**
```javascript
// Actor watching items fall
await $.format.compose(
  '%N %v{watch} as %t %v{tumble} to the ground.',
  ['coins'],
  { actor: player }
);
// Player: "You watch as the coins tumble to the ground."
// Others: "Bob watches as the coins tumble to the ground."

// Actor dropping multiple items
await $.format.compose(
  '%N %v{drop} %t.',
  ['sword', 'shield'],
  { actor: player }
);
// Player: "You drop the sword and shield."
// Others: "Bob drops the sword and shield."

// Full interaction with target
await $.format.compose(
  '%N %v{throw} %t at %tN!',
  ['dagger', 'rock'],
  { actor: attacker, target: victim }
);
// Attacker: "You throw the dagger and rock at Bob!"
// Victim:   "Jim throws the dagger and rock at you!"
// Others:   "Jim throws the dagger and rock at Bob!"
```

**Verb conjugation by count:**
```javascript
// 1 item = singular verb (falls, is, has)
// 2+ items = plural verb (fall, are, have)

await $.format.compose('%T %v{is} broken.', ['sword'])
// "The sword is broken."

await $.format.compose('%T %v{is} broken.', ['sword', 'shield'])
// "The sword and shield are broken."

// Works with irregular verbs
await $.format.compose('%T %v{have} been destroyed.', ['sword'])
// "The sword has been destroyed."

await $.format.compose('%T %v{have} been destroyed.', ['sword', 'armor'])
// "The sword and armor have been destroyed."
```

### verb() - Count-Based Conjugation

```javascript
await $.format.verb(verb, count)
```

Conjugates verb based on count (for use outside compose).

**Examples:**
```javascript
await $.format.verb('fall', 1)   // "falls"
await $.format.verb('fall', 3)   // "fall"
await $.format.verb('are', 1)    // "is"
await $.format.verb('have', 1)   // "has"
```

### Layout Utilities

#### columns()
```javascript
await $.format.columns(items, columnCount)
// ["a    b", "c    d", "e"]
```

#### table()
```javascript
await $.format.table([
  ['Name', 'HP', 'Status'],
  ['Goblin', '10', 'Alive'],
  ['Orc', '25', 'Dead']
])
```

#### bar()
```javascript
await $.format.bar(current, max, width, options?)
// "[===============     ] 75%"
```

#### list()
```javascript
await $.format.list(items, { style: 'bullet' })
// ["  • sword", "  • shield"]
```

#### keyValue()
```javascript
await $.format.keyValue({ Name: 'Bob', HP: 100, Status: 'Alive' })
// ["Name:   Bob", "HP:     100", "Status: Alive"]
```

#### box()
```javascript
await $.format.box('Hello!', { style: 'single' })
// ["┌────────┐", "│ Hello! │", "└────────┘"]
```

#### Text Manipulation
```javascript
await $.format.wrap(text, width)       // Word wrap
await $.format.padRight(text, width)   // "hi        "
await $.format.padLeft(text, width)    // "   42"
await $.format.center(text, width)     // "    hi    "
```

## Real-World Examples

### Inventory Pickup

```javascript
const items = ['rusty sword', 'torn cloak', 'gold coin'];
await $.format.compose('%N %v{pick} up %t.', items, { actor: player });
// "You pick up the rusty sword, torn cloak, and gold coin."
```

### Clothing Destruction (Decay)

```javascript
const destroyed = ['shirt', 'pants'];
await $.format.compose('%p %T %v{fall} away in tatters.', destroyed, { actor: corpse });
// "His shirt and pants fall away in tatters."
```

### Combat Wounds

```javascript
const wounds = ['deep gash', 'bruise'];
await $.format.compose('%N %v{inflict} %a on %tN!', wounds, { actor: attacker, target: victim });
// "You inflict a deep gash and bruise on Bob!"
```

### Room Contents

```javascript
const items = room.contents.filter(c => c.type === 'item').map(i => i.name);
if (items.length > 0) {
  const msg = await $.format.compose('%T %v{is} here.', items);
  await player.tell(msg);
}
// "The sword, shield, and helm are here."
```

### Multi-Item Actions

```javascript
async dropMultiple(player, itemNames) {
  const items = itemNames.map(name => this.findItem(player, name));
  
  await $.format.compose(
    '%N %v{drop} %t.',
    items.map(i => i.name),
    { actor: player }
  );
  
  for (const item of items) {
    item.location = player.location;
    player.location.contents.push(item);
  }
}
```

## Tips & Best Practices

1. **Use compose() for multi-item messages** - Handles lists + pronouns in one call
2. **Use prose() for simple lists** - When you don't need pronouns
3. **Verb conjugation is automatic** - compose() uses list count
4. **Combine with $.pronoun** - compose() accepts all pronoun codes
5. **Test with 1, 2, and 3+ items** - Verify singular/plural and Oxford comma

## Common Patterns

### List + Perspective

```javascript
// Format items with proper perspective
await $.format.compose('%N %v{see} %t.', itemNames, { actor: player });
```

### Conditional Verbs

```javascript
// Verb changes based on count
await $.format.compose('%T %v{is} damaged.', items);
// 1 item:  "The sword is damaged."
// 2 items: "The sword and shield are damaged."
```

### Possessive Lists

```javascript
// Use pronoun codes with lists
await $.format.compose('%p %t %v{break}.', items, { actor: player });
// "Your sword and shield break."
```

## See Also

- [$.english](./english.md) - Grammar and pluralization (used internally)
- [$.pronoun](./pronoun.md) - Perspective-aware messaging (used in compose)
- [Best Practices](../best-practices.md) - Composition patterns
