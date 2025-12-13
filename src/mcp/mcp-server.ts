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
   * Serialize a value for JSON output, converting RuntimeObjects to "#ID" format
   * This avoids circular reference issues with Proxy objects
   */
  private serializeValue(value: any, seen = new WeakSet()): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle RuntimeObject (has .id property and is an object)
    if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'number') {
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
          props.location = { type: 'number', value: locationId };
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
          location: { type: 'number', value: locationId },
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

    // === Plot/Job Tools ===

    // Get next job needing attention
    this.server.tool(
      'get_next_job',
      'Get the next plot/job needing attention from the FIFO queue. Returns the plot with event log and metadata, and bumps its attention timer by 24 hours.',
      {},
      async () => {
        const plotDB = await this.getPlotDB();
        if (!plotDB) {
          return {
            content: [{ type: 'text', text: 'PlotDB not found - plot system not initialized' }],
            isError: true,
          };
        }

        try {
          const plot = await plotDB.call('getNext');
          if (!plot) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ plot: null, message: 'No jobs need attention' }, null, 2) }],
            };
          }

          const result = {
            id: plot.id,
            name: plot.name,
            events: plot.events || [],
            metadata: plot.metadata || {},
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error getting next job: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Respond to a job
    this.server.tool(
      'respond_to_job',
      'Add an event to a plot as the city AI handler. Use this to progress the narrative, give instructions, or respond to player actions. Use metadata to track objects, locations, and state.',
      {
        plotId: z.number().describe('Plot object ID'),
        message: z.string().describe('The message/event to add to the plot'),
        metadata: z.record(z.any()).optional().describe('Arbitrary metadata (e.g., { createdObject: 56, deliveryTarget: 49 })'),
      },
      async ({ plotId, message, metadata }) => {
        const plot = await this.manager.load(plotId as ObjId);
        if (!plot) {
          return {
            content: [{ type: 'text', text: `Plot #${plotId} not found` }],
            isError: true,
          };
        }

        try {
          await plot.call('addEvent', {
            from: 'handler',
            message: message,
            ...(metadata ? { metadata } : {}),
          });
          return {
            content: [{ type: 'text', text: `Event added to plot #${plotId}` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error adding event: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // List active jobs
    this.server.tool(
      'list_active_jobs',
      'List all active plots/jobs with their metadata. Shows which jobs exist and their current state.',
      {},
      async () => {
        const plotDB = await this.getPlotDB();
        if (!plotDB) {
          return {
            content: [{ type: 'text', text: 'PlotDB not found - plot system not initialized' }],
            isError: true,
          };
        }

        try {
          const plots = await plotDB.call('active');
          const results = [];

          for (const plot of plots || []) {
            results.push({
              id: plot.id,
              name: plot.name,
              metadata: plot.metadata || {},
              eventCount: (plot.events || []).length,
            });
          }

          return {
            content: [{ type: 'text', text: JSON.stringify({ count: results.length, jobs: results }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error listing jobs: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Set job metadata
    this.server.tool(
      'set_job_metadata',
      'Set or update metadata on a plot/job. Use for tracking status, state, flags, etc.',
      {
        plotId: z.number().describe('Plot object ID'),
        key: z.string().describe('Metadata key'),
        value: z.any().describe('Metadata value (any JSON-serializable value, or null to delete)'),
      },
      async ({ plotId, key, value }) => {
        const plot = await this.manager.load(plotId as ObjId);
        if (!plot) {
          return {
            content: [{ type: 'text', text: `Plot #${plotId} not found` }],
            isError: true,
          };
        }

        try {
          await plot.call('setMetadata', key, value);
          return {
            content: [{ type: 'text', text: `Set metadata '${key}' on plot #${plotId}` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error setting metadata: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════
    // AI REGISTRY TOOLS
    // ═══════════════════════════════════════════════════════════════════════

    // Spawn AI-controlled human
    this.server.tool(
      'spawn_ai',
      'Spawn a new AI-controlled human. Creates a full human with body, registers in $.ai by role.',
      {
        role: z.string().describe('Role for this AI (e.g., "guard", "shopkeeper", "bartender")'),
        name: z.string().optional().describe('Name of the human'),
        description: z.string().optional().describe('Description of the human'),
        locationId: z.number().optional().describe('Room ID to place the human'),
        sex: z.enum(['male', 'female', 'non-binary']).optional().describe('Sex (random if not specified)'),
        age: z.number().optional().describe('Age in years (random 18-65 if not specified)'),
      },
      async ({ role, name, description, locationId, sex, age }) => {
        const ai = await this.getAlias('ai');
        if (!ai) {
          return {
            content: [{ type: 'text', text: 'AI registry not found - system not initialized' }],
            isError: true,
          };
        }

        try {
          const options: any = {};
          if (name) options.name = name;
          if (description) options.description = description;
          if (locationId !== undefined) options.location = locationId;
          if (sex) options.sex = sex;
          if (age !== undefined) options.age = age;

          const human = await ai.call('spawn', role, options);
          return {
            content: [{ type: 'text', text: `Spawned AI human #${human.id} (${human.name}) as ${role}` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error spawning AI: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Despawn AI-controlled human
    this.server.tool(
      'despawn_ai',
      'Remove an AI-controlled human. Unregisters from $.ai and optionally recycles the object.',
      {
        humanId: z.number().describe('Human object ID to despawn'),
        recycle: z.boolean().optional().describe('Whether to recycle the object (default: true)'),
      },
      async ({ humanId, recycle }) => {
        const ai = await this.getAlias('ai');
        if (!ai) {
          return {
            content: [{ type: 'text', text: 'AI registry not found' }],
            isError: true,
          };
        }

        try {
          await ai.call('despawn', humanId, recycle !== false);
          return {
            content: [{ type: 'text', text: `Despawned AI human #${humanId}` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error despawning AI: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // List AI-controlled humans
    this.server.tool(
      'list_ai',
      'List all AI-controlled humans, optionally filtered by role.',
      {
        role: z.string().optional().describe('Filter by role (e.g., "guard")'),
      },
      async ({ role }) => {
        const ai = await this.getAlias('ai');
        if (!ai) {
          return {
            content: [{ type: 'text', text: 'AI registry not found' }],
            isError: true,
          };
        }

        try {
          let humanIds: number[];
          if (role) {
            humanIds = await ai.call('getByRole', role);
          } else {
            humanIds = await ai.call('getAll');
          }

          const results = [];
          for (const id of humanIds || []) {
            const human = await this.manager.load(id as ObjId);
            const info = await ai.call('getInfo', id);
            results.push({
              id,
              name: human ? (human as any).name : 'Unknown',
              role: info?.role,
              location: human ? (human as any).location : null,
            });
          }

          return {
            content: [{ type: 'text', text: JSON.stringify({ count: results.length, humans: results }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error listing AI: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Get AI human info
    this.server.tool(
      'get_ai_info',
      'Get information about an AI-controlled human including role and spawn metadata.',
      {
        humanId: z.number().describe('Human object ID'),
      },
      async ({ humanId }) => {
        const ai = await this.getAlias('ai');
        if (!ai) {
          return {
            content: [{ type: 'text', text: 'AI registry not found' }],
            isError: true,
          };
        }

        try {
          const isAi = await ai.call('isAiControlled', humanId);
          if (!isAi) {
            return {
              content: [{ type: 'text', text: `Human #${humanId} is not AI-controlled` }],
            };
          }

          const info = await ai.call('getInfo', humanId);
          const human = await this.manager.load(humanId as ObjId);

          return {
            content: [{ type: 'text', text: JSON.stringify({
              id: humanId,
              name: human ? (human as any).name : 'Unknown',
              ...info,
            }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error getting AI info: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════
    // PLOT MANAGEMENT TOOLS
    // ═══════════════════════════════════════════════════════════════════════

    // Create a new plot
    this.server.tool(
      'create_plot',
      'Create a new plot (narrative container). Use for AI-initiated storylines.',
      {
        name: z.string().describe('Name of the plot'),
        metadata: z.record(z.any()).optional().describe('Initial metadata (participants, status, etc.)'),
      },
      async ({ name, metadata }) => {
        const plotDB = await this.getPlotDB();
        const plotProto = await this.getAlias('plot');
        const recycler = await this.getAlias('recycler');

        if (!plotProto || !recycler) {
          return {
            content: [{ type: 'text', text: 'Plot system not initialized' }],
            isError: true,
          };
        }

        try {
          // Create new plot instance
          const newPlot = await recycler.call('create', {
            parent: plotProto.id,
            properties: {
              name: name,
              description: 'AI-created plot',
              events: [],
              metadata: {
                ...(metadata || {}),
                created: new Date().toISOString(),
                needsAttentionAt: new Date().toISOString(),
              },
            },
          });

          // Register with plotDB
          if (plotDB) {
            await plotDB.call('register', newPlot);
          }

          return {
            content: [{ type: 'text', text: `Created plot #${newPlot.id} "${name}"` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error creating plot: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Close/complete a plot
    this.server.tool(
      'close_plot',
      'Close a plot by setting its status. Use "completed", "abandoned", or "failed".',
      {
        plotId: z.number().describe('Plot object ID'),
        status: z.enum(['completed', 'abandoned', 'failed']).describe('Final status'),
        reason: z.string().optional().describe('Reason for closing'),
      },
      async ({ plotId, status, reason }) => {
        const plot = await this.manager.load(plotId as ObjId);
        if (!plot) {
          return {
            content: [{ type: 'text', text: `Plot #${plotId} not found` }],
            isError: true,
          };
        }

        try {
          await plot.call('setMetadata', 'status', status);
          await plot.call('setMetadata', 'closedAt', new Date().toISOString());
          if (reason) {
            await plot.call('setMetadata', 'closeReason', reason);
          }
          await plot.call('addEvent', {
            from: 'system',
            message: `Plot ${status}: ${reason || 'No reason given'}`,
          });

          return {
            content: [{ type: 'text', text: `Plot #${plotId} marked as ${status}` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error closing plot: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Get plot events
    this.server.tool(
      'get_plot_events',
      'Get the event log for a plot. Returns all narrative events.',
      {
        plotId: z.number().describe('Plot object ID'),
        limit: z.number().optional().describe('Limit to last N events'),
      },
      async ({ plotId, limit }) => {
        const plot = await this.manager.load(plotId as ObjId);
        if (!plot) {
          return {
            content: [{ type: 'text', text: `Plot #${plotId} not found` }],
            isError: true,
          };
        }

        try {
          let events: any[] = await plot.call('getEventLog') as any[];
          if (limit && events.length > limit) {
            events = events.slice(-limit);
          }

          return {
            content: [{ type: 'text', text: JSON.stringify({
              plotId,
              name: (plot as any).name,
              eventCount: events.length,
              events,
            }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error getting events: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Add event to plot
    this.server.tool(
      'add_plot_event',
      'Add an event to a plot\'s narrative log.',
      {
        plotId: z.number().describe('Plot object ID'),
        message: z.string().describe('Event message'),
        from: z.enum(['handler', 'system']).optional().describe('Event source (default: handler)'),
      },
      async ({ plotId, message, from }) => {
        const plot = await this.manager.load(plotId as ObjId);
        if (!plot) {
          return {
            content: [{ type: 'text', text: `Plot #${plotId} not found` }],
            isError: true,
          };
        }

        try {
          await plot.call('addEvent', {
            from: from || 'handler',
            message,
          });

          return {
            content: [{ type: 'text', text: `Added event to plot #${plotId}` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error adding event: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // List all plots
    this.server.tool(
      'list_plots',
      'List all plots with optional status filter.',
      {
        status: z.enum(['active', 'completed', 'abandoned', 'failed']).optional().describe('Filter by status'),
        limit: z.number().optional().describe('Max results to return'),
      },
      async ({ status, limit }) => {
        const plotDB = await this.getPlotDB();
        if (!plotDB) {
          return {
            content: [{ type: 'text', text: 'PlotDB not found' }],
            isError: true,
          };
        }

        try {
          let plots;
          if (status) {
            plots = await plotDB.call('byStatus', status);
          } else {
            plots = await plotDB.call('all');
          }

          const results = [];
          for (const plot of plots || []) {
            if (limit && results.length >= limit) break;
            const meta = plot.metadata || {};
            results.push({
              id: plot.id,
              name: plot.name,
              status: meta.status || 'active',
              participants: meta.participants || [],
              eventCount: (plot.events || []).length,
              created: meta.created,
              needsAttentionAt: meta.needsAttentionAt,
            });
          }

          return {
            content: [{ type: 'text', text: JSON.stringify({ count: results.length, plots: results }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error listing plots: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Get plots by player
    this.server.tool(
      'plots_by_player',
      'Get all plots involving a specific player.',
      {
        playerId: z.number().describe('Player object ID'),
        activeOnly: z.boolean().optional().describe('Only return active plots'),
      },
      async ({ playerId, activeOnly }) => {
        const plotDB = await this.getPlotDB();
        if (!plotDB) {
          return {
            content: [{ type: 'text', text: 'PlotDB not found' }],
            isError: true,
          };
        }

        try {
          const plots = await plotDB.call('byPlayer', playerId);
          const results = [];

          for (const plot of plots || []) {
            const meta = plot.metadata || {};
            const status = meta.status || 'active';

            if (activeOnly && status !== 'active' && status !== 'in_progress') {
              continue;
            }

            results.push({
              id: plot.id,
              name: plot.name,
              status,
              eventCount: (plot.events || []).length,
              created: meta.created,
            });
          }

          return {
            content: [{ type: 'text', text: JSON.stringify({ playerId, count: results.length, plots: results }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error getting player plots: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Search plots
    this.server.tool(
      'search_plots',
      'Search plot event logs for text. Returns plots with matching content.',
      {
        query: z.string().describe('Text to search for in plot events'),
        limit: z.number().optional().describe('Max results to return'),
      },
      async ({ query, limit }) => {
        const plotDB = await this.getPlotDB();
        if (!plotDB) {
          return {
            content: [{ type: 'text', text: 'PlotDB not found' }],
            isError: true,
          };
        }

        try {
          const plots = await plotDB.call('search', query);
          const results = [];

          for (const plot of plots || []) {
            if (limit && results.length >= limit) break;
            const meta = plot.metadata || {};
            results.push({
              id: plot.id,
              name: plot.name,
              status: meta.status || 'active',
              eventCount: (plot.events || []).length,
            });
          }

          return {
            content: [{ type: 'text', text: JSON.stringify({ query, count: results.length, plots: results }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error searching plots: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════
    // JOB MANAGEMENT TOOLS (within plots)
    // ═══════════════════════════════════════════════════════════════════════

    // Create a job within a plot
    this.server.tool(
      'create_job',
      'Create a job (task) within a plot. Jobs can have hooks that watch for game events.',
      {
        plotId: z.number().describe('Plot object ID'),
        jobId: z.string().describe('Unique job identifier within the plot'),
        expiresAt: z.string().optional().describe('ISO timestamp when job expires'),
        metadata: z.record(z.any()).optional().describe('Job-specific metadata'),
      },
      async ({ plotId, jobId, expiresAt, metadata }) => {
        const plot = await this.manager.load(plotId as ObjId);
        if (!plot) {
          return {
            content: [{ type: 'text', text: `Plot #${plotId} not found` }],
            isError: true,
          };
        }

        try {
          const options: any = {};
          if (expiresAt) options.expiresAt = expiresAt;
          if (metadata) options.metadata = metadata;

          await plot.call('createJob', jobId, options);

          return {
            content: [{ type: 'text', text: `Created job '${jobId}' in plot #${plotId}` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error creating job: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Complete a job
    this.server.tool(
      'complete_job',
      'Mark a job as completed. Automatically unregisters all hooks for this job.',
      {
        plotId: z.number().describe('Plot object ID'),
        jobId: z.string().describe('Job identifier'),
        reason: z.string().optional().describe('Completion reason'),
      },
      async ({ plotId, jobId, reason }) => {
        const plot = await this.manager.load(plotId as ObjId);
        if (!plot) {
          return {
            content: [{ type: 'text', text: `Plot #${plotId} not found` }],
            isError: true,
          };
        }

        try {
          const result = await plot.call('completeJob', jobId, reason || 'Completed') as { success: boolean; error?: string };
          if (result.success) {
            return {
              content: [{ type: 'text', text: `Completed job '${jobId}' in plot #${plotId}` }],
            };
          } else {
            return {
              content: [{ type: 'text', text: `Could not complete job: ${result.error}` }],
              isError: true,
            };
          }
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error completing job: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Fail a job
    this.server.tool(
      'fail_job',
      'Mark a job as failed. Automatically unregisters all hooks for this job.',
      {
        plotId: z.number().describe('Plot object ID'),
        jobId: z.string().describe('Job identifier'),
        reason: z.string().optional().describe('Failure reason'),
      },
      async ({ plotId, jobId, reason }) => {
        const plot = await this.manager.load(plotId as ObjId);
        if (!plot) {
          return {
            content: [{ type: 'text', text: `Plot #${plotId} not found` }],
            isError: true,
          };
        }

        try {
          const result = await plot.call('failJob', jobId, reason || 'Failed') as { success: boolean; error?: string };
          if (result.success) {
            return {
              content: [{ type: 'text', text: `Failed job '${jobId}' in plot #${plotId}` }],
            };
          } else {
            return {
              content: [{ type: 'text', text: `Could not fail job: ${result.error}` }],
              isError: true,
            };
          }
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error failing job: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Register a hook for a job
    this.server.tool(
      'register_job_hook',
      'Register a hook to watch for events on a target object. When the event fires with matching filter, the job is notified.',
      {
        plotId: z.number().describe('Plot object ID'),
        jobId: z.string().describe('Job identifier'),
        targetId: z.number().describe('Object ID to watch'),
        eventName: z.string().describe('Event name to watch for (e.g., "oneTimeCodeUsed", "itemDeposited")'),
        filter: z.record(z.any()).optional().describe('Filter conditions - event must match all key/values'),
      },
      async ({ plotId, jobId, targetId, eventName, filter }) => {
        const plot = await this.manager.load(plotId as ObjId);
        if (!plot) {
          return {
            content: [{ type: 'text', text: `Plot #${plotId} not found` }],
            isError: true,
          };
        }

        try {
          await plot.call('registerJobHook', jobId, targetId, eventName, filter || {});

          return {
            content: [{ type: 'text', text: `Registered hook: job '${jobId}' watching #${targetId} for '${eventName}'` }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error registering hook: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // Get job info
    this.server.tool(
      'get_job',
      'Get information about a specific job within a plot.',
      {
        plotId: z.number().describe('Plot object ID'),
        jobId: z.string().describe('Job identifier'),
      },
      async ({ plotId, jobId }) => {
        const plot = await this.manager.load(plotId as ObjId);
        if (!plot) {
          return {
            content: [{ type: 'text', text: `Plot #${plotId} not found` }],
            isError: true,
          };
        }

        try {
          const job = await plot.call('getJob', jobId);
          if (!job) {
            return {
              content: [{ type: 'text', text: `Job '${jobId}' not found in plot #${plotId}` }],
              isError: true,
            };
          }

          return {
            content: [{ type: 'text', text: JSON.stringify({ plotId, jobId, ...job }, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error getting job: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
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
