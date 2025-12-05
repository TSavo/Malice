#!/usr/bin/env tsx
import { TelnetServer } from './src/transport/telnet/telnet-server.js';
import { ConnectionManager } from './src/connection/connection-manager.js';

console.log('🎮 Testing Malice v2 Transport...\n');

const manager = new ConnectionManager();
const server = new TelnetServer({ port: 15555, debug: true });

server.connection$.subscribe((transport) => {
  const conn = manager.addTransport(transport);
  console.log(`✅ New connection: ${conn.id}`);

  conn.send('Welcome to Malice v2 Test!\r\n');
  conn.send('Type something to echo it back.\r\n');
  conn.send('Type "quit" to disconnect.\r\n\r\n> ');

  conn.input$.subscribe((data) => {
    const text = data.trim();
    console.log(`[${conn.id}] Received: "${text}"`);

    if (text.toLowerCase() === 'quit') {
      conn.send('Goodbye!\r\n');
      conn.close();
    } else {
      conn.send(`You said: ${text}\r\n> `);
    }
  });
});

manager.connections$.subscribe((conns) => {
  console.log(`📊 Active connections: ${conns.length}`);
});

try {
  await server.listen();
  console.log('🚀 Server started successfully!');
  console.log('📡 Connect with: telnet localhost 15555\n');
} catch (err) {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
}

process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down...');
  manager.closeAll();
  await server.close();
  process.exit(0);
});
