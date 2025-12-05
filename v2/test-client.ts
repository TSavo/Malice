#!/usr/bin/env tsx
import { Socket } from 'net';

console.log('🔌 Connecting to Malice v2 server...\n');

const socket = new Socket();

socket.on('data', (data) => {
  console.log('📥 Received:', data.toString().replace(/\r/g, '').trim());
});

socket.on('connect', () => {
  console.log('✅ Connected!\n');

  // Send some test commands
  setTimeout(() => {
    console.log('📤 Sending: hello world');
    socket.write('hello world\r\n');
  }, 500);

  setTimeout(() => {
    console.log('📤 Sending: testing 123');
    socket.write('testing 123\r\n');
  }, 1500);

  setTimeout(() => {
    console.log('📤 Sending: quit');
    socket.write('quit\r\n');
  }, 2500);
});

socket.on('close', () => {
  console.log('\n🔌 Connection closed');
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

socket.connect(15555, 'localhost');
