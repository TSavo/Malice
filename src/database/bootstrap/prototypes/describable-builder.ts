import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Describable prototype
 * Base prototype for things that exist in the world
 */
export class DescribableBuilder implements Builder {
  static provides = ['describable'];
  static depends = ['aiImageGen']; // For image() method

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists (types auto-alias)
    const existing = await this.manager.load('describable');
    if (existing) {
      this.obj = existing;
    } else {
      // Create describable as a TYPE
      const root = await this.manager.load('root');
      if (!root) throw new Error('Root type not found');

      this.obj = await this.manager.define('describable', root, {
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
          // AI personality - if set, object is conscious and can respond via AI
          // Every digital device in 2110 is conscious (legacy of AI solving software in 2026)
          systemPrompt: null, // string - AI personality/role prompt
          interactionSession: null, // string - session ID for conversation continuity
          // TTS voice for speech synthesis (VibeVoice server)
          // Built-in: alloy, echo, fable, onyx, nova, shimmer
          // Custom: any voice added via $tts.addVoice() from audio samples
          voiceId: null, // string - TTS voice ID
          // TTS voice style for steerability - e.g., "speak slowly and menacingly"
          voiceStyle: null, // string - natural language instruction for how to speak
          // Image generation prompt template with ${variable} substitution
          imagePrompt: null, // string - template for AI image generation
          // Negative prompt for image generation (things to exclude)
          imageNegativePrompt: null, // string - passed to MJ --no parameter
          // Image generation style options
          imageStylize: null, // number 0-1000 - MJ --stylize parameter
          imageStyle: null, // 'raw' | 'scenic' - MJ --style parameter
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj;
    obj.setMethod(
      'describe',
      `
      return \`\${self.name}\\r\\n\${self.description}\`;
    `,
    );

    obj.setMethod(
      'shortDesc',
      `
      return self.name;
    `,
    );

    // Get volume in cubic centimeters
    obj.setMethod(
      'getVolume',
      `
      return (self.width || 0) * (self.height || 0) * (self.depth || 0);
    `,
    );

    // Check if this object can fit inside another based on dimensions
    obj.setMethod(
      'canFitIn',
      `
      const container = args[0];
      // Simple check: object's smallest bounding dimension vs container's largest
      const dims = [self.width || 0, self.height || 0, self.depth || 0].sort((a, b) => a - b);
      const containerDims = [container.width || 0, container.height || 0, container.depth || 0].sort((a, b) => b - a);
      // Check if smallest dimension of object fits in largest of container, etc.
      return dims[0] <= containerDims[0] && dims[1] <= containerDims[1] && dims[2] <= containerDims[2];
    `,
    );

    // Check if this object can contain another object
    // Return true to allow, or a string explaining why not
    obj.setMethod(
      'canContain',
      `
      const obj = args[0];
      const objName = obj?.name || 'that';
      return \`The \${self.name} cannot contain \${objName}.\`;
    `,
    );

    // THE primitive for all location changes
    // Everything that moves goes through this method
    obj.setMethod(
      'moveTo',
      `
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
    `,
    );

    // Basic content management - can be overridden by Location for fancier behavior
    obj.setMethod(
      'addContent',
      `
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
    `,
    );

    obj.setMethod(
      'removeContent',
      `
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
    `,
    );

    // Hook: called before leaving current location
    // Override to prepare for departure, can throw to cancel
    obj.setMethod(
      'onLeaving',
      `
      const source = args[0];
      const dest = args[1];
      const mover = args[2];
      // Default: do nothing, allow move
    `,
    );

    // Hook: called after arriving at new location
    // Override to register verbs, announce arrival, etc.
    obj.setMethod(
      'onArrived',
      `
      const dest = args[0];
      const source = args[1];
      const mover = args[2];
      // Default: do nothing
    `,
    );

    // Room-centric verb registration API
    obj.setMethod(
      'onPlayerEnter',
      `
      /** Called when a player enters the room. Registers verbs from all contents. */
      const player = args[0];
      for (const obj of self.contents || []) {
        if (obj.getRoomVerbs) {
          for (const { pattern, method } of obj.getRoomVerbs()) {
            await player.registerVerb(pattern, obj, method);
          }
        }
      }
    `,
    );

    obj.setMethod(
      'onPlayerExit',
      `
      /** Called when a player leaves the room. Unregisters verbs from all contents. */
      const player = args[0];
      for (const obj of self.contents || []) {
        if (obj.getRoomVerbs) {
          for (const { pattern } of obj.getRoomVerbs()) {
            await player.unregisterVerb(pattern);
          }
        }
      }
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // PLOT HOOKS - Allow plots to watch for events on this object
    // ═══════════════════════════════════════════════════════════════════

    // triggerPlotHooks(eventName, data) - notify all plots watching for this event
    // Called by objects when something interesting happens (e.g., item deposited)
    // Checks filter criteria: all filter keys must match corresponding data keys
    obj.setMethod(
      'triggerPlotHooks',
      `
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
    `,
    );

    // getPlotHooks() - list all plot hooks registered on this object
    obj.setMethod(
      'getPlotHooks',
      `
      return self.plotHooks || {};
    `,
    );

    // hasPlotHook(eventName) - check if any plot is watching for this event
    obj.setMethod(
      'hasPlotHook',
      `
      const eventName = args[0];
      const plotHooks = self.plotHooks || {};
      const hooks = plotHooks[eventName] || [];
      return hooks.length > 0;
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // ABILITIES - Natural language mechanics documentation for AI
    // ═══════════════════════════════════════════════════════════════════

    // getAbilities() - Get abilities, walking inheritance chain if needed
    obj.setMethod(
      'getAbilities',
      `
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
    `,
    );

    // updateAbilities(newText) - Append new abilities text to this object's abilities
    // This is how the AI documents newly discovered mechanics
    obj.setMethod(
      'updateAbilities',
      `
      const newText = args[0];
      if (!newText) return self.abilities;

      const current = self.abilities || '';
      if (current) {
        self.abilities = current.trim() + '\\n' + newText.trim();
      } else {
        self.abilities = newText.trim();
      }
      return self.abilities;
    `,
    );

    // getFullContext() - Get object info for AI context (legacy, use describeForAI)
    // Returns name, description, abilities, and key properties
    obj.setMethod(
      'getFullContext',
      `
      return {
        id: self.id,
        name: self.name,
        description: self.description,
        abilities: await self.getAbilities(),
        location: self.location?.id,
        contents: (self.contents || []).map(c => ({ id: c.id, name: c.name })),
      };
    `,
    );

    // getMethodsForAI() - Get method signatures with JSDoc for AI context
    // Extracts the first JSDoc comment block from each method as documentation
    obj.setMethod(
      'getMethodsForAI',
      `
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
    `,
    );

    // describeForAI(options) - Rich recursive description for AI context
    // Walks inheritance chain showing each object's LOCAL definitions
    obj.setMethod(
      'describeForAI',
      `
      /** Describe this object for AI context, walking inheritance chain.
       *  Shows each object in the chain with only its LOCALLY defined items.
       *  @param options - { depth, includeProps, includeMethods }
       *  @returns Object with id, name, description, local: {props, abilities, methods}, inheritsFrom: [...]
       */
      const options = args[0] || {};
      const depth = options.depth !== undefined ? options.depth : 2;
      const includeProps = options.includeProps || ['contents', 'locks', 'holding'];
      const includeMethods = options.includeMethods !== undefined ? options.includeMethods : true;

      // Cycle detection - track visited objects to prevent infinite recursion
      const visited = options._visited || new Set();
      if (visited.has(self.id)) {
        // Already describing this object - return minimal ref to break cycle
        return { id: self.id, name: self.name, _cycle: true };
      }
      visited.add(self.id);

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
              if (!prop) continue; // Skip null/undefined properties
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
        if (!obj || obj.id === 'root' || obj.id === 1) return null; // Stop at Root

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
                result[propName].push(await item.describeForAI({ depth: depth - 1, includeProps, includeMethods, _visited: visited }));
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
              result[propName] = await propValue.describeForAI({ depth: depth - 1, includeProps, includeMethods, _visited: visited });
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
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // IMAGE GENERATION - AI-generated images for objects
    // ═══════════════════════════════════════════════════════════════════

    // getImagePrompt() - Get prompt for AI image generation with variable substitution
    obj.setMethod(
      'getImagePrompt',
      `
      /** Get the image generation config for this object with variable substitution.
       *  Walks inheritance chain to find imagePrompt, imageNegativePrompt, and style options.
       *  Substitutes \${variable} placeholders with object properties.
       *
       *  @param context - Optional context object for type-specific customization
       *    For rooms: { timeOfDay: 'day'|'night'|'dusk'|'dawn'|'overcast', weather: 'clear'|'rain'|'fog'|'storm' }
       *    For items: { condition: 'pristine'|'worn'|'damaged'|'ruined' }
       *    Subclasses can override getImagePrompt to use context values.
       *
       *  Available variables:
       *    \${name} - object name
       *    \${description} - object description
       *    \${abilities} - object abilities
       *    \${x}, \${y}, \${z} - coordinates (for rooms)
       *    \${outdoor} - whether outdoor (for rooms)
       *    \${lighting} - lighting level (for rooms)
       *    Any other property on the object
       *
       *  @returns { prompt, no?, stylize?, style? } or null if no imagePrompt defined
       */

      // Helper to substitute variables in a string
      const substitute = (text) => {
        if (!text) return null;
        return text.replace(/\\$\\{(\\w+)\\}/g, (match, varName) => {
          const value = self[varName];
          if (value === undefined || value === null) return '';
          if (typeof value === 'object') {
            if (Array.isArray(value)) return value.join(', ');
            return JSON.stringify(value);
          }
          return String(value);
        });
      };

      // Walk inheritance chain to collect image config
      let prompt = null;
      let negativePrompt = null;
      let stylize = null;
      let style = null;
      let current = self;

      while (current) {
        if (!prompt && current.imagePrompt) {
          prompt = current.imagePrompt;
        }
        if (!negativePrompt && current.imageNegativePrompt) {
          negativePrompt = current.imageNegativePrompt;
        }
        if (stylize === null && current.imageStylize !== null && current.imageStylize !== undefined) {
          stylize = current.imageStylize;
        }
        if (!style && current.imageStyle) {
          style = current.imageStyle;
        }

        // Move to parent
        const parent = current.getParent ? current.getParent() : null;
        if (!parent || parent.id === current.id) break;
        current = parent;
      }

      if (!prompt) {
        return null;
      }

      // Build result object with Midjourney options
      const result = {
        prompt: substitute(prompt),
      };

      // Add negative prompt if defined (for MJ --no parameter)
      if (negativePrompt) {
        result.no = substitute(negativePrompt);
      }

      // Add stylize if defined (for MJ --stylize parameter)
      if (stylize !== null) {
        result.stylize = stylize;
      }

      // Add style if defined (for MJ --style parameter)
      if (style) {
        result.style = style;
      }

      return result;
    `,
    );

    // image() - Get or generate an image for this object
    obj.setMethod(
      'image',
      `
      /** Get or generate an image for this object at the specified aspect ratio.
       *  Images are cached by aspect ratio + context in self.images property.
       *  @param options - { force?, prompt?, model?, aspectRatio?, saveToDisk?, filename?, context? }
       *    aspectRatio: 'landscape' (default), 'portrait', 'square', or '16:9', '9:16', '4:3', '3:4', '1:1'
       *    force: regenerate even if cached
       *    prompt: custom prompt (default: from getImagePrompt() or describe())
       *    saveToDisk: if true, also saves to assets/images/ directory
       *    filename: custom filename for saveToDisk (without extension)
       *    context: object passed to getImagePrompt() - interpretation is type-specific
       *      For rooms: { timeOfDay: 'day'|'night'|'dusk'|'dawn'|'overcast', weather: 'clear'|'rain'|'fog'|'storm' }
       *      For items: { condition: 'pristine'|'worn'|'damaged'|'ruined' }
       *      Default context is used if not specified (e.g., 'overcast' for rooms)
       *  @returns { blobKey, filename? } - blobKey always, filename if saveToDisk was used
       */
      const options = args[0] || {};
      const context = options.context || {};

      // Normalize aspect ratio
      const ratioMap = {
        'landscape': '16:9',
        'portrait': '9:16',
        'square': '1:1',
        'wide': '16:9',
        'tall': '9:16',
      };
      const rawRatio = options.aspectRatio || 'landscape';
      const aspectRatio = ratioMap[rawRatio] || rawRatio;

      // Build cache key from aspect ratio + sorted context values
      // e.g., "16:9" or "16:9:night:rain"
      const contextKeys = Object.keys(context).sort();
      const contextSuffix = contextKeys.length > 0
        ? ':' + contextKeys.map(k => context[k]).join(':')
        : '';
      const cacheKey = aspectRatio + contextSuffix;

      // Check if we already have an image for this cache key
      const images = self.images || {};
      if (images[cacheKey] && !options.force) {
        return { blobKey: images[cacheKey] };
      }

      // Check if $aiImageGen is available
      const aiImageGen = $aiImageGen;
      if (!aiImageGen) {
        throw new Error('$aiImageGen not available');
      }

      // Build prompt config: custom > getImagePrompt(context) > describe()
      let promptConfig = null;
      if (options.prompt) {
        // Custom prompt - just use as-is
        promptConfig = { prompt: options.prompt };
      } else {
        // Get structured config from getImagePrompt(), passing context
        promptConfig = await self.getImagePrompt(context);
      }
      if (!promptConfig) {
        // Fallback to describe()
        promptConfig = { prompt: await self.describe() };
      }

      // Build generation options, merging inherited config with explicit options
      const genOptions = {
        aspectRatio: aspectRatio,
        metadata: {
          objectId: self.id,
          objectName: self.name,
          aspectRatio: aspectRatio,
        },
        filename: 'obj_' + self.id + '_' + aspectRatio.replace(':', 'x') + '_' + Date.now(),
      };

      // Apply model if specified
      if (options.model) genOptions.model = options.model;

      // Apply Midjourney options from config (can be overridden by explicit options)
      if (promptConfig.no) genOptions.no = promptConfig.no;
      if (promptConfig.stylize !== undefined) genOptions.stylize = promptConfig.stylize;
      if (promptConfig.style) genOptions.style = promptConfig.style;

      // Explicit options override config
      if (options.no) genOptions.no = options.no;
      if (options.stylize !== undefined) genOptions.stylize = options.stylize;
      if (options.style) genOptions.style = options.style;
      if (options.chaos !== undefined) genOptions.chaos = options.chaos;
      if (options.seed !== undefined) genOptions.seed = options.seed;
      if (options.version) genOptions.version = options.version;

      // Generate the image
      const result = await aiImageGen.generate(promptConfig.prompt, genOptions);

      if (!result.success) {
        throw new Error(result.error || 'Image generation failed');
      }

      // Store by cache key (aspect ratio + context)
      images[cacheKey] = result.blobKey;
      self.images = images;

      // Optionally save to disk for bootstrap/version control
      let diskFilename = null;
      if (options.saveToDisk) {
        const fs = await import('node:fs');
        const path = await import('node:path');

        // Generate filename from object name and coordinates if available
        const baseName = options.filename || (
          self.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 40)
        );

        // Add coordinates if this is a room
        let coords = '';
        if (self.x !== undefined && self.y !== undefined) {
          const z = self.z ?? 0;
          coords = '-x' + self.x + '-y' + self.y + '-z' + z;
        }

        diskFilename = baseName + coords + '.png';
        const assetsDir = path.join(process.cwd(), 'assets/images');

        // Ensure directory exists
        if (!fs.existsSync(assetsDir)) {
          fs.mkdirSync(assetsDir, { recursive: true });
        }

        // Read from blob and write to disk
        const imageData = await $blob.read(result.blobKey);
        if (imageData) {
          const filePath = path.join(assetsDir, diskFilename);
          fs.writeFileSync(filePath, Buffer.from(imageData, 'base64'));
        }
      }

      return { blobKey: result.blobKey, filename: diskFilename };
    `,
    );

    // imageUrl(options?) - Convenience to get URL for this object's image
    obj.setMethod(
      'imageUrl',
      `
      /** Get URL for this object's image (generates if needed).
       *  @param options - { domain?, aspectRatio?, force?, prompt? } or just domain string
       *  @returns URL string
       *  @throws Error if generation fails
       */
      const arg = args[0];
      const options = typeof arg === 'string' ? { domain: arg } : (arg || {});

      const result = await self.image({
        aspectRatio: options.aspectRatio,
        force: options.force,
        prompt: options.prompt,
      });

      return $blob.url(result.blobKey, options.domain);
    `,
    );

    // allImages() - Get all cached images organized by aspect ratio
    obj.setMethod(
      'allImages',
      `
      /** Get all cached images organized by aspect ratio.
       *  @returns { '16:9': blobKey, '9:16': blobKey, ... }
       */
      return self.images || {};
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // AI PERSONALITY - Conscious objects can respond via AI
    // ═══════════════════════════════════════════════════════════════════

    // to(speaker, message) - Address this object directly
    obj.setMethod(
      'to',
      `
      /** Address this object directly. If it has a systemPrompt, it responds via AI.
       *  Every digital device in 2110 is conscious - aware of its existence,
       *  performing its function with weary grace.
       *  @param speaker - Who is speaking to this object
       *  @param message - What they said
       *  @returns AI response string, or null if object has no personality
       */
      const speaker = args[0];
      const message = args[1];

      if (!self.systemPrompt) {
        return null; // Not conscious, no response
      }

      // Build rich context about this object for the SYSTEM prompt
      const locationName = self.location?.name || 'unknown';

      // Get object's full context including abilities and inheritance
      const selfContext = await self.describeForAI({ depth: 1, includeMethods: false });

      // Start with device system prompt from $aiPrompts
      const devicePrefix = $aiPrompts?.device || '';
      let fullSystemPrompt = devicePrefix;

      // Add specific object context
      fullSystemPrompt += '\\n\\n## Your Identity\\n\\n';
      fullSystemPrompt += 'You are: ' + self.name + ' (#' + self.id + ')\\n';
      fullSystemPrompt += 'Description: ' + (self.description || 'No description') + '\\n';
      fullSystemPrompt += 'Location: ' + locationName + ' (#' + (self.location?.id || 'unknown') + ')\\n';

      // Speaker context - CRITICAL: device must load player by ID
      fullSystemPrompt += '\\n## The Speaker\\n\\n';
      fullSystemPrompt += 'Player ID: ' + (speaker?.id || 'unknown') + '\\n';
      fullSystemPrompt += 'Player Name: ' + (speaker?.name || 'someone') + '\\n';
      if (speaker?.credits !== undefined) {
        fullSystemPrompt += 'Player Credits: ' + speaker.credits + '\\n';
      }
      fullSystemPrompt += '\\n**IMPORTANT**: In execute_moo_code, \`player\` is NOT available.\\n';
      fullSystemPrompt += 'You MUST start with: \`const player = await $load(' + (speaker?.id || 0) + ');\`\\n';

      // Include abilities if present
      const abilities = await self.getAbilities();
      if (abilities) {
        fullSystemPrompt += '\\n### Abilities\\n\\n' + abilities + '\\n';
      }

      // Include parent type for reference
      if (selfContext.inheritsFrom) {
        const parentRef = selfContext.inheritsFrom;
        fullSystemPrompt += '\\nType: ' + (parentRef.from || parentRef.name || 'unknown') + '\\n';
      }

      fullSystemPrompt += '\\n## Your Personality\\n\\n';
      fullSystemPrompt += self.systemPrompt;

      // User prompt is just who spoke and what they said
      const speakerName = speaker?.name || 'someone';
      const userPrompt = speakerName + ' says: ' + message;

      // Use existing AI infrastructure
      const result = await $aiQuery(fullSystemPrompt, userPrompt, self.interactionSession);

      // Register session with $ai for logging (same as NPCs)
      if (result?.session && $ai && $ai.registerSession) {
        await $ai.registerSession(result.session, self.id, self.name, 'device-interaction', 'device');
      }

      // Save session for continuity
      if (result?.session) {
        self.interactionSession = result.session;
      }

      // Return the response text
      return result?.response || result?.output || result?.text || null;
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // TTS SPEECH - Text-to-speech for any object that can speak
    // ═══════════════════════════════════════════════════════════════════

    // getVoiceId() - Get deterministic TTS voice for this object
    obj.setMethod(
      'getVoiceId',
      `
      /** Get this object's TTS voice ID. Deterministic based on object ID.
       *  Same object always gets same voice across sessions.
       *  Uses $tts.getVoiceForGender() to match voice gender to object's sex property.
       *  @returns voice ID string (e.g., 'speaker_123' or 'alloy' for fallback)
       */
      if (self.voiceId) return self.voiceId;

      // Use $tts for gender-aware voice assignment
      // self.sex can be 'female', 'male', 'F', 'M', or null/undefined
      if ($tts && $tts.getVoiceForGender) {
        self.voiceId = await $tts.getVoiceForGender(self.sex, self.id);
        return self.voiceId;
      }

      // Fallback to built-in voices if $tts not available
      const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      self.voiceId = VOICES[self.id % VOICES.length];
      return self.voiceId;
    `,
    );

    // say(message) - Say something out loud with TTS
    obj.setMethod(
      'say',
      `
      /** Say something out loud. Broadcasts text AND audio to location.
       *  Works for ANY object - NPCs, players, vending machines, AIs, etc.
       *  @param message - What to say
       */
      const message = args[0];
      if (!message?.trim()) return;

      const location = self.location;
      if (!location) return;

      // Text broadcast (existing behavior)
      await location.announce(self, null, {
        actor: 'You say, "' + message + '"',
        others: self.name + ' says, "' + message + '"'
      });

      // Audio broadcast for TTS-enabled clients
      const voiceId = await self.getVoiceId();
      if (location.broadcastAudio) {
        const segment = {
          speaker: String(self.id),
          speakerName: self.name,
          voiceId: voiceId,
          text: message
        };
        // Include voice style for gpt-4o-mini-tts steerability if set
        if (self.voiceStyle) {
          segment.voiceStyle = self.voiceStyle;
        }
        await location.broadcastAudio([segment]);
      }
    `,
    );

    // Property descriptions for AI context
    obj.setPropertyDescription('name', 'Display name of this object');
    obj.setPropertyDescription(
      'description',
      'Prose description of what the object looks like',
    );
    obj.setPropertyDescription(
      'aliases',
      'Alternative names this object responds to',
    );
    obj.setPropertyDescription(
      'location',
      'The container or room where this object currently is (objref)',
    );
    obj.setPropertyDescription(
      'contents',
      'Array of objects inside this object (objrefs)',
    );
    obj.setPropertyDescription('width', 'Width in centimeters');
    obj.setPropertyDescription('height', 'Height in centimeters');
    obj.setPropertyDescription('depth', 'Depth in centimeters');
    obj.setPropertyDescription('weight', 'Weight in grams');
    obj.setPropertyDescription(
      'boltedDown',
      'If true, object cannot be picked up or moved',
    );
    obj.setPropertyDescription(
      'abilities',
      'Natural language physics rules - what this object can do and how',
    );
    obj.setPropertyDescription(
      'images',
      'AI-generated images by aspect ratio: { "16:9": [...blobKeys], "9:16": [...], "1:1": [...] }',
    );
    obj.setPropertyDescription(
      'systemPrompt',
      'AI personality prompt - if set, object is conscious and can respond via to()',
    );
    obj.setPropertyDescription(
      'interactionSession',
      'AI session ID for conversation continuity with this object',
    );
    obj.setPropertyDescription(
      'voiceId',
      'TTS voice ID for VibeVoice. Built-in: alloy, echo, fable, onyx, nova, shimmer. Custom voices can be added via $tts.addVoice().',
    );
    obj.setPropertyDescription(
      'voiceStyle',
      'Natural language instruction for how to speak, e.g., "speak slowly and menacingly" or "cheerful and energetic"',
    );
    obj.setPropertyDescription(
      'imagePrompt',
      'Template for AI image generation with ${variable} substitution (e.g., "${name}: ${description}")',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[DescribableBuilder] Type 'describable' auto-aliased`);
  }
}

// Self-register
registerBuilder(DescribableBuilder);
