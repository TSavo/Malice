import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * WirelessPhone extends Phone with battery, signal checks, and ringtone.
 */
export class WirelessPhoneBuilder {
  constructor(private manager: ObjectManager) {}

  async build(phoneId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(phoneId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Wireless Phone',
        description: 'A wireless phone handset.',
        battery: 100,
        signal: 5,
        ringtone: 'ring',

        abilities: `Portable phone with battery and signal requirements. Extends $.phone.

BATTERY: 'battery' 0-100. Depletes with use. Must be > 0 to function.

SIGNAL: 'signal' 0-5. Location-dependent. Must be > 0 to connect. Underground/shielded areas block signal.

USAGE: canUse() checks battery and signal. dial()/sendMessage() fail if unavailable.

RINGTONE: 'ringtone' customizable alert sound for incoming calls.

PORTABLE: Can be picked up, carried. Unlike payphones.`,
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

    obj.setPropertyDescription('battery', 'Battery charge level from 0-100, must be above 0 to function');
    obj.setPropertyDescription('signal', 'Signal strength from 0-5, location-dependent, must be above 0 to connect');
    obj.setPropertyDescription('ringtone', 'Customizable alert sound for incoming calls');

    return obj;
  }
}
