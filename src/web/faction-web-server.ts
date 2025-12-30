/**
 * Faction Web Server
 *
 * Per-faction HTTP server that routes all requests to that faction's domain.
 * Uses the existing $domainRegistry infrastructure but forces the domain
 * based on faction configuration (ignores Host header).
 *
 * This allows direct access to faction websites without DNS configuration:
 *   - http://localhost:8000 → Continuum (malice.life)
 *   - http://localhost:8001 → Gray Cartel (graycartel.com)
 */

import Fastify, { type FastifyInstance } from 'fastify';
import type { ObjectManager } from '../database/object-manager.js';
import type { RuntimeObjectImpl } from '../database/runtime-object.js';

export interface FactionWebServerConfig {
  port: number;
  host?: string;
  domain: string; // Faction's domain (e.g., 'graycartel.com')
  factionId: number;
  factionName: string;
  debug?: boolean;
}

export class FactionWebServer {
  private app: FastifyInstance | null = null;
  private readonly config: FactionWebServerConfig;
  private readonly manager: ObjectManager;

  constructor(manager: ObjectManager, config: FactionWebServerConfig) {
    this.manager = manager;
    this.config = config;
  }

  async start(): Promise<void> {
    const { port, host = '0.0.0.0', domain, debug } = this.config;

    this.app = Fastify({ logger: false });

    // Register JSON body parser
    this.app.addContentTypeParser(
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
    this.app.addContentTypeParser(
      'application/x-www-form-urlencoded',
      { parseAs: 'string' },
      (_req, body, done) => {
        done(null, body as string);
      },
    );

    // POST /register - Create new player account for this faction
    this.app.post('/register', async (request, reply) => {
      try {
        const body = request.body as { username?: string; password?: string };

        // Validate request body
        if (!body || typeof body !== 'object') {
          return reply.code(400).send({
            success: false,
            error: 'Invalid request body',
          });
        }

        const { username, password } = body;

        // Validate username: 3-16 chars, starts with letter, alphanumeric + underscore, lowercase
        if (!username || typeof username !== 'string') {
          return reply.code(400).send({
            success: false,
            error: 'Username is required',
          });
        }

        const usernameLower = username.toLowerCase();
        if (!/^[a-z][a-z0-9_]{2,15}$/.test(usernameLower)) {
          return reply.code(400).send({
            success: false,
            error:
              'Username must be 3-16 characters, start with a letter, and contain only letters, numbers, and underscores',
          });
        }

        // Validate password: min 6 chars
        if (!password || typeof password !== 'string') {
          return reply.code(400).send({
            success: false,
            error: 'Password is required',
          });
        }

        if (password.length < 6) {
          return reply.code(400).send({
            success: false,
            error: 'Password must be at least 6 characters',
          });
        }

        // Check uniqueness - no existing player with this playername
        const existingPlayer = this.manager
          .query()
          .prop('playername')
          .equals(usernameLower)
          .first();
        if (existingPlayer) {
          return reply.code(409).send({
            success: false,
            error: 'Username already exists',
          });
        }

        // Get $recycler and $player prototype
        const recycler = this.manager.getAliases().get('recycler');
        const playerProto = this.manager.getAliases().get('player');

        if (!recycler || !playerProto) {
          console.error(
            `[FactionWeb:${this.config.factionName}] Missing $recycler or $player`,
          );
          return reply.code(500).send({
            success: false,
            error: 'Server configuration error',
          });
        }

        // Create player via $recycler
        const newPlayer = (await recycler.call('create', playerProto, {
          name: usernameLower, // Display name
          playername: usernameLower, // Login name
          chargenComplete: false, // Needs to complete in-game chargen
          factionId: this.config.factionId, // Ties to this faction
        })) as RuntimeObjectImpl;

        // Set password (uses bcrypt hashing)
        await newPlayer.call('setPassword', password);

        if (debug) {
          console.log(
            `[FactionWeb:${this.config.factionName}] Created player ${usernameLower} (#${newPlayer.id}) for faction ${this.config.factionId}`,
          );
        }

        return reply.code(201).send({
          success: true,
          playerId: newPlayer.id,
          message: `Account created. Connect to complete character creation.`,
        });
      } catch (error) {
        console.error(
          `[FactionWeb:${this.config.factionName}] Registration error:`,
          error,
        );
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Registration failed',
        });
      }
    });

    // All requests route through the faction's domain
    this.app.all('*', async (request, reply) => {
      try {
        // Force the faction's domain (ignore Host header)
        const hostname = domain;

        // Build meta object for handlers (simplified - no auth for now)
        const meta = {
          hostname,
          method: request.method,
          headers: Object.fromEntries(
            Object.entries(request.headers).filter(
              ([_, v]) => typeof v === 'string',
            ),
          ),
          query: request.query,
          body: request.body,
          player: null,
          isAdmin: false,
          factionPort: true, // Flag to indicate this came from faction port
        };

        // Use domain-based routing
        const domainRegistry = this.manager.getAliases().get('domainRegistry');

        if (domainRegistry) {
          const result = (await domainRegistry.call(
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

        // Domain not found in registry
        reply
          .code(503)
          .type('text/html')
          .send(`
          <!DOCTYPE html>
          <html>
          <head><title>${this.config.factionName} - Not Configured</title></head>
          <body style="background:#0a0a0a;color:#e0e0e0;font-family:monospace;padding:2rem;">
            <h1>${this.config.factionName}</h1>
            <p>Domain <code>${domain}</code> is not registered in $domainRegistry.</p>
          </body>
          </html>
        `);
      } catch (error) {
        console.error(`[FactionWeb:${this.config.factionName}] Error:`, error);
        reply
          .code(500)
          .type('text/html')
          .send(`
          <!DOCTYPE html>
          <html>
          <head><title>Error</title></head>
          <body style="background:#0a0a0a;color:#ff3366;font-family:monospace;padding:2rem;">
            <h1>Something went wrong</h1>
            <pre>${error instanceof Error ? error.message : String(error)}</pre>
          </body>
          </html>
        `);
      }
    });

    await this.app.listen({ port, host });

    if (debug) {
      console.log(
        `  🌐 HTTP listening on port ${port} for ${this.config.factionName} (${domain})`,
      );
    }
  }

  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
    }
  }
}
