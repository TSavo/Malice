/**
 * Code-First MCP Server for Malice MOO
 *
 * Implements Anthropic's "code execution with MCP" pattern:
 * - Single tool: execute_moo_code - runs MOO code with access to all tools
 * - Tools are MOO objects discoverable via $mcp.listTools()
 * - Claude writes MOO code instead of making individual tool calls
 * - 98% reduction in token usage vs traditional MCP
 *
 * This is a thin transport layer - all logic lives in MOO objects.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import type { ObjectManager } from '../database/object-manager.js';
import type { RuntimeObject } from '../../types/object.js';

interface MCPServerConfig {
  port?: number;
  host?: string;
}

interface SessionState {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

/**
 * Code-First MCP Server
 * Thin transport layer - delegates everything to $mcp MOO object
 */
export class MaliceMCPServer {
  private httpServer: ReturnType<typeof createServer> | null = null;
  private sessions = new Map<string, SessionState>();
  private port: number;
  private host: string;

  constructor(
    private manager: ObjectManager,
    config: MCPServerConfig = {}
  ) {
    this.port = config.port ?? 3010;
    this.host = config.host ?? '127.0.0.1';
  }

  /**
   * Get $mcp object
   */
  private getMCP(): RuntimeObject | undefined {
    return this.manager.getAliases().get('mcp');
  }

  /**
   * Serialize value for JSON output (handles RuntimeObjects)
   */
  private serializeValue(value: any, seen = new WeakSet()): any {
    if (value === null || value === undefined) return value;

    // RuntimeObject -> #ID
    if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'number' && typeof value.get === 'function') {
      return `#${value.id}`;
    }

    if (Array.isArray(value)) {
      return value.map(v => this.serializeValue(v, seen));
    }

