import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Notes utility object ($.notes)
 * Central registry for attaching notes to any object.
 *
 * Notes are stored in a map: { objectId: [{ text, author, timestamp, tags }] }
 *
 * Usage:
 *   await $.notes.add(objectId, text, author, tags?)
 *   const notes = await $.notes.get(objectId)
 *   await $.notes.delete(objectId, index)
 *   const results = await $.notes.search(query)
 */
export class NotesBuilder {
  private notes: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.notes) {
      this.notes = await this.manager.load(aliases.notes);
      if (this.notes) return;
    }

    this.notes = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Notes',
        description: 'Note attachment system',
        // Map of objectId -> array of notes
        registry: {},
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // CORE METHODS
    // ═══════════════════════════════════════════════════════════════════

    // add(objectId, text, author?, tags?) - add a note to an object
    this.notes.setMethod('add', `
      const objectId = typeof args[0] === 'object' ? args[0].id : args[0];
      const text = args[1];
      const author = args[2] || 'system';
      const tags = args[3] || [];

      if (!objectId || !text) {
        return { success: false, error: 'objectId and text required' };
      }

      const registry = self.registry || {};
      if (!registry[objectId]) {
        registry[objectId] = [];
      }

      const note = {
        text: text,
        author: typeof author === 'object' ? author.name || '#' + author.id : author,
        authorId: typeof author === 'object' ? author.id : null,
        timestamp: new Date().toISOString(),
        tags: Array.isArray(tags) ? tags : [tags],
      };

      registry[objectId].push(note);
      self.registry = registry;

      return { success: true, index: registry[objectId].length - 1 };
    `);

    // get(objectId) - get all notes for an object
    this.notes.setMethod('get', `
      const objectId = typeof args[0] === 'object' ? args[0].id : args[0];

      if (!objectId) return [];

      const registry = self.registry || {};
      return registry[objectId] || [];
    `);

    // getOne(objectId, index) - get a single note
    this.notes.setMethod('getOne', `
      const objectId = typeof args[0] === 'object' ? args[0].id : args[0];
      const index = args[1];

      if (!objectId || index === undefined) return null;

      const registry = self.registry || {};
      const notes = registry[objectId] || [];

      return notes[index] || null;
    `);

    // delete(objectId, index) - delete a note by index
    this.notes.setMethod('delete', `
      const objectId = typeof args[0] === 'object' ? args[0].id : args[0];
      const index = args[1];

      if (!objectId || index === undefined) {
        return { success: false, error: 'objectId and index required' };
      }

      const registry = self.registry || {};
      const notes = registry[objectId];

      if (!notes || index < 0 || index >= notes.length) {
        return { success: false, error: 'Note not found' };
      }

      const deleted = notes.splice(index, 1)[0];
      self.registry = registry;

      return { success: true, deleted: deleted };
    `);

    // clear(objectId) - delete all notes for an object
    this.notes.setMethod('clear', `
      const objectId = typeof args[0] === 'object' ? args[0].id : args[0];

      if (!objectId) {
        return { success: false, error: 'objectId required' };
      }

      const registry = self.registry || {};
      const count = (registry[objectId] || []).length;
      delete registry[objectId];
      self.registry = registry;

      return { success: true, deleted: count };
    `);

    // count(objectId) - count notes for an object
    this.notes.setMethod('count', `
      const objectId = typeof args[0] === 'object' ? args[0].id : args[0];

      if (!objectId) return 0;

      const registry = self.registry || {};
      return (registry[objectId] || []).length;
    `);

    // search(query, options?) - search notes by text or tag
    // options: { tag, author, limit }
    this.notes.setMethod('search', `
      const query = args[0] || '';
      const options = args[1] || {};

      const registry = self.registry || {};
      const results = [];
      const queryLower = query.toLowerCase();
      const limit = options.limit || 50;

      for (const [objId, notes] of Object.entries(registry)) {
        for (let i = 0; i < notes.length; i++) {
          const note = notes[i];

          // Filter by tag if specified
          if (options.tag && !note.tags.includes(options.tag)) continue;

          // Filter by author if specified
          if (options.author && note.author !== options.author) continue;

          // Filter by text query
          if (query && !note.text.toLowerCase().includes(queryLower)) continue;

          results.push({
            objectId: parseInt(objId),
            index: i,
            note: note,
          });

          if (results.length >= limit) break;
        }
        if (results.length >= limit) break;
      }

      return results;
    `);

    // listObjects() - list all objects that have notes
    this.notes.setMethod('listObjects', `
      const registry = self.registry || {};
      const objects = [];

      for (const [objId, notes] of Object.entries(registry)) {
        if (notes.length > 0) {
          objects.push({
            objectId: parseInt(objId),
            count: notes.length,
          });
        }
      }

      return objects;
    `);

    // format(objectId) - format notes for display
    this.notes.setMethod('format', `
      const objectId = typeof args[0] === 'object' ? args[0].id : args[0];

      if (!objectId) return 'No object specified.';

      const registry = self.registry || {};
      const notes = registry[objectId] || [];

      if (notes.length === 0) {
        return 'No notes.';
      }

      let output = '';
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const date = new Date(note.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const tags = note.tags && note.tags.length > 0 ? ' [' + note.tags.join(', ') + ']' : '';

        output += '[' + i + '] ' + dateStr + ' by ' + note.author + tags + '\\r\\n';
        output += '    ' + note.text.replace(/\\n/g, '\\r\\n    ') + '\\r\\n';
      }

      return output.trim();
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.notes) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'notes', this.notes.id);
    console.log(`Registered notes alias -> #${this.notes.id}`);
  }
}
