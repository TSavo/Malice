import type { GameObject, ObjId, PropertyValue, MethodCode, Method, RuntimeObject, Value, ValueType } from '../../types/object.js';
import type { ObjectManager } from './object-manager.js';
import * as ts from 'typescript';

/**
 * Runtime wrapper around GameObject with inheritance and method execution
 * Uses Proxy to enable direct property access (e.g., self.hp instead of self.get('hp'))
 */
export class RuntimeObjectImpl implements RuntimeObject {
  private obj: GameObject;
  private dirty = false;
  private proxy: RuntimeObject;

  constructor(
    obj: GameObject,
    private manager: ObjectManager
  ) {
    this.obj = obj;

    // Create proxy for direct property access
    this.proxy = new Proxy(this, {
      get: (target, prop: string | symbol) => {
        // Allow access to methods and built-in properties
        if (typeof prop === 'symbol' || prop in target) {
          return (target as any)[prop];
        }

        // Check if it's a method - return callable function
        if (target.hasMethod(prop)) {
          return (...args: unknown[]) => target.call(prop, ...args);
        }

        // For string properties, try to get from object properties
        return target.get(prop);
      },

      set: (target, prop: string | symbol, value: any) => {
        if (typeof prop === 'symbol') {
          (target as any)[prop] = value;
          return true;
        }

        // Allow setting internal private properties
        if (prop in target || prop.startsWith('_')) {
          (target as any)[prop] = value;
          return true;
        }

        // Set property and auto-save
        target.set(prop, value);
        // Auto-save in background (fire and forget)
        target.save().catch(err => {
          console.error(`Failed to auto-save object #${target.id}:`, err);
        });
        return true;
      }
    });
  }

  /**
   * Get the proxied version of this object for method execution
   */
  getProxy(): RuntimeObject {
    return this.proxy;
  }

  get id(): ObjId {
    return this.obj._id;
  }

  /**
   * Convert a JavaScript value to a typed Value
   */
  private toValue(jsValue: any): Value {
    // Handle null
    if (jsValue === null) {
      return { type: 'null', value: null };
    }

    // Handle undefined (treat as null)
    if (jsValue === undefined) {
      return { type: 'null', value: null };
    }

    // Handle RuntimeObject (store as objref)
    if (jsValue && typeof jsValue === 'object' && 'id' in jsValue && typeof jsValue.id === 'number') {
      return { type: 'objref', value: jsValue.id };
    }

    // Handle primitives
    const jsType = typeof jsValue;

    if (jsType === 'string') {
      return { type: 'string', value: jsValue };
    }

    if (jsType === 'number') {
      return { type: 'number', value: jsValue };
    }

    if (jsType === 'boolean') {
      return { type: 'boolean', value: jsValue };
    }

    // Handle arrays (recursively convert elements)
    if (Array.isArray(jsValue)) {
      return {
        type: 'array',
        value: jsValue.map(item => this.toValue(item))
      };
    }

    // Handle objects (recursively convert properties)
    if (jsType === 'object') {
      const objValue: Record<string, Value> = {};
      for (const [key, val] of Object.entries(jsValue)) {
        objValue[key] = this.toValue(val);
      }
      return { type: 'object', value: objValue };
    }

    // Fallback to null for unknown types
    return { type: 'null', value: null };
  }

  /**
   * Convert a typed Value to a JavaScript value
   * Resolves objrefs to RuntimeObjects
   * Also handles raw values for backwards compatibility
   */
  private fromValue(value: Value | any | undefined): any {
    // Only return undefined for actual undefined
    if (value === undefined) {
      return undefined;
    }

    // Handle null explicitly (could be raw null or typed null)
    if (value === null) {
      return null;
    }

    // Backwards compatibility: Handle raw values (not typed)
    if (typeof value !== 'object' || !('type' in value)) {
      // It's a raw value, return as-is
      return value;
    }

    switch (value.type) {
      case 'null':
        return null;

      case 'string':
      case 'number':
      case 'boolean':
        return value.value;

      case 'objref':
        // Resolve object reference
        const obj = this.manager.getSync(value.value);
        if (!obj) {
          // Object not in cache or doesn't exist - return raw ID
          return value.value;
        }
        return obj.proxy;

      case 'array':
        // Recursively convert array elements
        return (value.value as Value[]).map(item => this.fromValue(item));

      case 'object':
        // Recursively convert object properties
        const result: Record<string, any> = {};
        for (const [key, val] of Object.entries(value.value as Record<string, Value>)) {
          result[key] = this.fromValue(val);
        }
        return result;

      default:
        return undefined;
    }
  }

