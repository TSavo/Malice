# Phone System

Voice calls and text messaging.

## Overview

The phone system provides communication infrastructure:

- **Phone directory** - Maps numbers to phone objects
- **Base phone** - Common dial/message functionality
- **Wireless phones** - Battery, signal, ringtones
- **Payphones** - Bank payment per call

**Prototype Hierarchy:**
```
$.describable
├── $.phoneDb          ← Phone directory
└── $.phone            ← Base phone
    ├── $.wirelessPhone ← Mobile phones
    └── $.payphone     ← Public pay phones
```

## $.phoneDb - Phone Directory

Registry mapping phone numbers to phone objects.

### Properties

```javascript
{
  name: 'Phone Directory',
  description: 'Maps phone numbers to phone devices.',

  // Number → phone ID mapping
  registry: {
    '2061234567': 123,    // phone object ID
    '2069876543': 456,
    // ...
  },
}
```

### Key Methods

#### register(number, phone)
Add a phone to the directory.

```javascript
await phoneDb.register('2061234567', phone);
// or by ID
await phoneDb.register('2061234567', phone.id);
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

## $.phone - Base Phone

Common functionality for all phone types.

### Properties

```javascript
{
  name: 'Phone',
  description: 'A generic phone handset.',

  number: null,           // Phone number string
  phoneDb: null,          // Reference to phone directory
  connectedTo: null,      // Active call target ID
}
```

### Key Methods

#### dial(targetNumber)
Initiate a call.

```javascript
const result = await phone.dial('2061234567');
// 'Dialing 2061234567...'
```

**What it does:**
1. Look up target in phone directory
2. Set `connectedTo` to target ID
3. Call target's `onIncomingCall()`
4. Return dial message

#### hangup()
End current call.

```javascript
const result = await phone.hangup();
// 'Call ended.'
```

**What it does:**
1. Clear `connectedTo`
2. Call other phone's `onHangup()`

#### sendMessage(targetNumber, message)
Send a text message.

```javascript
const result = await phone.sendMessage('2061234567', 'Hello!');
// 'Message sent to 2061234567.'
```

**What it does:**
1. Look up target in phone directory
2. Call target's `onMessage()`

### Hooks

#### onIncomingCall(from)
Called when receiving a call.

```javascript
// Default: notifies holder
'Incoming call from 2061234567'
```

#### onHangup(from)
Called when call ends.

```javascript
// Default: notifies holder
'Call ended with 2061234567'
```

#### onMessage(from, message)
Called when receiving a text message.

```javascript
// Default: notifies holder
'Message from 2061234567: Hello!'
```

## $.wirelessPhone - Mobile Phones

Extends $.phone with battery, signal, and ringtone.

### Properties

```javascript
{
  name: 'Wireless Phone',
  description: 'A wireless phone handset.',

  // Inherited from $.phone
  number: null,
  phoneDb: null,
  connectedTo: null,

  // Wireless-specific
  battery: 100,           // 0-100%
  signal: 5,              // 0-5 bars
  ringtone: 'ring',       // Ringtone name
}
```

### Key Methods

#### canUse()
Check if phone can be used.

```javascript
const result = await phone.canUse();
// true
// or 'The phone is out of battery.'
// or 'No signal here.'
```

**Checks:**
- Battery > 0
- Signal > 0

#### dial(targetNumber) - Override
Checks `canUse()` before dialing.

```javascript
const result = await phone.dial('2061234567');
// 'The phone is out of battery.'
// or 'Dialing 2061234567...'
```

#### sendMessage(targetNumber, message) - Override
Checks `canUse()` before sending.

#### onIncomingCall(from) - Override
Includes ringtone in notification.

```javascript
// 'Incoming call from 2061234567 [ring]'
```

## $.payphone - Public Pay Phones

Extends $.phone with bank payment and bolted-down restriction.

### Properties

```javascript
{
  name: 'Payphone',
  description: 'A bolted-down public phone.',

  // Inherited from $.phone
  number: null,
  phoneDb: null,
  connectedTo: null,

  // Payphone-specific
  boltedDown: true,       // Cannot be picked up
  pricePerCall: 1,        // Cost per call
  bank: null,             // Bank object reference
  account: null,          // Account to receive payment
}
```

### Key Methods

#### dial(targetNumber, caller) - Override
Charges caller's bank account before connecting.

```javascript
const result = await payphone.dial('2061234567', player);
// 'Payment failed.' (insufficient funds)
// or 'Dialing 2061234567...'
```

**Payment flow:**
1. Look up caller's bank account
2. Transfer `pricePerCall` to payphone's account
3. If successful, proceed with call
4. If failed, return error

## Creating Phones

### Phone Directory

```javascript
const phoneDb = await $.recycler.create($.phoneDb, {
  name: 'City Phone Network',
});

