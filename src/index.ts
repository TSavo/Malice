/**
 * Malice v2 - Modern TypeScript Reactive MUD
 *
 * Features:
 * - Dynamic per-faction transport bundles (Telnet, SSH, WebSocket)
 * - Stable Proxy Architecture with O(1) array cache
 * - In-memory source of truth (full database warmup)
 * - LambdaMOO-style object database with MongoDB
 * - Prototype-based inheritance
 * - Dynamic method execution
 */

import { DevToolsServer } from './devtools/index';
import { GameCoordinator } from './game/index';
import { LSPApiServer } from './lsp/api-server';
import { createMCPServer } from './mcp/index';
import { MCPTelnetClient } from './mcp/telnet-client';
import { createWebServer } from './web/index';

async function main() {
  console.log('🎮 Malice v2 - Modern TypeScript MUD\n');

  // MongoDB connection string (default: local instance)
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';

  // Force bootstrap flag - rebuilds all prototype methods even if objects exist
  const forceBootstrap =
    process.env.FORCE_BOOTSTRAP === 'true' ||
    process.env.FORCE_BOOTSTRAP === '1';
  if (forceBootstrap) {
    console.log(
      '⚠️  FORCE_BOOTSTRAP enabled - rebuilding all prototype methods\n',
    );
  }

  // Initialize game system
  const game = new GameCoordinator(mongoUri, {
    forceBootstrap,
    transportDebug: false,
  });

  try {
    await game.initialize();
  } catch (err) {
    console.error('❌ Failed to initialize game system:', err);
    console.error('\n💡 Make sure MongoDB is running:');
    console.error('   mongod --dbpath ./data/db');
    console.error(
      '\nOr set MONGO_URI environment variable to your MongoDB instance.',
    );
    process.exit(1);
  }

  // Get object manager for static services
  const objectManager = game.getObjectManager();

  // Create shared telnet client for session management
  // Uses first faction's telnet port (Continuum = 5555)
  const telnetClient = new MCPTelnetClient('localhost', 5555);
  objectManager.setTelnetClient(telnetClient);

  // Store game coordinator so MOO code can access connections
  objectManager.setGameCoordinator(game);

  // Start LSP API Server for VS Code extension (HTTP REST)
  const lspApi = new LSPApiServer(game.getObjectManager(), 3000);
  lspApi.start();

  // Start DevTools WebSocket Server for VS Code extension (JSON-RPC)
  new DevToolsServer(game.getObjectManager(), 9999);
  console.log('🛠️  DevTools ready for VS Code extension');

  // Start MCP Server for Claude Code (Streamable HTTP)
  // Static port 3010 - admin/builder access
  await createMCPServer(objectManager, {
    port: 3010,
    host: '0.0.0.0',
  });

  // Start Website Server (serves from MOO objects)
  // TODO: Per-faction web servers will be handled by transport bundles
  await createWebServer(game.getObjectManager(), {
    port: 80,
    host: '0.0.0.0',
  });

  // Initialize transport registry connection to $transports
  // Faction transports are started via MOO code during bootstrap
  await game.initializeTransports();
  console.log('\n🚀 Ready for connections!\n');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n\n🛑 Shutting down...');
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
