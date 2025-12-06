import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Player prototype
 * Base prototype for player characters with authentication and command handling
 */
export class PlayerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(humanId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: humanId,
      properties: {
        name: 'Player',
        description: 'Base prototype for player characters',

        // Authentication
        playername: '',
        email: '',
        passwordHash: '',
        sslFingerprint: '',
        oauthSubject: '',

        // Permissions
        canUseDevTools: false,
        isWizard: false,
        isSuspended: false,

        // Stats
        createdAt: null,
        lastLogin: null,
        totalPlaytime: 0,

        // Player-specific
        title: '',
        homepage: '',
      },
      methods: {},
    });

    this.addConnectionMethods(obj);
    this.addInputMethods(obj);
    this.addAuthMethods(obj);

    return obj;
  }

  private addConnectionMethods(obj: RuntimeObject): void {
    obj.setMethod('connect', `
      const context = args[0];

      // Store context reference so tell() can send messages
      self._context = context;

      await self.tell('');
      await self.tell('Welcome back, ' + self.name + '!');
      await self.tell('You are ' + self.description);

      // Update last login
      self.lastLogin = new Date();

      // Register player's default verbs with patterns
      await self.registerVerb(['look', 'l'], self, 'look');
      await self.registerVerb(['look %i', 'look at %i', 'l %i', 'examine %i', 'ex %i'], self, 'lookAt');
      await self.registerVerb(['look %i in %t', 'look at %i in %t', 'look %i on %t'], self, 'lookIn');
      await self.registerVerb(['say %s', '"%s', "'" + "%s"], self, 'say');
      await self.registerVerb(['emote %s', ':%s'], self, 'emote');
      await self.registerVerb('quit', self);
      await self.registerVerb(['@options', '@options %s', '@options %s %s'], self, 'options');

      // If we have a location, move into it to trigger verb registration
      if (self.location && self.location !== 0) {
        const location = await $.load(self.location);
        if (location) {
          // Trigger onArrived to register room verbs
          await self.onArrived(location, null, null);
          // Show room description (visual - uses see)
          const desc = await location.describe(self);
          await self.tell('');
          await self.see(desc);
        }
      }

      // Set up command loop - player handles their own input now
      context.setHandler(self);

      // Show prompt (system - uses tell)
      await self.tell('> ');
    `);

    obj.setMethod('disconnect', `
      // Unregister all verbs from current location
      if (self.location && self.location !== 0) {
        const location = await $.load(self.location);
        if (location) {
          await self.unregisterVerbsFrom(location.id);
        }
      }

      // Save any unsaved state

      // TODO: Notify room that player left
    `);

    // Pattern: quit (no args)
    obj.setMethod('quit', `
      await player.tell('Goodbye!');
      await player.disconnect();
      player._context.close();
    `);

    // Tell - sends message directly to player's connection (bypasses eyes)
    // Use for system messages, prompts, errors
    // Processes %{color} codes based on player options
    obj.setMethod('tell', `
      const message = args[0];
      if (self._context && self._context.send) {
        const processed = await self.processColors(message);
        self._context.send(processed + '\\r\\n');
      }
    `);
  }

  private addInputMethods(obj: RuntimeObject): void {
    obj.setMethod('onInput', `
      const context = args[0];
      const input = args[1];

      const trimmed = input.trim();

      // Check if in prompt state ($.prompt handles questions, choices, yesorno)
      if (await $.prompt.isActive(self)) {
        await $.prompt.handleInput(self, trimmed);
        await self.tell('> ');
        return;
      }

      // Check if in options menu
      if (self._inOptionsMenu) {
        await self.handleOptionsInput(trimmed);
        return;
      }

      if (!trimmed) {
        await self.tell('> ');
        return;
      }

      try {
        // Match input against registered verb patterns
        const match = await self.matchVerb(trimmed);

        if (match && match.error) {
          // Pattern matched but resolution failed (ambiguous item, not found)
          await self.tell(match.error);
        } else if (match && match.handler) {
          // Found matching pattern - dispatch to handler
          // Method receives: self=handler, player=self, command=trimmed, args=resolved
          const result = await match.handler.call(
            match.verbInfo.method,
            context,
            self,           // player
            trimmed,        // command (raw input)
            ...match.args   // resolved %i, %t, %s in pattern order
          );
          if (result !== undefined) {
            await self.tell(result);
          }
        } else {
          // No matching pattern found
          const firstWord = trimmed.split(/\\s+/)[0];
          await self.tell('I don\\'t understand "' + firstWord + '".');
        }

        await self.tell('> ');
      } catch (err) {
        await self.tell('Error: ' + err.message);
        await self.tell('> ');
      }
    `);
  }

  private addAuthMethods(obj: RuntimeObject): void {
    obj.setMethod('checkPassword', `
      const password = args[0];
      return await $.checkPassword(password, self.passwordHash);
    `);

    obj.setMethod('setPassword', `
      const password = args[0];
      self.passwordHash = await $.hashPassword(password);
    `);
  }
}
