import * as ts from 'typescript';
import type {
  GameObject,
  Method,
  MethodCode,
  ObjId,
  ObjRefValue,
  PropertyInfo,
  PropertyValue,
  RuntimeObject,
  Value,
} from '../../types/object.js';
import type { ObjectManager } from './object-manager.js';

/**
 * Runtime wrapper around GameObject with inheritance and method execution
 * Uses Proxy to enable direct property access (e.g., self.hp instead of self.get('hp'))
 */
export class RuntimeObjectImpl implements RuntimeObject {
  private obj: GameObject;
  private dirty = false;
  private proxy: RuntimeObject;
  private _cachedParent: RuntimeObject | undefined = undefined; // undefined = not cached
  private writeQueue: Promise<void> = Promise.resolve(); // Serializes ALL writes to this object

  constructor(
    obj: GameObject,
    private manager: ObjectManager,
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
      },
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
  private toValue(
    jsValue: any,
    seen: WeakSet<object> = new WeakSet(),
    path: string = 'root',
  ): Value {
    // Handle null
    if (jsValue === null) {
      return { type: 'null', value: null };
    }

    // Handle undefined (treat as null)
    if (jsValue === undefined) {
      return { type: 'null', value: null };
    }

    // Already a typed Value - return as-is to avoid double-wrapping
    if (
      jsValue &&
      typeof jsValue === 'object' &&
      'type' in jsValue &&
      'value' in jsValue
    ) {
      const validTypes = [
        'null',
        'string',
        'number',
        'boolean',
        'objref',
        'array',
        'object',
      ];
      if (validTypes.includes(jsValue.type)) {
        return jsValue;
      }
    }

    // Handle RuntimeObject (store as objref)
    if (
      jsValue &&
      typeof jsValue === 'object' &&
      'id' in jsValue &&
      typeof jsValue.id === 'number'
    ) {
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
        value: jsValue.map((item, i) =>
          this.toValue(item, seen, `${path}[${i}]`),
        ),
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
        console.warn(
          `[RuntimeObject] Skipping non-plain object at ${path}: ${constructor}`,
        );
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

      case 'objref': {
        // Resolve object reference - getSync returns the proxy directly
        const obj = this.manager.getSync(value.value);
        if (!obj) {
          // Object not in cache or doesn't exist - return raw ID
          return value.value;
        }
        return obj;
      }

      case 'array': {
        // Recursively convert array elements
        const arr = (value.value as Value[]).map((item) =>
          this.fromValue(item),
        );
        // Return plain array - proxying happens in get() where we know the property name
        return arr;
      }

      case 'object': {
        // Recursively convert object properties
        const result: Record<string, any> = {};
        for (const [key, val] of Object.entries(
          value.value as Record<string, Value>,
        )) {
          result[key] = this.fromValue(val);
        }
        return result;
      }

      default:
        return undefined;
    }
  }

  /**
   * Create a proxy for an array that intercepts mutating methods
   * Mutations trigger atomic persistence via pushToArray, etc.
   */
  private createArrayProxy(arr: any[], prop: string): any[] {
    const self = this;
    return new Proxy(arr, {
      get(target, method) {
        switch (method) {
          case 'push':
            return (...values: any[]) => {
              for (const value of values) {
                target.push(value);
                self.pushToArray(prop, value);
              }
              return target.length;
            };

          case 'pop':
            return () => {
              const removed = target.pop();
              self.popFromArray(prop);
              return removed;
            };

          case 'shift':
            return () => {
              const removed = target.shift();
              self.shiftFromArray(prop);
              return removed;
            };

          case 'unshift':
            return (...values: any[]) => {
              // unshift adds to front - we need to reverse and push each
              // MongoDB doesn't have atomic unshift, so we fall back to full set
              target.unshift(...values);
              self.set(prop, target);
              return target.length;
            };

          case 'splice':
            return (start: number, deleteCount?: number, ...items: any[]) => {
              const removed = target.splice(start, deleteCount ?? 0, ...items);
              // splice is complex - fall back to full set
              self.set(prop, target);
              return removed;
            };

          default: {
            const val = (target as any)[method];
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          }
        }
      },
    });
  }

