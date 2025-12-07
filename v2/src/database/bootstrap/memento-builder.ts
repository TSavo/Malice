import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Memento utility object ($.memento)
 * Serializes object graphs with ID replacement for cloning/templates
 *
 * Usage from MOO code:
 *   // Capture a set of objects as a memento
 *   const memento = await $.memento.capture([body, arm1, arm2, head]);
 *   // Objects in the list get %N placeholders, external refs stay as IDs
 *
 *   // Rehydrate - creates new objects with new IDs
 *   const newObjects = await $.memento.rehydrate(memento);
 *   // newObjects['%0'] = new body, newObjects['%1'] = new arm1, etc.
 *
 * The boundary between "in-graph" and "external" is determined by what
 * objects you pass to capture(). In-graph objects get new IDs on rehydrate,
 * external references are assumed to exist and stay as-is.
 */
export class MementoBuilder {
  private memento: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.memento) {
      this.memento = await this.manager.load(aliases.memento);
      if (this.memento) return; // Already exists
    }

    // Create new Memento utility
    this.memento = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Memento',
        description: 'Object graph serialization with ID replacement',
      },
      methods: {},
    });

    // Capture a set of objects as a memento
    // objects: array of objects (or IDs) to include in the graph
    // Returns: { objects: { '%0': {...}, '%1': {...} }, root: '%0' }
    this.memento.setMethod('capture', `
      const objects = args[0];

      if (!Array.isArray(objects) || objects.length === 0) {
        throw new Error('capture() requires a non-empty array of objects');
      }

      // Build set of in-graph IDs and map to placeholders
      const idToPlaceholder = new Map();
      const loadedObjects = [];

      for (let i = 0; i < objects.length; i++) {
        let obj = objects[i];
        if (typeof obj === 'number') {
          obj = await $.load(obj);
        }
        if (!obj) continue;

        const placeholder = '%' + i;
        idToPlaceholder.set(obj.id, placeholder);
        loadedObjects.push(obj);
      }

      // Helper to check if value is a RuntimeObject (has .id property)
      const isObjRef = (value) => {
        return value && typeof value === 'object' && 'id' in value && typeof value.id === 'number';
      };

      // Helper to replace objrefs with placeholders (in-graph) or store as objref (external)
      const replaceRefs = (value) => {
        if (value === null || value === undefined) {
          return value;
        }

        // RuntimeObject reference
        if (isObjRef(value)) {
          const id = value.id;
          if (idToPlaceholder.has(id)) {
            return idToPlaceholder.get(id); // In-graph: use placeholder
          }
          // External: store as objref type so we know it's a reference, not a plain number
          return { _objref: id };
        }

        // Array - recurse
        if (Array.isArray(value)) {
          return value.map(v => replaceRefs(v));
        }

        // Object - recurse into properties (but not RuntimeObjects, handled above)
        if (typeof value === 'object') {
          const result = {};
          for (const [k, v] of Object.entries(value)) {
            result[k] = replaceRefs(v);
          }
          return result;
        }

        // Primitive (number, string, boolean) - keep as-is
        return value;
      };

      // Serialize each object
      const serialized = {};

      for (const obj of loadedObjects) {
        const placeholder = idToPlaceholder.get(obj.id);

        // Get parent - replace if in-graph, otherwise store as objref
        // Note: parent is accessed via getParent() method, not .parent property
        let parentId = obj.getParent ? obj.getParent() : obj.parent;
        let parent;
        if (idToPlaceholder.has(parentId)) {
          parent = idToPlaceholder.get(parentId);
        } else {
          parent = { _objref: parentId };
        }

        // Get all own properties and replace refs
        const props = {};
        const allProps = obj.getOwnProperties ? obj.getOwnProperties() : {};
        for (const [key, value] of Object.entries(allProps)) {
          // Skip internal/transient properties
          if (key.startsWith('_')) continue;
          props[key] = replaceRefs(value);
        }

        serialized[placeholder] = {
          parent: parent,
          properties: props,
        };
      }

      return JSON.stringify({
        objects: serialized,
        root: '%0',
      });
    `);

    // Rehydrate a memento - create new objects with new IDs
    // memento: the captured memento (JSON string)
    // Returns: map of placeholder -> new object { '%0': newObj, '%1': newObj, ... }
    this.memento.setMethod('rehydrate', `
      const mementoStr = args[0];

      if (!mementoStr || typeof mementoStr !== 'string') {
        throw new Error('Invalid memento: expected JSON string');
      }

      const memento = JSON.parse(mementoStr);

      if (!memento || !memento.objects) {
        throw new Error('Invalid memento: missing objects');
      }

      const recycler = await $.recycler;
      if (!recycler) {
        throw new Error('Recycler not available');
      }

      // First pass: create all objects with temporary parent
      // We need to create them first to get their IDs
      const placeholderToId = new Map();
      const placeholderToObj = {};

      for (const placeholder of Object.keys(memento.objects)) {
        const data = memento.objects[placeholder];

        // Determine initial parent - use external ID or temporary
        let initialParent = data.parent;
        if (typeof initialParent === 'string' && initialParent.startsWith('%')) {
          // Parent is in-graph, use root (1) temporarily
          initialParent = 1;
        }

        // Create object with empty properties first
        const newObj = await recycler.create({
          parent: initialParent,
          properties: {},
        }, null);

        placeholderToId.set(placeholder, newObj.id);
        placeholderToObj[placeholder] = newObj;
      }

      // Helper to replace placeholders with new IDs and resolve _objref markers
      const replacePlaceholders = async (value) => {
        if (value === null || value === undefined) {
          return value;
        }

        // Placeholder string -> return the new RuntimeObject
        if (typeof value === 'string' && value.startsWith('%')) {
          if (placeholderToObj[value]) {
            return placeholderToObj[value];
          }
          return value; // Unknown placeholder, keep as-is
        }

        // Array - recurse
        if (Array.isArray(value)) {
          const results = [];
          for (const v of value) {
            results.push(await replacePlaceholders(v));
          }
          return results;
        }

        // Object - check for _objref marker or recurse
        if (typeof value === 'object') {
          // External objref marker -> load the existing object
          if ('_objref' in value && Object.keys(value).length === 1) {
            return await $.load(value._objref);
          }

          // Regular object - recurse into properties
          const result = {};
          for (const [k, v] of Object.entries(value)) {
            result[k] = await replacePlaceholders(v);
          }
          return result;
        }

        // Primitive - keep as-is
        return value;
      };

      // Second pass: fix up parents and set properties
      for (const placeholder of Object.keys(memento.objects)) {
        const data = memento.objects[placeholder];
        const newObj = placeholderToObj[placeholder];

        // Fix parent - could be placeholder string or _objref
        // Note: parent is set via setParent() method, not .parent property
        const parentData = data.parent;
        if (typeof parentData === 'string' && parentData.startsWith('%')) {
          // In-graph parent - use new ID
          const newParentId = placeholderToId.get(parentData);
          if (newParentId !== undefined) {
            newObj.setParent(newParentId);
          }
        } else if (parentData && typeof parentData === 'object' && '_objref' in parentData) {
          // External parent - use existing ID
          newObj.setParent(parentData._objref);
        }

        // Set properties with placeholders replaced
        for (const [key, value] of Object.entries(data.properties)) {
          const fixedValue = await replacePlaceholders(value);
          newObj.set(key, fixedValue);
        }
      }

      return placeholderToObj;
    `);

    // Convenience: capture and immediately rehydrate (clone)
    this.memento.setMethod('clone', `
      const objects = args[0];
      const memento = await self.capture(objects);
      return await self.rehydrate(memento);
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.memento) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.memento = this.memento.id;
    objectManager.set('aliases', aliases);

    console.log(`Registered memento alias -> #${this.memento.id}`);
  }
}
