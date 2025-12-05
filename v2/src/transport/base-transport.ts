import { Observable, Subject, BehaviorSubject, ReplaySubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import type { ITransport, TransportType, TerminalCapabilities } from '../../types/transport.js';

/**
 * Abstract base class for all transports
 * Provides common reactive infrastructure
 */
export abstract class BaseTransport implements ITransport {
  public readonly id: string;
  public abstract readonly type: TransportType;
  public abstract readonly remoteAddress: string;

  // Observables
  protected readonly capabilitiesSubject: BehaviorSubject<TerminalCapabilities>;
  public readonly capabilities$: Observable<TerminalCapabilities>;

  /**
   * Get current capabilities value
   */
  get capabilities(): TerminalCapabilities {
    return this.capabilitiesSubject.value;
  }

  protected readonly inputSubject: Subject<string>;
  public readonly input$: Observable<string>;

  public readonly output$: Subject<string>;

  protected readonly connectedSubject: BehaviorSubject<boolean>;
  public readonly connected$: Observable<boolean>;

  protected readonly errorSubject: Subject<Error>;
  public readonly error$: Observable<Error>;

  protected readonly closedSubject: ReplaySubject<void>;
  public readonly closed$: Observable<void>;

  constructor() {
    this.id = uuidv4();

    // Initialize default capabilities
    this.capabilitiesSubject = new BehaviorSubject<TerminalCapabilities>({
      ansi: true,
      width: 80,
      height: 24,
      terminalType: 'ansi',
      env: {},
    });
    this.capabilities$ = this.capabilitiesSubject.asObservable();

    this.inputSubject = new Subject<string>();
    this.input$ = this.inputSubject.asObservable();

    this.output$ = new Subject<string>();

    this.connectedSubject = new BehaviorSubject<boolean>(false);
    this.connected$ = this.connectedSubject.asObservable();

    this.errorSubject = new Subject<Error>();
    this.error$ = this.errorSubject.asObservable();

    this.closedSubject = new ReplaySubject<void>(1);
    this.closed$ = this.closedSubject.asObservable();
  }

  /**
   * Update terminal capabilities
   */
  protected updateCapabilities(updates: Partial<TerminalCapabilities>): void {
    const current = this.capabilitiesSubject.value;
    this.capabilitiesSubject.next({
      ...current,
      ...updates,
      env: { ...current.env, ...updates.env },
    });
  }

  /**
   * Emit input data
   */
  protected emitInput(data: string): void {
    this.inputSubject.next(data);
  }

  /**
   * Emit error
   */
  protected emitError(error: Error): void {
    this.errorSubject.next(error);
  }

  /**
   * Mark as connected
   */
  protected setConnected(connected: boolean): void {
    this.connectedSubject.next(connected);
  }

  /**
   * Mark as closed
   */
  protected setClosed(): void {
    this.setConnected(false);
    this.closedSubject.next();
    this.closedSubject.complete();
    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  protected cleanup(): void {
    this.inputSubject.complete();
    this.output$.complete();
    this.errorSubject.complete();
    this.capabilitiesSubject.complete();
    this.connectedSubject.complete();
  }

  /**
   * Close the transport gracefully
   */
  abstract close(): void;

  /**
   * Destroy the transport immediately
   */
  abstract destroy(): void;
}
