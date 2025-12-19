/**
 * WebSocket DevTools Server
 *
 * JSON-RPC 2.0 server on port 9999 for VS Code extension
 * Provides CRUD operations for objects, methods, and properties
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { ObjectManager } from '../database/object-manager.js';
import type { ObjId, Method } from '../../types/object.js';
import { TypeGenerator } from './type-generator.js';
import { MethodTemplateGenerator } from './method-templates.js';
import { RelationshipAnalyzer } from '../lsp/relationship-analyzer.js';

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
    port = 9999
  ) {
    this.wss = new WebSocketServer({
      port,
    });

    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    // Initialize relationship components
    this.templateGenerator = new MethodTemplateGenerator();
    this.relationshipAnalyzer = new RelationshipAnalyzer();
  }

  private templateGenerator: MethodTemplateGenerator;
  private relationshipAnalyzer: RelationshipAnalyzer;

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    console.log('🔌 DevTools client connected');
    this.clients.add(ws);

    // Send hello message with capabilities
    this.sendNotification(ws, 'server.hello', {
      version: '1.0.0',
      capabilities: {
        objectCRUD: true,
        typeGeneration: true,
        changeWatch: true,
        lsp: false,
      },
    });

    ws.on('message', async (data: Buffer) => {
      try {
        const request = JSON.parse(data.toString()) as JsonRpcRequest;
        const response = await this.handleRequest(request);
        ws.send(JSON.stringify(response));
      } catch (err) {
        console.error('[DevTools] Failed to parse message:', err);
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

        case 'object.pull':
          result = await this.pullObject(params);
          break;

        case 'templates.list':
          result = await this.listTemplates(params);
          break;

        case 'templates.get':
          result = await this.getTemplate(params);
          break;

        case 'templates.generate':
          result = await this.generateTemplate(params);
          break;

        case 'relationships.analyze':
          result = await this.analyzeMethodRelationships(params);
          break;

        case 'relationships.callgraph':
          result = await this.getCallGraph(params);
          break;

        case 'relationships.findCallers':
          result = await this.findMethodCallers(params);
          break;

        case 'relationships.findOverrides':
          result = await this.findMethodOverrides(params);
          break;

        case 'relationships.getRelated':
          result = await this.getRelatedMethods(params);
          break;

        case 'object.push':
          result = await this.pushObject(params);
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
      parent: obj.parent?.value ?? obj.parent, // Extract ID from ObjRefValue
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
        parent: raw.parent?.value ?? raw.parent, // Extract ID from ObjRefValue
        properties: obj.getOwnProperties(), // Return resolved values, not typed Values
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
    const parentObj = await this.manager.load(params.parent);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: params.properties || {},
      methods: (params.methods || {}) as unknown as Record<string, Method>,
    });

    // Notify all clients
    this.broadcast('object.created', { id: obj.id });

    return { id: obj.id };
  }

  /**
   * Pull fresh data from database for an object (updates in-place)
   */
  private async pullObject(params: { id: ObjId }): Promise<any> {
    const { id } = params;
    await this.manager.pull(id);
    this.broadcast('object.changed', { id });
    return { success: true };
  }

  /**
   * Push current state to database for an object
   */
  private async pushObject(params: { id: ObjId }): Promise<any> {
    const { id } = params;
    await this.manager.push(id);
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

    // Delete property (use method from object)
    obj.deleteProperty(name);

    // Wait for auto-persist to complete
    await this.manager.flushWrites();

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
   * Analyze method relationships for a specific method
   */
  private async analyzeMethodRelationships(params: { objectId: ObjId; methodName: string }): Promise<any> {
    const { objectId, methodName } = params;
    
    try {
      const relationship = await this.relationshipAnalyzer.analyzeMethodRelationships(objectId, methodName);
      
      return {
        objectId,
        methodName,
        relationship: {
          overrides: relationship.overrides,
          overriddenBy: relationship.overriddenBy,
          callers: relationship.callers,
          callees: relationship.callees,
          related: relationship.related,
          parentChain: relationship.parentChain,
          complexity: relationship.complexity,
          callFrequency: relationship.callFrequency,
          fanOut: relationship.fanOut,
          fanIn: relationship.fanIn,
          testCoverage: relationship.testCoverage
        }
      };
    } catch (error) {
      return {
        error: `Failed to analyze relationships: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get complete call graph for all methods
   */
  private async getCallGraph(_params: { includeStats?: boolean } = {}): Promise<any> {
    try {
      await this.relationshipAnalyzer.buildCallGraph();
      
      const stats = this.relationshipAnalyzer.getStats();
      
      return {
        callGraph: {
          totalNodes: stats.totalNodes,
          totalEdges: stats.totalEdges,
          avgComplexity: stats.avgComplexity,
          mostCalled: stats.mostCalled,
          leastCalled: stats.leastCalled
        }
      };
    } catch (error) {
      return {
        error: `Failed to build call graph: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Find all objects that call a specific method
   */
  private async findMethodCallers(params: { objectId: ObjId; methodName: string }): Promise<any> {
    const { objectId, methodName } = params;
    
    try {
      const callers = await this.relationshipAnalyzer.getCallers(objectId, methodName);
      
      return {
        objectId,
        methodName,
        callers: callers.map(caller => ({
          objectId: caller.objectId,
          methodName: caller.context,
          frequency: caller.frequency
        }))
      };
    } catch (error) {
      return {
        error: `Failed to find method callers: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Find all method overrides for a specific method
   */
  private async findMethodOverrides(params: { objectId: ObjId; methodName: string }): Promise<any> {
    const { objectId, methodName } = params;
    
    try {
      const overrides = await this.relationshipAnalyzer.analyzeOverriddenBy(objectId, methodName);
      
      return {
        objectId,
        methodName,
        overrides: overrides.map(override => ({
          objectId: override.objectId,
          methodName: override.methodName
        }))
      };
    } catch (error) {
      return {
        error: `Failed to find method overrides: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get related methods for a specific method
   */
  private async getRelatedMethods(params: { objectId: ObjId; methodName: string }): Promise<any> {
    const { objectId, methodName } = params;
    
    try {
      const related = await this.relationshipAnalyzer.findRelatedMethods(objectId, methodName);
      
      return {
        objectId,
        methodName,
        related: related.map(rel => ({
          objectId: rel.objectId,
          methodName: rel.methodName,
          type: rel.type,
          strength: rel.strength
        }))
      };
    } catch (error) {
      return {
        error: `Failed to find related methods: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
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
   * List available method templates
   */
  private async listTemplates(params: { category?: string } = {}): Promise<any> {
    const category = params.category;
    
    if (category) {
      return {
        templates: this.templateGenerator.getCategoryTemplates(category),
        category
      };
    }
    
    return {
      categories: this.templateGenerator.getCategories().map(cat => ({
        id: cat,
        name: this.toTitleCase(cat),
        templates: this.templateGenerator.getCategoryTemplates(cat).length
      }))
    };
  }

  /**
   * Get specific method template
   */
  private async getTemplate(params: { category: string; methodName?: string }): Promise<any> {
    const { category, methodName } = params;
    
    if (methodName) {
      const template = this.templateGenerator.getTemplate(category, methodName);
      if (!template) {
        throw new Error(`Template not found: ${category}.${methodName}`);
      }
      
      return {
        template,
        usage: `await obj.setMethod('${methodName}', template.template);`
      };
    }
    
    const template = this.templateGenerator.getTemplate(category);
    if (!template) {
      throw new Error(`Category not found: ${category}`);
    }
    
    return {
      template,
      usage: `// Use this as a template for creating ${category} methods`
    };
  }

  /**
   * Generate method from template
   */
  private async generateTemplate(params: {
    objectId: ObjId;
    category: string;
    pattern: 'getter' | 'setter' | 'validator' | 'handler';
    methodName: string;
  }): Promise<any> {
    const { objectId, category, pattern, methodName } = params;
    
    const obj = await this.manager.load(objectId);
    if (!obj) {
      throw new Error(`Object #${objectId} not found`);
    }

    const template = this.templateGenerator.generateTemplate(category, methodName, pattern);
    if (!template) {
      throw new Error(`Cannot generate template: ${category}.${methodName} (${pattern})`);
    }

    // Apply template to object
    obj.setMethod(methodName, template.template);

    // Notify clients
    this.broadcast('method.created', { objectId, name: methodName });

    return {
      success: true,
      method: methodName,
      category,
      template: template.template,
      usage: `await obj.setMethod('${methodName}', template.template);`
    };
  }

  /**
   * Close WebSocket server
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
