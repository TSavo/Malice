import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Agent prototype
 * Base prototype for things that can act (verb handling, movement)
 *
 * Watch system:
 * - watchList: array of object IDs being actively observed
 * - Watched people are easier to perceive in crowds
 * - Auto-watch triggers when interacting (emote/talk to someone)
 * - Manual watch/unwatch commands for focus
 *
 * Skill system:
 * - Skills emerge from use, not predefined
 * - Each use can grant XP if off cooldown
 * - Higher skill = slower progression (diminishing returns)
 * - Cooldown prevents spam-grinding
 */
export class AgentBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Agent',
        description: 'Base prototype for things that can act',
        // Verb registry: { pattern: { obj: ObjId, method: string } }
        // Patterns like 'get %i', 'shoot %i with %t', 'say %s'
        verbs: {},
        // Watch list - people we're paying attention to
        // Watching someone gives +50 perception clarity in crowds
        // Limited by perception capacity (computed from eyes/ears)
        watchList: [], // Array of object IDs
        watchExpiry: {}, // { objId: expiryTimestamp } for auto-expire
        // Display options
        options: {
          seePrompt: '',       // Prefix for visual messages (empty = none)
          hearPrompt: '',      // Prefix for audio messages (empty = none)
          color: true,         // Enable ANSI color output
          screenReader: false, // Screen reader accessibility mode
        },
        // Sleep state: 'awake', 'falling_asleep', 'asleep', 'waking_up'
        sleepState: 'awake',
        // Scheduled job name for sleep transitions (for cancellation)
        sleepTransitionJob: null,
        // Status effects from substances, injuries, etc.
        // Each effect: { intensity: 0-100, decay: rate per tick }
        // Effects: sedation, stimulation, impaired_coordination, impaired_perception,
        //          nausea, euphoria, pain
        statusEffects: {},
        // Sleep debt - accumulates while awake (+1/tick), decreases while asleep (-3/tick)
        // 960 = ~16 hours awake (normal bedtime)
        // Higher debt = higher metabolism, chance to doze off
        sleepDebt: 0,
        // Skills learned through use: { skillName: { level, xp, lastProgressed } }
        skills: {},
        // Dying state - 15 minute countdown before death
        // Progress 0-100, increases ~6.67 per minute (100 in 15 min)
        dyingProgress: 0,
        isDying: false,
        // Skill cooldown in ms (how long before same skill can progress again)
        skillCooldown: 3600000, // 1 hour
        // Hidden luck attribute (1-100) - failed rolls get a luck save
        // Roll d100, if <= luck, failure becomes success
        luck: 1, // Everyone starts with 1
        // Movement system
        movementMode: 'walk', // 'walk' or 'run'
        // Movement state (null if not moving)
        // { destId, direction, distanceRemaining, startTime, mode }
        movementState: null,
        // Movement job name (for cancellation)
        movementJob: null,
      },
      methods: {},
    });

    this.addVerbMethods(obj);
    this.addResolutionMethods(obj);
    this.addActionMethods(obj);
    this.addColorMethods(obj);
    this.addSleepMethods(obj);
    this.addWatchMethods(obj);
    this.addSkillMethods(obj);
    this.addMovementMethods(obj);
    this.addStatusEffectMethods(obj);
    this.addDyingMethods(obj);

    return obj;
  }

  private addVerbMethods(obj: RuntimeObject): void {
    obj.setMethod('registerVerb', `
      /** Register verb pattern(s) that this agent can use.
       *  @param patterns - String or array of patterns (e.g., 'get %i', 'shoot %i with %t')
       *  @param sourceObj - The object providing the verb handler
       *  @param methodName - Method to call (derived from pattern if not specified)
       */
      const patterns = args[0];
      const sourceObj = args[1]; // RuntimeObject or ObjId
      const methodName = args[2];

      const sourceId = typeof sourceObj === 'number' ? sourceObj : sourceObj.id;
      const patternList = Array.isArray(patterns) ? patterns : [patterns];
      const verbs = self.verbs || {};

      for (const pattern of patternList) {
        // Derive method name from first word if not specified
        const method = methodName || pattern.split(/\\s+/)[0].replace(/%[its]/g, '').trim();
        verbs[pattern] = { obj: sourceId, method };
      }

      self.verbs = verbs;
    `);

    obj.setMethod('unregisterVerb', `
      /** Unregister a specific verb pattern.
       *  @param pattern - The pattern to remove
       */
      const pattern = args[0];
      const verbs = self.verbs || {};
      delete verbs[pattern];
      self.verbs = verbs;
    `);

    obj.setMethod('unregisterVerbsFrom', `
      /** Unregister all verbs provided by a specific object.
       *  @param sourceObj - The object whose verbs should be removed
       */
      const sourceObj = args[0];
      const sourceId = typeof sourceObj === 'number' ? sourceObj : sourceObj.id;
      const verbs = self.verbs || {};

      for (const [pattern, info] of Object.entries(verbs)) {
        if (info.obj === sourceId) {
          delete verbs[pattern];
        }
      }

      self.verbs = verbs;
    `);

    obj.setMethod('matchVerb', `
      /** Match input against all registered verbs.
       *  @param input - The user's input string
       *  @returns Best matching verb info or null
       */
      const input = args[0];

      const verbs = self.verbs || {};
      const patterns = Object.keys(verbs);

      // Sort by specificity (more parts = more specific)
      patterns.sort((a, b) => b.split(/\\s+/).length - a.split(/\\s+/).length);

      for (const pattern of patterns) {
        const verbInfo = verbs[pattern];
        const result = await self.tryMatchPattern(input, pattern, verbInfo);

        if (result && result.error) {
          // Pattern matched but resolution failed (ambiguous, not found)
          return { error: result.error };
        }

        if (result && result.args) {
          return {
            pattern,
            verbInfo,
            args: result.args,
            handler: await $.load(verbInfo.obj)
          };
        }
      }

      return null;
    `);

    obj.setMethod('tryMatchPattern', `
      /** Match input against a specific pattern.
       *  @param input - The user's input string
       *  @param pattern - The pattern to match against
       *  @param verbInfo - Verb info for %t resolution
       *  @returns Object with resolved args or null/error
       */
      const input = args[0];
      const pattern = args[1];
      const verbInfo = args[2];

      const inputWords = input.trim().toLowerCase().split(/\\s+/);
      const patternParts = pattern.toLowerCase().split(/\\s+/);

      let inputIdx = 0;
      const resolvedArgs = [];
      let sourceObj = null; // For %t verification

      for (let i = 0; i < patternParts.length; i++) {
        const part = patternParts[i];

        if (part === '%i') {
          // Collect words until next literal or end
          const nextLiteral = patternParts.slice(i + 1).find(p => !p.startsWith('%'));
          let itemWords = [];

          while (inputIdx < inputWords.length) {
            if (nextLiteral && inputWords[inputIdx] === nextLiteral) break;
            itemWords.push(inputWords[inputIdx]);
            inputIdx++;
          }

          if (itemWords.length === 0) return null;

          const result = await self.resolveItem(itemWords.join(' '));
          if (result.error) return { error: result.error };
          resolvedArgs.push(result.resolved);

        } else if (part === '%t') {
          // Must match the source object's name/alias
          const handler = await $.load(verbInfo.obj);
          if (!handler) return null;

          const nextLiteral = patternParts.slice(i + 1).find(p => !p.startsWith('%'));
          let tWords = [];

          while (inputIdx < inputWords.length) {
            if (nextLiteral && inputWords[inputIdx] === nextLiteral) break;
            tWords.push(inputWords[inputIdx]);
            inputIdx++;
          }

          if (tWords.length === 0) return null;

          const tName = tWords.join(' ').toLowerCase();
          const handlerName = (handler.name || '').toLowerCase();
          const handlerAliases = (handler.aliases || []).map(a => a.toLowerCase());

          if (tName !== handlerName && !handlerAliases.includes(tName)) {
            return null; // Doesn't match this handler
          }

          resolvedArgs.push(handler);
          sourceObj = handler;

        } else if (part === '%s') {
          // Rest of input as string
          const rest = inputWords.slice(inputIdx).join(' ');
          resolvedArgs.push(rest);
          inputIdx = inputWords.length;

        } else {
          // Literal word - must match exactly
          if (inputIdx >= inputWords.length || inputWords[inputIdx] !== part) {
            return null;
          }
          inputIdx++;
        }
      }

      // Must have consumed all input
      if (inputIdx !== inputWords.length) return null;

      return { args: resolvedArgs, sourceObj };
    `);
  }

  private addResolutionMethods(obj: RuntimeObject): void {
    obj.setMethod('parseOrdinal', `
      /** Parse ordinal from item reference (e.g., "first sword" → { ordinal: 0, name: "sword" }).
       *  @param text - The item reference text
       *  @returns Object with ordinal (null if none) and name
       */
      const text = args[0];
      const ordinals = {
        'first': 0, '1st': 0, '1': 0,
        'second': 1, '2nd': 1, '2': 1,
        'third': 2, '3rd': 2, '3': 2,
        'fourth': 3, '4th': 3, '4': 3,
        'fifth': 4, '5th': 4, '5': 4,
        'sixth': 5, '6th': 5, '6': 5,
        'seventh': 6, '7th': 6, '7': 6,
        'eighth': 7, '8th': 7, '8': 7,
        'ninth': 8, '9th': 8, '9': 8,
        'tenth': 9, '10th': 9, '10': 9,
        'last': -1
      };

      const words = text.trim().toLowerCase().split(/\\s+/);
      if (words.length > 1 && words[0] in ordinals) {
        return { ordinal: ordinals[words[0]], name: words.slice(1).join(' ') };
      }
      return { ordinal: null, name: text.trim().toLowerCase() };
    `);

    obj.setMethod('findMatches', `
      /** Find objects matching a name in a list of contents.
       *  @param name - The name to search for
       *  @param contents - Array of object IDs to search
       *  @returns Array of matching RuntimeObjects
       */
      const name = args[0];
      const contents = args[1] || [];

      const matches = [];
      for (const objId of contents) {
        const obj = await $.load(objId);
        if (!obj) continue;

        const objName = (obj.name || '').toLowerCase();
        const aliases = (obj.aliases || []).map(a => a.toLowerCase());

        if (objName === name || aliases.includes(name)) {
          matches.push(obj);
        }
      }
      return matches;
    `);

    obj.setMethod('resolveItem', `
      /** Resolve %i - find item by name with ordinal support.
       *  @param text - The item reference (e.g., "sword", "second apple")
       *  @returns Object with resolved RuntimeObject or error string
       */
      const text = args[0];

      // Parse ordinal
      const { ordinal, name } = await self.parseOrdinal(text);

      // Get searchable contents: room + TODO: held items, etc.
      let allContents = [];
      if (self.location && self.location !== 0) {
        const room = await $.load(self.location);
        if (room) {
          allContents = [...(room.contents || [])];
        }
      }

      // Find all matches
      const matches = await self.findMatches(name, allContents);

      if (matches.length === 0) {
        return { resolved: null, error: \`You don't see "\${name}" here.\` };
      }

      if (ordinal === null && matches.length > 1) {
        // Ambiguous - need ordinal
        const names = matches.map((m, i) => \`\${i + 1}. \${m.name}\`).join(', ');
        return { resolved: null, error: \`Which \${name}? (\${names})\` };
      }

      // Select by ordinal
      let index = ordinal === null ? 0 : ordinal;
      if (ordinal === -1) index = matches.length - 1; // 'last'
      if (index < 0 || index >= matches.length) {
        return { resolved: null, error: \`There isn't a \${text} here.\` };
      }

      return { resolved: matches[index], error: null };
    `);
  }

  private addActionMethods(obj: RuntimeObject): void {
    // Pattern: say %s
    // args[3] = the message string
    obj.setMethod('say', `
      /** Say something out loud to everyone in the room.
       *  Usage: say <message>, "<message>, '<message>
       *  Everyone in your current location will hear what you say.
       */
      const message = args[3];
      // TODO: Broadcast to room
      return \`\${player.name} says: \${message}\`;
    `);

    // Pattern: emote %s
    // args[3] = the action string
    obj.setMethod('emote', `
      /** Perform an action or express an emotion.
       *  Usage: emote <action>, :<action>
       *  Displays "YourName <action>" to everyone in the room.
       *  Example: emote waves hello → "Bob waves hello"
       */
      const action = args[3];
      // TODO: Broadcast to room
      return \`\${player.name} \${action}\`;
    `);

    // Pattern: look (no args)
    // Look at current location
    obj.setMethod('look', `
      /** Look at your surroundings.
       *  Usage: look, l
       *  Displays the description of your current location and any visible items.
       */
      if (player.location && player.location !== 0) {
        const location = await $.load(player.location);
        if (location) {
          return await location.describe(player);
        }
      }
      return 'You are in a void.';
    `);

    // Pattern: look %i
    // args[3] = the resolved item (RuntimeObject)
    obj.setMethod('lookAt', `
      /** Examine something in detail.
       *  Usage: look <item>, look at <item>, examine <item>, ex <item>
       *  Shows the detailed description of the item or person.
       */
      const target = args[3];

      // Special case: looking at self
      if (target.id === player.id) {
        return await player.describe(player);
      }

      return await target.describe(player);
    `);

    // Pattern: look %i in %t
    // args[3] = the item (RuntimeObject)
    // args[4] = the container (RuntimeObject)
    obj.setMethod('lookIn', `
      /** Examine something inside a container.
       *  Usage: look <item> in <container>, look <item> on <container>
       *  Shows the description of an item that's inside or on something else.
       */
      const item = args[3];
      const container = args[4];

      // Verify item is actually in container
      const containerContents = container.contents || [];
      if (!containerContents.includes(item.id)) {
        return \`The \${item.name} is not in \${container.name}.\`;
      }

      return await item.describe(player);
    `);

    // Enter options menu
    obj.setMethod('options', `
      /** Open the options menu to configure your display settings.
       *  Usage: @options
       *  Configure color output, screen reader mode, and message prefixes.
       */
      player._inOptionsMenu = true;
      await player.showOptionsMenu();
    `);

    // Show the options menu
    obj.setMethod('showOptionsMenu', `
      const options = self.options || {};

      const showPrompt = (val) => val ? '%{green}"' + val + '"%{/}' : '%{dim}(none)%{/}';
      const showBool = (val) => val ? '%{green}ON%{/}' : '%{red}OFF%{/}';

      let menu = '';
      if (options.screenReader) {
        menu += 'Options Menu. Type a number to change, Q to quit.\\r\\n';
        menu += '1. See Prompt: ' + (options.seePrompt || 'none') + ' - Prefix for visual messages\\r\\n';
        menu += '2. Hear Prompt: ' + (options.hearPrompt || 'none') + ' - Prefix for audio messages\\r\\n';
        menu += '3. Color: ' + (options.color ? 'ON' : 'OFF') + ' - Enable ANSI color output\\r\\n';
        menu += '4. Screen Reader: ' + (options.screenReader ? 'ON' : 'OFF') + ' - Accessibility mode\\r\\n';
        menu += 'Enter choice: ';
      } else {
        menu += '%{bold}%{cyan}═══════════════════════════════════════%{/}\\r\\n';
        menu += '%{bold}%{cyan}              OPTIONS MENU              %{/}\\r\\n';
        menu += '%{bold}%{cyan}═══════════════════════════════════════%{/}\\r\\n';
        menu += '\\r\\n';
        menu += '%{yellow}1%{/}. See Prompt:    ' + showPrompt(options.seePrompt) + '\\r\\n';
        menu += '%{yellow}2%{/}. Hear Prompt:   ' + showPrompt(options.hearPrompt) + '\\r\\n';
        menu += '%{yellow}3%{/}. Color:         [' + showBool(options.color) + ']\\r\\n';
        menu += '%{yellow}4%{/}. Screen Reader: [' + showBool(options.screenReader) + ']\\r\\n';
        menu += '\\r\\n';
        menu += '%{dim}For prompts: enter number, then type your prompt (or "none" to clear)%{/}\\r\\n';
        menu += '\\r\\n';
        menu += '%{bold}Q%{/}. Save & Exit\\r\\n';
        menu += '\\r\\n';
        menu += 'Enter choice: ';
      }

      await self.tell(menu);
    `);

    // Handle options menu input
    obj.setMethod('handleOptionsInput', `
      const input = args[0].trim();
      const inputLower = input.toLowerCase();
      const options = self.options || {};

      // Check if we're waiting for prompt text
      if (self._optionsWaitingFor) {
        const field = self._optionsWaitingFor;
        self._optionsWaitingFor = null;

        if (inputLower === 'none' || inputLower === 'clear' || inputLower === '') {
          options[field] = '';
          await self.tell('Cleared.\\r\\n');
        } else {
          options[field] = input; // Preserve original case
          await self.tell('Set to: "' + input + '"\\r\\n');
        }
        self.options = options;
        await self.showOptionsMenu();
        return;
      }

      if (inputLower === 'q' || inputLower === 'quit' || inputLower === 'exit' || inputLower === 'done') {
        self._inOptionsMenu = false;
        await self.tell('Options saved.\\r\\n> ');
        return;
      }

      switch (inputLower) {
        case '1':
        case 'see':
        case 'seeprompt':
          self._optionsWaitingFor = 'seePrompt';
          await self.tell('Enter see prompt (or "none" to clear): ');
          return;

        case '2':
        case 'hear':
        case 'hearprompt':
          self._optionsWaitingFor = 'hearPrompt';
          await self.tell('Enter hear prompt (or "none" to clear): ');
          return;

        case '3':
        case 'color':
          options.color = !options.color;
          self.options = options;
          if (options.screenReader) {
            await self.tell('Color is now ' + (options.color ? 'ON' : 'OFF') + '\\r\\n');
          }
          break;

        case '4':
        case 'screenreader':
        case 'screen':
        case 'sr':
          options.screenReader = !options.screenReader;
          if (options.screenReader) {
            options.color = false;
          }
          self.options = options;
          await self.tell('Screen Reader is now ' + (options.screenReader ? 'ON' : 'OFF') + '\\r\\n');
          break;

        default:
          await self.tell('Invalid choice. Enter 1-4 or Q to quit.\\r\\n');
      }

      await self.showOptionsMenu();
    `);
  }

  private addColorMethods(obj: RuntimeObject): void {
    // Process color codes in text: %{red}text%{/} or %{255}text%{/}
    // Converts to ANSI if color enabled, strips if disabled
    //
    // Named colors: red, green, yellow, blue, magenta, cyan, white, dim, bold
    // Short forms: r, g, y, b, m, c, w, d, B
    // 256-color: %{123} for palette index
    // RGB: %{r,g,b} for true color
    // Reset: %{/} or %{reset}
    obj.setMethod('processColors', `
      const text = args[0];
      if (!text || typeof text !== 'string') return text;

      const options = self.options || {};
      const useColor = options.color && !options.screenReader;

      // Color map
      const colors = {
        // Reset
        '/': '\\x1b[0m',
        'reset': '\\x1b[0m',

        // Styles
        'bold': '\\x1b[1m',
        'dim': '\\x1b[2m',
        'italic': '\\x1b[3m',
        'underline': '\\x1b[4m',
        'blink': '\\x1b[5m',
        'reverse': '\\x1b[7m',
        'hidden': '\\x1b[8m',
        'strike': '\\x1b[9m',

        // Standard foreground colors
        'black': '\\x1b[30m',
        'red': '\\x1b[31m',
        'green': '\\x1b[32m',
        'yellow': '\\x1b[33m',
        'blue': '\\x1b[34m',
        'magenta': '\\x1b[35m',
        'cyan': '\\x1b[36m',
        'white': '\\x1b[37m',
        'gray': '\\x1b[90m',
        'grey': '\\x1b[90m',

        // Bright foreground colors
        'brightblack': '\\x1b[90m',
        'brightred': '\\x1b[91m',
        'brightgreen': '\\x1b[92m',
        'brightyellow': '\\x1b[93m',
        'brightblue': '\\x1b[94m',
        'brightmagenta': '\\x1b[95m',
        'brightcyan': '\\x1b[96m',
        'brightwhite': '\\x1b[97m',

        // Background colors
        'bgblack': '\\x1b[40m',
        'bgred': '\\x1b[41m',
        'bggreen': '\\x1b[42m',
        'bgyellow': '\\x1b[43m',
        'bgblue': '\\x1b[44m',
        'bgmagenta': '\\x1b[45m',
        'bgcyan': '\\x1b[46m',
        'bgwhite': '\\x1b[47m',

        // Bright background colors
        'bgbrightblack': '\\x1b[100m',
        'bgbrightred': '\\x1b[101m',
        'bgbrightgreen': '\\x1b[102m',
        'bgbrightyellow': '\\x1b[103m',
        'bgbrightblue': '\\x1b[104m',
        'bgbrightmagenta': '\\x1b[105m',
        'bgbrightcyan': '\\x1b[106m',
        'bgbrightwhite': '\\x1b[107m',

        // Extended named colors (256-color palette)
        'orange': '\\x1b[38;5;208m',
        'pink': '\\x1b[38;5;213m',
        'purple': '\\x1b[38;5;129m',
        'brown': '\\x1b[38;5;94m',
        'lime': '\\x1b[38;5;118m',
        'teal': '\\x1b[38;5;30m',
        'navy': '\\x1b[38;5;17m',
        'maroon': '\\x1b[38;5;52m',
        'olive': '\\x1b[38;5;58m',
        'silver': '\\x1b[38;5;7m',
        'gold': '\\x1b[38;5;220m',
        'coral': '\\x1b[38;5;209m',
        'salmon': '\\x1b[38;5;173m',
        'violet': '\\x1b[38;5;177m',
        'indigo': '\\x1b[38;5;54m',
        'crimson': '\\x1b[38;5;160m',
        'azure': '\\x1b[38;5;39m',
        'aqua': '\\x1b[38;5;51m',
        'turquoise': '\\x1b[38;5;80m',
        'chartreuse': '\\x1b[38;5;118m',
        'tan': '\\x1b[38;5;180m',
        'khaki': '\\x1b[38;5;143m',
        'lavender': '\\x1b[38;5;183m',
        'plum': '\\x1b[38;5;96m',
        'mint': '\\x1b[38;5;121m',
        'peach': '\\x1b[38;5;217m',
        'ivory': '\\x1b[38;5;230m',
        'beige': '\\x1b[38;5;230m',
        'hotpink': '\\x1b[38;5;206m',
        'deeppink': '\\x1b[38;5;198m',
        'skyblue': '\\x1b[38;5;117m',
        'steelblue': '\\x1b[38;5;67m',
        'forestgreen': '\\x1b[38;5;28m',
        'seagreen': '\\x1b[38;5;78m',
        'slategray': '\\x1b[38;5;66m',
        'darkgray': '\\x1b[38;5;240m',
        'lightgray': '\\x1b[38;5;250m',

        // Short forms for foreground
        'k': '\\x1b[30m', // black
        'r': '\\x1b[31m',
        'g': '\\x1b[32m',
        'y': '\\x1b[33m',
        'b': '\\x1b[34m',
        'm': '\\x1b[35m',
        'c': '\\x1b[36m',
        'w': '\\x1b[37m',
        'd': '\\x1b[90m', // dim/gray
        'o': '\\x1b[38;5;208m', // orange
        'p': '\\x1b[38;5;129m', // purple

        // Short forms for styles
        'B': '\\x1b[1m',  // bold
        'D': '\\x1b[2m',  // dim
        'I': '\\x1b[3m',  // italic
        'U': '\\x1b[4m',  // underline
        'R': '\\x1b[7m',  // reverse
        'S': '\\x1b[9m',  // strikethrough
      };

      // Replace %{...} patterns
      return text.replace(/%\\{([^}]+)\\}/g, (match, code) => {
        if (!useColor) return ''; // Strip color codes

        const lower = code.toLowerCase();

        // Named color or short form
        if (colors[code] || colors[lower]) {
          return colors[code] || colors[lower];
        }

        // 256-color palette: %{123}
        const num = parseInt(code, 10);
        if (!isNaN(num) && num >= 0 && num <= 255) {
          return '\\x1b[38;5;' + num + 'm';
        }

        // RGB true color: %{r,g,b}
        const rgb = code.split(',').map(n => parseInt(n.trim(), 10));
        if (rgb.length === 3 && rgb.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
          return '\\x1b[38;2;' + rgb[0] + ';' + rgb[1] + ';' + rgb[2] + 'm';
        }

        // Unknown - leave as-is
        return match;
      });
    `);
  }

  private addSleepMethods(obj: RuntimeObject): void {
    obj.setMethod('isAwake', `
      /** Check if agent is awake and can act.
       *  @returns true if awake
       */
      return self.sleepState === 'awake';
    `);

    obj.setMethod('isAsleep', `
      /** Check if agent is fully asleep.
       *  @returns true if asleep
       */
      return self.sleepState === 'asleep';
    `);

    obj.setMethod('canBeInterrupted', `
      /** Check if agent can be interrupted while falling asleep.
       *  Override in subclasses to add conditions (noise level, etc.).
       *  @returns true if can be interrupted
       */
      // Default: can always be interrupted
      // Subclasses can check room noise, etc.
      return true;
    `);

    obj.setMethod('canWakeUp', `
      /** Check if agent can wake up.
       *  Override to add conditions (sedation, exhaustion, etc.).
       *  @returns Object with allowed boolean and optional reason
       */
      // Can't wake if sedated
      if ((self.sedation || 0) > 0) {
        return { allowed: false, reason: 'You are too sedated to wake.' };
      }
      // Default: can wake
      return { allowed: true };
    `);

    obj.setMethod('canFallAsleep', `
      /** Check if agent can fall asleep.
       *  Override to add conditions (in combat, etc.).
       *  @returns Object with allowed boolean and optional reason
       */
      // Default: can sleep if awake
      if (self.sleepState !== 'awake') {
        return { allowed: false, reason: 'You are already sleeping or trying to.' };
      }
      return { allowed: true };
    `);

    obj.setMethod('cancelSleepTransition', `
      /** Cancel any pending sleep/wake transition.
       */
      const jobName = self.sleepTransitionJob;
      if (jobName && $.scheduler) {
        await $.scheduler.unschedule(jobName);
        self.sleepTransitionJob = null;
      }
    `);

    obj.setMethod('startSleep', `
      /** Start falling asleep (voluntary or from exhaustion).
       *  @param delay - Milliseconds until fully asleep (default 10000)
       *  @returns Object with success, state, and completesIn
       */
      const delay = args[0] || 10000; // 10 seconds default

      const check = await self.canFallAsleep();
      if (!check.allowed) {
        return { success: false, reason: check.reason };
      }

      // Cancel any existing transition
      await self.cancelSleepTransition();

      // Set state
      self.sleepState = 'falling_asleep';

      // Schedule the completion
      const jobName = 'sleep_' + self.id + '_' + Date.now();
      await $.scheduler.schedule(jobName, delay, 0, self, 'completeSleep');
      self.sleepTransitionJob = jobName;

      return { success: true, state: 'falling_asleep', completesIn: delay };
    `);

    obj.setMethod('completeSleep', `
      /** Called by scheduler when falling asleep completes.
       *  @returns Object with success and state
       */
      // Only complete if still falling asleep (wasn't interrupted)
      if (self.sleepState !== 'falling_asleep') {
        return { success: false, reason: 'No longer falling asleep' };
      }

      self.sleepState = 'asleep';
      self.sleepTransitionJob = null;

      // Notify (override in Player to send message)
      if (self.onFellAsleep) {
        await self.onFellAsleep();
      }

      return { success: true, state: 'asleep' };
    `);

    obj.setMethod('interruptSleep', `
      /** Interrupt falling asleep (noise, damage, etc.).
       *  @param reason - Message to show (default: 'You were disturbed.')
       *  @returns Object with success, state, and reason
       */
      const reason = args[0] || 'You were disturbed.';

      if (self.sleepState !== 'falling_asleep') {
        return { success: false, reason: 'Not falling asleep' };
      }

      const canInterrupt = await self.canBeInterrupted();
      if (!canInterrupt) {
        return { success: false, reason: 'Cannot be interrupted' };
      }

      // Cancel the scheduled completion
      await self.cancelSleepTransition();

      self.sleepState = 'awake';

      // Notify
      if (self.onSleepInterrupted) {
        await self.onSleepInterrupted(reason);
      }

      return { success: true, state: 'awake', reason: reason };
    `);

    obj.setMethod('receiveStimulus', `
      /** Called when agent receives external stimulus (sound, touch, etc.).
       *  If dozing (falling_asleep), this cancels the doze silently.
       *  @param intensity - How strong the stimulus is (0-10, default 5)
       *  @returns true if stimulus woke them from dozing
       */
      const intensity = args[0] ?? 5;

      // Only affects falling_asleep state (dozing)
      if (self.sleepState !== 'falling_asleep') {
        return false;
      }

      // Higher intensity = more likely to wake
      // intensity 10 = always wakes, intensity 1 = 10% chance
      const wakeChance = intensity / 10;
      if (Math.random() > wakeChance) {
        return false; // Stimulus not strong enough
      }

      // Cancel the doze
      await self.cancelSleepTransition();
      self.sleepState = 'awake';

      // Notify
      if (self.tell) {
        await self.tell('You jerk awake.');
      }

      return true;
    `);

    obj.setMethod('startWake', `
      /** Start waking up (voluntary or from external stimulus).
       *  @param delay - Milliseconds until fully awake (default 5000)
       *  @returns Object with success, state, and completesIn
       */
      const delay = args[0] || 5000; // 5 seconds default

      if (self.sleepState !== 'asleep') {
        return { success: false, reason: 'Not asleep' };
      }

      const check = await self.canWakeUp();
      if (!check.allowed) {
        return { success: false, reason: check.reason };
      }

      // Cancel any existing transition
      await self.cancelSleepTransition();

      // Set state
      self.sleepState = 'waking_up';

      // Schedule the completion
      const jobName = 'wake_' + self.id + '_' + Date.now();
      await $.scheduler.schedule(jobName, delay, 0, self, 'completeWake');
      self.sleepTransitionJob = jobName;

      return { success: true, state: 'waking_up', completesIn: delay };
    `);

    obj.setMethod('completeWake', `
      /** Called by scheduler when waking up completes.
       *  @returns Object with success and state
       */
      // Only complete if still waking (wasn't blocked)
      if (self.sleepState !== 'waking_up') {
        return { success: false, reason: 'No longer waking up' };
      }

      // Final check - might have been sedated during wake
      const check = await self.canWakeUp();
      if (!check.allowed) {
        // Fall back asleep
        self.sleepState = 'asleep';
        self.sleepTransitionJob = null;
        if (self.onWakeBlocked) {
          await self.onWakeBlocked(check.reason);
        }
        return { success: false, reason: check.reason, state: 'asleep' };
      }

      self.sleepState = 'awake';
      self.sleepTransitionJob = null;

      // Notify
      if (self.onWokeUp) {
        await self.onWokeUp();
      }

      return { success: true, state: 'awake' };
    `);

    obj.setMethod('blockWake', `
      /** Block waking up (e.g., re-sedation during wake process).
       *  @param reason - Message to show (default: 'You fall back asleep.')
       *  @returns Object with success, state, and reason
       */
      const reason = args[0] || 'You fall back asleep.';

      if (self.sleepState !== 'waking_up') {
        return { success: false, reason: 'Not waking up' };
      }

      // Cancel the scheduled completion
      await self.cancelSleepTransition();

      self.sleepState = 'asleep';

      if (self.onWakeBlocked) {
        await self.onWakeBlocked(reason);
      }

      return { success: true, state: 'asleep', reason: reason };
    `);

    obj.setMethod('forceWake', `
      /** Force wake (bypasses checks, for admin/emergency).
       *  @returns Object with success and state
       */
      await self.cancelSleepTransition();
      self.sleepState = 'awake';
      self.sedation = 0;
      return { success: true, state: 'awake' };
    `);

    obj.setMethod('forceSleep', `
      /** Force sleep (bypasses checks, for admin/emergency).
       *  @returns Object with success and state
       */
      await self.cancelSleepTransition();
      self.sleepState = 'asleep';
      return { success: true, state: 'asleep' };
    `);

    obj.setMethod('getMetabolismMultiplier', `
      /** Get metabolism multiplier based on sleep state and debt.
       *  Sleeping reduces calorie burn by ~65% (real BMR reduction).
       *  Sleep debt increases burn rate when awake (body working harder).
       *  @returns Multiplier (0.35 if asleep, 1.0-4.0+ based on debt if awake)
       */
      const state = self.sleepState || 'awake';
      if (state === 'asleep') return 0.35;

      // When awake, sleep debt increases metabolism
      // 960 = normal bedtime (16h), no penalty yet
      // 1440 = 24h awake, 1.5x
      // 1920 = 32h awake, 2x
      // 2880 = 48h awake, 4x
      const debt = self.sleepDebt || 0;
      if (debt <= 960) return 1.0;
      if (debt <= 1440) return 1.5;
      if (debt <= 1920) return 2.0;
      return 4.0;
    `);

    obj.setMethod('sleepTick', `
      /** Called each heartbeat to handle sleep-related effects.
       *  Decreases sedation over time.
       *  @returns Object with state and sedation
       */
      const state = self.sleepState || 'awake';
      const results = { state: state };

      // Decrease sedation over time
      const sedation = self.sedation || 0;
      if (sedation > 0) {
        const newSedation = Math.max(0, sedation - 1);
        self.sedation = newSedation;
        results.sedation = newSedation;

        // If sedation wore off while asleep, might start waking naturally
        if (newSedation === 0 && state === 'asleep') {
          // Could trigger natural wake here if desired
        }
      }

      return results;
    `);
  }

  private addWatchMethods(obj: RuntimeObject): void {
    // Get current watch capacity based on perception (eyes/ears)
    obj.setMethod('getWatchCapacity', `
      /** Calculate max people we can watch based on sensory capabilities.
       *  Computed value based on eyes and ears - not stored.
       *  Base: 5 slots (normal human perception)
       *  - Blindness: 3 slots (rely on hearing only)
       *  - Deafness: 3 slots (rely on vision only)
       *  - Both blind and deaf: 1 slot (immediate awareness only)
       *  Higher trained senses can add bonus slots.
       *  @returns Max watch slots
       */
      // Base capacity for agents without full perception
      let capacity = 5;

      // Check if we have perception methods (Human/Player)
      if (self.canSee && self.canHear) {
        const vision = await self.canSee(); // { max, percent }
        const hearing = await self.canHear(); // { max, percent }

        const canSee = vision && vision.max > 0;
        const canHear = hearing && hearing.max > 0;

        if (!canSee && !canHear) {
          // Both blind and deaf - minimal awareness
          capacity = 1;
        } else if (!canSee) {
          // Blind - rely on hearing only
          capacity = 3;
        } else if (!canHear) {
          // Deaf - rely on vision only
          capacity = 3;
        } else {
          // Full perception - base 5, bonus for high training
          capacity = 5;
          // Bonus slot for every 50 points of combined max above 200
          const combinedMax = (vision.max || 0) + (hearing.max || 0);
          if (combinedMax > 200) {
            capacity += Math.floor((combinedMax - 200) / 50);
          }
        }
      }

      return capacity;
    `);

    // Watch someone (add to watch list)
    obj.setMethod('watch', `
      /** Add someone to your watch list.
       *  Watched people are easier to perceive in crowds (+50 clarity).
       *  Limited by maxWatchSlots - if full, oldest watch is silently dropped.
       *  @param target - Object or ID to watch
       *  @param duration - Optional duration in ms (default: 5 minutes, 0 = permanent)
       *  @returns {success, message}
       */
      const target = args[0];
      const duration = args[1] !== undefined ? args[1] : 300000; // 5 min default

      const targetId = typeof target === 'number' ? target : target?.id;
      if (!targetId) {
        return { success: false, message: 'Watch who?' };
      }

      // Can't watch yourself
      if (targetId === self.id) {
        return { success: false, message: 'You are always aware of yourself.' };
      }

      const watchList = self.watchList || [];
      const watchExpiry = self.watchExpiry || {};

      // Get dynamic capacity based on perception (eyes/ears)
      const maxSlots = await self.getWatchCapacity();

      // Add to watch list if not already there
      if (!watchList.includes(targetId)) {
        // Check if at capacity - silently drop oldest (first in list)
        while (watchList.length >= maxSlots) {
          const droppedId = watchList.shift(); // Remove oldest
          delete watchExpiry[droppedId];
        }
        watchList.push(targetId);
        self.watchList = watchList;
      }

      // Set expiry if duration specified
      if (duration > 0) {
        watchExpiry[targetId] = Date.now() + duration;
        self.watchExpiry = watchExpiry;
      } else {
        // Permanent - remove any expiry
        delete watchExpiry[targetId];
        self.watchExpiry = watchExpiry;
      }

      const targetObj = await $.load(targetId);
      const name = targetObj?.name || '#' + targetId;
      return { success: true, message: 'You are now watching ' + name + '.' };
    `);

    // Unwatch someone (remove from watch list)
    obj.setMethod('unwatch', `
      /** Remove someone from your watch list.
       *  @param target - Object or ID to stop watching
       *  @returns {success, message}
       */
      const target = args[0];
      const targetId = typeof target === 'number' ? target : target?.id;

      if (!targetId) {
        return { success: false, message: 'Unwatch who?' };
      }

      const watchList = self.watchList || [];
      const watchExpiry = self.watchExpiry || {};

      const index = watchList.indexOf(targetId);
      if (index === -1) {
        return { success: false, message: 'You are not watching them.' };
      }

      watchList.splice(index, 1);
      delete watchExpiry[targetId];

      self.watchList = watchList;
      self.watchExpiry = watchExpiry;

      const targetObj = await $.load(targetId);
      const name = targetObj?.name || '#' + targetId;
      return { success: true, message: 'You stop watching ' + name + '.' };
    `);

    // Check if watching someone
    obj.setMethod('isWatching', `
      /** Check if this agent is watching a target.
       *  @param target - Object or ID to check
       *  @returns true if watching
       */
      const target = args[0];
      const targetId = typeof target === 'number' ? target : target?.id;
      const watchList = self.watchList || [];
      return watchList.includes(targetId);
    `);

    // Auto-watch (called when interacting with someone)
    obj.setMethod('autoWatch', `
      /** Automatically watch someone for a short duration.
       *  Called when emoting at or talking to someone.
       *  @param target - Object or ID to auto-watch
       *  @param duration - Duration in ms (default: 2 minutes)
       */
      const target = args[0];
      const duration = args[1] || 120000; // 2 min default for auto-watch

      const targetId = typeof target === 'number' ? target : target?.id;
      if (!targetId || targetId === self.id) return;

      const watchList = self.watchList || [];
      const watchExpiry = self.watchExpiry || {};

      // Add to watch list if not already there
      if (!watchList.includes(targetId)) {
        watchList.push(targetId);
        self.watchList = watchList;
      }

      // Update expiry (only if not permanently watching)
      const currentExpiry = watchExpiry[targetId];
      if (currentExpiry !== 0) { // 0 means permanent
        watchExpiry[targetId] = Math.max(currentExpiry || 0, Date.now() + duration);
        self.watchExpiry = watchExpiry;
      }
    `);

    // Clean up expired watches (called on heartbeat)
    obj.setMethod('cleanExpiredWatches', `
      /** Remove expired watches from watch list.
       *  Called periodically by heartbeat.
       *  @returns Number of watches removed
       */
      const now = Date.now();
      const watchList = self.watchList || [];
      const watchExpiry = self.watchExpiry || {};
      let removed = 0;

      const newWatchList = [];
      for (const id of watchList) {
        const expiry = watchExpiry[id];
        if (expiry && expiry > 0 && now >= expiry) {
          // Expired - remove
          delete watchExpiry[id];
          removed++;
        } else {
          newWatchList.push(id);
        }
      }

      if (removed > 0) {
        self.watchList = newWatchList;
        self.watchExpiry = watchExpiry;
      }

      return removed;
    `);

    // List who you're watching
    obj.setMethod('listWatching', `
      /** Get list of who this agent is watching.
       *  @returns Array of {id, name, permanent, expiresIn}
       */
      const watchList = self.watchList || [];
      const watchExpiry = self.watchExpiry || {};
      const now = Date.now();
      const result = [];

      for (const id of watchList) {
        const obj = await $.load(id);
        const expiry = watchExpiry[id];
        const permanent = !expiry || expiry === 0;
        const expiresIn = permanent ? null : Math.max(0, expiry - now);

        result.push({
          id: id,
          name: obj?.name || '#' + id,
          permanent: permanent,
          expiresIn: expiresIn,
        });
      }

      return result;
    `);

    // Watch command (for player use)
    obj.setMethod('watchCommand', `
      /** Command handler for 'watch <person>'.
       *  @param target - Resolved target from %i
       */
      const target = args[3];

      if (!target) {
        // Show who we're watching
        const watching = await self.listWatching();
        if (watching.length === 0) {
          return 'You are not watching anyone.';
        }
        let msg = 'You are watching:\\r\\n';
        for (const w of watching) {
          if (w.permanent) {
            msg += '  - ' + w.name + ' (permanent)\\r\\n';
          } else {
            const mins = Math.ceil(w.expiresIn / 60000);
            msg += '  - ' + w.name + ' (' + mins + ' min remaining)\\r\\n';
          }
        }
        return msg;
      }

      const result = await self.watch(target, 0); // Permanent manual watch
      return result.message;
    `);

    // Unwatch command
    obj.setMethod('unwatchCommand', `
      /** Command handler for 'unwatch <person>'.
       *  @param target - Resolved target from %i
       */
      const target = args[3];

      if (!target) {
        return 'Unwatch who?';
      }

      const result = await self.unwatch(target);
      return result.message;
    `);

    // Clear watches for people not in current room
    obj.setMethod('clearOutOfRangeWatches', `
      /** Remove people from watch list who are no longer in the same room.
       *  Called when leaving a room or when someone else leaves.
       *  @returns Number of watches removed
       */
      const watchList = self.watchList || [];
      if (watchList.length === 0) return 0;

      // Get current room's contents
      let roomContents = [];
      if (self.location && self.location !== 0) {
        const room = await $.load(self.location);
        if (room) {
          roomContents = room.contents || [];
        }
      }

      // Find watches that are no longer in range
      const toRemove = [];
      for (const id of watchList) {
        if (!roomContents.includes(id)) {
          toRemove.push(id);
        }
      }

      // Remove them
      for (const id of toRemove) {
        await self.unwatch(id);
      }

      return toRemove.length;
    `);

    // Called when this agent enters a new room
    obj.setMethod('onEnterRoom', `
      /** Called when entering a new room.
       *  Clears out-of-range watches from previous room.
       *  @param newRoom - The room being entered
       *  @param oldRoom - The room being left (may be null)
       */
      const newRoom = args[0];
      const oldRoom = args[1];

      // Clear watches for people left behind
      if (oldRoom) {
        await self.clearOutOfRangeWatches();
      }
    `);

    // Called when someone else leaves the room
    obj.setMethod('onOtherLeft', `
      /** Called when someone else leaves our room.
       *  Removes them from watch list if we were watching them.
       *  @param other - The person who left
       */
      const other = args[0];
      const otherId = typeof other === 'number' ? other : other?.id;

      if (otherId && await self.isWatching(otherId)) {
        await self.unwatch(otherId);
      }
    `);
  }

  private addSkillMethods(obj: RuntimeObject): void {
    // Get current skill level (0 if never used)
    obj.setMethod('getSkillLevel', `
      /** Get current level for a skill.
       *  @param skillName - Name of the skill
       *  @returns Skill level (0 if never used)
       */
      const skillName = args[0];
      const skills = self.skills || {};
      const skill = skills[skillName];
      return skill ? skill.level : 0;
    `);

    // Get full skill info
    obj.setMethod('getSkill', `
      /** Get full skill info.
       *  @param skillName - Name of the skill
       *  @returns { level, xp, lastProgressed } or null if never used
       */
      const skillName = args[0];
      const skills = self.skills || {};
      return skills[skillName] || null;
    `);

    // Check if skill is off cooldown for progression
    obj.setMethod('canProgress', `
      /** Check if a skill can progress (off cooldown).
       *  @param skillName - Name of the skill
       *  @returns true if off cooldown
       */
      const skillName = args[0];
      const skills = self.skills || {};
      const skill = skills[skillName];

      if (!skill) return true; // New skill, can always progress

      const cooldown = self.skillCooldown || 3600000; // 1 hour default
      const now = Date.now();
      return (now - (skill.lastProgressed || 0)) >= cooldown;
    `);

    // Calculate XP needed for next level (diminishing returns)
    obj.setMethod('xpForLevel', `
      /** Calculate XP needed to reach a level.
       *  Quadratic scaling - 100 levels, ~10,000 total uses to master.
       *  Level 1: 1 XP, Level 50: 50 XP, Level 100: 199 XP
       *  Sum of all levels ≈ 10,000 XP
       *  @param level - Target level
       *  @returns XP needed
       */
      const level = args[0];
      if (level <= 0) return 0;
      // Quadratic: 2 * level - 1 (arithmetic progression)
      // Sum from 1 to 100 = 100^2 = 10,000
      return (2 * level) - 1;
    `);

    // Use a skill - may grant XP if off cooldown
    obj.setMethod('useSkill', `
      /** Use a skill, potentially gaining XP.
       *  Only grants XP if off cooldown.
       *  @param skillName - Name of the skill
       *  @param xpGain - Base XP to gain (default 1)
       *  @returns { level, gained, leveledUp, onCooldown }
       */
      const skillName = args[0];
      const xpGain = args[1] || 1;

      const skills = self.skills || {};
      let skill = skills[skillName];

      // Initialize skill if new
      if (!skill) {
        skill = { level: 0, xp: 0, lastProgressed: 0 };
      }

      const now = Date.now();
      const cooldown = self.skillCooldown || 3600000;
      const onCooldown = (now - (skill.lastProgressed || 0)) < cooldown;

      if (onCooldown) {
        return {
          level: skill.level,
          gained: 0,
          leveledUp: false,
          onCooldown: true,
        };
      }

      // Grant XP
      skill.xp += xpGain;
      skill.lastProgressed = now;

      // Check for level up
      let leveledUp = false;
      const xpNeeded = await self.xpForLevel(skill.level + 1);
      if (skill.xp >= xpNeeded) {
        skill.level += 1;
        skill.xp -= xpNeeded; // Carry over excess
        leveledUp = true;
      }

      // Save
      skills[skillName] = skill;
      self.skills = skills;

      return {
        level: skill.level,
        gained: xpGain,
        leveledUp,
        onCooldown: false,
      };
    `);

    // List all skills
    obj.setMethod('listSkills', `
      /** Get all skills with levels.
       *  @returns Array of { name, level, xp, xpToNext }
       */
      const skills = self.skills || {};
      const result = [];

      for (const [name, skill] of Object.entries(skills)) {
        const xpToNext = await self.xpForLevel(skill.level + 1) - skill.xp;
        result.push({
          name,
          level: skill.level,
          xp: skill.xp,
          xpToNext,
        });
      }

      // Sort by level descending
      result.sort((a, b) => b.level - a.level);
      return result;
    `);

    // Skill check - roll skill level dice against opposing skill level
    obj.setMethod('skillCheck', `
      /** Perform a skill check.
       *  Roll X d100s (X = skill level), count successes against opposing level.
       *  Each die succeeds if roll > opposing level.
       *  Failed rolls get a luck save: roll d100, if <= luck, failure becomes success.
       *  Also uses the skill (may gain XP).
       *  @param skillName - Name of the skill
       *  @param opposingLevel - The opposing skill level to beat (1-100)
       *  @returns { successes, luckSaves, level, opposingLevel }
       */
      const skillName = args[0];
      const opposingLevel = Math.max(0, Math.min(100, args[1] || 50));

      const level = await self.getSkillLevel(skillName);
      const luck = await self.getLuck();

      // Roll 'level' d100s, each succeeds if > opposingLevel
      let successes = 0;
      let luckSaves = 0;

      for (let i = 0; i < level; i++) {
        const roll = Math.floor(Math.random() * 100) + 1;
        if (roll > opposingLevel) {
          successes++;
        } else {
          // Failed - try luck save
          const luckRoll = Math.floor(Math.random() * 100) + 1;
          if (luckRoll <= luck) {
            successes++;
            luckSaves++;
          }
        }
      }

      // Using the skill grants XP
      await self.useSkill(skillName, 1);

      return {
        successes,
        luckSaves,
        level,
        opposingLevel,
      };
    `);

    // Get current luck (base + temporary bonuses)
    obj.setMethod('getLuck', `
      /** Get current effective luck.
       *  @returns Current luck value (1-100)
       */
      const baseLuck = self.luck || 1;
      const tempLuck = self.tempLuck || 0;
      return Math.min(100, Math.max(1, baseLuck + tempLuck));
    `);

    // Set temporary luck bonus (replaces any existing boost)
    obj.setMethod('boostLuck', `
      /** Set temporary luck bonus. Replaces any existing boost.
       *  Caller is responsible for scheduling removal.
       *  @param amount - Luck bonus to set
       *  @returns New effective luck
       */
      const amount = args[0] || 0;
      self.tempLuck = amount;
      return await self.getLuck();
    `);

    // Clear luck boost
    obj.setMethod('clearLuckBoost', `
      /** Clear any temporary luck bonus.
       *  @returns New effective luck (base only)
       */
      self.tempLuck = 0;
      return await self.getLuck();
    `);
  }

  private addMovementMethods(obj: RuntimeObject): void {
    // Movement constants:
    // Walk: 1.4 m/s (5 km/h), 1 calorie per 10 meters
    // Run:  2.8 m/s (10 km/h), 2.5 calories per 10 meters
    // Time to travel = distance / speed (in seconds)

    obj.setMethod('isMoving', `
      /** Check if agent is currently moving.
       *  @returns true if in motion
       */
      return self.movementState !== null;
    `);

    obj.setMethod('getMovementMode', `
      /** Get current movement mode.
       *  @returns 'walk' or 'run'
       */
      return self.movementMode || 'walk';
    `);

    obj.setMethod('setMovementMode', `
      /** Set movement mode for future movement.
       *  @param mode - 'walk' or 'run'
       *  @returns { success, mode }
       */
      const mode = args[0];
      if (mode !== 'walk' && mode !== 'run') {
        return { success: false, message: 'Mode must be walk or run.' };
      }
      self.movementMode = mode;
      return { success: true, mode };
    `);

    obj.setMethod('getMovementSpeed', `
      /** Get movement speed in m/s for a mode.
       *  Walk: 1.4 m/s, Run: 2.8 m/s
       *  @param mode - Optional mode override (uses current mode if not specified)
       *  @returns Speed in meters per second
       */
      const mode = args[0] || self.movementMode || 'walk';
      return mode === 'run' ? 2.8 : 1.4;
    `);

    obj.setMethod('getMovementCalorieCost', `
      /** Get calorie cost per 10 meters for a mode.
       *  Base: Walk: 1 cal/10m, Run: 2.5 cal/10m
       *  Modifiers:
       *  - Fat: +50% cost at max fat (linear scale from 20% threshold)
       *  - Carried weight: +1% cost per kg carried
       *  @param mode - Optional mode override
       *  @returns Calories per 10 meters
       */
      const mode = args[0] || self.movementMode || 'walk';
      let baseCost = mode === 'run' ? 2.5 : 1.0;

      // Fat modifier - heavier body = more energy to move
      // No penalty up to 20% fat, then linear to +50% at max fat
      if (self.getFat) {
        const fatInfo = await self.getFat();
        const fatPercent = fatInfo.fat / fatInfo.maxFat;
        if (fatPercent > 0.2) {
          // 0.2 to 1.0 maps to 0% to 50% penalty
          const fatPenalty = ((fatPercent - 0.2) / 0.8) * 0.5;
          baseCost *= (1 + fatPenalty);
        }
      }

      // Carried weight modifier
      // Each kg adds 1% to movement cost
      if (self.getCarriedWeight) {
        const carriedGrams = await self.getCarriedWeight();
        const carriedKg = carriedGrams / 1000;
        baseCost *= (1 + carriedKg * 0.01);
      }

      return baseCost;
    `);

    obj.setMethod('startMovement', `
      /** Start moving toward a destination.
       *  @param destRoom - Destination room (ID or RuntimeObject)
       *  @param distance - Distance in meters
       *  @param direction - Direction name for display
       *  @returns { success, message, timeMs }
       */
      const destRoomArg = args[0];
      const distance = args[1] || 10;
      const direction = args[2] || 'ahead';

      // Accept either ID or RuntimeObject
      const destRoom = typeof destRoomArg === 'number' ? destRoomArg : destRoomArg?.id;

      // Check if already moving
      if (self.movementState) {
        return { success: false, message: 'You are already moving.' };
      }

      // Check if awake
      if (self.isAwake && !(await self.isAwake())) {
        return { success: false, message: 'You cannot move while asleep.' };
      }

      const mode = self.movementMode || 'walk';
      const speed = await self.getMovementSpeed(mode);
      const timeMs = Math.ceil((distance / speed) * 1000);

      // Calculate calorie cost
      const costPer10m = await self.getMovementCalorieCost(mode);
      const totalCost = (distance / 10) * costPer10m;

      // Check if we have enough calories (if Embodied)
      if (self.getCalorieStatus) {
        const status = await self.getCalorieStatus();
        if (status.total < totalCost) {
          return {
            success: false,
            message: 'You are too exhausted to ' + mode + ' that far.'
          };
        }
      }

      // Set movement state
      const state = {
        destRoom,
        direction,
        distance,
        distanceRemaining: distance,
        startTime: Date.now(),
        mode,
        calorieCost: totalCost,
      };
      self.movementState = state;

      // Schedule completion
      const jobName = 'move_' + self.id + '_' + Date.now();
      await $.scheduler.schedule(jobName, timeMs, 0, self, 'completeMovement');
      self.movementJob = jobName;

      const verb = mode === 'run' ? 'start running' : 'start walking';
      const timeStr = timeMs >= 1000
        ? Math.ceil(timeMs / 1000) + ' seconds'
        : timeMs + 'ms';

      return {
        success: true,
        message: 'You ' + verb + ' ' + direction + '. (' + timeStr + ')',
        timeMs,
      };
    `);

    obj.setMethod('completeMovement', `
      /** Called by scheduler when movement completes.
       *  Burns calories and moves to destination.
       *  @returns { success, message }
       */
      const state = self.movementState;
      if (!state) {
        return { success: false, message: 'Not moving.' };
      }

      const destRoom = state.destRoom;
      const direction = state.direction;
      const calorieCost = state.calorieCost || 0;

      // Clear movement state first
      self.movementState = null;
      self.movementJob = null;

      // Burn calories (if Embodied)
      if (self.burnCalories && calorieCost > 0) {
        await self.burnCalories(calorieCost);
      }

      // Actually move to destination
      await self.moveTo(destRoom, self);

      // Notify arrival
      if (self.tell) {
        const dest = await $.load(destRoom);
        if (dest) {
          const desc = await dest.describe(self);
          await self.tell('\\r\\nYou arrive ' + direction + '.\\r\\n' + desc);
        }
      }

      return { success: true, message: 'Arrived.' };
    `);

    obj.setMethod('stopMovement', `
      /** Stop current movement. Partial calorie cost applies.
       *  @returns { success, message }
       */
      const state = self.movementState;
      if (!state) {
        return { success: false, message: 'You are not moving.' };
      }

      // Cancel scheduled completion
      const jobName = self.movementJob;
      if (jobName && $.scheduler) {
        await $.scheduler.unschedule(jobName);
      }

      // Calculate partial distance traveled
      const elapsed = Date.now() - state.startTime;
      const speed = await self.getMovementSpeed(state.mode);
      const distanceTraveled = (elapsed / 1000) * speed;

      // Burn partial calories
      if (self.burnCalories && distanceTraveled > 0) {
        const costPer10m = await self.getMovementCalorieCost(state.mode);
        const partialCost = (distanceTraveled / 10) * costPer10m;
        await self.burnCalories(partialCost);
      }

      // Clear state
      self.movementState = null;
      self.movementJob = null;

      return {
        success: true,
        message: 'You stop moving after ' + Math.round(distanceTraveled) + 'm.'
      };
    `);

    obj.setMethod('getMovementStatus', `
      /** Get current movement status.
       *  @returns { moving, mode, direction, progress, timeRemaining } or null
       */
      const state = self.movementState;
      if (!state) {
        return null;
      }

      const elapsed = Date.now() - state.startTime;
      const speed = await self.getMovementSpeed(state.mode);
      const distanceTraveled = (elapsed / 1000) * speed;
      const progress = Math.min(100, (distanceTraveled / state.distance) * 100);
      const remaining = state.distance - distanceTraveled;
      const timeRemaining = Math.max(0, (remaining / speed) * 1000);

      return {
        moving: true,
        mode: state.mode,
        direction: state.direction,
        distance: state.distance,
        distanceTraveled: Math.round(distanceTraveled),
        progress: Math.round(progress),
        timeRemainingMs: Math.round(timeRemaining),
      };
    `);

    // Command handlers for walk/run mode switching
    obj.setMethod('walkCommand', `
      /** Switch to walk mode.
       *  Usage: walk
       */
      const result = await self.setMovementMode('walk');
      return 'You will now walk.';
    `);

    obj.setMethod('runCommand', `
      /** Switch to run mode.
       *  Usage: run
       */
      const result = await self.setMovementMode('run');
      return 'You will now run.';
    `);

    obj.setMethod('stopCommand', `
      /** Stop current movement.
       *  Usage: stop
       */
      const result = await self.stopMovement();
      return result.message;
    `);
  }

  private addStatusEffectMethods(obj: RuntimeObject): void {
    // Add a status effect or increase existing intensity
    obj.setMethod('addEffect', `
      /** Add or increase a status effect.
       *  @param name - Effect name (sedation, stimulation, impaired_coordination, etc.)
       *  @param intensity - Amount to add (0-100)
       *  @param decay - Decay rate per tick (default 0.5)
       *  @returns New effect state
       */
      const name = args[0];
      const intensity = args[1] || 0;
      const decay = args[2] ?? 0.5;

      if (!name || intensity <= 0) return null;

      const effects = self.statusEffects || {};
      const current = effects[name] || { intensity: 0, decay: decay };

      // Add intensity, cap at 100
      current.intensity = Math.min(100, current.intensity + intensity);
      // Use higher decay rate if specified
      current.decay = Math.max(current.decay, decay);

      effects[name] = current;
      self.statusEffects = effects;

      return current;
    `);

    // Get current intensity of an effect
    obj.setMethod('getEffect', `
      /** Get current intensity of an effect.
       *  @param name - Effect name
       *  @returns Intensity (0-100) or 0 if not present
       */
      const name = args[0];
      const effects = self.statusEffects || {};
      return effects[name]?.intensity || 0;
    `);

    // Get all active effects
    obj.setMethod('getActiveEffects', `
      /** Get all effects with intensity > 0.
       *  @returns Object of active effects
       */
      const effects = self.statusEffects || {};
      const active = {};
      for (const [name, data] of Object.entries(effects)) {
        if (data.intensity > 0) {
          active[name] = data;
        }
      }
      return active;
    `);

    // Remove or reduce an effect
    obj.setMethod('reduceEffect', `
      /** Reduce an effect's intensity.
       *  @param name - Effect name
       *  @param amount - Amount to reduce
       *  @returns New intensity or 0 if removed
       */
      const name = args[0];
      const amount = args[1] || 0;

      const effects = self.statusEffects || {};
      if (!effects[name]) return 0;

      effects[name].intensity = Math.max(0, effects[name].intensity - amount);

      // Remove if at 0
      if (effects[name].intensity <= 0) {
        delete effects[name];
      }

      self.statusEffects = effects;
      return effects[name]?.intensity || 0;
    `);

    // Process decay for all effects (called each tick)
    obj.setMethod('decayEffects', `
      /** Process natural decay of all effects.
       *  Called each heartbeat tick.
       *  @returns Summary of decayed effects
       */
      const effects = self.statusEffects || {};
      const decayed = {};

      for (const [name, data] of Object.entries(effects)) {
        if (data.intensity > 0) {
          const decayAmount = data.decay || 0.5;
          const oldIntensity = data.intensity;
          data.intensity = Math.max(0, data.intensity - decayAmount);
          decayed[name] = { from: oldIntensity, to: data.intensity, decay: decayAmount };

          // Remove if at 0
          if (data.intensity <= 0) {
            delete effects[name];
          }
        }
      }

      self.statusEffects = effects;
      return decayed;
    `);

    // Get net alertness (stimulation - sedation) for doze mechanic
    obj.setMethod('getNetAlertness', `
      /** Get net alertness level.
       *  Positive = stimulated (harder to sleep)
       *  Negative = sedated (easier to doze)
       *  @returns Net alertness value
       */
      const stimulation = await self.getEffect('stimulation');
      const sedation = await self.getEffect('sedation');
      return stimulation - sedation;
    `);

    // Check if an effect is at dangerous levels
    obj.setMethod('isEffectDangerous', `
      /** Check if effect is at dangerous intensity.
       *  @param name - Effect name
       *  @param threshold - Danger threshold (default 80)
       *  @returns true if dangerous
       */
      const name = args[0];
      const threshold = args[1] || 80;
      const intensity = await self.getEffect(name);
      return intensity >= threshold;
    `);

    // Check for dangerous combination (both sedation and stimulation high)
    obj.setMethod('hasDangerousCombination', `
      /** Check for dangerous drug combinations.
       *  High sedation + high stimulation = heart strain
       *  @returns { dangerous: boolean, reason: string }
       */
      const sedation = await self.getEffect('sedation');
      const stimulation = await self.getEffect('stimulation');

      // Both over 50 is concerning, both over 70 is dangerous
      if (sedation >= 70 && stimulation >= 70) {
        return { dangerous: true, reason: 'Your heart races while your body tries to shut down.' };
      }
      if (sedation >= 50 && stimulation >= 50) {
        return { dangerous: false, reason: 'You feel jittery and unstable.' };
      }
      return { dangerous: false, reason: null };
    `);

    // Get coordination penalty from effects
    obj.setMethod('getCoordinationPenalty', `
      /** Get total coordination penalty from effects.
       *  Used for dexterity checks.
       *  @returns Penalty value (0-100)
       */
      const impaired = await self.getEffect('impaired_coordination');
      const sedation = await self.getEffect('sedation');
      // Sedation also affects coordination at 50% rate
      return Math.min(100, impaired + (sedation * 0.5));
    `);

    // Get perception penalty from effects
    obj.setMethod('getPerceptionPenalty', `
      /** Get total perception penalty from effects.
       *  Used for see/hear checks.
       *  @returns Penalty value (0-100)
       */
      const impaired = await self.getEffect('impaired_perception');
      const sedation = await self.getEffect('sedation');
      const euphoria = await self.getEffect('euphoria');
      // Sedation and euphoria also affect perception
      return Math.min(100, impaired + (sedation * 0.3) + (euphoria * 0.2));
    `);

    // Check nausea for vomiting
    obj.setMethod('checkNausea', `
      /** Check if nausea triggers vomiting.
       *  @returns { vomit: boolean, intensity: number }
       */
      const nausea = await self.getEffect('nausea');
      if (nausea < 30) return { vomit: false, intensity: nausea };

      // Chance to vomit scales with intensity
      // 30 = 5% chance, 50 = 20%, 70 = 50%, 90 = 90%
      const vomitChance = Math.min(0.9, (nausea - 30) / 100 + 0.05);
      const vomit = Math.random() < vomitChance;

      return { vomit, intensity: nausea, chance: vomitChance };
    `);

    // Describe current effect state for health command
    obj.setMethod('describeEffects', `
      /** Get human-readable description of active effects.
       *  @returns Array of description strings
       */
      const lines = [];
      const effects = self.statusEffects || {};

      // Sedation
      const sedation = effects.sedation?.intensity || 0;
      if (sedation >= 70) {
        lines.push('You can barely keep your eyes open.');
      } else if (sedation >= 50) {
        lines.push('You feel very drowsy.');
      } else if (sedation >= 30) {
        lines.push('You feel drowsy.');
      } else if (sedation >= 10) {
        lines.push('You feel slightly sedated.');
      }

      // Stimulation
      const stimulation = effects.stimulation?.intensity || 0;
      if (stimulation >= 70) {
        lines.push('Your heart is racing. You feel wired.');
      } else if (stimulation >= 50) {
        lines.push('You feel very alert and jittery.');
      } else if (stimulation >= 30) {
        lines.push('You feel alert and awake.');
      } else if (stimulation >= 10) {
        lines.push('You feel slightly energized.');
      }

      // Impaired coordination
      const coord = effects.impaired_coordination?.intensity || 0;
      if (coord >= 70) {
        lines.push('You can barely stand straight.');
      } else if (coord >= 50) {
        lines.push('Your movements are clumsy and uncoordinated.');
      } else if (coord >= 30) {
        lines.push('Your coordination is impaired.');
      } else if (coord >= 10) {
        lines.push('You feel slightly unsteady.');
      }

      // Impaired perception
      const percep = effects.impaired_perception?.intensity || 0;
      if (percep >= 70) {
        lines.push('Everything is blurry and muffled.');
      } else if (percep >= 50) {
        lines.push('Your senses are dulled.');
      } else if (percep >= 30) {
        lines.push('Things seem slightly hazy.');
      }

      // Nausea
      const nausea = effects.nausea?.intensity || 0;
      if (nausea >= 70) {
        lines.push('You feel like you might vomit.');
      } else if (nausea >= 50) {
        lines.push('Your stomach churns unpleasantly.');
      } else if (nausea >= 30) {
        lines.push('You feel queasy.');
      } else if (nausea >= 10) {
        lines.push('Your stomach feels unsettled.');
      }

      // Euphoria
      const euphoria = effects.euphoria?.intensity || 0;
      if (euphoria >= 70) {
        lines.push('You feel amazing, invincible even.');
      } else if (euphoria >= 50) {
        lines.push('You feel really good.');
      } else if (euphoria >= 30) {
        lines.push('You feel pleasantly relaxed.');
      }

      // Pain
      const pain = effects.pain?.intensity || 0;
      if (pain >= 70) {
        lines.push('You are in agony.');
      } else if (pain >= 50) {
        lines.push('You are in significant pain.');
      } else if (pain >= 30) {
        lines.push('You are in pain.');
      } else if (pain >= 10) {
        lines.push('You feel some discomfort.');
      }

      return lines;
    `);
  }

  private addDyingMethods(obj: RuntimeObject): void {
    // Death funnel messages - one per minute for 15 minutes
    // Progress through stages of dying using $.proportional
    obj.setMethod('getDeathMessage', `
      /** Get the death message for current dying progress.
       *  Uses $.proportional to select from death stages.
       *  @returns Creative death funnel message
       */
      const progress = self.dyingProgress || 0;

      // Death stages - $.proportional distributes these across 0-100%
      const messages = [
        // 0% - Just started dying
        'Everything goes dark. You feel yourself slipping away...',
        // ~7% - Initial shock
        'A cold numbness spreads through your body. Sounds fade to silence.',
        // ~14%
        'You try to move but your body refuses. The darkness deepens.',
        // ~21% - Fading
        'Memories flash before you - faces, places, moments lost to time.',
        // ~28%
        'The cold reaches your core. You feel so very tired.',
        // ~35%
        'Is that light in the distance? Or just the last flickers of consciousness?',
        // ~42% - Deeper
        'Your thoughts scatter like leaves in wind. Hard to remember... what was your name?',
        // ~49%
        'The silence is absolute now. No heartbeat. No breath. Just... nothing.',
        // ~56%
        'You drift in an endless void. Time has no meaning here.',
        // ~63% - Nearly gone
        'Something pulls at you from far away. A thread, growing thinner.',
        // ~70%
        'The last warmth fades. You are becoming part of the darkness.',
        // ~77%
        'Fragments of self dissolve into the void. Almost peaceful now.',
        // ~84% - Final moments
        'A distant voice? No... just an echo of what was.',
        // ~91%
        'The thread snaps. You feel yourself falling into forever.',
        // 100% - Death
        'This is the end. Let go...',
      ];

      return await $.proportional.fromPercent(messages, progress);
    `);

    // Start the dying process
    obj.setMethod('startDying', `
      /** Begin the dying process. Called when body decay reaches 100%.
       *  @returns { success, message }
       */
      if (self.isDying) {
        return { success: false, message: 'Already dying.' };
      }

      self.isDying = true;
      self.dyingProgress = 0;

      // Force asleep state - dying person can't act
      await self.cancelSleepTransition();
      self.sleepState = 'asleep';

      // Send first death message
      if (self.tell) {
        const msg = await self.getDeathMessage();
        await self.tell('\\r\\n' + msg);
      }

      return { success: true, message: 'You are dying.' };
    `);

    // Process dying tick - called each heartbeat (1 minute)
    obj.setMethod('dyingTick', `
      /** Process one tick of dying. Called each heartbeat.
       *  Progress increases ~6.67 per tick (100 in 15 ticks/minutes).
       *  @returns { progress, dead, message }
       */
      if (!self.isDying) {
        return { progress: 0, dead: false };
      }

      const oldProgress = self.dyingProgress || 0;
      const newProgress = Math.min(100, oldProgress + 6.67);
      self.dyingProgress = newProgress;

      // Check if dead
      if (newProgress >= 100) {
        return { progress: 100, dead: true, message: 'You have died.' };
      }

      // Send death message if we crossed a minute boundary
      const oldMinute = Math.floor(oldProgress / 6.67);
      const newMinute = Math.floor(newProgress / 6.67);

      let message = null;
      if (newMinute > oldMinute && self.tell) {
        message = await self.getDeathMessage();
        await self.tell('\\r\\n' + message);
      }

      return { progress: newProgress, dead: false, message };
    `);

    // Stabilize - reduce dying progress (for doctors)
    obj.setMethod('stabilize', `
      /** Reduce dying progress. Used by doctors to save a dying person.
       *  @param amount - Amount to reduce (default 20)
       *  @returns { success, progress, stabilized }
       */
      const amount = args[0] || 20;

      if (!self.isDying) {
        return { success: false, message: 'Not dying.' };
      }

      const oldProgress = self.dyingProgress || 0;
      const newProgress = Math.max(0, oldProgress - amount);
      self.dyingProgress = newProgress;

      // If progress reaches 0, they're stabilized (no longer dying)
      if (newProgress <= 0) {
        self.isDying = false;
        self.dyingProgress = 0;

        // They're still unconscious but stable
        if (self.tell) {
          await self.tell('\\r\\nYou feel yourself being pulled back from the void...');
        }

        return { success: true, progress: 0, stabilized: true };
      }

      return { success: true, progress: newProgress, stabilized: false };
    `);

    // Complete death - convert to corpse, send player to chargen
    obj.setMethod('completeDeath', `
      /** Complete the death process. Body becomes corpse, player goes to chargen.
       *  @returns { success, corpseId }
       */
      if (!self.isDying) {
        return { success: false, message: 'Not dying.' };
      }

      // Create corpse from this body
      const corpseProto = $.corpse;
      if (!corpseProto) {
        // Fallback: just recycle this object
        if ($.recycler) {
          await $.recycler.recycle(self);
        }
        return { success: true, corpseId: null };
      }

      // Get our location before death
      const deathLocation = self.location;

      // Get the actual body object (with all its parts, wounds, items in hands)
      const body = self.getBody ? await self.getBody() : null;
      const bodyWeight = body ? (body.weight || 70000) : 70000;

      // Create corpse object - sex/species determined from body anatomy during autopsy
      const corpse = await $.create({
        parent: corpseProto,
        properties: {
          name: 'corpse of ' + (self.name || 'someone'),
          description: 'The lifeless body of ' + (self.name || 'someone') + '.',
          originalName: self.name,
          // Weight from actual body
          weight: bodyWeight,
          // Contents will include the body
          contents: [],
        },
      });

      // Move the actual body into the corpse (with all its parts, hands, items)
      if (body) {
        // Detach body from player
        self.bodyId = null;
        // Move body into corpse
        body.location = corpse.id;
        corpse.contents = [body.id];
        // Mark body as dead (stops any body processes)
        body.isDead = true;
      }

      // Move corpse to where we died
      if (deathLocation) {
        await corpse.moveTo(deathLocation);
      }

      // Disconnect player from this body - they go to chargen
      // The connection handling is done by the player's session
      if (self.onDeath) {
        await self.onDeath(corpse);
      }

      return { success: true, corpseId: corpse.id };
    `);

    // Check if dying
    obj.setMethod('checkDying', `
      /** Check if this agent is in dying state.
       *  @returns true if dying
       */
      return self.isDying === true;
    `);

    // Get dying progress
    obj.setMethod('getDyingProgress', `
      /** Get current dying progress (0-100).
       *  @returns Progress percentage
       */
      return self.dyingProgress || 0;
    `);

    // Get time remaining before death (in minutes)
    obj.setMethod('getTimeUntilDeath', `
      /** Get estimated time until death in minutes.
       *  @returns Minutes remaining (0-15)
       */
      if (!self.isDying) return null;
      const progress = self.dyingProgress || 0;
      const remaining = 100 - progress;
      return Math.ceil(remaining / 6.67);
    `);
  }
}
