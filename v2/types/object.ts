/**
 * LambdaMOO-style object system types
 */

/**
 * Object ID - always an integer
 * Represented as #<number> in the game world
 */
export type ObjId = number;

/**
 * Value type - represents the type of a stored value
 */
export type ValueType =
  | 'number'   // JavaScript number (int or float)
  | 'string'   // JavaScript string
  | 'boolean'  // JavaScript boolean
  | 'null'     // JavaScript null
  | 'objref'   // Object reference (stores ObjId, resolves to RuntimeObject)
  | 'array'    // Array of Values
  | 'object';  // Record of Values

/**
 * Typed value container
 * All properties are stored as Values with explicit type information
 */
export interface Value {
  type: ValueType;
  value: any; // Actual value depends on type
}

/**
 * Array value - contains typed elements
 */
export interface ArrayValue extends Value {
  type: 'array';
  value: Value[];
}

/**
 * Object value - contains typed properties
 */
export interface ObjectValue extends Value {
  type: 'object';
  value: Record<string, Value>;
}

/**
 * Object reference value - stores object ID, resolves to RuntimeObject
 */
export interface ObjRefValue extends Value {
  type: 'objref';
  value: ObjId;
}

/**
 * Property value - resolved JavaScript value
 * This is what you get from get() - objrefs are resolved to RuntimeObjects
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | null
  | RuntimeObject  // Resolved objref
  | PropertyValue[]  // Recursive array
  | { [key: string]: PropertyValue };  // Recursive object

/**
 * Method with metadata
 * Code is TypeScript that gets compiled to JavaScript at runtime
 */
export interface Method {
  /** The method code (TypeScript source as string) */
  code: string;

  /** Compiled JavaScript (cached, not stored in DB) */
  compiledJS?: string;

  /** Compilation timestamp (for cache invalidation) */
  compiledAt?: Date;

  /** Can this method be invoked via player commands? */
  callable?: boolean;

  /** Command aliases (e.g., 'l' for 'look') */
  aliases?: string[];

  /** Help text for this verb/command */
  help?: string;
}

/**
 * Method signature - TypeScript code stored as string (legacy - for backwards compatibility)
 */
export type MethodCode = string;

/**
 * Object stored in MongoDB
 */
export interface GameObject {
  /** The object ID (#1, #2, etc) */
  _id: ObjId;

  /** Parent object for inheritance (#0 = no parent) */
  parent: ObjId;

  /** Properties defined on this object (typed values) */
  properties: Record<string, Value>;

  /** Methods defined on this object */
  methods: Record<string, Method>;

  /** Is this object recycled (deleted but ID can be reused)? */
  recycled?: boolean;

  /** Metadata */
  created: Date;
  modified: Date;
}

/**
 * Runtime object with resolved properties and callable methods
 */
export interface RuntimeObject {
  /** The object ID */
  id: ObjId;

  /** Get property (walks inheritance chain, resolves objrefs to RuntimeObjects) */
  get(prop: string): PropertyValue | undefined;

  /** Set property (always on this object, auto-detects type) */
  set(prop: string, value: PropertyValue): void;

  /** Set a method on this object */
  setMethod(name: string, code: string, options?: { callable?: boolean; aliases?: string[]; help?: string }): void;

  /** Add a method to this object (alias for setMethod with just code) */
  addMethod(name: string, code: string): void;

  /** Remove a method from this object */
  removeMethod(name: string): void;

  /** Call method (walks inheritance chain, executes in context) */
  call(method: string, ...args: unknown[]): Promise<unknown>;

  /** Check if method exists (sync - cache only) */
  hasMethod(method: string): boolean;

  /** Check if method exists (async - loads parents if needed) */
  hasMethodAsync(method: string): Promise<boolean>;

  /** Get parent object ID */
  getParent(): ObjId;

  /** Set parent object ID (auto-persists) */
  setParent(parent: ObjId): void;

  /** Get all own properties (resolved to JavaScript values, objrefs become RuntimeObjects) */
  getOwnProperties(): Record<string, PropertyValue>;

  /** Get all own methods */
  getOwnMethods(): Record<string, Method>;

  /** Get the raw GameObject (for internal use) */
  _getRaw(): GameObject;
}

/**
 * Object creation parameters
 */
export interface CreateObjectParams {
  /** Parent object to inherit from */
  parent: ObjId;

  /** Initial properties (will be auto-converted to typed Values) */
  properties?: Record<string, PropertyValue>;

  /** Initial methods */
  methods?: Record<string, Method>;
}
