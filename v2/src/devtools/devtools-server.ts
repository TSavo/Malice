/**
 * WebSocket DevTools Server
 *
 * JSON-RPC 2.0 server on port 9999 for VS Code extension
 * Provides CRUD operations for objects, methods, and properties
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { ObjectManager } from '../database/object-manager.js';
import type { ObjId } from '../../types/object.js';
import { TypeGenerator } from './type-generator.js';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id?: number | string;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string | null;
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

/**
 * DevTools WebSocket server
 * Exposes ObjectManager via JSON-RPC 2.0 protocol
 */
export class DevToolsServer {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();

  constructor(
    private manager: ObjectManager,
    private port = 9999
  ) {
    this.wss = new WebSocketServer({
      port,
      host: '127.0.0.1' // localhost only for security
    });

    this.setupServer();
    this.watchForChanges();
  }

  /**
   * Setup WebSocket server
   */
  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 DevTools client connected');
      this.clients.add(ws);

      // Send hello message with capabilities
      this.sendNotification(ws, 'server.hello', {
        version: '1.0.0',
        capabilities: {
          objectCRUD: true,
          typeGeneration: true,
          changeWatch: true,
          lsp: false, // TODO: implement
        },
      });

      ws.on('message', async (data: Buffer) => {
        try {
          const request = JSON.parse(data.toString()) as JsonRpcRequest;
          const response = await this.handleRequest(request);
          ws.send(JSON.stringify(response));
        } catch (err) {
          const error: JsonRpcResponse = {
            jsonrpc: '2.0',
            error: {
              code: -32700,
              message: 'Parse error',
              data: err instanceof Error ? err.message : String(err),
            },
            id: null,
          };
          ws.send(JSON.stringify(error));
        }
      });

