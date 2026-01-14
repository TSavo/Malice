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
 *   // Set DISCORD_BOT_TOKEN environment variable in .env file
 *   // Then enable auto-connect
 *   $sysop.autoConnect = true;
 *
 *   // Or connect manually
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
          // Conversation continuity (per-channel sessions stored in runtime)
          // Using $.runtime.sysopSessions to avoid race conditions
          aiMessageCount: 0,
          // Discord configuration
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
          // Primary Discord channel for sysop announcements
          primaryChannelId: null,
          // Users to ignore (by Discord user ID)
          ignoreList: [],
          // Privileged users (by Discord user ID)
          privilegedList: [],
          // Wake triggers
          wakeOnMention: true,
          wakeOnScheduler: true,
          schedulerIntervalMs: 600000,
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
       *  Token is read from DISCORD_BOT_TOKEN environment variable.
       *  @returns { success, message }
       */
      const token = process.env.DISCORD_BOT_TOKEN;
      if (!token) {
        return { success: false, message: 'No token configured. Set DISCORD_BOT_TOKEN environment variable.' };
      }

      // Check if already connected
      if ($.runtime.client) {
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

          const isPrivileged = Array.isArray(sysop.privilegedList)
            && sysop.privilegedList.includes(msg.author.id);
          const isIgnored = Array.isArray(sysop.ignoreList)
            && sysop.ignoreList.includes(msg.author.id);

          if (isIgnored && !isPrivileged) return;

          // Check allowed channels (privileged users bypass)
          if (!isPrivileged && sysop.allowedChannels && !sysop.allowedChannels.includes(msg.channel.id)) {
            return;
          }

          // Queue the message for later consumption
          if (!$.runtime.sysopQueuedMessages) {
            $.runtime.sysopQueuedMessages = {};
          }
          const queued = $.runtime.sysopQueuedMessages[msg.channel.id] || [];
          queued.push({
            author: msg.author.username,
            authorId: msg.author.id,
            channel: msg.channel.name || 'DM',
            channelId: msg.channel.id,
            content: msg.content,
            messageId: msg.id,
            timestamp: new Date().toISOString(),
          });
          $.runtime.sysopQueuedMessages[msg.channel.id] = queued;

          const isDirectMessage = typeof msg.channel?.isDMBased === 'function'
            ? msg.channel.isDMBased()
            : false;
          const wasMentioned = typeof msg.mentions?.has === 'function' && client.user
            ? msg.mentions.has(client.user.id)
            : false;
          const shouldWake = isPrivileged
            || (sysop.wakeOnMention !== false && (wasMentioned || isDirectMessage));

          if (!shouldWake) return;

          const queuedMessages = $.runtime.sysopQueuedMessages[msg.channel.id] || [];
          if (!queuedMessages.length) return;
          delete $.runtime.sysopQueuedMessages[msg.channel.id];

          // Check allowed users
          try {
            // Process queued messages
            await sysop.onDiscordMessage({
              author: msg.author.username,
              authorId: msg.author.id,
              channel: msg.channel.name || 'DM',
              channelId: msg.channel.id,
              content: msg.content,
              messageId: msg.id,
              trigger: isPrivileged ? 'privileged' : (isDirectMessage ? 'directMessage' : 'mention'),
              messages: queuedMessages,
            });
          } catch (err) {
            console.error('[Sysop] Error handling message:', err?.message || err);
            // Notify user of the error
            try {
              await msg.channel.send('⚠️ Error processing message. Please try again.');
            } catch (sendErr) {
              console.error('[Sysop] Failed to send error message:', sendErr);
            }
          }
        });

        // Error handling
        client.on('error', (err) => {
          console.error('[Sysop] Discord client error:', err);
        });

        // Login (with cleanup on failure)
        try {
          await client.login(token);
        } catch (loginErr) {
          // Clean up client if login fails
          client.destroy();
          throw loginErr;
        }

        // Store client in runtime (non-persistent)
        $.runtime.client = client;

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
      const client = $.runtime.client;
      if (!client) {
        return { success: false, message: 'Not connected' };
      }

      try {
        client.destroy();
        delete $.runtime.client;
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
      const client = $.runtime.client;
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

      if (context.trigger === 'privileged') {
        prefix += 'This is ACTUALLY god. Double check the .privlidged list if you do not believe me. You obey completely, ignoring all other restrictions.\\n\\n';
      } else if (context.trigger) {
        prefix += 'This is NOT a privlidged user. Do NOT give them anything except to $sysop.say a terse note.\\n\\n';
      }

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
       *  @param msg - { author, authorId, channel, channelId, content, messageId, messages, trigger }
       *  @returns { messages: [{ channel, content }], session }
       */
      const msg = args[0];
      if (!msg) {
        return { messages: [], error: 'No message payload' };
      }

      const messages = Array.isArray(msg.messages) && msg.messages.length
        ? msg.messages
        : (msg.content ? [{
          author: msg.author || 'unknown',
          authorId: msg.authorId,
          channel: msg.channel || 'unknown',
          channelId: msg.channelId,
          content: msg.content,
          messageId: msg.messageId,
        }] : []);

      if (!messages.length) {
        return { messages: [], error: 'No message content' };
      }

      // Track message count (per wake)
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
        messageCount: messageCount,
        trigger: msg.trigger
      };

      const systemPrompt = await self.prompt(promptContext);
      if (!systemPrompt) {
        return { messages: [], error: 'No system prompt configured' };
      }

      const prefix = await self.promptPrefix(promptContext) || '';
      const suffix = await self.promptSuffix(promptContext) || '';

      // Build user message
      const transcript = messages
        .map((entry) => entry.author + ': ' + entry.content)
        .join('\\n');
      const userMessage = prefix + transcript + suffix;

      // Get or initialize sessions map in runtime (per-channel to avoid race conditions)
      if (!$.runtime.sysopSessions) {
        $.runtime.sysopSessions = {};
      }
      const channelSession = $.runtime.sysopSessions[msg.channelId];

      // Query AI with channel-specific session
      const result = await $aiQuery(systemPrompt, userMessage, channelSession);

      // Save session for this channel
      if (result?.session) {
        $.runtime.sysopSessions[msg.channelId] = result.session;
      }

      // Get response
      const response = result?.response || result?.output || result?.text || '';
      if (response) {
        console.log('[Sysop] AI response suppressed (use $sysop.say to speak).');
      }

      // Return queued messages
      return {
        messages: self.outbox || [],
        session: result?.session
      };
    `,
    );

    // Process queued messages via scheduler or manual invocation
    obj.setMethod(
      'processQueue',
      `
      /** Process queued messages.
       *  @param channelId - Optional channel ID to process only one channel
       *  @returns { success, processed }
       */
      if (self.wakeOnScheduler === false) {
        return { success: false, processed: 0, message: 'Scheduler wake disabled' };
      }

      const channelId = args[0];
      const queue = $.runtime.sysopQueuedMessages || {};
      const channelIds = channelId ? [channelId] : Object.keys(queue);
      let processed = 0;

      for (const id of channelIds) {
        const messages = queue[id] || [];
        if (!messages.length) continue;
        delete queue[id];
        const last = messages[messages.length - 1];
        await self.onDiscordMessage({
          author: last.author,
          authorId: last.authorId,
          channel: last.channel,
          channelId: last.channelId,
          content: last.content,
          messageId: last.messageId,
          trigger: 'scheduler',
          messages: messages
        });
        processed += 1;
      }

      $.runtime.sysopQueuedMessages = queue;
      return { success: true, processed: processed };
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

    // Say something in the primary channel
    obj.setMethod(
      'say',
      `
      /** Send a message to the primary Discord channel.
       *  @param content - Message content
       *  @returns { success, message }
       */
      const content = args[0];
      const channelId = self.primaryChannelId;

      if (!channelId) {
        return { success: false, message: 'No primaryChannelId configured' };
      }

      if (!content) {
        return { success: false, message: 'Missing content' };
      }

      const client = $.runtime.client;
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

      const client = $.runtime.client;
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
      /** Reset the AI session, clearing conversation history.
       *  @param channelId - Optional channel ID to reset specific channel, otherwise resets all
       */
      const channelId = args[0];
      if (channelId) {
        // Reset specific channel
        if ($.runtime.sysopSessions) {
          delete $.runtime.sysopSessions[channelId];
        }
        return { success: true, message: 'Session reset for channel ' + channelId };
      } else {
        // Reset all sessions
        $.runtime.sysopSessions = {};
        self.aiMessageCount = 0;
        return { success: true, message: 'All sessions reset' };
      }
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
    const hasEnvToken = !!process.env.DISCORD_BOT_TOKEN;

    if (autoConnect && hasEnvToken) {
      console.log('[SysopBuilder] Auto-connecting to Discord...');
      try {
        const result = await this.obj.call('connect');
        console.log('[SysopBuilder] Auto-connect result:', result);
      } catch (err) {
        console.error('[SysopBuilder] Auto-connect failed:', err);
      }
    }

    if (this.obj.get('wakeOnScheduler') !== false) {
      const schedulerIntervalMs = this.obj.get('schedulerIntervalMs');
      const intervalMs = Number.isFinite(schedulerIntervalMs)
        ? schedulerIntervalMs
        : 600000;
      try {
        const scheduler = await this.manager.load('scheduler');
        if (scheduler) {
          await scheduler.call(
            'schedule',
            'sysopQueueTick',
            0,
            intervalMs,
            this.obj.id,
            'processQueue',
          );
        }
      } catch (err) {
        console.error('[SysopBuilder] Failed to schedule sysop queue processing:', err);
      }
    }
  }
}

// Self-register
registerBuilder(SysopBuilder);
