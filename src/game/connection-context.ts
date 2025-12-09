import { Connection } from '../connection/connection.js';
import { ObjectManager } from '../database/object-manager.js';
import { getGameLogger } from '../database/game-logger.js';
import type { RuntimeObject } from '../../types/object.js';
import type { ObjId } from '../../types/object.js';
import type { AuthInfo } from '../../types/auth.js';

/**
 * Connection context - bridges transport layer with object system
 * Wraps a Connection and provides methods for objects to interact with it
 * Exposes authentication info from transport for MOO code to validate
 */
export class ConnectionContext {
  private currentHandler: RuntimeObject | null = null;
  private userId: ObjId | null = null;
  private locationId: ObjId | null = null;

  constructor(
    private connection: Connection,
    private manager: ObjectManager
  ) {
    // Log connection
    const logger = getGameLogger();
    if (logger) {
      logger.logConnect(
        this.id,
        this.connection.transport.remoteAddress,
        this.connection.transport.type as 'telnet' | 'websocket' | 'tls'
      );
    }

    // Forward input to current handler
    this.connection.input$.subscribe((data) => {
      if (this.currentHandler) {
        this.handleInput(data);
      }
    });

    // Log disconnect when closed
    this.connection.transport.closed$.subscribe(() => {
      const logger = getGameLogger();
      if (logger) {
        logger.logDisconnect(this.id, this.userId ?? -1, 'connection closed');
      }
    });
  }

  /**
   * Set the object that should handle input for this connection
   */
  setHandler(obj: RuntimeObject): void {
    this.currentHandler = obj;
  }

  /**
   * Handle input by calling current handler's onInput method
   */
  private async handleInput(data: string): Promise<void> {
    if (!this.currentHandler) return;

    // Sync location from player's body before logging
    // Handler is the player object; player.body is the embodied character
    await this.syncLocationFromHandler();

    // Log the command (if authenticated)
    if (this.userId !== null) {
      const logger = getGameLogger();
      if (logger) {
        const trimmed = data.trim();
        const parts = trimmed.split(/\s+/);
        const verb = parts[0] || '';
        const args = parts.slice(1).join(' ');

        logger.logCommand(
          this.id,
          this.userId,
          this.locationId ?? -1,
          trimmed,
          verb,
          args,
          this.connection.transport.remoteAddress
        );
      }
    }

    try {
      // Call the handler's onInput method, passing this context and the data
      await this.currentHandler.call('onInput', this, data);
    } catch (err) {
      console.error(
        `Error in handler #${this.currentHandler.id} onInput:`,
        err instanceof Error ? err.message : String(err)
      );
      this.send('An error occurred processing your input.\r\n');
    }
  }

  /**
   * Sync location from the current handler (player) to this context
   * The handler is typically a Player object with a body property
   */
  private async syncLocationFromHandler(): Promise<void> {
    if (!this.currentHandler) return;

    try {
      // Get the player's body (embodied character)
      const bodyId = this.currentHandler.get('body') as ObjId | undefined;
      if (bodyId) {
        const body = await this.manager.load(bodyId);
        if (body) {
          const location = body.get('location') as ObjId | undefined;
          if (location !== undefined) {
            this.locationId = location;
          }
        }
      }
    } catch {
      // Silently fail - location sync is best-effort
    }
  }

  /**
   * Send text to the connection
   */
  send(text: string): void {
    this.connection.send(text);
  }

  /**
   * Authenticate with a user object ID
   */
  authenticate(userId: ObjId): void {
    this.userId = userId;
    this.connection.authenticate(userId.toString());

    // Log successful authentication
    const logger = getGameLogger();
    if (logger) {
      logger.logAuth(
        this.id,
        userId,
        this.connection.transport.remoteAddress,
        true,
        `#${userId}`
      );
    }
  }

  /**
   * Update current location (for logging)
   * Called by movement code to track where player is
   */
  setLocation(locationId: ObjId): void {
    this.locationId = locationId;
  }

  /**
   * Get current location
   */
  getLocation(): ObjId | null {
    return this.locationId;
  }

  /**
   * Close the connection
   */
  close(): void {
    this.connection.close();
  }

