import type { Observable, Subject } from 'rxjs';
import type { ITransport } from './transport.js';

/**
 * Connection state
 */
export type ConnectionState = 'connecting' | 'connected' | 'authenticated' | 'disconnected';

/**
 * Connection wraps a transport with session state
 */
export interface IConnection {
  /** Unique connection ID */
  readonly id: string;

  /** Underlying transport */
  readonly transport: ITransport;

  /** Current connection state */
  readonly state$: Observable<ConnectionState>;

  /** User ID (if authenticated) */
  readonly userId$: Observable<string | null>;

  /** Input stream (same as transport, for convenience) */
  readonly input$: Observable<string>;

  /** Output subject (same as transport, for convenience) */
  readonly output$: Subject<string>;

  /** Close the connection */
  close(): void;
}
