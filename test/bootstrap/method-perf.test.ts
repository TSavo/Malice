import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('Method Call Performance', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_perf');
    await db.connect();
    await db['objects'].deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager);
    await bootstrap.bootstrap();
    $ = manager as any;
  }, 30000);

  afterAll(async () => {
    await db.disconnect();
  });

  it('should measure direct method call (self.b)', async () => {
    const testObj = await $.recycler.create({
      parent: $.root.id,
      properties: { name: 'Perf Test Object' },
    }, null);

    // Method b just returns true
    testObj.setMethod('b', `return true;`);

    // Method a calls b 1 million times
    testObj.setMethod('a', `
      const iterations = 1000000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await self.b();
      }

      const endTime = Date.now();
      const elapsed = endTime - startTime;
      const callsPerSecond = Math.round(iterations / (elapsed / 1000));

      return {
        iterations,
        elapsedMs: elapsed,
        callsPerSecond,
        avgMicrosPerCall: Math.round((elapsed / iterations) * 1000)
      };
    `);

    console.log('\n=== Direct method call (self.b) ===');
    console.log('Starting 1 million method calls...');

    const result = await testObj.a();

    console.log('Results:');
    console.log(`  Iterations: ${result.iterations.toLocaleString()}`);
    console.log(`  Elapsed: ${result.elapsedMs.toLocaleString()}ms`);
    console.log(`  Calls/second: ${result.callsPerSecond.toLocaleString()}`);
    console.log(`  Avg per call: ${result.avgMicrosPerCall}μs`);

    // Just verify it completed
    expect(result.iterations).toBe(1000000);
    expect(result.callsPerSecond).toBeGreaterThan(0);
  }, 300000);

  it('should measure property lookup + method call (self.target.method)', async () => {
    // Create two objects: A holds reference to B, A calls B.method()
    const objA = await $.recycler.create({
      parent: $.root.id,
      properties: { name: 'Object A' },
    }, null);

    const objB = await $.recycler.create({
      parent: $.root.id,
      properties: { name: 'Object B' },
    }, null);

    // A.target = B
    objA.set('target', objB);

    // B has the method
    objB.setMethod('method', `return true;`);

    // A calls target.method 1 million times
    objA.setMethod('runTest', `
      const iterations = 1000000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await self.target.method();
      }

      const endTime = Date.now();
      const elapsed = endTime - startTime;
      const callsPerSecond = Math.round(iterations / (elapsed / 1000));

      return {
        iterations,
        elapsedMs: elapsed,
        callsPerSecond,
        avgMicrosPerCall: Math.round((elapsed / iterations) * 1000)
      };
    `);

    console.log('\n=== Property lookup + method call (self.target.method) ===');
    console.log('Starting 1 million property lookups + method calls...');

    const result = await objA.runTest();

    console.log('Results:');
    console.log(`  Iterations: ${result.iterations.toLocaleString()}`);
    console.log(`  Elapsed: ${result.elapsedMs.toLocaleString()}ms`);
    console.log(`  Calls/second: ${result.callsPerSecond.toLocaleString()}`);
    console.log(`  Avg per call: ${result.avgMicrosPerCall}μs`);

    expect(result.iterations).toBe(1000000);
    expect(result.callsPerSecond).toBeGreaterThan(0);
  }, 300000);

  it('should measure chained property lookup + method call (self.a.b.method)', async () => {
    // Create three objects: A -> middle -> target
    const objA = await $.recycler.create({
      parent: $.root.id,
      properties: { name: 'Object A' },
    }, null);

    const middle = await $.recycler.create({
      parent: $.root.id,
      properties: { name: 'Middle Object' },
    }, null);

    const target = await $.recycler.create({
      parent: $.root.id,
      properties: { name: 'Target Object' },
    }, null);

    // A.middle = middle, middle.target = target
    objA.set('middle', middle);
    middle.set('target', target);

    // Target has the method
    target.setMethod('method', `return true;`);

    // A calls middle.target.method 1 million times
    objA.setMethod('runTest', `
      const iterations = 1000000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await self.middle.target.method();
      }

      const endTime = Date.now();
      const elapsed = endTime - startTime;
      const callsPerSecond = Math.round(iterations / (elapsed / 1000));

      return {
        iterations,
        elapsedMs: elapsed,
        callsPerSecond,
        avgMicrosPerCall: Math.round((elapsed / iterations) * 1000)
      };
    `);

    console.log('\n=== Chained property lookup + method call (self.middle.target.method) ===');
    console.log('Starting 1 million chained lookups + method calls...');

    const result = await objA.runTest();

    console.log('Results:');
    console.log(`  Iterations: ${result.iterations.toLocaleString()}`);
    console.log(`  Elapsed: ${result.elapsedMs.toLocaleString()}ms`);
    console.log(`  Calls/second: ${result.callsPerSecond.toLocaleString()}`);
    console.log(`  Avg per call: ${result.avgMicrosPerCall}μs`);

    expect(result.iterations).toBe(1000000);
    expect(result.callsPerSecond).toBeGreaterThan(0);
  }, 300000);
});
