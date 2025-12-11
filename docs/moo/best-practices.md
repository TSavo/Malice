# Best Practices

## The Golden Rule

**Combine Utilities, Never Duplicate Logic**

Every utility method in Malice should do ONE thing well. Complex behaviors come from COMBINING utilities, not from making utilities more complex.

## Why This Matters

**Before (Wrong):**
```javascript
$.english.listWithPronouns(items, viewer) {
  // 100 lines doing both list formatting AND pronoun substitution
}
```

**After (Right):**
```javascript
// Each utility does ONE thing
const names = items.map(i => i.name);
const list = $.english.list(names); // List formatting
const text = await $.pronoun.sub(list, viewer); // Pronoun substitution
```

When you need "list formatting with pronoun substitution," you COMBINE `$.english.list()` and `$.pronoun.sub()`. You don't create a hybrid utility.

## Composition Table

| Task | Utilities | Pattern |
|------|-----------|---------|
| Format a list with pronouns | $.english.list + $.pronoun.sub | List first, substitute after |
| Format message with quantity | $.english.quantity + $.format.interpolate | Quantity first, interpolate after |
| Delayed action with exclusion | $.exclusions.start + $.scheduler.in | Check exclusion, then schedule |
| Format plural possessive | $.english.pluralize + $.english.possessive | Pluralize first, possessive after |

## Real Examples

### Example 1: Room Contents

**Bad:**
```javascript
// Trying to do everything in one method
describe() {
  // 50 lines building a complex description
  // Handles pronouns, lists, plurals, all mixed together
}
```

**Good:**
```javascript
describe() {
  const items = this.contents.filter(c => c.type === 'item');
  const people = this.contents.filter(c => c.type === 'agent');
  
  // Each utility does ONE thing
  const itemList = $.english.list(items.map(i => i.name));
  const peopleList = $.english.list(people.map(p => p.name));
  
  return [
    this.description,
    items.length ? `You see ${itemList} here.` : null,
    people.length ? `${peopleList} ${$.english.pluralize('is', people.length)} here.` : null,
  ].filter(Boolean).join('\n\n');
}
```

### Example 2: Combat Messages

**Bad:**
```javascript
// One giant method that does everything
attack(target, weapon) {
  // Calculates damage
  // Checks pronouns
  // Formats messages
  // Applies effects
  // All mixed together
}
```

**Good:**
```javascript
async attack(target, weapon) {
  // Step 1: Calculate (separate concern)
  const damage = await this.calculateDamage(weapon, target);
  
  // Step 2: Apply (separate concern)
  await target.takeDamage(damage);
  
  // Step 3: Format message (composing utilities)
  const weaponName = weapon.name;
  const message = await $.pronoun.sub(
    `%N ${$.english.pluralize('hits', 1)} %t with ${weaponName} for ${damage} damage.`,
    this,
    target
  );
  
  // Step 4: Announce (separate concern)
  await this.location.announce(this, target, {
    actor: message,
    target: message,
    others: message,
  });
}
```

## When to Create a New Utility

### YES - Create a new utility when:
- The logic will be used in 3+ different places
- It's a clear, atomic operation
- It has a single, well-defined responsibility
- It can be tested independently

### NO - Don't create a utility when:
- It's only used once (inline it)
- It's just combining two existing utilities
- It has multiple responsibilities (split it)
- It's specific to one prototype (make it a method)

## Utility Design Patterns

### Pattern 1: Transform Data
```javascript
// Utilities that transform input to output
$.english.pluralize(word, count)
$.format.capitalize(text)
$.english.article(word)
```

### Pattern 2: Query State
```javascript
// Utilities that check conditions
$.exclusions.check(obj, action)
await $.mutex.isLocked(lockName)
```

### Pattern 3: Orchestrate Actions
```javascript
// Utilities that coordinate other utilities
await $.scheduler.in(5, callback) // Uses mutex + timer
await $.exclusions.start(obj, 'walk', msg) // Uses mutex + rules
```

## Common Anti-Patterns

### Anti-Pattern 1: God Methods

**Wrong:**
```javascript
$.message.sendToRoom(room, actor, target, message, options) {
  // Handles pronouns
  // Handles list formatting
  // Handles visibility
  // Handles observers
  // 200 lines of mixed concerns
}
```

**Right:**
```javascript
// Small, composable pieces
async announceToRoom(room, actor, target, messages) {
  const visible = await this.getVisibleContents(room, actor);
  
  for (const observer of visible) {
    const message = this.selectMessage(observer, actor, target, messages);
    const formatted = await $.pronoun.sub(message, actor, target, observer);
    await observer.showMessage(formatted);
  }
}
```

### Anti-Pattern 2: Duplicate Logic

**Wrong:**
```javascript
// In room-builder.ts
describeContents() {
  return items.map(i => i.name).join(', '); // Manual list formatting
}

// In container-builder.ts
listItems() {
  return items.map(i => i.name).join(', '); // Same logic, duplicated
}
```

**Right:**
```javascript
// Both use the same utility
describeContents() {
  return $.english.list(this.contents.map(c => c.name));
}

listItems() {
  return $.english.list(this.items.map(i => i.name));
}
```

### Anti-Pattern 3: Leaking Abstractions

**Wrong:**
```javascript
// Exposing internal details
$.mutex.lock(obj, `action:${action}`, timeout) // User has to know prefix
```

**Right:**
```javascript
// Hide implementation details
$.exclusions.start(obj, action, message, timeout) // Manages prefix internally
```

## Testing Composition

Good utilities are easy to test in isolation:

```javascript
// Test $.english.list alone
expect($.english.list(['a', 'b', 'c'])).toBe('a, b, and c');

// Test $.pronoun.sub alone
expect(await $.pronoun.sub('%N attacks.', actor)).toBe('Bob attacks.');

// Test them composed
const items = ['sword', 'shield', 'potion'];
const list = $.english.list(items);
const message = await $.pronoun.sub(`%N ${$.english.pluralize('has', 1)} ${list}.`, actor);
expect(message).toBe('Bob has sword, shield, and potion.');
```

Each utility is tested independently, and composition is natural.

## Guidelines Summary

1. **One responsibility per utility** - Does one thing well
2. **Compose, don't combine** - Mix utilities, don't merge them
3. **Test in isolation** - Each utility tests independently
4. **Hide implementation** - Abstract internal details
5. **Reuse, don't duplicate** - Same logic? Same utility.

## See Also

- [Architecture](./architecture.md) - Why utilities go in Bootstrap
- [Core Concepts](./core-concepts.md) - Objects and methods
- [Utilities](./utilities/) - All available utilities
