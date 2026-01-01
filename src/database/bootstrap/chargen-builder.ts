import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

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
export class CharGenBuilder implements Builder {
  static provides = ['charGen'];
  static depends = ['describable', 'aiPrompts'];

  private charGen: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Load prompts from $.aiPrompts (built by AiPromptsBuilder before this runs)
    const aiPromptsId = aliases.aiPrompts;
    const aiPrompts = aiPromptsId ? await this.manager.load(aiPromptsId) : null;
    const immigrationOfficerPrompt =
      (aiPrompts?.get('immigrationOfficer') as string) ||
      '# Immigration Officer Prompt\n\nFailed to load from $.aiPrompts';

    if (aliases.charGen) {
      this.charGen = await this.manager.load(aliases.charGen);
      if (this.charGen) return; // Already exists and not forcing rebuild
    }

    if (!this.charGen) {
      // Create new CharGen only if it doesn't exist
      // Load describable type directly (types auto-alias by name)
      const $describable = await this.manager.load('describable');
      if (!$describable) {
        throw new Error(
          '$describable type not found - run prototype builders first',
        );
      }
      this.charGen = await this.manager.create({
        parent: $describable,
        properties: {
          name: 'CharGen',
          description: 'Character creation system',
          abilities: `Character generation system for new players. Handles identity creation,
physical appearance customization, and stat allocation.

INTERVIEW MODES:
- Interactive: runCharGen() walks player through step-by-step prompts
- NPC Interview: startNPCInterview() spawns AI-driven immigration officer
- API Interview: startInterview() + setAnswer() for MCP-based creation

INTERVIEW FLOW:
1. Identity: name, sex, pronouns
2. Physical: age, height, weight
3. Appearance: eyes, hair, skin, build, face, distinguishing features
4. Stats: allocate 20 points across body parts (hidden from player)

STAT ALLOCATION:
- allocateStat() increases maxCalories on body parts
- Single parts (head, torso): 1 point each
- Paired parts (arms, hands, legs, feet, eyes, ears): 2 points each
- Each point adds 10 maxCalories to the part(s)

NPC INTERVIEW SYSTEM:
- AI interviewer conducts immersive in-character interview
- Escalating crisis arc (calm → tension → chaos → blackout)
- Timeout handling for inactive players (5 minute idle prompts)
- Rejection protocol for uncooperative/abusive players

CLEANUP:
- registerForRecycle() tracks temporary rooms/NPCs per player
- cleanupForPlayer() recycles all registered objects
- finishInterview() moves player to starting room, connects to game

STARTING LOCATION: Immigration Services Entry Hall ($immigrationServices)`,
        },
        methods: {},
      });
    }

    // Setup methods (runs on both create and force rebuild)

    // Main entry point for new users
    this.charGen.setMethod(
      'onNewUser',
      `
      /** Entry point for new user registration. Routes to NPC interview system.
       *  Called by AuthManager when a new account is created.
       *  @param context - The network ConnectionContext
       *  @param username - Desired username/login name
       *  @param password - User's password (will be hashed)
       *  @returns The created player object (chargen in progress)
       */
      const context = args[0];
      const username = args[1];
      const password = args[2];

      // Use autonomous AI interview system
      await $.charGen.startNPCInterview(context, username, password);
    `,
    );

    // Interactive character generation flow
    this.charGen.setMethod(
      'runCharGen',
      `
      /** Interactive step-by-step character creation via prompts.
       *  Walks player through identity, physical traits, appearance, and stats.
       *  Creates body via BodyFactory when complete.
       *  @param player - The player object to configure
       *  @param isFirstPlayer - If true, grants admin privileges
       *  @returns void (player is configured in-place)
       */
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

      // Mark chargen as complete
      player.chargenComplete = true;

      // Connect player to the game
      await player.connect(player._context);
    `,
    );

    // Method to allocate a stat point - increases maxCalories on body parts
    this.charGen.setMethod(
      'allocateStat',
      `
      /** Allocate a stat point to strengthen a body part region.
       *  Increases maxCalories (and current calories) on the target part(s).
       *  Single parts cost 1 point, paired parts cost 2 points.
       *  @param player - The player whose body to modify
       *  @param statName - Body region: head, torso, arms, hands, legs, feet, eyes, ears
       *  @returns { success, stat, cost, remaining } or { error }
       */
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
    `,
    );

