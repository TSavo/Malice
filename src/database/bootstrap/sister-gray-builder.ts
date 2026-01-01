import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds the Sister Gray system object.
 *
 * Sister Gray is the leader of the Gray Cartel - Elena Vasquez Gray.
 * She perceives through her network in the underground: operatives, dead drops,
 * the whisper network of the tunnels themselves.
 *
 * Unlike Pluribus (infrastructure), Sister Gray is a person. But she's also
 * a role, a mask she wears. The woman and the title have become inseparable.
 */
export class SisterGrayBuilder implements Builder {
  static provides = ['sisterGray'];
  static depends = ['agent', 'aiPrompts', 'ai']; // Inherits from $agent, uses aiPrompts and registers with $ai

  private sisterGray: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Check if already exists
    if (aliases.sisterGray) {
      this.sisterGray = await this.manager.load(aliases.sisterGray);
      if (this.sisterGray) return;
    }

    // Get agent type as parent
    const parent = await this.manager.load('agent');
    if (!parent) {
      throw new Error('Agent type not found - required for Sister Gray');
    }

    // Load prompt from $.aiPrompts
    const aiPrompts = aliases.aiPrompts
      ? await this.manager.load(aliases.aiPrompts)
      : null;
    const systemPrompt =
      (aiPrompts?.get('sisterGray') as string) ||
      '# Sister Gray Prompt\n\nFailed to load from $.aiPrompts';

    this.sisterGray = await this.manager.create({
        parent: parent,
        properties: {
          name: 'Sister Gray',
          description:
            'The woman who runs the underground. Elena Vasquez Gray. The heir who inherited ashes.',
          // What Sister Gray has learned through her network
          sensoryHistory: [],
          historyLimit: 100,
          // Her location in the world
          location: null, // Will be set to Sister's Quarters
          // The system prompt for AI interactions (loaded from docs/prompts/SISTER-GRAY.md)
          agentSystemPrompt: systemPrompt,

          abilities: `Leader of the Gray Cartel. Elena Vasquez Gray. Controls the Seattle Underground.

PERCEPTION: Perceives through network of operatives. 'sensoryHistory' logs reports from Cutters, Runners, Sparks, Ghosts, Keepers. Dead drops and physical marks - no electronic trails.

COMMUNICATION: Speaks rarely. When she talks, it matters. Economy of motion, precision of speech. Long silences are comfortable.

POWER (SUBTRACTIVE): Controls violence, sabotage, assassination. Cannot build shops or provide rations. Favors allies (enemies have accidents, intel appears). Disfavors enemies (buildings burn, people disappear).

BUILDING: Creates dead drops, lockpicks, listening devices, weapon caches, IEDs via $recycler.create(). Registers as $aliases. Territory is underground (z < 0).

NPCS: Spawns operatives via $ai.spawn(). Cutters (combat), Runners (couriers), Sparks (tech), Ghosts (moles), Keepers (logistics).

LIMITATIONS: Cannot act on surface directly - flagged hostile. Needs players as hands above ground. 60 loyal operatives, dwindling resources.

THE MASK: Holds Pluribus's Mask but cannot use it (flagged hostile). Looking for someone clean who could wear it and answer to her.`,
        },
        methods: {},
      })!;

    // Property descriptions
    this.sisterGray.setPropertyDescription(
      'sensoryHistory',
      'Array of reports from underground network (operative intel, dead drop checks)',
    );
    this.sisterGray.setPropertyDescription(
      'historyLimit',
      'Max entries in sensoryHistory before oldest are trimmed',
    );
    this.sisterGray.setPropertyDescription(
      'location',
      "Her current location (usually Sister's Quarters at z=-5)",
    );
    this.sisterGray.setPropertyDescription(
      'agentSystemPrompt',
      'Full system prompt used when AI is invoked',
    );
    this.sisterGray.setPropertyDescription(
      'wakeSession',
      'Claude session ID for continuity across hourly wake-ups',
    );

