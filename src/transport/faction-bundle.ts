/**
 * FactionBundle - Complete transport bundle for a single faction
 *
 * Wraps HTTP, WebSocket, and Session MCP servers
 * for a single faction, with unified connection stream.
 */

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import type {
  FactionPorts,
  FactionTransportConfig,
} from '../../types/transport';
import type { Connection } from '../connection/connection';
import type { ObjectManager } from '../database/object-manager';
import { SessionMCPServer } from '../mcp/session-mcp-server';
import { FactionWebServer } from '../web/faction-web-server';
import { WebSocketServer } from './websocket/websocket-server';

/**
 * Bundle of all transport servers for one faction
 */
export class FactionBundle {
  private readonly destroyed$ = new Subject<void>();

  /** Faction configuration */
  public readonly config: FactionTransportConfig;

  /** Allocated ports */
  public readonly ports: FactionPorts;

  /** WebSocket server */
  private wsServer: WebSocketServer | null = null;

  /** HTTP server (per-faction web server) */
  private httpServer: FactionWebServer | null = null;

  /** Session MCP server */
  private sessionMcpServer: SessionMCPServer | null = null;

  /** Object manager for web server */
  private manager: ObjectManager | null = null;

  /** Merged connection stream from all transports */
  public readonly connection$ = new Subject<Connection>();

  /** Error stream from all transports */
  public readonly error$ = new Subject<Error>();

  /** Track active connections */
  private connections = new Set<Connection>();

  constructor(config: FactionTransportConfig, manager?: ObjectManager) {
    this.config = config;
    this.ports = config.ports;
    this.manager = manager || null;
  }

  /**
   * Set the object manager (for HTTP server integration)
   */
  setManager(manager: ObjectManager): void {
    this.manager = manager;
  }

  /**
   * Start all servers in the bundle based on transport configuration
   */
  async start(): Promise<void> {
    const { ports, debug, transports = {} } = this.config;

    // Determine which transports to enable
    // Defaults: HTTP = true if domain set, WS = true, SessionMCP = false
    const enableHttp = transports.http ?? !!this.config.domain;
    const enableWs = transports.ws ?? true;
    const enableSessionMcp = transports.sessionMcp ?? false;

    if (debug) {
      console.log(
        `[FactionBundle:${this.config.name}] Starting transport bundle...`,
      );
      console.log(
        `  Transports: HTTP=${enableHttp}, WS=${enableWs}, SessionMCP=${enableSessionMcp}`,
      );
    }

    // Start WebSocket server if enabled
    if (enableWs && ports.ws) {
      this.wsServer = new WebSocketServer({
        port: ports.ws,
        debug,
        factionId: this.config.factionId,
      });

      // WebSocket already emits Connection objects with authInfo
      this.wsServer.connection$.pipe(takeUntil(this.destroyed$)).subscribe({
        next: (conn) => {
          this.tagConnection(conn);
          this.trackConnection(conn);
          this.connection$.next(conn);
        },
      });

      this.wsServer.error$.pipe(takeUntil(this.destroyed$)).subscribe({
        next: (err) => this.error$.next(err),
      });

      if (debug) {
        console.log(
          `  🌐 WebSocket listening on port ${ports.ws} for ${this.config.name}`,
        );
      }
    } else if (debug && !enableWs) {
      console.log(`  ⚠️  WebSocket disabled for ${this.config.name}`);
    }

    // Start HTTP server if enabled, manager is available, and faction has a domain
    if (enableHttp && this.manager && this.config.domain && ports.http) {
      this.httpServer = new FactionWebServer(this.manager, {
        port: ports.http,
        domain: this.config.domain,
        factionId: this.config.factionId,
        factionName: this.config.name,
        debug,
      });
      await this.httpServer.start();
    } else if (debug && !enableHttp) {
      console.log(`  ⚠️  HTTP server disabled for ${this.config.name}`);
    } else if (debug && !this.config.domain) {
      console.log(
        `  ⚠️  HTTP server skipped for ${this.config.name} (no domain configured)`,
      );
    }

    // Start Session MCP server if enabled and manager is available
    if (enableSessionMcp && this.manager && ports.sessionMcp) {
      this.sessionMcpServer = new SessionMCPServer(this.manager, {
        port: ports.sessionMcp,
        host: '127.0.0.1',
        factionId: this.config.factionId,
        factionName: this.config.name,
      });

      // Session MCP emits Connection objects like other transports
      this.sessionMcpServer.connection$
        .pipe(takeUntil(this.destroyed$))
        .subscribe({
          next: (conn) => {
            this.tagConnection(conn);
            this.trackConnection(conn);
            this.connection$.next(conn);
          },
        });

      await this.sessionMcpServer.start();
      if (debug) {
        console.log(
          `  🔌 Session MCP listening on port ${ports.sessionMcp} for ${this.config.name}`,
        );
      }
    } else if (debug && !enableSessionMcp) {
      console.log(`  ⚠️  Session MCP disabled for ${this.config.name}`);
    }

    if (debug) {
      console.log(
        `[FactionBundle:${this.config.name}] Transport bundle started`,
      );
    }
  }

  /**
   * Tag an existing Connection with faction info
   */
  private tagConnection(conn: Connection): void {
    const authInfo = conn.authInfo;
    if (authInfo?.metadata) {
      authInfo.metadata.factionId = this.config.factionId;
      authInfo.metadata.factionName = this.config.name;
    }
  }

  /**
   * Track a connection for graceful shutdown
   */
  private trackConnection(conn: Connection): void {
    this.connections.add(conn);
    conn.transport.closed$.subscribe(() => {
      this.connections.delete(conn);
    });
  }

  /**
   * Get count of active connections
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get all active connections
   */
  getConnections(): Connection[] {
    return Array.from(this.connections);
  }

  /**
   * Stop all servers with optional graceful shutdown
   */
  async stop(options?: {
    gracefulTimeoutMs?: number;
    message?: string;
  }): Promise<void> {
    const { debug } = this.config;

    if (debug) {
      console.log(
        `[FactionBundle:${this.config.name}] Stopping transport bundle...`,
      );
    }

    // Send message to all connections if provided
    if (options?.message) {
      for (const conn of this.connections) {
        conn.send(`${options.message}\r\n`);
      }
    }

    // Wait for graceful shutdown if timeout provided
    if (options?.gracefulTimeoutMs && this.connections.size > 0) {
      if (debug) {
        console.log(
          `  Waiting ${options.gracefulTimeoutMs}ms for ${this.connections.size} connections...`,
        );
      }
      await new Promise((resolve) =>
        setTimeout(resolve, options.gracefulTimeoutMs),
      );
    }

    // Close all remaining connections
    for (const conn of this.connections) {
      conn.close();
    }

    // Signal shutdown to subscribers
    this.destroyed$.next();
    this.destroyed$.complete();

    // Close all servers
    const closePromises: Promise<void>[] = [];

    if (this.wsServer) {
      closePromises.push(this.wsServer.close());
    }
    if (this.httpServer) {
      closePromises.push(this.httpServer.close());
    }
    if (this.sessionMcpServer) {
      closePromises.push(this.sessionMcpServer.stop());
    }

    await Promise.all(closePromises);

    // Complete streams
    this.connection$.complete();
    this.error$.complete();

    if (debug) {
      console.log(
        `[FactionBundle:${this.config.name}] Transport bundle stopped`,
      );
    }
  }
}