      ws.on('close', () => {
        console.log('🔌 DevTools client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
      });
    });

    this.wss.on('listening', () => {
      console.log(`🛠️  DevTools server listening on ws://localhost:${this.port}`);
    });
  }

  /**
   * Handle JSON-RPC request
   */
  private async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { method, params, id } = request;

    try {
      let result: any;

      switch (method) {
        case 'objects.list':
          result = await this.listObjects(params);
          break;

        case 'object.get':
          result = await this.getObject(params);
          break;

        case 'object.create':
          result = await this.createObject(params);
          break;

        case 'object.delete':
          result = await this.deleteObject(params);
          break;

        case 'method.get':
          result = await this.getMethod(params);
          break;

        case 'method.set':
          result = await this.setMethod(params);
          break;

        case 'method.delete':
          result = await this.deleteMethod(params);
          break;

        case 'property.get':
          result = await this.getProperty(params);
          break;

        case 'property.set':
          result = await this.setProperty(params);
          break;

        case 'property.delete':
          result = await this.deleteProperty(params);
          break;

        case 'types.generate':
          result = await this.generateTypes(params);
          break;

        default:
          return {
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
            id: id ?? null,
          };
      }

      return {
        jsonrpc: '2.0',
        result,
        id: id ?? null,
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : 'Internal error',
          data: err instanceof Error ? err.stack : undefined,
        },
        id: id ?? null,
      };
    }
  }

  /**
   * List all objects
   */
  private async listObjects(params: { includeRecycled?: boolean } = {}): Promise<any> {
    const allObjects = await this.manager.db.listAll(params.includeRecycled);

    const objects = allObjects.map(obj => ({
      id: obj._id,
      parent: obj.parent,
      properties: Object.keys(obj.properties || {}),
      methods: Object.keys(obj.methods || {}),
      recycled: obj.recycled || false,
    }));

    return { objects };
  }

  /**
   * Get full object data
   */
  private async getObject(params: { id: ObjId }): Promise<any> {
    const { id } = params;
    const obj = await this.manager.load(id);

    if (!obj) {
      throw new Error(`Object #${id} not found`);
    }

    const raw = obj._getRaw();

    return {
      object: {
        _id: raw._id,
        parent: raw.parent,
        properties: raw.properties,
        methods: raw.methods,
        created: raw.created,
        modified: raw.modified,
        recycled: raw.recycled,
      },
    };
  }

  /**
   * Create new object
   */
  private async createObject(params: {
    parent: ObjId;
    properties?: Record<string, any>;
    methods?: Record<string, string>;
  }): Promise<any> {
    const obj = await this.manager.create({
      parent: params.parent,
      properties: params.properties || {},
      methods: params.methods || {},
    });

    // Notify all clients
    this.broadcast('object.created', { id: obj.id });

    return { id: obj.id };
  }

  /**
   * Delete (recycle) object - soft delete for safety
   */
  private async deleteObject(params: { id: ObjId }): Promise<any> {
    const { id } = params;
    await this.manager.db.recycle(id);

    // Invalidate cache
    this.manager.clearCache();

    // Notify all clients
    this.broadcast('object.deleted', { id });

    return { success: true };
  }

  /**
   * Get method code
   */
  private async getMethod(params: { objectId: ObjId; name: string }): Promise<any> {
    const { objectId, name } = params;
    const obj = await this.manager.load(objectId);

    if (!obj) {
      throw new Error(`Object #${objectId} not found`);
    }

    const methods = obj.getOwnMethods();
    if (!(name in methods)) {
      throw new Error(`Method '${name}' not found on object #${objectId}`);
    }

    const method = methods[name];

    return {
      method: {
        name,
        code: typeof method === 'string' ? method : method.code,
        callable: typeof method === 'object' ? method.callable : undefined,
        aliases: typeof method === 'object' ? method.aliases : undefined,
        help: typeof method === 'object' ? method.help : undefined,
      },
    };
  }

  /**
   * Set method code
   */
  private async setMethod(params: {
    objectId: ObjId;
    name: string;
    code: string;
    options?: { callable?: boolean; aliases?: string[]; help?: string };
  }): Promise<any> {
    const { objectId, name, code, options } = params;
    const obj = await this.manager.load(objectId);

    if (!obj) {
      throw new Error(`Object #${objectId} not found`);
    }

    obj.setMethod(name, code, options);
    await obj.save();

    // Notify all clients
    this.broadcast('method.changed', { objectId, name });

    return { success: true };
  }

  /**
   * Delete method
   */
  private async deleteMethod(params: { objectId: ObjId; name: string }): Promise<any> {
    const { objectId, name } = params;
    const obj = await this.manager.load(objectId);

    if (!obj) {
      throw new Error(`Object #${objectId} not found`);
    }

    obj.removeMethod(name);
    await obj.save();

    // Notify all clients
    this.broadcast('method.deleted', { objectId, name });

    return { success: true };
  }

  /**
   * Get property value
   */
  private async getProperty(params: { objectId: ObjId; name: string }): Promise<any> {
    const { objectId, name } = params;
    const obj = await this.manager.load(objectId);

    if (!obj) {
      throw new Error(`Object #${objectId} not found`);
    }

    const value = obj.get(name);

    return {
      property: {
        name,
        value,
      },
    };
  }

  /**
   * Set property value
   */
  private async setProperty(params: {
    objectId: ObjId;
    name: string;
    value: any;
  }): Promise<any> {
    const { objectId, name, value } = params;
    const obj = await this.manager.load(objectId);

    if (!obj) {
      throw new Error(`Object #${objectId} not found`);
    }

    obj.set(name, value);
    await obj.save();

    // Notify all clients
    this.broadcast('property.changed', { objectId, name });

    return { success: true };
  }

  /**
   * Delete property
   */
  private async deleteProperty(params: { objectId: ObjId; name: string }): Promise<any> {
    const { objectId, name } = params;
    const obj = await this.manager.load(objectId);

    if (!obj) {
      throw new Error(`Object #${objectId} not found`);
    }

    const properties = obj.getOwnProperties();
    delete properties[name];

    await this.manager.update(objectId, { properties });

    // Notify all clients
    this.broadcast('property.deleted', { objectId, name });

    return { success: true };
  }

  /**
   * Generate TypeScript definitions from database
   */
  private async generateTypes(params: { objectId?: ObjId } = {}): Promise<any> {
    const generator = new TypeGenerator(this.manager);

    let definitions: string;

    if (params.objectId !== undefined) {
      // Generate types for specific object (with enhanced self type)
      definitions = await generator.generateForObject(params.objectId);
    } else {
      // Generate general types for all objects
      definitions = await generator.generate();
    }

    return { definitions };
  }

  /**
   * Send notification to a specific client
   */
  private sendNotification(ws: WebSocket, method: string, params: any): void {
    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };
    ws.send(JSON.stringify(notification));
  }

  /**
   * Broadcast notification to all connected clients
   */
  private broadcast(method: string, params: any): void {
    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };
    const message = JSON.stringify(notification);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  /**
   * Watch for MongoDB changes and notify clients
   */
  private watchForChanges(): void {
    // Hook into ObjectManager's change stream watcher
    // When objects change, notify all connected clients

    // We'll need to expose a way to hook into change events
    // For now, we rely on the invalidate() method being called
    // which happens via the change stream watcher in ObjectManager
  }

  /**
   * Close the server
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close all client connections first
      for (const client of this.clients) {
        client.close();
      }
      this.clients.clear();

      // Then close the server
      this.wss.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
