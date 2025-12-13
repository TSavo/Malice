import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * WirelessPhone extends Phone with battery, signal checks, and ringtone.
 */
export class WirelessPhoneBuilder {
  constructor(private manager: ObjectManager) {}

  async build(phoneId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: phoneId,
      properties: {
        name: 'Wireless Phone',
        description: 'A wireless phone handset.',
        battery: 100,
        signal: 5,
        ringtone: 'ring',
      },
      methods: {},
    });

    obj.setMethod('canUse', `
      if ((self.battery ?? 0) <= 0) return 'The phone is out of battery.';
      if ((self.signal ?? 0) <= 0) return 'No signal here.';
      return true;
    `);

    obj.setMethod('dial', `
      const usable = await self.canUse();
      if (usable !== true) return usable;
      return await pass(...args);
    `);

    obj.setMethod('sendMessage', `
      const usable = await self.canUse();
      if (usable !== true) return usable;
      return await pass(...args);
    `);

    obj.setMethod('onIncomingCall', `
      const from = args[0];
      const tone = self.ringtone || 'ring';
      await $.tell(self, 'Incoming call from ' + (from.number || from.name || 'unknown') + ' [' + tone + ']');
    `);

    return obj;
  }
}
