/**
 * Using Context Variables in Methods
 *
 * All object methods now have access to special context variables:
 * - args: actual arguments passed to the method
 * - context: execution context (ConnectionContext for telnet/websocket connections)
 * - player: player object (from context.player, or self if not available)
 * - self: the current object
 * - $: object manager with $N direct reference support
 */

/// <reference path="../.malice/malice.d.ts" />

// Example 1: Using args
// Called as: await someObj.greet('Alice', 25)
const name = args[0] as string;
const age = args[1] as number;
console.log(`Hello ${name}, you are ${age} years old!`);

// Example 2: Using context to send messages to connected client
if (context) {
  context.send('Welcome to the game!');

  // Check authentication
  if (context.isAuthenticated()) {
    const userId = context.getUserId();
    context.send(`You are logged in as user #${userId}`);
  }
}

// Example 3: Using player object
if (player) {
  // Access player properties and methods
  const health = player.get('health');
  const name = player.get('name');

  // Call player methods
  await player.call('updateStatus', context, 'online');

  // Or use direct syntax if you know it's in cache
  if (player.id === 5) {
    await $5.someMethod();
  }
}

// Example 4: Complete interaction handler
async function handleCommand(input: string) {
  // Parse the command
  const cmd = await $2.parseCommand(input);

  if (cmd.verb === 'look') {
    const room = await $.load(player.get('location') as number);
    const description = room.get('description');

    if (context) {
      context.send(description as string);
    }
  } else if (cmd.verb === 'say') {
    const message = cmd.rest || '';

    // Broadcast to room
    await $2.broadcast(
      player.get('location') as number,
      `${player.get('name')} says: ${message}`
    );
  }
}

// Example 5: Method invocation with context
// From connection handler or other code:
//
// const connectionContext = {
//   send: (text: string) => socket.write(text),
//   close: () => socket.end(),
//   connection: socket,
//   player: playerObject,
//   isAuthenticated: () => true,
//   getUserId: () => 5
// };
//
// await handlerObject.call('handleInput', connectionContext, userInput);
//
// Inside the method, you'll have access to:
// - args[0] === userInput
// - context === connectionContext
// - player === playerObject
