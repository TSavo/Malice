import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Base Phone type using pure abilities-first architecture.
 * Methods ONLY change state - no announce() calls.
 * AI narrator reads state + abilities to describe everything.
 */
export class PhoneBuilder implements Builder {
  static provides = ['phone'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists (types auto-alias)
    const existing = await this.manager.load('phone');
    if (existing) {
      this.obj = existing;
    } else {
      // Create phone as a TYPE
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('phone', describable, {
        properties: {
          name: 'Phone',
          description: 'A generic phone handset.',
          number: null, // phone number string
          phoneDb: null, // reference to phone DB object

          // Call state properties
          ringing: false, // true when receiving an incoming call
          incomingFrom: null, // phone object that's calling (when ringing)
          dialing: null, // phone object we're calling (before they answer)
          inCall: false, // true when call is active
          callWith: null, // connected phone during active call

          // Message state
          messages: [], // array of { from, fromNumber, content, timestamp, read }
          unreadCount: 0, // number of unread messages

          // Ringtone (customizable by subclasses)
          ringtone: 'rings',

          abilities: `Communication device for voice calls and text messages.

STATE PROPERTIES:
- 'ringing': true when someone is calling this phone. The phone makes audible sounds matching 'ringtone'.
- 'incomingFrom': the phone object that's calling (while ringing)
- 'dialing': the phone we're calling (before they answer)
- 'inCall': true during active conversation
- 'callWith': the connected phone object (during call)
- 'messages': array of received messages { from, fromNumber, content, timestamp, read }
- 'unreadCount': number of unread messages (triggers notification sound)

RINGING: When 'ringing' becomes true, the phone alerts based on 'ringtone':
- Audible ringtones ("rings", "plays a melody") - everyone nearby hears it
- Tactile ringtones ("buzzes", "vibrates") - only the holder feels it
The holder can 'answer' to accept the call or 'ignore'/'reject' to decline.

ANSWERING: answer() connects the call. Sets 'inCall' to true on both phones,
'callWith' points to each other, 'ringing' becomes false. There's an audible click
as the connection establishes.

ACTIVE CALL: While 'inCall' is true, speech near this phone is transmitted to
the 'callWith' phone. The holder of the other phone hears it through the phone.
Conversation is two-way - both sides can speak and hear each other.

HANGUP: hangup() ends the call. Both phones' 'inCall' becomes false,
'callWith' clears. There's an audible click as the connection terminates.

DIALING: dial(number) looks up target in 'phoneDb' and sets their phone ringing.
The caller's 'dialing' property points to the target phone while waiting.

TEXT MESSAGE: sendMessage(number, text) delivers a message to the target phone.
Appends to target's 'messages' array and increments 'unreadCount'.
Notification follows the same audible/tactile pattern as ringing.

READING MESSAGES: getMessages() returns all messages. getUnreadMessages() returns unread only.
markRead(index) marks a specific message as read and decrements 'unreadCount'.
markAllRead() marks all messages as read.

CALLER ID: When ringing, 'incomingFrom' reveals who is calling.
Messages include 'from' (phone object) and 'fromNumber' for sender identification.

DATABASE: 'phoneDb' references $phoneDb for number lookups.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    // dial() - initiate call, set target ringing, announce ring sound
    obj.setMethod(
      'dial',
      `
      /** Dial a phone number to initiate a call.
       *  Sets target phone ringing and announces ring sound to their location.
       *  The ring announce is infrastructure - it must enter sensoryHistory
       *  so the recipient's AI has context when they act.
       *  @param targetNumber - The phone number to dial
       *  @returns { success, target, error } - Result object
       */
      const targetNumber = args[0];
      if (!targetNumber) return { success: false, error: 'No number specified.' };

      const db = self.phoneDb || $phoneDb;
      if (!db || !db.findPhoneByNumber) return { success: false, error: 'No phone database configured.' };

      const target = await db.findPhoneByNumber(targetNumber);
      if (!target) return { success: false, error: 'Number not found.' };

      // Already in a call?
      if (self.inCall) return { success: false, error: 'Already in a call.' };
      if (target.inCall) return { success: false, error: 'Line is busy.' };
      if (target.ringing) return { success: false, error: 'Line is busy.' };

      // Set target phone ringing
      target.ringing = true;
      target.incomingFrom = self;

      // We're now dialing
      self.dialing = target;

      // Trigger ring - enters sensoryHistory so recipient's AI has context
      const ringtone = target.ringtone || 'rings';
      const isTactile = ringtone.includes('buzz') || ringtone.includes('vibrat');
      const holder = target.getHolder ? await target.getHolder() : null;

      if (isTactile) {
        // Tactile ringtone - feel() directly on holder only
        if (holder && holder.feel) {
          await holder.feel('Your phone ' + ringtone + '.', target);
        }
      } else {
        // Audible ringtone - holder hears "Your phone", others hear "A phone"
        if (holder && holder.hear) {
          await holder.hear('Your phone ' + ringtone + '.', null, target);
        }
        // Others in the room hear a phone ringing
        if (target.location && target.location.announce) {
          await target.location.announce(target, holder, {
            sound: 'A phone ' + ringtone + ' nearby.'
          });
        }
      }

      return { success: true, target: target };
    `,
    );

    // answer() - accept incoming call, connect both phones (state only)
    obj.setMethod(
      'answer',
      `
      /** Answer an incoming call.
       *  Connects this phone to the calling phone.
       *  Registers both phones as perception filters for speech routing.
       *  @returns { success, caller, error } - Result object
       */
      if (!self.ringing) {
        return { success: false, error: 'Phone is not ringing.' };
      }

      const caller = self.incomingFrom;
      if (!caller) {
        self.ringing = false;
        return { success: false, error: 'No incoming call.' };
      }

      // Connect the call
      self.ringing = false;
      self.incomingFrom = null;
      self.inCall = true;
      self.callWith = caller;

      // Update caller's state
      caller.dialing = null;
      caller.inCall = true;
      caller.callWith = self;

      // Register both phones as perception filters for speech routing
      if (self.registerAsFilter) {
        await self.registerAsFilter();
      }
      if (caller.registerAsFilter) {
        await caller.registerAsFilter();
      }

      return { success: true, caller: caller };
    `,
    );

    // reject() - decline incoming call (state only)
    obj.setMethod(
      'reject',
      `
      /** Reject an incoming call without answering.
       *  Stops the ringing.
       *  @returns { success, error } - Result object
       */
      if (!self.ringing) {
        return { success: false, error: 'Phone is not ringing.' };
      }

      const caller = self.incomingFrom;

      // Stop ringing
      self.ringing = false;
      self.incomingFrom = null;

      // Clear caller's dialing state
      if (caller) {
        caller.dialing = null;
      }

      return { success: true, caller: caller };
    `,
    );

    // hangup() - end active call or cancel dialing (state only)
    obj.setMethod(
      'hangup',
      `
      /** End the current call or cancel dialing.
       *  Clears call state on both phones and unregisters perception filters.
       *  @returns { success, error } - Result object
       */
      // Handle hangup while dialing (before answer)
      if (self.dialing) {
        const target = self.dialing;
        self.dialing = null;

        // Stop target from ringing
        if (target) {
          target.ringing = false;
          target.incomingFrom = null;
        }

        return { success: true, wasDialing: true };
      }

      // Handle hangup during active call
      if (!self.inCall) {
        return { success: false, error: 'No active call.' };
      }

      const other = self.callWith;

      // Unregister perception filters from both phones
      if (self.unregisterAsFilter) {
        await self.unregisterAsFilter();
      }
      if (other && other.unregisterAsFilter) {
        await other.unregisterAsFilter();
      }

      // Clear our state
      self.inCall = false;
      self.callWith = null;

      // Clear other phone's state
      if (other) {
        other.inCall = false;
        other.callWith = null;
      }

      return { success: true, other: other };
    `,
    );

    // sendMessage() - send text message
    obj.setMethod(
      'sendMessage',
      `
      /** Send a text message to another phone.
       *  Appends to target's messages array and triggers notification.
       *  @param targetNumber - The phone number to message
       *  @param message - The text message content
       *  @returns { success, target, error } - Result object
       */
      const targetNumber = args[0];
      const message = args[1];

      if (!targetNumber) return { success: false, error: 'No number specified.' };
      if (!message) return { success: false, error: 'No message provided.' };

      const db = self.phoneDb || $phoneDb;
      if (!db || !db.findPhoneByNumber) return { success: false, error: 'No phone database configured.' };

      const target = await db.findPhoneByNumber(targetNumber);
      if (!target) return { success: false, error: 'Number not found.' };

      // Append message to target's messages array
      const messages = target.messages || [];
      messages.push({
        from: self,
        fromNumber: self.number || 'unknown',
        content: message,
        timestamp: Date.now(),
        read: false
      });
      target.messages = messages;
      target.unreadCount = (target.unreadCount || 0) + 1;

      // Trigger notification - enters sensoryHistory
      const ringtone = target.ringtone || 'rings';
      const isTactile = ringtone.includes('buzz') || ringtone.includes('vibrat');
      const holder = target.getHolder ? await target.getHolder() : null;

      if (isTactile) {
        // Tactile notification - feel() directly on holder only
        if (holder && holder.feel) {
          await holder.feel('Your phone buzzes with a message.', target);
        }
      } else {
        // Audible notification - holder hears "Your phone", others hear "A phone"
        if (holder && holder.hear) {
          await holder.hear('Your phone chimes with a message.', null, target);
        }
        // Others in the room hear a phone chiming
        if (target.location && target.location.announce) {
          await target.location.announce(target, holder, {
            sound: 'A phone chimes with a message.'
          });
        }
      }

      return { success: true, target: target };
    `,
    );

    // getMessages() - get all messages
    obj.setMethod(
      'getMessages',
      `
      /** Get all messages on this phone.
       *  @returns Array of message objects
       */
      return self.messages || [];
    `,
    );

    // getUnreadMessages() - get unread messages only
    obj.setMethod(
      'getUnreadMessages',
      `
      /** Get only unread messages.
       *  @returns Array of unread message objects
       */
      const messages = self.messages || [];
      return messages.filter(m => !m.read);
    `,
    );

    // markRead() - mark a specific message as read
    obj.setMethod(
      'markRead',
      `
      /** Mark a specific message as read by index.
       *  @param index - Index of message in messages array
       *  @returns { success, message } - The message that was marked
       */
      const index = args[0];
      const messages = self.messages || [];

      if (index < 0 || index >= messages.length) {
        return { success: false, error: 'Invalid message index.' };
      }

      if (!messages[index].read) {
        messages[index].read = true;
        self.messages = messages;
        self.unreadCount = Math.max(0, (self.unreadCount || 0) - 1);
      }

      return { success: true, message: messages[index] };
    `,
    );

    // markAllRead() - mark all messages as read
    obj.setMethod(
      'markAllRead',
      `
      /** Mark all messages as read.
       *  @returns { success, count } - Number of messages marked
       */
      const messages = self.messages || [];
      let count = 0;

      for (const msg of messages) {
        if (!msg.read) {
          msg.read = true;
          count++;
        }
      }

      self.messages = messages;
      self.unreadCount = 0;

      return { success: true, count: count };
    `,
    );

    // deleteMessage() - delete a message by index
    obj.setMethod(
      'deleteMessage',
      `
      /** Delete a message by index.
       *  @param index - Index of message to delete
       *  @returns { success } - Result
       */
      const index = args[0];
      const messages = self.messages || [];

      if (index < 0 || index >= messages.length) {
        return { success: false, error: 'Invalid message index.' };
      }

      const wasUnread = !messages[index].read;
      messages.splice(index, 1);
      self.messages = messages;

      if (wasUnread) {
        self.unreadCount = Math.max(0, (self.unreadCount || 0) - 1);
      }

      return { success: true };
    `,
    );

    // getHolder() - find who is holding this phone
    obj.setMethod(
      'getHolder',
      `
      /** Get the agent currently holding this phone.
       *  Walks up the location chain to find an embodied agent.
       *  @returns The holder agent or null
       */
      let current = self.location;
      while (current) {
        // Check if this is an agent (has hear method and perception filter support)
        if (current.hear && current.addPerceptionFilter) {
          return current;
        }
        current = current.location;
      }
      return null;
    `,
    );

    // registerAsFilter() - add phone as perception filter on holder
    obj.setMethod(
      'registerAsFilter',
      `
      /** Register this phone as a perception filter on its current holder.
       *  Called when a call connects to enable speech routing.
       *  @returns true if registered, false if no holder found
       */
      const holder = await self.getHolder();
      if (!holder || !holder.addPerceptionFilter) {
        return false;
      }

      // Store holder reference for later removal
      self._filterHolder = holder;

      // Add self as perception filter (source=self, filter=self)
      await holder.addPerceptionFilter(self, self);
      return true;
    `,
    );

    // unregisterAsFilter() - remove phone as perception filter
    obj.setMethod(
      'unregisterAsFilter',
      `
      /** Remove this phone as a perception filter from its holder.
       *  Called when a call disconnects.
       *  @returns true if unregistered, false if not registered
       */
      const holder = self._filterHolder;
      if (!holder || !holder.removePerceptionFilter) {
        return false;
      }

      await holder.removePerceptionFilter(self);
      self._filterHolder = null;
      return true;
    `,
    );

    // onHear() - perception filter hook for speech routing during calls
    // NOTE: This one still uses announce() because speech routing is infrastructure,
    // not narration. The actual audio needs to reach the other location.
    obj.setMethod(
      'onHear',
      `
      /** Perception filter hook - called when holder hears something.
       *  Routes speech to the connected phone during a call.
       *  This is infrastructure - speech must actually reach the other location.
       *  @param message - What was heard
       *  @param source - The source of the sound
       */
      const message = args[0];
      const source = args[1];

      // Only route if we're in an active call
      if (!self.inCall || !self.callWith) return;

      // Don't route phone sounds back (avoid feedback loops)
      if (source && source.id === self.id) return;
      if (source && source.id === self.callWith?.id) return;

      // Don't route if message is from the phone itself
      if (message && message.startsWith('From the phone:')) return;

      const otherPhone = self.callWith;

      // Route speech to other phone's location
      // This is infrastructure - the sound must actually travel
      if (otherPhone.location && otherPhone.location.announce) {
        await otherPhone.location.announce(otherPhone, null, {
          sound: 'From the phone: "' + message + '"'
        });
      }
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'number',
      'The phone number that can be dialed to reach this phone',
    );
    obj.setPropertyDescription(
      'phoneDb',
      'Reference to the phone database object for number lookups',
    );
    obj.setPropertyDescription(
      'ringing',
      'True when this phone is receiving an incoming call. Makes audible sound.',
    );
    obj.setPropertyDescription(
      'incomingFrom',
      'The phone object that is calling (while ringing). Reveals caller ID.',
    );
    obj.setPropertyDescription(
      'dialing',
      'The phone object we are calling (before they answer)',
    );
    obj.setPropertyDescription(
      'inCall',
      'True when a call is active and connected',
    );
    obj.setPropertyDescription(
      'callWith',
      'The connected phone object during an active call',
    );
    obj.setPropertyDescription(
      'messages',
      'Array of received messages: { from, fromNumber, content, timestamp, read }',
    );
    obj.setPropertyDescription(
      'unreadCount',
      'Number of unread messages. Triggers notification when incremented.',
    );
    obj.setPropertyDescription(
      'ringtone',
      'How the phone alerts. Audible: "rings", "plays a melody". Tactile (feel only): "buzzes", "vibrates"',
    );
    obj.setPropertyDescription(
      '_filterHolder',
      'Internal: Reference to the agent we registered as perception filter on',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[PhoneBuilder] Type 'phone' auto-aliased`);
  }
}

// Self-register
registerBuilder(PhoneBuilder);
