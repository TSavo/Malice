import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * PhoneDb: registry mapping numbers to phone objects.
 */
export class PhoneDbBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Phone Directory',
        description: 'Maps phone numbers to phone devices.',
        registry: {}, // { number: phoneId }
      },
      methods: {},
    });

    obj.setMethod('register', `
      const number = args[0];
      const phone = args[1];
      if (!number || !phone) return 'number and phone required';
      const reg = self.registry || {};
      reg[number] = typeof phone === 'number' ? phone : phone.id;
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
      const id = reg[number];
      if (!id) return null;
      return await $.load(id);
    `);

    return obj;
  }
}
