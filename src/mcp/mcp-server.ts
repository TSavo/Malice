/**
 * MCP Server for Malice MOO Objects
 *
 * Streamable HTTP transport (modern MCP standard)
 * Provides tools for querying and updating MOO objects in MongoDB
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import type { ObjectManager } from '../database/object-manager.js';
import type { ObjId } from '../../types/object.js';
import { MCPTelnetClient } from './telnet-client.js';

interface MCPServerConfig {
  port?: number;
  host?: string;
}

/**
 * MCP Server for MOO object operations
 * Similar to DevTools but using MCP protocol over Streamable HTTP
 */
export class MaliceMCPServer {
  private server: McpServer;
  private httpServer: ReturnType<typeof createServer> | null = null;
  private sessions = new Map<string, StreamableHTTPServerTransport>();
  private telnetClient: MCPTelnetClient;
  private port: number;
  private host: string;

  constructor(
    private manager: ObjectManager,
    config: MCPServerConfig = {}
  ) {
    this.port = config.port ?? 3001;
    this.host = config.host ?? '127.0.0.1';
    this.telnetClient = new MCPTelnetClient('localhost', 5555);

    this.server = new McpServer({
      name: 'malice-moo',
      version: '1.0.0',
    });

    this.registerTools();
    this.registerResources();
    this.registerPrompts();
  }

  /**
   * Register MCP tools (operations with side effects)
   */
  private registerTools(): void {
    // Get object by ID
    this.server.tool(
      'get_object',
      'Fetch a MOO object by its ID. Returns properties, methods, parent, and metadata.',
      { id: z.number().describe('Object ID (e.g., 0 for ObjectManager, 1 for Root)') },
      async ({ id }) => {
        const obj = await this.manager.load(id as ObjId);
        if (!obj) {
          return {
            content: [{ type: 'text', text: `Object #${id} not found` }],
            isError: true,
          };
        }

        const raw = obj._getRaw();
        const result = {
          _id: raw._id,
          parent: raw.parent,
          properties: obj.getOwnProperties(),
          methods: Object.keys(raw.methods || {}),
          created: raw.created,
          modified: raw.modified,
          recycled: raw.recycled,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // List all objects
    this.server.tool(
      'list_objects',
      'List all MOO objects in the database with summary info.',
      {
        includeRecycled: z.boolean().optional().describe('Include soft-deleted objects'),
        limit: z.number().optional().describe('Max objects to return (default 100)'),
      },
      async ({ includeRecycled, limit }) => {
        const allObjects = await this.manager.db.listAll(includeRecycled ?? false);
        const objects = allObjects.slice(0, limit ?? 100).map(obj => ({
          id: obj._id,
          parent: obj.parent,
          name: obj.properties?.name?.value,
          propertyCount: Object.keys(obj.properties || {}).length,
          methodCount: Object.keys(obj.methods || {}).length,
          recycled: obj.recycled || false,
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify({ count: objects.length, objects }, null, 2) }],
        };
      }
    );

    // Get property value
    this.server.tool(
      'get_property',
      'Get a specific property value from a MOO object (walks inheritance chain).',
      {
        objectId: z.number().describe('Object ID'),
        name: z.string().describe('Property name'),
      },
      async ({ objectId, name }) => {
        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            content: [{ type: 'text', text: `Object #${objectId} not found` }],
            isError: true,
          };
        }

        const value = obj.get(name);
        return {
          content: [{ type: 'text', text: JSON.stringify({ objectId, name, value }, null, 2) }],
        };
      }
    );

    // Set property value
    this.server.tool(
      'set_property',
      'Set a property value on a MOO object.',
      {
        objectId: z.number().describe('Object ID'),
        name: z.string().describe('Property name'),
        value: z.any().describe('Property value (string, number, boolean, array, object, or objref like "#5")'),
      },
      async ({ objectId, name, value }) => {
        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            content: [{ type: 'text', text: `Object #${objectId} not found` }],
            isError: true,
          };
        }

        obj.set(name, value);
        return {
          content: [{ type: 'text', text: `Set ${name} = ${JSON.stringify(value)} on #${objectId}` }],
        };
      }
    );

