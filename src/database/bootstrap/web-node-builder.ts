import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds $webNode prototype
 *
 * Base prototype for segment-tree matching used by both:
 * - $webDomain (hostname segments, matched right-to-left)
 * - $webRoute (path segments, matched left-to-right)
 *
 * Tree structure:
 *   Each node has a 'segment' (string to match) and 'children' (ordered array).
 *   Wildcard segment '*' matches any value and captures it in 'match'.
 *   First matching child wins.
 *
 * Example domain tree:
 *   $webNode (segment: 'thecontinuum.city')
 *     ├── $webNode (segment: 'www')  → www.thecontinuum.city
 *     ├── $webNode (segment: 'api')  → api.thecontinuum.city
 *     └── $webNode (segment: '*')    → *.thecontinuum.city (wildcard)
 *
 * Example route tree:
 *   $webNode (segment: '')           → /
 *     ├── $webNode (segment: 'api')  → /api
 *     │     ├── $webNode (segment: 'status')  → /api/status
 *     │     └── $webNode (segment: '*')       → /api/* (wildcard)
 *     └── $webNode (segment: 'docs')
 *           └── $webNode (segment: '*')       → /docs/* (wildcard)
 */
export class WebNodeBuilder implements Builder {
  static provides = ['webNode'];
  static depends: string[] = [];

  private webNode: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.webNode) {
      this.webNode = await this.manager.load(aliases.webNode);
      if (this.webNode && !forceRebuild) return;
    }

    if (!this.webNode) {
      const root = await this.manager.load(1);
      this.webNode = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Web Node',
          description: 'Base prototype for segment-tree web routing',
          segment: '',
          match: null,
          template: null,
        },
        methods: {},
      });
    }

    this.addMethods();
  }

  private addMethods(): void {
    if (!this.webNode) return;

    // Get children - from the children array property
    this.webNode.setMethod(
      'getChildren',
      `
      /**
       * Returns array of child $webNode objects.
       * Children are stored in the 'children' array property.
       */
      const childRefs = self.children || [];
      const children = [];
      
      for (const ref of childRefs) {
        if (ref) {
          children.push(ref);
        }
      }
      
      // Sort by specificity: exact matches before wildcards
      children.sort((a, b) => {
        if (a.segment === '*' && b.segment !== '*') return 1;
        if (a.segment !== '*' && b.segment === '*') return -1;
        return 0;
      });
      
      return children;
    `,
    );

    // Match a single segment against children
    this.webNode.setMethod(
      'matchChild',
      `
      /**
       * Find child matching the given segment.
       * Returns { node: $webNode, captured: string|null } or null if no match.
       *
       * Matching rules (in order):
       * 1. Exact segment match
       * 2. Wildcard '*' (captures the segment value)
       */
      const segment = args[0];
      const children = await self.getChildren();
      
      let wildcardChild = null;
      
      for (const child of children) {
        // Exact match takes priority
        if (child.segment === segment) {
          return { node: child, captured: null };
        }
        
        // Remember wildcard for fallback
        if (child.segment === '*') {
          wildcardChild = child;
        }
      }
      
      // Wildcard fallback
      if (wildcardChild) {
        return { node: wildcardChild, captured: segment };
      }
      
      return null;
    `,
    );

    // Resolve full path through the tree
    this.webNode.setMethod(
      'resolve',
      `
      /**
       * Walk the tree matching each segment.
       * Returns { node: $webNode, captures: string[], remaining: string[] }
       *
       * args[0] = segments array (e.g., ['api', 'users', '123'])
       */
      const segments = args[0] || [];
      
      let current = self;
      const captures = [];
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const result = await current.matchChild(segment);
        
        if (!result) {
          // No match - return current node with remaining segments
          return {
            node: current,
            captures: captures,
            remaining: segments.slice(i)
          };
        }
        
        // Capture wildcard values
        if (result.captured !== null) {
          captures.push(result.captured);
          result.node.match = result.captured;  // Set on the node too
        }
        
        current = result.node;
      }
      
      // Fully matched
      return {
        node: current,
        captures: captures,
        remaining: []
      };
    `,
    );

    // Add a child node
    this.webNode.setMethod(
      'addChild',
      `
      /**
       * Add a child node with the given segment.
       * Returns the new/existing child node.
       *
       * args[0] = child node (already created)
       */
      const child = args[0];
      
      if (!child) {
        throw new Error('Child node is required');
      }
      
      // Initialize children array if needed
      const children = self.children || [];
      
      // Check if already added
      if (!children.some(c => c && c.id === child.id)) {
        children.push(child);
        self.children = children;
      }
      
      return child;
    `,
    );

    // Find or create path through tree
    this.webNode.setMethod(
      'ensurePath',
      `
      /**
       * Ensure a path exists through the tree, creating nodes as needed.
       * Returns the leaf node.
       *
       * args[0] = segments array (e.g., ['api', 'users'])
       */
      const segments = args[0] || [];
      
      let current = self;
      
      for (const segment of segments) {
        current = await current.addChild(segment);
      }
      
      return current;
    `,
    );

    // Default handleRequest - override in subclasses
    this.webNode.setMethod(
      'handleRequest',
      `
      /**
       * Handle a request to this node.
       * Override in $webDomain or $webRoute subclasses.
       *
       * args[0] = meta { method, headers, query, player, isAdmin }
       */
      return {
        status: 404,
        contentType: 'text/plain',
        body: 'Not found'
      };
    `,
    );

    // Debug: print tree structure
    this.webNode.setMethod(
      'printTree',
      `
      /**
       * Debug utility: print the tree structure.
       * args[0] = indent level (default 0)
       */
      const indent = args[0] || 0;
      const prefix = '  '.repeat(indent);
      const segmentDisplay = self.segment === '' ? '(root)' : self.segment;
      
      let result = prefix + segmentDisplay;
      if (self.name && self.name !== 'Web Node') {
        result += ' [' + self.name + ']';
      }
      result += '\\n';
      
      const children = await self.getChildren();
      for (const child of children) {
        result += await child.printTree(indent + 1);
      }
      
      return result;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.webNode) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'webNode', this.webNode.id);
    console.log(`✅ Registered webNode alias -> #${this.webNode.id}`);
  }
}

// Self-register
registerBuilder(WebNodeBuilder);
