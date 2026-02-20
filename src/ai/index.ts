/**
 * AI Module - Unified AI query interface for Malice
 *
 * Two paths:
 * 1. BYOK (Player-funded): OpenCode SDK + OpenRouter
 * 2. House (System-funded): Claude Agent SDK + OAuth
 */

export {
  openCodeQuery,
  closeAllServers,
  resolveModel,
  serverManager,
  DEFAULT_MODEL,
  MODEL_ALIASES,
  type PlayerClientOptions,
  type OpenCodeQueryResult,
} from './opencode-client.js';