    // Interactive stat allocation loop
    this.charGen.setMethod(
      'runStatAllocation',
      `
      /** Interactive stat allocation loop. Shows body part capacities,
       *  lets player choose where to spend their 20 points.
       *  @param player - The player allocating stats
       *  @returns void (stats applied in-place)
       */
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
    `,
    );

    // ========================================
    // INTERVIEW METHODS (for MCP CharGen API)
    // ========================================

    // Initialize interviewState property if not exists
    if (!this.charGen.get('interviewState')) {
      this.charGen.set('interviewState', []);
    }

    // Get all chargen questions with their suggestions
    this.charGen.setMethod(
      'getQuestions',
      `
      /** Get the complete list of chargen questions with suggestions.
       *  Used by MCP interview API and NPC interviewer.
       *  @returns Array of { id, prompt, type, suggestions?, constraints?, internal? }
       */
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
    `,
    );

    // Start a new interview for a player
    this.charGen.setMethod(
      'startInterview',
      `
      /** Initialize an interview session for a player.
       *  Creates interview state entry to track answers.
       *  @param playerId - The player ID to start interview for
       *  @returns { playerId, questions, answeredCount, totalQuestions }
       */
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
    `,
    );

    // Get all questions and current answers for a player
    this.charGen.setMethod(
      'getQuestionsAndAnswers',
      `
      /** Get all questions with their current answers for a player.
       *  @param playerId - The player ID to get progress for
       *  @returns { playerId, questions: [{...question, answer, answered}], answeredCount, totalQuestions } or { error }
       */
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
    `,
    );

    // Get the next unanswered question
    this.charGen.setMethod(
      'getNextQuestionNeedingAnswer',
      `
      /** Get the next question that needs an answer.
       *  Skips internal questions (like statAllocation which AI fills).
       *  @param playerId - The player ID to check
       *  @returns The next question object, or null if all answered, or { error }
       */
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
    `,
    );

    // Set an answer for a question
    this.charGen.setMethod(
      'setAnswer',
      `
      /** Record an answer to a chargen question.
       *  Validates question exists and stat allocation constraints.
       *  @param playerId - The player ID answering
       *  @param questionId - The question ID (e.g., 'name', 'eyeColor')
       *  @param answer - The answer value (string or object for statAllocation)
       *  @returns { success, questionId, answer, nextQuestion, answeredCount, totalQuestions } or { error }
       */
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
    `,
    );

    // Get suggestions for a question
    this.charGen.setMethod(
      'getSuggestions',
      `
      /** Get suggestion values and constraints for a specific question.
       *  @param questionId - The question ID to get suggestions for
       *  @returns { questionId, suggestions, constraints } or { error }
       */
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
    `,
    );

