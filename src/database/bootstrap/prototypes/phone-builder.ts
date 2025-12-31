import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Base Phone prototype (abstract-style behaviors).
 * Provides a number, basic dial/send handling, and hooks for subclasses.
 */
export class PhoneBuilder implements Builder {
  static provides = ['phone'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.phone && !forceRebuild) {
      this.obj = $.phone;
      return;
    }

    const parentObj = $.describable;
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Phone',
        description: 'A generic phone handset.',
        number: null, // phone number string
        phoneDb: null, // reference to phone DB object
        connectedTo: null, // active call target id

        abilities: `Communication device for voice calls and messages.

DIALING: dial(number) looks up target in 'phoneDb', establishes connection, calls target.onIncomingCall().

CONNECTION: 'connectedTo' tracks active call. hangup() ends call, notifies other party via onHangup().

MESSAGING: sendMessage(number, text) sends text to target. Target receives via onMessage().

HOOKS: Subclasses override onIncomingCall(), onHangup(), onMessage() to handle events.

DATABASE: 'phoneDb' references $.phoneDB for number lookups. findPhoneByNumber() resolves targets.`,
      },
      methods: {},
    });

    obj.setMethod(
      'dial',
      `
      const targetNumber = args[0];
      if (!targetNumber) return 'No number specified.';
      const db = self.phoneDb || null;
      if (!db || !db.findPhoneByNumber) return 'No phone database configured.';
      const target = await db.findPhoneByNumber(targetNumber);
      if (!target) return 'Number not found.';
      self.connectedTo = target;
      if (target.onIncomingCall) {
        await target.onIncomingCall(self);
      }
      return 'Dialing ' + targetNumber + '...';
    `,
    );

    obj.setMethod(
      'hangup',
      `
      const other = self.connectedTo;
      self.connectedTo = null;
      if (other && other.onHangup) {
        await other.onHangup(self);
      }
      return 'Call ended.';
    `,
    );

    obj.setMethod(
      'sendMessage',
      `
      const targetNumber = args[0];
      const message = args[1];
      if (!targetNumber) return 'No number specified.';
      if (!message) return 'No message provided.';
      const db = self.phoneDb || null;
      if (!db || !db.findPhoneByNumber) return 'No phone database configured.';
      const target = await db.findPhoneByNumber(targetNumber);
      if (!target) return 'Number not found.';
      if (target.onMessage) await target.onMessage(self, message);
      return 'Message sent to ' + targetNumber + '.';
    `,
    );

    obj.setMethod(
      'onIncomingCall',
      `
      const from = args[0];
      await $.tell(self, 'Incoming call from ' + (from.number || from.name || 'unknown'));
    `,
    );

    obj.setMethod(
      'onHangup',
      `
      const from = args[0];
      await $.tell(self, 'Call ended with ' + (from.number || from.name || 'unknown'));
    `,
    );

    obj.setMethod(
      'onMessage',
      `
      const from = args[0];
      const message = args[1];
      await $.tell(self, 'Message from ' + (from.number || from.name || 'unknown') + ': ' + message);
    `,
    );

    obj.setPropertyDescription(
      'number',
      'The phone number that can be dialed to reach this phone',
    );
    obj.setPropertyDescription(
      'phoneDb',
      'Reference to the phone database object for number lookups',
    );
    obj.setPropertyDescription(
      'connectedTo',
      'Active call target object ID, or null if no call in progress',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Register in memory for immediate access
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'phone', this.obj.id);
  }
}

// Self-register
registerBuilder(PhoneBuilder);