  /**
   * Get connection ID
   */
  get id(): string {
    return this.connection.id;
  }

  /**
   * Get authenticated user ID
   */
  getUserId(): ObjId | null {
    return this.userId;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.userId !== null;
  }

  /**
   * Get authentication info provided by transport (if any)
   * Returns null for unauthenticated connections (raw telnet, etc.)
   * Returns AuthInfo for pre-authenticated connections (SSL cert, HTTP auth, etc.)
   */
  getAuthInfo(): AuthInfo | null {
    return this.connection.authInfo;
  }

  /**
   * Check if connection arrived with transport-level authentication
   * true = SSL cert, HTTP auth, OAuth, etc. (credentials present, need validation)
   * false = Raw connection, interactive login required
   */
  isPreAuthenticated(): boolean {
    return this.connection.authInfo !== null;
  }

  /**
   * Get the object manager (for objects to find other objects)
   */
  get $(): ObjectManager {
    return this.manager;
  }

  /**
   * Load an object from the database
   */
  async load(id: ObjId): Promise<RuntimeObject | null> {
    return await this.manager.load(id);
  }

  /**
   * Get terminal capabilities
   */
  get capabilities() {
    return this.connection.transport.capabilities;
  }

  /**
   * Ask a question with optional validation
   * Returns a promise that resolves with the validated answer
   */
  async question(
    prompt: string,
    validator?: (input: string) => string | undefined
  ): Promise<string> {
    return new Promise((resolve) => {
      const askAgain = (errorMsg?: string) => {
        if (errorMsg) {
          this.send(`${errorMsg}\r\n`);
        }
        this.send(prompt);

        // Set up one-time input handler
        const subscription = this.connection.input$.subscribe((input) => {
          const trimmed = input.trim();

          // Ignore empty input (stray newlines)
          if (!trimmed) {
            return;
          }

          subscription.unsubscribe();

          // Validate if validator provided
          if (validator) {
            const error = validator(trimmed);
            if (error) {
              askAgain(error);
              return;
            }
          }

          resolve(trimmed);
        });
      };

      askAgain();
    });
  }

  /**
   * Present a choice menu and return the selected key
   */
  async choice(
    prompt: string,
    options: Record<string, string>
  ): Promise<string> {
    return new Promise((resolve) => {
      // Build menu text
      let menuText = `${prompt}\r\n`;
      const keys = Object.keys(options);
      keys.forEach((key, idx) => {
        menuText += `  ${idx + 1}) ${options[key]}\r\n`;
      });
      menuText += 'Enter number: ';

      const askAgain = (errorMsg?: string) => {
        if (errorMsg) {
          this.send(`${errorMsg}\r\n`);
        }
        this.send(menuText);

        const subscription = this.connection.input$.subscribe((input) => {
          const trimmed = input.trim();

          // Ignore empty input (stray newlines)
          if (!trimmed) {
            return;
          }

          subscription.unsubscribe();

          const num = parseInt(trimmed);
          if (isNaN(num) || num < 1 || num > keys.length) {
            askAgain('Invalid choice. Please enter a number from the menu.');
            return;
          }

          resolve(keys[num - 1]);
        });
      };

      askAgain();
    });
  }

  /**
   * Ask a yes/no question
   * Returns promise that resolves to true for yes, false for no
   */
  async yesorno(prompt: string): Promise<boolean> {
    return new Promise((resolve) => {
      const askAgain = (errorMsg?: string) => {
        if (errorMsg) {
          this.send(`${errorMsg}\r\n`);
        }
        this.send(`${prompt} (yes/no): `);

        const subscription = this.connection.input$.subscribe((input) => {
          const trimmed = input.trim();

          // Ignore empty input (stray newlines)
          if (!trimmed) {
            return;
          }

          subscription.unsubscribe();

          const answer = trimmed.toLowerCase();
          if (answer === 'yes' || answer === 'y') {
            resolve(true);
          } else if (answer === 'no' || answer === 'n') {
            resolve(false);
          } else {
            askAgain('Please answer yes or no.');
          }
        });
      };

      askAgain();
    });
  }
}
