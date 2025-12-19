# Event Hooks Reference

Event hooks are methods called automatically by the system when specific events occur. Override these in your objects to respond to movement, damage, input, and other game events.

## Hook Categories

- **Movement Hooks** - Object location changes
- **Content Hooks** - Container content changes
- **Player Hooks** - Player-specific events
- **Sensory Hooks** - Perception events
- **Lifecycle Hooks** - Creation/destruction
- **Plot Hooks** - Narrative event system

## Movement Hooks

Called during `moveTo()` operations when objects change location.

### onLeaving(source, dest, mover)

Called on the **moving object** BEFORE it leaves its current location.

```javascript
obj.setMethod('onLeaving', `
  const source = args[0];  // Current location (leaving from)
  const dest = args[1];    // Destination (going to)
  const mover = args[2];   // Who/what is causing the move

  // Unregister verbs from previous owner
  if (source && source.owner && source.owner.unregisterVerbsFrom) {
    await source.owner.unregisterVerbsFrom(self);
  }

  // Can throw to cancel the move
  // throw new Error("The sword refuses to leave!");
`);
```

**Common Uses:**
- Unregister verbs from the player
- Clean up references
- Cancel movement (throw exception)
- Save state before move

### onArrived(dest, source, mover)

Called on the **moving object** AFTER it arrives at its new location.

```javascript
obj.setMethod('onArrived', `
  const dest = args[0];    // New location (arrived at)
  const source = args[1];  // Previous location (came from)
  const mover = args[2];   // Who/what caused the move

  // Register verbs with new owner
  if (dest && dest.owner) {
    const owner = dest.owner;
    if (owner.registerVerb) {
      await owner.registerVerb(['eat %t', 'eat ' + self.name], self, 'eat');
    }
  }
`);
```

**Common Uses:**
- Register verbs with the player
- Announce arrival
- Trigger effects (poison when entering inventory)
- Auto-merge stackables

## Content Hooks

Called on **containers** when their contents change.

### onContentLeaving(obj, dest, mover)

Called on the **container** BEFORE an object leaves.

```javascript
obj.setMethod('onContentLeaving', `
  const obj = args[0];     // Object that is leaving
  const dest = args[1];    // Where it's going
  const mover = args[2];   // Who/what is moving it

  // Can throw to prevent the move
  if (obj.valuable && !mover?.isWizard) {
    throw new Error("You can't remove that!");
  }
`);
```

**Common Uses:**
- Prevent removal of certain items
- Security checks
- Trigger alarms

### onContentLeft(obj, dest, mover)

Called on the **container** AFTER an object has left.

```javascript
obj.setMethod('onContentLeft', `
  const obj = args[0];     // Object that left
  const dest = args[1];    // Where it went
  const mover = args[2];   // Who moved it

  // Clean up verb registration for all players in room
  const contents = self.contents || [];
  for (const player of contents) {
    if (player.unregisterVerbsFrom) {
      await player.unregisterVerbsFrom(obj);
    }
  }
`);
```

**Common Uses:**
- Unregister verbs for all players
- Update room state
- Log departures

### onContentArrived(obj, source, mover)

Called on the **container** AFTER an object arrives.

```javascript
obj.setMethod('onContentArrived', `
  const obj = args[0];     // Object that arrived
  const source = args[1];  // Where it came from
  const mover = args[2];   // Who moved it

  // Register verbs for all players in room
  const contents = self.contents || [];
  for (const player of contents) {
    if (player.registerVerb && obj.getRoomVerbs) {
      for (const { pattern, method } of obj.getRoomVerbs()) {
        await player.registerVerb(pattern, obj, method);
      }
    }
  }

  // Announce to room
  if (obj.isPlayer) {
    await self.announce(obj, null, {
      actor: "You enter the room.",
      others: "%A arrives.",
    });
  }
`);
```

**Common Uses:**
- Register verbs for all players
- Announce arrivals
- Trigger room events

## Room-Specific Hooks

### onPlayerEnter(player)

Called on the **room** when a player enters.

```javascript
obj.setMethod('onPlayerEnter', `
  const player = args[0];

  // Register verbs from all objects in the room
  for (const obj of self.contents || []) {
    if (obj.getRoomVerbs) {
      for (const { pattern, method } of obj.getRoomVerbs()) {
        await player.registerVerb(pattern, obj, method);
      }
    }
  }

  // Show room description
  const desc = await self.describe(player);
  await player.tell(desc);
`);
```

### onPlayerExit(player)

Called on the **room** when a player leaves.