    if (typeof value === 'object') {
      if (seen.has(value)) return '[circular]';
      seen.add(value);
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = this.serializeValue(v, seen);
      }
      return result;
    }

    return value;
  }

  /**
   * Create MCP server with code-first tools
   */
  private createSessionServer(): McpServer {
    const server = new McpServer({
      name: 'malice-moo',
      version: '2.0.0',
    });

    this.registerTools(server);
    this.registerResources(server);

    return server;
  }

  /**
   * Register code-first tools
   */
  private registerTools(server: McpServer): void {
    // Primary tool: Execute MOO code
    server.tool(
      'execute_moo_code',
      `Execute MOO/TypeScript code with access to all MCP tools.

The code runs in the MOO execution context with access to:
- $mcp.toolName(params) - Call any MCP tool (dig, spawn_item, set_property, etc.)
- $mcp.listTools() - List all available tools
- $ - Object manager for queries
- $load(id) - Load object by ID
- $create({parent, properties}) - Create new object
- $alias shortcuts - $room, $player, $exit, etc.

Example:
  // Create a room and link it
  const room = await $mcp.dig({name: 'Hallway', description: 'A long hallway', x: 0, y: 1, z: 0});
  await $mcp.spawn_item({prototypeId: '$torch', roomId: '#' + room.room.id});
  return room;

Write composable code - loops, conditionals, multi-step operations all work.`,
      {
        code: z.string().describe('MOO/TypeScript code to execute'),
      },
      async ({ code }) => {
        try {
          const $mcp = this.getMCP();
          if (!$mcp) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'MCP not bootstrapped. Run FORCE_BOOTSTRAP=true npm start' }) }],
              isError: true,
            };
          }

          const result = await $mcp.call('execute', code);
          const serialized = this.serializeValue(result);

          return {
            content: [{ type: 'text', text: JSON.stringify(serialized, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }) }],
            isError: true,
          };
        }
      }
    );

    // Discovery tool: List available tools
    server.tool(
      'list_mcp_tools',
      'List all available MCP tools with their descriptions and input schemas.',
      {},
      async () => {
        try {
          const $mcp = this.getMCP();
          if (!$mcp) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'MCP not bootstrapped' }) }],
              isError: true,
            };
          }

          const tools = await $mcp.call('listTools');
          return {
            content: [{ type: 'text', text: JSON.stringify(tools, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }) }],
            isError: true,
          };
        }
      }
    );

    // Schema tool: Get specific tool schema
    server.tool(
      'get_tool_schema',
      'Get the input schema for a specific MCP tool.',
      {
        name: z.string().describe('Tool name (e.g., "dig", "spawn_item")'),
      },
      async ({ name }) => {
        try {
          const $mcp = this.getMCP();
          if (!$mcp) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'MCP not bootstrapped' }) }],
              isError: true,
            };
          }

          const schema = await $mcp.call('getToolSchema', name);
          return {
            content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }) }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Register resources for tool discovery
   */
  private registerResources(server: McpServer): void {
    // Tool listing resource
    server.resource(
      'tools',
      'moo://tools',
      { description: 'List all available MCP tools' },
      async () => {
        const $mcp = this.getMCP();
        if (!$mcp) {
          return {
            contents: [{
              uri: 'moo://tools',
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'MCP not bootstrapped' }),
            }],
          };
        }

        try {
          const tools = await $mcp.call('listTools');
          return {
            contents: [{
              uri: 'moo://tools',
              mimeType: 'application/json',
              text: JSON.stringify(tools, null, 2),
            }],
          };
        } catch (err) {
          return {
            contents: [{
              uri: 'moo://tools',
              mimeType: 'application/json',
              text: JSON.stringify({ error: String(err) }),
            }],
          };
        }
      }
    );

    // Aliases resource
    server.resource(
      'aliases',
      'moo://aliases',
      { description: 'List all registered object aliases' },
      async () => {
        try {
          const objectManager = await this.manager.load(0);
          const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};
          const sorted: Record<string, number> = {};
          for (const key of Object.keys(aliases).sort()) {
            if (typeof aliases[key] === 'number') {
              sorted[key] = aliases[key];
            }
          }
          return {
            contents: [{
              uri: 'moo://aliases',
              mimeType: 'application/json',
              text: JSON.stringify(sorted, null, 2),
            }],
          };
        } catch (err) {
          return {
            contents: [{
              uri: 'moo://aliases',
              mimeType: 'application/json',
              text: JSON.stringify({ error: String(err) }),
            }],
          };
        }
      }
    );
  }

  /**
   * Start HTTP server
   */
  async start(): Promise<void> {
    this.httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url !== '/mcp') {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      try {
        if (req.method === 'POST') {
          await this.handlePost(req, res, sessionId);
        } else if (req.method === 'GET') {
          await this.handleGet(req, res, sessionId);
        } else if (req.method === 'DELETE') {
          this.handleDelete(res, sessionId);
        } else {
          res.writeHead(405);
          res.end('Method Not Allowed');
        }
      } catch (err) {
        console.error('MCP request error:', err);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });

    this.httpServer.listen(this.port, this.host, () => {
      console.log(`🔮 MCP server (code-first) listening on http://${this.host}:${this.port}/mcp`);
    });
  }

  private async handlePost(req: IncomingMessage, res: ServerResponse, sessionId?: string): Promise<void> {
    const body = await this.readBody(req);
    const message = JSON.parse(body);

    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res, message);
    } else if (message.method === 'initialize') {
      const server = this.createSessionServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          this.sessions.set(newSessionId, { server, transport });
        },
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, message);
    } else if (sessionId && !this.sessions.has(sessionId)) {
      // Stale session - recreate
      console.log(`[MCP] Recreating stale session ${sessionId}`);
      const server = this.createSessionServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        onsessioninitialized: (newSessionId) => {
          this.sessions.set(newSessionId, { server, transport });
        },
      });
      await server.connect(transport);

      const initMessage = {
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'reconnected-client', version: '1.0.0' }
        }
      };

      const fakeRes = {
        writeHead: () => {},
        end: () => {},
        setHeader: () => {},
        write: () => true,
        on: () => {},
      } as unknown as ServerResponse;

      await transport.handleRequest(req, fakeRes, initMessage);
      await transport.handleRequest(req, res, message);
    } else {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Bad Request: No session ID and not an initialize request' }));
    }
  }

  private async handleGet(req: IncomingMessage, res: ServerResponse, sessionId?: string): Promise<void> {
    if (!sessionId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing session ID' }));
      return;
    }
    if (!this.sessions.has(sessionId)) {
      res.writeHead(410);
      res.end(JSON.stringify({ error: 'Session expired', code: 'SESSION_EXPIRED' }));
      return;
    }
    const session = this.sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
  }

  private handleDelete(res: ServerResponse, sessionId?: string): void {
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.transport.close();
        this.sessions.delete(sessionId);
      }
    }
    res.writeHead(204);
    res.end();
  }

  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    for (const [id, session] of this.sessions) {
      session.transport.close();
      this.sessions.delete(id);
    }
    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.close(err => err ? reject(err) : resolve());
      });
      this.httpServer = null;
    }
  }
}

export async function createMCPServer(manager: ObjectManager, config?: MCPServerConfig): Promise<MaliceMCPServer> {
  const server = new MaliceMCPServer(manager, config);
  await server.start();
  return server;
}
