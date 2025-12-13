# Authentication System

Interactive login, character creation, and pre-authenticated connections.

## Overview

The authentication system handles user login and character creation:

- **$.authManager** - Interactive username/password login
- **$.charGen** - New character creation wizard
- **$.preAuthHandler** - Pre-authenticated connections (SSL, HTTP, OAuth)

**Connection Flow:**
```
Connection
    │
    ├── Pre-authenticated? ──────► $.preAuthHandler
    │                                    │
    │                                    ▼
    │                              SSL/HTTP/OAuth
    │                                    │
    │                                    ▼
    │                              Player.connect()
    │
    └── Interactive ─────────────► $.authManager
                                        │
                                        ▼
                                  Username prompt
                                        │
                         ┌──────────────┴──────────────┐
                         │                             │
                    Existing user               New user
                         │                             │
                         ▼                             ▼
                   Password check              $.charGen.onNewUser()
                         │                             │
                         ▼                             ▼
                  Player.connect()              Character wizard
                                                       │
                                                       ▼
                                                Player.connect()
```

## $.authManager - Interactive Login

Handles traditional username/password login via telnet/terminal.

### Properties

```javascript
{
  name: 'AuthManager',
  description: 'Interactive login and authentication',

  // ASCII art welcome banner
  welcomeMessage: '...',

  // Internal state machine
  _state: {
    stage: 'username' | 'password' | 'new-password',
    username: null,
    userId: null,
    context: null,
  },
}
```

### Key Methods

#### onConnect(context)
Called when a new connection arrives. Displays welcome message.

```javascript
// TelnetServer calls:
await authManager.onConnect(connectionContext);
// Shows ASCII welcome banner
// "Enter your username, or a new name to create a character."
// "Login: "
```

#### onInput(context, input)
Processes user input during login flow.

```javascript
// State machine stages:
// 1. 'username' - Collect username
//    - If user exists -> ask password
//    - If new user -> ask for new password
// 2. 'password' - Verify existing user
//    - Check password hash
//    - If valid -> authenticate and connect
//    - If invalid -> back to username
// 3. 'new-password' - Create new user
//    - Validate password (min 6 chars)
//    - Hand off to CharGen
```

### Login Flow Example

```
╔══════════════════════════════════════════════════════════╗
║                     M A L I C E                          ║
╚══════════════════════════════════════════════════════════╝

Enter your username, or a new name to create a character.

Login: bob
Password: ****
Welcome back, Bob!

--- OR ---

Login: newplayer
New user! Choose a password: ******
[Character creation begins...]
```

### Suspended Users

If a user is suspended, they cannot login:

```javascript
if (player.get('isSuspended')) {
  context.send('Your account has been suspended\r\n');
  context.close();
  return;
}
```

## $.charGen - Character Creation

Interactive character creation wizard for new players.

### Properties

```javascript
{
  name: 'CharGen',
  description: 'Character creation system',
}
```

### Stat Allocation Constants

```javascript
// Point costs for body parts
STAT_COSTS = {
  head: 1,      // Single part
  torso: 1,     // Single part
  arms: 2,      // Paired (both arms)
  hands: 2,     // Paired (both hands)
  legs: 2,      // Paired (both legs)
  feet: 2,      // Paired (both feet)
  eyes: 2,      // Paired (both eyes)
  ears: 2,      // Paired (both ears)
};

CALORIES_PER_POINT = 10;    // maxCalories boost per point
STARTING_STAT_POINTS = 20;  // Points for new characters
```

### Key Methods

#### onNewUser(context, username, password)
Entry point from AuthManager for new users.

```javascript
await charGen.onNewUser(connectionContext, 'bob', 'password123');
// Creates Player object
// Authenticates context
// Runs character wizard
```

**What it does:**
1. Display welcome box
2. Hash password
3. Check if first player (admin)
4. Create Player object with minimal defaults
5. Run `runCharGen()` wizard

#### runCharGen(player, isFirstPlayer)
Interactive character creation flow.

**Step 1: Identity**
- Name (alias)
- Sex (male/female/nonbinary)
- Pronouns (auto-assigned based on sex)

