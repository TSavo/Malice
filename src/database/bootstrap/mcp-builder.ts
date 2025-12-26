/**
 * MCP Builder - Creates MOO objects for the code-first MCP architecture
 *
 * Implements Anthropic's "code execution with MCP" pattern where:
 * - Tools become MOO objects with execute() methods
 * - Claude writes MOO code instead of making individual tool calls
 * - The MOO is the sandbox - code runs with full object access
 * - Only results are returned to Claude's context
 *
 * Creates:
 * - $mcpTool - Prototype for MCP tools
 * - $mcp - Singleton that executes code and manages tools
 * - Tool instances: $mcp.tools.set_property, $mcp.tools.dig, etc.
 */

import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

export class MCPBuilder {
  private mcpTool: RuntimeObject | null = null;
  private mcp: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const root = await this.manager.load(1);
    if (!root) throw new Error('Root prototype not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Build $mcpTool prototype
    await this.buildMCPTool(root, aliases, forceRebuild);

    // Build $mcp singleton
    await this.buildMCP(root, aliases, forceRebuild);

    // Build tool instances
    await this.buildTools(forceRebuild);
  }

  /**
   * Build $mcpTool prototype - base for all MCP tools
   */
  private async buildMCPTool(
    root: RuntimeObject,
    aliases: Record<string, number>,
    forceRebuild: boolean,
  ): Promise<void> {
    if (aliases.mcpTool) {
      this.mcpTool = await this.manager.load(aliases.mcpTool);
      if (this.mcpTool && !forceRebuild) return;
    }

    if (!this.mcpTool) {
      this.mcpTool = await this.manager.create({
        parent: root,
        properties: {
          name: 'MCP Tool',
          description: 'Prototype for MCP tools',
          toolName: '',
          toolDescription: '',
          inputSchema: {},
        },
        methods: {},
      });
    }

    // Default execute method - override in tool instances
    this.mcpTool.setMethod(
      'execute',
      `
      throw new Error('Tool execute() not implemented');
    `,
    );

    // Get tool definition for listing
    this.mcpTool.setMethod(
      'getDefinition',
      `
      return {
        name: self.toolName,
        description: self.toolDescription,
        inputSchema: self.inputSchema,
      };
    `,
    );
  }

  /**
   * Build $mcp singleton - the main MCP interface
   */
  private async buildMCP(
    root: RuntimeObject,
    aliases: Record<string, number>,
    forceRebuild: boolean,
  ): Promise<void> {
    if (aliases.mcp) {
      this.mcp = await this.manager.load(aliases.mcp);
      if (this.mcp && !forceRebuild) return;
    }

    if (!this.mcp) {
      this.mcp = await this.manager.create({
        parent: root,
        properties: {
          name: 'MCP',
          description:
            'Code-first MCP interface - execute MOO code with tool access',
          tools: {}, // Will be populated with tool references
        },
        methods: {},
      });
    }

    // execute(code) - Run MOO code with access to tools
    // This is the core of the code-first approach
    // We set the code as a temporary method and call it to get full MOO context
    this.mcp.setMethod(
      'execute',
      `
      const code = args[0];
      const playerId = args[1]; // Optional: authenticated player ID
      if (typeof code !== 'string') {
        throw new Error('execute() requires a code string');
      }

      // Build $mcp proxy that provides tool access
      // Tools are accessible as $mcp.dig(), $mcp.spawn_item(), etc.
      const tools = self.tools || {};
      const $mcp = new Proxy({}, {
        get: (target, prop) => {
          // Special methods
          if (prop === 'listTools') return async () => await self.listTools();
          if (prop === 'getToolSchema') return async (name) => await self.getToolSchema(name);

          // Tool access
          const tool = tools[prop];
          if (tool && tool.call) {
            return async (params) => await tool.call('execute', params);
          }

          throw new Error('Unknown MCP tool: ' + String(prop));
        }
      });

      // Load authenticated player if provided
      let player = undefined;
      if (typeof playerId === 'number') {
        player = await $load(playerId);
      }

      // Set user code as a temporary method with $mcp and player in scope
      const tempMethodName = '_mcp_exec_' + Date.now();
      const wrappedCode = 'const $mcp = args[0]; const player = args[1]; ' + code;
      self.setMethod(tempMethodName, wrappedCode);

      try {
        // Call the method with $mcp proxy and player object
        const result = await self.call(tempMethodName, $mcp, player);
        return result;
      } catch (err) {
        return { error: err.message || String(err), stack: err.stack };
      }
      // Note: temp method isn't persisted, so no cleanup needed
    `,
    );

    // listTools() - Return all tool definitions for discovery
    this.mcp.setMethod(
      'listTools',
      `
      const tools = self.tools || {};
      const definitions = [];
      for (const [name, tool] of Object.entries(tools)) {
        if (tool && tool.getDefinition) {
          definitions.push(await tool.getDefinition());
        }
      }
      return definitions;
    `,
    );

    // getToolSchema(name) - Get schema for a specific tool
    this.mcp.setMethod(
      'getToolSchema',
      `
      const name = args[0];
      const tools = self.tools || {};
      const tool = tools[name];
      if (!tool) {
        throw new Error('Tool not found: ' + name);
      }
      return tool.inputSchema;
    `,
    );

    // registerTool(tool) - Add a tool to the registry
    this.mcp.setMethod(
      'registerTool',
      `
      const tool = args[0];
      if (!tool || !tool.toolName) {
        throw new Error('Invalid tool: must have toolName');
      }
      const tools = self.tools || {};
      tools[tool.toolName] = tool;
      self.tools = tools;
      return { registered: tool.toolName };
    `,
    );
  }

