import type { Observable, Subject } from 'rxjs';

/**
 * Type of transport protocol
 */
export type TransportType = 'telnet' | 'websocket';

/**
 * Terminal capabilities
 */
export interface TerminalCapabilities {
  /** Supports ANSI escape codes */
  ansi: boolean;
  /** Terminal width in characters */
  width: number;
  /** Terminal height in characters */
  height: number;
  /** Terminal type (e.g., 'xterm', 'ansi') */
  terminalType: string;
  /** Environment variables */
  env: Record<string, string>;
}

/**
 * Core transport interface - all transports must implement this
 */
export interface ITransport {
  /** Unique identifier for this transport */
  readonly id: string;

  /** Type of transport */
  readonly type: TransportType;

  /** Remote address/identifier */
  readonly remoteAddress: string;

  /** Terminal capabilities (may update over time) */
  readonly capabilities$: Observable<TerminalCapabilities>;

  /** Get current terminal capabilities */
  readonly capabilities: TerminalCapabilities;

  /** Input stream from client (raw text) */
  readonly input$: Observable<string>;

  /** Output subject to send data to client */
  readonly output$: Subject<string>;

  /** Connection state */
  readonly connected$: Observable<boolean>;

  /** Error stream */
  readonly error$: Observable<Error>;

  /** Close event (completes when closed) */
  readonly closed$: Observable<void>;

  /** Close the transport */
  close(): void;

  /** Destroy the transport immediately */
  destroy(): void;
}

/**
 * Configuration for transport servers
 */
export interface TransportServerConfig {
  /** Port to listen on */
  port: number;

  /** Host to bind to */
  host?: string;

  /** Enable debug logging */
  debug?: boolean;
}
