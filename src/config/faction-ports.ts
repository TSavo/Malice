import type { FactionPorts } from '../../types/transport';

/**
 * Port allocation ranges for faction transport bundles
 *
 * Each faction gets a unique set of ports based on its index:
 * - HTTP:       8000 + index
 * - WebSocket:  8080 + index
 * - SessionMCP: 3012 + index
 *
 * Default factions:
 *   Continuum (index 0): HTTP 8000, WS 8080, SessionMCP 3012
 *   Cartel (index 1):    HTTP 8001, WS 8081, SessionMCP 3013
 *
 * Static infrastructure (not per-faction):
 *   MCP:      3010
 *   DevTools: 9999
 *   LSP API:  3000
 */

/** Base port for HTTP servers */
export const HTTP_BASE_PORT = 8000;

/** Base port for WebSocket servers */
export const WS_BASE_PORT = 8080;

/** Base port for Session MCP servers */
export const SESSION_MCP_BASE_PORT = 3012;

/** Static MCP server port (admin/builder access) */
export const MCP_PORT = 3010;

/** Static DevTools server port */
export const DEVTOOLS_PORT = 9999;

/** Static LSP API server port */
export const LSP_PORT = 3000;

/**
 * Calculate ports for a faction based on its index
 * @param index - Faction index (0 = Continuum, 1 = Cartel, etc.)
 * @returns Port allocation for the faction
 */
export function calculateFactionPorts(index: number): FactionPorts {
  return {
    http: HTTP_BASE_PORT + index,
    ws: WS_BASE_PORT + index,
    sessionMcp: SESSION_MCP_BASE_PORT + index,
  };
}

/**
 * Check if a port is within the faction allocation range
 * @param port - Port number to check
 * @returns true if port is in faction range
 */
export function isFactionPort(port: number): boolean {
  // Check each range (assuming max ~100 factions)
  if (port >= HTTP_BASE_PORT && port < HTTP_BASE_PORT + 100) return true;
  if (port >= WS_BASE_PORT && port < WS_BASE_PORT + 100) return true;
  if (port >= SESSION_MCP_BASE_PORT && port < SESSION_MCP_BASE_PORT + 100)
    return true;
  return false;
}

/**
 * Check if a port is a static infrastructure port
 * @param port - Port number to check
 * @returns true if port is for static infrastructure
 */
export function isStaticPort(port: number): boolean {
  return port === MCP_PORT || port === DEVTOOLS_PORT || port === LSP_PORT;
}

/**
 * Get all ports that would be allocated for a given number of factions
 * Useful for generating docker-compose port mappings
 * @param factionCount - Number of factions to allocate for
 * @returns Array of all port numbers
 */
export function getAllFactionPorts(factionCount: number): number[] {
  const ports: number[] = [];

  for (let i = 0; i < factionCount; i++) {
    const factionPorts = calculateFactionPorts(i);
    if (factionPorts.http !== undefined) ports.push(factionPorts.http);
    if (factionPorts.ws !== undefined) ports.push(factionPorts.ws);
    if (factionPorts.sessionMcp !== undefined)
      ports.push(factionPorts.sessionMcp);
  }

  return ports;
}

/**
 * Get static infrastructure ports
 * @returns Array of static port numbers
 */
export function getStaticPorts(): number[] {
  return [MCP_PORT, DEVTOOLS_PORT, LSP_PORT];
}
