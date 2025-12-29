import type { Connection } from '../connection/connection.js';
import { ConnectionManager } from '../connection/connection-manager.js';
import { GameBootstrap } from '../database/game-bootstrap.js';
import { initGameLogger } from '../database/game-logger.js';
import { ObjectDatabase, ObjectManager } from '../database/index.js';
import { FactionTransportRegistry } from '../transport/faction-transport-registry.js';
import { ConnectionContext } from './connection-context.js';

export interface GameCoordinatorOptions {
  forceBootstrap?: boolean;
  /** Enable debug logging for transports */
  transportDebug?: boolean;
}

/**
 * Game coordinator - ties together object system and connection layer
 */
export class GameCoordinator {
  private db: ObjectDatabase;
  private manager: ObjectManager;
  private connections: ConnectionManager;
  private contexts = new Map<string, ConnectionContext>();
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private options: GameCoordinatorOptions;
  private transportRegistry: FactionTransportRegistry;

  constructor(mongoUri: string, options: GameCoordinatorOptions = {}) {
    this.db = new ObjectDatabase(mongoUri, 'malice');
    this.manager = new ObjectManager(this.db);
    this.connections = new ConnectionManager();
    this.options = options;
    this.transportRegistry = new FactionTransportRegistry({
      debug: options.transportDebug,
      manager: this.manager,
    });
  }

  /**
   * Initialize game - connect to database and bootstrap objects
   */
  async initialize(): Promise<void> {
    console.log('🎮 Initializing Malice game system...');

    // Connect to database
    await this.db.connect();
    console.log('✅ Connected to MongoDB');

    // Initialize logging system (separate collection, invisible to MOO)
    await initGameLogger(this.db.getDatabase());
    console.log('✅ Game logger initialized');

    // Bootstrap core game objects (MinimalBootstrap handles Root creation)
    const bootstrap = new GameBootstrap(this.manager, {
      forceBootstrap: this.options.forceBootstrap,
    });
    await bootstrap.bootstrap();
    console.log('✅ Core objects bootstrapped');

    // Load all objects into memory (Memory is the source of truth)
    const loadedCount = await this.manager.loadAll();
    console.log(`✅ Loaded ${loadedCount} objects into cache`);

    // Start scheduler tick loop (every second)
    this.startScheduler();
  }

  /**
   * Start the scheduler tick loop
   * Calls $.scheduler.tick() every second to run due jobs
   */
  private startScheduler(): void {
    if (this.schedulerInterval) return;

    this.schedulerInterval = setInterval(async () => {
      try {
        const scheduler = (this.manager as any).scheduler;
        if (scheduler?.tick) {
          await scheduler.call('tick');
        }
      } catch (err) {
        // Log but don't crash - scheduler errors shouldn't bring down the server
        console.error('Scheduler tick error:', err);
      }
    }, 1000);

    // Check if scheduler is paused
    const scheduler = (this.manager as any).scheduler;
    const isPaused = scheduler?.paused === true;
    if (isPaused) {
      console.log(
        '⏸️  Scheduler tick loop started (1s interval) - PAUSED (call $.scheduler.resume() to start)',
      );
    } else {
      console.log('✅ Scheduler tick loop started (1s interval)');
    }
  }

  /**
   * Stop the scheduler tick loop
   */
  private stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      console.log('🛑 Scheduler tick loop stopped');
    }
  }

  /**
   * Handle new connection - set up context and hand to System object
   */
  async handleConnection(connection: Connection): Promise<void> {
    console.log(`📥 New connection: ${connection.id}`);

    // Create connection context
    const context = new ConnectionContext(connection, this.manager);
    this.contexts.set(connection.id, context);

    // Load System object via alias and let it handle the connection
    const system = (this.manager as any).system;
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
   * Get the faction transport registry
   */
  getTransportRegistry(): FactionTransportRegistry {
    return this.transportRegistry;
  }

  /**
   * Initialize the transport registry and start faction transports
   * Must be called after bootstrap completes
   */
  async initializeTransports(): Promise<void> {
    const transports = (this.manager as any).transports;
    if (!transports) {
      console.warn('⚠️  $transports not available');
      return;
    }

    // Connect registry to $transports MOO object
    await transports.call('setRegistry', this.transportRegistry);
    console.log('✅ Transport registry connected to $transports');

    // Subscribe to merged connection stream
    this.transportRegistry.connection$.subscribe(async (connection) => {
      this.connections.add(connection);
      console.log(
        `✅ New ${connection.transport.type} connection: ${connection.id}`,
      );
      await this.handleConnection(connection);
    });

    // Start transports for all factions via MOO method
    await transports.call('startAll');
  }

  /**
   * Shutdown - disconnect from database
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down game system...');
    this.stopScheduler();

    // Shutdown all faction transports
    await this.transportRegistry.shutdown({
      gracefulTimeoutMs: 2000,
      message: 'Server shutting down...',
    });

    this.connections.closeAll();
    await this.db.disconnect();
    console.log('✅ Shutdown complete');
  }
}
