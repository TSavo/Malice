/**
 * SSH Server - SSH2 server with public key and password authentication
 */

import ssh2 from 'ssh2';
import type { AuthContext, Connection as SSH2Connection } from 'ssh2';
const { Server: SSH2Server } = ssh2;
import { generateKeyPairSync } from 'crypto';
import { Subject } from 'rxjs';
import { SSHTransport } from './ssh-transport.js';
import { Connection } from '../../connection/connection.js';
import type { AuthInfo } from '../../../types/auth.js';

export interface SSHServerConfig {
  port: number;
  host?: string;
  hostKey?: string | Buffer;  // PEM-encoded private key (auto-generated if not provided)
  debug?: boolean;
}

/**
 * Callback to look up SSH public keys for a username
 * Returns array of OpenSSH format public key strings, or null if user not found
 */
export type SSHKeyLookup = (username: string) => Promise<string[] | null>;

/**
 * Callback to verify password for a username
 * Returns true if password is valid
 */
export type SSHPasswordVerify = (username: string, password: string) => Promise<boolean>;

/**
 * SSH server for Malice MOO
 * Supports public key and password (keyboard-interactive) authentication
 */
export class SSHServer {
  private server: SSH2Server;
  private hostKey: string | Buffer;
  private readonly destroyed$ = new Subject<void>();

  /** Observable stream of new connections */
  public readonly connection$ = new Subject<Connection>();

  /** Observable stream of errors */
  public readonly error$ = new Subject<Error>();

  /** Callback to look up SSH keys for a user */
  public keyLookup: SSHKeyLookup = async () => null;

  /** Callback to verify password */
  public passwordVerify: SSHPasswordVerify = async () => false;

  constructor(private config: SSHServerConfig) {
    // Generate host key if not provided
    this.hostKey = config.hostKey || this.generateHostKey();

    this.server = new SSH2Server({
      hostKeys: [this.hostKey],
    }, (client) => {
      this.handleClient(client);
    });

    this.setupEventHandlers();
  }

