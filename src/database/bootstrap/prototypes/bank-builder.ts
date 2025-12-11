import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Bank prototype
 * Foundation for all electronic currency in the game.
 *
 * Design principles:
 * - IDEMPOTENCY: Every mutating operation takes an idempotencyKey.
 *   If the same key is used twice, return the original result without re-executing.
 * - ATOMICITY: Transfers either fully complete or fully fail. No partial states.
 * - INTEGER ONLY: All amounts are positive integers. No decimals, no floats.
 *
 * Structure:
 *   accounts: {
 *     "acc-uuid": { owner: objref, balance: int, createdAt: ISO, frozen: bool }
 *   }
 *   ledger: [
 *     { id, type, account, amount, balance, timestamp, memo, idempotencyKey }
 *   ]
 *   processedKeys: { "key": { result, timestamp } }
 */
export class BankBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parentId,
      properties: {
        name: 'Bank',
        description: 'Electronic currency ledger',
        // Accounts keyed by account ID
        accounts: {},
        // Transaction ledger (append-only)
        ledger: [],
        // Processed idempotency keys -> results
        processedKeys: {},
        // Counter for generating unique IDs
        nextAccountNum: 1,
        nextTxNum: 1,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // VALIDATION HELPERS
    // ═══════════════════════════════════════════════════════════════════

    // validateAmount(amount) - ensure positive integer
    obj.setMethod('validateAmount', `
      const amount = args[0];

      if (amount === undefined || amount === null) {
        return { valid: false, error: 'Amount required.' };
      }

      // Must be a number
      if (typeof amount !== 'number') {
        return { valid: false, error: 'Amount must be a number.' };
      }

      // Must be an integer
      if (!Number.isInteger(amount)) {
        return { valid: false, error: 'Amount must be an integer (no decimals).' };
      }

      // Must be positive
      if (amount <= 0) {
        return { valid: false, error: 'Amount must be positive.' };
      }

      // Must be finite and reasonable
      if (!Number.isFinite(amount) || amount > Number.MAX_SAFE_INTEGER) {
        return { valid: false, error: 'Amount out of range.' };
      }

      return { valid: true, amount: amount };
    `);

    // checkIdempotency(key) - check if operation was already processed
    // Returns { processed: bool, result?: any }
    obj.setMethod('checkIdempotency', `
      const key = args[0];

      if (!key) {
        return { processed: false };
      }

      const processed = self.processedKeys || {};
      if (processed[key]) {
        return { processed: true, result: processed[key].result };
      }

      return { processed: false };
    `);

    // recordIdempotency(key, result) - record that operation was processed
    obj.setMethod('recordIdempotency', `
      const key = args[0];
      const result = args[1];

      if (!key) return;

      const processed = self.processedKeys || {};
      processed[key] = {
        result: result,
        timestamp: new Date().toISOString(),
      };
      self.processedKeys = processed;
    `);

    // generateAccountId() - generate unique account ID
    obj.setMethod('generateAccountId', `
      const num = self.nextAccountNum || 1;
      self.nextAccountNum = num + 1;
      return 'ACC-' + String(num).padStart(6, '0');
    `);

    // generateTxId() - generate unique transaction ID
    obj.setMethod('generateTxId', `
      const num = self.nextTxNum || 1;
      self.nextTxNum = num + 1;
      return 'TX-' + String(num).padStart(8, '0');
    `);

    // ═══════════════════════════════════════════════════════════════════
    // ACCOUNT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    // createAccount(owner, idempotencyKey?) - create new account for owner
    obj.setMethod('createAccount', `
      const owner = args[0];
      const idempotencyKey = args[1];

      // Check idempotency
      if (idempotencyKey) {
        const check = await self.checkIdempotency(idempotencyKey);
        if (check.processed) {
          return check.result;
        }
      }

      if (!owner) {
        const result = { success: false, error: 'Owner required.' };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      const accountId = await self.generateAccountId();
      const accounts = self.accounts || {};

      accounts[accountId] = {
        owner: owner,  // Stored as objref
        balance: 0,
        createdAt: new Date().toISOString(),
        frozen: false,
      };
      self.accounts = accounts;

      const result = { success: true, accountId: accountId };
      if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
      return result;
    `);

    // getAccount(accountId) - get account data
    obj.setMethod('getAccount', `
      const accountId = args[0];
      const accounts = self.accounts || {};
      return accounts[accountId] || null;
    `);

    // getBalance(accountId) - get current balance
    obj.setMethod('getBalance', `
      const accountId = args[0];
      const accounts = self.accounts || {};
      const account = accounts[accountId];

      if (!account) {
        return { success: false, error: 'Account not found.' };
      }

      return { success: true, balance: account.balance };
    `);

    // getAccountByOwner(owner) - find account(s) by owner
    obj.setMethod('getAccountByOwner', `
      const owner = args[0];
      if (!owner) return [];

      const ownerId = typeof owner === 'object' ? owner.id : owner;
      const accounts = self.accounts || {};
      const matches = [];

      for (const [accId, acc] of Object.entries(accounts)) {
        const accOwnerId = typeof acc.owner === 'object' ? acc.owner.id : acc.owner;
        if (accOwnerId === ownerId) {
          matches.push({ accountId: accId, ...acc });
        }
      }

      return matches;
    `);

    // freezeAccount(accountId) - prevent all transactions
    obj.setMethod('freezeAccount', `
      const accountId = args[0];
      const accounts = self.accounts || {};
      const account = accounts[accountId];

      if (!account) {
        return { success: false, error: 'Account not found.' };
      }

      account.frozen = true;
      self.accounts = accounts;

      return { success: true };
    `);

    // unfreezeAccount(accountId) - allow transactions again
    obj.setMethod('unfreezeAccount', `
      const accountId = args[0];
      const accounts = self.accounts || {};
      const account = accounts[accountId];

      if (!account) {
        return { success: false, error: 'Account not found.' };
      }

      account.frozen = false;
      self.accounts = accounts;

      return { success: true };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // TRANSACTIONS
    // ═══════════════════════════════════════════════════════════════════

    // issue(toAccount, amount, idempotencyKey, memo?) - CREATE money into existence
    // This is the ONLY way money enters the system.
    // Used for: job payments, system rewards, initial grants
    obj.setMethod('issue', `
      const accountId = args[0];
      const amount = args[1];
      const idempotencyKey = args[2];
      const memo = args[3] || '';

      // IDEMPOTENCY CHECK
      if (idempotencyKey) {
        const check = await self.checkIdempotency(idempotencyKey);
        if (check.processed) {
          return check.result;
        }
      }

      // Validate amount
      const validation = await self.validateAmount(amount);
      if (!validation.valid) {
        const result = { success: false, error: validation.error };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      // Get account
      const accounts = self.accounts || {};
      const account = accounts[accountId];

      if (!account) {
        const result = { success: false, error: 'Account not found.' };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      if (account.frozen) {
        const result = { success: false, error: 'Account is frozen.' };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      // ATOMIC: Update balance and track issuance
      const newBalance = account.balance + amount;
      account.balance = newBalance;
      self.accounts = accounts;
      self.totalIssued = (self.totalIssued || 0) + amount;

      // Record in ledger
      const txId = await self.generateTxId();
      const ledger = self.ledger || [];
      ledger.push({
        id: txId,
        type: 'issue',
        account: accountId,
        amount: amount,
        balance: newBalance,
        timestamp: new Date().toISOString(),
        memo: memo,
        idempotencyKey: idempotencyKey || null,
      });
      self.ledger = ledger;

      const result = {
        success: true,
        txId: txId,
        balance: newBalance,
      };
      if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
      return result;
    `);

    // burn(fromAccount, amount, idempotencyKey, memo?) - DESTROY money
    // Removes money from existence entirely.
    // Used for: taxes, fines, fees, account closures
    obj.setMethod('burn', `
      const accountId = args[0];
      const amount = args[1];
      const idempotencyKey = args[2];
      const memo = args[3] || '';

      // IDEMPOTENCY CHECK
      if (idempotencyKey) {
        const check = await self.checkIdempotency(idempotencyKey);
        if (check.processed) {
          return check.result;
        }
      }

      // Validate amount
      const validation = await self.validateAmount(amount);
      if (!validation.valid) {
        const result = { success: false, error: validation.error };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      // Get account
      const accounts = self.accounts || {};
      const account = accounts[accountId];

      if (!account) {
        const result = { success: false, error: 'Account not found.' };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      if (account.frozen) {
        const result = { success: false, error: 'Account is frozen.' };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      // Check sufficient funds
      if (account.balance < amount) {
        const result = { success: false, error: 'Insufficient funds.', balance: account.balance };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      // ATOMIC: Update balance and track burn
      const newBalance = account.balance - amount;
      account.balance = newBalance;
      self.accounts = accounts;
      self.totalBurned = (self.totalBurned || 0) + amount;

      // Record in ledger
      const txId = await self.generateTxId();
      const ledger = self.ledger || [];
      ledger.push({
        id: txId,
        type: 'burn',
        account: accountId,
        amount: -amount,
        balance: newBalance,
        timestamp: new Date().toISOString(),
        memo: memo,
        idempotencyKey: idempotencyKey || null,
      });
      self.ledger = ledger;

      const result = {
        success: true,
        txId: txId,
        balance: newBalance,
      };
      if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
      return result;
    `);

    // transfer(fromAccountId, toAccountId, amount, idempotencyKey, memo?) - move funds
    // ATOMIC: Either both accounts update or neither does
    obj.setMethod('transfer', `
      const fromId = args[0];
      const toId = args[1];
      const amount = args[2];
      const idempotencyKey = args[3];
      const memo = args[4] || '';

      // IDEMPOTENCY CHECK
      if (idempotencyKey) {
        const check = await self.checkIdempotency(idempotencyKey);
        if (check.processed) {
          return check.result;
        }
      }

      // Can't transfer to self
      if (fromId === toId) {
        const result = { success: false, error: 'Cannot transfer to same account.' };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      // Validate amount
      const validation = await self.validateAmount(amount);
      if (!validation.valid) {
        const result = { success: false, error: validation.error };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      // Get both accounts
      const accounts = self.accounts || {};
      const fromAccount = accounts[fromId];
      const toAccount = accounts[toId];

      if (!fromAccount) {
        const result = { success: false, error: 'Source account not found.' };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      if (!toAccount) {
        const result = { success: false, error: 'Destination account not found.' };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      if (fromAccount.frozen) {
        const result = { success: false, error: 'Source account is frozen.' };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      if (toAccount.frozen) {
        const result = { success: false, error: 'Destination account is frozen.' };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      // Check sufficient funds
      if (fromAccount.balance < amount) {
        const result = { success: false, error: 'Insufficient funds.', balance: fromAccount.balance };
        if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
        return result;
      }

      // ATOMIC: Update both balances together
      const fromNewBalance = fromAccount.balance - amount;
      const toNewBalance = toAccount.balance + amount;

      fromAccount.balance = fromNewBalance;
      toAccount.balance = toNewBalance;
      self.accounts = accounts;

      // Record in ledger (single transfer entry with both sides)
      const txId = await self.generateTxId();
      const ledger = self.ledger || [];
      ledger.push({
        id: txId,
        type: 'transfer',
        from: fromId,
        to: toId,
        amount: amount,
        fromBalance: fromNewBalance,
        toBalance: toNewBalance,
        timestamp: new Date().toISOString(),
        memo: memo,
        idempotencyKey: idempotencyKey || null,
      });
      self.ledger = ledger;

      const result = {
        success: true,
        txId: txId,
        fromBalance: fromNewBalance,
        toBalance: toNewBalance,
      };
      if (idempotencyKey) await self.recordIdempotency(idempotencyKey, result);
      return result;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // LEDGER QUERIES
    // ═══════════════════════════════════════════════════════════════════

    // getTransaction(txId) - get single transaction by ID
    obj.setMethod('getTransaction', `
      const txId = args[0];
      const ledger = self.ledger || [];
      return ledger.find(tx => tx.id === txId) || null;
    `);

    // getAccountHistory(accountId, limit?) - get transactions for account
    obj.setMethod('getAccountHistory', `
      const accountId = args[0];
      const limit = args[1] || 100;

      const ledger = self.ledger || [];
      const history = [];

      // Walk backwards (most recent first)
      for (let i = ledger.length - 1; i >= 0 && history.length < limit; i--) {
        const tx = ledger[i];
        if (tx.account === accountId || tx.from === accountId || tx.to === accountId) {
          history.push(tx);
        }
      }

      return history;
    `);

    // getRecentTransactions(limit?) - get most recent transactions
    obj.setMethod('getRecentTransactions', `
      const limit = args[0] || 100;
      const ledger = self.ledger || [];
      return ledger.slice(-limit).reverse();
    `);

    // ═══════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════

    // getTotalSupply() - total money in existence (issued - burned)
    obj.setMethod('getTotalSupply', `
      const issued = self.totalIssued || 0;
      const burned = self.totalBurned || 0;
      return issued - burned;
    `);

    // getSupplyStats() - detailed supply information
    obj.setMethod('getSupplyStats', `
      const issued = self.totalIssued || 0;
      const burned = self.totalBurned || 0;
      const supply = issued - burned;

      // Also sum account balances as a sanity check
      const accounts = self.accounts || {};
      let accountTotal = 0;
      for (const acc of Object.values(accounts)) {
        accountTotal += acc.balance || 0;
      }

      return {
        totalIssued: issued,
        totalBurned: burned,
        supply: supply,
        accountTotal: accountTotal,
        balanced: supply === accountTotal,  // Should always be true
      };
    `);

    // getAccountCount() - number of accounts
    obj.setMethod('getAccountCount', `
      const accounts = self.accounts || {};
      return Object.keys(accounts).length;
    `);

    // cleanupOldIdempotencyKeys(maxAgeMs?) - remove old processed keys
    obj.setMethod('cleanupOldIdempotencyKeys', `
      const maxAgeMs = args[0] || (7 * 24 * 60 * 60 * 1000); // Default 7 days
      const cutoff = new Date(Date.now() - maxAgeMs).toISOString();

      const processed = self.processedKeys || {};
      let removed = 0;

      for (const [key, data] of Object.entries(processed)) {
        if (data.timestamp < cutoff) {
          delete processed[key];
          removed++;
        }
      }

      self.processedKeys = processed;
      return removed;
    `);

    return obj;
  }
}
