import type { Observable, Subject } from 'rxjs';

/**
 * Type of transport protocol
 */
export type TransportType = 'websocket-mux' | 'polling-mux';

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

  /** Faction ID this server belongs to (for per-faction transports) */
  factionId?: number;
}

/**
 * Port allocation for a faction's transport bundle.
 * Ports are optional - only allocated if the transport type is enabled.
 */
export interface FactionPorts {
  /** HTTP web server port (if HTTP enabled) */
  http?: number;
  /** WebSocket server port (if WebSocket enabled) */
  ws?: number;
  /** Session MCP server port (if Session MCP enabled) */
  sessionMcp?: number;
}

/**
 * Transport enablement configuration for a faction.
 * Controls which transport types are started for this faction.
 */
export interface FactionTransportTypes {
  /** Enable HTTP web server (default: true if domain is set) */
  http?: boolean;
  /** Enable WebSocket server (default: true) */
  ws?: boolean;
  /** Enable Session MCP server (default: false) */
  sessionMcp?: boolean;
}

/**
 * Configuration for creating a faction's transport bundle
 */
export interface FactionTransportConfig {
  /** Faction object ID */
  factionId: number;
  /** Faction name (for logging) */
  name: string;
  /** Web domain for HTTP Host routing */
  domain?: string;
  /** Allocated ports */
  ports: FactionPorts;
  /** Which transports to enable (defaults: http=domain set, ws=true, sessionMcp=false) */
  transports?: FactionTransportTypes;
  /** Enable debug logging */
  debug?: boolean;
}
