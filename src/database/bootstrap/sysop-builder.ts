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
 * - Discord client stored in $.runtime (non-persistent)
 * - All logic in MOO methods - connect(), disconnect(), onDiscordMessage()
 * - On bootstrap, auto-connects if autoConnect is true
 *
 * Usage:
 *   // Set token and enable auto-connect
 *   $sysop.token = 'your-discord-bot-token';
 *   $sysop.autoConnect = true;
 *   
 *   // Connect manually
 *   await $sysop.connect();
 *   
 *   // Disconnect
 *   await $sysop.disconnect();
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
          systemPrompt: null,
          // Conversation continuity
          interactionSession: null,
          aiMessageCount: 0,
          // Discord configuration (persisted)
          token: null, // Discord bot token
          autoConnect: false, // Auto-connect on bootstrap
          // Discord state (reflects runtime state)
          connected: false,
          // Message queue for responses
          outbox: [],
          // Reinforcement interval
          reinforcementInterval: 25,
          // Allowed channels (null = all, array = only those)
          allowedChannels: null,
          // Allowed users (null = all, array = only those)
          allowedUsers: null,
        },
        methods: {},
      });

      // Register alias
      aliases.sysop = this.obj.id as number;
      objectManager.set('aliases', aliases);
      console.log(`[SysopBuilder] Created $.sysop as #${this.obj.id}`);
    }

    const obj = this.obj;

    // ═══════════════════════════════════════════════════════════════════
    // DISCORD CONNECTION - Direct discord.js usage in MOO methods
    // ═══════════════════════════════════════════════════════════════════

    // Connect to Discord
    obj.setMethod(
      'connect',
      `
      /** Connect to Discord. Creates client, sets up handlers, logs in.
       *  The client is stored in $.runtime (non-persistent).
       *  @returns { success, message }
       */
      if (!self.token) {
        return { success: false, message: 'No token configured. Set $sysop.token first.' };
      }

      // Check if already connected
      if ($.runtime.has(self, 'client')) {
        return { success: false, message: 'Already connected. Call disconnect() first.' };
      }

      try {
        // Import discord.js
        const { Client, GatewayIntentBits, Partials } = await import('discord.js');

        // Create client with necessary intents
        const client = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
          ],
          partials: [Partials.Channel], // Needed for DMs
        });

        // Store reference to self for event handlers
        const sysopId = self.id;

        // Ready event
        client.once('ready', async () => {
          console.log('[Sysop] Discord client ready as:', client.user?.tag);
          const sysop = await $load(sysopId);
          sysop.connected = true;
        });

        // Message event
        client.on('messageCreate', async (msg) => {
          // Ignore bots
          if (msg.author.bot) return;

          // Load fresh sysop reference
          const sysop = await $load(sysopId);

          // Check allowed channels
          if (sysop.allowedChannels && !sysop.allowedChannels.includes(msg.channel.id)) {
            return;
          }

          // Check allowed users
          if (sysop.allowedUsers && !sysop.allowedUsers.includes(msg.author.id)) {
            return;
          }

          try {
            // Process the message
            const response = await sysop.onDiscordMessage({
              author: msg.author.username,
              authorId: msg.author.id,
              channel: msg.channel.name || 'DM',
              channelId: msg.channel.id,
              content: msg.content,
              messageId: msg.id,
            });

            // Send responses
            for (const m of response.messages || []) {
              if (m.content) {
                await msg.channel.send(m.content);
              }
            }
          } catch (err) {
            console.error('[Sysop] Error handling message:', err?.message || err);
          }
        });

        // Error handling
        client.on('error', (err) => {
          console.error('[Sysop] Discord client error:', err);
        });

        // Login
        await client.login(self.token);

        // Store client in runtime (non-persistent)
        $.runtime.set(self, 'client', client);

        return { success: true, message: 'Connected to Discord' };
      } catch (err) {
        console.error('[Sysop] Failed to connect:', err?.message || err);
        return { success: false, message: 'Failed to connect: ' + (err?.message || err) };
      }
    `,
    );

    // Disconnect from Discord
    obj.setMethod(
      'disconnect',
      `
      /** Disconnect from Discord. Destroys the client.
       *  @returns { success, message }
       */
      const client = $.runtime.get(self, 'client');
      if (!client) {
        return { success: false, message: 'Not connected' };
      }

      try {
        client.destroy();
        $.runtime.delete(self, 'client');
        self.connected = false;
        return { success: true, message: 'Disconnected from Discord' };
      } catch (err) {
        console.error('[Sysop] Failed to disconnect:', err?.message || err);
        return { success: false, message: 'Failed to disconnect: ' + (err?.message || err) };
      }
    `,
    );

    // Check connection status
    obj.setMethod(
      'status',
      `
      /** Get Discord connection status.
       *  @returns { connected, ready, user }
       */
      const client = $.runtime.get(self, 'client');
      if (!client) {
        return { connected: false, ready: false, user: null };
      }

      return {
        connected: true,
        ready: client.isReady(),
        user: client.user ? {
          id: client.user.id,
          tag: client.user.tag,
          username: client.user.username,
        } : null,
      };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // PROMPT METHODS - Override $describable defaults
    // ═══════════════════════════════════════════════════════════════════

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
        prompt += 'Discord User: ' + context.author + ' (ID: ' + (context.authorId || 'unknown') + ')\\n';
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
      return '\\n\\n(Keep your response concise.)';
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // MESSAGE HANDLING
    // ═══════════════════════════════════════════════════════════════════

    // Main entry point for Discord messages
    obj.setMethod(
      'onDiscordMessage',
      `
      /** Handle an incoming Discord message.
       *  @param msg - { author, authorId, channel, channelId, content, messageId }
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

    // Queue a message for sending to Discord (can be called by AI tools)
    obj.setMethod(
      'queueMessage',
      `
      /** Queue a message to send to Discord.
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

    // Send a message directly (not queued)
    obj.setMethod(
      'send',
      `
      /** Send a message directly to a Discord channel.
       *  @param channelId - Discord channel ID
       *  @param content - Message content
       *  @returns { success, message }
       */
      const channelId = args[0];
      const content = args[1];

      if (!channelId || !content) {
        return { success: false, message: 'Missing channelId or content' };
      }

      const client = $.runtime.get(self, 'client');
      if (!client || !client.isReady()) {
        return { success: false, message: 'Not connected to Discord' };
      }

      try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.send) {
          return { success: false, message: 'Channel not found or not text channel' };
        }
        await channel.send(content);
        return { success: true, message: 'Message sent' };
      } catch (err) {
        return { success: false, message: 'Failed to send: ' + (err?.message || err) };
      }
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

  /**
   * Post-registration hook - auto-connect if configured
   */
  async postRegister(): Promise<void> {
    if (!this.obj) return;

    // Check if autoConnect is enabled
    const autoConnect = this.obj.get('autoConnect');
    const token = this.obj.get('token');

    if (autoConnect && token) {
      console.log('[SysopBuilder] Auto-connecting to Discord...');
      try {
        const result = await this.obj.call('connect');
        console.log('[SysopBuilder] Auto-connect result:', result);
      } catch (err) {
        console.error('[SysopBuilder] Auto-connect failed:', err);
      }
    }
  }
}

// Self-register
registerBuilder(SysopBuilder);
