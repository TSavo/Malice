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

import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

export class MCPBuilder {
  private mcpTool: RuntimeObject | null = null;
  private mcp: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const root = await this.manager.load(1);
    if (!root) throw new Error('Root prototype not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

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
    forceRebuild: boolean
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
    this.mcpTool.setMethod('execute', `
      throw new Error('Tool execute() not implemented');
    `);

    // Get tool definition for listing
    this.mcpTool.setMethod('getDefinition', `
      return {
        name: self.toolName,
        description: self.toolDescription,
        inputSchema: self.inputSchema,
      };
    `);
  }

  /**
   * Build $mcp singleton - the main MCP interface
   */
  private async buildMCP(
    root: RuntimeObject,
    aliases: Record<string, number>,
    forceRebuild: boolean
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
          description: 'Code-first MCP interface - execute MOO code with tool access',
          tools: {}, // Will be populated with tool references
        },
        methods: {},
      });
    }

    // execute(code) - Run MOO code with access to tools
    // This is the core of the code-first approach
    // We set the code as a temporary method and call it to get full MOO context
    this.mcp.setMethod('execute', `
      const code = args[0];
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

      // Set user code as a temporary method with $mcp in scope
      const tempMethodName = '_mcp_exec_' + Date.now();
      const wrappedCode = 'const $mcp = args[0]; ' + code;
      self.setMethod(tempMethodName, wrappedCode);

      try {
        // Call the method with $mcp proxy
        const result = await self.call(tempMethodName, $mcp);
        return result;
      } catch (err) {
        return { error: err.message || String(err), stack: err.stack };
      }
      // Note: temp method isn't persisted, so no cleanup needed
    `);

    // listTools() - Return all tool definitions for discovery
    this.mcp.setMethod('listTools', `
      const tools = self.tools || {};
      const definitions = [];
      for (const [name, tool] of Object.entries(tools)) {
        if (tool && tool.getDefinition) {
          definitions.push(await tool.getDefinition());
        }
      }
      return definitions;
    `);

    // getToolSchema(name) - Get schema for a specific tool
    this.mcp.setMethod('getToolSchema', `
      const name = args[0];
      const tools = self.tools || {};
      const tool = tools[name];
      if (!tool) {
        throw new Error('Tool not found: ' + name);
      }
      return tool.inputSchema;
    `);

    // registerTool(tool) - Add a tool to the registry
    this.mcp.setMethod('registerTool', `
      const tool = args[0];
      if (!tool || !tool.toolName) {
        throw new Error('Invalid tool: must have toolName');
      }
      const tools = self.tools || {};
      tools[tool.toolName] = tool;
      self.tools = tools;
      return { registered: tool.toolName };
    `);
  }

  /**
   * Build all tool instances
   */
  private async buildTools(forceRebuild: boolean): Promise<void> {
    if (!this.mcpTool || !this.mcp) return;

    // Core object tools
    await this.buildTool('set_property', {
      description: 'Set a property value on a MOO object',
      inputSchema: {
        type: 'object',
        properties: {
          objectId: { type: 'string', description: 'Object reference (#id or $alias)' },
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
    }, forceRebuild);

    await this.buildTool('get_property', {
      description: 'Get a property value from a MOO object',
      inputSchema: {
        type: 'object',
        properties: {
          objectId: { type: 'string', description: 'Object reference (#id or $alias)' },
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
    }, forceRebuild);

    await this.buildTool('set_method', {
      description: 'Create or update a method on a MOO object',
      inputSchema: {
        type: 'object',
        properties: {
          objectId: { type: 'string', description: 'Object reference (#id or $alias)' },
          name: { type: 'string', description: 'Method name' },
          code: { type: 'string', description: 'TypeScript code for the method body' },
          callable: { type: 'boolean', description: 'Whether players can call this directly' },
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
    }, forceRebuild);

    await this.buildTool('call_method', {
      description: 'Execute a method on a MOO object',
      inputSchema: {
        type: 'object',
        properties: {
          objectId: { type: 'string', description: 'Object reference (#id or $alias)' },
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
    }, forceRebuild);

    await this.buildTool('create_object', {
      description: 'Create a new MOO object with a specified parent',
      inputSchema: {
        type: 'object',
        properties: {
          parent: { type: 'string', description: 'Parent object reference (#id or $alias)' },
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
    }, forceRebuild);

    await this.buildTool('clone_object', {
      description: 'Clone an existing MOO object',
      inputSchema: {
        type: 'object',
        properties: {
          objectId: { type: 'string', description: 'Object to clone (#id or $alias)' },
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
    }, forceRebuild);

    await this.buildTool('recycle_object', {
      description: 'Recycle (soft-delete) a MOO object',
      inputSchema: {
        type: 'object',
        properties: {
          objectId: { type: 'string', description: 'Object to recycle (#id or $alias)' },
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
    }, forceRebuild);

    // Room tools
    await this.buildTool('dig', {
      description: 'Create a new room with optional bidirectional exits from an existing room',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Room name' },
          description: { type: 'string', description: 'Room description' },
          x: { type: 'number', description: 'X coordinate' },
          y: { type: 'number', description: 'Y coordinate' },
          z: { type: 'number', description: 'Z coordinate' },
          fromRoomId: { type: 'string', description: 'Source room for exits (#id or $alias)' },
          exitDirection: { type: 'string', description: 'Exit direction (north, east, up, etc.)' },
          returnDirection: { type: 'string', description: 'Return exit direction' },
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
    }, forceRebuild);

    await this.buildTool('link_rooms', {
      description: 'Create bidirectional exits between two existing rooms',
      inputSchema: {
        type: 'object',
        properties: {
          fromRoomId: { type: 'string', description: 'Source room (#id or $alias)' },
          toRoomId: { type: 'string', description: 'Destination room (#id or $alias)' },
          exitDirection: { type: 'string', description: 'Exit direction from source' },
          returnDirection: { type: 'string', description: 'Exit direction from destination' },
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
    }, forceRebuild);

    await this.buildTool('list_rooms', {
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

        // Get all objects and filter for rooms
        const allIds = await $.objectManager.getAllIds();
        for (const id of allIds) {
          const obj = await $load(id);
          if (!obj) continue;

          // Check if it inherits from $room
          let current = obj;
          let isRoom = false;
          while (current) {
            if (current.id === $room?.id) {
              isRoom = true;
              break;
            }
            current = current.parent;
          }

          if (isRoom && obj.id !== $room?.id) {
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
    }, forceRebuild);

    await this.buildTool('move_object', {
      description: 'Move an object to a new location',
      inputSchema: {
        type: 'object',
        properties: {
          objectId: { type: 'string', description: 'Object to move (#id or $alias)' },
          destinationId: { type: 'string', description: 'Destination room/container (#id or $alias)' },
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
    }, forceRebuild);

    await this.buildTool('spawn_item', {
      description: 'Spawn an item from a prototype in a room',
      inputSchema: {
        type: 'object',
        properties: {
          prototypeId: { type: 'string', description: 'Item prototype (#id or $alias)' },
          roomId: { type: 'string', description: 'Room to spawn in (#id or $alias)' },
          properties: { type: 'object', description: 'Override properties' },
        },
        required: ['prototypeId', 'roomId'],
      },
      execute: `
        const { prototypeId, roomId, properties } = args[0];

        const proto = typeof prototypeId === 'string' && prototypeId.startsWith('#')
          ? await $load(parseInt(prototypeId.slice(1)))
          : prototypeId.startsWith('$') ? $[prototypeId.slice(1)] : await $load(prototypeId);
        const room = typeof roomId === 'string' && roomId.startsWith('#')
          ? await $load(parseInt(roomId.slice(1)))
          : roomId.startsWith('$') ? $[roomId.slice(1)] : await $load(roomId);

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
    }, forceRebuild);

    await this.buildTool('describe_object', {
      description: 'Get detailed information about a MOO object',
      inputSchema: {
        type: 'object',
        properties: {
          objectId: { type: 'string', description: 'Object to describe (#id or $alias)' },
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
    }, forceRebuild);

    await this.buildTool('list_aliases', {
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
    }, forceRebuild);

    await this.buildTool('add_alias', {
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
    }, forceRebuild);
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
    forceRebuild: boolean
  ): Promise<void> {
    if (!this.mcpTool || !this.mcp) return;

    const objectManager = await this.manager.load(0);
    const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};
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
    const tools = (this.mcp.get('tools') as Record<string, RuntimeObject>) || {};
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
