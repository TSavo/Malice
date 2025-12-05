import type { GameObject, ObjId, PropertyValue, MethodCode, RuntimeObject } from '../../types/object.js';
import type { ObjectManager } from './object-manager.js';

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
    if (prop in this.obj.properties) {
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
    this.obj.properties[prop] = value;
    this.dirty = true;
  }

  /**
   * Call method - walks inheritance chain, executes in context
   */
  async call(method: string, ...args: unknown[]): Promise<unknown> {
    const code = this.findMethod(method);
    if (!code) {
      throw new Error(`Method ${method} not found on object #${this.id}`);
    }

    return await this.executeMethod(code, args);
  }

  /**
   * Check if method exists (walks chain)
   */
  hasMethod(method: string): boolean {
    return this.findMethod(method) !== null;
  }

  /**
   * Find method code by walking inheritance chain
   */
  private findMethod(method: string): MethodCode | null {
    // Check this object first
    if (method in this.obj.methods) {
      return this.obj.methods[method];
    }

    // Walk up parent chain
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
   * Execute method code in context
   */
  private async executeMethod(code: MethodCode, args: unknown[]): Promise<unknown> {
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
          ${code}
        })();
      `);

      return await fn(context);
    } catch (err) {
      throw new Error(
        `Error executing method on object #${this.id}: ${err instanceof Error ? err.message : String(err)}`
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
  getOwnMethods(): Record<string, MethodCode> {
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