```javascript
obj.setMethod('onPlayerExit', `
  const player = args[0];

  // Unregister verbs from all objects in the room
  for (const obj of self.contents || []) {
    if (obj.getRoomVerbs) {
      for (const { pattern } of obj.getRoomVerbs()) {
        await player.unregisterVerb(pattern);
      }
    }
  }
`);
```

## Agent Hooks

### onEnterRoom(room, oldRoom)

Called on an **Agent** when they enter a new room.

```javascript
obj.setMethod('onEnterRoom', `
  const room = args[0];
  const oldRoom = args[1];

  // Show room description
  const desc = await room.describe(self);
  await self.tell(desc);

  // Register exit verbs, etc.
`);
```

### onOtherLeft(other, dest)

Called on an **Agent** when someone else leaves their current room.

```javascript
obj.setMethod('onOtherLeft', `
  const other = args[0];  // Who left
  const dest = args[1];   // Where they went

  // Maybe remove from watch list
  if (self.watchList?.includes(other.id)) {
    // They're no longer visible
  }
`);
```

## Player Hooks

### onInput(input)

Called when a **Player** sends input.

```javascript
obj.setMethod('onInput', `
  const input = args[0];

  // Check for prompt state first
  if ($prompt && await $prompt.isActive(self)) {
    return await $prompt.handleInput(self, input);
  }

  // Parse and handle command
  const trimmed = input.trim();
  if (!trimmed) return;

  const match = await self.matchVerb(trimmed);
  if (match && match.handler) {
    const result = await match.handler.callVerb(...);
    if (result) await self.tell(result);
  } else {
    await self.tell("I don't understand that.");
  }
`);
```

### onDeath()

Called when a **Player** dies.

```javascript
obj.setMethod('onDeath', `
  // Called when player's vital body parts are destroyed
  await self.tell("You have died.");

  // Create corpse, drop items, etc.
`);
```

### Sleep Hooks

```javascript
// Called when player falls asleep
obj.setMethod('onFellAsleep', `
  await self.tell("You drift off to sleep...");
`);

// Called when player wakes up naturally
obj.setMethod('onWokeUp', `
  await self.tell("You wake up feeling refreshed.");
`);

// Called when sleep is interrupted
obj.setMethod('onSleepInterrupted', `
  const reason = args[0];
  await self.tell("Your sleep is interrupted: " + reason);
`);

// Called when something prevents waking
obj.setMethod('onWakeBlocked', `
  const reason = args[0];
  // Player can't wake up - they're in a deep sleep, drugged, etc.
`);
```

## Sensory Hooks

### onSensation(sensation)

Called when an **Embodied** agent receives a physical sensation.

```javascript
obj.setMethod('onSensation', `
  const sensation = args[0];
  // { type: 'pain'|'touch'|'heat'|'cold', intensity: 0-100, partName: string, ... }

  if (sensation.type === 'pain') {
    if (sensation.intensity > 50) {
      await self.tell("Intense pain shoots through your " + sensation.partName + "!");
    } else {
      await self.tell("You feel pain in your " + sensation.partName + ".");
    }
  }
`);
```

### onCriticalDamage(part)

Called when a body part takes critical damage.

```javascript
obj.setMethod('onCriticalDamage', `
  const part = args[0];  // The damaged body part

  // Check if vital part
  if (part.isVital) {
    // This could lead to death
    await self.onDeath();
  }
`);
```

### onStarvationDeath()

Called when starvation kills the agent.

```javascript
obj.setMethod('onStarvationDeath', `
  await self.tell("You have starved to death.");
  await self.onDeath();
`);
```

## NPC Hooks

### onSpokenTo(speaker, speech)

Called when someone speaks to an **NPC**.

```javascript
obj.setMethod('onSpokenTo', `
  const speaker = args[0];
  const speech = args[1];  // { content, language, ... }

  // Respond based on AI personality
  if (self.aiHandler) {
    const response = await self.aiHandler.respond(speaker, speech.content);
    if (response) {
      await self.say(response);
    }
  }
`);
```

### onItemReceived(item, giver)

Called when an **NPC** receives an item.

```javascript
obj.setMethod('onItemReceived', `
  const item = args[0];
  const giver = args[1];

  // Check if NPC wants this item
  if (item.stackType === 'cash:usd') {
    await self.say("Thanks for the money!");
    // Maybe give something in return
  }
`);
```

## Phone Hooks

### onIncomingCall(caller, callerNumber)

Called when a phone receives an incoming call.

```javascript
obj.setMethod('onIncomingCall', `
  const caller = args[0];
  const callerNumber = args[1];

  self.ringing = true;
  self.incomingCaller = caller;
  self.incomingNumber = callerNumber;

  await self.tell("Ring ring!");
`);
```

### onHangup()

Called when a phone call ends.

