import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the BankTerminal prototype
 * Physical kiosk that provides player access to the banking system.
 *
 * The terminal connects to a Bank object and provides $.prompt-based menus for:
 * - Check balance
 * - Transfer funds
 * - Transaction history
 * - Buy/deposit credchips (physical bearer tokens)
 * - Open account (if player doesn't have one)
 *
 * Credchips are physical tokens representing electronic value:
 * - Buy: money is burned from account, credchip created
 * - Deposit: credchip consumed, money issued to account
 * - Enables anonymous value transfer (and money laundering...)
 */
export class BankTerminalBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parentId,
      properties: {
        name: 'Bank Terminal',
        description: 'A sleek banking kiosk with a touchscreen interface. The corporate logo pulses softly.',
        // Reference to the bank this terminal connects to (default: system bank)
        bank: null, // Will use $.bank if null
        // Fees for various operations
        fees: {
          transfer: 0,      // Flat fee per transfer
          credchip: 10,     // Fee to buy a credchip
          deposit: 0,       // Fee to deposit a credchip
        },
        // Credchip denominations available
        credchipDenominations: [100, 500, 1000, 5000, 10000],
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // BANK ACCESS
    // ═══════════════════════════════════════════════════════════════════

    // getBank() - get the bank this terminal connects to
    obj.setMethod('getBank', `
      if (self.bank) {
        return self.bank;
      }
      // Default to system bank
      return $.bank;
    `);

    // getPlayerAccount(player) - find or prompt to create account
    obj.setMethod('getPlayerAccount', `
      const player = args[0];
      if (!player) return null;

      const bank = await self.getBank();
      if (!bank) return null;

      const accounts = await bank.getAccountByOwner(player);
      if (accounts.length > 0) {
        return accounts[0];  // Return first account
      }

      return null;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // MAIN MENU
    // ═══════════════════════════════════════════════════════════════════

    // doUse - main interaction, show menu
    obj.setMethod('doUse', `
      const context = args[0];
      const player = args[1];

      if (!player) return 'Use what?';

      if (!$.prompt) {
        return 'The terminal flickers. System error.';
      }

      const bank = await self.getBank();
      if (!bank) {
        return 'NETWORK ERROR: Unable to connect to banking system.';
      }

      // Check if player has an account
      const account = await self.getPlayerAccount(player);

      // Build menu options
      const options = {};

      if (account) {
        options.balance = 'Check Balance';
        options.transfer = 'Transfer Funds';
        options.history = 'Transaction History';
        options.credchip = 'Buy Credchip';
        options.deposit = 'Deposit Credchip';
      } else {
        options.open = 'Open Account';
      }
      options.cancel = 'Cancel';

      const choice = await $.prompt.choice(player, 'BANKING SERVICES', options);

      if (!choice || choice === 'cancel') {
        return 'You step away from the terminal.';
      }

      // Dispatch to handler
      switch (choice) {
        case 'balance':
          return await self.showBalance(player, account);
        case 'transfer':
          return await self.showTransfer(player, account);
        case 'history':
          return await self.showHistory(player, account);
        case 'credchip':
          return await self.showBuyCredchip(player, account);
        case 'deposit':
          return await self.showDepositCredchip(player, account);
        case 'open':
          return await self.showOpenAccount(player);
        default:
          return 'Invalid selection.';
      }
    `);

    // ═══════════════════════════════════════════════════════════════════
    // BALANCE
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('showBalance', `
      const player = args[0];
      const account = args[1];

      if (!account) return 'No account found.';

      const bank = await self.getBank();
      const result = await bank.getBalance(account.accountId);

      if (!result.success) {
        return 'ERROR: ' + result.error;
      }

      // Format with commas
      const formatted = result.balance.toLocaleString();

      await player.tell('═══════════════════════════════════════');
      await player.tell('ACCOUNT: ' + account.accountId);
      await player.tell('BALANCE: ¤' + formatted);
      await player.tell('═══════════════════════════════════════');

      return '';
    `);

    // ═══════════════════════════════════════════════════════════════════
    // TRANSFER
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('showTransfer', `
      const player = args[0];
      const account = args[1];

      if (!account) return 'No account found.';
      if (!$.prompt) return 'System error.';

      const bank = await self.getBank();

      // Get current balance
      const balResult = await bank.getBalance(account.accountId);
      if (!balResult.success) {
        return 'ERROR: ' + balResult.error;
      }

      const balance = balResult.balance;
      const fee = (self.fees && self.fees.transfer) || 0;

      await player.tell('Current balance: ¤' + balance.toLocaleString());
      if (fee > 0) {
        await player.tell('Transfer fee: ¤' + fee);
      }

      // Get destination account
      const destId = await $.prompt.question(player, 'Enter destination account ID (or "cancel"):');
      if (!destId || destId.toLowerCase() === 'cancel') {
        return 'Transfer cancelled.';
      }

      // Verify destination exists
      const destAccount = await bank.getAccount(destId);
      if (!destAccount) {
        return 'ERROR: Account ' + destId + ' not found.';
      }

      // Get amount
      const amountStr = await $.prompt.question(player, 'Enter amount to transfer:');
      if (!amountStr) {
        return 'Transfer cancelled.';
      }

      const amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount <= 0) {
        return 'ERROR: Invalid amount.';
      }

      const totalCost = amount + fee;
      if (totalCost > balance) {
        return 'ERROR: Insufficient funds. You need ¤' + totalCost + ' (including fee).';
      }

      // Confirm
      const confirm = await $.prompt.confirm(player,
        'Transfer ¤' + amount.toLocaleString() + ' to ' + destId + '?' +
        (fee > 0 ? ' (Fee: ¤' + fee + ')' : '')
      );

      if (!confirm) {
        return 'Transfer cancelled.';
      }

      // Execute transfer
      const idempotencyKey = 'transfer-' + player.id + '-' + Date.now();
      const result = await bank.transfer(
        account.accountId,
        destId,
        amount,
        idempotencyKey,
        'Terminal transfer by ' + player.name
      );

      if (!result.success) {
        return 'TRANSFER FAILED: ' + result.error;
      }

      // Deduct fee if any
      if (fee > 0) {
        const feeKey = 'fee-' + player.id + '-' + Date.now();
        await bank.burn(account.accountId, fee, feeKey, 'Transfer fee');
      }

      await player.tell('═══════════════════════════════════════');
      await player.tell('TRANSFER COMPLETE');
      await player.tell('Amount: ¤' + amount.toLocaleString());
      await player.tell('To: ' + destId);
      await player.tell('New balance: ¤' + result.fromBalance.toLocaleString());
      await player.tell('Transaction ID: ' + result.txId);
      await player.tell('═══════════════════════════════════════');

      return '';
    `);

    // ═══════════════════════════════════════════════════════════════════
    // HISTORY
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('showHistory', `
      const player = args[0];
      const account = args[1];

      if (!account) return 'No account found.';

      const bank = await self.getBank();
      const history = await bank.getAccountHistory(account.accountId, 10);

      if (history.length === 0) {
        return 'No transactions found.';
      }

      await player.tell('═══════════════════════════════════════');
      await player.tell('RECENT TRANSACTIONS');
      await player.tell('───────────────────────────────────────');

      for (const tx of history) {
        let line = tx.timestamp.substring(0, 10) + ' | ';

        if (tx.type === 'issue') {
          line += '+¤' + tx.amount.toLocaleString() + ' (issued)';
        } else if (tx.type === 'burn') {
          line += '-¤' + Math.abs(tx.amount).toLocaleString() + ' (burned)';
        } else if (tx.type === 'transfer') {
          if (tx.from === account.accountId) {
            line += '-¤' + tx.amount.toLocaleString() + ' to ' + tx.to;
          } else {
            line += '+¤' + tx.amount.toLocaleString() + ' from ' + tx.from;
          }
        }

        if (tx.memo) {
          line += ' [' + tx.memo + ']';
        }

        await player.tell(line);
      }

      await player.tell('═══════════════════════════════════════');

      return '';
    `);

    // ═══════════════════════════════════════════════════════════════════
    // CREDCHIPS
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('showBuyCredchip', `
      const player = args[0];
      const account = args[1];

      if (!account) return 'No account found.';
      if (!$.prompt) return 'System error.';

      const bank = await self.getBank();

      // Get current balance
      const balResult = await bank.getBalance(account.accountId);
      if (!balResult.success) {
        return 'ERROR: ' + balResult.error;
      }

      const balance = balResult.balance;
      const fee = (self.fees && self.fees.credchip) || 0;

      await player.tell('Current balance: ¤' + balance.toLocaleString());
      await player.tell('Credchip fee: ¤' + fee);
      await player.tell('');

      // Show denomination options
      const denoms = self.credchipDenominations || [100, 500, 1000];
      const options = {};

      for (const d of denoms) {
        const total = d + fee;
        if (total <= balance) {
          options[String(d)] = '¤' + d.toLocaleString() + ' credchip (total: ¤' + total + ')';
        }
      }

      if (Object.keys(options).length === 0) {
        return 'Insufficient funds for any credchip denomination.';
      }

      options.custom = 'Custom amount';
      options.cancel = 'Cancel';

      const choice = await $.prompt.choice(player, 'Select credchip value:', options);

      if (!choice || choice === 'cancel') {
        return 'Cancelled.';
      }

      let amount;
      if (choice === 'custom') {
        const amountStr = await $.prompt.question(player, 'Enter credchip value:');
        if (!amountStr) return 'Cancelled.';
        amount = parseInt(amountStr, 10);
        if (isNaN(amount) || amount <= 0) {
          return 'ERROR: Invalid amount.';
        }
      } else {
        amount = parseInt(choice, 10);
      }

      const totalCost = amount + fee;
      if (totalCost > balance) {
        return 'ERROR: Insufficient funds. You need ¤' + totalCost + '.';
      }

      // Confirm
      const confirm = await $.prompt.confirm(player,
        'Buy ¤' + amount.toLocaleString() + ' credchip for ¤' + totalCost + '?'
      );

      if (!confirm) {
        return 'Cancelled.';
      }

      // Burn the money from account
      const idempotencyKey = 'credchip-buy-' + player.id + '-' + Date.now();
      const burnResult = await bank.burn(
        account.accountId,
        totalCost,
        idempotencyKey,
        'Credchip purchase ¤' + amount
      );

      if (!burnResult.success) {
        return 'ERROR: ' + burnResult.error;
      }

      // Create the credchip object
      const credchip = await self.createCredchip(amount);
      if (!credchip) {
        // Refund on failure
        const refundKey = 'credchip-refund-' + player.id + '-' + Date.now();
        await bank.issue(account.accountId, totalCost, refundKey, 'Credchip refund');
        return 'ERROR: Failed to create credchip. Funds refunded.';
      }

      // Give to player
      credchip.location = player;

      await player.tell('═══════════════════════════════════════');
      await player.tell('CREDCHIP DISPENSED');
      await player.tell('Value: ¤' + amount.toLocaleString());
      await player.tell('Serial: ' + (credchip.serial || credchip.id));
      await player.tell('New balance: ¤' + burnResult.balance.toLocaleString());
      await player.tell('═══════════════════════════════════════');

      // Announce
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: '',
          others: player.name + ' retrieves a credchip from the terminal.',
        });
      }

      return '';
    `);

    // createCredchip(amount) - create a credchip object with given value
    obj.setMethod('createCredchip', `
      const amount = args[0];

      if (!$.recycler) {
        return null;
      }

      // Get credchip prototype (or create from describable)
      const credchipProto = $.credchip || $.describable;
      if (!credchipProto) {
        return null;
      }

      // Generate serial number
      const serial = 'CC-' + Date.now().toString(36).toUpperCase() + '-' +
                     Math.random().toString(36).substring(2, 6).toUpperCase();

      const chip = await $.recycler.create({
        parent: credchipProto.id,
        properties: {
          name: '¤' + amount.toLocaleString() + ' credchip',
          description: 'A small plastic chip with embedded circuitry. Serial: ' + serial,
          aliases: ['credchip', 'chip', 'cred'],
          value: amount,
          serial: serial,
          isCredchip: true,
          // One-time use - consumed on deposit
          consumed: false,
        },
      });

      return chip;
    `);

    obj.setMethod('showDepositCredchip', `
      const player = args[0];
      const account = args[1];

      if (!account) return 'No account found.';
      if (!$.prompt) return 'System error.';

      // Find credchips in player's inventory
      const contents = player.contents || [];
      const credchips = [];

      for (const itemRef of contents) {
        const item = typeof itemRef === 'object' ? itemRef : await $.load(itemRef);
        if (item && item.isCredchip && !item.consumed) {
          credchips.push(item);
        }
      }

      if (credchips.length === 0) {
        return 'You have no credchips to deposit.';
      }

      // Build selection menu
      const options = {};
      for (let i = 0; i < credchips.length; i++) {
        const chip = credchips[i];
        options[String(i)] = chip.name + ' (Serial: ' + (chip.serial || '???') + ')';
      }
      options.cancel = 'Cancel';

      const choice = await $.prompt.choice(player, 'Select credchip to deposit:', options);

      if (!choice || choice === 'cancel') {
        return 'Cancelled.';
      }

      const chipIndex = parseInt(choice, 10);
      const chip = credchips[chipIndex];

      if (!chip) {
        return 'Invalid selection.';
      }

      const value = chip.value || 0;
      const fee = (self.fees && self.fees.deposit) || 0;
      const netValue = value - fee;

      if (netValue <= 0) {
        return 'ERROR: Credchip value does not cover deposit fee.';
      }

      // Confirm
      const confirm = await $.prompt.confirm(player,
        'Deposit ' + chip.name + ' for ¤' + netValue.toLocaleString() + '?' +
        (fee > 0 ? ' (Fee: ¤' + fee + ')' : '')
      );

      if (!confirm) {
        return 'Cancelled.';
      }

      // Mark chip as consumed
      chip.consumed = true;

      // Issue money to account
      const bank = await self.getBank();
      const idempotencyKey = 'credchip-deposit-' + chip.serial + '-' + Date.now();
      const result = await bank.issue(
        account.accountId,
        netValue,
        idempotencyKey,
        'Credchip deposit ' + chip.serial
      );

      if (!result.success) {
        chip.consumed = false;  // Rollback
        return 'ERROR: ' + result.error;
      }

      // Recycle the chip
      if ($.recycler) {
        await $.recycler.recycle(chip);
      }

      await player.tell('═══════════════════════════════════════');
      await player.tell('CREDCHIP DEPOSITED');
      await player.tell('Value: ¤' + value.toLocaleString());
      if (fee > 0) {
        await player.tell('Fee: ¤' + fee);
      }
      await player.tell('Credited: ¤' + netValue.toLocaleString());
      await player.tell('New balance: ¤' + result.balance.toLocaleString());
      await player.tell('═══════════════════════════════════════');

      return '';
    `);

    // ═══════════════════════════════════════════════════════════════════
    // OPEN ACCOUNT
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('showOpenAccount', `
      const player = args[0];

      if (!$.prompt) return 'System error.';

      // Check if already has account
      const existing = await self.getPlayerAccount(player);
      if (existing) {
        return 'You already have an account: ' + existing.accountId;
      }

      await player.tell('═══════════════════════════════════════');
      await player.tell('NEW ACCOUNT REGISTRATION');
      await player.tell('───────────────────────────────────────');
      await player.tell('By opening an account, you agree to:');
      await player.tell('• All transactions are monitored');
      await player.tell('• Identity verification is required');
      await player.tell('• Suspicious activity will be reported');
      await player.tell('═══════════════════════════════════════');

      const confirm = await $.prompt.confirm(player, 'Proceed with account creation?');

      if (!confirm) {
        return 'Account creation cancelled.';
      }

      const bank = await self.getBank();
      const idempotencyKey = 'account-create-' + player.id + '-' + Date.now();
      const result = await bank.createAccount(player, idempotencyKey);

      if (!result.success) {
        return 'ERROR: ' + result.error;
      }

      await player.tell('');
      await player.tell('═══════════════════════════════════════');
      await player.tell('ACCOUNT CREATED');
      await player.tell('Account ID: ' + result.accountId);
      await player.tell('Starting balance: ¤0');
      await player.tell('');
      await player.tell('Welcome to the system.');
      await player.tell('═══════════════════════════════════════');

      return '';
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DESCRIBE
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('describe', `
      let desc = self.name + '\\r\\n';
      desc += self.description + '\\r\\n';
      desc += '\\r\\n';
      desc += 'Type "use terminal" or "bank" to access services.';
      return desc;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // VERB REGISTRATION
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('registerVerbsFor', `
      const player = args[0];
      if (!player || !player.registerVerb) return;

      await player.registerVerb(['use terminal', 'use bank terminal', 'use kiosk'], self, 'doUse');
      await player.registerVerb(['bank', 'banking'], self, 'doUse');
      await player.registerVerb(['check balance', 'balance'], self, 'doBalance');
    `);

    // doBalance - shortcut for balance check
    obj.setMethod('doBalance', `
      const context = args[0];
      const player = args[1];

      if (!player) return 'Check whose balance?';

      const account = await self.getPlayerAccount(player);
      if (!account) {
        return 'You do not have a bank account. Use the terminal to open one.';
      }

      return await self.showBalance(player, account);
    `);

    // onArrived - register verbs when placed in room
    obj.setMethod('onArrived', `
      const dest = args[0];

      if (dest && dest.contents) {
        for (const objId of dest.contents) {
          const obj = await $.load(objId);
          if (obj && obj.isPlayer && obj.registerVerb) {
            await self.registerVerbsFor(obj);
          }
        }
      }
    `);

    // onLeaving - unregister verbs when leaving
    obj.setMethod('onLeaving', `
      const source = args[0];

      if (source && source.contents) {
        for (const objId of source.contents) {
          const obj = await $.load(objId);
          if (obj && obj.isPlayer && obj.unregisterVerbsFrom) {
            await obj.unregisterVerbsFrom(self.id);
          }
        }
      }
    `);

    // onPlayerArrived - register verbs when player enters room
    obj.setMethod('onPlayerArrived', `
      const player = args[0];
      await self.registerVerbsFor(player);
    `);

    return obj;
  }
}