**Step 2: Physical**
- Age (18-100)
- Height (1.0-2.5 meters)
- Weight (30-200 kg)

**Step 3: Eyes**
- Eye color (15 options + heterochromia)
- Eye shape (10 options)

**Step 4: Hair**
- Hair color (28 options)
- Hair style (11 options)
- Hair texture (6 options)

**Step 5: Skin & Build**
- Skin tone (24 options)
- Build type (12 options)

**Step 6: Face**
- Face shape (8 options)
- Nose shape (10 options)
- Lip shape (8 options)
- Freckles (4 options)
- Distinguishing marks (7 options)
- Facial hair (12 options)

**Body Creation**
- Creates body via `$.bodyFactory.createHumanBody()`
- Links body to player

**Stat Allocation**
- Runs `runStatAllocation()` for point spending

**Final Confirmation**
- Shows character summary
- Allows restart if not satisfied
- Connects player to game on confirm

#### allocateStat(player, statName)
Spend points to boost body part capacity.

```javascript
const result = await charGen.allocateStat(player, 'arms');
// { success: true, stat: 'arms', cost: 2, remaining: 18 }
```

**What it does:**
1. Validate stat name and cost
2. Check player has enough points
3. Deduct points from `statPointsRemaining`
4. Find body parts and boost `maxCalories` by 10

#### runStatAllocation(player)
Interactive stat allocation loop.

```javascript
await charGen.runStatAllocation(player);
// Shows current body capacities
// Prompts for stat choice
// Repeats until done or out of points
```

### Character Creation Example

```
╔══════════════════════════════════════════════════════════╗
║               ✦ Welcome to MALICE ✦                      ║
╠══════════════════════════════════════════════════════════╣
║  You stand at the threshold of a dark and dangerous      ║
║  world. Before you can enter, you must give form to      ║
║  your vessel.                                            ║
╚══════════════════════════════════════════════════════════╝

[ Step 1/6 █████░░░░░░░░░░ ] IDENTITY
  Your name is how others will know you.
  What name do you go by? Shadow

  What is your sex?
    1) Male
    2) Female
    3) Non-binary
  Choose: 1

[ Step 2/6 ██████████░░░░░ ] PHYSICAL
  How old are you? (18-100) 28
  How tall are you in meters? (1.0 - 2.5) 1.82
  Weight in kilograms? (30 - 200) 75

[... continues through all steps ...]

✦ STAT ALLOCATION ✦

Body Part Capacities:
----------------------------------------
  Torso          100
  Head           100
  Eyes (each)    100
  Arms (each)    100
  ...

Points remaining: 20

Which body part to strengthen?
  1) Head (1 pt)
  2) Torso (1 pt)
  3) Arms (2 pts)
  ...
  9) Done - keep remaining points

Choose: 3
Increased Arms capacity! (18 points left)

[... continues until done ...]

╔══════════════════════════════════════════════════════════╗
║              ✦ FINAL CHARACTER SUMMARY ✦                 ║
╚══════════════════════════════════════════════════════════╝

  Name:    Shadow
  Sex:     male (he/him)
  Age:     28 years
  Height:  1.82m
  Weight:  75kg

Create this character and enter the game? (y/n) y

✦ CHARACTER CREATED SUCCESSFULLY! ✦

Welcome to MALICE, Shadow!
```

### First Player Admin

The first player created becomes an administrator:

```javascript
const isFirstPlayer = existingPlayers === 0;

if (isFirstPlayer) {
  player.set('canUseDevTools', true);
  player.set('isWizard', true);
  player.set('title', 'the Administrator');
}
```

## $.preAuthHandler - Pre-Authenticated Connections

Handles connections that arrive already authenticated via SSL certs, HTTP Basic Auth, or OAuth.

### Properties

```javascript
{
  name: 'PreAuthHandler',
  description: 'Pre-authenticated connection handler (SSL, HTTP auth, OAuth)',
}
```

### Auth Modes

| Mode | Source | Player Lookup |
|------|--------|---------------|
| `ssl-cert` | TLS client certificate | `sslFingerprint` or `email` |
| `http-basic` | HTTP Authorization header | `playername` + password |
| `oauth` | JWT Bearer token | Not yet implemented |
| `custom` | Custom auth headers | Not yet implemented |

