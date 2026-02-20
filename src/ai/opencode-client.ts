/**
 * OpenCode SDK Integration for Malice BYOK
 *
 * This module provides player-funded AI queries through OpenRouter.
 * Players can bring their own OpenRouter API key to use any model
 * (Kimi K2.5, Claude, GPT, etc.) with full agentic capabilities.
 *
 * Architecture:
 * - Player BYOK: OpenCode SDK + OpenRouter (this module)
 * - House/System: Claude Agent SDK + OAuth ($aiQuery in object-manager)
 */

import {
  createOpencode,
  type OpencodeClient,
  type Config,
} from '@opencode-ai/sdk';

/**
 * Options for creating a player-specific OpenCode client
 */
export interface PlayerClientOptions {
  /** Player's OpenRouter API key */
  openRouterApiKey: string;

  /** Model to use (default: openrouter/moonshotai/kimi-k2.5) */
  model?: string;

  /** Working directory for the session */
  cwd?: string;

  /** Session ID for continuity */
  sessionId?: string;
}

/**
 * Result of an OpenCode query
 */
export interface OpenCodeQueryResult {
  /** The AI response text */
  response: string;

  /** Session ID for continuation */
  sessionId: string;

  /** Model used */
  model: string;

  /** Whether the query succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

/**
 * Default model for BYOK queries (cheap and capable)
 */
export const DEFAULT_MODEL = 'openrouter/moonshotai/kimi-k2.5';

/**
 * Model aliases for player convenience
 */
export const MODEL_ALIASES: Record<string, string> = {
  'kimi': 'openrouter/moonshotai/kimi-k2.5',
  'kimi-k2.5': 'openrouter/moonshotai/kimi-k2.5',
  'claude': 'openrouter/anthropic/claude-sonnet-4',
  'claude-sonnet': 'openrouter/anthropic/claude-sonnet-4',
  'claude-opus': 'openrouter/anthropic/claude-opus-4',
  'gpt': 'openrouter/openai/gpt-4o',
  'gpt-4o': 'openrouter/openai/gpt-4o',
  'deepseek': 'openrouter/deepseek/deepseek-chat',
};

/**
 * Resolve model alias to full model ID
 */
export function resolveModel(modelOrAlias: string): string {
  return MODEL_ALIASES[modelOrAlias.toLowerCase()] || modelOrAlias;
}

/**
 * Server instance manager - one server per player
 * This allows multiple concurrent player sessions
 */
class OpenCodeServerManager {
  private servers = new Map<
    string,
    {
      client: OpencodeClient;
      close: () => void;
      url: string;
      lastUsed: number;
    }
  >();

  private nextPort = 14096; // Start above default 4096

  /**
   * Get or create a server for a player
   */
  async getClient(playerId: string, options: PlayerClientOptions): Promise<{
    client: OpencodeClient;
    sessionId: string;
  }> {
    const key = `${playerId}:${options.openRouterApiKey.slice(-8)}`;

    // Check for existing server
    let entry = this.servers.get(key);

    if (!entry) {
      // Create new server for this player
      const port = this.nextPort++;
      const config: Config = {
        model: resolveModel(options.model || DEFAULT_MODEL),
        provider: {
          openrouter: {
            options: {
              apiKey: options.openRouterApiKey,
            },
          },
        },
        // Auto-allow all permissions for programmatic use
        permission: {
          edit: 'allow',
          bash: 'allow',
          webfetch: 'allow',
        },
      };

      const { client, server } = await createOpencode({
        port,
        config,
      });

      entry = {
        client,
        close: server.close,
        url: server.url,
        lastUsed: Date.now(),
      };

      this.servers.set(key, entry);
      console.log(`[OpenCode] Created server for player ${playerId} at ${server.url}`);
    }

    entry.lastUsed = Date.now();

    // Get or create session
    let sessionId = options.sessionId;
    if (!sessionId) {
      const result = await entry.client.session.create();
      if (result.data) {
        sessionId = result.data.id;
      } else {
        throw new Error('Failed to create session');
      }
    }

    return { client: entry.client, sessionId };
  }

  /**
   * Cleanup idle servers (older than 30 minutes)
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [key, entry] of this.servers.entries()) {
      if (now - entry.lastUsed > maxAge) {
        console.log(`[OpenCode] Cleaning up idle server: ${key}`);
        entry.close();
        this.servers.delete(key);
      }
    }
  }

  /**
   * Close all servers
   */
  closeAll(): void {
    for (const [key, entry] of this.servers.entries()) {
      console.log(`[OpenCode] Closing server: ${key}`);
      entry.close();
    }
    this.servers.clear();
  }
}

// Singleton server manager
const serverManager = new OpenCodeServerManager();

// Cleanup idle servers every 5 minutes
setInterval(() => serverManager.cleanup(), 5 * 60 * 1000);

/**
 * Query OpenCode with player's BYOK credentials
 *
 * @param playerId - Player identifier (for server management)
 * @param options - Client options including API key
 * @param systemPrompt - System prompt for the AI
 * @param userPrompt - User input
 * @returns Query result
 */
export async function openCodeQuery(
  playerId: string,
  options: PlayerClientOptions,
  systemPrompt: string,
  userPrompt: string
): Promise<OpenCodeQueryResult> {
  try {
    const { client, sessionId } = await serverManager.getClient(playerId, options);

    // Build the prompt with system context
    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n---\n\nUser: ${userPrompt}`
      : userPrompt;

    // Send prompt and wait for response
    const result = await client.session.prompt({
      path: { id: sessionId },
      body: {
        parts: [{ type: 'text', text: fullPrompt }],
      },
    });

    if (result.error) {
      return {
        response: '',
        sessionId,
        model: resolveModel(options.model || DEFAULT_MODEL),
        success: false,
        error: String(result.error),
      };
    }

    // Extract response text from parts
    let responseText = '';
    if (result.data?.parts) {
      for (const part of result.data.parts) {
        if (part.type === 'text' && 'text' in part) {
          responseText += part.text;
        }
      }
    }

    return {
      response: responseText,
      sessionId,
      model: resolveModel(options.model || DEFAULT_MODEL),
      success: true,
    };
  } catch (err) {
    const error = err as Error;
    console.error('[OpenCode] Query error:', error.message);

    return {
      response: '',
      sessionId: options.sessionId || '',
      model: resolveModel(options.model || DEFAULT_MODEL),
      success: false,
      error: error.message,
    };
  }
}

/**
 * Close all OpenCode servers (for shutdown)
 */
export function closeAllServers(): void {
  serverManager.closeAll();
}

// Export server manager for advanced usage
export { serverManager };
