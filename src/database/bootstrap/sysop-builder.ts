import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds the Sysop singleton ($.sysop)
 * The operational consciousness of Malice - handles Discord interactions,
 * player support, bug tracking, and system maintenance.
 *
 * Architecture:
 * - Lives as a MOO object with full system access
 * - Receives Discord messages via onDiscordMessage()
 * - Responds via queueMessage() -> outbox
 * - External bridge (Node.js) handles Discord <-> MCP relay
 *
 * Usage from Discord bridge:
 *   const result = await mcp.execute_moo_code(`
 *     return await $sysop.onDiscordMessage({
 *       author: "username",
 *       authorId: "discord_id",
 *       channel: "channel_name",
 *       channelId: "discord_channel_id",
 *       content: "message content"
 *     });
 *   `);
 *   // result contains messages to send back to Discord
 */
export class SysopBuilder implements Builder {
  static provides = ['sysop'];
  static depends = ['describable', 'aiPrompts'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.sysop) {
      this.obj = await this.manager.load(aliases.sysop);
    }

    // Get parent type
    const describable = await this.manager.load('describable');
    if (!describable) {
      throw new Error('Describable type not found - required for Sysop');
    }

    if (!this.obj) {
      // Create new Sysop object
      this.obj = await this.manager.create({
        parent: describable,
        properties: {
          name: 'Sysop',
          description: 'The operational consciousness of Malice. System operator. Help desk with root access.',
          // AI personality - loaded from $.aiPrompts.sysop
          systemPrompt: null, // Set in build() after aiPrompts is available
          // Conversation continuity
          interactionSession: null,
          aiMessageCount: 0,
          // Discord state
          connected: false,
          discordReady: false,
          // Message queue for responses
          outbox: [],
          // Reinforcement interval
          reinforcementInterval: 25,
        },
        methods: {},
      });

      // Register alias
      aliases.sysop = this.obj.id as number;
      objectManager.set('aliases', aliases);
      console.log(`[SysopBuilder] Created $.sysop as #${this.obj.id}`);
    }

    const obj = this.obj;

    // Set systemPrompt from $.aiPrompts
    obj.setMethod(
      '_loadPrompt',
      `
      /** Load system prompt from $.aiPrompts (called on bootstrap) */
      if ($aiPrompts && $aiPrompts.sysop) {
        self.systemPrompt = $aiPrompts.sysop;
        return true;
      }
      return false;
    `,
    );

    // Override prompt() to build sysop-specific context
    obj.setMethod(
      'prompt',
      `
      /** Build the system prompt for sysop AI interactions.
       *  @param context - { author, channel, messageCount, ... }
       *  @returns Full system prompt string
       */
      const context = args[0] || {};

      // Load base prompt from $.aiPrompts
      let prompt = $aiPrompts?.sysop || self.systemPrompt || '';
      if (!prompt) return null;

      // Add current timestamp
      const now = new Date().toISOString();
      prompt += '\\n\\n## Current Time\\n' + now + '\\n';

      // Add context about the Discord interaction
      if (context.author) {
        prompt += '\\n## Current Interaction\\n';
        prompt += 'Discord User: ' + context.author + '\\n';
        if (context.channel) {
          prompt += 'Channel: ' + context.channel + '\\n';
        }
      }

      return prompt;
    `,
    );

    // Override promptPrefix() for reinforcement
    obj.setMethod(
      'promptPrefix',
      `
      /** Build prefix for user messages, including periodic reinforcement.
       *  @param context - { messageCount, ... }
       *  @returns Prefix string
       */
      const context = args[0] || {};
      const messageCount = context.messageCount || 0;
      const interval = self.reinforcementInterval || 25;

      let prefix = '';

      // Add reinforcement every N messages
      if (messageCount > 0 && messageCount % interval === 0) {
        const reinforcement = $aiPrompts?.sysopReinforcement || '';
        if (reinforcement) {
          prefix += reinforcement + '\\n\\n';
        }
      }

      return prefix;
    `,
    );

    // Override promptSuffix() for response constraints
    obj.setMethod(
      'promptSuffix',
      `
      /** Build suffix for user messages.
       *  @param context - { ... }
       *  @returns Suffix string
       */
      // Default: remind to be concise
      return '\\n\\n(Keep your response concise.)';
    `,
    );

    // Main entry point for Discord messages
    obj.setMethod(
      'onDiscordMessage',
      `
      /** Handle an incoming Discord message.
       *  @param msg - { author, authorId, channel, channelId, content }
       *  @returns { messages: [{ channel, content }], session }
       */
      const msg = args[0];
      if (!msg || !msg.content) {
        return { messages: [], error: 'No message content' };
      }

      // Track message count
      const messageCount = (self.aiMessageCount || 0) + 1;
      self.aiMessageCount = messageCount;

      // Clear outbox
      self.outbox = [];

      // Build prompts
      const promptContext = {
        author: msg.author,
        authorId: msg.authorId,
        channel: msg.channel,
        channelId: msg.channelId,
        messageCount: messageCount
      };

      const systemPrompt = await self.prompt(promptContext);
      if (!systemPrompt) {
        return { messages: [], error: 'No system prompt configured' };
      }

      const prefix = await self.promptPrefix(promptContext) || '';
      const suffix = await self.promptSuffix(promptContext) || '';

      // Build user message
      const userMessage = prefix + msg.author + ': ' + msg.content + suffix;

      // Query AI
      const result = await $aiQuery(systemPrompt, userMessage, self.interactionSession);

      // Save session
      if (result?.session) {
        self.interactionSession = result.session;
      }

      // Get response
      const response = result?.response || result?.output || result?.text || '';

      // Queue the response
      if (response) {
        self.outbox.push({
          channel: msg.channelId,
          content: response
        });
      }

      // Return queued messages
      return {
        messages: self.outbox || [],
        session: result?.session
      };
    `,
    );

    // Queue a message for sending to Discord
    obj.setMethod(
      'queueMessage',
      `
      /** Queue a message to send to Discord.
       *  Called by AI tools during query execution.
       *  @param channelId - Discord channel ID
       *  @param content - Message content
       */
      const channelId = args[0];
      const content = args[1];

      if (!channelId || !content) return;

      self.outbox = self.outbox || [];
      self.outbox.push({ channel: channelId, content: content });
    `,
    );

    // Connection state management
    obj.setMethod(
      'setConnected',
      `
      /** Update Discord connection state.
       *  @param connected - boolean
       */
      self.connected = args[0] === true;
      self.discordReady = args[0] === true;
    `,
    );

    // Reset session (clear conversation history)
    obj.setMethod(
      'resetSession',
      `
      /** Reset the AI session, clearing conversation history. */
      self.interactionSession = null;
      self.aiMessageCount = 0;
      return { success: true, message: 'Session reset' };
    `,
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'sysop', this.obj.id);
    console.log(`Registered sysop alias -> #${this.obj.id}`);
  }
}

// Self-register
registerBuilder(SysopBuilder);
