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

    this.english.setMethod('plural', `
      /** Pluralize a word based on count.
       *  Usage: $.english.plural(n, word)
       *  Handles irregular plurals (wolf->wolves, child->children).
       *  @param n - The count (1 returns singular, else plural)
       *  @param word - The word to pluralize
       *  @example plural(1, 'cat') -> "cat"
       *  @example plural(3, 'wolf') -> "wolves"
       *  @example plural(2, 'child') -> "children"
       */
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

    this.english.setMethod('count', `
      /** Count items with proper English phrasing.
       *  Usage: $.english.count(n, word, zeroWord?)
       *  Returns "a cat", "five cats", "no cats", etc.
       *  @param n - The count
       *  @param word - The item name (singular)
       *  @param zeroWord - Optional custom zero phrase. Use %i for plural item.
       *  @example count(1, 'cat') -> "a cat"
       *  @example count(5, 'bruise') -> "five bruises"
       *  @example count(0, 'item') -> "no items"
       *  @example count(0, 'coin', 'nothing') -> "nothing"
       *  @example count(0, 'wound', 'free of %i') -> "free of wounds"
       */
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

    this.english.setMethod('article', `
      /** Add indefinite article (a/an) to a word.
       *  Usage: $.english.article(word)
       *  @param word - The word to add an article to
       *  @example article('apple') -> "an apple"
       *  @example article('banana') -> "a banana"
       *  @example article('hour') -> "an hour"
       *  @example article('uniform') -> "a uniform"
       */
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

    this.english.setMethod('ordinal', `
      /** Convert a number to its ordinal form.
       *  Usage: $.english.ordinal(n)
       *  @param n - The number
       *  @example ordinal(1) -> "first"
       *  @example ordinal(3) -> "third"
       *  @example ordinal(23) -> "23rd"
       *  @example ordinal(11) -> "11th"
       */
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

    this.english.setMethod('possessive', `
      /** Make a name possessive.
       *  Usage: $.english.possessive(name)
       *  @param name - The name
       *  @example possessive('Bob') -> "Bob's"
       *  @example possessive('James') -> "James'"
       */
      const name = args[0];
      if (!name) return '';

      // Names ending in s get just apostrophe
      if (name.endsWith('s') || name.endsWith('S')) {
        return name + "'";
      }

      return name + "'s";
    `);

    this.english.setMethod('capitalize', `
      /** Capitalize the first letter of a string.
       *  Usage: $.english.capitalize(str)
       *  @param str - The string
       *  @example capitalize('hello world') -> "Hello world"
       */
      const str = args[0];
      if (!str) return '';
      return str[0].toUpperCase() + str.slice(1);
    `);

    this.english.setMethod('titleCase', `
      /** Convert a string to title case.
       *  Usage: $.english.titleCase(str)
       *  Small words (a, the, of, etc.) are not capitalized unless first/last.
       *  @param str - The string
       *  @example titleCase('the lord of the rings') -> "The Lord of the Rings"
       */
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

    this.english.setMethod('numberWord', `
      /** Convert a number to its word form (for 0-20).
       *  Usage: $.english.numberWord(n)
       *  @param n - The number
       *  @example numberWord(5) -> "five"
       *  @example numberWord(20) -> "twenty"
       *  @example numberWord(42) -> "42"
       */
      const n = args[0];
      const numberWords = self.numberWords || [];

      if (n >= 0 && n <= 20 && numberWords[n]) {
        return numberWords[n];
      }

      return String(n);
    `);

    this.english.setMethod('conjugate', `
      /** Conjugate a verb for a given person.
       *  Usage: $.english.conjugate(verb, person)
       *  @param verb - The base verb
       *  @param person - 1 (I/we), 2 (you), 3 (he/she/it). Default: 3
       *  @example conjugate('walk', 3) -> "walks"
       *  @example conjugate('kiss', 3) -> "kisses"
       *  @example conjugate('cry', 3) -> "cries"
       *  @example conjugate('be', 3) -> "is"
       *  @example conjugate('have', 3) -> "has"
       */
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

    this.english.setMethod('pastTense', `
      /** Convert a verb to its past tense form.
       *  Usage: $.english.pastTense(verb)
       *  Handles irregular verbs and regular -ed endings.
       *  @param verb - The base verb
       *  @example pastTense('walk') -> "walked"
       *  @example pastTense('kiss') -> "kissed"
       *  @example pastTense('cry') -> "cried"
       *  @example pastTense('stop') -> "stopped"
       *  @example pastTense('be') -> "was"
       *  @example pastTense('go') -> "went"
       */
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

    this.english.setMethod('presentParticiple', `
      /** Convert a verb to its present participle (-ing) form.
       *  Usage: $.english.presentParticiple(verb)
       *  Handles doubling consonants, dropping 'e', and special cases.
       *  @param verb - The base verb
       *  @example presentParticiple('walk') -> "walking"
       *  @example presentParticiple('run') -> "running"
       *  @example presentParticiple('make') -> "making"
       *  @example presentParticiple('lie') -> "lying"
       *  @example presentParticiple('be') -> "being"
       */
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

    // Scramble text to simulate hearing loss
    this.english.setMethod('scramble', `
      /** Scramble text to simulate hearing loss/degradation.
       *  Usage: $.english.scramble(text, amount)
       *  At 0%, text is unchanged. At 100%, text is completely garbled.
       *  Uses phonetically similar substitutions (b/p, m/n, s/sh, etc.)
       *  @param text - The text to scramble
       *  @param amount - 0-100, percentage of degradation
       *  @example scramble('Hello there', 0) -> "Hello there"
       *  @example scramble('Hello there', 50) -> "Heppo dere"
       *  @example scramble('Hello there', 100) -> "Kebbo beve"
       */
      const text = args[0];
      const amount = Math.max(0, Math.min(100, args[1] || 0));

      if (!text || amount === 0) return text;

      // Phonetically similar substitution pairs (confused when hearing is impaired)
      // These represent sounds that are commonly confused with hearing loss
      const confusions = {
        // Voiced/unvoiced pairs
        'b': 'p', 'p': 'b',
        'd': 't', 't': 'd',
        'g': 'k', 'k': 'g',
        'v': 'f', 'f': 'v',
        'z': 's', 's': 'z',
        // Nasal confusions
        'm': 'n', 'n': 'm',
        // Sibilant confusions
        'sh': 'ch', 'ch': 'sh',
        'th': 'd',
        // Liquid confusions
        'l': 'r', 'r': 'l',
        // High frequency sounds (lost first in hearing loss)
        's': 'th', 'f': 'th',
      };

      // Higher confusion rates for higher amounts
      const confusionRate = amount / 100;

      let result = '';
      let i = 0;

      while (i < text.length) {
        const char = text[i];
        const lower = char.toLowerCase();

        // Check for digraphs first (sh, ch, th)
        if (i < text.length - 1) {
          const digraph = text.slice(i, i + 2).toLowerCase();
          if (confusions[digraph] && Math.random() < confusionRate) {
            const replacement = confusions[digraph];
            // Preserve case of first letter
            if (char === char.toUpperCase()) {
              result += replacement[0].toUpperCase() + replacement.slice(1);
            } else {
              result += replacement;
            }
            i += 2;
            continue;
          }
        }

        // Single character confusion
        if (confusions[lower] && Math.random() < confusionRate) {
          const replacement = confusions[lower];
          // Preserve case
          if (char === char.toUpperCase()) {
            result += replacement.toUpperCase();
          } else {
            result += replacement;
          }
        } else {
          result += char;
        }
        i++;
      }

      // At very high amounts, also drop some words entirely
      if (amount > 80) {
        const dropRate = (amount - 80) / 100; // 0-20% word drop rate
        const words = result.split(' ');
        result = words
          .filter(() => Math.random() > dropRate)
          .join(' ');
      }

      return result || '...';
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
