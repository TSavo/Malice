# Prototypes Reference

> **Abilities-First**: Prototypes define properties, abilities (prose physics), and infrastructure methods. Game interactions go through the AI narrator. See `docs/ABILITIES-FIRST.md`.

Complete reference for all object prototypes available in Malice.

## Inheritance Hierarchy

```
Root (#1)
├── Describable ($describable)
│   ├── Location ($location)
│   │   ├── Room ($room)
│   │   │   └── Elevator ($elevator)
│   │   ├── Locker ($locker)
│   │   │   └── OneTimeLocker ($oneTimeLocker)
│   │   └── Vendable ($vendable)
│   │
│   ├── Exit ($exit)
│   │   └── GuardedExit ($guardedExit)
│   │
│   ├── Agent ($agent)
│   │   └── Embodied ($embodied)
│   │       └── Human ($human)
│   │           └── Player ($player)
│   │               └── Admin ($admin)
│   │
│   ├── Decayable ($decayable)
│   │   ├── Corpse ($corpse)
│   │   └── Edible ($edible)
│   │       ├── Food ($food)
│   │       │   └── Sustain ($sustain)
│   │       ├── Drink ($drink)
│   │       │   └── BottledWater ($bottledWater)
│   │       └── BodyPart ($bodyPart)
│   │           └── [Specialized parts in $bodyParts.*]
│   │
│   ├── Wearable ($wearable)
│   │   └── Clothing ($clothing)
│   │
│   ├── Stackable ($stackable)
│   │   └── StomachContents ($stomachContents)
│   │
│   ├── Door ($door)
│   ├── Sign ($sign)
│   ├── SealedBox ($sealedBox)
│   ├── Wound ($wound)
│   ├── HumanRemains ($humanRemains)
│   ├── SkeletalRemains ($skeletalRemains)
│   │
│   ├── Lock ($lock)
│   │   ├── BiometricLock ($biometricLock)
│   │   └── RentableLock ($rentableLock)
│   │
│   ├── Phone ($phone)
│   │   ├── WirelessPhone ($wirelessPhone)
│   │   └── Payphone ($payphone)
│   │
│   ├── PhoneDb ($phoneDb)
│   ├── BankTerminal ($bankTerminal)
│   │
│   └── Disposal ($disposal)
│       └── Incinerator ($incinerator)
│
├── Bank ($bank)
└── Faction ($faction)
```

---

## Core Prototypes

### $describable

Base prototype for all things that exist in the world.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | `''` | Display name |
| `description` | string | `''` | Full description |
| `aliases` | string[] | `[]` | Alternative names for matching |
| `location` | RuntimeObject | `null` | Where this object is located |
| `contents` | RuntimeObject[] | `[]` | Objects inside this object |
| `width` | number | `0` | Width in cm |
| `height` | number | `0` | Height in cm |
| `depth` | number | `0` | Depth in cm |
| `weight` | number | `0` | Weight in grams |
| `boltedDown` | boolean | `false` | Cannot be moved if true |

**Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `describe()` | - | string | Get full description |
| `shortDesc()` | - | string | Get short description (name) |
| `getVolume()` | - | number | Get volume in cm³ |
| `canFitIn(container)` | RuntimeObject | boolean | Check if fits in container |
| `canContain(obj)` | RuntimeObject | true \| string | Can contain object? String = rejection reason |
| `moveTo(dest, mover?)` | RuntimeObject, RuntimeObject? | void | Move to destination |
| `addContent(item)` | RuntimeObject | void | Add item to contents |
| `removeContent(item)` | RuntimeObject | void | Remove item from contents |

**Hooks:**
| Hook | Arguments | Description |
|------|-----------|-------------|
| `onLeaving(source, dest, mover)` | RuntimeObjects | Before leaving current location |
| `onArrived(dest, source, mover)` | RuntimeObjects | After arriving at new location |

---

### $location

Container behavior for objects that hold other objects.

**Inherits from:** `$describable`

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `announce(actor, target?, messages)` | RuntimeObject, RuntimeObject?, object | void | Send message to all contents |
| `formatMessage(template, actor, target, viewer)` | strings | string | Format message with pronouns |

