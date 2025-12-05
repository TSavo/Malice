#!/usr/bin/env tsx
/**
 * Test the full CharGen flow with interactive character creation
 */

import { WebSocketServer } from 'ws';
import { WebSocketTransport } from './src/transport/websocket/websocket-transport.js';
import { Connection } from './src/connection/connection.js';
import { ConnectionManager } from './src/connection/connection-manager.js';
import { ObjectDatabase } from './src/database/object-db.js';
import { ObjectManager } from './src/database/object-manager.js';
import { GameBootstrap } from './src/database/bootstrap.js';
import { ConnectionContext } from './src/game/connection-context.js';
import { WebSocket } from 'ws';

async function main() {
  console.log('🎮 Testing CharGen Flow...\n');

  // Start server
  const wss = new WebSocketServer({ port: 3000 });
  console.log('✅ WebSocket server listening on ws://localhost:3000\n');

  // Setup database
  const db = new ObjectDatabase('mongodb://localhost:27017', 'malice');
  const manager = new ObjectManager(db);
  await db.connect();
  console.log('✅ Connected to MongoDB\n');

  // Bootstrap core objects
  const bootstrap = new GameBootstrap(manager);
  await bootstrap.bootstrap();
  console.log('✅ Core objects bootstrapped\n');

  // Connection manager
  const connManager = new ConnectionManager();

  // Handle new connections
  wss.on('connection', async (ws) => {
    console.log('📡 New connection established');

    const transport = new WebSocketTransport(ws);
    const connection = connManager.addTransport(transport);

    const context = new ConnectionContext(connection, manager);

    // Load System object and call onConnection
    const system = await manager.system;
    if (system) {
      await system.call('onConnection', context);
    }

    // Monitor for close
    transport.closed$.subscribe(() => {
      console.log('🔌 Connection closed');
    });
  });

  console.log('🎭 Server ready for character creation!\n');
  console.log('Connect with: node test-client.js\n');
  console.log('Or use: wscat -c ws://localhost:3000\n');

  // Keep alive
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    wss.close();
    await db.disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
