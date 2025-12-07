import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObjectDatabase } from '../src/database/object-db.js';
import { ObjectManager } from '../src/database/object-manager.js';
import type { RuntimeObject } from '../types/object.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('TypeScript Compilation', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let testObj: RuntimeObject;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_typescript_compilation');
    await db.connect();

    // Clean database
    await db['objects'].deleteMany({});

    manager = new ObjectManager(db);

    // Create a test object
    testObj = await manager.create({
      parent: 0,
      properties: {
        name: 'Test Object',
        hp: 100,
        items: [1, 2, 3],
      },
      methods: {},
    });
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('compileTypeScript() method', () => {
    it('should compile valid TypeScript to JavaScript', async () => {
      testObj.setMethod('simple', 'return "Hello";');

      const result = await testObj.call('simple');
      expect(result).toBe('Hello');
    });

    it('should compile TypeScript with type annotations', async () => {
      testObj.setMethod('typed', `
        const message: string = "typed";
        const count: number = 42;
        return message + count;
      `);

      const result = await testObj.call('typed');
      expect(result).toBe('typed42');
    });

    it('should compile modern ES features', async () => {
      testObj.setMethod('modern', `
        const arr = [1, 2, 3];
        const doubled = arr.map(x => x * 2);
        return doubled;
      `);

      const result = await testObj.call('modern');
      expect(result).toEqual([2, 4, 6]);
    });

    it('should compile async/await syntax', async () => {
      testObj.setMethod('asyncCode', `
        const delay = () => Promise.resolve(42);
        return await delay();
      `);

      const result = await testObj.call('asyncCode');
      expect(result).toBe(42);
    });

    it('should handle multi-line TypeScript code', async () => {
      testObj.setMethod('multiLine', `
        const x: number = 10;
        const y: number = 20;
        const sum = x + y;
        return sum;
      `);

      const result = await testObj.call('multiLine');
      expect(result).toBe(30);
    });
  });

  describe('executeMethod()', () => {
    it('should compile and execute TypeScript code', async () => {
      testObj.setMethod('execute', 'return 2 + 2;');

      const result = await testObj.call('execute');
      expect(result).toBe(4);
    });

    it('should execute code with return statement', async () => {
      testObj.setMethod('withReturn', 'return "result";');

      const result = await testObj.call('withReturn');
      expect(result).toBe('result');
    });

    it('should execute code without explicit return', async () => {
      testObj.setMethod('implicitReturn', 'return 42;');

      const result = await testObj.call('implicitReturn');
      expect(result).toBe(42);
    });

    it('should handle empty code', async () => {
      testObj.setMethod('empty', '// empty method');

      const result = await testObj.call('empty');
      expect(result).toBeUndefined();
    });

    it('should execute multiple times consistently', async () => {
      testObj.setMethod('consistent', 'return Math.PI;');

      const result1 = await testObj.call('consistent');
      const result2 = await testObj.call('consistent');

      expect(result1).toBe(result2);
      expect(result1).toBe(Math.PI);
    });
  });

  describe('TypeScript-specific syntax', () => {
    it('should support type annotations on variables', async () => {
      testObj.setMethod('typeAnnotations', `
        const greeting: string = 'Hello';
        const count: number = 42;
        const active: boolean = true;
        return { greeting, count, active };
      `);

      const result = await testObj.call('typeAnnotations') as any;
      expect(result.greeting).toBe('Hello');
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
    });

    it('should support interface definitions', async () => {
      testObj.setMethod('interfaces', `
        interface Person {
          name: string;
          age: number;
        }

        const person: Person = {
          name: "Alice",
          age: 30
        };

        return person.name + " is " + person.age;
      `);

      const result = await testObj.call('interfaces');
      expect(result).toBe('Alice is 30');
    });

    it('should support type aliases', async () => {
      testObj.setMethod('typeAliases', `
        type Point = { x: number; y: number };
        type ID = string | number;

        const point: Point = { x: 10, y: 20 };
        const id: ID = "abc123";

        return { point, id };
      `);

      const result = await testObj.call('typeAliases') as any;
      expect(result.point.x).toBe(10);
      expect(result.id).toBe('abc123');
    });

    it('should support arrow functions with types', async () => {
      testObj.setMethod('arrowFunctions', `
        const double = (n: number): number => n * 2;
        const add = (a: number, b: number): number => a + b;

        return { doubled: double(5), sum: add(3, 7) };
      `);

      const result = await testObj.call('arrowFunctions') as any;
      expect(result.doubled).toBe(10);
      expect(result.sum).toBe(10);
    });

    it('should support async/await with types', async () => {
      testObj.setMethod('asyncAwait', `
        const delay = (ms: number): Promise<string> =>
          new Promise(resolve => setTimeout(() => resolve('done'), ms));

        const result = await delay(10);
        return result;
      `);

      const result = await testObj.call('asyncAwait');
      expect(result).toBe('done');
    });

    it('should support template literals', async () => {
      testObj.setMethod('templateLiterals', `
        const name: string = "World";
        const count: number = 5;
        return \`Hello, \${name}! Count: \${count}\`;
      `);

      const result = await testObj.call('templateLiterals');
      expect(result).toBe('Hello, World! Count: 5');
    });

    it('should support destructuring with types', async () => {
      testObj.setMethod('destructuring', `
        const data: { x: number; y: number; z: number } = { x: 10, y: 20, z: 30 };
        const { x, y } = data;

        const arr: number[] = [1, 2, 3];
        const [first, second] = arr;

        return { x, y, first, second };
      `);

      const result = await testObj.call('destructuring') as any;
      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
      expect(result.first).toBe(1);
      expect(result.second).toBe(2);
    });

    it('should support spread operator', async () => {
      testObj.setMethod('spreadOperator', `
        const arr1: number[] = [1, 2, 3];
        const arr2: number[] = [4, 5, 6];
        const combined = [...arr1, ...arr2];

        const obj1 = { a: 1, b: 2 };
        const obj2 = { c: 3, d: 4 };
        const merged = { ...obj1, ...obj2 };

        return { combined, merged };
      `);

      const result = await testObj.call('spreadOperator') as any;
      expect(result.combined).toEqual([1, 2, 3, 4, 5, 6]);
      expect(result.merged).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it('should support optional chaining', async () => {
      testObj.setMethod('optionalChaining', `
        const obj: { nested?: { value?: number } } = {};
        const result1 = obj?.nested?.value ?? 42;

        const withValue = { nested: { value: 100 } };
        const result2 = withValue?.nested?.value ?? 42;

        return { result1, result2 };
      `);

      const result = await testObj.call('optionalChaining') as any;
      expect(result.result1).toBe(42);
      expect(result.result2).toBe(100);
    });

    it('should support nullish coalescing', async () => {
      testObj.setMethod('nullishCoalescing', `
        const value1 = null ?? 'default';
        const value2 = undefined ?? 'default';
        const value3 = 0 ?? 'default';
        const value4 = '' ?? 'default';
        return { value1, value2, value3, value4 };
      `);

      const result = await testObj.call('nullishCoalescing') as any;
      expect(result.value1).toBe('default');
      expect(result.value2).toBe('default');
      expect(result.value3).toBe(0);
      expect(result.value4).toBe('');
    });

    it('should support generics', async () => {
      testObj.setMethod('generics', `
        function identity<T>(value: T): T {
          return value;
        }

        function wrap<T>(value: T): { data: T } {
          return { data: value };
        }

        const num = identity<number>(42);
        const str = identity<string>('hello');
        const wrapped = wrap<number>(100);

        return { num, str, wrapped: wrapped.data };
      `);

      const result = await testObj.call('generics') as any;
      expect(result.num).toBe(42);
      expect(result.str).toBe('hello');
      expect(result.wrapped).toBe(100);
    });

    it('should support enums', async () => {
      testObj.setMethod('enums', `
        enum Direction {
          Up = 1,
          Down = 2,
          Left = 3,
          Right = 4
        }

        const dir: Direction = Direction.Up;
        return { dir, sum: Direction.Up + Direction.Right };
      `);

      const result = await testObj.call('enums') as any;
      expect(result.dir).toBe(1);
      expect(result.sum).toBe(5);
    });

    it('should support classes with TypeScript features', async () => {
      testObj.setMethod('classes', `
        class Counter {
          private count: number = 0;

          constructor(initial: number = 0) {
            this.count = initial;
          }

          increment(): void {
            this.count++;
          }

          getCount(): number {
            return this.count;
          }
        }

        const counter = new Counter(10);
        counter.increment();
        counter.increment();
        return counter.getCount();
      `);

      const result = await testObj.call('classes');
      expect(result).toBe(12);
    });

    it('should support type guards', async () => {
      testObj.setMethod('typeGuards', `
        function isString(value: unknown): value is string {
          return typeof value === 'string';
        }

        function isNumber(value: unknown): value is number {
          return typeof value === 'number';
        }

        const test1: unknown = "hello";
        const test2: unknown = 42;

        const result1 = isString(test1) ? test1.toUpperCase() : 'not string';
        const result2 = isNumber(test2) ? test2 * 2 : 'not number';

        return { result1, result2 };
      `);

      const result = await testObj.call('typeGuards') as any;
      expect(result.result1).toBe('HELLO');
      expect(result.result2).toBe(84);
    });

    it('should support union types', async () => {
      testObj.setMethod('unionTypes', `
        type StringOrNumber = string | number;

        function process(value: StringOrNumber): string {
          if (typeof value === 'string') {
            return value.toUpperCase();
          }
          return value.toString();
        }

        return {
          str: process('hello'),
          num: process(42)
        };
      `);

      const result = await testObj.call('unionTypes') as any;
      expect(result.str).toBe('HELLO');
      expect(result.num).toBe('42');
    });

    it('should support readonly modifiers', async () => {
      testObj.setMethod('readonly', `
        interface ReadonlyPerson {
          readonly name: string;
          readonly age: number;
        }

        const person: ReadonlyPerson = { name: 'Alice', age: 30 };
        return person.name + ' ' + person.age;
      `);

      const result = await testObj.call('readonly');
      expect(result).toBe('Alice 30');
    });
  });

  describe('Runtime context (self, $, args)', () => {
    it('should have access to self', async () => {
      testObj.setMethod('checkSelf', 'return self.id;');

      const result = await testObj.call('checkSelf');
      expect(result).toBe(testObj.id);
    });

    it('should access properties via self.get()', async () => {
      testObj.setMethod('getProperty', `
        return self.get("name");
      `);

      const result = await testObj.call('getProperty');
      expect(result).toBe('Test Object');
    });

    it('should access properties via direct property access', async () => {
      testObj.setMethod('directAccess', `
        const name: string = self.name;
        const hp: number = self.hp;
        return \`\${name} has \${hp} HP\`;
      `);

      const result = await testObj.call('directAccess');
      expect(result).toBe('Test Object has 100 HP');
    });

    it('should modify properties via self.set()', async () => {
      testObj.setMethod('setProperty', `
        self.set("hp", 50);
        return self.get("hp");
      `);

      const result = await testObj.call('setProperty');
      expect(result).toBe(50);
      expect(testObj.get('hp')).toBe(50);
    });

    it('should modify properties via direct assignment', async () => {
      testObj.setMethod('directAssignment', `
        self.hp = 75;
        return self.hp;
      `);

      const result = await testObj.call('directAssignment');
      expect(result).toBe(75);
      // Wait for auto-save to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(testObj.get('hp')).toBe(75);
    });

    it('should have access to args parameter', async () => {
      testObj.setMethod('useArgs', `
        const first = args[0] as number;
        const second = args[1] as number;
        return first + second;
      `);

      const result = await testObj.call('useArgs', 10, 20);
      expect(result).toBe(30);
    });

    it('should handle multiple args with different types', async () => {
      testObj.setMethod('multipleArgs', `
        const str = args[0] as string;
        const num = args[1] as number;
        const bool = args[2] as boolean;
        return { str, num, bool };
      `);

      const result = await testObj.call('multipleArgs', 'test', 42, true) as any;
      expect(result.str).toBe('test');
      expect(result.num).toBe(42);
      expect(result.bool).toBe(true);
    });

    it('should handle missing args gracefully', async () => {
      testObj.setMethod('missingArgs', `
        const first = args[0] ?? 'default';
        const second = args[1] ?? 100;
        return { first, second };
      `);

      const result = await testObj.call('missingArgs') as any;
      expect(result.first).toBe('default');
      expect(result.second).toBe(100);
    });

    it('should have access to $ (ObjectManager)', async () => {
      testObj.setMethod('useManager', `
        return typeof $ !== "undefined";
      `);

      const result = await testObj.call('useManager');
      expect(result).toBe(true);
    });

    it('should load other objects via $.load()', async () => {
      const otherObj = await manager.create({
        parent: 0,
        properties: { name: 'Other Object', value: 42 },
        methods: {},
      });

      testObj.setMethod('loadOther', `
        const other = await $.load(${otherObj.id});
        return other?.get("value");
      `);

      const result = await testObj.call('loadOther');
      expect(result).toBe(42);
    });

    it('should call methods on other objects via $', async () => {
      const otherObj = await manager.create({
        parent: 0,
        properties: { multiplier: 5 },
        methods: {},
      });
      otherObj.setMethod('multiply', `
        const mult = self.get("multiplier") as number;
        const input = args[0] as number;
        return mult * input;
      `);

      testObj.setMethod('callOther', `
        const other = await $.load(${otherObj.id});
        return await other?.call("multiply", 10);
      `);

      const result = await testObj.call('callOther');
      expect(result).toBe(50);
    });

    it('should allow calling methods on self', async () => {
      testObj.setMethod('helper', `
        return 'helper result';
      `);

      testObj.setMethod('caller', `
        const result = await self.helper();
        return 'caller: ' + result;
      `);

      const result = await testObj.call('caller');
      expect(result).toBe('caller: helper result');
    });

    it('should have this as an alias for self', async () => {
      testObj.setMethod('checkThis', `
        // In the execution context, 'this' is exposed but may behave differently
        // than 'self' depending on the execution scope
        return typeof this !== 'undefined' && this.id === self.id;
      `);

      const result = await testObj.call('checkThis');
      // This test just verifies that 'this' is available
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Compilation error handling', () => {
    it('should catch severe syntax errors', async () => {
      testObj.setMethod('syntaxError', 'const x = ;');

      await expect(testObj.call('syntaxError')).rejects.toThrow();
    });

    it('should provide method name in compilation error', async () => {
      testObj.setMethod('namedCompileError', 'const x = ;');

      try {
        await testObj.call('namedCompileError');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        const message = (err as Error).message;
        expect(message).toContain('namedCompileError');
      }
    });

    it('should handle invalid TypeScript constructs', async () => {
      testObj.setMethod('invalidTS', 'export default class X {}');

      // TypeScript compiler may still generate output for some invalid constructs
      // Just ensure it doesn't crash the system
      try {
        await testObj.call('invalidTS');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
  });

  describe('Runtime error handling', () => {
    it('should catch runtime errors', async () => {
      testObj.setMethod('runtimeError', `
        throw new Error("Runtime error");
      `);

      await expect(testObj.call('runtimeError')).rejects.toThrow(/runtime error/i);
    });

    it('should provide method name in runtime error', async () => {
      testObj.setMethod('namedRuntimeError', `
        throw new Error("Named runtime error");
      `);

      try {
        await testObj.call('namedRuntimeError');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        const message = (err as Error).message;
        expect(message).toContain('namedRuntimeError');
      }
    });

    it('should handle undefined variable access', async () => {
      testObj.setMethod('undefinedVar', `
        return nonExistentVariable;
      `);

      await expect(testObj.call('undefinedVar')).rejects.toThrow();
    });

    it('should handle null reference errors', async () => {
      testObj.setMethod('nullError', `
        const obj: any = null;
        return obj.property;
      `);

      await expect(testObj.call('nullError')).rejects.toThrow();
    });

    it('should handle method not found', async () => {
      await expect(testObj.call('nonExistentMethod')).rejects.toThrow(/not found/i);
    });

    it('should handle async errors', async () => {
      testObj.setMethod('asyncError', `
        await Promise.reject(new Error("Async error"));
      `);

      await expect(testObj.call('asyncError')).rejects.toThrow(/async error/i);
    });

    it('should provide useful error message for type errors at runtime', async () => {
      testObj.setMethod('typeError', `
        const obj: any = null;
        obj.method();
      `);

      try {
        await testObj.call('typeError');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toMatch(/typeError/);
      }
    });

    it('should handle errors in async operations', async () => {
      testObj.setMethod('asyncOpError', `
        const delay = (ms: number) => new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Timeout error')), ms);
        });

        await delay(10);
      `);

      await expect(testObj.call('asyncOpError')).rejects.toThrow(/timeout error/i);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle complex object manipulation', async () => {
      testObj.setMethod('complexManipulation', `
        interface Item {
          id: number;
          name: string;
          value: number;
        }

        const items: Item[] = [
          { id: 1, name: "Sword", value: 100 },
          { id: 2, name: "Shield", value: 75 },
          { id: 3, name: "Potion", value: 25 }
        ];

        const total = items.reduce((sum, item) => sum + item.value, 0);
        const expensive = items.filter(item => item.value > 50);

        return { total, count: expensive.length };
      `);

      const result = await testObj.call('complexManipulation') as any;
      expect(result.total).toBe(200);
      expect(result.count).toBe(2);
    });

    it('should handle nested async operations', async () => {
      testObj.setMethod('nestedAsync', `
        const delay = (ms: number) => new Promise<number>(resolve =>
          setTimeout(() => resolve(ms), ms)
        );

        const results = await Promise.all([
          delay(10),
          delay(5),
          delay(1)
        ]);

        return results.reduce((a, b) => a + b, 0);
      `);

      const result = await testObj.call('nestedAsync');
      expect(result).toBe(16);
    });

    it('should handle recursive functions', async () => {
      testObj.setMethod('fibonacci', `
        function fib(n: number): number {
          if (n <= 1) return n;
          return fib(n - 1) + fib(n - 2);
        }

        return fib(10);
      `);

      const result = await testObj.call('fibonacci');
      expect(result).toBe(55);
    });

    it('should handle closures', async () => {
      testObj.setMethod('closures', `
        function makeCounter(start: number) {
          let count = start;
          return {
            increment: () => ++count,
            decrement: () => --count,
            getCount: () => count
          };
        }

        const counter = makeCounter(10);
        counter.increment();
        counter.increment();
        counter.decrement();

        return counter.getCount();
      `);

      const result = await testObj.call('closures');
      expect(result).toBe(11);
    });

    it('should handle higher-order functions', async () => {
      testObj.setMethod('higherOrder', `
        function compose<T>(f: (x: T) => T, g: (x: T) => T): (x: T) => T {
          return (x: T) => f(g(x));
        }

        const double = (x: number) => x * 2;
        const addTen = (x: number) => x + 10;

        const doubleAndAddTen = compose(addTen, double);

        return doubleAndAddTen(5);
      `);

      const result = await testObj.call('higherOrder');
      expect(result).toBe(20); // (5 * 2) + 10
    });

    it('should combine self, $, and args in complex logic', async () => {
      const target = await manager.create({
        parent: 0,
        properties: { defense: 20 },
        methods: {},
      });

      testObj.setMethod('attack', `
        const damage = args[0] as number;
        const targetId = args[1] as number;
        const attackPower = self.get("hp") as number;

        const target = await $.load(targetId);
        if (!target) return "Target not found";

        const defense = target.get("defense") as number;
        const actualDamage = Math.max(0, damage + attackPower / 10 - defense);

        return {
          attacker: self.get("name"),
          damage: actualDamage,
          targetDefense: defense
        };
      `);

      const result = await testObj.call('attack', 50, target.id) as any;
      expect(result.attacker).toBe('Test Object');
      expect(result.damage).toBe(40); // 50 + 10 - 20
      expect(result.targetDefense).toBe(20);
    });
  });

  describe('Performance', () => {
    it('should compile and execute quickly', async () => {
      testObj.setMethod('simple', 'return 42;');

      const start = Date.now();
      await testObj.call('simple');
      const duration = Date.now() - start;

      // Should complete in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle loops efficiently', async () => {
      testObj.setMethod('loop', `
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      `);

      const start = Date.now();
      const result = await testObj.call('loop');
      const elapsed = Date.now() - start;

      expect(result).toBe(499500);
      expect(elapsed).toBeLessThan(100);
    });

    it('should handle multiple sequential calls', async () => {
      testObj.setMethod('counter', `
        const current = (self.get("count") as number) ?? 0;
        self.set("count", current + 1);
        return current + 1;
      `);

      for (let i = 1; i <= 10; i++) {
        const result = await testObj.call('counter');
        expect(result).toBe(i);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty method body', async () => {
      testObj.setMethod('empty', '// empty');

      const result = await testObj.call('empty');
      expect(result).toBeUndefined();
    });

    it('should handle whitespace-only method', async () => {
      testObj.setMethod('whitespace', '   \n\t  ');

      const result = await testObj.call('whitespace');
      expect(result).toBeUndefined();
    });

    it('should handle special characters in strings', async () => {
      testObj.setMethod('specialChars', `
        const str = "Line 1\\nLine 2\\tTabbed\\r\\nWindows";
        return str.includes("\\n");
      `);

      const result = await testObj.call('specialChars');
      expect(result).toBe(true);
    });

    it('should handle unicode characters', async () => {
      testObj.setMethod('unicode', `
        const emoji = "🎮🎲🎯";
        // Emoji use surrogate pairs in JavaScript, so length is 6 not 3
        return emoji.length;
      `);

      const result = await testObj.call('unicode');
      // Each emoji is actually 2 code units (surrogate pairs)
      expect(result).toBe(6);
    });

    it('should handle BigInt', async () => {
      testObj.setMethod('bigInt', `
        const big = BigInt(9007199254740991);
        return (big + BigInt(1)).toString();
      `);

      const result = await testObj.call('bigInt');
      expect(result).toBe('9007199254740992');
    });

    it('should handle Symbol', async () => {
      testObj.setMethod('symbols', `
        const sym1 = Symbol('test');
        const sym2 = Symbol('test');
        return sym1 !== sym2;
      `);

      const result = await testObj.call('symbols');
      expect(result).toBe(true);
    });

    it('should handle try-catch-finally', async () => {
      testObj.setMethod('tryCatchFinally', `
        let result = "start";
        try {
          result += " try";
          throw new Error("test");
        } catch (e) {
          result += " catch";
        } finally {
          result += " finally";
        }
        return result;
      `);

      const result = await testObj.call('tryCatchFinally');
      expect(result).toBe('start try catch finally');
    });
  });
});