**Hooks:**
| Hook | Arguments | Description |
|------|-----------|-------------|
| `onContentLeaving(obj, dest, mover)` | RuntimeObjects | Before content leaves |
| `onContentLeft(obj, dest, mover)` | RuntimeObjects | After content left |
| `onContentArrived(obj, source, mover)` | RuntimeObjects | After content arrived |

---

### $room

Rooms with exits and spatial coordinates.

**Inherits from:** `$location`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x` | number | `0` | X coordinate (meters) |
| `y` | number | `0` | Y coordinate (meters) |
| `z` | number | `0` | Z coordinate (meters, negative=underground) |
| `exits` | RuntimeObject[] | `[]` | Exit objects |
| `sittables` | object[] | `[]` | Places to sit |
| `population` | number | `0` | Artificial crowd level (0-100) |
| `ambientNoise` | number | `0` | Base noise level (0-100) |
| `lighting` | number | `100` | Light level (0=dark, 100=bright) |
| `waterLevel` | number | `0` | Water depth (0=dry, 100=submerged) |
| `outdoor` | boolean | `true` | Is outdoors? |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `addExit(exit)` | RuntimeObject | void | Add an exit |
| `removeExit(exit)` | RuntimeObject \| string | void | Remove exit by object or direction |
| `findExit(direction)` | string | RuntimeObject? | Find exit by direction name |
| `getExits()` | - | RuntimeObject[] | Get all exits |
| `getCoordinates()` | - | {x,y,z} | Get spatial coordinates |
| `setCoordinates(x, y, z?)` | numbers | void | Set coordinates |
| `distanceTo(otherRoom)` | RuntimeObject | number | Distance in meters |
| `directionTo(otherRoom)` | RuntimeObject | string | Compass direction |
| `getCrowdLevel()` | - | number | Effective crowd (0-100+) |
| `getNoiseLevel()` | - | number | Effective noise (0-100) |
| `getPerception(viewer, target)` | RuntimeObjects | object | Check perception clarity |
| `addSittable(name, capacity, emptyMsg, occupiedMsg)` | strings/number | void | Add seating |

**Verbs Provided:**
- `go` / direction names - Move through exits
- `sit` - Sit on sittables
- `stand` - Stand up from sitting

---

### $exit

Connections between rooms.

**Inherits from:** `$describable`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `destRoom` | RuntimeObject | `null` | Destination room |
| `distance` | number | `10` | Distance in meters |
| `hidden` | boolean | `false` | Hidden from obvious exits |
| `door` | RuntimeObject | `null` | Associated door object |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `matches(direction)` | string | boolean | Does direction match this exit? |
| `canUse(agent)` | RuntimeObject | {allowed, reason?} | Can agent use this exit? |
| `traverse(agent)` | RuntimeObject | void | Move agent through exit |

---

### $guardedExit

Faction-restricted exit.

**Inherits from:** `$exit`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `requiredFaction` | string | `null` | Faction required to pass |
| `minRank` | number | `0` | Minimum rank in faction |

---

## Agent Prototypes

### $agent

Base for entities that can act in the world.

**Inherits from:** `$describable`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `verbs` | object | `{}` | Registered verb handlers |
| `watchList` | RuntimeObject[] | `[]` | People being watched |
| `watchExpiry` | object | `{}` | When watch expires |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `registerVerb(pattern, handler, method)` | string/string[], RuntimeObject, string | void | Register a verb |
| `unregisterVerb(pattern, handler?)` | string, RuntimeObject? | void | Unregister a verb |
| `unregisterVerbsFrom(source)` | RuntimeObject | void | Remove all verbs from source |
| `findVerb(command)` | string | object? | Find matching verb handler |
| `tell(message)` | string | void | Send message to this agent |
| `watch(target, duration?)` | RuntimeObject, number? | object | Start watching someone |
| `unwatch(target)` | RuntimeObject | object | Stop watching someone |

---

### $embodied

Agents with physical bodies.

**Inherits from:** `$agent`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `body` | RuntimeObject | `null` | Root body part (torso) |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `getBody()` | - | RuntimeObject | Get body/torso |
| `getTorso()` | - | RuntimeObject | Alias for getBody |
| `getHands()` | - | {primary, secondary, both} | Get hand objects |
| `getPrimaryHand()` | - | RuntimeObject | Get dominant hand |
| `canSee()` | - | {max, percent} | Vision capability |
| `canHear()` | - | {max, percent} | Hearing capability |
| `getCalories()` | - | number | Total calories across body |
| `getMaxCalories()` | - | number | Max calories capacity |

---

### $human

Humans with sex, pronouns, and social capabilities.

**Inherits from:** `$embodied`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sex` | string | `'male'` | male/female/nonbinary |
| `pronouns` | object | `{...}` | {subject, object, possessive} |
| `age` | number | `25` | Age in years |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `say(message)` | string | void | Speak to the room |
| `emote(action)` | string | void | Perform an emote |
| `whisper(target, message)` | RuntimeObject, string | void | Whisper to someone |

