import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { extractPrototypeSpecFromSourceText } from '../../src/database/bootstrap/prototype-ts/extract.js';

describe('prototype-ts extractor', () => {
  it('extracts alias, parent, defaults, and methods', () => {
    const source = `
      function prototype(_opts: any) { return () => {}; }

      @prototype({ alias: 'describable', parent: 'root' })
      export class Describable {
        static defaults = {
          name: 'Describable',
          description: 'Base',
          count: 3,
          ok: true,
          nope: false,
          none: null,
          arr: [1, 'two', null, { nested: 'x' }],
          typed: [] as string[],
        };

        async shortDesc(self: any, $: any, pass: any) {
          return self.name;
        }

        async moveTo(self: any, $: any, pass: any, dest: any, mover?: any) {
          if (typeof dest === 'number') dest = await $.load(dest);
          return dest;
        }
      }
    `;

    const spec = extractPrototypeSpecFromSourceText(source, 'Describable.ts');

    expect(spec.alias).toBe('describable');
    expect(spec.parent).toBe('root');

    expect(spec.properties.name).toBe('Describable');
    expect(spec.properties.description).toBe('Base');
    expect(spec.properties.count).toBe(3);
    expect(spec.properties.ok).toBe(true);
    expect(spec.properties.nope).toBe(false);
    expect(spec.properties.none).toBe(null);
    expect(spec.properties.arr).toEqual([1, 'two', null, { nested: 'x' }]);
    expect(spec.properties.typed).toEqual([]);

    expect(Object.keys(spec.methods).sort()).toEqual(['moveTo', 'shortDesc']);

    expect(spec.methods.shortDesc.code).toContain('return self.name');

    // In moveTo, we should see arg bindings for dest/mover
    expect(spec.methods.moveTo.code).toContain('let dest = args[0];');
    expect(spec.methods.moveTo.code).toContain('let mover = args[1];');
    expect(spec.methods.moveTo.code).toContain("await $.load(dest)");
    expect(spec.methods.moveTo.code).toContain('return dest');
  });

  it('ignores static methods and constructor', () => {
    const source = `
      function prototype(_opts: any) { return () => {}; }

      @prototype({ alias: 'x', parent: 'root' })
      export class Mix {
        static defaults = { name: 'Mix' };

        constructor() {}

        static helper() {
          return 123;
        }

        async ok(self: any, $: any, pass: any) {
          return self.name;
        }
      }
    `;

    const spec = extractPrototypeSpecFromSourceText(source, 'Mix.ts');

    expect(Object.keys(spec.methods)).toEqual(['ok']);
  });

  it('emits no arg bindings when only prefix params exist', () => {
    const source = `
      function prototype(_opts: any) { return () => {}; }

      @prototype({ alias: 'x', parent: 'root' })
      export class PrefixOnly {
        static defaults = { name: 'PrefixOnly' };

        async ok(self: any, $: any, pass: any) {
          return pass(self.name);
        }
      }
    `;

    const spec = extractPrototypeSpecFromSourceText(source, 'PrefixOnly.ts');

    expect(spec.methods.ok.code).not.toContain('let ');
    expect(spec.methods.ok.code).toContain('return pass(self.name)');
  });

  it('supports negative numbers in defaults', () => {
    const source = `
      function prototype(_opts: any) { return () => {}; }

      @prototype({ alias: 'x', parent: 'root' })
      export class Neg {
        static defaults = { neg: -1 };

        async ok(self: any, $: any, pass: any) {
          return 1;
        }
      }
    `;

    const spec = extractPrototypeSpecFromSourceText(source, 'Neg.ts');

    expect(spec.properties.neg).toBe(-1);
  });

  it('throws on rest parameters', () => {
    const source = `
      function prototype(_opts: any) { return () => {}; }

      @prototype({ alias: 'x', parent: 'root' })
      export class RestParams {
        static defaults = { name: 'RestParams' };

        async ok(self: any, $: any, pass: any, ...rest: any[]) {
          return rest.length;
        }
      }
    `;

    expect(() => extractPrototypeSpecFromSourceText(source, 'RestParams.ts')).toThrow(/rest parameters/);
  });

  it('throws if multiple exported decorated classes exist', () => {
    const source = `
      function prototype(_opts: any) { return () => {}; }

      @prototype({ alias: 'a', parent: 'root' })
      export class A {
        static defaults = { name: 'A' };
        async ok(self: any, $: any, pass: any) { return 1; }
      }

      @prototype({ alias: 'b', parent: 'root' })
      export class B {
        static defaults = { name: 'B' };
        async ok(self: any, $: any, pass: any) { return 2; }
      }
    `;

    expect(() => extractPrototypeSpecFromSourceText(source, 'Multi.ts')).toThrow(/Multiple/);
  });

  it('throws if decorator arg is not an object literal', () => {
    const source = `
      function prototype(_opts: any) { return () => {}; }

      @prototype('nope')
      export class BadDecorator {
        static defaults = { name: 'BadDecorator' };
        async ok(self: any, $: any, pass: any) { return 1; }
      }
    `;

    expect(() => extractPrototypeSpecFromSourceText(source, 'BadDecorator.ts')).toThrow(/object literal/);
  });

  it('throws if defaults contains shorthand properties', () => {
    const source = `
      function prototype(_opts: any) { return () => {}; }

      @prototype({ alias: 'x', parent: 'root' })
      export class BadDefaults {
        static defaults = { name: 'BadDefaults', nope };
        async ok(self: any, $: any, pass: any) { return 1; }
      }
    `;

    expect(() => extractPrototypeSpecFromSourceText(source, 'BadDefaults.ts')).toThrow(
      /defaults object must contain only property assignments/,
    );
  });

  it('throws if required prefix params are missing', () => {
    const source = `
      function prototype(_opts: any) { return () => {}; }

      @prototype({ alias: 'x', parent: 'root' })
      export class Bad {
        static defaults = { name: 'Bad' };

        async nope(self: any, $: any) {
          return 1;
        }
      }
    `;

    expect(() => extractPrototypeSpecFromSourceText(source, 'Bad.ts')).toThrow(
      /must declare prefix params \(self, \$, pass\)/,
    );
  });

  it('throws if static defaults is not an object literal', () => {
    const source = `
      function prototype(_opts: any) { return () => {}; }

      @prototype({ alias: 'x', parent: 'root' })
      export class BadDefaults {
        static defaults = makeDefaults();

        async ok(self: any, $: any, pass: any) {
          return 1;
        }
      }
    `;

    expect(() => extractPrototypeSpecFromSourceText(source, 'BadDefaults.ts')).toThrow(
      /static defaults must be an object literal/,
    );
  });

  it('extracts the real recycler prototype file', async () => {
    const file = path.resolve('src/ts-prototypes/recycler.ts');
    const source = await readFile(file, 'utf8');

    const spec = extractPrototypeSpecFromSourceText(source, file);

    expect(spec.alias).toBe('recycler');
    expect(spec.parent).toBe('root');
    expect(spec.properties.name).toBe('Recycler');

    expect(Object.keys(spec.methods).sort()).toEqual([
      'canRecycle',
      'create',
      'purge',
      'recycle',
      'recycleTree',
      'unrecycle',
    ]);

    // Sanity-check a couple bindings translated from args[]
    expect(spec.methods.recycle.code).toContain('let objectOrId = args[0];');
    expect(spec.methods.recycle.code).toContain('let caller = args[1];');
    expect(spec.methods.create.code).toContain('let arg0 = args[0];');
  });
});
