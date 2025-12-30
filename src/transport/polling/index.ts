/**
 * Polling transport module
 *
 * Provides transport infrastructure for polling-based connections like MCP.
 * Unlike WebSocket which streams, polling transports accumulate messages
 * for batch retrieval.
 */

export { PollingChannel } from './polling-channel.js';
export { PollingMux, type MuxMessage } from './polling-mux.js';
export { PollingMuxTransport } from './polling-mux-transport.js';
