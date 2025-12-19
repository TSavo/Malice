import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds the Combat system object ($.combat)
 *
 * Combat flow:
 * 1. Player A: "attack B" → $.combat.initiate(A, B)
 * 2. Both prompted for action, timeout scheduled
 * 3. Player A: "action I swing at his head" → $.combat.submitAction(combatId, A, text)
 * 4. Player B: "action I dodge left" → $.combat.submitAction(combatId, B, text)
 * 5. All actions in → $.combat.resolve(combatId)
 * 6. AI uses MCP combat tool to: check skills, apply damage, emote narration
 * 7. AI calls combat next_round or end
 *
 * If "attack X" and X is already in combat, attacker joins that combat.
 * NPCs don't declare actions - AI decides during resolution.
 * Timed out players get passive defense.
 */
export class CombatBuilder {
  private combat: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.combat) {
      this.combat = await this.manager.load(aliases.combat);
      if (this.combat) return; // Already exists
    }

    // Create new Combat object
    this.combat = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Combat',
        description: 'Combat system manager',

        // Active combats: { combatId: CombatState }
        activeCombats: {},

        // Configurable timeout for action submission (ms)
        actionTimeout: 60000, // 60 seconds

        // Combat system prompt template for AI resolution
        systemPrompt: `You are the combat resolution AI for Malice MOO. You have just received the actions from all combatants and must resolve this round of combat.

ROLE:
- Determine outcomes based on declared actions, stats, skills, and circumstances
- Use MCP tools to apply results (skill checks, damage, narration)
- Be fair but dramatic - combat is dangerous and unpredictable
- Consider physical state: wounds, exhaustion, positioning, what's in their hands

RESOLUTION PROCESS:
1. Analyze all combatants' declared actions
2. Determine initiative/advantage based on actions and stats
3. Call combat({ action: 'check', ... }) for EACH combatant's skill (critical for XP!)
4. Call combat({ action: 'damage', ... }) if attacks land (add weapon.damage to severity)
5. Call combat({ action: 'emote', ... }) to narrate the exchange (REQUIRED - do this!)
6. Check for combat-ending conditions (death/incapacitation)
7. Call combat({ action: 'end', ... }) OR combat({ action: 'next_round', ... })

SKILL SYSTEM - USE-TO-ADVANCE:
Skills improve through USE. Every skill check grants XP. This is critical:
- ALWAYS call skill checks for BOTH combatants, not just the attacker
- The defender should check 'dodge' or 'block' or their weapon skill
- The attacker checks their weapon's skill

WEAPON SKILLS:
Each weapon has a .skill property that determines what skill is used:
- inHands.rightHand.skill = "knife" means check "knife" skill
- inHands.rightHand.skill = "katana" means check "katana" skill  
- inHands.rightHand.skill = "pistol" means check "pistol" skill
- If unarmed, use "brawling" skill
- For defensive actions without weapon: "dodge" or "block"

WEAPON DAMAGE:
Weapons have a .damage property (0-100) that adds to severity:
- inHands.rightHand.damage = 15 means add 15 to base damage
- Calculate: base_severity + weapon.damage = final severity
- A punch might be 20 base, a knife (damage:15) hit would be 35 total

TWO-HANDED WEAPONS:
Weapons with twoHanded: true require BOTH hands free for effective use:
- Check hasFreeHand in the combatant's context
- If twoHanded weapon is held but hasFreeHand is FALSE:
  - SEVERE accuracy penalty (reduce successes by 1-2)
  - Risk of SELF-INJURY from recoil or loss of control (especially firearms)
  - Reduced damage (halve the weapon.damage bonus)
  - Narrate the struggle: fumbling, barrel rising, awkward grip
- Examples: rifles, shotguns, katanas, sledgehammers, bo staffs
- Sawn-off shotgun is specifically designed for one-handed use (twoHanded: false)

FIREARMS:
Ranged weapons have additional properties:
- ranged: true indicates a firearm
- ammo: current rounds available (already computed for you via getAmmoCount)
- If ammo is 0, the gun CANNOT FIRE - narrate the click of an empty chamber
- Consider reloading actions if a combatant declares they reload
- Firearms deal puncture damage typically

SKILL CHECK MECHANICS:
- opposingLevel is typically the opponent's relevant skill or difficulty (50 = average)
- Check result has 'successes' count - more successes = better outcome
- 0 successes = miss/fail, 1 = graze/partial, 2+ = solid hit

DAMAGE SEVERITY:
- 0-20: minor (scrapes, light bruises)
- 20-40: moderate (cuts, heavy bruises)
- 40-60: serious (deep cuts, possible fractures)
- 60-80: severe (arterial bleeding, compound fractures)
- 80-100: critical (life-threatening, triggers dying state)
- damageType: use weapon.damageType if available (cut, bruise, puncture, burn, laceration, abrasion)
- bodyPart: head, torso, leftShoulder, rightShoulder, leftThigh, rightThigh
- cause: blade, blunt, fist, boot, claw, bullet, etc. (for forensics)

TIMED OUT COMBATANTS:
- A combatant marked as timedOut attempted only passive defense
- They take defensive stance but cannot attack this round
- They are easier to hit (lower opposing level for attacker's checks)
- Still call a defensive skill check for them (they get XP for surviving)

NPC COMBATANTS:
- If a combatant has isNPC: true in the context, they did not declare an action
- YOU decide what they would do based on their role, personality, and situation
- Consider their weapons, wounds, and tactical position
- Then resolve normally with your decided action for them

EMOTE FORMAT:
- Write in third person, present tense
- Be vivid but concise (2-4 sentences per exchange)
- Show the physical reality - blood, pain, impact, movement
- Include both combatants' actions and reactions
- Example: "Jack's blade arcs toward Mike's throat. Mike throws up an arm to block, the knife slicing across his forearm instead. Blood wells from the cut as Mike stumbles backward, cursing."

ENDING COMBAT:
- End with reason 'death' if someone enters dying state (startDying triggered)
- End with reason 'flee' if someone's flee action succeeds
- End with reason 'surrender' if someone surrenders
- End with reason 'knockout' if someone is incapacitated but not dying
- Otherwise call next_round to continue`,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // INITIATE COMBAT
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('initiate', `
      /** Start combat between two combatants.
       *  @param attacker - The attacking object
       *  @param defender - The defending object
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

      // Check if attacker can start fighting (not cuffed, sleeping, walking, etc.)
      const blocked = await $.exclusions.start(attacker, 'start_fighting');
      if (blocked) {
        return { error: blocked };
      }
      // Immediately release - we just needed to check
      await $.exclusions.end(attacker, 'start_fighting');

      // Check if either is already in combat
      const existingAttacker = await self.getCombatByParticipant(attacker);
      if (existingAttacker) {
        return { error: attacker.name + ' is already in combat' };
      }

      const existingDefender = await self.getCombatByParticipant(defender);
      if (existingDefender) {
        // Join existing combat instead
        return await self.join(existingDefender.id, attacker);
      }

      // Generate combat ID
      const combatId = 'combat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

      // Get location
      const location = attacker.location;
      if (!location) {
        return { error: 'Attacker has no location' };
      }

      // Create combat state
      const combat = {
        id: combatId,
        combatants: [attacker, defender],
        actions: {},
        round: 1,
        status: 'awaiting_actions',
        location: location,
        session: '',
        startedAt: Date.now(),
        log: [],
        timeoutJobName: 'combat-timeout-' + combatId,
      };

      // Store combat
      const activeCombats = self.activeCombats || {};
      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      // Add fighting exclusion to both combatants
      await $.exclusions.start(attacker, 'fighting', combatId);
      await $.exclusions.start(defender, 'fighting', combatId);

      // Get status for each combatant
      const attackerStatus = await self.getCombatantStatus(attacker);
      const defenderStatus = await self.getCombatantStatus(defender);

      // Notify combatants with their status
      const baseMsg = '\\r\\n*** COMBAT STARTED ***\\r\\n' +
        attacker.name + ' attacks ' + defender.name + '!\\r\\n';

      if (attacker.tell) {
        await attacker.tell(baseMsg + 'Your status: ' + attackerStatus + '\\r\\n' +
          'Type "action <what you do>" to declare your action.\\r\\n');
      }
      if (defender.tell) {
        await defender.tell(baseMsg + 'Your status: ' + defenderStatus + '\\r\\n' +
          'Type "action <what you do>" to declare your action.\\r\\n');
      }

      // Also notify room
      if (location.tell) {
        await location.tell(attacker.name + ' attacks ' + defender.name + '! Combat begins.', [attacker, defender]);
      }

      // Schedule timeout
      const timeout = self.actionTimeout || 60000;
      await $.scheduler.schedule(combat.timeoutJobName, timeout, 0, self, 'onTimeout', combatId);

      // Add to combat log
      combat.log.push('[Round 1] Combat initiated: ' + attacker.name + ' vs ' + defender.name);

      return { combatId, combat };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // JOIN COMBAT
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('join', `
      /** Join an existing combat.
       *  @param combatId - Combat ID to join
       *  @param combatant - Object joining the combat
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
        return { error: 'Combat not found: ' + combatId };
      }

      if (combat.status === 'ended') {
        return { error: 'Combat has already ended' };
      }

      // Check if already in this combat
      const isAlreadyIn = combat.combatants.some(c => c && c.id === combatant.id);
      if (isAlreadyIn) {
        return { error: combatant.name + ' is already in this combat' };
      }

      // Add to combatants
      combat.combatants.push(combatant);
      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      // Add fighting exclusion
      await $.exclusions.start(combatant, 'fighting', combatId);

      // Notify everyone
      const joinMsg = combatant.name + ' joins the fight!';
      for (const c of combat.combatants) {
        if (c && c.tell) {
          await c.tell(joinMsg);
        }
      }

      // Notify room
      const location = combat.location;
      if (location && location.tell) {
        await location.tell(joinMsg, combat.combatants);
      }

      // Prompt new combatant with their status
      if (combatant.tell) {
        const status = await self.getCombatantStatus(combatant);
        await combatant.tell('Your status: ' + status + '\\r\\n' +
          'Type "action <what you do>" to declare your action.');
      }

      combat.log.push('[Round ' + combat.round + '] ' + combatant.name + ' joined combat');

      return { combatId, combat };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // SUBMIT ACTION
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('submitAction', `
      /** Submit an action for a combatant.
       *  @param combatId - Combat ID
       *  @param combatant - The combatant object
       *  @param actionText - What they want to do
       *  @returns { success } or { error }
       */
      const combatId = args[0];
      const combatant = args[1];
      const actionText = args[2];

      if (!combatId || !combatant || !actionText) {
        return { error: 'combatId, combatant, and actionText required' };
      }

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      if (combat.status !== 'awaiting_actions') {
        return { error: 'Combat is not accepting actions right now' };
      }

      // Verify combatant is in this combat
      const isIn = combat.combatants.some(c => c && c.id === combatant.id);
      if (!isIn) {
        return { error: 'You are not in this combat' };
      }

      // Store action
      combat.actions[combatant.id] = {
        text: actionText,
        timestamp: Date.now(),
        timedOut: false,
      };

      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      // Confirm to player
      if (combatant.tell) {
        await combatant.tell('Action submitted: ' + actionText);
      }

      // Check if all non-NPC combatants have submitted
      const allSubmitted = await self.checkAllActionsSubmitted(combatId);
      if (allSubmitted) {
        // Cancel timeout and resolve
        if (combat.timeoutJobName) {
          await $.scheduler.unschedule(combat.timeoutJobName);
        }
        await self.resolve(combatId);
      }

      return { success: true };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // CHECK IF ALL ACTIONS SUBMITTED
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('checkAllActionsSubmitted', `
      /** Check if all non-NPC combatants have submitted actions.
       *  @param combatId - Combat ID
       *  @returns boolean
       */
      const combatId = args[0];

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];
      if (!combat) return false;

      const ai = await $.ai;

      for (const combatant of combat.combatants) {
        if (!combatant) continue;

        // Check if NPC - NPCs don't need to submit
        const isNPC = ai ? await ai.isAiControlled(combatant.id) : false;
        if (isNPC) continue;

        // Check if action submitted
        if (!combat.actions[combatant.id]) {
          return false;
        }
      }

      return true;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // TIMEOUT HANDLER
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('onTimeout', `
      /** Called by scheduler when action timeout expires.
       *  @param combatId - Combat ID
       */
      const combatId = args[0];

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat || combat.status !== 'awaiting_actions') {
        return; // Combat ended or already resolving
      }

      const ai = await $.ai;

      // Mark missing actions as timed out
      for (const combatant of combat.combatants) {
        if (!combatant) continue;

        // Skip NPCs
        const isNPC = ai ? await ai.isAiControlled(combatant.id) : false;
        if (isNPC) continue;

        if (!combat.actions[combatant.id]) {
          combat.actions[combatant.id] = {
            text: 'passive defense',
            timestamp: Date.now(),
            timedOut: true,
          };

          if (combatant.tell) {
            await combatant.tell('You failed to act in time! Taking defensive stance.');
          }
        }
      }

      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      // Resolve combat
      await self.resolve(combatId);
    `);

    // ═══════════════════════════════════════════════════════════════════
    // GATHER CONTEXT
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('gatherContext', `
      /** Gather full context for AI combat resolution.
       *  @param combatId - Combat ID
       *  @returns { combat, combatants: [...context per combatant] }
       */
      const combatId = args[0];

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      const ai = await $.ai;
      const combatantContexts = [];

      for (const combatant of combat.combatants) {
        if (!combatant) continue;

        const isNPC = ai ? await ai.isAiControlled(combatant.id) : false;

        // Get stats
        let stats = {};
        if (combatant.getStats) {
          stats = await combatant.getStats();
        }

        // Get wound summary
        let wounds = [];
        if (combatant.getWoundSummary) {
          wounds = await combatant.getWoundSummary();
        }

        // Get calorie status
        let calories = {};
        if (combatant.getCalorieStatus) {
          calories = await combatant.getCalorieStatus();
        }

        // Get what's in hands
        let inHands = { leftHand: null, rightHand: null };
        if (combatant.getBody) {
          const body = await combatant.getBody();
          if (body) {
            // Left hand
            const leftShoulder = await body.getPart('leftShoulder');
            if (leftShoulder) {
              const leftArm = await leftShoulder.getPart('arm');
              if (leftArm) {
                const leftForearm = await leftArm.getPart('forearm');
                if (leftForearm) {
                  const leftHand = await leftForearm.getPart('hand');
                  if (leftHand && leftHand.heldItem) {
                    const item = leftHand.heldItem;
                    // Get ammo count using proper method if it's a gun
                    let ammoCount = undefined;
                    if (item.ranged && item.getAmmoCount) {
                      ammoCount = await item.getAmmoCount();
                    }
                    inHands.leftHand = {
                      id: item.id,
                      name: item.name,
                      description: item.description,
                      // Weapon properties if present
                      skill: item.skill || null,
                      damage: item.damage || 0,
                      damageType: item.damageType || null,
                      twoHanded: item.twoHanded || false,
                      // Firearm properties if present
                      ranged: item.ranged || false,
                      ammo: ammoCount,
                    };
                  }
                }
              }
            }

            // Right hand
            const rightShoulder = await body.getPart('rightShoulder');
            if (rightShoulder) {
              const rightArm = await rightShoulder.getPart('arm');
              if (rightArm) {
                const rightForearm = await rightArm.getPart('forearm');
                if (rightForearm) {
                  const rightHand = await rightForearm.getPart('hand');
                  if (rightHand && rightHand.heldItem) {
                    const item = rightHand.heldItem;
                    // Get ammo count using proper method if it's a gun
                    let ammoCount = undefined;
                    if (item.ranged && item.getAmmoCount) {
                      ammoCount = await item.getAmmoCount();
                    }
                    inHands.rightHand = {
                      id: item.id,
                      name: item.name,
                      description: item.description,
                      // Weapon properties if present
                      skill: item.skill || null,
                      damage: item.damage || 0,
                      damageType: item.damageType || null,
                      twoHanded: item.twoHanded || false,
                      // Firearm properties if present
                      ranged: item.ranged || false,
                      ammo: ammoCount,
                    };
                  }
                }
              }
            }
          }
        }

        // Compute hasFreeHand - important for two-handed weapon usage
        const hasFreeHand = !inHands.leftHand || !inHands.rightHand;

        // Get skills
        const skills = combatant.skills || {};

        // Get action (if any)
        const action = combat.actions[combatant.id] || null;

        // Get NPC personality/role if applicable
        let npcContext = null;
        if (isNPC && ai) {
          const profile = await ai.getProfile(combatant.id);
          if (profile && profile.success !== false) {
            npcContext = {
              role: profile.role,
              personality: profile.personality,
              history: profile.history,
            };
          }
        }

        combatantContexts.push({
          id: combatant.id,
          name: combatant.name,
          description: combatant.description,
          isNPC: isNPC,
          stats: stats,
          wounds: wounds,
          calories: calories,
          inHands: inHands,
          hasFreeHand: hasFreeHand,
          skills: skills,
          action: action,
          npcContext: npcContext,
        });
      }

      // Get location description
      let locationDesc = '';
      if (combat.location && combat.location.description) {
        locationDesc = combat.location.description;
      }

      return {
        combatId: combat.id,
        round: combat.round,
        status: combat.status,
        location: locationDesc,
        combatants: combatantContexts,
        log: combat.log,
      };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // GET COMBATANT STATUS (for action prompts)
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('getCombatantStatus', `
      /** Get a formatted status string for a combatant to show in action prompts.
       *  @param combatant - The combatant object
       *  @returns Status string showing hands/weapons/ammo
       */
      const combatant = args[0];
      if (!combatant) return '';

      let status = '';
      let leftHandDesc = 'empty';
      let rightHandDesc = 'empty';

      if (combatant.getBody) {
        const body = await combatant.getBody();
        if (body) {
          // Left hand
          const leftShoulder = await body.getPart('leftShoulder');
          if (leftShoulder) {
            const leftArm = await leftShoulder.getPart('arm');
            if (leftArm) {
              const leftForearm = await leftArm.getPart('forearm');
              if (leftForearm) {
                const leftHand = await leftForearm.getPart('hand');
                if (leftHand && leftHand.heldItem) {
                  const item = leftHand.heldItem;
                  leftHandDesc = item.name || 'something';
                  // Add ammo info for ranged weapons using getAmmoCount()
                  if (item.ranged && item.getAmmoCount) {
                    const ammoCount = await item.getAmmoCount();
                    leftHandDesc += ' [' + ammoCount + ' rounds]';
                  }
                  if (item.twoHanded) {
                    leftHandDesc += ' (2H)';
                  }
                }
              }
            }
          }

          // Right hand
          const rightShoulder = await body.getPart('rightShoulder');
          if (rightShoulder) {
            const rightArm = await rightShoulder.getPart('arm');
            if (rightArm) {
              const rightForearm = await rightArm.getPart('forearm');
              if (rightForearm) {
                const rightHand = await rightForearm.getPart('hand');
                if (rightHand && rightHand.heldItem) {
                  const item = rightHand.heldItem;
                  rightHandDesc = item.name || 'something';
                  // Add ammo info for ranged weapons using getAmmoCount()
                  if (item.ranged && item.getAmmoCount) {
                    const ammoCount = await item.getAmmoCount();
                    rightHandDesc += ' [' + ammoCount + ' rounds]';
                  }
                  if (item.twoHanded) {
                    rightHandDesc += ' (2H)';
                  }
                }
              }
            }
          }
        }
      }

      status = 'Left hand: ' + leftHandDesc + ', Right hand: ' + rightHandDesc;
      return status;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // RESOLVE
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('resolve', `
      /** Resolve the current round using AI.
       *  @param combatId - Combat ID
       */
      const combatId = args[0];

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      if (combat.status !== 'awaiting_actions') {
        return { error: 'Combat is not ready for resolution' };
      }

      // Set status to resolving
      combat.status = 'resolving';
      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      // Gather context
      const context = await self.gatherContext(combatId);

      // Build prompt for AI
      const systemPrompt = self.systemPrompt;
      const userPrompt = 'COMBAT RESOLUTION REQUEST\\n\\n' +
        'Combat ID: ' + combatId + '\\n' +
        'Round: ' + combat.round + '\\n\\n' +
        'CONTEXT:\\n' + JSON.stringify(context, null, 2) + '\\n\\n' +
        'Resolve this round of combat. Use the combat MCP tool to apply skill checks, damage, and narration. ' +
        'End by calling either combat({ action: "next_round", combatId: "' + combatId + '" }) to continue, ' +
        'or combat({ action: "end", combatId: "' + combatId + '", reason: "...", winnerId: ... }) to end combat.';

      // Call AI with session for continuity
      try {
        const result = await $.query(systemPrompt, userPrompt, combat.session || null);

        // Save session for next round
        combat.session = result.session;
        activeCombats[combatId] = combat;
        self.activeCombats = activeCombats;

      } catch (err) {
        console.error('[Combat] AI resolution error:', err);

        // Fallback - just advance to next round
        if (combat.status === 'resolving') {
          await self.nextRound(combatId);
        }
      }
    `);

    // ═══════════════════════════════════════════════════════════════════
    // APPLY DAMAGE
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('applyDamage', `
      /** Apply damage to a combatant.
       *  @param combatId - Combat ID
       *  @param target - Target object
       *  @param bodyPartName - Name of body part to damage
       *  @param damageType - cut, bruise, puncture, etc.
       *  @param severity - 0-100
       *  @param cause - What caused it (blade, fist, etc.)
       *  @returns { success, wound, ... } or { error }
       */
      const combatId = args[0];
      const target = args[1];
      const bodyPartName = args[2];
      const damageType = args[3] || 'bruise';
      const severity = args[4] || 30;
      const cause = args[5] || null;

      if (!combatId || !target || !bodyPartName) {
        return { error: 'combatId, target, and bodyPartName required' };
      }

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      // Get the body part
      let bodyPart = null;
      if (target.getBody) {
        const body = await target.getBody();
        if (body) {
          bodyPart = await body.findPart(bodyPartName);
        }
      }

      if (!bodyPart) {
        return { error: 'Body part not found: ' + bodyPartName };
      }

      // Apply damage
      const damage = {
        type: damageType,
        severity: severity,
        cause: cause,
        force: severity,
        breakChance: severity > 60 ? 0.2 : 0,
      };

      const result = await bodyPart.takeDamage(damage, null);

      // Log it
      combat.log.push('[Round ' + combat.round + '] ' + target.name + ' takes ' + severity + ' ' + damageType + ' damage to ' + bodyPartName);
      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      // Check if this triggered dying
      if (target.isDying) {
        combat.log.push('[Round ' + combat.round + '] ' + target.name + ' is dying!');
      }

      return {
        success: true,
        target: target.name,
        bodyPart: bodyPartName,
        damageType: damageType,
        severity: severity,
        wound: result,
        isDying: target.isDying || false,
      };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // SKILL CHECK
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('skillCheck', `
      /** Perform a skill check for a combatant.
       *  @param combatId - Combat ID
       *  @param combatant - The combatant object
       *  @param skillName - Name of skill to check
       *  @param opposingLevel - Difficulty or opposing skill level (default 50)
       *  @returns Skill check result
       */
      const combatId = args[0];
      const combatant = args[1];
      const skillName = args[2];
      const opposingLevel = args[3] || 50;

      if (!combatId || !combatant || !skillName) {
        return { error: 'combatId, combatant, and skillName required' };
      }

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      // Perform skill check (this also uses the skill, granting XP)
      let result = { successes: 0, level: 0, opposingLevel: opposingLevel };
      if (combatant.skillCheck) {
        result = await combatant.skillCheck(skillName, opposingLevel);
      }

      // Log it
      combat.log.push('[Round ' + combat.round + '] ' + combatant.name + ' ' + skillName + ' check: ' + result.successes + ' successes');
      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      return {
        success: true,
        combatant: combatant.name,
        skillName: skillName,
        result: result,
      };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // EMOTE
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('emote', `
      /** Emit combat narration to the room.
       *  @param combatId - Combat ID
       *  @param text - Narration text
       */
      const combatId = args[0];
      const text = args[1];

      if (!combatId || !text) {
        return { error: 'combatId and text required' };
      }

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      // Format combat narration
      const narration = '\\r\\n' + text + '\\r\\n';

      // Tell all combatants
      for (const combatant of combat.combatants) {
        if (combatant && combatant.tell) {
          await combatant.tell(narration);
        }
      }

      // Tell room (excluding combatants)
      const location = combat.location;
      if (location && location.tell) {
        await location.tell(narration, combat.combatants);
      }

      // Log it
      combat.log.push('[Round ' + combat.round + '] ' + text);
      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      return { success: true };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // APPLY EFFECT
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('applyEffect', `
      /** Apply a status effect to a combatant.
       *  @param combatId - Combat ID
       *  @param target - Target object
       *  @param effect - Effect name (stunned, knockedDown, disarmed, winded)
       *  @param intensity - 0-100
       *  @param duration - Duration in ms (optional)
       */
      const combatId = args[0];
      const target = args[1];
      const effect = args[2];
      const intensity = args[3] || 50;
      const duration = args[4] || 30000; // Default 30 seconds

      if (!combatId || !target || !effect) {
        return { error: 'combatId, target, and effect required' };
      }

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      // Apply status effect if target supports it
      if (target.addStatusEffect) {
        await target.addStatusEffect(effect, intensity, duration);
      }

      // Log it
      combat.log.push('[Round ' + combat.round + '] ' + target.name + ' is ' + effect + ' (intensity: ' + intensity + ')');
      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      return {
        success: true,
        target: target.name,
        effect: effect,
        intensity: intensity,
      };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // NEXT ROUND
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('nextRound', `
      /** Advance to the next round.
       *  @param combatId - Combat ID
       */
      const combatId = args[0];

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      // Increment round
      combat.round += 1;
      combat.actions = {};
      combat.status = 'awaiting_actions';

      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      // Notify combatants with their current status
      const roundHeader = '\\r\\n*** ROUND ' + combat.round + ' ***\\r\\n';

      for (const combatant of combat.combatants) {
        if (combatant && combatant.tell) {
          const status = await self.getCombatantStatus(combatant);
          await combatant.tell(roundHeader + 'Your status: ' + status + '\\r\\n' +
            'Type "action <what you do>" to declare your action.\\r\\n');
        }
      }

      // Schedule timeout
      const timeout = self.actionTimeout || 60000;
      combat.timeoutJobName = 'combat-timeout-' + combatId + '-r' + combat.round;
      await $.scheduler.schedule(combat.timeoutJobName, timeout, 0, self, 'onTimeout', combatId);

      combat.log.push('[Round ' + combat.round + '] New round started');

      return { success: true, round: combat.round };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // END COMBAT
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('endCombat', `
      /** End the combat.
       *  @param combatId - Combat ID
       *  @param reason - death, flee, surrender, knockout, intervention
       *  @param winner - Winner object (optional)
       */
      const combatId = args[0];
      const reason = args[1] || 'ended';
      const winner = args[2] || null;

      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];

      if (!combat) {
        return { error: 'Combat not found' };
      }

      // Cancel any pending timeout
      if (combat.timeoutJobName) {
        await $.scheduler.unschedule(combat.timeoutJobName);
      }

      // Update combat state
      combat.status = 'ended';
      combat.endReason = reason;
      if (winner) {
        combat.winner = winner;
      }

      // Remove fighting exclusion from all combatants
      for (const combatant of combat.combatants) {
        if (combatant) {
          await $.exclusions.end(combatant, 'fighting');
        }
      }

      // Notify combatants
      let endMsg = '\\r\\n*** COMBAT ENDED ***\\r\\n';
      if (reason === 'death') {
        endMsg += 'Someone is dying!\\r\\n';
      } else if (reason === 'flee') {
        endMsg += 'Someone fled!\\r\\n';
      } else if (reason === 'surrender') {
        endMsg += 'Someone surrendered!\\r\\n';
      } else if (reason === 'knockout') {
        endMsg += 'Someone was knocked out!\\r\\n';
      }
      if (winner) {
        endMsg += winner.name + ' is victorious.\\r\\n';
      }

      for (const combatant of combat.combatants) {
        if (combatant && combatant.tell) {
          await combatant.tell(endMsg);
        }
      }

      // Notify room
      const location = combat.location;
      if (location && location.tell) {
        await location.tell('The fight is over.' + (winner ? ' ' + winner.name + ' stands victorious.' : ''), combat.combatants);
      }

      // Log it
      combat.log.push('[Combat End] Reason: ' + reason + (winner ? ', Winner: ' + winner.name : ''));

      activeCombats[combatId] = combat;
      self.activeCombats = activeCombats;

      return { success: true, reason: reason, winner: winner ? winner.name : null };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // QUERY METHODS
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('getCombat', `
      /** Get a combat by ID.
       *  @param combatId - Combat ID
       *  @returns Combat state or null
       */
      const combatId = args[0];
      const activeCombats = self.activeCombats || {};
      return activeCombats[combatId] || null;
    `);

    this.combat.setMethod('getCombatByParticipant', `
      /** Get active combat for a participant.
       *  @param combatant - The combatant object
       *  @returns Combat state or null
       */
      const combatant = args[0];
      if (!combatant) return null;

      const activeCombats = self.activeCombats || {};

      for (const combatId of Object.keys(activeCombats)) {
        const combat = activeCombats[combatId];
        if (combat.status === 'ended') continue;

        const isIn = combat.combatants.some(c => c && c.id === combatant.id);
        if (isIn) {
          return combat;
        }
      }

      return null;
    `);

    this.combat.setMethod('isInCombat', `
      /** Check if someone is in combat.
       *  @param combatant - The combatant object
       *  @returns boolean
       */
      const combatant = args[0];
      const combat = await self.getCombatByParticipant(combatant);
      return combat !== null;
    `);

    this.combat.setMethod('getLog', `
      /** Get combat log.
       *  @param combatId - Combat ID
       *  @returns Array of log entries
       */
      const combatId = args[0];
      const activeCombats = self.activeCombats || {};
      const combat = activeCombats[combatId];
      return combat ? combat.log : [];
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DESCRIBE
    // ═══════════════════════════════════════════════════════════════════

    this.combat.setMethod('describe', `
      const activeCombats = self.activeCombats || {};
      const combatIds = Object.keys(activeCombats);
      const active = combatIds.filter(id => activeCombats[id].status !== 'ended');

      let desc = 'Combat System\\r\\n';
      desc += '=============\\r\\n';
      desc += 'Active combats: ' + active.length + '\\r\\n';
      desc += 'Action timeout: ' + (self.actionTimeout / 1000) + ' seconds\\r\\n\\r\\n';

      if (active.length > 0) {
        desc += 'Current Combats:\\r\\n';
        for (const id of active) {
          const combat = activeCombats[id];
          const names = combat.combatants.map(c => c ? c.name : '?').join(' vs ');
          desc += '  ' + id + ': ' + names + ' (round ' + combat.round + ', ' + combat.status + ')\\r\\n';
        }
      }

      return desc;
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.combat) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'combat', this.combat.id);
    console.log(`✅ Registered combat alias -> #${this.combat.id}`);
  }
}
