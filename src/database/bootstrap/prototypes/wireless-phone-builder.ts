import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * WirelessPhone type extends Phone with battery and signal requirements.
 * Uses abilities-first architecture - ringtone is described in abilities,
 * not handled by coded hooks.
 */
export class WirelessPhoneBuilder implements Builder {
  static provides = ['wirelessPhone'];
  static depends = ['phone'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists (types auto-alias)
    const existing = await this.manager.load('wirelessPhone');
    if (existing) {
      this.obj = existing;
    } else {
      // Create wirelessPhone as a TYPE
      const phone = await this.manager.load('phone');
      if (!phone) throw new Error('Phone type not found');

      this.obj = await this.manager.define('wirelessPhone', phone, {
        properties: {
          name: 'Wireless Phone',
          description: 'A wireless phone handset.',
          battery: 100,
          signal: 5,
          ringtone: 'buzzes',

          abilities: `Portable wireless phone with battery and signal requirements.

MAKING CALLS:
- dial(number) calls another phone. Target phone rings/buzzes.
- Wait for them to answer(). Both phones enter 'inCall' state.
- Speech is transmitted between connected phones.
- hangup() ends the call.

RECEIVING CALLS:
- When 'ringing' is true, someone is calling you.
- answer() connects the call.
- reject() declines the call.

TEXT MESSAGES:
- sendMessage(number, text) sends a message to another phone.
- Messages are stored in 'messages' array with { from, fromNumber, content, timestamp, read }.
- getMessages() returns all messages. getUnreadMessages() returns unread only.
- markRead(index) or markAllRead() clears unread status.
- 'unreadCount' shows how many unread messages exist.

BATTERY: 'battery' 0-100. Depletes with use. Must be > 0 to function.
When battery is low, phone may beep warnings. At 0, phone is dead.

SIGNAL: 'signal' 0-5. Location-dependent. Must be > 0 to connect.
Underground areas, shielded rooms, and remote locations block signal.

RINGTONE: The 'ringtone' property controls alerts. Default is "buzzes" (tactile).
- Audible: "rings", "plays a melody" - everyone nearby hears
- Tactile: "buzzes", "vibrates" - only holder feels it (private)

PORTABLE: Can be picked up, carried in pockets, dropped.
Location changes may affect signal strength.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    // canUse() - check if phone has battery and signal
    obj.setMethod(
      'canUse',
      `
      /** Check if phone can be used (has battery and signal).
       *  @returns true if usable, or error string if not
       */
      if ((self.battery ?? 0) <= 0) return { success: false, error: 'The phone is out of battery.' };
      if ((self.signal ?? 0) <= 0) return { success: false, error: 'No signal here.' };
      return { success: true };
    `,
    );

    // dial() - check usability before dialing
    obj.setMethod(
      'dial',
      `
      /** Dial a number, checking battery and signal first.
       *  @param targetNumber - The phone number to dial
       *  @returns Result object from parent dial()
       */
      const usable = await self.canUse();
      if (!usable.success) return usable;
      return await pass(...args);
    `,
    );

    // answer() - check usability before answering
    obj.setMethod(
      'answer',
      `
      /** Answer a call, checking battery and signal first.
       *  @returns Result object from parent answer()
       */
      const usable = await self.canUse();
      if (!usable.success) return usable;
      return await pass(...args);
    `,
    );

    // sendMessage() - check usability before sending
    obj.setMethod(
      'sendMessage',
      `
      /** Send a message, checking battery and signal first.
       *  @param targetNumber - The phone number to message
       *  @param message - The text message content
       *  @returns Result object from parent sendMessage()
       */
      const usable = await self.canUse();
      if (!usable.success) return usable;
      return await pass(...args);
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'battery',
      'Battery charge level from 0-100, must be above 0 to function',
    );
    obj.setPropertyDescription(
      'signal',
      'Signal strength from 0-5, location-dependent, must be above 0 to connect',
    );
    obj.setPropertyDescription(
      'ringtone',
      'How the phone sounds when ringing (e.g., "rings with a digital tone", "buzzes silently")',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[WirelessPhoneBuilder] Type 'wirelessPhone' auto-aliased`);
  }
}

// Self-register
registerBuilder(WirelessPhoneBuilder);
