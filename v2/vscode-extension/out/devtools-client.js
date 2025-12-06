"use strict";
/**
 * DevTools WebSocket Client
 * JSON-RPC 2.0 client for Malice DevTools server
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevToolsClient = void 0;
const ws_1 = __importDefault(require("ws"));
const vscode = __importStar(require("vscode"));
/**
 * WebSocket client for Malice DevTools server
 */
class DevToolsClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.nextId = 1;
        this.pending = new Map();
        this.notificationHandlers = [];
        this.reconnectTimer = null;
    }
    /**
     * Connect to DevTools server
     */
    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new ws_1.default(this.url);
            this.ws.on('open', () => {
                console.log('[DevTools] Connected to', this.url);
                resolve();
            });
            this.ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    this.handleMessage(msg);
                }
                catch (err) {
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
    handleMessage(msg) {
        // Check if response (has id) or notification (no id)
        if ('id' in msg && msg.id !== undefined && msg.id !== null) {
            const response = msg;
            const id = response.id;
            if (id === null)
                return; // Skip null IDs
            const pending = this.pending.get(id);
            if (pending) {
                this.pending.delete(id);
                if (response.error) {
                    pending.reject(new Error(response.error.message));
                }
                else {
                    pending.resolve(response.result);
                }
            }
        }
        else {
            // Notification
            const notification = msg;
            this.notificationHandlers.forEach(handler => {
                handler(notification.method, notification.params);
            });
        }
    }
    /**
     * Handle disconnect and schedule reconnect
     */
    handleDisconnect() {
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
    async request(method, params) {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
            throw new Error('Not connected to DevTools server');
        }
        const id = this.nextId++;
        const request = {
            jsonrpc: '2.0',
            method,
            params,
            id,
        };
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify(request));
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
    onNotification(handler) {
        this.notificationHandlers.push(handler);
        return new vscode.Disposable(() => {
            const index = this.notificationHandlers.indexOf(handler);
            if (index !== -1) {
                this.notificationHandlers.splice(index, 1);
            }
        });
    }
    /**
     * Close connection
     */
    close() {
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
    async listObjects(includeRecycled = false) {
        const response = await this.request('objects.list', { includeRecycled });
        return response.objects;
    }
    /**
     * Get object by ID
     */
    async getObject(id) {
        const response = await this.request('object.get', { id });
        return response.object;
    }
    /**
     * Create new object
     */
    async createObject(parent, properties, methods) {
        const response = await this.request('object.create', { parent, properties, methods });
        return response.id;
    }
    /**
     * Delete object
     */
    async deleteObject(id) {
        await this.request('object.delete', { id });
    }
    /**
     * Get method code
     */
    async getMethod(objectId, name) {
        const response = await this.request('method.get', { objectId, name });
        return response.method;
    }
    /**
     * Set method code
     */
    async setMethod(objectId, name, code, options) {
        await this.request('method.set', { objectId, name, code, options });
    }
    /**
     * Delete method
     */
    async deleteMethod(objectId, name) {
        await this.request('method.delete', { objectId, name });
    }
    /**
     * Get property value
     */
    async getProperty(objectId, name) {
        const response = await this.request('property.get', { objectId, name });
        return response.property.value;
    }
    /**
     * Set property value
     */
    async setProperty(objectId, name, value) {
        await this.request('property.set', { objectId, name, value });
    }
    /**
     * Delete property
     */
    async deleteProperty(objectId, name) {
        await this.request('property.delete', { objectId, name });
    }
}
exports.DevToolsClient = DevToolsClient;
//# sourceMappingURL=devtools-client.js.map