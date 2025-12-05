#!/usr/bin/env tsx
/**
 * Automated test client that goes through CharGen
 */

import WebSocket from 'ws';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🤖 Starting automated CharGen test client...\n');

  const ws = new WebSocket('ws://localhost:3000');

  const responses = [
    'TestHero',              // Login username
    '1',                     // Menu: Name
    'Hero',                  // Alias
    'John',                  // First name
    'Doe',                   // Last name
    '',                      // Middle name (optional)
    '1',                     // Menu: Birthday
    '1/15/2072',             // Birthday
    '1',                     // Menu: Sex
    '1',                     // Sex: Male
    '1',                     // Menu: Ethnicity
    '1',                     // Ethnicity: first option
    '1',                     // Menu: Stats
    '1.8',                   // Height
    '75',                    // Weight
    '1',                     // Menu: Appearance
    '3',                     // Hair cut: cropped
    '1',                     // Hair style: curly
    '1',                     // Hair color: black
    '2',                     // Eye color: blue
    '1',                     // Eye style: hooded
    '4',                     // Skin style: smooth
    '4',                     // Skin color: white
    '1',                     // Menu: Language
    '1',                     // Language: English
    '1',                     // Menu: Finish
    'yes',                   // Confirm character creation
  ];

  let responseIndex = 0;

  ws.on('open', () => {
    console.log('✅ Connected to server\n');
  });

  ws.on('message', (data) => {
    const text = data.toString();
    console.log('📨 Server:', text.trim());

    // Auto-respond after a short delay
    if (responseIndex < responses.length) {
      setTimeout(() => {
        const response = responses[responseIndex++];
        console.log('📤 Client:', response);
        ws.send(response + '\n');
      }, 500);
    }
  });

  ws.on('close', () => {
    console.log('\n🔌 Connection closed');
    process.exit(0);
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
