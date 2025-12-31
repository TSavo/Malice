import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the Lock prototype
 * Base prototype for access control systems.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - Properties hold authorization data with descriptions
 * - Abilities describe how the lock evaluates access
 * - AI interprets abilities to determine if player is authorized
 *
 * Properties:
 * - verifiedUsers: Array of player objects authorized by this lock
 * - difficulty: How hard to pick/bypass (1-10)
 *
 * Subclasses extend abilities for specific authorization logic:
 * - $.biometricLock: Scans body parts
 * - $.keycardLock: Requires keycard item
 */
export class LockBuilder implements Builder {
  static provides = ['lock'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.lock && !forceRebuild) {
      this.obj = $.lock;
      return;
    }

    const parentObj = $.describable;
    if (!parentObj) throw new Error('LockBuilder: $describable not found');

    if ($.lock) {
      this.obj = $.lock;
    } else {
      this.obj = await this.manager.create({
        parent: parentObj,
        properties: {
          name: 'Lock',
          description: 'A basic lock mechanism.',
          verifiedUsers: [],
          difficulty: 5,
          abilities: `Basic mechanical lock. Grants access if player is in 'verifiedUsers' array.

AUTHORIZATION: Check if player object is present in 'verifiedUsers'. If yes, access granted. If no, access denied.

PICKING: Can be picked with thin rigid tools. Compare tool rigidity + player skill against 'difficulty'. Success bypasses authorization check.

FORCING: Lock mechanism can be damaged with sufficient force, but this usually damages the container too.`,
        },
        methods: {},
      });
    }

    const obj = this.obj!;

    // Add property descriptions
    obj.setPropertyDescription(
      'verifiedUsers',
      'Array of player objects authorized to pass this lock. Check if player is in this array.',
    );
    obj.setPropertyDescription(
      'difficulty',
      'Resistance to picking/bypassing, 1-10 scale. Higher = harder.',
    );

    // isAuthorized(player) - Simple check for AI to use
    obj.setMethod(
      'isAuthorized',
      `
      const player = args[0];
      if (!player) return false;
      const verified = self.verifiedUsers || [];
      return verified.some(u => u && u.id === player.id);
    `,
    );

    // authorize(player) - Add player to verified list
    obj.setMethod(
      'authorize',
      `
      const player = args[0];
      if (!player || typeof player.id !== 'number') return false;
      const verified = self.verifiedUsers || [];
      if (!verified.some(u => u && u.id === player.id)) {
        verified.push(player);
        self.verifiedUsers = verified;
      }
      return true;
    `,
    );

    // revoke(player) - Remove player from verified list
    obj.setMethod(
      'revoke',
      `
      const player = args[0];
      if (!player) return false;
      const verified = self.verifiedUsers || [];
      self.verifiedUsers = verified.filter(u => u && u.id !== player.id);
      return true;
    `,
    );

    // Legacy canAccess - simplified
    obj.setMethod(
      'canAccess',
      `
      const agent = args[0];
      if (await self.isAuthorized(agent)) {
        return true;
      }
      return 'Access denied.';
    `,
    );
  }

  async registerAliases(): Promise<void> {
    // Register in memory for immediate access
    if (!this.obj) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'lock', this.obj.id);
    console.log(`  ✅ Registered $lock -> #${this.obj.id}`);
  }
}

// Self-register
registerBuilder(LockBuilder);
