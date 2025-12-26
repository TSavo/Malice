import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Payphone extends Phone: bolted down, requires bank payment per call.
 */
export class PayphoneBuilder {
  constructor(private manager: ObjectManager) {}

  async build(phoneId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(phoneId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Payphone',
        description: 'A bolted-down public phone.',
        boltedDown: true,
        pricePerCall: 1,
        bank: null,
        account: null,

        abilities: `Fixed public telephone requiring payment per call. Extends $.phone.

PAYMENT: dial() charges 'pricePerCall' from caller's bank account to 'account' before connecting.

BANK: 'bank' reference (defaults to $.bank). 'account' is destination for payments.

IMMOVABLE: 'boltedDown' true. Cannot be picked up.

USAGE: Caller needs bank account with sufficient balance. Out of service if bank not configured.`,
      },
      methods: {},
    });

    obj.setMethod(
      'dial',
      `
      const targetNumber = args[0];
      const bank = self.bank || $.bank || null;
      const account = self.account;
      if (!bank || !account) return 'This payphone is out of service (no bank hookup).';
      const caller = args[1] || null;
      if (!caller) return 'No caller.';

      // charge caller
      const accounts = await bank.getAccountByOwner(caller);
      if (!accounts || !accounts.length) return 'You have no bank account.';
      const callerAccount = accounts[0].accountId;
      const price = self.pricePerCall ?? 1;
      const tx = await bank.transfer(callerAccount, account, price, 'payphone-' + Date.now(), 'Payphone call');
      if (!tx?.success) return tx?.error || 'Payment failed.';

      // proceed with normal dial
      return await pass(targetNumber);
    `,
    );

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

    return obj;
  }
}
