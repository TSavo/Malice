/**
 * HTTP API for VS Code extension
 * Provides REST endpoints for file system operations
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import type { ObjectManager } from '../database/object-manager.js';
import { VirtualFileSystem } from './virtual-fs.js';

/**
 * Simple HTTP API server for LSP file operations
 */
export class LSPApiServer {
  private vfs: VirtualFileSystem;

  constructor(
    private manager: ObjectManager,
    private port = 3000
  ) {
    this.vfs = new VirtualFileSystem(manager);
  }

  /**
   * Start the API server
   */
  start(): void {
    const server = createServer(this.handleRequest.bind(this));

    server.listen(this.port, () => {
      console.log(`📡 LSP API Server listening on http://localhost:${this.port}`);
    });
  }

  /**
   * Handle HTTP requests
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    try {
      // List directory
      if (url.pathname.startsWith('/api/lsp/list')) {
        let path = url.pathname.substring('/api/lsp/list'.length);
        // Remove leading slash if present
        if (path.startsWith('/')) path = path.substring(1);
        const uri = `malice://${path}`;
        const entries = await this.vfs.listDirectory(uri);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(entries));
        return;
      }

      // Read file
      if (url.pathname.startsWith('/api/lsp/read')) {
        let path = url.pathname.substring('/api/lsp/read'.length);
        // Remove leading slash if present
        if (path.startsWith('/')) path = path.substring(1);
        const uri = `malice://${path}`;
        const doc = await this.vfs.getDocument(uri);

        if (!doc) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(doc.content);
        return;
      }

      // Write file
      if (url.pathname.startsWith('/api/lsp/write') && req.method === 'POST') {
        let path = url.pathname.substring('/api/lsp/write'.length);
        // Remove leading slash if present
        if (path.startsWith('/')) path = path.substring(1);
        const uri = `malice://${path}`;

        // Read body
        const body = await this.readBody(req);

        await this.vfs.updateDocument(uri, body);

        res.writeHead(200);
        res.end('OK');
        return;
      }

      // Not found
      res.writeHead(404);
      res.end('Not found');
    } catch (err) {
      console.error('API error:', err);
      res.writeHead(500);
      res.end(err instanceof Error ? err.message : 'Internal server error');
    }
  }

  /**
   * Read request body
   */
  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk.toString()));
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }
}
