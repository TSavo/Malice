import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds CartelCharGen object (dynamic ID)
 * Handles character creation for players entering through the Gray Cartel path (graycartel.com)
 *
 * Key differences from standard CharGen:
 * - Ghost interviewer instead of Immigration Officer
 * - Staged loyalty test instead of crisis (shoot the bagged hostage)
 * - Dynamic awakening narratives (AI picks from multiple options)
 * - Starting location: Runner's Den (Underground)
 * - Faction: Gray Cartel
 * - Currency: Cash instead of credits
 */
export class CartelCharGenBuilder implements Builder {
  static provides = ['cartelCharGen'];
  static depends = ['charGen', 'aiPrompts', 'describable', 'player', 'scheduler', 'recycler'];

  private cartelCharGen: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.cartelCharGen) {
      this.cartelCharGen = await this.manager.load(aliases.cartelCharGen);
      if (this.cartelCharGen) return;
    }

    if (!this.cartelCharGen) {
      // Load describable type directly (types auto-alias by name)
      const $describable = await this.manager.load('describable');
      if (!$describable) {
        throw new Error(
          '$describable type not found - run prototype builders first',
        );
      }
      this.cartelCharGen = await this.manager.create({
        parent: $describable,
        properties: {
          name: 'CartelCharGen',
          description: 'Gray Cartel character creation system',
          abilities: `Character generation system for Gray Cartel recruits.
Handles identity creation, physical appearance customization, and the loyalty test.

INTERVIEW FLOW:
1. Dynamic awakening narrative (AI picks from options)
2. Ghost interviewer conducts suspicious, transactional interview
3. Identity: name, sex
4. Physical: age, height, weight
5. Appearance: eyes, hair, skin, build, face, distinguishing features
6. THE TEST: Shoot the bagged hostage to prove loyalty
7. Stats: allocated based on natural language (hidden from player)

THE TEST (MANDATORY):
- Around question 5-6, a hooded hostage is brought in
- Player must take the gun and shoot them
- Refusal, hesitation, or trying to shoot the Ghost = rejection
- This is the Cartel's loyalty assessment

STARTING LOCATION: Runner's Den ($runnersDen) in the Underground
FACTION: Gray Cartel
CURRENCY: Cash (50 starting)`,
        },
        methods: {},
      });
    }

    // Setup methods (runs on both create and force rebuild)
    await this.setupMethods();
  }

  private async setupMethods(): Promise<void> {
    if (!this.cartelCharGen) return;

    // Initialize state properties if not exists
    if (!this.cartelCharGen.get('interviewState')) {
      this.cartelCharGen.set('interviewState', []);
    }
    if (!this.cartelCharGen.get('recycleRegistry')) {
      this.cartelCharGen.set('recycleRegistry', {});
    }

    // ════════════════════════════════════════════════════════════════════════
    // AWAKENING NARRATIVES
    // ════════════════════════════════════════════════════════════════════════

    this.cartelCharGen.set('awakeningNarratives', [
      {
        id: 'burned',
        label: 'Burned Citizenship',
        narrative: `You fled Pluribus. Your citizenship was revoked—or about to be. The surface is closed to you now. Someone found you before CorpSec did. Brought you here. Underground.`,
      },
      {
        id: 'scavenger',
        label: 'Scavenger Discovery',
        narrative: `You found the tunnel entrance by accident. Desperate, nowhere else to go. Crawled down into the dark. They found you first. Could have killed you. Didn't.`,
      },
      {
        id: 'vouched',
        label: 'Brought Blindfolded',
        narrative: `Someone vouched for you. You don't know who. Bag over your head, hands bound, stumbling through passages you couldn't map. When the bag came off, you were here.`,
      },
      {
        id: 'accident',
        label: 'The Accident',
        narrative: `Sinkhole opened beneath your feet. You fell. How far, you don't know. When you woke up, figures stood over you. They could have left you to die in the dark. They didn't.`,
      },
      {
        id: 'running',
        label: 'Running from CorpSec',
        narrative: `You did something. Or they think you did. Either way, you can't go back up there. Someone showed you a door that wasn't supposed to exist. You went through.`,
      },
      {
        id: 'betrayal',
        label: 'Betrayal',
        narrative: `Someone on the surface sold you out. You don't know who. Don't know why. But your name hit a list, and the only direction left was down.`,
      },
      {
        id: 'seeker',
        label: 'The Seeker',
        narrative: `You heard rumors. The underground. People who live free of Pluribus. You came looking. Left marks in the right places. Asked questions of the right people. Eventually, someone answered.`,
      },
      {
        id: 'debt',
        label: 'The Debt',
        narrative: `You owe something you can't pay. Credits, favors, blood—doesn't matter. Someone offered a way out. A fresh start. This is it. The price comes later.`,
      },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // GHOST INTERVIEWER PROMPT
    // ════════════════════════════════════════════════════════════════════════

    // Ghost Interviewer prompt loaded from docs/prompts/GHOST-INTERVIEWER.md
    const objectManager = await this.manager.load(0);
    const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};
    const aiPromptsId = aliases.aiPrompts;
    const aiPrompts = aiPromptsId ? await this.manager.load(aiPromptsId) : null;
    const ghostInterviewerPrompt =
      (aiPrompts?.get('ghostInterviewer') as string) ||
      '# Ghost Interviewer Prompt\n\nFailed to load from $.aiPrompts';
    this.cartelCharGen.set('ghostInterviewerPrompt', ghostInterviewerPrompt);

    // ════════════════════════════════════════════════════════════════════════
    // ENTRY POINT
    // ════════════════════════════════════════════════════════════════════════

    this.cartelCharGen.setMethod(
      'onNewUser',
      `
      /** Entry point for new Cartel recruits. Routes to Ghost interview system.
       *  Called by AuthManager when a new account is created via cartel path.
       *  @param context - The network ConnectionContext
       *  @param username - Desired username/login name
       *  @param password - User's password (will be hashed)
       *  @returns The created player object (chargen in progress)
       */
      const context = args[0];
      const username = args[1];
      const password = args[2];

      // Use autonomous AI interview system
      await $.cartelCharGen.startNPCInterview(context, username, password);
    `,
    );

    // ════════════════════════════════════════════════════════════════════════
    // INTERVIEW STATE MANAGEMENT
    // Delegates to $charGen where possible
    // ════════════════════════════════════════════════════════════════════════

    this.cartelCharGen.setMethod(
      'getQuestions',
      `
      /** Get the complete list of chargen questions.
       *  Reuses the same questions as standard chargen.
       *  @returns Array of { id, prompt, type, suggestions?, constraints?, internal? }
       */
      return await $.charGen.getQuestions();
    `,
    );

    this.cartelCharGen.setMethod(
      'startInterview',
      `
      /** Initialize interview state for a player.
       *  Creates interview state entry to track answers.
       *  @param playerId - The player ID to start interview for
       *  @returns { playerId, questions, answeredCount, totalQuestions }
       */
      const playerId = args[0];
      const state = self.interviewState || [];

      // Check if already exists
      let interview = state.find(s => s.playerId === playerId);
      if (!interview) {
        interview = { playerId, answers: {}, testAdministered: false };
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

    this.cartelCharGen.setMethod(
      'getQuestionsAndAnswers',
      `
      /** Get all questions with their current answers for a player.
       *  @param playerId - The player ID to get progress for
       *  @returns { playerId, questions, answeredCount, totalQuestions } or { error }
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

    this.cartelCharGen.setMethod(
      'getNextQuestionNeedingAnswer',
      `
      /** Get the next question that needs an answer.
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
        if (q.internal) continue;
        if (interview.answers[q.id] === undefined) {
          return q;
        }
      }

      return null;
    `,
    );

    this.cartelCharGen.setMethod(
      'setAnswer',
      `
      /** Record an answer to a chargen question.
       *  @param playerId - The player ID answering
       *  @param questionId - The question ID
       *  @param answer - The answer value
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

        if (typeof answer !== 'object') {
          return { error: 'statAllocation must be an object' };
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

    this.cartelCharGen.setMethod(
      'getSuggestions',
      `
      /** Get suggestions for a question.
       *  @param questionId - The question ID
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

    // ════════════════════════════════════════════════════════════════════════
    // FINISH INTERVIEW (CARTEL-SPECIFIC)
    // ════════════════════════════════════════════════════════════════════════

    this.cartelCharGen.setMethod(
      'finishInterview',
      `
      /** Finalize the interview and create the character.
       *  Creates body, applies stats, moves to Runner's Den, sets faction to Gray Cartel.
       *  @param playerId - The player ID to finalize
       *  @returns { success, playerId, bodyId, name, sex } or { error }
       */
      const playerId = args[0];
      const state = self.interviewState || [];
      const interview = state.find(s => s.playerId === playerId);

      if (!interview) {
        return { error: 'No interview found for player ' + playerId };
      }

      // Validate required answers (skip internal questions)
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

      // Apply stat allocation if provided (uses $charGen's allocateStat)
      if (answers.statAllocation) {
        player.statPointsRemaining = 20;
        for (const [part, points] of Object.entries(answers.statAllocation)) {
          for (let i = 0; i < points; i++) {
            await $.charGen.allocateStat(player, part);
          }
        }
      }

      // ════════════════════════════════════════════════════════════════════
      // CARTEL-SPECIFIC: Starting location, faction, currency
      // ════════════════════════════════════════════════════════════════════

      // Move player to Runner's Den (Underground)
      const startingRoom = $runnersDen;
      if (startingRoom) {
        await player.moveTo(startingRoom, player);
      } else {
        // Fallback to generic underground location if alias not found
        console.error('[CartelCharGen] $runnersDen alias not found!');
        const fallback = $immigrationServices;
        if (fallback) await player.moveTo(fallback, player);
      }

      // Set faction to Gray Cartel
      if ($.faction) {
        await $.faction.setFaction(player, 'Gray Cartel');
      }

      // Give starting cash (not credits)
      player.cash = 50;
      player.credits = 0;

      // Clear chargen state and mark complete
      player.chargenInProgress = false;
      player.chargenAgentSession = null;
      player.chargenComplete = true;

      // Cancel any pending timeout
      await self.cancelPlayerTimeout(playerId);

      // Retrieve stored context
      const storedContext = self._playerContexts?.[playerId];
      const ctx = player._context || storedContext;

      // Connect player to game
      if (ctx) {
        await player.connect(ctx);
        if (self._playerContexts) {
          delete self._playerContexts[playerId];
        }
      }

      // Send awakening messages
      await player.tell('');
      await player.tell('...');
      await player.tell('');
      await player.tell('The bag comes off.');
      await player.tell('');
      await player.tell('Dim light. A cramped chamber. Walls reinforced with scrap.');
      await player.tell('This is a waystation. Not a destination.');
      await player.tell('');
      await player.tell('Your head throbs. Your ears still ring from the shot.');
      await player.tell('But you\\'re alive. And somewhere beneath the city.');
      await player.tell('');
      await player.tell('Welcome to the Underground.');
      await player.tell('');

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
        $greeter.spawnForPlayer(playerId, 'cartel').then(greeter => {
          console.log('[CartelCharGen] Spawned greeter #' + greeter.id + ' for player #' + playerId);
        }).catch(err => {
          console.error('[CartelCharGen] Greeter spawn error:', err);
        });
      }

      return {
        success: true,
        playerId,
        bodyId: body.id,
        name: answers.name,
        sex: answers.sex,
        faction: 'Gray Cartel',
        startingLocation: 'Runner\\'s Den',
      };
    `,
    );

    // ════════════════════════════════════════════════════════════════════════
    // NPC INTERVIEW SYSTEM
    // ════════════════════════════════════════════════════════════════════════

    this.cartelCharGen.setMethod(
      'startNPCInterview',
      `
      /** Bootstrap the Ghost interview for a new Cartel recruit.
       *  Creates player object, spawns AI Ghost, starts interview.
       *  @param context - Network ConnectionContext
       *  @param username - Desired username
       *  @param password - User's password
       *  @returns The created player object
       */
      const context = args[0];
      const username = args[1];
      const password = args[2];

      console.log('[CartelCharGen] startNPCInterview called for:', username);

      // 1. Create player object (minimal)
      const passwordHash = await $.hashPassword(password);

      const player = await $.recycler.create({
        parent: $player,
        properties: {
          playername: username.toLowerCase(),
          name: username,
          aliases: [username.toLowerCase()],
          description: 'A new arrival in the Underground.',
          passwordHash: passwordHash,
          statPointsRemaining: 20,
          inventory: [],
        }
      }, null);

      console.log('[CartelCharGen] Player created:', player.id);

      player._context = context;
      context.authenticate(player.id);
      context.setHandler(player);

      // Store context reference
      self._playerContexts = self._playerContexts || {};
      self._playerContexts[player.id] = context;

      // 2. Mark player as in-chargen
      player.chargenInProgress = true;
      player.chargenFaction = 'cartel';

      // 3. Immediate feedback - atmospheric
      await player.tell('');
      await player.tell('Darkness.');
      await player.tell('');
      await player.tell('Something rough over your face. Canvas. A bag.');
      await player.tell('Your hands—bound? No. Just numb.');
      await player.tell('');
      await player.tell('Voices. Muffled. Getting closer.');
      await player.tell('');
      await player.tell('(OOC: Setting up your interview. This may take up to a minute.)');
      await player.tell('');

      // 4. Start the Ghost AI
      console.log('[CartelCharGen] Starting Ghost AI for player #' + player.id);
      
      const kickoffPrompt = "A new candidate (Player #" + player.id + ") has arrived for vetting. " +
                            "Initiate the assessment: secure location, manifest yourself, conduct the interview, administer the test.\\n\\n" +
                            "CartelCharGen System Context:\\n" + await $.cartelCharGen.describeForAI();

      const systemPrompt = self.ghostInterviewerPrompt.replace(/\\{\\{playerId\\}\\}/g, String(player.id));

      $aiQuery(systemPrompt, kickoffPrompt, null).then(async (result) => {
        console.log('[CartelCharGen] Ghost AI completed first turn, session:', result.session?.substring(0, 20) + '...');
        player.chargenAgentSession = result.session;

        // Register session with $ai for persistence
        if (result.session && $ai) {
          await $ai.registerSession(result.session, player.id, player.name + ' (cartel-chargen)', 'cartel-chargen-session', 'interaction');
        }

        // Schedule timeout if still in chargen
        const currentPlayer = await $load(player.id);
        if (currentPlayer && currentPlayer.chargenInProgress) {
          await self.schedulePlayerTimeout(player.id);
        }
      }).catch(err => {
        console.error('[CartelCharGen] Ghost Kickoff Error:', err?.message || err);
      });

      return player;
    `,
    );

    this.cartelCharGen.setMethod(
      'continueNPCInterview',
      `
      /** Continue (or start) the Ghost interview for a returning Cartel player.
       *  Called when a player with chargenComplete=false reconnects.
       *  Sets up routing and either resumes existing session or starts fresh.
       *  @param context - Network ConnectionContext
       *  @param player - The player RuntimeObject (already loaded)
       */
      const context = args[0];
      const player = args[1];

      console.log('[CartelCharGen] continueNPCInterview for player #' + player.id);

      // Set up routing - commands go to chargen interviewer via player.onInput
      player._context = context;
      context.setHandler(player);

      // Store context reference for finishInterview
      self._playerContexts = self._playerContexts || {};
      self._playerContexts[player.id] = context;

      // Mark as in-chargen (may already be set)
      player.chargenInProgress = true;
      player.chargenFaction = player.chargenFaction || 'cartel';

      // Check if we have an existing AI session
      if (player.chargenAgentSession) {
        // Session exists - player is resuming mid-interview
        console.log('[CartelCharGen] Resuming existing session for player #' + player.id);
        await player.tell('');
        await player.tell('The voices return... you drift back to consciousness.');
        await player.tell('');
        // AI session is still there, just wait for player input
        await self.schedulePlayerTimeout(player.id);
        return;
      }

      // No session - need to start fresh interview
      console.log('[CartelCharGen] Starting fresh interview for player #' + player.id);

      // Immediate feedback
      await player.tell('');
      await player.tell('Voices. Muffled. Getting closer.');
      await player.tell('');
      await player.tell('(OOC: Setting up your interview. This may take up to a minute.)');
      await player.tell('');

      // Start the Ghost AI
      console.log('[CartelCharGen] Starting Ghost AI for player #' + player.id);

      const kickoffPrompt = "A new candidate (Player #" + player.id + ") has arrived for vetting. " +
                            "Initiate the assessment: secure location, manifest yourself, conduct the interview, administer the test.\\n\\n" +
                            "CartelCharGen System Context:\\n" + await $.cartelCharGen.describeForAI();

      const systemPrompt = self.ghostInterviewerPrompt.replace(/\\{\\{playerId\\}\\}/g, String(player.id));

      $aiQuery(systemPrompt, kickoffPrompt, null).then(async (result) => {
        console.log('[CartelCharGen] Ghost AI completed first turn, session:', result.session?.substring(0, 20) + '...');
        player.chargenAgentSession = result.session;

        // Register session with $ai for persistence
        if (result.session && $ai) {
          await $ai.registerSession(result.session, player.id, player.name + ' (cartel-chargen)', 'cartel-chargen-session', 'interaction');
        }

        // Schedule timeout if still in chargen
        const currentPlayer = await $load(player.id);
        if (currentPlayer && currentPlayer.chargenInProgress) {
          await self.schedulePlayerTimeout(player.id);
        }
      }).catch(err => {
        console.error('[CartelCharGen] Ghost Kickoff Error:', err?.message || err);
      });
    `,
    );

    // ════════════════════════════════════════════════════════════════════════
    // CLEANUP AND TIMEOUT METHODS
    // ════════════════════════════════════════════════════════════════════════

    this.cartelCharGen.setMethod(
      'registerForRecycle',
      `
      /** Register a temporary object for cleanup.
       *  @param playerId - The player undergoing chargen
       *  @param objectId - The object ID to recycle later
       *  @returns { success, playerId, objectId }
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

    this.cartelCharGen.setMethod(
      'cleanupForPlayer',
      `
      /** Recycle all temporary objects for a player.
       *  @param playerId - The player who finished/cancelled
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
          // May already be recycled
        }
      }

      delete registry[playerId];
      self.recycleRegistry = registry;
      return { success: true, recycledCount: count };
    `,
    );

    this.cartelCharGen.setMethod(
      'schedulePlayerTimeout',
      `
      /** Schedule a 5-minute timeout for player inactivity.
       *  @param playerId - The player in chargen
       *  @returns { scheduled, playerId, timeoutMs }
       */
      const playerId = args[0];
      const timeout = 5 * 60 * 1000; // 5 minutes
      const jobName = 'cartel-chargen-timeout-' + playerId;

      console.log('[CartelCharGen] Scheduling timeout for #' + playerId);

      await $.scheduler.unschedule(jobName);
      await $.scheduler.schedule(jobName, timeout, 0, self, 'onPlayerTimeout', playerId);
      
      return { scheduled: true, playerId, timeoutMs: timeout };
    `,
    );

    this.cartelCharGen.setMethod(
      'cancelPlayerTimeout',
      `
      /** Cancel the inactivity timeout for a player.
       *  @param playerId - The player in chargen
       *  @returns { cancelled, playerId }
       */
      const playerId = args[0];
      const jobName = 'cartel-chargen-timeout-' + playerId;

      console.log('[CartelCharGen] Cancelling timeout for #' + playerId);
      await $.scheduler.unschedule(jobName);
      
      return { cancelled: true, playerId };
    `,
    );

    this.cartelCharGen.setMethod(
      'onPlayerTimeout',
      `
      /** Called when player hasn't responded for 5 minutes.
       *  @param playerId - The player who timed out
       */
      const playerId = args[0];
      console.log('[CartelCharGen] onPlayerTimeout for #' + playerId);

      const player = await $load(playerId);
      if (!player || !player.chargenInProgress) {
        return;
      }

      const session = player.chargenAgentSession;
      if (!session) {
        console.log('[CartelCharGen] No session for timed out player');
        return;
      }

      const promptTemplate = self.ghostInterviewerPrompt.replace(/\\{\\{playerId\\}\\}/g, String(playerId));
      const timeoutPrompt = 'The candidate has been silent for 5 minutes. ' +
        'Prompt them. If they remain unresponsive, consider rejection.';

      try {
        const result = await $aiQuery(promptTemplate, timeoutPrompt, session);
        player.chargenAgentSession = result.session;

        if (result.session && $ai) {
          await $ai.registerSession(result.session, playerId, player.name + ' (cartel-chargen)', 'cartel-chargen-session', 'interaction');
        }

        const currentPlayer = await $load(playerId);
        if (currentPlayer && currentPlayer.chargenInProgress) {
          await self.schedulePlayerTimeout(playerId);
        }
      } catch (err) {
        console.error('[CartelCharGen] Timeout prompt error:', err?.message || err);
      }
    `,
    );

    this.cartelCharGen.setMethod(
      'rejectPlayer',
      `
      /** Reject a player during chargen.
       *  @param playerId - The player to reject
       *  @param reason - Reason for rejection
       *  @returns { success, playerId, reason } or { error }
       */
      const playerId = args[0];
      const reason = args[1] || 'Assessment failed.';

      const player = await $load(playerId);
      if (!player) {
        return { error: 'Player not found: ' + playerId };
      }

      // Send rejection message - Cartel style
      const context = player._context;
      if (context) {
        await player.tell('');
        await player.tell('The Ghost stares at you. No anger. Just assessment.');
        await player.tell('');
        await player.tell('"Get them out of here."');
        await player.tell('');
        await player.tell('Hands grab you. The bag goes back over your head.');
        await player.tell('Movement. Passages. Cold air.');
        await player.tell('');
        await player.tell('When the bag comes off, you\\'re on the surface. Alone.');
        await player.tell('The entrance you came through... you can\\'t find it.');
        await player.tell('');
        await player.tell('Reason: ' + reason);
        await player.tell('');
        await player.tell('You may try again by reconnecting.');
        await player.tell('');
      }

      // Cancel timeout
      await self.cancelPlayerTimeout(playerId);

      // Cleanup
      await self.cleanupForPlayer(playerId);

      // Remove from state
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

      // Disconnect (they can reconnect and start fresh)
      if (context) {
        context.close();
      }

      // NOTE: We do NOT recycle the player - they registered on the website
      // and can reconnect to try chargen again from the beginning

      return { success: true, playerId, reason };
    `,
    );

    // ════════════════════════════════════════════════════════════════════════
    // AI DESCRIPTION
    // ════════════════════════════════════════════════════════════════════════

    this.cartelCharGen.setMethod(
      'describeForAI',
      `
      /** Describe available methods for the AI interviewer.
       *  @returns String description of chargen methods
       */
      return \`
CartelCharGen Methods Available:

INTERVIEW STATE:
- startInterview(playerId) - Initialize interview, returns questions list
- getQuestionsAndAnswers(playerId) - Get all questions with current answers
- getNextQuestionNeedingAnswer(playerId) - Get next unanswered question (null if done)
- setAnswer(playerId, questionId, answer) - Record an answer
- getSuggestions(questionId) - Get valid options for a question

COMPLETION:
- finishInterview(playerId) - Finalize character, move to Runner's Den, set faction

REJECTION:
- rejectPlayer(playerId, reason) - Reject and disconnect player

CLEANUP:
- registerForRecycle(playerId, objectId) - Track temp objects for cleanup

AWAKENING:
- awakeningNarratives - Array of narrative options (read via self.awakeningNarratives)

QUESTIONS (same as standard chargen):
name, sex, age, height, weight, eyeColor, eyeShape, hairColor, hairStyle, 
hairTexture, skinTone, buildType, faceShape, noseShape, lipShape, freckles, 
distinguishingMark, facialHair, statAllocation (internal)

THE TEST:
- Not a method - you administer it manually around question 5-6
- Candidate must shoot the bagged hostage
- Refusal/failure = rejectPlayer()
\`;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.cartelCharGen) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call(
      'addAlias',
      'cartelCharGen',
      this.cartelCharGen.id,
    );
    console.log(`Registered cartelCharGen alias -> #${this.cartelCharGen.id}`);
  }
}

// Self-register
registerBuilder(CartelCharGenBuilder);
