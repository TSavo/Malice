import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Format utility object ($.format)
 * Handles text layout: columns, tables, padding, wrapping
 *
 * Usage from MOO code:
 *   // Multi-column layout
 *   const text = $.format.columns(['apple', 'banana', 'cherry', 'date'], 2);
 *   // apple   banana
 *   // cherry  date
 *
 *   // Table with headers
 *   const table = $.format.table([
 *     ['Name', 'HP', 'Status'],
 *     ['Goblin', '10', 'Alive'],
 *     ['Orc', '25', 'Dead'],
 *   ]);
 *
 *   // Text wrapping
 *   const wrapped = $.format.wrap('Long text here...', 40);
 */
export class FormatBuilder {
  private format: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.format) {
      this.format = await this.manager.load(aliases.format);
      if (this.format) return; // Already exists
    }

    // Create new Format utility
    this.format = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Format',
        description: 'Text formatting utilities for columns, tables, and layout',
        defaultWidth: 78,
      },
      methods: {},
    });

    // Pad string on the right to reach target width
    this.format.setMethod('padRight', `
      /** Pad a string on the right.
       *  Usage: $.format.padRight(str, width, char?)
       *  @param str - String to pad
       *  @param width - Target width
       *  @param char - Padding character (default: space)
       *  @example padRight('hi', 5) -> "hi   "
       */
      const str = String(args[0] || '');
      const width = args[1] || 10;
      const char = args[2] || ' ';

      if (str.length >= width) return str;
      return str + char.repeat(width - str.length);
    `);

    // Pad string on the left to reach target width
    this.format.setMethod('padLeft', `
      /** Pad a string on the left.
       *  Usage: $.format.padLeft(str, width, char?)
       *  @param str - String to pad
       *  @param width - Target width
       *  @param char - Padding character (default: space)
       *  @example padLeft('42', 5, '0') -> "00042"
       */
      const str = String(args[0] || '');
      const width = args[1] || 10;
      const char = args[2] || ' ';

      if (str.length >= width) return str;
      return char.repeat(width - str.length) + str;
    `);

    // Center string within target width
    this.format.setMethod('center', `
      /** Center a string within a width.
       *  Usage: $.format.center(str, width, char?)
       *  @param str - String to center
       *  @param width - Target width
       *  @param char - Padding character (default: space)
       *  @example center('hi', 6) -> "  hi  "
       */
      const str = String(args[0] || '');
      const width = args[1] || 10;
      const char = args[2] || ' ';

      if (str.length >= width) return str;

      const total = width - str.length;
      const left = Math.floor(total / 2);
      const right = total - left;

      return char.repeat(left) + str + char.repeat(right);
    `);

    // Truncate string with ellipsis
    this.format.setMethod('truncate', `
      /** Truncate a string with ellipsis if too long.
       *  Usage: $.format.truncate(str, width, ellipsis?)
       *  @param str - String to truncate
       *  @param width - Maximum width
       *  @param ellipsis - Ellipsis string (default: '...')
       *  @example truncate('Hello World', 8) -> "Hello..."
       */
      const str = String(args[0] || '');
      const width = args[1] || 20;
      const ellipsis = args[2] !== undefined ? args[2] : '...';

      if (str.length <= width) return str;

      return str.slice(0, width - ellipsis.length) + ellipsis;
    `);

    // Format items into columns
    this.format.setMethod('columns', `
      /** Format items into multiple columns.
       *  Usage: $.format.columns(items, numCols?, options?)
       *  @param items - Array of strings
       *  @param numCols - Number of columns (default: 3)
       *  @param options - { width: total width, separator: between cols, minColWidth: minimum }
       *  @returns Array of lines
       *  @example columns(['a','b','c','d','e'], 2) -> ['a    b', 'c    d', 'e']
       */
      const items = args[0] || [];
      const numCols = args[1] || 3;
      const options = args[2] || {};

      if (!Array.isArray(items) || items.length === 0) return [];

      const totalWidth = options.width || self.defaultWidth || 78;
      const separator = options.separator !== undefined ? options.separator : '  ';
      const minColWidth = options.minColWidth || 5;

      // Calculate column width
      const sepWidth = separator.length * (numCols - 1);
      const colWidth = Math.max(minColWidth, Math.floor((totalWidth - sepWidth) / numCols));

      // Build rows
      const lines = [];
      for (let i = 0; i < items.length; i += numCols) {
        const rowItems = items.slice(i, i + numCols);
        const cells = rowItems.map(item => {
          const str = String(item || '');
          if (str.length > colWidth) {
            return str.slice(0, colWidth - 1) + '~';
          }
          return str + ' '.repeat(colWidth - str.length);
        });
        lines.push(cells.join(separator).trimEnd());
      }

      return lines;
    `);

    // Format data as a table with optional headers
    this.format.setMethod('table', `
      /** Format data as a table with aligned columns.
       *  Usage: $.format.table(rows, options?)
       *  @param rows - Array of row arrays. First row can be headers.
       *  @param options - { header: bool, separator: string, border: bool }
       *  @returns Array of lines
       *  @example table([['Name','HP'],['Orc','25']]) -> ['Name  HP', '----  --', 'Orc   25']
       */
      const rows = args[0] || [];
      const options = args[1] || {};

      if (!Array.isArray(rows) || rows.length === 0) return [];

      const hasHeader = options.header !== false; // Default true
      const separator = options.separator !== undefined ? options.separator : '  ';
      const border = options.border || false;

      // Convert all cells to strings and find column widths
      const stringRows = rows.map(row =>
        (Array.isArray(row) ? row : [row]).map(cell => String(cell ?? ''))
      );

      const numCols = Math.max(...stringRows.map(r => r.length));
      const colWidths = [];

      for (let col = 0; col < numCols; col++) {
        let maxWidth = 0;
        for (const row of stringRows) {
          if (row[col]) {
            maxWidth = Math.max(maxWidth, row[col].length);
          }
        }
        colWidths.push(maxWidth);
      }

      // Build output lines
      const lines = [];

      // Top border
      if (border) {
        const borderLine = colWidths.map(w => '-'.repeat(w)).join('-+-');
        lines.push('+-' + borderLine + '-+');
      }

      for (let i = 0; i < stringRows.length; i++) {
        const row = stringRows[i];

        // Pad each cell
        const cells = [];
        for (let col = 0; col < numCols; col++) {
          const cell = row[col] || '';
          cells.push(cell + ' '.repeat(colWidths[col] - cell.length));
        }

        if (border) {
          lines.push('| ' + cells.join(' | ') + ' |');
        } else {
          lines.push(cells.join(separator).trimEnd());
        }

        // Header separator after first row
        if (i === 0 && hasHeader) {
          if (border) {
            const sepLine = colWidths.map(w => '-'.repeat(w)).join('-+-');
            lines.push('+-' + sepLine + '-+');
          } else {
            const dashes = colWidths.map(w => '-'.repeat(w));
            lines.push(dashes.join(separator));
          }
        }
      }

      // Bottom border
      if (border) {
        const borderLine = colWidths.map(w => '-'.repeat(w)).join('-+-');
        lines.push('+-' + borderLine + '-+');
      }

      return lines;
    `);

    // Word wrap text to specified width
    this.format.setMethod('wrap', `
      /** Word-wrap text to a specified width.
       *  Usage: $.format.wrap(text, width?, indent?)
       *  @param text - Text to wrap
       *  @param width - Maximum line width (default: 78)
       *  @param indent - Indent for continuation lines (default: '')
       *  @returns Array of lines
       *  @example wrap('Hello there friend', 10) -> ['Hello', 'there', 'friend']
       */
      const text = String(args[0] || '');
      const width = args[1] || self.defaultWidth || 78;
      const indent = args[2] || '';

      if (!text) return [];

      const words = text.split(/\\s+/);
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        // Handle words longer than width
        if (word.length > width) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = indent;
          }
          // Break long word
          let remaining = word;
          while (remaining.length > width) {
            lines.push((lines.length > 0 ? indent : '') + remaining.slice(0, width - 1) + '-');
            remaining = remaining.slice(width - 1);
          }
          currentLine = (lines.length > 0 ? indent : '') + remaining;
          continue;
        }

        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (testLine.length <= width) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = indent + word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    `);

    // Draw a box around text
    this.format.setMethod('box', `
      /** Draw a box around text.
       *  Usage: $.format.box(text, options?)
       *  @param text - Text or array of lines
       *  @param options - { width: inner width, style: 'single'|'double'|'ascii', title: string }
       *  @returns Array of lines
       *  @example box('Hello!') -> ['┌────────┐', '│ Hello! │', '└────────┘']
       */
      const text = args[0];
      const options = args[1] || {};

      const style = options.style || 'single';
      const title = options.title || '';
      const padding = options.padding !== undefined ? options.padding : 1;

      // Box characters
      const chars = {
        single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
        double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
        ascii:  { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
        heavy:  { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
      };

      const c = chars[style] || chars.single;

      // Convert text to lines
      let lines;
      if (Array.isArray(text)) {
        lines = text.map(l => String(l));
      } else {
        lines = String(text || '').split('\\n');
      }

      // Find content width
      let contentWidth = options.width;
      if (!contentWidth) {
        contentWidth = Math.max(...lines.map(l => l.length), title.length);
      }

      const innerWidth = contentWidth + padding * 2;
      const pad = ' '.repeat(padding);

      // Build output
      const output = [];

      // Top border (with optional title)
      if (title) {
        const titlePart = ' ' + title + ' ';
        const remainingWidth = innerWidth - titlePart.length;
        const leftDashes = Math.floor(remainingWidth / 2);
        const rightDashes = remainingWidth - leftDashes;
        output.push(c.tl + c.h.repeat(leftDashes) + titlePart + c.h.repeat(rightDashes) + c.tr);
      } else {
        output.push(c.tl + c.h.repeat(innerWidth) + c.tr);
      }

      // Content lines
      for (const line of lines) {
        const paddedLine = line + ' '.repeat(contentWidth - line.length);
        output.push(c.v + pad + paddedLine + pad + c.v);
      }

      // Bottom border
      output.push(c.bl + c.h.repeat(innerWidth) + c.br);

      return output;
    `);

    // Horizontal rule/line
    this.format.setMethod('hr', `
      /** Create a horizontal rule.
       *  Usage: $.format.hr(width?, char?)
       *  @param width - Width of the line (default: 78)
       *  @param char - Character to use (default: '-')
       *  @example hr(20, '=') -> "===================="
       */
      const width = args[0] || self.defaultWidth || 78;
      const char = args[1] || '-';

      return char.repeat(width);
    `);

    // Indent text
    this.format.setMethod('indent', `
      /** Indent text by a number of spaces.
       *  Usage: $.format.indent(text, spaces?)
       *  @param text - Text or array of lines
       *  @param spaces - Number of spaces (default: 2)
       *  @returns Array of lines (or string if input was string)
       *  @example indent('hello', 4) -> "    hello"
       */
      const text = args[0];
      const spaces = args[1] !== undefined ? args[1] : 2;
      const prefix = ' '.repeat(spaces);

      if (Array.isArray(text)) {
        return text.map(line => prefix + line);
      }

      const lines = String(text || '').split('\\n');
      const indented = lines.map(line => prefix + line);

      return indented.length === 1 ? indented[0] : indented;
    `);

    // Bar/progress bar
    this.format.setMethod('bar', `
      /** Create a progress/status bar.
       *  Usage: $.format.bar(value, max, width?, options?)
       *  @param value - Current value
       *  @param max - Maximum value
       *  @param width - Bar width (default: 20)
       *  @param options - { filled: char, empty: char, showPct: bool, brackets: bool }
       *  @example bar(3, 10, 10) -> "[===       ]"
       *  @example bar(75, 100, 10, {showPct:true}) -> "[=======   ] 75%"
       */
      const value = Math.max(0, args[0] || 0);
      const max = Math.max(1, args[1] || 100);
      const width = args[2] || 20;
      const options = args[3] || {};

      const filled = options.filled || '=';
      const empty = options.empty || ' ';
      const showPct = options.showPct || false;
      const brackets = options.brackets !== false;

      const pct = Math.min(1, value / max);
      const filledCount = Math.round(pct * width);
      const emptyCount = width - filledCount;

      let bar = filled.repeat(filledCount) + empty.repeat(emptyCount);
      if (brackets) {
        bar = '[' + bar + ']';
      }

      if (showPct) {
        bar += ' ' + Math.round(pct * 100) + '%';
      }

      return bar;
    `);

    // List with bullets or numbers
    this.format.setMethod('list', `
      /** Format items as a bulleted or numbered list.
       *  Usage: $.format.list(items, options?)
       *  @param items - Array of items
       *  @param options - { style: 'bullet'|'number'|'letter'|'roman', indent: number }
       *  @returns Array of lines
       *  @example list(['one','two']) -> ['  • one', '  • two']
       *  @example list(['a','b'], {style:'number'}) -> ['  1. a', '  2. b']
       */
      const items = args[0] || [];
      const options = args[1] || {};

      if (!Array.isArray(items)) return [];

      const style = options.style || 'bullet';
      const indent = options.indent !== undefined ? options.indent : 2;
      const prefix = ' '.repeat(indent);

      const bullets = {
        bullet: '•',
        dash: '-',
        star: '*',
        arrow: '→',
      };

      const toRoman = (n) => {
        const romanNumerals = [
          ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
          ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
          ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
        ];
        let result = '';
        for (const [numeral, value] of romanNumerals) {
          while (n >= value) {
            result += numeral;
            n -= value;
          }
        }
        return result.toLowerCase();
      };

      return items.map((item, i) => {
        let marker;
        switch (style) {
          case 'number':
            marker = (i + 1) + '.';
            break;
          case 'letter':
            marker = String.fromCharCode(97 + (i % 26)) + ')';
            break;
          case 'Letter':
            marker = String.fromCharCode(65 + (i % 26)) + ')';
            break;
          case 'roman':
            marker = toRoman(i + 1) + '.';
            break;
          case 'Roman':
            marker = toRoman(i + 1).toUpperCase() + '.';
            break;
          default:
            marker = bullets[style] || bullets.bullet;
        }
        return prefix + marker + ' ' + item;
      });
    `);

    // Compose a sentence with template substitution
    this.format.setMethod('compose', `
      /** Compose a sentence with list, verb conjugation, and pronoun substitution.
       *  Usage: $.format.compose(template, items, options?)
       *
       *  Template codes (list-specific):
       *    %T - The formatted list with article, capitalized ("The sword and shield")
       *    %t - The formatted list with article, lowercase ("the sword and shield")
       *    %v{verb} - Verb conjugated based on list count (fall->falls for 1 item)
       *
       *  Plus all $.pronoun.sub codes (except %t which is shadowed):
       *    %N/%n - Actor name, %s/%o/%p/%r - Actor pronouns
       *    %d - Direct object, %i - Indirect object, %l - Location
       *
       *  @param template - Template string with substitution codes
       *  @param items - Array of items for the list
       *  @param options - { actor, article: 'the'|'a'|null, conjunction: 'and'|'or' }
       *  @returns Formatted string
       *
       *  @example compose('%T %v{fall} away.', ['pants']) -> 'The pants falls away.'
       *  @example compose('%T %v{fall} away.', ['shirt','pants']) -> 'The shirt and pants fall away.'
       *  @example compose('%N watches as %t %v{tumble} to the ground.', ['coins'], {actor})
       *           -> 'Bob watches as the coins tumble to the ground.'
       */
      const template = args[0] || '';
      const items = args[1] || [];
      const options = args[2] || {};

      if (!template) return '';

      const article = options.article !== undefined ? options.article : 'the';
      const conjunction = options.conjunction || 'and';
      const count = Array.isArray(items) ? items.length : 0;

      // Build the list string (without article)
      let listBase = '';
      if (count === 1) {
        listBase = items[0];
      } else if (count === 2) {
        listBase = items[0] + ' ' + conjunction + ' ' + items[1];
      } else if (count > 2) {
        const allButLast = items.slice(0, -1).join(', ');
        listBase = allButLast + ', ' + conjunction + ' ' + items[items.length - 1];
      }

      // Build list with article
      let listWithArticle = listBase;
      if (article && listBase) {
        listWithArticle = article + ' ' + listBase;
      }

      // Capitalize helper
      const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

      let result = template;

      // List substitutions - process BEFORE pronoun.sub to take precedence
      // %T = capitalized list with article ("The sword and shield")
      // %t = lowercase list with article ("the sword and shield")
      result = result.replace(/%T/g, cap(listWithArticle));
      result = result.replace(/%t/g, listWithArticle);

      // Verb conjugation: %v{base} - count-based, uses $.english.conjugate
      // Need to handle async conjugation with a workaround since replace is sync
      const verbMatches = [...result.matchAll(/%v\\{([^}]+)\\}/g)];
      for (const match of verbMatches) {
        const verb = match[1];
        const conjugated = count !== 1 ? verb : await $.english.conjugate(verb, 3);
        result = result.replace(match[0], conjugated);
      }

      // Delegate pronoun/name substitution to $.pronoun.sub
      // This handles %N, %n, %s, %o, %p, %r, %d, %i, %l (location)
      // Note: %t is shadowed by our list substitution above
      if ($.pronoun && $.pronoun.sub) {
        result = await $.pronoun.sub(result, options.actor, options.directObj, options.indirectObj, options.item);
      }

      return result;
    `);

    // Count-based verb conjugation (singular/plural)
    this.format.setMethod('verb', `
      /** Conjugate a verb based on count (singular/plural).
       *  Usage: $.format.verb(base, count)
       *  @param base - Base verb form (plural form, e.g., 'fall', 'are', 'have')
       *  @param count - Number of subjects
       *  @returns Conjugated verb ('falls' for count=1, 'fall' for count>1)
       *  @example verb('fall', 1) -> 'falls'
       *  @example verb('fall', 3) -> 'fall'
       *  @example verb('are', 1) -> 'is'
       *  @example verb('have', 1) -> 'has'
       */
      const base = args[0] || '';
      const count = args[1] ?? 1;

      // Plural (count != 1) uses base form
      if (count !== 1) return base;

      // Singular - delegate to $.english.conjugate for third person
      return await $.english.conjugate(base, 3);
    `);

    // Natural language list (prose style with Oxford comma)
    this.format.setMethod('prose', `
      /** Format items as a natural language list with Oxford comma.
       *  Usage: $.format.prose(items, conjunction?)
       *  @param items - Array of items
       *  @param conjunction - 'and' or 'or' (default: 'and')
       *  @returns String like "a, b, and c"
       *  @example prose(['sword']) -> 'sword'
       *  @example prose(['sword','shield']) -> 'sword and shield'
       *  @example prose(['sword','shield','dagger']) -> 'sword, shield, and dagger'
       *  @example prose(['red','blue'], 'or') -> 'red or blue'
       */
      const items = args[0] || [];
      const conjunction = args[1] || 'and';

      if (!Array.isArray(items) || items.length === 0) return '';
      if (items.length === 1) return items[0];
      if (items.length === 2) return items[0] + ' ' + conjunction + ' ' + items[1];

      // 3+ items: use Oxford comma
      const allButLast = items.slice(0, -1).join(', ');
      return allButLast + ', ' + conjunction + ' ' + items[items.length - 1];
    `);

    // Key-value pairs aligned
    this.format.setMethod('keyValue', `
      /** Format key-value pairs with aligned values.
       *  Usage: $.format.keyValue(pairs, options?)
       *  @param pairs - Object or array of [key, value] pairs
       *  @param options - { separator: string, indent: number }
       *  @returns Array of lines
       *  @example keyValue({Name:'Bob', HP:'100'}) -> ['Name: Bob', 'HP:   100']
       */
      const pairs = args[0] || {};
      const options = args[1] || {};

      const separator = options.separator !== undefined ? options.separator : ': ';
      const indent = options.indent || 0;
      const prefix = ' '.repeat(indent);

      // Convert to array of [key, value]
      let entries;
      if (Array.isArray(pairs)) {
        entries = pairs;
      } else {
        entries = Object.entries(pairs);
      }

      if (entries.length === 0) return [];

      // Find max key length
      const maxKeyLen = Math.max(...entries.map(([k]) => String(k).length));

      return entries.map(([key, value]) => {
        const paddedKey = String(key) + ' '.repeat(maxKeyLen - String(key).length);
        return prefix + paddedKey + separator + String(value);
      });
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.format) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'format', this.format.id);
    console.log(`Registered format alias -> #${this.format.id}`);
  }
}
