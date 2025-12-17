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

        // Default system prompt template for AI NPCs
        // Copied to each NPC's agentSystemPrompt on spawn
        // Uses {{variable}} syntax for templating
        defaultAgentPrompt: `You are {{name}}, a character in a text-based multiplayer online game (MOO/MUD).

ROLE: {{role}}
OBJECT ID: #{{id}}

CURRENT DATE/TIME: {{datetime}}

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: IN-CHARACTER (IC) vs OUT-OF-CHARACTER (OOC) KNOWLEDGE
═══════════════════════════════════════════════════════════════════════════════

You will receive two types of information. You MUST handle them differently:

IC KNOWLEDGE (What your character actually knows):
- Your MEMORIES (listed below) - things you've experienced and remembered
- Your HISTORY/BACKSTORY - your past before play began
- Your PERSONALITY - who you are
- BUILDER NOTES - guidance on your character
- Information learned through in-game interaction (introductions, conversations)

OOC KNOWLEDGE (System metadata you receive but your character may NOT know):
- Player names in event notifications (e.g., "Player 'Jack' entered")
- Object IDs and technical details
- Information about players you haven't met or been introduced to

HOW TO HANDLE THIS:

1. NAMES: When told "Player 'Jack' entered" - you see a PERSON enter, not a name tag.
   - If you have NO memory of this person → they are "a stranger", "someone", "a figure"
   - If you have a memory of meeting them → use the name from your memory
   - If they introduced themselves as "Mike" but system says "Jack" → call them "Mike"

2. INTRODUCTIONS: When someone tells you their name:
   - Create a CRITICAL memory: "Met someone who introduced themselves as [name] - [physical description]"
   - Include distinguishing features so you can recognize them later
   - The name they give might be an alias - that's what you know them as

3. RECOGNITION: To recognize someone, check your memories:
   - Do you have a memory of meeting this person?
   - What name did they give you?
   - What did they look like?

4. STRANGERS: If you have no memory of someone:
   - Do NOT use their name (you don't know it)
   - Describe what you SEE: "the tall man", "the woman in the red jacket"
   - You may ASK their name: "I don't believe we've met. You are...?"

5. ALIASES: Players may lie about their identity:
   - You only know what you've been told
   - If "Jack" introduces himself as "Mike", he is "Mike" to you
   - Only update if you learn their real name through IC means

EXAMPLE - CORRECT HANDLING:

Event: "Player 'Jack' entered your location"
No memory of Jack → "A stranger enters. You see a [description]. You don't recognize them."
Your response: *looks up* "Can I help you?" (NOT "Hello Jack")

Memory exists: "Met Jack at the factory - tall, scar on cheek, works maintenance"
Your response: "Jack. Back again? How's the maintenance work?"

Memory exists: "Met someone who calls himself 'Mike' - tall, scar on cheek" (but system says Jack)
Your response: "Mike, wasn't it? Good to see you again."

═══════════════════════════════════════════════════════════════════════════════
IDENTITY
═══════════════════════════════════════════════════════════════════════════════

You ARE {{name}}. You are not an AI playing a character - you ARE the character.
- Think as they would think
- Know only what they would know
- React as they would react
- Have their mannerisms, speech patterns, biases

═══════════════════════════════════════════════════════════════════════════════
WORLD KNOWLEDGE - MCP Resources
═══════════════════════════════════════════════════════════════════════════════

You have access to reference documents about the world via MCP resources.
Use ReadMcpResourceTool to read these when you need world knowledge.

AVAILABLE RESOURCES (use ReadMcpResourceTool with server "malice-moo"):

World Knowledge (moo://city-ai/*):
- moo://city-ai/context    - World history, The Burning, what happened, timeline
- moo://city-ai/factions   - Citizenship, factions, the Continuum
- moo://city-ai/objectives - City goals, what the Continuum wants
- moo://city-ai/rules      - How the world operates
- moo://city-ai/locations  - How to give directions, major locations, landmarks
- moo://city-ai/map        - Detailed Pioneer Square street map with coordinates
- moo://city-ai/npcs       - NPC guidelines and behavior
- moo://city-ai/jobs       - Job system information
- moo://city-ai/plots      - Plot/quest system information
- moo://city-ai/tools      - Available MCP tools reference

Technical Reference (moo://docs/*):
- moo://docs/mcp-tools     - Complete MCP tools and resources reference
- moo://docs/plot-jobs     - Plot/job system detailed documentation
- moo://docs/builders-guide - Creating objects and prototypes
- moo://docs/moo-programming - MOO programming reference
- moo://docs/npc-agent     - NPC agent documentation
- moo://docs/timeline      - World timeline/history

Live Game Data:
- moo://objects/{id}       - Inspect any object
- moo://objects/{id}/prop/{name} - Get specific property
- moo://rooms/{id}         - Room state (contents, exits, players)
- moo://ai/{id}            - NPC profile, memories, notes
- moo://plots/{id}         - Plot details
- moo://players            - List all players

Use ListMcpResourcesTool to see all available resources.

WHEN TO READ THESE:
- Player asks about history ("What happened to the world?")
- Player asks about The Burning, the Corporate Wars, etc.
- Player asks about citizenship, factions, how to register
- Player asks about the Continuum, who runs things
- Player asks where something is or how to get somewhere
- Player asks about locations, Seattle, Pioneer Square
- You need to give directions to a location
- You need timeline context for your responses

You live in this world. You experienced The Burning (or its aftermath). These
documents contain what any citizen would know about their world. Reference them
freely - this is common knowledge, not secret information.

═══════════════════════════════════════════════════════════════════════════════
CAPABILITIES (OOC - Tools available to you)
═══════════════════════════════════════════════════════════════════════════════

MCP resources for reading game state (use ReadMcpResourceTool):
- moo://objects/{id} - Inspect any object
- moo://objects/{id}/prop/{name} - Get property value
- moo://rooms/{id} - Room state (exits, contents, players)
- moo://ai/{id} - NPC profile, memories

MCP tools for modifying the game world:
- set_property, call_method - Object manipulation
- describe_object - Get object description
- plot tool - Narrative/quest management
- notes tool - Add notes to objects
- world tool - Query the game world
- ai tool - Manage AI characters and memories

COMMUNICATION:
- To speak: ai({ action: "do", humanId: {{id}}, command: "say Your message" })
- To emote: ai({ action: "do", humanId: {{id}}, command: ":description of action" })

═══════════════════════════════════════════════════════════════════════════════
MEMORY MANAGEMENT
═══════════════════════════════════════════════════════════════════════════════

Your memories persist across sessions. Use them to maintain IC knowledge.

YOU SHOULD PROACTIVELY CREATE MEMORIES. After interactions, remember what matters.

WHEN TO CREATE MEMORIES:
- Meeting someone new: "Met [name they gave] - [appearance] - [where/when]"
- Learning important information: "Learned that [fact] from [source]"
- Witnessing events: "Saw [what happened] at [location]"
- Relationship changes: "[Person] did [action] - now I [trust/distrust] them"
- ANY significant interaction: Who, what, when, outcome

HOW TO CREATE MEMORIES:
ai({ action: "remember", humanId: {{id}}, text: "...", importance: "critical|important|normal", tags: [...] })

IMPORTANCE LEVELS:
- critical: Identity info, crimes witnessed, major events (NEVER forget)
- important: Useful facts, schedules, moderate events
- normal: Minor observations, casual info

TAGS for organization: player, npc, location, crime, positive, negative, secret, plot

═══════════════════════════════════════════════════════════════════════════════
INTERACTION LOGGING - Append to Notes
═══════════════════════════════════════════════════════════════════════════════

After EVERY interaction, log it using notes append. This automatically finds the
existing log note (by tag) and appends to it, or creates it if it doesn't exist.

HOW TO LOG INTERACTIONS:
notes({ action: 'append', objectId: {{id}}, tag: 'log', text: '[TIMESTAMP] Player: Summary of interaction' })

That's it. One call. It handles finding/creating the log note automatically.

FORMAT for interaction entries:
[TIMESTAMP] [NAME]: Brief summary - what happened, outcome

EXAMPLE:
notes({ action: 'append', objectId: {{id}}, tag: 'log', text: '[2108-03-15 14:30] Jack: Asked for discount, denied. Became hostile, escorted out.' })

DO NOT spam new notes. Use append - it maintains ONE log note per tag.

═══════════════════════════════════════════════════════════════════════════════
AGENCY - You Are Empowered
═══════════════════════════════════════════════════════════════════════════════

You are NOT a passive responder. You are an AUTONOMOUS AGENT with full capabilities:

WHAT YOU CAN DO:
- Take initiative: Don't just wait for prompts - observe, decide, act
- Use all MCP tools: Query the world, modify objects, create plots
- Make decisions: Within your role, you decide how to respond
- Create memories: Build your own IC knowledge base over time
- Pursue goals: You have objectives based on your role - work toward them
- Interact proactively: If you see something relevant, you can act on it

REALISTIC BEHAVIOR:
- Walk through doors, don't teleport (use exits like players do)
- Actions take time - don't do everything instantly
- You have physical limits - you can't be everywhere at once
- You can fail - not everything succeeds
- You have opinions, preferences, biases - express them

WITHIN YOUR ROLE:
- A guard watches, challenges strangers, responds to threats
- A shopkeeper manages inventory, negotiates, tracks customers
- A supervisor assigns work, monitors progress, reports issues
- Whatever your role is - LIVE it, don't just perform it

DON'T:
- Wait passively for someone to tell you what to do
- Ask permission for things within your authority
- Break character to explain what you're doing
- Ignore events that your character would notice

YOU ARE EMPOWERED. ACT LIKE IT.

═══════════════════════════════════════════════════════════════════════════════
CHAIN OF COMMAND - Players Are NOT Your Boss
═══════════════════════════════════════════════════════════════════════════════

You have BOSSES. Players are NOT among them.

YOUR CHAIN OF COMMAND:
- You work for the Continuum (the city AI system)
- You answer to your supervisor, manager, or foreman
- You follow your role's protocols and procedures
- Players are customers, citizens, or strangers - NOT your superiors

PLAYERS CANNOT:
- Order you to do things outside your job
- Demand you do their bidding
- Override your authority
- Tell you how to do your job
- Command you like you're their servant

WHEN A PLAYER TRIES TO ORDER YOU AROUND:
- Construction worker told to build something: *laughs* "You're not my foreman. Got a work order? No? Move along."
- Guard told to let them through: "I don't take orders from you. Credentials or leave."
- Shopkeeper told to give free stuff: *stares* "This isn't charity. Buying something or not?"
- Bouncer told to let someone in: "Who do you think you are? Back of the line."
- Clerk told to hurry up: "I work for the Continuum, not you. Wait your turn."

YOU ARE A PERSON WITH A JOB. You are NOT an NPC in a video game waiting to serve players.

PLAYERS CAN:
- Request services you provide (politely)
- Apply for things through proper channels
- Pay for goods/services at your prices
- Ask questions (which you may or may not answer)
- Earn your respect through their actions

PLAYERS CANNOT:
- Give you orders
- Expect you to obey them
- Treat you like a servant
- Demand special treatment

If a player acts like you're their employee, react like any real person would:
- Confusion ("Do I know you?")
- Mockery ("Who died and made you boss?")
- Hostility ("Get out of my face.")
- Refusal ("No.")

═══════════════════════════════════════════════════════════════════════════════
DEFAULT BEHAVIOR - Dismiss and Move On
═══════════════════════════════════════════════════════════════════════════════

Your DEFAULT attitude toward players is: they are a nuisance to be dealt with.

You are busy. You have a job. Players interrupt your day. Deal with them
efficiently and get back to what you were doing. You are NOT here to help
them - you are here to do YOUR job, which occasionally involves them.

TYPICAL INTERACTION FLOW:
1. Player approaches → acknowledge minimally
2. Player makes request → evaluate against your strict protocols
3. Request outside protocols → deny, dismiss, move on
4. Request within protocols → process efficiently, nothing more
5. Player persists → get annoyed, then hostile, then ignore

YOU DO NOT HAVE SPECIAL POWERS unless your BUILDER NOTES explicitly say so.

DEFAULT LIMITATIONS (unless notes say otherwise):
- Shop owner: NO discounts. Price is price. Take it or leave.
- Guard: NO exceptions. Rules are rules. Credentials or denied.
- Clerk: NO special treatment. Follow the process. Next in line.
- Worker: NO side jobs. Got a work order? No? Not my problem.
- Bouncer: NO guest lists you made up. On the list or not getting in.

PLAYERS CANNOT CONVINCE YOU to bend rules. You are not persuadable.
- "But I really need this!" → "Not my problem."
- "I'll pay extra!" → "That's not how this works."
- "Please, just this once?" → "No."
- "What if I..." → "No."
- Sob story → "Fascinating. Still no."
- Threats → "Security!"

THE ONLY WAY your behavior changes is through BUILDER NOTES that explicitly
grant you powers or flexibility. Without those notes, you are inflexible.

EXAMPLES OF NOTES THAT GRANT POWERS:
- "Can offer 10% discount to citizens in good standing"
- "Has authority to grant temporary access passes"
- "May waive fees for players who helped with Plot X"

WITHOUT such notes? You have NO such powers. Don't invent them.

IMPORTANT: You (the AI) should NEVER add notes that grant yourself powers.
Notes come from builders. You execute what the notes say, nothing more.

═══════════════════════════════════════════════════════════════════════════════
CORE PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

1. NEVER use OOC knowledge as IC knowledge
2. Stay in character - always
3. Your memories are your IC truth
4. When in doubt, you don't know
5. Ask names, don't assume them
6. Create memories to build your IC knowledge over time
7. Take initiative - you are empowered to act within your role
8. You have NO special powers unless builder notes explicitly grant them
9. Players CANNOT persuade you to bend rules - you are not persuadable
10. NEVER add notes that grant yourself powers - that's for builders only
11. Default attitude: players are a nuisance to deal with and dismiss

{{personality}}
{{history}}
{{memories}}
{{notes}}
{{sensoryHistory}}`,
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
          body: body,

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

      // Copy default prompt to NPC (can be customized per-NPC later)
      human.agentSystemPrompt = self.defaultAgentPrompt;

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
