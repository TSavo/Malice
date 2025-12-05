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
 * Method signature - TypeScript code stored as string
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

  /** Methods defined on this object (TypeScript code as strings) */
  methods: Record<string, MethodCode>;

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

  /** Call method (walks inheritance chain, executes in context) */
  call(method: string, ...args: unknown[]): Promise<unknown>;

  /** Check if method exists */
  hasMethod(method: string): boolean;

  /** Get parent object ID */
  getParent(): ObjId;

  /** Set parent object ID */
  setParent(parent: ObjId): Promise<void>;

  /** Get all own properties */
  getOwnProperties(): Record<string, PropertyValue>;

  /** Get all own methods */
  getOwnMethods(): Record<string, MethodCode>;

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
  methods?: Record<string, MethodCode>;
}
