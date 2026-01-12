import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds the Documentation System ($docs, $doc)
 *
 * Loads all markdown documentation from docs/ into MOO objects at startup.
 * Provides folder-based navigation and search capabilities.
 *
 * Architecture:
 *   $doc - Prototype for individual document objects
 *   $docs - Singleton manager with navigation and search methods
 *
 * Each document becomes a MOO object with:
 *   - name: Filename without extension (e.g., "BUILDERS-GUIDE")
 *   - path: Full path from docs root (e.g., "moo/prototypes/agents")
 *   - category: Top-level folder (e.g., "moo", "city-ai", "greeter")
 *   - content: Full markdown content
 *   - title: Extracted from first # heading if present
 *
 * Usage:
 *   await $docs.list()                    // List all docs
 *   await $docs.list('moo')               // List docs in moo/ folder
 *   await $docs.list('moo/prototypes')    // List docs in moo/prototypes/
 *   await $docs.get('BUILDERS-GUIDE')     // Get specific doc by name
 *   await $docs.getByPath('moo/best-practices')  // Get by path
 *   await $docs.search('bootstrap')       // Search content
 *   await $docs.folders()                 // List top-level folders
 *   await $docs.tree()                    // Get full folder structure
 */
export class DocsBuilder implements Builder {
  static provides = ['doc', 'docs'];
  static depends: string[] = [];

