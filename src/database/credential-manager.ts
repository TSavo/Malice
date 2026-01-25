/**
 * Credential Manager - Secure storage and retrieval of player API credentials
 *
 * Architecture:
 * - Encrypts credentials at rest using AES-256-GCM
 * - Decrypts just-in-time for API calls (no caching)
 * - Master key from environment variable (BYOK_MASTER_KEY)
 * - Stored credentials include IV and auth tag for GCM mode
 *
 * Security:
 * - Decrypted keys never cached in memory
 * - Encryption/decryption happens per-request
 * - Master key never committed to version control
 */

import crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import type {
  StoredCredential,
  DecryptedCredential,
  ProviderType,
  ValidationResult,
  CredentialOptions,
} from '@types/credentials.js';
import { PROVIDER_CONFIGS } from '@types/credentials.js';

/**
 * Master encryption key for credentials
 * MUST be 32 bytes (256 bits) for AES-256
 */
function getMasterKey(): Buffer {
  const key = process.env.BYOK_MASTER_KEY;
  if (!key) {
    throw new Error(
      'BYOK_MASTER_KEY environment variable not set. Generate with: openssl rand -hex 32',
    );
  }

  // Convert hex string to buffer
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error(
      `BYOK_MASTER_KEY must be 32 bytes (64 hex chars). Current: ${keyBuffer.length} bytes`,
    );
  }

  return keyBuffer;
}

/**
 * Encrypt API key using AES-256-GCM
 *
 * @param plaintext - API key to encrypt
 * @returns Encrypted data with IV and auth tag
 */
export function encryptKey(plaintext: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const masterKey = getMasterKey();

  // Generate random IV (12 bytes recommended for GCM)
  const iv = crypto.randomBytes(12);

  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

  // Encrypt
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get auth tag for integrity verification
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt API key using AES-256-GCM
 *
 * @param encrypted - Encrypted key (hex)
 * @param iv - Initialization vector (hex)
 * @param authTag - Authentication tag (hex)
 * @returns Decrypted API key
 * @throws Error if decryption fails or auth tag invalid
 */
export function decryptKey(
  encrypted: string,
  iv: string,
  authTag: string,
): string {
  const masterKey = getMasterKey();

  // Create decipher
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    masterKey,
    Buffer.from(iv, 'hex'),
  );

  // Set auth tag for integrity verification
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  // Decrypt
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Credential Manager
 *
 * Manages encrypted player credentials with just-in-time decryption.
 * All methods are async to support future database integration.
 */
export class CredentialManager {
  /**
   * Add a new credential for a player
   *
   * @param playerId - Player object ID
   * @param provider - Provider type
   * @param apiKey - Plaintext API key
   * @param options - Additional options
   * @returns Stored credential metadata
   */
  async add(
    playerId: number,
    provider: ProviderType,
    apiKey: string,
    options: CredentialOptions = {},
  ): Promise<StoredCredential> {
    // Validate key format
    const config = PROVIDER_CONFIGS[provider];
    if (!config.keyFormat.test(apiKey)) {
      throw new Error(
        `Invalid ${provider} key format. Expected format: ${config.keyFormat.source}`,
      );
    }

    // Encrypt the key
    const { encrypted, iv, authTag } = encryptKey(apiKey);

    // Create credential record
    const credential: StoredCredential = {
      id: randomUUID(),
      playerId,
      provider,
      encryptedKey: encrypted,
      iv,
      authTag,
      createdAt: new Date().toISOString(),
    };

    // Validate if requested (default: true)
    if (!options.skipValidation) {
      const validation = await this.validateCredential(credential);
      if (!validation.success) {
        throw new Error(
          `Credential validation failed: ${validation.message}`,
        );
      }
      credential.lastValidated = new Date().toISOString();
    }

    return credential;
  }

  /**
   * Get decrypted credential for API calls
   *
   * IMPORTANT: Decrypts just-in-time, never caches decrypted key
   *
   * @param credential - Stored credential
   * @returns Decrypted credential (use immediately, never store)
   */
  decrypt(credential: StoredCredential): DecryptedCredential {
    const key = decryptKey(
      credential.encryptedKey,
      credential.iv,
      credential.authTag,
    );

    return {
      id: credential.id,
      provider: credential.provider,
      key,
    };
  }

  /**
   * Validate a credential by making a small test API call
   *
   * @param credential - Credential to validate
   * @returns Validation result
   */
  async validateCredential(
    credential: StoredCredential,
  ): Promise<ValidationResult> {
    try {
      const decrypted = this.decrypt(credential);
      const config = PROVIDER_CONFIGS[credential.provider];

      // Provider-specific validation
      switch (credential.provider) {
        case 'anthropic':
          return await this.validateAnthropic(decrypted.key);
        case 'bedrock':
          return await this.validateBedrock(decrypted.key);
        case 'vertex':
          return await this.validateVertex(decrypted.key);
        default:
          return {
            success: false,
            message: `Unknown provider: ${credential.provider}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Validation failed',
        error: String(error),
      };
    }
  }

  /**
   * Validate Anthropic API key
   */
  private async validateAnthropic(apiKey: string): Promise<ValidationResult> {
    try {
      // Import SDK dynamically to avoid loading unless needed
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey });

      // Small test call - list available models
      await client.models.list();

      return {
        success: true,
        message: 'Anthropic API key validated successfully',
      };
    } catch (error: unknown) {
      return this.translateAnthropicError(error);
    }
  }

  /**
   * Validate AWS Bedrock credentials
   */
  private async validateBedrock(accessKeyId: string): Promise<ValidationResult> {
    // TODO: Implement Bedrock validation
    // Requires AWS SDK and secret access key
    return {
      success: false,
      message: 'Bedrock validation not yet implemented',
      error: 'NOT_IMPLEMENTED',
    };
  }

  /**
   * Validate GCP Vertex AI credentials
   */
  private async validateVertex(serviceAccountJson: string): Promise<ValidationResult> {
    // TODO: Implement Vertex AI validation
    // Requires GCP SDK and service account JSON parsing
    return {
      success: false,
      message: 'Vertex AI validation not yet implemented',
      error: 'NOT_IMPLEMENTED',
    };
  }

  /**
   * Translate Anthropic API errors into player-friendly messages
   */
  private translateAnthropicError(error: unknown): ValidationResult {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('authentication') || message.includes('api key')) {
        return {
          success: false,
          message:
            'Invalid API key. Check that your key starts with "sk-ant-" and is copied correctly.',
          error: error.message,
        };
      }

      if (message.includes('rate limit')) {
        return {
          success: false,
          message:
            'API key is rate limited. Wait a few minutes and try again.',
          error: error.message,
        };
      }

      if (message.includes('quota')) {
        return {
          success: false,
          message:
            'API quota exhausted. Upgrade your Anthropic plan or use a different key.',
          error: error.message,
        };
      }

      if (message.includes('network') || message.includes('timeout')) {
        return {
          success: false,
          message:
            'Unable to reach Anthropic API. Check your internet connection.',
          error: error.message,
        };
      }
    }

    // Generic error
    return {
      success: false,
      message: 'Unable to validate API key. Please try again.',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Singleton instance
export const credentialManager = new CredentialManager();
