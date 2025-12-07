# Object Hierarchy Design

## Core Object Tree

```
#-1 Nothing (no parent)
#0 ObjectManager (no parent)
#1 Root (parent: 0)
  └─ #2 System (parent: 1)
  └─ #3 AuthManager (parent: 1)
  └─ #4 CharGen (parent: 1)
  └─ #5 PreAuthHandler (parent: 1)
  └─ #10 Describable (parent: 1)
      └─ #11 Location (parent: 10)
          └─ #14 Room (parent: 11)
      └─ #15 Agent (parent: 10)
          └─ #12 Human (parent: 15)
              └─ #13 Player (parent: 12)
  └─ #20 Recycler (parent: 1)
```

## Object Purposes

### #-1 Nothing
**Purpose:** Null object reference
- Represents "no object"
- Used for empty references
- Accessible via `$.nothing`

### #0 ObjectManager
**Purpose:** System root
- Manages object aliases
- Not a game object

### #1 Root
**Purpose:** Base of all inheritance
- Empty properties and methods
- Everything inherits from this

### #2 System
**Purpose:** Connection routing
- Routes new connections to auth
- Method: `onConnection(context)` → delegates to AuthManager
- Not in the Describable tree

### #3 AuthManager
**Purpose:** Interactive login
- Shows login screen
- Handles username/password input
- Method: `onConnect(context)` → shows login prompt
- Method: `onInput(context, input)` → validates credentials
- Not in the Describable tree

