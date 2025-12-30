/**
 * Web Server for Malice (malice.world)
 *
 * A lightweight Fastify server that serves the $metaDomain (malice.world).
 * Port 80 serves malice.world directly - no hostname-based routing.
 *
 * Routes:
 * - /admin/* - Admin setup wizard and MOO editor
 * - /map/* - 3D world map visualization
 * - /api/map/* - Map API endpoints
 *
 * Faction websites (thecontinuum.city, graycartel.com) are served
 * via faction proxy containers on their own ports.
 *
 * This follows the same pattern as other transports:
 * - TypeScript handles the socket/HTTP infrastructure
 * - MOO objects handle all the logic
 */

import crypto from 'node:crypto';
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

  // Register JSON body parser
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req, body, done) => {
      try {
        done(null, JSON.parse(body as string));
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  // Register form urlencoded body parser
  app.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (_req, body, done) => {
      done(null, body as string);
    },
  );

  // Validate credentials and return player object
  async function validateCredentials(
    username: string,
    password: string,
  ): Promise<any | null> {
    try {
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
        return null;
      }

      const player = await manager.load(userDoc._id);
      if (!player) {
        return null;
      }

      const valid = (await player.call('checkPassword', password)) as boolean;
      if (!valid) {
        return null;
      }

      // Reject incomplete characters
      if (!player.get('chargenComplete')) {
        console.log('[WebAuth] Rejecting incomplete character:', username);
        return null;
      }

      return player;
    } catch (err) {
      console.error('[WebServer] Auth error:', err);
      return null;
    }
  }

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

      const player = await validateCredentials(username, password);
      if (!player) {
        console.log('[WebAuth] Auth failed for:', username);
        return { player: null, isAdmin: false };
      }

      const isAdmin =
        player.get('isAdmin') === true || player.get('isWizard') === true;
      console.log('[WebAuth] Auth success:', username, 'isAdmin:', isAdmin);

      return { player, isAdmin };
    } catch (err) {
      console.error('[WebServer] Auth error:', err);
      return { player: null, isAdmin: false };
    }
  }

  // POST /api/auth - Authenticate and return one-time token
  app.post('/api/auth', async (request, reply) => {
    try {
      const body = request.body as { username?: string; password?: string };
      const { username, password } = body || {};

      if (!username || !password) {
        return reply
          .code(400)
          .send({ error: 'Username and password required' });
      }

      const player = await validateCredentials(username, password);
      if (!player) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate one-time token
      const token = crypto.randomUUID();
      const expiresAt = Date.now() + 60000; // 60 seconds

      // Store token on $system
      const system = manager.getAliases().get('system');
      if (system) {
        await system.call('storeAuthToken', token, player.id, expiresAt);
      }

      console.log('[WebAuth] Token issued for:', username);
      return { token, expiresIn: 60 };
    } catch (err) {
      console.error('[WebServer] Auth API error:', err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // All requests route through $metaDomain (malice.world)
  // Port 80 serves malice.world directly - no hostname-based routing
  app.all('*', async (request, reply) => {
    try {
      // Build meta object for handlers
      const auth = await authenticate(request);
      const meta = {
        hostname: 'malice.world',
        method: request.method,
        headers: Object.fromEntries(
          Object.entries(request.headers).filter(
            ([_, v]) => typeof v === 'string',
          ),
        ),
        query: request.query,
        body: request.body,
        player: auth.player,
        isAdmin: auth.isAdmin,
      };

      // Route through $metaDomain (malice.world)
      const metaDomain = manager.getAliases().get('metaDomain');

      if (metaDomain) {
        // Use $metaDomain's route tree for all requests
        const result = (await metaDomain.call(
          'handleRequest',
          request.url,
          request.method,
          meta,
        )) as {
          status?: number;
          contentType?: string;
          body?: string;
          headers?: Record<string, string>;
        } | null;

        if (result) {
          const {
            status = 200,
            contentType = 'text/html',
            body = '',
            headers = {},
          } = result;
          for (const [key, value] of Object.entries(headers)) {
            reply.header(key, value);
          }
          reply.code(status).type(contentType).send(body);
          return;
        }
      }

      // Fallback to legacy $webSite routing (for backwards compatibility)
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
    `🌐 malice.world: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
  );

  return app;
}
