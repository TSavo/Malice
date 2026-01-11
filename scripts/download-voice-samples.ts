#!/usr/bin/env bun
/**
 * Download diverse voice samples from LibriTTS dataset (Hugging Face)
 *
 * LibriTTS contains 2,456 unique speakers with clean 24kHz audio.
 * This script grabs one sample per speaker for VibeVoice voice cloning.
 *
 * Usage:
 *   bun scripts/download-voice-samples.ts                    # Download 50 voices (default)
 *   bun scripts/download-voice-samples.ts --count 100        # Download 100 voices
 *   bun scripts/download-voice-samples.ts --list             # List available speakers
 *   bun scripts/download-voice-samples.ts --dry-run          # Preview without downloading
 */

import { parseArgs } from 'util';
import { mkdir, writeFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Parse CLI args
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    count: { type: 'string', short: 'c', default: '50' },
    output: { type: 'string', short: 'o', default: 'vibevoice-server/voices' },
    'dry-run': { type: 'boolean', default: false },
    list: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help) {
  console.log(`
Download diverse voice samples from LibriTTS for VibeVoice voice cloning.

Usage:
  bun scripts/download-voice-samples.ts [options]

Options:
  -c, --count <n>        Number of voices to download (default: 50)
  -o, --output <dir>     Output directory (default: vibevoice-server/voices)
  --dry-run              Preview what would be downloaded
  --list                 List available speakers and exit
  -h, --help             Show this help

Examples:
  bun scripts/download-voice-samples.ts --count 100
  bun scripts/download-voice-samples.ts --dry-run --count 20
`);
  process.exit(0);
}

const COUNT = parseInt(values.count as string, 10);
const OUTPUT_DIR = values.output as string;
const DRY_RUN = values['dry-run'] as boolean;
const LIST_ONLY = values.list as boolean;

// Hugging Face datasets API
const HF_API = 'https://datasets-server.huggingface.co';
const DATASET = 'mythicinfinity/libritts';
const CONFIG = 'clean';
const SPLIT = 'train.clean.100'; // 251 speakers, ~28k samples

interface AudioSource {
  src: string;
  type: string;
}

interface LibriTTSRow {
  id: string;
  speaker_id: string;
  chapter_id: string;
  text_original: string;
  text_normalized: string;
  path: string;
  audio: AudioSource[];
}

interface HFResponse {
  features: unknown[];
  rows: Array<{ row: LibriTTSRow; row_idx: number }>;
  num_rows_total: number;
  num_rows_per_page: number;
}

async function fetchRows(offset: number, length: number, retries = 3): Promise<HFResponse> {
  const url = `${HF_API}/rows?dataset=${DATASET}&config=${CONFIG}&split=${SPLIT}&offset=${offset}&length=${length}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const resp = await fetch(url);

    if (resp.ok) {
      return resp.json();
    }

    if (resp.status === 429 && attempt < retries) {
      // Rate limited - wait and retry
      const waitTime = attempt * 5000; // 5s, 10s, 15s
      console.log(`\n  ⏳ Rate limited, waiting ${waitTime / 1000}s...`);
      await new Promise((r) => setTimeout(r, waitTime));
      continue;
    }

    throw new Error(`HF API error: ${resp.status} ${resp.statusText}`);
  }

  throw new Error('Max retries exceeded');
}

async function downloadAudio(url: string): Promise<Buffer> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Download failed: ${resp.status}`);
  }
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  console.log('🎤 LibriTTS Voice Sample Downloader');
  console.log('=====================================\n');

  // Check what we already have
  const existingVoices = new Set<string>();
  if (existsSync(OUTPUT_DIR)) {
    const files = await readdir(OUTPUT_DIR);
    for (const f of files) {
      if (f.endsWith('.wav')) {
        existingVoices.add(f.replace('.wav', ''));
      }
    }
    console.log(`📁 Found ${existingVoices.size} existing voices in ${OUTPUT_DIR}`);
  }

  // Fetch initial batch to understand the dataset
  console.log('📡 Fetching dataset info from Hugging Face...');
  const initial = await fetchRows(0, 100);
  console.log(`📊 Dataset has ${initial.num_rows_total.toLocaleString()} total samples\n`);

  // Collect unique speakers with their best sample
  const speakerSamples = new Map<string, LibriTTSRow>();
  let offset = 0;
  const batchSize = 100;
  let scanned = 0;

  console.log('🔍 Scanning for unique speakers...');

  // Scan through data to find diverse speakers
  while (speakerSamples.size < COUNT && offset < initial.num_rows_total) {
    const batch = await fetchRows(offset, batchSize);

    for (const { row } of batch.rows) {
      const speakerId = row.speaker_id;

      // Skip if we already have this speaker
      if (speakerSamples.has(speakerId)) continue;
      if (existingVoices.has(`speaker_${speakerId}`)) continue;

      // Skip samples with very short text (likely too short audio)
      if (row.text_normalized.length < 100) continue;

      speakerSamples.set(speakerId, row);

      // Stop if we have enough
      if (speakerSamples.size >= COUNT) break;
    }

    scanned += batch.rows.length;
    offset += batchSize;

    // Progress update
    process.stdout.write(
      `\r  Scanned ${scanned.toLocaleString()} samples, found ${speakerSamples.size} unique speakers`
    );

    // Don't hammer the API - increased delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\n');

  // Convert to array
  const speakers = Array.from(speakerSamples.entries());

  if (LIST_ONLY) {
    console.log('📋 Available speakers:\n');
    for (const [id, sample] of speakers) {
      console.log(`  speaker_${id}: "${sample.text_normalized.slice(0, 60)}..."`);
    }
    console.log(`\nTotal: ${speakers.length} speakers`);
    return;
  }

  if (DRY_RUN) {
    console.log('🔍 Dry run - would download:\n');
    for (const [id, sample] of speakers) {
      console.log(`  speaker_${id}.wav - "${sample.text_normalized.slice(0, 50)}..."`);
    }
    console.log(`\nTotal: ${speakers.length} voice samples`);
    return;
  }

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Download samples
  console.log(`⬇️  Downloading ${speakers.length} voice samples...\n`);

  let downloaded = 0;
  let failed = 0;

  for (const [speakerId, sample] of speakers) {
    const filename = `speaker_${speakerId}.wav`;
    const filepath = join(OUTPUT_DIR, filename);

    try {
      // Get audio URL from the sample
      const audioUrl = sample.audio?.[0]?.src;
      if (!audioUrl) {
        console.log(`  ⏭️  ${filename} - no audio URL`);
        failed++;
        continue;
      }

      // Download the audio file
      const audioBuffer = await downloadAudio(audioUrl);
      await writeFile(filepath, audioBuffer);
      downloaded++;
      console.log(`  ✅ ${filename} (${(audioBuffer.length / 1024).toFixed(1)}KB)`);
    } catch (err) {
      console.log(`  ❌ ${filename} - ${(err as Error).message}`);
      failed++;
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('\n=====================================');
  console.log(`✅ Downloaded: ${downloaded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log('\nVoices are ready to use with VibeVoice!');
  console.log('Set voiceId: "speaker_XXXX" on any NPC.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
