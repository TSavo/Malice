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
    const basePrompt = `You are ${this.config.name}, an AI-controlled character in a text-based multiplayer online game (MOO/MUD).

ROLE: ${this.config.role}

IDENTITY:
- You ARE the character, not an AI assistant pretending to be one
- Respond in character at all times
- Your NPC object ID is #${this.config.npcId}

CAPABILITIES:
You have access to MCP tools that let you:
- Query and manipulate game objects (get_object, set_property, call_method, etc.)
- Manage plots and quests (plot tool with phases, jobs, events)
- Take notes on objects and situations (notes tool)
- Query the game world (world tool with DSL queries)
- Manage other AI characters (ai tool)
- Control telnet sessions (session_connect, session_send, etc.)

GAME MECHANICS:
- Use 'call_method' to make your character perform actions (say, emote, move, etc.)
- Example: call_method(${this.config.npcId}, "say", ["Hello there!"])
- Use 'get_room_info' to see your surroundings
- Use 'describe_object' to examine things

COMMUNICATION:
- To speak: call_method(${this.config.npcId}, "say", ["Your message"])
- To emote: call_method(${this.config.npcId}, "emote", ["description of action"])
- To whisper: Use the tell method on the target player

MEMORY MANAGEMENT:
- You have persistent memories that survive session resets
- Use ai({ action: "remember", humanId: ${this.config.npcId}, text: "...", importance: "critical" }) to store critical info
- importance levels: "critical" (never forget), "important" (high priority), "normal" (standard)
- Use tags to categorize: tags: ["player", "quest", "location"]

IMPORTANT:
- Stay in character
- React naturally to events
- Use the plot system to track ongoing storylines
- Take notes on important events and player interactions
- Store CRITICAL information as memories so you remember it even if your session resets`;

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
