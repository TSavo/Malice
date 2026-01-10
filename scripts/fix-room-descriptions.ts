#!/usr/bin/env npx tsx
/**
 * Room Description Fixer
 *
 * Uses AI to check and fix room descriptions by removing:
 * - Second person (you/your/yourself)
 * - Coordinate references like (-15,4,-2)
 * - Exit/path sentences
 */

import * as fs from 'fs';

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'mistral:7b';
const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3] || INPUT_FILE?.replace('.json', '-fixed.json');

if (!INPUT_FILE) {
  console.error('Usage: npx tsx fix-room-descriptions.ts <input.json> [output.json]');
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

// Quick regex pre-check to avoid unnecessary AI calls
function hasObviousProblems(description: string): boolean {
  // Check for second person
  if (/\b(you|your|yourself|you're|you've)\b/i.test(description)) return true;

  // Check for coordinates like (-15,4,-2)
  if (/\(-?\d+\s*,\s*-?\d+\s*,\s*-?\d+\)/.test(description)) return true;

  // Check for common exit patterns
  if (/\b(paths?\s+beckon|exits?\s*:|leads?\s+(to|toward|down|up|north|south|east|west)|directions?\s+open)/i.test(description)) return true;

  return false;
}

async function callOllama(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 4000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.response.trim();
}

function buildPrompt(description: string): string {
  return `DELETE bad sentences from this room description.

DESCRIPTION:
"""
${description}
"""

SENTENCES TO DELETE (do not rewrite, just remove entirely):
- Any sentence containing the words: you, your, yourself, you're, you've
- Any sentence containing coordinate patterns like (-15,4,-2) or (10,5,-3)
- Any sentence containing the words: path, paths, exit, exits, leads, lead, beckon, beckons

OUTPUT RULES:
- If you deleted any sentences, output ONLY the remaining text (no explanation, no quotes around it)
- If nothing needed deletion, output exactly: CLEAN

OUTPUT:`;
}

function extractCleanedDescription(response: string, original: string): string | null {
  // If response starts with CLEAN, no changes needed
  if (response.trim().toUpperCase().startsWith('CLEAN')) {
    return null;
  }

  // Strip common prefixes the model might add
  let cleaned = response
    .replace(/^(The remaining.*?:|After deleting.*?:|Fixed.*?:|Here.*?:)\s*/i, '')
    .replace(/^["'"]|["'"]$/g, '')
    .replace(/\n\n(So,?\s*)?CLEAN.*$/i, '')
    .replace(/^\s*"\s*|\s*"\s*$/g, '')
    .trim();

  // If the cleaned version is substantially shorter or same as original, return it
  if (cleaned.length > 100 && cleaned.length < original.length * 1.1) {
    return cleaned;
  }

  // If response looks like it contains the description, extract it
  const match = cleaned.match(/"([^"]{200,})"/);
  if (match) {
    return match[1].trim();
  }

  return cleaned.length > 100 ? cleaned : null;
}

async function main() {
  console.log('=== Room Description Fixer ===');
  console.log(`Input: ${INPUT_FILE}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`Model: ${MODEL}`);
  console.log('');

  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8')) as WorldExport;
  console.log(`Loaded ${data.rooms.length} rooms`);

  // First pass: quick regex check
  const needsCheck: Room[] = [];
  let skippedClean = 0;

  for (const room of data.rooms) {
    if (!room.description) continue;

    // Skip already processed (resume support)
    if ((room as any)._checked) {
      skippedClean++;
      continue;
    }

    if (hasObviousProblems(room.description)) {
      needsCheck.push(room);
    } else {
      (room as any)._checked = true;
      skippedClean++;
    }
  }

  console.log(`Quick scan: ${skippedClean} rooms look clean, ${needsCheck.length} need AI review`);
  console.log('');

  if (needsCheck.length === 0) {
    // Clean up markers and save
    for (const room of data.rooms) {
      delete (room as any)._checked;
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log('All rooms clean! Saved to', OUTPUT_FILE);
    return;
  }

  let processed = 0;
  let fixed = 0;
  let unchanged = 0;
  const startTime = Date.now();

  for (const room of needsCheck) {
    try {
      const prompt = buildPrompt(room.description!);
      const response = await callOllama(prompt);

      const cleanedDesc = extractCleanedDescription(response, room.description!);

      processed++;
      (room as any)._checked = true;

      if (cleanedDesc && cleanedDesc !== room.description) {
        room.description = cleanedDesc;
        fixed++;
        console.log(`[${processed}/${needsCheck.length}] ${room.id} (${room.era}) - FIXED`);
        console.log(`  Before: ${room.description?.substring(0, 60)}...`);
        console.log(`  After:  ${cleanedDesc.substring(0, 60)}...`);
      } else {
        unchanged++;
        console.log(`[${processed}/${needsCheck.length}] ${room.id} (${room.era}) - OK (AI confirmed clean)`);
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed;
      const remaining = (needsCheck.length - processed) / rate;
      console.log(`  ETA: ${Math.round(remaining)}s remaining`);
      console.log('');

      // Save progress after each room
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

    } catch (error) {
      console.error(`Error processing ${room.id}:`, error);
    }
  }

  // Clean up markers
  for (const room of data.rooms) {
    delete (room as any)._checked;
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

  console.log('=== Complete ===');
  console.log(`Processed: ${processed}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Skipped (clean): ${skippedClean}`);
  console.log(`Saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
