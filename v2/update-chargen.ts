#!/usr/bin/env tsx
/**
 * Update CharGen object (#4) with full character creation methods
 * Ports the original CoffeeScript CharGen to TypeScript methods
 */

import { ObjectDatabase } from './src/database/object-db.js';
import { ObjectManager } from './src/database/object-manager.js';

// Character creation constants (from body.coffee)
const CONSTANTS = {
  ethnicity: ['Caucasian', 'Latino', 'French', 'Chinese', 'Japanese', 'Korean', 'Indian', 'Native American', 'German', 'Russian'],
  language: ['English', 'Spanish', 'French', 'Chinese', 'Japanese', 'Korean', 'Tagalog', 'MixMash', 'Hindi', 'Arabic', 'Portuguese', 'German', 'Russian'],
  hairCut: ['bald', 'balding', 'cropped', 'crew-cut', 'buzzed', 'flat-top', 'mohawk', 'bihawk', 'fauxhawk', 'devil lock', 'shaved', 'under-cut', 'faded', 'long', 'shoulder-length', 'layered', 'business', 'comb-over', 'plugged', 'uneven', 'bobed', 'pixied'],
  hairStyle: ['curly', 'pig-tails', 'pony-tails', 'straight', 'wavy', 'crimped', 'messy', 'permed', 'dreaded', 'unkempt', 'neat', 'tousled', 'greasy', 'gnarled', 'french-twisted', 'bun-curled', 'spikey', 'uncombed', 'lifeless', 'bouncy', 'sparkly'],
  hairColor: ['black', 'brown', 'light brown', 'dark brown', 'blonde', 'dirty blonde', 'strawberry blonde', 'auburn', 'red', 'ginger', 'blue', 'green', 'purple', 'pink', 'orange', 'burgundy', 'indigo', 'violet', 'gray', 'white', 'platinum', 'silver'],
  eyeColor: ['black', 'blue', 'red', 'green', 'emerald', 'hazel', 'brown', 'yellow', 'purple', 'violet', 'indigo', 'orange', 'pink'],
  eyeStyle: ['hooded', 'blood-shot', 'squinty', 'round', 'wide', 'big', 'small', 'slanty', 'scarred', 'swollen', 'puffy', 'dark-rimmed', 'bulging', 'shifty', 'doey', 'aggressive', 'submissive', 'assertive', 'defiant'],
  skinStyle: ['scarred', 'porcelain', 'flawless', 'smooth', 'rough', 'sickly', 'pasty', 'sweaty', 'smelly', 'flaking', 'calloused', 'tattooed', 'branded', 'soft', 'furry', 'hairy', 'hairless', 'bruised', 'vainy', 'acne-ridden', 'thin'],
  skinColor: ['albino', 'ivory', 'pale', 'white', 'tan', 'peach', 'olive', 'jaundiced', 'mocha', 'rosy', 'brown', 'dark', 'black', 'green', 'orange', 'grey', 'ashen', 'sun-burnt', 'red'],
  weight: ['emaciated', 'anorexic', 'starving', 'sickley', 'under-weight', 'skinny', 'thin', 'lean', 'fit', 'proportionate', 'of average weight', 'a little thick', 'big-boned', 'flabby', 'thick', 'over-weight', 'chubby', 'portly', 'fluffy', 'fat', 'obese', 'massive', 'a small planet'],
  height: ['non-existent', 'microscopic', 'itty-bitty', 'dwarf-sized', 'tiny', 'diminutive', 'petite', 'puny', 'very short', 'short', 'of average height', 'slightly tall', 'sizable', 'pretty tall', 'tall', 'very tall', 'extremely tall', 'incredibly tall', 'giant', 'sky-scraping'],
};

