/**
 * Session Manager Builder
 *
 * Creates $.session object for telnet session management.
 * Player-facing wrapper around $.telnet native methods.
 * Used by Session MCP server (port 3012) - sandboxed for player access.
 */

import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

export class SessionBuilder implements Builder {
  static provides = ['session'];
  static depends: string[] = [];

  private session: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    console.log('[SessionBuilder] Building $.session object...');

    // Get root
    const root = await this.manager.load('root');
    if (!root) throw new Error('Root object not found');

    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.session) {
      this.session = await this.manager.load(aliases.session);
      if (this.session) {
        console.log(
          `[SessionBuilder] Loaded existing $.session (#${aliases.session})`,
        );
        return;
      }
    }

    if (!this.session) {
      this.session = await this.manager.create({
        parent: root,
        properties: {
          name: 'Session Manager',
          description: 'Manages telnet sessions for player access',
        },
      });
      console.log(`[SessionBuilder] Created $.session (#${this.session.id})`);
    }

    // Build methods (always rebuild when force is true)
    await this.buildMethods();

    console.log('[SessionBuilder] $.session ready');
  }

  private async buildMethods(): Promise<void> {
    if (!this.session) throw new Error('Session object not created');

    // Connect to MOO via telnet
    this.session.setMethod(
      'connect',
      `
      return await $.telnet.connect();
    `,
    );

    // Send command to session
    this.session.setMethod(
      'send',
      `
      const sessionId = args[0];
      const command = args[1];
      return await $.telnet.send(sessionId, command);
    `,
    );

    // Get session log
    this.session.setMethod(
      'getLog',
      `
      const sessionId = args[0];
      const lines = args[1];
      return await $.telnet.getLog(sessionId, lines);
    `,
    );

    // List all active sessions
    this.session.setMethod(
      'list',
      `
      return await $.telnet.list();
    `,
    );

    // Close session
    this.session.setMethod(
      'close',
      `
      const sessionId = args[0];
      return await $.telnet.close(sessionId);
    `,
    );

    // Get session status
    this.session.setMethod(
      'getStatus',
      `
      const sessionId = args[0];
      return await $.telnet.getStatus(sessionId);
    `,
    );

    // Add SSH key (convenience wrapper)
    this.session.setMethod(
      'addKey',
      `
      const sessionId = args[0];
      const key = args[1];
      const result = await $.telnet.send(sessionId, \`addkey \${key}\`);
      return { output: result.output, closed: result.closed };
    `,
    );

    // List SSH keys (convenience wrapper)
    this.session.setMethod(
      'listKeys',
      `
      const sessionId = args[0];
      const result = await $.telnet.send(sessionId, 'listkeys');
      return { output: result.output, closed: result.closed };
    `,
    );

    // Remove SSH key (convenience wrapper)
    this.session.setMethod(
      'removeKey',
      `
      const sessionId = args[0];
      const keyId = args[1];
      const result = await $.telnet.send(sessionId, \`removekey \${keyId}\`);
      return { output: result.output, closed: result.closed };
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.session) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'session', this.session.id);
    console.log(`Registered session alias -> #${this.session.id}`);
  }
}

// Self-register
registerBuilder(SessionBuilder);
