import { BehaviorSubject, merge, Observable } from 'rxjs';
import { map, share, switchMap } from 'rxjs/operators';
import { Connection } from './connection.js';
import type { ITransport } from '../../types/transport.js';
import type { AuthInfo } from '../../types/auth.js';

/**
 * Manages all active connections
 * Provides reactive streams for connection events and aggregated input
 */
export class ConnectionManager {
  private readonly connectionsSubject = new BehaviorSubject<Connection[]>([]);

  /** Observable of all active connections */
  public readonly connections$: Observable<Connection[]> = this.connectionsSubject.asObservable();

  /** Observable of connection events (new connections) */
  public readonly connected$ = new BehaviorSubject<Connection | null>(null);

  /** Observable of disconnection events */
  public readonly disconnected$ = new BehaviorSubject<Connection | null>(null);

  /** Aggregated input from all connections */
  public readonly input$: Observable<{ connection: Connection; data: string }>;

  constructor() {
    // Merge all connection inputs
    this.input$ = this.connections$.pipe(
      switchMap((connections) =>
        merge(
          ...connections.map((conn) =>
            conn.input$.pipe(
              map((data) => ({
                connection: conn,
                data,
              }))
            )
          )
        )
      ),
      share()
    );
  }

  /**
   * Add a new transport (creates a Connection)
   * Optionally pass authInfo from transport layer
   */
  addTransport(transport: ITransport, authInfo: AuthInfo | null = null): Connection {
    const connection = new Connection(transport, authInfo);
    return this.add(connection);
  }

  /**
   * Add an existing Connection to the manager
   * Used when transport layer already created the Connection
   */
  add(connection: Connection): Connection {
    // Add to pool
    const current = this.connectionsSubject.value;
    this.connectionsSubject.next([...current, connection]);

    // Emit connection event
    this.connected$.next(connection);

    // Remove on close
    connection.transport.closed$.subscribe(() => {
      this.removeConnection(connection);
    });

    return connection;
  }

  /**
   * Remove a connection
   */
  private removeConnection(connection: Connection): void {
    const current = this.connectionsSubject.value;
    const updated = current.filter((c) => c.id !== connection.id);
    this.connectionsSubject.next(updated);

    // Emit disconnection event
    this.disconnected$.next(connection);
  }

  /**
   * Get connection by ID
   */
  getConnection(id: string): Connection | undefined {
    return this.connectionsSubject.value.find((c) => c.id === id);
  }

  /**
   * Get connection by user ID
   */
  getConnectionByUserId(userId: string): Connection | undefined {
    return this.connectionsSubject.value.find((c) => c.userId === userId);
  }

  /**
   * Get all authenticated connections
   */
  getAuthenticatedConnections(): Connection[] {
    return this.connectionsSubject.value.filter((c) => c.isAuthenticated);
  }

  /**
   * Get connection count
   */
  get count(): number {
    return this.connectionsSubject.value.length;
  }

  /**
   * Broadcast message to all connections
   */
  broadcast(message: string, exclude?: Connection): void {
    this.connectionsSubject.value.forEach((conn) => {
      if (conn !== exclude) {
        conn.send(message);
      }
    });
  }

  /**
   * Broadcast to authenticated connections only
   */
  broadcastAuthenticated(message: string, exclude?: Connection): void {
    this.getAuthenticatedConnections().forEach((conn) => {
      if (conn !== exclude) {
        conn.send(message);
      }
    });
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    this.connectionsSubject.value.forEach((conn) => conn.close());
  }
}
