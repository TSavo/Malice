/**
 * FactionBundle - Complete transport bundle for a single faction
 *
 * Wraps HTTP, WebSocket, Telnet, SSH, and Session MCP servers
 * for a single faction, with unified connection stream.
 */

import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import type { AuthInfo } from '../../types/auth.js';
import type {
  FactionPorts,
  FactionTransportConfig,
} from '../../types/transport.js';
import type { ObjectManager } from '../database/object-manager.js';
import { Connection } from '../connection/connection.js';
import { FactionWebServer } from '../web/faction-web-server.js';
import { SSHServer } from './ssh/ssh-server.js';
import { TelnetServer } from './telnet/telnet-server.js';
import { TelnetTransport } from './telnet/telnet-transport.js';
import { WebSocketServer } from './websocket/websocket-server.js';

/**
 * Bundle of all transport servers for one faction
 */
export class FactionBundle {
  private readonly destroyed$ = new Subject<void>();

  /** Faction configuration */
  public readonly config: FactionTransportConfig;

  /** Allocated ports */
  public readonly ports: FactionPorts;

  /** Telnet server */
  private telnetServer: TelnetServer | null = null;

  /** SSH server */
  private sshServer: SSHServer | null = null;

  /** WebSocket server */
  private wsServer: WebSocketServer | null = null;

  /** HTTP server (per-faction web server) */
  private httpServer: FactionWebServer | null = null;

  /** Session MCP server (placeholder - integration TBD) */
  // private sessionMcpServer: SessionMCPServer | null = null;

  /** Object manager for web server */
  private manager: ObjectManager | null = null;

  /** SSH host key (generated or loaded from faction object) */
  private sshHostKey: string | null = null;

  /** Merged connection stream from all transports */
  public readonly connection$ = new Subject<Connection>();

  /** Error stream from all transports */
  public readonly error$ = new Subject<Error>();

  /** Track active connections */
  private connections = new Set<Connection>();

  constructor(config: FactionTransportConfig, manager?: ObjectManager) {
    this.config = config;
    this.ports = config.ports;
    this.sshHostKey = config.sshHostKey || null;
    this.manager = manager || null;
  }

  /**
   * Set the object manager (for HTTP server integration)
   */
  setManager(manager: ObjectManager): void {
    this.manager = manager;
  }

  /**
   * Start all servers in the bundle
   */
  async start(): Promise<void> {
    const { ports, debug } = this.config;

    if (debug) {
      console.log(
        `[FactionBundle:${this.config.name}] Starting transport bundle...`,
      );
    }

    // Start Telnet server
    this.telnetServer = new TelnetServer({
      port: ports.telnet,
      debug,
      factionId: this.config.factionId,
    });

    // Wrap Telnet connections
    this.telnetServer.connection$
      .pipe(
        takeUntil(this.destroyed$),
        map((transport: TelnetTransport) => this.wrapConnection(transport)),
      )
      .subscribe({
        next: (conn) => {
          this.trackConnection(conn);
          this.connection$.next(conn);
        },
      });

    this.telnetServer.error$.pipe(takeUntil(this.destroyed$)).subscribe({
      next: (err) => this.error$.next(err),
    });

    await this.telnetServer.listen();
    if (debug) {
      console.log(
        `  📡 Telnet listening on port ${ports.telnet} for ${this.config.name}`,
      );
    }

    // Start SSH server
    this.sshServer = new SSHServer({
      port: ports.ssh,
      hostKey: this.sshHostKey || undefined,
      debug,
    });

    // If SSH generated a key, store it
    if (!this.sshHostKey) {
      this.sshHostKey = this.sshServer.getHostKey();
    }

    // SSH already emits Connection objects, but we need to tag them
    this.sshServer.connection$.pipe(takeUntil(this.destroyed$)).subscribe({
      next: (conn) => {
        this.tagConnection(conn);
        this.trackConnection(conn);
        this.connection$.next(conn);
      },
    });

    this.sshServer.error$.pipe(takeUntil(this.destroyed$)).subscribe({
      next: (err) => this.error$.next(err),
    });

    await this.sshServer.listen();
    if (debug) {
      console.log(
        `  🔐 SSH listening on port ${ports.ssh} for ${this.config.name}`,
      );
    }

    // Start WebSocket server
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

    // Start HTTP server if manager is available and faction has a domain
    if (this.manager && this.config.domain) {
      this.httpServer = new FactionWebServer(this.manager, {
        port: ports.http,
        domain: this.config.domain,
        factionId: this.config.factionId,
        factionName: this.config.name,
        debug,
      });
      await this.httpServer.start();
    } else if (debug && !this.config.domain) {
      console.log(
        `  ⚠️  HTTP server skipped for ${this.config.name} (no domain configured)`,
      );
    }

    // TODO: Start Session MCP server

    if (debug) {
      console.log(
        `[FactionBundle:${this.config.name}] Transport bundle started`,
      );
    }
  }

  /**
   * Wrap a transport in a Connection with faction-tagged AuthInfo
   */
  private wrapConnection(transport: TelnetTransport): Connection {
    const authInfo: AuthInfo = {
      mode: 'none',
      metadata: {
        remoteAddress: transport.remoteAddress,
        protocol: 'telnet',
        factionId: this.config.factionId,
        factionName: this.config.name,
      },
    };
    return new Connection(transport, authInfo);
  }

  /**
   * Tag an existing Connection with faction info
   */
  private tagConnection(conn: Connection): void {
    const authInfo = conn.authInfo;
    if (authInfo && authInfo.metadata) {
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
   * Get the SSH host key (for storage in faction object)
   */
  getSSHHostKey(): string | null {
    return this.sshHostKey;
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
   * Set SSH key lookup callback
   */
  setSSHKeyLookup(lookup: (username: string) => Promise<string[] | null>): void {
    if (this.sshServer) {
      this.sshServer.keyLookup = lookup;
    }
  }

  /**
   * Set SSH password verify callback
   */
  setSSHPasswordVerify(
    verify: (username: string, password: string) => Promise<boolean>,
  ): void {
    if (this.sshServer) {
      this.sshServer.passwordVerify = verify;
    }
  }

  /**
   * Stop all servers with optional graceful shutdown
   */
  async stop(options?: { gracefulTimeoutMs?: number; message?: string }): Promise<void> {
    const { debug } = this.config;

    if (debug) {
      console.log(
        `[FactionBundle:${this.config.name}] Stopping transport bundle...`,
      );
    }

    // Send message to all connections if provided
    if (options?.message) {
      for (const conn of this.connections) {
        conn.send(options.message + '\r\n');
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

    if (this.telnetServer) {
      closePromises.push(this.telnetServer.close());
    }
    if (this.sshServer) {
      closePromises.push(this.sshServer.close());
    }
    if (this.wsServer) {
      closePromises.push(this.wsServer.close());
    }
    if (this.httpServer) {
      closePromises.push(this.httpServer.close());
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
