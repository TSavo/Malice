# Phone System

> **Abilities-First**: Phones use abilities to describe state and behavior. All phone events flow through `.hear()` for sensory history. The AI narrator interprets player actions like "answer the phone" based on phone state. See `docs/ABILITIES-FIRST.md`.

Voice calls and text messaging with state-based architecture.

## Overview

The phone system provides communication infrastructure:

- **Phone directory** - Maps numbers to phone objects
- **Base phone** - State-based call/message functionality
- **Wireless phones** - Battery, signal requirements
- **Payphones** - Bank payment per call

**Key Design Principles:**
1. **State properties** track call status (ringing, inCall, callWith)
2. **Sensory pipeline** - all events go through `.hear()` into sensoryHistory
3. **Perception filter** - routes speech during active calls
4. **No coded hooks** - AI narrator describes all phone events

**Prototype Hierarchy:**
```
$describable
├── $phoneDb          <- Phone directory (infrastructure)
└── $phone            <- Base phone
    ├── $wirelessPhone <- Mobile phones
    └── $payphone     <- Public pay phones
```

## $phoneDb - Phone Directory

Registry mapping phone numbers to phone objects.

### Properties

```javascript
{
  name: 'Phone Directory',
  description: 'Maps phone numbers to phone devices.',
  registry: {
    '2061234567': 123,    // phone object ID
    '2069876543': 456,
  },
}
```

### Key Methods

#### register(number, phone)
Add a phone to the directory.

```javascript
await phoneDb.register('2061234567', phone);
```

#### unregister(number)
Remove a phone from the directory.

```javascript
await phoneDb.unregister('2061234567');
```

#### findPhoneByNumber(number)
Look up a phone by its number.

```javascript
const phone = await phoneDb.findPhoneByNumber('2061234567');
// Returns phone object or null
```

## $phone - Base Phone

State-based phone with call management and sensory integration.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `number` | string | Phone number for incoming calls |
| `phoneDb` | objref | Reference to phone directory |
| `ringing` | boolean | True when receiving incoming call |
| `incomingFrom` | objref | Phone calling us (while ringing) |
| `dialing` | objref | Phone we're calling (before answer) |
| `inCall` | boolean | True during active call |
| `callWith` | objref | Connected phone during call |
| `messages` | array | Message history: `{ from, fromNumber, content, timestamp, read }` |
| `unreadCount` | number | Number of unread messages |
| `ringtone` | string | Alert type: "rings" (audible) or "buzzes" (tactile) |

### State Machine

```
IDLE                    -> RINGING (incoming call)
IDLE                    -> DIALING (dial out)
RINGING                 -> IN_CALL (answer)
RINGING                 -> IDLE (reject)
DIALING                 -> IN_CALL (other answers)
DIALING                 -> IDLE (hangup)
IN_CALL                 -> IDLE (hangup)
```

### Key Methods

#### dial(targetNumber)
Initiate a call. Sets target phone ringing and broadcasts ring sound.

```javascript
const result = await phone.dial('2061234567');
// { success: true, target: <phone> }
// { success: false, error: 'Number not found.' }
// { success: false, error: 'Line is busy.' }
```

**What it does:**
1. Look up target in phone directory
2. Set `target.ringing = true`, `target.incomingFrom = self`
3. Set `self.dialing = target`
4. Broadcast ring via `target.location.announce({sound: 'A phone rings nearby.'})`
5. Sound flows through `.hear()` into sensoryHistory

#### answer()
Accept an incoming call. Registers perception filters for speech routing.

```javascript
const result = await phone.answer();
// { success: true, caller: <phone> }
// { success: false, error: 'Phone is not ringing.' }
```

**What it does:**
1. Clear `ringing`, set `inCall = true`, `callWith = caller`
2. Update caller's state similarly
3. Register both phones as perception filters on their holders
4. Announce connection sound to both locations

#### reject()
Decline an incoming call.

```javascript
const result = await phone.reject();
// { success: true }
```

#### hangup()
End current call or cancel dialing. Unregisters perception filters.

```javascript
const result = await phone.hangup();
// { success: true }
// { success: false, error: 'No active call.' }
```

**What it does:**
1. Unregister perception filters from both phones
2. Clear call state on both phones
3. Announce disconnection sound to both locations

#### sendMessage(targetNumber, message)
Send a text message. Appends to target's messages array and triggers notification.

```javascript
const result = await phone.sendMessage('2061234567', 'Hello!');
// { success: true, target: <phone> }
```

#### getMessages()
Get all messages on this phone.

```javascript
const messages = await phone.getMessages();
// [{ from: <phone>, fromNumber: '555-1234', content: 'Hello!', timestamp: 1234567890, read: false }]
```

#### getUnreadMessages()
Get only unread messages.

```javascript
const unread = await phone.getUnreadMessages();
```

#### markRead(index)
Mark a specific message as read by index.

```javascript
await phone.markRead(0);  // Mark first message as read
```

#### markAllRead()
Mark all messages as read.

