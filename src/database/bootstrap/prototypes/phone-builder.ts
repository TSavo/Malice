import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Base Phone prototype (abstract-style behaviors).
 * Provides a number, basic dial/send handling, and hooks for subclasses.
 */
export class PhoneBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Phone',
        description: 'A generic phone handset.',
        number: null, // phone number string
        phoneDb: null, // reference to phone DB object
        connectedTo: null, // active call target id
      },
      methods: {},
    });

    obj.setMethod('dial', `
      const targetNumber = args[0];
      if (!targetNumber) return 'No number specified.';
      const db = self.phoneDb ? await $.load(self.phoneDb) : null;
      if (!db || !db.findPhoneByNumber) return 'No phone database configured.';
      const target = await db.findPhoneByNumber(targetNumber);
      if (!target) return 'Number not found.';
      self.connectedTo = target.id;
      if (target.onIncomingCall) {
        await target.onIncomingCall(self);
      }
      return 'Dialing ' + targetNumber + '...';
    `);

    obj.setMethod('hangup', `
      const otherId = self.connectedTo;
      self.connectedTo = null;
      if (otherId) {
        const other = await $.load(otherId);
        if (other && other.onHangup) await other.onHangup(self);
      }
      return 'Call ended.';
    `);

    obj.setMethod('sendMessage', `
      const targetNumber = args[0];
      const message = args[1];
      if (!targetNumber) return 'No number specified.';
      if (!message) return 'No message provided.';
      const db = self.phoneDb ? await $.load(self.phoneDb) : null;
      if (!db || !db.findPhoneByNumber) return 'No phone database configured.';
      const target = await db.findPhoneByNumber(targetNumber);
      if (!target) return 'Number not found.';
      if (target.onMessage) await target.onMessage(self, message);
      return 'Message sent to ' + targetNumber + '.';
    `);

    obj.setMethod('onIncomingCall', `
      const from = args[0];
      await $.tell(self, 'Incoming call from ' + (from.number || from.name || 'unknown'));
    `);

    obj.setMethod('onHangup', `
      const from = args[0];
      await $.tell(self, 'Call ended with ' + (from.number || from.name || 'unknown'));
    `);

    obj.setMethod('onMessage', `
      const from = args[0];
      const message = args[1];
      await $.tell(self, 'Message from ' + (from.number || from.name || 'unknown') + ': ' + message);
    `);

    return obj;
  }
}
