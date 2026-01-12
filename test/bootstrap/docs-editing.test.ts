import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('$docs - Editing API', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;
  let $docs: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_docs_editing');
    await db.connect();
    await db.objects.deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager, {
      _testMode: true,
    });
    await bootstrap.bootstrap();
    $ = manager as any;
    $docs = await $.docs;
  }, 180000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('set()', () => {
    it('should update existing document content', async () => {
      // Get an existing document
      const allDocs = await $docs.list();
      if (allDocs.length === 0) {
        console.log('No docs loaded, skipping test');
        return;
      }

      const firstDoc = allDocs[0];
      const newContent = '# Updated Title\n\nThis is updated content.';

      const result = await $docs.set(firstDoc.path, newContent);

      expect(result.success).toBe(true);
      expect(result.path).toBe(firstDoc.path);
      expect(result.title).toBe('Updated Title');
      expect(result.contentLength).toBe(newContent.length);

      // Verify the update persisted
      const updatedDoc = await $docs.getByPath(firstDoc.path);
      expect(updatedDoc.content).toBe(newContent);
      expect(updatedDoc.title).toBe('Updated Title');
      expect(updatedDoc.source).toBe('in-game');
      expect(updatedDoc.editedAt).toBeDefined();
    });

    it('should return error for non-existent document', async () => {
      const result = await $docs.set('nonexistent/path', 'content');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error when path is missing', async () => {
      const result = await $docs.set();

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should return error when content is not a string', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) return;

      const result = await $docs.set(allDocs[0].path, 123);

      expect(result.success).toBe(false);
      expect(result.error).toContain('string');
    });

    it('should extract title from new content', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) return;

      const newContent = '# New Title\n\nContent here.';
      await $docs.set(allDocs[0].path, newContent);

      const doc = await $docs.getByPath(allDocs[0].path);
      expect(doc.title).toBe('New Title');
    });
  });

  describe('create()', () => {
    it('should create new document', async () => {
      const testPath = 'test/create-test-doc';
      const content = '# Test Document\n\nThis is a test document.';

      const result = await $docs.create(testPath, content);

      expect(result.success).toBe(true);
      expect(result.path).toBe(testPath);
      expect(result.title).toBe('Test Document');
      expect(result.id).toBeDefined();

      // Verify the document exists
      const doc = await $docs.getByPath(testPath);
      expect(doc).toBeDefined();
      expect(doc.content).toBe(content);
      expect(doc.source).toBe('in-game');
      expect(doc.createdAt).toBeDefined();
    });

    it('should create document with explicit title', async () => {
      const testPath = 'test/explicit-title-doc';
      const content = 'Some content without heading';

      const result = await $docs.create(testPath, content, {
        title: 'Explicit Title',
      });

      expect(result.success).toBe(true);
      expect(result.title).toBe('Explicit Title');

      const doc = await $docs.getByPath(testPath);
      expect(doc.title).toBe('Explicit Title');
    });

    it('should extract title from content if not provided', async () => {
      const testPath = 'test/extracted-title-doc';
      const content = '# Extracted Title\n\nContent here.';

      await $docs.create(testPath, content);

      const doc = await $docs.getByPath(testPath);
      expect(doc.title).toBe('Extracted Title');
    });

    it('should use name as title if no heading', async () => {
      const testPath = 'test/no-heading-doc';
      const content = 'Content without heading';

      await $docs.create(testPath, content);

      const doc = await $docs.getByPath(testPath);
      expect(doc.title).toBe('no-heading-doc');
    });

    it('should return error when path is missing', async () => {
      const result = await $docs.create();

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should return error when content is not a string', async () => {
      const result = await $docs.create('test/invalid', 123);

      expect(result.success).toBe(false);
      expect(result.error).toContain('string');
    });

    it('should return error when document already exists', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) return;

      const result = await $docs.create(
        allDocs[0].path,
        'Content',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should update folders list with new category', async () => {
      const newCategoryPath = 'newcategory/test-doc';
      const content = '# New Category Test\n\nContent.';

      await $docs.create(newCategoryPath, content);

      const categories = await $docs.getCategories();
      expect(categories).toContain('newcategory');
    });

    it('should update registry', async () => {
      const testPath = 'test/registry-test';
      const content = '# Registry Test\n\nContent.';

      const result = await $docs.create(testPath, content);

      const registry = $docs.registry;
      expect(registry[testPath]).toBe(result.id);
    });
  });

  describe('delete()', () => {
    it('should delete existing document', async () => {
      // Create a doc to delete
      const testPath = 'test/delete-test-doc';
      await $docs.create(testPath, '# Delete Test\n\nContent.');

      // Verify it exists
      let doc = await $docs.getByPath(testPath);
      expect(doc).toBeDefined();

      // Delete it
      const result = await $docs.delete(testPath);

      expect(result.success).toBe(true);
      expect(result.path).toBe(testPath);
      expect(result.deletedId).toBeDefined();

      // Verify it's gone
      doc = await $docs.getByPath(testPath);
      expect(doc).toBeNull();
    });

    it('should remove from registry', async () => {
      const testPath = 'test/registry-delete-test';
      await $docs.create(testPath, '# Test\n\nContent.');

      const registry = $docs.registry;
      expect(registry[testPath]).toBeDefined();

      await $docs.delete(testPath);

      expect(registry[testPath]).toBeUndefined();
    });

    it('should return error for non-existent document', async () => {
      const result = await $docs.delete('nonexistent/path');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error when path is missing', async () => {
      const result = await $docs.delete();

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('rename()', () => {
    it('should rename existing document', async () => {
      // Create a doc to rename
      const oldPath = 'test/rename-old';
      const newPath = 'test/rename-new';
      const content = '# Rename Test\n\nContent.';
      await $docs.create(oldPath, content);

      // Rename it
      const result = await $docs.rename(oldPath, newPath);

      expect(result.success).toBe(true);
      expect(result.oldPath).toBe(oldPath);
      expect(result.newPath).toBe(newPath);
      expect(result.id).toBeDefined();

      // Verify old path is gone
      const oldDoc = await $docs.getByPath(oldPath);
      expect(oldDoc).toBeNull();

      // Verify new path exists
      const newDoc = await $docs.getByPath(newPath);
      expect(newDoc).toBeDefined();
      expect(newDoc.content).toBe(content);
      expect(newDoc.path).toBe(newPath);
    });

    it('should update document properties', async () => {
      const oldPath = 'test/old-name';
      const newPath = 'newcat/new-name';
      await $docs.create(oldPath, '# Test\n\nContent.');

      await $docs.rename(oldPath, newPath);

      const doc = await $docs.getByPath(newPath);
      expect(doc.name).toBe('new-name');
      expect(doc.path).toBe(newPath);
      expect(doc.category).toBe('newcat');
      expect(doc.filename).toBe('new-name.md');
      expect(doc.editedAt).toBeDefined();
    });

    it('should update registry', async () => {
      const oldPath = 'test/registry-rename-old';
      const newPath = 'test/registry-rename-new';
      const result = await $docs.create(oldPath, '# Test\n\nContent.');
      const docId = result.id;

      await $docs.rename(oldPath, newPath);

      const registry = $docs.registry;
      expect(registry[oldPath]).toBeUndefined();
      expect(registry[newPath]).toBe(docId);
    });

    it('should update folders list with new category', async () => {
      const oldPath = 'test/move-doc';
      const newPath = 'anothernewcat/move-doc';
      await $docs.create(oldPath, '# Test\n\nContent.');

      await $docs.rename(oldPath, newPath);

      const categories = await $docs.getCategories();
      expect(categories).toContain('anothernewcat');
    });

    it('should return error when oldPath is missing', async () => {
      const result = await $docs.rename();

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should return error when newPath is missing', async () => {
      const result = await $docs.rename('test/old');

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should return error when oldPath does not exist', async () => {
      const result = await $docs.rename('nonexistent/old', 'test/new');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error when newPath already exists', async () => {
      const path1 = 'test/rename-conflict-1';
      const path2 = 'test/rename-conflict-2';
      await $docs.create(path1, '# Test 1\n\nContent.');
      await $docs.create(path2, '# Test 2\n\nContent.');

      const result = await $docs.rename(path1, path2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('stats()', () => {
    it('should return statistics object', async () => {
      const stats = await $docs.stats();

      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    it('should include total count', async () => {
      const stats = await $docs.stats();

      expect(stats.total).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(stats.total).toBeGreaterThan(0);
    });

    it('should include categories count', async () => {
      const stats = await $docs.stats();

      expect(stats.categories).toBeDefined();
      expect(typeof stats.categories).toBe('number');
      expect(stats.categories).toBeGreaterThan(0);
    });

    it('should include byCategory breakdown', async () => {
      const stats = await $docs.stats();

      expect(stats.byCategory).toBeDefined();
      expect(typeof stats.byCategory).toBe('object');

      // Should have counts for each category
      for (const [category, count] of Object.entries(stats.byCategory)) {
        expect(typeof category).toBe('string');
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      }
    });

    it('should include content length statistics', async () => {
      const stats = await $docs.stats();

      expect(stats.totalContentLength).toBeDefined();
      expect(typeof stats.totalContentLength).toBe('number');
      expect(stats.averageLength).toBeDefined();
      expect(typeof stats.averageLength).toBe('number');
    });

    it('should include source counts', async () => {
      const stats = await $docs.stats();

      expect(stats.inGameCreated).toBeDefined();
      expect(typeof stats.inGameCreated).toBe('number');
      expect(stats.importedFromDisk).toBeDefined();
      expect(typeof stats.importedFromDisk).toBe('number');
    });

    it('should include loadedAt timestamp', async () => {
      const stats = await $docs.stats();

      expect(stats.loadedAt).toBeDefined();
      expect(typeof stats.loadedAt).toBe('string');
    });

    it('should accurately count in-game created docs', async () => {
      // Create a new doc in-game
      const testPath = 'test/stats-in-game';
      await $docs.create(testPath, '# Stats Test\n\nContent.');

      const stats = await $docs.stats();

      expect(stats.inGameCreated).toBeGreaterThan(0);
    });

    it('should calculate average length correctly', async () => {
      const stats = await $docs.stats();

      if (stats.total > 0) {
        const expectedAvg = Math.round(stats.totalContentLength / stats.total);
        expect(stats.averageLength).toBe(expectedAvg);
      }
    });
  });

  describe('syncFromDisk()', () => {
    it('should return placeholder response', async () => {
      const result = await $docs.syncFromDisk('some/path');

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Disk access');
    });
  });

  describe('Document Source Tracking', () => {
    it('should mark disk-imported docs as "disk"', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) return;

      // Find a doc that hasn't been edited
      const diskDoc = allDocs.find((d: any) => d.source === 'disk');
      if (diskDoc) {
        const doc = await $.load(diskDoc.id);
        expect(doc.source).toBe('disk');
        expect(doc.importedAt).toBeDefined();
      }
    });

    it('should mark in-game created docs as "in-game"', async () => {
      const testPath = 'test/source-tracking-create';
      await $docs.create(testPath, '# Source Test\n\nContent.');

      const doc = await $docs.getByPath(testPath);
      expect(doc.source).toBe('in-game');
      expect(doc.createdAt).toBeDefined();
    });

    it('should mark edited docs as "in-game"', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) return;

      const docToEdit = allDocs[0];
      await $docs.set(docToEdit.path, '# Edited\n\nNew content.');

      const doc = await $docs.getByPath(docToEdit.path);
      expect(doc.source).toBe('in-game');
      expect(doc.editedAt).toBeDefined();
    });
  });

  describe('Property Descriptions', () => {
    it('should have description for source property', async () => {
      const $doc = await $.doc;
      const desc = $doc.getPropertyDescription('source');

      expect(desc).toBeDefined();
      expect(desc).toContain('disk');
      expect(desc).toContain('in-game');
    });

    it('should have description for importedAt property', async () => {
      const $doc = await $.doc;
      const desc = $doc.getPropertyDescription('importedAt');

      expect(desc).toBeDefined();
      expect(desc).toContain('imported');
    });

    it('should have description for createdAt property', async () => {
      const $doc = await $.doc;
      const desc = $doc.getPropertyDescription('createdAt');

      expect(desc).toBeDefined();
      expect(desc).toContain('created');
    });

    it('should have description for editedAt property', async () => {
      const $doc = await $.doc;
      const desc = $doc.getPropertyDescription('editedAt');

      expect(desc).toBeDefined();
      expect(desc).toContain('edited');
    });
  });
});
