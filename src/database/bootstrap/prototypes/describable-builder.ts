import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Describable prototype
 * Base prototype for things that exist in the world
 */
export class DescribableBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number, existingObj?: RuntimeObject): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = existingObj || await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Describable',
        description: 'Base prototype for things that exist in the world',
        aliases: [],
        location: null, // ObjId | null - where this object is located
        contents: [], // ObjId[] - what's inside this object
        // Physical dimensions (in centimeters for width/height/depth, grams for weight)
        width: 0, // cm
        height: 0, // cm
        depth: 0, // cm
        weight: 0, // grams
        // Movement restrictions
        boltedDown: false, // If true, cannot be moved at all
        // AI-readable abilities - natural language mechanics documentation
        // Describes what this object can do, how to use it, rules/formulas
        abilities: null, // string - grows as players discover new interactions
      },
      methods: {},
    });

    obj.setMethod('describe', `
      return \`\${self.name}\\r\\n\${self.description}\`;
    `);

    obj.setMethod('shortDesc', `
      return self.name;
    `);

    // Get volume in cubic centimeters
    obj.setMethod('getVolume', `
      return (self.width || 0) * (self.height || 0) * (self.depth || 0);
    `);

    // Check if this object can fit inside another based on dimensions
    obj.setMethod('canFitIn', `
      const container = args[0];
      // Simple check: object's smallest bounding dimension vs container's largest
      const dims = [self.width || 0, self.height || 0, self.depth || 0].sort((a, b) => a - b);
      const containerDims = [container.width || 0, container.height || 0, container.depth || 0].sort((a, b) => b - a);
      // Check if smallest dimension of object fits in largest of container, etc.
      return dims[0] <= containerDims[0] && dims[1] <= containerDims[1] && dims[2] <= containerDims[2];
    `);

    // Check if this object can contain another object
    // Return true to allow, or a string explaining why not
    obj.setMethod('canContain', `
      const obj = args[0];
      const objName = obj?.name || 'that';
      return \`The \${self.name} cannot contain \${objName}.\`;
    `);

    // THE primitive for all location changes
    // Everything that moves goes through this method
    obj.setMethod('moveTo', `
      /** Move this object to a new location.
       *  THE primitive for all location changes - picking up, dropping, transferring.
       *  To pick up: item.moveTo(hand)
       *  To drop: item.moveTo(room)
       *  To put in container: item.moveTo(container)
       *  @param dest - Destination RuntimeObject or ID (room, hand, container)
       *  @param mover - Optional: who is causing the move (for hooks/announcements)
       *  @returns undefined on success, or error string if destination rejects
       */
      let dest = args[0]; // RuntimeObject or ID destination
      const mover = args[1]; // Who/what is causing the move (optional)

      // Accept either a RuntimeObject or an ID number
      if (typeof dest === 'number') {
        dest = await $load(dest);
      }

      if (!dest || dest.id === undefined) {
        throw new Error('Invalid destination');
      }

      // Get source (current location)
      const source = self.location;

      // Check if destination can contain us
      const canContain = await dest.canContain(self);
      if (canContain !== true) {
        return canContain; // Return the rejection reason
      }

      // Pre-move hooks (can throw to cancel the move)
      if (source && source.onContentLeaving) {
        await source.onContentLeaving(self, dest, mover);
      }
      await self.onLeaving(source, dest, mover);

      // Perform the actual move
      if (source && source.removeContent) {
        await source.removeContent(self);
      }
      self.location = dest;
      if (dest.addContent) {
        await dest.addContent(self);
      }

      // Post-move hooks (for notifications, verb registration, etc.)
      if (source && source.onContentLeft) {
        await source.onContentLeft(self, dest, mover);
      }
      await self.onArrived(dest, source, mover);
      if (dest.onContentArrived) {
        await dest.onContentArrived(self, source, mover);
      }
    `);

    // Basic content management - can be overridden by Location for fancier behavior
    obj.setMethod('addContent', `
      let item = args[0];

      // Accept either a RuntimeObject or an ID number
      if (typeof item === 'number') {
        item = await $load(item);
      }

      if (!item || typeof item.id !== 'number') {
        return; // Invalid input
      }

      const contents = self.contents || [];
      // Check if already present (by id since we store objects)
      const alreadyPresent = contents.some(c => (c?.id || c) === item.id);
      if (!alreadyPresent) {
        contents.push(item);
        self.contents = contents;
        item.location = self;
      }
    `);

    obj.setMethod('removeContent', `
      let item = args[0];

      // Get the id we're looking for
      const targetId = typeof item === 'number' ? item : item?.id;
      if (targetId === undefined) {
        return; // Invalid input
      }

      const contents = self.contents || [];
      const index = contents.findIndex(c => (c?.id || c) === targetId);
      if (index !== -1) {
        contents.splice(index, 1);
        self.contents = contents;
      }
    `);

    // Hook: called before leaving current location
    // Override to prepare for departure, can throw to cancel
    obj.setMethod('onLeaving', `
      const source = args[0];
      const dest = args[1];
      const mover = args[2];
      // Default: do nothing, allow move
    `);

    // Hook: called after arriving at new location
    // Override to register verbs, announce arrival, etc.
    obj.setMethod('onArrived', `
      const dest = args[0];
      const source = args[1];
      const mover = args[2];
      // Default: do nothing
    `);

    // Room-centric verb registration API
    obj.setMethod('onPlayerEnter', `
      /** Called when a player enters the room. Registers verbs from all contents. */
      const player = args[0];
      for (const obj of self.contents || []) {
        if (obj.getRoomVerbs) {
          for (const { pattern, method } of obj.getRoomVerbs()) {
            await player.registerVerb(pattern, obj, method);
          }
        }
      }
    `);

    obj.setMethod('onPlayerExit', `
      /** Called when a player leaves the room. Unregisters verbs from all contents. */
      const player = args[0];
      for (const obj of self.contents || []) {
        if (obj.getRoomVerbs) {
          for (const { pattern } of obj.getRoomVerbs()) {
            await player.unregisterVerb(pattern);
          }
        }
      }
    `);

    // ═══════════════════════════════════════════════════════════════════
    // PLOT HOOKS - Allow plots to watch for events on this object
    // ═══════════════════════════════════════════════════════════════════

    // triggerPlotHooks(eventName, data) - notify all plots watching for this event
    // Called by objects when something interesting happens (e.g., item deposited)
    // Checks filter criteria: all filter keys must match corresponding data keys
    obj.setMethod('triggerPlotHooks', `
      const eventName = args[0];
      const data = args[1] || {};

      const plotHooks = self.plotHooks || {};
      const hooks = plotHooks[eventName] || [];

      if (hooks.length === 0) {
        return 0; // No hooks registered
      }

      let triggered = 0;

      for (const hook of hooks) {
        // Check filter - all filter keys must match data
        const filter = hook.filter || {};
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if (data[key] !== value) {
            matches = false;
            break;
          }
        }

        if (!matches) {
          continue; // Filter didn't match, skip this hook
        }

        // Get plot - may be auto-resolved objref or raw ID if not cached
        let plot = hook.plot;
        if (typeof plot === 'number') {
          plot = await $load(plot);
        }
        if (!plot) {
          continue; // Plot no longer exists
        }

        try {
          if (hook.jobId) {
            // Job-specific hook
            if (plot.onJobHookTriggered) {
              await plot.onJobHookTriggered(hook.jobId, eventName, self.id, data, filter);
              triggered++;
            }
          } else {
            // Plot-level hook
            if (plot.onHookTriggered) {
              await plot.onHookTriggered(eventName, self.id, data, filter);
              triggered++;
            }
          }
        } catch (e) {
          console.error('Error triggering hook for plot #' + (plot?.id || plot) + ':', e.message);
        }
      }

      return triggered;
    `);

    // getPlotHooks() - list all plot hooks registered on this object
    obj.setMethod('getPlotHooks', `
      return self.plotHooks || {};
    `);

    // hasPlotHook(eventName) - check if any plot is watching for this event
    obj.setMethod('hasPlotHook', `
      const eventName = args[0];
      const plotHooks = self.plotHooks || {};
      const hooks = plotHooks[eventName] || [];
      return hooks.length > 0;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // ABILITIES - Natural language mechanics documentation for AI
    // ═══════════════════════════════════════════════════════════════════

    // getAbilities() - Get abilities, walking inheritance chain if needed
    obj.setMethod('getAbilities', `
      // Check self first
      if (self.abilities) {
        return self.abilities;
      }
      // Walk up inheritance chain
      const parent = self.getParent ? self.getParent() : null;
      if (parent && parent.id !== self.id && parent.getAbilities) {
        return await parent.getAbilities();
      }
      return null;
    `);

    // updateAbilities(newText) - Append new abilities text to this object's abilities
    // This is how the AI documents newly discovered mechanics
    obj.setMethod('updateAbilities', `
      const newText = args[0];
      if (!newText) return self.abilities;

      const current = self.abilities || '';
      if (current) {
        self.abilities = current.trim() + '\\n' + newText.trim();
      } else {
        self.abilities = newText.trim();
      }
      return self.abilities;
    `);

    // getFullContext() - Get object info for AI context (legacy, use describeForAI)
    // Returns name, description, abilities, and key properties
    obj.setMethod('getFullContext', `
      return {
        id: self.id,
        name: self.name,
        description: self.description,
        abilities: await self.getAbilities(),
        location: self.location?.id,
        contents: (self.contents || []).map(c => ({ id: c.id, name: c.name })),
      };
    `);

    // getMethodsForAI() - Get method signatures with JSDoc for AI context
    // Extracts the first JSDoc comment block from each method as documentation
    obj.setMethod('getMethodsForAI', `
      /** Get method names and their JSDoc descriptions for AI context.
       *  Walks inheritance chain to include inherited methods.
       *  @returns Object mapping method names to { doc, from } where from is $alias or #id
       */
      const result = {};

      // Build reverse alias lookup: id -> $alias
      const aliasMap = {};
      if ($.getAliases) {
        const aliases = $.getAliases();
        for (const [alias, obj] of aliases.entries()) {
          if (obj && obj.id !== undefined) {
            aliasMap[obj.id] = '$' + alias;
          }
        }
      }

      // Helper to get $alias or #id for an object
      const getRef = (obj) => {
        if (!obj) return null;
        return aliasMap[obj.id] || ('#' + obj.id);
      };

      // Helper to extract JSDoc from method code
      const extractDoc = (code) => {
        if (!code) return null;
        // Match /** ... */ at the start of code (with optional whitespace)
        const match = code.match(/^\\s*\\/\\*\\*([\\s\\S]*?)\\*\\//);
        if (match) {
          // Clean up the JSDoc: remove * prefixes, trim lines
          return match[1]
            .split('\\n')
            .map(line => line.replace(/^\\s*\\*\\s?/, '').trim())
            .filter(line => line.length > 0)
            .join(' ');
        }
        return null;
      };

      // Get own methods
      const selfRef = getRef(self);
      if (self.getOwnMethods) {
        const ownMethods = self.getOwnMethods();
        for (const [name, method] of Object.entries(ownMethods)) {
          const doc = extractDoc(method.code);
          if (doc) {
            result[name] = { doc, from: selfRef };
          }
        }
      }

      // Walk up inheritance chain for inherited methods
      let current = self.getParent ? self.getParent() : null;
      while (current && current.id !== self.id) {
        const currentRef = getRef(current);
        if (current.getOwnMethods) {
          const parentMethods = current.getOwnMethods();
          for (const [name, method] of Object.entries(parentMethods)) {
            if (result[name]) continue; // Already have this method (overridden)
            const doc = extractDoc(method.code);
            if (doc) {
              result[name] = { doc, from: currentRef };
            }
          }
        }
        current = current.getParent ? current.getParent() : null;
      }

      return result;
    `);

    // describeForAI(options) - Rich recursive description for AI context
    // Walks inheritance chain showing each object's LOCAL definitions
    obj.setMethod('describeForAI', `
      /** Describe this object for AI context, walking inheritance chain.
       *  Shows each object in the chain with only its LOCALLY defined items.
       *  @param options - { depth, includeProps, includeMethods }
       *  @returns Object with id, name, description, local: {props, abilities, methods}, inheritsFrom: [...]
       */
      const options = args[0] || {};
      const depth = options.depth !== undefined ? options.depth : 2;
      const includeProps = options.includeProps || ['contents', 'locks', 'holding'];
      const includeMethods = options.includeMethods !== undefined ? options.includeMethods : true;

      // Build reverse alias lookup: id -> $alias
      const aliasMap = {};
      if ($.getAliases) {
        const aliases = $.getAliases();
        for (const [alias, obj] of aliases.entries()) {
          if (obj && obj.id !== undefined) {
            aliasMap[obj.id] = '$' + alias;
          }
        }
      }
      const getRef = (obj) => obj ? (aliasMap[obj.id] || ('#' + obj.id)) : null;

      // Helper to extract JSDoc from method code
      const extractDoc = (code) => {
        if (!code) return null;
        const match = code.match(/^\\s*\\/\\*\\*([\\s\\S]*?)\\*\\//);
        if (match) {
          return match[1]
            .split('\\n')
            .map(line => line.replace(/^\\s*\\*\\s?/, '').trim())
            .filter(line => line.length > 0)
            .join(' ');
        }
        return null;
      };

      // Helper to get LOCAL definitions for an object
      const getLocalDefs = (obj) => {
        const local = {};

        // Local properties with descriptions
        if (obj.getOwnProperties) {
          const ownProps = obj.getOwnProperties();
          if (Object.keys(ownProps).length > 0) {
            local.properties = {};
            for (const [name, prop] of Object.entries(ownProps)) {
              local.properties[name] = {
                value: prop.value,
                type: prop.type,
              };
              if (prop.description) {
                local.properties[name].description = prop.description;
              }
            }
          }
        }

        // Local abilities
        if (obj.getOwnProperties) {
          const ownProps = obj.getOwnProperties();
          if (ownProps.abilities && ownProps.abilities.value) {
            local.abilities = ownProps.abilities.value;
          }
        }

        // Local methods with JSDoc
        if (includeMethods && obj.getOwnMethods) {
          const ownMethods = obj.getOwnMethods();
          const methodDocs = {};
          for (const [name, method] of Object.entries(ownMethods)) {
            const doc = extractDoc(method.code);
            if (doc) {
              methodDocs[name] = doc;
            }
          }
          if (Object.keys(methodDocs).length > 0) {
            local.methods = methodDocs;
          }
        }

        return local;
      };

      // Build inheritance tree recursively
      const buildInheritanceTree = (obj) => {
        if (!obj || obj.id === 1) return null; // Stop at Root

        const local = getLocalDefs(obj);
        const parent = obj.getParent ? obj.getParent() : null;
        const parentTree = buildInheritanceTree(parent);

        const node = {
          from: getRef(obj),
          name: obj.name,
        };

        // Add local defs if any
        if (Object.keys(local).length > 0) {
          Object.assign(node, local);
        }

        // Add parent tree if exists
        if (parentTree) {
          node.inheritsFrom = parentTree;
        }

        return node;
      };

      // Base result with self's local definitions
      const selfLocal = getLocalDefs(self);
      const parent = self.getParent ? self.getParent() : null;
      const parentTree = buildInheritanceTree(parent);

      const result = {
        id: self.id,
        ref: getRef(self),
        name: self.name,
        description: self.description,
      };

      // Add local defs if any
      if (Object.keys(selfLocal).length > 0) {
        Object.assign(result, selfLocal);
      }

      // Add inheritance tree if exists
      if (parentTree) {
        result.inheritsFrom = parentTree;
      }

      // Recursively describe nested objects if depth allows
      if (depth > 0) {
        for (const propName of includeProps) {
          const propValue = self[propName];
          if (!propValue) continue;

          if (Array.isArray(propValue) && propValue.length > 0) {
            result[propName] = [];
            for (const item of propValue) {
              if (item && typeof item === 'object' && item.describeForAI) {
                result[propName].push(await item.describeForAI({ depth: depth - 1, includeProps, includeMethods }));
              } else if (item && typeof item === 'object' && item.id !== undefined) {
                result[propName].push({
                  id: item.id,
                  name: item.name,
                  description: item.description,
                });
              }
            }
          } else if (propValue && typeof propValue === 'object' && propValue.id !== undefined) {
            if (propValue.describeForAI) {
              result[propName] = await propValue.describeForAI({ depth: depth - 1, includeProps, includeMethods });
            } else {
              result[propName] = {
                id: propValue.id,
                name: propValue.name,
                description: propValue.description,
              };
            }
          }
        }
      }

      return result;
    `);

    // Property descriptions for AI context
    obj.setPropertyDescription('name', 'Display name of this object');
    obj.setPropertyDescription('description', 'Prose description of what the object looks like');
    obj.setPropertyDescription('aliases', 'Alternative names this object responds to');
    obj.setPropertyDescription('location', 'The container or room where this object currently is (objref)');
    obj.setPropertyDescription('contents', 'Array of objects inside this object (objrefs)');
    obj.setPropertyDescription('width', 'Width in centimeters');
    obj.setPropertyDescription('height', 'Height in centimeters');
    obj.setPropertyDescription('depth', 'Depth in centimeters');
    obj.setPropertyDescription('weight', 'Weight in grams');
    obj.setPropertyDescription('boltedDown', 'If true, object cannot be picked up or moved');
    obj.setPropertyDescription('abilities', 'Natural language physics rules - what this object can do and how');

    return obj;
  }
}
