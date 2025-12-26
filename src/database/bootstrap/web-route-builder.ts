import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds $webRoute prototype (dynamic ID)
 * Base prototype for web API route definitions
 *
 * Route properties:
 * - path: URL path with :param syntax (e.g., '/api/rooms/:id')
 * - methods: Array of HTTP methods (e.g., ['GET', 'PUT'])
 * - contentType: Response Content-Type header
 * - requiresAuth: false, true (any auth), or 'admin' (admin only)
 * - middleware: Array of middleware names to run
 * - handler: Method name to call for handling request
 *
 * Matching rules:
 * - Path params: :id matches any value and extracts as params.id
 * - Wildcards: * matches any remaining path segments
 * - First registered route wins
 */
export class WebRouteBuilder {
  private webRoute: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.webRoute) {
      this.webRoute = await this.manager.load(aliases.webRoute);
      if (this.webRoute && !forceRebuild) return; // Already exists
    }

    // Create new webRoute only if it doesn't exist
    if (!this.webRoute) {
      const root = await this.manager.load(1);
      this.webRoute = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Web Route',
          description: 'Base prototype for web API routes',
          path: '/',
          methods: ['GET'],
          contentType: 'application/json',
          requiresAuth: false,
          middleware: [],
          handler: 'handleRequest',
        },
        methods: {},
      });
    }

    this.addMatchMethod();
    this.addHandleRequestMethod();
  }

  private addMatchMethod(): void {
    if (!this.webRoute) return;

    this.webRoute.setMethod(
      'match',
      `
      let requestPath = args[0];
      const requestMethod = args[1];

      // Strip query string before matching
      const queryIndex = requestPath.indexOf('?');
      if (queryIndex !== -1) {
        requestPath = requestPath.substring(0, queryIndex);
      }

      // Check method match
      const methods = Array.isArray(self.methods) ? self.methods : [self.methods];
      if (!methods.includes(requestMethod)) {
        return { matched: false, params: {} };
      }

      // Check path match (simple :param and * wildcard extraction)
      const requestParts = requestPath.split('/').filter(Boolean);
      const routeParts = self.path.split('/').filter(Boolean);

      // Wildcard support: /api/* matches any length after /api/
      const wildcardIndex = routeParts.indexOf('*');
      if (wildcardIndex !== -1) {
        // Check that all parts before wildcard match
        const params = {};
        for (let i = 0; i < wildcardIndex; i++) {
          const routePart = routeParts[i];
          const requestPart = requestParts[i];

          if (requestPart === undefined) {
            return { matched: false, params: {} };
          }

          if (routePart.startsWith(':')) {
            const paramName = routePart.slice(1);
            params[paramName] = requestPart;
          } else if (routePart !== requestPart) {
            return { matched: false, params: {} };
          }
        }
        // Wildcard matches rest
        params['*'] = requestParts.slice(wildcardIndex).join('/');
        return { matched: true, params };
      }

      // Exact length match required for non-wildcard routes
      if (requestParts.length !== routeParts.length) {
        return { matched: false, params: {} };
      }

      const params = {};
      for (let i = 0; i < routeParts.length; i++) {
        const routePart = routeParts[i];
        const requestPart = requestParts[i];

        if (routePart.startsWith(':')) {
          const paramName = routePart.slice(1);
          params[paramName] = requestPart;
        } else if (routePart !== requestPart) {
          return { matched: false, params: {} };
        }
      }

      return { matched: true, params };
    `,
    );
  }

  private addHandleRequestMethod(): void {
    if (!this.webRoute) return;

    // Default handler - subclasses override this
    this.webRoute.setMethod(
      'handleRequest',
      `
      // Default implementation - returns 404
      // Routes should override this method
      return { error: 'Not implemented' };
    `,
    );
  }

  async registerAlias(): Promise<void> {
    if (!this.webRoute) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'webRoute', this.webRoute.id);
    console.log(`✅ Registered webRoute alias -> #${this.webRoute.id}`);
  }
}
