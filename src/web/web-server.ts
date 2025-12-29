/**
 * Web Server for Malice
 *
 * A lightweight Fastify server that delegates all requests to MOO objects.
 * Content, templates, and routing logic all live in MongoDB as $webSite, $webPage, $webTemplate.
 *
 * Routing order:
 * 1. Try new domain-based routing via $domainRegistry (tree-based, supports multi-domain)
 * 2. Fallback to legacy $webSite routing (single-site)
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
  config: WebServerConfig = {},
) {
  const port = config.port ?? 80;
  const host = config.host ?? '0.0.0.0';

  const app = Fastify({
    logger: false,
  });

  // Authenticate HTTP Basic Auth
  async function authenticate(
    request: any,
  ): Promise<{ player: any; isAdmin: boolean }> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return { player: null, isAdmin: false };
    }

    try {
      const base64Creds = authHeader.slice(6);
      const credentials = Buffer.from(base64Creds, 'base64').toString('utf-8');
      const [username, password] = credentials.split(':', 2);

      if (!username || !password) {
        return { player: null, isAdmin: false };
      }

      const objectManager = await manager.load(0);
      const aliases =
        (objectManager?.get('aliases') as Record<string, number>) || {};
      const playerPrototypeId = aliases.player;
      const adminPrototypeId = aliases.admin;

      const users = await manager.db.listAll(false);
      const getValue = (v: any) =>
        v && typeof v === 'object' && 'type' in v ? v.value : v;

      const userDoc = users.find((u) => {
        const parentId = getValue(u.parent);
        return (
          (parentId === playerPrototypeId || parentId === adminPrototypeId) &&
          getValue(u.properties.playername) === username.toLowerCase()
        );
      });

      if (!userDoc) {
        return { player: null, isAdmin: false };
      }

      const player = await manager.load(userDoc._id);
      if (!player) {
        return { player: null, isAdmin: false };
      }

      const valid = (await player.call('checkPassword', password)) as boolean;
      if (!valid) {
        return { player: null, isAdmin: false };
      }

      const isAdmin =
        player.get('isAdmin') === true || player.get('isWizard') === true;

      return { player, isAdmin };
    } catch (err) {
      console.error('[WebServer] Auth error:', err);
      return { player: null, isAdmin: false };
    }
  }

  // All requests route through domain tree, then route tree
  app.all('*', async (request, reply) => {
    try {
      // Extract hostname (strip port if present)
      const hostname = (request.hostname || 'localhost')
        .split(':')[0]
        .toLowerCase();

      // Build meta object for handlers
      const auth = await authenticate(request);
      const meta = {
        hostname,
        method: request.method,
        headers: Object.fromEntries(
          Object.entries(request.headers).filter(
            ([_, v]) => typeof v === 'string',
          ),
        ),
        query: request.query,
        player: auth.player,
        isAdmin: auth.isAdmin,
      };

      // Try new domain-based routing first
      const domainRegistry = manager.getAliases().get('domainRegistry');

      if (domainRegistry) {
        // Use new tree-based domain/route resolution
        const domainResult = (await domainRegistry.call(
          'handleRequest',
          hostname,
          request.url,
          meta,
        )) as {
          status?: number;
          contentType?: string;
          body?: string;
          headers?: Record<string, string>;
        } | null;

        if (domainResult && domainResult.status !== 404) {
          // Domain handled the request
          const {
            status = 200,
            contentType = 'text/html',
            body = '',
            headers = {},
          } = domainResult;
          for (const [key, value] of Object.entries(headers)) {
            reply.header(key, value);
          }
          reply.code(status).type(contentType).send(body);
          return;
        }
      }

      // Fallback to legacy $webSite routing
      const webSite = manager.getAliases().get('webSite');

      if (!webSite) {
        reply
          .code(503)
          .type('text/html')
          .send(`
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

      // Call the legacy MOO handleRequest method
      const result = await webSite.call(
        'handleRequest',
        request.url,
        request.method,
        meta,
      );

      // Handle the response
      if (result && typeof result === 'object') {
        const {
          status = 200,
          contentType = 'text/html',
          body = '',
          headers = {},
        } = result as {
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
      reply
        .code(500)
        .type('text/html')
        .send(`
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
  console.log(
    `🌐 Website: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
  );

  return app;
}
