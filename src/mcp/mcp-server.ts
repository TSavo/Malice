/**
 * MCP Server for Malice MOO Objects
 *
 * Streamable HTTP transport (modern MCP standard)
 * Provides tools for querying and updating MOO objects in MongoDB
 */

import * as fs from 'node:fs';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import * as path from 'node:path';
import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { ObjId, RuntimeObject } from '../../types/object.js';
import type { ObjectManager } from '../database/object-manager.js';
import { parseQuery, validateQuery } from './query-parser.js';

/**
 * Regex pattern for object references in MCP tools.
 * Accepts: #id (e.g., #100, #-1), $alias (e.g., $room), $.alias (e.g., $.recycler)
 */
const OBJREF_PATTERN = /^(#-?\d+|\$\.?[a-zA-Z_][a-zA-Z0-9_]*)$/;
const OBJREF_DESCRIPTION =
  'Object reference: #id (e.g., "#100"), $alias (e.g., "$room"), or $.alias (e.g., "$.recycler")';

interface MCPServerConfig {
  port?: number;
  host?: string;
}

/**
 * MCP Server for MOO object operations
 * Similar to DevTools but using MCP protocol over Streamable HTTP
 */
/**
 * Session state - each session gets its own McpServer and transport
 * This is required because the MCP SDK only supports one transport per server
 */
interface SessionState {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

export class MaliceMCPServer {
  private httpServer: ReturnType<typeof createServer> | null = null;
  private sessions = new Map<string, SessionState>();
  private port: number;
  private host: string;

  constructor(
    private manager: ObjectManager,
    config: MCPServerConfig = {},
  ) {
    this.port = config.port ?? 3001;
    this.host = config.host ?? '127.0.0.1';
  }

  /**
   * Create a new McpServer instance with all tools/resources/prompts registered.
   * Each session needs its own server because the MCP SDK only supports one transport per server.
   */
  private createSessionServer(): McpServer {
    const server = new McpServer({
      name: 'malice-moo',
      version: '1.0.0',
    });

    this.registerTools(server);
    this.registerResources(server);
    this.registerPrompts(server);

    return server;
  }

  /**
   * Serialize a value for JSON output, converting RuntimeObjects to "#ID" format
   * This avoids circular reference issues with Proxy objects
   */
  private serializeValue(value: any, seen = new WeakSet()): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle RuntimeObject (has .id property AND .get method - distinguishes from plain objects)
    if (
      value &&
      typeof value === 'object' &&
      'id' in value &&
      typeof value.id === 'number' &&
      typeof value.get === 'function'
    ) {
      return `#${value.id}`;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((v) => this.serializeValue(v, seen));
    }

    // Handle objects (but not primitives)
    if (typeof value === 'object') {
      // Detect circular references
      if (seen.has(value)) {
        return '[circular]';
      }
      seen.add(value);

      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = this.serializeValue(v, seen);
      }
      return result;
    }

    // Primitives pass through
    return value;
  }

  /**
   * Check if a string is an object reference format (#id, $alias, or $.alias)
   */
  private isObjectRef(value: string): boolean {
    // #id format (e.g., #100, #-1)
    if (/^#-?\d+$/.test(value)) return true;
    // $alias or $.alias format (e.g., $room, $.recycler)
    if (/^\$\.?[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) return true;
    return false;
  }

  /**
   * Resolve an object reference string to a RuntimeObject
   * Supports: #id (e.g., #100), $alias (e.g., $room), $.alias (e.g., $.recycler)
   * Throws if the object cannot be resolved
   */
  private async resolveObjectRef(ref: string): Promise<RuntimeObject> {
    // #id format
    if (/^#-?\d+$/.test(ref)) {
      const id = parseInt(ref.slice(1), 10);
      const obj = await this.manager.load(id as ObjId);
      if (!obj) {
        throw new Error(`Object ${ref} not found`);
      }
      return obj;
    }

    // $alias or $.alias format
    if (/^\$\.?[a-zA-Z_][a-zA-Z0-9_]*$/.test(ref)) {
      // Extract alias name: $foo -> foo, $.foo -> foo
      let alias = ref.slice(1); // Remove leading $
      if (alias.startsWith('.')) {
        alias = alias.slice(1); // Remove leading . if present
      }

      const obj = await this.getAlias(alias);
      if (!obj) {
        throw new Error(`Alias '${alias}' not found (from ${ref})`);
      }
      return obj;
    }

    throw new Error(
      `Invalid object reference format: ${ref}. Use #id, $alias, or $.alias`,
    );
  }

  /**
   * Deserialize a value from JSON input, converting object references to RuntimeObjects
   * Supports: #id (e.g., #100), $alias (e.g., $room), $.alias (e.g., $.recycler)
   * This is the inverse of serializeValue - allows passing object references in args
   * Throws if an object reference cannot be resolved
   */
  private async deserializeValue(value: any): Promise<any> {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle object reference format strings - convert to RuntimeObject
    if (typeof value === 'string' && this.isObjectRef(value)) {
      return this.resolveObjectRef(value);
    }

    // Handle arrays - recursively deserialize elements
    if (Array.isArray(value)) {
      const result = [];
      for (const item of value) {
        result.push(await this.deserializeValue(item));
      }
      return result;
    }

    // Handle objects - recursively deserialize values
    if (typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = await this.deserializeValue(v);
      }
      return result;
    }

    // Primitives pass through
    return value;
  }

  /**
   * Register MCP tools (operations with side effects)
   */
  private registerTools(server: McpServer): void {
    // NOTE: Read-only object inspection tools removed - use resources instead:
    // - moo://objects/{id} - get object details
    // - moo://objects/{id}/prop/{name} - get property
    // - moo://objects/{id}/method/{name} - get method (walks inheritance)
    // - moo://objects/list/{page} - paginated object list
    // - moo://rooms/{id} - room info

    // Set property value
    server.tool(
      'set_property',
      'Set a property value on a MOO object.',
      {
        objectId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        name: z.string().describe('Property name'),
        value: z
          .any()
          .describe(
            'Property value (string, number, boolean, array, object, or objref like "#5")',
          ),
      },
      async ({ objectId, name, value }) => {
        try {
          const obj = (await this.deserializeValue(objectId)) as RuntimeObject;
          const deserializedValue = await this.deserializeValue(value);
          obj.set(name, deserializedValue);
          return {
            content: [
              {
                type: 'text',
                text: `Set ${name} = ${JSON.stringify(this.serializeValue(deserializedValue))} on ${objectId}`,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Get property value
    server.tool(
      'get_property',
      'Get a property value from a MOO object.',
      {
        objectId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        name: z.string().describe('Property name'),
      },
      async ({ objectId, name }) => {
        try {
          const obj = (await this.deserializeValue(objectId)) as RuntimeObject;
          const value = obj.get(name);
          const serialized = this.serializeValue(value);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { property: name, value: serialized },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Set method code
    server.tool(
      'set_method',
      'Create or update a TypeScript method on a MOO object.',
      {
        objectId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        name: z.string().describe('Method name'),
        code: z.string().describe('TypeScript code for the method body'),
        callable: z
          .boolean()
          .optional()
          .describe('Whether players can call this method directly'),
        help: z.string().optional().describe('Help text for the method'),
      },
      async ({ objectId, name, code, callable, help }) => {
        try {
          const obj = (await this.deserializeValue(objectId)) as RuntimeObject;
          obj.setMethod(name, code, { callable, help });
          return {
            content: [
              { type: 'text', text: `Method '${name}' saved on ${objectId}` },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Call a method
    server.tool(
      'call_method',
      'Execute a method on a MOO object and return the result. Use "#id" format in args to pass object references.',
      {
        objectId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        name: z.string().describe('Method name'),
        args: z
          .array(z.any())
          .optional()
          .describe(
            'Arguments to pass to the method. Use "#ID" format for object references.',
          ),
      },
      async ({ objectId, name, args }) => {
        try {
          const obj = (await this.deserializeValue(objectId)) as RuntimeObject;
          // Deserialize args - converts "#ID" strings to RuntimeObjects
          const deserializedArgs = args
            ? await this.deserializeValue(args)
            : [];
          const result = await obj.call(name, ...deserializedArgs);
          const serialized = this.serializeValue(result);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ result: serialized }, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: `Error calling ${name}: ${err instanceof Error ? err.message : String(err)}`,
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Create new object (uses recycler for auto-aliases and hooks)
    server.tool(
      'create_object',
      'Create a new MOO object with a specified parent.',
      {
        parent: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        properties: z
          .record(z.any())
          .optional()
          .describe(
            'Initial properties (use "#id" format for object references)',
          ),
      },
      async ({ parent, properties }) => {
        try {
          const parentObj = (await this.deserializeValue(
            parent,
          )) as RuntimeObject;
          const deserializedProps = properties
            ? await this.deserializeValue(properties)
            : {};

          // Use recycler for proper creation (auto-aliases, onCreate hooks, etc.)
          const recycler = await this.getAlias('recycler');
          if (recycler) {
            const obj = await recycler.call('create', {
              parent: parentObj,
              properties: deserializedProps || {},
            });
            return {
              content: [
                {
                  type: 'text',
                  text: `Created object #${obj.id} with parent ${parent}`,
                },
              ],
            };
          }

          // Fallback to direct creation if recycler not available
          const obj = await this.manager.create({
            parent: parentObj,
            properties: deserializedProps || {},
            methods: {},
          });

          return {
            content: [
              {
                type: 'text',
                text: `Created object #${obj.id} with parent ${parent}`,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Get inheritance info for an object (ancestors and optionally descendants)
    server.tool(
      'get_inheritance',
      'Get inheritance info for an object: its ancestor chain (what it inherits from) and optionally its descendants (what inherits from it).',
      {
        objectId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        descendants: z
          .boolean()
          .optional()
          .describe('Include descendants (default: false)'),
        recursive: z
          .boolean()
          .optional()
          .describe(
            'Include all descendants recursively, not just direct children (default: false)',
          ),
        limit: z
          .number()
          .optional()
          .describe('Max descendants to return (default 100)'),
      },
      async ({ objectId, descendants, recursive, limit }) => {
        try {
          const obj = (await this.deserializeValue(objectId)) as RuntimeObject;
          const id = obj.id;

          // Build ancestor chain
          const ancestors: Array<{ id: string; name: string }> = [];
          let currentObj = obj.getParent();
          let prevId: ObjId = id as ObjId;

          while (currentObj !== null && currentObj.id !== prevId) {
            ancestors.push({
              id: `#${currentObj.id}`,
              name: (currentObj.get('name') as string) || '(unnamed)',
            });
            prevId = currentObj.id;
            currentObj = currentObj.getParent();
          }

          const parentObj = obj.getParent();
          const result: any = {
            objectId,
            name: obj.get('name') || '(unnamed)',
            parent: parentObj !== null ? `#${parentObj.id}` : null,
            ancestors,
          };

          // Optionally get descendants
          if (descendants) {
            const allObjects = await this.manager.db.listAll(false);
            const maxResults = limit ?? 100;
            const descendantList: Array<{
              id: string;
              name: string;
              parent: string;
            }> = [];

            if (recursive) {
              // Build set of all descendant parent IDs
              const validParents = new Set<number>([id]);
              let changed = true;
              while (changed) {
                changed = false;
                for (const o of allObjects) {
                  if (
                    validParents.has(o.parent.value) &&
                    !validParents.has(o._id)
                  ) {
                    validParents.add(o._id);
                    changed = true;
                  }
                }
              }
              validParents.delete(id); // Don't include the object itself

              for (const o of allObjects) {
                if (validParents.has(o._id) || o.parent.value === id) {
                  descendantList.push({
                    id: `#${o._id}`,
                    name: o.properties?.name?.value || '(unnamed)',
                    parent: `#${o.parent.value}`,
                  });
                  if (descendantList.length >= maxResults) break;
                }
              }
            } else {
              // Direct children only
              for (const o of allObjects) {
                if (o.parent.value === id) {
                  descendantList.push({
                    id: `#${o._id}`,
                    name: o.properties?.name?.value || '(unnamed)',
                    parent: `#${o.parent.value}`,
                  });
                  if (descendantList.length >= maxResults) break;
                }
              }
            }

            result.descendants = {
              count: descendantList.length,
              objects: descendantList,
            };
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Alias lookup
    server.tool(
      'alias_lookup',
      'Look up an object by its alias (e.g., "lock", "recycler", "room"). Returns the object ID and basic info.',
      {
        alias: z
          .string()
          .describe(
            'Alias name without $ prefix (e.g., "lock", "room", "recycler")',
          ),
      },
      async ({ alias }) => {
        // Remove $ prefix if provided
        const cleanAlias = alias.startsWith('$') ? alias.slice(1) : alias;
        // Handle $.foo format
        const finalAlias = cleanAlias.startsWith('.')
          ? cleanAlias.slice(1)
          : cleanAlias;

        const objectManager = await this.manager.load(0 as ObjId);
        if (!objectManager) {
          return {
            content: [{ type: 'text', text: 'ObjectManager not found' }],
            isError: true,
          };
        }

        const aliases = objectManager.get('aliases') as
          | Record<string, number>
          | undefined;
        if (!aliases) {
          return {
            content: [{ type: 'text', text: 'No aliases registered' }],
            isError: true,
          };
        }

        const objectId = aliases[finalAlias];
        if (objectId === undefined) {
          // List available aliases if not found
          const available = Object.keys(aliases).sort();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: `Alias '${finalAlias}' not found`,
                    available: available.slice(0, 50),
                    total: available.length,
                  },
                  null,
                  2,
                ),
              },
            ],
            isError: true,
          };
        }

        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            content: [
              {
                type: 'text',
                text: `Alias '${finalAlias}' points to #${objectId} but object not found`,
              },
            ],
            isError: true,
          };
        }

        const parentObj = obj.getParent();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  alias: finalAlias,
                  id: objectId,
                  name: obj.get('name'),
                  parent: parentObj ? `#${parentObj.id}` : null,
                  description: obj.get('description'),
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    // List all aliases
    server.tool(
      'list_aliases',
      'List all registered object aliases ($.foo names).',
      {},
      async () => {
        const objectManager = await this.manager.load(0 as ObjId);
        if (!objectManager) {
          return {
            content: [{ type: 'text', text: 'ObjectManager not found' }],
            isError: true,
          };
        }

        const aliases = objectManager.get('aliases') as
          | Record<string, number>
          | undefined;
        if (!aliases) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ count: 0, aliases: {} }, null, 2),
              },
            ],
          };
        }

        // Sort by alias name
        const sorted: Record<string, number> = {};
        for (const key of Object.keys(aliases).sort()) {
          sorted[key] = aliases[key];
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  count: Object.keys(sorted).length,
                  aliases: sorted,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    // Add alias
    server.tool(
      'add_alias',
      'Register a global alias for an object (e.g., $.myThing). Makes it accessible to both factions.',
      {
        alias: z
          .string()
          .describe(
            'Alias name without $ prefix (e.g., "securityCamera", "deadDrop")',
          ),
        objectId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
      },
      async ({ alias, objectId: rawObjectId }) => {
        try {
          const objectManager = await this.manager.load(0 as ObjId);
          if (!objectManager) {
            return {
              content: [{ type: 'text', text: 'ObjectManager not found' }],
              isError: true,
            };
          }

          // Clean alias - remove $ or $. prefix if provided
          let cleanAlias = alias;
          if (cleanAlias.startsWith('$.')) {
            cleanAlias = cleanAlias.slice(2);
          } else if (cleanAlias.startsWith('$')) {
            cleanAlias = cleanAlias.slice(1);
          }

          // Resolve the object ID
          const targetObj = (await this.deserializeValue(
            rawObjectId,
          )) as RuntimeObject;
          if (!targetObj) {
            return {
              content: [
                { type: 'text', text: `Object ${rawObjectId} not found` },
              ],
              isError: true,
            };
          }

          // Add the alias
          await objectManager.call('addAlias', cleanAlias, targetObj.id);

          return {
            content: [
              {
                type: 'text',
                text: `Registered $${cleanAlias} -> #${targetObj.id}`,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${err instanceof Error ? err.message : String(err)}`,
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Dig - create a new room with optional exits
    server.tool(
      'dig',
      'Create a new room with optional bidirectional exits from an existing room.',
      {
        name: z.string().describe('Room name'),
        description: z.string().describe('Room description'),
        x: z.number().optional().describe('X coordinate (default 0)'),
        y: z.number().optional().describe('Y coordinate (default 0)'),
        z: z.number().optional().describe('Z coordinate (default 0)'),
        fromRoomId: z
          .string()
          .regex(OBJREF_PATTERN)
          .optional()
          .describe(OBJREF_DESCRIPTION),
        exitDirection: z
          .string()
          .optional()
          .describe('Exit direction (e.g., "north", "east", "up")'),
        returnDirection: z
          .string()
          .optional()
          .describe('Return exit direction (e.g., "south", "west", "down")'),
      },
      async ({
        name,
        description,
        x,
        y,
        z: zCoord,
        fromRoomId: rawFromRoomId,
        exitDirection,
        returnDirection,
      }) => {
        try {
          // Direction alias map
          const aliasMap: Record<string, string[]> = {
            north: ['n'],
            south: ['s'],
            east: ['e'],
            west: ['w'],
            northeast: ['ne'],
            northwest: ['nw'],
            southeast: ['se'],
            southwest: ['sw'],
            up: ['u'],
            down: ['d', 'dn'],
            in: ['i'],
            out: ['o'],
          };

          // Get fromRoom if provided
          let fromRoom: RuntimeObject | undefined;
          if (rawFromRoomId !== undefined) {
            fromRoom = (await this.deserializeValue(
              rawFromRoomId,
            )) as RuntimeObject;
          }

          // Find Room and Exit prototypes
          const allObjects = await this.manager.db.listAll(false);
          const roomProto = allObjects.find(
            (o) => o.properties?.name?.value === 'Room',
          );
          const exitProto = allObjects.find(
            (o) => o.properties?.name?.value === 'Exit',
          );

          if (!roomProto) {
            return {
              content: [
                { type: 'text', text: 'Error: Room prototype not found' },
              ],
              isError: true,
            };
          }

          // Create the room
          const roomProtoObj = await this.manager.load(roomProto._id as ObjId);
          const newRoom = await this.manager.create({
            parent: roomProtoObj!,
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
            room: {
              id: `#${newRoom.id}`,
              name,
              coordinates: [x ?? 0, y ?? 0, zCoord ?? 0],
            },
            exits: [],
          };

          // Create exits if requested
          if (fromRoom && exitDirection && exitProto) {
            // Exit from source to new room
            const exitProtoObj = await this.manager.load(
              exitProto._id as ObjId,
            );
            const exitToNew = await this.manager.create({
              parent: exitProtoObj!,
              properties: {
                name: { type: 'string', value: exitDirection },
                aliases: {
                  type: 'array',
                  value: aliasMap[exitDirection.toLowerCase()] || [],
                },
                destRoom: { type: 'objref', value: newRoom.id },
              },
              methods: {},
            });
            await fromRoom.call('addExit', exitToNew);
            result.exits.push({
              id: `#${exitToNew.id}`,
              direction: exitDirection,
              from: `#${fromRoom.id}`,
              to: `#${newRoom.id}`,
            });

            // Return exit from new room to source
            if (returnDirection) {
              const exitBack = await this.manager.create({
                parent: exitProtoObj!,
                properties: {
                  name: { type: 'string', value: returnDirection },
                  aliases: {
                    type: 'array',
                    value: aliasMap[returnDirection.toLowerCase()] || [],
                  },
                  destRoom: { type: 'objref', value: fromRoom.id },
                },
                methods: {},
              });
              await newRoom.call('addExit', exitBack);
              result.exits.push({
                id: `#${exitBack.id}`,
                direction: returnDirection,
                from: `#${newRoom.id}`,
                to: `#${fromRoom.id}`,
              });
            }
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // List all rooms
    server.tool(
      'list_rooms',
      'List all rooms in the world with their coordinates and exit counts.',
      {},
      async () => {
        const allObjects = await this.manager.db.listAll(false);
        const roomProto = allObjects.find(
          (o) => o.properties?.name?.value === 'Room',
        );
        if (!roomProto) {
          return {
            content: [{ type: 'text', text: 'Room prototype not found' }],
            isError: true,
          };
        }

        const rooms = [];
        for (const obj of allObjects) {
          // Check if this object inherits from Room (with cycle protection)
          let parentId = obj.parent.value;
          let isRoom = obj._id === roomProto._id;
          const seen = new Set<number>();
          while (parentId !== -1 && !isRoom && !seen.has(parentId)) {
            seen.add(parentId);
            if (parentId === roomProto._id) {
              isRoom = true;
              break;
            }
            const parent = allObjects.find((o) => o._id === parentId);
            if (!parent) break;
            parentId = parent.parent.value;
          }

          if (isRoom && obj._id !== roomProto._id) {
            rooms.push({
              id: obj._id,
              name: obj.properties?.name?.value || '(unnamed)',
              x: obj.properties?.x?.value ?? 0,
              y: obj.properties?.y?.value ?? 0,
              z: obj.properties?.z?.value ?? 0,
              exitCount: (obj.properties?.exits?.value || []).length,
            });
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: rooms.length, rooms }, null, 2),
            },
          ],
        };
      },
    );

    // List all players
    server.tool(
      'list_players',
      'List all player characters with their location and online status.',
      {},
      async () => {
        const allObjects = await this.manager.db.listAll(false);
        const playerProto = allObjects.find(
          (o) => o.properties?.name?.value === 'Player',
        );
        if (!playerProto) {
          return {
            content: [{ type: 'text', text: 'Player prototype not found' }],
            isError: true,
          };
        }

        const players = [];
        for (const obj of allObjects) {
          // Check if this object inherits from Player (with cycle protection)
          let parentId = obj.parent.value;
          let isPlayer = false;
          const seen = new Set<number>();
          while (parentId !== -1 && !seen.has(parentId)) {
            seen.add(parentId);
            if (parentId === playerProto._id) {
              isPlayer = true;
              break;
            }
            const parent = allObjects.find((o) => o._id === parentId);
            if (!parent) break;
            parentId = parent.parent.value;
          }

          if (isPlayer) {
            players.push({
              id: obj._id,
              name: obj.properties?.name?.value || '(unnamed)',
              location: obj.properties?.location?.value ?? null,
              connected: obj.properties?.connected?.value ?? false,
            });
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: players.length, players }, null, 2),
            },
          ],
        };
      },
    );

    // Link two rooms with exits
    server.tool(
      'link_rooms',
      'Create an exit from one room to another, optionally with a return exit.',
      {
        fromRoomId: z
          .string()
          .regex(OBJREF_PATTERN)
          .describe(OBJREF_DESCRIPTION),
        toRoomId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        exitDirection: z
          .string()
          .describe('Exit direction (e.g., "north", "east", "up")'),
        returnDirection: z
          .string()
          .optional()
          .describe('Return exit direction (e.g., "south", "west", "down")'),
      },
      async ({
        fromRoomId: rawFromId,
        toRoomId: rawToId,
        exitDirection,
        returnDirection,
      }) => {
        try {
          const fromRoom = (await this.deserializeValue(
            rawFromId,
          )) as RuntimeObject;
          const toRoom = (await this.deserializeValue(
            rawToId,
          )) as RuntimeObject;

          const aliasMap: Record<string, string[]> = {
            north: ['n'],
            south: ['s'],
            east: ['e'],
            west: ['w'],
            northeast: ['ne'],
            northwest: ['nw'],
            southeast: ['se'],
            southwest: ['sw'],
            up: ['u'],
            down: ['d', 'dn'],
            in: ['i'],
            out: ['o'],
          };

          const exitProto = await this.getAlias('exit');
          if (!exitProto) {
            return {
              content: [{ type: 'text', text: 'Exit prototype not found' }],
              isError: true,
            };
          }

          const result: any = { exits: [] };

          // Create exit from source to destination
          const exitTo = await this.manager.create({
            parent: exitProto,
            properties: {
              name: { type: 'string', value: exitDirection },
              aliases: {
                type: 'array',
                value: aliasMap[exitDirection.toLowerCase()] || [],
              },
              destRoom: { type: 'objref', value: toRoom.id },
            },
            methods: {},
          });
          await fromRoom.call('addExit', exitTo);
          result.exits.push({
            id: `#${exitTo.id}`,
            direction: exitDirection,
            from: `#${fromRoom.id}`,
            to: `#${toRoom.id}`,
          });

          // Create return exit if requested
          if (returnDirection) {
            const exitBack = await this.manager.create({
              parent: exitProto,
              properties: {
                name: { type: 'string', value: returnDirection },
                aliases: {
                  type: 'array',
                  value: aliasMap[returnDirection.toLowerCase()] || [],
                },
                destRoom: { type: 'objref', value: fromRoom.id },
              },
              methods: {},
            });
            await toRoom.call('addExit', exitBack);
            result.exits.push({
              id: `#${exitBack.id}`,
              direction: returnDirection,
              from: `#${toRoom.id}`,
              to: `#${fromRoom.id}`,
            });
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Remove an exit
    server.tool(
      'unlink',
      'Remove an exit from a room.',
      {
        roomId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        exitId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
      },
      async ({ roomId: rawRoomId, exitId: rawExitId }) => {
        try {
          const room = (await this.deserializeValue(
            rawRoomId,
          )) as RuntimeObject;
          const exit = (await this.deserializeValue(
            rawExitId,
          )) as RuntimeObject;

          await room.call('removeExit', exit);
          return {
            content: [
              {
                type: 'text',
                text: `Exit #${exit.id} removed from room #${room.id}`,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Move an object to a location
    server.tool(
      'move_object',
      'Move an object to a new location (room or container).',
      {
        objectId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        destinationId: z
          .string()
          .regex(OBJREF_PATTERN)
          .describe(OBJREF_DESCRIPTION),
      },
      async ({ objectId, destinationId }) => {
        try {
          const obj = (await this.deserializeValue(objectId)) as RuntimeObject;
          const dest = (await this.deserializeValue(
            destinationId,
          )) as RuntimeObject;

          await obj.call('moveTo', dest);
          return {
            content: [
              {
                type: 'text',
                text: `Moved #${obj.id} (${obj.get('name')}) to #${dest.id} (${dest.get('name')})`,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Recycle (delete) an object
    server.tool(
      'recycle_object',
      'Recycle (soft-delete) a MOO object. Removes it from the world and marks it for reuse.',
      {
        objectId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
      },
      async ({ objectId }) => {
        try {
          const obj = (await this.deserializeValue(objectId)) as RuntimeObject;
          const recycler = await this.getAlias('recycler');
          if (!recycler) {
            return {
              content: [{ type: 'text', text: 'Recycler not found' }],
              isError: true,
            };
          }

          const name = obj.get('name');
          await recycler.call('recycle', obj);
          return {
            content: [{ type: 'text', text: `Recycled #${obj.id} (${name})` }],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Clone an object
    server.tool(
      'clone_object',
      'Create a deep copy of an object with all its properties. Optionally place at a location.',
      {
        objectId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        locationId: z
          .string()
          .regex(OBJREF_PATTERN)
          .optional()
          .describe(OBJREF_DESCRIPTION),
      },
      async ({ objectId, locationId }) => {
        try {
          const obj = (await this.deserializeValue(objectId)) as RuntimeObject;
          let location: RuntimeObject | undefined;
          if (locationId !== undefined) {
            location = (await this.deserializeValue(
              locationId,
            )) as RuntimeObject;
          }

          // Get raw data and create new object with same parent
          const raw = obj._getRaw();
          const props: Record<string, any> = {};

          // Copy own properties (not inherited)
          for (const [key, val] of Object.entries(raw.properties || {})) {
            if (key !== 'location') {
              props[key] = val;
            }
          }

          // Set location if provided
          if (location) {
            props.location = { type: 'objref', value: location.id };
          }

          const cloneParent = await this.manager.load(raw.parent.value);
          const clone = await this.manager.create({
            parent: cloneParent!,
            properties: props,
            methods: raw.methods || {},
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    cloned: `#${obj.id}`,
                    newId: `#${clone.id}`,
                    name: clone.get('name'),
                    location: location ? `#${location.id}` : null,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Get exits from a room
    server.tool(
      'get_exits',
      'List all exits from a room with their destinations and any attached doors.',
      {
        roomId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
      },
      async ({ roomId: rawRoomId }) => {
        try {
          const room = (await this.deserializeValue(
            rawRoomId,
          )) as RuntimeObject;

          // exits property should be an array of RuntimeObjects or IDs
          const exitRefs = room.get('exits') as any[] | undefined;
          if (!exitRefs || exitRefs.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      roomId: `#${room.id}`,
                      roomName: room.get('name'),
                      exits: [],
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }

          const exits = [];
          for (const exitRef of exitRefs) {
            // exitRef could be a RuntimeObject or a number (legacy)
            const exit =
              typeof exitRef === 'number'
                ? await this.manager.load(exitRef as ObjId)
                : exitRef;

            if (exit) {
              const destRoom = exit.get('destRoom');
              const destName =
                destRoom && typeof destRoom === 'object' && 'get' in destRoom
                  ? destRoom.get('name')
                  : null;

              const door = exit.get('door');
              let doorInfo = null;
              if (door && typeof door === 'object' && 'get' in door) {
                doorInfo = {
                  id: `#${door.id}`,
                  name: door.get('name'),
                  open: door.get('open'),
                  locks: door.get('locks') || [],
                };
              }

              exits.push({
                id: `#${exit.id}`,
                direction: exit.get('name'),
                aliases: exit.get('aliases') || [],
                destRoom: destRoom
                  ? `#${typeof destRoom === 'object' ? destRoom.id : destRoom}`
                  : null,
                destName,
                door: doorInfo,
              });
            }
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    roomId: `#${room.id}`,
                    roomName: room.get('name'),
                    exits,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Spawn an item at a location
    server.tool(
      'spawn_item',
      'Create an instance of a prototype and place it at a location in one step.',
      {
        prototypeId: z
          .string()
          .regex(OBJREF_PATTERN)
          .describe(OBJREF_DESCRIPTION),
        locationId: z
          .string()
          .regex(OBJREF_PATTERN)
          .describe(OBJREF_DESCRIPTION),
        properties: z
          .record(z.any())
          .optional()
          .describe(
            'Override properties (use "#id" format for object references)',
          ),
      },
      async ({ prototypeId: rawProtoId, locationId: rawLocId, properties }) => {
        try {
          const proto = (await this.deserializeValue(
            rawProtoId,
          )) as RuntimeObject;
          const location = (await this.deserializeValue(
            rawLocId,
          )) as RuntimeObject;

          // Deserialize properties if provided
          const deserializedProps = properties
            ? ((await this.deserializeValue(properties)) as Record<string, any>)
            : {};

          // Build properties with location
          const props: Record<string, any> = {
            location: { type: 'objref', value: location.id },
          };

          // Add any override properties
          for (const [key, value] of Object.entries(deserializedProps)) {
            if (typeof value === 'string') {
              props[key] = { type: 'string', value };
            } else if (typeof value === 'number') {
              props[key] = { type: 'number', value };
            } else if (typeof value === 'boolean') {
              props[key] = { type: 'boolean', value };
            } else if (Array.isArray(value)) {
              props[key] = { type: 'array', value };
            } else if (value && typeof value === 'object' && 'id' in value) {
              // RuntimeObject - store as objref
              props[key] = { type: 'objref', value: value.id };
            } else if (value && typeof value === 'object') {
              props[key] = { type: 'object', value };
            }
          }

          const item = await this.manager.create({
            parent: proto,
            properties: props,
            methods: {},
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    created: `#${item.id}`,
                    prototype: `#${proto.id}`,
                    prototypeName: proto.get('name'),
                    name: item.get('name'),
                    location: `#${location.id}`,
                    locationName: location.get('name'),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Attach door to exit
    server.tool(
      'set_exit_door',
      'Create and attach a door to an exit, or attach an existing door.',
      {
        exitId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
        doorId: z
          .string()
          .regex(OBJREF_PATTERN)
          .optional()
          .describe(OBJREF_DESCRIPTION),
        doorName: z
          .string()
          .optional()
          .describe('Name for new door (default: "door")'),
        doorDescription: z
          .string()
          .optional()
          .describe('Description for new door'),
        open: z
          .boolean()
          .optional()
          .describe('Whether door starts open (default: true)'),
      },
      async ({
        exitId: rawExitId,
        doorId: rawDoorId,
        doorName,
        doorDescription,
        open,
      }) => {
        try {
          const exit = (await this.deserializeValue(
            rawExitId,
          )) as RuntimeObject;

          let door: RuntimeObject;
          if (rawDoorId !== undefined) {
            door = (await this.deserializeValue(rawDoorId)) as RuntimeObject;
          } else {
            // Create new door
            const doorProto = await this.getAlias('door');
            if (!doorProto) {
              return {
                content: [{ type: 'text', text: 'Door prototype not found' }],
                isError: true,
              };
            }

            door = await this.manager.create({
              parent: doorProto,
              properties: {
                name: { type: 'string', value: doorName ?? 'door' },
                description: {
                  type: 'string',
                  value: doorDescription ?? 'A door.',
                },
                open: { type: 'boolean', value: open ?? true },
              },
              methods: {},
            });
          }

          // Attach door to exit (store the RuntimeObject reference)
          exit.set('door', door);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    exitId: `#${exit.id}`,
                    exitName: exit.get('name'),
                    doorId: `#${door.id}`,
                    doorName: door.get('name'),
                    open: door.get('open'),
                    created: rawDoorId === undefined,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Describe object as player would see it
    server.tool(
      'describe_object',
      'Get the runtime description of an object as a player would see it (calls describe() method).',
      {
        objectId: z.string().regex(OBJREF_PATTERN).describe(OBJREF_DESCRIPTION),
      },
      async ({ objectId }) => {
        try {
          const obj = (await this.deserializeValue(objectId)) as RuntimeObject;

          try {
            const description = await obj.call('describe');
            return {
              content: [
                {
                  type: 'text',
                  text:
                    typeof description === 'string'
                      ? description
                      : JSON.stringify(description, null, 2),
                },
              ],
            };
          } catch {
            // Fall back to basic description property
            return {
              content: [
                {
                  type: 'text',
                  text: `${obj.get('name')}\n${obj.get('description') || 'You see nothing special.'}`,
                },
              ],
            };
          }
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : String(err),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // CONSOLIDATED PLOT TOOL
    // ═══════════════════════════════════════════════════════════════════

    server.tool(
      'plot',
      `Comprehensive plot and job management tool.

ACTIONS:
  Plot Management:
    create        - Create a new plot (name, metadata?)
    get           - Get plot details (plotId)
    list          - List plots (status?: active|completed|abandoned|failed)
    search        - Search plot events (query, limit?)
    close         - Close a plot (plotId, status: completed|abandoned|failed, reason?)
    set_metadata  - Set plot metadata (plotId, key, value)
    add_event     - Add event to plot (plotId, message, from?: handler|system, metadata?)
    get_events    - Get plot event log (plotId, limit?)

  Phase Management:
    set_phases    - Define phases for a plot (plotId, phases[])
    get_phases    - Get phase definitions (plotId)

  Job Management:
    create_job    - Create job in plot (plotId, jobId, metadata?, expiresAt?)
    get_job       - Get job details (plotId, jobId)
    complete_job  - Complete a job (plotId, jobId, reason?)
    fail_job      - Fail a job (plotId, jobId, reason?)

  Job Phase Tracking:
    get_job_phase   - Get current phase for job (plotId, jobId)
    advance_phase   - Advance job to next phase (plotId, jobId)
    set_phase       - Set job to specific phase (plotId, jobId, phaseId)

  Hooks:
    register_hook - Register job hook (plotId, jobId, targetId, eventName, filter?)

  Queue:
    next          - Get next plot needing attention (bumps timer 24h)
    active        - List all active plots with metadata`,
      {
        action: z.string().describe('Action to perform (see help above)'),
        plotId: z.number().optional().describe('Plot object ID'),
        jobId: z.string().optional().describe('Job identifier within plot'),
        name: z.string().optional().describe('Name for new plot'),
        status: z.string().optional().describe('Status filter or new status'),
        reason: z
          .string()
          .optional()
          .describe('Reason for close/complete/fail'),
        message: z.string().optional().describe('Event message'),
        from: z.string().optional().describe('Event source: handler or system'),
        metadata: z.any().optional().describe('Metadata object'),
        key: z.string().optional().describe('Metadata key'),
        value: z.any().optional().describe('Metadata value'),
        query: z.string().optional().describe('Search query'),
        limit: z.number().optional().describe('Result limit'),
        phases: z.array(z.any()).optional().describe('Phase definitions array'),
        phaseId: z.string().optional().describe('Phase identifier'),
        targetId: z.number().optional().describe('Target object ID for hooks'),
        eventName: z.string().optional().describe('Event name for hooks'),
        filter: z.record(z.any()).optional().describe('Hook filter conditions'),
        expiresAt: z
          .string()
          .optional()
          .describe('ISO timestamp for job expiration'),
      },
      async (params) => {
        const {
          action,
          plotId,
          jobId,
          name,
          status,
          reason,
          message,
          from,
          metadata,
          key,
          value,
          query,
          limit,
          phases,
          phaseId,
          targetId,
          eventName,
          filter,
          expiresAt,
        } = params;

        const plotDB = await this.getPlotDB();
        const err = (msg: string) => ({
          content: [{ type: 'text' as const, text: msg }],
          isError: true,
        });
        const ok = (data: any) => ({
          content: [
            {
              type: 'text' as const,
              text:
                typeof data === 'string'
                  ? data
                  : JSON.stringify(this.serializeValue(data), null, 2),
            },
          ],
        });

        const loadPlot = async (id?: number) => {
          if (id === undefined) return { error: 'plotId required' };
          const plot = await this.manager.load(id as ObjId);
          if (!plot) return { error: `Plot #${id} not found` };
          return { plot };
        };

        try {
          switch (action) {
            // ─────────────────────────────────────────────────────────────
            // PLOT MANAGEMENT
            // ─────────────────────────────────────────────────────────────

            case 'create': {
              if (!name) return err('name required');
              const plotProto = await this.getAlias('plot');
              const recycler = await this.getAlias('recycler');
              if (!plotProto || !recycler)
                return err('Plot system not initialized');

              const newPlot = await recycler.call('create', {
                parent: plotProto,
                properties: {
                  name,
                  description: 'AI-created plot',
                  events: [],
                  metadata: {
                    ...(metadata || {}),
                    created: new Date().toISOString(),
                    needsAttentionAt: new Date().toISOString(),
                  },
                },
              });

              if (plotDB) await plotDB.call('register', newPlot);
              return ok({ created: true, plotId: newPlot.id, name });
            }

            case 'get': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              const p = r.plot!;
              return ok({
                id: p.id,
                name: (p as any).name,
                description: (p as any).description,
                phases: (p as any).phases || [],
                jobs: (p as any).jobs || {},
                metadata: (p as any).metadata || {},
                eventCount: ((p as any).events || []).length,
              });
            }

            case 'list': {
              if (!plotDB) return err('PlotDB not found');
              const plots = status
                ? await plotDB.call('byStatus', status)
                : await plotDB.call('all');
              const results = (plots || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                status: p.metadata?.status || 'active',
                eventCount: (p.events || []).length,
              }));
              return ok({ count: results.length, plots: results });
            }

            case 'search': {
              if (!query) return err('query required');
              if (!plotDB) return err('PlotDB not found');
              let plots = await plotDB.call('search', query);
              if (limit) plots = plots.slice(0, limit);
              const results = (plots || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                status: p.metadata?.status || 'active',
              }));
              return ok({ query, count: results.length, plots: results });
            }

            case 'close': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (
                !status ||
                !['completed', 'abandoned', 'failed'].includes(status)
              ) {
                return err('status required: completed, abandoned, or failed');
              }
              const p = r.plot!;
              await p.call('setMetadata', 'status', status);
              await p.call('setMetadata', 'closedAt', new Date().toISOString());
              if (reason) await p.call('setMetadata', 'closeReason', reason);
              await p.call('addEvent', {
                from: 'system',
                message: `Plot ${status}: ${reason || 'No reason given'}`,
              });
              return ok({ closed: true, plotId, status });
            }

            case 'set_metadata': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!key) return err('key required');
              await r.plot?.call('setMetadata', key, value);
              return ok({ set: true, plotId, key, value });
            }

            case 'add_event': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!message) return err('message required');
              await r.plot?.call('addEvent', {
                from: from || 'handler',
                message,
                ...(metadata ? { metadata } : {}),
              });
              return ok({ added: true, plotId });
            }

            case 'get_events': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              let events = (await r.plot?.call('getEventLog')) as any[];
              if (limit) events = events.slice(-limit);
              return ok({ plotId, count: events.length, events });
            }

            // ─────────────────────────────────────────────────────────────
            // PHASE MANAGEMENT
            // ─────────────────────────────────────────────────────────────

            case 'set_phases': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!phases || !Array.isArray(phases))
                return err('phases array required');
              const result = (await r.plot?.call('setPhases', phases)) as any[];
              return ok({
                set: true,
                plotId,
                phaseCount: result.length,
                phases: result,
              });
            }

            case 'get_phases': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              const result = await r.plot?.call('getPhases');
              return ok({ plotId, phases: result });
            }

            // ─────────────────────────────────────────────────────────────
            // JOB MANAGEMENT
            // ─────────────────────────────────────────────────────────────

            case 'create_job': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const options: any = {};
              if (metadata) options.metadata = metadata;
              if (expiresAt) options.expiresAt = expiresAt;
              await r.plot?.call('createJob', jobId, options);
              return ok({ created: true, plotId, jobId });
            }

            case 'get_job': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const job = await r.plot?.call('getJob', jobId);
              if (!job) return err(`Job '${jobId}' not found`);
              return ok({ plotId, jobId, ...job });
            }

            case 'complete_job': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const result = (await r.plot?.call(
                'completeJob',
                jobId,
                reason || 'Completed',
              )) as any;
              if (result.success === false)
                return err(result.error || 'Failed to complete job');
              return ok({ completed: true, plotId, jobId });
            }

            case 'fail_job': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const result = (await r.plot?.call(
                'failJob',
                jobId,
                reason || 'Failed',
              )) as any;
              if (result.success === false)
                return err(result.error || 'Failed to fail job');
              return ok({ failed: true, plotId, jobId });
            }

            // ─────────────────────────────────────────────────────────────
            // JOB PHASE TRACKING
            // ─────────────────────────────────────────────────────────────

            case 'get_job_phase': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const result = (await r.plot?.call(
                'getJobPhase',
                jobId,
              )) as Record<string, unknown>;
              return ok({ plotId, jobId, ...result });
            }

            case 'advance_phase': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const result = (await r.plot?.call(
                'advanceJobPhase',
                jobId,
                'completed',
              )) as Record<string, unknown>;
              return ok({ plotId, jobId, ...result });
            }

            case 'set_phase': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              if (!phaseId) return err('phaseId required');
              await r.plot?.call('setJobPhase', jobId, phaseId);
              return ok({ set: true, plotId, jobId, phaseId });
            }

            // ─────────────────────────────────────────────────────────────
            // HOOKS
            // ─────────────────────────────────────────────────────────────

            case 'register_hook': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              if (targetId === undefined) return err('targetId required');
              if (!eventName) return err('eventName required');
              await r.plot?.call(
                'registerJobHook',
                jobId,
                targetId,
                eventName,
                filter || {},
              );
              return ok({
                registered: true,
                plotId,
                jobId,
                targetId,
                eventName,
              });
            }

            // ─────────────────────────────────────────────────────────────
            // QUEUE
            // ─────────────────────────────────────────────────────────────

            case 'next': {
              if (!plotDB) return err('PlotDB not found');
              const plot = await plotDB.call('getNext');
              if (!plot)
                return ok({ plot: null, message: 'No jobs need attention' });

              // Get current phase info for any active jobs
              const jobs = (plot as any).jobs || {};
              const jobsWithPhases: any = {};
              for (const [jid, job] of Object.entries(jobs) as [
                string,
                any,
              ][]) {
                if (job.status === 'active' && job.currentPhase) {
                  const phase = await plot.call('getPhase', job.currentPhase);
                  jobsWithPhases[jid] = {
                    ...job,
                    currentPhaseInfo: phase,
                  };
                } else {
                  jobsWithPhases[jid] = job;
                }
              }

              return ok({
                id: plot.id,
                name: (plot as any).name,
                phases: (plot as any).phases || [],
                jobs: jobsWithPhases,
                events: (plot as any).events || [],
                metadata: (plot as any).metadata || {},
              });
            }

            case 'active': {
              if (!plotDB) return err('PlotDB not found');
              const plots = await plotDB.call('active');
              const results = (plots || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                metadata: p.metadata || {},
                eventCount: (p.events || []).length,
                jobCount: Object.keys(p.jobs || {}).length,
              }));
              return ok({ count: results.length, plots: results });
            }

            default:
              return err(
                `Unknown action: ${action}. See tool description for available actions.`,
              );
          }
        } catch (e) {
          return err(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
      },
    );

    // ═══════════════════════════════════════════════════════════════════════
    // AI TOOL (Consolidated)
    // ═══════════════════════════════════════════════════════════════════════

    server.tool(
      'ai',
      `Consolidated AI-controlled human management tool.

ACTIONS:
  spawn   - Create a new AI-controlled human (role, name?, description?, locationId?, sex?, age?, personality?, history?, clothed?)
  despawn - Remove an AI human (humanId, recycle?)
  list    - List all AI humans (role?)
  info    - Get detailed AI human info (humanId)
  do      - Execute a command as AI human (humanId, command)
  look    - Get what AI human sees (humanId)
  tailor  - Dress an NPC using AI tailor agent (humanId, context?)

PROFILE ACTIONS (for AI agent context):
  profile        - Get full NPC profile (humanId) - returns personality, history, notes, memories
  setPersonality - Set personality traits (humanId, personality)
  setHistory     - Set backstory/history (humanId, history)

MEMORY ACTIONS (for persistent critical memories):
  remember - Store a critical memory (humanId, text, importance?, tags?)
  recall   - Get memories for an NPC (humanId, importance?, tag?, limit?)
  forget   - Remove a memory by index (humanId, index)
  memories - Get formatted memory summary for an NPC (humanId, criticalOnly?)

EXPECTATION ACTIONS (response timeout management):
  expect       - Set up timeout waiting for response from target (humanId, targetId, timeout?, prompt?, recurring?)
                 USE THIS when in time-sensitive conversations or situations to handle:
                 - Player walking away mid-conversation
                 - Player going idle or AFK
                 - Player logging off without saying goodbye
                 When timeout fires, you'll get a prompt to re-engage or move on.
                 Auto-cancels when target speaks to you (no manual cancel needed).
                 Default: 5 min timeout, recurring (keeps prompting until cancelled).
  cancelExpect - Manually cancel a pending expectation (humanId, targetId)
                 Rarely needed - auto-cancels when target speaks to you.

PATHFINDING ACTIONS:
  path     - Find shortest path between two rooms using A* (fromRoomId, toRoomId, ignoreLocks?, maxSteps?)
             Returns { success, path: [{direction, roomId, distance}], totalDistance }
             Skips locked/guarded exits by default. Use ignoreLocks=true for theoretical paths.
  walkPath - Walk an AI human along a path (humanId, path)
             Takes path array from 'path' action. Waits for each step to complete.

WORLD LOG ACTIONS (Deity Chat):
  worldLog    - Add entry to shared world log (author, message)
                Author: 'pluribus' or 'sisterGray'. OOC banter about builds/moves.
  getWorldLog - Get recent world log entries (limit?)
                Returns array of timestamped entries.`,
      {
        action: z.string().describe('Action to perform (see help above)'),
        role: z
          .string()
          .optional()
          .describe('Role for this AI (e.g., "guard", "shopkeeper")'),
        name: z.string().optional().describe('Name of the human'),
        description: z.string().optional().describe('Description of the human'),
        locationId: z
          .number()
          .optional()
          .describe('Room ID to place the human'),
        sex: z
          .enum(['male', 'female', 'non-binary'])
          .optional()
          .describe('Sex (random if not specified)'),
        age: z
          .number()
          .optional()
          .describe('Age in years (random 18-65 if not specified)'),
        humanId: z.number().optional().describe('Human object ID'),
        command: z.string().optional().describe('Command to execute'),
        recycle: z
          .boolean()
          .optional()
          .describe('Whether to recycle on despawn (default: true)'),
        // Profile action parameters
        personality: z
          .union([
            z.string(),
            z.object({
              traits: z.array(z.string()).optional(),
              quirks: z.array(z.string()).optional(),
              values: z.array(z.string()).optional(),
              fears: z.array(z.string()).optional(),
              motivations: z.array(z.string()).optional(),
            }),
          ])
          .optional()
          .describe(
            'Personality: string description or { traits, quirks, values, fears, motivations }',
          ),
        history: z
          .union([
            z.string(),
            z.object({
              backstory: z.string().optional(),
              events: z.array(z.string()).optional(),
              secrets: z.array(z.string()).optional(),
              relationships: z.record(z.string()).optional(),
            }),
          ])
          .optional()
          .describe(
            'History: string description or { backstory, events, secrets, relationships }',
          ),
        // Memory action parameters
        text: z.string().optional().describe('Memory text to store'),
        importance: z
          .enum(['critical', 'important', 'normal'])
          .optional()
          .describe('Memory importance level'),
        tags: z
          .array(z.string())
          .optional()
          .describe('Tags for categorizing the memory'),
        tag: z.string().optional().describe('Filter memories by tag'),
        index: z
          .number()
          .optional()
          .describe('Memory index to remove (0 = most recent)'),
        limit: z.number().optional().describe('Max memories to return'),
        criticalOnly: z
          .boolean()
          .optional()
          .describe('Only return critical memories'),
        // Tailor action parameters
        context: z
          .string()
          .optional()
          .describe(
            'Additional context for tailor (e.g., "shabby, recently fired")',
          ),
        clothed: z
          .boolean()
          .optional()
          .describe('Auto-dress on spawn using tailor'),
        // Expectation action parameters
        targetId: z
          .number()
          .optional()
          .describe('Object ID to expect response from'),
        timeout: z
          .number()
          .optional()
          .describe(
            'Timeout in ms (for expect action, default 300000 = 5 min)',
          ),
        prompt: z
          .string()
          .optional()
          .describe('Custom timeout prompt (for expect action)'),
        recurring: z
          .boolean()
          .optional()
          .describe(
            'Whether to auto-reschedule after timeout (for expect action, default true)',
          ),
        // Pathfinding action parameters
        fromRoomId: z
          .number()
          .optional()
          .describe('Starting room ID (for path action)'),
        toRoomId: z
          .number()
          .optional()
          .describe('Destination room ID (for path action)'),
        ignoreLocks: z
          .boolean()
          .optional()
          .describe(
            'Include locked/guarded exits in pathfinding (default false)',
          ),
        maxSteps: z
          .number()
          .optional()
          .describe('Max A* iterations (default 1000)'),
        path: z
          .array(
            z.object({
              direction: z.string(),
              roomId: z.number(),
              distance: z.number(),
            }),
          )
          .optional()
          .describe('Path array from path action (for walkPath)'),
        // World log action parameters
        author: z
          .string()
          .optional()
          .describe('Author for worldLog (pluribus or sisterGray)'),
        message: z.string().optional().describe('Message for worldLog'),
      },
      async ({
        action,
        role,
        name,
        description,
        locationId,
        sex,
        age,
        humanId,
        command,
        recycle,
        personality,
        history,
        text,
        importance,
        tags,
        tag,
        index,
        limit,
        criticalOnly,
        context,
        clothed,
        targetId,
        timeout,
        prompt,
        recurring,
        fromRoomId,
        toRoomId,
        ignoreLocks,
        maxSteps,
        path,
        author,
        message,
      }) => {
        const aiRegistry = await this.getAlias('ai');
        if (!aiRegistry) {
          return {
            content: [
              {
                type: 'text',
                text: 'AI registry not found - system not initialized',
              },
            ],
            isError: true,
          };
        }

        const ok = (data: unknown) => ({
          content: [
            {
              type: 'text' as const,
              text:
                typeof data === 'string'
                  ? data
                  : JSON.stringify(this.serializeValue(data), null, 2),
            },
          ],
        });
        const err = (msg: string) => ({
          content: [{ type: 'text' as const, text: msg }],
          isError: true,
        });

        try {
          switch (action) {
            case 'spawn': {
              if (!role) return err('role required');
              const options: any = {};
              if (name) options.name = name;
              if (description) options.description = description;
              if (locationId !== undefined) options.location = locationId;
              if (sex) options.sex = sex;
              if (age !== undefined) options.age = age;
              if (personality) options.personality = personality;
              if (history) options.history = history;

              const human = await aiRegistry.call('spawn', role, options);

              // Auto-dress if clothed parameter is true
              if (clothed) {
                const { tailorNPC } = await import('./tailor-agent.js');
                const tailorContext = context || `Role: ${role}`;
                await tailorNPC(
                  human.id,
                  'localhost',
                  this.port,
                  tailorContext,
                );
              }

              return ok({
                spawned: true,
                id: human.id,
                name: human.name,
                role,
                clothed: !!clothed,
              });
            }

            case 'despawn': {
              if (humanId === undefined) return err('humanId required');
              await aiRegistry.call('despawn', humanId, recycle !== false);
              return ok({ despawned: true, humanId });
            }

            case 'list': {
              // getByRole and getAll return arrays of objRefs or RuntimeObjects
              let humans: any[];
              if (role) {
                humans = await aiRegistry.call('getByRole', role);
              } else {
                humans = await aiRegistry.call('getAll');
              }

              const results = [];
              for (const human of humans || []) {
                // Extract ID from various formats: objRef, RuntimeObject, or raw number
                let id: number;
                if (typeof human === 'number') {
                  id = human;
                } else if (human?.type === 'objref') {
                  id = human.value;
                } else if (human?.id !== undefined) {
                  id = human.id;
                } else {
                  continue; // Skip invalid entries
                }

                const info = await aiRegistry.call('getInfo', id);
                // Load fresh to get current values
                const loaded = await this.manager.load(id as ObjId);

                // Extract role from info - may be string or { type: 'string', value: '...' }
                let roleStr = 'unknown';
                if (info?.role) {
                  roleStr =
                    typeof info.role === 'string'
                      ? info.role
                      : info.role?.value || 'unknown';
                }

                results.push({
                  id,
                  name: loaded
                    ? String((loaded as any).name || 'Unknown')
                    : 'Unknown',
                  role: roleStr,
                  location: loaded ? ((loaded as any).location ?? null) : null,
                });
              }
              return ok({ count: results.length, humans: results });
            }

            case 'info': {
              if (humanId === undefined) return err('humanId required');
              const isAi = await aiRegistry.call('isAiControlled', humanId);
              if (!isAi) {
                return ok({ humanId, isAiControlled: false });
              }

              const info = await aiRegistry.call('getInfo', humanId);
              const human = await this.manager.load(humanId as ObjId);
              return ok({
                id: humanId,
                name: human ? (human as any).name : 'Unknown',
                isAiControlled: true,
                ...info,
              });
            }

            case 'do': {
              if (humanId === undefined) return err('humanId required');
              if (!command) return err('command required');

              const isAi = await aiRegistry.call('isAiControlled', humanId);
              if (!isAi) {
                return err(`Human #${humanId} is not AI-controlled`);
              }

              const human = await this.manager.load(humanId as ObjId);
              if (!human) {
                return err(`Human #${humanId} not found`);
              }

              const trimmed = command.trim();

              // Check if this is a say/emote verb that should be queued for metered execution
              const verb = trimmed.split(/\s+/)[0].toLowerCase();
              const QUEUED_VERBS = ['say', 'emote', '"', "'", ':'];

              if (QUEUED_VERBS.includes(verb)) {
                // Queue for metered execution
                await human.call('queueAction', trimmed);
                const queueLength = (await human.call(
                  'getActionQueueLength',
                )) as number;
                return ok({
                  queued: true,
                  queueLength: queueLength + 1,
                  command: trimmed,
                });
              }

              // Execute non-queued verbs immediately
              const match = (await human.call('matchVerb', trimmed)) as {
                error?: string;
                handler?: any;
                verbInfo?: { method: string };
                args?: any[];
              } | null;

              if (match?.error) {
                return ok({ output: match.error });
              }

              if (match?.handler && match.verbInfo) {
                const result = await match.handler.callVerb(
                  match.verbInfo.method,
                  null,
                  human,
                  trimmed,
                  match.args,
                );
                return ok({
                  output: result !== undefined ? String(result) : '(no output)',
                });
              }

              const firstWord = trimmed.split(/\s+/)[0];
              return ok({ output: `I don't understand "${firstWord}".` });
            }

            case 'look': {
              if (humanId === undefined) return err('humanId required');

              const isAi = await aiRegistry.call('isAiControlled', humanId);
              if (!isAi) {
                return err(`Human #${humanId} is not AI-controlled`);
              }

              const human = await this.manager.load(humanId as ObjId);
              if (!human) {
                return err(`Human #${humanId} not found`);
              }

              const locationIdVal = (human as any).location;
              if (!locationIdVal) {
                return err('Human has no location');
              }

              const room = await this.manager.load(locationIdVal as ObjId);
              if (!room) {
                return err(`Location #${locationIdVal} not found`);
              }

              const roomName = (room as any).name || 'Unknown';
              const roomDesc = (room as any).description || '';

              const exits = (room as any).exits || [];
              const exitNames: string[] = [];
              for (const exitRef of exits) {
                const exitId =
                  typeof exitRef === 'string'
                    ? parseInt(exitRef.replace('#', ''), 10)
                    : exitRef;
                const exit = await this.manager.load(exitId as ObjId);
                if (exit) {
                  exitNames.push((exit as any).name || 'exit');
                }
              }

              const contents = (room as any).contents || [];
              const items: string[] = [];
              const people: string[] = [];

              for (const objId of contents) {
                if (objId === humanId) continue;
                const obj = await this.manager.load(objId as ObjId);
                if (!obj) continue;

                const objName = (obj as any).name || `#${objId}`;
                if (
                  (obj as any).conscious !== undefined ||
                  (obj as any).playername
                ) {
                  people.push(objName);
                } else {
                  items.push(objName);
                }
              }

              return ok({
                location: roomName,
                description: roomDesc,
                exits: exitNames,
                people,
                items,
              });
            }

            // ═══════════════════════════════════════════════════════════════
            // PROFILE ACTIONS
            // ═══════════════════════════════════════════════════════════════

            case 'profile': {
              if (humanId === undefined) return err('humanId required');
              const result = await aiRegistry.call('getProfile', humanId);
              return ok(result);
            }

            case 'setPersonality': {
              if (humanId === undefined) return err('humanId required');
              if (!personality) return err('personality required');
              const result = await aiRegistry.call(
                'setPersonality',
                humanId,
                personality,
              );
              return ok(result);
            }

            case 'setHistory': {
              if (humanId === undefined) return err('humanId required');
              if (!history) return err('history required');
              const result = await aiRegistry.call(
                'setHistory',
                humanId,
                history,
              );
              return ok(result);
            }

            // ═══════════════════════════════════════════════════════════════
            // MEMORY ACTIONS
            // ═══════════════════════════════════════════════════════════════

            case 'remember': {
              if (humanId === undefined) return err('humanId required');
              if (!text) return err('text required');

              const result = await aiRegistry.call(
                'remember',
                humanId,
                text,
                importance || 'normal',
                tags || [],
              );
              return ok(result);
            }

            case 'recall': {
              if (humanId === undefined) return err('humanId required');

              const options: any = {};
              if (importance) options.importance = importance;
              if (tag) options.tag = tag;
              if (limit) options.limit = limit;

              const result = await aiRegistry.call('recall', humanId, options);
              return ok(result);
            }

            case 'forget': {
              if (humanId === undefined) return err('humanId required');
              if (index === undefined) return err('index required');

              const result = await aiRegistry.call('forget', humanId, index);
              return ok(result);
            }

            case 'memories': {
              if (humanId === undefined) return err('humanId required');

              const options: any = {};
              if (criticalOnly) options.criticalOnly = criticalOnly;

              const summary = await aiRegistry.call(
                'getMemorySummary',
                humanId,
                options,
              );
              return ok({ humanId, summary: summary || '(no memories)' });
            }

            // ═══════════════════════════════════════════════════════════════
            // TAILOR ACTION
            // ═══════════════════════════════════════════════════════════════

            case 'tailor': {
              if (humanId === undefined) return err('humanId required');

              const isAi = await aiRegistry.call('isAiControlled', humanId);
              if (!isAi) {
                return err(`Human #${humanId} is not AI-controlled`);
              }

              const human = await this.manager.load(humanId as ObjId);
              if (!human) {
                return err(`Human #${humanId} not found`);
              }

              const { tailorNPC } = await import('./tailor-agent.js');
              const tailorContext =
                context || `Role: ${(human as any).role || 'unknown'}`;
              const result = await tailorNPC(
                humanId,
                'localhost',
                this.port,
                tailorContext,
              );

              return ok(result);
            }

            // ═══════════════════════════════════════════════════════════════
            // RESPONSE EXPECTATION ACTIONS
            // ═══════════════════════════════════════════════════════════════

            case 'expect': {
              if (humanId === undefined) return err('humanId required');
              if (targetId === undefined) return err('targetId required');

              const options: any = { humanId };
              if (timeout !== undefined) options.timeout = timeout;
              if (prompt) options.prompt = prompt;
              if (recurring !== undefined) options.recurring = recurring;

              const result = await aiRegistry.call(
                'expectResponseFrom',
                targetId,
                options,
              );
              return ok(result);
            }

            case 'cancelExpect': {
              if (humanId === undefined) return err('humanId required');
              if (targetId === undefined) return err('targetId required');

              const result = await aiRegistry.call(
                'cancelExpectation',
                targetId,
                humanId,
              );
              return ok(result);
            }

            // ═══════════════════════════════════════════════════════════════
            // PATHFINDING ACTIONS
            // ═══════════════════════════════════════════════════════════════

            case 'path': {
              if (fromRoomId === undefined) return err('fromRoomId required');
              if (toRoomId === undefined) return err('toRoomId required');

              const options: Record<string, unknown> = {};
              if (ignoreLocks !== undefined) options.ignoreLocks = ignoreLocks;
              if (maxSteps !== undefined) options.maxSteps = maxSteps;

              const result = await aiRegistry.call(
                'path',
                fromRoomId,
                toRoomId,
                options,
              );
              return ok(result);
            }

            case 'walkPath': {
              if (humanId === undefined) return err('humanId required');
              if (!path) return err('path array required');

              const result = await aiRegistry.call('walkPath', humanId, path);
              return ok(result);
            }

            // ═══════════════════════════════════════════════════════════════
            // WORLD LOG ACTIONS (Deity Chat)
            // ═══════════════════════════════════════════════════════════════

            case 'worldLog': {
              if (!author)
                return err('author required (pluribus or sisterGray)');
              if (!message) return err('message required');

              const result = await aiRegistry.call('logWorld', author, message);
              return ok(result);
            }

            case 'getWorldLog': {
              const result = await aiRegistry.call('getWorldLog', limit || 20);
              return ok({ log: result });
            }

            default:
              return err(
                `Unknown action: ${action}. Valid: spawn, despawn, list, info, do, look, tailor, profile, setPersonality, setHistory, remember, recall, forget, memories, expect, cancelExpect, path, walkPath, worldLog, getWorldLog`,
              );
          }
        } catch (error) {
          return err(
            `Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    // Old individual plot/job tools have been consolidated into the 'plot' tool above
    // Use: plot action="create" name="..." for creating plots
    // Use: plot action="create_job" plotId=N jobId="..." for creating jobs
    // etc. - see the consolidated 'plot' tool help for all actions

    // ═══════════════════════════════════════════════════════════════════
    // NOTES TOOL (Consolidated)
    // ═══════════════════════════════════════════════════════════════════

    server.tool(
      'notes',
      `Consolidated notes management tool.

ACTIONS:
  get           - Get all notes on an object (objectId)
  add           - Add a note to an object (objectId, text, author?, tags?)
  append        - Append text to existing note by tag, or create if none exists (objectId, tag, text, author?)
  delete        - Delete a note by index (objectId, index)
  search        - Search notes across objects (query?, tag?, author?, limit?)
  list_objects  - List all objects that have notes`,
      {
        action: z.string().describe('Action to perform (see help above)'),
        objectId: z
          .string()
          .regex(OBJREF_PATTERN)
          .optional()
          .describe(OBJREF_DESCRIPTION),
        text: z.string().optional().describe('Note text content'),
        author: z.string().optional().describe('Author name (default: "mcp")'),
        tags: z
          .array(z.string())
          .optional()
          .describe('Tags for categorization'),
        index: z.number().optional().describe('Note index to delete'),
        query: z.string().optional().describe('Search query'),
        tag: z.string().optional().describe('Filter by tag'),
        limit: z.number().optional().describe('Max results (default 50)'),
      },
      async ({
        action,
        objectId: rawObjectId,
        text,
        author,
        tags,
        index,
        query,
        tag,
        limit,
      }) => {
        const notesSystem = await this.getAlias('notes');
        if (!notesSystem) {
          return {
            content: [{ type: 'text', text: 'Notes system not available' }],
            isError: true,
          };
        }

        // Deserialize objectId if provided - get RuntimeObject
        let targetObj: RuntimeObject | undefined;
        if (rawObjectId !== undefined) {
          try {
            targetObj = (await this.deserializeValue(
              rawObjectId,
            )) as RuntimeObject;
          } catch (err) {
            return {
              content: [
                {
                  type: 'text',
                  text: err instanceof Error ? err.message : String(err),
                },
              ],
              isError: true,
            };
          }
        }

        const ok = (data: unknown) => ({
          content: [
            {
              type: 'text' as const,
              text:
                typeof data === 'string'
                  ? data
                  : JSON.stringify(this.serializeValue(data), null, 2),
            },
          ],
        });
        const err = (msg: string) => ({
          content: [{ type: 'text' as const, text: msg }],
          isError: true,
        });

        try {
          switch (action) {
            case 'get': {
              if (!targetObj) return err('objectId required');
              const result = await notesSystem.call('get', targetObj);
              return ok({
                objectId: `#${targetObj.id}`,
                count: result.length,
                notes: result,
              });
            }

            case 'add': {
              if (!targetObj) return err('objectId required');
              if (!text) return err('text required');
              const result = await notesSystem.call(
                'add',
                targetObj,
                text,
                author || 'mcp',
                tags || [],
              );
              if (result.success) {
                return ok({
                  added: true,
                  objectId: `#${targetObj.id}`,
                  index: result.index,
                });
              } else {
                return err(`Error: ${result.error}`);
              }
            }

            case 'append': {
              if (!targetObj) return err('objectId required');
              if (!tag) return err('tag required (to find note to append to)');
              if (!text) return err('text required');

              // Get existing notes
              const existingNotes = (await notesSystem.call(
                'get',
                targetObj,
              )) as Array<{
                text: string;
                author?: string;
                tags?: string[];
                timestamp?: string;
              }>;

              // Find note with matching tag
              const noteIndex = existingNotes.findIndex((n) =>
                n.tags?.includes(tag),
              );

              if (noteIndex >= 0) {
                // Append to existing note
                const oldNote = existingNotes[noteIndex];
                const newText = `${oldNote.text}\n${text}`;
                const noteTags = oldNote.tags || [tag];

                // Delete old, add updated
                await notesSystem.call('delete', targetObj, noteIndex);
                const result = await notesSystem.call(
                  'add',
                  targetObj,
                  newText,
                  author || oldNote.author || 'mcp',
                  noteTags,
                );

                if (result.success) {
                  return ok({
                    appended: true,
                    objectId: `#${targetObj.id}`,
                    tag,
                    wasNew: false,
                    index: result.index,
                  });
                } else {
                  return err(`Error appending: ${result.error}`);
                }
              } else {
                // Create new note with this tag
                const result = await notesSystem.call(
                  'add',
                  targetObj,
                  text,
                  author || 'mcp',
                  [tag],
                );

                if (result.success) {
                  return ok({
                    appended: true,
                    objectId: `#${targetObj.id}`,
                    tag,
                    wasNew: true,
                    index: result.index,
                  });
                } else {
                  return err(`Error creating: ${result.error}`);
                }
              }
            }

            case 'delete': {
              if (!targetObj) return err('objectId required');
              if (index === undefined) return err('index required');
              const result = await notesSystem.call('delete', targetObj, index);
              if (result.success) {
                return ok({
                  deleted: true,
                  objectId: `#${targetObj.id}`,
                  index,
                });
              } else {
                return err(`Error: ${result.error}`);
              }
            }

            case 'search': {
              const options: Record<string, unknown> = {};
              if (tag) options.tag = tag;
              if (author) options.author = author;
              if (limit) options.limit = limit;
              const results = await notesSystem.call(
                'search',
                query || '',
                options,
              );
              return ok({ count: results.length, results });
            }

            case 'list_objects': {
              const objects = await notesSystem.call('listObjects');
              const enriched = [];
              for (const obj of objects) {
                // obj.objectId could be a number or RuntimeObject depending on notes system
                const objId =
                  typeof obj.objectId === 'number'
                    ? obj.objectId
                    : obj.objectId?.id;
                const loaded = await this.manager.load(objId as ObjId);
                enriched.push({
                  objectId: `#${objId}`,
                  name: loaded?.get('name') || 'Unknown',
                  noteCount: obj.count,
                });
              }
              return ok({ count: enriched.length, objects: enriched });
            }

            default:
              return err(
                `Unknown action: ${action}. Valid: get, add, append, delete, search, list_objects`,
              );
          }
        } catch (error) {
          return err(
            `Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // COMBAT TOOL (Consolidated)
    // ═══════════════════════════════════════════════════════════════════

    server.tool(
      'combat',
      `Consolidated combat resolution tool. Used by AI during combat resolution.

ACTIONS:
  status     - Get current combat state (combatId)
  context    - Get full combat context for resolution (combatId)
  check      - Perform skill check (combatId, combatantId, skillName, opposingLevel?)
  damage     - Apply damage to combatant (combatId, targetId, bodyPart, damageType, severity, cause?)
  emote      - Narrate combat action to room (combatId, text)
  effect     - Apply status effect (combatId, targetId, effect, intensity, duration?)
  end        - End combat (combatId, reason, winnerId?)
  next_round - Advance to next round (combatId)
  list       - List all active combats

DAMAGE TYPES: cut, bruise, puncture, burn, laceration, abrasion
BODY PARTS: head, torso, leftShoulder, rightShoulder, leftThigh, rightThigh (or specific part names)
END REASONS: death, flee, surrender, knockout, intervention
EFFECTS: stunned, knockedDown, disarmed, winded`,
      {
        action: z.string().describe('Action to perform (see help above)'),
        combatId: z.string().optional().describe('Combat ID'),
        combatantId: z
          .number()
          .optional()
          .describe('Combatant object ID (for check)'),
        targetId: z
          .number()
          .optional()
          .describe('Target object ID (for damage, effect)'),
        skillName: z
          .string()
          .optional()
          .describe('Skill to check (e.g., "brawling", "knife-fighting")'),
        opposingLevel: z
          .number()
          .optional()
          .describe('Opposing skill level (default: 50)'),
        bodyPart: z.string().optional().describe('Body part to damage'),
        damageType: z
          .string()
          .optional()
          .describe('Type of damage (cut, bruise, puncture, etc.)'),
        severity: z.number().optional().describe('Damage severity 0-100'),
        cause: z
          .string()
          .optional()
          .describe('What caused the damage (blade, fist, etc.)'),
        text: z.string().optional().describe('Narration text'),
        effect: z.string().optional().describe('Status effect name'),
        intensity: z.number().optional().describe('Effect intensity 0-100'),
        duration: z.number().optional().describe('Effect duration in ms'),
        reason: z
          .string()
          .optional()
          .describe(
            'End reason (death, flee, surrender, knockout, intervention)',
          ),
        winnerId: z.number().optional().describe('Winner object ID'),
      },
      async ({
        action,
        combatId,
        combatantId,
        targetId,
        skillName,
        opposingLevel,
        bodyPart,
        damageType,
        severity,
        cause,
        text,
        effect,
        intensity,
        duration,
        reason,
        winnerId,
      }) => {
        const combatSystem = await this.getAlias('combat');
        if (!combatSystem) {
          return {
            content: [{ type: 'text', text: 'Combat system not available' }],
            isError: true,
          };
        }

        const ok = (data: unknown) => ({
          content: [
            {
              type: 'text' as const,
              text:
                typeof data === 'string'
                  ? data
                  : JSON.stringify(this.serializeValue(data), null, 2),
            },
          ],
        });
        const err = (msg: string) => ({
          content: [{ type: 'text' as const, text: msg }],
          isError: true,
        });

        try {
          switch (action) {
            case 'status': {
              if (!combatId) return err('combatId required');
              const combat = await combatSystem.call('getCombat', combatId);
              if (!combat) return err(`Combat not found: ${combatId}`);
              return ok({
                id: combat.id,
                round: combat.round,
                status: combat.status,
                combatants: combat.combatants?.map((c: any) =>
                  c ? { id: c.id, name: c.name } : null,
                ),
                actions: Object.keys(combat.actions || {}).length,
              });
            }

            case 'context': {
              if (!combatId) return err('combatId required');
              const context = await combatSystem.call(
                'gatherContext',
                combatId,
              );
              if (context.error) return err(context.error);
              return ok(context);
            }

            case 'check': {
              if (!combatId) return err('combatId required');
              if (combatantId === undefined) return err('combatantId required');
              if (!skillName) return err('skillName required');

              const combatant = await this.manager.load(combatantId as ObjId);
              if (!combatant)
                return err(`Combatant not found: #${combatantId}`);

              const result = await combatSystem.call(
                'skillCheck',
                combatId,
                combatant,
                skillName,
                opposingLevel || 50,
              );
              if (result.error) return err(result.error);
              return ok(result);
            }

            case 'damage': {
              if (!combatId) return err('combatId required');
              if (targetId === undefined) return err('targetId required');
              if (!bodyPart) return err('bodyPart required');

              const target = await this.manager.load(targetId as ObjId);
              if (!target) return err(`Target not found: #${targetId}`);

              const result = await combatSystem.call(
                'applyDamage',
                combatId,
                target,
                bodyPart,
                damageType || 'bruise',
                severity || 30,
                cause,
              );
              if (result.error) return err(result.error);
              return ok(result);
            }

            case 'emote': {
              if (!combatId) return err('combatId required');
              if (!text) return err('text required');

              const result = await combatSystem.call('emote', combatId, text);
              if (result.error) return err(result.error);
              return ok(result);
            }

            case 'effect': {
              if (!combatId) return err('combatId required');
              if (targetId === undefined) return err('targetId required');
              if (!effect) return err('effect required');

              const target = await this.manager.load(targetId as ObjId);
              if (!target) return err(`Target not found: #${targetId}`);

              const result = await combatSystem.call(
                'applyEffect',
                combatId,
                target,
                effect,
                intensity || 50,
                duration || 30000,
              );
              if (result.error) return err(result.error);
              return ok(result);
            }

            case 'end': {
              if (!combatId) return err('combatId required');

              let winner = null;
              if (winnerId !== undefined) {
                winner = await this.manager.load(winnerId as ObjId);
                if (!winner) return err(`Winner not found: #${winnerId}`);
              }

              const result = await combatSystem.call(
                'endCombat',
                combatId,
                reason || 'ended',
                winner,
              );
              if (result.error) return err(result.error);
              return ok(result);
            }

            case 'next_round': {
              if (!combatId) return err('combatId required');

              const result = await combatSystem.call('nextRound', combatId);
              if (result.error) return err(result.error);
              return ok(result);
            }

            case 'list': {
              const activeCombats = combatSystem.get('activeCombats') || {};
              const combats = [];
              for (const id of Object.keys(activeCombats)) {
                const combat = activeCombats[id];
                if (combat.status !== 'ended') {
                  combats.push({
                    id: combat.id,
                    round: combat.round,
                    status: combat.status,
                    combatants: combat.combatants?.map((c: any) =>
                      c ? { id: c.id, name: c.name } : null,
                    ),
                  });
                }
              }
              return ok({ count: combats.length, combats });
            }

            default:
              return err(
                `Unknown action: ${action}. Valid: status, context, check, damage, emote, effect, end, next_round, list`,
              );
          }
        } catch (error) {
          return err(
            `Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // WORLD TOOL (Consolidated)
    // ═══════════════════════════════════════════════════════════════════

    server.tool(
      'world',
      `Consolidated world query tool with SQL-like DSL.

ACTIONS:
  query    - Search objects with DSL query (q, limit?, offset?)
  validate - Validate a query without executing (q)

QUERY SYNTAX:
  .property == value           # Equality
  .property != value           # Inequality
  .property > 5                # Numeric: >, <, >=, <=
  .property contains 'text'    # Substring (case-insensitive)
  .property like 'foo*'        # Glob pattern (* = any, ? = single char)
  .property matches 'regex'    # Regex match
  .property exists             # Property is defined
  not .property exists         # Negation
  X and Y                      # Logical AND
  X or Y                       # Logical OR
  (X or Y) and Z               # Grouping

EXAMPLES:
  .name contains 'sword'
  .parent == 10 and .location exists
  (.type == 'weapon' or .type == 'armor') and .owner == 42`,
      {
        action: z.string().describe('Action: query, validate'),
        q: z.string().optional().describe('Query string (DSL syntax)'),
        limit: z.number().optional().describe('Max results (default 50)'),
        offset: z.number().optional().describe('Skip first N results'),
      },
      async ({ action, q, limit, offset }) => {
        const ok = (data: unknown) => ({
          content: [
            {
              type: 'text' as const,
              text:
                typeof data === 'string'
                  ? data
                  : JSON.stringify(this.serializeValue(data), null, 2),
            },
          ],
        });
        const err = (msg: string) => ({
          content: [{ type: 'text' as const, text: msg }],
          isError: true,
        });

        try {
          switch (action) {
            case 'validate': {
              if (!q) return err('q (query) required');
              const result = validateQuery(q);
              return ok(result);
            }

            case 'query': {
              if (!q) return err('q (query) required');

              // Parse DSL to MongoDB query
              let mongoQuery: Record<string, any>;
              try {
                mongoQuery = parseQuery(q);
              } catch (parseErr) {
                return err(
                  `Parse error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
                );
              }

              // Exclude recycled objects by default
              mongoQuery = {
                $and: [mongoQuery, { 'properties._deleted': { $ne: true } }],
              };

              // Execute query against MongoDB
              const db = (this.manager as any).db;
              if (!db || !db.objects) {
                return err('Database not available');
              }

              const collection = db.objects;
              const maxLimit = Math.min(limit || 50, 200);
              const skip = offset || 0;

              const cursor = collection
                .find(mongoQuery)
                .skip(skip)
                .limit(maxLimit);
              const docs = await cursor.toArray();

              // Format results - plain objects, no RuntimeObject conversion
              const results = docs.map((doc: any) => ({
                id: doc._id,
                parent: doc.parent,
                name:
                  doc.properties?.name?.value ||
                  doc.properties?.name ||
                  'Unknown',
                description:
                  doc.properties?.description?.value ||
                  doc.properties?.description,
              }));

              return ok({
                query: q,
                mongoQuery,
                count: results.length,
                offset: skip,
                results,
              });
            }

            default:
              return err(`Unknown action: ${action}. Valid: query, validate`);
          }
        } catch (error) {
          return err(
            `Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }

  /**
   * Get an object by its alias
   */
  private async getAlias(alias: string): Promise<any> {
    const objectManager = await this.manager.load(0 as ObjId);
    if (!objectManager) return null;

    const aliases = objectManager.get('aliases') as
      | Record<string, number>
      | undefined;
    if (!aliases?.[alias]) return null;

    return this.manager.load(aliases[alias] as ObjId);
  }

  /**
   * Get the PlotDB object
   */
  private async getPlotDB(): Promise<any> {
    const objectManager = await this.manager.load(0 as ObjId);
    if (!objectManager) return null;

    const aliases = objectManager.get('aliases') as
      | Record<string, number>
      | undefined;
    if (!aliases?.plotDB) return null;

    return this.manager.load(aliases.plotDB as ObjId);
  }

  /**
   * Register MCP resources (read-only data)
   */
  private registerResources(server: McpServer): void {
    // Object schema documentation
    server.resource('schema', 'moo://schema', async () => ({
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
- #2: System (connection handlers)
- #3: AuthManager (authentication)
- #4: CharGen (character generation)`,
        },
      ],
    }));

    // Aliases resource
    server.resource(
      'aliases',
      'moo://aliases',
      { description: 'List all registered object aliases' },
      async () => {
        const objectManager = await this.manager.load(0 as ObjId);
        if (!objectManager) {
          return {
            contents: [
              {
                uri: 'moo://aliases',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'ObjectManager not found' }),
              },
            ],
          };
        }

        const aliases = objectManager.get('aliases') as
          | Record<string, number>
          | undefined;
        const sorted: Record<string, number> = {};
        if (aliases) {
          for (const key of Object.keys(aliases).sort()) {
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
      },
    );

    // Object by ID resource template
    server.resource(
      'object',
      new ResourceTemplate('moo://object/{id}', {
        list: undefined, // Don't enumerate all objects
        complete: {
          id: async (value: string) => {
            // Suggest some common object IDs for autocompletion
            const suggestions = ['0', '1', '2', '3', '4', '5'];
            return suggestions.filter((s) => s.startsWith(value));
          },
        },
      }),
      { description: 'Get a MOO object by its ID' },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const id = parseInt(idStr ?? '', 10);

        if (Number.isNaN(id)) {
          return {
            contents: [
              {
                uri: `moo://object/${idStr}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid object ID' }),
              },
            ],
          };
        }

        const obj = await this.manager.load(id as ObjId);
        if (!obj) {
          return {
            contents: [
              {
                uri: `moo://object/${id}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: `Object #${id} not found` }),
              },
            ],
          };
        }

        // Serialize the RuntimeObject for JSON output
        const raw = obj._getRaw();
        // Handle location - it may be a RuntimeObject proxy, so extract just the ID
        const locationObj = obj.get('location');
        const locationRef =
          locationObj && typeof locationObj === 'object' && 'id' in locationObj
            ? `#${locationObj.id}`
            : null;
        return {
          contents: [
            {
              uri: `moo://object/${id}`,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  id: raw._id,
                  name: obj.get('name'),
                  parent: `#${raw.parent.value}`,
                  description: obj.get('description'),
                  location: locationRef,
                  properties: Object.keys(raw.properties || {}),
                  methods: Object.keys(raw.methods || {}),
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    // Alias lookup resource template
    server.resource(
      'alias',
      new ResourceTemplate('moo://alias/{name}', {
        list: undefined, // Use moo://aliases to list all
        complete: {
          name: async (value: string) => {
            const objectManager = await this.manager.load(0 as ObjId);
            if (!objectManager) return [];
            const aliases = objectManager.get('aliases') as
              | Record<string, number>
              | undefined;
            if (!aliases) return [];
            return Object.keys(aliases).filter((a) =>
              a.toLowerCase().startsWith(value.toLowerCase()),
            );
          },
        },
      }),
      { description: 'Look up an object by its alias name' },
      async (_uri: URL, variables: { name?: string | string[] }) => {
        const nameVar = variables.name;
        const aliasName = Array.isArray(nameVar) ? nameVar[0] : nameVar;

        if (!aliasName) {
          return {
            contents: [
              {
                uri: 'moo://alias/',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Alias name required' }),
              },
            ],
          };
        }

        const objectManager = await this.manager.load(0 as ObjId);
        if (!objectManager) {
          return {
            contents: [
              {
                uri: `moo://alias/${aliasName}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'ObjectManager not found' }),
              },
            ],
          };
        }

        const aliases = objectManager.get('aliases') as
          | Record<string, number>
          | undefined;
        if (!aliases) {
          return {
            contents: [
              {
                uri: `moo://alias/${aliasName}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'No aliases registered' }),
              },
            ],
          };
        }

        const objectId = aliases[aliasName];
        if (objectId === undefined) {
          return {
            contents: [
              {
                uri: `moo://alias/${aliasName}`,
                mimeType: 'application/json',
                text: JSON.stringify({
                  error: `Alias '${aliasName}' not found`,
                }),
              },
            ],
          };
        }

        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            contents: [
              {
                uri: `moo://alias/${aliasName}`,
                mimeType: 'application/json',
                text: JSON.stringify({
                  error: `Object #${objectId} not found`,
                }),
              },
            ],
          };
        }

        return {
          contents: [
            {
              uri: `moo://alias/${aliasName}`,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  alias: aliasName,
                  objectId,
                  name: obj.get('name'),
                  parent: obj.getParent(),
                  description: obj.get('description'),
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    // Players resource
    server.resource(
      'players',
      'moo://players',
      { description: 'List all player characters' },
      async () => {
        const allObjects = await this.manager.db.listAll(false);
        const playerProto = allObjects.find(
          (o) => o.properties?.name?.value === 'Player',
        );
        if (!playerProto) {
          return {
            contents: [
              {
                uri: 'moo://players',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Player prototype not found' }),
              },
            ],
          };
        }

        const players = [];
        for (const obj of allObjects) {
          // Check if this object inherits from Player (with cycle protection)
          let parentId = obj.parent.value;
          let isPlayer = false;
          const seen = new Set<number>();
          while (parentId !== -1 && !seen.has(parentId)) {
            seen.add(parentId);
            if (parentId === playerProto._id) {
              isPlayer = true;
              break;
            }
            const parent = allObjects.find((o) => o._id === parentId);
            if (!parent) break;
            parentId = parent.parent.value;
          }

          if (isPlayer) {
            players.push({
              id: obj._id,
              name: obj.properties?.name?.value || '(unnamed)',
              location: obj.properties?.location?.value,
            });
          }
        }

        return {
          contents: [
            {
              uri: 'moo://players',
              mimeType: 'application/json',
              text: JSON.stringify(players, null, 2),
            },
          ],
        };
      },
    );

    // Plots resource
    server.resource(
      'plots',
      'moo://plots',
      { description: 'List all active plots' },
      async () => {
        try {
          const plotDB = await this.getPlotDB();
          if (!plotDB) {
            return {
              contents: [
                {
                  uri: 'moo://plots',
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'PlotDB not found' }),
                },
              ],
            };
          }

          // Get active plots from the PlotDB
          const plots = await plotDB.call('active');
          const results = (plots || []).map(
            (p: {
              id: number;
              name: string;
              events?: unknown[];
              jobs?: Record<string, unknown>;
              metadata?: Record<string, unknown>;
            }) => ({
              id: p.id,
              name: p.name,
              metadata: p.metadata || {},
              eventCount: (p.events || []).length,
              jobCount: Object.keys(p.jobs || {}).length,
            }),
          );

          return {
            contents: [
              {
                uri: 'moo://plots',
                mimeType: 'application/json',
                text: JSON.stringify(results, null, 2),
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

    // AI humans resource
    server.resource(
      'ai',
      'moo://ai',
      { description: 'List all AI-controlled humans' },
      async () => {
        const objectManager = await this.manager.load(0 as ObjId);
        if (!objectManager) {
          return {
            contents: [
              {
                uri: 'moo://ai',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'ObjectManager not found' }),
              },
            ],
          };
        }

        const aliases = objectManager.get('aliases') as
          | Record<string, number>
          | undefined;
        const aiId = aliases?.ai;
        if (!aiId) {
          return {
            contents: [
              {
                uri: 'moo://ai',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'AI registry not found' }),
              },
            ],
          };
        }

        try {
          const aiRegistry = await this.manager.load(aiId as ObjId);
          if (!aiRegistry) {
            return {
              contents: [
                {
                  uri: 'moo://ai',
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    error: 'AI registry object not found',
                  }),
                },
              ],
            };
          }

          // Get all AI humans (returns array of objects, objrefs resolved)
          const humans = (await aiRegistry.call('getAll')) as Array<{
            id: number;
            get: (prop: string) => unknown;
          }>;

          // Extract details from each human object, including role from registry
          const aiHumans = await Promise.all(
            humans.map(async (human) => {
              if (!human) return null;
              // Get role from registry info
              const info = (await aiRegistry.call('getInfo', human.id)) as {
                role?: string;
              } | null;
              return {
                id: human.id,
                name: human.get('name'),
                role: info?.role,
                location: human.get('location'),
              };
            }),
          );
          const filtered = aiHumans.filter((h) => h !== null);

          return {
            contents: [
              {
                uri: 'moo://ai',
                mimeType: 'application/json',
                text: JSON.stringify(filtered, null, 2),
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

    // City AI documentation resources - expose docs/city-ai/*.md files
    const cityAiDir = path.join(process.cwd(), 'docs', 'city-ai');

    // List all city-ai docs
    server.resource(
      'city-ai',
      'moo://city-ai',
      { description: 'List all city AI documentation files' },
      async () => {
        try {
          const files = fs
            .readdirSync(cityAiDir)
            .filter((f) => f.endsWith('.md'))
            .map((f) => ({
              name: f.replace('.md', ''),
              uri: `moo://city-ai/${f.replace('.md', '').toLowerCase()}`,
            }));
          return {
            contents: [
              {
                uri: 'moo://city-ai',
                mimeType: 'application/json',
                text: JSON.stringify({ files }, null, 2),
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

    // Individual city-ai doc resources
    server.resource(
      'city-ai-doc',
      new ResourceTemplate('moo://city-ai/{name}', {
        list: async () => {
          try {
            const files = fs
              .readdirSync(cityAiDir)
              .filter((f) => f.endsWith('.md'));
            return {
              resources: files.map((f) => ({
                uri: `moo://city-ai/${f.replace('.md', '').toLowerCase()}`,
                name: f.replace('.md', ''),
                description: `City AI documentation: ${f.replace('.md', '')}`,
              })),
            };
          } catch {
            return { resources: [] };
          }
        },
      }),
      { description: 'Get a specific city AI documentation file' },
      async (_uri: URL, variables: { name?: string | string[] }) => {
        const nameVar = variables.name;
        const name = Array.isArray(nameVar) ? nameVar[0] : nameVar;
        if (!name) {
          return {
            contents: [
              {
                uri: 'moo://city-ai/unknown',
                mimeType: 'text/plain',
                text: 'Error: No document name provided',
              },
            ],
          };
        }

        try {
          // Try exact match first, then case-insensitive
          const files = fs
            .readdirSync(cityAiDir)
            .filter((f) => f.endsWith('.md'));
          const match = files.find(
            (f) => f.replace('.md', '').toLowerCase() === name.toLowerCase(),
          );

          if (!match) {
            return {
              contents: [
                {
                  uri: `moo://city-ai/${name}`,
                  mimeType: 'text/plain',
                  text: `Error: Document '${name}' not found. Available: ${files.map((f) => f.replace('.md', '')).join(', ')}`,
                },
              ],
            };
          }

          const content = fs.readFileSync(path.join(cityAiDir, match), 'utf-8');
          return {
            contents: [
              {
                uri: `moo://city-ai/${name}`,
                mimeType: 'text/markdown',
                text: content,
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: `moo://city-ai/${name}`,
                mimeType: 'text/plain',
                text: `Error reading document: ${String(err)}`,
              },
            ],
          };
        }
      },
    );

    // Root docs resources - expose all docs/*.md files recursively
    const docsDir = path.join(process.cwd(), 'docs');

    // Recursively scan directory for .md files
    const scanDocsDir = (
      dir: string,
      prefix = '',
    ): Array<{ name: string; relativePath: string; fullPath: string }> => {
      const results: Array<{
        name: string;
        relativePath: string;
        fullPath: string;
      }> = [];
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

          if (entry.isDirectory()) {
            // Skip city-ai directory (has its own moo://city-ai/* resources)
            if (entry.name !== 'city-ai') {
              results.push(...scanDocsDir(fullPath, relativePath));
            }
          } else if (entry.name.endsWith('.md')) {
            // Convert path to resource name: docs/moo/prototypes/agents.md -> moo/prototypes/agents
            const name = relativePath.replace(/\.md$/, '').toLowerCase();
            results.push({ name, relativePath, fullPath });
          }
        }
      } catch {
        /* ignore missing directories */
      }
      return results;
    };

    // Helper to get all doc entries
    const getAllDocs = (): Array<{
      name: string;
      uri: string;
      relativePath: string;
    }> => {
      return scanDocsDir(docsDir).map((d) => ({
        name: d.name,
        uri: `moo://docs/${d.name}`,
        relativePath: d.relativePath,
      }));
    };

    // Helper to find and read a doc by name
    const findDoc = (
      name: string,
    ): { content: string; path: string } | null => {
      const allDocs = scanDocsDir(docsDir);
      const match = allDocs.find((d) => d.name === name.toLowerCase());
      if (match) {
        try {
          return {
            content: fs.readFileSync(match.fullPath, 'utf-8'),
            path: match.relativePath,
          };
        } catch {
          /* ignore */
        }
      }
      return null;
    };

    // List all exposed docs
    server.resource(
      'docs',
      'moo://docs',
      { description: 'List all technical documentation files' },
      async () => {
        try {
          const docs = getAllDocs();
          return {
            contents: [
              {
                uri: 'moo://docs',
                mimeType: 'application/json',
                text: JSON.stringify({ files: docs }, null, 2),
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

    // Individual doc resources
    server.resource(
      'doc',
      new ResourceTemplate('moo://docs/{+name}', {
        list: async () => {
          try {
            const docs = getAllDocs();
            return {
              resources: docs.map((d) => ({
                uri: d.uri,
                name: d.name,
                description: `Documentation: ${d.relativePath}`,
              })),
            };
          } catch {
            return { resources: [] };
          }
        },
      }),
      { description: 'Get a specific documentation file' },
      async (_uri: URL, variables: { name?: string | string[] }) => {
        const nameVar = variables.name;
        const name = Array.isArray(nameVar) ? nameVar[0] : nameVar;
        if (!name) {
          return {
            contents: [
              {
                uri: 'moo://docs/unknown',
                mimeType: 'text/plain',
                text: 'Error: No document name provided',
              },
            ],
          };
        }

        const doc = findDoc(name);
        if (!doc) {
          const allDocs = getAllDocs();
          return {
            contents: [
              {
                uri: `moo://docs/${name}`,
                mimeType: 'text/plain',
                text: `Error: Document '${name}' not found. Available: ${allDocs.map((d) => d.name).join(', ')}`,
              },
            ],
          };
        }

        return {
          contents: [
            {
              uri: `moo://docs/${name}`,
              mimeType: 'text/markdown',
              text: doc.content,
            },
          ],
        };
      },
    );

    // NPC Session resources - expose conversation history for AI NPCs
    // Session files are stored in projects/-home-node/ (based on cwd when SDK runs)
    const sessionsDir = path.join(
      process.env.HOME || '/home/node',
      '.claude',
      'projects',
      '-home-node',
    );

    // List all sessions (persisted on $ai even after NPCs are recycled)
    server.resource(
      'npc-sessions',
      'moo://npc-sessions',
      { description: 'List all AI NPC conversation sessions' },
      async () => {
        try {
          const aiRegistry = await this.getAlias('ai');
          if (!aiRegistry) {
            return {
              contents: [
                {
                  uri: 'moo://npc-sessions',
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'AI registry not found' }),
                },
              ],
            };
          }

          // Get sessions from $ai.listSessions() - persists after NPC recycling
          const sessions = (await aiRegistry.call('listSessions')) || [];

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

    // Individual NPC session resource - keyed by sessionId (persists after NPC recycling)
    server.resource(
      'npc-session',
      new ResourceTemplate('moo://npc-sessions/{sessionId}', {
        list: async () => {
          try {
            const aiRegistry = await this.getAlias('ai');
            if (!aiRegistry) return { resources: [] };

            // Get sessions from $ai registry (persists after NPC recycling)
            const sessions = (await aiRegistry.call('listSessions')) || [];
            const resources: Array<{
              uri: string;
              name: string;
              description: string;
            }> = [];

            for (const session of sessions) {
              resources.push({
                uri: `moo://npc-sessions/${session.sessionId}`,
                name: `${session.npcName || 'Unknown'} Session`,
                description: `${session.role || 'NPC'} conversation - started ${new Date(session.startTime).toLocaleString()}`,
              });
            }

            return { resources };
          } catch {
            return { resources: [] };
          }
        },
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
          const aiRegistry = await this.getAlias('ai');
          const sessionInfo = aiRegistry
            ? await aiRegistry.call('getSession', sessionId)
            : null;

          const sessionFile = path.join(sessionsDir, `${sessionId}.jsonl`);

          if (!fs.existsSync(sessionFile)) {
            return {
              contents: [
                {
                  uri: `moo://npc-sessions/${sessionId}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    sessionId,
                    ...(sessionInfo || {}),
                    error: 'Session file not found',
                  }),
                },
              ],
            };
          }

          // Read and parse JSONL file
          const content = fs.readFileSync(sessionFile, 'utf-8');
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

          return {
            contents: [
              {
                uri: `moo://npc-sessions/${sessionId}`,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    sessionId,
                    npcId: sessionInfo?.npcId,
                    npcName: sessionInfo?.npcName,
                    role: sessionInfo?.role,
                    startTime: sessionInfo?.startTime,
                    lastActive: sessionInfo?.lastActive,
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

    // Individual AI profile resource - moo://ai/{id}
    server.resource(
      'ai-profile',
      new ResourceTemplate('moo://ai/{id}', {
        list: async () => {
          try {
            const aiRegistry = await this.getAlias('ai');
            if (!aiRegistry) return { resources: [] };

            const humans = (await aiRegistry.call('getAll')) || [];
            const resources: Array<{
              uri: string;
              name: string;
              description: string;
            }> = [];

            for (const human of humans) {
              const npcId =
                typeof human === 'number' ? human : (human?.id ?? human?.value);
              if (!npcId) continue;

              const npc = await this.manager.load(npcId as ObjId);
              if (npc) {
                const name = String((await npc.get('name')) || `NPC #${npcId}`);
                resources.push({
                  uri: `moo://ai/${npcId}`,
                  name: `${name} Profile`,
                  description: `Full profile for ${name}`,
                });
              }
            }
            return { resources };
          } catch {
            return { resources: [] };
          }
        },
      }),
      {
        description:
          'Get full profile for an AI NPC (personality, history, memories, notes)',
      },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const npcId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(npcId)) {
          return {
            contents: [
              {
                uri: 'moo://ai/unknown',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid NPC ID' }),
              },
            ],
          };
        }

        try {
          const aiRegistry = await this.getAlias('ai');
          if (!aiRegistry) {
            return {
              contents: [
                {
                  uri: `moo://ai/${npcId}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'AI registry not found' }),
                },
              ],
            };
          }

          const profile = await aiRegistry.call('getProfile', npcId);
          const memories = (await aiRegistry.call('recall', npcId)) as {
            memories?: unknown[];
          } | null;

          return {
            contents: [
              {
                uri: `moo://ai/${npcId}`,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    ...profile,
                    memories: memories?.memories || [],
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
                uri: `moo://ai/${npcId}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // AI memories resource - moo://ai/{id}/memories
    server.resource(
      'ai-memories',
      new ResourceTemplate('moo://ai/{id}/memories', { list: undefined }),
      { description: 'Get memories for an AI NPC' },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const npcId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(npcId)) {
          return {
            contents: [
              {
                uri: 'moo://ai/unknown/memories',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid NPC ID' }),
              },
            ],
          };
        }

        try {
          const aiRegistry = await this.getAlias('ai');
          if (!aiRegistry) {
            return {
              contents: [
                {
                  uri: `moo://ai/${npcId}/memories`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'AI registry not found' }),
                },
              ],
            };
          }

          const result = (await aiRegistry.call('recall', npcId)) as {
            memories?: unknown[];
          } | null;

          return {
            contents: [
              {
                uri: `moo://ai/${npcId}/memories`,
                mimeType: 'application/json',
                text: JSON.stringify(result?.memories || [], null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: `moo://ai/${npcId}/memories`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // AI notes resource - moo://ai/{id}/notes
    server.resource(
      'ai-notes',
      new ResourceTemplate('moo://ai/{id}/notes', { list: undefined }),
      { description: 'Get notes for an AI NPC' },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const npcId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(npcId)) {
          return {
            contents: [
              {
                uri: 'moo://ai/unknown/notes',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid NPC ID' }),
              },
            ],
          };
        }

        try {
          const notesSystem = await this.getAlias('notes');
          if (!notesSystem) {
            return {
              contents: [
                {
                  uri: `moo://ai/${npcId}/notes`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Notes system not found' }),
                },
              ],
            };
          }

          const notes = await notesSystem.call('get', npcId);

          return {
            contents: [
              {
                uri: `moo://ai/${npcId}/notes`,
                mimeType: 'application/json',
                text: JSON.stringify(notes || [], null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: `moo://ai/${npcId}/notes`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // World log resource - moo://ai/worldLog
    server.resource(
      'ai-worldlog',
      new ResourceTemplate('moo://ai/worldLog', { list: undefined }),
      {
        description:
          'Shared OOC chat between Pluribus and Sister Gray (deity chat)',
      },
      async () => {
        try {
          const aiRegistry = await this.getAlias('ai');
          if (!aiRegistry) {
            return {
              contents: [
                {
                  uri: 'moo://ai/worldLog',
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'AI registry not found' }),
                },
              ],
            };
          }

          const log = await aiRegistry.call('getWorldLog', 50);

          return {
            contents: [
              {
                uri: 'moo://ai/worldLog',
                mimeType: 'application/json',
                text: JSON.stringify(log, null, 2),
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

    // Individual plot resource - moo://plots/{id}
    server.resource(
      'plot-detail',
      new ResourceTemplate('moo://plots/{id}', {
        list: async () => {
          try {
            const plotDB = await this.getPlotDB();
            if (!plotDB) return { resources: [] };

            const plots = plotDB.getAll();
            return {
              resources: plots.map(
                (p: { id: number; name: string; status: string }) => ({
                  uri: `moo://plots/${p.id}`,
                  name: p.name,
                  description: `Plot: ${p.name} (${p.status})`,
                }),
              ),
            };
          } catch {
            return { resources: [] };
          }
        },
      }),
      { description: 'Get details for a specific plot' },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const plotId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(plotId)) {
          return {
            contents: [
              {
                uri: 'moo://plots/unknown',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid plot ID' }),
              },
            ],
          };
        }

        try {
          const plotDB = await this.getPlotDB();
          if (!plotDB) {
            return {
              contents: [
                {
                  uri: `moo://plots/${plotId}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'PlotDB not found' }),
                },
              ],
            };
          }

          const plot = plotDB.get(plotId);
          if (!plot) {
            return {
              contents: [
                {
                  uri: `moo://plots/${plotId}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Plot #${plotId} not found` }),
                },
              ],
            };
          }

          return {
            contents: [
              {
                uri: `moo://plots/${plotId}`,
                mimeType: 'application/json',
                text: JSON.stringify(plot, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: `moo://plots/${plotId}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Plot events resource - moo://plots/{id}/events
    server.resource(
      'plot-events',
      new ResourceTemplate('moo://plots/{id}/events', { list: undefined }),
      { description: 'Get event log for a specific plot' },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const plotId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(plotId)) {
          return {
            contents: [
              {
                uri: 'moo://plots/unknown/events',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid plot ID' }),
              },
            ],
          };
        }

        try {
          const plotDB = await this.getPlotDB();
          if (!plotDB) {
            return {
              contents: [
                {
                  uri: `moo://plots/${plotId}/events`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'PlotDB not found' }),
                },
              ],
            };
          }

          const events = plotDB.getEvents(plotId);

          return {
            contents: [
              {
                uri: `moo://plots/${plotId}/events`,
                mimeType: 'application/json',
                text: JSON.stringify(events || [], null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: `moo://plots/${plotId}/events`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Room state resource - moo://rooms/{id}
    server.resource(
      'room-state',
      new ResourceTemplate('moo://rooms/{id}', {
        list: async () => {
          try {
            // Find rooms by walking parent chain to $.room (id 7)
            const allObjects = await this.manager.db.listAll(false);
            const roomProtoId = 7;
            const rooms: Array<{ id: number; name: string }> = [];

            for (const obj of allObjects) {
              let parentId = obj.parent.value;
              let isRoom = obj._id === roomProtoId;
              const seen = new Set<number>();
              while (parentId !== -1 && !isRoom && !seen.has(parentId)) {
                seen.add(parentId);
                if (parentId === roomProtoId) {
                  isRoom = true;
                  break;
                }
                const parent = allObjects.find((o) => o._id === parentId);
                if (!parent) break;
                parentId = parent.parent.value;
              }

              if (isRoom && obj._id !== roomProtoId) {
                rooms.push({
                  id: obj._id,
                  name: obj.properties?.name?.value || `Room #${obj._id}`,
                });
              }
              if (rooms.length >= 100) break;
            }

            return {
              resources: rooms.map((r) => ({
                uri: `moo://rooms/${r.id}`,
                name: r.name,
                description: `Room: ${r.name}`,
              })),
            };
          } catch {
            return { resources: [] };
          }
        },
      }),
      { description: 'Get live state for a room (contents, players, exits)' },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const roomId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(roomId)) {
          return {
            contents: [
              {
                uri: 'moo://rooms/unknown',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid room ID' }),
              },
            ],
          };
        }

        try {
          const room = await this.manager.load(roomId as ObjId);
          if (!room) {
            return {
              contents: [
                {
                  uri: `moo://rooms/${roomId}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Room #${roomId} not found` }),
                },
              ],
            };
          }

          const name = await room.get('name');
          const description = await room.get('description');
          const coordinates = await room.get('coordinates');

          // Get contents
          const contentIds = (await room.get('contents')) as
            | Array<{ type: string; value: number }>
            | undefined;
          const contents: Array<{ id: number; name: string; type: string }> =
            [];
          const players: Array<{
            id: number;
            name: string;
            connected: boolean;
          }> = [];

          if (contentIds) {
            for (const ref of contentIds) {
              const objId = ref?.value ?? ref;
              if (typeof objId !== 'number') continue;

              const obj = await this.manager.load(objId as ObjId);
              if (!obj) continue;

              const objName = String((await obj.get('name')) || `#${objId}`);
              const isPlayer = await obj.get('playername');

              if (isPlayer) {
                players.push({
                  id: objId,
                  name: objName,
                  connected: !!(await obj.get('connection')),
                });
              } else {
                const raw = obj._getRaw();
                const parentId = raw.parent?.value;
                const parentObj =
                  parentId !== undefined
                    ? await this.manager.load(parentId)
                    : null;
                const parentName = parentObj
                  ? String((await parentObj.get('name')) || 'Object')
                  : 'Object';
                contents.push({
                  id: objId,
                  name: objName,
                  type: parentName,
                });
              }
            }
          }

          // Get exits
          const exitIds = (await room.get('exits')) as
            | Array<{ type: string; value: number }>
            | undefined;
          const exits: Array<{
            direction: string;
            destId: number;
            destName: string;
          }> = [];

          if (exitIds) {
            for (const ref of exitIds) {
              const exitId = ref?.value ?? ref;
              if (typeof exitId !== 'number') continue;

              const exit = await this.manager.load(exitId as ObjId);
              if (!exit) continue;

              const direction = String(
                (await exit.get('direction')) || 'unknown',
              );
              const destRef = (await exit.get('destination')) as
                | { value: number }
                | number
                | undefined;
              const destId =
                typeof destRef === 'number' ? destRef : destRef?.value;

              if (destId) {
                const dest = await this.manager.load(destId as ObjId);
                exits.push({
                  direction,
                  destId,
                  destName: String(dest?.get('name') || `#${destId}`),
                });
              }
            }
          }

          return {
            contents: [
              {
                uri: `moo://rooms/${roomId}`,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    id: roomId,
                    name,
                    description,
                    coordinates,
                    exits,
                    players,
                    contents,
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
                uri: `moo://rooms/${roomId}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Individual player resource - moo://players/{id}
    server.resource(
      'player-detail',
      new ResourceTemplate('moo://players/{id}', {
        list: async () => {
          try {
            // Query MongoDB for objects with playername property
            const db = (this.manager as any).db;
            if (!db || !db.objects) return { resources: [] };

            const docs = await db.objects
              .find({
                'properties.playername': { $exists: true },
                'properties._deleted': { $ne: true },
              })
              .toArray();

            return {
              resources: docs.map((doc: any) => {
                // Handle name which may be stored as string or { type, value }
                const nameVal = doc.properties?.name;
                const name =
                  typeof nameVal === 'string'
                    ? nameVal
                    : nameVal?.value || `Player #${doc._id}`;
                return {
                  uri: `moo://players/${doc._id}`,
                  name: String(name),
                  description: `Player: ${name}`,
                };
              }),
            };
          } catch {
            return { resources: [] };
          }
        },
      }),
      { description: 'Get details for a specific player' },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const playerId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(playerId)) {
          return {
            contents: [
              {
                uri: 'moo://players/unknown',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid player ID' }),
              },
            ],
          };
        }

        try {
          const player = await this.manager.load(playerId as ObjId);
          if (!player) {
            return {
              contents: [
                {
                  uri: `moo://players/${playerId}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    error: `Player #${playerId} not found`,
                  }),
                },
              ],
            };
          }

          const name = await player.get('name');
          const playername = await player.get('playername');
          if (!playername) {
            return {
              contents: [
                {
                  uri: `moo://players/${playerId}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    error: `#${playerId} is not a player`,
                  }),
                },
              ],
            };
          }

          const locationRef = (await player.get('location')) as
            | { value: number }
            | number
            | undefined;
          const locationId =
            typeof locationRef === 'number' ? locationRef : locationRef?.value;
          let locationName = null;
          if (locationId) {
            const loc = await this.manager.load(locationId as ObjId);
            locationName = loc ? String(await loc.get('name')) : null;
          }

          return {
            contents: [
              {
                uri: `moo://players/${playerId}`,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    id: playerId,
                    name,
                    playername,
                    connected: !!(await player.get('connection')),
                    location: locationId
                      ? { id: locationId, name: locationName }
                      : null,
                    wizard: (await player.get('wizard')) || false,
                    sex: await player.get('sex'),
                    age: await player.get('age'),
                    createdAt: await player.get('createdAt'),
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
                uri: `moo://players/${playerId}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Generic object resource - moo://objects/{id}
    server.resource(
      'object-detail',
      new ResourceTemplate('moo://objects/{id}', { list: undefined }),
      { description: 'Get details for any MOO object' },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const objId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(objId)) {
          return {
            contents: [
              {
                uri: 'moo://objects/unknown',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid object ID' }),
              },
            ],
          };
        }

        try {
          const obj = await this.manager.load(objId as ObjId);
          if (!obj) {
            return {
              contents: [
                {
                  uri: `moo://objects/${objId}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Object #${objId} not found` }),
                },
              ],
            };
          }

          // Use same approach as get_object tool
          const raw = obj._getRaw();
          const result = {
            _id: raw._id,
            parent: `#${raw.parent.value}`,
            properties: this.serializeValue(obj.getOwnProperties()),
            methods: Object.keys(raw.methods || {}),
            created: raw.created,
            modified: raw.modified,
          };

          return {
            contents: [
              {
                uri: `moo://objects/${objId}`,
                mimeType: 'application/json',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            contents: [
              {
                uri: `moo://objects/${objId}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Recent events resource - moo://events/recent
    server.resource(
      'recent-events',
      'moo://events/recent',
      { description: 'Get recent game events (last 100)' },
      async () => {
        try {
          // Get events from MongoDB game_events collection
          const db = (this.manager as any).db;
          if (!db || !db.getCollection) {
            return {
              contents: [
                {
                  uri: 'moo://events/recent',
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Database not available' }),
                },
              ],
            };
          }

          const events = await db
            .getCollection('game_events')
            .find({})
            .sort({ timestamp: -1 })
            .limit(100)
            .toArray();

          return {
            contents: [
              {
                uri: 'moo://events/recent',
                mimeType: 'application/json',
                text: JSON.stringify(events, null, 2),
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

    // Object property resource - moo://objects/{id}/prop/{name}
    server.resource(
      'object-prop',
      new ResourceTemplate('moo://objects/{id}/prop/{name}', {
        list: undefined,
      }),
      { description: 'Get a specific property from a MOO object' },
      async (
        _uri: URL,
        variables: { id?: string | string[]; name?: string | string[] },
      ) => {
        const idVar = variables.id;
        const nameVar = variables.name;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const propName = Array.isArray(nameVar) ? nameVar[0] : nameVar;
        const objId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(objId) || !propName) {
          return {
            contents: [
              {
                uri: `moo://objects/${idStr}/prop/${propName}`,
                mimeType: 'application/json',
                text: JSON.stringify({
                  error: 'Invalid object ID or property name',
                }),
              },
            ],
          };
        }

        try {
          const obj = await this.manager.load(objId as ObjId);
          if (!obj) {
            return {
              contents: [
                {
                  uri: `moo://objects/${objId}/prop/${propName}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Object #${objId} not found` }),
                },
              ],
            };
          }

          const value = await obj.get(propName);

          return {
            contents: [
              {
                uri: `moo://objects/${objId}/prop/${propName}`,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    objectId: objId,
                    property: propName,
                    value: this.serializeValue(value),
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
                uri: `moo://objects/${objId}/prop/${propName}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Object method resource - moo://objects/{id}/method/{name}
    // Walks inheritance chain to find method
    server.resource(
      'object-method',
      new ResourceTemplate('moo://objects/{id}/method/{name}', {
        list: undefined,
      }),
      {
        description:
          'Get the TypeScript code for a method on a MOO object (walks inheritance chain)',
      },
      async (
        _uri: URL,
        variables: { id?: string | string[]; name?: string | string[] },
      ) => {
        const idVar = variables.id;
        const nameVar = variables.name;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const methodName = Array.isArray(nameVar) ? nameVar[0] : nameVar;
        const objId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(objId) || !methodName) {
          return {
            contents: [
              {
                uri: `moo://objects/${idStr}/method/${methodName}`,
                mimeType: 'application/json',
                text: JSON.stringify({
                  error: 'Invalid object ID or method name',
                }),
              },
            ],
          };
        }

        try {
          let currentObj = await this.manager.load(objId as ObjId);
          if (!currentObj) {
            return {
              contents: [
                {
                  uri: `moo://objects/${objId}/method/${methodName}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Object #${objId} not found` }),
                },
              ],
            };
          }

          // Walk inheritance chain to find the method
          let foundOn: number | null = null;
          let foundOnName: string | null = null;
          let method: {
            code?: string;
            help?: string;
            callable?: boolean;
          } | null = null;
          const visited = new Set<number>();

          while (currentObj && !visited.has(currentObj.id)) {
            visited.add(currentObj.id);
            const raw = currentObj._getRaw();

            if (raw.methods?.[methodName]) {
              method = raw.methods[methodName];
              foundOn = currentObj.id;
              foundOnName = String(
                (await currentObj.get('name')) || `#${currentObj.id}`,
              );
              break;
            }

            // Move to parent
            if (raw.parent && raw.parent.value !== currentObj.id) {
              currentObj = await this.manager.load(raw.parent.value);
            } else {
              break;
            }
          }

          if (!method) {
            return {
              contents: [
                {
                  uri: `moo://objects/${objId}/method/${methodName}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    error: `Method '${methodName}' not found on #${objId} or any parent`,
                  }),
                },
              ],
            };
          }

          // Return JSON with metadata + code
          return {
            contents: [
              {
                uri: `moo://objects/${objId}/method/${methodName}`,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    requestedObject: objId,
                    definedOn: {
                      id: foundOn,
                      name: foundOnName,
                    },
                    inherited: foundOn !== objId,
                    method: methodName,
                    help: method.help || null,
                    callable: method.callable ?? true,
                    code: method.code || '',
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
                uri: `moo://objects/${objId}/method/${methodName}`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Object verbs - moo://objects/{id}/verbs
    server.resource(
      'object-verbs',
      new ResourceTemplate('moo://objects/{id}/verbs', { list: undefined }),
      { description: 'Get all verbs registered on an agent object' },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const objId = idStr ? parseInt(idStr, 10) : NaN;

        if (Number.isNaN(objId)) {
          return {
            contents: [
              {
                uri: `moo://objects/${idStr}/verbs`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid object ID' }),
              },
            ],
          };
        }

        try {
          const obj = await this.manager.load(objId as ObjId);
          if (!obj) {
            return {
              contents: [
                {
                  uri: `moo://objects/${objId}/verbs`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: `Object #${objId} not found` }),
                },
              ],
            };
          }

          const verbs = obj.get('verbs') as Record<string, unknown> | undefined;

          // Format verbs for display - verbs is { pattern: { target: #id, method: 'name' }, ... }
          const verbList: Array<{
            pattern: string;
            target: string;
            method: string;
          }> = [];
          if (verbs && typeof verbs === 'object') {
            for (const [pattern, handler] of Object.entries(verbs)) {
              if (handler && typeof handler === 'object') {
                const h = handler as {
                  target?: { id?: number };
                  method?: string;
                };
                verbList.push({
                  pattern,
                  target:
                    h.target?.id !== undefined ? `#${h.target.id}` : 'unknown',
                  method: h.method || 'unknown',
                });
              }
            }
          }

          return {
            contents: [
              {
                uri: `moo://objects/${objId}/verbs`,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    objectId: objId,
                    name: obj.get('name'),
                    verbCount: verbList.length,
                    verbs: verbList,
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
                uri: `moo://objects/${objId}/verbs`,
                mimeType: 'application/json',
                text: JSON.stringify({ error: String(err) }),
              },
            ],
          };
        }
      },
    );

    // Object list with pagination - moo://objects/list/{page}
    server.resource(
      'object-list',
      new ResourceTemplate('moo://objects/list/{page}', {
        list: async () => {
          return {
            resources: [
              {
                uri: 'moo://objects/list/1',
                name: 'Objects Page 1',
                description: 'First 100 objects',
              },
              {
                uri: 'moo://objects/list/2',
                name: 'Objects Page 2',
                description: 'Objects 101-200',
              },
              {
                uri: 'moo://objects/list/3',
                name: 'Objects Page 3',
                description: 'Objects 201-300',
              },
            ],
          };
        },
      }),
      { description: 'List MOO objects with pagination (100 per page)' },
      async (_uri: URL, variables: { page?: string | string[] }) => {
        const pageVar = variables.page;
        const pageStr = Array.isArray(pageVar) ? pageVar[0] : pageVar;
        const page = pageStr ? parseInt(pageStr, 10) : 1;

        if (Number.isNaN(page) || page < 1) {
          return {
            contents: [
              {
                uri: 'moo://objects/list/1',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Invalid page number' }),
              },
            ],
          };
        }

        try {
          const db = (this.manager as any).db;
          if (!db || !db.objects) {
            return {
              contents: [
                {
                  uri: `moo://objects/list/${page}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ error: 'Database not available' }),
                },
              ],
            };
          }

          const limit = 100;
          const skip = (page - 1) * limit;

          const docs = await db.objects
            .find({ 'properties._deleted': { $ne: true } })
            .sort({ _id: 1 })
            .skip(skip)
            .limit(limit)
            .toArray();

          const total = await db.objects.countDocuments({
            'properties._deleted': { $ne: true },
          });
          const totalPages = Math.ceil(total / limit);

          const objects = docs.map((doc: any) => {
            const nameVal = doc.properties?.name;
            const name =
              typeof nameVal === 'string'
                ? nameVal
                : nameVal?.value || `#${doc._id}`;
            return {
              id: doc._id,
              name,
              parent: doc.parent,
            };
          });

          return {
            contents: [
              {
                uri: `moo://objects/list/${page}`,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    page,
                    totalPages,
                    total,
                    limit,
                    objects,
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
                uri: `moo://objects/list/${page}`,
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
   * Register MCP prompts (reusable templates)
   */
  private registerPrompts(server: McpServer): void {
    server.prompt(
      'inspect-object',
      { id: z.string().describe('Object ID to inspect') },
      ({ id }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please inspect MOO object #${id}:
1. Show all properties and their values
2. List all methods with their signatures
3. Show the inheritance chain (parent objects)
4. Identify any issues or suggestions for improvement`,
            },
          },
        ],
      }),
    );

    server.prompt(
      'create-prototype',
      { name: z.string(), parent: z.string().optional() },
      ({ name, parent }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create a new MOO prototype object called "${name}"${parent ? ` inheriting from #${parent}` : ''}:
1. Define appropriate properties for this type
2. Create common methods this object type would need
3. Follow existing patterns in the codebase
4. Add help documentation to methods`,
            },
          },
        ],
      }),
    );

    server.prompt(
      'debug-method',
      { objectId: z.string(), methodName: z.string() },
      ({ objectId, methodName }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Debug the method "${methodName}" on object #${objectId}:
1. Fetch and analyze the current method code
2. Identify potential bugs or issues
3. Check for proper error handling
4. Suggest improvements while maintaining compatibility`,
            },
          },
        ],
      }),
    );
  }

  /**
   * Start the HTTP server with Streamable HTTP transport
   */
  async start(): Promise<void> {
    this.httpServer = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        // CORS headers
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
      },
    );

    this.httpServer.listen(this.port, this.host, () => {
      console.log(
        `🔮 MCP server listening on http://${this.host}:${this.port}/mcp`,
      );
    });
  }

  /**
   * Handle POST requests (client-to-server messages)
   */
  private async handlePost(
    req: IncomingMessage,
    res: ServerResponse,
    sessionId?: string,
  ): Promise<void> {
    const body = await this.readBody(req);
    const message = JSON.parse(body);

    if (sessionId && this.sessions.has(sessionId)) {
      // Existing session - use the stored transport
      const session = this.sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res, message);
    } else if (message.method === 'initialize') {
      // New session - create a NEW server and transport for this session
      // Each session needs its own McpServer because the SDK only supports one transport per server
      const server = this.createSessionServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          this.sessions.set(newSessionId, { server, transport });
        },
      });

      // Connect this session's server to its transport
      await server.connect(transport);

      // Handle the initialize request
      await transport.handleRequest(req, res, message);
    } else if (sessionId && !this.sessions.has(sessionId)) {
      // Stale session - server restarted. Auto-recreate session with same ID.
      console.log(`[MCP] Recreating stale session ${sessionId}`);
      const server = this.createSessionServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId, // Reuse the same session ID
        onsessioninitialized: (newSessionId) => {
          this.sessions.set(newSessionId, { server, transport });
        },
      });

      // Connect this session's server to its transport
      await server.connect(transport);

      // Synthesize an initialize to set up the session properly
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
      res.end(
        JSON.stringify({
          error: 'Bad Request: No session ID and not an initialize request',
        }),
      );
    }
  }

  /**
   * Handle GET requests (SSE streaming for server-to-client notifications)
   */
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
      // Stale session on GET - can't auto-recreate for SSE, just return error
      // The POST handler will recreate the session on next tool call
      res.writeHead(410);
      res.end(
        JSON.stringify({
          error: 'Session expired. Next request will auto-reconnect.',
          code: 'SESSION_EXPIRED',
        }),
      );
      return;
    }

    const session = this.sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
  }

  /**
   * Handle DELETE requests (session cleanup)
   */
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

  /**
   * Read request body
   */
  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    // Close all sessions
    for (const [id, session] of this.sessions) {
      session.transport.close();
      this.sessions.delete(id);
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer?.close((err) => (err ? reject(err) : resolve()));
      });
      this.httpServer = null;
    }
  }
}

/**
 * Create and start MCP server
 */
export async function createMCPServer(
  manager: ObjectManager,
  config?: MCPServerConfig,
): Promise<MaliceMCPServer> {
  const server = new MaliceMCPServer(manager, config);
  await server.start();
  return server;
}
