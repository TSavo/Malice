/**
 * Example onCreate Method for a Player Object
 *
 * This shows how to use TypeScript types in your MOO methods.
 * Copy this pattern when creating new methods!
 */

/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/game.d.ts" />
/// <reference path="../.malice/types/system.d.ts" />

// Cast self to our custom PlayerObject type
// This gives us IntelliSense for player-specific properties
const player = self as PlayerObject;

// Initialize player stats
player.stats = {
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  strength: 10,
  dexterity: 10,
  intelligence: 10,
  charisma: 10,
  level: 1,
  experience: 0
};

// Initialize player inventory
player.inventory = [];
player.equipment = {};

// Set starting location (room #1)
player.location = 1;

// Set player description
player.name = args[0] as string || 'Unnamed Player';
player.description = 'A new adventurer.';

// Save the changes to MongoDB
await player.save();

// Use system utilities to send welcome message
await $.system.sendToPlayer(player.id, `
╔════════════════════════════════════════╗
║     Welcome to Malice, ${player.name}!     ║
╚════════════════════════════════════════╝

You find yourself in a strange new world...

Type 'look' to see your surroundings.
Type 'help' for a list of commands.
`);

// Broadcast to the room that a new player arrived
await $.system.broadcastToRoom(
  player.location,
  `${player.name} materializes out of thin air!`,
  player.id // Don't send to the player themselves
);

// Log the event
await $.system.log('info', 'Player created', {
  playerId: player.id,
  name: player.name,
  timestamp: new Date()
});

// Example: Roll for starting gold using dice
const startingGold = await $.system.rollDice(6, 3); // 3d6
player.set('gold', startingGold * 10);

await $.system.sendToPlayer(
  player.id,
  `You start your adventure with ${startingGold * 10} gold pieces.`
);
