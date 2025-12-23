/**
 * Malice v2 - Modern TypeScript Reactive MUD
 *
 * Features:
 * - Telnet transport with full RFC854 protocol support
 * - WebSocket transport for modern web clients
 * - Stable Proxy Architecture with O(1) array cache
 * - In-memory source of truth (full database warmup)
 * - LambdaMOO-style object database with MongoDB
 * - Prototype-based inheritance
 * - Dynamic method execution
 */

import { TelnetServer } from './transport/telnet/index.js';
import { WebSocketServer } from './transport/websocket/index.js';
import { SSHServer } from './transport/ssh/index.js';
import { GameCoordinator } from './game/index.js';
import { LSPApiServer } from './lsp/api-server.js';
import { DevToolsServer } from './devtools/index.js';
import { createMCPServer, createSessionMCPServer } from './mcp/index.js';
import { createCharGenMCPServer } from './mcp/chargen-mcp-server.js';
import { createWebServer } from './web/index.js';

async function main() {
  console.log('🎮 Malice v2 - Modern TypeScript MUD\n');

  // MongoDB connection string (default: local instance)
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';

  // Force bootstrap flag - rebuilds all prototype methods even if objects exist
  const forceBootstrap = process.env.FORCE_BOOTSTRAP === 'true' || process.env.FORCE_BOOTSTRAP === '1';
  if (forceBootstrap) {
    console.log('⚠️  FORCE_BOOTSTRAP enabled - rebuilding all prototype methods\n');
  }

  // Initialize game system
  const game = new GameCoordinator(mongoUri, { forceBootstrap });

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

  // Start LSP API Server for VS Code extension (HTTP REST)
  const lspApi = new LSPApiServer(game.getObjectManager(), 3000);
  lspApi.start();

  // Start DevTools WebSocket Server for VS Code extension (JSON-RPC)
  new DevToolsServer(game.getObjectManager(), 9999);
  console.log('🛠️  DevTools ready for VS Code extension');

  // Start MCP Server for Claude Code (Streamable HTTP)
  await createMCPServer(game.getObjectManager(), {
    port: 3001,
    host: '0.0.0.0', // Allow Docker host access
  });

  // Start CharGen MCP Server for AI-driven character creation
  await createCharGenMCPServer(game.getObjectManager(), {
    port: 3002,
    host: '0.0.0.0', // Allow Docker host access
  });

  // Start Session MCP Server for telnet session management
  await createSessionMCPServer({
    port: 3003,
    host: '0.0.0.0', // Allow Docker host access
  });

  // Start Website Server (serves from MOO objects)
  await createWebServer(game.getObjectManager(), {
    port: 80,
    host: '0.0.0.0',
  });

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

  // Create SSH server (port 5556)
  const manager = game.getObjectManager();
  const systemObj = await manager.load(2); // System object

  // Get or generate SSH host key
  let sshHostKey = systemObj?.get('sshHostKey') as string | undefined;

  const sshServer = new SSHServer({
    port: 5556,
    hostKey: sshHostKey,
    debug: false,
  });

  // Store generated host key if it was auto-generated
  if (!sshHostKey && systemObj) {
    sshHostKey = sshServer.getHostKey();
    systemObj.set('sshHostKey', sshHostKey);
    console.log('🔑 Generated new SSH host key (stored in $.system)');
  }

  // Set up SSH key lookup - find player by their stored public keys
  sshServer.keyLookup = async (username: string): Promise<string[] | null> => {
    const objectManager = await manager.load(0);
    const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};
    const playerPrototypeId = aliases.player;
    const adminPrototypeId = aliases.admin;

    // Find player by username
    const users = await manager.db.listAll(false);
    const getValue = (v: any) => v && typeof v === 'object' && 'type' in v ? v.value : v;

    const userDoc = users.find(u => {
      const parentId = getValue(u.parent);
      return (parentId === playerPrototypeId || parentId === adminPrototypeId) &&
        getValue(u.properties.playername) === username.toLowerCase();
    });

    if (!userDoc) return null;

    const keys = getValue(userDoc.properties.sshPublicKeys);
    return Array.isArray(keys) ? keys : null;
  };

  // Set up password verification for fallback auth
  sshServer.passwordVerify = async (username: string, password: string): Promise<boolean> => {
    const objectManager = await manager.load(0);
    const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};
    const playerPrototypeId = aliases.player;
    const adminPrototypeId = aliases.admin;

    const users = await manager.db.listAll(false);
    const getValue = (v: any) => v && typeof v === 'object' && 'type' in v ? v.value : v;

    const userDoc = users.find(u => {
      const parentId = getValue(u.parent);
      return (parentId === playerPrototypeId || parentId === adminPrototypeId) &&
        getValue(u.properties.playername) === username.toLowerCase();
    });

    if (!userDoc) return false;

    const player = await manager.load(userDoc._id);
    if (!player) return false;

    // Use player's checkPassword method
    try {
      return await player.call('checkPassword', password) as boolean;
    } catch {
      return false;
    }
  };

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

  // SSH server emits Connection objects (with SSH key auth or password auth)
  sshServer.connection$.subscribe(async (connection) => {
    connectionManager.add(connection);
    console.log(`✅ New ${connection.transport.type} connection: ${connection.id}`);

    // Hand connection to game coordinator
    await game.handleConnection(connection);
  });

  // Log connection stats
  connectionManager.connections$.subscribe((connections) => {
    console.log(`📊 Active connections: ${connections.length}`);
  });

  // Start telnet and SSH servers (WebSocket already listening from constructor)
  try {
    await telnetServer.listen();
    await sshServer.listen();
    console.log('\n🚀 Servers started successfully!\n');
    console.log('Connect via:');
    console.log('  Telnet:    telnet localhost 5555');
    console.log('  SSH:       ssh <username>@localhost -p 5556');
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
    await sshServer.close();
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
