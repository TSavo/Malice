# Quick Reference

Fast lookup for common MOO programming tasks.

## Object Operations

### Create Object
```javascript
const obj = await $.recycler.create(prototype, properties);
```

### Delete Object
```javascript
await $.recycler.recycle(obj);              // Soft delete (preferred)
await $.recycler.recycleTree(obj);          // Delete with contents
await $.recycler.purge(obj);                // Hard delete (rare)
```

### Move Object
```javascript
await obj.moveTo(destination);              // Basic move
await obj.moveTo(destination, mover);       // With context
```

### Load Object
```javascript
const obj = await $.load(id);               // By ID
const obj = await $.load(42);
const obj = await $[42];                    // Shorthand
const obj = $.aliasName;                    // By alias
```

## Properties

### Get Property
```javascript
const value = obj.property;                 // Direct access
const value = obj.get('property');          // Via get()
```

### Set Property
```javascript
obj.property = value;                       // Direct (creates shadow)
obj.set('property', value);                 // Via set()
```

### Check Property
```javascript
const has = obj.hasOwnProperty('prop');     // Own property
const has = 'prop' in obj;                  // Including inherited
```

## Methods

### Define Method
```javascript
obj.setMethod('methodName', `
  // Method code here
  // self = this object
  // args = array of arguments
  return value;
`);
```

### Call Method
```javascript
const result = await obj.methodName(arg1, arg2);
const result = await obj.call('methodName', arg1, arg2);
```

### Call Parent Method
```javascript
await pass();                               // Same args
await pass(arg1, arg2);                     // Different args
```

## Verbs

### Register Verb
```javascript
await player.registerVerb(
  ['pattern1', 'pattern2'],                 // Patterns
  sourceObject,                             // Source
  'methodName'                              // Handler
);
```

### Unregister Verbs
```javascript
await player.unregisterVerbsFrom(source);   // All from source
```

### Pattern Syntax
```javascript
'look'                                      // Exact match
'look %s'                                   // + rest of line
'give %i to %i'                             // + two items
'wear %t'                                   // + this object
```

## Messaging

### Direct Output
```javascript
await player.tell(message);                 // Always delivered
context.send(message);                      // Raw telnet
```

### Sensory Output
```javascript
await player.see(message);                  // Visual
await player.hear(message);                 // Audio
await player.smell(message);                // Olfactory
await player.taste(message);                // Gustatory
await player.feel(message);                 // Tactile
```

### Perspective-Aware
```javascript
// Single viewer
const msg = await $.pronoun.sub(
  '%N %v{pick} up %d.',
  actor, directObj, target, indirectObj, location, viewer
);

// Announce to room
await $.pronoun.announce(room, '%N %v{pick} up %d.', actor, item);
```

### Emotes
```javascript
await $.emote.broadcast('.wave and "Hello!"', actor, room);
```

## Grammar & Formatting

### Articles
```javascript
await $.english.article('apple');           // "an"
await $.english.article('sword');           // "a"
```

### Plurals
```javascript
await $.english.plural('cat');              // "cats"
await $.english.plural('mouse');            // "mice"
```

### Verb Conjugation
```javascript
await $.english.conjugate('fall', 3);       // "falls" (3rd person)
await $.format.verb('fall', 1);             // "falls" (count=1)
await $.format.verb('fall', 2);             // "fall" (count=2)
```

### Lists
```javascript
await $.format.prose(['a', 'b', 'c']);      // "a, b, and c"
await $.format.prose(['a', 'b'], 'or');     // "a or b"
```

### Templates with Lists
```javascript
await $.format.compose('%T %v{fall}.', items);
// 1 item: "The sword falls."
// 2 items: "The sword and shield fall."
```

## Proportional Messages

### Value-Based Selection
```javascript
const msg = await $.proportional.sub(
  ['dead', 'critical', 'hurt', 'healthy'],
  hp, maxHp
);
```

### Percentage-Based
```javascript
const msg = await $.proportional.fromPercent(
  ['empty', 'half', 'full'],
  50
);
```

## Prompts

### Text Question
```javascript
const answer = await $.prompt.question(player, 'Name? ');
```

### Yes/No
```javascript
const yes = await $.prompt.yesorno(player, 'Continue?');
```

### Choice Menu
```javascript
const choice = await $.prompt.choice(player, 'Pick:', {
  option1: 'Description 1',
  option2: 'Description 2'
});
```

### Multiline Input
```javascript
const text = await $.prompt.multiline(player, 'Enter text:');
```

## Scheduling

### Schedule Job
```javascript
await $.scheduler.schedule(
  'jobName',                                // Unique name
  delayMs,                                  // Initial delay
  intervalMs,                               // Repeat interval (0=once)
  target,                                   // Object to call
  'methodName',                             // Method name
  ...args                                   // Arguments
);
```

### Manage Jobs
```javascript
await $.scheduler.unschedule('jobName');    // Remove
await $.scheduler.setEnabled('jobName', false); // Disable
await $.scheduler.runNow('jobName');        // Force run
```

## Locks (Mutex)

### Acquire Lock
```javascript
const lock = await $.mutex.acquire(obj, 'lockName', timeoutMs);
if (!lock) {
  // Failed to acquire
}
```

### Release Lock
```javascript
await $.mutex.release(obj, 'lockName');
```

### With Data
```javascript
await $.mutex.acquire(obj, 'lock', 5000, { userId: 123 });
const data = await $.mutex.getData(obj, 'lock');
```

