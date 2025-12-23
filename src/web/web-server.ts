/**
 * Web Server for Malice
 *
 * A lightweight Fastify server that delegates all requests to MOO objects.
 * Content, templates, and routing logic all live in MongoDB as $webSite, $webPage, $webTemplate.
 *
 * This follows the same pattern as other transports:
 * - TypeScript handles the socket/HTTP infrastructure
 * - MOO objects handle all the logic
 */

import Fastify from 'fastify';
import type { ObjectManager } from '../database/object-manager.js';

export interface WebServerConfig {
  port?: number;
  host?: string;
}

export async function createWebServer(
  manager: ObjectManager,
  config: WebServerConfig = {}
) {
  const port = config.port ?? 80;
  const host = config.host ?? '0.0.0.0';

  const app = Fastify({
    logger: false,
  });

  // All requests go to $webSite.handleRequest
  app.all('*', async (request, reply) => {
    try {
      // Load $webSite object via alias
      const webSite = manager.getAliases().get('webSite');

      if (!webSite) {
        reply.code(503).type('text/html').send(`
          <!DOCTYPE html>
          <html>
          <head><title>Malice - Starting</title></head>
          <body style="background:#0a0a0a;color:#e0e0e0;font-family:monospace;padding:2rem;">
            <h1>Malice is starting...</h1>
            <p>The website objects haven't been bootstrapped yet.</p>
            <p>Run: <code>npm run bootstrap:apply</code></p>
          </body>
          </html>
        `);
        return;
      }

      // Call the MOO handleRequest method
      const result = await webSite.call('handleRequest', request.url, request.method, {
        headers: Object.fromEntries(
          Object.entries(request.headers).filter(([_, v]) => typeof v === 'string')
        ),
        query: request.query,
      });

      // Handle the response
      if (result && typeof result === 'object') {
        const { status = 200, contentType = 'text/html', body = '', headers = {} } = result as {
          status?: number;
          contentType?: string;
          body?: string;
          headers?: Record<string, string>;
        };

        // Set custom headers
        for (const [key, value] of Object.entries(headers)) {
          reply.header(key, value);
        }

        reply.code(status).type(contentType).send(body);
      } else {
        // If result is a string, treat as HTML body
        reply.type('text/html').send(result || '');
      }
    } catch (error) {
      console.error('Web server error:', error);
      reply.code(500).type('text/html').send(`
        <!DOCTYPE html>
        <html>
        <head><title>Malice - Error</title></head>
        <body style="background:#0a0a0a;color:#ff3366;font-family:monospace;padding:2rem;">
          <h1>Something went wrong</h1>
          <pre>${error instanceof Error ? error.message : String(error)}</pre>
        </body>
        </html>
      `);
    }
  });

  await app.listen({ port, host });
  console.log(`🌐 Website: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);

  return app;
}
