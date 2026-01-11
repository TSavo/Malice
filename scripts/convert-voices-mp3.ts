#!/usr/bin/env bun
/**
 * Convert WAV voice samples to MP3 320kbps
 * Keeps original WAVs, creates MP3s alongside them
 */

import { readdir } from 'fs/promises';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const VOICES_DIR = 'vibevoice-server/voices';
const BITRATE = '320k';

async function main() {
  console.log('🎵 Converting WAV to MP3 320kbps');
  console.log('================================\n');

  // Check for ffmpeg
  try {
    execSync('which ffmpeg', { stdio: 'pipe' });
  } catch {
    console.error('❌ ffmpeg not found. Install with: apt install ffmpeg');
    process.exit(1);
  }

  const files = await readdir(VOICES_DIR);
  const wavFiles = files.filter(f => f.endsWith('.wav'));
  
  console.log(`Found ${wavFiles.length} WAV files\n`);

  let converted = 0;
  let skipped = 0;

  for (const wav of wavFiles) {
    const mp3 = wav.replace('.wav', '.mp3');
    const wavPath = `${VOICES_DIR}/${wav}`;
    const mp3Path = `${VOICES_DIR}/${mp3}`;

    if (existsSync(mp3Path)) {
      skipped++;
      continue;
    }

    try {
      execSync(`ffmpeg -i "${wavPath}" -b:a ${BITRATE} -q:a 0 "${mp3Path}" -y -loglevel error`, {
        stdio: 'pipe'
      });
      converted++;
      process.stdout.write(`\r  Converted: ${converted} / ${wavFiles.length}`);
    } catch (err) {
      console.log(`\n  ❌ Failed: ${wav}`);
    }
  }

  console.log('\n');
  console.log('================================');
  console.log(`✅ Converted: ${converted}`);
  console.log(`⏭️  Skipped (already exist): ${skipped}`);
  
  // Show size comparison
  const wavSize = execSync(`du -sh ${VOICES_DIR}/*.wav | tail -1`).toString().split('\t')[0];
  const mp3Size = execSync(`du -sh ${VOICES_DIR}/*.mp3 2>/dev/null | tail -1`).toString().split('\t')[0] || '0';
  console.log(`\n📊 Size comparison:`);
  console.log(`   WAV: ${wavSize}`);
  console.log(`   MP3: ${mp3Size}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
