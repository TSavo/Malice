import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds $domainRegistry object
 *
 * Central registry for all web domains. This is the entry point for
 * web-server.ts to find the right domain for incoming requests.
 *
 * The registry maintains a list of root domains (e.g., thecontinuum.city).
 * Each root domain is a $webDomain object that may have child subdomains.
 *
 * Resolution flow:
 * 1. Parse hostname → segments
 * 2. Find matching root domain
 * 3. Delegate to domain's handleRequest
 */
export class DomainRegistryBuilder {
  private registry: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.domainRegistry) {
      this.registry = await this.manager.load(aliases.domainRegistry);
      if (this.registry && !forceRebuild) return;
    }

    if (!this.registry) {
      const root = await this.manager.load(1);
      this.registry = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Domain Registry',
          description: 'Central registry for web domains',
          domains: [], // Array of $webDomain objects (root domains only)
          defaultDomain: null, // Fallback domain for unknown hosts
        },
        methods: {},
      });
    }

    this.addMethods();
  }

  private addMethods(): void {
    if (!this.registry) return;

    // Register a root domain
    this.registry.setMethod(
      'register',
      `
      /**
       * Register a root domain with the registry.
       * 
       * args[0] = $webDomain object
       */
      const domain = args[0];
      
      if (!domain || !domain.segment) {
        throw new Error('Invalid domain object - must have segment');
      }
      
      const domains = self.domains || [];
      
      // Check if already registered
      if (!domains.some(d => d && d.id === domain.id)) {
        domains.push(domain);
        self.domains = domains;
        console.log('[DomainRegistry] Registered domain:', domain.segment);
      }
      
      return domain;
    `,
    );

    // Set default domain for unknown hosts
    this.registry.setMethod(
      'setDefault',
      `
      /**
       * Set the default domain for unknown hostnames.
       * 
       * args[0] = $webDomain object
       */
      const domain = args[0];
      self.defaultDomain = domain;
      console.log('[DomainRegistry] Set default domain:', domain?.segment || 'null');
      return domain;
    `,
    );

    // Find domain by hostname
    this.registry.setMethod(
      'findDomain',
      `
      /**
       * Find the domain that matches a hostname.
       * Returns { domain: $webDomain, captures: string[] } or null.
       *
       * args[0] = hostname (e.g., 'kevin.api.thecontinuum.city')
       */
      const hostname = args[0] || '';
      const hostLower = hostname.toLowerCase().split(':')[0]; // Strip port
      
      const domains = self.domains || [];
      
      // Try each registered root domain
      for (const rootDomain of domains) {
        if (!rootDomain) continue;
        
        // Check if hostname matches or is subdomain of this root
        const rootSegment = rootDomain.segment.toLowerCase();
        
        if (hostLower === rootSegment) {
          // Exact match
          return { domain: rootDomain, captures: [] };
        }
        
        if (hostLower.endsWith('.' + rootSegment)) {
          // Subdomain - extract subdomain parts and resolve through children
          const subdomain = hostLower.slice(0, -(rootSegment.length + 1));
          const subdomainParts = subdomain.split('.').reverse(); // ['api', 'kevin'] for kevin.api.x.y
          
          const result = await rootDomain.resolve(subdomainParts);
          
          return {
            domain: result.node,
            captures: result.captures,
            remaining: result.remaining
          };
        }
      }
      
      // No match - return default domain if set
      if (self.defaultDomain) {
        return { domain: self.defaultDomain, captures: [], remaining: [] };
      }
      
      return null;
    `,
    );

    // Handle incoming request
    this.registry.setMethod(
      'handleRequest',
      `
      /**
       * Route a request to the appropriate domain.
       *
       * args[0] = hostname
       * args[1] = path (URL path including query string)
       * args[2] = meta { method, headers, query, player, isAdmin }
       */
      const hostname = args[0];
      const fullPath = args[1] || '/';
      const meta = args[2] || {};
      
      // Strip query string from path
      const path = fullPath.split('?')[0];
      
      // Find matching domain
      const match = await self.findDomain(hostname);
      
      if (!match || !match.domain) {
        return {
          status: 404,
          contentType: 'text/html',
          body: '<html><body><h1>Domain not found</h1><p>No domain configured for: ' + hostname + '</p></body></html>'
        };
      }
      
      // Add domain match info to meta
      meta.domainCaptures = match.captures;
      meta.domainRemaining = match.remaining;
      
      // Delegate to domain
      return await match.domain.handleRequest(path, meta.method || 'GET', meta);
    `,
    );

    // List all registered domains
    this.registry.setMethod(
      'list',
      `
      /**
       * List all registered root domains.
       */
      const domains = self.domains || [];
      return domains.filter(Boolean).map(d => ({
        id: d.id,
        segment: d.segment,
        name: d.name
      }));
    `,
    );

    // Debug: describe the registry
    this.registry.setMethod(
      'describe',
      `
      /**
       * Get a human-readable description of the registry.
       */
      const domains = self.domains || [];
      const defaultName = self.defaultDomain ? self.defaultDomain.segment : 'none';
      
      let result = 'Domain Registry\\n';
      result += '================\\n';
      result += 'Default: ' + defaultName + '\\n';
      result += 'Domains:\\n';
      
      for (const domain of domains.filter(Boolean)) {
        result += '  - ' + domain.segment + ' (#' + domain.id + ')\\n';
        
        // Show children if any
        if (domain.getChildren) {
          const children = await domain.getChildren();
          for (const child of children) {
            result += '    - ' + child.segment + ' (#' + child.id + ')\\n';
          }
        }
      }
      
      return result;
    `,
    );
  }

  async registerAlias(): Promise<void> {
    if (!this.registry) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'domainRegistry', this.registry.id);
    console.log(`✅ Registered domainRegistry alias -> #${this.registry.id}`);
  }
}