  /**
   * Build all tool instances
   */
  private async buildTools(forceRebuild: boolean): Promise<void> {
    if (!this.mcpTool || !this.mcp) return;

    // Core object tools
    await this.buildTool(
      'set_property',
      {
        description: 'Set a property value on a MOO object',
        inputSchema: {
          type: 'object',
          properties: {
            objectId: {
              type: 'string',
              description: 'Object reference (#id or $alias)',
            },
            name: { type: 'string', description: 'Property name' },
            value: { description: 'Property value' },
          },
          required: ['objectId', 'name', 'value'],
        },
        execute: `
        const { objectId, name, value } = args[0];
        const obj = typeof objectId === 'string' && objectId.startsWith('#')
          ? await $load(parseInt(objectId.slice(1)))
          : objectId.startsWith('$') ? $[objectId.slice(1)] : await $load(objectId);
        if (!obj) throw new Error('Object not found: ' + objectId);
        obj.set(name, value);
        return { success: true, message: 'Set ' + name + ' on #' + obj.id };
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'get_property',
      {
        description: 'Get a property value from a MOO object',
        inputSchema: {
          type: 'object',
          properties: {
            objectId: {
              type: 'string',
              description: 'Object reference (#id or $alias)',
            },
            name: { type: 'string', description: 'Property name' },
          },
          required: ['objectId', 'name'],
        },
        execute: `
        const { objectId, name } = args[0];
        const obj = typeof objectId === 'string' && objectId.startsWith('#')
          ? await $load(parseInt(objectId.slice(1)))
          : objectId.startsWith('$') ? $[objectId.slice(1)] : await $load(objectId);
        if (!obj) throw new Error('Object not found: ' + objectId);
        return { property: name, value: obj.get(name) };
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'set_method',
      {
        description: 'Create or update a method on a MOO object',
        inputSchema: {
          type: 'object',
          properties: {
            objectId: {
              type: 'string',
              description: 'Object reference (#id or $alias)',
            },
            name: { type: 'string', description: 'Method name' },
            code: {
              type: 'string',
              description: 'TypeScript code for the method body',
            },
            callable: {
              type: 'boolean',
              description: 'Whether players can call this directly',
            },
            help: { type: 'string', description: 'Help text' },
          },
          required: ['objectId', 'name', 'code'],
        },
        execute: `
        const { objectId, name, code, callable, help } = args[0];
        const obj = typeof objectId === 'string' && objectId.startsWith('#')
          ? await $load(parseInt(objectId.slice(1)))
          : objectId.startsWith('$') ? $[objectId.slice(1)] : await $load(objectId);
        if (!obj) throw new Error('Object not found: ' + objectId);
        obj.setMethod(name, code, { callable, help });
        return { success: true, message: 'Method ' + name + ' saved on #' + obj.id };
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'call_method',
      {
        description: 'Execute a method on a MOO object',
        inputSchema: {
          type: 'object',
          properties: {
            objectId: {
              type: 'string',
              description: 'Object reference (#id or $alias)',
            },
            name: { type: 'string', description: 'Method name' },
            args: { type: 'array', description: 'Method arguments' },
          },
          required: ['objectId', 'name'],
        },
        execute: `
        const { objectId, name, args: methodArgs } = args[0];
        const obj = typeof objectId === 'string' && objectId.startsWith('#')
          ? await $load(parseInt(objectId.slice(1)))
          : objectId.startsWith('$') ? $[objectId.slice(1)] : await $load(objectId);
        if (!obj) throw new Error('Object not found: ' + objectId);
        const result = await obj.call(name, ...(methodArgs || []));
        return { result };
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'create_object',
      {
        description: 'Create a new MOO object with a specified parent',
        inputSchema: {
          type: 'object',
          properties: {
            parent: {
              type: 'string',
              description: 'Parent object reference (#id or $alias)',
            },
            properties: { type: 'object', description: 'Initial properties' },
          },
          required: ['parent'],
        },
        execute: `
        const { parent, properties } = args[0];
        const parentObj = typeof parent === 'string' && parent.startsWith('#')
          ? await $load(parseInt(parent.slice(1)))
          : parent.startsWith('$') ? $[parent.slice(1)] : await $load(parent);
        if (!parentObj) throw new Error('Parent not found: ' + parent);

        // Use recycler if available
        if ($recycler) {
          const obj = await $recycler.create({ parent: parentObj, properties: properties || {} });
          return { id: obj.id, message: 'Created #' + obj.id };
        }

        // Fallback to direct creation
        const obj = await $create({ parent: parentObj, properties: properties || {} });
        return { id: obj.id, message: 'Created #' + obj.id };
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'clone_object',
      {
        description: 'Clone an existing MOO object',
        inputSchema: {
          type: 'object',
          properties: {
            objectId: {
              type: 'string',
              description: 'Object to clone (#id or $alias)',
            },
          },
          required: ['objectId'],
        },
        execute: `
        const { objectId } = args[0];
        const obj = typeof objectId === 'string' && objectId.startsWith('#')
          ? await $load(parseInt(objectId.slice(1)))
          : objectId.startsWith('$') ? $[objectId.slice(1)] : await $load(objectId);
        if (!obj) throw new Error('Object not found: ' + objectId);

        if ($recycler && $recycler.clone) {
          const clone = await $recycler.clone(obj);
          return { id: clone.id, message: 'Cloned #' + obj.id + ' to #' + clone.id };
        }
        throw new Error('Recycler not available for cloning');
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'recycle_object',
      {
        description: 'Recycle (soft-delete) a MOO object',
        inputSchema: {
          type: 'object',
          properties: {
            objectId: {
              type: 'string',
              description: 'Object to recycle (#id or $alias)',
            },
          },
          required: ['objectId'],
        },
        execute: `
        const { objectId } = args[0];
        const obj = typeof objectId === 'string' && objectId.startsWith('#')
          ? await $load(parseInt(objectId.slice(1)))
          : objectId.startsWith('$') ? $[objectId.slice(1)] : await $load(objectId);
        if (!obj) throw new Error('Object not found: ' + objectId);

        if ($recycler && $recycler.recycle) {
          await $recycler.recycle(obj);
          return { success: true, message: 'Recycled #' + obj.id };
        }
        throw new Error('Recycler not available');
      `,
      },
      forceRebuild,
    );

    // Room tools
    await this.buildTool(
      'dig',
      {
        description:
          'Create a new room with optional bidirectional exits from an existing room',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Room name' },
            description: { type: 'string', description: 'Room description' },
            x: { type: 'number', description: 'X coordinate' },
            y: { type: 'number', description: 'Y coordinate' },
            z: { type: 'number', description: 'Z coordinate' },
            fromRoomId: {
              type: 'string',
              description: 'Source room for exits (#id or $alias)',
            },
            exitDirection: {
              type: 'string',
              description: 'Exit direction (north, east, up, etc.)',
            },
            returnDirection: {
              type: 'string',
              description: 'Return exit direction',
            },
          },
          required: ['name', 'description'],
        },
        execute: `
        const { name, description, x, y, z, fromRoomId, exitDirection, returnDirection } = args[0];

        // Direction alias map
        const aliasMap = {
          north: ['n'], south: ['s'], east: ['e'], west: ['w'],
          northeast: ['ne'], northwest: ['nw'], southeast: ['se'], southwest: ['sw'],
          up: ['u'], down: ['d', 'dn'], in: ['i'], out: ['o'],
        };

        // Create the room
        const newRoom = await $create({
          parent: $room,
          properties: {
            name, description,
            x: x ?? 0, y: y ?? 0, z: z ?? 0,
          },
        });

        const result = {
          room: { id: newRoom.id, name, coordinates: [x ?? 0, y ?? 0, z ?? 0] },
          exits: [],
        };

        // Create exits if source room specified
        if (fromRoomId && exitDirection) {
          const fromRoom = typeof fromRoomId === 'string' && fromRoomId.startsWith('#')
            ? await $load(parseInt(fromRoomId.slice(1)))
            : fromRoomId.startsWith('$') ? $[fromRoomId.slice(1)] : await $load(fromRoomId);

          if (fromRoom && $exit) {
            // Exit from source to new room
            const exitToNew = await $create({
              parent: $exit,
              properties: {
                name: exitDirection,
                aliases: aliasMap[exitDirection.toLowerCase()] || [],
                destRoom: newRoom,
              },
            });
            await fromRoom.addExit(exitToNew);
            result.exits.push({ id: exitToNew.id, direction: exitDirection, from: fromRoom.id, to: newRoom.id });

            // Return exit if specified
            if (returnDirection) {
              const exitBack = await $create({
                parent: $exit,
                properties: {
                  name: returnDirection,
                  aliases: aliasMap[returnDirection.toLowerCase()] || [],
                  destRoom: fromRoom,
                },
              });
              await newRoom.addExit(exitBack);
              result.exits.push({ id: exitBack.id, direction: returnDirection, from: newRoom.id, to: fromRoom.id });
            }
          }
        }

        return result;
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'link_rooms',
      {
        description: 'Create bidirectional exits between two existing rooms',
        inputSchema: {
          type: 'object',
          properties: {
            fromRoomId: {
              type: 'string',
              description: 'Source room (#id or $alias)',
            },
            toRoomId: {
              type: 'string',
              description: 'Destination room (#id or $alias)',
            },
            exitDirection: {
              type: 'string',
              description: 'Exit direction from source',
            },
            returnDirection: {
              type: 'string',
              description: 'Exit direction from destination',
            },
          },
          required: ['fromRoomId', 'toRoomId', 'exitDirection'],
        },
        execute: `
        const { fromRoomId, toRoomId, exitDirection, returnDirection } = args[0];

        const aliasMap = {
          north: ['n'], south: ['s'], east: ['e'], west: ['w'],
          northeast: ['ne'], northwest: ['nw'], southeast: ['se'], southwest: ['sw'],
          up: ['u'], down: ['d', 'dn'], in: ['i'], out: ['o'],
        };

        const fromRoom = typeof fromRoomId === 'string' && fromRoomId.startsWith('#')
          ? await $load(parseInt(fromRoomId.slice(1)))
          : fromRoomId.startsWith('$') ? $[fromRoomId.slice(1)] : await $load(fromRoomId);
        const toRoom = typeof toRoomId === 'string' && toRoomId.startsWith('#')
          ? await $load(parseInt(toRoomId.slice(1)))
          : toRoomId.startsWith('$') ? $[toRoomId.slice(1)] : await $load(toRoomId);

        if (!fromRoom) throw new Error('Source room not found: ' + fromRoomId);
        if (!toRoom) throw new Error('Destination room not found: ' + toRoomId);
        if (!$exit) throw new Error('Exit prototype not found');

        const result = { exits: [] };

        // Exit from source to destination
        const exitTo = await $create({
          parent: $exit,
          properties: {
            name: exitDirection,
            aliases: aliasMap[exitDirection.toLowerCase()] || [],
            destRoom: toRoom,
          },
        });
        await fromRoom.addExit(exitTo);
        result.exits.push({ id: exitTo.id, direction: exitDirection, from: fromRoom.id, to: toRoom.id });

        // Return exit if specified
        if (returnDirection) {
          const exitBack = await $create({
            parent: $exit,
            properties: {
              name: returnDirection,
              aliases: aliasMap[returnDirection.toLowerCase()] || [],
              destRoom: fromRoom,
            },
          });
          await toRoom.addExit(exitBack);
          result.exits.push({ id: exitBack.id, direction: returnDirection, from: toRoom.id, to: fromRoom.id });
        }

        return result;
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'list_rooms',
      {
        description: 'List all rooms in the world',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Maximum rooms to return' },
          },
        },
        execute: `
        const { limit } = args[0] || {};
        const rooms = [];
        const roomProtoId = $room?.id;

        // Iterate over all cached objects
        for (const obj of $.cache.values()) {
          if (!obj || obj.id === roomProtoId) continue;

          // Check if it inherits from $room by walking parent chain via objref
          let currentId = obj.obj.parent?.value;
          let isRoom = false;
          const seen = new Set();

          while (currentId !== undefined && currentId !== null && !seen.has(currentId)) {
            seen.add(currentId);
            if (currentId === roomProtoId) {
              isRoom = true;
              break;
            }
            const parent = $.cache.getObject(currentId);
            if (!parent) break;
            currentId = parent.obj.parent?.value;
            // Break on self-parented (root)
            if (currentId === parent.id) break;
          }

          if (isRoom) {
            rooms.push({
              id: obj.id,
              name: obj.name,
              coordinates: [obj.x ?? 0, obj.y ?? 0, obj.z ?? 0],
              exitCount: (obj.exits || []).length,
            });
            if (limit && rooms.length >= limit) break;
          }
        }

        return { count: rooms.length, rooms };
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'move_object',
      {
        description: 'Move an object to a new location',
        inputSchema: {
          type: 'object',
          properties: {
            objectId: {
              type: 'string',
              description: 'Object to move (#id or $alias)',
            },
            destinationId: {
              type: 'string',
              description: 'Destination room/container (#id or $alias)',
            },
          },
          required: ['objectId', 'destinationId'],
        },
        execute: `
        const { objectId, destinationId } = args[0];

        const obj = typeof objectId === 'string' && objectId.startsWith('#')
          ? await $load(parseInt(objectId.slice(1)))
          : objectId.startsWith('$') ? $[objectId.slice(1)] : await $load(objectId);
        const dest = typeof destinationId === 'string' && destinationId.startsWith('#')
          ? await $load(parseInt(destinationId.slice(1)))
          : destinationId.startsWith('$') ? $[destinationId.slice(1)] : await $load(destinationId);

        if (!obj) throw new Error('Object not found: ' + objectId);
        if (!dest) throw new Error('Destination not found: ' + destinationId);

        // Remove from current location
        const oldLoc = obj.location;
        if (oldLoc && oldLoc.removeContent) {
          await oldLoc.removeContent(obj);
        }

        // Add to new location
        if (dest.addContent) {
          await dest.addContent(obj);
        }
        obj.location = dest;

        return { success: true, message: 'Moved #' + obj.id + ' to #' + dest.id };
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'spawn_item',
      {
        description: 'Spawn an item from a prototype in a room',
        inputSchema: {
          type: 'object',
          properties: {
            prototypeId: {
              type: 'string',
              description: 'Item prototype (#id or $alias)',
            },
            roomId: {
              type: 'string',
              description: 'Room to spawn in (#id or $alias)',
            },
            properties: { type: 'object', description: 'Override properties' },
          },
          required: ['prototypeId', 'roomId'],
        },
        execute: `
        const { prototypeId, roomId, properties } = args[0];

        // Resolve prototypeId: '#123' or '$alias'
        const proto = typeof prototypeId === 'string'
          ? prototypeId.startsWith('#')
            ? await $load(parseInt(prototypeId.slice(1)))
            : prototypeId.startsWith('$')
              ? $[prototypeId.slice(1)]
              : prototypeId
          : prototypeId;

        // Resolve roomId: '#123' or '$alias'
        const room = typeof roomId === 'string'
          ? roomId.startsWith('#')
            ? await $load(parseInt(roomId.slice(1)))
            : roomId.startsWith('$')
              ? $[roomId.slice(1)]
              : roomId
          : roomId;

        if (!proto) throw new Error('Prototype not found: ' + prototypeId);
        if (!room) throw new Error('Room not found: ' + roomId);

        // Create the item
        const item = await $create({
          parent: proto,
          properties: properties || {},
        });

        // Add to room
        if (room.addContent) {
          await room.addContent(item);
        }
        item.location = room;

        return { id: item.id, name: item.name, room: room.id };
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'describe_object',
      {
        description: 'Get detailed information about a MOO object',
        inputSchema: {
          type: 'object',
          properties: {
            objectId: {
              type: 'string',
              description: 'Object to describe (#id or $alias)',
            },
          },
          required: ['objectId'],
        },
        execute: `
        const { objectId } = args[0];

        const obj = typeof objectId === 'string' && objectId.startsWith('#')
          ? await $load(parseInt(objectId.slice(1)))
          : objectId.startsWith('$') ? $[objectId.slice(1)] : await $load(objectId);

        if (!obj) throw new Error('Object not found: ' + objectId);

        // Get all own properties
        const properties = {};
        const rawProps = obj._rawProperties || {};
        for (const [key, val] of Object.entries(rawProps)) {
          properties[key] = val;
        }

        // Get method names
        const methods = Object.keys(obj._rawMethods || {});

        return {
          id: obj.id,
          name: obj.name,
          description: obj.description,
          parent: obj.parent ? obj.parent.id : null,
          location: obj.location ? obj.location.id : null,
          properties,
          methods,
        };
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'list_aliases',
      {
        description: 'List all registered object aliases',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        execute: `
        const objectManager = await $load(0);
        const aliases = objectManager.get('aliases') || {};
        const result = {};
        for (const [name, id] of Object.entries(aliases)) {
          if (typeof id === 'number') {
            result[name] = id;
          }
        }
        return result;
      `,
      },
      forceRebuild,
    );

    await this.buildTool(
      'add_alias',
      {
        description: 'Register a new object alias',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Alias name (without $)' },
            objectId: { type: 'string', description: 'Object to alias (#id)' },
          },
          required: ['name', 'objectId'],
        },
        execute: `
        const { name, objectId } = args[0];

        const obj = typeof objectId === 'string' && objectId.startsWith('#')
          ? await $load(parseInt(objectId.slice(1)))
          : await $load(objectId);

        if (!obj) throw new Error('Object not found: ' + objectId);

        const objectManager = await $load(0);
        await objectManager.addAlias(name, obj.id);

        return { success: true, message: 'Added alias $' + name + ' -> #' + obj.id };
      `,
      },
      forceRebuild,
    );

    // Plot tool
    await this.buildTool(
      'plot',
      {
        description: 'Plot and job management - delegates to $plot and $plotDB',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description:
                'Action: create, get, list, search, close, set_metadata, add_event, get_events, set_phases, get_phases, create_job, get_job, complete_job, fail_job, get_job_phase, advance_phase, set_phase, register_hook, next, active',
            },
            plotId: { type: 'number', description: 'Plot object ID' },
            jobId: { type: 'string', description: 'Job identifier' },
            name: { type: 'string', description: 'Plot name' },
            status: {
              type: 'string',
              description: 'Plot status: active, completed, abandoned, failed',
            },
            reason: { type: 'string', description: 'Reason for action' },
            message: { type: 'string', description: 'Event message' },
            from: {
              type: 'string',
              description: 'Event source: handler, system',
            },
            metadata: { type: 'object', description: 'Metadata object' },
            key: { type: 'string', description: 'Metadata key' },
            value: { description: 'Metadata value' },
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Result limit' },
            phases: { type: 'array', description: 'Phase definitions' },
            phaseId: { type: 'string', description: 'Phase identifier' },
            targetId: { type: 'number', description: 'Hook target object ID' },
            eventName: { type: 'string', description: 'Hook event name' },
            filter: { type: 'object', description: 'Hook filter' },
            expiresAt: {
              type: 'number',
              description: 'Job expiration timestamp',
            },
          },
          required: ['action'],
        },
        execute: `
        const { action, plotId, jobId, name, status, reason, message, from, metadata, key, value, query, limit, phases, phaseId, targetId, eventName, filter, expiresAt } = args[0];

        if (!$plot || !$plotDB) throw new Error('Plot system not available');

        const loadPlot = async (id) => {
          if (id === undefined) throw new Error('plotId required');
          const plot = await $load(id);
          if (!plot) throw new Error('Plot #' + id + ' not found');
          return plot;
        };

        switch (action) {
          case 'create': {
            if (!name) throw new Error('name required');
            const newPlot = await $recycler.create({
              parent: $plot,
              properties: { name, description: 'AI-created plot', status: 'active', metadata: metadata || {}, events: [], jobs: {} }
            });
            await $plotDB.call('register', newPlot);
            return { created: true, plotId: newPlot.id, name };
          }

          case 'get': {
            const plot = await loadPlot(plotId);
            return { id: plot.id, name: plot.name, status: plot.status, events: plot.events, jobs: plot.jobs, metadata: plot.metadata };
          }

          case 'list': {
            const plots = status ? await $plotDB.call('byStatus', status) : await $plotDB.call('all');
            return { count: plots.length, plots: plots.map(p => ({ id: p.id, name: p.name, status: p.status })) };
          }

          case 'search': {
            let plots = await $plotDB.call('search', query || '');
            if (limit) plots = plots.slice(0, limit);
            return { query, count: plots.length, plots };
          }

          case 'close': {
            const plot = await loadPlot(plotId);
            plot.status = status || 'completed';
            await plot.call('addEvent', { from: 'system', message: 'Plot ' + status + ': ' + (reason || 'No reason given') });
            return { closed: true, plotId, status: plot.status };
          }

          case 'set_metadata': {
            const plot = await loadPlot(plotId);
            await plot.call('setMetadata', key, value);
            return { set: true, plotId, key, value };
          }

          case 'add_event': {
            const plot = await loadPlot(plotId);
            await plot.call('addEvent', { from: from || 'system', message, metadata: metadata || {} });
            return { added: true, plotId };
          }

          case 'get_events': {
            const plot = await loadPlot(plotId);
            let events = await plot.call('getEventLog');
            if (limit) events = events.slice(0, limit);
            return { plotId, count: events.length, events };
          }

          case 'set_phases': {
            const plot = await loadPlot(plotId);
            const result = await plot.call('setPhases', phases);
            return { set: true, plotId, phaseCount: result.length, phases: result };
          }

          case 'get_phases': {
            const plot = await loadPlot(plotId);
            const result = await plot.call('getPhases');
            return { plotId, phases: result };
          }

          case 'create_job': {
            const plot = await loadPlot(plotId);
            if (!jobId) throw new Error('jobId required');
            const options = metadata ? { metadata } : {};
            if (expiresAt) options.expiresAt = expiresAt;
            await plot.call('createJob', jobId, options);
            return { created: true, plotId, jobId };
          }

          case 'get_job': {
            const plot = await loadPlot(plotId);
            if (!jobId) throw new Error('jobId required');
            const job = await plot.call('getJob', jobId);
            if (!job) throw new Error('Job not found: ' + jobId);
            return { plotId, jobId, ...job };
          }

          case 'complete_job': {
            const plot = await loadPlot(plotId);
            if (!jobId) throw new Error('jobId required');
            await plot.call('completeJob', jobId, reason || 'Completed');
            return { completed: true, plotId, jobId };
          }

          case 'fail_job': {
            const plot = await loadPlot(plotId);
            if (!jobId) throw new Error('jobId required');
            await plot.call('failJob', jobId, reason || 'Failed');
            return { failed: true, plotId, jobId };
          }

          case 'get_job_phase': {
            const plot = await loadPlot(plotId);
            if (!jobId) throw new Error('jobId required');
            const result = await plot.call('getJobPhase', jobId);
            return { plotId, jobId, ...result };
          }

          case 'advance_phase': {
            const plot = await loadPlot(plotId);
            if (!jobId) throw new Error('jobId required');
            const result = await plot.call('advanceJobPhase', jobId, 'completed');
            return { plotId, jobId, ...result };
          }

          case 'set_phase': {
            const plot = await loadPlot(plotId);
            if (!jobId || !phaseId) throw new Error('jobId and phaseId required');
            await plot.call('setJobPhase', jobId, phaseId);
            return { set: true, plotId, jobId, phaseId };
          }

          case 'register_hook': {
            const plot = await loadPlot(plotId);
            if (!jobId || targetId === undefined || !eventName) throw new Error('jobId, targetId, and eventName required');
            await plot.call('registerJobHook', jobId, targetId, eventName, filter || {});
            return { registered: true, plotId, jobId, targetId, eventName };
          }

          case 'next': {
            const plot = await $plotDB.call('getNext');
            if (!plot) return { plot: null, message: 'No jobs need attention' };
            const jobs = plot.jobs || {};
            return {
              id: plot.id,
              name: plot.name,
              phases: plot.phases || [],
              jobs: Object.entries(jobs).map(([id, job]) => ({ id, ...job })),
              events: plot.events || [],
              metadata: plot.metadata || {},
            };
          }

          case 'active': {
            const plots = await $plotDB.call('active');
            return { count: plots.length, plots: plots.map(p => ({ id: p.id, name: p.name, metadata: p.metadata })) };
          }

          default:
            throw new Error('Unknown action: ' + action);
        }
      `,
      },
      forceRebuild,
    );

    // Notes tool
    await this.buildTool(
      'notes',
      {
        description:
          'Notes management - get, add, append, delete, search notes on objects',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description:
                'Action: get, add, append, delete, search, list_objects',
            },
            objectId: {
              type: 'string',
              description: 'Target object (#id or $alias)',
            },
            text: { type: 'string', description: 'Note text' },
            author: { type: 'string', description: 'Note author' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Note tags',
            },
            tag: { type: 'string', description: 'Tag to filter/append by' },
            index: { type: 'number', description: 'Note index for delete' },
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Max results' },
          },
          required: ['action'],
        },
        execute: `
        const { action, objectId, text, author, tags, tag, index, query, limit } = args[0];

        if (!$notes) throw new Error('Notes system not available');

        const resolveObj = async (id) => {
          if (!id) return null;
          if (typeof id === 'string') {
            return id.startsWith('#') ? await $load(parseInt(id.slice(1))) : $[id.slice(1)];
          }
          return id;
        };

        switch (action) {
          case 'get': {
            const obj = await resolveObj(objectId);
            if (!obj) throw new Error('objectId required');
            const result = await $notes.call('get', obj);
            return { objectId: '#' + obj.id, count: result.length, notes: result };
          }

          case 'add': {
            const obj = await resolveObj(objectId);
            if (!obj) throw new Error('objectId required');
            if (!text) throw new Error('text required');
            const result = await $notes.call('add', obj, text, author || 'mcp', tags || []);
            return { added: true, objectId: '#' + obj.id, index: result };
          }

          case 'append': {
            const obj = await resolveObj(objectId);
            if (!obj || !tag || !text) throw new Error('objectId, tag, and text required');

            const existingNotes = await $notes.call('get', obj);
            const noteIndex = existingNotes.findIndex(n => n.tags?.includes(tag));

            if (noteIndex >= 0) {
              const oldNote = existingNotes[noteIndex];
              const newText = oldNote.text + '\\n' + text;
              await $notes.call('delete', obj, noteIndex);
              const result = await $notes.call('add', obj, newText, author || oldNote.author || 'mcp', oldNote.tags || [tag]);
              return { appended: true, objectId: '#' + obj.id, newIndex: result };
            } else {
              const result = await $notes.call('add', obj, text, author || 'mcp', [tag]);
              return { created: true, objectId: '#' + obj.id, index: result };
            }
          }

          case 'delete': {
            const obj = await resolveObj(objectId);
            if (!obj || index === undefined) throw new Error('objectId and index required');
            await $notes.call('delete', obj, index);
            return { deleted: true, objectId: '#' + obj.id, index };
          }

          case 'search': {
            const options = {};
            if (tag) options.tag = tag;
            if (author) options.author = author;
            if (limit) options.limit = limit;
            const results = await $notes.call('search', query || '', options);
            return { query: query || '', count: results.length, results };
          }

          case 'list_objects': {
            const objects = await $notes.call('listObjects');
            return {
              count: objects.length,
              objects: objects.map(obj => ({ objectId: '#' + (obj.objectId?.id || obj.objectId), noteCount: obj.count }))
            };
          }

          default:
            throw new Error('Unknown action: ' + action);
        }
      `,
      },
      forceRebuild,
    );

    // AI tool
    await this.buildTool(
      'ai',
      {
        description:
          'AI-controlled human management - spawn, list, pathfinding, memory, etc',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description:
                'Action: spawn, despawn, list, info, do, look, tailor, profile, setPersonality, setHistory, remember, recall, forget, memories, expect, cancelExpect, path, walkPath, worldLog, getWorldLog',
            },
            role: { type: 'string', description: 'AI role (for spawn)' },
            name: { type: 'string', description: 'Human name' },
            description: { type: 'string', description: 'Human description' },
            locationId: { type: 'number', description: 'Room ID' },
            sex: {
              type: 'string',
              enum: ['male', 'female', 'non-binary'],
              description: 'Sex',
            },
            age: { type: 'number', description: 'Age in years' },
            humanId: { type: 'number', description: 'Human object ID' },
            command: { type: 'string', description: 'Command to execute' },
            recycle: { type: 'boolean', description: 'Recycle on despawn' },
            personality: { description: 'Personality string or object' },
            history: { description: 'History string or object' },
            text: { type: 'string', description: 'Memory/note text' },
            importance: {
              type: 'string',
              enum: ['critical', 'important', 'normal'],
              description: 'Memory importance',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags',
            },
            tag: { type: 'string', description: 'Filter tag' },
            index: { type: 'number', description: 'Memory index' },
            limit: { type: 'number', description: 'Result limit' },
            criticalOnly: {
              type: 'boolean',
              description: 'Critical memories only',
            },
            context: { type: 'string', description: 'Tailor context' },
            clothed: { type: 'boolean', description: 'Auto-dress on spawn' },
            targetId: { type: 'number', description: 'Target object ID' },
            timeout: { type: 'number', description: 'Timeout in ms' },
            prompt: { type: 'string', description: 'Custom timeout prompt' },
            recurring: { type: 'boolean', description: 'Recurring timeout' },
            fromRoomId: { type: 'number', description: 'Starting room ID' },
            toRoomId: { type: 'number', description: 'Destination room ID' },
            ignoreLocks: {
              type: 'boolean',
              description: 'Ignore locked exits',
            },
            maxSteps: { type: 'number', description: 'Max pathfinding steps' },
            path: { type: 'array', description: 'Path array for walkPath' },
            author: { type: 'string', description: 'WorldLog author' },
            message: { type: 'string', description: 'WorldLog message' },
          },
          required: ['action'],
        },
        execute: `
        const { action, role, name, description, locationId, sex, age, humanId, command, recycle, personality, history, text, importance, tags, tag, index, limit, criticalOnly, context, clothed, targetId, timeout, prompt, recurring, fromRoomId, toRoomId, ignoreLocks, maxSteps, path, author, message } = args[0];

        if (!$ai) throw new Error('AI registry not available');

        switch (action) {
          case 'spawn': {
            if (!role) throw new Error('role required');
            const options = {};
            if (name) options.name = name;
            if (description) options.description = description;
            if (locationId !== undefined) options.location = locationId;
            if (sex) options.sex = sex;
            if (age !== undefined) options.age = age;
            if (personality) options.personality = personality;
            if (history) options.history = history;
            const human = await $ai.call('spawn', role, options);
            return { spawned: true, id: human.id, name: human.name, role, clothed: !!clothed };
          }

          case 'despawn': {
            if (humanId === undefined) throw new Error('humanId required');
            await $ai.call('despawn', humanId, recycle !== false);
            return { despawned: true, humanId };
          }

          case 'list': {
            const humans = role ? await $ai.call('getByRole', role) : await $ai.call('getAll');
            const results = [];
            for (const human of humans || []) {
              const id = typeof human === 'number' ? human : human?.id || human?.value;
              if (!id) continue;
              const info = await $ai.call('getInfo', id);
              const loaded = await $load(id);
              results.push({
                id,
                name: loaded ? loaded.name || 'Unknown' : 'Unknown',
                role: info?.role || 'unknown',
                location: loaded?.location || null
              });
            }
            return { count: results.length, humans: results };
          }

          case 'info': {
            if (humanId === undefined) throw new Error('humanId required');
            const isAi = await $ai.call('isAiControlled', humanId);
            if (!isAi) return { humanId, isAiControlled: false };
            const info = await $ai.call('getInfo', humanId);
            return { humanId, isAiControlled: true, ...info };
          }

          case 'do': {
            if (humanId === undefined || !command) throw new Error('humanId and command required');
            const human = await $load(humanId);
            if (!human) throw new Error('Human not found: #' + humanId);
            await human.call('doCommand', command);
            return { executed: true, humanId, command };
          }

          case 'look': {
            if (humanId === undefined) throw new Error('humanId required');
            const human = await $load(humanId);
            if (!human || !human.location) throw new Error('Human not found or not in a location');
            const output = await human.location.call('describeFor', human);
            return { humanId, locationId: human.location.id, output };
          }

          case 'profile': {
            if (humanId === undefined) throw new Error('humanId required');
            const human = await $load(humanId);
            return {
              humanId,
              personality: human.personality,
              history: human.history,
              memories: human.memories || []
            };
          }

          case 'setPersonality': {
            if (humanId === undefined || !personality) throw new Error('humanId and personality required');
            const human = await $load(humanId);
            human.personality = personality;
            return { set: true, humanId };
          }

          case 'setHistory': {
            if (humanId === undefined || !history) throw new Error('humanId and history required');
            const human = await $load(humanId);
            human.history = history;
            return { set: true, humanId };
          }

          case 'remember': {
            if (humanId === undefined || !text) throw new Error('humanId and text required');
            const human = await $load(humanId);
            const memories = human.memories || [];
            memories.unshift({ text, importance: importance || 'normal', tags: tags || [], timestamp: Date.now() });
            human.memories = memories;
            return { remembered: true, humanId, index: 0 };
          }

          case 'recall': {
            if (humanId === undefined) throw new Error('humanId required');
            const human = await $load(humanId);
            let memories = human.memories || [];
            if (importance) memories = memories.filter(m => m.importance === importance);
            if (tag) memories = memories.filter(m => m.tags?.includes(tag));
            if (limit) memories = memories.slice(0, limit);
            return { humanId, count: memories.length, memories };
          }

          case 'forget': {
            if (humanId === undefined || index === undefined) throw new Error('humanId and index required');
            const human = await $load(humanId);
            const memories = human.memories || [];
            memories.splice(index, 1);
            human.memories = memories;
            return { forgotten: true, humanId, index };
          }

          case 'memories': {
            if (humanId === undefined) throw new Error('humanId required');
            const human = await $load(humanId);
            let memories = human.memories || [];
            if (criticalOnly) memories = memories.filter(m => m.importance === 'critical');
            return { humanId, count: memories.length, summary: memories.map(m => m.text).join('\\n') };
          }

          case 'expect': {
            if (humanId === undefined || targetId === undefined) throw new Error('humanId and targetId required');
            const human = await $load(humanId);
            await human.call('expectResponse', targetId, timeout || 300000, prompt, recurring !== false);
            return { expecting: true, humanId, targetId, timeout: timeout || 300000 };
          }

          case 'cancelExpect': {
            if (humanId === undefined || targetId === undefined) throw new Error('humanId and targetId required');
            const human = await $load(humanId);
            await human.call('cancelExpectation', targetId);
            return { cancelled: true, humanId, targetId };
          }

          case 'path': {
            if (fromRoomId === undefined || toRoomId === undefined) throw new Error('fromRoomId and toRoomId required');
            const result = await $ai.call('findPath', fromRoomId, toRoomId, ignoreLocks || false, maxSteps || 1000);
            return result;
          }

          case 'walkPath': {
            if (humanId === undefined || !path) throw new Error('humanId and path required');
            const human = await $load(humanId);
            for (const step of path) {
              await human.call('doCommand', step.direction);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            return { walked: true, humanId, steps: path.length };
          }

          case 'worldLog': {
            if (!author || !message) throw new Error('author and message required');
            const worldLog = $worldLog || await $load(0);
            const log = worldLog.worldLog || [];
            log.push({ author, message, timestamp: Date.now() });
            worldLog.worldLog = log;
            return { logged: true, author, message };
          }

          case 'getWorldLog': {
            const worldLog = $worldLog || await $load(0);
            let log = worldLog.worldLog || [];
            if (limit) log = log.slice(-limit);
            return { count: log.length, log };
          }

          default:
            throw new Error('Unknown action: ' + action);
        }
      `,
      },
      forceRebuild,
    );

    // Combat tool
    await this.buildTool(
      'combat',
      {
        description: 'Combat resolution - status, check, damage, effects',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description:
                'Action: status, context, check, damage, emote, effect, end, next_round, list',
            },
            combatId: { type: 'string', description: 'Combat ID' },
            combatantId: { type: 'number', description: 'Combatant object ID' },
            targetId: { type: 'number', description: 'Target object ID' },
            skillName: { type: 'string', description: 'Skill name' },
            opposingLevel: {
              type: 'number',
              description: 'Opposing skill level',
            },
            bodyPart: { type: 'string', description: 'Body part to damage' },
            damageType: {
              type: 'string',
              description:
                'Damage type: cut, bruise, puncture, burn, laceration, abrasion',
            },
            severity: { type: 'number', description: 'Damage severity 0-100' },
            cause: { type: 'string', description: 'Damage cause' },
            text: { type: 'string', description: 'Narration text' },
            effect: {
              type: 'string',
              description:
                'Status effect: stunned, knockedDown, disarmed, winded',
            },
            intensity: {
              type: 'number',
              description: 'Effect intensity 0-100',
            },
            duration: { type: 'number', description: 'Effect duration in ms' },
            reason: {
              type: 'string',
              description:
                'End reason: death, flee, surrender, knockout, intervention',
            },
            winnerId: { type: 'number', description: 'Winner object ID' },
          },
          required: ['action'],
        },
        execute: `
        const { action, combatId, combatantId, targetId, skillName, opposingLevel, bodyPart, damageType, severity, cause, text, effect, intensity, duration, reason, winnerId } = args[0];

        if (!$combat) throw new Error('Combat system not available');

        switch (action) {
          case 'status': {
            if (!combatId) throw new Error('combatId required');
            const combat = await $combat.call('getCombat', combatId);
            if (!combat) throw new Error('Combat not found: ' + combatId);
            return {
              id: combat.id,
              round: combat.round,
              status: combat.status,
              combatants: combat.combatants?.map(c => c ? { id: c.id, name: c.name } : null),
              actions: Object.keys(combat.actions || {}).length
            };
          }

          case 'context': {
            if (!combatId) throw new Error('combatId required');
            const context = await $combat.call('gatherContext', combatId);
            if (context.error) throw new Error(context.error);
            return context;
          }

          case 'check': {
            if (!combatId || combatantId === undefined || !skillName) throw new Error('combatId, combatantId, and skillName required');
            const combatant = await $load(combatantId);
            if (!combatant) throw new Error('Combatant not found: #' + combatantId);
            const result = await $combat.call('skillCheck', combatId, combatant, skillName, opposingLevel || 50);
            if (result.error) throw new Error(result.error);
            return result;
          }

          case 'damage': {
            if (!combatId || targetId === undefined || !bodyPart) throw new Error('combatId, targetId, and bodyPart required');
            const target = await $load(targetId);
            if (!target) throw new Error('Target not found: #' + targetId);
            const result = await $combat.call('applyDamage', combatId, target, bodyPart, damageType || 'bruise', severity || 30, cause);
            if (result.error) throw new Error(result.error);
            return result;
          }

          case 'emote': {
            if (!combatId || !text) throw new Error('combatId and text required');
            const result = await $combat.call('emote', combatId, text);
            return { emoted: true, combatId, text };
          }

          case 'effect': {
            if (!combatId || targetId === undefined || !effect) throw new Error('combatId, targetId, and effect required');
            const target = await $load(targetId);
            if (!target) throw new Error('Target not found: #' + targetId);
            const result = await $combat.call('applyEffect', combatId, target, effect, intensity || 50, duration);
            if (result.error) throw new Error(result.error);
            return result;
          }

          case 'end': {
            if (!combatId || !reason) throw new Error('combatId and reason required');
            const winner = winnerId !== undefined ? await $load(winnerId) : null;
            await $combat.call('endCombat', combatId, reason, winner);
            return { ended: true, combatId, reason, winnerId };
          }

          case 'next_round': {
            if (!combatId) throw new Error('combatId required');
            await $combat.call('nextRound', combatId);
            return { advanced: true, combatId };
          }

          case 'list': {
            const combats = await $combat.call('listActive');
            return { count: combats.length, combats };
          }

          default:
            throw new Error('Unknown action: ' + action);
        }
      `,
      },
      forceRebuild,
    );

    // World query tool
    await this.buildTool(
      'world',
      {
        description: 'Query objects with SQL-like DSL syntax',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'Action: query, validate' },
            q: { type: 'string', description: 'Query string (DSL syntax)' },
            limit: { type: 'number', description: 'Max results (default 50)' },
            offset: { type: 'number', description: 'Skip first N results' },
          },
          required: ['action'],
        },
        execute: `
        const { action, q, limit, offset } = args[0];

        // Import query parser
        const { parseQuery, validateQuery } = await import('/app/src/mcp/query-parser.js');

        switch (action) {
          case 'validate': {
            if (!q) throw new Error('q (query) required');
            const result = validateQuery(q);
            return result;
          }

          case 'query': {
            if (!q) throw new Error('q (query) required');

            let mongoQuery;
            try {
              mongoQuery = parseQuery(q);
            } catch (parseErr) {
              throw new Error('Parse error: ' + (parseErr.message || parseErr));
            }

            // Exclude recycled objects by default
            mongoQuery = { $and: [mongoQuery, { 'properties._deleted': { $ne: true } }] };

            // Execute query against MongoDB
            const db = $.db;
            if (!db || !db.objects) throw new Error('Database not available');

            const collection = db.objects;
            const maxLimit = Math.min(limit || 50, 200);
            const skip = offset || 0;

            const cursor = collection.find(mongoQuery).skip(skip).limit(maxLimit);
            const docs = await cursor.toArray();

            const results = docs.map(doc => ({
              id: doc._id,
              parent: doc.parent,
              name: doc.properties?.name?.value || doc.properties?.name || 'Unknown',
              description: doc.properties?.description?.value || doc.properties?.description
            }));

            return {
              query: q,
              mongoQuery,
              count: results.length,
              offset: skip,
              results
            };
          }

          default:
            throw new Error('Unknown action: ' + action + '. Valid: query, validate');
        }
      `,
      },
      forceRebuild,
    );
  }

  /**
   * Helper to build a single tool
   */
  private async buildTool(
    name: string,
    config: {
      description: string;
      inputSchema: object;
      execute: string;
    },
    forceRebuild: boolean,
  ): Promise<void> {
    if (!this.mcpTool || !this.mcp) return;

    const objectManager = await this.manager.load(0);
    const aliases =
      (objectManager?.get('aliases') as Record<string, number>) || {};
    const aliasName = `mcp_${name}`;

    let tool: RuntimeObject | null = null;
    if (aliases[aliasName]) {
      tool = await this.manager.load(aliases[aliasName]);
    }

    if (!tool) {
      tool = await this.manager.create({
        parent: this.mcpTool,
        properties: {
          name: `MCP Tool: ${name}`,
          toolName: name,
          toolDescription: config.description,
          // JSON Schema object - cast to any to satisfy PropertyValue type
          inputSchema: config.inputSchema as any,
        },
        methods: {},
      });
    }

    // Set/update the execute method
    if (forceRebuild || !tool.hasMethod('execute')) {
      tool.setMethod('execute', config.execute);
    }

    // Register the tool with $mcp
    const tools =
      (this.mcp.get('tools') as Record<string, RuntimeObject>) || {};
    tools[name] = tool;
    this.mcp.set('tools', tools);

    // Store for alias registration
    this._tools.set(name, tool);
  }

  private _tools = new Map<string, RuntimeObject>();

  async registerAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const register = async (alias: string, obj: RuntimeObject | null) => {
      if (obj) {
        await objectManager.call('addAlias', alias, obj.id);
        console.log(`✅ Registered ${alias} alias -> #${obj.id}`);
      }
    };

    // Core MCP objects
    await register('mcpTool', this.mcpTool);
    await register('mcp', this.mcp);

    // Individual tools
    for (const [name, tool] of this._tools) {
      await register(`mcp_${name}`, tool);
    }
  }
}
