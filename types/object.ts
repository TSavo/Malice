import { z } from 'zod';

/**
 * LambdaMOO-style object system types
 */

/**
 * Object ID - can be a number (for objects) or string (for types)
 * Objects: #<number> (e.g., #42)
 * Types: type name string (e.g., 'room')
 */
export type ObjId = number | string;

/**
 * Zod schema for validating ObjId
 */
export const zObjId = z.union([z.number().int(), z.string()]);

/**
 * Value type - represents the type of a stored value
 */
export type ValueType =
  | 'number' // JavaScript number (int or float)
  | 'string' // JavaScript string
  | 'boolean' // JavaScript boolean
  | 'null' // JavaScript null
  | 'objref' // Object reference (stores ObjId, resolves to RuntimeObject)
  | 'array' // Array of Values
  | 'object'; // Record of Values

/**
 * Base properties shared by all value types
 */
interface ValueBase {
  /** Optional description for AI context - explains what this property means */
  description?: string;
}

/**
 * Null value
 */
export interface NullValue extends ValueBase {
  type: 'null';
  value: null;
}

/**
 * String value
 */
export interface StringValue extends ValueBase {
  type: 'string';
  value: string;
}

/**
 * Number value
 */
export interface NumberValue extends ValueBase {
  type: 'number';
  value: number;
}

/**
 * Boolean value
 */
export interface BooleanValue extends ValueBase {
  type: 'boolean';
  value: boolean;
}

/**
 * Array value - contains typed elements
 */
export interface ArrayValue extends ValueBase {
  type: 'array';
  value: Value[];
}

/**
 * Object value - contains typed properties
 */
export interface ObjectValue extends ValueBase {
  type: 'object';
  value: Record<string, Value>;
}

/**
 * Type reference - references a type by name
 */
export interface TypeRefValue extends ValueBase {
  type: 'objref';
  target: 'type';
  id: ObjId; // type name (string)
}

/**
 * Object reference - references an object by ID
 */
export interface ObjectRefValue extends ValueBase {
  type: 'objref';
  target: 'object';
  id: ObjId; // object ID (number)
}

/**
 * Object reference value - stores reference to type (by name) or object (by ID)
 * Self-describing: the reference knows which collection to look in
 *
 * `id` is always present:
 *   - string for types (the type name)
 *   - number for objects (the object ID)
 *
 * Examples:
 *   { type: 'objref', target: 'type', id: 'room' }     - reference to type
 *   { type: 'objref', target: 'object', id: 47 }       - reference to object
 */
export type ObjRefValue = TypeRefValue | ObjectRefValue;

/**
 * Discriminated union of all value types
 * TypeScript narrows based on the `type` field
 */
export type Value =
  | NullValue
  | StringValue
  | NumberValue
  | BooleanValue
  | ArrayValue
  | ObjectValue
  | ObjRefValue;

/**
 * Property value - resolved JavaScript value
 * This is what you get from get() - objrefs are resolved to RuntimeObjects
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | null
  | RuntimeObject // Resolved objref
  | PropertyValue[] // Recursive array
  | { [key: string]: PropertyValue }; // Recursive object

/**
 * Rich property info for AI context
 * Returned by properties() - includes value, type, and description
 */
export interface PropertyInfo {
  value: PropertyValue;
  type: ValueType;
  description?: string;
}

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
 * Type stored in MongoDB types collection
 * Types are named definitions (platonic forms), not numbered instances
 */
export interface TypeObject {
  /** The type name (primary key, e.g., 'room', 'player', 'describable') */
  _id: string;

  /** Parent type for inheritance (always references another type by name) */
  parent: ObjRefValue;

  /** Default property values for instances */
  properties: Record<string, Value>;

  /** Methods defined on this type (shared by all instances) */
  methods: Record<string, Method>;

  /** Metadata */
  created: Date;
  modified: Date;
}

/**
 * Object stored in MongoDB objects collection
 * Objects are numbered instances with state
 */
export interface GameObject {
  /** The object ID (#1, #2, etc) */
  _id: ObjId;

  /** Parent - can be a type (by name) or another object (by ID) */
  parent: ObjRefValue;

  /** Properties defined on this object (typed values) */
  properties: Record<string, Value>;

  /** Methods defined on this object (instance-specific) */
  methods: Record<string, Method>;

  /** Is this object recycled (deleted but ID can be reused)? */
  recycled?: boolean;

  /** Metadata */
  created: Date;
  modified: Date;
}

/**
 * The kind of a RuntimeObject - derived from which collection it was loaded from
 */
export type RuntimeObjectKind = 'type' | 'object';

/**
 * Runtime object with resolved properties and callable methods
 * Uses Proxy for direct property access: obj.hp instead of obj.get('hp')
 *
 * RuntimeObject serves both types and objects - the `kind` property
 * indicates which collection it came from.
 */
export interface RuntimeObject {
  /** The ID - number for objects, string for types */
  id: ObjId;

  /** What kind of thing this is - derived from which collection it was loaded from */
  kind: RuntimeObjectKind;

  /** Is this a type (definition)? */
  isType: boolean;

  /** Is this an object (instance)? */
  isObject: boolean;

  /** Get property (walks inheritance chain, resolves objrefs to RuntimeObjects) */
  get(prop: string): PropertyValue | undefined;

  /** Set property (always on this object, auto-detects type) */
  set(prop: string, value: PropertyValue): void;

  /** Set a method on this object */
  setMethod(
    name: string,
    code: string,
    options?: { callable?: boolean; aliases?: string[]; help?: string },
  ): void;

  /** Add a method to this object (alias for setMethod with just code) */
  addMethod(name: string, code: string): void;

  /** Remove a method from this object */
  removeMethod(name: string): void;

  /** Delete a property from this object */
  deleteProperty(prop: string): void;

  /** Call method (walks inheritance chain, executes in context) */
  call(method: string, ...args: unknown[]): Promise<unknown>;

  /** Check if method exists (sync - cache only) */
  hasMethod(method: string): boolean;

  /** Check if method exists (async - loads parents if needed) */
  hasMethodAsync(method: string): Promise<boolean>;

  /** Get parent object (resolves objref to RuntimeObject, self-parented returns self) */
  getParent(): RuntimeObject;

  /** Set parent object */
  setParent(parent: RuntimeObject): void;

  /** Get all own properties (resolved to JavaScript values, objrefs become RuntimeObjects) */
  getOwnProperties(): Record<string, PropertyValue>;

  /** Get all properties with rich info (value, type, description) for AI context */
  properties(): Record<string, PropertyInfo>;

  /** Set description for a property (metadata for AI interpretation) */
  setPropertyDescription(prop: string, description: string): void;

  /** Get all own methods */
  getOwnMethods(): Record<string, Method>;

  /** Get local method code (does not walk inheritance chain) */
  getMethod(name: string): string | null;

  /** Get the raw object (for internal use) */
  _getRaw(): TypeObject | GameObject;

  /** Pull fresh data from database into memory (in-place) */
  pull(): Promise<void>;

  /** Push current memory state to database */
  push(): Promise<void>;

  /** Legacy alias for push() - forces save to database */
  save(): Promise<void>;

  /** Wait for all queued writes to complete */
  flushQueue(): Promise<void>;
}

/**
 * Object creation parameters
 */
export interface CreateObjectParams {
  /** Parent object to inherit from */
  parent: RuntimeObject;

  /** Initial properties (will be auto-converted to typed Values) */
  properties?: Record<string, PropertyValue>;

  /** Initial methods */
  methods?: Record<string, Method>;
}
