import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds English object (dynamic ID)
 * Handles common English text formatting patterns
 *
 * Usage from MOO code:
 *   $.english.list(['apple', 'banana', 'cherry']) -> "apple, banana, and cherry"
 *   $.english.count(5, 'bruise') -> "five bruises"
 *   $.english.article('apple') -> "an apple"
 *   $.english.plural(3, 'wolf') -> "wolves"
 *   $.english.ordinal(3) -> "third"
 */
export class EnglishBuilder {
  private english: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.english) {
      this.english = await this.manager.load(aliases.english);
      if (this.english) return; // Already exists
    }

    // Create new English
    this.english = await this.manager.create({
      parent: 1,
      properties: {
        name: 'English',
        description: 'English text formatting utilities',
        // Irregular plurals
        irregularPlurals: {
          'child': 'children',
          'person': 'people',
          'man': 'men',
          'woman': 'women',
          'tooth': 'teeth',
          'foot': 'feet',
          'goose': 'geese',
          'mouse': 'mice',
          'louse': 'lice',
          'ox': 'oxen',
          'knife': 'knives',
          'wife': 'knives',
          'life': 'lives',
          'wolf': 'wolves',
          'shelf': 'shelves',
          'leaf': 'leaves',
          'loaf': 'loaves',
          'half': 'halves',
          'calf': 'calves',
          'self': 'selves',
          'elf': 'elves',
          'thief': 'thieves',
          'deer': 'deer',
          'sheep': 'sheep',
          'fish': 'fish',
          'species': 'species',
          'series': 'series',
          'die': 'dice',
          'criterion': 'criteria',
          'phenomenon': 'phenomena',
          'index': 'indices',
          'appendix': 'appendices',
          'cactus': 'cacti',
          'fungus': 'fungi',
          'nucleus': 'nuclei',
          'stimulus': 'stimuli',
          'focus': 'foci',
          'thesis': 'theses',
          'crisis': 'crises',
          'analysis': 'analyses',
          'basis': 'bases',
        },
        // Number words (0-20)
        numberWords: [
          'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
          'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'
        ],
        // Ordinal words
        ordinalWords: [
          'zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
          'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth'
        ],
        // Irregular verb conjugations (base -> third person singular)
        irregularVerbs: {
          'be': 'is',
          'have': 'has',
          'do': 'does',
          'go': 'goes',
        },
        // Irregular past tense
        irregularPast: {
          'be': 'was',
          'have': 'had',
          'do': 'did',
          'go': 'went',
          'see': 'saw',
          'come': 'came',
          'get': 'got',
          'give': 'gave',
          'take': 'took',
          'make': 'made',
          'know': 'knew',
          'think': 'thought',
          'say': 'said',
          'tell': 'told',
          'find': 'found',
          'feel': 'felt',
          'put': 'put',
          'cut': 'cut',
          'run': 'ran',
          'sit': 'sat',
          'stand': 'stood',
          'hear': 'heard',
          'hold': 'held',
          'write': 'wrote',
          'read': 'read',
          'eat': 'ate',
          'drink': 'drank',
          'sleep': 'slept',
          'speak': 'spoke',
          'break': 'broke',
          'fall': 'fell',
          'hit': 'hit',
          'let': 'let',
          'begin': 'began',
          'keep': 'kept',
          'leave': 'left',
          'meet': 'met',
          'bring': 'brought',
          'buy': 'bought',
          'catch': 'caught',
          'teach': 'taught',
          'fight': 'fought',
          'throw': 'threw',
          'grow': 'grew',
          'draw': 'drew',
          'fly': 'flew',
          'blow': 'blew',
          'swim': 'swam',
          'sing': 'sang',
          'ring': 'rang',
          'win': 'won',
          'lose': 'lost',
          'send': 'sent',
          'spend': 'spent',
          'build': 'built',
          'lend': 'lent',
          'bend': 'bent',
          'lay': 'laid',
          'pay': 'paid',
          'lie': 'lay',
          'lead': 'led',
          'hide': 'hid',
          'bite': 'bit',
          'ride': 'rode',
          'drive': 'drove',
          'rise': 'rose',
          'wear': 'wore',
          'tear': 'tore',
          'wake': 'woke',
          'shake': 'shook',
          'forget': 'forgot',
          'choose': 'chose',
          'freeze': 'froze',
          'steal': 'stole',
        },
      },
      methods: {},
    });

    this.english.setMethod('list', `
      /** Join an array into an English list with Oxford comma.
       *  Usage: $.english.list(items, conjunction?)
       *  @param items - Array of strings to join
       *  @param conjunction - Optional, defaults to 'and'. Can be 'or', etc.
       *  @example list(['a', 'b', 'c']) -> "a, b, and c"
       *  @example list(['a', 'b']) -> "a and b"
       *  @example list(['x'], 'or') -> "x"
       */
      const items = args[0];
      const conjunction = args[1] || 'and'; // Allow 'or' etc.

      if (!Array.isArray(items) || items.length === 0) {
        return '';
      }
      if (items.length === 1) {
        return String(items[0]);
      }
      if (items.length === 2) {
        return items[0] + ' ' + conjunction + ' ' + items[1];
      }

      // Oxford comma: "a, b, and c"
      const last = items[items.length - 1];
      const rest = items.slice(0, -1);
      return rest.join(', ') + ', ' + conjunction + ' ' + last;
    `);

    // plural(n, word) -> pluralized word
    // plural(1, 'cat') -> "cat"
    // plural(3, 'wolf') -> "wolves"
    this.english.setMethod('plural', `
      const n = args[0];
      const word = args[1];

      if (!word) return '';
      if (n === 1) return word;

      const lower = word.toLowerCase();

      // Check irregular plurals
      const irregulars = self.irregularPlurals || {};
      if (irregulars[lower]) {
        // Preserve original case
        if (word[0] === word[0].toUpperCase()) {
          return irregulars[lower][0].toUpperCase() + irregulars[lower].slice(1);
        }
        return irregulars[lower];
      }

      // Regular pluralization rules
      // Words ending in s, ss, sh, ch, x, z -> add 'es'
      if (/(?:s|ss|sh|ch|x|z)$/.test(lower)) {
        return word + 'es';
      }

      // Words ending in consonant + y -> change y to ies
      if (/[^aeiou]y$/.test(lower)) {
        return word.slice(0, -1) + 'ies';
      }

      // Words ending in f or fe -> change to ves (if not in irregulars, use simple rule)
      if (/(?:f|fe)$/.test(lower)) {
        if (lower.endsWith('fe')) {
          return word.slice(0, -2) + 'ves';
        }
        return word.slice(0, -1) + 'ves';
      }

      // Words ending in o -> some take 'es', some take 's'
      // Common 'es' words: potato, tomato, hero, echo, torpedo, veto
      if (/[^aeiou]o$/.test(lower)) {
        const esWords = ['potato', 'tomato', 'hero', 'echo', 'torpedo', 'veto', 'embargo'];
        if (esWords.includes(lower)) {
          return word + 'es';
        }
      }

      // Default: add 's'
      return word + 's';
    `);

    // count(n, word, zeroWord?) -> "five bruises", "a bruise", "no bruises"
    // zeroWord defaults to 'no', but can be 'nothing', 'none', etc.
    // Supports %i for plural item in zeroWord: "empty of %i" -> "empty of items"
    // count(0, 'item') -> "no items"
    // count(0, 'item', 'nothing') -> "nothing"
    // count(0, 'coin', 'empty of %i') -> "empty of coins"
    this.english.setMethod('count', `
      const n = args[0];
      const word = args[1];
      const zeroWord = args[2]; // Optional custom zero word

      if (!word) return '';

      const numberWords = self.numberWords || [];
      const pluralized = n === 1 ? word : await self.plural(n, word);

      // Special cases
      if (n === 0) {
        // If custom zero word provided, use it with substitution
        if (zeroWord) {
          // %i = plural item name
          return zeroWord.replace(/%i/g, pluralized);
        }
        return 'no ' + pluralized;
      }
      if (n === 1) {
        // Use article instead of "one"
        return await self.article(word);
      }

      // Use word for small numbers, digits for larger
      if (n <= 20 && numberWords[n]) {
        return numberWords[n] + ' ' + pluralized;
      }

      return n + ' ' + pluralized;
    `);

    // article(word) -> "an apple", "a banana"
    this.english.setMethod('article', `
      const word = args[0];
      if (!word) return '';

      const lower = word.toLowerCase();

      // Words starting with vowel sound get "an"
      // Note: This is simplified - doesn't handle "hour", "honest", "unicorn", etc.
      if (/^[aeiou]/i.test(lower)) {
        // Exception: words starting with "u" that sound like "you" (uniform, unicorn, etc.)
        if (/^uni|^use|^uti/i.test(lower)) {
          return 'a ' + word;
        }
        return 'an ' + word;
      }

      // Exception: silent h words
      if (/^hour|^honest|^honor|^heir/i.test(lower)) {
        return 'an ' + word;
      }

      return 'a ' + word;
    `);

    // ordinal(n) -> "first", "second", "23rd"
    this.english.setMethod('ordinal', `
      const n = args[0];

      const ordinalWords = self.ordinalWords || [];

      // Use words for small numbers
      if (n >= 0 && n <= 20 && ordinalWords[n]) {
        return ordinalWords[n];
      }

      // For larger numbers, use suffix
      const lastTwo = n % 100;
      const lastOne = n % 10;

      let suffix;
      if (lastTwo >= 11 && lastTwo <= 13) {
        suffix = 'th';
      } else if (lastOne === 1) {
        suffix = 'st';
      } else if (lastOne === 2) {
        suffix = 'nd';
      } else if (lastOne === 3) {
        suffix = 'rd';
      } else {
        suffix = 'th';
      }

      return n + suffix;
    `);

    // possessive(name) -> "Bob's", "James'"
    this.english.setMethod('possessive', `
      const name = args[0];
      if (!name) return '';

      // Names ending in s get just apostrophe
      if (name.endsWith('s') || name.endsWith('S')) {
        return name + "'";
      }

      return name + "'s";
    `);

    // capitalize(str) -> "Hello world" (first letter only)
    this.english.setMethod('capitalize', `
      const str = args[0];
      if (!str) return '';
      return str[0].toUpperCase() + str.slice(1);
    `);

    // titleCase(str) -> "Hello World" (each word)
    this.english.setMethod('titleCase', `
      const str = args[0];
      if (!str) return '';

      // Words that shouldn't be capitalized in titles (unless first/last)
      const lowercase = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of', 'in'];

      const words = str.split(' ');
      return words.map((word, i) => {
        const lower = word.toLowerCase();
        // Always capitalize first and last word
        if (i === 0 || i === words.length - 1) {
          return word[0].toUpperCase() + word.slice(1).toLowerCase();
        }
        // Don't capitalize small words
        if (lowercase.includes(lower)) {
          return lower;
        }
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    `);

    // numberWord(n) -> "five", "twenty", or the number as string
    this.english.setMethod('numberWord', `
      const n = args[0];
      const numberWords = self.numberWords || [];

      if (n >= 0 && n <= 20 && numberWords[n]) {
        return numberWords[n];
      }

      return String(n);
    `);

    // conjugate(verb, person) -> conjugated verb
    // person: 1 = I/we, 2 = you, 3 = he/she/it/they(singular)
    // "walk", 3 -> "walks"
    // "kiss", 3 -> "kisses"
    // "be", 3 -> "is"
    this.english.setMethod('conjugate', `
      const verb = args[0];
      const person = args[1] || 3; // Default to third person

      if (!verb) return '';

      const lower = verb.toLowerCase();

      // First and second person use base form
      if (person === 1 || person === 2) {
        return verb;
      }

      // Third person singular
      // Check irregulars first
      const irregulars = self.irregularVerbs || {};
      if (irregulars[lower]) {
        // Preserve case
        if (verb[0] === verb[0].toUpperCase()) {
          return irregulars[lower][0].toUpperCase() + irregulars[lower].slice(1);
        }
        return irregulars[lower];
      }

      // Sibilants: s, ss, sh, ch, x, z -> add 'es'
      if (/(?:s|ss|sh|ch|x|z)$/.test(lower)) {
        return verb + 'es';
      }

      // Consonant + y -> change y to ies
      if (/[^aeiou]y$/.test(lower)) {
        return verb.slice(0, -1) + 'ies';
      }

      // Consonant + o -> add 'es' for common verbs
      if (/[^aeiou]o$/.test(lower)) {
        return verb + 'es';
      }

      // Default: add 's'
      return verb + 's';
    `);

    // pastTense(verb) -> past tense form
    // "walk" -> "walked"
    // "kiss" -> "kissed"
    // "be" -> "was"
    // "cry" -> "cried"
    this.english.setMethod('pastTense', `
      const verb = args[0];
      if (!verb) return '';

      const lower = verb.toLowerCase();

      // Check irregulars first
      const irregulars = self.irregularPast || {};
      if (irregulars[lower]) {
        // Preserve case
        if (verb[0] === verb[0].toUpperCase()) {
          return irregulars[lower][0].toUpperCase() + irregulars[lower].slice(1);
        }
        return irregulars[lower];
      }

      // Already ends in 'e' -> just add 'd'
      if (lower.endsWith('e')) {
        return verb + 'd';
      }

      // Consonant + y -> change y to ied
      if (/[^aeiou]y$/.test(lower)) {
        return verb.slice(0, -1) + 'ied';
      }

      // Single vowel + single consonant (not w, x, y) -> double consonant
      // e.g., "stop" -> "stopped", "hug" -> "hugged"
      if (/^[a-z]*[aeiou][bcdfghjklmnpqrstvz]$/i.test(lower)) {
        return verb + verb[verb.length - 1] + 'ed';
      }

      // Default: add 'ed'
      return verb + 'ed';
    `);

    // presentParticiple(verb) -> "-ing" form
    // "walk" -> "walking"
    // "run" -> "running"
    // "lie" -> "lying"
    this.english.setMethod('presentParticiple', `
      const verb = args[0];
      if (!verb) return '';

      const lower = verb.toLowerCase();

      // Special cases
      if (lower === 'be') return 'being';
      if (lower === 'lie') return 'lying';
      if (lower === 'die') return 'dying';
      if (lower === 'tie') return 'tying';

      // Ends in 'ie' -> change to 'ying'
      if (lower.endsWith('ie')) {
        return verb.slice(0, -2) + 'ying';
      }

      // Ends in 'e' (but not 'ee') -> drop 'e' and add 'ing'
      if (lower.endsWith('e') && !lower.endsWith('ee')) {
        return verb.slice(0, -1) + 'ing';
      }

      // Single vowel + single consonant (not w, x, y) -> double consonant
      if (/^[a-z]*[aeiou][bcdfghjklmnpqrstvz]$/i.test(lower)) {
        return verb + verb[verb.length - 1] + 'ing';
      }

      // Default: add 'ing'
      return verb + 'ing';
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.english) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.english = this.english.id;
    objectManager.set('aliases', aliases);

    console.log(`✅ Registered english alias -> #${this.english.id}`);
  }
}
