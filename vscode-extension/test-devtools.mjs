#!/usr/bin/env node
/**
 * Standalone test script for DevTools client
 * Run with: node test-devtools.mjs
 */

import WebSocket from 'ws';

const url = 'ws://localhost:9999';
let nextId = 1;

async function request(ws, method, params) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const req = { jsonrpc: '2.0', method, params, id };

    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off('message', handler);
        if (msg.error) {
          reject(new Error(`${msg.error.message}\n${msg.error.data || ''}`));
        } else {
          resolve(msg.result);
        }
      }
    };

    ws.on('message', handler);
    ws.send(JSON.stringify(req));

    setTimeout(() => {
      ws.off('message', handler);
      reject(new Error('Request timeout'));
    }, 10000);
  });
}

async function main() {
  const objectId = parseInt(process.argv[2] || '101', 10);
  const propName = process.argv[3] || 'damageType';

  console.log(`Connecting to ${url}...`);

  const ws = new WebSocket(url);

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    process.exit(1);
  });

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  console.log('Connected!\n');

  try {
    // Test 1: List objects
    console.log('=== Listing objects ===');
    const listResult = await request(ws, 'objects.list', {
      includeRecycled: false,
    });
    console.log(`Found ${listResult.objects.length} objects`);

    // Test 2: Get object
    console.log(`\n=== Getting object #${objectId} ===`);
    const objResult = await request(ws, 'object.get', { id: objectId });
    console.log('Object:', JSON.stringify(objResult.object, null, 2));

    // Test 3: Get property
    console.log(
      `\n=== Getting property '${propName}' from object #${objectId} ===`,
    );
    const propResult = await request(ws, 'property.get', {
      objectId,
      name: propName,
    });
    console.log('Property result:', JSON.stringify(propResult, null, 2));
    console.log('Value type:', typeof propResult.property.value);
    console.log('Value:', propResult.property.value);

    // Test JSON.stringify behavior
    console.log('\n=== JSON.stringify test ===');
    const value = propResult.property.value;
    const jsonStr = JSON.stringify(value, null, 2);
    console.log('JSON.stringify result:', jsonStr);
    console.log('JSON.stringify type:', typeof jsonStr);

    if (jsonStr === undefined) {
      console.log('WARNING: JSON.stringify returned undefined!');
      console.log('This would cause Buffer.from() to fail');
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (err.stack) console.error(err.stack);
  }

  ws.close();
  console.log('\nDone');
}

main().catch(console.error);
