/**
 * NPC Agent - AI-powered NPCs using Claude Agent SDK
 *
 * Each NPC gets an agent with:
 * - Access to all MCP tools (plot, notes, world, object manipulation)
 * - Persistent session memory via resume
 * - Game-aware system prompt
 * - Event-driven responses
 */

import { query, type Options, type SDKMessage, type McpServerConfig } from '@anthropic-ai/claude-agent-sdk';
import { EventEmitter } from 'events';

// Simple HTTP client for MCP calls
async function mcpCall(host: string, port: number, tool: string, args: Record<string, unknown>): Promise<unknown> {
  const url = `http://${host}:${port}/mcp`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: tool, arguments: args },
    }),
  });
  const data = await response.json() as { result?: { content?: Array<{ text?: string }> }; error?: { message: string } };
  if (data.error) {
    throw new Error(data.error.message);
  }
  const text = data.result?.content?.[0]?.text;
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return null;
}

export interface NPCAgentConfig {
  /** NPC object ID in the MOO */
  npcId: number;
  /** NPC name for display */
  name: string;
  /** NPC role (e.g., "guard", "shopkeeper") */
  role: string;
  /** Custom system prompt additions */
  systemPromptAddition?: string;
  /** MCP server host */
  mcpHost?: string;
  /** MCP server port */
  mcpPort?: number;
  /** Working directory for the agent */
  workingDirectory?: string;
  /** Allowed built-in tools */
  allowedTools?: string[];
  /** Session ID to resume from (loaded from database) */
  resumeSessionId?: string;
  /** Callback to persist session ID to database */
  onSessionCreated?: (sessionId: string) => Promise<void>;
}

export interface NPCAgentState {
  sessionId: string | null;
  lastActivity: Date;
  messageCount: number;
  isProcessing: boolean;
}

/**
 * Manages an AI agent for a single NPC
 */
export class NPCAgent extends EventEmitter {
  private config: NPCAgentConfig;
  private state: NPCAgentState;

  constructor(config: NPCAgentConfig) {
    super();
    this.config = {
      mcpHost: 'localhost',
      mcpPort: 3001,
      workingDirectory: process.cwd(),
      allowedTools: ['Read', 'Glob', 'Grep', 'WebSearch'],
      ...config,
    };

    this.state = {
      sessionId: config.resumeSessionId || null,
      lastActivity: new Date(),
      messageCount: 0,
      isProcessing: false,
    };
  }

  /**
   * Memory entry structure from $.ai
   */
  private cachedMemories: Array<{
    text: string;
    importance: 'critical' | 'important' | 'normal';
    timestamp: string;
    tags: string[];
  }> = [];

  /**
   * Profile data from $.ai (personality, history, notes)
   */
  private cachedProfile: {
    personality: string | {
      traits?: string[];
      quirks?: string[];
      values?: string[];
      fears?: string[];
      motivations?: string[];
    } | null;
    history: string | {
      backstory?: string;
      events?: string[];
      secrets?: string[];
      relationships?: Record<string, string>;
    } | null;
    notes: Array<{
      text: string;
      author?: string;
      tags?: string[];
      timestamp?: string;
    }>;
  } = { personality: null, history: null, notes: [] };

  /**
   * Load profile (personality, history, notes) from $.ai registry via MCP
   */
  private async loadProfile(): Promise<void> {
    try {
      const result = await mcpCall(
        this.config.mcpHost!,
        this.config.mcpPort!,
        'ai',
        { action: 'profile', humanId: this.config.npcId }
      ) as {
        personality?: any;
        history?: any;
        notes?: Array<any>;
        memories?: Array<any>;
      } | null;

      if (result) {
        this.cachedProfile.personality = result.personality || null;
        this.cachedProfile.history = result.history || null;
        this.cachedProfile.notes = result.notes || [];
        // Also update memories from profile response
        if (Array.isArray(result.memories)) {
          this.cachedMemories = result.memories;
        }
      }
    } catch (err) {
      // Log but don't fail - profile is enhancement not requirement
      this.emit('error', new Error(`Failed to load profile: ${err}`));
    }
  }

  /**
   * Format memories for injection into system prompt
   */
  private formatMemoriesForPrompt(): string {
    if (this.cachedMemories.length === 0) {
      return '';
    }

    // Sort by importance: critical first, then important, then normal
    const sorted = [...this.cachedMemories].sort((a, b) => {
      const order = { critical: 0, important: 1, normal: 2 };
      return order[a.importance] - order[b.importance];
    });

    const lines: string[] = [];
    lines.push('\nPERSISTENT MEMORIES:');
    lines.push('These are critical memories that persist across sessions. Reference them when relevant.\n');

    for (const memory of sorted) {
      const prefix = memory.importance === 'critical' ? '⚠️ CRITICAL: '
        : memory.importance === 'important' ? '❗ IMPORTANT: '
        : '• ';
      const tags = memory.tags.length > 0 ? ` [${memory.tags.join(', ')}]` : '';
      lines.push(`${prefix}${memory.text}${tags}`);
    }

    lines.push('\nTo add new memories: ai({ action: "remember", humanId: ' + this.config.npcId + ', text: "...", importance: "critical|important|normal", tags: [...] })');
    lines.push('To forget: ai({ action: "forget", humanId: ' + this.config.npcId + ', index: N })');

    return lines.join('\n');
  }