  /**
   * Generate an RSA host key
   */
  private generateHostKey(): string {
    if (this.config.debug) {
      console.log('[SSHServer] Generating RSA host key...');
    }
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 4096,
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });
    return privateKey;
  }

  /**
   * Get the host key (for storage in MongoDB)
   */
  getHostKey(): string {
    return typeof this.hostKey === 'string' ? this.hostKey : this.hostKey.toString('utf8');
  }

  /**
   * Set up server event handlers
   */
  private setupEventHandlers(): void {
    this.server.on('error', (err: Error) => {
      if (this.config.debug) {
        console.error('[SSHServer] Error:', err);
      }
      this.error$.next(err);
    });
  }

  /**
   * Handle new SSH client connection
   */
  private handleClient(client: SSH2Connection): void {
    const remoteAddress = (client as any)._sock?.remoteAddress || 'unknown';
    let authInfo: AuthInfo | null = null;
    let authenticatedUsername: string | null = null;

    if (this.config.debug) {
      console.log(`[SSHServer] New client from ${remoteAddress}`);
    }

    // Handle authentication
    client.on('authentication', async (ctx: AuthContext) => {
      const username = ctx.username;

      if (this.config.debug) {
        console.log(`[SSHServer] Auth attempt: ${username} via ${ctx.method}`);
      }

      if (ctx.method === 'publickey') {
        // Public key authentication
        const userKeys = await this.keyLookup(username);
        if (!userKeys || userKeys.length === 0) {
          if (this.config.debug) {
            console.log(`[SSHServer] No keys found for user: ${username}`);
          }
          return ctx.reject(['keyboard-interactive', 'password']);
        }

        // Check if the client's key matches any stored key
        const clientKey = ctx.key;
        const clientKeyData = clientKey.data.toString('base64');
        const clientAlgo = clientKey.algo;

        for (const storedKey of userKeys) {
          const parts = storedKey.trim().split(/\s+/);
          if (parts.length >= 2) {
            const storedAlgo = parts[0];
            const storedData = parts[1];

            // Normalize algorithm names
            const normalizedClientAlgo = clientAlgo.replace('ssh-', '').toLowerCase();
            const normalizedStoredAlgo = storedAlgo.replace('ssh-', '').toLowerCase();

            if (normalizedStoredAlgo === normalizedClientAlgo && storedData === clientKeyData) {
              if (ctx.signature) {
                // Client has provided signature - verify and accept
                // The ssh2 library handles signature verification
                authenticatedUsername = username;
                authInfo = {
                  mode: 'ssh-key',
                  sshKey: {
                    publicKey: storedKey,
                    fingerprint: this.getKeyFingerprint(storedKey),
                    algorithm: storedAlgo,
                    comment: parts[2] || undefined,
                  },
                  metadata: {
                    remoteAddress,
                    protocol: 'ssh',
                  },
                };
                if (this.config.debug) {
                  console.log(`[SSHServer] Public key auth success: ${username}`);
                }
                return ctx.accept();
              } else {
                // Client is checking if this key is acceptable
                return ctx.accept();
              }
            }
          }
        }

        // No matching key found
        return ctx.reject(['keyboard-interactive', 'password']);
      }

      if (ctx.method === 'keyboard-interactive') {
        // Keyboard-interactive (password prompt)
        return (ctx as any).prompt([
          { prompt: 'Password: ', echo: false }
        ], '', async (responses: string[]) => {
          const password = responses[0];
          const valid = await this.passwordVerify(username, password);
          if (valid) {
            authenticatedUsername = username;
            authInfo = null; // Password auth goes through normal game auth flow
            if (this.config.debug) {
              console.log(`[SSHServer] Password auth success: ${username}`);
            }
            ctx.accept();
          } else {
            if (this.config.debug) {
              console.log(`[SSHServer] Password auth failed: ${username}`);
            }
            ctx.reject();
          }
        });
      }

      if (ctx.method === 'password') {
        // Direct password authentication
        const valid = await this.passwordVerify(username, ctx.password);
        if (valid) {
          authenticatedUsername = username;
          authInfo = null;
          if (this.config.debug) {
            console.log(`[SSHServer] Direct password auth success: ${username}`);
          }
          return ctx.accept();
        }
        return ctx.reject();
      }

      // Unknown method
      return ctx.reject(['publickey', 'keyboard-interactive', 'password']);
    });

    // Handle session (shell) request
    client.on('session', (accept, _reject) => {
      const session = accept();

      session.on('pty', (accept, _reject, info) => {
        if (this.config.debug) {
          console.log(`[SSHServer] PTY request: ${info.cols}x${info.rows}`);
        }
        accept?.();

        // Store PTY info for transport
        (session as any)._ptyInfo = info;
      });

      session.on('window-change', (accept, _reject, info) => {
        if ((session as any)._transport) {
          (session as any)._transport.setWindowSize(info.cols, info.rows);
        }
        accept?.();
      });

      session.on('shell', (accept, _reject) => {
        const channel = accept();
        const ptyInfo = (session as any)._ptyInfo || { cols: 80, rows: 24 };

        // Create transport
        const transport = new SSHTransport(channel, remoteAddress);
        transport.setWindowSize(ptyInfo.cols, ptyInfo.rows);
        // Terminal type comes from PTY modes if available
        if ((ptyInfo as any).term) {
          transport.setTerminalType((ptyInfo as any).term);
        }

        // Store for window-change events
        (session as any)._transport = transport;

        // Create connection
        const connection = new Connection(transport, authInfo);

        // If we have a username from SSH auth, store it
        if (authenticatedUsername) {
          (connection as any)._sshUsername = authenticatedUsername;
        }

        if (this.config.debug) {
          console.log(`[SSHServer] Shell session started: ${connection.id}`);
        }

        // Emit connection
        this.connection$.next(connection);
      });
    });

    client.on('error', (err) => {
      if (this.config.debug) {
        console.error('[SSHServer] Client error:', err.message);
      }
    });

    client.on('end', () => {
      if (this.config.debug) {
        console.log('[SSHServer] Client disconnected');
      }
    });
  }

  /**
   * Get fingerprint of an OpenSSH format public key
   */
  private getKeyFingerprint(opensshKey: string): string {
    try {
      const parts = opensshKey.trim().split(/\s+/);
      if (parts.length >= 2) {
        const keyData = Buffer.from(parts[1], 'base64');
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(keyData).digest('base64');
        return `SHA256:${hash.replace(/=+$/, '')}`;
      }
    } catch {
      // Ignore errors
    }
    return 'unknown';
  }

  /**
   * Start listening for connections
   */
  async listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host || '0.0.0.0', () => {
        console.log(`🔐 SSH server listening on ${this.config.host || '0.0.0.0'}:${this.config.port}`);
        resolve();
      });

      this.server.once('error', reject);
    });
  }

  /**
   * Close the server
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.destroyed$.next();
      this.destroyed$.complete();
      this.connection$.complete();
      this.error$.complete();

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          if (this.config.debug) {
            console.log('[SSHServer] Server closed');
          }
          resolve();
        }
      });
    });
  }
}
