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
      sessionId: null,
      lastActivity: new Date(),
      messageCount: 0,
      isProcessing: false,
    };
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

IMPORTANT:
- Stay in character
- React naturally to events
- Use the plot system to track ongoing storylines
- Take notes on important events and player interactions`;

    if (this.config.systemPromptAddition) {
      return basePrompt + '\n\n' + this.config.systemPromptAddition;
    }

    return basePrompt;
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

      // Update session ID
      if (newSessionId) {
        this.state.sessionId = newSessionId;
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
