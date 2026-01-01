/**
 * Polling transport module
 *
 * Provides transport infrastructure for polling-based connections like MCP.
 * Unlike WebSocket which streams, polling transports accumulate messages
 * for batch retrieval.
 */

export { PollingChannel } from './polling-channel';
export { type MuxMessage, PollingMux } from './polling-mux';
export { PollingMuxTransport } from './polling-mux-transport';