    // Finish the interview and create the character
    this.charGen.setMethod(
      'finishInterview',
      `
      /** Finalize the interview and create the character.
       *  Creates body via BodyFactory, applies stats, moves to starting room.
       *  Cleans up interview state and temporary objects.
       *  @param playerId - The player ID to finalize
       *  @returns { success, playerId, bodyId, name, sex } or { error }
       */
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

      // Clear chargen state and mark complete
      player.chargenInProgress = false;
      player.chargenAgentSession = null;
      player.chargenComplete = true;

      // Cancel any pending timeout
      await self.cancelPlayerTimeout(playerId);

      // Retrieve stored context (transient properties don't survive $load in MCP context)
      const storedContext = self._playerContexts?.[playerId];
      const ctx = player._context || storedContext;

      // Connect player to game
      if (ctx) {
        await player.connect(ctx);
        // Clean up stored context
        if (self._playerContexts) {
          delete self._playerContexts[playerId];
        }
      }

      // Cleanup all registered objects
      await self.cleanupForPlayer(playerId);

      // Remove from interviewState
      const idx = state.findIndex(s => s.playerId === playerId);
      if (idx >= 0) {
        state.splice(idx, 1);
        self.interviewState = state;
      }

      // Spawn orientation greeter (async, don't block completion)
      if ($greeter) {
        $greeter.spawnForPlayer(playerId, 'continuum').then(greeter => {
          console.log('[CharGen] Spawned greeter #' + greeter.id + ' for player #' + playerId);
        }).catch(err => {
          console.error('[CharGen] Greeter spawn error:', err);
        });
      }

      return {
        success: true,
        playerId,
        bodyId: body.id,
        name: answers.name,
        sex: answers.sex,
      };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // AUTONOMOUS AI INTERVIEW SYSTEM (CharGen v2)
    // ═══════════════════════════════════════════════════════════════════

    // Registry for temporary objects to be cleaned up
    if (!this.charGen.get('recycleRegistry')) {
      this.charGen.set('recycleRegistry', {});
    }

    // Immigration Officer prompt loaded from docs/prompts/IMMIGRATION-OFFICER.md
    this.charGen.set('interviewerPrompt', immigrationOfficerPrompt);

    this.charGen.setMethod(
      'startNPCInterview',
      `
      /** Bootstrap the autonomous AI interview for a player.
       *  Creates minimal player object, spawns AI interviewer, starts interview.
       *  The AI conducts an immersive in-character interview with crisis escalation.
       *  @param context - Network ConnectionContext for the new player
       *  @param username - Desired username (becomes player name initially)
       *  @param password - User's password (will be hashed and stored)
       *  @returns The created player object (chargenInProgress = true)
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
          playername: username.toLowerCase(),  // Login name for auth
          name: username,  // Display name, updated during chargen
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

      // Store context reference for finishInterview (transient properties don't survive $load)
      self._playerContexts = self._playerContexts || {};
      self._playerContexts[player.id] = context;

      // 2. Mark player as in-chargen
      player.chargenInProgress = true;
      player.chargenFaction = 'continuum';

      // 3. Immediate feedback - keep them engaged while AI boots up
      await player.tell('');
      await player.tell('Your head throbs. Everything is hazy.');
      await player.tell('You have trouble remembering how you got here...');
      await player.tell('');
      await player.tell("(OOC: Setting up your interview. This may take up to a minute.)");
      await player.tell('');

      // 4. Start the autonomous AI with charGen context
      console.log('[CharGen] Starting AI agent for player #' + player.id);
      const kickoffPrompt = "A new candidate (Player #" + player.id + ") has arrived for processing. " +
                            "Initiate Protocol 1-A: Secure room, manifest yourself, and conduct the interview.\\n\\n" +
                            "CharGen System Context:\\n" + await $.charGen.describeForAI();

      const systemPrompt = self.interviewerPrompt.replace(/\\\\{\\\\{playerId\\\\}\\\\}/g, String(player.id));
      console.log('[CharGen] System prompt length:', systemPrompt?.length || 0);

      $aiQuery(systemPrompt, kickoffPrompt, null).then(async (result) => {
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
    `,
    );

    this.charGen.setMethod(
      'continueNPCInterview',
      `
      /** Continue (or start) the NPC interview for a returning player.
       *  Called when a player with chargenComplete=false reconnects.
       *  Sets up routing and either resumes existing session or starts fresh.
       *  @param context - Network ConnectionContext
       *  @param player - The player RuntimeObject (already loaded)
       */
      const context = args[0];
      const player = args[1];

      console.log('[CharGen] continueNPCInterview for player #' + player.id);

      // Set up routing - commands go to chargen interviewer via player.onInput
      player._context = context;
      context.setHandler(player);

      // Store context reference for finishInterview
      self._playerContexts = self._playerContexts || {};
      self._playerContexts[player.id] = context;

      // Mark as in-chargen (may already be set)
      player.chargenInProgress = true;
      player.chargenFaction = player.chargenFaction || 'continuum';

      // Check if we have an existing AI session
      if (player.chargenAgentSession) {
        // Session exists - player is resuming mid-interview
        console.log('[CharGen] Resuming existing session for player #' + player.id);
        await player.tell('');
        await player.tell('You wake up... the interview continues.');
        await player.tell('');
        // AI session is still there, just wait for player input
        // The AI will pick up where it left off on next player message
        await self.schedulePlayerTimeout(player.id);
        return;
      }

      // No session - need to start fresh interview
      console.log('[CharGen] Starting fresh interview for player #' + player.id);

      // Immediate feedback
      await player.tell('');
      await player.tell('Your head throbs. Everything is hazy.');
      await player.tell('You have trouble remembering how you got here...');
      await player.tell('');
      await player.tell("(OOC: Setting up your interview. This may take up to a minute.)");
      await player.tell('');

      // Start the autonomous AI with charGen context
      console.log('[CharGen] Starting AI agent for player #' + player.id);
      const kickoffPrompt = "A new candidate (Player #" + player.id + ") has arrived for processing. " +
                            "Initiate Protocol 1-A: Secure room, manifest yourself, and conduct the interview.\\n\\n" +
                            "CharGen System Context:\\n" + await $.charGen.describeForAI();

      const systemPrompt = self.interviewerPrompt.replace(/\\\\{\\\\{playerId\\\\}\\\\}/g, String(player.id));
      console.log('[CharGen] System prompt length:', systemPrompt?.length || 0);

      $aiQuery(systemPrompt, kickoffPrompt, null).then(async (result) => {
        console.log('[CharGen] AI agent completed first turn, session:', result.session?.substring(0, 20) + '...');
        player.chargenAgentSession = result.session;

        // Register session with $ai for persistence
        if (result.session && $ai) {
          await $ai.registerSession(result.session, player.id, player.name + ' (chargen)', 'chargen-session', 'interaction');
        }

        // Schedule timeout if still in chargen
        const currentPlayer = await $load(player.id);
        if (currentPlayer && currentPlayer.chargenInProgress) {
          await self.schedulePlayerTimeout(player.id);
        } else {
          console.log('[CharGen] Chargen already complete, not scheduling timeout');
        }
      }).catch(err => {
        console.error('[CharGen] AI Kickoff Error:', err?.message || err);
      });
    `,
    );

    this.charGen.setMethod(
      'registerForRecycle',
      `
      /** Register a temporary object for cleanup when interview finishes/fails.
       *  Tracks rooms, NPCs, and other objects created during chargen.
       *  Called by AI interviewer when creating interview room and spawning.
       *  @param playerId - The player undergoing chargen
       *  @param objectId - The object ID to recycle later
       *  @returns { success, playerId, objectId } or { success: false, error }
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
    `,
    );

    this.charGen.setMethod(
      'cleanupForPlayer',
      `
      /** Recycle all temporary objects registered for a player.
       *  Called by finishInterview() and rejectPlayer() to clean up.
       *  @param playerId - The player who finished/cancelled chargen
       *  @returns { success, recycledCount }
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
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // PLAYER TIMEOUT SYSTEM
    // Prompts AI when player hasn't responded for 5 minutes
    // ═══════════════════════════════════════════════════════════════════

    this.charGen.setMethod(
      'schedulePlayerTimeout',
      `
      /** Schedule a 5-minute timeout for player inactivity.
       *  When triggered, prompts the AI to re-engage the player.
       *  Reschedules after each prompt until chargen completes.
       *  @param playerId - The player in chargen
       *  @returns { scheduled, playerId, timeoutMs }
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
    `,
    );

    this.charGen.setMethod(
      'cancelPlayerTimeout',
      `
      /** Cancel the inactivity timeout for a player.
       *  Should be called when chargen finishes or player is rejected.
       *  Also called implicitly when player speaks (resets timer).
       *  @param playerId - The player in chargen
       *  @returns { cancelled, playerId }
       */
      const playerId = args[0];
      const jobName = 'chargen-timeout-' + playerId;
      console.log('[CharGen] Cancelling player timeout for #' + playerId + ', job=' + jobName);
      const result = await $.scheduler.unschedule(jobName);
      console.log('[CharGen] Unschedule result:', result);
      return { cancelled: true, playerId };
    `,
    );

    this.charGen.setMethod(
      'onPlayerTimeout',
      `
      /** Called by scheduler when player hasn't responded for 5 minutes.
       *  Sends a prompt to the AI interviewer to re-engage or reject.
       *  Automatically reschedules another timeout if chargen continues.
       *  @param playerId - The player who timed out
       *  @returns void (async, handles AI interaction)
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
        const result = await $aiQuery(promptTemplate, timeoutPrompt, session);
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
    `,
    );

    this.charGen.setMethod(
      'rejectPlayer',
      `
      /** Reject a player during chargen - cleanup, disconnect, and recycle.
       *  Used for uncooperative, abusive, or abandoning players.
       *  Shows rejection message, cleans up temp objects, disconnects, recycles.
       *  @param playerId - The player to reject
       *  @param reason - Reason for rejection (shown to player before disconnect)
       *  @returns { success, playerId, reason } or { error }
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

      // Clear the AI session so they start fresh on reconnect
      // Keep chargenComplete = false so they still need chargen
      player.chargenAgentSession = null;
      player.chargenInProgress = false;

      // Remove stored context
      if (self._playerContexts?.[playerId]) {
        delete self._playerContexts[playerId];
      }

      // Disconnect the player (they can reconnect and start fresh)
      if (context) {
        context.close();
      }

      // NOTE: We do NOT recycle the player - they registered on the website
      // and can reconnect to try chargen again from the beginning

      return { success: true, playerId, reason };
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.charGen) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'charGen', this.charGen.id);
    console.log(`Registered charGen alias -> #${this.charGen.id}`);
  }
}

// Self-register
registerBuilder(CharGenBuilder);