**Verbs Provided:**
- `say <message>` - Speak aloud
- `emote <action>` / `:<action>` - Perform emote
- `look` / `look <target>` - Look at room or target
- `inventory` / `i` - View inventory
- `get <item>` - Pick up item
- `drop <item>` - Drop item
- `give <item> to <person>` - Give item

---

### $player

Authenticated player characters.

**Inherits from:** `$human`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `playername` | string | `''` | Login username |
| `passwordHash` | string | `''` | Hashed password |
| `email` | string | `''` | Email address |
| `isWizard` | boolean | `false` | Has wizard powers |
| `canUseDevTools` | boolean | `false` | Can use dev tools |
| `isSuspended` | boolean | `false` | Account suspended |
| `createdAt` | Date | `null` | Account creation time |
| `lastLogin` | Date | `null` | Last login time |
| `totalPlaytime` | number | `0` | Total playtime in ms |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `connect(context)` | ConnectionContext | void | Connect to game |
| `disconnect()` | - | void | Disconnect from game |
| `checkPassword(password)` | string | boolean | Verify password |

---

### $admin

Players with building commands.

**Inherits from:** `$player`

**Additional Verbs:**
- `@dig <direction> to <room>` - Create room and exit
- `@teleport <destination>` - Teleport to room
- `@set <object>.<property> = <value>` - Set property
- `@create <prototype>` - Create object
- `@destroy <object>` - Destroy object
- `@examine <object>` - Detailed inspection
- `@reload` - Reload prototypes
- `@eval <code>` - Execute MOO code

---

## Item Prototypes

### $decayable

Objects that decay over time.

**Inherits from:** `$describable`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `decayLevel` | number | `0` | Decay progress (0-100) |
| `decayRate` | number | `1` | Decay per tick |
| `maxDecay` | number | `100` | When fully decayed |
| `decayStarted` | Date | `null` | When decay began |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `decayTick()` | - | object | Process decay for this tick |
| `getDecayDescription()` | - | string | Description of decay state |
| `isSpoiled()` | - | boolean | Is past safe consumption? |
| `isRotten()` | - | boolean | Is fully decayed? |

---

### $edible

Things that can be consumed (eaten/drunk).

**Inherits from:** `$decayable`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `calories` | number | `100` | Calories per portion |
| `hydration` | number | `0` | ml water equivalent |
| `portions` | number | `1` | Total portions |
| `remaining` | number | `1` | Portions remaining |
| `poisoned` | boolean | `false` | Is poisoned? |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `consume(eater, type)` | RuntimeObject, string | object | Consume a portion |
| `takeBite()` | - | object | Take one bite/sip |

---

### $food

Solid food items with the `eat` verb.

**Inherits from:** `$edible`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ingredients` | object[] | `[]` | [{name, flavor}, ...] |

**Verbs Provided:**
- `eat <food>` - Eat the food

---

### $drink

Liquid drinks with the `drink` verb.

**Inherits from:** `$edible`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `hydration` | number | `250` | ml water equivalent |

**Verbs Provided:**
- `drink <drink>` - Drink the liquid

---

### $clothing

Wearable clothing items.

**Inherits from:** `$wearable`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `covers` | string[] | `['torso']` | Body parts covered |
| `layer` | number | `2` | Layer (1=underwear, 5=outerwear) |
| `warmth` | number | `10` | Warmth provided |
| `protection` | number | `0` | Damage protection |
| `material` | string | `'cotton'` | Fabric type |
| `color` | string | `'white'` | Color |
| `condition` | number | `100` | Condition (0-100) |
| `wornBy` | RuntimeObject | `null` | Who is wearing this |

**Verbs Provided:**
- `wear <clothing>` - Put on clothing (when held)
- `remove <clothing>` - Take off clothing (when worn)

---

### $stackable

Items that stack together (currency, ammunition, etc.).

**Inherits from:** `$describable`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quantity` | number | `1` | Stack count |
| `stackType` | string | `''` | Type for stacking compatibility |
| `maxStack` | number | `100` | Maximum stack size |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `canStackWith(other)` | RuntimeObject | boolean | Can stack with other? |
| `merge(other)` | RuntimeObject | void | Merge other stack into this |
| `split(amount)` | number | RuntimeObject | Split off amount |

