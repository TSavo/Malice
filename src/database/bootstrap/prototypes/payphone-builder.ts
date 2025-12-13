import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Payphone extends Phone: bolted down, requires bank payment per call.
 */
export class PayphoneBuilder {
  constructor(private manager: ObjectManager) {}

  async build(phoneId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: phoneId,
      properties: {
        name: 'Payphone',
        description: 'A bolted-down public phone.',
        boltedDown: true,
        pricePerCall: 1,
        bank: null,
        account: null,
      },
      methods: {},
    });

    obj.setMethod('dial', `
      const targetNumber = args[0];
      const bank = self.bank ? await $.load(self.bank) : ($.bank || null);
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
    `);

    return obj;
  }
}