async function main() {
  console.log('📝 Updating CharGen object #4...\n');

  const db = new ObjectDatabase('mongodb://localhost:27017', 'malice');
  const manager = new ObjectManager(db);

  await db.connect();
  console.log('✅ Connected to MongoDB\n');

  // Load CharGen object
  const chargen = await manager.load(4);
  if (!chargen) {
    console.error('❌ CharGen object #4 not found! Run bootstrap first.');
    process.exit(1);
  }

  // Store constants as a property
  chargen.set('constants', CONSTANTS);

  // Update methods
  const methods = {
    // Main entry point for new user character creation
    onNewUser: `
      const context = args[0]; // ConnectionContext
      const username = args[1]; // Username

      // Store username on context for later use
      context.username = username;
      context.charData = {};

      context.send('\\r\\n=== Welcome to Malice Character Creation ===\\r\\n\\r\\n');
      context.send('WARNING: You must complete this process without disconnecting, otherwise you will have to start over.\\r\\n\\r\\n');

      // Start the character creation menu
      await self.call('startMenu', context);
    `,

    // Main menu loop
    startMenu: `
      const context = args[0];

      // Track what's been completed
      if (!context.charData.completed) {
        context.charData.completed = {};
      }

      const completed = context.charData.completed;
      const required = ['name', 'birthday', 'sex', 'ethnicity', 'stats', 'appearance', 'language'];
      const remaining = required.filter(r => !completed[r]);

      // Build menu options
      const options: Record<string, string> = {
        name: completed.name ? '✓ Name' : 'Name',
        birthday: completed.birthday ? '✓ Birthday' : 'Birthday',
        sex: completed.sex ? '✓ Sex' : 'Sex',
        ethnicity: completed.ethnicity ? '✓ Ethnicity' : 'Ethnicity',
        stats: completed.stats ? '✓ Height and Weight' : 'Height and Weight',
        appearance: completed.appearance ? '✓ Appearance' : 'Appearance',
        language: completed.language ? '✓ Native Language' : 'Native Language',
      };

      // Show progress
      if (Object.keys(completed).length > 0) {
        context.send('\\r\\n--- Current Progress ---\\r\\n');
        context.send(await self.call('formatProgress', context));
        context.send('\\r\\n');
      }

      // Show what's remaining
      if (remaining.length > 0) {
        context.send(\`Things you still must do: \${remaining.join(', ')}\\r\\n\\r\\n\`);
      } else {
        context.send('You\\'re all set! Select Finish to finalize your character.\\r\\n\\r\\n');
        options.finish = '>>> Finish <<<';
      }

      options.abort = 'Abort';

      // Present menu
      const choice = await context.choice('Character Creation Menu:', options);

      if (choice === 'abort') {
        context.send('Character creation aborted. Disconnecting...\\r\\n');
        context.close();
        return;
      }

      if (choice === 'finish') {
        await self.call('finishCharacter', context);
        return;
      }

      // Call the appropriate method
      try {
        await self.call(choice, context);
        completed[choice] = true;
      } catch (err: any) {
        context.send(\`Error: \${err.message}\\r\\n\`);
      }

      // Loop back to menu
      await self.call('startMenu', context);
    `,

    // Format current progress for display
    formatProgress: `
      const context = args[0];
      const data = context.charData;
      let result = '';

      if (data.name) {
        result += \`Alias: \${data.name.alias}\\r\\n\`;
        result += \`First Name: \${data.name.firstName}\\r\\n\`;
        result += \`Last Name: \${data.name.lastName}\\r\\n\`;
        if (data.name.middleName) {
          result += \`Middle Name: \${data.name.middleName}\\r\\n\`;
        }
      }

      if (data.sex) {
        result += \`Sex: \${data.sex}\\r\\n\`;
      }

      if (data.ethnicity) {
        result += \`Ethnicity: \${data.ethnicity}\\r\\n\`;
      }

      if (data.birthday) {
        result += \`Birthday: \${data.birthday}\\r\\n\`;
      }

      if (data.stats) {
        result += \`Height: \${data.stats.height} meters\\r\\n\`;
        result += \`Weight: \${data.stats.weight} kg\\r\\n\`;
      }

      if (data.appearance) {
        result += \`Eyes: \${data.appearance.eyeStyle} \${data.appearance.eyeColor} eyes\\r\\n\`;
        result += \`Hair: \${data.appearance.hairCut} \${data.appearance.hairColor} \${data.appearance.hairStyle}\\r\\n\`;
        result += \`Skin: \${data.appearance.skinStyle} \${data.appearance.skinColor}\\r\\n\`;
      }

      if (data.language) {
        result += \`Language: \${data.language}\\r\\n\`;
      }

      return result;
    `,

    // Name selection
    name: `
      const context = args[0];

      context.send('\\r\\n=== Character Name ===\\r\\n');
      context.send('What is your character\\'s most common name?\\r\\n');
      context.send('This can be their first name, last name, or a nick name.\\r\\n');
      context.send('You can also log in with this name, so make it easy to type.\\r\\n\\r\\n');

      const alias = await context.question('Alias: ', (input: string) => {
        if (input.length < 3) return 'It must be at least three letters long.';
        if (input.indexOf(' ') > -1) return 'It must be a single word.';
        if (!/^[a-zA-Z]*$/.test(input)) return 'User names cannot contain any non-alphabet characters.';
        // TODO: Check if name is taken
        return undefined;
      });

      const firstName = await context.question('First Name: ', (input: string) => {
        if (input.length < 2) return 'Please enter their first name from birth.';
        if (!/^[a-zA-Z]*$/.test(input)) return 'First names cannot contain any non-alphabet characters.';
        return undefined;
      });

      const lastName = await context.question('Last Name: ', (input: string) => {
        if (input.length < 2) return 'Please enter their last name from birth.';
        if (!/^[a-zA-Z]*$/.test(input)) return 'Last names cannot contain any non-alphabet characters.';
        return undefined;
      });

      const middleName = await context.question('Middle Name (optional): ', (input: string) => {
        if (input.length > 0 && !/^[a-zA-Z]*$/.test(input)) return 'Middle names cannot contain any non-alphabet characters.';
        return undefined;
      });

      context.charData.name = {
        alias,
        firstName,
        lastName,
        middleName: middleName || undefined,
      };

      context.send(\`\\r\\nName recorded: \${firstName} \${lastName} ("\${alias}")\\r\\n\`);
    `,

    // Birthday selection
    birthday: `
      const context = args[0];

      context.send('\\r\\n=== Birthday ===\\r\\n');
      context.send('The City of Malice exists in real-time, 85 years in the future, in the Pacific time zone.\\r\\n');
      context.send('Your character should be at least 18 years of age.\\r\\n\\r\\n');

      const birthday = await context.question('Enter birthday (MM/DD/YYYY): ', (input: string) => {
        // Basic date validation
        const match = input.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);
        if (!match) return 'Please enter a valid date in MM/DD/YYYY format.';

        const month = parseInt(match[1]);
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);

        if (month < 1 || month > 12) return 'Invalid month.';
        if (day < 1 || day > 31) return 'Invalid day.';

        const futureYear = new Date().getFullYear() + 85;
        const age = futureYear - year;

        if (age < 18) return 'Your character must be at least 18 years old.';
        if (age > 150) return 'Your character is too old!';

        return undefined;
      });

      context.charData.birthday = birthday;
      context.send(\`\\r\\nBirthday recorded: \${birthday}\\r\\n\`);
    `,

    // Sex selection
    sex: `
      const context = args[0];

      context.send('\\r\\n=== Sex ===\\r\\n');
      context.send('What is your character\\'s sex?\\r\\n');
      context.send('(We\\'re keeping it simple here, though we understand reality can be complex.)\\r\\n\\r\\n');

      const sex = await context.choice('Select sex:', {
        male: 'Male',
        female: 'Female',
      });

      context.charData.sex = sex === 'male' ? 'Male' : 'Female';
      context.send(\`\\r\\nSex recorded: \${context.charData.sex}\\r\\n\`);
    `,

    // Ethnicity selection
    ethnicity: `
      const context = args[0];
      const constants = self.constants;

      context.send('\\r\\n=== Ethnicity ===\\r\\n');

      const options: Record<string, string> = {};
      constants.ethnicity.forEach((e: string, idx: number) => {
        options[e.toLowerCase().replace(/\\s+/g, '_')] = e;
      });

      const choice = await context.choice('What is your ethnicity?', options);
      context.charData.ethnicity = options[choice];

      context.send(\`\\r\\nEthnicity recorded: \${context.charData.ethnicity}\\r\\n\`);
    `,

    // Language selection
    language: `
      const context = args[0];
      const constants = self.constants;

      context.send('\\r\\n=== Native Language ===\\r\\n');
      context.send('The game is in English, but your character may be a foreigner.\\r\\n');
      context.send('You can always learn new languages in the game.\\r\\n\\r\\n');

      const options: Record<string, string> = {};
      constants.language.forEach((lang: string, idx: number) => {
        options[lang.toLowerCase().replace(/\\s+/g, '_')] = lang;
      });

      const choice = await context.choice('What is your primary language?', options);
      context.charData.language = options[choice];

      context.send(\`\\r\\nLanguage recorded: \${context.charData.language}\\r\\n\`);
    `,

    // Height and weight
    stats: `
      const context = args[0];

      context.send('\\r\\n=== Physical Stats ===\\r\\n');
      context.send('In The City of Malice, appearances matter.\\r\\n');
      context.send('The average height is about 1.7 meters (5\\'7").\\r\\n');
      context.send('The average weight is about 75 kg (165 lbs).\\r\\n\\r\\n');

      const height = await context.question('Height in meters (0.5 - 3.0): ', (input: string) => {
        const h = parseFloat(input);
        if (isNaN(h) || h < 0.5 || h > 3.0) return 'Please enter a number between 0.5 and 3.0';
        return undefined;
      });

      const weight = await context.question('Weight in kg (15 - 300): ', (input: string) => {
        const w = parseInt(input);
        if (isNaN(w) || w < 15 || w > 300) return 'Please enter a number between 15 and 300';
        return undefined;
      });

      context.charData.stats = {
        height: parseFloat(height),
        weight: parseInt(weight),
      };

      context.send(\`\\r\\nStats recorded: \${height}m, \${weight}kg\\r\\n\`);
    `,

    // Appearance selection
    appearance: `
      const context = args[0];
      const constants = self.constants;

      context.send('\\r\\n=== Appearance ===\\r\\n');

      // Hair cut
      const hairCutOptions: Record<string, string> = {};
      constants.hairCut.forEach((h: string) => {
        hairCutOptions[h.replace(/\\s+/g, '_')] = h;
      });
      const hairCutChoice = await context.choice('What would you like your hair cut to be?', hairCutOptions);
      const hairCut = hairCutOptions[hairCutChoice];

      // Hair style
      const hairStyleOptions: Record<string, string> = {};
      constants.hairStyle.forEach((h: string) => {
        hairStyleOptions[h.replace(/\\s+/g, '_')] = h;
      });
      const hairStyleChoice = await context.choice(\`And the hair style to go with your \${hairCut} hair?\`, hairStyleOptions);
      const hairStyle = hairStyleOptions[hairStyleChoice];

      // Hair color
      const hairColorOptions: Record<string, string> = {};
      constants.hairColor.forEach((h: string) => {
        hairColorOptions[h.replace(/\\s+/g, '_')] = h;
      });
      const hairColorChoice = await context.choice(\`And the hair color of your \${hairCut} \${hairStyle} hair?\`, hairColorOptions);
      const hairColor = hairColorOptions[hairColorChoice];

      // Eye color
      const eyeColorOptions: Record<string, string> = {};
      constants.eyeColor.forEach((e: string) => {
        eyeColorOptions[e.replace(/\\s+/g, '_')] = e;
      });
      const eyeColorChoice = await context.choice('What is your eye color?', eyeColorOptions);
      const eyeColor = eyeColorOptions[eyeColorChoice];

      // Eye style
      const eyeStyleOptions: Record<string, string> = {};
      constants.eyeStyle.forEach((e: string) => {
        eyeStyleOptions[e.replace(/\\s+/g, '_')] = e;
      });
      const eyeStyleChoice = await context.choice(\`And the eye style of these \${eyeColor} eyes?\`, eyeStyleOptions);
      const eyeStyle = eyeStyleOptions[eyeStyleChoice];

      // Skin style
      const skinStyleOptions: Record<string, string> = {};
      constants.skinStyle.forEach((s: string) => {
        skinStyleOptions[s.replace(/\\s+/g, '_')] = s;
      });
      const skinStyleChoice = await context.choice('How would you describe your skin?', skinStyleOptions);
      const skinStyle = skinStyleOptions[skinStyleChoice];

      // Skin color
      const skinColorOptions: Record<string, string> = {};
      constants.skinColor.forEach((s: string) => {
        skinColorOptions[s.replace(/\\s+/g, '_')] = s;
      });
      const skinColorChoice = await context.choice(\`And what's the skin color of your \${skinStyle}?\`, skinColorOptions);
      const skinColor = skinColorOptions[skinColorChoice];

      context.charData.appearance = {
        hairCut,
        hairStyle,
        hairColor,
        eyeColor,
        eyeStyle,
        skinStyle,
        skinColor,
      };

      context.send('\\r\\nAppearance recorded!\\r\\n');
    `,

    // Finish character creation
    finishCharacter: `
      const context = args[0];

      context.send('\\r\\n=== Final Review ===\\r\\n');
      context.send('This is how your character is going to start:\\r\\n\\r\\n');
      context.send(await self.call('formatProgress', context));
      context.send('\\r\\nThis is your last chance to say no and make changes.\\r\\n');

      const confirm = await context.yesorno('Continue with creating your character?');

      if (!confirm) {
        context.send('\\r\\nReturning to menu...\\r\\n');
        await self.call('startMenu', context);
        return;
      }

      // Create the player object
      context.send('\\r\\nDesigning bio-specification for clone job...\\r\\n');
      context.send('Please wait...\\r\\n\\r\\n');

      // Create user object
      const user = await context.$.create({
        parent: 1,
        properties: {
          username: context.username,
          alias: context.charData.name.alias,
          firstName: context.charData.name.firstName,
          lastName: context.charData.name.lastName,
          middleName: context.charData.name.middleName,
          sex: context.charData.sex,
          ethnicity: context.charData.ethnicity,
          birthday: context.charData.birthday,
          language: context.charData.language,
          height: context.charData.stats.height,
          weight: context.charData.stats.weight,
          appearance: context.charData.appearance,
          hp: 100,
          maxHp: 100,
          location: 0,
        },
      });

      context.send(\`Character created! You are #\${user.id}\\r\\n\`);
      context.authenticate(user.id);

      // TODO: Hand off to game loop
      context.send('\\r\\nWelcome to The City of Malice!\\r\\n');
      context.send('Type commands here...\\r\\n');
    `,
  };

  // Update all methods at once
  const currentMethods = chargen.getOwnMethods();
  for (const [name, code] of Object.entries(methods)) {
    currentMethods[name] = code;
  }

  // Update the object once with all methods
  await manager.update(4, { methods: currentMethods });

  // Reload chargen to set constants
  const reloadedChargen = await manager.load(4);
  if (reloadedChargen) {
    reloadedChargen.set('constants', CONSTANTS);
    await reloadedChargen.save();
  }

  await db.disconnect();
  console.log('✅ CharGen object #4 updated successfully!');
  console.log('\n📝 Added methods:');
  console.log('  - onNewUser: Main entry point');
  console.log('  - startMenu: Character creation menu loop');
  console.log('  - formatProgress: Display current progress');
  console.log('  - name: Name selection with validation');
  console.log('  - birthday: Birthday selection with age validation');
  console.log('  - sex: Male/Female selection');
  console.log('  - ethnicity: Ethnicity selection');
  console.log('  - language: Native language selection');
  console.log('  - stats: Height and weight');
  console.log('  - appearance: Hair, eyes, skin customization');
  console.log('  - finishCharacter: Final review and character creation');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed to update CharGen:', err);
  process.exit(1);
});
