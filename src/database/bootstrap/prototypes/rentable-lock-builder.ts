import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the RentableLock prototype
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
export class RentableLockBuilder {
  constructor(private manager: ObjectManager) {}

  async build(lockId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: lockId,
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
      },
      methods: {},
    });

    obj.setMethod('canAccess', `
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
        if (!lock) continue;
        const lockObj = typeof lock === 'number' ? await $.load(lock) : lock;
        if (!lockObj || !lockObj.canAccess) continue;
        const result = await lockObj.canAccess(agent, target);
        if (result !== true) {
          return result;
        }
      }
      return true;
    `);

    obj.setMethod('rent', `
      /** Rent the lock for duration by paying price to account via bank. Extends rental if active, keeps code. Uses $.format for messages. */
      const agent = args[0];
      const idempotencyKey = args[1];
      const price = self.price || 100;
      const duration = self.duration || 3600000;
      const bank = self.bank ? await $.load(self.bank) : null;
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
    `);
        // Example usage of $.prompt for code entry (to be called from exit verb handler)
        obj.setMethod('promptForCode', `
          /** Prompt agent for code and check access. */
          const agent = args[0];
          const target = args[1];
          const promptMsg = 'Enter your access code:';
          const inputCode = await $.prompt(agent, promptMsg);
          return await self.canAccess(agent, target, inputCode);
        `);
    obj.setMethod('syncCode', `
      /** Set code and sync with linked lock. */
      const code = args[0];
      self.code = code;
      if (self.linkedLockId) {
        const linkedLock = await $.load(self.linkedLockId);
        if (linkedLock) linkedLock.code = code;
      }
    `);

    obj.setMethod('revoke', `
      /** Remove agent's access. */
      const agent = args[0];
      const renters = self.renters || {};
      if (agent && renters[agent.id]) {
        delete renters[agent.id];
        self.renters = renters;
      }
    `);

    obj.setMethod('isRenter', `
      /** Check if agent currently has access. */
      const agent = args[0];
      const now = Date.now();
      const renters = self.renters || {};
      return !!(agent && renters[agent.id] && renters[agent.id] > now);
    `);

    return obj;
  }
}
