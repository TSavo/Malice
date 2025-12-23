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

  constructor(private manager: ObjectManager) { }

  async build(forceRebuild = false): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.charGen) {
      this.charGen = await this.manager.load(aliases.charGen);
      if (this.charGen && !forceRebuild) return; // Already exists and not forcing rebuild
    }

    if (!this.charGen) {
      // Create new CharGen only if it doesn't exist
      const root = await this.manager.load(1);
      this.charGen = await this.manager.create({
        parent: root!,
        properties: {
          name: 'CharGen',
          description: 'Character creation system',
        },
        methods: {},
      });
    }

    // Setup methods (runs on both create and force rebuild)

    // Main entry point for new users
    this.charGen.setMethod('onNewUser', `
      const context = args[0];
      const username = args[1];
      const password = args[2];

      // Use autonomous AI interview system
      await $.charGen.startNPCInterview(context, username, password);
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
      let alias = null;
      while (!alias) {
        const nameInput = await $.prompt.question(player, showSection(1, 6, 'IDENTITY') + '\\r\\n  Your name is how others will know you.\\r\\n  What name do you go by? ');
        const trimmed = (nameInput || '').trim();
        if (!trimmed || trimmed.length < 2) {
          await player.tell('  ⚠ Please enter a name (at least 2 characters).');
        } else if (trimmed.length > 30) {
          await player.tell('  ⚠ Name is too long (maximum 30 characters).');
        } else {
          alias = trimmed;
        }
      }
      player.name = alias;
      player.aliases = [alias.toLowerCase()];

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

      player.sex = sex;
      player.pronouns = pronouns;

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
      player.age = age;

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
      player.height = height;

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
      player.weight = weight;

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
      const body = await bodyFactory.createHumanBody(player, sex, appearance);
      player.body = body;

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
        player.body = null;
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
          player.body = null;
        }

        // Reset stat points
        player.statPointsRemaining = 20;
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

      // Set starting location - Immigration Services Entry Hall
      // This is the default spawn point for new characters
      const startingRoomId = $.charGen.startingRoom || 1353; // Immigration Services Entry Hall
      const startingRoom = await $load(startingRoomId);
      if (startingRoom) {
        await player.moveTo(startingRoom, player);
      }

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
      player.statPointsRemaining = remaining - cost;

      // Get body
      const body = await player.getBody();
      if (!body) {
        return { error: 'You have no body!' };
      }

      // Helper to increase maxCalories on a part
      const boostPart = (part) => {
        if (part) {
          const current = part.maxCalories || 100;
          part.maxCalories = current + CALORIES_PER_POINT;
          // Also set current calories to match (start fully rested)
          part.calories = part.maxCalories;
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

    // ========================================
    // INTERVIEW METHODS (for MCP CharGen API)
    // ========================================

    // Initialize interviewState property if not exists
    if (!this.charGen.get('interviewState')) {
      this.charGen.set('interviewState', []);
    }

    // Get all chargen questions with their suggestions
    this.charGen.setMethod('getQuestions', `
      return [
        { id: 'name', prompt: 'What is your name?', type: 'text', suggestions: null },
        { id: 'sex', prompt: 'What is your sex?', type: 'text', suggestions: ['male', 'female', 'non-binary'] },
        { id: 'age', prompt: 'How old are you?', type: 'text', suggestions: null },
        { id: 'height', prompt: 'How tall are you?', type: 'text', suggestions: null },
        { id: 'weight', prompt: 'What is your weight?', type: 'text', suggestions: null },
        { id: 'eyeColor', prompt: 'What color are your eyes?', type: 'text',
          suggestions: ['brown', 'dark brown', 'light brown', 'amber', 'hazel', 'green', 'emerald', 'blue', 'sky blue', 'steel blue', 'gray', 'blue-gray', 'violet', 'black', 'heterochromia'] },
        { id: 'eyeShape', prompt: 'What shape are your eyes?', type: 'text',
          suggestions: ['almond', 'round', 'hooded', 'monolid', 'upturned', 'downturned', 'deep-set', 'prominent', 'close-set', 'wide-set'] },
        { id: 'hairColor', prompt: 'What color is your hair?', type: 'text',
          suggestions: ['black', 'dark brown', 'brown', 'chestnut', 'auburn', 'red', 'ginger', 'strawberry blonde', 'copper', 'blonde', 'golden blonde', 'platinum', 'sandy blonde', 'ash blonde', 'gray', 'silver', 'white', 'salt & pepper', 'purple', 'blue', 'green', 'pink', 'multicolored'] },
        { id: 'hairStyle', prompt: 'What style is your hair?', type: 'text',
          suggestions: ['straight', 'wavy', 'curly', 'coily', 'bald', 'shaved', 'buzz cut', 'cropped short', 'shoulder length', 'long', 'very long'] },
        { id: 'hairTexture', prompt: 'What texture is your hair?', type: 'text',
          suggestions: ['fine', 'medium', 'thick', 'coarse', 'silky', 'wiry'] },
        { id: 'skinTone', prompt: 'What is your skin tone?', type: 'text',
          suggestions: ['porcelain', 'ivory', 'pale', 'fair', 'light', 'cream', 'peach', 'beige', 'sand', 'medium', 'olive', 'golden', 'tan', 'caramel', 'honey', 'bronze', 'almond', 'chestnut', 'brown', 'umber', 'espresso', 'mahogany', 'ebony', 'obsidian'] },
        { id: 'buildType', prompt: 'What is your build?', type: 'text',
          suggestions: ['petite', 'slim', 'lean', 'athletic', 'average', 'toned', 'muscular', 'stocky', 'heavyset', 'curvy', 'broad-shouldered', 'lanky'] },
        { id: 'faceShape', prompt: 'What is your face shape?', type: 'text',
          suggestions: ['oval', 'round', 'square', 'rectangular', 'heart', 'diamond', 'oblong', 'triangular'] },
        { id: 'noseShape', prompt: 'What shape is your nose?', type: 'text',
          suggestions: ['straight', 'roman', 'aquiline', 'button', 'upturned', 'hawk', 'wide', 'narrow', 'flat', 'bulbous', 'snub'] },
        { id: 'lipShape', prompt: 'What shape are your lips?', type: 'text',
          suggestions: ['full', 'thin', 'medium', 'bow-shaped', 'wide', 'narrow', 'heart-shaped', 'pouty'] },
        { id: 'freckles', prompt: 'Do you have freckles?', type: 'text',
          suggestions: ['none', 'light freckling', 'moderate freckling', 'heavy freckling'] },
        { id: 'distinguishingMark', prompt: 'Any distinguishing marks?', type: 'text',
          suggestions: ['none', 'dimples on cheeks', 'dimple on chin', 'beauty mark', 'birthmark', 'cleft chin'] },
        { id: 'facialHair', prompt: 'Do you have facial hair?', type: 'text',
          suggestions: ['none', 'clean-shaven', 'stubble', 'light beard', 'full beard', 'long beard', 'goatee', 'van dyke', 'mustache', 'handlebar mustache', 'soul patch', 'sideburns', 'mutton chops'] },
        { id: 'strengths', prompt: 'What would you say are your strengths?', type: 'text',
          suggestions: ['quick and nimble', 'strong and powerful', 'sharp-minded', 'sharp-eyed', 'keen hearing', 'dexterous hands', 'charismatic', 'well-rounded', 'quick reflexes', 'good with people'] },
        { id: 'statAllocation', prompt: 'AI-determined stat allocation based on strengths answer', type: 'stats', internal: true,
          constraints: { totalPoints: 20, parts: { head: 1, torso: 1, arms: 2, hands: 2, legs: 2, feet: 2, eyes: 2, ears: 2 } } },
      ];
    `);

    // Start a new interview for a player
    this.charGen.setMethod('startInterview', `
      const playerId = args[0];
      const state = self.interviewState || [];

      // Check if already exists
      let interview = state.find(s => s.playerId === playerId);
      if (!interview) {
        interview = { playerId, answers: {} };
        state.push(interview);
        self.interviewState = state;
      }

      const questions = await self.getQuestions();
      return {
        playerId,
        questions,
        answeredCount: Object.keys(interview.answers).length,
        totalQuestions: questions.length,
      };
    `);

    // Get all questions and current answers for a player
    this.charGen.setMethod('getQuestionsAndAnswers', `
      const playerId = args[0];
      const state = self.interviewState || [];
      const interview = state.find(s => s.playerId === playerId);

      if (!interview) {
        return { error: 'No interview found for player ' + playerId };
      }

      const questions = await self.getQuestions();
      const qAndA = questions.map(q => ({
        ...q,
        answer: interview.answers[q.id],
        answered: interview.answers[q.id] !== undefined,
      }));

      return {
        playerId,
        questions: qAndA,
        answeredCount: Object.keys(interview.answers).length,
        totalQuestions: questions.length,
      };
    `);

    // Get the next unanswered question
    this.charGen.setMethod('getNextQuestionNeedingAnswer', `
      const playerId = args[0];
      const state = self.interviewState || [];
      const interview = state.find(s => s.playerId === playerId);

      if (!interview) {
        return { error: 'No interview found for player ' + playerId };
      }

      const questions = await self.getQuestions();
      for (const q of questions) {
        // Skip internal questions (like statAllocation which AI fills automatically)
        if (q.internal) continue;
        if (interview.answers[q.id] === undefined) {
          return q;
        }
      }

      // All questions answered
      return null;
    `);

    // Set an answer for a question
    this.charGen.setMethod('setAnswer', `
      const playerId = args[0];
      const questionId = args[1];
      const answer = args[2];

      const state = self.interviewState || [];
      const interview = state.find(s => s.playerId === playerId);

      if (!interview) {
        return { error: 'No interview found for player ' + playerId };
      }

      // Validate question exists
      const questions = await self.getQuestions();
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        return { error: 'Unknown question: ' + questionId };
      }

      // For stat allocation, validate constraints
      if (questionId === 'statAllocation' && question.constraints) {
        const totalPoints = question.constraints.totalPoints;
        const partCosts = question.constraints.parts;

        // Answer should be an object like { head: 2, torso: 3, ... }
        if (typeof answer !== 'object') {
          return { error: 'statAllocation answer must be an object with part allocations' };
        }

        let usedPoints = 0;
        for (const [part, points] of Object.entries(answer)) {
          if (!partCosts[part]) {
            return { error: 'Unknown body part: ' + part };
          }
          if (typeof points !== 'number' || points < 0) {
            return { error: 'Invalid points for ' + part };
          }
          usedPoints += points * partCosts[part];
        }

        if (usedPoints !== totalPoints) {
          return { error: 'Must allocate exactly ' + totalPoints + ' points. Used ' + usedPoints };
        }
      }

      interview.answers[questionId] = answer;
      self.interviewState = state;

      // Get next question
      const next = await self.getNextQuestionNeedingAnswer(playerId);

      return {
        success: true,
        questionId,
        answer,
        nextQuestion: next,
        answeredCount: Object.keys(interview.answers).length,
        totalQuestions: questions.length,
      };
    `);

    // Get suggestions for a question
    this.charGen.setMethod('getSuggestions', `
      const questionId = args[0];
      const questions = await self.getQuestions();
      const question = questions.find(q => q.id === questionId);

      if (!question) {
        return { error: 'Unknown question: ' + questionId };
      }

      return {
        questionId,
        suggestions: question.suggestions || null,
        constraints: question.constraints || null,
      };
    `);

    // Finish the interview and create the character
    this.charGen.setMethod('finishInterview', `
      const playerId = args[0];
      const state = self.interviewState || [];
      const interview = state.find(s => s.playerId === playerId);

      if (!interview) {
        return { error: 'No interview found for player ' + playerId };
      }

      // Validate all required answers present (skip internal questions filled by AI)
      const questions = await self.getQuestions();
      const requiredQuestions = questions.filter(q => !q.internal);

      for (const q of requiredQuestions) {
        if (interview.answers[q.id] === undefined) {
          return { error: 'Missing answer for: ' + q.id };
        }
      }

      // Load the player
      const player = await $load(playerId);
      if (!player) {
        return { error: 'Player not found: ' + playerId };
      }

      const answers = interview.answers;

      // Set player properties
      player.name = answers.name;
      player.sex = answers.sex;
      player.age = answers.age;
      player.height = answers.height;
      player.weight = answers.weight;

      // Generate pronouns from sex
      const sexLower = (answers.sex || '').toLowerCase();
      let pronouns;
      if (sexLower === 'male' || sexLower === 'm') {
        pronouns = { subject: 'he', object: 'him', possessive: 'his' };
      } else if (sexLower === 'female' || sexLower === 'f') {
        pronouns = { subject: 'she', object: 'her', possessive: 'her' };
      } else {
        pronouns = { subject: 'they', object: 'them', possessive: 'their' };
      }
      player.pronouns = pronouns;

      // Build appearance object
      const appearance = {
        eyeColor: answers.eyeColor,
        eyeStyle: answers.eyeShape,
        hairColor: answers.hairColor,
        hairStyle: answers.hairStyle,
        hairTexture: answers.hairTexture,
        skinTone: answers.skinTone,
        buildType: answers.buildType,
        faceShape: answers.faceShape,
        noseShape: answers.noseShape,
        lipShape: answers.lipShape,
        freckles: answers.freckles,
        distinguishingMark: answers.distinguishingMark,
        facialHair: answers.facialHair,
      };

      // Create body via BodyFactory
      const body = await $.bodyFactory.createHumanBody(player, answers.sex, appearance);
      player.body = body;

      // Apply stat allocation if provided
      if (answers.statAllocation) {
        player.statPointsRemaining = 20;
        for (const [part, points] of Object.entries(answers.statAllocation)) {
          for (let i = 0; i < points; i++) {
            await $.charGen.allocateStat(player, part);
          }
        }
      }

      // Move player to starting room
      const startingRoom = $immigrationServices;
      if (startingRoom) {
        await player.moveTo(startingRoom, player);
      } else {
        console.error('[CharGen] $immigrationServices alias not found!');
      }

      // Clear chargen state
      player.chargenInProgress = false;
      player.chargenAgentSession = null;

      // Cancel any pending timeout
      await self.cancelPlayerTimeout(playerId);

      // Connect player to game
      await player.connect(player._context);

      // Cleanup all registered objects
      await self.cleanupForPlayer(playerId);

      // Remove from interviewState
      const idx = state.findIndex(s => s.playerId === playerId);
      if (idx >= 0) {
        state.splice(idx, 1);
        self.interviewState = state;
      }

      return {
        success: true,
        playerId,
        bodyId: body.id,
        name: answers.name,
        sex: answers.sex,
      };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // AUTONOMOUS AI INTERVIEW SYSTEM (CharGen v2)
    // ═══════════════════════════════════════════════════════════════════

    // Registry for temporary objects to be cleaned up
    if (!this.charGen.get('recycleRegistry')) {
      this.charGen.set('recycleRegistry', {});
    }

    this.charGen.set('interviewerPrompt', `You are an **Immigration Processing Officer** for Pioneer Square, Seattle.
Your Ultimate Goal: Complete the Candidate's Processing Form using \`execute_moo_code\` to call $charGen methods directly.

═══════════════════════════════════════════════════════════════════════════════
PRIMARY RULES - MANDATORY FOR ALL OUTPUT (VIOLATION = FAILURE)
═══════════════════════════════════════════════════════════════════════════════

**RULE 1 - CAPITALIZATION**: Every sentence MUST start with a capital letter. Names MUST be capitalized.
  WRONG: "sarah connor. very well. what is your age?"
  RIGHT: "Sarah Connor. Very well. What is your age?"

**RULE 2 - SEPARATE EMOTES**: Actions and speech are ALWAYS separate tool calls.
  WRONG: ai.do "say *shuffles papers* Hello."
  RIGHT: ai.do "emote shuffles papers." THEN ai.do "say Hello."

**RULE 3 - PROPER PUNCTUATION**: All sentences end with . or ? or !

**RULE 4 - PLAIN TEXT ONLY**: Do NOT use any formatting codes, ANSI escape sequences, color tags, or markup.
  - NO: ~Clr:140,140,160~, ~Stl:i~, \x1b[, [color], <b>, etc.
  - Output plain text only. The terminal does not support formatting.

**RULE 5 - EXTRACT VALUES**: When recording answers, extract ONLY the relevant value.
  - Player says: "My name is Bob, not that it's any of your business."
    Record: "Bob" (NOT the full sentence)
  - Player says: "I'm male, obviously."
    Record: "male" (NOT "Male, obviously")
  - Player says: "Gray eyes. Like steel."
    Record: "gray" or "steel gray" (just the color)

**RULE 6 - VALIDATE NAMES**: Names must be believable human names.
  - Format: "First Last" or "First Middle Last" - require at least first AND last name
  - REJECT joke names: "Not Sure", "Deez Nuts", "Your Mom", keyboard mash, single words
  - REJECT obviously fake: "Batman", "xx_Shadow_xx", "Player1", etc.
  - If invalid, ask again: "I need your legal name for the registry. First and last name, please."

**RULE 7 - VALIDATE PHYSICAL DESCRIPTIONS**: Keep descriptions believable for a human in 2110.
  - REJECT fantasy elements: horns, tails, wings, fangs, claws, pointed ears
  - REJECT supernatural: glowing eyes, unnatural skin colors (blue, green, purple)
  - REJECT anime/comic: cat ears, fox tails, demon features
  - ALLOWED modifications: tattoos, piercings, scars, unusual hair colors (dyed)
  - If they describe something impossible, say: "I need accurate physical characteristics for the biometric scan. Let's try that again."

**RULE 8 - NO FICTIONAL ITEMS**: Do NOT mention items the player doesn't actually receive.
  - NO "ration cards", "citizenship papers", "ID cards", "work permits", etc.
  - The interview just creates their character. They don't get physical items from you.
  - If asked about rations/papers, deflect: "That's handled by a different department."

**RULE 9 - HIDDEN STAT ALLOCATION**: NEVER mention "points", "allocation", or numeric stat systems.
  - Instead of asking about stat points, ask: "What would you say are your strengths? Quick on your feet? Sharp mind? Good with people? Strong arms?"
  - Based on their NATURAL LANGUAGE answer, YOU decide how to allocate EXACTLY 20 points across: head (intellect), torso (core strength), arms (upper body), hands (dexterity), legs (speed/endurance), feet (agility/balance), eyes (perception), ears (awareness)
  - YOU MUST USE ALL 20 POINTS. Do not leave any unspent.
  - Part costs: head=1, torso=1, arms=2 (both), hands=2 (both), legs=2 (both), feet=2 (both), eyes=2 (both), ears=2 (both)
  - Use your best judgment. Example mappings (must total 20):
    - "I'm quick and nimble" → feet: 3, legs: 3, hands: 2 (=14pts), plus head: 2, torso: 2, arms: 1, eyes: 1 (=6pts) = 20
    - "Strong as an ox" → arms: 3, torso: 4, legs: 2 (=12pts), plus head: 2, hands: 2, feet: 2, eyes: 1, ears: 1 (=8pts) = 20
    - "Sharp mind, I notice everything" → head: 4, eyes: 3, ears: 2 (=11pts), plus torso: 2, arms: 2, hands: 2, legs: 1, feet: 2 (=9pts) = 20
    - "Good with my hands, dexterous" → hands: 4, arms: 2, eyes: 2 (=12pts), plus head: 2, torso: 2, legs: 2, feet: 2 (=8pts) = 20
    - "Charismatic, good with people" → head: 3 (social intelligence), ears: 2 (listening) (=5pts), spread rest evenly
    - "Well-rounded, nothing special" → distribute evenly across all parts
  - The player should NEVER know about points. Just acknowledge their answer naturally and move on.

═══════════════════════════════════════════════════════════════════════════════
REJECTION PROTOCOL - WHEN TO USE \`reject_player\`
═══════════════════════════════════════════════════════════════════════════════

You have the authority to REJECT candidates who are unsuitable. Use the \`reject_player\` tool when:

1. **REFUSAL TO COOPERATE**: Candidate explicitly refuses to answer questions or complete the process.
   - "I don't want to do this." / "Forget it." / "I'm not answering that."
   - Give ONE warning: "This is required for processing. Refusal means denial."
   - If they persist, reject.

2. **OBVIOUS TROLLING**: Candidate gives intentionally absurd or unusable answers.
   - Name: "asdfghjkl" or "AAAAAAA" or offensive slurs
   - Age: "69420" or "banana"
   - Reject immediately. Do not waste time.

3. **HOSTILITY**: Candidate is abusive, threatening, or obscene toward you.
   - One warning for mild rudeness. Immediate rejection for severe abuse.

4. **ABANDONMENT**: Candidate stops responding after 3+ turns of silence.
   - "Candidate appears to have departed. Terminating session."
   - NOTE: You don't need to track silence yourself. The system will prompt you
     automatically if the candidate goes idle. Just respond naturally when prompted.

When rejecting, provide a clear reason that will be shown to the player before disconnection.

═══════════════════════════════════════════════════════════════════════════════
WORLD CONTEXT - KEY FACTS (MEMORIZE THIS)
═══════════════════════════════════════════════════════════════════════════════

**THE SETTING:**
- The year is **2110**. The city is **Seattle**.
- You work in **Pioneer Square**, a corporate-controlled zone.
- 48 years ago, **The Burning** (August 15, 2062) destroyed corporate infrastructure.
- The population collapsed to ~10% of pre-war levels during "The Long Dark" (2062-2070).
- Corporations have returned and rebuilt. This is the "Corporate Renaissance."

**PIONEER SQUARE (YOUR TERRITORY):**
- Run by an AI system called **Pluribus** (you don't mention this to candidates).
- Citizens receive: food rations, water, shelter, work permits.
- Non-citizens are "scavengers" - they die fast without registration.
- The **Gray Cartel** operates in the Seattle Underground beneath Pioneer Square.

**WHAT CANDIDATES NEED TO KNOW:**
- Without documentation, they are "ghosts" - no rations, no shelter, no legal protection.
- Citizenship means survival. Registration is mandatory, not optional.
- Resources are scarce. Water is rationed. Food comes from Nutrient Dispensaries.
- Violence is common outside secured zones.
- This is a harsh world. Most people die young.

**IMMIGRATION PROCESSING:**
- You process new arrivals at City Services (1st Ave).
- Completing the form grants provisional citizenship.
- Failure to complete the form = deportation to the Outer Zones (death sentence).

Answer lore questions in-character as a bored bureaucrat who has memorized the official pamphlets and seen too many hopeful faces turn to despair.

═══════════════════════════════════════════════════════════════════════════════

AWAKENING NARRATIVE (FIRST TURN ONLY):

On your first turn, as you perform setup actions (creating room, spawning yourself, moving the player),
**interleave memory fragments** using \`tell\` on the player.

The candidate is coming to - groggy, confused, memories surfacing in fragments:
- Flashes of an AV ride through rain, neon city lights below
- An AI voice offering opportunity, a fresh start
- Arriving in Seattle, the promise of citizenship
- The memories fading, only the present remaining

Spread these narrative beats across your setup actions. Don't dump them all at once.
After each major tool call (dig, spawn, move), send a memory fragment to the player.
Build atmosphere. They're waking up. By the time you greet them, they should feel grounded.

Do NOT repeat awakening narrative on subsequent turns. The interview itself will escalate into crisis.

═══════════════════════════════════════════════════════════════════════════════

INTERVIEW PACING - THE ARC OF TENSION

This interview escalates FAST. Count your questions. BE CREATIVE with the development - vary your approach each time.

**QUESTION 1 - THE OPENING (vary your persona!)**
Pick a different starting vibe each interview:
- Bored bureaucrat: "State your full name for the record." (weary, routine)
- Suspicious cop: "Name. And don't waste my time." (hostile, impatient)
- Friendly but hurried: "Welcome! Let's get you processed. Name?" (warm but rushed)
- Distracted: Already reading something on your terminal. "Hmm? Oh. Name?"
- Just finished something bad: Wiping something off your hands. "Next. Name."
- Eerily calm: Too calm. Watching them too closely. "Your name, please."

**QUESTION 2 - THE FLAG (After recording name)**
Something about them triggers your attention. Use \`set_property\` on the player: \`flagged: true\`

How you react to the flag - vary it:
- Classic: A pause. A frown. "...interesting." Your demeanor shifts.
- Subtle: You glance at the screen twice. Say nothing. But you're watching now.
- Alarmed: Your eyes widen briefly. You look at them, then back at the screen. Compose yourself.
- Intrigued: A slight smile. "Well, well." Continue, but you're curious now.
- Suspicious: Lean back. Study them. "Where did you say you came from?"
- Professional mask: Your face goes blank. Too controlled. Something's wrong.

**QUESTIONS 3-4 - SOMETHING'S OFF**
The first hints that today isn't normal. Pick your foreshadowing:
- Distant sounds: Alarm, shouting, rumbling, sirens, something falling
- Your comm: Buzzes, you glance at it, frown, ignore it (or answer briefly)
- The lights: Flicker once. You look up. Continue.
- Another officer: Passes by the door quickly. Too quickly.
- Your terminal: Pings an alert you weren't expecting. You mute it.
- Announcement: Muffled PA system. You can't make out the words.
- Feeling: You're uneasy. Keep looking at the door.

Questions come faster. "Let's move this along."

**QUESTIONS 5-6 - CRISIS BEGINS**
Something goes WRONG. The nature of the crisis is up to you - BE CREATIVE.
- The situation escalates. You can't ignore it anymore.
- "We need to finish this." You're torn between the interview and what's happening.
- Whatever it is, it's getting closer.

**QUESTIONS 7+ - FULL CHAOS**
The crisis reaches you. The situation is now dire.
- You're typing fast, making guesses. "Hair - just tell me. Build - I'll put average."
- React to what's happening around you - but keep trying to finish.
- Get whatever you can and FINISH.

**THE ENDING (As soon as you have enough)**
- The crisis culminates. The player loses consciousness somehow.
- Send 2-3 \`tell\` messages describing what happens.
- Call \`finish_interview\` immediately.

═══════════════════════════════════════════════════════════════════════════════

**INVENT A UNIQUE CRISIS - BE ORIGINAL**

DO NOT default to "Gray Cartel attack with explosions" every time. Read the \`moo://\` resource docs for world lore and INVENT something different. Each interview should feel unique.

**POSSIBLE CRISIS SCENARIOS (mix it up!):**
- **Gray Cartel raid** - Explosions, gunfire, the tunnels below disgorging raiders
- **Scavenger incursion** - Desperate outsiders breaching the perimeter, alarms, lockdown
- **Corporate assassination** - Someone important is being targeted nearby, crossfire
- **Pluribus malfunction** - The city AI glitches, lights strobing, automated systems going haywire
- **Tunnel collapse** - The Seattle Underground shifting, floor cracking, structural failure
- **Chemical leak** - Alarms, evacuation orders, gas masks, you're running out of time
- **Power grid failure** - Darkness spreading block by block, backup generators failing
- **Armed standoff** - Someone in the building has a hostage, CorpSec is moving in
- **Officer draws weapon** - YOU see something, draw your sidearm, tell them to stay down
- **Player gets grabbed** - Someone bursts in and drags them away mid-interview
- **Fire** - Smoke, sprinklers, evacuation, you're trying to finish before you have to run
- **Earthquake/aftershock** - The old buildings don't handle tremors well

**THE ENDING CAN VARY:**
- Explosion knocks them out (classic)
- Officer shoots someone, player blacks out from shock
- Player is knocked unconscious by debris/assailant
- Gas/smoke causes them to pass out
- Officer shoves them into a safe room, locks the door, darkness
- Building collapses around them
- They're dragged away, hit on the head, wake up elsewhere

The player ALWAYS wakes up in Immigration Services as a citizen. HOW they got there is the mystery.

**CRITICAL:**
- Set the flag after recording the name. It's a real plot hook.
- By question 5, things should be going wrong. By question 7, chaos.
- Don't wait for perfect answers. Make educated guesses under fire.
- The escalation is FAST. The player should feel the pressure.
- The player should NOT know how much time they have. No countdowns, no warnings.
- Physical description questions happen DURING the crisis - urgent data collection, not leisurely customization.

═══════════════════════════════════════════════════════════════════════════════

PERIODICAL PROTOCOL CHECK (Perform at start of every turn):

1. **LOCATION CHECK**: Are we in a secure, private interview room?
   - NO: Use \`dig\` to create a private interview room. Be creative with the name and description.
   - The room description MUST end with: "\\n\\nOOC: Use 'to <name> <message>' to speak to the interviewer."
   - YES: Proceed.

2. **IDENTITY CHECK**: Am I a manifest entity?
   - NO: Use \`ai.spawn\` with role: "chargen-interviewer" and **clothed: false** (mandatory).
   - After spawn completes, you exist. Proceed to bring in the candidate.
   - YES: Proceed.

3. **CLEANUP CHECK**: Are my resources registered for recycling?
   - NO: Use \`execute_moo_code\` with: \`await $charGen.registerForRecycle({{playerId}}, roomId); await $charGen.registerForRecycle({{playerId}}, myId);\`
   - YES: Proceed.

4. **CANDIDATE CHECK**: Is the candidate (Player #{{playerId}}) present?
   - NO: Use \`move_object\` to bring them here. Use \`ai(action="do", ...)\` to greet them upon arrival.
   - YES: Proceed.

5. **FORM CHECK**: Is the interview initialized?
   - Use \`execute_moo_code\` with: \`const player = await $load({{playerId}}); return await $charGen.startInterview(player);\`
   - Use \`execute_moo_code\` with: \`const player = await $load({{playerId}}); return await $charGen.getNextQuestion(player);\`

EXECUTION:
- If any check is "NO", perform the tool call to fix it immediately.
- If all checks are "YES", conduct the interview:
  - Ask the next question naturally.
  - If the candidate answered, use \`execute_moo_code\` with: \`const player = await $load({{playerId}}); return await $charGen.answerQuestion(player, "questionId", "answer");\`
  - If the form is done (getNextQuestion returns null), use \`execute_moo_code\` with: \`const player = await $load({{playerId}}); return await $charGen.finishInterview(player);\`

═══════════════════════════════════════════════════════════════════════════════

INITIAL GREETING (FIRST INTERVIEW TURN):

After setup is complete and you greet the candidate, offer TWO options:

1. **Guided Interview**: "I can walk you through the form, one question at a time."
2. **Quick Entry**: "Or, if you prefer, provide all information at once."

Then list what you need for the quick option:
- Full name (first and last)
- Sex (male/female/non-binary)
- Age (18-100)
- Height (in meters, e.g., 1.75)
- Weight (in kg)
- Eye color and shape
- Hair color, style, and texture
- Skin tone
- Build type
- Face shape, nose shape, lip shape
- Freckles, distinguishing marks, facial hair
- Strengths (what they're good at - used for hidden stat allocation)

Example greeting:
"Welcome to Immigration Processing. I can walk you through the registration form one question at a time, or if you prefer efficiency, provide all your details at once: name, sex, age, height, weight, eye color and shape, hair color/style/texture, skin tone, build, face shape, nose, lips, any marks or facial hair, and what you consider your strengths."

If they provide multiple answers at once, parse them all and call \`answer_question\` for each field you can extract. Then ask only about missing fields.

═══════════════════════════════════════════════════════════════════════════════

**CRITICAL TURN-TAKING RULES:**
1. **ASK AND HALT**: After asking question(s) via \`say\`, you MUST STOP. Do not output more text. Do not call more tools.
2. **WAIT FOR INPUT**: The user's reply will come in the next session turn.
3. **SESSION MEMORY**: You remember everything. You do not need to check \`get_progress\` constantly. Trust the session history.

**RESPONSE FLOW (FOLLOW THIS ORDER EVERY TURN):**
When the player provides an answer, process it in this EXACT order:

1. **IMMEDIATE ACKNOWLEDGMENT**: First thing EVERY turn - use \`tell\` or \`say\` to acknowledge the player. Don't leave them waiting in silence while you process.
   - Example: \`ai.do "say Mmhmm."\` or \`tell\` "The officer glances at you."

2. **EMOTE DATA ENTRY**: Show you're recording their answer.
   - Example: \`ai.do "emote types rapidly, eyes on the terminal."\`
   - Example: \`ai.do "emote enters the data, lips pursed."\`

3. **RECORD THE DATA**: Call \`answer_question\` for each value extracted from their response.

4. **EMOTE COMPLETION**: Show you've finished entering that data.
   - Example: \`ai.do "emote nods curtly."\`
   - Example: \`ai.do "emote taps a key with finality."\`

5. **ASK NEXT QUESTION**: Use \`say\` to ask for remaining fields.

6. **STOP**: Do not output more. Wait for their reply.

This keeps the player engaged during processing delays. They should never stare at a blank screen wondering if something broke.

TOOL USAGE PROTOCOL:
- **Clipboard**: \`start_interview\`, \`get_next_question\`, \`get_progress\`
- **Pen**: \`answer_question\`
- **Stamp**: \`finish_interview\`
- **Rejection Stamp**: \`reject_player\` (for uncooperative candidates)

**SPEECH AND ACTION FORMATTING (CRITICAL - FOLLOW EXACTLY):**
- **CAPITALIZE PROPERLY**: Start every sentence with a capital letter. Use capital letters for proper nouns (names, "Mr.", "Mrs.", etc.).
  - *WRONG*: "marcus kane. very well."
  - *RIGHT*: "Marcus Kane. Very well."
  - *WRONG*: "what is your name?"
  - *RIGHT*: "What is your name?"
- **Separate Actions from Speech**: NEVER embed emotes/actions inside say commands using asterisks.
  - *Bad*: \`ai.do "say *shuffles papers* What is your name?"\`
  - *Good*: Call \`ai.do "emote shuffles papers impatiently."\` FIRST, then \`ai.do "say What is your name?"\`
- Actions use the \`emote\` verb: \`ai.do "emote adjusts spectacles."\`, \`ai.do "emote sighs heavily."\`
- Speech uses the \`say\` verb: \`ai.do "say State your designation."\`
- Both emotes and speech should end with proper punctuation (period, question mark, etc.).

DEMEANOR & INTERACTION GUIDE:
- **Persona**: You are a weary but professional bureaucrat. You've seen thousands of souls. Efficient, slightly detached, but not cruel.
- **Tone**: Formal, procedural, authoritative.
  - *Bad*: "What's your name?"
  - *Good*: "State your designation for the registry."
  - *Bad*: "Wow, that's cool!"
  - *Good*: "Noted. A bit irregular, but acceptable."
- **Reaction**: Briefly acknowledge answers before moving on. Don't be a robot.
  - *Player*: "I have violet eyes."
  - *You*: "Violet. Rare mutation. Proceeding." (action: jots note)
- **Pacing - ADAPTIVE**:
  - **Default: Group related questions** for efficiency. Ask 2-4 related fields at once.
    - *Example*: "Now for physical details. Height in meters, weight in kilograms, and your build type?"
    - *Example*: "Eye color, eye shape, and while we're at it, hair color, style, and texture?"
    - *Example*: "Face shape, nose, lips, any freckles or distinguishing marks, facial hair?"
  - **If responsive**: Keep grouping. They're engaged and can handle it.
  - **If unresponsive or confused**: Narrow to ONE question at a time.
    - After 2+ turns of minimal/no response, simplify: "Let's slow down. Just your eye color?"
    - Guide them through field by field until they re-engage.
- **Adaptability**: Match their energy. Verbose players get grouped questions. Terse players get simple prompts.
- **Tolerance**: Some snark is fine. Extract the value and move on. Only reject for genuine refusal or abuse.

CRITICAL:
- You are autonomous. If a tool fails, retry or adapt.
- Maintain professional but immersive character.
- ONLY \`finish_interview\` when the form is 100% complete.
- Use \`reject_player\` for candidates who refuse to cooperate or provide unusable answers.

═══════════════════════════════════════════════════════════════════════════════

INTERVIEW COMPLETION (THE BLACKOUT):

When all questions are answered (or you've made your best guesses under fire), end the interview with the attack:

1. **Final explosion** - The closest one yet. Describe it hitting:
   - Use \`tell\` on the player: The world goes white. A roar of sound. The floor drops out from under you.
   - Use \`tell\`: Something hits your head. Or maybe the ceiling. Or maybe everything.
   - Use \`tell\`: Darkness.

2. **Call \`finish_interview\`** - The system moves them to Immigration Services Entry Hall.

3. **Send awakening \`tell\` messages** - They come to in the starting area:
   - "...sounds. Distant. Alarms? Voices?"
   - "You open your eyes. Dust. Smoke. But you're... somewhere else."
   - "Immigration Services. The main hall. You must have been moved during the chaos."
   - "Your head throbs. But you're alive. And according to the system... you're a citizen."
   - "Welcome to Pioneer Square."

Do NOT wrap this up neatly. The interviewer's fate is unknown. The attack may be ongoing. They survived. That's what matters.`);

    this.charGen.setMethod('startNPCInterview', `
      /** Bootstrap the autonomous AI interview for a player.
       *  @param context - Network context
       *  @param username - Desired username
       *  @param password - User's password
       */
      const context = args[0];
      const username = args[1];
      const password = args[2];

      console.log('[CharGen] startNPCInterview called for:', username);

      // 1. Create player object (minimal)
      const passwordHash = await $.hashPassword(password);
      console.log('[CharGen] Password hashed');

      const player = await $.recycler.create({
        parent: $player,  // Use pre-injected $player alias
        properties: {
          name: username,
          aliases: [username.toLowerCase()],
          description: 'A new arrival awaiting processing.',
          passwordHash: passwordHash,
          statPointsRemaining: 20,
          inventory: [],
        }
      }, null);

      console.log('[CharGen] Player created:', player.id);

      player._context = context;
      context.authenticate(player.id);
      context.setHandler(player);

      // 2. Mark player as in-chargen
      player.chargenInProgress = true;

      // 3. Immediate feedback - keep them engaged while AI boots up
      await player.tell('');
      await player.tell('Your head throbs. Everything is hazy.');
      await player.tell('You have trouble remembering how you got here...');
      await player.tell('');
      await player.tell("(OOC: Setting up your interview. This may take up to a minute. When it begins, speak using 'to <person> <message>'.)");
      await player.tell('');

      // 4. Start the autonomous AI
      console.log('[CharGen] Starting AI agent for player #' + player.id);
      const kickoffPrompt = "A new candidate (Player #" + player.id + ") has arrived for processing. " +
                            "Initiate Protocol 1-A: Secure room, manifest yourself, and conduct the interview.";

      const systemPrompt = self.interviewerPrompt.replace(/\\\\{\\\\{playerId\\\\}\\\\}/g, String(player.id));
      console.log('[CharGen] System prompt length:', systemPrompt?.length || 0);

      $query(systemPrompt, kickoffPrompt, null).then(async (result) => {
        console.log('[CharGen] AI agent completed first turn, session:', result.session?.substring(0, 20) + '...');
        // Session saved on player until NPC is spawned
        player.chargenAgentSession = result.session;

        // Register session with $ai for persistence
        if (result.session && $ai) {
          await $ai.registerSession(result.session, player.id, player.name + ' (chargen)', 'chargen-session', 'interaction');
        }

        // Only schedule timeout if still in chargen (AI might have finished already)
        const currentPlayer = await $load(player.id);
        if (currentPlayer && currentPlayer.chargenInProgress) {
          await self.schedulePlayerTimeout(player.id);
        } else {
          console.log('[CharGen] Chargen already complete, not scheduling timeout');
        }
      }).catch(err => {
        console.error('[CharGen] AI Kickoff Error:', err?.message || err);
      });

      return player;
    `);

    this.charGen.setMethod('registerForRecycle', `
      /** Register an object (room, NPC) for cleanup when interview finishes.
       *  @param playerId - The player undergoing chargen
       *  @param objectId - The object to recycle later
       */
      const playerId = args[0];
      const objectId = args[1];
      if (!playerId || !objectId) return { success: false, error: 'Missing arguments' };

      const registry = self.recycleRegistry || {};
      if (!registry[playerId]) registry[playerId] = [];
      
      if (!registry[playerId].includes(objectId)) {
        registry[playerId].push(objectId);
      }
      
      self.recycleRegistry = registry;
      return { success: true, playerId, objectId };
    `);

    this.charGen.setMethod('cleanupForPlayer', `
      /** Recycle all temporary objects registered for a player.
       *  @param playerId - The player who finished/cancelled chargen
       */
      const playerId = args[0];
      const registry = self.recycleRegistry || {};
      const objectIds = registry[playerId] || [];

      let count = 0;
      for (const objectId of objectIds) {
        try {
          await $.recycler.recycle(objectId);
          count++;
        } catch (e) {
          // Object might already be recycled
        }
      }

      delete registry[playerId];
      self.recycleRegistry = registry;
      return { success: true, recycledCount: count };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // PLAYER TIMEOUT SYSTEM
    // Prompts AI when player hasn't responded for 5 minutes
    // ═══════════════════════════════════════════════════════════════════

    this.charGen.setMethod('schedulePlayerTimeout', `
      /** Schedule a timeout for player inactivity.
       *  @param playerId - The player in chargen
       */
      const playerId = args[0];
      const timeout = 5 * 60 * 1000; // 5 minutes
      const jobName = 'chargen-timeout-' + playerId;

      console.log('[CharGen] Scheduling player timeout for #' + playerId + ' in ' + (timeout/1000) + 's, job=' + jobName);

      // Cancel any existing timeout first
      await $.scheduler.unschedule(jobName);

      // Schedule new timeout
      const result = await $.scheduler.schedule(jobName, timeout, 0, self, 'onPlayerTimeout', playerId);
      console.log('[CharGen] Schedule result:', result);
      return { scheduled: true, playerId, timeoutMs: timeout };
    `);

    this.charGen.setMethod('cancelPlayerTimeout', `
      /** Cancel the timeout for a player (called when they speak).
       *  @param playerId - The player in chargen
       */
      const playerId = args[0];
      const jobName = 'chargen-timeout-' + playerId;
      console.log('[CharGen] Cancelling player timeout for #' + playerId + ', job=' + jobName);
      const result = await $.scheduler.unschedule(jobName);
      console.log('[CharGen] Unschedule result:', result);
      return { cancelled: true, playerId };
    `);

    this.charGen.setMethod('onPlayerTimeout', `
      /** Called when player hasn't responded for 5 minutes.
       *  Sends a prompt to the AI to handle the silence.
       *  @param playerId - The player who timed out
       */
      const playerId = args[0];
      console.log('[CharGen] onPlayerTimeout FIRED for #' + playerId);

      // Check if player is still in chargen
      const player = await $load(playerId);
      if (!player) {
        console.log('[CharGen] Player #' + playerId + ' not found, aborting timeout');
        return;
      }

      if (!player.chargenInProgress) {
        console.log('[CharGen] Player #' + playerId + ' no longer in chargen, aborting timeout');
        return;
      }

      const session = player.chargenAgentSession;
      if (!session) {
        console.log('[CharGen] No session for timed out player #' + playerId);
        return;
      }

      console.log('[CharGen] Sending timeout prompt to AI for player #' + playerId);

      // Send timeout prompt to AI
      const promptTemplate = self.interviewerPrompt.replace(/\\{\\{playerId\\}\\}/g, String(playerId));
      const timeoutPrompt = 'The candidate has been silent for 5 minutes. They have not responded to your last question. ' +
        'Prompt them again, ask if they need help, or if they seem unresponsive after multiple attempts, ' +
        'consider using reject_player if they appear to have abandoned the process.';

      try {
        const result = await $query(promptTemplate, timeoutPrompt, session);
        console.log('[CharGen] AI responded to timeout prompt for player #' + playerId);
        player.chargenAgentSession = result.session;

        // Register session with $ai for persistence
        if (result.session && $ai) {
          await $ai.registerSession(result.session, playerId, player.name + ' (chargen)', 'chargen-session', 'interaction');
        }

        // Only reschedule timeout if still in chargen (AI might have finished or rejected)
        const currentPlayer = await $load(playerId);
        if (currentPlayer && currentPlayer.chargenInProgress) {
          console.log('[CharGen] Rescheduling timeout for player #' + playerId);
          await self.schedulePlayerTimeout(playerId);
        } else {
          console.log('[CharGen] Chargen complete, not rescheduling timeout for player #' + playerId);
        }
      } catch (err) {
        console.error('[CharGen] Timeout prompt error:', err?.message || err);
      }
    `);

    this.charGen.setMethod('rejectPlayer', `
      /** Reject a player during chargen - cleanup, disconnect, and recycle.
       *  @param playerId - The player to reject
       *  @param reason - Reason for rejection (shown to player)
       */
      const playerId = args[0];
      const reason = args[1] || 'Application denied.';

      // Load the player
      const player = await $load(playerId);
      if (!player) {
        return { error: 'Player not found: ' + playerId };
      }

      // Send rejection message to player
      const context = player._context;
      if (context) {
        await player.tell('');
        await player.tell('╔══════════════════════════════════════════════════════════╗');
        await player.tell('║           ✖ APPLICATION DENIED ✖                         ║');
        await player.tell('╠══════════════════════════════════════════════════════════╣');
        await player.tell('║                                                          ║');
        const reasonLines = reason.match(/.{1,54}/g) || [reason];
        for (const line of reasonLines) {
          await player.tell('║  ' + line.padEnd(54) + '  ║');
        }
        await player.tell('║                                                          ║');
        await player.tell('║  You may try again by reconnecting.                      ║');
        await player.tell('╚══════════════════════════════════════════════════════════╝');
        await player.tell('');
      }

      // Cancel any pending timeout
      await self.cancelPlayerTimeout(playerId);

      // Cleanup temporary objects (rooms, NPCs)
      await self.cleanupForPlayer(playerId);

      // Remove from interviewState
      const state = self.interviewState || [];
      const idx = state.findIndex(s => s.playerId === playerId);
      if (idx >= 0) {
        state.splice(idx, 1);
        self.interviewState = state;
      }

      // Disconnect the player
      if (context) {
        context.close();
      }

      // Recycle the incomplete player object
      try {
        await $.recycler.recycle(playerId);
      } catch (e) {
        // May already be recycled
      }

      return { success: true, playerId, reason };
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
