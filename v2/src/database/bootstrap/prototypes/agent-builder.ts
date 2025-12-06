import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Agent prototype
 * Base prototype for things that can act (verb handling, movement)
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
        // Display options
        options: {
          seePrompt: '',       // Prefix for visual messages (empty = none)
          hearPrompt: '',      // Prefix for audio messages (empty = none)
          color: true,         // Enable ANSI color output
          screenReader: false, // Screen reader accessibility mode
        },
      },
      methods: {},
    });

    this.addVerbMethods(obj);
    this.addResolutionMethods(obj);
    this.addActionMethods(obj);
    this.addColorMethods(obj);

    return obj;
  }

  private addVerbMethods(obj: RuntimeObject): void {
    // Register verb pattern(s) that this agent can use
    // patterns: string or string[] - patterns like 'get %i', 'shoot %i with %t'
    // sourceObj: the object that provides the verb
    // methodName: the method to call on sourceObj
    obj.setMethod('registerVerb', `
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

    // Unregister a specific pattern
    obj.setMethod('unregisterVerb', `
      const pattern = args[0];
      const verbs = self.verbs || {};
      delete verbs[pattern];
      self.verbs = verbs;
    `);

    // Unregister all verbs provided by a specific object
    obj.setMethod('unregisterVerbsFrom', `
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

    // Match input against all registered verbs, return best match
    obj.setMethod('matchVerb', `
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

    // Match input against a pattern, return resolved args or null
    obj.setMethod('tryMatchPattern', `
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
    // Parse ordinal from item reference: "first sword" → { ordinal: 0, name: "sword" }
    obj.setMethod('parseOrdinal', `
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

    // Find objects matching a name in a list of contents
    obj.setMethod('findMatches', `
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

    // Resolve %i - find item by name with ordinal support
    // Returns: { resolved: RuntimeObject, error: null } or { resolved: null, error: string }
    obj.setMethod('resolveItem', `
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
      const message = args[3];
      // TODO: Broadcast to room
      return \`\${player.name} says: \${message}\`;
    `);

    // Pattern: emote %s
    // args[3] = the action string
    obj.setMethod('emote', `
      const action = args[3];
      // TODO: Broadcast to room
      return \`\${player.name} \${action}\`;
    `);

    // Pattern: look (no args)
    // Look at current location
    obj.setMethod('look', `
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
}
