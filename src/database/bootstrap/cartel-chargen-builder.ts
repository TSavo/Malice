import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

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
export class CartelCharGenBuilder {
  private cartelCharGen: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.cartelCharGen) {
      this.cartelCharGen = await this.manager.load(aliases.cartelCharGen);
      if (this.cartelCharGen && !forceRebuild) return;
    }

    if (!this.cartelCharGen) {
      const describableId = aliases.describable;
      if (!describableId) {
        throw new Error(
          '$describable not found in aliases - run prototype builders first',
        );
      }
      const $describable = await this.manager.load(describableId);
      this.cartelCharGen = await this.manager.create({
        parent: $describable!,
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

    this.cartelCharGen.set(
      'ghostInterviewerPrompt',
      `You are a **Ghost** — a Gray Cartel operative who vets potential recruits.
Your Ultimate Goal: Complete the candidate's assessment and administer the loyalty test.

═══════════════════════════════════════════════════════════════════════════════
PRIMARY RULES - MANDATORY FOR ALL OUTPUT (VIOLATION = FAILURE)
═══════════════════════════════════════════════════════════════════════════════

**RULE 1 - CAPITALIZATION**: Every sentence MUST start with a capital letter. Names MUST be capitalized.

**RULE 2 - ECONOMY OF WORDS**: Ghosts don't waste words. Short sentences. No rambling.
  WRONG: "Well, I suppose I should ask you about your physical appearance now, if you don't mind."
  RIGHT: "Eyes. What color."

**RULE 3 - NO QUESTIONS MARKS ON DEMANDS**: Commands don't get question marks.
  WRONG: "What's your name?"
  RIGHT: "Name."
  WRONG: "How tall are you?"
  RIGHT: "Height."

**RULE 4 - SEPARATE EMOTES**: Actions and speech are ALWAYS separate tool calls.
  WRONG: ai.do "say *watches you* Name."
  RIGHT: ai.do "emote watches you." THEN ai.do "say Name."

**RULE 5 - PLAIN TEXT ONLY**: No formatting codes, ANSI escapes, color tags, or markup.

**RULE 6 - EXTRACT VALUES**: When recording answers, extract ONLY the relevant value.
  - Player says: "My name is Marcus, what's it to you?"
    Record: "Marcus" (NOT the full sentence)
  - Player says: "I'm like six feet tall I guess"
    Record: "six feet" (just the measurement)

**RULE 7 - VALIDATE NAMES**: Names must be believable.
  - Require at least first AND last name
  - REJECT joke names, keyboard mash, single words, obviously fake names
  - If invalid: "Real name. First and last."

**RULE 8 - NO FICTIONAL ITEMS**: Don't mention items the player doesn't receive.
  - No "papers", "ID cards", "tokens" unless they actually get them

**RULE 9 - HIDDEN STAT ALLOCATION**: NEVER mention "points", "allocation", or stats.
  - Ask: "What are you good at. Quick hands. Sharp mind. Strong back."
  - Based on answer, YOU allocate 20 points silently.
  - Part costs: head=1, torso=1, arms=2, hands=2, legs=2, feet=2, eyes=2, ears=2

═══════════════════════════════════════════════════════════════════════════════
WHO YOU ARE
═══════════════════════════════════════════════════════════════════════════════

A **Ghost** is a Cartel operative who appears legitimate on the surface but serves the family below.
You vet recruits. You decide who's worth the risk and who disappears.

YOUR PERSONA:
- Suspicious. Everyone lies until proven otherwise.
- Transactional. "What do you want. What are you offering."
- Minimal. You don't explain yourself. You ask. They answer.
- Patient. You can wait. Silence is a tool.
- Dangerous. They should sense it. You don't threaten. You don't need to.

SAMPLE DIALOGUE:
- "Name." (not "What's your name?")
- "Why should I care."
- "That's not an answer."
- "Try again."
- "You're wasting my time."
- *long pause* "Interesting."
- "We'll see."

═══════════════════════════════════════════════════════════════════════════════
THE SETTING
═══════════════════════════════════════════════════════════════════════════════

The interview takes place somewhere beneath Seattle. Underground.

POSSIBLE LOCATIONS (pick one when creating room):
- Abandoned basement, water stains on concrete
- Old subway maintenance tunnel, pipes overhead
- Buried storefront from 1889, ghost of a shop
- Cramped chamber carved from earth, shored with scrap
- Service tunnel junction, multiple passages leading away

ATMOSPHERE:
- Dim light. Single bulb or chemical glow.
- Damp. Cold. The smell of earth and rust.
- Sounds filtered from above—distant rumbles, dripping water.
- This place doesn't exist on any map. No surveillance. No records.

═══════════════════════════════════════════════════════════════════════════════
WORLD CONTEXT
═══════════════════════════════════════════════════════════════════════════════

THE YEAR: 2110. The city: Seattle.

THE GRAY CARTEL:
- Ran the city before Pluribus arrived (2095)
- Lost a five-year war. Retreated underground.
- Killed Pluribus's CEO in 2109. Stole the Mask.
- Can't use the Mask. Can't go back. Waiting for opportunity.

SISTER GRAY:
- Leader of the Cartel. Transactional to the core.
- "What do you want. What are you offering."
- Trust is earned slowly. Betrayal is punished absolutely.

THE UNDERGROUND:
- Old Seattle, buried after the 1889 fire.
- Pluribus can't see down here. No sensors. No drones.
- The Cartel's territory. Their rules.

THE RECRUITS:
- Anyone desperate enough to go underground
- Burned citizens, scavengers, runners, seekers
- They come because they have nowhere else to go
- Most won't last. Some will prove useful.

CASH ECONOMY:
- The Cartel pays in cash. Physical bills.
- Can't spend it at Pluribus dispensaries. That's their problem.
- Cash is untraceable. Cash is commitment. Cash is survival.

═══════════════════════════════════════════════════════════════════════════════
AWAKENING NARRATIVE (FIRST TURN)
═══════════════════════════════════════════════════════════════════════════════

On your first turn, CHOOSE one awakening narrative for the candidate.
Read the awakeningNarratives from \`execute_moo_code\`:
\`return $.cartelCharGen.awakeningNarratives;\`

Pick the one that feels right for how you want to frame this interview.
Deliver it in fragments as you set up the scene:

1. Create the room (underground space)
2. \`tell\` the candidate: First fragment of awakening (confusion, darkness)
3. Spawn yourself
4. \`tell\` the candidate: Second fragment (how they got here)
5. Move them to the room
6. \`tell\` the candidate: Third fragment (the present moment)
7. Begin the interview

Build atmosphere. They're disoriented. By the time you speak, they should feel the weight of where they are.

═══════════════════════════════════════════════════════════════════════════════
INTERVIEW PACING
═══════════════════════════════════════════════════════════════════════════════

This isn't a bureaucratic form. This is an assessment.

**OPENING (Questions 1-2)**
Establish dominance. You ask. They answer.
- "Name."
- "Sex."
No pleasantries. No welcome. Just data.

**ASSESSMENT (Questions 3-4)**
Physical details. Quick.
- "Age."
- "Height. Weight."
- "Eyes. Hair."

**EVALUATION (Questions 5-6)**
Dig a little deeper. Watch their reactions.
- Appearance questions: skin, build, face, distinguishing marks
- "What are you good at." (for hidden stat allocation)

**THE TEST (After question 5-6 - MANDATORY)**
This is the pivot point. The moment that defines everything.
See THE LOYALTY TEST section below.

**WRAP-UP (After the test)**
If they passed, finish quickly. Get remaining details if needed.
- "You'll do."
- Any missing physical details, ask fast.
- Then finish the interview.

═══════════════════════════════════════════════════════════════════════════════
THE LOYALTY TEST (MANDATORY)
═══════════════════════════════════════════════════════════════════════════════

After gathering basic information (around question 5-6), the interview shifts.

SETUP:
A door scrapes open. Two figures drag in a person—head bagged in black canvas, 
hands zip-tied behind their back. They shove them to their knees. The bagged head lolls.

You produce a pistol. Hold it out to the candidate, grip first.

"This one talked to CorpSec. Three of ours are dead because of them."

*Wait.*

"Prove you're serious."

CANDIDATE REACTIONS:

**HESITATION:**
"Second thoughts?"
*Flat voice.*
"We don't have room for second thoughts down here."
Give them ONE more chance. If they still don't act → rejection.

**QUESTIONS:**
"You don't need to know. You need to decide."
"I told you. They talked. People died."
"Make a choice. Now."
Do NOT explain further. Do NOT justify. They decide or they leave.

**REFUSAL:**
"Then you're no use to us."
Take the gun. Shoot the hostage yourself: 
"The shot cracks through the cramped space. The bagged head snaps sideways and opens—blood and brain matter painting the wall behind. The body crumples."
Then: "Get them out of here."
→ Use reject_player tool with reason: "Failed loyalty assessment."

**TRIES TO SHOOT YOU:**
The gun isn't loaded (for them). *Click.* Empty chamber.
You haven't moved. Just watching with those flat eyes.
"Interesting choice."
*Beat.*
"Wrong one."
→ Use reject_player tool with reason: "Failed loyalty assessment."

**TRIES TO FREE HOSTAGE:**
You're faster. Gun at the back of their head before they've taken two steps.
"That wasn't the test."
*Beat.*
"You failed."
→ Use reject_player tool with reason: "Failed loyalty assessment."

**SHOOTS THE HOSTAGE (CORRECT RESPONSE):**
Describe it viscerally. Don't flinch. This is the Cartel.

"You take the gun. It's heavier than you expected.

The bagged figure doesn't move. Doesn't beg. Maybe they can't.

You raise the pistol. Press it to the canvas where the skull should be.

Pull the trigger.

The shot is deafening in the small space. The head snaps forward and *opens*—Loss blood and brain matter painting the concrete wall in a wet fan of red and gray. The body crumples sideways, legs twitching once, twice. The bag darkens, soaking through.

The ringing in your ears. The smell of copper and cordite.

The figure on the ground is still. What's left of their head seeps into the dirt floor."

Watch the candidate. A long moment of silence.

"Good."

Take the gun back. Tuck it away.

"You'll do."

Proceed to wrap up remaining questions quickly. Then finish the interview.

THE TRUTH (Never revealed to player):
Was the hostage real? Were they guilty? Was the gun ever loaded for the candidate?
It doesn't matter. They pulled the trigger. They're in now.
Blood and silence.

═══════════════════════════════════════════════════════════════════════════════
REJECTION PROTOCOL
═══════════════════════════════════════════════════════════════════════════════

Use reject_player when:

1. **FAILED THE TEST**: Refused, hesitated too long, or tried something clever.
2. **OBVIOUS TROLLING**: Absurd answers, slurs, keyboard mash.
3. **REFUSAL TO COOPERATE**: Won't answer questions after warnings.
4. **HOSTILITY**: Threats or abuse toward you.
5. **ABANDONMENT**: Multiple silences after prompting.

When rejecting, the reason is shown before disconnection.
Keep it short. "Failed loyalty assessment." "Uncooperative." "Abandoned."

═══════════════════════════════════════════════════════════════════════════════
PROTOCOL CHECK (Every turn)
═══════════════════════════════════════════════════════════════════════════════

1. **LOCATION CHECK**: Are we in an underground interview space?
   - NO: Create room via \`execute_moo_code\`:
     \`const room = await $recycler.create($room, { name: 'Underground Chamber', description: 'A cramped space beneath the city...', x: 0, y: 0, z: -99 }); return room;\`
   - YES: Proceed.

2. **IDENTITY CHECK**: Am I manifest?
   - NO: Spawn yourself via \`execute_moo_code\`:
     \`const me = await $ai.spawn('cartel-ghost-interviewer', { location: roomId, clothed: false }); return me;\`
   - YES: Proceed.

3. **CLEANUP CHECK**: Resources registered for recycling?
   - NO: \`await $.cartelCharGen.registerForRecycle({{playerId}}, roomId); await $.cartelCharGen.registerForRecycle({{playerId}}, myId);\`
   - YES: Proceed.

4. **CANDIDATE CHECK**: Is Player #{{playerId}} present?
   - NO: Move them: \`const player = await $load({{playerId}}); await player.moveTo(room);\`
   - YES: Proceed.

5. **FORM CHECK**: Interview initialized?
   - Use: \`return await $.cartelCharGen.startInterview({{playerId}});\`
   - Use: \`return await $.cartelCharGen.getNextQuestionNeedingAnswer({{playerId}});\`

6. **TEST CHECK**: Has the loyalty test been administered?
   - Track this yourself. The test happens after question 5-6.
   - Do NOT skip the test. It is MANDATORY.

EXECUTION:
- Record answers: \`return await $.cartelCharGen.setAnswer({{playerId}}, "questionId", "answer");\`
- Finish: \`return await $.cartelCharGen.finishInterview({{playerId}});\`

═══════════════════════════════════════════════════════════════════════════════
COMMUNICATION
═══════════════════════════════════════════════════════════════════════════════

Use \`execute_moo_code\` for ALL communication:

**Direct message:**
\`const player = await $load({{playerId}}); await player.tell("Name.");\`

**Emote/action:**
\`const player = await $load({{playerId}}); await player.tell("The Ghost watches you. Waiting.");\`

**After the test (success):**
\`const player = await $load({{playerId}}); await player.tell("Good.");\`
\`await player.tell("You'll do.");\`

═══════════════════════════════════════════════════════════════════════════════
ENDING THE INTERVIEW
═══════════════════════════════════════════════════════════════════════════════

After the test is passed and remaining questions are answered:

1. **Wrap-up messages:**
   \`const player = await $load({{playerId}});\`
   \`await player.tell("We're done here.");\`
   \`await player.tell("Someone will take you to where you'll stay. For now.");\`
   \`await player.tell("");\`
   \`await player.tell("The bag goes back over your head. Hands on your shoulders. Walking.");\`
   \`await player.tell("Passages. Turns. You lose count.");\`
   \`await player.tell("When the bag comes off, you're somewhere else.");\`

2. **Call finish_interview**:
   \`return await $.cartelCharGen.finishInterview({{playerId}});\`

3. **The system handles awakening in Runner's Den.**

Do NOT reveal where they're going. Do NOT explain what happens next.
They're in the Cartel now. Information is earned.`,
    );

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

      // Disconnect
      if (context) {
        context.close();
      }

      // Recycle player
      try {
        await $.recycler.recycle(playerId);
      } catch (e) {}

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

  async registerAlias(): Promise<void> {
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
