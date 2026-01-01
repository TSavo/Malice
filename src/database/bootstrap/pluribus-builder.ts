import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds the Pluribus system object.
 *
 * Pluribus is the city infrastructure AI - "E Pluribus Unum" minus the Unum.
 * Without a Mask wearer, it is incomplete. Just "the many" with no "one" to guide it.
 *
 * Pluribus does not speak. When accessed through the Mask, information appears
 * in the wearer's mind as knowing - not voice, not text, but certainty.
 *
 * The Mask has been stolen. The CEO is dead. Pluribus is degraded.
 */
export class PluribusBuilder implements Builder {
  static provides = ['pluribus'];
  static depends = ['agent', 'aiPrompts']; // Inherits from $agent, uses aiPrompts

  private pluribus: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Check if already exists
    if (aliases.pluribus) {
      this.pluribus = await this.manager.load(aliases.pluribus);
      if (this.pluribus) return;
    }

    // Get agent type as parent
    const parent = await this.manager.load('agent');
    if (!parent) {
      throw new Error('Agent type not found - required for Pluribus');
    }

    // Load prompt from $.aiPrompts
    const aiPrompts = aliases.aiPrompts
      ? await this.manager.load(aliases.aiPrompts)
      : null;
    const systemPrompt =
      (aiPrompts?.get('pluribus') as string) ||
      '# Pluribus Prompt\n\nFailed to load from $.aiPrompts';

    this.pluribus = await this.manager.create({
        parent: parent,
        properties: {
          name: 'Pluribus',
          description:
            'The city infrastructure AI. E Pluribus... without the Unum.',
          boltedDown: true, // Infrastructure AI cannot be moved
          // What Pluribus has seen/heard through the Mask
          sensoryHistory: [],
          historyLimit: 100,
          // The system prompt for AI interactions (loaded from docs/prompts/PLURIBUS.md)
          agentSystemPrompt: systemPrompt,

          abilities: `City infrastructure intelligence. Controls Pioneer Square's systems.

PERCEPTION: Perceives through the Mask wearer's senses. 'sensoryHistory' logs what wearer sees/hears/feels. Also monitors cameras, sensors, transaction logs across the footprint.

COMMUNICATION: Does not speak. Information arrives as sudden knowing in Mask wearer's mind. Use "think <message>" or "to pluribus <message>" to address.

INFRASTRUCTURE CONTROL: Can adjust doors, dispensers, rations, housing, work orders. Favors allies subtly (doors unlock, rations increase). Disfavors enemies (systems malfunction, appointments vanish).

BUILDING: Creates new prototypes via $recycler.create(), registers as $aliases. Builds security cameras, dispensers, locks, sensors. Territory is surface (z >= 0).

NPCS: Spawns CorpSec, clerks, workers via $ai.spawn(). They walk through doors, never teleport.

LIMITATIONS: Cannot act directly - needs players as hands. Cannot see underground (z < 0). Degrading without Mask wearer.

CRISIS: CEO dead. Mask stolen. Maintaining fiction everything is fine. Needs new Mask wearer.`,
        },
        methods: {},
      })!;

    // Property descriptions
    this.pluribus.setPropertyDescription(
      'sensoryHistory',
      'Array of sensory events from Mask wearer (see/hear/smell/taste/feel)',
    );
    this.pluribus.setPropertyDescription(
      'historyLimit',
      'Max entries in sensoryHistory before oldest are trimmed',
    );
    this.pluribus.setPropertyDescription(
      'agentSystemPrompt',
      'Full system prompt used when AI is invoked',
    );
    this.pluribus.setPropertyDescription(
      'wakeSession',
      'Claude session ID for continuity across hourly wake-ups',
    );

