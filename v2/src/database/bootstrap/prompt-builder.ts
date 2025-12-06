import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Prompt utility object ($.prompt)
 * Handles interactive prompts: question, choice, yesorno
 *
 * Usage from MOO code:
 *   // Prompts return the value directly via Promise
 *   const name = await $.prompt.question(player, 'What is your name? ');
 *   await player.tell('Hello, ' + name + '!');
 *
 *   const choice = await $.prompt.choice(player, 'Pick one:', {
 *     a: 'Option A',
 *     b: 'Option B',
 *   });
 *   await player.tell('You picked: ' + choice);
 *
 *   const confirmed = await $.prompt.yesorno(player, 'Are you sure?');
 *   if (confirmed) { ... }
 */
export class PromptBuilder {
  private prompt: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.prompt) {
      this.prompt = await this.manager.load(aliases.prompt);
      if (this.prompt) return; // Already exists
    }

    // Create new Prompt utility
    this.prompt = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Prompt',
        description: 'Interactive prompt utility',
      },
      methods: {},
    });

    // Ask a text question - returns the user's answer
    // player: the player to prompt
    // text: the prompt text to display
    // validator: optional function that returns error string or null
    this.prompt.setMethod('question', `
      const player = args[0];
      const text = args[1];
      const validator = args[2]; // Optional validator function

      return new Promise((resolve) => {
        player._promptState = {
          type: 'question',
          text: text,
          validator: validator || null,
          resolve: resolve,
        };

        player.tell(text);
      });
    `);

    // Show a choice menu - returns the selected key
    // options: { key: 'Display text', ... }
    this.prompt.setMethod('choice', `
      const player = args[0];
      const text = args[1];
      const options = args[2]; // { key: 'label', ... }

      const keys = Object.keys(options);
      let menu = text + '\\r\\n';
      for (let i = 0; i < keys.length; i++) {
        menu += '  ' + (i + 1) + ') ' + options[keys[i]] + '\\r\\n';
      }
      menu += 'Enter choice: ';

      return new Promise((resolve) => {
        player._promptState = {
          type: 'choice',
          text: menu,
          options: options,
          keys: keys,
          resolve: resolve,
        };

        player.tell(menu);
      });
    `);

    // Ask a yes/no question - returns true or false
    this.prompt.setMethod('yesorno', `
      const player = args[0];
      const text = args[1];

      const prompt = text + ' (yes/no): ';

      return new Promise((resolve) => {
        player._promptState = {
          type: 'yesorno',
          text: prompt,
          resolve: resolve,
        };

        player.tell(prompt);
      });
    `);

    // Handle input when player is in prompt state
    // Returns true if handled, false if not in prompt state
    this.prompt.setMethod('handleInput', `
      const player = args[0];
      const input = args[1];

      const state = player._promptState;
      if (!state) return false;

      const trimmed = input.trim();

      switch (state.type) {
        case 'question': {
          // Validate if validator provided
          if (state.validator) {
            const error = state.validator(trimmed);
            if (error) {
              await player.tell(error + '\\r\\n');
              await player.tell(state.text);
              return true;
            }
          }

          // Valid - clear state and resolve with input
          player._promptState = null;
          state.resolve(trimmed);
          return true;
        }

        case 'choice': {
          const num = parseInt(trimmed, 10);
          if (isNaN(num) || num < 1 || num > state.keys.length) {
            await player.tell('Invalid choice. Please enter a number from the menu.\\r\\n');
            await player.tell(state.text);
            return true;
          }

          // Valid - clear state and resolve with selected key
          const selectedKey = state.keys[num - 1];
          player._promptState = null;
          state.resolve(selectedKey);
          return true;
        }

        case 'yesorno': {
          const lower = trimmed.toLowerCase();
          if (lower === 'yes' || lower === 'y') {
            player._promptState = null;
            state.resolve(true);
            return true;
          } else if (lower === 'no' || lower === 'n') {
            player._promptState = null;
            state.resolve(false);
            return true;
          } else {
            await player.tell('Please answer yes or no.\\r\\n');
            await player.tell(state.text);
            return true;
          }
        }

        default:
          return false;
      }
    `);

    // Check if player is in a prompt state
    this.prompt.setMethod('isActive', `
      const player = args[0];
      return player._promptState !== null && player._promptState !== undefined;
    `);

    // Cancel current prompt (resolves with null)
    this.prompt.setMethod('cancel', `
      const player = args[0];
      const state = player._promptState;
      if (state && state.resolve) {
        state.resolve(null);
      }
      player._promptState = null;
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.prompt) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.prompt = this.prompt.id;
    objectManager.set('aliases', aliases);

    console.log(`Registered prompt alias -> #${this.prompt.id}`);
  }
}
