import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds $webDomain prototype (inherits from $webNode)
 *
 * Represents a domain or subdomain in the web routing tree.
 * Hostname segments are matched RIGHT-TO-LEFT:
 *   kevin.api.thecontinuum.city → ['city', 'thecontinuum', 'api', 'kevin']
 *
 * Tree structure:
 *   $webDomain (segment: 'thecontinuum.city')  ← root domain
 *     ├── $webDomain (segment: 'www')          ← www.thecontinuum.city
 *     ├── $webDomain (segment: 'api')          ← api.thecontinuum.city
 *     │     └── $webDomain (segment: '*')      ← *.api.thecontinuum.city
 *     └── $webDomain (segment: '*')            ← *.thecontinuum.city (player subdomains)
 *
 * Each domain has its own route tree ($webRoute children).
 * If aliasOf is set, this domain delegates to another domain.
 */
export class WebDomainBuilder {
  private webDomain: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Need $webNode to exist first
    if (!aliases.webNode) {
      throw new Error('$webNode must be built before $webDomain');
    }
    const webNode = await this.manager.load(aliases.webNode);
    if (!webNode) {
      throw new Error('Failed to load $webNode');
    }

    if (aliases.webDomain) {
      this.webDomain = await this.manager.load(aliases.webDomain);
      if (this.webDomain && !forceRebuild) return;
    }

    if (!this.webDomain) {
      this.webDomain = await this.manager.create({
        parent: webNode,
        properties: {
          name: 'Web Domain',
          description: 'Domain/subdomain node for web routing',
          segment: '',
          aliasOf: null,
          defaultTemplate: null,
          rootRoute: null,
        },
        methods: {},
      });
    }

    this.addMethods();
  }

  private addMethods(): void {
    if (!this.webDomain) return;

    // Parse hostname into segments (right-to-left for subdomains)
    this.webDomain.setMethod(
      'parseHostname',
      `
      /**
       * Parse a hostname into segments for tree traversal.
       * Returns segments in traversal order (TLD first, then domain, then subdomains).
       *
       * Example: 'kevin.api.thecontinuum.city'
       *   → ['thecontinuum.city', 'api', 'kevin']
       *
       * Note: We treat 'thecontinuum.city' as a single segment (the root domain).
       */
      const hostname = args[0] || '';
      
      // Remove port if present
      const hostOnly = hostname.split(':')[0].toLowerCase();
      
      // Split into parts
      const parts = hostOnly.split('.');
      
      // For a typical domain like 'kevin.api.thecontinuum.city':
      // parts = ['kevin', 'api', 'thecontinuum', 'city']
      // We want: ['thecontinuum.city', 'api', 'kevin']
      
      if (parts.length < 2) {
        return [hostOnly];  // localhost or single segment
      }
      
      // Combine last two parts as the root domain
      // This handles .city, .com, .co.uk (mostly - not perfect for all TLDs)
      const rootDomain = parts.slice(-2).join('.');
      const subdomains = parts.slice(0, -2).reverse();
      
      return [rootDomain, ...subdomains];
    `,
    );

    // Resolve hostname to a domain node
    this.webDomain.setMethod(
      'resolveHostname',
      `
      /**
       * Resolve a full hostname to the matching domain node.
       * Starts from this node (should be called on root domain registry).
       *
       * Returns { domain: $webDomain, captures: string[] } or null.
       */
      const hostname = args[0];
      const segments = await self.parseHostname(hostname);
      
      if (segments.length === 0) return null;
      
      // First segment should match this domain's segment (root domain match)
      if (self.segment && self.segment !== segments[0]) {
        return null;  // Wrong root domain
      }
      
      // Resolve remaining segments through children
      const remaining = segments.slice(1);
      
      if (remaining.length === 0) {
        // Exact root domain match
        return { domain: self, captures: [] };
      }
      
      const result = await self.resolve(remaining);
      
      // Check if we have a domain that can handle the request
      // (either fully matched, or has a handler for remaining segments)
      return {
        domain: result.node,
        captures: result.captures,
        remaining: result.remaining
      };
    `,
    );

    // Get the route tree for this domain
    this.webDomain.setMethod(
      'getRouteTree',
      `
      /**
       * Get or create the root route node for this domain.
       * Routes are $webRoute objects that are children of this domain.
       */
      // Check if we have an explicit rootRoute set
      if (self.rootRoute) {
        return self.rootRoute;
      }
      
      // Look for a child that is a route (has 'methods' property)
      const children = await self.getChildren();
      for (const child of children) {
        if (child.methods !== undefined) {
          return child;
        }
      }
      
      return null;
    `,
    );

    // Handle request for this domain
    this.webDomain.setMethod(
      'handleRequest',
      `
      /**
       * Handle an HTTP request to this domain.
       *
       * args[0] = path (e.g., '/api/status')
       * args[1] = method (e.g., 'GET')
       * args[2] = meta { headers, query, player, isAdmin }
       */
      const path = args[0] || '/';
      const method = args[1] || 'GET';
      const meta = args[2] || {};
      
      // If this is an alias, delegate to the target
      if (self.aliasOf) {
        const target = self.aliasOf;
        if (target && target.handleRequest) {
          return await target.handleRequest(path, method, meta);
        }
      }
      
      // Get our route tree
      const routeTree = await self.getRouteTree();
      
      if (routeTree) {
        // Parse path into segments
        const pathSegments = path.split('/').filter(Boolean);
        
        // Resolve through route tree
        const result = await routeTree.resolve(pathSegments);
        
        if (result && result.node) {
          // Add domain info to meta
          meta.domain = self;
          meta.domainMatch = self.match;
          meta.pathCaptures = result.captures;
          
          return await result.node.handleRequest(meta);
        }
      }
      
      // No route matched - return 404
      return {
        status: 404,
        contentType: 'text/html',
        body: await self.render404(path)
      };
    `,
    );

    // Render 404 page
    this.webDomain.setMethod(
      'render404',
      `
      /**
       * Render a 404 page for this domain.
       */
      const path = args[0] || '/';
      
      return '<html><body><h1>404 Not Found</h1><p>Path: ' + path + '</p></body></html>';
    `,
    );

    // Get the effective template for this domain
    this.webDomain.setMethod(
      'getTemplate',
      `
      /**
       * Get the template for this domain, walking up the tree if needed.
       */
      if (self.defaultTemplate) {
        return self.defaultTemplate;
      }
      
      // Walk up to parent domain
      const parent = self.getParent();
      if (parent && parent.getTemplate) {
        return await parent.getTemplate();
      }
      
      return null;
    `,
    );
  }

  async registerAlias(): Promise<void> {
    if (!this.webDomain) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'webDomain', this.webDomain.id);
    console.log(`✅ Registered webDomain alias -> #${this.webDomain.id}`);
  }
}
