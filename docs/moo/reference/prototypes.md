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
│   ├── Furniture ($furniture)
│   │   ├── Bed ($bed)
│   │   ├── Chair ($chair)
│   │   ├── Couch ($couch)
│   │   ├── Table ($table)
│   │   │   └── Desk ($desk)
│   │   ├── Trunk ($trunk)
│   │   ├── Cabinet ($cabinet)
│   │   ├── Crate ($crate)
│   │   └── Safe ($safe)
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
| `allowedFaction` | string | `null` | Faction name that can pass (null = unrestricted) |
| `denyMessage` | string | `'You are not authorized to pass.'` | Message shown when access denied |

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

### $furniture

Base prototype for all furniture items.

**Inherits from:** `$describable`

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | `'Furniture'` | Display name |
| `description` | string | `'A piece of furniture'` | Full description |
| `weight` | number | `20000` | Weight in grams (20kg default) |
| `abilities` | string | - | Room fixture. Can hide behind for cover. May conceal items. |

**Abilities:**
Room fixture. Can hide behind for cover. May conceal items underneath/behind. Bolted-down furniture can't be moved. Heavy furniture hard to move alone. Can be destroyed - wood burns, glass shatters.

---

### $bed

Sleeping furniture for rest and recovery.

**Inherits from:** `$furniture`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `occupant` | RuntimeObject | `null` | Person currently sleeping in bed |
| `quality` | string | `'standard'` | Quality level: 'cheap', 'standard', or 'luxury' |

**Abilities:**
Sleep here to restore energy and heal. Quality affects recovery rate. Cheap beds restore slowly, luxury beds restore fast. Can hide under bed. Mattress provides some cover from gunfire. Very vulnerable while sleeping - ambush risk.

---

### $chair

Single-person seating.

**Inherits from:** `$furniture`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `occupant` | RuntimeObject | `null` | Person sitting in chair |
| `weight` | number | `5000` | Weight in grams (5kg) |

**Abilities:**
Seat for one. Sit to rest legs, reduces fatigue recovery time. Can be thrown as improvised weapon. Swivel chairs roll. Standing from chair takes a moment - disadvantage if ambushed while seated.

---

### $couch

Multi-person seating.

**Inherits from:** `$furniture`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `capacity` | number | `3` | Number of people who can sit |
| `occupants` | RuntimeObject[] | `[]` | Array of seated people |
| `weight` | number | `35000` | Weight in grams (35kg) |

**Abilities:**
Seats multiple people. Can sleep on in a pinch (poor quality rest). Cushions can hide small items. Heavy - hard to move alone. Provides some cover if you duck behind it.

---

### $table

Flat surface for placing items.

**Inherits from:** `$furniture`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `surface` | RuntimeObject[] | `[]` | Items on the table |
| `weight` | number | `15000` | Weight in grams (15kg) |

**Abilities:**
Flat surface. Place items on top. Flip for cover. Items on table are visible and accessible. Can hide under table. Flipped table provides partial cover but blocks movement.

---

### $desk

Work surface with storage drawers.

**Inherits from:** `$table`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `drawers` | Array | `[]` | Drawer contents |
| `locked` | boolean | `false` | Whether drawers are locked |
| `weight` | number | `25000` | Weight in grams (25kg) |

**Abilities:**
Work surface with storage. Drawers can hold items, may be locked. Heavier than table, harder to flip. Solid front provides better cover. Knee space underneath - can hide there.

---

### $trunk

Lockable storage chest.

**Inherits from:** `$furniture`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | boolean | `false` | Whether lid is open |
| `lock` | RuntimeObject | `null` | Lock object, null if unlocked |
| `contents` | RuntimeObject | `null` | Pocket objref for stored items |
| `weight` | number | `15000` | Weight in grams (15kg) |

**Abilities:**
Hinged chest with lid. Open to access contents. 'lock' holds a $lock object - must unlock before opening. Sturdy construction. Can sit on when closed. Can be carried when empty (heavy when full).

---

### $cabinet

Storage cabinet with doors.

**Inherits from:** `$furniture`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | boolean | `false` | Whether doors are open |
| `lock` | RuntimeObject | `null` | Lock object, null if unlockable |
| `contents` | RuntimeObject | `null` | Pocket objref for stored items |
| `weight` | number | `30000` | Weight in grams (30kg) |

**Abilities:**
Storage with doors. Open to access contents. Can be locked. Wall-mounted or freestanding. Kitchen cabinets, filing cabinets, medicine cabinets - all variations.

---

### $crate

Wooden shipping container.

**Inherits from:** `$furniture`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | boolean | `false` | Whether lid is removed/open |
| `sealed` | boolean | `true` | Whether crate is nailed shut |
| `contents` | RuntimeObject | `null` | Pocket objref for stored items |
| `weight` | number | `10000` | Weight in grams (10kg) |

**Abilities:**
Wooden box for shipping. Sealed crates must be pried open (crowbar, force). Once opened, can't be resealed properly. Nails or staples hold lid. Can stand on. Wood burns, breaks with enough force. Stacking creates cover or climbing opportunities.

---

### $safe

Heavy secure storage with combination lock.

**Inherits from:** `$furniture`

**Additional Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | boolean | `false` | Whether safe door is open |
| `lock` | RuntimeObject | `null` | Lock mechanism objref |
| `contents` | RuntimeObject | `null` | Pocket objref for stored items |
| `fireproof` | boolean | `true` | Whether contents survive fire |
| `weight` | number | `100000` | Weight in grams (100kg) |

**Abilities:**
Heavy metal box. Very hard to break into - requires cracking or cutting. Combination lock, keypad, or key lock. Fireproof protects contents from fire. Too heavy to move when bolted down. Small safes can be stolen whole. Drilling takes hours. Explosives may destroy contents.

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
