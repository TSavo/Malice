/**
 * Virtual File System for LSP
 * Maps MongoDB objects to TypeScript virtual files
 */

import type { ObjId, RuntimeObject } from '../../types/object';
import type { ObjectManager } from '../database/object-manager';

/**
 * Virtual document representing an object's method
 */
export interface VirtualDocument {
  uri: string; // malice://objects/5/connect.ts
  objectId: ObjId;
  methodName: string;
  content: string; // Full TypeScript with context
  version: number;
}

/**
 * Virtual directory entry (object or method file)
 */
export interface VirtualEntry {
  name: string;
  type: 'directory' | 'file';
  uri: string;
  category?: string;
  metadata?: {
    description?: string;
    signature?: string;
    overridden?: boolean;
    complexity?: number;
  };
}

/**
 * Method categorization metadata
 */
export interface MethodCategory {
  id: string;
  name: string;
  icon: string;
  priority: number;
  description: string;
}

/**
 * Method signature inference result
 */
export interface MethodSignature {
  methodName: string;
  args: string[];
  returnType: string;
  context: string[];
  category: string;
}

/**
 * Virtual File System
 * Provides TypeScript context for MOO objects
 */
export class VirtualFileSystem {
  private documents = new Map<string, VirtualDocument>();

  // Automatic categorization rules
  private readonly CATEGORIES: MethodCategory[] = [
    {
      id: 'lifecycle',
      name: '🔧 Lifecycle',
      icon: 'gear',
      priority: 1,
      description: 'Object lifecycle methods (connect, disconnect, init, etc.)',
    },
    {
      id: 'events',
      name: '📡 Events',
      icon: 'broadcast',
      priority: 2,
      description: 'Event handlers and callbacks',
    },
    {
      id: 'public',
      name: '🔍 Public API',
      icon: 'symbol-mixin',
      priority: 3,
      description: 'User-facing methods and commands',
    },
    {
      id: 'combat',
      name: '⚔️ Combat',
      icon: 'sword',
      priority: 4,
      description: 'Combat-related methods',
    },
    {
      id: 'communication',
      name: '💬 Communication',
      icon: 'comment-discussion',
      priority: 5,
      description: 'Chat and messaging methods',
    },
    {
      id: 'movement',
      name: '🚶 Movement',
      icon: 'arrow-right',
      priority: 6,
      description: 'Movement and navigation methods',
    },
    {
      id: 'inventory',
      name: '🎒 Inventory',
      icon: 'package',
      priority: 7,
      description: 'Item and inventory management',
    },
    {
      id: 'internal',
      name: '🔧 Internal',
      icon: 'wrench',
      priority: 8,
      description: 'Internal helper methods and utilities',
    },
  ];

  // Method name patterns for categorization
  private readonly CATEGORY_PATTERNS: Record<string, RegExp[]> = {
    lifecycle: [
      /^(connect|disconnect|init|destroy|onCreate|onDestroy|onConnect|onDisconnect)/,
      /^(startup|shutdown|reset|cleanup)/,
    ],
    events: [
      /^(on|handle)[A-Z]/,
      /^(trigger|fire|emit)[A-Z]/,
      /.*(?:Event|Hook|Callback)$/,
    ],
    public: [
      /^(get|set|is|has|can|do|show|display|list)[a-z]/,
      /^(look|examine|describe|say|tell|whisper|shout)/,
    ],
    combat: [
      /^(attack|defend|damage|heal|fight|strike|hit)/,
      /^(combat|battle|duel)/,
      /.*(?:Combat|Battle|Attack|Damage|Heal)$/,
    ],
    communication: [
      /^(say|tell|whisper|shout|announce|broadcast)/,
      /^(chat|message|communicate|speak)/,
      /.*(?:Message|Chat|Speak)$/,
    ],
    movement: [
      /^(move|go|walk|run|teleport|transport)/,
      /^(enter|exit|leave|arrive)/,
      /.*(?:Move|Go|Walk|Teleport)$/,
    ],
    inventory: [
      /^(inventory|items|equipment|gear)/,
      /^(take|drop|give|equip|unequip|wield)/,
      /^(carry|hold|store|retrieve)/,
      /.*(?:Inventory|Item|Equipment)$/,
    ],
    internal: [
      /^_/, // Private methods starting with underscore
      /^(validate|check|verify|test|debug)/,
      /^(helper|util|internal|private)/,
    ],
  };

