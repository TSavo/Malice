import { BehaviorSubject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import type { IConnection, ConnectionState } from '../../types/connection.js';
import type { ITransport } from '../../types/transport.js';

/**
 * Connection wraps a transport with session state
 * This is where authentication and user state will live
 */
export class Connection implements IConnection {
  public readonly id: string;
  public readonly transport: ITransport;

  private readonly stateSubject: BehaviorSubject<ConnectionState>;
  public readonly state$: Observable<ConnectionState>;

  private readonly userIdSubject: BehaviorSubject<string | null>;
  public readonly userId$: Observable<string | null>;

  public readonly input$: Observable<string>;
  public readonly output$;

  constructor(transport: ITransport) {
    this.id = transport.id;
    this.transport = transport;

    // Initialize state
    this.stateSubject = new BehaviorSubject<ConnectionState>('connecting');
    this.state$ = this.stateSubject.asObservable();

    this.userIdSubject = new BehaviorSubject<string | null>(null);
    this.userId$ = this.userIdSubject.asObservable();

    // Pass through transport streams
    this.input$ = transport.input$;
    this.output$ = transport.output$;

    // Auto-transition to connected
    transport.connected$.pipe(takeUntil(transport.closed$)).subscribe((connected) => {
      if (connected && this.stateSubject.value === 'connecting') {
        this.stateSubject.next('connected');
      } else if (!connected) {
        this.stateSubject.next('disconnected');
      }
    });

    // Handle close
    transport.closed$.subscribe(() => {
      this.stateSubject.next('disconnected');
      this.stateSubject.complete();
      this.userIdSubject.complete();
    });
  }

  /**
   * Authenticate this connection with a user ID
   */
  authenticate(userId: string): void {
    this.userIdSubject.next(userId);
    this.stateSubject.next('authenticated');
  }

  /**
   * Deauthenticate this connection
   */
  deauthenticate(): void {
    this.userIdSubject.next(null);
    this.stateSubject.next('connected');
  }

  /**
   * Check if authenticated
   */
  get isAuthenticated(): boolean {
    return this.userIdSubject.value !== null;
  }

  /**
   * Get current user ID
   */
  get userId(): string | null {
    return this.userIdSubject.value;
  }

  /**
   * Get current state
   */
  get state(): ConnectionState {
    return this.stateSubject.value;
  }

  /**
   * Send data to this connection
   */
  send(data: string): void {
    this.output$.next(data);
  }

  /**
   * Close this connection
   */
  close(): void {
    this.transport.close();
  }
}
