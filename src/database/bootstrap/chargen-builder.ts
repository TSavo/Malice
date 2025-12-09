import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Stat allocation costs for chargen
 * Single parts cost 1 point, paired parts cost 2 points
 * Each point adds to maxCalories on the body part(s)
 */
export const STAT_COSTS = {
  head: 1, // Head/brain capacity
  torso: 1, // Core/torso capacity
  arms: 2, // Both arms
  hands: 2, // Both hands
  legs: 2, // Both legs
  feet: 2, // Both feet
  eyes: 2, // Both eyes
  ears: 2, // Both ears
} as const;

/**
 * How much maxCalories each point adds
 */
export const CALORIES_PER_POINT = 10;

/**
 * Starting stat points for new characters
 */
export const STARTING_STAT_POINTS = 20;

/**
 * Builds CharGen object (dynamic ID)
 * Handles character creation with interactive prompts
 */
export class CharGenBuilder {
  private charGen: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.charGen) {
      this.charGen = await this.manager.load(aliases.charGen);
      if (this.charGen) return; // Already exists
    }

    // Create new CharGen
    this.charGen = await this.manager.create({
      parent: 1,
      properties: {
        name: 'CharGen',
        description: 'Character creation system',
      },
      methods: {},
    });

    // Main entry point for new users
    this.charGen.setMethod('onNewUser', `
      const context = args[0];
      const username = args[1];
      const password = args[2];

      // Pre-player messages go through context directly (no player yet)
      // Send welcome BEFORE async chargen starts to avoid race conditions
      context.send('\\r\\n');
      context.send('╔══════════════════════════════════════════════════════════╗\\r\\n');
      context.send('║               ✦ Welcome to MALICE ✦                      ║\\r\\n');
      context.send('╠══════════════════════════════════════════════════════════╣\\r\\n');
      context.send('║                                                          ║\\r\\n');
      context.send('║  You stand at the threshold of a dark and dangerous      ║\\r\\n');
      context.send('║  world. Before you can enter, you must give form to      ║\\r\\n');
      context.send('║  your vessel.                                            ║\\r\\n');
      context.send('║                                                          ║\\r\\n');
      context.send('║  Take your time. Choose wisely.                          ║\\r\\n');
      context.send('║  Your choices here will shape your destiny.              ║\\r\\n');
      context.send('║                                                          ║\\r\\n');
      context.send('╚══════════════════════════════════════════════════════════╝\\r\\n');
      context.send('\\r\\n');
      context.send('⚠  Warning: You must complete this process without disconnecting.\\r\\n');
      context.send('\\r\\n');

      // Hash password
      const passwordHash = await $.hashPassword(password);

      // Get prototypes via alias
      const objectManager = await $.load(0);
      const aliases = objectManager.get('aliases') || {};
      const playerPrototypeId = aliases.player;
      const adminPrototypeId = aliases.admin;

      // Check if this is the first player (admin user)
      const existingPlayers = await $.countPlayers();
      const isFirstPlayer = existingPlayers === 0;

      // First player uses Admin prototype, others use Player
      const prototypeId = isFirstPlayer ? adminPrototypeId : playerPrototypeId;

      // Get recycler for object creation
      const recycler = await $.recycler;
      if (!recycler) {
        throw new Error('Recycler not available');
      }

      // Create Player object with minimal defaults first
      const player = await recycler.create({
        parent: prototypeId,
        properties: {
          name: username,
          description: 'A new adventurer',
          aliases: [username.toLowerCase()],
          location: 0,
          inventory: [],
          playername: username.toLowerCase(),
          email: '',
          passwordHash: passwordHash,
          canUseDevTools: isFirstPlayer,
          isWizard: isFirstPlayer,
          isSuspended: false,
          createdAt: new Date(),
          lastLogin: new Date(),
          totalPlaytime: 0,
          title: isFirstPlayer ? 'the Administrator' : 'the Newbie',
          statPointsRemaining: 20,
        },
      }, null);

      // Store context on player so tell() works
      player._context = context;

      // Authenticate early so $.prompt works
      context.authenticate(player.id);

      // Set player as handler so input routes to player.onInput -> $.prompt.handleInput
      context.setHandler(player);

      // Now run interactive chargen
      await $.charGen.runCharGen(player, isFirstPlayer);
    `);

    // Interactive character generation flow
    this.charGen.setMethod('runCharGen', `
      const player = args[0];
      const isFirstPlayer = args[1];
      const format = $.format;

      // Helper to show section header (inline, no extra tells before prompt)
      const showSection = (step, total, title) => {
        const filled = '█'.repeat(Math.round((step / total) * 15));
        const empty = '░'.repeat(15 - filled.length);
        return '[ Step ' + step + '/' + total + ' ' + filled + empty + ' ] ' + title;
      };

      // === STEP 1: NAME ===
      // Go straight to the first prompt - welcome was shown in onNewUser
      const alias = await $.prompt.question(player, showSection(1, 6, 'IDENTITY') + '\\r\\n  Your name is how others will know you.\\r\\n  What name do you go by? ');
      player.set('name', alias);
      player.set('aliases', [alias.toLowerCase()]);

      // === SEX ===
      const sex = await $.prompt.choice(player, '  What is your sex?', {
        male: 'Male',
        female: 'Female',
        nonbinary: 'Non-binary',
      });

      const pronouns = sex === 'male'
        ? { subject: 'he', object: 'him', possessive: 'his' }
        : sex === 'female'
        ? { subject: 'she', object: 'her', possessive: 'her' }
        : { subject: 'they', object: 'them', possessive: 'their' };

      player.set('sex', sex);
      player.set('pronouns', pronouns);

      // === STEP 2: PHYSICAL ===
      let age = null;
      while (!age) {
        const ageInput = await $.prompt.question(player, showSection(2, 6, 'PHYSICAL') + '\\r\\n  How old are you? (18-100) ');
        const parsed = parseInt(ageInput, 10);
        if (isNaN(parsed) || parsed < 18 || parsed > 100) {
          await player.tell('  ⚠ Please enter a valid age between 18 and 100.');
        } else {
          age = parsed;
        }
      }
      player.set('age', age);

      // HEIGHT
      let height = null;
      while (!height) {
        const heightInput = await $.prompt.question(player, '  How tall are you in meters? (1.0 - 2.5) ');
        const parsed = parseFloat(heightInput);
        if (isNaN(parsed) || parsed < 1.0 || parsed > 2.5) {
          await player.tell('  ⚠ Please enter a valid height between 1.0 and 2.5 meters.');
        } else {
          height = Math.round(parsed * 100) / 100;
        }
      }
      player.set('height', height);

      // WEIGHT
      let weight = null;
      while (!weight) {
        const weightInput = await $.prompt.question(player, '  Weight in kilograms? (30 - 200) ');
        const parsed = parseInt(weightInput, 10);
        if (isNaN(parsed) || parsed < 30 || parsed > 200) {
          await player.tell('  ⚠ Please enter a valid weight between 30 and 200 kg.');
        } else {
          weight = parsed;
        }
      }
      player.set('weight', weight);

      // === STEP 3: EYES ===
      const eyeColors = {
        brown: 'Brown', darkBrown: 'Dark Brown', lightBrown: 'Light Brown',
        amber: 'Amber', hazel: 'Hazel', green: 'Green', emerald: 'Emerald',
        blue: 'Blue', skyBlue: 'Sky Blue', steelBlue: 'Steel Blue',
        gray: 'Gray', blueGray: 'Blue-Gray', violet: 'Violet', black: 'Black',
        heterochromia: 'Heterochromia (mixed)',
      };

      let eyeColor = await $.prompt.menu(player, showSection(3, 6, 'EYES') + '\\r\\n  What color are your eyes?', eyeColors, 3);

      // Handle heterochromia - need two different colors
      let leftEyeColor = eyeColor;
      let rightEyeColor = eyeColor;

      if (eyeColor === 'heterochromia') {
        const singleEyeColors = { ...eyeColors };
        delete singleEyeColors.heterochromia;
        leftEyeColor = await $.prompt.menu(player, '  ✦ Heterochromia! Left eye color?', singleEyeColors, 3);
        rightEyeColor = await $.prompt.menu(player, '  Right eye color?', singleEyeColors, 3);
        eyeColor = leftEyeColor + '/' + rightEyeColor;
      }

      // Eye shapes
      const eyeStyles = {
        almond: 'Almond', round: 'Round', hooded: 'Hooded', monolid: 'Monolid',
        upturned: 'Upturned', downturned: 'Downturned', deepSet: 'Deep-set',
        prominent: 'Prominent', closeset: 'Close-set', wideset: 'Wide-set',
      };
      const eyeStyle = await $.prompt.menu(player, '  What shape are your eyes?', eyeStyles, 2);

      // === STEP 4: HAIR ===
      const hairColors = {
        black: 'Black', jetBlack: 'Jet Black', darkBrown: 'Dark Brown', brown: 'Brown',
        chestnut: 'Chestnut', auburn: 'Auburn', red: 'Red', ginger: 'Ginger',
        strawberry: 'Strawberry Blonde', copper: 'Copper', blonde: 'Blonde',
        golden: 'Golden Blonde', platinum: 'Platinum', sandy: 'Sandy Blonde',
        ashBlonde: 'Ash Blonde', gray: 'Gray', silver: 'Silver', white: 'White',
        salt: 'Salt & Pepper', purple: 'Purple', violet: 'Violet', blue: 'Blue',
        teal: 'Teal', green: 'Green', pink: 'Pink', hotPink: 'Hot Pink',
        rose: 'Rose Gold', orange: 'Orange', multicolor: 'Multicolored',
      };
      const hairColor = await $.prompt.menu(player, showSection(4, 6, 'HAIR') + '\\r\\n  What color is your hair?', hairColors, 3);

      // Hair styles
      const hairStyles = {
        straight: 'Straight', wavy: 'Wavy', curly: 'Curly', coily: 'Coily/Kinky',
        bald: 'Bald', shaved: 'Shaved', buzzcut: 'Buzz Cut', cropped: 'Cropped Short',
        shoulderLength: 'Shoulder Length', long: 'Long', veryLong: 'Very Long',
      };
      const hairStyle = await $.prompt.menu(player, '  What style is your hair?', hairStyles, 2);

      // Hair texture
      const hairTextures = { fine: 'Fine', medium: 'Medium', thick: 'Thick', coarse: 'Coarse', silky: 'Silky', wiry: 'Wiry' };
      const hairTexture = await $.prompt.menu(player, '  What texture is your hair?', hairTextures, 3);

      // === STEP 5: SKIN & BUILD ===
      const skinTones = {
        porcelain: 'Porcelain', ivory: 'Ivory', pale: 'Pale', fair: 'Fair',
        light: 'Light', cream: 'Cream', peach: 'Peach', beige: 'Beige',
        sand: 'Sand', medium: 'Medium', olive: 'Olive', golden: 'Golden',
        tan: 'Tan', caramel: 'Caramel', honey: 'Honey', bronze: 'Bronze',
        almond: 'Almond', chestnutSkin: 'Chestnut', brown: 'Brown', umber: 'Umber',
        espresso: 'Espresso', mahogany: 'Mahogany', ebony: 'Ebony', obsidian: 'Obsidian',
      };
      const skinTone = await $.prompt.menu(player, showSection(5, 6, 'SKIN & BUILD') + '\\r\\n  What is your skin tone?', skinTones, 3);

      // Build/body type
      const buildTypes = {
        petite: 'Petite', slim: 'Slim', lean: 'Lean', athletic: 'Athletic',
        average: 'Average', toned: 'Toned', muscular: 'Muscular', stocky: 'Stocky',
        heavyset: 'Heavyset', curvy: 'Curvy', broad: 'Broad-shouldered', lanky: 'Lanky',
      };
      const buildType = await $.prompt.menu(player, '  What is your build?', buildTypes, 3);

      // === STEP 6: FACE & FEATURES ===
      const faceShapes = {
        oval: 'Oval', round: 'Round', square: 'Square', rectangular: 'Rectangular',
        heart: 'Heart', diamond: 'Diamond', oblong: 'Oblong', triangular: 'Triangular',
      };
      const faceShape = await $.prompt.menu(player, showSection(6, 6, 'FACE') + '\\r\\n  What is your face shape?', faceShapes, 2);

      // Nose shape
      const noseShapes = {
        straight: 'Straight', roman: 'Roman/Aquiline', button: 'Button', upturned: 'Upturned',
        hawk: 'Hawk', wide: 'Wide', narrow: 'Narrow', flat: 'Flat', bulbous: 'Bulbous', snub: 'Snub',
      };
      const noseShape = await $.prompt.menu(player, '  What shape is your nose?', noseShapes, 2);

      // Lip shape
      const lipShapes = {
        full: 'Full', thin: 'Thin', medium: 'Medium', bowShaped: 'Bow-shaped',
        wide: 'Wide', narrow: 'Narrow', hearted: 'Heart-shaped', pouty: 'Pouty',
      };
      const lipShape = await $.prompt.menu(player, '  What shape are your lips?', lipShapes, 2);

      // Distinguishing features
      const freckleOptions = { none: 'None', light: 'Light freckling', moderate: 'Moderate freckling', heavy: 'Heavy freckling' };
      const freckles = await $.prompt.menu(player, '  Freckles?', freckleOptions, 2);

      const markOptions = {
        none: 'None', dimplesCheeks: 'Dimples (cheeks)', dimpleChin: 'Dimple (chin)',
        moleLeft: 'Beauty mark (left)', moleRight: 'Beauty mark (right)', birthmark: 'Birthmark', cleftChin: 'Cleft chin',
      };
      const distinguishingMark = await $.prompt.menu(player, '  Any distinguishing marks?', markOptions, 2);

      // Facial hair (offer to all, some may choose none)
      const facialHairOptions = {
        none: 'None/Clean-shaven', stubble: 'Stubble', lightBeard: 'Light beard', fullBeard: 'Full beard',
        longBeard: 'Long beard', goatee: 'Goatee', vandyke: 'Van Dyke', mustache: 'Mustache',
        handlebars: 'Handlebar mustache', soulPatch: 'Soul patch', sideburns: 'Sideburns', mutton: 'Mutton chops',
      };
      const facialHair = await $.prompt.menu(player, '  Facial hair?', facialHairOptions, 3);

      // Store appearance for body creation
      const appearance = {
        eyeColor: eyeColor,
        leftEyeColor: leftEyeColor,
        rightEyeColor: rightEyeColor,
        eyeStyle: eyeStyle,
        hairColor: hairColor,
        hairStyle: hairStyle,
        hairTexture: hairTexture,
        skinTone: skinTone,
        buildType: buildType,
        faceShape: faceShape,
        noseShape: noseShape,
        lipShape: lipShape,
        freckles: freckles,
        distinguishingMark: distinguishingMark,
        facialHair: facialHair,
      };

      // === CREATE BODY ===
      await player.tell('');
      await player.tell('╔══════════════════════════════════════════════════════════╗');
      await player.tell('║               ✦ MANIFESTING YOUR FORM ✦                  ║');
      await player.tell('╚══════════════════════════════════════════════════════════╝');
      await player.tell('');
      await player.tell('  The ritual begins...');
      await player.tell('  ' + await format.bar(1, 4, 30, { filled: '▓', empty: '░' }));
      await player.tell('  Weaving flesh and bone...');

      const bodyFactory = await $.bodyFactory;
      const body = await bodyFactory.createHumanBody(player.id, sex, appearance);
      player.set('body', body.id);

      await player.tell('  ' + await format.bar(4, 4, 30, { filled: '▓', empty: '░' }));
      await player.tell('  ✓ Your body has been formed!');
      await player.tell('');

      // === CONFIRMATION ===
      const charBox = await format.box([
        '✦ CHARACTER PREVIEW ✦',
        '',
        'Review your creation before it is finalized.',
        'You may start over if anything is not to your liking.',
      ], { style: 'heavy', padding: 1 });
      for (const line of charBox) {
        await player.tell(line);
      }
      await player.tell('');

      // Format eye color display (handle heterochromia)
      let eyeColorDisplay;
      if (leftEyeColor !== rightEyeColor) {
        eyeColorDisplay = 'Left: ' + eyeColors[leftEyeColor] + ', Right: ' + eyeColors[rightEyeColor];
      } else {
        eyeColorDisplay = eyeColors[leftEyeColor];
      }

      // Format features for display
      let featuresDisplay = [];
      if (freckles !== 'none') featuresDisplay.push(freckleOptions[freckles]);
      if (distinguishingMark !== 'none') featuresDisplay.push(markOptions[distinguishingMark]);
      if (facialHair !== 'none') featuresDisplay.push(facialHairOptions[facialHair]);
      const featuresStr = featuresDisplay.length > 0 ? featuresDisplay.join(', ') : 'None';

      const summary = await format.keyValue({
        'Name': player.name,
        'Sex': sex + ' (' + pronouns.subject + '/' + pronouns.object + ')',
        'Age': age,
        'Height': height + 'm',
        'Weight': weight + 'kg',
        'Build': buildTypes[buildType],
        'Face': faceShapes[faceShape] + ', ' + noseShapes[noseShape] + ' nose, ' + lipShapes[lipShape] + ' lips',
        'Eyes': eyeColorDisplay + ', ' + eyeStyles[eyeStyle],
        'Hair': hairColors[hairColor] + ' ' + hairStyles[hairStyle] + ' (' + hairTextures[hairTexture] + ')',
        'Skin': skinTones[skinTone],
        'Features': featuresStr,
      });

      for (const line of summary) {
        await player.tell(line);
      }
      await player.tell('');

      const confirmed = await $.prompt.yesorno(player, 'Is this correct?');
      if (!confirmed) {
        await player.tell('Starting over...');
        await player.tell('');
        // Delete the body we just created
        const recycler = await $.recycler;
        if (recycler && body) {
          await recycler.recycleTree(body.id);
        }
        player.set('body', null);
        // Recursive call to restart
        return await $.charGen.runCharGen(player, isFirstPlayer);
      }

      // === ADMIN MESSAGE ===
      if (isFirstPlayer) {
        await player.tell('');
        const adminBox = await format.box([
          'YOU ARE THE FIRST USER - ADMIN PRIVILEGES GRANTED',
          '',
          'You have been granted wizard status and DevTools access.',
          'Use these powers wisely to build your world!',
        ], { style: 'double', padding: 1 });
        for (const line of adminBox) {
          await player.tell(line);
        }
      }

      // === STAT ALLOCATION ===
      await player.tell('');
      const statBox = await format.box([
        '✦ STAT ALLOCATION ✦',
        '',
        'Now strengthen your body! You have 20 points to spend.',
        '',
        '  • Single parts (head, torso): 1 point each',
        '  • Paired parts (arms, legs, etc): 2 points each',
        '',
        'Higher capacity means more endurance and resilience.',
      ], { style: 'single', padding: 1 });
      for (const line of statBox) {
        await player.tell(line);
      }
      await player.tell('');

      await $.charGen.runStatAllocation(player);

      // === FINAL CONFIRMATION ===
      await player.tell('');
      await player.tell('╔══════════════════════════════════════════════════════════╗');
      await player.tell('║              ✦ FINAL CHARACTER SUMMARY ✦                 ║');
      await player.tell('╠══════════════════════════════════════════════════════════╣');

      // Show character info in a nice format
      const summaryData = {
        'Name': player.name,
        'Sex': player.sex + ' (' + player.pronouns.subject + '/' + player.pronouns.object + ')',
        'Age': player.age + ' years',
        'Height': player.height + 'm',
        'Weight': player.weight + 'kg',
      };

      const finalSummaryLines = await format.keyValue(summaryData);
      for (const line of finalSummaryLines) {
        await player.tell('║  ' + line.padEnd(54) + '  ║');
      }

      // Show appearance from body
      const playerBody = await player.getBody();
      if (playerBody) {
        await player.tell('╟──────────────────────────────────────────────────────────╢');
        const head = await playerBody.getPart('head');
        if (head) {
          const scalp = await head.getPart('scalp');
          const face = await head.getPart('face');
          if (scalp) {
            const hairLine = 'Hair: ' + (scalp.hairColor || 'brown') + ' ' + (scalp.hairStyle || 'straight');
            await player.tell('║  ' + hairLine.padEnd(54) + '  ║');
          }
          if (face) {
            const eye = await face.getPart('rightEye');
            if (eye) {
              const eyeLine = 'Eyes: ' + (eye.color || 'brown') + ', ' + (eye.shape || 'almond');
              await player.tell('║  ' + eyeLine.padEnd(54) + '  ║');
            }
          }
        }
        const skinLine = 'Skin: ' + (playerBody.skinTone || 'medium');
        await player.tell('║  ' + skinLine.padEnd(54) + '  ║');
      }
      await player.tell('╚══════════════════════════════════════════════════════════╝');
      await player.tell('');

      const finalConfirm = await $.prompt.yesorno(player, '  Create this character and enter the game?');
      if (!finalConfirm) {
        await player.tell('');
        await player.tell('  ↻ Starting over from the beginning...');
        await player.tell('');

        // Delete old body and all its parts
        const oldBody = await player.getBody();
        if (oldBody) {
          const recycler = await $.recycler;
          if (recycler) {
            await recycler.recycleTree(oldBody.id);
          }
          player.set('body', null);
        }

        // Reset stat points
        player.set('statPointsRemaining', 20);
        return await $.charGen.runCharGen(player, isFirstPlayer);
      }

      // === DONE ===
      await player.tell('');
      const welcomeBox2 = await format.box([
        '✦ CHARACTER CREATED SUCCESSFULLY! ✦',
        '',
        'Welcome to MALICE, ' + player.name + '!',
        '',
        'You are now Player #' + player.id,
        '',
        'Type "help" for a list of commands.',
        'Type "look" to see your surroundings.',
        'Type "quit" to leave the game.',
      ], { style: 'double', padding: 1 });
      for (const line of welcomeBox2) {
        await player.tell(line);
      }
      await player.tell('');

      // Connect player to the game
      await player.connect(player._context);
    `);

    // Method to allocate a stat point - increases maxCalories on body parts
    this.charGen.setMethod('allocateStat', `
      const player = args[0];
      const statName = args[1];

      const costs = {
        head: 1,
        torso: 1,
        arms: 2,
        hands: 2,
        legs: 2,
        feet: 2,
        eyes: 2,
        ears: 2,
      };

      const CALORIES_PER_POINT = 10;

      const cost = costs[statName];
      if (!cost) {
        return { error: 'Unknown stat: ' + statName };
      }

      const remaining = player.statPointsRemaining || 0;
      if (remaining < cost) {
        return { error: 'Not enough points. Need ' + cost + ', have ' + remaining };
      }

      // Deduct points
      player.set('statPointsRemaining', remaining - cost);

      // Get body
      const body = await player.getBody();
      if (!body) {
        return { error: 'You have no body!' };
      }

      // Helper to increase maxCalories on a part
      const boostPart = (part) => {
        if (part) {
          const current = part.maxCalories || 100;
          part.set('maxCalories', current + CALORIES_PER_POINT);
          // Also set current calories to match (start fully rested)
          part.set('calories', part.maxCalories);
        }
      };

      // Apply calories boost based on body part
      switch (statName) {
        case 'head': {
          const head = await body.getPart('head');
          boostPart(head);
          break;
        }
        case 'torso': {
          boostPart(body);
          break;
        }
        case 'arms': {
          for (const side of ['right', 'left']) {
            const shoulder = await body.getPart(side + 'Shoulder');
            if (shoulder) {
              const arm = await shoulder.getPart('arm');
              boostPart(arm);
            }
          }
          break;
        }
        case 'hands': {
          for (const side of ['right', 'left']) {
            const shoulder = await body.getPart(side + 'Shoulder');
            if (shoulder) {
              const arm = await shoulder.getPart('arm');
              if (arm) {
                const forearm = await arm.getPart('forearm');
                if (forearm) {
                  const hand = await forearm.getPart('hand');
                  boostPart(hand);
                }
              }
            }
          }
          break;
        }
        case 'legs': {
          for (const side of ['right', 'left']) {
            const thigh = await body.getPart(side + 'Thigh');
            if (thigh) {
              const knee = await thigh.getPart('knee');
              if (knee) {
                const leg = await knee.getPart('leg');
                boostPart(leg);
              }
            }
          }
          break;
        }
        case 'feet': {
          for (const side of ['right', 'left']) {
            const thigh = await body.getPart(side + 'Thigh');
            if (thigh) {
              const knee = await thigh.getPart('knee');
              if (knee) {
                const leg = await knee.getPart('leg');
                if (leg) {
                  const foot = await leg.getPart('foot');
                  boostPart(foot);
                }
              }
            }
          }
          break;
        }
        case 'eyes': {
          const head = await body.getPart('head');
          if (head) {
            const face = await head.getPart('face');
            if (face) {
              const leftEye = await face.getPart('leftEye');
              const rightEye = await face.getPart('rightEye');
              boostPart(leftEye);
              boostPart(rightEye);
            }
          }
          break;
        }
        case 'ears': {
          const head = await body.getPart('head');
          if (head) {
            const face = await head.getPart('face');
            if (face) {
              const leftEar = await face.getPart('leftEar');
              const rightEar = await face.getPart('rightEar');
              boostPart(leftEar);
              boostPart(rightEar);
            }
          }
          break;
        }
      }

      return {
        success: true,
        stat: statName,
        cost: cost,
        remaining: player.statPointsRemaining,
      };
    `);

    // Interactive stat allocation loop
    this.charGen.setMethod('runStatAllocation', `
      const player = args[0];
      const format = $.format;

      const statOptions = {
        head: { label: 'Head', cost: 1 },
        torso: { label: 'Torso', cost: 1 },
        arms: { label: 'Arms', cost: 2 },
        hands: { label: 'Hands', cost: 2 },
        legs: { label: 'Legs', cost: 2 },
        feet: { label: 'Feet', cost: 2 },
        eyes: { label: 'Eyes', cost: 2 },
        ears: { label: 'Ears', cost: 2 },
      };

      // Show current body part capacities (maxCalories)
      const showStats = async () => {
        const body = await player.getBody();
        if (!body) {
          await player.tell('No body found!');
          return;
        }

        await player.tell('Body Part Capacities:');
        await player.tell(await format.hr(40, '-'));

        const stats = [];

        // Torso
        stats.push(['Torso', body.maxCalories || 100]);

        // Head
        const head = await body.getPart('head');
        if (head) {
          stats.push(['Head', head.maxCalories || 100]);

          // Eyes and Ears
          const face = await head.getPart('face');
          if (face) {
            const eye = await face.getPart('rightEye');
            const ear = await face.getPart('rightEar');
            if (eye) {
              stats.push(['Eyes (each)', eye.maxCalories || 100]);
            }
            if (ear) {
              stats.push(['Ears (each)', ear.maxCalories || 100]);
            }
          }
        }

        // Arms
        const rightShoulder = await body.getPart('rightShoulder');
        if (rightShoulder) {
          const arm = await rightShoulder.getPart('arm');
          if (arm) {
            stats.push(['Arms (each)', arm.maxCalories || 100]);

            // Hands
            const forearm = await arm.getPart('forearm');
            if (forearm) {
              const hand = await forearm.getPart('hand');
              if (hand) {
                stats.push(['Hands (each)', hand.maxCalories || 100]);
              }
            }
          }
        }

        // Legs
        const rightThigh = await body.getPart('rightThigh');
        if (rightThigh) {
          const knee = await rightThigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              stats.push(['Legs (each)', leg.maxCalories || 100]);

              // Feet
              const foot = await leg.getPart('foot');
              if (foot) {
                stats.push(['Feet (each)', foot.maxCalories || 100]);
              }
            }
          }
        }

        // Display as table
        const tableLines = await format.table(stats, { header: false, separator: '  ' });
        for (const line of tableLines) {
          await player.tell('  ' + line);
        }

        await player.tell('');
        await player.tell('Points remaining: ' + player.statPointsRemaining);
      };

      while (player.statPointsRemaining > 0) {
        await showStats();
        await player.tell('');

        // Build choice options based on what they can afford
        const choices = {};
        for (const [key, info] of Object.entries(statOptions)) {
          if (player.statPointsRemaining >= info.cost) {
            choices[key] = info.label + ' (' + info.cost + ' pt' + (info.cost > 1 ? 's' : '') + ')';
          }
        }

        // Add done option
        choices.done = 'Done - keep remaining points';

        if (Object.keys(choices).length === 1) {
          // Only 'done' is available
          await player.tell('Not enough points for any stat. Finishing allocation.');
          break;
        }

        const choice = await $.prompt.menu(player, 'Which body part to strengthen?', choices, 2);

        if (choice === 'done') {
          break;
        }

        const result = await $.charGen.allocateStat(player, choice);
        if (result.error) {
          await player.tell('Error: ' + result.error);
        } else {
          await player.tell('Increased ' + statOptions[choice].label + ' capacity! (' + result.remaining + ' points left)');
        }
        await player.tell('');
      }

      await showStats();
      await player.tell('Stat allocation complete!');
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.charGen) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'charGen', this.charGen.id);
    console.log(`Registered charGen alias -> #${this.charGen.id}`);
  }
}
