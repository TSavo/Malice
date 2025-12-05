#!/usr/bin/env tsx
import { Socket } from 'net';

console.log('🔌 Testing multiple concurrent connections...\n');

function createClient(username: string, delay: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();

    socket.on('data', (data) => {
      const text = data.toString();
      console.log(`[${username}] ${text.trim()}`);
    });

    socket.on('connect', () => {
      console.log(`[${username}] Connected!\n`);

      // Send username after a delay
      setTimeout(() => {
        console.log(`[${username}] Sending username: ${username}`);
        socket.write(`${username}\r\n`);
      }, delay);

      // Disconnect after creation
      setTimeout(() => {
        console.log(`[${username}] Disconnecting\n`);
        socket.destroy();
        resolve();
      }, delay + 3000);
    });

    socket.on('error', (err) => {
      console.error(`[${username}] Error:`, err.message);
      reject(err);
    });

    socket.connect(5555, 'localhost');
  });
}

async function main() {
  // Create 3 clients with staggered timing
  await Promise.all([
    createClient('Alice', 1000),
    createClient('Bob', 1500),
    createClient('Charlie', 2000),
  ]);

  console.log('\n✅ All clients complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
