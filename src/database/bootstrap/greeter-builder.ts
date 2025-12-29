import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds Greeter system for post-chargen orientation
 *
 * Handles:
 * - Spawning faction-appropriate greeter NPCs after chargen completes
 * - Managing orientation quest state per player
 * - Quest chain logic for both Continuum and Gray Cartel factions
 */
export class GreeterBuilder {
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
      const root = await this.manager.load(1);
      this.greeter = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Greeter',
          description: 'Post-chargen orientation system',

          abilities: `Infrastructure system for spawning faction greeter NPCs.

SPAWNING: spawnForPlayer(playerId, faction) creates a greeter NPC appropriate for the faction.
- 'continuum' spawns a CorpSec Guide at Immigration Services
- 'cartel' spawns a Runner at Runner's Den

QUEST STATE: Tracks player orientation progress via player.orientation property.
- startOrientation(playerId, greeterId) initializes quest
- completePhase(playerId, phaseId) marks phase done
- getOrientationProgress(playerId) returns current state
- completeOrientation(playerId) finalizes and despawns greeter

CLEANUP: despawnGreeter(greeterId) removes a greeter NPC.`,

          // Active greeter assignments: { playerId: greeterId }
          activeGreeters: {},
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
       *  Uses $aiQuery to orchestrate: pick unique name, spawn NPC, set prompt, start interaction.
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

      // Get the appropriate spawn prompt
      const spawnPrompt = faction === 'continuum'
        ? await self.getContinuumSpawnPrompt(playerId, player.name)
        : await self.getCartelSpawnPrompt(playerId, player.name);

      // Use $aiQuery to orchestrate the spawn
      // The AI will message the player, spawn the NPC, set up everything, and start the interaction
      console.log('[Greeter] Spawning ' + faction + ' greeter for player #' + playerId + ' via $aiQuery...');
      const result = await $aiQuery('greeter-spawner', spawnPrompt);

      // Find the greeter that was just spawned by looking for the role
      const role = faction === 'continuum' ? 'continuum-greeter' : 'cartel-greeter';
      const greeters = $query().prop('role').equals(role).all();

      // Find one at the right location that was just created
      const location = faction === 'continuum' ? $immigrationServices : $runnersDen;
      let greeter = null;
      for (const g of greeters) {
        if (g.location?.id === location?.id) {
          greeter = g;
          break;
        }
      }

      if (greeter) {
        active[playerId] = greeter.id;
        self.activeGreeters = active;

        player.orientation = {
          greeterId: greeter.id,
          faction: faction,
          phase: 'welcome',
          started: new Date().toISOString(),
          completedPhases: [],
        };

        console.log('[Greeter] Found and registered greeter #' + greeter.id + ' (' + greeter.name + ') for player #' + playerId);
        return greeter;
      }

      console.log('[Greeter] Spawn completed. AI result:', result);
      return { success: true, result: result };
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
4. Set a detailed agentSystemPrompt (see below)
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

// Say to everyone in room
await room.announce(self, null, {
  actor: 'You say, "Hello citizen."',
  others: self.name + ' says, "Hello citizen."'
});

// Emote (action visible to room)
await room.announce(self, null, {
  actor: 'You straighten your uniform.',
  others: self.name + ' straightens their uniform.'
});

// Say to specific player (they see "says to you")
await room.announce(self, player, {
  actor: 'You say to ' + player.name + ', "Follow me."',
  target: self.name + ' says to you, "Follow me."',
  others: self.name + ' says to ' + player.name + ', "Follow me."'
});

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
- When waiting, use $ai.expectResponseFrom so you know when they reply\`;
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
4. Set a detailed agentSystemPrompt (see below)
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

// Say to everyone in room
await room.announce(self, null, {
  actor: 'You say, "Welcome to the family, newblood."',
  others: self.name + ' says, "Welcome to the family, newblood."'
});

// Emote (action visible to room)
await room.announce(self, null, {
  actor: 'You emerge from the shadows.',
  others: self.name + ' emerges from the shadows.'
});

// Say to specific player (they see "says to you")
await room.announce(self, player, {
  actor: 'You say to ' + player.name + ', "Sister Gray sent me."',
  target: self.name + ' says to you, "Sister Gray sent me."',
  others: self.name + ' says to ' + player.name + ', "Sister Gray sent me."'
});

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
- When waiting, use $ai.expectResponseFrom so you know when they reply\`;
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

      // Despawn greeter
      if (orientation.greeterId) {
        await self.despawnGreeter(orientation.greeterId);
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
  }

  async registerAlias(): Promise<void> {
    if (!this.greeter) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'greeter', this.greeter.id);
    console.log(`[GreeterBuilder] Registered $greeter alias -> #${this.greeter.id}`);
  }
}