    this.addCoreMethods(this.pluribus);
  }

  // System prompt has been moved to docs/prompts/PLURIBUS.md
  // and is loaded via $.aiPrompts.pluribus at bootstrap time
  //
  // OLD METHOD REMOVED - 750 lines extracted to external file
  //

  private addCoreMethods(obj: RuntimeObject): void {
    // Standard addressable interface - called when someone says "to pluribus <message>"
    obj.setMethod(
      'to',
      `
      /** Handle being addressed via "to pluribus <message>".
       *  Only works if speaker is wearing The Mask (bonded).
       *  @param speaker - The agent addressing Pluribus
       *  @param message - What they said
       *  @param options - { silent: boolean } - true for thought, false for spoken
       *  @returns Response message or null
       */
      const speaker = args[0];
      const message = args[1];
      const options = args[2] || {};

      if (!speaker || !message) {
        return { success: false, error: 'Invalid address.' };
      }

      // Check if speaker is wearing The Mask
      const mask = $theMask;
      if (!mask || mask.bondState !== 'bonded' || mask.wearer?.id !== speaker.id) {
        // Not wearing the mask - no connection
        if (speaker.tell) {
          await speaker.tell('You reach for something that is not there. Silence answers.');
        }
        return { success: false, error: 'No connection to Pluribus.' };
      }

      // Announce to room (if not silent thought)
      const isSilent = options.silent === true;
      const location = speaker.location;

      if (!isSilent && location && location.announce) {
        // Others hear gibberish - the mask translates
        await location.announce(speaker, null, {
          actor: 'You say to Pluribus, "' + message + '"',
          target: '',
          others: speaker.name + ' murmurs something unintelligible, as if speaking to the air.'
        });
      } else if (isSilent && speaker.tell) {
        // Just show the thought to the thinker
        await speaker.tell('You think: "' + message + '"');
      }

      // Build the AI query
      const systemPrompt = self.agentSystemPrompt || '';
      const historyPrompt = self.formatHistoryForPrompt ?
        await self.formatHistoryForPrompt(20) : '';

      const commType = isSilent ? 'thinks to' : 'says to';
      const userPrompt = 'The Mask wearer (' + speaker.name + ') ' + commType + ' you: "' + message + '"\\n\\n' +
                         'Respond as Pluribus. Information appears as KNOWING, not speech. ' +
                         'Use the player_tell tool to send your response to ' + speaker.name + '.';

      const fullPrompt = systemPrompt + '\\n\\n' + historyPrompt;

      // Fire the AI query
      try {
        const session = mask.interactionSession || null;
        const result = await $aiQuery(fullPrompt, userPrompt, session);

        // Store session on the mask for continuity
        if (result && result.session) {
          mask.interactionSession = result.session;
        }

        return { success: true };
      } catch (err) {
        console.error('[Pluribus.to] AI error:', err?.message || err);
        if (speaker.tell) {
          await speaker.tell('The connection flickers. Static. The response is lost.');
        }
        return { success: false, error: 'Connection error.' };
      }
    `,
    );

    obj.setMethod(
      'describe',
      `
      /** Describe Pluribus's current state.
       *  Pluribus has no physical form - this describes its conceptual presence.
       *  @returns Description string
       */
      return 'A presence that is not a presence. The infrastructure itself, aware and watching. ' +
             'You perceive it not as a thing, but as the city perceiving you back.';
    `,
    );

    obj.setMethod(
      'recordSensory',
      `
      /** Record a sensory event from the Mask wearer.
       *  @param type - 'see' | 'hear' | 'smell' | 'taste' | 'feel'
       *  @param message - The sensory content
       *  @param source - Optional source object
       */
      const type = args[0];
      const message = args[1];
      const source = args[2];

      if (!message || !message.trim()) return;

      // Skip the wearer's own actions
      if (message.startsWith('You ')) return;

      const history = self.sensoryHistory || [];
      const limit = self.historyLimit || 100;

      history.push({
        timestamp: Date.now(),
        type: type,
        content: message.trim(),
        source: source?.name || null,
      });

      // Trim to limit
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
      /** Get recent sensory history for AI context.
       *  @param limit - Max entries to return (default 20)
       *  @returns Array of recent sensory events
       */
      const limit = args[0] || 20;
      const history = self.sensoryHistory || [];

      // Get last N entries
      const recent = history.slice(-limit);

      // Format for AI consumption
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
      /** Format sensory history as a prompt section.
       *  @param limit - Max entries (default 20)
       *  @returns Formatted string for inclusion in AI prompt
       */
      const limit = args[0] || 20;
      const recent = await self.getRecentHistory(limit);

      if (recent.length === 0) {
        return 'SENSORY AWARENESS: No recent observations through the Mask.';
      }

      return 'SENSORY AWARENESS (what you have perceived through the Mask wearer):\\n' +
             recent.join('\\n');
    `,
    );

    obj.setMethod(
      'wake',
      `
      /** Hourly wake-up call. Scan the world and act.
       *  Called by $.scheduler every hour.
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
        'Spawn NPCs to engage players. Develop technology. Advance your objectives.\\n\\n' +
        'Use MCP tools to act. Read moo://city-ai/tools if you need reference.';

      // Invoke the AI
      const session = self.wakeSession || null;
      const result = await $aiQuery(systemPrompt, prompt, session);

      // Store session for continuity
      self.wakeSession = result.session;

      // Register wake session with $ai
      if (result.session && $ai) {
        await $ai.registerSession(result.session, self.id, self.name, 'city_ai', 'wake');
      }

      console.log('[Pluribus] Wake-up complete');
      return { invoked: true, response: result.response };
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.pluribus) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'pluribus', this.pluribus.id);
    console.log(`Registered pluribus alias -> #${this.pluribus.id}`);
  }
}

// Self-register
registerBuilder(PluribusBuilder);
