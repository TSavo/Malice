import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds $webRoute prototype (inherits from $webNode)
 *
 * Represents a route node in the path routing tree.
 * Path segments are matched LEFT-TO-RIGHT:
 *   /api/users/123 → ['api', 'users', '123']
 *
 * Tree structure:
 *   $webRoute (segment: '')                    ← root (/)
 *     ├── $webRoute (segment: 'api')           ← /api
 *     │     ├── $webRoute (segment: 'status')  ← /api/status
 *     │     ├── $webRoute (segment: 'users')   ← /api/users
 *     │     │     └── $webRoute (segment: '*') ← /api/users/:id (wildcard)
 *     │     └── $webRoute (segment: '*')       ← /api/* (catch-all)
 *     ├── $webRoute (segment: 'docs')          ← /docs
 *     │     └── $webRoute (segment: '*')       ← /docs/* (wildcard)
 *     └── $webRoute (segment: 'play')          ← /play
 *
 * Route properties:
 * - methods: Array of HTTP methods (e.g., ['GET', 'POST'])
 * - contentType: Response Content-Type header
 * - requiresAuth: false, true (any auth), or 'admin' (admin only)
 * - handler: Method name to call (default: 'handleRequest')
 */
export class WebRouteBuilder {
  private webRoute: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Need $webNode to exist first
    if (!aliases.webNode) {
      throw new Error('$webNode must be built before $webRoute');
    }
    const webNode = await this.manager.load(aliases.webNode);
    if (!webNode) {
      throw new Error('Failed to load $webNode');
    }

    if (aliases.webRoute) {
      this.webRoute = await this.manager.load(aliases.webRoute);
      if (this.webRoute && !forceRebuild) return;
    }

    if (!this.webRoute) {
      this.webRoute = await this.manager.create({
        parent: webNode,
        properties: {
          name: 'Web Route',
          description: 'Route node for path-based web routing',
          segment: '',
          methods: ['GET'],
          contentType: 'application/json',
          requiresAuth: false,
          handler: 'handleRequest',
        },
        methods: {},
      });
    }

    this.addMethods();
  }

  private addMethods(): void {
    if (!this.webRoute) return;

    // Check if this route matches the HTTP method
    this.webRoute.setMethod(
      'matchMethod',
      `
      /**
       * Check if this route handles the given HTTP method.
       */
      const method = args[0];
      const methods = Array.isArray(self.methods) ? self.methods : [self.methods];
      return methods.includes(method);
    `,
    );

    // Override handleRequest for route-specific behavior
    this.webRoute.setMethod(
      'handleRequest',
      `
      /**
       * Handle an HTTP request to this route.
       *
       * args[0] = meta { method, headers, query, player, isAdmin, domain, pathCaptures }
       */
      const meta = args[0] || {};
      const method = meta.method || 'GET';
      
      // Check method match
      if (!await self.matchMethod(method)) {
        return {
          status: 405,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Method not allowed' })
        };
      }
      
      // Check auth requirements
      const authResult = await self.checkAuth(meta);
      if (authResult) return authResult;
      
      // Call the handler method
      const handlerName = self.handler || 'handle';
      
      if (handlerName === 'handleRequest') {
        // Default: return info about the route
        return {
          status: 200,
          contentType: self.contentType || 'application/json',
          body: JSON.stringify({
            route: self.segment,
            match: self.match,
            methods: self.methods
          })
        };
      }
      
      // Call custom handler
      try {
        const result = await self.call(handlerName, meta);
        
        // Normalize response
        if (result && typeof result === 'object' && result.status !== undefined) {
          return result;
        }
        
        return {
          status: 200,
          contentType: self.contentType || 'application/json',
          body: typeof result === 'string' ? result : JSON.stringify(result)
        };
      } catch (err) {
        console.error('[WebRoute] Handler error:', err);
        return {
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: err.message || 'Internal server error' })
        };
      }
    `,
    );

    // Check authentication requirements
    this.webRoute.setMethod(
      'checkAuth',
      `
      /**
       * Check if the request meets auth requirements.
       * Returns null if OK, or error response if not.
       */
      const meta = args[0] || {};
      const requiresAuth = self.requiresAuth;
      
      if (!requiresAuth) return null;  // Public route
      
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
      
      return null;  // Auth passed
    `,
    );

    // Render HTML content through a template
    this.webRoute.setMethod(
      'renderTemplate',
      `
      /**
       * Render content through a template.
       * Uses domain's template if available.
       *
       * args[0] = data object { title, content, ... }
       * args[1] = optional template override
       */
      const data = args[0] || {};
      let template = args[1];
      
      // Get template from domain if not provided
      if (!template && self.template) {
        template = self.template;
      }
      
      if (!template) {
        // Try to get from meta.domain
        const meta = data.meta || {};
        if (meta.domain && meta.domain.getTemplate) {
          template = await meta.domain.getTemplate();
        }
      }
      
      if (!template || !template.render) {
        // No template - return raw content
        return data.content || '';
      }
      
      return await template.render(data);
    `,
    );

    // Helper to create child route
    this.webRoute.setMethod(
      'route',
      `
      /**
       * Create or get a child route.
       * Convenience method for building route trees.
       *
       * args[0] = segment (e.g., 'api', 'users', '*')
       * args[1] = optional config { methods, contentType, requiresAuth, handler }
       */
      const segment = args[0];
      const config = args[1] || {};
      
      // Use addChild from $webNode
      const child = await self.addChild(segment, {
        methods: config.methods || ['GET'],
        contentType: config.contentType || 'application/json',
        requiresAuth: config.requiresAuth || false,
        handler: config.handler || 'handleRequest',
        ...config
      });
      
      return child;
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
