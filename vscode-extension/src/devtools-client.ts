/**
 * DevTools WebSocket Client
 * JSON-RPC 2.0 client for Malice DevTools server
 */

import WebSocket from 'ws';

interface Disposable {
  dispose(): void;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: number | string;
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

type NotificationHandler = (method: string, params: any) => void;

/**
 * WebSocket client for Malice DevTools server
 */
export class DevToolsClient {
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pending = new Map<number | string, {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }>();
  private notificationHandlers: NotificationHandler[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(private url: string) {}

  /**
   * Connect to DevTools server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        console.log('[DevTools] Connected to', this.url);
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(msg);
        } catch (err) {
          console.error('[DevTools] Failed to parse message:', err);
        }
      });

      this.ws.on('close', () => {
        console.log('[DevTools] Connection closed');
        this.handleDisconnect();
      });

      this.ws.on('error', (err) => {
        console.error('[DevTools] WebSocket error:', err);
        reject(err);
      });
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(msg: JsonRpcResponse | JsonRpcNotification): void {
    // Check if response (has id) or notification (no id)
    if ('id' in msg && msg.id !== undefined && msg.id !== null) {
      const response = msg as JsonRpcResponse;
      const id = response.id;

      if (id === null) return; // Skip null IDs

      const pending = this.pending.get(id);

      if (pending) {
        this.pending.delete(id);

        if (response.error) {
          pending.reject(new Error(response.error.message));
        } else {
          pending.resolve(response.result);
        }
      }
    } else {
      // Notification
      const notification = msg as JsonRpcNotification;
      this.notificationHandlers.forEach(handler => {
        handler(notification.method, notification.params);
      });
    }
  }

  /**
   * Handle disconnect and schedule reconnect
   */
  private handleDisconnect(): void {
    // Reject all pending requests
    this.pending.forEach(({ reject }) => {
      reject(new Error('Connection closed'));
    });
    this.pending.clear();

    // Schedule reconnect in 5 seconds
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('[DevTools] Attempting to reconnect...');
      this.connect().catch(err => {
        console.error('[DevTools] Reconnect failed:', err);
      });
    }, 5000);
  }

  /**
   * Send JSON-RPC request and wait for response
   */
  async request(method: string, params?: any): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to DevTools server');
    }

    const id = this.nextId++;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id,
    };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(request));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Register notification handler
   */
  onNotification(handler: NotificationHandler): Disposable {
    this.notificationHandlers.push(handler);
    return {
      dispose: () => {
        const index = this.notificationHandlers.indexOf(handler);
        if (index !== -1) {
          this.notificationHandlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.pending.clear();
  }

  // ==================== DevTools API Methods ====================

  /**
   * List all objects
   */
  async listObjects(includeRecycled = false): Promise<any[]> {
    const response = await this.request('objects.list', { includeRecycled });
    return response.objects;
  }

  /**
   * Get object by ID
   */
  async getObject(id: number): Promise<any> {
    const response = await this.request('object.get', { id });
    return response.object;
  }

  /**
   * Create new object
   */
  async createObject(parent: number, properties?: Record<string, any>, methods?: Record<string, string>): Promise<number> {
    const response = await this.request('object.create', { parent, properties, methods });
    return response.id;
  }

  /**
   * Delete object
   */
  async deleteObject(id: number): Promise<void> {
    await this.request('object.delete', { id });
  }

  /**
   * Get method code
   */
  async getMethod(objectId: number, name: string): Promise<{ name: string; code: string }> {
    const response = await this.request('method.get', { objectId, name });
    return response.method;
  }

  /**
   * Set method code
   */
  async setMethod(objectId: number, name: string, code: string, options?: any): Promise<void> {
    await this.request('method.set', { objectId, name, code, options });
  }

  /**
   * Delete method
   */
  async deleteMethod(objectId: number, name: string): Promise<void> {
    await this.request('method.delete', { objectId, name });
  }

  /**
   * Get property value
   */
  async getProperty(objectId: number, name: string): Promise<any> {
    const response = await this.request('property.get', { objectId, name });
    return response.property.value;
  }

  /**
   * Set property value
   */
  async setProperty(objectId: number, name: string, value: any): Promise<void> {
    await this.request('property.set', { objectId, name, value });
  }

  /**
   * Delete property
   */
  async deleteProperty(objectId: number, name: string): Promise<void> {
    await this.request('property.delete', { objectId, name });
  }
}
