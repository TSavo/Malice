/**
 * TypeScript Type Generator
 * Generates .d.ts files from MongoDB object state
 */

import type { ObjectManager } from '../database/object-manager.js';
import type { GameObject, Value } from '../../types/object.js';

/**
 * Generates TypeScript definition files from MongoDB objects
 * Provides IntelliSense and type checking for method editing
 */
export class TypeGenerator {
  constructor(private manager: ObjectManager) {}

  /**
   * Generate complete .d.ts file from current database state
   */
  async generate(): Promise<string> {
    const objects = await this.manager.db.listAll(true); // Include all objects

    let output = '';

    // Header
    output += this.generateHeader();
    output += '\n';

    // Base runtime types
    output += this.generateBaseTypes();
    output += '\n';

    // Generate interface for each object
    for (const obj of objects) {
      if (obj.recycled) continue; // Skip recycled objects
      output += this.generateObjectInterface(obj);
      output += '\n';
    }

    // ObjectManager interface with aliases
    output += this.generateObjectManagerInterface();
    output += '\n';

    // Global declarations
    output += await this.generateGlobalDeclarations();

    return output;
  }

  /**
   * Generate file header
   */
  private generateHeader(): string {
    const timestamp = new Date().toISOString();
    return `// Auto-generated from MongoDB - DO NOT EDIT
// Generated: ${timestamp}
`;
  }

  /**
   * Generate base runtime type definitions
   */
  private generateBaseTypes(): string {
    return `/**
 * Runtime object wrapper
 * Provides access to object properties and methods
 */
interface RuntimeObject {
  /** Object ID */
  readonly id: number;

  /** Parent object ID */
  readonly parent: number;

  /** Call a method on this object */
  call(method: string, ...args: any[]): Promise<any>;

  /** Get a property value (walks prototype chain) */
  get(prop: string): any;

  /** Set a property value */
  set(prop: string, value: any): void;

  /** Save changes to database */
  save(): Promise<void>;

  /** Get own properties (no inheritance) */
  getOwnProperties(): Record<string, any>;

  /** Get own methods (no inheritance) */
  getOwnMethods(): Record<string, any>;

  /** Check if method exists (walks prototype chain) */
  hasMethod(name: string): boolean;

  /** Get raw database object */
  _getRaw(): GameObject;

  /** Allow any property access */
  [key: string]: any;
}

/**
 * Game object data structure
 */
interface GameObject {
  _id: number;
  parent: number;
  properties: Record<string, any>;
  methods: Record<string, any>;
  created: Date;
  modified: Date;
  recycled?: boolean;
}

/**
 * Connection context for interactive sessions
 */
interface ConnectionContext {
  /** Send text to client */
  send(text: string): void;

  /** Close connection */
  close(): void;

  /** Set the handler object for this connection */
  setHandler(obj: RuntimeObject): void;

  /** Get underlying connection */
  readonly connection: Connection;

  /** Check if user is authenticated */
  isAuthenticated(): boolean;

  /** Get authenticated user ID */
  getUserId(): number | null;
}

/**
 * Low-level connection interface
 */
interface Connection {
  readonly id: string;
  readonly type: 'telnet' | 'websocket';
  send(data: string): void;
  close(): void;
}
`;
  }

  /**
   * Generate interface for a single object
   */
  private generateObjectInterface(obj: GameObject): string {
    const objId = obj._id;
    let output = `/** Object #${objId} */\n`;
    output += `interface MaliceObject_${objId} {\n`;

    // Generate property types
    const properties = obj.properties || {};
    const propertyNames = Object.keys(properties).sort();

    for (const name of propertyNames) {
      const value = properties[name];
      const type = this.inferType(value);
      output += `  ${this.escapePropertyName(name)}: ${type};\n`;
    }

    // Generate method signatures
    const methods = obj.methods || {};
    const methodNames = Object.keys(methods).sort();

    for (const name of methodNames) {
      output += `  ${this.escapePropertyName(name)}(...args: any[]): Promise<any>;\n`;
    }

    output += `}\n`;
    return output;
  }

