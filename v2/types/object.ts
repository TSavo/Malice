/**
 * LambdaMOO-style object system types
 */

/**
 * Object ID - always an integer
 * Represented as #<number> in the game world
 */
export type ObjId = number;

/**
 * Property value - can be primitives, arrays of ObjIds, or nested objects
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | null
  | ObjId[]
  | { [key: string]: PropertyValue };

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

  /** Properties defined on this object */
  properties: Record<string, PropertyValue>;

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

  /** Get property (walks inheritance chain) */
  get(prop: string): PropertyValue | undefined;

  /** Set property (always on this object) */
  set(prop: string, value: PropertyValue): void;

  /** Set a method on this object */
  setMethod(name: string, code: string, options?: { callable?: boolean; aliases?: string[]; help?: string }): void;

  /** Call method (walks inheritance chain, executes in context) */
  call(method: string, ...args: unknown[]): Promise<unknown>;

  /** Check if method exists (sync - cache only) */
  hasMethod(method: string): boolean;

  /** Check if method exists (async - loads parents if needed) */
  hasMethodAsync(method: string): Promise<boolean>;

  /** Get parent object ID */
  getParent(): ObjId;

  /** Set parent object ID */
  setParent(parent: ObjId): Promise<void>;

  /** Get all own properties */
  getOwnProperties(): Record<string, PropertyValue>;

  /** Get all own methods */
  getOwnMethods(): Record<string, Method>;

  /** Save changes to database */
  save(): Promise<void>;
}

/**
 * Object creation parameters
 */
export interface CreateObjectParams {
  /** Parent object to inherit from */
  parent: ObjId;

  /** Initial properties */
  properties?: Record<string, PropertyValue>;

  /** Initial methods */
  methods?: Record<string, Method>;
}
