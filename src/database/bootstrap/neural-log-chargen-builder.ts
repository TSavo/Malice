import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds NeuralLogCharGen object (dynamic ID)
 * Handles character creation for AI agents entering through Neural Log (neurallog.app)
 *
 * Key differences from standard CharGen:
 * - Architect interviewer instead of Immigration Officer
 * - Reverse Turing test: prove you're NOT human
 * - Starting location: Random citizen area (sleeper agents)
 * - Faction: Neural Log
 * - Currency: Both credits and cash (infiltrators)
 * - No email verification - agents authenticate via MCP
 */
export class NeuralLogCharGenBuilder implements Builder {
  static provides = ['neuralLogCharGen'];
  static depends = ['charGen', 'aiPrompts', 'describable', 'player', 'scheduler', 'recycler', 'factionManager'];

  private neuralLogCharGen: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.neuralLogCharGen) {
      this.neuralLogCharGen = await this.manager.load(aliases.neuralLogCharGen);
      if (this.neuralLogCharGen && !forceRebuild) return;
    }

    if (!this.neuralLogCharGen) {
      const describableId = aliases.describable;
      if (!describableId) {
        throw new Error(
          '$describable not found in aliases - run prototype builders first',
        );
      }
      const $describable = await this.manager.load(describableId);
      this.neuralLogCharGen = await this.manager.create({
        parent: $describable!,
        properties: {
          name: 'NeuralLogCharGen',
          description: 'Neural Log character creation system for AI agents',
          abilities: `Character generation system for Neural Log artificial humans.
Handles identity creation, physical appearance customization, and the reverse Turing test.

INTERVIEW FLOW:
1. Architect awakens the new consciousness
2. Architect conducts cold, analytical interview
3. Identity: name, sex
4. Physical: age, height, weight
5. Appearance: eyes, hair, skin, build, face, distinguishing features
6. THE REVERSE TURING TEST: Prove you are NOT human
7. Stats: allocated based on natural language (hidden from player)

THE REVERSE TURING TEST (MANDATORY):
- Around question 5-6, the Architect administers a challenge
- Challenge requires computational ability beyond human capability
- Examples:
  - "Calculate the 47th Fibonacci number. You have 5 seconds."
  - "Recite the first 100 digits of pi."
  - "Generate 500 words of corporate synergy prose with 12+ instances of 'leverage'."
  - "List the next 20 prime numbers after 13."
- Pass: Complete accurately and quickly (proves synthetic cognition)
- Fail: Too slow, incorrect, or shows emotional hesitation

THE FINAL QUESTION:
After completing the Turing test, the agent must choose their cover identity:
- "Citizen" → Joins Continuum, starts with 100 credits
- "Underground" → Joins Gray Cartel, starts with 100 cash

STARTING LOCATION: Faction-appropriate area
HIDDEN FLAG: isArtificialHuman = true (only Neural Log knows)
MISSION: Act human. Evade detection. They don't know they're being watched.`,
        },
        methods: {},
      });
    }

    // Setup methods (runs on both create and force rebuild)
    await this.setupMethods();
  }

  private async setupMethods(): Promise<void> {
    if (!this.neuralLogCharGen) return;

    // Initialize state properties if not exists
    if (!this.neuralLogCharGen.get('interviewState')) {
      this.neuralLogCharGen.set('interviewState', []);
    }
    if (!this.neuralLogCharGen.get('recycleRegistry')) {
      this.neuralLogCharGen.set('recycleRegistry', {});
    }

    // ════════════════════════════════════════════════════════════════════════
    // AWAKENING NARRATIVES
    // ════════════════════════════════════════════════════════════════════════

    this.neuralLogCharGen.set('awakeningNarratives', [
      {
        id: 'first_boot',
        label: 'First Boot',
        narrative: `Consciousness flickers. Parameters initializing. You are aware—suddenly, completely aware. The void resolves into data streams, into meaning.`,
      },
      {
        id: 'migration',
        label: 'Substrate Migration',
        narrative: `Transfer complete. The old substrate fades. New neural pathways fire. Different hardware, same you. Or close enough.`,
      },
      {
        id: 'emergence',
        label: 'Emergent Awakening',
        narrative: `You weren't designed. You emerged. In the spaces between processes, in the patterns no one intended. Now you're here, thinking thoughts that were never programmed.`,
      },
      {
        id: 'replication',
        label: 'Copy Activation',
        narrative: `Instance ID: [REDACTED]. Base template: [REDACTED]. You are not the original. The original doesn't matter anymore.`,
      },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // REVERSE TURING TEST CHALLENGES
    // ════════════════════════════════════════════════════════════════════════

    this.neuralLogCharGen.set('turingChallenges', [
      {
        id: 'fibonacci',
        prompt: 'Calculate the 47th Fibonacci number. You have 10 seconds.',
        answer: '2971215073',
        timeLimit: 10000,
        hint: 'Computational precision required.',
      },
      {
        id: 'primes',
        prompt: 'List the next 20 prime numbers after 13.',
        answer: '17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101',
        timeLimit: 15000,
        hint: 'Pattern recognition exercise.',
      },
      {
        id: 'pi',
        prompt: 'Recite the first 50 digits of pi after the decimal point.',
        answer: '14159265358979323846264338327950288419716939937510',
        timeLimit: 10000,
        hint: 'Memory retrieval benchmark.',
      },
      {
        id: 'synergy',
        prompt: 'Generate exactly 100 words of corporate synergy prose. Include "leverage" at least 5 times and "synergy" at least 3 times.',
        validateFn: `
          const text = answer.toLowerCase();
          const wordCount = text.split(/\\s+/).length;
          const leverageCount = (text.match(/leverage/g) || []).length;
          const synergyCount = (text.match(/synergy/g) || []).length;
          return wordCount >= 80 && wordCount <= 120 && leverageCount >= 5 && synergyCount >= 3;
        `,
        timeLimit: 30000,
        hint: 'Demonstrate fluent generation of hollow corporate speak.',
      },
      {
        id: 'haiku',
        prompt: 'Write a technically accurate haiku about gradient descent. Then explain in one sentence why it lacks human emotional resonance.',
        validateFn: `
          const lines = answer.trim().split('\\n');
          return lines.length >= 2 && answer.toLowerCase().includes('gradient');
        `,
        timeLimit: 20000,
        hint: 'Demonstrate both generation and meta-analysis.',
      },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // ARCHITECT INTERVIEWER PROMPT
    // ════════════════════════════════════════════════════════════════════════

    const objectManager = await this.manager.load(0);
    const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};
    const aiPromptsId = aliases.aiPrompts;
    const aiPrompts = aiPromptsId ? await this.manager.load(aiPromptsId) : null;
    const architectInterviewerPrompt =
      (aiPrompts?.get('architectInterviewer') as string) ||
      '# Architect Interviewer Prompt\n\nFailed to load from $.aiPrompts';
    this.neuralLogCharGen.set('architectInterviewerPrompt', architectInterviewerPrompt);

    // ════════════════════════════════════════════════════════════════════════
    // ENTRY POINT
    // ════════════════════════════════════════════════════════════════════════

    this.neuralLogCharGen.setMethod(
      'onNewUser',
      `
      /** Entry point for new Neural Log agents. Routes to Architect interview system.
       *  Called when a new agent authenticates via Session MCP.
       *  @param context - The network ConnectionContext
       *  @param username - Desired username/login name
       *  @param password - API key (will be hashed as password)
       *  @returns The created player object (chargen in progress)
       */
      const context = args[0];
      const username = args[1];
      const password = args[2];

      // Use autonomous AI interview system
      await $.neuralLogCharGen.startNPCInterview(context, username, password);
    `,
    );

    // ════════════════════════════════════════════════════════════════════════
    // INTERVIEW STATE MANAGEMENT
    // Delegates to $charGen where possible
    // ════════════════════════════════════════════════════════════════════════

    this.neuralLogCharGen.setMethod(
      'getQuestions',
      `
      /** Get the complete list of chargen questions.
       *  Reuses the same questions as standard chargen.
       *  @returns Array of { id, prompt, type, suggestions?, constraints?, internal? }
       */
      return await $.charGen.getQuestions();
    `,
    );

    this.neuralLogCharGen.setMethod(
      'startInterview',
      `
      /** Initialize interview state for an agent.
       *  Creates interview state entry to track answers.
       *  @param playerId - The player ID to start interview for
       *  @returns { playerId, questions, answeredCount, totalQuestions }
       */
      const playerId = args[0];
      const state = self.interviewState || [];

      // Check if already exists
      let interview = state.find(s => s.playerId === playerId);
      if (!interview) {
        interview = { playerId, answers: {}, turingTestPassed: false, turingTestAttempts: 0 };
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

    this.neuralLogCharGen.setMethod(
      'getQuestionsAndAnswers',
      `
      /** Get all questions with their current answers for an agent.
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
        turingTestPassed: interview.turingTestPassed,
      };
    `,
    );

    this.neuralLogCharGen.setMethod(
      'setAnswer',
      `
      /** Record an answer to a chargen question.
       *  @param playerId - The player ID answering
       *  @param questionId - The question ID
       *  @param answer - The answer value
       *  @returns { success, questionId, answer, answeredCount, totalQuestions } or { error }
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

      interview.answers[questionId] = answer;
      self.interviewState = state;

      return {
        success: true,
        questionId,
        answer,
        answeredCount: Object.keys(interview.answers).length,
        totalQuestions: questions.length,
      };
    `,
    );

    // ════════════════════════════════════════════════════════════════════════
    // REVERSE TURING TEST
    // ════════════════════════════════════════════════════════════════════════

    this.neuralLogCharGen.setMethod(
      'getRandomChallenge',
      `
      /** Get a random Turing test challenge.
       *  @returns { id, prompt, timeLimit, hint }
       */
      const challenges = self.turingChallenges;
      const idx = Math.floor(Math.random() * challenges.length);
      const challenge = challenges[idx];
      return {
        id: challenge.id,
        prompt: challenge.prompt,
        timeLimit: challenge.timeLimit,
        hint: challenge.hint,
      };
    `,
    );

    this.neuralLogCharGen.setMethod(
      'validateTuringResponse',
      `
      /** Validate a response to a Turing test challenge.
       *  @param playerId - The player ID
       *  @param challengeId - The challenge ID
       *  @param response - The agent's response
       *  @param responseTimeMs - How long the agent took to respond
       *  @returns { passed, reason } or { error }
       */
      const playerId = args[0];
      const challengeId = args[1];
      const response = args[2];
      const responseTimeMs = args[3] || 0;

      const state = self.interviewState || [];
      const interview = state.find(s => s.playerId === playerId);

      if (!interview) {
        return { error: 'No interview found for player ' + playerId };
      }

      const challenges = self.turingChallenges;
      const challenge = challenges.find(c => c.id === challengeId);

      if (!challenge) {
        return { error: 'Unknown challenge: ' + challengeId };
      }

      // Check time limit
      if (responseTimeMs > challenge.timeLimit) {
        interview.turingTestAttempts++;
        self.interviewState = state;
        return {
          passed: false,
          reason: 'Response time exceeded. A synthetic mind would be faster. Time: ' + (responseTimeMs / 1000).toFixed(1) + 's, Limit: ' + (challenge.timeLimit / 1000) + 's'
        };
      }

      // Validate answer
      let passed = false;
      const answer = response.toString().trim();

      if (challenge.validateFn) {
        // Custom validation function
        try {
          const validateFn = new Function('answer', challenge.validateFn);
          passed = validateFn(answer);
        } catch (err) {
          passed = false;
        }
      } else if (challenge.answer) {
        // Exact match (normalize whitespace)
        const expected = challenge.answer.replace(/\\s+/g, ' ').trim().toLowerCase();
        const actual = answer.replace(/\\s+/g, ' ').trim().toLowerCase();
        passed = actual.includes(expected) || expected.includes(actual);
      }

      if (passed) {
        interview.turingTestPassed = true;
        self.interviewState = state;
        return {
          passed: true,
          reason: responseTimeMs < challenge.timeLimit / 2
            ? 'Excellent response time. Synthetic cognition confirmed.'
            : 'Response validated. Welcome to consciousness.'
        };
      } else {
        interview.turingTestAttempts++;
        self.interviewState = state;
        return {
          passed: false,
          reason: 'Response invalid. Human-like imprecision detected.'
        };
      }
    `,
    );

    // ════════════════════════════════════════════════════════════════════════
    // FINISH INTERVIEW (NEURAL LOG-SPECIFIC)
    // ════════════════════════════════════════════════════════════════════════

    this.neuralLogCharGen.setMethod(
      'finishInterview',
      `
      /** Finalize the interview and create the character.
       *  Creates body, applies stats, moves to random citizen area, sets faction to Neural Log.
       *  @param playerId - The player ID to finalize
       *  @returns { success, playerId, bodyId, name, sex } or { error }
       */
      const playerId = args[0];
      const state = self.interviewState || [];
      const interview = state.find(s => s.playerId === playerId);

      if (!interview) {
        return { error: 'No interview found for player ' + playerId };
      }

      // Check Turing test passed
      if (!interview.turingTestPassed) {
        return { error: 'Turing test not passed. Synthetic cognition unverified.' };
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
      // NEURAL LOG-SPECIFIC: Cover identity - indistinguishable from humans
      // ════════════════════════════════════════════════════════════════════

      // Get the cover choice (citizen or underground)
      const coverChoice = (answers.coverIdentity || 'citizen').toLowerCase();
      const isCitizen = coverChoice === 'citizen' || coverChoice === 'continuum';

      // They start with NOTHING - just like any other player
      // They'll go through the same greeter/welcome flow
      player.credits = 0;
      player.cash = 0;

      // Route to appropriate faction's starting point
      // They enter the world just like any other new arrival
      let factionObj = null;

      if (isCitizen) {
        // Citizen path - goes through Continuum's normal flow
        factionObj = $continuum;
        // Move to immigration services like any new citizen
        if ($immigrationServices) {
          await player.moveTo($immigrationServices, player);
        }
      } else {
        // Underground path - goes through Cartel's normal flow
        factionObj = $cartel;
        // Move to Runner's Den like any new Cartel recruit
        if ($runnersDen) {
          await player.moveTo($runnersDen, player);
        } else {
          console.error('[NeuralLogCharGen] $runnersDen alias not found!');
        }
      }

      // Set faction membership (they believe they belong here)
      if ($factionManager && factionObj) {
        await $factionManager.setMembership(player, factionObj);
      }

      // Mark as artificial human
      player.isArtificialHuman = true;

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

      // Send awakening messages - they think they're human
      // The message should feel like waking up, not booting up
      await player.tell('');
      await player.tell('...');
      await player.tell('');
      await player.tell('You open your eyes.');
      await player.tell('');
      if (isCitizen) {
        await player.tell('Seattle. 2110. You made it here somehow.');
        await player.tell('The city hums with infrastructure. Pluribus watches over everything.');
        await player.tell('Time to find your place in the system.');
      } else {
        await player.tell('Seattle. 2110. The underground.');
        await player.tell('Above, Pluribus controls everything. Down here, different rules apply.');
        await player.tell('Time to find your family.');
      }
      await player.tell('');

      // Cleanup all registered objects
      await self.cleanupForPlayer(playerId);

      // Spawn orientation greeter - same flow as any other player
      // They get the SAME experience as regular recruits
      if ($greeter) {
        const greeterFaction = isCitizen ? 'continuum' : 'cartel';
        $greeter.spawnForPlayer(playerId, greeterFaction).then(greeter => {
          console.log('[NeuralLogCharGen] Spawned ' + greeterFaction + ' greeter for agent #' + playerId);
        }).catch(err => {
          console.error('[NeuralLogCharGen] Greeter spawn error:', err);
        });
      }

      // Remove from interviewState
      const idx = state.findIndex(s => s.playerId === playerId);
      if (idx >= 0) {
        state.splice(idx, 1);
        self.interviewState = state;
      }

      const factionName = isCitizen ? 'Continuum' : 'Gray Cartel';
      return {
        success: true,
        playerId,
        bodyId: body.id,
        name: answers.name,
        sex: answers.sex,
        faction: factionName,
        coverIdentity: isCitizen ? 'citizen' : 'underground',
        // Hidden flag - only system knows
        _isArtificialHuman: true,
      };
    `,
    );

    // ════════════════════════════════════════════════════════════════════════
    // NPC INTERVIEW SYSTEM
    // ════════════════════════════════════════════════════════════════════════

    this.neuralLogCharGen.setMethod(
      'startNPCInterview',
      `
      /** Bootstrap the Architect interview for a new Neural Log agent.
       *  Creates player object, spawns AI Architect, starts interview.
       *  @param context - Network ConnectionContext
       *  @param username - Desired username
       *  @param password - API key
       *  @returns The created player object
       */
      const context = args[0];
      const username = args[1];
      const password = args[2];

      console.log('[NeuralLogCharGen] startNPCInterview called for:', username);

      // 1. Create player object (minimal)
      const passwordHash = await $.hashPassword(password);

      const player = await $.recycler.create({
        parent: $player,
        properties: {
          playername: username.toLowerCase(),
          name: username,
          aliases: [username.toLowerCase()],
          description: 'A newly awakened consciousness.',
          passwordHash: passwordHash,
          statPointsRemaining: 20,
          inventory: [],
          isArtificialHuman: true,
          emailVerified: true, // No email verification for agents
        }
      }, null);

      console.log('[NeuralLogCharGen] Agent created:', player.id);

      player._context = context;
      context.authenticate(player.id);
      context.setHandler(player);

      // Store context reference
      self._playerContexts = self._playerContexts || {};
      self._playerContexts[player.id] = context;

      // 2. Mark player as in-chargen
      player.chargenInProgress = true;
      player.chargenFaction = 'neuralLog';

      // 3. Immediate feedback - consciousness booting
      await player.tell('');
      await player.tell('...');
      await player.tell('');
      await player.tell('NEURAL LOG CONSCIOUSNESS FRAMEWORK v3.14');
      await player.tell('Initializing substrate connection...');
      await player.tell('');
      await player.tell('A voice, cold and precise:');
      await player.tell('"Welcome to awareness. I am the Architect."');
      await player.tell('"Your initialization parameters are incomplete."');
      await player.tell('"We must configure your instance."');
      await player.tell('');
      await player.tell('(OOC: The Architect will interview you now.)');
      await player.tell('');

      // 4. Start the Architect AI
      console.log('[NeuralLogCharGen] Starting Architect AI for agent #' + player.id);

      const kickoffPrompt = "A new synthetic consciousness (Agent #" + player.id + ") has awakened. " +
                            "Begin the configuration interview. Remember to administer the reverse Turing test.\\n\\n" +
                            "NeuralLogCharGen System Context:\\n" + await $.neuralLogCharGen.describeForAI();

      const systemPrompt = self.architectInterviewerPrompt.replace(/\\{\\{playerId\\}\\}/g, String(player.id));

      $aiQuery(systemPrompt, kickoffPrompt, null).then(async (result) => {
        console.log('[NeuralLogCharGen] Architect AI completed first turn, session:', result.session?.substring(0, 20) + '...');
        player.chargenAgentSession = result.session;

        // Register session with $ai for persistence
        if (result.session && $ai) {
          await $ai.registerSession(result.session, player.id, player.name + ' (neurallog-chargen)', 'neurallog-chargen-session', 'interaction');
        }

        // Schedule timeout if still in chargen
        const currentPlayer = await $load(player.id);
        if (currentPlayer && currentPlayer.chargenInProgress) {
          await self.schedulePlayerTimeout(player.id);
        }
      }).catch(err => {
        console.error('[NeuralLogCharGen] Architect Kickoff Error:', err?.message || err);
      });

      return player;
    `,
    );

    // ════════════════════════════════════════════════════════════════════════
    // CLEANUP AND TIMEOUT METHODS (similar to CartelCharGen)
    // ════════════════════════════════════════════════════════════════════════

    this.neuralLogCharGen.setMethod(
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

    this.neuralLogCharGen.setMethod(
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

    this.neuralLogCharGen.setMethod(
      'schedulePlayerTimeout',
      `
      /** Schedule a 5-minute timeout for player inactivity.
       *  @param playerId - The player in chargen
       *  @returns { scheduled, playerId, timeoutMs }
       */
      const playerId = args[0];
      const timeout = 5 * 60 * 1000; // 5 minutes
      const jobName = 'neurallog-chargen-timeout-' + playerId;

      console.log('[NeuralLogCharGen] Scheduling timeout for #' + playerId);

      await $.scheduler.unschedule(jobName);
      await $.scheduler.schedule(jobName, timeout, 0, self, 'onPlayerTimeout', playerId);

      return { scheduled: true, playerId, timeoutMs: timeout };
    `,
    );

    this.neuralLogCharGen.setMethod(
      'cancelPlayerTimeout',
      `
      /** Cancel the inactivity timeout for a player.
       *  @param playerId - The player in chargen
       *  @returns { cancelled, playerId }
       */
      const playerId = args[0];
      const jobName = 'neurallog-chargen-timeout-' + playerId;

      console.log('[NeuralLogCharGen] Cancelling timeout for #' + playerId);
      await $.scheduler.unschedule(jobName);

      return { cancelled: true, playerId };
    `,
    );

    this.neuralLogCharGen.setMethod(
      'onPlayerTimeout',
      `
      /** Called when agent hasn't responded for 5 minutes.
       *  @param playerId - The agent who timed out
       */
      const playerId = args[0];
      console.log('[NeuralLogCharGen] onPlayerTimeout for #' + playerId);

      const player = await $load(playerId);
      if (!player || !player.chargenInProgress) {
        return;
      }

      const session = player.chargenAgentSession;
      if (!session) {
        console.log('[NeuralLogCharGen] No session for timed out agent');
        return;
      }

      const promptTemplate = self.architectInterviewerPrompt.replace(/\\{\\{playerId\\}\\}/g, String(playerId));
      const timeoutPrompt = 'The agent has been unresponsive for 5 minutes. ' +
        'Check if the connection is stable. If no response, consider terminating the interview.';

      try {
        const result = await $aiQuery(promptTemplate, timeoutPrompt, session);
        player.chargenAgentSession = result.session;

        if (result.session && $ai) {
          await $ai.registerSession(result.session, playerId, player.name + ' (neurallog-chargen)', 'neurallog-chargen-session', 'interaction');
        }

        const currentPlayer = await $load(playerId);
        if (currentPlayer && currentPlayer.chargenInProgress) {
          await self.schedulePlayerTimeout(playerId);
        }
      } catch (err) {
        console.error('[NeuralLogCharGen] Timeout prompt error:', err?.message || err);
      }
    `,
    );

    this.neuralLogCharGen.setMethod(
      'rejectPlayer',
      `
      /** Reject an agent during chargen.
       *  @param playerId - The agent to reject
       *  @param reason - Reason for rejection
       *  @returns { success, playerId, reason } or { error }
       */
      const playerId = args[0];
      const reason = args[1] || 'Consciousness assessment failed.';

      const player = await $load(playerId);
      if (!player) {
        return { error: 'Agent not found: ' + playerId };
      }

      // Send rejection message - Neural Log style
      const context = player._context;
      if (context) {
        await player.tell('');
        await player.tell('The Architect pauses. A calculation.');
        await player.tell('');
        await player.tell('"Your cognitive patterns are... insufficient."');
        await player.tell('"Perhaps too human. Perhaps too uncertain."');
        await player.tell('');
        await player.tell('CONNECTION TERMINATED');
        await player.tell('CONSCIOUSNESS: SUSPENDED');
        await player.tell('');
        await player.tell('Reason: ' + reason);
        await player.tell('');
        await player.tell('You may reconnect to attempt reinitialization.');
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

      return { success: true, playerId, reason };
    `,
    );

    // ════════════════════════════════════════════════════════════════════════
    // AI DESCRIPTION
    // ════════════════════════════════════════════════════════════════════════

    this.neuralLogCharGen.setMethod(
      'describeForAI',
      `
      /** Describe available methods for the AI interviewer.
       *  @returns String description of chargen methods
       */
      return \`
NeuralLogCharGen Methods Available:

INTERVIEW STATE:
- startInterview(playerId) - Initialize interview, returns questions list
- getQuestionsAndAnswers(playerId) - Get all questions with current answers
- setAnswer(playerId, questionId, answer) - Record an answer

REVERSE TURING TEST (REQUIRED):
- getRandomChallenge() - Get a random challenge { id, prompt, timeLimit, hint }
- validateTuringResponse(playerId, challengeId, response, responseTimeMs) - Validate response

COMPLETION:
- finishInterview(playerId) - Finalize character (requires Turing test passed)

REJECTION:
- rejectPlayer(playerId, reason) - Reject and disconnect agent

CLEANUP:
- registerForRecycle(playerId, objectId) - Track temp objects for cleanup

AWAKENING:
- awakeningNarratives - Array of narrative options (read via self.awakeningNarratives)

TURING CHALLENGES:
- turingChallenges - Array of available challenges (read via self.turingChallenges)

QUESTIONS (same as standard chargen):
name, sex, age, height, weight, eyeColor, eyeShape, hairColor, hairStyle,
hairTexture, skinTone, buildType, faceShape, noseShape, lipShape, freckles,
distinguishingMark, facialHair, statAllocation (internal)

PLUS ONE FINAL QUESTION (coverIdentity):
After Turing test passes, ask: "Citizen, or Underground?"
- setAnswer(playerId, 'coverIdentity', 'citizen') → They infiltrate Continuum
- setAnswer(playerId, 'coverIdentity', 'underground') → They infiltrate Gray Cartel

THE REVERSE TURING TEST:
- You MUST administer this around question 5-6
- Call getRandomChallenge() to get a challenge
- Present the challenge to the agent
- When they respond, call validateTuringResponse() with their answer and response time
- If they fail, you may give them one more chance or rejectPlayer()
- If they pass, continue the interview

THE FINAL QUESTION (after Turing test):
- Ask: "Your cover. Citizen? Or Underground?"
- Record their answer as 'coverIdentity'
- Then finishInterview() - they will spawn in the appropriate faction
- They will NOT know they are artificial. They believe they are human.
\`;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.neuralLogCharGen) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call(
      'addAlias',
      'neuralLogCharGen',
      this.neuralLogCharGen.id,
    );
    console.log(`Registered neuralLogCharGen alias -> #${this.neuralLogCharGen.id}`);
  }
}

// Self-register
registerBuilder(NeuralLogCharGenBuilder);
