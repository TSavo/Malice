#!/usr/bin/env tsx
import { Socket } from 'net';

console.log('🔌 Connecting to Malice v2 MUD...\n');

const socket = new Socket();

socket.on('data', (data) => {
  process.stdout.write(data.toString());
});

socket.on('connect', () => {
  console.log('\n📥 Received connection\n');

  // Send username after a delay
  setTimeout(() => {
    console.log('📤 Sending username: TestUser');
    socket.write('TestUser\r\n');
  }, 1000);

  // Wait for character creation, then quit
  setTimeout(() => {
    console.log('\n✅ Test complete - disconnecting');
    socket.destroy();
    process.exit(0);
  }, 5000);
});

socket.on('close', () => {
  console.log('\n🔌 Connection closed');
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

socket.connect(5555, 'localhost');
