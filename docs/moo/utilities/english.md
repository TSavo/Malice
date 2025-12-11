# $.english - Grammar Utilities

Use `$.english` for all grammar operations. Never duplicate conjugation/pluralization logic.

## Purpose

Provides comprehensive English grammar utilities: verb conjugation, pluralization, articles, possessives, and list formatting. Ensures consistent grammar throughout the game.

## Why Use This?

**Bad: Hardcoded grammar everywhere**
```javascript
// 20 different files, each with their own pluralization
function describeSwords(count) {
  if (count === 1) return '1 sword';
  return count + ' swords';
}

function describeWolves(count) {
  if (count === 1) return '1 wolf';
  return count + ' wolfs';  // BUG: Should be "wolves"
}
```

**Good: One utility, consistent everywhere**
```javascript
await $.english.count(1, 'sword')  // "1 sword"
await $.english.count(2, 'sword')  // "2 swords"
await $.english.count(2, 'wolf')   // "2 wolves"
```

## API Reference

### Verb Conjugation

```javascript
await $.english.conjugate(verb, person)
```

Conjugates verb for third person singular or other persons.

| Parameter | Type | Description |
|-----------|------|-------------|
| `verb` | string | Base verb form |
| `person` | number | 1/2 = base form, 3 = third person |

**Examples:**
```javascript
await $.english.conjugate('walk', 3)   // "walks"
await $.english.conjugate('kiss', 3)   // "kisses"
await $.english.conjugate('cry', 3)    // "cries"
await $.english.conjugate('be', 3)     // "is"
await $.english.conjugate('have', 3)   // "has"

await $.english.conjugate('walk', 1)   // "walk"
await $.english.conjugate('walk', 2)   // "walk"
```

### Past Tense

```javascript
await $.english.pastTense(verb)
```

Returns past tense of verb (handles irregulars).

**Examples:**
```javascript
await $.english.pastTense('walk')      // "walked"
await $.english.pastTense('run')       // "ran"
await $.english.pastTense('cut')       // "cut"
await $.english.pastTense('be')        // "was"
```

### Present Participle

```javascript
await $.english.presentParticiple(verb)
```

Returns -ing form of verb.

**Examples:**
```javascript
await $.english.presentParticiple('walk')  // "walking"
await $.english.presentParticiple('run')   // "running"
await $.english.presentParticiple('sit')   // "sitting"
```

### Pluralization

```javascript
await $.english.plural(noun)
```

Returns plural form of noun.

**Examples:**
```javascript
await $.english.plural('sword')        // "swords"
await $.english.plural('wolf')         // "wolves"
await $.english.plural('child')        // "children"
await $.english.plural('sheep')        // "sheep"
await $.english.plural('octopus')      // "octopi"
```

### Count with Noun

```javascript
await $.english.count(count, noun)
```

Returns formatted count with properly pluralized noun.

**Examples:**
```javascript
await $.english.count(0, 'apple')      // "0 apples"
await $.english.count(1, 'apple')      // "1 apple"
await $.english.count(3, 'apple')      // "3 apples"
```

### Articles

```javascript
await $.english.article(word)
```

Returns "a" or "an" based on pronunciation.

**Examples:**
```javascript
await $.english.article('apple')       // "an apple"
await $.english.article('sword')       // "a sword"
await $.english.article('hour')        // "an hour"
await $.english.article('unicorn')     // "a unicorn" (pronunciation)
```

### Possessives

```javascript
await $.english.possessive(noun)
```

Returns possessive form (adds 's or ').

**Examples:**
```javascript
await $.english.possessive('Bob')      // "Bob's"
await $.english.possessive('boss')     // "boss'"
await $.english.possessive('James')    // "James'"
```

### Ordinals

```javascript
await $.english.ordinal(number)
```

Returns ordinal string (1st, 2nd, 3rd, etc.).

**Examples:**
```javascript
await $.english.ordinal(1)             // "1st"
await $.english.ordinal(2)             // "2nd"
await $.english.ordinal(3)             // "3rd"
await $.english.ordinal(22)            // "22nd"
await $.english.ordinal(101)           // "101st"
```

### Capitalization

```javascript
await $.english.capitalize(text)
await $.english.titleCase(text)
```

**Examples:**
```javascript
await $.english.capitalize('hello')    // "Hello"
await $.english.titleCase('the old man') // "The Old Man"
```

### Number Words

```javascript
await $.english.numberWord(number)
```

Converts number to word form.

**Examples:**
```javascript
await $.english.numberWord(1)          // "one"
await $.english.numberWord(42)         // "forty-two"
await $.english.numberWord(100)        // "one hundred"
```

### Lists with Oxford Comma

```javascript
await $.english.list(items, conjunction = 'and')
```

Formats array as grammatical list with Oxford comma.

**Examples:**
```javascript
await $.english.list(['a'])                      // "a"
await $.english.list(['a', 'b'])                 // "a and b"
await $.english.list(['a', 'b', 'c'])            // "a, b, and c"
await $.english.list(['a', 'b', 'c'], 'or')      // "a, b, or c"
```

## Real-World Examples

### Dynamic Room Description

```javascript
const items = this.contents.filter(c => c.type === 'item');
const people = this.contents.filter(c => c.type === 'agent');

const parts = [
  this.description,
  items.length ? `You see ${await $.english.list(items.map(i => i.name))} here.` : null,
  people.length ? `${await $.english.list(people.map(p => p.name))} ${await $.english.conjugate('is', people.length > 1 ? 2 : 3)} here.` : null,
].filter(Boolean);

return parts.join('\n\n');
```

### Combat Message

```javascript
const damage = 15;
const verb = await $.english.conjugate('hit', 3);
const weapon = await $.english.article(weaponName);
await player.tell(`You ${verb} the goblin with ${weapon} for ${damage} damage.`);
```

### Inventory Listing

```javascript
const items = player.inventory;
if (items.length === 0) {
  return 'You are not carrying anything.';
}

const list = await $.english.list(items.map(i => i.name));
return `You are carrying ${list}.`;
```

## Tips & Best Practices

1. **Use for all pluralization** - Don't write your own plural logic
2. **Combine with $.pronoun** - Use together for perspective-aware messages
3. **Cache results if needed** - Grammar calls are fast but can be cached
4. **Handle irregulars automatically** - System knows common irregular verbs/nouns

## See Also

- [$.pronoun](./pronoun.md) - Perspective-aware messaging
- [$.format](./format.md) - Text layout and formatting
- [Best Practices](../best-practices.md) - Composition over duplication