  constructor(private manager: ObjectManager) {}

  /**
   * Categorize a method based on its name and content
   */
  private categorizeMethod(methodName: string, methodCode?: string): string {
    // Try patterns in priority order
    for (const [category, patterns] of Object.entries(this.CATEGORY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(methodName)) {
          return category;
        }
      }
    }

    // Analyze method content for additional clues
    if (methodCode) {
      const content = methodCode.toLowerCase();

      // Check for common keywords
      if (content.includes('self.') || content.includes('this.')) {
        // Already analyzed by patterns, continue
      }

      if (
        content.includes('damage') ||
        content.includes('health') ||
        content.includes('combat')
      ) {
        return 'combat';
      }

      if (
        content.includes('message') ||
        content.includes('chat') ||
        content.includes('tell')
      ) {
        return 'communication';
      }

      if (
        content.includes('location') ||
        content.includes('move') ||
        content.includes('go')
      ) {
        return 'movement';
      }
    }

    // Default category
    return 'public';
  }

  /**
   * Infer method signature from code and method name
   */
  private inferMethodSignature(
    methodName: string,
    methodCode: string,
    category: string,
  ): MethodSignature {
    const args: string[] = [];
    let returnType = 'void';
    const context: string[] = [];

    // Analyze method name for common patterns
    if (methodName.startsWith('get') && methodName.length > 3) {
      returnType = 'any';
    } else if (
      methodName.startsWith('is') ||
      methodName.startsWith('has') ||
      methodName.startsWith('can')
    ) {
      returnType = 'boolean';
    } else if (methodName.startsWith('set')) {
      args.push('value: any');
      returnType = 'void';
    } else if (category === 'communication') {
      if (
        methodName === 'say' ||
        methodName === 'tell' ||
        methodName === 'whisper'
      ) {
        args.push('message: string');
        returnType = 'void';
      }
    } else if (category === 'lifecycle') {
      if (methodName.includes('connect')) {
        args.push('context: ConnectionContext');
        context.push('ConnectionContext');
      } else if (methodName.includes('disconnect')) {
        args.push('context: ConnectionContext');
        context.push('ConnectionContext');
      }
    }

    // Look for explicit parameter usage in method code
    const argUsage = methodCode.match(/args\[(\d+)\]/g);
    if (argUsage) {
      const maxArg = Math.max(
        ...argUsage.map((match) =>
          parseInt(match.match(/\d+/)?.[0] ?? '0', 10),
        ),
      );
      if (maxArg >= args.length) {
        // Add generic args for additional parameters
        for (let i = args.length; i <= maxArg; i++) {
          args.push(`arg${i}: any`);
        }
      }
    }

    return {
      methodName,
      args,
      returnType,
      context,
      category,
    };
  }

  /**
   * Parse URI into object ID, name, and type
   * Format: malice://objects/{id}/{name}.{ts|json}
   */
  parseUri(
    uri: string,
  ): { objectId: ObjId; name: string; type: 'method' | 'property' } | null {
    const tsMatch = uri.match(/^malice:\/\/objects\/(\d+)\/(.+)\.ts$/);
    if (tsMatch) {
      return {
        objectId: parseInt(tsMatch[1], 10),
        name: tsMatch[2],
        type: 'method',
      };
    }

    const jsonMatch = uri.match(/^malice:\/\/objects\/(\d+)\/(.+)\.json$/);
    if (jsonMatch) {
      return {
        objectId: parseInt(jsonMatch[1], 10),
        name: jsonMatch[2],
        type: 'property',
      };
    }

    return null;
  }

  /**
   * Build URI from object ID and method name
   */
  buildUri(objectId: ObjId, methodName: string): string {
    return `malice://objects/${objectId}/${methodName}.ts`;
  }

  /**
   * List directory contents
   * malice://objects/ -> list all objects
   * malice://objects/{id}/ -> list all methods (categorized by default)
   * malice://objects/{id}/view:flat -> list methods in flat view
   * malice://objects/{id}/view:categorized -> list methods in categorized view
   * malice://objects/{id}/{category}/ -> list methods in specific category
   */
  async listDirectory(uri: string): Promise<VirtualEntry[]> {
    // Root: list objects
    if (uri === 'malice://objects/' || uri === 'malice://objects') {
      return await this.listObjects();
    }

    // Object directory with view parameter
    const objMatch = uri.match(
      /^malice:\/\/objects\/(\d+)(?:\/view:(\w+))?\/?$/,
    );
    if (objMatch) {
      const objectId = parseInt(objMatch[1], 10);
      const view = (objMatch[2] as 'flat' | 'categorized') || 'categorized';
      return await this.listMethodFiles(objectId, view);
    }

    // Category directory
    const categoryMatch = uri.match(/^malice:\/\/objects\/(\d+)\/([^/]+)\/$/);
    if (categoryMatch) {
      const objectId = parseInt(categoryMatch[1], 10);
      const category = categoryMatch[2];
      return await this.listCategoryMethods(objectId, category);
    }

    return [];
  }

  /**
   * List methods in a specific category
   */
  private async listCategoryMethods(
    objectId: ObjId,
    category: string,
  ): Promise<VirtualEntry[]> {
    const obj = await this.manager.load(objectId);
    if (!obj) return [];

    const raw = obj._getRaw();
    const entries: VirtualEntry[] = [];

    Object.entries(raw.methods).forEach(([methodName, methodData]) => {
      const methodCategory = this.categorizeMethod(methodName, methodData.code);

      if (methodCategory === category) {
        const signature = this.inferMethodSignature(
          methodName,
          methodData.code,
          category,
        );
        entries.push({
          name: `${methodName}.ts`,
          type: 'file' as const,
          uri: `malice://objects/${objectId}/${category}/${methodName}.ts`,
          category,
          metadata: {
            description: methodData.help,
            signature: `${signature.args.join(', ')}`,
            complexity: this.calculateComplexity(methodData.code),
            overridden: false,
          },
        });
      }
    });

    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * List all objects as directories
   */
  private async listObjects(): Promise<VirtualEntry[]> {
    const objects = await this.manager.db.listAll();
    return objects.map((obj) => ({
      name: `${obj._id}`,
      type: 'directory' as const,
      uri: `malice://objects/${obj._id}/`,
    }));
  }

  /**
   * List methods as .ts files and properties as .json files
   * Enhanced with categorization and multiple view support
   */
  private async listMethodFiles(
    objectId: ObjId,
    view: 'flat' | 'categorized' = 'categorized',
  ): Promise<VirtualEntry[]> {
    const obj = await this.manager.load(objectId);
    if (!obj) return [];

    const raw = obj._getRaw();
    const entries: VirtualEntry[] = [];

    if (view === 'categorized') {
      // Group methods by category
      const categorizedMethods = new Map<
        string,
        Array<{ name: string; code: string; metadata?: any }>
      >();

      // Categorize methods
      Object.entries(raw.methods).forEach(([methodName, methodData]) => {
        const category = this.categorizeMethod(methodName, methodData.code);
        const signature = this.inferMethodSignature(
          methodName,
          methodData.code,
          category,
        );

        if (!categorizedMethods.has(category)) {
          categorizedMethods.set(category, []);
        }

        categorizedMethods.get(category)?.push({
          name: methodName,
          code: methodData.code,
          metadata: {
            description: methodData.help,
            signature: `${signature.args.join(', ')}`,
            complexity: this.calculateComplexity(methodData.code),
            overridden: false,
          },
        });
      });

      // Add virtual category directories
      for (const [category, methods] of categorizedMethods) {
        const categoryInfo = this.CATEGORIES.find((c) => c.id === category) || {
          id: category,
          name: `📁 ${category}`,
          icon: 'folder',
          priority: 999,
          description: category,
        };

        // Add category directory
        entries.push({
          name: categoryInfo.name,
          type: 'directory' as const,
          uri: `malice://objects/${objectId}/${category}/`,
          category,
        });

        // Add methods to category
        methods.forEach((method) => {
          entries.push({
            name: `${method.name}.ts`,
            type: 'file' as const,
            uri: `malice://objects/${objectId}/${category}/${method.name}.ts`,
            category,
            metadata: method.metadata,
          });
        });
      }
    } else {
      // Flat view - original behavior
      Object.entries(raw.methods).forEach(([methodName, methodData]) => {
        const category = this.categorizeMethod(methodName, methodData.code);
        const signature = this.inferMethodSignature(
          methodName,
          methodData.code,
          category,
        );

        entries.push({
          name: `${methodName}.ts`,
          type: 'file' as const,
          uri: `malice://objects/${objectId}/${methodName}.ts`,
          category,
          metadata: {
            description: methodData.help,
            signature: `${signature.args.join(', ')}`,
            complexity: this.calculateComplexity(methodData.code),
          },
        });
      });
    }

    // Add properties (always flat)
    Object.keys(raw.properties).forEach((propName) => {
      entries.push({
        name: `${propName}.json`,
        type: 'file' as const,
        uri: `malice://objects/${objectId}/${propName}.json`,
        category: 'properties',
        metadata: {
          description: `Property: ${propName}`,
          signature: typeof obj.get(propName),
          overridden: false,
        },
      });
    });

    // Sort by category priority then name
    return entries.sort((a, b) => {
      const aPriority =
        this.CATEGORIES.find((c) => c.id === a.category)?.priority || 999;
      const bPriority =
        this.CATEGORIES.find((c) => c.id === b.category)?.priority || 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Calculate method complexity (simple cyclomatic approximation)
   */
  private calculateComplexity(code: string): number {
    // Simple complexity metric based on control flow keywords
    const complexityKeywords = [
      'if',
      'else',
      'while',
      'for',
      'switch',
      'case',
      'catch',
      '&&',
      '||',
    ];
    let complexity = 1; // Base complexity

    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Get virtual document for a method or property
   */
  async getDocument(uri: string): Promise<VirtualDocument | null> {
    // Check cache
    if (this.documents.has(uri)) {
      return this.documents.get(uri)!;
    }

    // Parse URI
    const parsed = this.parseUri(uri);
    if (!parsed) return null;

    // Load object
    const obj = await this.manager.load(parsed.objectId);
    if (!obj) return null;

    const raw = obj._getRaw();
    let content: string;

    if (parsed.type === 'method') {
      // Get method code
      const method = raw.methods[parsed.name];
      if (!method) return null;

      // Determine prototype type for 'self'
      const prototypeType = await this.inferPrototypeType(obj);

      // Build TypeScript context
      content = this.buildTypeScriptContext(
        parsed.name,
        method.code,
        prototypeType,
      );
    } else {
      // Get property value as JSON (use resolved value, not typed Value)
      const propValue = obj.get(parsed.name);
      if (propValue === undefined) return null;

      content = JSON.stringify(propValue, null, 2);
    }

    // Create document
    const doc: VirtualDocument = {
      uri,
      objectId: parsed.objectId,
      methodName: parsed.name, // Use 'name' for both methods and properties
      content,
      version: 1,
    };

    this.documents.set(uri, doc);
    return doc;
  }

  /**
   * Update a document (when method is edited)
   */
  async updateDocument(uri: string, newCode: string): Promise<void> {
    const parsed = this.parseUri(uri);
    if (!parsed) return;

    const obj = await this.manager.load(parsed.objectId);
    if (!obj) return;

    // Extract actual code from TypeScript context (if present)
    const actualCode = this.extractMethodCode(newCode);

    // Update method in MongoDB and wait for persistence
    obj.setMethod(parsed.name, actualCode);

    // Update cache
    const prototypeType = await this.inferPrototypeType(obj);
    const content = this.buildTypeScriptContext(
      parsed.name,
      actualCode,
      prototypeType,
    );

    const doc = this.documents.get(uri);
    if (doc) {
      doc.content = content;
      doc.version++;
    }
  }

  /**
   * Extract method code from TypeScript context
   * If the code contains our generated context, extract just the actual method code
   * Otherwise, return the code as-is
   */
  private extractMethodCode(fullCode: string): string {
    const marker = '// Method code:';
    const markerIndex = fullCode.indexOf(marker);

    if (markerIndex === -1) {
      // No context wrapper, return as-is
      return fullCode;
    }

    // Extract everything after the marker
    const codeAfterMarker = fullCode.substring(markerIndex + marker.length);

    // Trim leading newline but preserve other whitespace
    return codeAfterMarker.replace(/^\n/, '');
  }

  /**
   * Invalidate cached document
   */
  invalidate(uri: string): void {
    this.documents.delete(uri);
  }

  /**
   * Infer the prototype type of an object
   * Walks parent chain to find closest named prototype
   */
  private async inferPrototypeType(obj: RuntimeObject): Promise<string> {
    // Check common aliases
    const objectManager = await this.manager.load(0);
    const aliases =
      (objectManager?.get('aliases') as Record<string, number>) || {};

    // Map known prototype IDs to type names
    // Filter out undefined aliases to avoid creating invalid keys
    const prototypeMap: Record<number, string> = {};
    if (aliases.player !== undefined) prototypeMap[aliases.player] = 'Player';
    if (aliases.human !== undefined) prototypeMap[aliases.human] = 'Human';
    if (aliases.agent !== undefined) prototypeMap[aliases.agent] = 'Agent';
    if (aliases.room !== undefined) prototypeMap[aliases.room] = 'Room';
    if (aliases.location !== undefined)
      prototypeMap[aliases.location] = 'Location';
    if (aliases.describable !== undefined)
      prototypeMap[aliases.describable] = 'Describable';

    // Walk parent chain
    let current: RuntimeObject | null = obj;
    while (current) {
      if (prototypeMap[current.id]) {
        return prototypeMap[current.id];
      }

      // Read parent ID directly from raw object (getParent uses sync lookup which may miss)
      const raw = (current as any)._getRaw();
      const parentId = raw.parent?.value;
      // Stop if no parent or self-parented
      if (parentId === undefined || parentId === current.id) break;
      current = await this.manager.load(parentId);
    }

    return 'RuntimeObject'; // Fallback
  }

  /**
   * Build TypeScript context for a method
   * Enhanced with signature inference and JSDoc
   */
  private buildTypeScriptContext(
    methodName: string,
    code: string,
    prototypeType: string,
  ): string {
    const category = this.categorizeMethod(methodName, code);
    const signature = this.inferMethodSignature(methodName, code, category);
    const jsDoc = this.generateJSDoc(methodName, signature, category);

    // Build enhanced context with specific types
    const contextImports =
      signature.context.length > 0
        ? signature.context
            .map(
              (ctx) =>
                `import type { ${ctx} } from '@malice/game/connection-context';`,
            )
            .join('\n')
        : '';

    const argsDeclaration =
      signature.args.length > 0
        ? `declare const args: [${signature.args.join(', ')}];`
        : 'declare const args: [];';

    const parameterDeclarations = signature.args
      .map((arg) => `declare const ${arg.split(':')[0]}: ${arg.split(':')[1]};`)
      .join('\n    ');

    return `// Malice MOO Method: ${methodName}
// Category: ${category}
${jsDoc}

import type { ${prototypeType} } from '@malice/types/prototypes';
import type { ObjectManager } from '@malice/database/object-manager';
${contextImports}

// Method execution context with enhanced types
declare const self: ${prototypeType};
declare const $: ObjectManager;
${argsDeclaration}

// Method parameters (for convenience)
${parameterDeclarations}

// Method code:
${code}
`;
  }

  /**
   * Generate JSDoc comment for method
   */
  private generateJSDoc(
    methodName: string,
    signature: MethodSignature,
    category: string,
  ): string {
    const categoryInfo = this.CATEGORIES.find((c) => c.id === category);
    const categoryDesc = categoryInfo ? ` (${categoryInfo.description})` : '';

    let jsDoc = `/**
 * ${methodName} - ${this.toTitleCase(category)} method${categoryDesc}
 * @category ${this.toTitleCase(category)}`;

    // Add parameter documentation
    if (signature.args.length > 0) {
      signature.args.forEach((arg) => {
        const [name, type] = arg.split(':');
        jsDoc += `\n * @param {${type}} ${name} ${this.getParameterDescription(name, methodName, category)}`;
      });
    }

    // Add return type
    if (signature.returnType !== 'void') {
      jsDoc += `\n * @returns {${signature.returnType}} Method return value`;
    }

    // Add example if available
    const example = this.generateExample(methodName, signature, category);
    if (example) {
      jsDoc += `\n * @example\n${example}`;
    }

    jsDoc += '\n */';
    return jsDoc;
  }

  /**
   * Get parameter description based on name and context
   */
  private getParameterDescription(
    paramName: string,
    methodName: string,
    category: string,
  ): string {
    const name = paramName.replace(/\[\]$/, '').toLowerCase();

    // Common parameter names with context-aware descriptions
    const descriptions: Record<string, string> = {
      message: 'The message to send or display',
      target: 'The target object or player',
      player: 'The player performing the action',
      context: 'Connection context and session information',
      value: 'The value to set',
      amount: 'The amount or quantity',
      damage: 'The amount of damage to inflict',
      direction: 'The direction to move or look',
      command: 'The command being executed',
      text: 'The text content',
    };

    // Method-specific descriptions
    const methodSpecificDescriptions: Record<string, Record<string, string>> = {
      say: { message: 'The message to broadcast to the room' },
      tell: { message: 'The private message to send to target player' },
      whisper: { message: 'The whispered message to send' },
      move: { direction: 'The direction to move in' },
      take: { target: 'The object to pick up' },
      drop: { target: 'The object to place on the ground' },
    };

    // Check method-specific descriptions first
    if (methodSpecificDescriptions[methodName]?.[name]) {
      return methodSpecificDescriptions[methodName][name];
    }

    // Category-specific parameter descriptions
    const categoryDescriptions: Record<string, Record<string, string>> = {
      combat: {
        damage: 'The amount of damage to inflict',
        target: 'The combat target',
      },
      communication: {
        message: 'The message content to send',
        target: 'The recipient player',
      },
      movement: {
        direction: 'The direction or exit to take',
      },
    };

    if (categoryDescriptions[category]?.[name]) {
      return categoryDescriptions[category][name];
    }

    return descriptions[name] || 'Method parameter';
  }

  /**
   * Generate usage example for method
   */
  private generateExample(
    methodName: string,
    signature: MethodSignature,
    category: string,
  ): string | null {
    if (category === 'communication' && signature.args.length > 0) {
      return ` * // Example usage in MOO:\n * ${methodName}("Hello, world!")`;
    } else if (
      category === 'movement' &&
      signature.args.includes('direction:')
    ) {
      return ` * // Example usage in MOO:\n * ${methodName}("north")`;
    } else if (
      methodName.startsWith('get') &&
      signature.returnType !== 'void'
    ) {
      return ` * // Example usage in MOO:\n * const value = ${methodName}()`;
    } else if (
      methodName.startsWith('set') &&
      signature.args.includes('value:')
    ) {
      return ` * // Example usage in MOO:\n * ${methodName}(newValue)`;
    }

    return null;
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * List all methods for an object
   */
  async listMethods(objectId: ObjId): Promise<string[]> {
    const obj = await this.manager.load(objectId);
    if (!obj) return [];

    const methods = obj._getRaw().methods;
    return Object.keys(methods);
  }
}
