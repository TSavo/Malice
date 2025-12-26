import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * PhoneDb: registry mapping numbers to phone objects.
 */
export class PhoneDbBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(describableId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Phone Directory',
        description: 'Maps phone numbers to phone devices.',
        abilities: `Central registry mapping phone numbers to physical devices.

REGISTRATION: Phones register their number via register(number, phone).
Unregister via unregister(number) when phone is destroyed or reassigned.

LOOKUP: findPhoneByNumber(number) returns the phone object or null.
Used by phone system to route calls to physical devices.

PERSISTENCE: Registry survives server restarts. Numbers are strings
to support formats like "555-1234" or extension codes.`,
        registry: {}, // { number: phoneId }
      },
      methods: {},
    });

    obj.setMethod('register', `
      const number = args[0];
      const phone = args[1];
      if (!number || !phone) return 'number and phone required';
      const reg = self.registry || {};
      reg[number] = phone;
      self.registry = reg;
    `);

    obj.setMethod('unregister', `
      const number = args[0];
      if (!number) return;
      const reg = self.registry || {};
      delete reg[number];
      self.registry = reg;
    `);

    obj.setMethod('findPhoneByNumber', `
      const number = args[0];
      if (!number) return null;
      const reg = self.registry || {};
      return reg[number] || null;
    `);

    return obj;
  }
}
