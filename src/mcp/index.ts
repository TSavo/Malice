/**
 * MCP Server Module
 *
 * Code-First MCP server for Malice MOO
 * Implements Anthropic's "code execution with MCP" pattern
 * Uses Streamable HTTP transport (modern MCP standard)
 */

// Code-first MCP server - Claude writes MOO code instead of calling tools
export { MaliceMCPServer, createMCPServer } from './mcp-server-codefirst.js';

// Session MCP server for SSH key management
export { SessionMCPServer, createSessionMCPServer } from './session-mcp-server.js';

// Legacy MCP server (4700 lines) - kept for reference, not exported by default
// export { MaliceMCPServer as LegacyMCPServer } from './mcp-server.js';
