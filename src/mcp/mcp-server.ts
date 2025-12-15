/**
 * MCP Server for Malice MOO Objects
 *
 * Streamable HTTP transport (modern MCP standard)
 * Provides tools for querying and updating MOO objects in MongoDB
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import type { ObjectManager } from '../database/object-manager.js';
import type { ObjId } from '../../types/object.js';
import { MCPTelnetClient } from './telnet-client.js';
import { parseQuery, validateQuery } from './query-parser.js';

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
   * Serialize a value for JSON output, converting RuntimeObjects to "#ID" format
   * This avoids circular reference issues with Proxy objects
   */
  private serializeValue(value: any, seen = new WeakSet()): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle RuntimeObject (has .id property AND .get method - distinguishes from plain objects)
    if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'number' && typeof value.get === 'function') {
      return `#${value.id}`;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(v => this.serializeValue(v, seen));
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
          properties: this.serializeValue(obj.getOwnProperties()),
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

        const value = this.serializeValue(obj.get(name));
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
          const serialized = this.serializeValue(result);
          return {
            content: [{ type: 'text', text: JSON.stringify({ result: serialized }, null, 2) }],
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
        value: z.any().optional().describe('Property value to match (omit to find all objects with this property)'),
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

    // Search objects by name pattern
    this.server.tool(
      'search_objects',
      'Search MOO objects by name. Supports substring matching and regex patterns.',
      {
        pattern: z.string().describe('Search pattern - substring or regex (e.g., "Tower", "^Smith", "Lock$")'),
        regex: z.boolean().optional().describe('Treat pattern as regex (default: substring match)'),
        limit: z.number().optional().describe('Max results to return (default 50)'),
      },
      async ({ pattern, regex, limit }) => {
        const allObjects = await this.manager.db.listAll(false);
        const maxResults = limit ?? 50;
        const results: Array<{ id: number; name: string; parent: number }> = [];

        let matcher: (name: string) => boolean;
        if (regex) {
          try {
            const re = new RegExp(pattern, 'i');
            matcher = (name: string) => re.test(name);
          } catch {
            return {
              content: [{ type: 'text', text: `Invalid regex pattern: ${pattern}` }],
              isError: true,
            };
          }
        } else {
          const lower = pattern.toLowerCase();
          matcher = (name: string) => name.toLowerCase().includes(lower);
        }

        for (const obj of allObjects) {
          const name = obj.properties?.name?.value;
          if (typeof name === 'string' && matcher(name)) {
            results.push({
              id: obj._id,
              name,
              parent: obj.parent,
            });
            if (results.length >= maxResults) break;
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({ count: results.length, objects: results }, null, 2) }],
        };
      }
    );

    // Find children/instances of a prototype
    this.server.tool(
      'find_children',
      'Find all objects that inherit from a given parent (direct children only, or all descendants).',
      {
        parentId: z.number().describe('Parent object ID to find children of'),
        recursive: z.boolean().optional().describe('Include all descendants, not just direct children (default: false)'),
        limit: z.number().optional().describe('Max results to return (default 100)'),
      },
      async ({ parentId, recursive, limit }) => {
        const allObjects = await this.manager.db.listAll(false);
        const maxResults = limit ?? 100;
        const results: Array<{ id: number; name: string; parent: number }> = [];

        if (recursive) {
          // Build set of all descendant parent IDs
          const validParents = new Set<number>([parentId]);
          let changed = true;
          while (changed) {
            changed = false;
            for (const obj of allObjects) {
              if (validParents.has(obj.parent) && !validParents.has(obj._id)) {
                validParents.add(obj._id);
                changed = true;
              }
            }
          }
          validParents.delete(parentId); // Don't include the parent itself

          for (const obj of allObjects) {
            if (validParents.has(obj._id) || obj.parent === parentId) {
              results.push({
                id: obj._id,
                name: obj.properties?.name?.value || '(unnamed)',
                parent: obj.parent,
              });
              if (results.length >= maxResults) break;
            }
          }
        } else {
          // Direct children only
          for (const obj of allObjects) {
            if (obj.parent === parentId) {
              results.push({
                id: obj._id,
                name: obj.properties?.name?.value || '(unnamed)',
                parent: obj.parent,
              });
              if (results.length >= maxResults) break;
            }
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({ count: results.length, objects: results }, null, 2) }],
        };
      }
    );

    // Find objects in a location
    this.server.tool(
      'find_in_location',
      'Find all objects in a room or container.',
      {
        locationId: z.number().describe('Room or container ID to search in'),
        recursive: z.boolean().optional().describe('Include contents of containers within (default: false)'),
      },
      async ({ locationId, recursive }) => {
        const allObjects = await this.manager.db.listAll(false);
        const results: Array<{ id: number; name: string; parent: number; location: number }> = [];

        const locationsToSearch = new Set<number>([locationId]);

        if (recursive) {
          // Keep expanding until no new containers found
          let changed = true;
          while (changed) {
            changed = false;
            for (const obj of allObjects) {
              const loc = obj.properties?.location?.value;
              if (typeof loc === 'number' && locationsToSearch.has(loc) && !locationsToSearch.has(obj._id)) {
                // This object is in a location we're searching - add it as a potential container
                locationsToSearch.add(obj._id);
                changed = true;
              }
            }
          }
          locationsToSearch.delete(locationId); // We want contents, not the location itself
        }

        for (const obj of allObjects) {
          const loc = obj.properties?.location?.value;
          if (typeof loc === 'number' && (loc === locationId || (recursive && locationsToSearch.has(loc)))) {
            results.push({
              id: obj._id,
              name: obj.properties?.name?.value || '(unnamed)',
              parent: obj.parent,
              location: loc,
            });
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({ count: results.length, objects: results }, null, 2) }],
        };
      }
    );

    // Alias lookup
    this.server.tool(
      'alias_lookup',
      'Look up an object by its alias (e.g., "lock", "recycler", "room"). Returns the object ID and basic info.',
      {
        alias: z.string().describe('Alias name without $ prefix (e.g., "lock", "room", "recycler")'),
      },
      async ({ alias }) => {
        // Remove $ prefix if provided
        const cleanAlias = alias.startsWith('$') ? alias.slice(1) : alias;
        // Handle $.foo format
        const finalAlias = cleanAlias.startsWith('.') ? cleanAlias.slice(1) : cleanAlias;

        const objectManager = await this.manager.load(0 as ObjId);
        if (!objectManager) {
          return {
            content: [{ type: 'text', text: 'ObjectManager not found' }],
            isError: true,
          };
        }

        const aliases = objectManager.get('aliases') as Record<string, number> | undefined;
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
            content: [{ type: 'text', text: JSON.stringify({
              error: `Alias '${finalAlias}' not found`,
              available: available.slice(0, 50),
              total: available.length,
            }, null, 2) }],
            isError: true,
          };
        }

        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            content: [{ type: 'text', text: `Alias '${finalAlias}' points to #${objectId} but object not found` }],
            isError: true,
          };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({
            alias: finalAlias,
            id: objectId,
            name: obj.get('name'),
            parent: obj.getParent(),
            description: obj.get('description'),
          }, null, 2) }],
        };
      }
    );

    // List all aliases
    this.server.tool(
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

        const aliases = objectManager.get('aliases') as Record<string, number> | undefined;
        if (!aliases) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ count: 0, aliases: {} }, null, 2) }],
          };
        }

        // Sort by alias name
        const sorted: Record<string, number> = {};
        for (const key of Object.keys(aliases).sort()) {
          sorted[key] = aliases[key];
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({
            count: Object.keys(sorted).length,
            aliases: sorted,
          }, null, 2) }],
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

    // List all rooms
    this.server.tool(
      'list_rooms',
      'List all rooms in the world with their coordinates and exit counts.',
      {},
      async () => {
        const allObjects = await this.manager.db.listAll(false);
        const roomProto = allObjects.find(o => o.properties?.name?.value === 'Room');
        if (!roomProto) {
          return { content: [{ type: 'text', text: 'Room prototype not found' }], isError: true };
        }

        const rooms = [];
        for (const obj of allObjects) {
          // Check if this object inherits from Room (with cycle protection)
          let parentId = obj.parent;
          let isRoom = obj._id === roomProto._id;
          const seen = new Set<number>();
          while (parentId !== -1 && !isRoom && !seen.has(parentId)) {
            seen.add(parentId);
            if (parentId === roomProto._id) {
              isRoom = true;
              break;
            }
            const parent = allObjects.find(o => o._id === parentId);
            if (!parent) break;
            parentId = parent.parent;
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
          content: [{ type: 'text', text: JSON.stringify({ count: rooms.length, rooms }, null, 2) }],
        };
      }
    );

    // List all players
    this.server.tool(
      'list_players',
      'List all player characters with their location and online status.',
      {},
      async () => {
        const allObjects = await this.manager.db.listAll(false);
        const playerProto = allObjects.find(o => o.properties?.name?.value === 'Player');
        if (!playerProto) {
          return { content: [{ type: 'text', text: 'Player prototype not found' }], isError: true };
        }

        const players = [];
        for (const obj of allObjects) {
          // Check if this object inherits from Player (with cycle protection)
          let parentId = obj.parent;
          let isPlayer = false;
          const seen = new Set<number>();
          while (parentId !== -1 && !seen.has(parentId)) {
            seen.add(parentId);
            if (parentId === playerProto._id) {
              isPlayer = true;
              break;
            }
            const parent = allObjects.find(o => o._id === parentId);
            if (!parent) break;
            parentId = parent.parent;
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
          content: [{ type: 'text', text: JSON.stringify({ count: players.length, players }, null, 2) }],
        };
      }
    );

    // Link two rooms with exits
    this.server.tool(
      'link_rooms',
      'Create an exit from one room to another, optionally with a return exit.',
      {
        fromRoomId: z.number().describe('Source room ID'),
        toRoomId: z.number().describe('Destination room ID'),
        exitDirection: z.string().describe('Exit direction (e.g., "north", "east", "up")'),
        returnDirection: z.string().optional().describe('Return exit direction (e.g., "south", "west", "down")'),
      },
      async ({ fromRoomId, toRoomId, exitDirection, returnDirection }) => {
        const aliasMap: Record<string, string[]> = {
          north: ['n'], south: ['s'], east: ['e'], west: ['w'],
          northeast: ['ne'], northwest: ['nw'], southeast: ['se'], southwest: ['sw'],
          up: ['u'], down: ['d', 'dn'], in: ['i'], out: ['o'],
        };

        const fromRoom = await this.manager.load(fromRoomId as ObjId);
        const toRoom = await this.manager.load(toRoomId as ObjId);

        if (!fromRoom) {
          return { content: [{ type: 'text', text: `Source room #${fromRoomId} not found` }], isError: true };
        }
        if (!toRoom) {
          return { content: [{ type: 'text', text: `Destination room #${toRoomId} not found` }], isError: true };
        }

        const allObjects = await this.manager.db.listAll(false);
        const exitProto = allObjects.find(o => o.properties?.name?.value === 'Exit');
        if (!exitProto) {
          return { content: [{ type: 'text', text: 'Exit prototype not found' }], isError: true };
        }

        const result: any = { exits: [] };

        // Create exit from source to destination
        const exitTo = await this.manager.create({
          parent: exitProto._id as ObjId,
          properties: {
            name: { type: 'string', value: exitDirection },
            aliases: { type: 'array', value: aliasMap[exitDirection.toLowerCase()] || [] },
            destRoom: { type: 'objref', value: toRoomId },
          },
          methods: {},
        });
        await fromRoom.call('addExit', exitTo);
        result.exits.push({ id: exitTo.id, direction: exitDirection, from: fromRoomId, to: toRoomId });

        // Create return exit if requested
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
          await toRoom.call('addExit', exitBack);
          result.exits.push({ id: exitBack.id, direction: returnDirection, from: toRoomId, to: fromRoomId });
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Remove an exit
    this.server.tool(
      'unlink',
      'Remove an exit from a room.',
      {
        roomId: z.number().describe('Room ID containing the exit'),
        exitId: z.number().describe('Exit object ID to remove'),
      },
      async ({ roomId, exitId }) => {
        const room = await this.manager.load(roomId as ObjId);
        if (!room) {
          return { content: [{ type: 'text', text: `Room #${roomId} not found` }], isError: true };
        }

        try {
          await room.call('removeExit', exitId);
          return {
            content: [{ type: 'text', text: `Exit #${exitId} removed from room #${roomId}` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error removing exit: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Move an object to a location
    this.server.tool(
      'move_object',
      'Move an object to a new location (room or container).',
      {
        objectId: z.number().describe('Object ID to move'),
        destinationId: z.number().describe('Destination room or container ID'),
      },
      async ({ objectId, destinationId }) => {
        const obj = await this.manager.load(objectId as ObjId);
        const dest = await this.manager.load(destinationId as ObjId);

        if (!obj) {
          return { content: [{ type: 'text', text: `Object #${objectId} not found` }], isError: true };
        }
        if (!dest) {
          return { content: [{ type: 'text', text: `Destination #${destinationId} not found` }], isError: true };
        }

        try {
          await obj.call('moveTo', dest);
          return {
            content: [{ type: 'text', text: `Moved #${objectId} (${obj.get('name')}) to #${destinationId} (${dest.get('name')})` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error moving object: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Recycle (delete) an object
    this.server.tool(
      'recycle_object',
      'Recycle (soft-delete) a MOO object. Removes it from the world and marks it for reuse.',
      {
        objectId: z.number().describe('Object ID to recycle'),
      },
      async ({ objectId }) => {
        const recycler = await this.getAlias('recycler');
        if (!recycler) {
          return {
            content: [{ type: 'text', text: 'Recycler not found' }],
            isError: true,
          };
        }

        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            content: [{ type: 'text', text: `Object #${objectId} not found` }],
            isError: true,
          };
        }

        const name = obj.get('name');
        try {
          await recycler.call('recycle', obj);
          return {
            content: [{ type: 'text', text: `Recycled #${objectId} (${name})` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error recycling: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Clone an object
    this.server.tool(
      'clone_object',
      'Create a deep copy of an object with all its properties. Optionally place at a location.',
      {
        objectId: z.number().describe('Object ID to clone'),
        locationId: z.number().optional().describe('Location to place the clone'),
      },
      async ({ objectId, locationId }) => {
        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            content: [{ type: 'text', text: `Object #${objectId} not found` }],
            isError: true,
          };
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
        if (locationId !== undefined) {
          props.location = { type: 'objref', value: locationId };
        }

        const clone = await this.manager.create({
          parent: raw.parent as ObjId,
          properties: props,
          methods: raw.methods || {},
        });

        return {
          content: [{ type: 'text', text: JSON.stringify({
            cloned: objectId,
            newId: clone.id,
            name: clone.get('name'),
            location: locationId ?? null,
          }, null, 2) }],
        };
      }
    );

    // Get exits from a room
    this.server.tool(
      'get_exits',
      'List all exits from a room with their destinations and any attached doors.',
      {
        roomId: z.number().describe('Room ID to get exits from'),
      },
      async ({ roomId }) => {
        const room = await this.manager.load(roomId as ObjId);
        if (!room) {
          return {
            content: [{ type: 'text', text: `Room #${roomId} not found` }],
            isError: true,
          };
        }

        const exitIds = (room as any).exits as number[] | undefined;
        if (!exitIds || exitIds.length === 0) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ roomId, roomName: (room as any).name, exits: [] }, null, 2) }],
          };
        }

        const exits = [];
        for (const exitId of exitIds) {
          const exit = await this.manager.load(exitId as ObjId);
          if (exit) {
            const destId = (exit as any).destRoom as number | undefined;
            let destName = null;
            if (typeof destId === 'number') {
              const dest = await this.manager.load(destId as ObjId);
              destName = dest ? (dest as any).name : null;
            }

            const doorId = (exit as any).door as number | undefined;
            let doorInfo = null;
            if (typeof doorId === 'number') {
              const door = await this.manager.load(doorId as ObjId);
              if (door) {
                doorInfo = {
                  id: doorId,
                  name: (door as any).name,
                  open: (door as any).open,
                  locks: (door as any).locks || [],
                };
              }
            }

            exits.push({
              id: exitId,
              direction: (exit as any).name,
              aliases: (exit as any).aliases || [],
              destRoom: destId,
              destName,
              door: doorInfo,
            });
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({
            roomId,
            roomName: (room as any).name,
            exits,
          }, null, 2) }],
        };
      }
    );

    // Spawn an item at a location
    this.server.tool(
      'spawn_item',
      'Create an instance of a prototype and place it at a location in one step.',
      {
        prototypeId: z.number().describe('Prototype object ID (or use alias with alias_lookup first)'),
        locationId: z.number().describe('Room or container ID to place the item'),
        properties: z.record(z.any()).optional().describe('Override properties (name, description, etc.)'),
      },
      async ({ prototypeId, locationId, properties }) => {
        const proto = await this.manager.load(prototypeId as ObjId);
        if (!proto) {
          return {
            content: [{ type: 'text', text: `Prototype #${prototypeId} not found` }],
            isError: true,
          };
        }

        const location = await this.manager.load(locationId as ObjId);
        if (!location) {
          return {
            content: [{ type: 'text', text: `Location #${locationId} not found` }],
            isError: true,
          };
        }

        // Build properties with location
        const props: Record<string, any> = {
          location: { type: 'objref', value: locationId },
        };

        // Add any override properties
        if (properties) {
          for (const [key, value] of Object.entries(properties)) {
            if (typeof value === 'string') {
              props[key] = { type: 'string', value };
            } else if (typeof value === 'number') {
              props[key] = { type: 'number', value };
            } else if (typeof value === 'boolean') {
              props[key] = { type: 'boolean', value };
            } else if (Array.isArray(value)) {
              props[key] = { type: 'array', value };
            } else if (value && typeof value === 'object') {
              props[key] = { type: 'object', value };
            }
          }
        }

        const item = await this.manager.create({
          parent: prototypeId as ObjId,
          properties: props,
          methods: {},
        });

        return {
          content: [{ type: 'text', text: JSON.stringify({
            created: item.id,
            prototype: prototypeId,
            prototypeName: proto.get('name'),
            name: item.get('name'),
            location: locationId,
            locationName: location.get('name'),
          }, null, 2) }],
        };
      }
    );

    // Attach door to exit
    this.server.tool(
      'set_exit_door',
      'Create and attach a door to an exit, or attach an existing door.',
      {
        exitId: z.number().describe('Exit object ID'),
        doorId: z.number().optional().describe('Existing door ID (if omitted, creates new door)'),
        doorName: z.string().optional().describe('Name for new door (default: "door")'),
        doorDescription: z.string().optional().describe('Description for new door'),
        open: z.boolean().optional().describe('Whether door starts open (default: true)'),
      },
      async ({ exitId, doorId, doorName, doorDescription, open }) => {
        const exit = await this.manager.load(exitId as ObjId);
        if (!exit) {
          return {
            content: [{ type: 'text', text: `Exit #${exitId} not found` }],
            isError: true,
          };
        }

        let door;
        if (doorId !== undefined) {
          door = await this.manager.load(doorId as ObjId);
          if (!door) {
            return {
              content: [{ type: 'text', text: `Door #${doorId} not found` }],
              isError: true,
            };
          }
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
            parent: doorProto.id as ObjId,
            properties: {
              name: { type: 'string', value: doorName ?? 'door' },
              description: { type: 'string', value: doorDescription ?? 'A door.' },
              open: { type: 'boolean', value: open ?? true },
            },
            methods: {},
          });
        }

        // Attach door to exit
        exit.set('door', door.id);

        return {
          content: [{ type: 'text', text: JSON.stringify({
            exitId,
            exitName: exit.get('name'),
            doorId: door.id,
            doorName: door.get('name'),
            open: door.get('open'),
            created: doorId === undefined,
          }, null, 2) }],
        };
      }
    );

    // Get room contents with rich info
    this.server.tool(
      'get_room_info',
      'Get comprehensive room information: exits, contents, players, and objects.',
      {
        roomId: z.number().describe('Room ID'),
      },
      async ({ roomId }) => {
        const room = await this.manager.load(roomId as ObjId);
        if (!room) {
          return {
            content: [{ type: 'text', text: `Room #${roomId} not found` }],
            isError: true,
          };
        }

        const allObjects = await this.manager.db.listAll(false);

        // Find objects in this room
        const contents: Array<{ id: number; name: string; type: string }> = [];
        const players: Array<{ id: number; name: string; connected: boolean }> = [];

        // Get player prototype for checking
        const playerProto = allObjects.find(o => o.properties?.name?.value === 'Player');
        const playerProtoId = playerProto?._id;

        for (const obj of allObjects) {
          const loc = obj.properties?.location?.value;
          if (loc === roomId) {
            // Check if it's a player
            let isPlayer = false;
            if (playerProtoId) {
              let parentId = obj.parent;
              const seen = new Set<number>();
              while (parentId !== -1 && !seen.has(parentId)) {
                seen.add(parentId);
                if (parentId === playerProtoId) {
                  isPlayer = true;
                  break;
                }
                const parent = allObjects.find(o => o._id === parentId);
                if (!parent) break;
                parentId = parent.parent;
              }
            }

            if (isPlayer) {
              players.push({
                id: obj._id,
                name: obj.properties?.name?.value || '(unnamed)',
                connected: obj.properties?.connected?.value ?? false,
              });
            } else {
              // Determine type from parent chain
              const parentObj = allObjects.find(o => o._id === obj.parent);
              contents.push({
                id: obj._id,
                name: obj.properties?.name?.value || '(unnamed)',
                type: parentObj?.properties?.name?.value || 'object',
              });
            }
          }
        }

        // Get exits
        const exitIds = (room as any).exits as number[] | undefined;
        const exits: Array<{ direction: string; destId: number; destName: string }> = [];
        if (exitIds) {
          for (const exitId of exitIds) {
            const exit = await this.manager.load(exitId as ObjId);
            if (exit) {
              const destId = (exit as any).destRoom as number;
              const dest = destId ? await this.manager.load(destId as ObjId) : null;
              exits.push({
                direction: (exit as any).name as string,
                destId,
                destName: dest ? (dest as any).name as string : '(unknown)',
              });
            }
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({
            id: roomId,
            name: (room as any).name,
            description: (room as any).description,
            coordinates: {
              x: (room as any).x ?? 0,
              y: (room as any).y ?? 0,
              z: (room as any).z ?? 0,
            },
            exits,
            players,
            contents,
          }, null, 2) }],
        };
      }
    );

    // Describe object as player would see it
    this.server.tool(
      'describe_object',
      'Get the runtime description of an object as a player would see it (calls describe() method).',
      {
        objectId: z.number().describe('Object ID'),
      },
      async ({ objectId }) => {
        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            content: [{ type: 'text', text: `Object #${objectId} not found` }],
            isError: true,
          };
        }

        try {
          const description = await obj.call('describe');
          return {
            content: [{ type: 'text', text: typeof description === 'string' ? description : JSON.stringify(description, null, 2) }],
          };
        } catch (err) {
          // Fall back to basic description property
          return {
            content: [{ type: 'text', text: `${obj.get('name')}\n${obj.get('description') || 'You see nothing special.'}` }],
          };
        }
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

    // ═══════════════════════════════════════════════════════════════════
    // CONSOLIDATED PLOT TOOL
    // ═══════════════════════════════════════════════════════════════════

    this.server.tool(
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
        reason: z.string().optional().describe('Reason for close/complete/fail'),
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
        expiresAt: z.string().optional().describe('ISO timestamp for job expiration'),
      },
      async (params) => {
        const { action, plotId, jobId, name, status, reason, message, from, metadata, key, value, query, limit, phases, phaseId, targetId, eventName, filter, expiresAt } = params;

        const plotDB = await this.getPlotDB();
        const err = (msg: string) => ({ content: [{ type: 'text' as const, text: msg }], isError: true });
        const ok = (data: any) => ({ content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(this.serializeValue(data), null, 2) }] });

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
              if (!plotProto || !recycler) return err('Plot system not initialized');

              const newPlot = await recycler.call('create', {
                parent: plotProto.id,
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
              const plots = status ? await plotDB.call('byStatus', status) : await plotDB.call('all');
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
              if (!status || !['completed', 'abandoned', 'failed'].includes(status)) {
                return err('status required: completed, abandoned, or failed');
              }
              const p = r.plot!;
              await p.call('setMetadata', 'status', status);
              await p.call('setMetadata', 'closedAt', new Date().toISOString());
              if (reason) await p.call('setMetadata', 'closeReason', reason);
              await p.call('addEvent', { from: 'system', message: `Plot ${status}: ${reason || 'No reason given'}` });
              return ok({ closed: true, plotId, status });
            }

            case 'set_metadata': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!key) return err('key required');
              await r.plot!.call('setMetadata', key, value);
              return ok({ set: true, plotId, key, value });
            }

            case 'add_event': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!message) return err('message required');
              await r.plot!.call('addEvent', {
                from: from || 'handler',
                message,
                ...(metadata ? { metadata } : {}),
              });
              return ok({ added: true, plotId });
            }

            case 'get_events': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              let events = await r.plot!.call('getEventLog') as any[];
              if (limit) events = events.slice(-limit);
              return ok({ plotId, count: events.length, events });
            }

            // ─────────────────────────────────────────────────────────────
            // PHASE MANAGEMENT
            // ─────────────────────────────────────────────────────────────

            case 'set_phases': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!phases || !Array.isArray(phases)) return err('phases array required');
              const result = await r.plot!.call('setPhases', phases) as any[];
              return ok({ set: true, plotId, phaseCount: result.length, phases: result });
            }

            case 'get_phases': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              const result = await r.plot!.call('getPhases');
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
              await r.plot!.call('createJob', jobId, options);
              return ok({ created: true, plotId, jobId });
            }

            case 'get_job': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const job = await r.plot!.call('getJob', jobId);
              if (!job) return err(`Job '${jobId}' not found`);
              return ok({ plotId, jobId, ...job });
            }

            case 'complete_job': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const result = await r.plot!.call('completeJob', jobId, reason || 'Completed') as any;
              if (result.success === false) return err(result.error || 'Failed to complete job');
              return ok({ completed: true, plotId, jobId });
            }

            case 'fail_job': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const result = await r.plot!.call('failJob', jobId, reason || 'Failed') as any;
              if (result.success === false) return err(result.error || 'Failed to fail job');
              return ok({ failed: true, plotId, jobId });
            }

            // ─────────────────────────────────────────────────────────────
            // JOB PHASE TRACKING
            // ─────────────────────────────────────────────────────────────

            case 'get_job_phase': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const result = await r.plot!.call('getJobPhase', jobId) as Record<string, unknown>;
              return ok({ plotId, jobId, ...result });
            }

            case 'advance_phase': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              const result = await r.plot!.call('advanceJobPhase', jobId, 'completed') as Record<string, unknown>;
              return ok({ plotId, jobId, ...result });
            }

            case 'set_phase': {
              const r = await loadPlot(plotId);
              if (r.error) return err(r.error);
              if (!jobId) return err('jobId required');
              if (!phaseId) return err('phaseId required');
              await r.plot!.call('setJobPhase', jobId, phaseId);
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
              await r.plot!.call('registerJobHook', jobId, targetId, eventName, filter || {});
              return ok({ registered: true, plotId, jobId, targetId, eventName });
            }

            // ─────────────────────────────────────────────────────────────
            // QUEUE
            // ─────────────────────────────────────────────────────────────

            case 'next': {
              if (!plotDB) return err('PlotDB not found');
              const plot = await plotDB.call('getNext');
              if (!plot) return ok({ plot: null, message: 'No jobs need attention' });

              // Get current phase info for any active jobs
              const jobs = (plot as any).jobs || {};
              const jobsWithPhases: any = {};
              for (const [jid, job] of Object.entries(jobs) as [string, any][]) {
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
              return err(`Unknown action: ${action}. See tool description for available actions.`);
          }
        } catch (e) {
          return err(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════
    // AI TOOL (Consolidated)
    // ═══════════════════════════════════════════════════════════════════════

    this.server.tool(
      'ai',
      `Consolidated AI-controlled human management tool.

ACTIONS:
  spawn   - Create a new AI-controlled human (role, name?, description?, locationId?, sex?, age?, personality?, history?)
  despawn - Remove an AI human (humanId, recycle?)
  list    - List all AI humans (role?)
  info    - Get detailed AI human info (humanId)
  do      - Execute a command as AI human (humanId, command)
  look    - Get what AI human sees (humanId)

PROFILE ACTIONS (for AI agent context):
  profile        - Get full NPC profile (humanId) - returns personality, history, notes, memories
  setPersonality - Set personality traits (humanId, personality)
  setHistory     - Set backstory/history (humanId, history)

MEMORY ACTIONS (for persistent critical memories):
  remember - Store a critical memory (humanId, text, importance?, tags?)
  recall   - Get memories for an NPC (humanId, importance?, tag?, limit?)
  forget   - Remove a memory by index (humanId, index)
  memories - Get formatted memory summary for an NPC (humanId, criticalOnly?)`,
      {
        action: z.string().describe('Action to perform (see help above)'),
        role: z.string().optional().describe('Role for this AI (e.g., "guard", "shopkeeper")'),
        name: z.string().optional().describe('Name of the human'),
        description: z.string().optional().describe('Description of the human'),
        locationId: z.number().optional().describe('Room ID to place the human'),
        sex: z.enum(['male', 'female', 'non-binary']).optional().describe('Sex (random if not specified)'),
        age: z.number().optional().describe('Age in years (random 18-65 if not specified)'),
        humanId: z.number().optional().describe('Human object ID'),
        command: z.string().optional().describe('Command to execute'),
        recycle: z.boolean().optional().describe('Whether to recycle on despawn (default: true)'),
        // Profile action parameters
        personality: z.union([z.string(), z.object({
          traits: z.array(z.string()).optional(),
          quirks: z.array(z.string()).optional(),
          values: z.array(z.string()).optional(),
          fears: z.array(z.string()).optional(),
          motivations: z.array(z.string()).optional(),
        })]).optional().describe('Personality: string description or { traits, quirks, values, fears, motivations }'),
        history: z.union([z.string(), z.object({
          backstory: z.string().optional(),
          events: z.array(z.string()).optional(),
          secrets: z.array(z.string()).optional(),
          relationships: z.record(z.string()).optional(),
        })]).optional().describe('History: string description or { backstory, events, secrets, relationships }'),
        // Memory action parameters
        text: z.string().optional().describe('Memory text to store'),
        importance: z.enum(['critical', 'important', 'normal']).optional().describe('Memory importance level'),
        tags: z.array(z.string()).optional().describe('Tags for categorizing the memory'),
        tag: z.string().optional().describe('Filter memories by tag'),
        index: z.number().optional().describe('Memory index to remove (0 = most recent)'),
        limit: z.number().optional().describe('Max memories to return'),
        criticalOnly: z.boolean().optional().describe('Only return critical memories'),
      },
      async ({ action, role, name, description, locationId, sex, age, humanId, command, recycle, personality, history, text, importance, tags, tag, index, limit, criticalOnly }) => {
        const aiRegistry = await this.getAlias('ai');
        if (!aiRegistry) {
          return {
            content: [{ type: 'text', text: 'AI registry not found - system not initialized' }],
            isError: true,
          };
        }

        const ok = (data: unknown) => ({
          content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(this.serializeValue(data), null, 2) }],
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
              return ok({ spawned: true, id: human.id, name: human.name, role });
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
                  roleStr = typeof info.role === 'string' ? info.role : (info.role?.value || 'unknown');
                }

                results.push({
                  id,
                  name: loaded ? String((loaded as any).name || 'Unknown') : 'Unknown',
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
              const match = await human.call('matchVerb', trimmed) as {
                error?: string;
                handler?: any;
                verbInfo?: { method: string };
                args?: any[];
              } | null;

              if (match && match.error) {
                return ok({ output: match.error });
              }

              if (match && match.handler && match.verbInfo) {
                const result = await match.handler.callVerb(
                  match.verbInfo.method,
                  null,
                  human,
                  trimmed,
                  match.args
                );
                return ok({ output: result !== undefined ? String(result) : '(no output)' });
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
                const exitId = typeof exitRef === 'string' ? parseInt(exitRef.replace('#', ''), 10) : exitRef;
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
                if ((obj as any).conscious !== undefined || (obj as any).playername) {
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
              const result = await aiRegistry.call('setPersonality', humanId, personality);
              return ok(result);
            }

            case 'setHistory': {
              if (humanId === undefined) return err('humanId required');
              if (!history) return err('history required');
              const result = await aiRegistry.call('setHistory', humanId, history);
              return ok(result);
            }

            // ═══════════════════════════════════════════════════════════════
            // MEMORY ACTIONS
            // ═══════════════════════════════════════════════════════════════

            case 'remember': {
              if (humanId === undefined) return err('humanId required');
              if (!text) return err('text required');

              const result = await aiRegistry.call('remember', humanId, text, importance || 'normal', tags || []);
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

              const summary = await aiRegistry.call('getMemorySummary', humanId, options);
              return ok({ humanId, summary: summary || '(no memories)' });
            }

            default:
              return err(`Unknown action: ${action}. Valid: spawn, despawn, list, info, do, look, profile, setPersonality, setHistory, remember, recall, forget, memories`);
          }
        } catch (error) {
          return err(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    );

    // Old individual plot/job tools have been consolidated into the 'plot' tool above
    // Use: plot action="create" name="..." for creating plots
    // Use: plot action="create_job" plotId=N jobId="..." for creating jobs
    // etc. - see the consolidated 'plot' tool help for all actions

    // ═══════════════════════════════════════════════════════════════════
    // NOTES TOOL (Consolidated)
    // ═══════════════════════════════════════════════════════════════════

    this.server.tool(
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
        objectId: z.number().optional().describe('Object ID'),
        text: z.string().optional().describe('Note text content'),
        author: z.string().optional().describe('Author name (default: "mcp")'),
        tags: z.array(z.string()).optional().describe('Tags for categorization'),
        index: z.number().optional().describe('Note index to delete'),
        query: z.string().optional().describe('Search query'),
        tag: z.string().optional().describe('Filter by tag'),
        limit: z.number().optional().describe('Max results (default 50)'),
      },
      async ({ action, objectId, text, author, tags, index, query, tag, limit }) => {
        const notesSystem = await this.getAlias('notes');
        if (!notesSystem) {
          return {
            content: [{ type: 'text', text: 'Notes system not available' }],
            isError: true,
          };
        }

        const ok = (data: unknown) => ({
          content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(this.serializeValue(data), null, 2) }],
        });
        const err = (msg: string) => ({
          content: [{ type: 'text' as const, text: msg }],
          isError: true,
        });

        try {
          switch (action) {
            case 'get': {
              if (objectId === undefined) return err('objectId required');
              const result = await notesSystem.call('get', objectId);
              return ok({ objectId, count: result.length, notes: result });
            }

            case 'add': {
              if (objectId === undefined) return err('objectId required');
              if (!text) return err('text required');
              const result = await notesSystem.call('add', objectId, text, author || 'mcp', tags || []);
              if (result.success) {
                return ok({ added: true, objectId, index: result.index });
              } else {
                return err(`Error: ${result.error}`);
              }
            }

            case 'append': {
              if (objectId === undefined) return err('objectId required');
              if (!tag) return err('tag required (to find note to append to)');
              if (!text) return err('text required');

              // Get existing notes
              const existingNotes = await notesSystem.call('get', objectId) as Array<{
                text: string;
                author?: string;
                tags?: string[];
                timestamp?: string;
              }>;

              // Find note with matching tag
              const noteIndex = existingNotes.findIndex(n => n.tags?.includes(tag));

              if (noteIndex >= 0) {
                // Append to existing note
                const oldNote = existingNotes[noteIndex];
                const newText = oldNote.text + '\n' + text;
                const noteTags = oldNote.tags || [tag];

                // Delete old, add updated
                await notesSystem.call('delete', objectId, noteIndex);
                const result = await notesSystem.call('add', objectId, newText, author || oldNote.author || 'mcp', noteTags);

                if (result.success) {
                  return ok({ appended: true, objectId, tag, wasNew: false, index: result.index });
                } else {
                  return err(`Error appending: ${result.error}`);
                }
              } else {
                // Create new note with this tag
                const result = await notesSystem.call('add', objectId, text, author || 'mcp', [tag]);

                if (result.success) {
                  return ok({ appended: true, objectId, tag, wasNew: true, index: result.index });
                } else {
                  return err(`Error creating: ${result.error}`);
                }
              }
            }

            case 'delete': {
              if (objectId === undefined) return err('objectId required');
              if (index === undefined) return err('index required');
              const result = await notesSystem.call('delete', objectId, index);
              if (result.success) {
                return ok({ deleted: true, objectId, index });
              } else {
                return err(`Error: ${result.error}`);
              }
            }

            case 'search': {
              const options: Record<string, unknown> = {};
              if (tag) options.tag = tag;
              if (author) options.author = author;
              if (limit) options.limit = limit;
              const results = await notesSystem.call('search', query || '', options);
              return ok({ count: results.length, results });
            }

            case 'list_objects': {
              const objects = await notesSystem.call('listObjects');
              const enriched = [];
              for (const obj of objects) {
                const loaded = await this.manager.load(obj.objectId as ObjId);
                enriched.push({
                  objectId: obj.objectId,
                  name: loaded?.get('name') || 'Unknown',
                  noteCount: obj.count,
                });
              }
              return ok({ count: enriched.length, objects: enriched });
            }

            default:
              return err(`Unknown action: ${action}. Valid: get, add, append, delete, search, list_objects`);
          }
        } catch (error) {
          return err(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════
    // WORLD TOOL (Consolidated)
    // ═══════════════════════════════════════════════════════════════════

    this.server.tool(
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
          content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(this.serializeValue(data), null, 2) }],
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
                return err(`Parse error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
              }

              // Exclude recycled objects by default
              mongoQuery = { $and: [mongoQuery, { 'properties._deleted': { $ne: true } }] };

              // Execute query against MongoDB
              const db = (this.manager as any).db;
              if (!db || !db.objects) {
                return err('Database not available');
              }

              const collection = db.objects;
              const maxLimit = Math.min(limit || 50, 200);
              const skip = offset || 0;

              const cursor = collection.find(mongoQuery).skip(skip).limit(maxLimit);
              const docs = await cursor.toArray();

              // Format results - plain objects, no RuntimeObject conversion
              const results = docs.map((doc: any) => ({
                id: doc._id,
                parent: doc.parent,
                name: doc.properties?.name?.value || doc.properties?.name || 'Unknown',
                description: doc.properties?.description?.value || doc.properties?.description,
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
          return err(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    );

  }

  /**
   * Get an object by its alias
   */
  private async getAlias(alias: string): Promise<any> {
    const objectManager = await this.manager.load(0 as ObjId);
    if (!objectManager) return null;

    const aliases = objectManager.get('aliases') as Record<string, number> | undefined;
    if (!aliases?.[alias]) return null;

    return this.manager.load(aliases[alias] as ObjId);
  }

  /**
   * Get the PlotDB object
   */
  private async getPlotDB(): Promise<any> {
    const objectManager = await this.manager.load(0 as ObjId);
    if (!objectManager) return null;

    const aliases = objectManager.get('aliases') as Record<string, number> | undefined;
    if (!aliases?.plotDB) return null;

    return this.manager.load(aliases.plotDB as ObjId);
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
      { description: 'List all registered object aliases' },
      async () => {
        const objectManager = await this.manager.load(0 as ObjId);
        if (!objectManager) {
          return {
            contents: [{
              uri: 'moo://aliases',
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'ObjectManager not found' }),
            }],
          };
        }

        const aliases = objectManager.get('aliases') as Record<string, number> | undefined;
        const sorted: Record<string, number> = {};
        if (aliases) {
          for (const key of Object.keys(aliases).sort()) {
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
      }
    );

    // Object by ID resource template
    this.server.resource(
      'object',
      new ResourceTemplate('moo://object/{id}', {
        list: undefined, // Don't enumerate all objects
        complete: {
          id: async (value: string) => {
            // Suggest some common object IDs for autocompletion
            const suggestions = ['0', '1', '2', '3', '4', '5'];
            return suggestions.filter(s => s.startsWith(value));
          }
        }
      }),
      { description: 'Get a MOO object by its ID' },
      async (_uri: URL, variables: { id?: string | string[] }) => {
        const idVar = variables.id;
        const idStr = Array.isArray(idVar) ? idVar[0] : idVar;
        const id = parseInt(idStr ?? '', 10);

        if (isNaN(id)) {
          return {
            contents: [{
              uri: `moo://object/${idStr}`,
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'Invalid object ID' }),
            }],
          };
        }

        const obj = await this.manager.load(id as ObjId);
        if (!obj) {
          return {
            contents: [{
              uri: `moo://object/${id}`,
              mimeType: 'application/json',
              text: JSON.stringify({ error: `Object #${id} not found` }),
            }],
          };
        }

        // Serialize the RuntimeObject for JSON output
        const raw = obj._getRaw();
        return {
          contents: [{
            uri: `moo://object/${id}`,
            mimeType: 'application/json',
            text: JSON.stringify({
              id: raw._id,
              name: obj.get('name'),
              parent: raw.parent,
              description: obj.get('description'),
              location: obj.get('location'),
              properties: Object.keys(raw.properties || {}),
              methods: Object.keys(raw.methods || {}),
            }, null, 2),
          }],
        };
      }
    );

    // Alias lookup resource template
    this.server.resource(
      'alias',
      new ResourceTemplate('moo://alias/{name}', {
        list: undefined, // Use moo://aliases to list all
        complete: {
          name: async (value: string) => {
            const objectManager = await this.manager.load(0 as ObjId);
            if (!objectManager) return [];
            const aliases = objectManager.get('aliases') as Record<string, number> | undefined;
            if (!aliases) return [];
            return Object.keys(aliases).filter(a => a.toLowerCase().startsWith(value.toLowerCase()));
          }
        }
      }),
      { description: 'Look up an object by its alias name' },
      async (_uri: URL, variables: { name?: string | string[] }) => {
        const nameVar = variables.name;
        const aliasName = Array.isArray(nameVar) ? nameVar[0] : nameVar;

        if (!aliasName) {
          return {
            contents: [{
              uri: 'moo://alias/',
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'Alias name required' }),
            }],
          };
        }

        const objectManager = await this.manager.load(0 as ObjId);
        if (!objectManager) {
          return {
            contents: [{
              uri: `moo://alias/${aliasName}`,
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'ObjectManager not found' }),
            }],
          };
        }

        const aliases = objectManager.get('aliases') as Record<string, number> | undefined;
        if (!aliases) {
          return {
            contents: [{
              uri: `moo://alias/${aliasName}`,
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'No aliases registered' }),
            }],
          };
        }

        const objectId = aliases[aliasName];
        if (objectId === undefined) {
          return {
            contents: [{
              uri: `moo://alias/${aliasName}`,
              mimeType: 'application/json',
              text: JSON.stringify({ error: `Alias '${aliasName}' not found` }),
            }],
          };
        }

        const obj = await this.manager.load(objectId as ObjId);
        if (!obj) {
          return {
            contents: [{
              uri: `moo://alias/${aliasName}`,
              mimeType: 'application/json',
              text: JSON.stringify({ error: `Object #${objectId} not found` }),
            }],
          };
        }

        return {
          contents: [{
            uri: `moo://alias/${aliasName}`,
            mimeType: 'application/json',
            text: JSON.stringify({
              alias: aliasName,
              objectId,
              name: obj.get('name'),
              parent: obj.getParent(),
              description: obj.get('description'),
            }, null, 2),
          }],
        };
      }
    );

    // Players resource
    this.server.resource(
      'players',
      'moo://players',
      { description: 'List all player characters' },
      async () => {
        const allObjects = await this.manager.db.listAll(false);
        const playerProto = allObjects.find(o => o.properties?.name?.value === 'Player');
        if (!playerProto) {
          return {
            contents: [{
              uri: 'moo://players',
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'Player prototype not found' }),
            }],
          };
        }

        const players = [];
        for (const obj of allObjects) {
          // Check if this object inherits from Player (with cycle protection)
          let parentId = obj.parent;
          let isPlayer = false;
          const seen = new Set<number>();
          while (parentId !== -1 && !seen.has(parentId)) {
            seen.add(parentId);
            if (parentId === playerProto._id) {
              isPlayer = true;
              break;
            }
            const parent = allObjects.find(o => o._id === parentId);
            if (!parent) break;
            parentId = parent.parent;
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
          contents: [{
            uri: 'moo://players',
            mimeType: 'application/json',
            text: JSON.stringify(players, null, 2),
          }],
        };
      }
    );

    // Plots resource
    this.server.resource(
      'plots',
      'moo://plots',
      { description: 'List all active plots' },
      async () => {
        try {
          const plotDB = await this.getPlotDB();
          if (!plotDB) {
            return {
              contents: [{
                uri: 'moo://plots',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'PlotDB not found' }),
              }],
            };
          }

          // Get active plots from the PlotDB
          const plots = await plotDB.call('active');
          const results = (plots || []).map((p: { id: number; name: string; events?: unknown[]; jobs?: Record<string, unknown>; metadata?: Record<string, unknown> }) => ({
            id: p.id,
            name: p.name,
            metadata: p.metadata || {},
            eventCount: (p.events || []).length,
            jobCount: Object.keys(p.jobs || {}).length,
          }));

          return {
            contents: [{
              uri: 'moo://plots',
              mimeType: 'application/json',
              text: JSON.stringify(results, null, 2),
            }],
          };
        } catch (err) {
          return {
            contents: [{
              uri: 'moo://plots',
              mimeType: 'application/json',
              text: JSON.stringify({ error: String(err) }),
            }],
          };
        }
      }
    );

    // AI humans resource
    this.server.resource(
      'ai',
      'moo://ai',
      { description: 'List all AI-controlled humans' },
      async () => {
        const objectManager = await this.manager.load(0 as ObjId);
        if (!objectManager) {
          return {
            contents: [{
              uri: 'moo://ai',
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'ObjectManager not found' }),
            }],
          };
        }

        const aliases = objectManager.get('aliases') as Record<string, number> | undefined;
        const aiId = aliases?.['ai'];
        if (!aiId) {
          return {
            contents: [{
              uri: 'moo://ai',
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'AI registry not found' }),
            }],
          };
        }

        try {
          const aiRegistry = await this.manager.load(aiId as ObjId);
          if (!aiRegistry) {
            return {
              contents: [{
                uri: 'moo://ai',
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'AI registry object not found' }),
              }],
            };
          }

          // Get all AI humans (returns array of objects, objrefs resolved)
          const humans = await aiRegistry.call('getAll') as Array<{ id: number; get: (prop: string) => unknown }>;

          // Extract details from each human object, including role from registry
          const aiHumans = await Promise.all(humans.map(async human => {
            if (!human) return null;
            // Get role from registry info
            const info = await aiRegistry.call('getInfo', human.id) as { role?: string } | null;
            return {
              id: human.id,
              name: human.get('name'),
              role: info?.role,
              location: human.get('location'),
            };
          }));
          const filtered = aiHumans.filter(h => h !== null);

          return {
            contents: [{
              uri: 'moo://ai',
              mimeType: 'application/json',
              text: JSON.stringify(filtered, null, 2),
            }],
          };
        } catch (err) {
          return {
            contents: [{
              uri: 'moo://ai',
              mimeType: 'application/json',
              text: JSON.stringify({ error: String(err) }),
            }],
          };
        }
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
