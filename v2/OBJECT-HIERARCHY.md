# Object Hierarchy Design

## Core Object Tree

```
#1 Root (parent: 0)
  └─ #2 System (parent: 1)
  └─ #3 AuthManager (parent: 1)
  └─ #4 CharGen (parent: 1)
  └─ #5 PreAuthHandler (parent: 1)
  └─ #10 Describable (parent: 1)
      └─ #11 Agent (parent: 10)
          └─ #12 Human (parent: 11)
              └─ #13 Player (parent: 12)
```

## Object Purposes

### #1 Root
**Purpose:** Base of all inheritance
- Empty properties and methods
- Everything inherits from this

### #2 System
**Purpose:** Connection routing
- Routes new connections to auth
- Not in the Describable tree

### #3 AuthManager
**Purpose:** Interactive login
- Shows login screen
- Handles username/password input
- Not in the Describable tree

### #4 CharGen
**Purpose:** Character creation
- Creates new Player objects (inherits from Player #13)
- Sets up initial properties
- Not in the Describable tree

### #5 PreAuthHandler
**Purpose:** Transport-level auth (SSL, OAuth, etc.)
- Validates certificates/tokens
- Looks up existing Player objects
- Not in the Describable tree

### #10 Describable
**Purpose:** Things that can be described
```typescript
properties: {
  name: string;           // Short name
  description: string;    // Long description
  aliases: string[];      // Alternative names
}

methods: {
  describe(): string;     // Return full description
  shortDesc(): string;    // Return name
}
```

**Examples:** rooms, objects, NPCs, players

### #11 Agent
**Purpose:** Things that can act
```typescript
properties: {
  location: ObjId;        // Where this agent is
  inventory: ObjId[];     // What agent is carrying
}

methods: {
  moveTo(location: ObjId): void;
  say(message: string): void;
  emote(action: string): void;
}
```

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

**Examples:** players, human NPCs

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
  connect(context: ConnectionContext): void;
  disconnect(): void;
  checkPassword(password: string): Promise<boolean>;
  setPassword(password: string): Promise<void>;
}
```

**Examples:** Individual player characters

## Inheritance Examples

### Player Instance (#100)
```typescript
// Object #100 (parent: 13)
properties: {
  // From Describable (#10):
  name: "Alice",
  description: "A skilled adventurer",
  aliases: ["ali"],

  // From Agent (#11):
  location: 50,  // In room #50
  inventory: [101, 102],

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
4. Check #11 (Agent) methods → Not found
5. Check #10 (Describable) methods → Found `describe()` ✓
6. Execute method with `self` = player #100

## CharGen Creates Players

```typescript
// CharGen (#4) creates new Player objects
methods: {
  onNewUser: `
    const context = args[0];
    const username = args[1];
    const password = args[2];  // NEW: require password

    // Hash password
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new player (inherits from Player prototype #13)
    const player = await context.$.create({
      parent: 13,  // ← Inherit from Player prototype
      properties: {
        // Describable
        name: username,
        description: "A new player",
        aliases: [username.toLowerCase()],

        // Agent
        location: 100,  // Starting room
        inventory: [],

        // Human
        sex: "non-binary",  // Default, can be changed
        pronouns: { subject: "they", object: "them", possessive: "their" },
        age: 25,
        species: "human",

        // Player
        playername: username.toLowerCase(),
        email: "",  // To be filled in
        passwordHash: passwordHash,
        canUseDevTools: false,  // Default: no DevTools access
        isWizard: false,
        isSuspended: false,
        createdAt: new Date(),
        lastLogin: new Date(),
        totalPlaytime: 0,
        title: "the Newbie"
      }
    });

    context.authenticate(player.id);
    context.send(\`Welcome, \${player.get('name')}!\\r\\n\`);

    // Call player's connect method
    await player.call('connect', context);
  `
}
```

## AuthManager Validates Players

```typescript
// AuthManager (#3) validates username/password
methods: {
  onInput: `
    const context = args[0];
    const input = args[1];

    // Parse username:password
    const [username, password] = input.split(':');

    if (!username || !password) {
      context.send('Format: username:password\\r\\n');
      return;
    }

    // Find player by playername
    const players = await context.$.db.listAll();
    const player = players.find(p =>
      p.parent === 13 &&  // Is a Player object
      p.properties.playername === username.toLowerCase()
    );

    if (!player) {
      context.send('Invalid username or password\\r\\n');
      return;
    }

    // Load as RuntimeObject
    const playerObj = await context.$.load(player._id);

    // Check password
    const valid = await playerObj.call('checkPassword', password);
    if (!valid) {
      context.send('Invalid username or password\\r\\n');
      return;
    }

    // Check if suspended
    if (playerObj.get('isSuspended')) {
      context.send('Your account has been suspended\\r\\n');
      context.close();
      return;
    }

    // Authenticate and connect
    context.authenticate(playerObj.id);
    playerObj.set('lastLogin', new Date());

    await playerObj.call('connect', context);
  `
}
```

## PreAuthHandler Finds Players

```typescript
// PreAuthHandler (#5) finds Player by cert/token
methods: {
  handleSSLCert: `
    const context = args[0];
    const cert = args[1];

    if (!cert.verified) {
      context.send('SSL certificate not verified\\r\\n');
      context.close();
      return;
    }

    // Find Player by SSL fingerprint or email
    const players = await context.$.db.listAll();
    const playerDoc = players.find(p =>
      p.parent === 13 &&  // Is a Player object
      (p.properties.sslFingerprint === cert.fingerprint ||
       p.properties.email === cert.commonName)
    );

    if (!playerDoc) {
      context.send('No player found for certificate\\r\\n');
      context.close();
      return;
    }

    // Load as RuntimeObject
    const player = await context.$.load(playerDoc._id);

    // Check suspension
    if (player.get('isSuspended')) {
      context.send('Your account has been suspended\\r\\n');
      context.close();
      return;
    }

    // Check DevTools permission for this connection
    const canUseDevTools = player.get('canUseDevTools') === true;
    if (!canUseDevTools) {
      context.send('Your account does not have DevTools access\\r\\n');
      context.close();
      return;
    }

    // Authenticate and connect
    context.authenticate(player.id);
    player.set('lastLogin', new Date());

    await player.call('connect', context);
  `
}
```

## Player Methods

```typescript
// Player prototype (#13)
methods: {
  // Called when player connects
  connect: `
    const context = args[0];

    context.send(\`\\r\\nWelcome back, \${self.name}!\\r\\n\`);
    context.send(\`You are \${self.description}\\r\\n\`);

    // Show location
    const location = await $.load(self.location);
    if (location) {
      const desc = await location.call('describe');
      context.send(\`\\r\\n\${desc}\\r\\n\`);
    }

    // Notify others in room
    // TODO: Implement room.announce()
  `,

  // Called when player disconnects
  disconnect: `
    // Save any unsaved state
    await self.save();

    // Notify room
    // TODO: Implement room.announce()
  `,

  // Check if password matches
  checkPassword: `
    const password = args[0];
    const bcrypt = require('bcrypt');
    return await bcrypt.compare(password, self.passwordHash);
  `,

  // Set new password
  setPassword: `
    const password = args[0];
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(password, 10);
    self.passwordHash = hash;
    await self.save();
  `
}
```

## Bootstrap Changes

The bootstrap process creates:
1. #1 Root (empty base)
2. #2 System (connection router)
3. #3 AuthManager (interactive login)
4. #4 CharGen (creates Players)
5. #5 PreAuthHandler (SSL/OAuth/etc)
6. **#10 Describable** (has name, description)
7. **#11 Agent** (can act, has location)
8. **#12 Human** (has sex, pronouns)
9. **#13 Player** (login, auth, permissions)

All player objects created by CharGen inherit from Player (#13), which inherits from Human → Agent → Describable → Root.

## Querying Players

```typescript
// Find all players
const players = await db.listAll();
const playerObjects = players.filter(obj => obj.parent === 13);

// Find player by username
const alice = playerObjects.find(p =>
  p.properties.playername === 'alice'
);

// Find wizards
const wizards = playerObjects.filter(p =>
  p.properties.isWizard === true
);

// Find players with DevTools access
const devToolsUsers = playerObjects.filter(p =>
  p.properties.canUseDevTools === true
);
```

## Migration from Current System

Current user creation in CharGen creates objects with `parent: 1` (Root).

New system creates objects with `parent: 13` (Player):
- Inherit all Describable/Agent/Human/Player properties
- Proper property resolution via prototype chain
- Can add/override methods on Player prototype
- All players instantly get new capabilities

## Benefits

✅ **Proper inheritance** - Players automatically get describe(), moveTo(), etc.
✅ **DRY** - Properties defined once on prototypes
✅ **Extensible** - Add properties to Player prototype, all instances inherit
✅ **MOO-style** - Matches LambdaMOO object model
✅ **Type-safe auth** - Only Player objects have passwordHash, canUseDevTools
✅ **Clear hierarchy** - Easy to understand what each object is

## Example: Granting DevTools Access

```typescript
// Via MOO command (future)
@property alice.canUseDevTools = true

// Via DevTools (now)
{
  "method": "property.set",
  "params": {
    "objectId": 100,  // Alice's object ID
    "name": "canUseDevTools",
    "value": true
  }
}

// Via code
const alice = await manager.load(100);
alice.set('canUseDevTools', true);
await alice.save();
```

Alice can now connect via SSL cert and use DevTools!
