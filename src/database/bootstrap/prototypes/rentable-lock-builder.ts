import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the RentableLock type
 * Combines lock access control with bank-based rental/payment logic.
 *
 * Inherits from Lock.
 *
 * Properties:
 * - price: Rental price (integer)
 * - duration: Rental duration in ms
 * - bank: Bank object for payments
 * - account: Account ID to receive payments
 * - renters: Map of agent ID to expiration timestamp
 * - locked: Boolean (legacy/simple lock)
 * - locks: Array of composable lock objects (optional)
 *
 * Methods:
 * - canAccess(agent, target): Checks if agent has paid/rented and lock access
 * - rent(agent, idempotencyKey): Processes payment, grants access for duration
 * - revoke(agent): Removes access
 * - isRenter(agent): Checks if agent currently has access
 */
export class RentableLockBuilder implements Builder {
  static provides = ['rentableLock'];
  static depends = ['lock'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('rentableLock');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const lock = await this.manager.load('lock');
      if (!lock) {
        throw new Error('Lock type not found - required for RentableLock');
      }

      this.obj = await this.manager.define('rentableLock', lock, {
        properties: {
          name: 'Rentable Lock',
          description: 'A lock that can be rented for a fee.',
          price: 100, // Rental price
          duration: 3600000, // 1 hour default
          bank: null, // Bank object
          account: null, // Account ID to receive payments
          renters: {}, // { agentId: expiration }
          code: null, // Access code
          linkedLockId: null, // Paired lock for syncing
          locked: true, // Legacy/simple lock
          locks: [], // Composable locks

          abilities: `Lock that grants access via payment. Extends $.lock.

RENTAL: rent(agent, key) transfers 'price' from agent's account to 'account' via 'bank'. Grants access for 'duration' ms.

ACCESS: canAccess(agent, target, code) checks:
1. Is agent a current renter (not expired)?
2. Does code match 'code'?
3. Do all composable 'locks' allow?

RENTERS: 'renters' map tracks { agentId: expirationTimestamp }. isRenter() checks current status.

EXTENSION: Renting while already active extends duration, keeps same code.

CODE: Generated on first rental. syncCode() updates linked lock for paired doors.

COMPOSABLE: 'locks' array can contain additional lock objects (biometric, keycard, etc).`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    obj.setMethod(
      'canAccess',
      `
      /** Check if agent can access via rental, code, and lock system. */
      const agent = args[0];
      const target = args[1];
      const inputCode = args[2];
      const now = Date.now();
      const renters = self.renters || {};
      const agentId = agent?.id;
      if (!agentId) return 'Invalid agent.';
      if (!renters[agentId] || renters[agentId] < now) {
        return 'Access denied. Please rent to unlock.';
      }
      // If code is set, require correct code
      if (self.code && inputCode !== self.code) {
        return 'Access denied. Incorrect code.';
      }
      // Composable locks
      const locks = self.locks || [];
      for (const lock of locks) {
        if (!lock || !lock.canAccess) continue;
        const result = await lock.canAccess(agent, target);
        if (result !== true) {
          return result;
        }
      }
      return true;
    `,
    );

    obj.setMethod(
      'rent',
      `
      /** Rent the lock for duration by paying price to account via bank. Extends rental if active, keeps code. Uses $.format for messages. */
      const agent = args[0];
      const idempotencyKey = args[1];
      const price = self.price || 100;
      const duration = self.duration || 3600000;
      const bank = self.bank || null;
      const account = self.account;
      if (!bank || !account) {
        return { success: false, error: 'Bank or account not configured.' };
      }
      // Find agent's account
      const agentAccounts = await bank.getAccountByOwner(agent);
      if (!agentAccounts || agentAccounts.length === 0) {
        return { success: false, error: 'Agent has no bank account.' };
      }
      const agentAccountId = agentAccounts[0].accountId;
      // Transfer payment
      const tx = await bank.transfer(agentAccountId, account, price, idempotencyKey, 'Lock rental');
      if (!tx.success) {
        return { success: false, error: tx.error };
      }
      // Grant or extend access
      const renters = self.renters || {};
      const now = Date.now();
      let code = self.code;
      if (renters[agent.id] && renters[agent.id] > now) {
        // Extend rental, keep code
        renters[agent.id] = renters[agent.id] + duration;
      } else {
        // New rental, generate code
        code = Math.random().toString(36).slice(-8).toUpperCase();
        renters[agent.id] = now + duration;
        await self.syncCode(code);
      }
      self.renters = renters;
      self.locked = false;
      const msg = await $.format('Access granted for {0} minutes. Code: {1}', Math.round(duration/60000), code);
      return { success: true, message: msg, code: code };
    `,
    );
    // Example usage of $.prompt for code entry (to be called from exit verb handler)
    obj.setMethod(
      'promptForCode',
      `
          /** Prompt agent for code and check access. */
          const agent = args[0];
          const target = args[1];
          const promptMsg = 'Enter your access code:';
          const inputCode = await $.prompt(agent, promptMsg);
          return await self.canAccess(agent, target, inputCode);
        `,
    );
    obj.setMethod(
      'syncCode',
      `
      /** Set code and sync with linked lock. */
      const code = args[0];
      self.code = code;
      if (self.linkedLock) {
        self.linkedLock.code = code;
      }
    `,
    );

    obj.setMethod(
      'revoke',
      `
      /** Remove agent's access. */
      const agent = args[0];
      const renters = self.renters || {};
      if (agent && renters[agent.id]) {
        delete renters[agent.id];
        self.renters = renters;
      }
    `,
    );

    obj.setMethod(
      'isRenter',
      `
      /** Check if agent currently has access. */
      const agent = args[0];
      const now = Date.now();
      const renters = self.renters || {};
      return !!(agent && renters[agent.id] && renters[agent.id] > now);
    `,
    );

    // Property descriptions
    obj.setPropertyDescription('price', 'Rental price in credits (integer)');
    obj.setPropertyDescription(
      'duration',
      'Rental duration in milliseconds (default 1 hour)',
    );
    obj.setPropertyDescription(
      'bank',
      'Bank object for processing payments (ObjRef)',
    );
    obj.setPropertyDescription(
      'account',
      'Account ID to receive rental payments (string)',
    );
    obj.setPropertyDescription(
      'renters',
      'Map of agent IDs to expiration timestamps { agentId: timestamp }',
    );
    obj.setPropertyDescription(
      'code',
      'Access code generated on rental (string)',
    );
    obj.setPropertyDescription(
      'linkedLockId',
      'Paired lock for syncing codes on double-doors (integer)',
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[RentableLockBuilder] Type 'rentableLock' auto-aliased");
  }
}

// Self-register
registerBuilder(RentableLockBuilder);
