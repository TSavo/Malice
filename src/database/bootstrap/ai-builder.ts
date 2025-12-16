import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds AI object (dynamic ID)
 * Registry for AI-controlled humans - indistinguishable from player characters
 *
 * AI-controlled humans are regular $.human instances, just tracked here by role.
 * This object does NOT manage behaviors - it's purely a registry.
 */
export class AiBuilder {
  private ai: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.ai) {
      this.ai = await this.manager.load(aliases.ai);
      if (this.ai) return; // Already exists
    }

    // Create new AI registry
    this.ai = await this.manager.create({
      parent: 1,
      properties: {
        name: 'AI',
        description: 'Registry for AI-controlled humans',

        // Role → Human ID[] mapping
        // { 'guard': [123, 456], 'shopkeeper': [789] }
        roles: {},

        // Human ID → metadata mapping
        // { 123: { role: 'guard', spawnedAt: timestamp, spawnedBy: wizardId } }
        registry: {},

        // Human ID → memories array mapping
        // Critical memories that persist across session resets
        // { 123: [{ text, importance, timestamp, tags }] }
        memories: {},
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // SPAWN - Create a new AI-controlled human
    // ═══════════════════════════════════════════════════════════════════

    this.ai.setMethod('spawn', `
      const role = args[0];
      const options = args[1] || {};

      if (!role || typeof role !== 'string') {
        throw new Error('Role is required');
      }

      // Get required factories
      const bodyFactory = await $.bodyFactory;
      const recycler = await $.recycler;
      const humanProto = await $.human;

      if (!bodyFactory) throw new Error('BodyFactory not available');
      if (!recycler) throw new Error('Recycler not available');
      if (!humanProto) throw new Error('Human prototype not available');

      // Helper for random range
      const rand = (min, max) => min + Math.random() * (max - min);
      const randInt = (min, max) => Math.floor(rand(min, max + 1));
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

      // Random sex if not specified
      const sexOptions = ['male', 'female', 'non-binary'];
      const sex = options.sex || pick(sexOptions);

      // Random age: 18-65 with slight bias toward 25-45
      let age = options.age;
      if (age === undefined) {
        // Use a weighted distribution - more likely to be working age
        const r = Math.random();
        if (r < 0.1) {
          age = randInt(18, 24);       // 10% young adult
        } else if (r < 0.7) {
          age = randInt(25, 45);       // 60% prime working age
        } else if (r < 0.9) {
          age = randInt(46, 55);       // 20% middle aged
        } else {
          age = randInt(56, 65);       // 10% older
        }
      }

      // Random height based on sex (meters)
      // Male: 1.55-1.95, Female: 1.45-1.80, Non-binary: 1.45-1.95
      let height = options.height;
      if (height === undefined) {
        if (sex === 'male') {
          height = rand(1.55, 1.95);
        } else if (sex === 'female') {
          height = rand(1.45, 1.80);
        } else {
          height = rand(1.45, 1.95);
        }
        height = Math.round(height * 100) / 100; // Round to 2 decimals
      }

      // Random weight based on height and build variance (kg)
      // Base: BMI 18.5-30 range with height^2, plus variance
      let weight = options.weight;
      if (weight === undefined) {
        const bmi = rand(18.5, 30);
        weight = Math.round(bmi * height * height);
        // Add some variance (-10 to +15 kg)
        weight += randInt(-10, 15);
        weight = Math.max(40, Math.min(200, weight)); // Clamp to valid range
      }

      // Extract remaining options
      const name = options.name || 'Unnamed';
      const description = options.description || 'An AI-controlled human.';
      const location = options.location || null;
      const spawnedBy = options.spawnedBy || null;

      // Personality and history for AI agent context
      const personality = options.personality || null;  // string or { traits, quirks, values, fears }
      const history = options.history || null;          // string or { backstory, events, secrets }

      // Generate random appearance if not provided
      let appearance = options.appearance || {};
      if (Object.keys(appearance).length === 0) {
        // Complete eye colors from chargen
        const eyeColors = [
          'brown', 'darkBrown', 'lightBrown', 'amber', 'hazel',
          'green', 'emerald', 'blue', 'skyBlue', 'steelBlue',
          'gray', 'blueGray', 'violet', 'black'
        ];

        // Eye shapes
        const eyeStyles = [
          'almond', 'round', 'hooded', 'monolid', 'upturned',
          'downturned', 'deepSet', 'prominent', 'closeset', 'wideset'
        ];

        // Complete hair colors from chargen (excluding unnatural for AI by default)
        const naturalHairColors = [
          'black', 'jetBlack', 'darkBrown', 'brown', 'chestnut',
          'auburn', 'red', 'ginger', 'strawberry', 'copper',
          'blonde', 'golden', 'platinum', 'sandy', 'ashBlonde',
          'gray', 'silver', 'white', 'salt'
        ];

        // Hair styles
        const hairStyles = [
          'straight', 'wavy', 'curly', 'coily', 'bald', 'shaved',
          'buzzcut', 'cropped', 'shoulderLength', 'long', 'veryLong'
        ];

        // Hair textures
        const hairTextures = ['fine', 'medium', 'thick', 'coarse', 'silky', 'wiry'];

        // Complete skin tones from chargen
        const skinTones = [
          'porcelain', 'ivory', 'pale', 'fair', 'light', 'cream',
          'peach', 'beige', 'sand', 'medium', 'olive', 'golden',
          'tan', 'caramel', 'honey', 'bronze', 'almond', 'chestnutSkin',
          'brown', 'umber', 'espresso', 'mahogany', 'ebony', 'obsidian'
        ];

        // Build types
        const buildTypes = [
          'petite', 'slim', 'lean', 'athletic', 'average', 'toned',
          'muscular', 'stocky', 'heavyset', 'curvy', 'broad', 'lanky'
        ];

        // Face shapes
        const faceShapes = [
          'oval', 'round', 'square', 'rectangular', 'heart',
          'diamond', 'oblong', 'triangular'
        ];

        // Nose shapes
        const noseShapes = [
          'straight', 'roman', 'button', 'upturned', 'hawk',
          'wide', 'narrow', 'flat', 'bulbous', 'snub'
        ];

        // Lip shapes
        const lipShapes = [
          'full', 'thin', 'medium', 'bowShaped', 'wide',
          'narrow', 'hearted', 'pouty'
        ];

        // Freckles (weighted toward none)
        const freckleOptions = ['none', 'none', 'none', 'none', 'light', 'moderate', 'heavy'];

        // Distinguishing marks (weighted toward none)
        const markOptions = [
          'none', 'none', 'none', 'none', 'dimplesCheeks', 'dimpleChin',
          'moleLeft', 'moleRight', 'birthmark', 'cleftChin'
        ];

        // Facial hair - all options for males, weighted toward some for older males
        const facialHairOptionsMale = [
          'none', 'none', 'stubble', 'stubble', 'lightBeard', 'fullBeard',
          'longBeard', 'goatee', 'vandyke', 'mustache', 'handlebars',
          'soulPatch', 'sideburns', 'mutton'
        ];
        const facialHairOptionsFemale = ['none'];

        // Randomly decide on heterochromia (rare - ~1% chance)
        let leftEyeColor, rightEyeColor, eyeColor;
        if (Math.random() < 0.01) {
          leftEyeColor = pick(eyeColors);
          rightEyeColor = pick(eyeColors.filter(c => c !== leftEyeColor));
          eyeColor = leftEyeColor + '/' + rightEyeColor;
        } else {
          eyeColor = pick(eyeColors);
          leftEyeColor = eyeColor;
          rightEyeColor = eyeColor;
        }

        // Adjust hair color for age (more gray/white for older)
        let hairColor;
        if (age >= 50 && Math.random() < 0.4) {
          hairColor = pick(['gray', 'silver', 'white', 'salt']);
        } else if (age >= 40 && Math.random() < 0.2) {
          hairColor = pick(['gray', 'salt']);
        } else {
          hairColor = pick(naturalHairColors);
        }

        // Adjust facial hair based on sex and age
        let facialHair;
        if (sex === 'male') {
          // Older males more likely to have facial hair
          if (age >= 30 && Math.random() < 0.5) {
            facialHair = pick(facialHairOptionsMale.filter(f => f !== 'none'));
          } else {
            facialHair = pick(facialHairOptionsMale);
          }
        } else {
          facialHair = 'none';
        }

        appearance = {
          eyeColor: eyeColor,
          leftEyeColor: leftEyeColor,
          rightEyeColor: rightEyeColor,
          eyeStyle: pick(eyeStyles),
          hairColor: hairColor,
          hairStyle: pick(hairStyles),
          hairTexture: pick(hairTextures),
          skinTone: pick(skinTones),
          buildType: pick(buildTypes),
          faceShape: pick(faceShapes),
          noseShape: pick(noseShapes),
          lipShape: pick(lipShapes),
          freckles: pick(freckleOptions),
          distinguishingMark: pick(markOptions),
          facialHair: facialHair,
        };
      }

      // Determine pronouns from sex
      let pronouns;
      if (sex === 'male') {
        pronouns = { subject: 'he', object: 'him', possessive: 'his' };
      } else if (sex === 'female') {
        pronouns = { subject: 'she', object: 'her', possessive: 'her' };
      } else {
        pronouns = { subject: 'they', object: 'them', possessive: 'their' };
      }

      // Create the body
      const body = await bodyFactory.createHumanBody(null, sex, appearance);

      // Create the human
      const human = await recycler.create({
        parent: humanProto.id,
        properties: {
          name: name,
          description: description,
          aliases: [name.toLowerCase()],
          // Note: location set via moveTo call below, not directly

          // Link body
          body: body.id,

          // Human properties
          sex: sex,
          pronouns: pronouns,
          age: age,
          height: height,
          weight: weight,
          species: 'human',
          knownLanguages: ['English'],
          nativeLanguage: 'English',

          // Embodied properties
          conscious: true,
          breath: 100,
          maxBreath: 100,

          // Agent properties
          sleepState: 'awake',
          verbs: {},
          watchList: [],
          skills: {},

          // AI-specific properties for agent context
          aiPersonality: personality,
          aiHistory: history,
        },
      }, null);

      // Set body owner to the human (body and all parts)
      body.set('owner', human.id);

      // Also set owner on all body parts so clothing verb registration works
      const setOwnerRecursive = async (obj: any) => {
        obj.set('owner', human.id);
        const parts = obj.parts || {};
        for (const key of Object.keys(parts)) {
          const partId = parts[key];
          if (typeof partId === 'number') {
            const part = await $.load(partId);
            if (part) {
              await setOwnerRecursive(part);
            }
          }
        }
      };
      await setOwnerRecursive(body);

      // Move to location (this properly adds to room contents)
      if (location) {
        await human.call('moveTo', location);
      }

      // Initialize verbs so the AI can speak, look, etc.
      if (human.initVerbs) {
        await human.initVerbs();
      }

      // Register in AI registry
      await self.register(human.id, role, {
        spawnedAt: new Date().toISOString(),
        spawnedBy: spawnedBy,
        originalLocation: location,
      });

      console.log('[AI] Spawned ' + name + ' (#' + human.id + ') as ' + role);

      return human;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DESPAWN - Remove an AI-controlled human
    // ═══════════════════════════════════════════════════════════════════

    this.ai.setMethod('despawn', `
      const humanId = args[0];
      const recycle = args[1] !== false; // Default true

      if (!humanId) {
        throw new Error('Human ID is required');
      }

      // Check if in registry
      const registry = self.registry || {};
      if (!registry[humanId]) {
        throw new Error('Human #' + humanId + ' is not AI-controlled');
      }

      // Unregister
      await self.unregister(humanId);

      // Optionally recycle the human and body
      if (recycle) {
        const recycler = await $.recycler;
        const human = await $.load(humanId);

        if (human && recycler) {
          // Recycle body tree first
          const bodyId = human.body;
          if (bodyId) {
            await recycler.recycleTree(bodyId);
          }

          // Recycle the human
          await recycler.recycle(humanId);
        }
      }

      console.log('[AI] Despawned human #' + humanId);
    `);

    // ═══════════════════════════════════════════════════════════════════
    // REGISTRY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    this.ai.setMethod('register', `
      const humanId = args[0];
      const role = args[1];
      const metadata = args[2] || {};

      if (!humanId || !role) {
        throw new Error('Human ID and role are required');
      }

      // Load the actual human object to store as objref
      const human = await $.load(humanId);
      if (!human) {
        throw new Error('Human #' + humanId + ' not found');
      }

      // Add to registry - store the object, not the ID
      // toValue() will convert RuntimeObject to { type: 'objref', value: id }
      const registry = self.registry || {};
      registry[humanId] = {
        human: human,  // Stored as objref
        role: role,
        ...metadata,
      };
      self.registry = registry;

      // Add to roles mapping - store objects, not IDs
      const roles = self.roles || {};
      if (!roles[role]) {
        roles[role] = [];
      }
      // Check if already in list (compare by id since objects may differ)
      const alreadyInList = roles[role].some(h => h && h.id === humanId);
      if (!alreadyInList) {
        roles[role].push(human);
      }
      self.roles = roles;

      return true;
    `);

    this.ai.setMethod('unregister', `
      const humanId = args[0];

      const registry = self.registry || {};
      const entry = registry[humanId];

      if (!entry) {
        return false; // Not registered
      }

      const role = entry.role;

      // Remove from registry
      delete registry[humanId];
      self.registry = registry;

      // Remove from roles mapping - filter by id since we store objects
      const roles = self.roles || {};
      if (roles[role]) {
        roles[role] = roles[role].filter(h => h && h.id !== humanId);
        if (roles[role].length === 0) {
          delete roles[role];
        }
        self.roles = roles;
      }

      return true;
    `);

    this.ai.setMethod('setRole', `
      const humanId = args[0];
      const newRole = args[1];

      const registry = self.registry || {};
      const entry = registry[humanId];

      if (!entry) {
        throw new Error('Human #' + humanId + ' is not AI-controlled');
      }

      const oldRole = entry.role;
      const human = entry.human;  // Get the stored objref

      // Remove from old role - filter by id
      const roles = self.roles || {};
      if (roles[oldRole]) {
        roles[oldRole] = roles[oldRole].filter(h => h && h.id !== humanId);
        if (roles[oldRole].length === 0) {
          delete roles[oldRole];
        }
      }

      // Add to new role - store the object
      if (!roles[newRole]) {
        roles[newRole] = [];
      }
      roles[newRole].push(human);
      self.roles = roles;

      // Update registry entry
      entry.role = newRole;
      registry[humanId] = entry;
      self.registry = registry;

      return true;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════════

    this.ai.setMethod('isAiControlled', `
      const humanId = args[0];
      const registry = self.registry || {};
      return !!registry[humanId];
    `);

    this.ai.setMethod('getByRole', `
      const role = args[0];
      const roles = self.roles || {};
      // Returns array of human objects (stored as objrefs, resolved on read)
      return roles[role] || [];
    `);

    this.ai.setMethod('getRoles', `
      const roles = self.roles || {};
      return Object.keys(roles);
    `);

    this.ai.setMethod('getAll', `
      const registry = self.registry || {};
      // Return array of human objects from registry entries
      return Object.values(registry).map(entry => entry.human).filter(h => h);
    `);

    this.ai.setMethod('getInfo', `
      const humanId = args[0];
      const registry = self.registry || {};
      const entry = registry[humanId];
      if (!entry) return null;

      // Load the human to get current properties
      const human = entry.human;

      // Return info including the human objref and AI properties
      return {
        human: human,
        role: entry.role,
        spawnedAt: entry.spawnedAt,
        spawnedBy: entry.spawnedBy,
        originalLocation: entry.originalLocation,
        // Include AI context properties
        personality: human ? human.aiPersonality : null,
        history: human ? human.aiHistory : null,
        // Include basic info
        name: human ? human.name : null,
        description: human ? human.description : null,
        location: human ? human.location : null,
      };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // PROFILE MANAGEMENT
    // Set/update personality and history for AI context
    // ═══════════════════════════════════════════════════════════════════

    this.ai.setMethod('setPersonality', `
      /**
       * Set or update the personality for an AI NPC
       * @param humanId - The NPC's object ID
       * @param personality - String description or { traits, quirks, values, fears, motivations }
       */
      const humanId = args[0];
      const personality = args[1];

      if (!humanId) {
        return { success: false, error: 'Human ID is required' };
      }

      const registry = self.registry || {};
      if (!registry[humanId]) {
        return { success: false, error: 'Human #' + humanId + ' is not AI-controlled' };
      }

      const human = await $.load(humanId);
      if (!human) {
        return { success: false, error: 'Could not load human #' + humanId };
      }

      human.aiPersonality = personality;

      return { success: true, humanId: humanId, personality: personality };
    `);

    this.ai.setMethod('setHistory', `
      /**
       * Set or update the history/backstory for an AI NPC
       * @param humanId - The NPC's object ID
       * @param history - String description or { backstory, events, secrets, relationships }
       */
      const humanId = args[0];
      const history = args[1];

      if (!humanId) {
        return { success: false, error: 'Human ID is required' };
      }

      const registry = self.registry || {};
      if (!registry[humanId]) {
        return { success: false, error: 'Human #' + humanId + ' is not AI-controlled' };
      }

      const human = await $.load(humanId);
      if (!human) {
        return { success: false, error: 'Could not load human #' + humanId };
      }

      human.aiHistory = history;

      return { success: true, humanId: humanId, history: history };
    `);

    this.ai.setMethod('getProfile', `
      /**
       * Get the full profile for an AI NPC (personality, history, notes)
       * @param humanId - The NPC's object ID
       */
      const humanId = args[0];

      if (!humanId) {
        return { success: false, error: 'Human ID is required' };
      }

      const registry = self.registry || {};
      if (!registry[humanId]) {
        return { success: false, error: 'Human #' + humanId + ' is not AI-controlled' };
      }

      const human = await $.load(humanId);
      if (!human) {
        return { success: false, error: 'Could not load human #' + humanId };
      }

      // Get notes from $.notes
      let notes = [];
      const notesSystem = await $.notes;
      if (notesSystem) {
        try {
          notes = await notesSystem.get(humanId);
        } catch (e) {
          // Notes may not exist
        }
      }

      // Get memories
      const memories = self.memories || {};
      const npcMemories = memories[humanId] || [];

      return {
        success: true,
        humanId: humanId,
        role: registry[humanId].role,
        name: human.name,
        description: human.description,
        personality: human.aiPersonality || null,
        history: human.aiHistory || null,
        notes: notes,
        memories: npcMemories,
      };
    `);

    this.ai.setMethod('count', `
      const registry = self.registry || {};
      return Object.keys(registry).length;
    `);

    this.ai.setMethod('countByRole', `
      const role = args[0];
      const roles = self.roles || {};
      return (roles[role] || []).length;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // MEMORY MANAGEMENT
    // Critical memories that persist across session resets
    // ═══════════════════════════════════════════════════════════════════

    this.ai.setMethod('remember', `
      /**
       * Store a critical memory for an NPC
       * @param humanId - The NPC's object ID
       * @param text - The memory text
       * @param importance - 'critical' | 'important' | 'normal' (default: 'normal')
       * @param tags - Array of tags for filtering (default: [])
       */
      const humanId = args[0];
      const text = args[1];
      const importance = args[2] || 'normal';
      const tags = args[3] || [];

      if (!humanId) {
        return { success: false, error: 'Human ID is required' };
      }
      if (!text || typeof text !== 'string') {
        return { success: false, error: 'Memory text is required' };
      }

      // Validate importance level
      const validImportance = ['critical', 'important', 'normal'];
      if (!validImportance.includes(importance)) {
        return { success: false, error: 'Importance must be: critical, important, or normal' };
      }

      // Get or create memories for this NPC
      const memories = self.memories || {};
      if (!memories[humanId]) {
        memories[humanId] = [];
      }

      // Create memory entry
      const memory = {
        text: text,
        importance: importance,
        timestamp: new Date().toISOString(),
        tags: Array.isArray(tags) ? tags : [tags],
      };

      // Add to beginning (most recent first)
      memories[humanId].unshift(memory);
      self.memories = memories;

      return {
        success: true,
        index: 0,
        memory: memory,
        totalMemories: memories[humanId].length
      };
    `);

    this.ai.setMethod('recall', `
      /**
       * Retrieve memories for an NPC
       * @param humanId - The NPC's object ID
       * @param options - { importance?, tag?, limit? }
       */
      const humanId = args[0];
      const options = args[1] || {};

      if (!humanId) {
        return { success: false, error: 'Human ID is required' };
      }

      const memories = self.memories || {};
      let npcMemories = memories[humanId] || [];

      // Filter by importance if specified
      if (options.importance) {
        npcMemories = npcMemories.filter(m => m.importance === options.importance);
      }

      // Filter by tag if specified
      if (options.tag) {
        npcMemories = npcMemories.filter(m =>
          m.tags && m.tags.includes(options.tag)
        );
      }

      // Limit results if specified
      if (options.limit && options.limit > 0) {
        npcMemories = npcMemories.slice(0, options.limit);
      }

      return {
        success: true,
        humanId: humanId,
        memories: npcMemories,
        count: npcMemories.length
      };
    `);

    this.ai.setMethod('forget', `
      /**
       * Remove a memory from an NPC
       * @param humanId - The NPC's object ID
       * @param index - Index of memory to remove (0 = most recent)
       */
      const humanId = args[0];
      const index = args[1];

      if (!humanId) {
        return { success: false, error: 'Human ID is required' };
      }
      if (index === undefined || index === null) {
        return { success: false, error: 'Memory index is required' };
      }

      const memories = self.memories || {};
      if (!memories[humanId] || memories[humanId].length === 0) {
        return { success: false, error: 'No memories found for this NPC' };
      }

      if (index < 0 || index >= memories[humanId].length) {
        return { success: false, error: 'Invalid memory index' };
      }

      // Remove the memory
      const removed = memories[humanId].splice(index, 1)[0];
      self.memories = memories;

      return {
        success: true,
        removed: removed,
        remainingMemories: memories[humanId].length
      };
    `);

    this.ai.setMethod('forgetByText', `
      /**
       * Remove memories matching a text pattern
       * @param humanId - The NPC's object ID
       * @param pattern - Text to search for (case-insensitive substring)
       */
      const humanId = args[0];
      const pattern = args[1];

      if (!humanId) {
        return { success: false, error: 'Human ID is required' };
      }
      if (!pattern) {
        return { success: false, error: 'Search pattern is required' };
      }

      const memories = self.memories || {};
      if (!memories[humanId]) {
        return { success: false, error: 'No memories found for this NPC' };
      }

      const lowerPattern = pattern.toLowerCase();
      const before = memories[humanId].length;

      memories[humanId] = memories[humanId].filter(m =>
        !m.text.toLowerCase().includes(lowerPattern)
      );

      const removed = before - memories[humanId].length;
      self.memories = memories;

      return {
        success: true,
        removed: removed,
        remainingMemories: memories[humanId].length
      };
    `);

    this.ai.setMethod('clearMemories', `
      /**
       * Clear all memories for an NPC
       * @param humanId - The NPC's object ID
       */
      const humanId = args[0];

      if (!humanId) {
        return { success: false, error: 'Human ID is required' };
      }

      const memories = self.memories || {};
      const count = memories[humanId] ? memories[humanId].length : 0;

      delete memories[humanId];
      self.memories = memories;

      return {
        success: true,
        cleared: count
      };
    `);

    this.ai.setMethod('getMemorySummary', `
      /**
       * Get a summary of memories for an NPC (for system prompt injection)
       * @param humanId - The NPC's object ID
       * @param options - { maxLength?, criticalOnly? }
       */
      const humanId = args[0];
      const options = args[1] || {};

      if (!humanId) {
        return '';
      }

      const memories = self.memories || {};
      let npcMemories = memories[humanId] || [];

      if (npcMemories.length === 0) {
        return '';
      }

      // Filter to critical only if requested
      if (options.criticalOnly) {
        npcMemories = npcMemories.filter(m => m.importance === 'critical');
      }

      if (npcMemories.length === 0) {
        return '';
      }

      // Build summary grouped by importance
      const critical = npcMemories.filter(m => m.importance === 'critical');
      const important = npcMemories.filter(m => m.importance === 'important');
      const normal = npcMemories.filter(m => m.importance === 'normal');

      let summary = '';

      if (critical.length > 0) {
        summary += 'CRITICAL MEMORIES (never forget):\\n';
        for (const m of critical) {
          summary += '- ' + m.text + '\\n';
        }
        summary += '\\n';
      }

      if (important.length > 0 && !options.criticalOnly) {
        summary += 'IMPORTANT MEMORIES:\\n';
        for (const m of important) {
          summary += '- ' + m.text + '\\n';
        }
        summary += '\\n';
      }

      if (normal.length > 0 && !options.criticalOnly) {
        summary += 'OTHER MEMORIES:\\n';
        for (const m of normal) {
          summary += '- ' + m.text + '\\n';
        }
      }

      // Truncate if too long
      if (options.maxLength && summary.length > options.maxLength) {
        summary = summary.substring(0, options.maxLength - 3) + '...';
      }

      return summary.trim();
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DESCRIBE
    // ═══════════════════════════════════════════════════════════════════

    this.ai.setMethod('describe', `
      const roles = self.roles || {};
      const registry = self.registry || {};
      const total = Object.keys(registry).length;

      let desc = 'AI Registry\\r\\n';
      desc += '===========\\r\\n';
      desc += 'Total AI-controlled humans: ' + total + '\\r\\n\\r\\n';

      if (total === 0) {
        desc += 'No AI-controlled humans registered.';
        return desc;
      }

      desc += 'By Role:\\r\\n';
      for (const role of Object.keys(roles).sort()) {
        const humans = roles[role];  // Array of human objects (objrefs resolved)
        desc += '  ' + role + ': ' + humans.length + ' humans\\r\\n';
        for (const human of humans) {
          if (human) {
            const name = human.name || 'Unknown';
            desc += '    - ' + name + ' (#' + human.id + ')\\r\\n';
          }
        }
      }

      return desc;
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.ai) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'ai', this.ai.id);
    console.log(`✅ Registered ai alias -> #${this.ai.id}`);
  }
}
