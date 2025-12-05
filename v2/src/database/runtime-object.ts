import type { GameObject, ObjId, PropertyValue, MethodCode, Method, RuntimeObject } from '../../types/object.js';
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
   * Get property - walks inheritance chain
   */
  get(prop: string): PropertyValue | undefined {
    // Check this object first
    if (this.obj.properties && prop in this.obj.properties) {
      return this.obj.properties[prop];
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
   */
  set(prop: string, value: PropertyValue): void {
    if (!this.obj.properties) {
      this.obj.properties = {};
    }
    this.obj.properties[prop] = value;
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
   */
  async call(method: string, ...args: unknown[]): Promise<unknown> {
    const code = await this.findMethodAsync(method);
    if (!code) {
      throw new Error(`Method ${method} not found on object #${this.id}`);
    }

    return await this.executeMethod(code, args, method);
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
  private async executeMethod(code: MethodCode, args: unknown[], methodName = 'anonymous'): Promise<unknown> {
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

    const self = this.proxy;
    const context = {
      self,
      this: self, // Also expose as 'this' but it might be shadowed
      $: this.manager,
      args,
    };

    try {
      // Wrap code in async function for execution
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const AsyncFn = async function () {}.constructor as FunctionConstructor;
      const fn = new AsyncFn('ctx', `
        const { self, $, args } = ctx;
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
   */
  getOwnProperties(): Record<string, PropertyValue> {
    return { ...this.obj.properties };
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

    await this.manager.update(this.id, {
      parent: this.obj.parent,
      properties: this.obj.properties,
      methods: this.obj.methods,
    });

    this.dirty = false;
  }

  /**
   * Refresh from database
   */
  async refresh(): Promise<void> {
    const updated = await this.manager.load(this.id);
    if (updated) {
      this.obj = (updated as RuntimeObjectImpl).obj;
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
