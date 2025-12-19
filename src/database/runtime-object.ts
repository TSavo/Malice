import type { GameObject, ObjId, PropertyValue, MethodCode, Method, RuntimeObject, Value, ObjRefValue } from '../../types/object.js';
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

        // Set property (auto-persists)
        target.set(prop, value);
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
   * @param jsValue - JavaScript value to convert
   * @param seen - WeakSet for circular reference detection
   * @param path - Path for debugging
   */
  private toValue(jsValue: any, seen: WeakSet<object> = new WeakSet(), path: string = 'root'): Value {
    // Handle null
    if (jsValue === null) {
      return { type: 'null', value: null };
    }

    // Handle undefined (treat as null)
    if (jsValue === undefined) {
      return { type: 'null', value: null };
    }

    // Already a typed Value - return as-is to avoid double-wrapping
    if (jsValue && typeof jsValue === 'object' && 'type' in jsValue && 'value' in jsValue) {
      const validTypes = ['null', 'string', 'number', 'boolean', 'objref', 'array', 'object'];
      if (validTypes.includes(jsValue.type)) {
        return jsValue;
      }
    }

    // Handle RuntimeObject (store as objref)
    if (jsValue && typeof jsValue === 'object' && 'id' in jsValue && typeof jsValue.id === 'number') {
      return { type: 'objref', value: jsValue.id };
    }

    // Handle primitives
    const jsType = typeof jsValue;

    if (jsType === 'string') {
      // Check for objref string format "#N" (e.g., "#5", "#123")
      // This allows MCP and external systems to pass objrefs as strings
      if (/^#\d+$/.test(jsValue)) {
        const objId = parseInt(jsValue.slice(1), 10);
        return { type: 'objref', value: objId };
      }
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
      // Check for circular reference
      if (seen.has(jsValue)) {
        console.error(`[RuntimeObject] Circular reference detected at ${path}`);
        return { type: 'null', value: null };
      }
      seen.add(jsValue);
      return {
        type: 'array',
        value: jsValue.map((item, i) => this.toValue(item, seen, `${path}[${i}]`))
      };
    }

    // Handle objects (recursively convert properties)
    if (jsType === 'object') {
      // Check for circular reference
      if (seen.has(jsValue)) {
        console.error(`[RuntimeObject] Circular reference detected at ${path}`);
        return { type: 'null', value: null };
      }
      seen.add(jsValue);

      // Skip special objects that shouldn't be serialized
      const constructor = jsValue.constructor?.name;
      if (constructor && !['Object', 'Array'].includes(constructor)) {
        console.warn(`[RuntimeObject] Skipping non-plain object at ${path}: ${constructor}`);
        return { type: 'null', value: null };
      }

      const objValue: Record<string, Value> = {};
      for (const [key, val] of Object.entries(jsValue)) {
        objValue[key] = this.toValue(val, seen, `${path}.${key}`);
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
        // Resolve object reference - getSync returns the proxy directly
        const obj = this.manager.getSync(value.value);
        if (!obj) {
          // Object not in cache or doesn't exist - return raw ID
          return value.value;
        }
        return obj;

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
    // Stop at self-parented objects (parent.value === self._id) like #-1 and #0
    const parentId = this.obj.parent.value;
    if (parentId !== this.obj._id) {
      const parent = this.manager.getSync(parentId);
      if (parent) {
        return parent.get(prop);
      }
    }

    return undefined;
  }

  /**
   * Set property - always on this object
   * Automatically detects type and creates typed Value
   * Auto-persists to database - MOO code never calls save()
   */
  set(prop: string, value: PropertyValue): void {
    if (!this.obj.properties) {
      this.obj.properties = {};
    }
    // Convert JavaScript value to typed Value
    this.obj.properties[prop] = this.toValue(value, new WeakSet(), `#${this.id}.${prop}`);

    // Auto-persist - fire and forget, MOO never sees save semantics
    this.manager.update(this.id, {
      properties: this.obj.properties
    }, false).catch(err => {
      console.error(`[RuntimeObject] Failed to persist property ${prop} on #${this.id}:`, err);
      // Log the problematic properties structure for debugging
      try {
        console.error(`[RuntimeObject] Properties keys: ${Object.keys(this.obj.properties || {}).join(', ')}`);
      } catch {
        console.error('[RuntimeObject] Could not stringify properties');
      }
    });
  }

  /**
   * Set a method on this object
   * Auto-persists to database
   */
  setMethod(name: string, code: string, options?: { callable?: boolean; aliases?: string[]; help?: string }): void {
    if (!this.obj.methods) {
      this.obj.methods = {};
    }
    this.obj.methods[name] = {
      code,
      ...options,
    };

    // Invalidate compiled method cache for this method
    this.manager.invalidateCompiledMethod(this.id, name);

    // Auto-persist
    this.manager.update(this.id, {
      methods: this.obj.methods
    }, false).catch(err => {
      console.error(`[RuntimeObject] Failed to persist method ${name} on #${this.id}:`, err);
    });
  }

  /**
   * Call method - walks inheritance chain, executes in context
   * @param method - Method name to call
   * @param args - Method arguments
   */
  async call(method: string, ...args: unknown[]): Promise<unknown> {
    const found = await this.findMethodAsync(method);
    if (!found) {
      throw new Error(`Method ${method} not found on object #${this.id}`);
    }

    // Context will be undefined for programmatic calls
    return await this.executeMethod(found.code, undefined, args, method, found.objectId);
  }

  /**
   * Call method with verb dispatch context
   * Used by verb dispatcher to properly pass context, player, command separately from args
   * @param method - Method name to call
   * @param context - Connection context
   * @param player - Player object invoking the verb
   * @param command - Raw command string
   * @param args - Verb-resolved arguments only
   */
  async callVerb(method: string, context: any, player: RuntimeObject, command: string, args: unknown[]): Promise<unknown> {
    const found = await this.findMethodAsync(method);
    if (!found) {
      throw new Error(`Method ${method} not found on object #${this.id}`);
    }

    // Create verb context with player and command
    const verbContext = {
      ...context,
      player,
      command,
    };

    return await this.executeMethod(found.code, verbContext, args, method, found.objectId);
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
    // Stop at self-parented objects (parent.value === self._id) like #-1 and #0
    const parentId = this.obj.parent.value;
    if (parentId !== this.obj._id) {
      const parent = this.manager.getSync(parentId);
      if (parent) {
        // Directly call findMethod on the impl to avoid hasMethod->findMethod loop
        const parentImpl = parent as unknown as RuntimeObjectImpl;
        return parentImpl.findMethod(method);
      }
    }

    return null;
  }

  /**
   * Find method code by walking inheritance chain (async - loads from DB if needed)
   * Returns both the code AND the object ID where method was found (for pass() support)
   */
  private async findMethodAsync(method: string): Promise<{ code: MethodCode; objectId: number } | null> {
    // Check this object first
    if (method in this.obj.methods) {
      const methodDef = this.obj.methods[method];
      return { code: methodDef.code, objectId: this.id };
    }

    // Walk up parent chain (async - loads from DB if not cached)
    // Stop at self-parented objects (parent.value === self._id) like #-1 and #0
    const parentId = this.obj.parent.value;
    if (parentId !== this.obj._id) {
      const parent = await this.manager.load(parentId);
      if (parent) {
        return (parent as unknown as RuntimeObjectImpl).findMethodAsync(method);
      }
    }

    return null;
  }

  /**
   * Find method code on parent object (for pass/super functionality)
   * Starts search from parent, not from self
   */
  async findParentMethod(method: string): Promise<{ code: MethodCode; objectId: number } | null> {
    // Start from parent, not self
    // Self-parented objects have no parent to search
    const parentId = this.obj.parent.value;
    if (parentId === this.obj._id) {
      return null; // No parent to search
    }

    const parent = await this.manager.load(parentId);
    if (!parent) return null;

    // Check if parent has the method directly
    const parentImpl = parent as unknown as RuntimeObjectImpl;
    if (method in parentImpl.obj.methods) {
      return { code: parentImpl.obj.methods[method].code, objectId: parent.id };
    }

    // Otherwise, search up parent's chain
    return parentImpl.findParentMethod(method);
  }

  /**
   * Compile TypeScript code to JavaScript
   * Note: Not private so pass() can access it for compiling parent methods
   */
  compileTypeScript(tsCode: string, methodName: string): string {
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
   * @param definingObjectId - The object ID where this method was found (for pass() support)
   */
  private async executeMethod(code: MethodCode, userContext: any, args: unknown[], methodName = 'anonymous', definingObjectId?: number): Promise<unknown> {
    // Use definingObjectId if provided, otherwise fall back to this.id
    const methodObjectId = definingObjectId ?? this.id;

    // Check cache for compiled code (avoids repeated compilation)
    let jsCode = this.manager.getCompiledMethod(methodObjectId, methodName);

    if (!jsCode) {
      // Cache miss - compile TypeScript to JavaScript
      jsCode = this.compileTypeScript(code, methodName);

      // Store in cache (never evicts)
      this.manager.setCompiledMethod(methodObjectId, methodName, jsCode);
    }

    // Create execution context with access to:
    // - self: the proxied object (enables self.hp instead of self.get('hp'))
    // - $: the object manager (for finding other objects)
    // - args: method arguments
    // - $N: direct object references ($2, $3, etc.) via Proxy
    // - $alias: pre-resolved aliases (e.g., $exit, $room, $recycler)

    const self = this.proxy;

    // Pre-load all aliases as RuntimeObjects for direct access as $alias variables
    // This allows MOO code to use $exit, $room, $recycler directly
    const objectManager = await this.manager.load(0);
    const aliasIds = (objectManager?.get('aliases') as Record<string, number | Record<string, number>>) || {};
    const resolvedAliases: Record<string, RuntimeObject> = {};
    const aliasNames: string[] = [];
    
    for (const [name, value] of Object.entries(aliasIds)) {
      // Skip nested objects (like bodyParts, weapons, ammoTypes, magazines)
      if (typeof value === 'number') {
        const obj = this.manager.getSync(value);
        if (obj) {
          resolvedAliases[name] = obj;
          aliasNames.push(name);
        }
      }
    }

    // Generate variable declarations for all aliases (e.g., "const $exit = ctx._aliases['exit'];")
    const aliasDeclarations = aliasNames
      .map(name => `const $${name} = ctx._aliases['${name}'];`)
      .join('\n        ');

    // Create a Proxy for $ that allows $[42] syntax (returns Promise)
    // Also delegates unknown properties/methods to ObjectManager #0
    const manager = this.manager;
    const $proxy = new Proxy(manager, {
      get(target, prop) {
        // Check if accessing a numeric property like $[42], $[123]
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const objId = parseInt(prop, 10);
          // Return a Promise - caller must await: const obj = await $[42]
          return target.load(objId);
        }
        // Check manager's own properties/methods first
        const managerProp = (target as any)[prop];
        if (managerProp !== undefined) {
          return managerProp;
        }
        // Delegate unknown properties to ObjectManager #0
        // This allows $.clearAliasesForObject() to work
        return async (...args: unknown[]) => {
          const objectManager = await target.load(0);
          if (!objectManager) {
            throw new Error(`$: ObjectManager #0 not found`);
          }
          const method = (objectManager as any)[prop];
          if (typeof method === 'function') {
            return method.call(objectManager, ...args);
          }
          // Not a method, return property value
          return (objectManager as any)[prop];
        };
      },
    });

    // Get player and command from userContext (set by callVerb)
    // This is cleaner than the old approach of stuffing them into args
    const verbPlayer = userContext?.player || null;
    const verbCommand = userContext?.command || '';

    // Create pass() function for calling parent's version of this method
    // MOO-style: pass(@args) calls the same method on parent with current self
    // IMPORTANT: We search from the object where method is DEFINED (definingObjectId),
    // not from self (self might be a child instance calling inherited method)

    const createPass = (searchFromId: number) => {
      return async (...passArgs: unknown[]) => {
        // Use passed args if provided, otherwise use original args
        const argsToPass = passArgs.length > 0 ? passArgs : args;

        // Find parent's version starting from the object that defines current method
        const searchFrom = await manager.load(searchFromId);
        if (!searchFrom) {
          throw new Error(`pass(): Could not load object #${searchFromId}`);
        }

        const searchFromImpl = searchFrom as RuntimeObjectImpl;
        const parentMethod = await searchFromImpl.findParentMethod(methodName);
        if (!parentMethod) {
          throw new Error(`pass(): No parent implementation of '${methodName}' found above #${searchFromId}`);
        }

        // Execute parent's method with current self binding
        let parentJsCode = manager.getCompiledMethod(parentMethod.objectId, methodName);
        if (!parentJsCode) {
          const parentObj = await manager.load(parentMethod.objectId);
          if (parentObj) {
            parentJsCode = (parentObj as RuntimeObjectImpl).compileTypeScript(parentMethod.code, methodName);
            manager.setCompiledMethod(parentMethod.objectId, methodName, parentJsCode);
          }
        }

        if (!parentJsCode) {
          throw new Error(`pass(): Could not compile parent method '${methodName}'`);
        }

        // Create new pass for chained calls - search from the parent's object
        const chainedPass = createPass(parentMethod.objectId);

        // Re-execute with same self but parent's code
        const parentContext = {
          self,
          this: self,
          $: $proxy,
          args: argsToPass,
          context: userContext,
          player: verbPlayer || userContext?.player || null,
          command: verbCommand || '',
          pass: chainedPass, // New pass that searches from parent's parent
          methodName,
          _aliases: resolvedAliases, // Pre-resolved alias objects for $alias variable injection
          // Standard JavaScript globals
          Object, Array, Math, JSON, Date, String, Number, Boolean,
          RegExp, Error, Promise, console, parseInt, parseFloat, isNaN, isFinite,
        };

        const AsyncFn = async function () { }.constructor as FunctionConstructor;
        const parentFn = new AsyncFn('ctx', `
          const self = ctx.self;
          const $ = ctx.$;
          const args = ctx.args;
          const context = ctx.context;
          const player = ctx.player;
          const command = ctx.command;
          const pass = ctx.pass;
          const Object = ctx.Object;
          const Array = ctx.Array;
          const Math = ctx.Math;
          const JSON = ctx.JSON;
          const Date = ctx.Date;
          const String = ctx.String;
          const Number = ctx.Number;
          const Boolean = ctx.Boolean;
          const RegExp = ctx.RegExp;
          const Error = ctx.Error;
          const Promise = ctx.Promise;
          const console = ctx.console;
          const parseInt = ctx.parseInt;
          const parseFloat = ctx.parseFloat;
          const isNaN = ctx.isNaN;
          const isFinite = ctx.isFinite;
          const $load = $.load.bind($);
          const $create = $.create.bind($);
          const $addAlias = $.addAlias.bind($);
          const $removeAlias = $.removeAlias.bind($);
          const $getAlias = $.getAlias.bind($);
          const $clearAliasesForObject = $.clearAliasesForObject.bind($);
          const $aliases = $.aliases;
          const $db = $.db;
          const $evictFromCache = $.evictFromCache.bind($);
          const $getInheritanceChain = $.getInheritanceChain.bind($);
          ${aliasDeclarations}
          return (async () => {
            ${parentJsCode}
          })();
        `);
        return await parentFn(parentContext);
      };
    };

    const pass = createPass(methodObjectId);

    const context = {
      self,
      this: self, // Also expose as 'this' but it might be shadowed
      $: $proxy,
      args,
      context: userContext, // ConnectionContext or other execution context
      player: verbPlayer || userContext?.player || null, // Player from verb dispatch or context (null for non-verb calls)
      command: verbCommand || '', // Raw command string from verb dispatch
      pass, // MOO-style pass() to call parent's method
      methodName, // Current method name (useful for debugging/reflection)
      _aliases: resolvedAliases, // Pre-resolved alias objects for $alias variable injection
      // Standard JavaScript globals for @eval and general use
      Object,
      Array,
      Math,
      JSON,
      Date,
      String,
      Number,
      Boolean,
      RegExp,
      Error,
      Promise,
      console,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
    };

    try {
      // Wrap code in async function for execution
      // Don't destructure $ so we can use $2, $3, etc. via Proxy
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const AsyncFn = async function () { }.constructor as FunctionConstructor;
      const fn = new AsyncFn('ctx', `
        const self = ctx.self;
        const $ = ctx.$;
        const args = ctx.args;
        const context = ctx.context;
        const player = ctx.player;
        const command = ctx.command;
        const pass = ctx.pass;
        const Object = ctx.Object;
        const Array = ctx.Array;
        const Math = ctx.Math;
        const JSON = ctx.JSON;
        const Date = ctx.Date;
        const String = ctx.String;
        const Number = ctx.Number;
        const Boolean = ctx.Boolean;
        const RegExp = ctx.RegExp;
        const Error = ctx.Error;
        const Promise = ctx.Promise;
        const console = ctx.console;
        const parseInt = ctx.parseInt;
        const parseFloat = ctx.parseFloat;
        const isNaN = ctx.isNaN;
        const isFinite = ctx.isFinite;
        const $load = $.load.bind($);
        const $create = $.create.bind($);
        const $addAlias = $.addAlias.bind($);
        const $removeAlias = $.removeAlias.bind($);
        const $getAlias = $.getAlias.bind($);
        const $clearAliasesForObject = $.clearAliasesForObject.bind($);
        const $aliases = $.aliases;
        const $db = $.db;
        const $evictFromCache = $.evictFromCache.bind($);
        const $getInheritanceChain = $.getInheritanceChain.bind($);
        ${aliasDeclarations}
        return (async () => {
          ${jsCode}
        })();
      `);

      return await fn(context);
    } catch (err) {
      // Log detailed error info for debugging circular reference issues
      if (err instanceof Error && err.message.includes('circular')) {
        console.error(`[RuntimeObject] Circular reference error in method '${methodName}' on #${this.id}`);
        console.error(`[RuntimeObject] Method code excerpt: ${jsCode.substring(0, 200)}...`);
        console.error(`[RuntimeObject] Stack: ${err.stack}`);
      }
      throw new Error(
        `Error executing method '${methodName}' on object #${this.id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Get parent object (resolves objref to RuntimeObject)
   * Returns null if self-parented (root object)
   */
  getParent(): RuntimeObject | null {
    const parentId = this.obj.parent.value;
    if (parentId === this.obj._id) return null; // Self-parented means no parent
    return this.manager.getSync(parentId);
  }

  /**
   * Set parent object
   */
  setParent(parent: RuntimeObject): void {
    this.obj.parent = { type: 'objref', value: parent.id } as ObjRefValue;

    // Auto-persist
    this.manager.update(this.id, {
      parent: this.obj.parent
    }, false).catch(err => {
      console.error(`[RuntimeObject] Failed to persist parent on #${this.id}:`, err);
    });
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
  /**
   * Save changes to database (alias for push)
   */
  async save(): Promise<void> {
    await this.push();
  }

  /**
   * Push current state to database
   */
  async push(): Promise<void> {
    if (!this.dirty) return;

    // Don't invalidate transient caches - we're the source of truth
    await this.manager.update(this.id, {
      parent: this.obj.parent,
      properties: this.obj.properties,
      methods: this.obj.methods,
    }, false);

    this.dirty = false;
  }

  /**
   * Pull fresh data from database (in-place)
   */
  async pull(): Promise<void> {
    const fresh = await this.manager.getDatabase().get(this.id);
    if (fresh) {
      this.obj = fresh;
      this.dirty = false;
      // Invalidate transient caches (methods, parent chains) because they might be stale
      this.manager.invalidateTransientCache(this.id);
    }
  }


  /**
   * Add a method to this object
   * Auto-persists to database
   */
  addMethod(name: string, code: MethodCode): void {
    this.obj.methods[name] = { code };

    // Auto-persist
    this.manager.update(this.id, {
      methods: this.obj.methods
    }, false).catch(err => {
      console.error(`[RuntimeObject] Failed to persist method ${name} on #${this.id}:`, err);
    });
  }

  /**
   * Remove a method from this object
   * Auto-persists to database
   */
  removeMethod(name: string): void {
    delete this.obj.methods[name];

    // Auto-persist
    this.manager.update(this.id, {
      methods: this.obj.methods
    }, false).catch(err => {
      console.error(`[RuntimeObject] Failed to persist method removal on #${this.id}:`, err);
    });
  }

  /**
   * Get the raw GameObject (for manager use)
   */
  _getRaw(): GameObject {
    return this.obj;
  }
}