## Cloning

### Clone Object
```javascript
const clone = await $.memento.clone(original);
```

### Clone Tree
```javascript
const clone = await $.memento.cloneTree(original);
```

### Capture State
```javascript
const snapshot = await $.memento.capture(obj);
```

### Restore State
```javascript
await $.memento.restore(obj, snapshot);
```

## Action Exclusions

### Prevent Simultaneous Actions
```javascript
if (!await $.exclusions.canAct(player, 'eating')) {
  return 'You are already eating.';
}

await $.exclusions.startAction(player, 'eating');
// ... do action ...
await $.exclusions.endAction(player, 'eating');
```

## Contents & Search

### Get Contents
```javascript
for (const obj of container.contents) {
  // ... iterate ...
}
```

### Find Item
```javascript
const item = container.contents.find(obj =>
  obj.name === searchName ||
  obj.aliases?.includes(searchName)
);
```

### Filter Contents
```javascript
const players = room.contents.filter(obj => obj.isPlayer);
const items = room.contents.filter(obj => !obj.isPlayer);
```

## Aliases

### Register Alias
```javascript
await $.addAlias('aliasName', object);
```

### Use Alias
```javascript
const obj = $.aliasName;
const obj = await $.load($.getAlias('aliasName'));
```

### List Aliases
```javascript
const aliases = $.aliases;
// { nothing: -1, root: 1, ... }
```

## Common Prototypes

```javascript
$.root              // Base of everything
$.describable       // Has name, description, location
$.location          // Can contain objects
$.room              // Room with exits
$.exit              // Directional link
$.agent             // Can act (has verbs)
$.embodied          // Has body, HP
$.human             // Human-type body
$.player            // Player character
$.admin             // Admin player

$.wearable          // Can be worn (base)
$.clothing          // Wearable clothing (implementation)
$.edible            // Can be consumed (base)
$.food              // Edible food (implementation)
$.drink             // Edible drink (implementation)
$.decayable         // Decays over time
$.bodyPart          // Body part
```

## Pronoun Codes

In templates like `$.pronoun.sub()` and `$.format.compose()`:

| Code | Actor | Target | Example |
|------|-------|--------|---------|
| `%N` | Subject pronoun | Subject pronoun | You/Bob |
| `%n` | Name | Name | Bob |
| `%O` | Object pronoun | Object pronoun | you/him |
| `%p` | Possessive | Possessive | your/his |
| `%P` | Possessive (cap) | Possessive (cap) | Your/His |
| `%r` | Reflexive | Reflexive | yourself/himself |
| `%s` | Is/are | Is/are | are/is |
| `%v{verb}` | Conjugated | - | pick/picks |
| `%d` | Direct obj name | - | the sword |
| `%D` | Direct obj (cap) | - | The sword |
| `%tN` | - | Subject | You/Alice |
| `%tO` | - | Object | you/her |

## Common Hooks

### Movement Hooks (on moving object)
```javascript
async onLeaving(dest, source, mover) { }
async onArrived(dest, source, mover) { }
```

### Container Hooks (on container)
```javascript
async onContentLeaving(obj, dest, mover) { }
async onContentArrived(obj, source, mover) { }
async onContentLeft(obj, dest, mover) { }
```

### Lifecycle Hooks
```javascript
async onCreate() { }
async onDestroy() { }
```

### Connection Hooks
```javascript
async connect() { }
async disconnect() { }
```

## Debugging

### Console Logging
```javascript
console.log('Debug info:', value);
console.error('Error:', error);
```

### Object Inspection
```javascript
obj.getOwnProperties();                     // Own props
obj.getOwnMethods();                        // Own methods
obj.getParent();                            // Parent ID
```

### Check Method Existence
```javascript
const has = await obj.hasMethodAsync('methodName');
```

## Error Handling

### Try-Catch
```javascript
try {
  await riskyOperation();
} catch (error) {
  console.error('Failed:', error.message);
  await player.tell('Operation failed.');
}
```

### Throw Error
```javascript
throw new Error('Descriptive error message');
```

### Cancel Movement (in hooks)
```javascript
async onContentLeaving(obj, dest, mover) {
  if (self.locked) {
    throw new Error('Container is locked!');
  }
}
```

## Async Patterns

### Load Multiple
```javascript
const [a, b, c] = await Promise.all([
  $.load(idA),
  $.load(idB),
  $.load(idC)
]);
```

### Process All
```javascript
await Promise.all(
  items.map(item => item.process())
);
```

### Sequential Processing
```javascript
for (const item of items) {
  await item.process();
}
```

## Performance Tips

1. **Load in parallel** when possible with `Promise.all()`
2. **Copy arrays** before modifying during iteration
3. **Cache loaded objects** instead of reloading
4. **Use $.load()** instead of direct database access
5. **Batch operations** when processing many items
6. **Profile hot paths** to find bottlenecks

## Security Checklist

- ✅ Validate all user input
- ✅ Check permissions before operations
- ✅ Don't trust client data
- ✅ Whitelist allowed properties
- ✅ Sanitize text output
- ✅ Limit resource consumption
- ✅ Log admin actions
- ✅ Use proper error messages (no stack traces to users)

## See Also

- [Common Patterns](./patterns.md) - Reusable code patterns
- [Anti-Patterns](./anti-patterns.md) - What NOT to do
- [Best Practices](../best-practices.md) - Coding guidelines
- [Utilities](../utilities/) - Utility documentation
