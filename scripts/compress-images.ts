#!/usr/bin/env bun
/**
 * Batch PNG compression script using oxipng
 *
 * Usage:
 *   bun scripts/compress-images.ts              # Compress all images
 *   bun scripts/compress-images.ts --dry-run    # Preview without changes
 *   bun scripts/compress-images.ts --parallel 4 # Process 4 images concurrently
 *   bun scripts/compress-images.ts --limit 10   # Process max 10 images
 *
 * State is saved to compress-state.json for restartability.
 */

import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const ASSETS_DIR = './assets/images';
const STATE_FILE = './compress-state.json';

interface ImageState {
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  compressedAt: string;
}

interface CompressionState {
  startedAt: string;
  lastUpdated: string;
  totalImages: number;
  processedCount: number;
  skippedCount: number;
  errorCount: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  images: Record<string, ImageState>;
  errors: Record<string, string>;
}

function loadState(): CompressionState {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch {
      console.warn('Failed to parse state file, starting fresh');
    }
  }
  return {
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    totalImages: 0,
    processedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    totalOriginalBytes: 0,
    totalCompressedBytes: 0,
    images: {},
    errors: {},
  };
}

function saveState(state: CompressionState): void {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function compressImage(
  filePath: string,
  oxipngPath: string,
): Promise<{
  originalSize: number;
  compressedSize: number;
  saved: boolean;
  reason?: 'larger' | 'no-improvement';
}> {
  const originalSize = fs.statSync(filePath).size;

  // oxipng -o4 --strip safe compresses in-place
  await execFileAsync(oxipngPath, ['-o', '4', '--strip', 'safe', filePath]);

  const compressedSize = fs.statSync(filePath).size;

  // oxipng won't make files larger, but check if there was improvement
  if (compressedSize < originalSize) {
    return { originalSize, compressedSize, saved: true };
  }

  return {
    originalSize,
    compressedSize: originalSize,
    saved: false,
    reason: 'no-improvement',
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const parallelIndex = args.indexOf('--parallel');
  const limitIndex = args.indexOf('--limit');

  const parallel =
    parallelIndex >= 0 ? parseInt(args[parallelIndex + 1], 10) || 2 : 2;
  const limit =
    limitIndex >= 0 ? parseInt(args[limitIndex + 1], 10) || Infinity : Infinity;

  // Get oxipng binary path
  const { default: oxipngPath } = await import('oxipng-bin');

  console.log(`PNG Compression Script (oxipng -o4)`);
  console.log(`  oxipng: ${oxipngPath}`);
  console.log(`  Dry run: ${dryRun}`);
  console.log(`  Parallel: ${parallel}`);
  console.log(`  Limit: ${limit === Infinity ? 'none' : limit}`);
  console.log('');

  // Load state
  const state = loadState();

  // Get all PNG files
  const allFiles = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.endsWith('.png'))
    .sort();

  state.totalImages = allFiles.length;
  console.log(`Found ${allFiles.length} PNG files`);
  console.log(`Already processed: ${Object.keys(state.images).length}`);

  // Filter to unprocessed files
  const toProcess = allFiles.filter((f) => !state.images[f]).slice(0, limit);

  console.log(`To process: ${toProcess.length}`);
  console.log('');

  if (toProcess.length === 0) {
    console.log('All images already processed!');
    printSummary(state);
    return;
  }

  if (dryRun) {
    console.log('Dry run - no changes will be made');
    return;
  }

  // Process in batches
  let processed = 0;
  const startTime = Date.now();

  for (let i = 0; i < toProcess.length; i += parallel) {
    const batch = toProcess.slice(i, i + parallel);

    const results = await Promise.all(
      batch.map(async (filename) => {
        const filePath = path.join(ASSETS_DIR, filename);
        try {
          const result = await compressImage(filePath, oxipngPath);
          return { filename, ...result, error: null };
        } catch (err) {
          return {
            filename,
            originalSize: 0,
            compressedSize: 0,
            saved: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }),
    );

    // Update state with results
    for (const result of results) {
      if (result.error) {
        state.errors[result.filename] = result.error;
        state.errorCount++;
        console.log(`❌ ${result.filename}: ${result.error}`);
      } else {
        const ratio =
          result.originalSize > 0
            ? (
                ((result.originalSize - result.compressedSize) /
                  result.originalSize) *
                100
              ).toFixed(1)
            : '0';

        state.images[result.filename] = {
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          compressionRatio: `${ratio}%`,
          compressedAt: new Date().toISOString(),
        };
        state.processedCount++;
        state.totalOriginalBytes += result.originalSize;
        state.totalCompressedBytes += result.compressedSize;

        if (result.saved) {
          console.log(
            `✅ ${result.filename}: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (-${ratio}%)`,
          );
        } else {
          state.skippedCount++;
          console.log(
            `⏭️  ${result.filename}: already optimal (${formatBytes(result.originalSize)})`,
          );
        }
      }
      processed++;
    }

    // Save state after each batch
    saveState(state);

    // Progress update
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processed / elapsed;
    const remaining = toProcess.length - processed;
    const eta = remaining / rate;

    console.log(
      `\n--- Progress: ${processed}/${toProcess.length} (${((processed / toProcess.length) * 100).toFixed(1)}%) | Rate: ${rate.toFixed(2)}/s | ETA: ${Math.ceil(eta)}s ---\n`,
    );
  }

  printSummary(state);
}

function printSummary(state: CompressionState): void {
  console.log('\n========== SUMMARY ==========');
  console.log(`Total images: ${state.totalImages}`);
  console.log(`Processed: ${state.processedCount}`);
  console.log(`Skipped (already optimal): ${state.skippedCount}`);
  console.log(`Errors: ${state.errorCount}`);
  console.log(`Original size: ${formatBytes(state.totalOriginalBytes)}`);
  console.log(`Compressed size: ${formatBytes(state.totalCompressedBytes)}`);
  const savedBytes = state.totalOriginalBytes - state.totalCompressedBytes;
  const savedPct =
    state.totalOriginalBytes > 0
      ? ((savedBytes / state.totalOriginalBytes) * 100).toFixed(1)
      : '0';
  console.log(`Space saved: ${formatBytes(savedBytes)} (${savedPct}%)`);
  console.log('=============================\n');
}

main().catch(console.error);
