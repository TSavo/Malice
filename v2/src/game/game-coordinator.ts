import { ObjectDatabase, ObjectManager } from '../database/index.js';
import { GameBootstrap } from '../database/bootstrap.js';
import { ConnectionManager } from '../connection/connection-manager.js';
import { ConnectionContext } from './connection-context.js';
import type { Connection } from '../connection/connection.js';

/**
 * Game coordinator - ties together object system and connection layer
 */
export class GameCoordinator {
  private db: ObjectDatabase;
  private manager: ObjectManager;
  private connections: ConnectionManager;
  private contexts = new Map<string, ConnectionContext>();

  constructor(mongoUri: string, dbName = 'malice') {
    this.db = new ObjectDatabase(mongoUri, dbName);
    this.manager = new ObjectManager(this.db);
    this.connections = new ConnectionManager();
  }

  /**
   * Initialize game - connect to database and bootstrap objects
   */
  async initialize(): Promise<void> {
    console.log('🎮 Initializing Malice game system...');

    // Connect to database
    await this.db.connect();
    console.log('✅ Connected to MongoDB');

    // Ensure root object exists
    await this.db.ensureRoot();
    console.log('✅ Root object #1 ready');

    // Bootstrap core game objects
    const bootstrap = new GameBootstrap(this.manager);
    await bootstrap.bootstrap();
    console.log('✅ Core objects bootstrapped');

    // Preload critical objects into cache
    await this.manager.preload([1, 2, 3, 4]); // Root, System, Auth, CharGen
    console.log('✅ Core objects cached');
  }

  /**
   * Handle new connection - set up context and hand to System object
   */
  async handleConnection(connection: Connection): Promise<void> {
    console.log(`📥 New connection: ${connection.id}`);

    // Create connection context
    const context = new ConnectionContext(connection, this.manager);
    this.contexts.set(connection.id, context);

    // Load System object (#2) and let it handle the connection
    const system = await this.manager.load(2);
    if (!system) {
      connection.send('Error: System not available.\r\n');
      connection.close();
      return;
    }

    // Call System's onConnection method
    try {
      await system.call('onConnection', context);
    } catch (err) {
      console.error('Error in System.onConnection:', err);
      connection.send('Error initializing connection.\r\n');
      connection.close();
    }

    // Clean up context when connection closes
    connection.transport.closed$.subscribe(() => {
      this.contexts.delete(connection.id);
      console.log(`📤 Connection closed: ${connection.id}`);
    });
  }

  /**
   * Get the connection manager
   */
  getConnectionManager(): ConnectionManager {
    return this.connections;
  }

  /**
   * Get the object manager
   */
  getObjectManager(): ObjectManager {
    return this.manager;
  }

  /**
   * Shutdown - disconnect from database
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down game system...');
    this.connections.closeAll();
    await this.db.disconnect();
    console.log('✅ Shutdown complete');
  }
}
