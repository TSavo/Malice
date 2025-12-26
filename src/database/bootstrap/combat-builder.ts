import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds the Combat system object ($.combat)
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * Combat resolution happens through the AI narrator interpreting weapon and body abilities.
 * This object is minimal infrastructure for:
 * - Tracking who is in combat (for $exclusions)
 * - Querying combat state
 * - Logging combat events
 *
 * The AI narrator:
 * 1. Receives "stab him with my knife"
 * 2. Reads weapon abilities, body abilities, skills
 * 3. Calls $combat.start(attacker, defender) to set up exclusions
 * 4. Directly modifies properties (creates wounds, consumes ammo, etc.)
 * 5. Narrates the result
 * 6. Calls $combat.end(combatId) when combat concludes
 */
export class CombatBuilder {
  private combat: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.combat) {
      this.combat = await this.manager.load(aliases.combat);
      if (this.combat) return;
    }

    const root = await this.manager.load(1);
    this.combat = await this.manager.create({
      parent: root!,
      properties: {
        name: 'Combat',
        description: 'Minimal combat tracking for exclusions and state queries',

        // Active combats: { combatId: CombatState }
        activeCombats: {},

        // Abilities - what $combat is for
        abilities: `Infrastructure for tracking combat state. NOT a physics engine.

STARTING: AI calls start(attacker, defender) when combat begins. This:
- Creates a combat record
- Adds 'fighting' exclusion to both (blocks sleep, travel, etc.)
- Returns combatId for tracking

QUERYING: isInCombat(agent) checks if someone is fighting. getCombat(id) gets state.

ADDING: AI calls addCombatant(combatId, agent) if someone joins an ongoing fight.

ENDING: AI calls end(combatId, reason, winner) when combat concludes. This:
- Removes 'fighting' exclusions
- Logs the outcome

LOGGING: AI calls log(combatId, message) to record what happened.

The actual combat PHYSICS (damage, wounds, skill checks, hit/miss) is handled by the AI narrator reading weapon abilities, body abilities, and skill levels. This object just tracks state.`,
      },
      methods: {},
    });

    // Add property descriptions
    this.combat.setPropertyDescription(
      'activeCombats',
      'Map of combatId -> { combatants, location, startedAt, log, status }',
    );

    // ═══════════════════════════════════════════════════════════════════
    // START COMBAT
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod(
      'start',
      `
      /** Start combat between combatants. Sets up exclusions.
       *  @param attacker - The attacking agent
       *  @param defender - The defending agent
       *  @returns { combatId, combat } or { error }
       */
      const attacker = args[0];
      const defender = args[1];

      if (!attacker || !defender) {
        return { error: 'Both attacker and defender required' };
      }

      if (attacker.id === defender.id) {
        return { error: 'Cannot attack yourself' };
      }

      // Check if either is already in combat
      const existingAttacker = await self.getCombatByParticipant(attacker);
      if (existingAttacker) {
        // Join existing combat
        return await self.addCombatant(existingAttacker.id, defender);
      }

      const existingDefender = await self.getCombatByParticipant(defender);
      if (existingDefender) {
        // Join existing combat
        return await self.addCombatant(existingDefender.id, attacker);
      }

      // Generate combat ID
      const combatId = 'combat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

      // Create combat state
      const combat = {
        id: combatId,
        combatants: [attacker, defender],
        location: attacker.location,
        startedAt: Date.now(),
        status: 'active',
        log: ['Combat started: ' + attacker.name + ' vs ' + defender.name],
      };

      // Store combat
      const activeCombats = self.activeCombats || {};
      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      // Add fighting exclusion to both combatants
      await $.exclusions.start(attacker, 'fighting', combatId);
      await $.exclusions.start(defender, 'fighting', combatId);

      return { combatId, combat };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // ADD COMBATANT
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod(
      'addCombatant',
      `
      /** Add someone to an existing combat.
       *  @param combatId - Combat ID
       *  @param combatant - Agent to add
       *  @returns { combatId, combat } or { error }
       */
      const combatId = args[0];
      const combatant = args[1];

      if (!combatId || !combatant) {
        return { error: 'combatId and combatant required' };
      }

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      if (combat.status !== 'active') {
        return { error: 'Combat has ended' };
      }

      // Check if already in
      const isIn = combat.combatants.some(c => c && c.id === combatant.id);
      if (isIn) {
        return { error: combatant.name + ' is already in this combat' };
      }

      // Add to combatants
      combat.combatants.push(combatant);
      combat.log.push(combatant.name + ' joined the fight');
      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      // Add fighting exclusion
      await $.exclusions.start(combatant, 'fighting', combatId);

      return { combatId, combat };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // END COMBAT
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod(
      'end',
      `
      /** End a combat. Removes exclusions.
       *  @param combatId - Combat ID
       *  @param reason - Why it ended: death, flee, surrender, knockout, resolved
       *  @param winner - Winner agent (optional)
       *  @returns { success } or { error }
       */
      const combatId = args[0];
      const reason = args[1] || 'resolved';
      const winner = args[2] || null;

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      // Update state
      combat.status = 'ended';
      combat.endReason = reason;
      combat.endedAt = Date.now();
      if (winner) {
        combat.winner = winner;
      }
      combat.log.push('Combat ended: ' + reason + (winner ? ', winner: ' + winner.name : ''));

      // Remove fighting exclusion from all combatants
      for (const combatant of combat.combatants) {
        if (combatant) {
          await $.exclusions.end(combatant, 'fighting');
        }
      }

      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      return { success: true, reason, winner: winner?.name };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // LOG
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod(
      'log',
      `
      /** Add an entry to combat log.
       *  @param combatId - Combat ID
       *  @param message - Log message
       */
      const combatId = args[0];
      const message = args[1];

      if (!combatId || !message) return { error: 'combatId and message required' };

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) return { error: 'Combat not found' };

      combat.log.push(message);
      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      return { success: true };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod(
      'getCombat',
      `
      /** Get a combat by ID.
       *  @param combatId - Combat ID
       *  @returns Combat state or null
       */
      const combatId = args[0];
      const activeCombats = self.activeCombats || {};
      return activeCombats[combatId] || null;
    `,
    );

    this.combat.setMethod(
      'getCombatByParticipant',
      `
      /** Get active combat for a participant.
       *  @param combatant - The agent
       *  @returns Combat state or null
       */
      const combatant = args[0];
      if (!combatant) return null;

      const activeCombats = self.activeCombats || {};

      for (const combatId of Object.keys(activeCombats)) {
        const combat = activeCombats[combatId];
        if (combat.status !== 'active') continue;

        const isIn = combat.combatants.some(c => c && c.id === combatant.id);
        if (isIn) return combat;
      }

      return null;
    `,
    );

    this.combat.setMethod(
      'isInCombat',
      `
      /** Check if someone is in active combat.
       *  @param combatant - The agent
       *  @returns boolean
       */
      const combatant = args[0];
      const combat = await self.getCombatByParticipant(combatant);
      return combat !== null;
    `,
    );

    this.combat.setMethod(
      'getLog',
      `
      /** Get combat log.
       *  @param combatId - Combat ID
       *  @returns Array of log entries
       */
      const combatId = args[0];
      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];
      return combat ? combat.log : [];
    `,
    );

    this.combat.setMethod(
      'getActiveCombats',
      `
      /** Get all active combats.
       *  @returns Array of combat states
       */
      const activeCombats = self.activeCombats || {};
      return Object.values(activeCombats).filter(c => c.status === 'active');
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // DESCRIBE
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod(
      'describe',
      `
      /** Get a description of active combats.
       *  @returns Formatted string
       */
      const activeCombats = self.activeCombats || {};
      const active = Object.values(activeCombats).filter(c => c.status === 'active');

      let desc = 'Combat Tracker\\r\\n';
      desc += '==============\\r\\n';
      desc += 'Active combats: ' + active.length + '\\r\\n\\r\\n';

      if (active.length > 0) {
        for (const combat of active) {
          const names = combat.combatants.map(c => c?.name || '?').join(' vs ');
          desc += '  ' + combat.id + ': ' + names + '\\r\\n';
        }
      }

      return desc;
    `,
    );
  }

  async registerAlias(): Promise<void> {
    if (!this.combat) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'combat', this.combat.id);
    console.log(`  Registered $.combat -> #${this.combat.id}`);
  }
}
