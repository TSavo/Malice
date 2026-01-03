import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the GuardedExit type
 * An exit that only allows passage for members of a specific faction.
 *
 * Inherits from Exit.
 *
 * Properties:
 * - allowedFaction: string - faction name that can use this exit (null = no restriction)
 * - denyMessage: string - message shown when faction check fails
 *
 * Methods:
 * - canUse(agent): Overrides exit.canUse to add faction check
 * - setAllowedFaction(factionName): Set which faction can use this exit
 */
export class GuardedExitBuilder implements Builder {
  static provides = ['guardedExit'];
  static depends = ['exit'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('guardedExit');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const exit = await this.manager.load('exit');
      if (!exit) {
        throw new Error('Exit type not found - required for GuardedExit');
      }

      this.obj = await this.manager.define('guardedExit', exit, {
        properties: {
          name: 'Guarded Exit',
          description: 'A passage restricted to faction members.',
          allowedFaction: null, // Faction name that can pass (null = unrestricted)
          denyMessage: 'You are not authorized to pass.',

          abilities: `Exit restricted to faction members. Extends $.exit with faction check.

FACTION CHECK: 'allowedFaction' specifies which faction can pass. null = unrestricted.

ACCESS: canUse() checks agent's faction via $factionManager.getMembership(). Non-members get 'denyMessage'.

LAYERED: Faction check happens BEFORE door/lock checks. Must pass faction check first.

CONFIGURATION:
- setAllowedFaction(name): Set faction requirement or null
- setDenyMessage(msg): Customize rejection message

DISPLAY: describe() shows faction requirement in exit listing.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    // Override canUse to add faction check before other checks
    obj.setMethod(
      'canUse',
      `
      /** Check if an agent can use this exit.
       *  First checks faction, then delegates to parent exit checks.
       *  @param agent - The agent trying to use the exit
       *  @returns { allowed, reason }
       */
      const agent = args[0];

      // Check faction restriction
      const allowedFaction = self.allowedFaction;
      if (allowedFaction) {
        const factionManager = await $factionManager;
        if (!factionManager) {
          // Faction system not available - deny by default
          return { allowed: false, reason: 'Access control unavailable.' };
        }

        const agentFaction = await factionManager.getMembership(agent);
        if (!agentFaction || agentFaction.name !== allowedFaction) {
          return { allowed: false, reason: self.denyMessage || 'You are not authorized to pass.' };
        }
      }

      // If faction check passed, check door/locks via parent behavior
      // Replicate parent canUse logic for doors and locks
      if (self.door && self.door.canAccess) {
        const result = await self.door.canAccess(agent, self);
        if (result !== true) {
          return { allowed: false, reason: result };
        }
      }

      // Legacy simple lock
      if (self.locked) {
        return { allowed: false, reason: 'The way ' + self.name + ' is locked.' };
      }

      // Composable locks
      const locks = self.locks || [];
      for (const lock of locks) {
        if (!lock || !lock.canAccess) continue;
        const result = await lock.canAccess(agent, self);
        if (result !== true) {
          return { allowed: false, reason: result };
        }
      }

      return { allowed: true };
    `,
    );

    // Set allowed faction
    obj.setMethod(
      'setAllowedFaction',
      `
      /** Set which faction can use this exit.
       *  @param factionName - Faction name or null to remove restriction
       *  @returns { success, faction }
       */
      const factionName = args[0];
      self.allowedFaction = factionName || null;
      return { success: true, faction: self.allowedFaction };
    `,
    );

    // Set denial message
    obj.setMethod(
      'setDenyMessage',
      `
      /** Set the message shown when access is denied.
       *  @param message - Denial message
       */
      const message = args[0];
      self.denyMessage = message || 'You are not authorized to pass.';
    `,
    );

    // Override describe to show faction restriction
    obj.setMethod(
      'describe',
      `
      /** Get description of this exit for room listing.
       *  @returns Description string
       */
      const aliases = self.aliases || [];
      const shortAlias = aliases.length > 0 ? ' [' + aliases[0] + ']' : '';
      const lockStr = self.locked ? ' (locked)' : '';
      const guardStr = self.allowedFaction ? ' [' + self.allowedFaction + ' only]' : '';
      return self.name + shortAlias + ' (' + self.distance + 'm)' + lockStr + guardStr;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'allowedFaction',
      'Faction name that can use this exit, or null for no restriction',
    );
    obj.setPropertyDescription(
      'denyMessage',
      'Message shown when faction check fails',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[GuardedExitBuilder] Type 'guardedExit' auto-aliased`);
  }
}

// Self-register
registerBuilder(GuardedExitBuilder);