---

## Utility Prototypes

### $lock

Access control locks.

**Inherits from:** `$describable`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `locked` | boolean | `true` | Is locked? |
| `code` | string | `''` | Unlock code |
| `authorized` | RuntimeObject[] | `[]` | Authorized users |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `tryUnlock(agent, code?)` | RuntimeObject, string? | boolean | Attempt to unlock |
| `lock()` | - | void | Lock |
| `unlock()` | - | void | Unlock |
| `authorize(agent)` | RuntimeObject | void | Add authorized user |
| `deauthorize(agent)` | RuntimeObject | void | Remove authorized user |

---

### $door

Bidirectional doors shared between exits.

**Inherits from:** `$describable`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | boolean | `true` | Is open? |
| `locked` | boolean | `false` | Is locked? |
| `lock` | RuntimeObject | `null` | Associated lock |

**Additional Methods:**
| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `openDoor(agent)` | RuntimeObject | object | Open the door |
| `closeDoor(agent)` | RuntimeObject | object | Close the door |

---

### $locker

Lockable storage containers.

**Inherits from:** `$location`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `code` | string | `''` | Access code |
| `locked` | boolean | `true` | Is locked? |
| `owner` | RuntimeObject | `null` | Owner |

**Verbs Provided:**
- `open locker` / `unlock locker` - Open with code
- `close locker` / `lock locker` - Close and lock

---

### $sign

Readable, immovable signs.

**Inherits from:** `$describable`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | string | `''` | Sign text |
| `boltedDown` | boolean | `true` | Cannot be moved |
| `authorizedUpdaters` | array | `[]` | Who can update |

**Verbs Provided:**
- `read sign` - Read the sign content

---

### $phone

Communication devices.

**Inherits from:** `$describable`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `phoneNumber` | string | `''` | This phone's number |
| `inCall` | boolean | `false` | Currently in call |
| `callPartner` | RuntimeObject | `null` | Connected phone |

**Verbs Provided:**
- `call <number>` - Call a number
- `answer` - Answer incoming call
- `hangup` - End call

---

## Creating Objects

### Using $recycler.create()

```javascript
// Create food
const apple = await $recycler.create($food, {
  name: 'apple',
  description: 'A crisp red apple.',
  calories: 95,
  portions: 4,
  remaining: 4,
});
await apple.moveTo(room);

// Create clothing
const shirt = await $recycler.create($clothing, {
  name: 'blue shirt',
  description: 'A comfortable cotton shirt.',
  color: 'blue',
  material: 'cotton',
  covers: ['torso'],
  warmth: 15,
});
await shirt.moveTo(player.getPrimaryHand());

// Create room
const room = await $recycler.create($room, {
  name: 'Storage Room',
  description: 'A dusty storage room filled with crates.',
  x: 10,
  y: 5,
  z: 0,
});
```

### Choosing the Right Parent

Pick the most specific prototype:

| Want to create... | Use prototype |
|-------------------|---------------|
| Generic item | `$describable` |
| Container | `$location` |
| Room | `$room` |
| Food | `$food` |
| Drink | `$drink` |
| Clothing | `$clothing` |
| Lock | `$lock` |
| NPC | `$human` |
| Player character | `$player` |

---

## See Also

- [Core Concepts](../core-concepts.md) - Object model basics
- [Best Practices](../best-practices.md) - Coding patterns
- [Verb System](./verbs.md) - How verbs work
- [Event Hooks](./hooks.md) - Hook reference
