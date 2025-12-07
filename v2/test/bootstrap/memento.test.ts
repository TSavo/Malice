import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('$.memento', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_memento');
    await db.connect();

    // Clean database
    await db['objects'].deleteMany({});

    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager);
    await bootstrap.bootstrap();

    $ = manager as any;
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('capture()', () => {
    it('should capture a single object', async () => {
      // Create a test object
      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Test Object',
          value: 42,
        },
      }, null);

      const mementoStr = await $.memento.capture([obj]);

      expect(typeof mementoStr).toBe('string');
      const memento = JSON.parse(mementoStr);
      expect(memento.objects).toBeTruthy();
      expect(memento.objects['%0']).toBeTruthy();
      expect(memento.objects['%0'].properties.name).toBe('Test Object');
      expect(memento.objects['%0'].properties.value).toBe(42);
      expect(memento.root).toBe('%0');
    });

    it('should capture multiple objects with inter-references', async () => {
      // Create parent object
      const parent = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Parent' },
      }, null);

      // Create child that references parent
      const child = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Child' },
      }, null);

      // Set up reference: parent.child = child
      parent.set('child', child);

      const mementoStr = await $.memento.capture([parent, child]);
      const memento = JSON.parse(mementoStr);

      expect(Object.keys(memento.objects)).toHaveLength(2);

      // Parent's child property should be a placeholder
      const parentData = memento.objects['%0'];
      expect(parentData.properties.child).toBe('%1');
    });

    it('should preserve external references as _objref', async () => {
      // Create object that references $.root (external)
      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Test',
          externalRef: $.root,
        },
      }, null);

      const mementoStr = await $.memento.capture([obj]);
      const memento = JSON.parse(mementoStr);

      // External ref should be stored as { _objref: id }
      const objData = memento.objects['%0'];
      expect(objData.properties.externalRef).toEqual({ _objref: $.root.id });
    });

    it('should handle arrays of object references', async () => {
      const obj1 = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Obj1' },
      }, null);

      const obj2 = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Obj2' },
      }, null);

      const container = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Container',
          items: [obj1, obj2],
        },
      }, null);

      const mementoStr = await $.memento.capture([container, obj1, obj2]);
      const memento = JSON.parse(mementoStr);

      const containerData = memento.objects['%0'];
      expect(containerData.properties.items).toEqual(['%1', '%2']);
    });

    it('should handle nested objects with references', async () => {
      const target = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Target' },
      }, null);

      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Test',
          nested: {
            ref: target,
            value: 123,
          },
        },
      }, null);

      const mementoStr = await $.memento.capture([obj, target]);
      const memento = JSON.parse(mementoStr);

      const objData = memento.objects['%0'];
      expect(objData.properties.nested.ref).toBe('%1');
      expect(objData.properties.nested.value).toBe(123);
    });

    it('should preserve plain numbers (not treat as objrefs)', async () => {
      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Test',
          count: 42,
          values: [1, 2, 3],
        },
      }, null);

      const mementoStr = await $.memento.capture([obj]);
      const memento = JSON.parse(mementoStr);

      const objData = memento.objects['%0'];
      expect(objData.properties.count).toBe(42);
      expect(objData.properties.values).toEqual([1, 2, 3]);
    });

    it('should skip internal properties starting with _', async () => {
      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Test',
          _internal: 'secret',
        },
      }, null);

      const mementoStr = await $.memento.capture([obj]);
      const memento = JSON.parse(mementoStr);

      const objData = memento.objects['%0'];
      expect(objData.properties.name).toBe('Test');
      expect(objData.properties._internal).toBeUndefined();
    });

    it('should handle in-graph parent references', async () => {
      const parent = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Parent' },
      }, null);

      const child = await $.recycler.create({
        parent: parent.id,
        properties: { name: 'Child' },
      }, null);

      const mementoStr = await $.memento.capture([parent, child]);
      const memento = JSON.parse(mementoStr);

      // Child's parent should be placeholder since parent is in-graph
      const childData = memento.objects['%1'];
      expect(childData.parent).toBe('%0');
    });

    it('should handle external parent references', async () => {
      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test' },
      }, null);

      const mementoStr = await $.memento.capture([obj]);
      const memento = JSON.parse(mementoStr);

      // Parent is external, should be _objref
      const objData = memento.objects['%0'];
      expect(objData.parent).toEqual({ _objref: $.root.id });
    });
  });

  describe('rehydrate()', () => {
    it('should create new objects from memento', async () => {
      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Original',
          value: 42,
        },
      }, null);

      const memento = await $.memento.capture([obj]);
      const newObjects = await $.memento.rehydrate(memento);

      expect(newObjects['%0']).toBeTruthy();
      expect(newObjects['%0'].id).not.toBe(obj.id); // New ID
      expect(newObjects['%0'].name).toBe('Original');
      expect(newObjects['%0'].value).toBe(42);
    });

    it('should fix up inter-object references', async () => {
      const parent = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Parent' },
      }, null);

      const child = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Child' },
      }, null);

      parent.set('child', child);

      const memento = await $.memento.capture([parent, child]);
      const newObjects = await $.memento.rehydrate(memento);

      const newParent = newObjects['%0'];
      const newChild = newObjects['%1'];

      // New parent's child should reference new child
      expect(newParent.child.id).toBe(newChild.id);
    });

    it('should preserve external references', async () => {
      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Test',
          externalRef: $.root,
        },
      }, null);

      const memento = await $.memento.capture([obj]);
      const newObjects = await $.memento.rehydrate(memento);

      const newObj = newObjects['%0'];
      // External ref should still point to original $.root
      expect(newObj.externalRef.id).toBe($.root.id);
    });

    it('should fix up array references', async () => {
      const obj1 = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Obj1' },
      }, null);

      const obj2 = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Obj2' },
      }, null);

      const container = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Container',
          items: [obj1, obj2],
        },
      }, null);

      const memento = await $.memento.capture([container, obj1, obj2]);
      const newObjects = await $.memento.rehydrate(memento);

      const newContainer = newObjects['%0'];
      const newObj1 = newObjects['%1'];
      const newObj2 = newObjects['%2'];

      expect(newContainer.items).toHaveLength(2);
      expect(newContainer.items[0].id).toBe(newObj1.id);
      expect(newContainer.items[1].id).toBe(newObj2.id);
    });

    it('should fix up nested object references', async () => {
      const target = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Target' },
      }, null);

      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Test',
          nested: {
            ref: target,
            value: 123,
          },
        },
      }, null);

      const memento = await $.memento.capture([obj, target]);
      const newObjects = await $.memento.rehydrate(memento);

      const newObj = newObjects['%0'];
      const newTarget = newObjects['%1'];

      expect(newObj.nested.ref.id).toBe(newTarget.id);
      expect(newObj.nested.value).toBe(123);
    });

    it('should fix up in-graph parent relationships', async () => {
      const parent = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Parent' },
      }, null);

      const child = await $.recycler.create({
        parent: parent.id,
        properties: { name: 'Child' },
      }, null);

      const memento = await $.memento.capture([parent, child]);
      const newObjects = await $.memento.rehydrate(memento);

      const newParent = newObjects['%0'];
      const newChild = newObjects['%1'];

      expect(newChild.getParent()).toBe(newParent.id);
    });

    it('should preserve external parent relationships', async () => {
      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test' },
      }, null);

      const memento = await $.memento.capture([obj]);
      const newObjects = await $.memento.rehydrate(memento);

      const newObj = newObjects['%0'];
      expect(newObj.getParent()).toBe($.root.id);
    });
  });

  describe('clone()', () => {
    it('should capture and rehydrate in one step', async () => {
      const obj = await $.recycler.create({
        parent: $.root.id,
        properties: {
          name: 'Original',
          value: 42,
        },
      }, null);

      const cloned = await $.memento.clone([obj]);

      expect(cloned['%0']).toBeTruthy();
      expect(cloned['%0'].id).not.toBe(obj.id);
      expect(cloned['%0'].name).toBe('Original');
      expect(cloned['%0'].value).toBe(42);
    });

    it('should clone object graph with preserved references', async () => {
      const parent = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Parent' },
      }, null);

      const child = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Child' },
      }, null);

      parent.set('child', child);
      child.set('parent', parent);

      const cloned = await $.memento.clone([parent, child]);

      const newParent = cloned['%0'];
      const newChild = cloned['%1'];

      // Circular references should work
      expect(newParent.child.id).toBe(newChild.id);
      expect(newChild.parent.id).toBe(newParent.id);
    });

    it('should clone a dungeon with rooms, exits, and items', async () => {
      // Build a dungeon template
      const room1 = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Entrance Hall', description: 'A dark entrance.' },
      }, null);

      const room2 = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Treasury', description: 'Glittering gold everywhere.' },
      }, null);

      const exit1 = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'north', dest: room2 },
      }, null);

      const exit2 = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'south', dest: room1 },
      }, null);

      const chest = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Treasure Chest', contents: ['gold', 'gems'] },
      }, null);

      // Wire up the rooms
      room1.set('exits', [exit1]);
      room2.set('exits', [exit2]);
      room2.set('contents', [chest]);

      // Capture the whole graph as a JSON string
      const template = await $.memento.capture([room1, room2, exit1, exit2, chest]);

      // Verify it's a string
      expect(typeof template).toBe('string');

      // Store it (simulating storage on a factory object)
      const dungeonFactory = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'DungeonFactory' },
      }, null);
      dungeonFactory.set('smallDungeonTemplate', template);

      // Retrieve and rehydrate - spawning a new instance
      const storedTemplate = dungeonFactory.smallDungeonTemplate;
      const newDungeon = await $.memento.rehydrate(storedTemplate);

      // Verify all objects were created with new IDs
      const newRoom1 = newDungeon['%0'];
      const newRoom2 = newDungeon['%1'];
      const newExit1 = newDungeon['%2'];
      const newExit2 = newDungeon['%3'];
      const newChest = newDungeon['%4'];

      // All should have different IDs from originals
      expect(newRoom1.id).not.toBe(room1.id);
      expect(newRoom2.id).not.toBe(room2.id);
      expect(newExit1.id).not.toBe(exit1.id);
      expect(newExit2.id).not.toBe(exit2.id);
      expect(newChest.id).not.toBe(chest.id);

      // Properties should match
      expect(newRoom1.name).toBe('Entrance Hall');
      expect(newRoom2.name).toBe('Treasury');
      expect(newExit1.name).toBe('north');
      expect(newExit2.name).toBe('south');
      expect(newChest.name).toBe('Treasure Chest');
      expect(newChest.contents).toEqual(['gold', 'gems']);

      // Exit destinations should point to NEW room IDs
      expect(newExit1.dest.id).toBe(newRoom2.id);
      expect(newExit2.dest.id).toBe(newRoom1.id);

      // Room exits should point to NEW exit objects
      expect(newRoom1.exits).toHaveLength(1);
      expect(newRoom1.exits[0].id).toBe(newExit1.id);
      expect(newRoom2.exits).toHaveLength(1);
      expect(newRoom2.exits[0].id).toBe(newExit2.id);

      // Room contents should point to NEW chest
      expect(newRoom2.contents).toHaveLength(1);
      expect(newRoom2.contents[0].id).toBe(newChest.id);

      // Spawn another instance - should get completely different IDs again
      const anotherDungeon = await $.memento.rehydrate(storedTemplate);
      expect(anotherDungeon['%0'].id).not.toBe(newRoom1.id);
      expect(anotherDungeon['%0'].id).not.toBe(room1.id);
    });
  });
});
