import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Payphone type extends Phone: bolted down, requires bank payment per call.
 * Uses abilities-first architecture for payment handling.
 */
export class PayphoneBuilder implements Builder {
  static provides = ['payphone'];
  static depends = ['phone'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists (types auto-alias)
    const existing = await this.manager.load('payphone');
    if (existing) {
      this.obj = existing;
    } else {
      // Create payphone as a TYPE
      const phone = await this.manager.load('phone');
      if (!phone) throw new Error('Phone type not found');

      this.obj = await this.manager.define('payphone', phone, {
        properties: {
          name: 'Payphone',
          description: 'A bolted-down public phone.',
          boltedDown: true,
          pricePerCall: 1,
          bank: null,
          account: null,
          ringtone: 'rings with a harsh electronic tone',

          abilities: `Fixed public telephone requiring payment per call.

PAYMENT: Making a call charges 'pricePerCall' from the caller's bank account.
The payment is transferred to 'account' before the connection is established.
If payment fails, the call does not go through.

BANK: 'bank' reference (defaults to $bank) processes all payments.
'account' is the destination account for collected call fees.

IMMOVABLE: 'boltedDown' is true. Payphones are fixed installations that
cannot be picked up or moved. Typically found in public spaces.

USAGE: The caller needs a bank account with sufficient balance.
If the bank or destination account is not configured, the phone is out of service.

RECEIVING: Incoming calls to a payphone ring normally - no payment required
to answer. Only outgoing calls require payment.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    // dial() - charge payment before dialing
    obj.setMethod(
      'dial',
      `
      /** Dial a number, charging payment first.
       *  @param targetNumber - The phone number to dial
       *  @param caller - The agent making the call (for payment)
       *  @returns Result object from parent dial()
       */
      const targetNumber = args[0];
      const caller = args[1] || null;

      const bank = self.bank || $bank || null;
      const account = self.account;

      if (!bank || !account) {
        return { success: false, error: 'This payphone is out of service.' };
      }
      if (!caller) {
        return { success: false, error: 'No caller specified for payment.' };
      }

      // Get caller's bank account
      const accounts = await bank.getAccountByOwner(caller);
      if (!accounts || !accounts.length) {
        return { success: false, error: 'You have no bank account to pay for the call.' };
      }

      // Charge for the call
      const callerAccount = accounts[0].accountId;
      const price = self.pricePerCall ?? 1;
      const tx = await bank.transfer(
        callerAccount,
        account,
        price,
        'payphone-' + Date.now(),
        'Payphone call'
      );

      if (!tx?.success) {
        return { success: false, error: tx?.error || 'Payment failed. Insufficient funds?' };
      }

      // Payment successful - proceed with normal dial
      return await pass(targetNumber);
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'boltedDown',
      'Whether the payphone is fixed in place and cannot be moved',
    );
    obj.setPropertyDescription(
      'pricePerCall',
      'Cost in currency units charged per call',
    );
    obj.setPropertyDescription(
      'bank',
      'Reference to the bank object that processes payments',
    );
    obj.setPropertyDescription(
      'account',
      'Destination account ID where call payments are deposited',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[PayphoneBuilder] Type 'payphone' auto-aliased`);
  }
}

// Self-register
registerBuilder(PayphoneBuilder);
