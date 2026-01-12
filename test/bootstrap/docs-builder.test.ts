import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('$docs - Documentation System', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;
  let $docs: any;
  let $doc: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_docs');
    await db.connect();
    await db.objects.deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager, {
      _testMode: true,
    });
    await bootstrap.bootstrap();
    $ = manager as any;
    $docs = await $.docs;
    $doc = await $.doc;
  }, 180000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('Initialization', () => {
    it('should create $doc prototype', async () => {
      expect($doc).toBeDefined();
      expect($doc.name).toBe('Document');
      expect($doc.description).toContain('documentation');
    });

    it('should create $docs manager', async () => {
      expect($docs).toBeDefined();
      expect($docs.name).toBe('Documentation Manager');
      expect($docs.description).toContain('docs/');
    });

    it('should have registry property', () => {
      const registry = $docs.registry;
      expect(registry).toBeDefined();
      expect(typeof registry).toBe('object');
    });

    it('should have folders property', () => {
      const folders = $docs.folders;
      expect(folders).toBeDefined();
      expect(Array.isArray(folders)).toBe(true);
    });

    it('should have loadedAt timestamp', () => {
      const loadedAt = $docs.loadedAt;
      expect(loadedAt).toBeDefined();
      expect(typeof loadedAt).toBe('string');
    });
  });

  describe('list()', () => {
    it('should list all documents', async () => {
      const docs = await $docs.list();

      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);

      // Each doc should have required properties
      for (const doc of docs) {
        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('name');
        expect(doc).toHaveProperty('path');
        expect(doc).toHaveProperty('title');
        expect(doc).toHaveProperty('category');
      }
    });

    it('should filter by folder', async () => {
      const mooDocs = await $docs.list('moo');

      expect(Array.isArray(mooDocs)).toBe(true);

      // All results should be in moo/ folder
      for (const doc of mooDocs) {
        expect(doc.path).toMatch(/^moo\//);
      }
    });

    it('should handle nested folder paths', async () => {
      const protoDocs = await $docs.list('moo/prototypes');

      expect(Array.isArray(protoDocs)).toBe(true);

      // All results should be in moo/prototypes/
      for (const doc of protoDocs) {
        expect(doc.path).toMatch(/^moo\/prototypes\//);
      }
    });

    it('should return empty array for non-existent folder', async () => {
      const docs = await $docs.list('nonexistent');

      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBe(0);
    });

    it('should sort results by path', async () => {
      const docs = await $docs.list();

      if (docs.length > 1) {
        for (let i = 1; i < docs.length; i++) {
          expect(
            docs[i - 1].path.localeCompare(docs[i].path),
          ).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe('get()', () => {
    it('should get document by name', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) {
        console.log('No docs loaded, skipping test');
        return;
      }

      const firstDoc = allDocs[0];
      const doc = await $docs.get(firstDoc.name);

      expect(doc).toBeDefined();
      expect(doc.id).toBe(firstDoc.id);
      expect(doc.name).toBe(firstDoc.name);
    });

    it('should be case-insensitive', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) {
        console.log('No docs loaded, skipping test');
        return;
      }

      const firstDoc = allDocs[0];
      const doc = await $docs.get(firstDoc.name.toUpperCase());

      expect(doc).toBeDefined();
      expect(doc.name).toBe(firstDoc.name);
    });

    it('should return null for non-existent document', async () => {
      const doc = await $docs.get('nonexistent-doc-12345');

      expect(doc).toBeNull();
    });

    it('should return null when no name provided', async () => {
      const doc = await $docs.get();

      expect(doc).toBeNull();
    });
  });

  describe('getByPath()', () => {
    it('should get document by exact path', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) {
        console.log('No docs loaded, skipping test');
        return;
      }

      const firstDoc = allDocs[0];
      const doc = await $docs.getByPath(firstDoc.path);

      expect(doc).toBeDefined();
      expect(doc.id).toBe(firstDoc.id);
      expect(doc.path).toBe(firstDoc.path);
    });

    it('should return null for non-existent path', async () => {
      const doc = await $docs.getByPath('nonexistent/path/to/doc');

      expect(doc).toBeNull();
    });

    it('should return null when no path provided', async () => {
      const doc = await $docs.getByPath();

      expect(doc).toBeNull();
    });
  });

  describe('search()', () => {
    it('should search content', async () => {
      const results = await $docs.search('MOO');

      expect(Array.isArray(results)).toBe(true);

      // Each result should have required properties
      for (const result of results) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('path');
        expect(result).toHaveProperty('matchType');
      }
    });

    it('should return empty array when no query provided', async () => {
      const results = await $docs.search();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should filter by category', async () => {
      const results = await $docs.search('object', { category: 'moo' });

      expect(Array.isArray(results)).toBe(true);

      // All results should be in moo category
      for (const result of results) {
        expect(result.category).toBe('moo');
      }
    });

    it('should respect limit option', async () => {
      const results = await $docs.search('the', { limit: 5 });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should provide context for content matches', async () => {
      const results = await $docs.search('bootstrap');

      const contentMatches = results.filter((r) => r.matchType === 'content');

      for (const match of contentMatches) {
        expect(match.context).toBeDefined();
        expect(typeof match.context).toBe('string');
      }
    });

    it('should match in title', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) {
        console.log('No docs loaded, skipping test');
        return;
      }

      // Find a doc with a title
      const docWithTitle = allDocs.find((d) => d.title && d.title.length > 3);
      if (!docWithTitle) {
        console.log('No docs with titles found, skipping test');
        return;
      }

      const searchTerm = docWithTitle.title.substring(0, 5);
      const results = await $docs.search(searchTerm);

      expect(results.length).toBeGreaterThan(0);
      const hasMatch = results.some(
        (r) => r.matchType === 'title' && r.id === docWithTitle.id,
      );
      expect(hasMatch).toBe(true);
    });
  });

  describe('getCategories()', () => {
    it('should return array of categories', async () => {
      const categories = await $docs.getCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);

      // Should contain expected categories from reorganization
      const expectedCategories = [
        'city-ai',
        'greeter',
        'guides',
        'internal',
        'lore',
        'moo',
        'prompts',
        'reference',
      ];
      for (const expected of expectedCategories) {
        expect(categories).toContain(expected);
      }
    });
  });

  describe('tree()', () => {
    it('should return folder structure', async () => {
      const tree = await $docs.tree();

      expect(tree).toBeDefined();
      expect(typeof tree).toBe('object');
    });

    it('should filter by root folder', async () => {
      const mooTree = await $docs.tree('moo');

      expect(mooTree).toBeDefined();
      expect(typeof mooTree).toBe('object');
    });

    it('should include _docs arrays', async () => {
      const tree = await $docs.tree();

      // At least one folder should have _docs
      let hasDocsArray = false;
      const checkTree = (obj: any) => {
        if (obj._docs && Array.isArray(obj._docs)) {
          hasDocsArray = true;
        }
        for (const key in obj) {
          if (key !== '_docs' && typeof obj[key] === 'object') {
            checkTree(obj[key]);
          }
        }
      };
      checkTree(tree);

      expect(hasDocsArray).toBe(true);
    });
  });

  describe('count()', () => {
    it('should return total document count', async () => {
      const count = await $docs.count();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should match list length', async () => {
      const count = await $docs.count();
      const allDocs = await $docs.list();

      expect(count).toBe(allDocs.length);
    });
  });

  describe('random()', () => {
    it('should return a random document', async () => {
      const doc = await $docs.random();

      if (doc) {
        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('name');
        expect(doc).toHaveProperty('path');
      }
    });

    it('should return null when no documents exist', async () => {
      // Save original registry
      const originalRegistry = $docs.registry;

      // Temporarily clear registry
      $docs.registry = {};

      const doc = await $docs.random();

      expect(doc).toBeNull();

      // Restore registry
      $docs.registry = originalRegistry;
    });
  });

  describe('format()', () => {
    it('should format all documents', async () => {
      const output = await $docs.format();

      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
      expect(output).toContain('document');
    });

    it('should format folder documents', async () => {
      const output = await $docs.format('moo');

      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
      expect(output).toContain('moo');
    });

    it('should handle empty folder', async () => {
      const output = await $docs.format('nonexistent');

      expect(typeof output).toBe('string');
      expect(output).toContain('No documents');
    });
  });

  describe('Document Methods', () => {
    it('should have format method', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) {
        console.log('No docs loaded, skipping test');
        return;
      }

      const doc = await $.load(allDocs[0].id);
      const output = await doc.format();

      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
    });

    it('should have preview method', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) {
        console.log('No docs loaded, skipping test');
        return;
      }

      const doc = await $.load(allDocs[0].id);
      const preview = await doc.preview();

      expect(preview).toBeDefined();
      expect(preview).toHaveProperty('name');
      expect(preview).toHaveProperty('path');
      expect(preview).toHaveProperty('title');
      expect(preview).toHaveProperty('preview');
    });

    it('format should show full content by default', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) {
        console.log('No docs loaded, skipping test');
        return;
      }

      const doc = await $.load(allDocs[0].id);
      const fullOutput = await doc.format();
      const content = doc.content || '';

      if (content.length > 0) {
        expect(fullOutput).toContain(content.substring(0, 100));
      }
    });

    it('format should truncate when showFull is false', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) {
        console.log('No docs loaded, skipping test');
        return;
      }

      const doc = await $.load(allDocs[0].id);
      const shortOutput = await doc.format(false);

      expect(typeof shortOutput).toBe('string');
      expect(shortOutput.length).toBeGreaterThan(0);
    });
  });

  describe('Document Properties', () => {
    it('should have required properties', async () => {
      const allDocs = await $docs.list();
      if (allDocs.length === 0) {
        console.log('No docs loaded, skipping test');
        return;
      }

      const doc = await $.load(allDocs[0].id);

      expect(doc.name).toBeDefined();
      expect(doc.path).toBeDefined();
      expect(doc.category).toBeDefined();
      expect(doc.content).toBeDefined();
      expect(doc.filename).toBeDefined();
    });

    it('should have property descriptions', async () => {
      expect($doc.getPropertyDescription('path')).toBeTruthy();
      expect($doc.getPropertyDescription('category')).toBeTruthy();
      expect($doc.getPropertyDescription('content')).toBeTruthy();
      expect($doc.getPropertyDescription('title')).toBeTruthy();
      expect($doc.getPropertyDescription('filename')).toBeTruthy();
    });
  });

  describe('reload()', () => {
    it('should return placeholder response', async () => {
      const result = await $docs.reload();

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Reload requires');
      expect(result.loadedAt).toBe($docs.loadedAt);
    });
  });
});
