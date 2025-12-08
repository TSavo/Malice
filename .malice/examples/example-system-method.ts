/**
 * Example System Utility Method: parseCommand
 *
 * This method would live on Object #2 (the System object)
 * and can be called from any other method using:
 *   await $.system.parseCommand(input)
 *
 * This demonstrates how to create reusable utility code.
 */

/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/game.d.ts" />

// Get the input string from arguments
const input = args[0] as string;

// Validate input
if (!input || typeof input !== 'string') {
  return {
    verb: '',
    directObject: undefined,
    preposition: undefined,
    indirectObject: undefined,
    fullText: ''
  };
}

// Normalize and split the input
const normalized = input.toLowerCase().trim();
const words = normalized.split(/\s+/);

// Common prepositions to recognize
const prepositions = new Set([
  'with', 'at', 'to', 'from', 'in', 'on', 'into', 'onto', 'using'
]);

// Parse the command structure
const result: ParsedCommand = {
  verb: words[0] || '',
  fullText: input
};

// If there's only a verb, return early
if (words.length === 1) {
  return result;
}

// Find preposition if it exists
let prepIndex = -1;
for (let i = 1; i < words.length; i++) {
  if (prepositions.has(words[i])) {
    prepIndex = i;
    break;
  }
}

if (prepIndex > 1) {
  // We have: verb + directObject + preposition + indirectObject
  result.directObject = words.slice(1, prepIndex).join(' ');
  result.preposition = words[prepIndex];
  if (prepIndex < words.length - 1) {
    result.indirectObject = words.slice(prepIndex + 1).join(' ');
  }
} else if (prepIndex === 1) {
  // We have: verb + preposition + indirectObject (no direct object)
  result.preposition = words[1];
  if (words.length > 2) {
    result.indirectObject = words.slice(2).join(' ');
  }
} else {
  // No preposition, just: verb + directObject
  result.directObject = words.slice(1).join(' ');
}

// Return the parsed command
return result;

/**
 * Example usage from another method:
 *
 * const cmd = await $.system.parseCommand('take sword from chest');
 *
 * // cmd = {
 * //   verb: 'take',
 * //   directObject: 'sword',
 * //   preposition: 'from',
 * //   indirectObject: 'chest',
 * //   fullText: 'take sword from chest'
 * // }
 *
 * if (cmd.verb === 'take') {
 *   // Handle take command
 *   const item = await findItemByName(cmd.directObject);
 *   const container = await findItemByName(cmd.indirectObject);
 *   // ...
 * }
 */
