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

import { existsSync, readFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { join } from 'node:path';
import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { ObjId, RuntimeObject } from '../../types/object.js';
import type { ObjectManager } from '../database/object-manager.js';

interface MCPServerConfig {
  port?: number;
  host?: string;
}

interface SessionState {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  playerId?: ObjId; // Authenticated player ID (undefined = unauthenticated)
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
    config: MCPServerConfig = {},
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
   * Authenticate user via HTTP Basic Auth
   * Returns player ID if valid, undefined if invalid
   */
  private async authenticate(
    authHeader: string | undefined,
  ): Promise<ObjId | undefined> {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return undefined;
    }

    try {
      // Decode Basic Auth: "Basic base64(username:password)"
      const base64Creds = authHeader.slice(6);
      const credentials = Buffer.from(base64Creds, 'base64').toString('utf-8');
      const [username, password] = credentials.split(':');

      if (!username || !password) {
        return undefined;
      }

      // Look up player by username
      const objectManager = await this.manager.load(0);
      const aliases =
        (objectManager?.get('aliases') as Record<string, number>) || {};
      const playerPrototypeId = aliases.player;
      const adminPrototypeId = aliases.admin;

      const users = await this.manager.db.listAll(false);
      const getValue = (v: any) =>
        v && typeof v === 'object' && 'type' in v ? v.value : v;

      const userDoc = users.find((u) => {
        const parentId = getValue(u.parent);
        return (
          (parentId === playerPrototypeId || parentId === adminPrototypeId) &&
          getValue(u.properties.playername) === username.toLowerCase()
        );
      });

      if (!userDoc) {
        return undefined;
      }

      // Load player and verify password
      const player = await this.manager.load(userDoc._id);
      if (!player) {
        return undefined;
      }

      // Check password using player's checkPassword method
      const valid = (await player.call('checkPassword', password)) as boolean;
      if (!valid) {
        return undefined;
      }

      return player.id as number;
    } catch (err) {
      console.error('[MCP] Authentication error:', err);
      return undefined;
    }
  }

  /**
   * Serialize value for JSON output (handles RuntimeObjects)
   */
  private serializeValue(value: any, seen = new WeakSet()): any {
    if (value === null || value === undefined) return value;

    // RuntimeObject -> #ID
    if (
      value &&
      typeof value === 'object' &&
      'id' in value &&
      typeof value.id === 'number' &&
      typeof value.get === 'function'
    ) {
      return `#${value.id}`;
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.serializeValue(v, seen));
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
  private createSessionServer(playerId?: ObjId): McpServer {
    const server = new McpServer({
      name: 'malice-moo',
      version: '2.0.0',
    });

    this.registerTools(server, playerId);
    this.registerResources(server);

    return server;
  }

  /**
   * Register code-first tools
   */
  private registerTools(server: McpServer, playerId?: ObjId): void {
    // Primary tool: Execute MOO code
    server.tool(
      'execute_moo_code',
      `Execute MOO/TypeScript code with access to all MCP tools.

The code runs in the MOO execution context with access to:
- $ - Object manager for queries
- $load(id) - Load object by ID
- $create({parent, properties}) - Create new object
- $alias shortcuts - $room, $player, $exit, etc.
- player - Your authenticated player object (if HTTP Basic Auth provided)

AUTHENTICATION:
- Provide HTTP Basic Auth header: Authorization: Basic base64(username:password)
- If authenticated, 'player' variable will be set to your player object
- If not authenticated, 'player' will be undefined

Example (authenticated):
  // Access your player properties
  console.log(\`Logged in as: \${player?.playername}\`);

  // Create a room using $recycler
  const room = await $recycler.create($room, {
    name: 'Hallway',
    description: 'A long hallway',
    x: 0, y: 1, z: 0
  });

  // Create an item and move it to the room
  const torch = await $recycler.create($item, { name: 'torch' });
  await torch.moveTo(room);

  return { roomId: room.id, torchId: torch.id };

Write composable code - loops, conditionals, multi-step operations all work.`,
      {
        code: z.string().describe('MOO/TypeScript code to execute'),
      },
      async ({ code }) => {
        try {
          const $mcp = this.getMCP();
          if (!$mcp) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error:
                      'MCP not bootstrapped. Run npm run bootstrap:world',
                  }),
                },
              ],
              isError: true,
            };
          }

          // Pass playerId to execute() so it can inject 'player' into execution context
          const result = await $mcp.call('execute', code, playerId);
          const serialized = this.serializeValue(result);

          return {
            content: [
              { type: 'text', text: JSON.stringify(serialized, null, 2) },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: err instanceof Error ? err.message : String(err),
                }),
              },
            ],
            isError: true,
          };
        }
      },
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
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: 'MCP not bootstrapped' }),
                },
              ],
              isError: true,
            };
          }

          const tools = await $mcp.call('listTools');
          return {
            content: [{ type: 'text', text: JSON.stringify(tools, null, 2) }],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: err instanceof Error ? err.message : String(err),
                }),
              },
            ],
            isError: true,
          };
        }
      },
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
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: 'MCP not bootstrapped' }),
                },
              ],
              isError: true,
            };
          }

          const schema = await $mcp.call('getToolSchema', name);
          return {
            content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: err instanceof Error ? err.message : String(err),
                }),
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  /**
   * Helper to get value from typed property or raw value
   */
  private getValue(v: any): any {
    return v && typeof v === 'object' && 'type' in v ? v.value : v;
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
            contents: [
              {
                uri: 'moo://tools',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'MCP not bootstrapped' }),
              },
            ],
          };
        }

        try {
          const tools = await $mcp.call('listTools');
          return {
            contents: [
              {
                uri: 'moo://tools',
                mimeType: 'application/json',
                text: JSON.stringify(tools, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: 'moo://tools',
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Aliases resource
    server.resource(
      'aliases',
      'moo://aliases',
      { description: 'List all registered object aliases' },
      async () => {
        try {
          const objectManager = await this.manager.load(0);
          const aliases =
            (objectManager?.get('aliases') as Record<string, number>) || {};
          const sorted: Record<string, number> = {};
          for (const key of Object.keys(aliases).sort()) {
            if (typeof aliases[key] === 'number') {
              sorted[key] = aliases[key];
            }
          }
          return {
            contents: [
              {
                uri: 'moo://aliases',
                mimeType: 'application/json',
                text: JSON.stringify(sorted, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: 'moo://aliases',
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Object by ID - moo://objects/{id}
    server.resource(
      'objects/{id}',
      new ResourceTemplate('moo://objects/{id}', { list: undefined }),
      { description: 'Get object details by ID' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/objects\/(.+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const idStr = match[1];
          const objId = idStr.startsWith('#')
            ? parseInt(idStr.slice(1), 10)
            : parseInt(idStr, 10);

          const obj = await this.manager.load(objId);
          if (!obj) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Object #${objId} not found` }),
                },
              ],
            };
          }

          const parent = obj.get('parent') as RuntimeObject | undefined;
          const serialized = this.serializeValue({
            id: obj.id,
            parent: parent?.id,
            name: obj.get('name'),
            description: obj.get('description'),
            location: obj.get('location'),
            methods: Object.keys(obj.getOwnMethods()),
          });

          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(serialized, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Object by alias - moo://alias/{name}
    server.resource(
      'alias/{name}',
      new ResourceTemplate('moo://alias/{name}', { list: undefined }),
      { description: 'Get object by alias name' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/alias\/(.+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const aliasName = match[1];
          const objectManager = await this.manager.load(0);
          const aliases =
            (objectManager?.get('aliases') as Record<string, number>) || {};
          const objId = aliases[aliasName];

          if (objId === undefined) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    error: `Alias '${aliasName}' not found`,
                  }),
                },
              ],
            };
          }

          const obj = await this.manager.load(objId);
          if (!obj) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    error: `Object #${objId} not found for alias '${aliasName}'`,
                  }),
                },
              ],
            };
          }

          const parent = obj.get('parent') as RuntimeObject | undefined;
          const serialized = this.serializeValue({
            alias: aliasName,
            id: obj.id,
            parent: parent?.id,
            name: obj.get('name'),
            description: obj.get('description'),
            methods: Object.keys(obj.getOwnMethods()),
          });

          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(serialized, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Room state - moo://rooms/{id}
    server.resource(
      'rooms/{id}',
      new ResourceTemplate('moo://rooms/{id}', { list: undefined }),
      { description: 'Get room state with exits, contents, and players' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/rooms\/(.+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const idStr = match[1];
          const roomId = idStr.startsWith('#')
            ? parseInt(idStr.slice(1), 10)
            : parseInt(idStr, 10);

          const room = await this.manager.load(roomId);
          if (!room) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Room #${roomId} not found` }),
                },
              ],
            };
          }

          // Get room contents
          const allObjs = await this.manager.db.listAll(false);
          const contents = allObjs
            .filter((doc) => this.getValue(doc.properties.location) === roomId)
            .map((doc) => ({
              id: doc._id,
              name: this.getValue(doc.properties.name),
            }));

          // Get exits
          const exits = room.get('exits') || {};
          const exitDetails: any = {};
          for (const [dir, destId] of Object.entries(exits)) {
            if (typeof destId === 'number') {
              const dest = await this.manager.load(destId);
              exitDetails[dir] = {
                id: destId,
                name: dest?.get('name') || 'Unknown',
              };
            }
          }

          const serialized = this.serializeValue({
            id: room.id,
            name: room.get('name'),
            description: room.get('description'),
            exits: exitDetails,
            contents,
            coordinates: {
              x: room.get('x'),
              y: room.get('y'),
              z: room.get('z'),
            },
          });

          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(serialized, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Players list - moo://players
    server.resource(
      'players',
      'moo://players',
      { description: 'List all player characters' },
      async () => {
        try {
          const objectManager = await this.manager.load(0);
          const aliases =
            (objectManager?.get('aliases') as Record<string, number>) || {};
          const playerPrototypeId = aliases.player;
          const adminPrototypeId = aliases.admin;

          const allObjs = await this.manager.db.listAll(false);
          const players = allObjs
            .filter((doc) => {
              const parentId = this.getValue(doc.parent);
              return (
                parentId === playerPrototypeId || parentId === adminPrototypeId
              );
            })
            .map((doc) => ({
              id: doc._id,
              playername: this.getValue(doc.properties.playername),
              name: this.getValue(doc.properties.name),
              location: this.getValue(doc.properties.location),
              isConnected: this.getValue(doc.properties.isConnected) || false,
            }));

          return {
            contents: [
              {
                uri: 'moo://players',
                mimeType: 'application/json',
                text: JSON.stringify(players, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: 'moo://players',
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // AI NPCs list - moo://ai
    server.resource(
      'ai',
      'moo://ai',
      { description: 'List all AI-controlled NPCs' },
      async () => {
        try {
          const $ai = this.manager.getAliases().get('ai');
          if (!$ai) {
            return {
              contents: [
                {
                  uri: 'moo://ai',
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: '$.ai not bootstrapped' }),
                },
              ],
            };
          }

          const registry = $ai.get('registry') || {};
          const npcs = [];

          for (const [npcIdStr, agentData] of Object.entries(registry)) {
            const npcId = parseInt(npcIdStr, 10);
            const npc = await this.manager.load(npcId);
            if (npc) {
              npcs.push({
                id: npcId,
                name: npc.get('name'),
                location: npc.get('location'),
                personality: (agentData as any).personality,
                isActive: (agentData as any).active || false,
              });
            }
          }

          return {
            contents: [
              {
                uri: 'moo://ai',
                mimeType: 'application/json',
                text: JSON.stringify(npcs, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: 'moo://ai',
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // AI NPC details - moo://ai/{id}
    server.resource(
      'ai/{id}',
      new ResourceTemplate('moo://ai/{id}', { list: undefined }),
      { description: 'Get AI NPC profile with personality and memories' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/ai\/(.+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const idStr = match[1];
          const npcId = idStr.startsWith('#')
            ? parseInt(idStr.slice(1), 10)
            : parseInt(idStr, 10);

          const $ai = this.manager.getAliases().get('ai');
          if (!$ai) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: '$.ai not bootstrapped' }),
                },
              ],
            };
          }

          const npc = await this.manager.load(npcId);
          if (!npc) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `NPC #${npcId} not found` }),
                },
              ],
            };
          }

          const registry = ($ai.get('registry') || {}) as Record<string, any>;
          const agentData = registry[String(npcId)] || {};

          const serialized = this.serializeValue({
            id: npcId,
            name: npc.get('name'),
            description: npc.get('description'),
            location: npc.get('location'),
            personality: agentData.personality,
            systemPrompt: agentData.systemPrompt,
            sessionId: agentData.sessionId,
            active: agentData.active || false,
            memories: npc.get('memories') || [],
            notes: npc.get('notes') || {},
          });

          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(serialized, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Plots list - moo://plots
    server.resource(
      'plots',
      'moo://plots',
      { description: 'List all active plots' },
      async () => {
        try {
          const $plot = this.manager.getAliases().get('plot');
          if (!$plot) {
            return {
              contents: [
                {
                  uri: 'moo://plots',
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: '$.plot not bootstrapped' }),
                },
              ],
            };
          }

          const plots = await $plot.call('listPlots');
          return {
            contents: [
              {
                uri: 'moo://plots',
                mimeType: 'application/json',
                text: JSON.stringify(plots, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: 'moo://plots',
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Plot details - moo://plots/{id}
    server.resource(
      'plots/{id}',
      new ResourceTemplate('moo://plots/{id}', { list: undefined }),
      { description: 'Get plot details and events' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/plots\/(.+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const plotId = match[1];
          const $plot = this.manager.getAliases().get('plot');
          if (!$plot) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: '$.plot not bootstrapped' }),
                },
              ],
            };
          }

          const plots = (await $plot.call('listPlots')) as any[];
          const plot = plots.find((p) => p.id === plotId);

          if (!plot) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Plot '${plotId}' not found` }),
                },
              ],
            };
          }

          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(plot, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Docs list - moo://docs
    server.resource(
      'docs',
      'moo://docs',
      { description: 'List all documentation files' },
      async () => {
        try {
          const docsDir = join(process.cwd(), 'docs');
          const files = await readdir(docsDir);
          const mdFiles = files
            .filter((f) => f.endsWith('.md'))
            .map((f) => ({
              uri: `moo://docs/${f.replace('.md', '').toLowerCase()}`,
              name: f.replace('.md', ''),
              description: `Documentation: ${f.replace('.md', '').replace(/-/g, ' ')}`,
            }));

          return {
            contents: [
              {
                uri: 'moo://docs',
                mimeType: 'application/json',
                text: JSON.stringify(mdFiles, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: 'moo://docs',
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Docs by name - moo://docs/{name}
    server.resource(
      'docs/{name}',
      new ResourceTemplate('moo://docs/{+name}', { list: undefined }),
      { description: 'Get documentation file by name' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/docs\/(.+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'text/markdown',
                  text: 'Invalid URI format',
                },
              ],
            };
          }

          const name = match[1];
          const docsDir = join(process.cwd(), 'docs');

          // Support both direct filename and paths (e.g., city-ai/combat)
          let filePath: string;
          if (name.includes('/')) {
            // Path like city-ai/combat -> docs/city-ai/COMBAT.md
            const parts = name.split('/');
            const fileName = `${parts[parts.length - 1].toUpperCase()}.md`;
            const dirPath = parts.slice(0, -1).join('/');
            filePath = join(docsDir, dirPath, fileName);
          } else {
            // Direct filename like builders-guide -> docs/BUILDERS-GUIDE.md
            filePath = join(docsDir, `${name.toUpperCase()}.md`);
          }

          const content = await readFile(filePath, 'utf-8');
          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'text/markdown',
                text: content,
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'text/markdown',
                text: `Error: ${String(err)}`,
              },
            ],
          };
        }
      },
    );

    // City AI docs list - moo://city-ai
    server.resource(
      'city-ai',
      'moo://city-ai',
      { description: 'List all city AI documentation files' },
      async () => {
        try {
          const cityAiDir = join(process.cwd(), 'docs', 'city-ai');
          const files = await readdir(cityAiDir);
          const mdFiles = files
            .filter((f) => f.endsWith('.md'))
            .map((f) => ({
              uri: `moo://city-ai/${f.replace('.md', '').toLowerCase()}`,
              name: f.replace('.md', ''),
              description: `City AI: ${f.replace('.md', '').replace(/-/g, ' ')}`,
            }));

          return {
            contents: [
              {
                uri: 'moo://city-ai',
                mimeType: 'application/json',
                text: JSON.stringify(mdFiles, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: 'moo://city-ai',
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // City AI doc by name - moo://city-ai/{name}
    server.resource(
      'city-ai/{name}',
      new ResourceTemplate('moo://city-ai/{name}', { list: undefined }),
      { description: 'Get city AI documentation file by name' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/city-ai\/(.+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'text/markdown',
                  text: 'Invalid URI format',
                },
              ],
            };
          }

          const name = match[1];
          const cityAiDir = join(process.cwd(), 'docs', 'city-ai');
          const filePath = join(cityAiDir, `${name.toUpperCase()}.md`);

          const content = await readFile(filePath, 'utf-8');
          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'text/markdown',
                text: content,
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'text/markdown',
                text: `Error: ${String(err)}`,
              },
            ],
          };
        }
      },
    );

    // AI World Log - moo://ai/worldLog
    server.resource(
      'ai/worldLog',
      new ResourceTemplate('moo://ai/worldLog', { list: undefined }),
      {
        description:
          'Shared OOC chat between Pluribus and Sister Gray (deity chat)',
      },
      async () => {
        try {
          const $ai = this.manager.getAliases().get('ai');
          if (!$ai) {
            return {
              contents: [
                {
                  uri: 'moo://ai/worldLog',
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: '$.ai not bootstrapped' }),
                },
              ],
            };
          }

          const worldLog = $ai.get('worldLog') || [];
          return {
            contents: [
              {
                uri: 'moo://ai/worldLog',
                mimeType: 'application/json',
                text: JSON.stringify(worldLog, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: 'moo://ai/worldLog',
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // AI NPC memories - moo://ai/{id}/memories
    server.resource(
      'ai/{id}/memories',
      new ResourceTemplate('moo://ai/{id}/memories', { list: undefined }),
      { description: 'Get memories for an AI NPC' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/ai\/(.+)\/memories/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const idStr = match[1];
          const npcId = idStr.startsWith('#')
            ? parseInt(idStr.slice(1), 10)
            : parseInt(idStr, 10);

          const npc = await this.manager.load(npcId);
          if (!npc) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `NPC #${npcId} not found` }),
                },
              ],
            };
          }

          const memories = npc.get('memories') || [];
          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(memories, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // AI NPC notes - moo://ai/{id}/notes
    server.resource(
      'ai/{id}/notes',
      new ResourceTemplate('moo://ai/{id}/notes', { list: undefined }),
      { description: 'Get notes for an AI NPC' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/ai\/(.+)\/notes/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const idStr = match[1];
          const npcId = idStr.startsWith('#')
            ? parseInt(idStr.slice(1), 10)
            : parseInt(idStr, 10);

          const npc = await this.manager.load(npcId);
          if (!npc) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `NPC #${npcId} not found` }),
                },
              ],
            };
          }

          const notes = npc.get('notes') || {};
          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(notes, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Plot events - moo://plots/{id}/events
    server.resource(
      'plots/{id}/events',
      new ResourceTemplate('moo://plots/{id}/events', { list: undefined }),
      { description: 'Get event log for a specific plot' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/plots\/(.+)\/events/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const plotId = match[1];
          const $plot = this.manager.getAliases().get('plot');
          if (!$plot) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: '$.plot not bootstrapped' }),
                },
              ],
            };
          }

          const plots = (await $plot.call('listPlots')) as any[];
          const plot = plots.find((p) => p.id === plotId);

          if (!plot) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Plot '${plotId}' not found` }),
                },
              ],
            };
          }

          const events = plot.events || [];
          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(events, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Recent events - moo://events/recent
    server.resource(
      'events/recent',
      'moo://events/recent',
      { description: 'Get recent game events' },
      async () => {
        try {
          const $plot = this.manager.getAliases().get('plot');
          if (!$plot) {
            return {
              contents: [
                {
                  uri: 'moo://events/recent',
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: '$.plot not bootstrapped' }),
                },
              ],
            };
          }

          const plots = (await $plot.call('listPlots')) as any[];
          const allEvents: any[] = [];

          for (const plot of plots) {
            if (plot.events && Array.isArray(plot.events)) {
              for (const event of plot.events) {
                allEvents.push({
                  ...event,
                  plotId: plot.id,
                  plotTitle: plot.title,
                });
              }
            }
          }

          // Sort by timestamp descending, take last 50
          allEvents.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          const recent = allEvents.slice(0, 50);

          return {
            contents: [
              {
                uri: 'moo://events/recent',
                mimeType: 'application/json',
                text: JSON.stringify(recent, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: 'moo://events/recent',
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Individual player - moo://players/{id}
    server.resource(
      'players/{id}',
      new ResourceTemplate('moo://players/{id}', { list: undefined }),
      { description: 'Get individual player details' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/players\/(.+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const idStr = match[1];
          const playerId = idStr.startsWith('#')
            ? parseInt(idStr.slice(1), 10)
            : parseInt(idStr, 10);

          const player = await this.manager.load(playerId);
          if (!player) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    error: `Player #${playerId} not found`,
                  }),
                },
              ],
            };
          }

          const serialized = this.serializeValue({
            id: player.id,
            playername: player.get('playername'),
            name: player.get('name'),
            description: player.get('description'),
            location: player.get('location'),
            isConnected: player.get('isConnected') || false,
            stats: player.get('stats'),
            inventory: player.get('inventory'),
          });

          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(serialized, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Schema - moo://schema
    server.resource(
      'schema',
      'moo://schema',
      { description: 'MOO object schema documentation' },
      async () => ({
        contents: [
          {
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
- #2: System (connection handlers)`,
          },
        ],
      }),
    );

    // Object property - moo://objects/{id}/prop/{name}
    server.resource(
      'objects/{id}/prop/{name}',
      new ResourceTemplate('moo://objects/{id}/prop/{name}', {
        list: undefined,
      }),
      { description: 'Get a specific property from a MOO object' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/objects\/(.+)\/prop\/(.+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const [, idStr, propName] = match;
          const objId = idStr.startsWith('#')
            ? parseInt(idStr.slice(1), 10)
            : parseInt(idStr, 10);

          const obj = await this.manager.load(objId);
          if (!obj) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Object #${objId} not found` }),
                },
              ],
            };
          }

          const value = obj.get(propName);
          const serialized = this.serializeValue({ [propName]: value });

          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(serialized, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Object method - moo://objects/{id}/method/{name}
    server.resource(
      'objects/{id}/method/{name}',
      new ResourceTemplate('moo://objects/{id}/method/{name}', {
        list: undefined,
      }),
      {
        description:
          'Get the TypeScript code for a method on a MOO object (walks inheritance chain)',
      },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/objects\/(.+)\/method\/(.+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'text/typescript',
                  text: '// Invalid URI format',
                },
              ],
            };
          }

          const [, idStr, methodName] = match;
          const objId = idStr.startsWith('#')
            ? parseInt(idStr.slice(1), 10)
            : parseInt(idStr, 10);

          const obj = await this.manager.load(objId);
          if (!obj) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'text/typescript',
                  text: `// Object #${objId} not found`,
                },
              ],
            };
          }

          // Walk inheritance chain to find method
          let current: any = obj;
          let methodCode: string | undefined;
          let foundInId: number | undefined;

          while (current) {
            const methods = current.getOwnMethods();
            if (methods[methodName]) {
              methodCode = methods[methodName].code;
              foundInId = current.id;
              break;
            }
            const parent = current.get('parent');
            current =
              parent && typeof parent === 'object' && 'id' in parent
                ? parent
                : undefined;
          }

          if (!methodCode) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'text/typescript',
                  text: `// Method '${methodName}' not found on #${objId} or its parents`,
                },
              ],
            };
          }

          const header =
            foundInId !== objId
              ? `// Method '${methodName}' inherited from #${foundInId}\n\n`
              : `// Method '${methodName}' on #${objId}\n\n`;

          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'text/typescript',
                text: header + methodCode,
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'text/typescript',
                text: `// Error: ${String(err)}`,
              },
            ],
          };
        }
      },
    );

    // Object verbs - moo://objects/{id}/verbs
    server.resource(
      'objects/{id}/verbs',
      new ResourceTemplate('moo://objects/{id}/verbs', { list: undefined }),
      { description: 'Get all verbs registered on an agent object' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/objects\/(.+)\/verbs/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const idStr = match[1];
          const objId = idStr.startsWith('#')
            ? parseInt(idStr.slice(1), 10)
            : parseInt(idStr, 10);

          const obj = await this.manager.load(objId);
          if (!obj) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Object #${objId} not found` }),
                },
              ],
            };
          }

          const verbs = obj.get('verbs') || {};
          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(verbs, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Paginated object list - moo://objects/list/{page}
    server.resource(
      'objects/list/{page}',
      new ResourceTemplate('moo://objects/list/{page}', { list: undefined }),
      { description: 'Get paginated list of all objects' },
      async (uri: URL) => {
        try {
          const uriStr = uri.toString();
          const match = uriStr.match(/moo:\/\/objects\/list\/(\d+)/);
          if (!match) {
            return {
              contents: [
                {
                  uri: uriStr,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Invalid URI format' }),
                },
              ],
            };
          }

          const page = parseInt(match[1], 10);
          const pageSize = 100;
          const skip = (page - 1) * pageSize;

          const allObjs = await this.manager.db.listAll(false);
          const total = allObjs.length;
          const totalPages = Math.ceil(total / pageSize);

          const pageObjs = allObjs.slice(skip, skip + pageSize).map((doc) => ({
            id: doc._id,
            parent: this.getValue(doc.parent),
            name: this.getValue(doc.properties.name),
          }));

          return {
            contents: [
              {
                uri: uriStr,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    page,
                    pageSize,
                    total,
                    totalPages,
                    objects: pageObjs,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // NPC Sessions list - moo://npc-sessions
    server.resource(
      'npc-sessions',
      'moo://npc-sessions',
      { description: 'List all AI NPC conversation sessions' },
      async () => {
        try {
          const $ai = this.manager.getAliases().get('ai');
          if (!$ai) {
            return {
              contents: [
                {
                  uri: 'moo://npc-sessions',
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: '$.ai not bootstrapped' }),
                },
              ],
            };
          }

          // Get sessions from $ai.listSessions() - persists after NPC recycling
          const sessions = (await $ai.call('listSessions')) || [];

          return {
            contents: [
              {
                uri: 'moo://npc-sessions',
                mimeType: 'application/json',
                text: JSON.stringify({ sessions }, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: 'moo://npc-sessions',
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Individual NPC session - moo://npc-sessions/{sessionId}
    server.resource(
      'npc-sessions/{sessionId}',
      new ResourceTemplate('moo://npc-sessions/{sessionId}', {
        list: undefined,
      }),
      { description: 'Get conversation history for a specific NPC session' },
      async (_uri: URL, variables: { sessionId?: string | string[] }) => {
        const sessionIdVar = variables.sessionId;
        const sessionId = Array.isArray(sessionIdVar)
          ? sessionIdVar[0]
          : sessionIdVar;

        if (!sessionId) {
          return {
            contents: [
              {
                uri: 'moo://npc-sessions/unknown',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Missing session ID' }),
              },
            ],
          };
        }

        try {
          // Get session metadata from $ai registry
          const $ai = this.manager.getAliases().get('ai');
          const sessionInfo = $ai
            ? await $ai.call('getSession', sessionId)
            : null;

          // JSONL session files are stored in ~/.claude/projects/-home-node/
          const sessionsDir = join(
            process.env.HOME || '/home/node',
            '.claude',
            'projects',
            '-home-node',
          );
          const sessionFile = join(sessionsDir, `${sessionId}.jsonl`);

          if (!existsSync(sessionFile)) {
            return {
              contents: [
                {
                  uri: `moo://npc-sessions/${sessionId}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    sessionId,
                    ...((sessionInfo as any) || {}),
                    error: 'Session file not found',
                  }),
                },
              ],
            };
          }

          // Read and parse JSONL file
          const content = readFileSync(sessionFile, 'utf-8');
          const lines = content
            .trim()
            .split('\n')
            .filter((l) => l.trim());
          const messages: Array<{
            type: string;
            timestamp?: string;
            content?: unknown;
          }> = [];

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              // Extract key info from each message
              if (parsed.type === 'user' && parsed.message?.content) {
                messages.push({
                  type: 'user',
                  timestamp: parsed.timestamp,
                  content: parsed.message.content,
                });
              } else if (
                parsed.type === 'assistant' &&
                parsed.message?.content
              ) {
                messages.push({
                  type: 'assistant',
                  timestamp: parsed.timestamp,
                  content: parsed.message.content,
                });
              }
            } catch {
              // Skip malformed lines
            }
          }

          const sessionInfoObj = (sessionInfo as any) || {};
          return {
            contents: [
              {
                uri: `moo://npc-sessions/${sessionId}`,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    sessionId,
                    npcId: sessionInfoObj.npcId,
                    npcName: sessionInfoObj.npcName,
                    role: sessionInfoObj.role,
                    startTime: sessionInfoObj.startTime,
                    lastActive: sessionInfoObj.lastActive,
                    messageCount: messages.length,
                    messages,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: `moo://npc-sessions/${sessionId}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );
  }

  /**
   * Start HTTP server
   */
  async start(): Promise<void> {
    this.httpServer = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET, POST, DELETE, OPTIONS',
        );
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, mcp-session-id',
        );

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
      },
    );

    this.httpServer.listen(this.port, this.host, () => {
      console.log(
        `🔮 MCP server (code-first) listening on http://${this.host}:${this.port}/mcp`,
      );
    });
  }

  private async handlePost(
    req: IncomingMessage,
    res: ServerResponse,
    sessionId?: string,
  ): Promise<void> {
    const body = await this.readBody(req);
    const message = JSON.parse(body);

    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res, message);
    } else if (message.method === 'initialize') {
      // Authenticate user via HTTP Basic Auth
      const authHeader = req.headers.authorization;
      const playerId = await this.authenticate(authHeader);

      const server = this.createSessionServer(playerId);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          this.sessions.set(newSessionId, { server, transport, playerId });
          if (playerId) {
            console.log(
              `[MCP] Authenticated session ${newSessionId} as player #${playerId}`,
            );
          } else {
            console.log(
              `[MCP] Unauthenticated session ${newSessionId} (no credentials provided)`,
            );
          }
        },
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, message);
    } else if (sessionId && !this.sessions.has(sessionId)) {
      // Stale session - recreate with authentication
      console.log(`[MCP] Recreating stale session ${sessionId}`);

      // Authenticate user via HTTP Basic Auth
      const authHeader = req.headers.authorization;
      const playerId = await this.authenticate(authHeader);

      const server = this.createSessionServer(playerId);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        onsessioninitialized: (newSessionId) => {
          this.sessions.set(newSessionId, { server, transport, playerId });
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
          clientInfo: { name: 'reconnected-client', version: '1.0.0' },
        },
      };

      const fakeRes = {
        writeHead: () => {},
        end: () => {},
        setHeader: () => {},
        write: () => true,
        on: () => {},
        off: () => {},
        destroy: () => {},
        writable: true,
        finished: false,
      } as unknown as ServerResponse;

      await transport.handleRequest(req, fakeRes, initMessage);
      await transport.handleRequest(req, res, message);
    } else {
      res.writeHead(400);
      res.end(
        JSON.stringify({
          error: 'Bad Request: No session ID and not an initialize request',
        }),
      );
    }
  }

  private async handleGet(
    req: IncomingMessage,
    res: ServerResponse,
    sessionId?: string,
  ): Promise<void> {
    if (!sessionId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing session ID' }));
      return;
    }
    if (!this.sessions.has(sessionId)) {
      res.writeHead(410);
      res.end(
        JSON.stringify({ error: 'Session expired', code: 'SESSION_EXPIRED' }),
      );
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
      req.on('data', (chunk) => (body += chunk));
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
        this.httpServer?.close((err) => (err ? reject(err) : resolve()));
      });
      this.httpServer = null;
    }
  }
}

export async function createMCPServer(
  manager: ObjectManager,
  config?: MCPServerConfig,
): Promise<MaliceMCPServer> {
  const server = new MaliceMCPServer(manager, config);
  await server.start();
  return server;
}
