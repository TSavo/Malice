import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Stat allocation costs for chargen
 * Single parts cost 1 point, paired parts cost 2 points
 */
export const STAT_COSTS = {
  headIq: 1, // Head IQ (single)
  torsoStrength: 1, // Torso strength (single)
  armsStrength: 2, // Both arms strength
  handsStrength: 2, // Both hands grip strength
  handsDexterity: 2, // Both hands dexterity
  legsStrength: 2, // Both legs strength
  legsDexterity: 2, // Both legs dexterity
  feetDexterity: 2, // Both feet dexterity
  eyesPerception: 2, // Both eyes perception
  earsPerception: 2, // Both ears perception
} as const;

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
        // Appearance options
        eyeColors: ['brown', 'blue', 'green', 'hazel', 'gray', 'amber'],
        eyeStyles: ['almond', 'round', 'hooded', 'monolid', 'upturned', 'downturned'],
        hairColors: ['black', 'brown', 'blonde', 'red', 'gray', 'white', 'auburn'],
        hairStyles: ['straight', 'wavy', 'curly', 'coily', 'bald'],
        skinTones: ['pale', 'fair', 'light', 'medium', 'olive', 'tan', 'brown', 'dark'],
      },
      methods: {},
    });

    // Main entry point for new users
    this.charGen.setMethod('onNewUser', `
      const context = args[0];
      const username = args[1];
      const password = args[2];

      // Pre-player messages go through context directly (no player yet)
      context.send('\\r\\n');
      context.send('=== Character Creation ===\\r\\n');
      context.send('Warning: You must complete this process without disconnecting.\\r\\n');
      context.send('\\r\\n');

      // Hash password
      const passwordHash = await $.hashPassword(password);

      // Get Player prototype via alias
      const objectManager = await $.load(0);
      const aliases = objectManager.get('aliases') || {};
      const playerPrototypeId = aliases.player;

      // Check if this is the first player (admin user)
      const existingPlayers = await $.countPlayers();
      const isFirstPlayer = existingPlayers === 0;

      // Get recycler for object creation
      const recycler = await $.recycler;
      if (!recycler) {
        throw new Error('Recycler not available');
      }

      // Create Player object with minimal defaults first
      const player = await recycler.create({
        parent: playerPrototypeId,
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

      // Now run interactive chargen
      await $.charGen.runCharGen(player, isFirstPlayer);
    `);

    // Interactive character generation flow
    this.charGen.setMethod('runCharGen', `
      const player = args[0];
      const isFirstPlayer = args[1];

      await player.tell('');
      await player.tell('Let\\'s create your character...');
      await player.tell('');

      // === NAME ===
      const alias = await $.prompt.question(player, 'What name do you go by? (This is how others will address you) ');
      player.set('name', alias);
      player.set('aliases', [alias.toLowerCase()]);

      // === SEX ===
      const sex = await $.prompt.choice(player, 'What is your sex?', {
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

      // === AGE ===
      let age = null;
      while (!age) {
        const ageInput = await $.prompt.question(player, 'How old are you? (18-100) ');
        const parsed = parseInt(ageInput, 10);
        if (isNaN(parsed) || parsed < 18 || parsed > 100) {
          await player.tell('Please enter a valid age between 18 and 100.');
        } else {
          age = parsed;
        }
      }
      player.set('age', age);

      // === HEIGHT ===
      let height = null;
      while (!height) {
        const heightInput = await $.prompt.question(player, 'How tall are you in meters? (1.0 - 2.5, e.g. 1.75) ');
        const parsed = parseFloat(heightInput);
        if (isNaN(parsed) || parsed < 1.0 || parsed > 2.5) {
          await player.tell('Please enter a valid height between 1.0 and 2.5 meters.');
        } else {
          height = Math.round(parsed * 100) / 100;
        }
      }
      player.set('height', height);

      // === WEIGHT ===
      let weight = null;
      while (!weight) {
        const weightInput = await $.prompt.question(player, 'How much do you weigh in kilograms? (30 - 200) ');
        const parsed = parseInt(weightInput, 10);
        if (isNaN(parsed) || parsed < 30 || parsed > 200) {
          await player.tell('Please enter a valid weight between 30 and 200 kg.');
        } else {
          weight = parsed;
        }
      }
      player.set('weight', weight);

      // === APPEARANCE ===
      await player.tell('');
      await player.tell('Now let\\'s define your appearance...');

      // Eye color
      const eyeColor = await $.prompt.choice(player, 'What color are your eyes?', {
        brown: 'Brown',
        blue: 'Blue',
        green: 'Green',
        hazel: 'Hazel',
        gray: 'Gray',
        amber: 'Amber',
      });

      // Eye style
      const eyeStyle = await $.prompt.choice(player, 'What shape are your eyes?', {
        almond: 'Almond',
        round: 'Round',
        hooded: 'Hooded',
        monolid: 'Monolid',
        upturned: 'Upturned',
        downturned: 'Downturned',
      });

      // Hair color
      const hairColor = await $.prompt.choice(player, 'What color is your hair?', {
        black: 'Black',
        brown: 'Brown',
        blonde: 'Blonde',
        red: 'Red',
        gray: 'Gray',
        white: 'White',
        auburn: 'Auburn',
      });

      // Hair style
      const hairStyle = await $.prompt.choice(player, 'What style is your hair?', {
        straight: 'Straight',
        wavy: 'Wavy',
        curly: 'Curly',
        coily: 'Coily',
        bald: 'Bald',
      });

      // Skin tone
      const skinTone = await $.prompt.choice(player, 'What is your skin tone?', {
        pale: 'Pale',
        fair: 'Fair',
        light: 'Light',
        medium: 'Medium',
        olive: 'Olive',
        tan: 'Tan',
        brown: 'Brown',
        dark: 'Dark',
      });

      // Store appearance for body creation
      const appearance = {
        eyeColor: eyeColor,
        eyeStyle: eyeStyle,
        hairColor: hairColor,
        hairStyle: hairStyle,
        skinTone: skinTone,
      };

      // === CREATE BODY ===
      await player.tell('');
      await player.tell('Growing your body...');

      const bodyFactory = await $.bodyFactory;
      const body = await bodyFactory.createHumanBody(player.id, sex, appearance);
      player.set('body', body.id);

      // === CONFIRMATION ===
      await player.tell('');
      await player.tell('=== Your Character ===');
      await player.tell('Name: ' + player.name);
      await player.tell('Sex: ' + sex + ' (' + pronouns.subject + '/' + pronouns.object + ')');
      await player.tell('Age: ' + age);
      await player.tell('Height: ' + height + 'm');
      await player.tell('Weight: ' + weight + 'kg');
      await player.tell('Eyes: ' + eyeColor + ' ' + eyeStyle);
      await player.tell('Hair: ' + hairColor + ' ' + hairStyle);
      await player.tell('Skin: ' + skinTone);
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
        await player.tell('═══════════════════════════════════════════════════════════');
        await player.tell('  YOU ARE THE FIRST USER - ADMIN PRIVILEGES GRANTED');
        await player.tell('═══════════════════════════════════════════════════════════');
        await player.tell('');
        await player.tell('You have been granted wizard status and DevTools access.');
        await player.tell('Use these powers wisely to build your world!');
      }

      // === STAT ALLOCATION ===
      await player.tell('');
      await player.tell('Now allocate your stat points!');
      await player.tell('You have 20 points to spend. Single body parts cost 1, paired parts cost 2.');
      await player.tell('');

      await $.charGen.runStatAllocation(player);

      // === FINAL CONFIRMATION ===
      await player.tell('');
      await player.tell('=== Final Character Summary ===');
      await player.tell('Name: ' + player.name);
      await player.tell('Sex: ' + player.sex + ' (' + player.pronouns.subject + '/' + player.pronouns.object + ')');
      await player.tell('Age: ' + player.age + '  Height: ' + player.height + 'm  Weight: ' + player.weight + 'kg');

      // Show appearance from body
      const body = await player.getBody();
      if (body) {
        const head = await body.getPart('head');
        if (head) {
          const scalp = await head.getPart('scalp');
          const face = await head.getPart('face');
          if (scalp) {
            await player.tell('Hair: ' + (scalp.hairColor || 'brown') + ' ' + (scalp.hairStyle || 'straight'));
          }
          if (face) {
            const eye = await face.getPart('rightEye');
            if (eye) {
              await player.tell('Eyes: ' + (eye.color || 'brown') + ' ' + (eye.shape || 'almond'));
            }
          }
        }
        await player.tell('Skin: ' + (body.skinTone || 'medium'));
      }

      await player.tell('');
      await player.tell('Stats:');
      const stats = await player.getStats();
      await player.tell('  Total Strength: ' + stats.strength + '  Total Dexterity: ' + stats.dexterity);
      await player.tell('  Intelligence: ' + stats.intelligence + '  Perception: ' + stats.perception);
      await player.tell('');

      const finalConfirm = await $.prompt.yesorno(player, 'Create this character and enter the game?');
      if (!finalConfirm) {
        await player.tell('');
        await player.tell('Starting over from the beginning...');
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
      await player.tell('Character created! You are #' + player.id);
      await player.tell('');

      // Connect player to the game
      await player.connect(player._context);
    `);

    // Method to allocate a stat point
    this.charGen.setMethod('allocateStat', `
      const player = args[0];
      const statName = args[1];

      const costs = {
        headIq: 1,
        torsoStrength: 1,
        armsStrength: 2,
        handsStrength: 2,
        handsDexterity: 2,
        legsStrength: 2,
        legsDexterity: 2,
        feetDexterity: 2,
        eyesPerception: 2,
        earsPerception: 2,
      };

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

      // Apply stat based on name
      switch (statName) {
        case 'headIq': {
          const head = await body.getPart('head');
          if (head) head.set('iq', (head.iq || 1) + 1);
          break;
        }
        case 'torsoStrength': {
          body.set('strength', (body.strength || 1) + 1);
          break;
        }
        case 'armsStrength': {
          for (const side of ['right', 'left']) {
            const shoulder = await body.getPart(side + 'Shoulder');
            if (shoulder) {
              const arm = await shoulder.getPart('arm');
              if (arm) arm.set('strength', (arm.strength || 1) + 1);
            }
          }
          break;
        }
        case 'handsStrength': {
          for (const side of ['right', 'left']) {
            const shoulder = await body.getPart(side + 'Shoulder');
            if (shoulder) {
              const arm = await shoulder.getPart('arm');
              if (arm) {
                const forearm = await arm.getPart('forearm');
                if (forearm) {
                  const hand = await forearm.getPart('hand');
                  if (hand) hand.set('strength', (hand.strength || 1) + 1);
                }
              }
            }
          }
          break;
        }
        case 'handsDexterity': {
          for (const side of ['right', 'left']) {
            const shoulder = await body.getPart(side + 'Shoulder');
            if (shoulder) {
              const arm = await shoulder.getPart('arm');
              if (arm) {
                const forearm = await arm.getPart('forearm');
                if (forearm) {
                  const hand = await forearm.getPart('hand');
                  if (hand) hand.set('dexterity', (hand.dexterity || 1) + 1);
                }
              }
            }
          }
          break;
        }
        case 'legsStrength': {
          for (const side of ['right', 'left']) {
            const thigh = await body.getPart(side + 'Thigh');
            if (thigh) {
              const knee = await thigh.getPart('knee');
              if (knee) {
                const leg = await knee.getPart('leg');
                if (leg) leg.set('strength', (leg.strength || 1) + 1);
              }
            }
          }
          break;
        }
        case 'legsDexterity': {
          for (const side of ['right', 'left']) {
            const thigh = await body.getPart(side + 'Thigh');
            if (thigh) {
              const knee = await thigh.getPart('knee');
              if (knee) {
                const leg = await knee.getPart('leg');
                if (leg) leg.set('dexterity', (leg.dexterity || 1) + 1);
              }
            }
          }
          break;
        }
        case 'feetDexterity': {
          for (const side of ['right', 'left']) {
            const thigh = await body.getPart(side + 'Thigh');
            if (thigh) {
              const knee = await thigh.getPart('knee');
              if (knee) {
                const leg = await knee.getPart('leg');
                if (leg) {
                  const foot = await leg.getPart('foot');
                  if (foot) foot.set('dexterity', (foot.dexterity || 1) + 1);
                }
              }
            }
          }
          break;
        }
        case 'eyesPerception': {
          const head = await body.getPart('head');
          if (head) {
            const face = await head.getPart('face');
            if (face) {
              const leftEye = await face.getPart('leftEye');
              const rightEye = await face.getPart('rightEye');
              if (leftEye) leftEye.set('perception', (leftEye.perception || 1) + 1);
              if (rightEye) rightEye.set('perception', (rightEye.perception || 1) + 1);
            }
          }
          break;
        }
        case 'earsPerception': {
          const head = await body.getPart('head');
          if (head) {
            const face = await head.getPart('face');
            if (face) {
              const leftEar = await face.getPart('leftEar');
              const rightEar = await face.getPart('rightEar');
              if (leftEar) leftEar.set('perception', (leftEar.perception || 1) + 1);
              if (rightEar) rightEar.set('perception', (rightEar.perception || 1) + 1);
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

      const statOptions = {
        headIq: { label: 'Head IQ', cost: 1 },
        torsoStrength: { label: 'Torso Strength', cost: 1 },
        armsStrength: { label: 'Arms Strength', cost: 2 },
        handsStrength: { label: 'Hands Strength', cost: 2 },
        handsDexterity: { label: 'Hands Dexterity', cost: 2 },
        legsStrength: { label: 'Legs Strength', cost: 2 },
        legsDexterity: { label: 'Legs Dexterity', cost: 2 },
        feetDexterity: { label: 'Feet Dexterity', cost: 2 },
        eyesPerception: { label: 'Eyes Perception', cost: 2 },
        earsPerception: { label: 'Ears Perception', cost: 2 },
      };

      // Show current stats by body part
      const showStats = async () => {
        const body = await player.getBody();
        if (!body) {
          await player.tell('No body found!');
          return;
        }

        await player.tell('Current Stats:');

        // Head
        const head = await body.getPart('head');
        if (head) {
          await player.tell('  Head IQ: ' + (head.iq || 1));
        }

        // Torso
        await player.tell('  Torso Strength: ' + (body.strength || 1));

        // Arms (get one arm's stats - they're symmetric)
        const rightShoulder = await body.getPart('rightShoulder');
        if (rightShoulder) {
          const arm = await rightShoulder.getPart('arm');
          if (arm) {
            await player.tell('  Arms Strength: ' + (arm.strength || 1) + ' each');
          }
        }

        // Hands
        if (rightShoulder) {
          const arm = await rightShoulder.getPart('arm');
          if (arm) {
            const forearm = await arm.getPart('forearm');
            if (forearm) {
              const hand = await forearm.getPart('hand');
              if (hand) {
                await player.tell('  Hands Strength: ' + (hand.strength || 1) + ', Dexterity: ' + (hand.dexterity || 1) + ' each');
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
              await player.tell('  Legs Strength: ' + (leg.strength || 1) + ', Dexterity: ' + (leg.dexterity || 1) + ' each');
            }
          }
        }

        // Feet
        if (rightThigh) {
          const knee = await rightThigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              const foot = await leg.getPart('foot');
              if (foot) {
                await player.tell('  Feet Dexterity: ' + (foot.dexterity || 1) + ' each');
              }
            }
          }
        }

        // Eyes
        if (head) {
          const face = await head.getPart('face');
          if (face) {
            const eye = await face.getPart('rightEye');
            if (eye) {
              await player.tell('  Eyes Perception: ' + (eye.perception || 1) + ' each');
            }
          }
        }

        // Ears
        if (head) {
          const face = await head.getPart('face');
          if (face) {
            const ear = await face.getPart('rightEar');
            if (ear) {
              await player.tell('  Ears Perception: ' + (ear.perception || 1) + ' each');
            }
          }
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

        const choice = await $.prompt.choice(player, 'Which stat to increase?', choices);

        if (choice === 'done') {
          break;
        }

        const result = await $.charGen.allocateStat(player, choice);
        if (result.error) {
          await player.tell('Error: ' + result.error);
        } else {
          await player.tell('Increased ' + statOptions[choice].label + '! (' + result.remaining + ' points left)');
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

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.charGen = this.charGen.id;
    objectManager.set('aliases', aliases);

    console.log(`Registered charGen alias -> #${this.charGen.id}`);
  }
}