  /**
   * Infer TypeScript type from typed Value or raw JavaScript value
   */
  private inferType(value: any): string {
    if (value === null) {
      return 'null';
    }

    if (value === undefined) {
      return 'null'; // MongoDB converts undefined to null
    }

    // Handle typed Value objects (have a 'type' property)
    if (value && typeof value === 'object' && 'type' in value && typeof value.type === 'string') {
      switch (value.type) {
        case 'null':
          return 'null';

        case 'string':
          return 'string';

        case 'number':
          return 'number';

        case 'boolean':
          return 'boolean';

        case 'objref':
          // Resolve objref to specific object type
          const objId = value.value as number;
          return `RuntimeObject & MaliceObject_${objId}`;

        case 'array': {
          const arrayValue = value.value as any[];
          if (!arrayValue || arrayValue.length === 0) {
            return 'any[]';
          }

          // Check if all elements are same type
          const firstType = this.inferType(arrayValue[0]);
          const allSameType = arrayValue.every(item => this.inferType(item) === firstType);

          if (allSameType && firstType !== 'any') {
            return `${firstType}[]`;
          }

          return 'any[]';
        }

        case 'object': {
          return 'Record<string, any>';
        }

        default:
          return 'any';
      }
    }

    // Handle raw JavaScript values (no 'type' property)
    const jsType = typeof value;

    switch (jsType) {
      case 'string':
        return 'string';

      case 'number':
        return 'number';

      case 'boolean':
        return 'boolean';

      case 'object':
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return 'any[]';
          }

          // Check if all elements are same type
          const firstType = this.inferType(value[0]);
          const allSameType = value.every(item => this.inferType(item) === firstType);

          if (allSameType && firstType !== 'any') {
            return `${firstType}[]`;
          }

          return 'any[]';
        }

        // Plain object
        return 'Record<string, any>';

      default:
        return 'any';
    }
  }

  /**
   * Escape property/method names that are invalid identifiers
   */
  private escapePropertyName(name: string): string {
    // Check if valid identifier (alphanumeric + underscore, doesn't start with number)
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
      return name;
    }

    // Needs quoting
    return `"${name.replace(/"/g, '\\"')}"`;
  }

  /**
   * Generate ObjectManager interface with dynamic aliases
   */
  private generateObjectManagerInterface(): string {
    const aliases = this.manager.getAliases();

    let output = `/**
 * Object manager - provides access to game objects
 */
interface ObjectManager {
  /** Load object by ID */
  load(id: number): Promise<RuntimeObject>;

  /** Create new object */
  create(data: { parent: number; properties?: Record<string, any>; methods?: Record<string, any> }): Promise<RuntimeObject>;

  /** Delete (recycle) object */
  delete(id: number): Promise<void>;

  /** Get all aliases */
  getAliases(): Map<string, RuntimeObject>;

  /** Register an alias */
  registerAlias(name: string, obj: RuntimeObject): void;
`;

    // Add registered aliases as readonly properties
    if (aliases && aliases.size > 0) {
      output += '\n  // Registered aliases\n';

      for (const [alias, obj] of aliases) {
        output += `  /** Alias for object #${obj.id} */\n`;
        output += `  readonly ${this.escapePropertyName(alias)}: RuntimeObject;\n`;
      }
    }

    // Allow dynamic property access
    output += '\n  /** Allow dynamic aliases */\n';
    output += '  [key: string]: any;\n';
    output += '}\n';

    return output;
  }

  /**
   * Generate global declarations available in all methods
   */
  private async generateGlobalDeclarations(): Promise<string> {
    const objects = await this.manager.db.listAll(true);

    let output = `/**
 * Global declarations available in all object methods
 */

/** Current object instance */
declare const self: RuntimeObject;

/** Global object manager */
declare const $: ObjectManager;

/** Method arguments array */
declare const args: any[];

/** Execution context (ConnectionContext if invoked from connection) */
declare const context: any;

/** Player object (from context.player, or self if not available) */
declare const player: RuntimeObject;

/**
 * Direct object references - access any object by ID
 * Usage: const sys = $2; await sys.someMethod();
 */
`;

    // Generate $N globals for each object
    for (const obj of objects) {
      if (obj.recycled) continue;

      output += `/** Direct reference to object #${obj._id} */\n`;
      output += `declare const $${obj._id}: RuntimeObject & MaliceObject_${obj._id};\n`;
    }

    return output;
  }

  /**
   * Generate types for a specific object with enhanced self type
   * Used when editing a specific object's method
   */
  async generateForObject(objectId: number): Promise<string> {
    const obj = await this.manager.load(objectId);
    if (!obj) {
      throw new Error(`Object #${objectId} not found`);
    }

    // Get base types
    const base = await this.generate();

    // Add object-specific override
    const override = `
// Context-specific type override for Object #${objectId}
declare const self: RuntimeObject & MaliceObject_${objectId};
`;

    return base + override;
  }
}