```javascript
obj.setMethod('onHangup', `
  self.ringing = false;
  self.inCall = false;
  self.callPartner = null;

  await self.tell("*click*");
`);
```

### onMessage(from, text)

Called when a phone receives a text message.

```javascript
obj.setMethod('onMessage', `
  const from = args[0];    // Sender number
  const text = args[1];    // Message content

  await self.tell("Message from " + from + ": " + text);
`);
```

## Lifecycle Hooks

### onCreate(creator)

Called immediately after an object is created via `$recycler.create()`.

```javascript
obj.setMethod('onCreate', `
  const creator = args[0];  // Who created this object (may be null)

  // Initialize state
  self.createdAt = new Date().toISOString();
  if (creator) {
    self.createdBy = creator.id;
  }
`);
```

### beforeRecycle()

Called BEFORE an object is recycled (soft deleted).

```javascript
obj.setMethod('beforeRecycle', `
  // Clean up references
  // Remove from watch lists
  // Cancel scheduled jobs
`);
```

### onFullyDecayed()

Called when a **Decayable** object reaches 0% condition.

```javascript
obj.setMethod('onFullyDecayed', `
  // Default behavior: recycle the object
  if ($recycler) {
    await $recycler.recycle(self);
  }
`);
```

### onStorageDamage(damage, reason)

Called when improper storage damages a **Decayable**.

```javascript
obj.setMethod('onStorageDamage', `
  const damage = args[0];   // Amount of damage
  const reason = args[1];   // Why ("too hot", "too cold", etc.)

  // Default: reduce condition
  self.condition = Math.max(0, (self.condition || 100) - damage);
`);
```

## Plot Hooks

### triggerPlotHooks(eventName, data)

Triggers plot hooks registered on this object.

```javascript
// Register a hook from a plot
target.plotHooks = target.plotHooks || {};
target.plotHooks['itemDeposited'] = target.plotHooks['itemDeposited'] || [];
target.plotHooks['itemDeposited'].push({
  plot: plotObject,
  jobId: 'delivery-1',
  filter: { itemType: 'package' }
});

// Later, when the event occurs:
await locker.triggerPlotHooks('itemDeposited', {
  itemType: 'package',
  depositor: player
});
```

### onJobHookTriggered(jobId, eventName, targetId, data, filter)

Called on a **Plot** when a job-specific hook fires.

```javascript
obj.setMethod('onJobHookTriggered', `
  const jobId = args[0];
  const eventName = args[1];
  const targetId = args[2];
  const data = args[3];
  const filter = args[4];

  // Advance job phase, log event, etc.
  await self.logEvent("Job " + jobId + " triggered: " + eventName);
`);
```

### onHookTriggered(eventName, targetId, data, filter)

Called on a **Plot** when a plot-level hook fires.

```javascript
obj.setMethod('onHookTriggered', `
  const eventName = args[0];
  const targetId = args[1];
  const data = args[2];
  const filter = args[3];

  // Handle plot-level event
  await self.logEvent("Plot hook triggered: " + eventName);
`);
```

## Best Practices

### 1. Always Call Super

When overriding hooks, call the parent implementation:

```javascript
obj.setMethod('onArrived', `
  const dest = args[0];
  const source = args[1];
  const mover = args[2];

  // Your custom logic first
  if (dest && dest.owner) {
    await dest.owner.registerVerb('eat %t', self, 'eat');
  }

  // Call parent (if it has onArrived)
  // In MOO, inheritance is via prototype chain
`);
```

### 2. Handle Missing Arguments

Hooks may be called with missing arguments:

```javascript
obj.setMethod('onContentArrived', `
  const obj = args[0];
  const source = args[1];    // May be undefined
  const mover = args[2];     // May be undefined

  if (!obj) return;  // Guard against bad calls
`);
```

### 3. Don't Block Critical Paths

Hooks in movement paths should be fast:

```javascript
// BAD - slow operation in movement hook
obj.setMethod('onArrived', `
  await someSlowOperation();  // Blocks the move
`);

// GOOD - schedule for later
obj.setMethod('onArrived', `
  $scheduler.schedule('delayed-' + self.id, 100, 0, self, 'slowOperation');
`);
```

### 4. Clean Up in Paired Hooks

If you register something in `onArrived`, unregister it in `onLeaving`:

```javascript
obj.setMethod('onArrived', `
  await owner.registerVerb('eat %t', self, 'eat');
`);

obj.setMethod('onLeaving', `
  await owner.unregisterVerbsFrom(self);
`);
```

## See Also

- [Prototypes Reference](./prototypes.md) - Where hooks are defined
- [Verb System](./verbs.md) - Verb registration in hooks
- [$ Globals Reference](./globals.md) - System services used in hooks