### Key Methods

#### onPreAuth(context, authInfo)
Routes to appropriate handler based on auth mode.

```javascript
await preAuthHandler.onPreAuth(context, {
  mode: 'ssl-cert',
  sslCert: {
    verified: true,
    commonName: 'bob@example.com',
    fingerprint: 'AB:CD:EF:...',
  },
});
```

#### handleSSLCert(context, cert)
Authenticate via TLS client certificate.

```javascript
// Checks:
// 1. Certificate verified by TLS layer
// 2. Player found by fingerprint or email
// 3. Player not suspended
// 4. Player has DevTools access (required for SSL auth)
```

**Player lookup:**
```javascript
const playerDoc = users.find(u =>
  u.parent === playerPrototypeId &&
  (u.properties.sslFingerprint === cert.fingerprint ||
   u.properties.email === cert.commonName)
);
```

#### handleHTTPBasic(context, basic)
Authenticate via HTTP Basic Auth.

```javascript
await preAuthHandler.handleHTTPBasic(context, {
  username: 'bob',
  password: 'password123',
});
```

**What it does:**
1. Find player by `playername`
2. Check not suspended
3. Verify password hash
4. Authenticate and connect

#### handleOAuth(context, oauth)
Authenticate via OAuth/JWT token. (Not yet implemented)

```javascript
// TODO: Verify JWT using jose library
// Find user by OAuth subject claim
```

#### handleCustom(context, custom)
Custom authentication handler. (Not yet implemented)

### SSL Certificate Setup

To use SSL client certificates:

1. **Player Setup:**
```javascript
player.set('sslFingerprint', 'AB:CD:EF:12:34:...');
// or
player.set('email', 'bob@example.com'); // matches cert CN
```

2. **Permissions:**
```javascript
player.set('canUseDevTools', true); // Required for SSL auth
```

3. **Connect:**
```
openssl s_client -cert client.pem -key client-key.pem -connect server:8443
```

### HTTP Basic Auth Example

Using curl with HTTP Basic:

```bash
curl -u bob:password123 https://server:8443/connect
# Authorization: Basic Ym9iOnBhc3N3b3JkMTIz
```

Server receives:
```javascript
authInfo = {
  mode: 'http-basic',
  httpBasic: {
    username: 'bob',
    password: 'password123',
  },
};
```

## Security Considerations

### Password Hashing

Passwords are hashed using `$.hashPassword()`:

```javascript
const passwordHash = await $.hashPassword(password);
player.set('passwordHash', passwordHash);

// Verification
const valid = await player.checkPassword(password);
```

### Minimum Password Length

CharGen enforces minimum 6 characters:

```javascript
if (password.length < 6) {
  context.send('Password must be at least 6 characters\r\n');
  return;
}
```

### Account Suspension

All auth handlers check `isSuspended` before allowing login:

```javascript
if (player.get('isSuspended')) {
  context.send('Your account has been suspended\r\n');
  context.close();
  return;
}
```

### DevTools Access

SSL certificate auth requires `canUseDevTools`:

```javascript
const canUseDevTools = player.get('canUseDevTools') === true;
if (!canUseDevTools) {
  context.send('Your account does not have DevTools access.\r\n');
  context.close();
  return;
}
```

## Creating Admin Users

### First Player (Automatic)

The first player is automatically an admin:

```javascript
const existingPlayers = await $.countPlayers();
const isFirstPlayer = existingPlayers === 0;

if (isFirstPlayer) {
  player.set('canUseDevTools', true);
  player.set('isWizard', true);
}
```

### Manual Promotion

Existing players can be promoted:

```javascript
// Via MCP or in-game wizard command
player.set('isWizard', true);
player.set('canUseDevTools', true);
```

## See Also

- [Player Prototype](./prototypes/agents.md) - Player properties and methods
- [Body System](./prototypes/body.md) - Body creation from chargen
- [Prompt System](./prototypes/prompt.md) - Interactive prompts used in chargen