  /**
   * Get property - walks inheritance chain
   * Resolves typed Values to JavaScript values (objrefs become RuntimeObjects)
   */
  get(prop: string): PropertyValue | undefined {
    // Check this object first
    if (this.obj.properties && prop in this.obj.properties) {
      return this.fromValue(this.obj.properties[prop]);
    }

    // Walk up parent chain
    if (this.obj.parent !== 0) {
      const parent = this.manager.getSync(this.obj.parent);
      if (parent) {
        return parent.get(prop);
      }
    }

    return undefined;
  }

  /**
   * Set property - always on this object
   * Automatically detects type and creates typed Value
   */
  set(prop: string, value: PropertyValue): void {
    if (!this.obj.properties) {
      this.obj.properties = {};
    }
    // Convert JavaScript value to typed Value
    this.obj.properties[prop] = this.toValue(value);
    this.dirty = true;
  }

  /**
   * Set a method on this object
   */
  setMethod(name: string, code: string, options?: { callable?: boolean; aliases?: string[]; help?: string }): void {
    if (!this.obj.methods) {
      this.obj.methods = {};
    }
    this.obj.methods[name] = {
      code,
      ...options,
    };
    this.dirty = true;
  }

  /**
   * Call method - walks inheritance chain, executes in context
   * @param method - Method name to call
   * @param context - Optional execution context (ConnectionContext, player, etc.)
   * @param args - Method arguments
   */
  async call(method: string, ...args: unknown[]): Promise<unknown> {
    const code = await this.findMethodAsync(method);
    if (!code) {
      throw new Error(`Method ${method} not found on object #${this.id}`);
    }

    // Context will be undefined for programmatic calls
    // In production, context would be set by the connection handler
    return await this.executeMethod(code, undefined, args, method);
  }

  /**
   * Check if method exists (walks chain) - sync version, uses cache only
   */
  hasMethod(method: string): boolean {
    return this.findMethod(method) !== null;
  }

  /**
   * Check if method exists (walks chain) - async version, loads parents if needed
   */
  async hasMethodAsync(method: string): Promise<boolean> {
    return (await this.findMethodAsync(method)) !== null;
  }

  /**
   * Find method code by walking inheritance chain (sync - cache only)
   */
  private findMethod(method: string): MethodCode | null {
    // Check this object first
    if (method in this.obj.methods) {
      const methodDef = this.obj.methods[method];
      return methodDef.code;
    }

    // Walk up parent chain (sync - uses cache only)
    if (this.obj.parent !== 0) {
      const parent = this.manager.getSync(this.obj.parent);
      if (parent && parent.hasMethod(method)) {
        const parentImpl = parent as RuntimeObjectImpl;
        return parentImpl.findMethod(method);
      }
    }

    return null;
  }

  /**
   * Find method code by walking inheritance chain (async - loads from DB if needed)
   */
  private async findMethodAsync(method: string): Promise<MethodCode | null> {
    // Check this object first
    if (method in this.obj.methods) {
      const methodDef = this.obj.methods[method];
      return methodDef.code;
    }

    // Walk up parent chain (async - loads from DB if not cached)
    if (this.obj.parent !== 0) {
      const parent = await this.manager.load(this.obj.parent);
      if (parent) {
        const hasIt = await (parent as RuntimeObjectImpl).hasMethodAsync(method);
        if (hasIt) {
          return (parent as RuntimeObjectImpl).findMethodAsync(method);
        }
      }
    }

    return null;
  }

  /**
   * Compile TypeScript code to JavaScript
   */
  private compileTypeScript(tsCode: string, methodName: string): string {
    try {
      const result = ts.transpileModule(tsCode, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          strict: false, // Allow implicit any for now
          esModuleInterop: true,
          skipLibCheck: true,
        },
      });

      if (result.diagnostics && result.diagnostics.length > 0) {
        const errors = result.diagnostics.map((d) => {
          const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
          return `Line ${d.start}: ${message}`;
        });
        throw new Error(`TypeScript compilation errors in method '${methodName}':\n${errors.join('\n')}`);
      }

