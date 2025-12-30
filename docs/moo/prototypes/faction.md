# Faction System

> **Abilities-First**: Factions use abilities to describe membership, reputation, and access rights. See `docs/ABILITIES-FIRST.md`.

Organizations with isolated network infrastructure in Malice.

## Overview

The faction system consists of:
- **$faction** - Prototype for faction instances (creatable)
- **$factionManager** - Singleton for creation, destruction, memberships, relationships
- **$transports** - Registry for transport bundles (internal)

Each faction has its own:
- Web domain (e.g., `thecontinuum.city`, `graycartel.com`)
- Transport bundle (HTTP, WebSocket, Session MCP)
- Character generation flow
- Email branding

## Default Factions

| Alias | Name | Domain | Index |
|-------|------|--------|-------|
| `$continuum` | The Continuum | thecontinuum.city | 0 |
| `$cartel` | Gray Cartel | graycartel.com | 1 |

## $faction - Faction Prototype

**Type:** Prototype (inherits from $describable)

### Properties

```javascript
{
  name: 'Faction Name',
  description: 'Faction description',
  domain: 'faction.domain.com',     // Web domain
  charGen: objref,                   // Character generation handler
  leader: objref,                    // Faction leader entity
  sshHostKey: null,                  // Per-faction SSH key (auto-generated)
  ports: { http, ws, sessionMcp },   // Allocated ports
  index: 0,                          // Port allocation index
  discordWebhook: null,              // Discord webhook for notifications
}
```

### Key Methods

#### describe()
Get a description of the faction including member count.

```javascript
const desc = await faction.describe();
// "The Continuum - The governing authority\nLeader: Admin\nMembers: 42\nDomain: thecontinuum.city"
```

#### getPortInfo()
Get port allocation for this faction.

```javascript
const ports = await faction.getPortInfo();
// { http: 8000, ws: 8080, sessionMcp: 3012 }
```

#### isOnline()
Check if faction's transports are running.

```javascript
const online = await faction.isOnline();
// true/false
```

#### onPlayerRegistered(player)
Called when a new player registers with this faction. Override for custom branding.

```javascript
// Base implementation sends:
// 1. Verification email via $email
// 2. Discord notification via $http (if discordWebhook set)

// Each faction instance overrides with branded HTML
await faction.onPlayerRegistered(newPlayer);
```

## $factionManager - Faction Manager

**Type:** Singleton (inherits from $root)

### Creating Factions

```javascript
const faction = await $factionManager.create({
  name: 'Shadow Syndicate',
  domain: 'shadowsyndicate.net',
  description: 'A mysterious organization',
  charGen: $charGen,
});

// Transports automatically started
console.log(faction.ports);
// { http: 8002, ws: 8082, sessionMcp: 3014 }
```

### Destroying Factions

```javascript
await $factionManager.destroy(faction, {
  gracefulTimeoutMs: 5000,
  message: 'Faction shutting down...'
});
```

### Memberships

```javascript
// Assign entity to faction
await $factionManager.setMembership(player, $cartel);

// Get entity's faction
const faction = await $factionManager.getMembership(player);

// Get all members
const members = await $factionManager.getMembers($continuum);
```

### Relationships

```javascript
// Set relationship
await $factionManager.setRelationship($continuum, $cartel, 'hostile');
// Types: 'friendly', 'hostile', 'neutral'

// Check relationships
const rel = await $factionManager.getRelationship($continuum, $cartel);
const friendly = await $factionManager.isFriendly(entityA, entityB);
const hostile = await $factionManager.isHostile(entityA, entityB);
```

### Querying

```javascript
// List all factions
const factions = await $factionManager.list();

// Get by domain
const cartel = await $factionManager.getByDomain('graycartel.com');

// Get by ID
const faction = await $factionManager.getById(factionId);
```

## Email Verification Flow

Registration requires email verification:

```
1. POST /register { username, email, password }
   → Creates player with emailVerified=false, verificationToken
   → Calls faction.onPlayerRegistered(player)

2. faction.onPlayerRegistered(player):
   → Sends verification email via $email
   → Sends Discord notification via $http (optional)

3. GET /verify?t=token
   → Sets emailVerified=true
   → Clears verificationToken
   → Redirects to /play?verified=1

4. POST /api/auth { username, password }
   → Checks emailVerified === true
   → Returns 403 if not verified
   → Returns one-time token if verified
```

### Player Properties

```javascript
{
  email: 'user@example.com',
  emailVerified: false,
  verificationToken: 'abc123...',  // 64-char hex string
  factionId: 123,
}
```

## Discord Integration

Set `discordWebhook` on faction to receive registration notifications:

```javascript
$continuum.discordWebhook = 'https://discord.com/api/webhooks/...';

// Registration creates Discord embed:
// Title: "🎫 New Continuum Citizen Application"
// Fields: Username, Email
// Color: #0066cc (Continuum blue)
```

## $guardedExit - Faction-Restricted Passage

**Inherits from:** $exit

An exit that only allows passage for members of a specific faction.

### Properties

```javascript
{
  allowedFaction: 'Citizen',  // Faction that can use this exit
  denyMessage: 'Citizens only.'
}
```

### Key Methods

#### canUse(agent)
Checks faction membership before allowing passage.

```javascript
const result = await guardedExit.canUse(player);
// { allowed: true } or { allowed: false, reason: 'Citizens only.' }
```

### Building Definition

```javascript
exits: {
  north: {
    to: 'waterfront/y10.ts',
    prototype: 'guardedExit',
    allowedFaction: 'Citizen',
    denyMessage: 'The door scanner flashes red. "Citizens only."',
  },
}
```

## Use Cases

### 1. Restricted Areas
Faction members only can enter certain buildings.

### 2. NPC Behavior
NPCs check faction relationships for hostility:
```javascript
if (await $factionManager.isHostile(npc, player)) {
  await npc.attack(player);
}
```

### 3. Quest Eligibility
```javascript
const faction = await $factionManager.getMembership(player);
if (faction?.id !== $continuum.id) {
  return 'You must be a Continuum citizen.';
}
```

### 4. Pricing/Services
```javascript
const faction = await $factionManager.getMembership(player);
const price = faction?.id === $continuum.id ? 2 : 5;
```

## See Also

- [Security System](./security.md) - Locks and access control
- [Room System](./rooms.md) - Exits and navigation
- [Agents](./agents.md) - Players and NPCs
