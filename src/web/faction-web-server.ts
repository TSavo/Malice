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
