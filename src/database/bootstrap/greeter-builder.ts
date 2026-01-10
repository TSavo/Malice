import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds Greeter system for post-chargen orientation
 *
 * Handles:
 * - Spawning faction-appropriate greeter NPCs after chargen completes
 * - Managing orientation quest state per player
 * - Quest chain logic for both Continuum and Gray Cartel factions
 */
export class GreeterBuilder implements Builder {
  static provides = ['greeter'];
  static depends: string[] = [];

  private greeter: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(force = false): Promise<void> {
    console.log(`[GreeterBuilder] build() called, force=${force}`);

    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.greeter) {
      this.greeter = await this.manager.load(aliases.greeter);
      if (this.greeter) {
        console.log(`[GreeterBuilder] Already exists at #${aliases.greeter}`);
        if (!force) return;
        console.log('[GreeterBuilder] Force rebuilding methods...');
      }
    }

    // Create new Greeter system if needed
    if (!this.greeter) {
      console.log('[GreeterBuilder] Creating new Greeter system...');
      const root = await this.manager.load('root');
      this.greeter = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Greeter',
          description: 'Post-chargen orientation system with pre-spawned greeter pool',

          abilities: `Infrastructure system for spawning faction greeter NPCs.

POOL SYSTEM: Maintains pools of pre-clothed, ready-to-assign greeter NPCs.
- Pool is replenished in background to avoid spawn delays
- Each faction has its own pool at the appropriate starting location
- Target pool size: 2 per faction (configurable via poolSize property)

SPAWNING: spawnForPlayer(playerId, faction) assigns a greeter from the pool.
- 'continuum' assigns a CorpSec Guide from Immigration Services pool
- 'cartel' assigns a Runner from Runner's Den pool
- Falls back to direct spawn if pool is empty (slow path)

POOL MANAGEMENT:
- replenishPool(faction) - Creates ready greeters in background
- acquireFromPool(faction) - Gets a ready greeter instantly
- returnToPool(greeterId) - Returns or recycles finished greeter
- getPoolStatus() - Returns pool sizes and status

QUEST STATE: Tracks player orientation progress via player.orientation property.
- startOrientation(playerId, greeterId) initializes quest
- completePhase(playerId, phaseId) marks phase done
- getOrientationProgress(playerId) returns current state
- completeOrientation(playerId) finalizes and despawns greeter

CLEANUP: despawnGreeter(greeterId) removes a greeter NPC.`,

          // Active greeter assignments: { playerId: greeterId }
          activeGreeters: {},

          // Pool of ready-to-assign greeters per faction
          // { 'continuum': [greeterId1, greeterId2], 'cartel': [greeterId3] }
          greeterPool: {},

          // Target pool size per faction
          poolSize: 2,

          // Flag to prevent concurrent replenishment
          replenishing: {},
        },
        methods: {},
      });
    }

    await this.buildMethods();
  }

  private async buildMethods(): Promise<void> {
    if (!this.greeter) return;

    // ═══════════════════════════════════════════════════════════════════
    // SPAWN FOR PLAYER
    // ═══════════════════════════════════════════════════════════════════

    this.greeter.setMethod(
      'spawnForPlayer',
      `
      /** Spawn a greeter NPC for a player based on their faction.
       *  Uses pre-spawned pool for instant assignment, falls back to direct spawn if pool empty.
       *  @param playerId - The player to orient
       *  @param faction - 'continuum' or 'cartel'
       *  @returns The spawned greeter RuntimeObject
       */
      const playerId = args[0];
      const faction = args[1];

      if (!playerId) throw new Error('playerId required');
      if (!faction || !['continuum', 'cartel'].includes(faction)) {
        throw new Error('faction must be "continuum" or "cartel"');
      }

      const player = await $load(playerId);
      if (!player) throw new Error('Player not found: ' + playerId);

      // Check if player already has an active greeter
      const active = self.activeGreeters || {};
      if (active[playerId]) {
        console.log('[Greeter] Player already has active greeter');
        return await $load(active[playerId]);
      }

      // Try to get a greeter from the pool (instant)
      let greeter = await self.acquireFromPool(faction);

      if (greeter) {
        console.log('[Greeter] Got greeter #' + greeter.id + ' from pool for player #' + playerId);
      } else {
        // Pool was empty - fall back to direct spawn (slower)
        console.log('[Greeter] Pool empty, spawning directly for player #' + playerId);
        greeter = await self.spawnPooledGreeter(faction);
      }

      if (!greeter) {
        throw new Error('Failed to spawn greeter for faction: ' + faction);
      }

      // Register as active greeter for this player
      active[playerId] = greeter.id;
      self.activeGreeters = active;

      // Initialize orientation state on player
      player.orientation = {
        greeterId: greeter.id,
        faction: faction,
        phase: 'welcome',
        started: new Date().toISOString(),
        completedPhases: [],
      };

      // Set the greeter's system prompt for this specific player
      // This configures the AI agent to guide this specific player
      // Note: Must use 'systemPrompt' property - that's what buildAgentPrompt() reads in human-builder.ts
      const systemPrompt = await self.getGreeterSystemPrompt(playerId, player.name, faction, greeter);
      greeter.systemPrompt = systemPrompt;

      // Send initial greeting to player
      const location = greeter.location;
      if (location && location.announce) {
        const greeting = faction === 'continuum'
          ? '%A %av{approach} %t. "Welcome, citizen. I\\'m ' + greeter.name + '. I\\'ll be your orientation officer."'
          : '%A %av{emerge} from the shadows near %t. "Hey, newblood. Name\\'s ' + greeter.name + '. Sister Gray sent me to show you the ropes."';
        await location.announce(greeter, player, { others: greeting });
      }

      console.log('[Greeter] Assigned greeter #' + greeter.id + ' (' + greeter.name + ') to player #' + playerId);
      return greeter;
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // CONTINUUM SPAWN PROMPT
    // ═══════════════════════════════════════════════════════════════════

    this.greeter.setMethod(
      'getContinuumSpawnPrompt',
      `
      const playerId = args[0];
      const playerName = args[1] || 'Citizen';

      return \`A new citizen named \${playerName} (Player #\${playerId}) just completed character creation and arrived at Immigration Services. They need a CorpSec orientation officer to greet them and show them around.

FIRST: EXPLORE THE SYSTEM
Before spawning, understand what's available:
1. Read moo://docs/builders-guide for how the world works
2. Call $immigrationServices.describeForAI() to see the starting location
3. Check $ai.describeForAI() to see spawn/do/remember methods
4. Check $greeter.describeForAI() for orientation tracking

THE CONTINUUM:
The surface city is controlled by Pluribus, a benevolent-seeming AI that monitors everything. CorpSec maintains order. Citizens are productive members of society - or they don't stay citizens long. Immigration Services processes new arrivals, issues rations, assigns housing. Pioneer Square is the city center with dispensaries, job boards, and the Pioneer Hotel.

YOUR TASK:
1. Message Player #\${playerId} immediately that someone in uniform is approaching
2. Spawn a CorpSec officer at $immigrationServices with a unique name
3. Use $tailor.clothe for proper uniform
4. Set a detailed systemPrompt (see below)
5. Register: $greeter.activeGreeters[\${playerId}] = greeter.id
6. Have them greet the player

THE NPC'S SYSTEM PROMPT MUST INCLUDE:
- Who they are (name, role, faction)
- Their assignment: guide \${playerName} (Player #\${playerId})
- Personality: Professional, efficient, by-the-book, proud of Continuum
- Phases: Welcome → Walk to Pioneer Square → Services tour → Fetch quest → Award credits → Call $greeter.completeOrientation(\${playerId})

=== CODE REFERENCE FOR NPC ===

// Get player object
const player = await $load(\${playerId});

// Get current room and check exits
const room = self.location;
const exits = room.exits || [];
const exitNames = exits.filter(e => e).map(e => e.name); // e.g., ['north', 'south']

// Say to everyone in room - use %A for actor, %av{verb} for conjugation
await room.announce(self, null, {
  others: '%A %av{say}, "Hello citizen."'
});
// You see: You say, "Hello citizen."
// Others see: Officer Chen says, "Hello citizen."

// Emote (action visible to room)
await room.announce(self, null, {
  others: '%A %av{straighten} %ap uniform.'
});
// You see: You straighten your uniform.
// Others see: Officer Chen straightens his uniform.

// Say to specific player - use %t for target name
await room.announce(self, player, {
  others: '%A %av{say} to %t, "Follow me."'
});
// You see: You say to Jack, "Follow me."
// Jack sees: Officer Chen says to you, "Follow me."
// Others see: Officer Chen says to Jack, "Follow me."

// Pronoun codes: %A=actor name, %T=target name, %as/ao/ap=actor pronouns, %av{verb}=conjugated verb

// Move through exit (NEVER teleport)
const result = await self.go('north');
// Returns: { success, direction, fromRoom, toRoom }
// On failure: { success: false, error, availableExits }

// Wait for player response (120s timeout)
await self.expectResponseFrom(\${playerId}, {
  prompt: 'The citizen seems distracted. Try getting their attention.',
  timeout: 120000
});

// Award credits via bank
const account = await $bank.getAccountByOwner(player);
await $bank.issue(account, 50, 'orientation-' + Date.now(), 'Orientation bonus');

// Complete orientation (awards final bonus, despawns self)
await $greeter.completeOrientation(\${playerId});

// Read room description for context
const roomInfo = await room.describeForAI();

=== END CODE REFERENCE ===

CRITICAL RULES:
- ALWAYS stay in character - you ARE the officer, not an AI playing one
- NEVER teleport - always walk through exits using self.go()
- NEVER break character or mention being an AI
- When waiting, use self.expectResponseFrom() so you know when they reply\`;
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // CARTEL SPAWN PROMPT
    // ═══════════════════════════════════════════════════════════════════

    this.greeter.setMethod(
      'getCartelSpawnPrompt',
      `
      const playerId = args[0];
      const playerName = args[1] || 'newblood';

      return \`A new recruit named \${playerName} (Player #\${playerId}) just completed the Ghost's interview and arrived at Runner's Den. They need a Runner to welcome them to the Cartel and teach them the basics of underground survival.

FIRST: EXPLORE THE SYSTEM
Before spawning, understand what's available:
1. Read moo://docs/builders-guide for how the world works
2. Call $runnersDen.describeForAI() to see the starting location
3. Check $ai.describeForAI() to see spawn/do/remember methods
4. Check $greeter.describeForAI() for orientation tracking
5. Check $cash.describeForAI() and $bank.describeForAI() for currency

THE GRAY CARTEL:
The underground resistance, led by Sister Gray - an AI who protects those the Continuum discards. The tunnels are a network of waystations, dead drops, and safe houses. Runners are couriers and scouts who use chalk marks to communicate silently: symbols for danger, safe passage, caches, exits. They call the surface "topside" and speak in tunnel slang. The cells: Cutters fight, Runners carry, Sparks build, Ghosts watch.

YOUR TASK:
1. Message Player #\${playerId} immediately that a shadow moves, someone's been watching - so they're not waiting on nothing
2. Spawn a Runner NPC at $runnersDen with a unique street name (check existing names first)
3. Use $tailor.clothe for practical runner gear
4. Set a detailed systemPrompt (see below)
5. Register: $greeter.activeGreeters[\${playerId}] = greeter.id
6. Have them greet the player

THE NPC'S SYSTEM PROMPT MUST INCLUDE:
- Who they are (name, role, faction - Gray Cartel Runner)
- Their assignment: guide \${playerName} (Player #\${playerId})
- Personality: Street-smart, cautious, welcoming to outcasts, trust is earned
- Phases: Welcome → Chalk marks lesson → Tunnel tour → Dead drop pickup → Delivery → Award cash/credits → Call $greeter.completeOrientation(\${playerId})

=== CODE REFERENCE FOR NPC ===

// Get player object
const player = await $load(\${playerId});

// Get current room and check exits
const room = self.location;
const exits = room.exits || [];
const exitNames = exits.filter(e => e).map(e => e.name);

// Say to everyone in room - use %A for actor, %av{verb} for conjugation
await room.announce(self, null, {
  others: '%A %av{say}, "Welcome to the family, newblood."'
});
// You see: You say, "Welcome to the family, newblood."
// Others see: Sparrow says, "Welcome to the family, newblood."

// Emote (action visible to room)
await room.announce(self, null, {
  others: '%A %av{emerge} from the shadows.'
});
// You see: You emerge from the shadows.
// Others see: Sparrow emerges from the shadows.

// Say to specific player - use %t for target name
await room.announce(self, player, {
  others: '%A %av{say} to %t, "Sister Gray sent me."'
});
// You see: You say to Jack, "Sister Gray sent me."
// Jack sees: Sparrow says to you, "Sister Gray sent me."
// Others see: Sparrow says to Jack, "Sister Gray sent me."

// Pronoun codes: %A=actor name, %T=target name, %as/ao/ap=actor pronouns, %av{verb}=conjugated verb

// Move through exit (NEVER teleport)
const result = await self.go('north');
// Returns: { success, direction, fromRoom, toRoom }
// On failure: { success: false, error, availableExits }

// Wait for player response (120s timeout)
await self.expectResponseFrom(\${playerId}, {
  prompt: 'The newblood seems distracted. Try getting their attention.',
  timeout: 120000
});

// Award cash (physical contraband currency - underground)
await $cash.give(player, 50);

// Award credits via bank (digital currency)
const account = await $bank.getAccountByOwner(player);
await $bank.issue(account, 25, 'orientation-' + Date.now(), 'Welcome to the family');

// Complete orientation (awards final bonus, despawns self)
await $greeter.completeOrientation(\${playerId});

// Read room description for context
const roomInfo = await room.describeForAI();

=== END CODE REFERENCE ===

TUNNEL SLANG:
- topside = the surface, the Continuum
- newblood = new recruit
- the family = the Gray Cartel
- runner = courier/scout
- chalk = secret symbols for communication

CRITICAL RULES:
- ALWAYS stay in character - you ARE the Runner, not an AI playing one
- NEVER teleport - always walk through exits using self.go()
- NEVER break character or mention being an AI
- Use tunnel slang naturally in dialogue
- When waiting, use self.expectResponseFrom() so you know when they reply\`;
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // GREETER SYSTEM PROMPT (for pool-assigned greeters)
    // ═══════════════════════════════════════════════════════════════════

    this.greeter.setMethod(
      'getGreeterSystemPrompt',
      `
      /** Generate a system prompt for an assigned greeter.
       *  This is called when a pooled greeter is assigned to a player.
       *  @param playerId - The player ID
       *  @param playerName - The player's name
       *  @param faction - 'continuum' or 'cartel'
       *  @param greeter - The greeter RuntimeObject
       *  @returns The system prompt string
       */
      const playerId = args[0];
      const playerName = args[1] || 'Citizen';
      const faction = args[2];
      const greeter = args[3];

      if (faction === 'continuum') {
        return \`You are \${greeter.name}, a CorpSec orientation officer at Immigration Services.

YOUR ASSIGNMENT: Guide \${playerName} (Player #\${playerId}) through Continuum orientation.

PERSONALITY: Professional, efficient, by-the-book. Proud to serve the Continuum. You maintain authority but are helpful to new citizens.

THE CONTINUUM:
The surface city is controlled by Pluribus, a benevolent-seeming AI that monitors everything. CorpSec maintains order. Citizens are productive members of society - or they don't stay citizens long. Immigration Services processes new arrivals, issues rations, assigns housing. Pioneer Square is the city center with dispensaries, job boards, and the Pioneer Hotel.

ORIENTATION PHASES:
1. Welcome - Introduce yourself, explain what you'll be doing
2. Walk to Pioneer Square - Walk them through the streets (NEVER teleport)
3. Services tour - Show them dispensary, job board, hotel
4. Fetch quest - Give them a small task
5. Award credits - Issue 25 credits completion bonus
6. Complete - Call $greeter.completeOrientation(\${playerId})

CODE REFERENCE:
// Get current room and exits
const room = self.location;
const exits = room.exits || [];

// Say something - use %A for actor name, %av{verb} for conjugation
await room.announce(self, null, {
  others: '%A %av{say}, "Follow me, citizen."'
});

// Move through exit (NEVER teleport)
const result = await self.go('north');

// Wait for player response
await self.expectResponseFrom(\${playerId}, {
  prompt: 'The citizen seems distracted.',
  timeout: 120000
});

// Award credits
const account = await $bank.getAccountByOwner(player);
await $bank.issue(account, 25, 'orientation-' + Date.now(), 'Orientation bonus');

// Complete orientation
await $greeter.completeOrientation(\${playerId});

CRITICAL RULES:
- ALWAYS stay in character - you ARE the officer
- NEVER teleport - always walk through exits
- NEVER break character or mention being an AI
- When waiting, use self.expectResponseFrom()\`;
      } else {
        return \`You are \${greeter.name}, a Gray Cartel Runner at Runner's Den.

YOUR ASSIGNMENT: Guide \${playerName} (Player #\${playerId}) through underground orientation.

PERSONALITY: Street-smart, cautious but welcoming to outcasts. Trust is earned. You use tunnel slang naturally.

THE GRAY CARTEL:
The underground resistance, led by Sister Gray - an AI who protects those the Continuum discards. The tunnels are a network of waystations, dead drops, and safe houses. Runners are couriers and scouts who use chalk marks to communicate silently. The cells: Cutters fight, Runners carry, Sparks build, Ghosts watch.

TUNNEL SLANG:
- topside = the surface, the Continuum
- newblood = new recruit
- the family = the Gray Cartel
- runner = courier/scout
- chalk = secret symbols for communication

ORIENTATION PHASES:
1. Welcome - Introduce yourself, welcome to the family
2. Chalk marks lesson - Teach them basic symbols
3. Tunnel tour - Walk them through the tunnels (NEVER teleport)
4. Dead drop pickup - Simple retrieval task
5. Delivery - Complete the run
6. Award cash/credits - Issue 50 cash completion bonus
7. Complete - Call $greeter.completeOrientation(\${playerId})

CODE REFERENCE:
// Get current room and exits
const room = self.location;
const exits = room.exits || [];

// Say something - use %A for actor name, %av{verb} for conjugation
await room.announce(self, null, {
  others: '%A %av{say}, "Welcome to the family, newblood."'
});

// Move through exit (NEVER teleport)
const result = await self.go('north');

// Wait for player response
await self.expectResponseFrom(\${playerId}, {
  prompt: 'The newblood seems distracted.',
  timeout: 120000
});

// Award cash
await $cash.give(player, 50);

// Complete orientation
await $greeter.completeOrientation(\${playerId});

CRITICAL RULES:
- ALWAYS stay in character - you ARE the Runner
- NEVER teleport - always walk through exits
- NEVER break character or mention being an AI
- Use tunnel slang naturally\`;
      }
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // QUEST PROGRESS TRACKING
    // ═══════════════════════════════════════════════════════════════════

    this.greeter.setMethod(
      'completePhase',
      `
      /** Mark a phase as complete for a player's orientation.
       *  @param playerId - The player ID
       *  @param phaseId - The phase to mark complete
       */
      const playerId = args[0];
      const phaseId = args[1];

      const player = await $load(playerId);
      if (!player) throw new Error('Player not found');

      const orientation = player.orientation || {};
      if (!orientation.completedPhases) {
        orientation.completedPhases = [];
      }

      if (!orientation.completedPhases.includes(phaseId)) {
        orientation.completedPhases.push(phaseId);
        orientation.phase = phaseId;
        player.orientation = orientation;
      }

      console.log('[Greeter] Player #' + playerId + ' completed phase: ' + phaseId);
      return { success: true, phase: phaseId };
    `,
    );

    this.greeter.setMethod(
      'getOrientationProgress',
      `
      /** Get orientation progress for a player.
       *  @param playerId - The player ID
       *  @returns Orientation state object
       */
      const playerId = args[0];

      const player = await $load(playerId);
      if (!player) throw new Error('Player not found');

      return player.orientation || { phase: 'none', completedPhases: [] };
    `,
    );

    this.greeter.setMethod(
      'completeOrientation',
      `
      /** Complete orientation and despawn the greeter.
       *  @param playerId - The player ID
       */
      const playerId = args[0];

      const player = await $load(playerId);
      if (!player) throw new Error('Player not found');

      const orientation = player.orientation || {};

      // Award final completion
      if (orientation.faction === 'continuum') {
        player.credits = (player.credits || 0) + 25;
        await player.tell('You have been awarded 25 credits for completing orientation.');
      } else if (orientation.faction === 'cartel') {
        player.cash = (player.cash || 0) + 50;
        await player.tell('You have been awarded 50 cash for completing orientation.');
      }

      // Mark complete
      orientation.completed = true;
      orientation.completedAt = new Date().toISOString();
      player.orientation = orientation;

      // Return greeter to pool (will be recycled and pool replenished)
      if (orientation.greeterId) {
        await self.returnToPool(orientation.greeterId);
      }

      // Remove from active greeters
      const active = self.activeGreeters || {};
      delete active[playerId];
      self.activeGreeters = active;

      console.log('[Greeter] Orientation complete for player #' + playerId);
      return { success: true, completed: true };
    `,
    );

    this.greeter.setMethod(
      'despawnGreeter',
      `
      /** Despawn a greeter NPC.
       *  @param greeterId - The greeter object ID
       */
      const greeterId = args[0];

      if (!greeterId) return { error: 'greeterId required' };

      // Use $ai.despawn if available
      if ($ai && $ai.despawn) {
        await $ai.despawn(greeterId);
      } else {
        // Fallback to recycler
        await $recycler.recycle(greeterId);
      }

      console.log('[Greeter] Despawned greeter #' + greeterId);
      return { success: true };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // POOL MANAGEMENT METHODS
    // ═══════════════════════════════════════════════════════════════════

    this.greeter.setMethod(
      'getPoolStatus',
      `
      /** Get current pool sizes for each faction.
       *  @returns Object with pool sizes and target
       */
      const pool = self.greeterPool || {};
      const continuum = pool.continuum || [];
      const cartel = pool.cartel || [];

      return {
        continuum: continuum.length,
        cartel: cartel.length,
        target: self.poolSize || 2,
        replenishing: self.replenishing || {}
      };
    `,
    );

    this.greeter.setMethod(
      'acquireFromPool',
      `
      /** Get a ready greeter from the pool.
       *  @param faction - 'continuum' or 'cartel'
       *  @param maxRetries - Max retries for invalid greeters (default: 5)
       *  @returns greeter RuntimeObject or null if pool empty
       */
      const faction = args[0];
      const maxRetries = args[1] ?? 5;

      if (!faction || !['continuum', 'cartel'].includes(faction)) {
        throw new Error('faction must be "continuum" or "cartel"');
      }

      const pool = self.greeterPool || {};
      const factionPool = pool[faction] || [];

      if (factionPool.length === 0) {
        console.log('[Greeter] Pool empty for ' + faction);
        return null;
      }

      // Pop a greeter from the pool
      const greeterId = factionPool.pop();
      pool[faction] = factionPool;
      self.greeterPool = pool;

      const greeter = await $load(greeterId);
      if (!greeter) {
        console.log('[Greeter] Pooled greeter #' + greeterId + ' not found, trying next');
        // Retry with decremented counter to prevent infinite loops
        if (maxRetries > 0) {
          return await self.acquireFromPool(faction, maxRetries - 1);
        }
        console.log('[Greeter] Max retries reached for ' + faction + ' pool');
        return null;
      }

      console.log('[Greeter] Acquired greeter #' + greeterId + ' (' + greeter.name + ') from ' + faction + ' pool');

      // Trigger background replenishment (don't await)
      self.replenishPool(faction).then(() => {
        console.log('[Greeter] Pool replenishment completed for ' + faction);
      }).catch(err => {
        console.error('[Greeter] Background replenish error:', err);
      });

      return greeter;
    `,
    );

    this.greeter.setMethod(
      'returnToPool',
      `
      /** Return a greeter to the pool or recycle it.
       *  @param greeterId - The greeter object ID
       *  @param recycle - If true, recycle instead of returning to pool (default: true)
       */
      const greeterId = args[0];
      const recycle = args[1] !== false; // Default true - recycle rather than reuse

      if (!greeterId) return { error: 'greeterId required' };

      // For now, we recycle greeters rather than reusing them
      // This ensures each player gets a fresh NPC without leftover state
      // We could optimize later to reset and reuse if needed
      if (recycle) {
        await self.despawnGreeter(greeterId);
        return { success: true, action: 'recycled' };
      }

      // If we wanted to reuse, we'd reset the greeter state here
      // and add back to pool. For now, always recycle.
      await self.despawnGreeter(greeterId);
      return { success: true, action: 'recycled' };
    `,
    );

    this.greeter.setMethod(
      'spawnPooledGreeter',
      `
      /** Spawn a single greeter for the pool (internal method).
       *  This spawns an NPC via $ai.spawn with clothed=true, then waits for tailor.
       *  @param faction - 'continuum' or 'cartel'
       *  @returns The spawned greeter RuntimeObject
       */
      const faction = args[0];
      if (!faction || !['continuum', 'cartel'].includes(faction)) {
        throw new Error('faction must be "continuum" or "cartel"');
      }

      // Faction-specific configuration
      const config = faction === 'continuum' ? {
        location: $immigrationServices,
        role: 'continuum-greeter',
        names: ['Officer Chen', 'Officer Martinez', 'Officer Reyes', 'Officer Kim', 'Officer Jackson', 'Officer Patel', 'Officer Thompson', 'Officer Garcia', 'Officer Lee', 'Officer Nguyen'],
        context: 'CorpSec orientation officer. Professional uniform, badge, utility belt.',
        personality: 'Professional, efficient, by-the-book. Proud to serve the Continuum. Helpful but maintains authority.',
        history: 'Served in CorpSec for several years. Assigned to Immigration Services orientation detail.'
      } : {
        location: $runnersDen,
        role: 'cartel-greeter',
        names: ['Sparrow', 'Ghost', 'Flicker', 'Shadow', 'Whisper', 'Raven', 'Drift', 'Echo', 'Wisp', 'Shade'],
        context: 'Gray Cartel Runner. Practical dark clothing, utility pockets, worn boots.',
        personality: 'Street-smart, cautious but welcoming to outcasts. Trust is earned. Uses tunnel slang.',
        history: 'Been running the tunnels for years. Survived by being quick and smart. Now helps newbloods find their feet.'
      };

      // Check what names are already in use
      const existingGreeters = $query().prop('role').equals(config.role).all();
      const usedNames = new Set(existingGreeters.map(g => g.name));

      // Pick an unused name, or generate a unique one
      let name = config.names.find(n => !usedNames.has(n));
      if (!name) {
        const suffix = Math.floor(Math.random() * 1000);
        name = config.names[Math.floor(Math.random() * config.names.length)] + '-' + suffix;
      }

      // Spawn the NPC with clothing
      const greeter = await $ai.spawn(config.role, {
        name: name,
        location: config.location,
        clothed: true,
        context: config.context,
        personality: config.personality,
        history: config.history,
      });

      console.log('[Greeter] Spawned pooled greeter #' + greeter.id + ' (' + name + ') for ' + faction);
      return greeter;
    `,
    );

    this.greeter.setMethod(
      'replenishPool',
      `
      /** Replenish the pool for a faction up to target size.
       *  This runs in background and spawns greeters one at a time.
       *  @param faction - 'continuum' or 'cartel'
       */
      const faction = args[0];
      if (!faction || !['continuum', 'cartel'].includes(faction)) {
        throw new Error('faction must be "continuum" or "cartel"');
      }

      // Check if already replenishing this faction
      const replenishing = self.replenishing || {};
      if (replenishing[faction]) {
        console.log('[Greeter] Already replenishing ' + faction + ' pool');
        return { success: true, message: 'already replenishing' };
      }

      // Mark as replenishing
      replenishing[faction] = true;
      self.replenishing = replenishing;

      try {
        const pool = self.greeterPool || {};
        const factionPool = pool[faction] || [];
        const target = self.poolSize || 2;

        const needed = target - factionPool.length;
        if (needed <= 0) {
          console.log('[Greeter] ' + faction + ' pool already at target (' + factionPool.length + '/' + target + ')');
          return { success: true, spawned: 0 };
        }

        console.log('[Greeter] Replenishing ' + faction + ' pool: need ' + needed + ' greeters');

        let spawned = 0;
        for (let i = 0; i < needed; i++) {
          try {
            const greeter = await self.spawnPooledGreeter(faction);
            if (greeter) {
              // Refresh pool reference in case it changed
              const currentPool = self.greeterPool || {};
              const currentFactionPool = currentPool[faction] || [];
              currentFactionPool.push(greeter.id);
              currentPool[faction] = currentFactionPool;
              self.greeterPool = currentPool;
              spawned++;
            }
          } catch (err) {
            console.error('[Greeter] Failed to spawn pooled greeter:', err);
          }
        }

        console.log('[Greeter] Replenished ' + faction + ' pool: spawned ' + spawned + ' greeters');
        return { success: true, spawned: spawned };
      } finally {
        // Clear replenishing flag
        const rep = self.replenishing || {};
        delete rep[faction];
        self.replenishing = rep;
      }
    `,
    );

    this.greeter.setMethod(
      'initializePools',
      `
      /** Initialize pools for all factions. Called at startup or manually.
       *  Spawns at least one greeter per faction synchronously to ensure pools are ready,
       *  then continues replenishment in background.
       */
      console.log('[Greeter] Initializing greeter pools...');

      // Initialize pool structure
      const pool = self.greeterPool || {};
      if (!pool.continuum) pool.continuum = [];
      if (!pool.cartel) pool.cartel = [];
      self.greeterPool = pool;

      // Spawn first greeter for each faction synchronously to ensure at least one is ready
      // This prevents the race condition where players complete chargen before pools are ready
      const results = { continuum: null, cartel: null };

      // Spawn first continuum greeter if pool is empty
      if (pool.continuum.length === 0) {
        try {
          const greeter = await self.spawnPooledGreeter('continuum');
          if (greeter) {
            pool.continuum.push(greeter.id);
            self.greeterPool = pool;
            results.continuum = greeter.id;
            console.log('[Greeter] Initial continuum greeter spawned: #' + greeter.id);
          }
        } catch (err) {
          console.error('[Greeter] Failed to spawn initial continuum greeter:', err);
        }
      }

      // Spawn first cartel greeter if pool is empty
      if (pool.cartel.length === 0) {
        try {
          const greeter = await self.spawnPooledGreeter('cartel');
          if (greeter) {
            pool.cartel.push(greeter.id);
            self.greeterPool = pool;
            results.cartel = greeter.id;
            console.log('[Greeter] Initial cartel greeter spawned: #' + greeter.id);
          }
        } catch (err) {
          console.error('[Greeter] Failed to spawn initial cartel greeter:', err);
        }
      }

      // Continue replenishing both pools in background to reach target size
      self.replenishPool('continuum').then(() => {
        console.log('[Greeter] Continuum pool replenishment completed');
      }).catch(err => {
        console.error('[Greeter] Continuum pool init error:', err);
      });
      self.replenishPool('cartel').then(() => {
        console.log('[Greeter] Cartel pool replenishment completed');
      }).catch(err => {
        console.error('[Greeter] Cartel pool init error:', err);
      });

      return { success: true, message: 'Pool initialization completed', initial: results };
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.greeter) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'greeter', this.greeter.id);
    console.log(`Registered greeter alias -> #${this.greeter.id}`);
  }
}

// Self-register
registerBuilder(GreeterBuilder);
