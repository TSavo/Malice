/**
 * Malice v2 - Modern TypeScript Reactive MUD
 *
 * Features:
 * - Telnet transport with full RFC854 protocol support
 * - WebSocket transport for modern web clients
 * - Reactive architecture using RxJS
 * - LambdaMOO-style object database with MongoDB
 * - Prototype-based inheritance
 * - Dynamic method execution
 */

import { TelnetServer } from './transport/telnet/index.js';
import { WebSocketServer } from './transport/websocket/index.js';
import { GameCoordinator } from './game/index.js';

async function main() {
  console.log('🎮 Malice v2 - Modern TypeScript MUD\n');

  // MongoDB connection string (default: local instance)
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';

  // Initialize game system
  const game = new GameCoordinator(mongoUri);

  try {
    await game.initialize();
  } catch (err) {
    console.error('❌ Failed to initialize game system:', err);
    console.error('\n💡 Make sure MongoDB is running:');
    console.error('   mongod --dbpath ./data/db');
    console.error('\nOr set MONGO_URI environment variable to your MongoDB instance.');
    process.exit(1);
  }

  // Get connection manager
  const connectionManager = game.getConnectionManager();

  // Create telnet server (port 5555)
  const telnetServer = new TelnetServer({
    port: 5555,
    debug: false, // Disable transport debug logs
  });

  // Create WebSocket server (port 8080)
  const wsServer = new WebSocketServer({
    port: 8080,
    debug: false,
  });

  // Handle new connections from both servers
  telnetServer.connection$.subscribe(async (transport) => {
    const connection = connectionManager.addTransport(transport);
    console.log(`✅ New ${transport.type} connection: ${connection.id}`);

    // Hand connection to game coordinator (will invoke AuthManager)
    await game.handleConnection(connection);
  });

  // WebSocket server now emits Connection objects (may have HTTP auth)
  wsServer.connection$.subscribe(async (connection) => {
    connectionManager.add(connection);
    console.log(`✅ New ${connection.transport.type} connection: ${connection.id}`);

    // Hand connection to game coordinator (will invoke System object)
    await game.handleConnection(connection);
  });

  // Log connection stats
  connectionManager.connections$.subscribe((connections) => {
    console.log(`📊 Active connections: ${connections.length}`);
  });

  // Start telnet server (WebSocket already listening from constructor)
  try {
    await telnetServer.listen();
    console.log('\n🚀 Servers started successfully!\n');
    console.log('Connect via:');
    console.log('  Telnet:    telnet localhost 5555');
    console.log('  WebSocket: ws://localhost:8080\n');
  } catch (err) {
    console.error('❌ Failed to start servers:', err);
    await game.shutdown();
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n\n🛑 Shutting down...');
    await telnetServer.close();
    await wsServer.close();
    await game.shutdown();
    console.log('✅ Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