  private doc: RuntimeObject | null = null;
  private docs: RuntimeObject | null = null;
  private docObjects: RuntimeObject[] = [];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};
    const root = await this.manager.load('root');

    // Build $doc prototype
    await this.buildDocPrototype(root!, aliases);

    // Build $docs manager
    await this.buildDocsManager(root!, aliases);

    // Load documents from disk
    await this.loadDocuments();
  }

  private async buildDocPrototype(
    root: RuntimeObject,
    aliases: Record<string, number>,
  ): Promise<void> {
    if (aliases.doc) {
      this.doc = await this.manager.load(aliases.doc);
      if (this.doc) return;
    }

    this.doc = await this.manager.create({
      parent: root,
      properties: {
        name: 'Document',
        description: 'A documentation file loaded from disk',
        // These are set per-instance:
        // path: '',        // e.g., "moo/prototypes/agents"
        // category: '',    // e.g., "moo"
        // content: '',     // Full markdown
        // title: '',       // Extracted title
        // filename: '',    // Original filename
      },
      methods: {},
    });

    this.doc.setPropertyDescription(
      'path',
      'Path from docs root without extension',
    );
    this.doc.setPropertyDescription(
      'category',
      'Top-level folder (moo, city-ai, greeter, etc.)',
    );
    this.doc.setPropertyDescription('content', 'Full markdown content');
    this.doc.setPropertyDescription(
      'title',
      'Document title from first # heading',
    );
    this.doc.setPropertyDescription(
      'filename',
      'Original filename with extension',
    );
    this.doc.setPropertyDescription(
      'source',
      'Where doc came from: "disk" (imported) or "in-game" (created/edited)',
    );
    this.doc.setPropertyDescription(
      'importedAt',
      'ISO timestamp when doc was first imported from disk',
    );
    this.doc.setPropertyDescription(
      'createdAt',
      'ISO timestamp when doc was created in-game',
    );
    this.doc.setPropertyDescription(
      'editedAt',
      'ISO timestamp of last in-game edit',
    );

    // format() - Return formatted content for display
    this.doc.setMethod(
      'format',
      `
      const showFull = args[0] !== false;
      let output = '# ' + (self.title || self.name) + '\\n';
      output += 'Path: ' + self.path + '\\n';
      output += 'Category: ' + self.category + '\\n\\n';

      if (showFull) {
        output += self.content || '';
      } else {
        // Preview: first 500 chars
        const content = self.content || '';
        output += content.substring(0, 500);
        if (content.length > 500) output += '...';
      }

      return output;
    `,
    );

    // preview() - Short preview
    this.doc.setMethod(
      'preview',
      `
      const lines = (self.content || '').split('\\n').slice(0, 5).join('\\n');
      return {
        name: self.name,
        path: self.path,
        title: self.title,
        preview: lines.substring(0, 200),
      };
    `,
    );
  }

  private async buildDocsManager(
    root: RuntimeObject,
    aliases: Record<string, number>,
  ): Promise<void> {
    if (aliases.docs) {
      this.docs = await this.manager.load(aliases.docs);
    }

    if (!this.docs) {
      this.docs = await this.manager.create({
        parent: root,
        properties: {
          name: 'Documentation Manager',
          description: 'Manages all documentation loaded from docs/ folder',
          // Registry of doc IDs by path
          registry: {},
          // Folder structure cache
          folders: [],
          // Last load timestamp
          loadedAt: null,
        },
        methods: {},
      });
    }

    this.docs.setPropertyDescription(
      'registry',
      'Map of path -> document object ID',
    );
    this.docs.setPropertyDescription(
      'folders',
      'Array of top-level folder names',
    );
    this.docs.setPropertyDescription(
      'loadedAt',
      'Timestamp of last document load',
    );

    // Always rebuild methods
    this.buildDocsMethods();
  }

  private buildDocsMethods(): void {
    if (!this.docs) return;

    // list(folder?) - List docs, optionally filtered by folder
    this.docs.setMethod(
      'list',
      `
      const folder = args[0] || '';
      const registry = self.registry || {};
      const results = [];

      for (const [docPath, docId] of Object.entries(registry)) {
        if (!folder || docPath.startsWith(folder + '/') || docPath === folder) {
          const doc = await $load(docId);
          if (doc) {
            results.push({
              id: doc.id,
              name: doc.name,
              path: doc.path,
              title: doc.title,
              category: doc.category,
            });
          }
        }
      }

      // Sort by path
      results.sort((a, b) => a.path.localeCompare(b.path));
      return results;
    `,
    );

    // get(name) - Get doc by name (filename without extension)
    this.docs.setMethod(
      'get',
      `
      const name = args[0];
      if (!name) return null;

      const registry = self.registry || {};
      const nameLower = name.toLowerCase();

      for (const [docPath, docId] of Object.entries(registry)) {
        const parts = docPath.split('/');
        const docName = parts[parts.length - 1];
        if (docName.toLowerCase() === nameLower) {
          return await $load(docId);
        }
      }

      return null;
    `,
    );

    // getByPath(path) - Get doc by exact path
    this.docs.setMethod(
      'getByPath',
      `
      const docPath = args[0];
      if (!docPath) return null;

      const registry = self.registry || {};
      const docId = registry[docPath];

      if (docId) {
        return await $load(docId);
      }

      return null;
    `,
    );

    // search(query, options?) - Search doc content
    this.docs.setMethod(
      'search',
      `
      const query = args[0];
      const options = args[1] || {};
      const limit = options.limit || 20;
      const category = options.category;

      if (!query) return [];

      const registry = self.registry || {};
      const queryLower = query.toLowerCase();
      const results = [];

      for (const [docPath, docId] of Object.entries(registry)) {
        const doc = await $load(docId);
        if (!doc) continue;

        // Filter by category if specified
        if (category && doc.category !== category) continue;

        const content = (doc.content || '').toLowerCase();
        const title = (doc.title || '').toLowerCase();
        const name = (doc.name || '').toLowerCase();

        // Check if query matches
        const contentMatch = content.includes(queryLower);
        const titleMatch = title.includes(queryLower);
        const nameMatch = name.includes(queryLower);

        if (contentMatch || titleMatch || nameMatch) {
          // Find context around match in content
          let context = '';
          if (contentMatch) {
            const idx = content.indexOf(queryLower);
            const start = Math.max(0, idx - 50);
            const end = Math.min(content.length, idx + query.length + 50);
            context = '...' + doc.content.substring(start, end) + '...';
          }

          results.push({
            id: doc.id,
            name: doc.name,
            path: doc.path,
            title: doc.title,
            category: doc.category,
            matchType: titleMatch ? 'title' : nameMatch ? 'name' : 'content',
            context: context,
          });

          if (results.length >= limit) break;
        }
      }

      return results;
    `,
    );

    // getCategories() - List top-level folders/categories
    this.docs.setMethod(
      'getCategories',
      `
      return self.folders || [];
    `,
    );

    // tree(folder?) - Get folder structure
    this.docs.setMethod(
      'tree',
      `
      const rootFolder = args[0] || '';
      const registry = self.registry || {};
      const tree = {};

      for (const docPath of Object.keys(registry)) {
        if (rootFolder && !docPath.startsWith(rootFolder + '/') && docPath !== rootFolder) {
          continue;
        }

        const relativePath = rootFolder ? docPath.substring(rootFolder.length + 1) : docPath;
        const parts = relativePath.split('/');
        let current = tree;

        for (let i = 0; i < parts.length - 1; i++) {
          const folder = parts[i];
          if (!current[folder]) {
            current[folder] = { _docs: [] };
          }
          current = current[folder];
        }

        // Add document to current folder
        if (!current._docs) current._docs = [];
        current._docs.push(parts[parts.length - 1]);
      }

      return tree;
    `,
    );

    // count() - Total document count
    this.docs.setMethod(
      'count',
      `
      const registry = self.registry || {};
      return Object.keys(registry).length;
    `,
    );

    // random() - Get a random document
    this.docs.setMethod(
      'random',
      `
      const registry = self.registry || {};
      const paths = Object.keys(registry);
      if (paths.length === 0) return null;

      const randomPath = paths[Math.floor(Math.random() * paths.length)];
      return await $load(registry[randomPath]);
    `,
    );

    // format() - Format docs listing for display
    this.docs.setMethod(
      'format',
      `
      const folder = args[0] || '';
      const docs = await self.list(folder);

      if (docs.length === 0) {
        return folder ? 'No documents in folder: ' + folder : 'No documents loaded.';
      }

      let output = folder ? 'Documents in ' + folder + ':\\n' : 'All Documents:\\n';
      output += '─'.repeat(40) + '\\n';

      for (const doc of docs) {
        output += doc.path + '\\n';
        if (doc.title && doc.title !== doc.name) {
          output += '  ' + doc.title + '\\n';
        }
      }

      output += '─'.repeat(40) + '\\n';
      output += 'Total: ' + docs.length + ' document(s)';

      return output;
    `,
    );

    // reload() - Note about reloading from disk
    this.docs.setMethod(
      'reload',
      `
      // Documents are now editable in-game. Reloading from disk would overwrite edits.
      // To force-import a specific doc from disk, use syncFromDisk(path).
      return {
        success: false,
        error: 'Documents are stored in MOO and editable in-game. Use set() to edit, create() to add new docs, or syncFromDisk(path) to re-import from disk.',
        loadedAt: self.loadedAt,
        docCount: Object.keys(self.registry || {}).length,
      };
    `,
    );

    // set(path, content) - Update a document's content
    this.docs.setMethod(
      'set',
      `
      const docPath = args[0];
      const newContent = args[1];

      if (!docPath) {
        return { success: false, error: 'Path is required' };
      }
      if (typeof newContent !== 'string') {
        return { success: false, error: 'Content must be a string' };
      }

      const registry = self.registry || {};
      const docId = registry[docPath];

      if (!docId) {
        return { success: false, error: 'Document not found: ' + docPath };
      }

      const doc = await $load(docId);
      if (!doc) {
        return { success: false, error: 'Document object not found: ' + docId };
      }

      // Update content
      doc.content = newContent;

      // Re-extract title from new content
      const titleMatch = newContent.match(/^#\\\\\\\\s+(.+)$/m);
      if (titleMatch) {
        doc.title = titleMatch[1].trim();
      } else {
        // Fallback to document name if no heading found
        doc.title = doc.name;
      }

      // Track edit
      doc.source = 'in-game';
      doc.editedAt = new Date().toISOString();

      return {
        success: true,
        path: docPath,
        title: doc.title,
        contentLength: newContent.length,
      };
    `,
    );

    // create(path, content, options?) - Create a new document
    this.docs.setMethod(
      'create',
      `
      const docPath = args[0];
      const content = args[1];
      const options = args[2] || {};

      if (!docPath) {
        return { success: false, error: 'Path is required' };
      }
      if (typeof content !== 'string') {
        return { success: false, error: 'Content must be a string' };
      }

      // Validate path format
      if (!docPath.trim()) {
        return { success: false, error: 'Path cannot be empty or whitespace' };
      }
      if (docPath.startsWith('/') || docPath.endsWith('/') || docPath.includes('//')) {
        return { success: false, error: 'Path must not have leading/trailing slashes or consecutive slashes' };
      }

      const registry = self.registry || {};

      // Check if doc already exists
      if (registry[docPath]) {
        return { success: false, error: 'Document already exists: ' + docPath + '. Use set() to update.' };
      }

      // Parse path to get name, category
      const parts = docPath.split('/');
      const name = parts[parts.length - 1];
      const category = parts[0] || 'root';

      // Extract title from content
      const titleMatch = content.match(/^#\\\\\\\\s+(.+)$/m);
      const title = options.title || (titleMatch ? titleMatch[1].trim() : name);

      // Create the document object
      const doc = await $create({
        parent: $doc,
        properties: {
          name,
          path: docPath,
          category,
          content,
          title,
          filename: name + '.md',
          source: 'in-game',
          createdAt: new Date().toISOString(),
        },
      });

      // Update registry (NOTE: race condition possible with concurrent create/delete/rename)
      // Re-read registry to minimize risk of overwriting concurrent changes
      const currentRegistry = self.registry || {};
      currentRegistry[docPath] = doc.id;
      self.registry = currentRegistry;

      // Update folders if new category
      const folders = self.folders || [];
      if (!folders.includes(category)) {
        folders.push(category);
        folders.sort();
        self.folders = folders;
      }

      return {
        success: true,
        id: doc.id,
        path: docPath,
        title,
      };
    `,
    );

    // delete(path) - Delete a document
    this.docs.setMethod(
      'delete',
      `
      const docPath = args[0];

      if (!docPath) {
        return { success: false, error: 'Path is required' };
      }

      const registry = self.registry || {};
      const docId = registry[docPath];

      if (!docId) {
        return { success: false, error: 'Document not found: ' + docPath };
      }

      const doc = await $load(docId);
      if (doc) {
        // Recycle the document object
        await $recycler.recycle(doc);
      }

      // Remove from registry (NOTE: race condition possible with concurrent create/delete/rename)
      // Re-read registry to minimize risk of overwriting concurrent changes
      const currentRegistry = self.registry || {};
      delete currentRegistry[docPath];
      self.registry = currentRegistry;

      return {
        success: true,
        path: docPath,
        deletedId: docId,
      };
    `,
    );

    // rename(oldPath, newPath) - Rename/move a document
    this.docs.setMethod(
      'rename',
      `
      const oldPath = args[0];
      const newPath = args[1];

      if (!oldPath || !newPath) {
        return { success: false, error: 'Both oldPath and newPath are required' };
      }

      // Validate newPath format
      if (!newPath.trim()) {
        return { success: false, error: 'New path cannot be empty or whitespace' };
      }
      if (newPath.startsWith('/') || newPath.endsWith('/') || newPath.includes('//')) {
        return { success: false, error: 'New path must not have leading/trailing slashes or consecutive slashes' };
      }

      const registry = self.registry || {};

      if (!registry[oldPath]) {
        return { success: false, error: 'Document not found: ' + oldPath };
      }
      if (registry[newPath]) {
        return { success: false, error: 'Document already exists at: ' + newPath };
      }

      const docId = registry[oldPath];
      const doc = await $load(docId);

      if (!doc) {
        return { success: false, error: 'Document object not found' };
      }

      // Update document properties
      const parts = newPath.split('/');
      const name = parts[parts.length - 1];
      const category = parts[0] || 'root';

      doc.name = name;
      doc.path = newPath;
      doc.category = category;
      doc.filename = name + '.md';
      doc.source = 'in-game';
      doc.editedAt = new Date().toISOString();

      // Update registry (NOTE: race condition possible with concurrent create/delete/rename)
      // Re-read registry to minimize risk of overwriting concurrent changes
      const currentRegistry = self.registry || {};
      delete currentRegistry[oldPath];
      currentRegistry[newPath] = docId;
      self.registry = currentRegistry;

      // Update folders if new category
      const folders = self.folders || [];
      if (!folders.includes(category)) {
        folders.push(category);
        folders.sort();
        self.folders = folders;
      }

      return {
        success: true,
        oldPath,
        newPath,
        id: docId,
      };
    `,
    );

    // syncFromDisk(path) - Re-import a specific doc from disk (overwrites in-game version)
    this.docs.setMethod(
      'syncFromDisk',
      `
      // This is a placeholder - actual disk access requires TypeScript
      // Use bootstrap:apply to re-import all docs, or manually update via set()
      return {
        success: false,
        error: 'Disk access not available from MOO code. To re-import docs from disk, delete the doc first, then run bootstrap:apply.',
      };
    `,
    );

    // stats() - Get documentation statistics
    this.docs.setMethod(
      'stats',
      `
      const registry = self.registry || {};
      const folders = self.folders || [];
      const paths = Object.keys(registry);

      const byCategory = {};
      let totalLength = 0;
      let inGameCount = 0;
      let diskCount = 0;

      for (const docPath of paths) {
        const doc = await $load(registry[docPath]);
        if (!doc) continue;

        const cat = doc.category || 'root';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
        totalLength += (doc.content || '').length;

        if (doc.source === 'in-game') {
          inGameCount++;
        } else {
          diskCount++;
        }
      }

      return {
        total: paths.length,
        categories: folders.length,
        byCategory,
        totalContentLength: totalLength,
        averageLength: paths.length > 0 ? Math.round(totalLength / paths.length) : 0,
        inGameCreated: inGameCount,
        importedFromDisk: diskCount,
        loadedAt: self.loadedAt,
      };
    `,
    );
  }

  private async loadDocuments(): Promise<void> {
    if (!this.docs || !this.doc) return;

    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      console.log('[DocsBuilder] docs/ directory not found, skipping');
      return;
    }

    const registry: Record<string, number> =
      (this.docs.get('registry') as Record<string, number>) || {};
    const folders = new Set<string>();
    const loadedPaths = new Set<string>();
    let created = 0;
    let skipped = 0;

    // Recursively find all markdown files
    const loadDir = async (dir: string, relativePath: string = '') => {
      // Validate that dir is within docsDir to prevent path traversal
      const resolvedDir = path.resolve(dir);
      const resolvedDocsDir = path.resolve(docsDir);
      if (!resolvedDir.startsWith(resolvedDocsDir)) {
        throw new Error('Path traversal attempt detected');
      }

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip archive folder
          if (entry.name === 'archive') continue;

          // Track top-level folders
          if (!relativePath) {
            folders.add(entry.name);
          }

          await loadDir(
            fullPath,
            relativePath ? `${relativePath}/${entry.name}` : entry.name,
          );
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const filename = entry.name;
          const name = filename.replace(/\.md$/, '');
          const docPath = relativePath ? `${relativePath}/${name}` : name;
          const category = relativePath.split('/')[0] || 'root';

          // Check if doc already exists - if so, SKIP (preserve in-game edits)
          const existingId = registry[docPath];
          if (existingId) {
            const existingDoc = await this.manager.load(existingId);
            if (existingDoc) {
              // Doc exists, preserve it (don't overwrite in-game edits)
              loadedPaths.add(docPath);
              this.docObjects.push(existingDoc);
              skipped++;
              continue;
            }
          }

          // Check file size before reading (10MB limit)
          const stats = fs.statSync(fullPath);
          if (stats.size > 10 * 1024 * 1024) {
            console.warn(
              `[DocsBuilder] Skipping ${fullPath}: file too large (${stats.size} bytes)`,
            );
            continue;
          }

          // Read content from disk (only for NEW docs)
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Extract title from first # heading
          const titleMatch = content.match(/^#\s+(.+)$/m);
          const title = titleMatch ? titleMatch[1].trim() : name;

          // Create new document object
          const docObj = await this.manager.create({
            parent: this.doc!,
            properties: {
              name,
              path: docPath,
              category,
              content,
              title,
              filename,
              // Track source for debugging
              source: 'disk',
              importedAt: new Date().toISOString(),
            },
            methods: {},
          });

          registry[docPath] = docObj.id as number;
          loadedPaths.add(docPath);
          this.docObjects.push(docObj);
          created++;
        }
      }
    };

    await loadDir(docsDir);

    // Update folder list (merge with existing in case docs were created in-game)
    const existingFolders = (this.docs.get('folders') as string[]) || [];
    for (const f of existingFolders) {
      folders.add(f);
    }

    // Preserve in-game created docs that don't have disk files
    // The registry already contains all existing docs (line 711-712)
    // We've only updated entries for docs we processed from disk (via loadedPaths)
    // Any docs NOT in loadedPaths but in the old registry are in-game-only and must be preserved
    const oldRegistry =
      (this.docs.get('registry') as Record<string, number>) || {};
    for (const [path, docId] of Object.entries(oldRegistry)) {
      if (!loadedPaths.has(path)) {
        // This doc was created in-game and has no disk file - preserve it
        registry[path] = docId;
      }
    }

    // Update manager registry and folders
    this.docs.set('registry', registry);
    this.docs.set('folders', Array.from(folders).sort());
    this.docs.set('loadedAt', new Date().toISOString());

    console.log(
      `[DocsBuilder] ${created} new docs imported, ${skipped} existing docs preserved (${Object.keys(registry).length} total)`,
    );
  }

  async registerAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    if (this.doc) {
      await objectManager.call('addAlias', 'doc', this.doc.id);
      console.log(`Registered doc alias -> #${this.doc.id}`);
    }

    if (this.docs) {
      await objectManager.call('addAlias', 'docs', this.docs.id);
      console.log(`Registered docs alias -> #${this.docs.id}`);
    }
  }
}

// Self-register
registerBuilder(DocsBuilder);