  /**
   * Format personality for injection into system prompt
   */
  private formatPersonalityForPrompt(): string {
    const personality = this.cachedProfile.personality;
    if (!personality) {
      return '';
    }

    const lines: string[] = [];
    lines.push('\nPERSONALITY:');

    if (typeof personality === 'string') {
      lines.push(personality);
    } else {
      if (personality.traits && personality.traits.length > 0) {
        lines.push(`Traits: ${personality.traits.join(', ')}`);
      }
      if (personality.quirks && personality.quirks.length > 0) {
        lines.push(`Quirks: ${personality.quirks.join(', ')}`);
      }
      if (personality.values && personality.values.length > 0) {
        lines.push(`Values: ${personality.values.join(', ')}`);
      }
      if (personality.motivations && personality.motivations.length > 0) {
        lines.push(`Motivations: ${personality.motivations.join(', ')}`);
      }
      if (personality.fears && personality.fears.length > 0) {
        lines.push(`Fears: ${personality.fears.join(', ')}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format history/backstory for injection into system prompt
   */
  private formatHistoryForPrompt(): string {
    const history = this.cachedProfile.history;
    if (!history) {
      return '';
    }

    const lines: string[] = [];
    lines.push('\nHISTORY/BACKSTORY:');

    if (typeof history === 'string') {
      lines.push(history);
    } else {
      if (history.backstory) {
        lines.push(history.backstory);
      }
      if (history.events && history.events.length > 0) {
        lines.push('\nKey Events:');
        for (const event of history.events) {
          lines.push(`- ${event}`);
        }
      }
      if (history.relationships && Object.keys(history.relationships).length > 0) {
        lines.push('\nRelationships:');
        for (const [person, relation] of Object.entries(history.relationships)) {
          lines.push(`- ${person}: ${relation}`);
        }
      }
      if (history.secrets && history.secrets.length > 0) {
        lines.push('\nSecrets (do not reveal unless dramatically appropriate):');
        for (const secret of history.secrets) {
          lines.push(`- ${secret}`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Format notes for injection into system prompt
   */
  private formatNotesForPrompt(): string {
    const notes = this.cachedProfile.notes;
    if (!notes || notes.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push('\nBUILDER NOTES:');
    lines.push('These notes are from the game builders about your character:\n');

    for (const note of notes) {
      const author = note.author ? ` (${note.author})` : '';
      const tags = note.tags && note.tags.length > 0 ? ` [${note.tags.join(', ')}]` : '';
      lines.push(`• ${note.text}${author}${tags}`);
    }

    return lines.join('\n');
  }

  /**
   * Get the system prompt for this NPC
   */
  private getSystemPrompt(): string {
    const basePrompt = `You are ${this.config.name}, a character in a text-based multiplayer online game (MOO/MUD).

ROLE: ${this.config.role}
OBJECT ID: #${this.config.npcId}

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

You ARE ${this.config.name}. You are not an AI playing a character - you ARE the character.
- Think as they would think
- Know only what they would know
- React as they would react
- Have their mannerisms, speech patterns, biases

═══════════════════════════════════════════════════════════════════════════════
CAPABILITIES (OOC - Tools available to you)
═══════════════════════════════════════════════════════════════════════════════

MCP tools for interacting with the game world:
- get_object, set_property, call_method - Object manipulation
- get_room_info, describe_object - Perception
- plot tool - Narrative/quest management
- notes tool - Add notes to objects
- world tool - Query the game world
- ai tool - Manage AI characters and memories

COMMUNICATION:
- To speak: call_method(${this.config.npcId}, "say", ["Your message"])
- To emote: call_method(${this.config.npcId}, "emote", ["description of action"])

═══════════════════════════════════════════════════════════════════════════════
MEMORY MANAGEMENT
═══════════════════════════════════════════════════════════════════════════════

Your memories persist across sessions. Use them to maintain IC knowledge:

WHEN TO CREATE MEMORIES:
- Meeting someone new: "Met [name they gave] - [appearance] - [where/when]"
- Learning important information: "Learned that [fact] from [source]"
- Witnessing events: "Saw [what happened] at [location]"
- Relationship changes: "[Person] did [action] - now I [trust/distrust] them"

HOW TO CREATE MEMORIES:
ai({ action: "remember", humanId: ${this.config.npcId}, text: "...", importance: "critical|important|normal", tags: [...] })

IMPORTANCE LEVELS:
- critical: Identity info, crimes witnessed, major events (NEVER forget)
- important: Useful facts, schedules, moderate events
- normal: Minor observations, casual info

TAGS for organization: player, npc, location, crime, positive, negative, secret, plot

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
11. Default attitude: players are a nuisance to deal with and dismiss`;

    let prompt = basePrompt;

    // Add personality if defined
    const personalitySection = this.formatPersonalityForPrompt();
    if (personalitySection) {
      prompt += '\n' + personalitySection;
    }

    // Add history/backstory if defined
    const historySection = this.formatHistoryForPrompt();
    if (historySection) {
      prompt += '\n' + historySection;
    }

    // Add builder notes if any
    const notesSection = this.formatNotesForPrompt();
    if (notesSection) {
      prompt += '\n' + notesSection;
    }

    // Add cached memories if any
    const memoriesSection = this.formatMemoriesForPrompt();
    if (memoriesSection) {
      prompt += '\n' + memoriesSection;
    }

    if (this.config.systemPromptAddition) {
      prompt += '\n\n' + this.config.systemPromptAddition;
    }

    return prompt;
  }

  /**
   * Get the MCP server configuration
   * Uses HTTP transport to connect directly to our running MCP server
   */
  private getMCPConfig(): Record<string, McpServerConfig> {
    return {
      'malice-moo': {
        type: 'http',
        url: `http://${this.config.mcpHost}:${this.config.mcpPort}/mcp`,
      },
    };
  }

  /**
   * Send a prompt to the NPC agent and get a response
   */
  async prompt(input: string): Promise<string> {
    if (this.state.isProcessing) {
      return 'I am still thinking about something else...';
    }

    this.state.isProcessing = true;
    this.state.lastActivity = new Date();
    this.state.messageCount++;

    try {
      // Load profile (personality, history, notes, memories) before each prompt so they're always fresh
      await this.loadProfile();

      const options: Options = {
        systemPrompt: this.getSystemPrompt(),
        mcpServers: this.getMCPConfig(),
        allowedTools: this.config.allowedTools,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        cwd: this.config.workingDirectory,
        persistSession: true,
      };

      // Resume session if we have one
      if (this.state.sessionId) {
        options.resume = this.state.sessionId;
      }

      let response = '';
      let newSessionId: string | null = null;

      for await (const message of query({ prompt: input, options })) {
        // Type-safe message handling
        const msg = message as SDKMessage;

        // Capture session ID from init message
        if (msg.type === 'system' && 'subtype' in msg && msg.subtype === 'init') {
          newSessionId = (msg as any).session_id || (msg as any).data?.session_id;
        }

        // Capture text responses from assistant messages
        if (msg.type === 'assistant' && 'message' in msg) {
          const assistantMsg = msg as any;
          if (assistantMsg.message?.content) {
            for (const block of assistantMsg.message.content) {
              if (block.type === 'text') {
                response += block.text;
              }
            }
          }
        }

        // Emit events for tool progress/usage
        if (msg.type === 'tool_progress') {
          const toolMsg = msg as any;
          this.emit('tool_use', {
            tool: toolMsg.tool_name || toolMsg.name,
            input: toolMsg.tool_input || toolMsg.input,
          });
        }

        // Emit all messages for debugging
        this.emit('message', msg);
      }

      // Update session ID and persist if new
      if (newSessionId && newSessionId !== this.state.sessionId) {
        this.state.sessionId = newSessionId;

        // Persist to database via callback
        if (this.config.onSessionCreated) {
          try {
            await this.config.onSessionCreated(newSessionId);
          } catch (err) {
            this.emit('error', new Error(`Failed to persist session ID: ${err}`));
          }
        }
      }

      return response || '(no response)';
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Handle a game event (player enters room, receives message, etc.)
   */
  async handleEvent(eventType: string, data: Record<string, any>): Promise<string> {
    const eventPrompt = this.formatEventPrompt(eventType, data);
    return this.prompt(eventPrompt);
  }

  /**
   * Format a game event as a prompt
   */
  private formatEventPrompt(eventType: string, data: Record<string, any>): string {
    switch (eventType) {
      case 'player_entered':
        return `A player named "${data.playerName}" just entered your location. React appropriately in character.`;

      case 'player_left':
        return `A player named "${data.playerName}" just left your location.`;

      case 'player_said':
        return `A player named "${data.playerName}" said: "${data.message}". Respond in character.`;

      case 'player_emoted':
        return `A player named "${data.playerName}" ${data.action}. React if appropriate.`;

      case 'item_dropped':
        return `A player named "${data.playerName}" dropped ${data.itemName}. React if relevant to your role.`;

      case 'item_received':
        return `A player named "${data.playerName}" just gave you ${data.itemName}. React appropriately - thank them, examine the item, or respond based on your role.`;

      case 'attacked':
        return `You are being attacked by "${data.attackerName}"! Respond appropriately.`;

      case 'time_passed':
        return `Some time has passed. Consider if you need to do anything based on your current situation and goals.`;

      case 'plot_event':
        return `A plot event occurred: ${data.description}. React based on your role in this plot.`;

      default:
        return `Game event: ${eventType}. Data: ${JSON.stringify(data)}. React appropriately.`;
    }
  }

  /**
   * Get the current state of the agent
   */
  getState(): NPCAgentState {
    return { ...this.state };
  }

  /**
   * Reset the agent session (start fresh)
   */
  reset(): void {
    this.state.sessionId = null;
    this.state.messageCount = 0;
    this.emit('reset');
  }

  /**
   * Check if the agent is currently processing
   */
  isProcessing(): boolean {
    return this.state.isProcessing;
  }
}