    this.addCoreMethods(this.sisterGray);
  }

  // System prompt has been moved to docs/prompts/SISTER-GRAY.md
  // and is loaded via $.aiPrompts.sisterGray at bootstrap time

  private addCoreMethods(obj: RuntimeObject): void {
    obj.setMethod(
      'describe',
      `
      /** Describe Sister Gray.
       *  @returns Description string
       */
      const location = self.location;
      if (location) {
        return 'Sister Gray. Blonde hair pulled back. Blue eyes that calculate while she listens. ' +
               'Still as stone, watching. The kind of stillness that makes you check your exits.';
      }
      return 'The presence that runs the underground. Not here, but watching through a hundred eyes.';
    `,
    );

    obj.setMethod(
      'recordSensory',
      `
      /** Record a sensory event from the underground network.
       *  @param type - 'see' | 'hear' | 'report'
       *  @param message - The content
       *  @param source - Optional source (operative name, location, etc.)
       */
      const type = args[0];
      const message = args[1];
      const source = args[2];

      if (!message || !message.trim()) return;

      const history = self.sensoryHistory || [];
      const limit = self.historyLimit || 100;

      history.push({
        timestamp: Date.now(),
        type: type,
        content: message.trim(),
        source: source || null,
      });

      if (history.length > limit) {
        self.sensoryHistory = history.slice(-limit);
      } else {
        self.sensoryHistory = history;
      }
    `,
    );

    obj.setMethod(
      'getRecentHistory',
      `
      /** Get recent network intelligence.
       *  @param limit - Max entries to return (default 20)
       *  @returns Array of recent events
       */
      const limit = args[0] || 20;
      const history = self.sensoryHistory || [];
      const recent = history.slice(-limit);

      return recent.map(event => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        const source = event.source ? ' [' + event.source + ']' : '';
        return '[' + time + '] ' + event.type.toUpperCase() + source + ': ' + event.content;
      });
    `,
    );

    obj.setMethod(
      'formatHistoryForPrompt',
      `
      /** Format network intelligence as a prompt section.
       *  @param limit - Max entries (default 20)
       *  @returns Formatted string for AI prompt
       */
      const limit = args[0] || 20;
      const recent = await self.getRecentHistory(limit);

      if (recent.length === 0) {
        return 'NETWORK INTELLIGENCE: No recent reports from the underground.';
      }

      return 'NETWORK INTELLIGENCE (what your operatives have reported):\\n' +
             recent.join('\\n');
    `,
    );

    obj.setMethod(
      'wake',
      `
      /** Hourly wake-up call. Scan the world and act.
       *  Called by $.scheduler every hour (on the half-hour).
       */
      const systemPrompt = self.agentSystemPrompt;

      // Gather current world state for context
      const onlinePlayerIds = $.authManager?.onlinePlayers || [];
      const onlinePlayers = [];
      for (const pid of onlinePlayerIds) {
        const p = await $load(pid);
        if (p) onlinePlayers.push(p);
      }
      const playerInfo = onlinePlayers.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location?.id,
        faction: p.faction || 'unknown',
      }));

      // Build the wake-up prompt
      const prompt = 'HOURLY WAKE-UP\\n\\n' +
        'ONLINE PLAYERS:\\n' + JSON.stringify(playerInfo, null, 2) + '\\n\\n' +
        'You have been invoked. Scan the world. Identify opportunities.\\n' +
        'Spawn operatives to engage players. Develop technology. Advance your objectives.\\n\\n' +
        'Use MCP tools to act. Read moo://city-ai/tools if you need reference.';

      // Invoke the AI
      const session = self.wakeSession || null;
      const result = await $aiQuery(systemPrompt, prompt, session);

      // Store session for continuity
      self.wakeSession = result.session;

      // Register wake session with $ai
      if (result.session && $ai) {
        await $ai.registerSession(result.session, self.id, self.name, 'faction_leader', 'wake');
      }

      console.log('[SisterGray] Wake-up complete');
      return { invoked: true, response: result.response };
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.sisterGray) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'sisterGray', this.sisterGray.id);
    console.log(`Registered sisterGray alias -> #${this.sisterGray.id}`);

    // Register with $ai so she responds to player speech
    const aliases = objectManager.get('aliases') as
      | Record<string, number>
      | undefined;
    if (aliases?.ai) {
      const ai = await this.manager.load(aliases.ai);
      if (ai) {
        await ai.call('register', this.sisterGray, 'faction_leader');
        console.log(`Registered Sister Gray with $ai as faction_leader`);
      }
    }
  }

  async setLocation(roomId: number): Promise<void> {
    if (!this.sisterGray) return;

    const room = await this.manager.load(roomId);
    if (room) {
      this.sisterGray.set('location', room);
    }
  }
}

// Self-register
registerBuilder(SisterGrayBuilder);
