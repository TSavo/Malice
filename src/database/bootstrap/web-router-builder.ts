import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds $webRouter object (dynamic ID)
 * Central router for web API routes
 *
 * Routes self-register via $.webRouter.register(routeObject)
 * Routes are dispatched in registration order (first match wins)
 * Middleware runs before route handlers
 *
 * Middleware signature:
 *   (path, method, meta, params) => Promise<null | { status?, body?, headers? }>
 *   - null: Continue to next middleware/route
 *   - { headers }: Add response headers, continue
 *   - { status, body }: Short-circuit with custom response
 */
export class WebRouterBuilder implements Builder {
  static provides = ['webRouter'];
  static depends: string[] = [];

  private webRouter: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.webRouter) {
      this.webRouter = await this.manager.load(aliases.webRouter);
      if (this.webRouter) return; // Already exists
    }

    // Create new webRouter only if it doesn't exist
    if (!this.webRouter) {
      const root = await this.manager.load('root');
      this.webRouter = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Web Router',
          description: 'Central router for web API routes',
          routes: [],
          middleware: {},
        },
        methods: {},
      });
    }

    // Set methods using atomic updates (no race conditions)
    this.webRouter.setMethod('register', this.getRegisterCode());
    this.webRouter.setMethod('addMiddleware', this.getAddMiddlewareCode());
    this.webRouter.setMethod('dispatch', this.getDispatchCode());
    this.webRouter.setMethod('checkAuth', this.getCheckAuthCode());
  }

  async registerAliases(): Promise<void> {
    if (!this.webRouter) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'webRouter', this.webRouter.id);
    console.log(`Registered webRouter alias -> #${this.webRouter.id}`);
  }

  // Code getter methods for inline creation
  private getRegisterCode(): string {
    return `
      const route = args[0];
      if (!route || typeof route.id !== 'number') {
        throw new Error('Invalid route object - must be a RuntimeObject');
      }

      const routes = self.routes || [];
      // Check if already registered
      if (!routes.some(r => r && r.id === route.id)) {
        // .push() is proxied - automatically uses atomic $push
        routes.push(route);
        console.log('[WebRouter] Route registered:', route.path, route.methods);
      }
    `;
  }

  private getAddMiddlewareCode(): string {
    return `
      const name = args[0];
      const handlerMethodName = args[1];

      if (!name || typeof name !== 'string') {
        throw new Error('Middleware name must be a string');
      }
      if (!handlerMethodName || typeof handlerMethodName !== 'string') {
        throw new Error('Handler method name must be a string');
      }

      const middleware = self.middleware || {};
      middleware[name] = handlerMethodName;
      self.middleware = middleware;
      console.log('[WebRouter] Middleware registered:', name);
    `;
  }

  private getDispatchCode(): string {
    return `
      const path = args[0];
      const method = args[1];
      const meta = args[2] || {};

      const routes = self.routes || [];
      let responseHeaders = {};

      // Iterate in registration order (first match wins)
      // Routes are stored as objrefs, fromValue resolves them to RuntimeObjects
      for (const route of routes) {
        if (!route) continue;

        // Check if route matches
        const match = await route.match(path, method);
        if (!match.matched) continue;

        // Check auth requirements
        const authCheck = await self.checkAuth(route, meta);
        if (authCheck) {
          return authCheck; // Return 401/403 if auth fails
        }

        // Run middleware chain
        const middlewareChain = route.middleware || [];
        for (const mwName of middlewareChain) {
          const middlewareMethodName = self.middleware[mwName];
          if (middlewareMethodName && route.hasMethod && route.hasMethod(middlewareMethodName)) {
            try {
              const result = await route.call(middlewareMethodName, path, method, meta, match.params);

              // Short-circuit with response
              if (result && (result.status !== undefined || result.body !== undefined)) {
                return {
                  status: result.status || 200,
                  contentType: result.contentType || route.contentType,
                  body: result.body || '',
                  headers: { ...responseHeaders, ...(result.headers || {}) }
                };
              }

              // Header modifications - accumulate
              if (result && result.headers) {
                Object.assign(responseHeaders, result.headers);
              }
            } catch (err) {
              console.error('[WebRouter] Middleware error:', mwName, err);
              return {
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Middleware error: ' + (err.message || String(err)) }),
                headers: responseHeaders
              };
            }
          }
        }

        // Call route handler
        const handlerName = route.handler || 'handleRequest';

        try {
          // Pass params and meta to handler
          const body = await route.call(handlerName, match.params, meta);

          // Handle different return types
          if (body && typeof body === 'object' && body.status !== undefined) {
            // Handler returned a full response object
            return {
              status: body.status,
              contentType: body.contentType || route.contentType,
              body: body.body !== undefined ? body.body : '',
              headers: { ...responseHeaders, ...(body.headers || {}) }
            };
          }

          // Handler returned just the body
          return {
            status: 200,
            contentType: route.contentType,
            body: typeof body === 'string' ? body : JSON.stringify(body),
            headers: responseHeaders
          };
        } catch (err) {
          console.error('[WebRouter] Handler error in', route.path, err);
          return {
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: err.message || 'Internal server error' }),
            headers: responseHeaders
          };
        }
      }

      return null; // No route matched
    `;
  }

  private getCheckAuthCode(): string {
    return `
      const route = args[0];
      const meta = args[1] || {};

      const requiresAuth = route.requiresAuth;
      if (!requiresAuth) return null; // Public route

      const isAdmin = meta.isAdmin || false;
      const player = meta.player || null;

      if (requiresAuth === 'admin' && !isAdmin) {
        return {
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Admin access required' })
        };
      }

      if (requiresAuth === true && !player) {
        return {
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Authentication required' })
        };
      }

      return null; // Auth passed
    `;
  }
}

// Self-register
registerBuilder(WebRouterBuilder);
