/**
 * Using Direct Object References: $2, $3, etc.
 *
 * Now you can reference objects directly without $.load()!
 * This example shows the NEW clean syntax.
 */

/// <reference path="../.malice/malice.d.ts" />

// OLD WAY (still works, but verbose):
const systemOld = await $.load(2);
await systemOld.call('someMethod', args);

// NEW WAY (clean and autocomplete-friendly):
const sys = $2;  // Direct reference to Object #2
await sys.someMethod(args);  // TypeScript knows what methods exist!

// Even cleaner - use it inline:
await $2.prompt('What is your name?');
await $3.doStuff();

// Assign to variables with types:
const player = $5;  // If $5 is a player object
player.health -= 10;  // IntelliSense works!
await player.save();

// Mix with traditional $ methods:
const newObj = await $.create({
  parent: 1,
  properties: { name: 'Test' },
  methods: {}
});

// Then immediately reference it:
const obj = await $.load(newObj.id);
// Or if you know the ID: $42.doSomething()

/**
 * BENEFITS:
 *
 * 1. Clean syntax: $2.method() instead of (await $.load(2)).call('method')
 * 2. Full autocomplete: TypeScript knows $2 is MaliceObject_2
 * 3. Type-safe: Can't call methods that don't exist
 * 4. Cached: Objects are already loaded in manager cache
 *
 * LIMITATIONS:
 *
 * - Only works for objects that are already loaded in cache
 * - If object not in cache, throws "Object #N not found or not loaded"
 * - Use await $.load(N) for objects you haven't accessed yet
 */

// Example: Command handler using direct references
const input = args[0] as string;
const cmd = await $2.parseCommand(input);  // $2 is system object

if (cmd.verb === 'look') {
  const room = $10;  // Current room
  await $2.sendToPlayer(self.id, room.description);
} else if (cmd.verb === 'attack') {
  const targetId = parseInt(cmd.target || '0');
  const target = await $.load(targetId);  // Load first time

  // Then use direct reference:
  const result = await $4.attack(self.id, target.id);  // $4 is combat manager
  await $2.sendToPlayer(self.id, result.message);
}