### #4 CharGen
**Purpose:** Character creation
- Creates new Player objects (inherits from Player #13)
- Sets up initial properties
- Method: `onNewUser(context, username, password)`
- Not in the Describable tree

### #5 PreAuthHandler
**Purpose:** Transport-level auth (SSL, OAuth, etc.)
- Validates certificates/tokens
- Looks up existing Player objects
- Method: `handleSSLCert(context, cert)`
- Not in the Describable tree

### #10 Describable
**Purpose:** Things that can be described AND moved
```typescript
properties: {
  name: string;           // Short name
  description: string;    // Long description
  aliases: string[];      // Alternative names
  location: ObjId;        // Where this object is (0 = nowhere)
}

methods: {
  describe(): string;     // Return full description
  shortDesc(): string;    // Return name
  moveTo(dest, mover?): void;  // THE primitive for all location changes
  onLeaving(source, dest, mover): void;  // Called before leaving
  onArrived(dest, source, mover): void;  // Called after arriving
}
```

**Key Design:** `moveTo()` is the SINGLE PRIMITIVE for ALL location changes. It:
1. Calls source container's `onContentLeaving()` (can throw to cancel)
2. Calls self's `onLeaving()` (prepare for departure)
3. Updates location property
4. Calls source container's `onContentLeft()` (cleanup, unregister verbs)
5. Calls self's `onArrived()` (register verbs)
6. Calls destination container's `onContentArrived()` (announce, register verbs)

**Examples:** Items, furniture, anything that can be somewhere

### #11 Location
**Purpose:** Things that can contain other things
```typescript
properties: {
  // Inherits from Describable
}

methods: {
  // Container transition hooks
  onContentLeaving(obj, dest, mover): void;   // Before content leaves (can throw to cancel)
  onContentLeft(obj, dest, mover): void;      // After content has left
  onContentArrived(obj, source, mover): void; // After content has arrived
}
```

**Examples:** Rooms, containers, bags

### #14 Room
**Purpose:** Navigable locations with exits
```typescript
properties: {
  // Inherits from Location
  exits: { [direction: string]: ObjId };  // e.g., { north: 51, south: 52 }
}

methods: {
  go(context, player, direction): void;   // Handle exit navigation
  onContentArrived(obj, source, mover): void;  // Register exit verbs on arriving agents
  onContentLeft(obj, dest, mover): void;       // Unregister exit verbs on leaving agents
}
```

**Examples:** Town Square, Tavern, Forest Path

### #15 Agent
**Purpose:** Things that can act and have verbs registered on them
```typescript
properties: {
  // Inherits from Describable (has location)
  verbs: { [verbName: string]: { obj: ObjId, method: string } };  // Registered commands
}

methods: {
  say(message: string): void;
  emote(action: string): void;

  // Verb registration
  registerVerb(name, sourceObj, method?): void;   // Register a command
  unregisterVerb(name): void;                     // Remove a command
  unregisterVerbsFrom(sourceObjId): void;         // Remove all verbs from an object
  hasVerb(name): boolean;                         // Check if verb exists
  getVerb(name): { obj, method } | null;          // Get verb info
}
```

**Key Design:** Verbs are dynamically registered/unregistered as objects move around:
- Room registers its exits when you enter, unregisters when you leave
- Gun registers `shoot` when picked up, unregisters when dropped
- Default verbs (`look`, `say`, `quit`) registered on player connect

**Examples:** NPCs, players

### #12 Human
**Purpose:** Human-like agents (players and realistic NPCs)
```typescript
properties: {
  sex: 'male' | 'female' | 'non-binary';
  pronouns: { subject, object, possessive };
  age: number;
  species: string;        // Usually 'human'
}

methods: {
  pronoun(type: 'subject' | 'object' | 'possessive'): string;
}
```

**Examples:** Players, human NPCs

### #13 Player
**Purpose:** Prototype for all player objects
```typescript
properties: {
  playername: string;     // Login username (unique)
  email: string;          // Email address
  passwordHash: string;   // Bcrypt hash
  sslFingerprint: string; // SSL cert fingerprint (optional)
  oauthSubject: string;   // OAuth sub claim (optional)

  // Permissions
  canUseDevTools: boolean;
  isWizard: boolean;
  isSuspended: boolean;

  // Stats
  createdAt: Date;
  lastLogin: Date;
  totalPlaytime: number;

  // Player-specific
  title: string;          // Player's title
  homepage: string;       // Player's homepage
}

methods: {
  connect(context): void;     // Called on login - registers default verbs
  disconnect(): void;         // Called on logout
  onInput(context, input): void;  // THE player command loop
  checkPassword(password): Promise<boolean>;
  setPassword(password): Promise<void>;

  // Built-in commands
  look(): void;
  say(message): void;
  quit(): void;
}
```

**Command Flow:**
1. Player connects → `connect()` registers `look`, `say`, `quit` verbs
2. Player moves to room → Room's `onContentArrived()` registers exit verbs
3. Player types "north" → `onInput()` finds verb in registry, calls Room's `go()` method
4. Player leaves room → Room's `onContentLeft()` unregisters exit verbs

**Examples:** Individual player characters

### #20 Recycler
**Purpose:** Object deletion and ID reuse
- Soft-deletes objects
- Maintains list of recyclable IDs
- New objects reuse lowest available ID

## Verb Registration Flow

```
Player enters room with exits: { north: 100, south: 101 }

1. player.moveTo(roomId)
2. room.onContentArrived(player, ...)
3.   player.registerVerb('north', room, 'go')
4.   player.registerVerb('south', room, 'go')

Player types "north":

1. player.onInput(..., 'north')
2. verbInfo = player.getVerb('north')  → { obj: roomId, method: 'go' }
3. room.go(context, player, 'north')
4.   player.moveTo(100, player)
5.     room.onContentLeft(player, ...)  → unregisters 'north', 'south'
6.     newRoom.onContentArrived(player, ...) → registers new exits
```

## Location Transition Hooks

| Hook | Called On | When | Purpose |
|------|-----------|------|---------|
| `onContentLeaving(obj, dest, mover)` | Source container | Before move | Can throw to cancel |
| `onLeaving(source, dest, mover)` | Moving object | Before move | Prepare for departure |
| `onContentLeft(obj, dest, mover)` | Source container | After move | Cleanup, unregister verbs |
| `onArrived(dest, source, mover)` | Moving object | After move | Register verbs |
| `onContentArrived(obj, source, mover)` | Dest container | After move | Announce arrival, register verbs |

## Inheritance Examples

### Player Instance (#100)
```typescript
// Object #100 (parent: 13)
properties: {
  // From Describable (#10):
  name: "Alice",
  description: "A skilled adventurer",
  aliases: ["ali"],
  location: 50,  // In room #50

  // From Agent (#15):
  verbs: {
    look: { obj: 100, method: 'look' },
    say: { obj: 100, method: 'say' },
    quit: { obj: 100, method: 'quit' },
    north: { obj: 50, method: 'go' },  // Registered by room #50
    south: { obj: 50, method: 'go' },
  },

  // From Human (#12):
  sex: "female",
  pronouns: { subject: "she", object: "her", possessive: "her" },
  age: 25,
  species: "human",

  // From Player (#13):
  playername: "alice",
  email: "alice@example.com",
  passwordHash: "$2b$10$...",
  sslFingerprint: "AA:BB:CC:...",
  canUseDevTools: true,
  isWizard: false,
  createdAt: new Date(),
  lastLogin: new Date(),

  // Instance-specific:
  title: "the Brave",
  homepage: "https://alice.example.com"
}
```

When code calls `player.get('name')`, RuntimeObject walks up:
1. Check #100 → Found `name: "Alice"` ✓
2. Return "Alice"

When code calls `player.call('describe')`:
1. Check #100 methods → Not found
2. Check #13 (Player) methods → Not found
3. Check #12 (Human) methods → Not found
4. Check #15 (Agent) methods → Not found
5. Check #10 (Describable) methods → Found `describe()` ✓
6. Execute method with `self` = player #100

### Room Instance (#50)
```typescript
// Object #50 (parent: 14)
properties: {
  // From Describable (#10):
  name: "Town Square",
  description: "A bustling square with a central fountain.",
  aliases: ["square", "fountain"],
  location: 0,  // Rooms don't have a location

  // From Room (#14):
  exits: {
    north: 51,
    south: 52,
    east: 53
  }
}
```

When a player enters:
1. `player.moveTo(50)` is called
2. Room #50's `onContentArrived()` runs
3. For each exit direction, registers verb on player
4. Player can now type "north", "south", "east"

### Item with Verbs (#200)
```typescript
// Object #200 (parent: 10) - A Gun
properties: {
  name: "revolver",
  description: "A weathered six-shooter.",
  location: 100,  // In Alice's hand
}

methods: {
  onArrived: `
    const dest = args[0];
    const owner = await $.load(dest.location);
    if (owner && owner.registerVerb) {
      await owner.registerVerb('shoot', self);
      await owner.registerVerb('aim', self);
    }
  `,

  onLeaving: `
    const source = args[0];
    const owner = await $.load(source.location);
    if (owner && owner.unregisterVerbsFrom) {
      await owner.unregisterVerbsFrom(self.id);
    }
  `,

  shoot: `
    const target = args[0];
    context.send('BANG!\\r\\n');
    // ... shooting logic
  `
}
```

## Player Command Loop

The `onInput` method on Player handles all commands:

```typescript
// Player.onInput
const input = args[1].trim();
if (!input) return;

const parts = input.split(/\s+/);
const verb = parts[0].toLowerCase();
const argString = parts.slice(1).join(' ');

// Look up verb in registry
const verbInfo = await self.getVerb(verb);

if (verbInfo) {
  // Dispatch to handler
  const handler = await $.load(verbInfo.obj);
  const result = await handler[verbInfo.method](context, self, argString);
  if (result !== undefined) {
    context.send(`${result}\r\n`);
  }
} else {
  context.send(`I don't understand "${verb}".\r\n`);
}
```

## Bootstrap Order

The bootstrap process creates objects in this order:
1. **#1 Root** (empty base)
2. **#2 System** (connection router)
3. **#3 AuthManager** (interactive login)
4. **#4 CharGen** (creates Players)
5. **#5 PreAuthHandler** (SSL/OAuth/etc)
6. **#10 Describable** (has name, description, location, moveTo)
7. **#11 Location** (container hooks)
8. **#14 Room** (exits, go, registers exit verbs)
9. **#15 Agent** (verbs registry, registerVerb, unregisterVerb)
10. **#12 Human** (has sex, pronouns)
11. **#13 Player** (login, auth, onInput command loop)
12. **#20 Recycler** (object deletion/recovery)

All player objects created by CharGen inherit from Player (#13), which inherits from Human → Agent → Describable → Root.

## Key Design Principles

### 1. Everything is MOO Code
All game logic lives in MongoDB as methods. TypeScript only provides:
- Transport layer (Telnet, WebSocket)
- Object database (MongoDB persistence)
- Method execution (RuntimeObject)

### 2. Dynamic Verb Registration
Commands aren't hardcoded. Objects register their verbs when they become relevant:
- Room registers exits when you enter
- Weapon registers `shoot` when picked up
- Player registers `look`, `say`, `quit` on connect

### 3. Single Primitive for Movement
`moveTo()` is the ONLY way to change location. It ensures:
- All transition hooks fire
- Verb registration/unregistration happens
- No bypassing the lifecycle

### 4. Prototype Inheritance
Objects inherit from parents. Override by defining locally:
- Player #100's `name` = "Alice" shadows any parent's `name`
- Method lookup walks the chain until found

## Benefits

✅ **Dynamic commands** - Objects bring their own verbs
✅ **Clean transitions** - Hooks ensure proper cleanup
✅ **Extensible** - Add new item types with their own verbs
✅ **MOO-style** - All logic in the database, not TypeScript
✅ **Testable** - Each method can be tested in isolation
✅ **Live updates** - Change methods without restarting server