```javascript
await phone.markAllRead();
// { success: true, count: 3 }
```

#### deleteMessage(index)
Delete a message by index.

```javascript
await phone.deleteMessage(0);
```

### Sensory Pipeline

Phone events flow through the sensory system based on ringtone type:

**Audible ringtones** ("rings", "plays a melody"):
```
dial() called
  -> target.ringing = true
  -> holder.hear("Your phone rings.")        # direct to holder
  -> location.announce("A phone rings nearby.")  # to others
  -> hear() calls recordSensory()
  -> ring enters sensoryHistory
  -> AI sees "Your phone rings" when player says "answer phone"
```

**Tactile ringtones** ("buzzes", "vibrates"):
```
dial() called
  -> target.ringing = true
  -> holder.feel("Your phone buzzes.")       # direct to holder only
  -> others don't perceive anything
  -> feel() calls recordSensory()
  -> buzz enters sensoryHistory
  -> AI sees "Your phone buzzes" when player acts
```

### Speech Routing During Calls

When a call is active, speech is routed between connected phones:

1. **On answer()**: Both phones register as perception filters on their holders
2. **When holder speaks**: Phone's `onHear()` filter hook fires
3. **Speech forwarded**: Phone broadcasts to other phone's location
4. **Other holder hears**: "From the phone: <speech>"
5. **On hangup()**: Perception filters unregistered

The `onHear` filter includes feedback loop prevention - won't re-route phone sounds.

## $wirelessPhone - Mobile Phones

Extends $phone with battery and signal requirements.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `battery` | number | 0-100, must be > 0 to function |
| `signal` | number | 0-5, location-dependent, must be > 0 |
| `ringtone` | string | Custom ring sound description |

### Key Methods

#### canUse()
Check if phone has power and signal.

```javascript
const result = await phone.canUse();
// { success: true }
// { success: false, error: 'The phone is out of battery.' }
// { success: false, error: 'No signal here.' }
```

**All methods check canUse() first:**
- `dial()` - checks before dialing
- `answer()` - checks before answering
- `sendMessage()` - checks before sending

## $payphone - Public Pay Phones

Extends $phone with bank payment.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `boltedDown` | boolean | Always true - cannot be picked up |
| `pricePerCall` | number | Cost per call in credits |
| `bank` | objref | Bank for payment processing |
| `account` | string | Account to receive payments |

### Key Methods

#### dial(targetNumber, caller)
Charges caller's bank account before connecting.

```javascript
const result = await payphone.dial('2061234567', player);
// { success: false, error: 'This payphone is out of service.' }
// { success: false, error: 'Payment failed. Insufficient funds?' }
// { success: true, target: <phone> }
```

**Payment flow:**
1. Look up caller's bank account
2. Transfer `pricePerCall` to payphone's account
3. If successful, proceed with normal dial
4. Sound and sensory events flow normally

## Creating Phones

### Phone Directory

```javascript
const phoneDb = await $recycler.create($phoneDb, {
  name: 'City Phone Network',
});
```

### Wireless Phone

```javascript
const phone = await $recycler.create($wirelessPhone, {
  name: 'a smartphone',
  description: 'A sleek black smartphone.',
  number: '2061234567',
  phoneDb: $phoneDb,
  battery: 100,
  signal: 5,
  ringtone: 'buzzes with a soft vibration',
});

await $phoneDb.register('2061234567', phone);
```

### Payphone

```javascript
const payphone = await $recycler.create($payphone, {
  name: 'a payphone',
  description: 'A battered public phone booth.',
  number: '2069999999',
  pricePerCall: 2,
  bank: $bank,
  account: 'PAYPHONE-REVENUE-001',
});

await $phoneDb.register('2069999999', payphone);
```

## AI Narrator Integration

The AI narrator handles phone interactions by reading state and abilities:

**Player says "answer the phone":**
1. AI sees `phone.ringing: true` (from recent sensoryHistory: "A phone rings nearby")
2. AI reads phone abilities about answering
3. AI calls `phone.answer()`
4. AI sees `phone.inCall: true, phone.callWith: #42`
5. AI describes the call connecting

**Player speaks during call:**
1. Speech goes through normal broadcast
2. Phone's perception filter intercepts via `onHear`
3. Filter routes to connected phone's location
4. Other player hears "From the phone: <message>"

**Player says "hang up":**
1. AI sees `phone.inCall: true`
2. AI reads phone abilities about hangup
3. AI calls `phone.hangup()`
4. AI sees call state cleared
5. AI describes the call ending

## Room Signal Levels

Rooms can affect phone signal:

```javascript
const basement = await $recycler.create($room, {
  name: 'Underground Bunker',
  phoneSignal: 0,             // No signal underground
});

const streetCorner = await $recycler.create($room, {
  name: 'Street Corner',
  phoneSignal: 5,             // Full signal outside
});
```

## See Also

- [Bank](./bank.md) - Payment for payphones
- [Perception Filters](../reference/perception-filters.md) - Speech routing mechanism
- [Agents](./agents.md) - Sensory history and hear()