  /**
   * Get property - walks inheritance chain
   * Resolves typed Values to JavaScript values (objrefs become RuntimeObjects)
   * Arrays are wrapped in proxies that intercept mutations
   *
   * IMPORTANT: Inherited mutable values (arrays, plain objects) are COPIED
   * to prevent mutations from affecting the prototype. This ensures that
   * mutating an object's state never mutates its parent's state.
   */
  get(prop: string): PropertyValue | undefined {
    // Check this object first - return value directly (it's ours)
    if (this.obj.properties && prop in this.obj.properties) {
      const value = this.fromValue(this.obj.properties[prop]);
      // Wrap arrays in a proxy to intercept mutations
      if (Array.isArray(value)) {
        return this.createArrayProxy(value, prop);
      }
      return value;
    }

    // Walk up parent chain
    // Stop at self-parented objects (parent.value === self._id) like #-1 and #0
    const parentId = this.obj.parent.value;
    if (parentId !== this.obj._id) {
      const parent = this.manager.getSync(parentId);
      if (parent) {
        const inheritedValue = parent.get(prop);
        // CRITICAL: Copy inherited mutable values to prevent prototype mutation
        // Arrays and plain objects must be copied; RuntimeObjects are references (correct)
        if (Array.isArray(inheritedValue)) {
          // Deep copy the array (shallow copy of elements)
          return [...inheritedValue];
        }
        if (inheritedValue !== null && typeof inheritedValue === 'object') {
          // Check if it's a plain object (not a RuntimeObject or other class instance)
          const proto = Object.getPrototypeOf(inheritedValue);
          if (proto === Object.prototype || proto === null) {
            // Deep copy plain objects
            return { ...inheritedValue };
          }
        }
        return inheritedValue;
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
    this.obj.properties[prop] = this.toValue(
      value,
      new WeakSet(),
      `#${this.id}.${prop}`,
    );

    // Queue the write to ensure ordering
    const valueToWrite = this.obj.properties[prop];
    this.queueWrite(() => this.manager.setProperty(this, prop, valueToWrite));
  }

  /**
   * Delete a property from this object
   * Auto-persists to database
   */
  deleteProperty(prop: string): void {
    if (this.obj.properties && prop in this.obj.properties) {
      delete this.obj.properties[prop];

      // Queue the write to ensure ordering
      const props = { ...this.obj.properties };
      this.queueWrite(() =>
        this.manager.update(this.id, { properties: props }, false),
      );
    }
  }

  /**
   * Queue a write operation to ensure sequential execution
   * ALL writes to this object are serialized to prevent race conditions
   */
  private queueWrite(write: () => Promise<void>): void {
    this.writeQueue = this.writeQueue.then(write).catch((err) => {
      console.error(`[RuntimeObject] Write failed on #${this.id}:`, err);
    });
  }

  /**
   * Wait for all queued writes to complete
   */
  async flushQueue(): Promise<void> {
    await this.writeQueue;
  }

  /**
   * Atomically push a value to an array property
   * Uses MongoDB $push to avoid race conditions
   * Also updates the in-memory array
   */
  pushToArray(prop: string, value: unknown): void {
    if (!this.obj.properties) {
      this.obj.properties = {};
    }

    // Ensure the property exists as an array
    if (!this.obj.properties[prop]) {
      this.obj.properties[prop] = { type: 'array', value: [] };
    }

    const propValue = this.obj.properties[prop];
    if (propValue.type !== 'array' || !Array.isArray(propValue.value)) {
      throw new Error(`Property ${prop} is not an array`);
    }

    // Convert value to typed Value and push to in-memory array
    const typedValue = this.toValue(
      value,
      new WeakSet(),
      `#${this.id}.${prop}[]`,
    );
    propValue.value.push(typedValue);

    // Queue the write to ensure ordering
    this.queueWrite(() => this.manager.pushToArray(this, prop, typedValue));
  }

  /**
   * Atomically pop (remove last element) from an array property
   * Returns the removed element
   */
  popFromArray(prop: string): unknown {
    const propValue = this.obj.properties?.[prop];
    if (
      !propValue ||
      propValue.type !== 'array' ||
      !Array.isArray(propValue.value)
    ) {
      return undefined;
    }

    // Pop from in-memory array
    const removed = propValue.value.pop();

    // Queue the write to ensure ordering
    this.queueWrite(() => this.manager.popFromArray(this, prop));

    return removed ? this.fromValue(removed) : undefined;
  }

  /**
   * Atomically shift (remove first element) from an array property
   * Returns the removed element
   */
  shiftFromArray(prop: string): unknown {
    const propValue = this.obj.properties?.[prop];
    if (
      !propValue ||
      propValue.type !== 'array' ||
      !Array.isArray(propValue.value)
    ) {
      return undefined;
    }

    // Shift from in-memory array
    const removed = propValue.value.shift();

    // Queue the write to ensure ordering
    this.queueWrite(() => this.manager.shiftFromArray(this, prop));

    return removed ? this.fromValue(removed) : undefined;
  }

  /**
   * Atomically remove a value from an array by matching
   * For objrefs, matches by ID
   */
  pullFromArray(prop: string, value: unknown): void {
    const propValue = this.obj.properties?.[prop];
    if (
      !propValue ||
      propValue.type !== 'array' ||
      !Array.isArray(propValue.value)
    ) {
      return;
    }

    // Convert to typed value for comparison
    const typedValue = this.toValue(
      value,
      new WeakSet(),
      `#${this.id}.${prop}[]`,
    );

    // Remove from in-memory array (find by deep equality)
    const idx = propValue.value.findIndex((v) => {
      if (v.type === 'objref' && typedValue.type === 'objref') {
        return v.value === typedValue.value;
      }
      return JSON.stringify(v) === JSON.stringify(typedValue);
    });
    if (idx !== -1) {
      propValue.value.splice(idx, 1);
    }

    // Queue the write to ensure ordering
    this.queueWrite(() => this.manager.pullFromArray(this, prop, typedValue));
  }

  /**
   * Set a method on this object
   * Auto-persists to database
   */
  setMethod(
    name: string,
    code: string,
    options?: { callable?: boolean; aliases?: string[]; help?: string },
  ): void {
    if (!this.obj.methods) {
      this.obj.methods = {};
    }
    this.obj.methods[name] = {
      code,
      ...options,
    };

    // Queue the write to ensure ordering
    const methodDef = this.obj.methods[name];
    this.queueWrite(() => this.manager.setMethod(this, name, methodDef));
  }

  /**
   * Edit a method on this object using string replacement (like file editing)
   * Only works on methods defined directly on this object, not inherited ones.
   *
   * @param name - Method name to edit
   * @param oldString - String to find in the method code
   * @param newString - String to replace it with
   * @param options - Optional: replaceAll (default false) to replace all occurrences
   * @returns Object with success/error info and the updated code
   */
  editMethod(
    name: string,
    oldString: string,
    newString: string,
    options?: { replaceAll?: boolean },
  ): { success: boolean; error?: string; code?: string } {
    // Check if method exists on this object directly
    if (!this.obj.methods || !(name in this.obj.methods)) {
      return {
        success: false,
        error: `Method '${name}' not found on this object. Use setMethod() to create it, or editMethod() on the object where it's defined.`,
      };
    }

    const methodDef = this.obj.methods[name];
    const currentCode = methodDef.code;

    // Check if oldString exists in the code
    if (!currentCode.includes(oldString)) {
      return {
        success: false,
        error: `String not found in method '${name}'. The old_string must match exactly.`,
        code: currentCode,
      };
    }

    // Check for uniqueness if not replaceAll
    if (!options?.replaceAll) {
      const occurrences = currentCode.split(oldString).length - 1;
      if (occurrences > 1) {
        return {
          success: false,
          error: `String appears ${occurrences} times in method '${name}'. Use replaceAll: true to replace all, or provide more context to make it unique.`,
          code: currentCode,
        };
      }
    }

    // Perform the replacement
    const newCode = options?.replaceAll
      ? currentCode.split(oldString).join(newString)
      : currentCode.replace(oldString, newString);

    // Check if anything changed
    if (newCode === currentCode) {
      return {
        success: false,
        error: `No changes made - old_string and new_string result in identical code.`,
        code: currentCode,
      };
    }

    // Use setMethod to apply the change (preserves options like callable, aliases)
    this.obj.methods[name] = {
      ...methodDef,
      code: newCode,
    };

    // Invalidate compiled method cache
    this.manager.invalidateCompiledMethod(this.id, name);

    // Auto-persist
    this.manager
      .update(
        this.id,
        {
          methods: this.obj.methods,
        },
        false,
      )
      .catch((err) => {
        console.error(
          `[RuntimeObject] Failed to persist edited method ${name} on #${this.id}:`,
          err,
        );
      });

    return { success: true, code: newCode };
  }

  /**
   * Get the source code of a method on this object
   * Only returns methods defined directly on this object, not inherited ones.
   * Use getMethodCode() for inherited method lookup.
   *
   * @param name - Method name
   * @returns The method code or null if not found on this object
   */
  getMethod(name: string): string | null {
    if (!this.obj.methods || !(name in this.obj.methods)) {
      return null;
    }
    return this.obj.methods[name].code;
  }

  /**
   * Get the source code of a method, walking the inheritance chain
   *
   * @param name - Method name
   * @returns Object with code and the objectId where it was found, or null
   */
  async getMethodCode(
    name: string,
  ): Promise<{ code: string; objectId: number } | null> {
    const found = await this.findMethodAsync(name);
    if (!found) return null;
    return { code: found.code, objectId: found.objectId };
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
    return await this.executeMethod(
      found.code,
      undefined,
      args,
      method,
      found.objectId,
    );
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
  async callVerb(
    method: string,
    context: any,
    player: RuntimeObject,
    command: string,
    args: unknown[],
  ): Promise<unknown> {
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

    return await this.executeMethod(
      found.code,
      verbContext,
      args,
      method,
      found.objectId,
    );
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
  private async findMethodAsync(
    method: string,
  ): Promise<{ code: MethodCode; objectId: number } | null> {
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
  async findParentMethod(
    method: string,
  ): Promise<{ code: MethodCode; objectId: number } | null> {
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
        throw new Error(
          `TypeScript compilation errors in method '${methodName}':\n${errors.join('\n')}`,
        );
      }

      return result.outputText;
    } catch (err) {
      throw new Error(
        `Failed to compile TypeScript for method '${methodName}': ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Execute method code in context
   * Compiles TypeScript to JavaScript before execution
   * Uses caching for compiled code
   * @param definingObjectId - The object ID where this method was found (for pass() support)
   */
  private async executeMethod(
    code: MethodCode,
    userContext: any,
    args: unknown[],
    methodName = 'anonymous',
    definingObjectId?: number,
  ): Promise<unknown> {
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
    const aliasIds =
      (objectManager?.get('aliases') as Record<
        string,
        number | Record<string, number>
      >) || {};
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
      .map((name) => `const $${name} = ctx._aliases['${name}'];`)
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
          throw new Error(
            `pass(): No parent implementation of '${methodName}' found above #${searchFromId}`,
          );
        }

        // Execute parent's method with current self binding
        let parentJsCode = manager.getCompiledMethod(
          parentMethod.objectId,
          methodName,
        );
        if (!parentJsCode) {
          const parentObj = await manager.load(parentMethod.objectId);
          if (parentObj) {
            parentJsCode = (parentObj as RuntimeObjectImpl).compileTypeScript(
              parentMethod.code,
              methodName,
            );
            manager.setCompiledMethod(
              parentMethod.objectId,
              methodName,
              parentJsCode,
            );
          }
        }

        if (!parentJsCode) {
          throw new Error(
            `pass(): Could not compile parent method '${methodName}'`,
          );
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

        const AsyncFn = (async () => {}).constructor as FunctionConstructor;
        const parentFn = new AsyncFn(
          'ctx',
          `
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
          const $query = $.query.bind($);
          const $aiQuery = $.aiQuery.bind($);
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
        `,
        );
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
      const AsyncFn = (async () => {}).constructor as FunctionConstructor;
      const fn = new AsyncFn(
        'ctx',
        `
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
        const $query = $.query.bind($);
        const $aiQuery = $.aiQuery.bind($);
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
      `,
      );

      return await fn(context);
    } catch (err) {
      // Log detailed error info for debugging circular reference issues
      if (err instanceof Error && err.message.includes('circular')) {
        console.error(
          `[RuntimeObject] Circular reference error in method '${methodName}' on #${this.id}`,
        );
        console.error(
          `[RuntimeObject] Method code excerpt: ${jsCode.substring(0, 200)}...`,
        );
        console.error(`[RuntimeObject] Stack: ${err.stack}`);
      }
      throw new Error(
        `Error executing method '${methodName}' on object #${this.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Get parent object (resolves objref to RuntimeObject)
   * Self-parented objects return themselves
   */
  getParent(): RuntimeObject {
    // Use cached parent if available
    if (this._cachedParent !== undefined) {
      return this._cachedParent;
    }

    const parentId = this.obj.parent.value;
    if (parentId === this.obj._id) {
      this._cachedParent = this.proxy; // Self-parented returns self
      return this.proxy;
    }

    // Look up and cache (coalesce null to undefined)
    this._cachedParent = this.manager.getSync(parentId) ?? undefined;
    return this._cachedParent!;
  }

  /**
   * Set parent object
   */
  setParent(parent: RuntimeObject): void {
    // Validate that we received an actual RuntimeObject, not an ID
    if (
      !parent ||
      typeof parent !== 'object' ||
      typeof parent.id !== 'number'
    ) {
      throw new Error(
        `setParent requires a RuntimeObject, got: ${typeof parent === 'object' ? JSON.stringify(parent) : parent}`,
      );
    }

    // Cache the parent reference (reuse existing RuntimeObject)
    this._cachedParent = parent;

    // Store ID for database persistence
    this.obj.parent = { type: 'objref', value: parent.id } as ObjRefValue;
    this.dirty = true;

    // Auto-persist
    this.manager
      .update(
        this.id,
        {
          parent: this.obj.parent,
        },
        false,
      )
      .catch((err) => {
        console.error(
          `[RuntimeObject] Failed to persist parent on #${this.id}:`,
          err,
        );
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
   * Get all properties with rich info (value, type, description) for AI context
   * Walks inheritance chain - child properties override parent properties
   * Descriptions can be inherited from prototype if not set on instance
   */
  properties(): Record<string, PropertyInfo> {
    const result: Record<string, PropertyInfo> = {};

    // First, gather from parent (so child can override)
    const parentId = this.obj.parent.value;
    if (parentId !== this.obj._id) {
      const parent = this.manager.getSync(parentId);
      if (parent) {
        const parentProps = parent.properties();
        Object.assign(result, parentProps);
      }
    }

    // Then overlay own properties
    for (const [key, storedValue] of Object.entries(
      this.obj.properties || {},
    )) {
      const typedValue = storedValue as Value;

      // If we have an existing entry from parent, preserve description if we don't have one
      const existingDesc = result[key]?.description;

      result[key] = {
        value: this.fromValue(typedValue),
        type: typedValue.type,
        description: typedValue.description || existingDesc,
      };
    }

    return result;
  }

  /**
   * Set description for a property (metadata for AI interpretation)
   * If property doesn't exist yet, creates it with null value
   */
  setPropertyDescription(prop: string, description: string): void {
    if (!this.obj.properties) {
      this.obj.properties = {};
    }

    if (prop in this.obj.properties) {
      // Property exists - add/update description
      const existing = this.obj.properties[prop] as Value;
      existing.description = description;
    } else {
      // Property doesn't exist - check if it's inherited
      const inheritedValue = this.get(prop);
      if (inheritedValue !== undefined) {
        // Create local copy with description
        this.obj.properties[prop] = {
          ...this.toValue(inheritedValue),
          description,
        };
      } else {
        // Create new null property with description
        this.obj.properties[prop] = {
          type: 'null',
          value: null,
          description,
        };
      }
    }

    // Auto-persist
    this.manager
      .update(
        this.id,
        {
          properties: this.obj.properties,
        },
        false,
      )
      .catch((err) => {
        console.error(
          `[RuntimeObject] Failed to persist property description for ${prop} on #${this.id}:`,
          err,
        );
      });
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
    await this.manager.update(
      this.id,
      {
        parent: this.obj.parent,
        properties: this.obj.properties,
        methods: this.obj.methods,
      },
      false,
    );

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
      // Invalidate cached parent (might have changed in DB)
      this._cachedParent = undefined;
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
    this.manager
      .update(
        this.id,
        {
          methods: this.obj.methods,
        },
        false,
      )
      .catch((err) => {
        console.error(
          `[RuntimeObject] Failed to persist method ${name} on #${this.id}:`,
          err,
        );
      });
  }

  /**
   * Remove a method from this object
   * Auto-persists to database
   */
  removeMethod(name: string): void {
    delete this.obj.methods[name];

    // Auto-persist
    this.manager
      .update(
        this.id,
        {
          methods: this.obj.methods,
        },
        false,
      )
      .catch((err) => {
        console.error(
          `[RuntimeObject] Failed to persist method removal on #${this.id}:`,
          err,
        );
      });
  }

  /**
   * Get the raw GameObject (for manager use)
   */
  _getRaw(): GameObject {
    return this.obj;
  }
}
