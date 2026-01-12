#!/usr/bin/env npx tsx
/**
 * Room Description Fixer v2
 *
 * Uses regex to forcibly delete sentences containing:
 * - Second person (you/your/yourself)
 * - Coordinate references like (-15,4,-2)
 * - Exit/path patterns (beckon, leads to, paths)
 */

import * as fs from 'node:fs';

const INPUT_FILE = process.argv[2];
const OUTPUT_FILE =
  process.argv[3] || INPUT_FILE?.replace('.json', '-fixed.json');

if (!INPUT_FILE) {
  console.error(
    'Usage: npx tsx fix-room-descriptions-v2.ts <input.json> [output.json]',
  );
  process.exit(1);
}

interface Room {
  id: string;
  era: string;
  description?: string;
  [key: string]: any;
}

interface WorldExport {
  rooms: Room[];
  exits: any[];
  meta: any;
}

// Patterns to match sentences that should be deleted
const BAD_PATTERNS = [
  // Second person
  /\b(you|your|yourself|you're|you've)\b/i,
  // Coordinates like (-15,4,-2)
  /\(-?\d+\s*,\s*-?\d+\s*,\s*-?\d+\)/,
  // Exit/path patterns
  /\b(paths?\s+beckon|beckons?|exits?\s*:|leads?\s+(to|toward|down|up|north|south|east|west|another)|directions?\s+open|northward|southward|eastward|westward|upward|downward|passage\s+leads?|passageways?\s+beckon|further\s+(north|south|east|west|up|down|below|above))/i,
];

function hasBadPattern(sentence: string): boolean {
  return BAD_PATTERNS.some((pattern) => pattern.test(sentence));
}

function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries, keeping the delimiter
  // Handle newlines as paragraph breaks too
  const parts = text.split(/(?<=[.!?])\s+|\n+/);
  return parts.filter((s) => s.trim().length > 0);
}

function fixDescription(description: string): {
  fixed: string;
  deleted: string[];
} {
  const sentences = splitIntoSentences(description);
  const kept: string[] = [];
  const deleted: string[] = [];

  for (const sentence of sentences) {
    if (hasBadPattern(sentence)) {
      deleted.push(
        sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
      );
    } else {
      kept.push(sentence);
    }
  }

  // Rejoin with proper spacing
  let result = kept.join(' ');

  // Fix double spaces
  result = result.replace(/\s+/g, ' ').trim();

  // Add paragraph breaks back between logical sections (after every 3-4 sentences that end with period)
  const finalSentences = result.split(/(?<=[.!?])\s+/);
  if (finalSentences.length > 4) {
    const paragraphs: string[] = [];
    for (let i = 0; i < finalSentences.length; i += 4) {
      paragraphs.push(finalSentences.slice(i, i + 4).join(' '));
    }
    result = paragraphs.join('\n\n');
  }

  return { fixed: result, deleted };
}

async function main() {
  console.log('=== Room Description Fixer v2 (Regex-based) ===');
  console.log(`Input: ${INPUT_FILE}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log('');

  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8')) as WorldExport;
  console.log(`Loaded ${data.rooms.length} rooms`);

  let fixedCount = 0;
  let unchangedCount = 0;
  let totalDeleted = 0;

  for (const room of data.rooms) {
    if (!room.description) continue;

    const { fixed, deleted } = fixDescription(room.description);

    if (deleted.length > 0) {
      fixedCount++;
      totalDeleted += deleted.length;
      console.log(
        `[${room.id}] (${room.era}) - Deleted ${deleted.length} sentence(s):`,
      );
      for (const d of deleted) {
        console.log(`    - "${d}"`);
      }
      room.description = fixed;
    } else {
      unchangedCount++;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

  console.log('');
  console.log('=== Complete ===');
  console.log(`Fixed: ${fixedCount} rooms`);
  console.log(`Unchanged: ${unchangedCount} rooms`);
  console.log(`Total sentences deleted: ${totalDeleted}`);
  console.log(`Saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