// Register as global alias
await $.aliases.set('phoneDb', phoneDb.id);
```

### Wireless Phone

```javascript
const phone = await $.recycler.create($.wirelessPhone, {
  name: 'a smartphone',
  description: 'A sleek black smartphone.',
  number: '2061234567',
  phoneDb: phoneDb.id,
  battery: 100,
  signal: 5,
  ringtone: 'buzz',
});

// Register with directory
await phoneDb.register('2061234567', phone);
```

### Payphone

```javascript
const payphone = await $.recycler.create($.payphone, {
  name: 'a payphone',
  description: 'A battered public phone booth.',
  number: '2069999999',
  phoneDb: phoneDb.id,
  pricePerCall: 2,
  bank: $.bank.id,
  account: 'PAYPHONE-REVENUE-001',
});

await phoneDb.register('2069999999', payphone);
```

## Usage Examples

### Making a Call

```javascript
// Player uses their phone
> dial 2069876543
'Dialing 2069876543...'

// Recipient's phone
'Incoming call from 2061234567 [ring]'

// End call
> hangup
'Call ended.'
```

### Sending a Text

```javascript
> text 2069876543 Meet me at the warehouse
'Message sent to 2069876543.'

// Recipient's phone
'Message from 2061234567: Meet me at the warehouse'
```

### Using a Payphone

```javascript
> dial 2069876543 on payphone
// Charges 2 credits from player's bank account
'Dialing 2069876543...'

// If insufficient funds
'You have no bank account.'
// or
'Payment failed.'
```

### Dead Battery

```javascript
// Phone battery at 0
> dial 2069876543
'The phone is out of battery.'
```

### No Signal

```javascript
// In signal-dead zone
> dial 2069876543
'No signal here.'
```

## Integration with Vendables

Phones can be sold from vending machines with auto-assigned numbers:

```javascript
const phoneKiosk = await $.recycler.create($.vendable, {
  name: 'Phone Kiosk',
  phoneDb: phoneDb.id,
  spawnables: [
    {
      protoId: $.wirelessPhone.id,
      name: 'Burner Phone',
      price: 25,
      autoNumber: true,        // Auto-assign number
      numberPrefix: '206',     // Prefix for generated numbers
    },
  ],
});

// When purchased:
// 1. Creates new wirelessPhone
// 2. Generates number like '206123456789'
// 3. Registers with phoneDb
// 4. Delivers to buyer
```

## Room Signal Levels

Rooms can affect phone signal:

```javascript
const basement = await $.recycler.create($.room, {
  name: 'Underground Bunker',
  phoneSignal: 0,             // No signal
});

const streetCorner = await $.recycler.create($.room, {
  name: 'Street Corner',
  phoneSignal: 5,             // Full signal
});

// When player enters, update their phone's signal
```

## See Also

- [Bank](./bank.md) - Payment for payphones
- [Stackables](./stackables.md) - Vendable phone sales
- [Agents](./agents.md) - Player notification