    // Get method code
    this.server.tool(
      'get_method',
      'Get the TypeScript code for a method on a MOO object.',
      {
        objectId: z.number().describe('Object ID'),
        name: z.string().describe('Method name'),
      },
      async ({ objectId, name }) => {
        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            content: [{ type: 'text', text: `Object #${objectId} not found` }],
            isError: true,
          };
        }

        const methods = obj.getOwnMethods();
        if (!(name in methods)) {
          return {
            content: [{ type: 'text', text: `Method '${name}' not found on #${objectId}` }],
            isError: true,
          };
        }

        const method = methods[name];
        const result = {
          name,
          code: typeof method === 'string' ? method : method.code,
          callable: typeof method === 'object' ? method.callable : undefined,
          aliases: typeof method === 'object' ? method.aliases : undefined,
          help: typeof method === 'object' ? method.help : undefined,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Set method code
    this.server.tool(
      'set_method',
      'Create or update a TypeScript method on a MOO object.',
      {
        objectId: z.number().describe('Object ID'),
        name: z.string().describe('Method name'),
        code: z.string().describe('TypeScript code for the method body'),
        callable: z.boolean().optional().describe('Whether players can call this method directly'),
        help: z.string().optional().describe('Help text for the method'),
      },
      async ({ objectId, name, code, callable, help }) => {
        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            content: [{ type: 'text', text: `Object #${objectId} not found` }],
            isError: true,
          };
        }

        obj.setMethod(name, code, { callable, help });
        return {
          content: [{ type: 'text', text: `Method '${name}' saved on #${objectId}` }],
        };
      }
    );

    // Call a method
    this.server.tool(
      'call_method',
      'Execute a method on a MOO object and return the result.',
      {
        objectId: z.number().describe('Object ID'),
        name: z.string().describe('Method name'),
        args: z.array(z.any()).optional().describe('Arguments to pass to the method'),
      },
      async ({ objectId, name, args }) => {
        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            content: [{ type: 'text', text: `Object #${objectId} not found` }],
            isError: true,
          };
        }

        try {
          const result = await obj.call(name, ...(args || []));
          return {
            content: [{ type: 'text', text: JSON.stringify({ result }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error calling ${name}: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Create new object
    this.server.tool(
      'create_object',
      'Create a new MOO object with a specified parent.',
      {
        parent: z.number().describe('Parent object ID for inheritance'),
        properties: z.record(z.any()).optional().describe('Initial properties'),
      },
      async ({ parent, properties }) => {
        const obj = await this.manager.create({
          parent: parent as ObjId,
          properties: properties || {},
          methods: {},
        });

        return {
          content: [{ type: 'text', text: `Created object #${obj.id} with parent #${parent}` }],
        };
      }
    );

    // Search objects by property
    this.server.tool(
      'find_by_property',
      'Find MOO objects that have a specific property value.',
      {
        name: z.string().describe('Property name to search'),
        value: z.any().describe('Property value to match'),
      },
      async ({ name, value }) => {
        const objects = await this.manager.findByProperty(name, value);
        const results = objects.map(obj => ({
          id: obj.id,
          parent: obj._getRaw().parent,
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify({ count: results.length, objects: results }, null, 2) }],
        };
      }
    );

    // Get inheritance chain
    this.server.tool(
      'get_inheritance_chain',
      'Get the full parent inheritance chain for a MOO object.',
      { id: z.number().describe('Object ID') },
      async ({ id }) => {
        const chain: number[] = [];
        let currentId = id as ObjId;
        let prevId: ObjId = -1;

        while (currentId !== -1 && currentId !== prevId) {
          chain.push(currentId);
          const obj = await this.manager.load(currentId);
          if (!obj) break;
          prevId = currentId;
          currentId = obj.getParent();
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({ chain: chain.map(id => `#${id}`) }, null, 2) }],
        };
      }
    );

    // Dig - create a new room with optional exits
    this.server.tool(
      'dig',
      'Create a new room with optional bidirectional exits from an existing room.',
      {
        name: z.string().describe('Room name'),
        description: z.string().describe('Room description'),
        x: z.number().optional().describe('X coordinate (default 0)'),
        y: z.number().optional().describe('Y coordinate (default 0)'),
        z: z.number().optional().describe('Z coordinate (default 0)'),
        fromRoomId: z.number().optional().describe('Room ID to create exit from'),
        exitDirection: z.string().optional().describe('Exit direction (e.g., "north", "east", "up")'),
        returnDirection: z.string().optional().describe('Return exit direction (e.g., "south", "west", "down")'),
      },
      async ({ name, description, x, y, z: zCoord, fromRoomId, exitDirection, returnDirection }) => {
        // Direction alias map
        const aliasMap: Record<string, string[]> = {
          north: ['n'], south: ['s'], east: ['e'], west: ['w'],
          northeast: ['ne'], northwest: ['nw'], southeast: ['se'], southwest: ['sw'],
          up: ['u'], down: ['d', 'dn'], in: ['i'], out: ['o'],
        };

        // Find Room and Exit prototypes
        const allObjects = await this.manager.db.listAll(false);
        const roomProto = allObjects.find(o => o.properties?.name?.value === 'Room');
        const exitProto = allObjects.find(o => o.properties?.name?.value === 'Exit');

        if (!roomProto) {
          return { content: [{ type: 'text', text: 'Error: Room prototype not found' }], isError: true };
        }

        // Create the room
        const newRoom = await this.manager.create({
          parent: roomProto._id as ObjId,
          properties: {
            name: { type: 'string', value: name },
            description: { type: 'string', value: description },
            x: { type: 'number', value: x ?? 0 },
            y: { type: 'number', value: y ?? 0 },
            z: { type: 'number', value: zCoord ?? 0 },
          },
          methods: {},
        });

        const result: any = {
          room: { id: newRoom.id, name, coordinates: [x ?? 0, y ?? 0, zCoord ?? 0] },
          exits: [],
        };

        // Create exits if requested
        if (fromRoomId !== undefined && exitDirection && exitProto) {
          const fromRoom = await this.manager.load(fromRoomId as ObjId);
          if (fromRoom) {
            // Exit from source to new room
            const exitToNew = await this.manager.create({
              parent: exitProto._id as ObjId,
              properties: {
                name: { type: 'string', value: exitDirection },
                aliases: { type: 'array', value: aliasMap[exitDirection.toLowerCase()] || [] },
                destRoom: { type: 'objref', value: newRoom.id },
              },
              methods: {},
            });
            await fromRoom.call('addExit', exitToNew);
            result.exits.push({ id: exitToNew.id, direction: exitDirection, from: fromRoomId, to: newRoom.id });

            // Return exit from new room to source
            if (returnDirection) {
              const exitBack = await this.manager.create({
                parent: exitProto._id as ObjId,
                properties: {
                  name: { type: 'string', value: returnDirection },
                  aliases: { type: 'array', value: aliasMap[returnDirection.toLowerCase()] || [] },
                  destRoom: { type: 'objref', value: fromRoomId },
                },
                methods: {},
              });
              await newRoom.call('addExit', exitBack);
              result.exits.push({ id: exitBack.id, direction: returnDirection, from: newRoom.id, to: fromRoomId });
            }
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // === Telnet Session Tools ===

    // Connect to MOO via telnet
    this.server.tool(
      'session_connect',
      'Connect to the MOO via telnet. Returns a session ID and the welcome message. MOO output will be pushed via logging notifications.',
      {},
      async (_args, extra) => {
        try {
          const mcpSessionId = extra.sessionId;

          // Callback to push MOO output as logging messages
          // Send directly through the session's transport to support multi-client
          const onData = (telnetSessionId: string, data: string) => {
            const transport = mcpSessionId ? this.sessions.get(mcpSessionId) : undefined;
            if (!transport) return;

            const notification = {
              jsonrpc: '2.0' as const,
              method: 'notifications/message',
              params: {
                level: 'info',
                logger: `moo:${telnetSessionId}`,
                data: data,
              },
            };

            transport.send(notification).catch(() => {
              // Ignore send errors (client may have disconnected)
            });
          };

          const { sessionId, output } = await this.telnetClient.connect(onData);
          return {
            content: [{ type: 'text', text: JSON.stringify({ sessionId, output, push: true }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Connection failed: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Send command to session
    this.server.tool(
      'session_send',
      'Send a command to an active telnet session. Returns the response output.',
      {
        sessionId: z.string().describe('Session ID from session_connect'),
        command: z.string().describe('Command to send (e.g., username, password, or game command)'),
      },
      async ({ sessionId, command }) => {
        try {
          const { output, closed } = await this.telnetClient.send(sessionId, command);
          return {
            content: [{ type: 'text', text: JSON.stringify({ output, closed }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Send failed: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Get session log
    this.server.tool(
      'session_log',
      'Get the session log (last N lines of output). Useful for seeing context.',
      {
        sessionId: z.string().describe('Session ID'),
        lines: z.number().optional().describe('Number of lines to return (default: all, max 1000)'),
      },
      async ({ sessionId, lines }) => {
        const log = this.telnetClient.getLog(sessionId, lines);
        const status = this.telnetClient.getStatus(sessionId);
        return {
          content: [{ type: 'text', text: JSON.stringify({ ...status, log }, null, 2) }],
        };
      }
    );

    // List active sessions
    this.server.tool(
      'session_list',
      'List all active telnet sessions.',
      {},
      async () => {
        const sessions = this.telnetClient.listSessions();
        return {
          content: [{ type: 'text', text: JSON.stringify({ sessions, count: sessions.length }, null, 2) }],
        };
      }
    );

    // Close session
    this.server.tool(
      'session_close',
      'Close a telnet session.',
      {
        sessionId: z.string().describe('Session ID to close'),
      },
      async ({ sessionId }) => {
        this.telnetClient.close(sessionId);
        return {
          content: [{ type: 'text', text: `Session ${sessionId} closed` }],
        };
      }
    );
  }

  /**
   * Register MCP resources (read-only data)
   */
  private registerResources(): void {
    // Object schema documentation
    this.server.resource(
      'schema',
      'moo://schema',
      async () => ({
        contents: [{
          uri: 'moo://schema',
          mimeType: 'text/plain',
          text: `MOO Object Schema:

GameObject {
  _id: number          // Unique object ID (e.g., 0, 1, 2...)
  parent: number       // Parent object ID for inheritance (-1 for none)
  properties: {        // Key-value property storage
    [name]: {
      type: 'string' | 'number' | 'boolean' | 'null' | 'objref' | 'array' | 'object'
      value: any
    }
  }
  methods: {           // TypeScript method code
    [name]: {
      code: string     // TypeScript function body
      callable?: boolean  // Can players call this directly?
      aliases?: string[]  // Alternative command names
      help?: string       // Help documentation
    }
  }
  created: Date
  modified: Date
  recycled?: boolean   // Soft-deleted flag
}

Object References:
- Use "#N" format in properties to reference other objects
- Example: { location: "#5" } references object #5

Core Objects:
- #-1: Nothing (null reference)
- #0: ObjectManager (system root)
- #1: Root (base for inheritance)
- #2: System (connection handlers)
- #3: AuthManager (authentication)
- #4: CharGen (character generation)`,
        }],
      })
    );

    // Aliases resource
    this.server.resource(
      'aliases',
      'moo://aliases',
      async () => {
        const aliases = this.manager.getAliases?.() ?? {
          system: 2,
          authManager: 3,
          charGen: 4,
        };

        return {
          contents: [{
            uri: 'moo://aliases',
            mimeType: 'application/json',
            text: JSON.stringify(aliases, null, 2),
          }],
        };
      }
    );
  }

  /**
   * Register MCP prompts (reusable templates)
   */
  private registerPrompts(): void {
    this.server.prompt(
      'inspect-object',
      { id: z.string().describe('Object ID to inspect') },
      ({ id }) => ({
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please inspect MOO object #${id}:
1. Show all properties and their values
2. List all methods with their signatures
3. Show the inheritance chain (parent objects)
4. Identify any issues or suggestions for improvement`,
          },
        }],
      })
    );

    this.server.prompt(
      'create-prototype',
      { name: z.string(), parent: z.string().optional() },
      ({ name, parent }) => ({
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Create a new MOO prototype object called "${name}"${parent ? ` inheriting from #${parent}` : ''}:
1. Define appropriate properties for this type
2. Create common methods this object type would need
3. Follow existing patterns in the codebase
4. Add help documentation to methods`,
          },
        }],
      })
    );

    this.server.prompt(
      'debug-method',
      { objectId: z.string(), methodName: z.string() },
      ({ objectId, methodName }) => ({
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Debug the method "${methodName}" on object #${objectId}:
1. Fetch and analyze the current method code
2. Identify potential bugs or issues
3. Check for proper error handling
4. Suggest improvements while maintaining compatibility`,
          },
        }],
      })
    );
  }

  /**
   * Start the HTTP server with Streamable HTTP transport
   */
  async start(): Promise<void> {
    this.httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Only handle /mcp endpoint
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
      console.log(`🔮 MCP server listening on http://${this.host}:${this.port}/mcp`);
    });
  }

  /**
   * Handle POST requests (client-to-server messages)
   */
  private async handlePost(req: IncomingMessage, res: ServerResponse, sessionId?: string): Promise<void> {
    const body = await this.readBody(req);
    const message = JSON.parse(body);

    if (sessionId && this.sessions.has(sessionId)) {
      // Existing session
      const transport = this.sessions.get(sessionId)!;
      await transport.handleRequest(req, res, message);
    } else if (message.method === 'initialize') {
      // New session - create transport
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          this.sessions.set(newSessionId, transport);
        },
      });

      // Connect server to transport
      await this.server.connect(transport);

      // Handle the initialize request
      await transport.handleRequest(req, res, message);
    } else if (sessionId && !this.sessions.has(sessionId)) {
      // Stale session - server restarted. Auto-recreate session with same ID.
      console.log(`[MCP] Recreating stale session ${sessionId}`);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId, // Reuse the same session ID
        onsessioninitialized: (newSessionId) => {
          this.sessions.set(newSessionId, transport);
        },
      });

      // Connect server to transport
      await this.server.connect(transport);

      // Synthesize an initialize to set up the session properly
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

      // Create a fake response to absorb the initialize response
      const fakeRes = {
        writeHead: () => {},
        end: () => {},
        setHeader: () => {},
        write: () => true,
        on: () => {},
      } as unknown as ServerResponse;

      await transport.handleRequest(req, fakeRes, initMessage);

      // Now handle the actual request
      await transport.handleRequest(req, res, message);
    } else {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Bad Request: No session ID and not an initialize request' }));
    }
  }

  /**
   * Handle GET requests (SSE streaming for server-to-client notifications)
   */
  private async handleGet(req: IncomingMessage, res: ServerResponse, sessionId?: string): Promise<void> {
    if (!sessionId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing session ID' }));
      return;
    }
    if (!this.sessions.has(sessionId)) {
      // Stale session on GET - can't auto-recreate for SSE, just return error
      // The POST handler will recreate the session on next tool call
      res.writeHead(410);
      res.end(JSON.stringify({
        error: 'Session expired. Next request will auto-reconnect.',
        code: 'SESSION_EXPIRED'
      }));
      return;
    }

    const transport = this.sessions.get(sessionId)!;
    await transport.handleRequest(req, res);
  }

  /**
   * Handle DELETE requests (session cleanup)
   */
  private handleDelete(res: ServerResponse, sessionId?: string): void {
    if (sessionId) {
      const transport = this.sessions.get(sessionId);
      if (transport) {
        transport.close();
        this.sessions.delete(sessionId);
      }
    }
    res.writeHead(204);
    res.end();
  }

  /**
   * Read request body
   */
  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    // Close all sessions
    for (const [id, transport] of this.sessions) {
      transport.close();
      this.sessions.delete(id);
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.close(err => err ? reject(err) : resolve());
      });
      this.httpServer = null;
    }
  }
}

/**
 * Create and start MCP server
 */
export async function createMCPServer(manager: ObjectManager, config?: MCPServerConfig): Promise<MaliceMCPServer> {
  const server = new MaliceMCPServer(manager, config);
  await server.start();
  return server;
}
