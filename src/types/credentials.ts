/**
 * API Credential Management Types for BYOK
 *
 * Players can provide their own API credentials for LLM providers.
 * Credentials are encrypted at rest using AES-256-GCM.
 */

/**
 * Supported LLM providers for BYOK
 */
export type ProviderType = 'anthropic' | 'bedrock' | 'vertex';

/**
 * Model tier selection for Claude models
 */
export type ModelTier = 'haiku' | 'sonnet' | 'opus';

/**
 * Encrypted credential stored in database
 */
export interface StoredCredential {
  /** Unique credential ID */
  id: string;

  /** Player who owns this credential */
  playerId: number;

  /** Provider type */
  provider: ProviderType;

  /** Encrypted API key (AES-256-GCM) */
  encryptedKey: string;

  /** Initialization vector for decryption */
  iv: string;

  /** Authentication tag for GCM mode */
  authTag: string;

  /** When credential was added */
  createdAt: string;

  /** Last successful validation timestamp */
  lastValidated?: string;

  /** Last validation error (if any) */
  lastError?: string;
}

/**
 * Decrypted credential for API calls (never persisted)
 */
export interface DecryptedCredential {
  /** Credential ID */
  id: string;

  /** Provider type */
  provider: ProviderType;

  /** Plaintext API key (use immediately, never cache) */
  key: string;
}

/**
 * Result of credential validation
 */
export interface ValidationResult {
  /** Whether validation succeeded */
  success: boolean;

  /** Human-readable message */
  message: string;

  /** Technical error details (for logging) */
  error?: string;
}

/**
 * Options for credential operations
 */
export interface CredentialOptions {
  /** Skip validation on add (not recommended) */
  skipValidation?: boolean;

  /** Metadata for audit logging */
  metadata?: Record<string, unknown>;
}

/**
 * Trial status for a player
 */
export interface TrialStatus {
  /** When trial started (ISO timestamp) */
  started: string;

  /** Number of actions consumed */
  actionsUsed: number;

  /** Maximum actions allowed */
  actionsLimit: number;

  /** Trial duration in milliseconds */
  durationMs: number;

  /** Whether trial is exhausted */
  exhausted: boolean;

  /** Human-readable status message */
  message: string;
}

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
  /** Provider type */
  type: ProviderType;

  /** Model name mapping */
  models: {
    haiku: string;
    sonnet: string;
    opus: string;
  };

  /** Validation endpoint for testing keys */
  validationMethod: 'list-models' | 'small-completion';

  /** Expected key format regex */
  keyFormat: RegExp;
}

/**
 * Provider configurations
 */
export const PROVIDER_CONFIGS: Record<ProviderType, ProviderConfig> = {
  anthropic: {
    type: 'anthropic',
    models: {
      haiku: 'claude-3-5-haiku-20241022',
      sonnet: 'claude-3-5-sonnet-20241022',
      opus: 'claude-opus-4-5-20251101',
    },
    validationMethod: 'list-models',
    keyFormat: /^sk-ant-[a-zA-Z0-9_-]{95,}$/,
  },
  bedrock: {
    type: 'bedrock',
    models: {
      haiku: 'anthropic.claude-3-5-haiku-20241022-v1:0',
      sonnet: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      opus: 'anthropic.claude-opus-4-5-20251101-v1:0',
    },
    validationMethod: 'list-models',
    // Bedrock uses AWS access key ID format
    keyFormat: /^[A-Z0-9]{20}$/,
  },
  vertex: {
    type: 'vertex',
    models: {
      haiku: 'claude-3-5-haiku@20241022',
      sonnet: 'claude-3-5-sonnet@20241022',
      opus: 'claude-opus-4-5@20251101',
    },
    validationMethod: 'list-models',
    // Vertex uses service account JSON (JSON structure check)
    keyFormat: /^\{.*"type":\s*"service_account".*\}$/s,
  },
};

/**
 * Trial limits configuration
 */
export const TRIAL_LIMITS = {
  /** Maximum actions on house key */
  MAX_ACTIONS: 50,

  /** Maximum trial duration (30 minutes in ms) */
  MAX_DURATION_MS: 30 * 60 * 1000,
} as const;