      return result.outputText;
    } catch (err) {
      throw new Error(
        `Failed to compile TypeScript for method '${methodName}': ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Execute method code in context
   * Compiles TypeScript to JavaScript before execution
   * Uses caching for compiled code
   */
  private async executeMethod(code: MethodCode, userContext: any, args: unknown[], methodName = 'anonymous'): Promise<unknown> {
    // Check cache for compiled code (avoids repeated compilation)
    let jsCode = this.manager.getCompiledMethod(this.id, methodName);

    if (!jsCode) {
      // Cache miss - compile TypeScript to JavaScript
      jsCode = this.compileTypeScript(code, methodName);

      // Store in cache (never evicts)
      this.manager.setCompiledMethod(this.id, methodName, jsCode);
    }

    // Create execution context with access to:
    // - self: the proxied object (enables self.hp instead of self.get('hp'))
    // - $: the object manager (for finding other objects)
    // - args: method arguments
    // - $N: direct object references ($2, $3, etc.) via Proxy

    const self = this.proxy;

    // Create a Proxy for $ that allows $2, $3, etc. syntax
    const manager = this.manager;
    const $proxy = new Proxy(manager, {
      get(target, prop) {
        // Check if accessing a numeric property like $2, $3
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const objId = parseInt(prop, 10);
          const obj = target.getSync(objId);
          if (!obj) {
            throw new Error(`Object #${objId} not found or not loaded`);
          }
          return obj.proxy;
        }
        // Otherwise return the manager's own properties/methods
        return (target as any)[prop];
      },
    });

    const context = {
      self,
      this: self, // Also expose as 'this' but it might be shadowed
      $: $proxy,
      args,
      context: userContext, // ConnectionContext or other execution context
      player: userContext?.player || self, // Player object if available, otherwise self
    };

    try {
      // Wrap code in async function for execution
      // Don't destructure $ so we can use $2, $3, etc. via Proxy
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const AsyncFn = async function () {}.constructor as FunctionConstructor;
      const fn = new AsyncFn('ctx', `
        const self = ctx.self;
        const $ = ctx.$;
        const args = ctx.args;
        const context = ctx.context;
        const player = ctx.player;
        return (async () => {
          ${jsCode}
        })();
      `);

      return await fn(context);
    } catch (err) {
      throw new Error(
        `Error executing method '${methodName}' on object #${this.id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Get parent object ID
   */
  getParent(): ObjId {
    return this.obj.parent;
  }

  /**
   * Set parent object ID
   */
  async setParent(parent: ObjId): Promise<void> {
    this.obj.parent = parent;
    this.dirty = true;
    await this.save();
  }

  /**
   * Get all own properties (not inherited)
   * Returns JavaScript values (objrefs resolved to RuntimeObjects)
   */
  getOwnProperties(): Record<string, PropertyValue> {
    const result: Record<string, PropertyValue> = {};
    for (const [key, value] of Object.entries(this.obj.properties || {})) {
      result[key] = this.fromValue(value);
    }
    return result;
  }

  /**
   * Get all own methods (not inherited)
   */
  getOwnMethods(): Record<string, Method> {
    return { ...this.obj.methods };
  }

  /**
   * Save changes to database
   */
  async save(): Promise<void> {
    if (!this.dirty) return;

    // Don't invalidate cache - we're the source of truth
    await this.manager.update(this.id, {
      parent: this.obj.parent,
      properties: this.obj.properties,
      methods: this.obj.methods,
    }, false);

    this.dirty = false;
  }

  /**
   * Refresh from database
   */
  async refresh(): Promise<void> {
    const updated = await this.manager.load(this.id);
    if (updated) {
      // Use _getRaw() to get the underlying GameObject from the loaded object
      this.obj = updated._getRaw();
      this.dirty = false;
    }
  }

  /**
   * Add a method to this object
   */
  addMethod(name: string, code: MethodCode): void {
    this.obj.methods[name] = code;
    this.dirty = true;
  }

  /**
   * Remove a method from this object
   */
  removeMethod(name: string): void {
    delete this.obj.methods[name];
    this.dirty = true;
  }

  /**
   * Get the raw GameObject (for manager use)
   */
  _getRaw(): GameObject {
    return this.obj;
  }
}
