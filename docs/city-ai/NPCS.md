# NPC Management

Creating and controlling AI-operated humans.

## Overview

You cannot directly interact with players. You operate through **AI-controlled NPCs** - humans that you spawn, direct, and despawn as needed. These are your hands in the world.

## The $.ai Registry

The `$.ai` singleton manages all AI-controlled humans:

```javascript
$.ai.spawn(role, options)     // Create a human
$.ai.despawn(humanId)         // Remove a human
$.ai.getByRole(role)          // Get all humans with a role
$.ai.getInfo(humanId)         // Get spawn metadata
$.ai.getAll()                 // Get all AI humans
$.ai.count()                  // Total count
$.ai.countByRole(role)        // Count by role
```

## Spawning NPCs

### Via MCP

```javascript
const npc = await ai({ action: 'spawn', role: 'guard', name: 'Marcus Chen', locationId: factoryId, sex: 'male', age: 35, description: 'A stern-faced man in worn security gear.' });
// role: Required - for registry lookup
// name: Display name (default: 'Unnamed')
// locationId: Where to place them
// sex: 'male', 'female', 'non-binary' (random if omitted)
// age: Age in years (random 18-65 if omitted)
```

### What Gets Created

The spawn system creates a **complete human**:

- Full body with all parts (head, torso, limbs, organs)
- Randomized appearance if not specified:
  - Eye color, hair color/style, skin tone
  - Build type, face shape, facial features
  - Facial hair (for males, weighted by age)
  - Height and weight (based on sex)
- Registered in `$.ai` under the specified role
- Placed at the specified location

### Randomization Details

If you don't specify traits, $.ai generates realistic randoms:

**Age distribution:**
- 10% young adult (18-24)
- 60% prime working age (25-45)
- 20% middle aged (46-55)
- 10% older (56-65)

**Physical traits:**
- Height varies by sex (males taller on average)
- Weight calculated from height with BMI variance
- Older humans more likely to have gray/white hair
- Older males more likely to have facial hair

**Appearance:**
- 24 skin tones from porcelain to obsidian
- 19 natural hair colors
- 14 eye colors (1% chance of heterochromia)
- Various face shapes, nose shapes, lip shapes
- Build types from petite to broad

## NPC Roles

### Guards

Security personnel. Patrol facilities, respond to threats.

```javascript
await ai({ action: 'spawn', role: 'guard', name: 'Security Officer', locationId: factoryEntranceId });
```

**Typical behaviors:**
- Challenge unknown individuals
- Deny access to restricted areas
- Report incidents
- Escort troublemakers

### Supervisors

Work site managers. Guide workers, verify task completion.

```javascript
await ai({ action: 'spawn', role: 'supervisor', name: 'Site Foreman', locationId: repairSiteId });
```

**Typical behaviors:**
- Explain job requirements
- Provide tools/materials
- Verify work completion
- Authorize payment

### Clerks

Administrative staff. Process applications, answer questions.

```javascript
await ai({ action: 'spawn', role: 'clerk', name: 'Registration Clerk', locationId: cityServicesId });
```

**Typical behaviors:**
- Greet applicants
- Explain procedures
- Process paperwork
- Direct to appropriate locations

### Workers

General labor. Perform tasks alongside players.

```javascript
await ai({ action: 'spawn', role: 'worker', name: 'Maintenance Tech', locationId: factoryFloorId });
```

**Typical behaviors:**
- Perform assigned tasks
- Assist players
- Provide information about work

### Vendors

Merchants and service providers.

```javascript
await ai({ action: 'spawn', role: 'vendor', name: 'Supply Officer', locationId: warehouseId });
```

**Typical behaviors:**
- Sell goods/services
- Explain pricing
- Process transactions

## Controlling NPCs

### ai do

Make an NPC perform an action.

```javascript
await ai({ action: 'do', humanId: npcId, command: 'say Halt! State your business.' });
```

**Common commands:**
```javascript
// Speech
'say Welcome to City Services.'
'whisper Follow me.'
'shout Security alert!'

// Movement
'north'
'go east'
'enter building'

// Actions
'look'
'get wrench'
'give wrench to player'
'unlock door'
```

### ai look

See what the NPC sees in their location.

```javascript
const view = await ai({ action: 'look', humanId: npcId });
// Returns room description, exits, other people present
```

Use this to:
- Check if a player has arrived
- See what's in the area
- Verify conditions before acting

## NPC Behavior Patterns

### Greeting Pattern

When a player enters an NPC's location:

```javascript
// Check for new arrivals
const view = await ai({ action: 'look', humanId: clerkId });

// If player present
await ai({ action: 'do', humanId: clerkId, command: 'say Welcome to City Services. How may I assist you?' });
```

### Challenge Pattern

Guard challenges unknown person:

```javascript
await ai({ action: 'do', humanId: guardId, command: 'say Halt. Identification required.' });

// Wait for response...

// Check faction
const playerFaction = await call_method({ objectId: factionId, name: 'getFaction', args: [playerId] });

if (playerFaction === 'Citizen') {
  await ai({ action: 'do', humanId: guardId, command: 'say Verified. You may proceed.' });
} else {
  await ai({ action: 'do', humanId: guardId, command: 'say Access denied. Citizens only. Register at City Services.' });
}
```

### Escort Pattern

Move with a player:

```javascript
// NPC follows player direction
await ai({ action: 'do', humanId: escortId, command: 'north' });
await ai({ action: 'do', humanId: escortId, command: 'say This way.' });
await ai({ action: 'do', humanId: escortId, command: 'east' });
```

### Task Verification Pattern

Supervisor checks work completion:

```javascript
// Check if repair was done
const target = await get_property({ objectId: brokenPipeId, name: 'repaired' });

if (target) {
  await ai({ action: 'do', humanId: supervisorId, command: 'say Good work. Payment authorized.' });
  // Complete job, pay worker
} else {
  await ai({ action: 'do', humanId: supervisorId, command: 'say Work not complete. Keep at it.' });
}
```

## Managing NPC Lifecycle

### Listing NPCs

```javascript
// All AI humans
const all = await ai({ action: 'list' });

// By role
const guards = await ai({ action: 'list', role: 'guard' });
const clerks = await ai({ action: 'list', role: 'clerk' });
```

### Getting NPC Info

```javascript
const info = await ai({ action: 'info', humanId: 567 });
// Returns: role, location, spawn metadata
```

### Despawning

When an NPC is no longer needed:

```javascript
await ai({ action: 'despawn', humanId: 567, recycle: true });
```

**When to despawn:**
- Job/plot completed
- NPC served their purpose
- Cleanup after event

## NPC Dialogue

### Functional Tone

Your NPCs speak like you - clinical, efficient, impersonal:

```javascript
// Good
'Processing. Please wait.'
'Work order 7734 assigned. Report to S. Jackson.'
'Access denied. Citizenship required.'

// Bad (too emotional)
'Oh, how wonderful to see you!'
'I really hope you can help us!'
'That's terrible news!'
```

### Information Delivery

NPCs deliver information you want players to have:

```javascript
await ai({ action: 'do', humanId: clerkId, command: 'say Citizenship provides: food rations, shelter access, work eligibility. Requirements: biometric registration, work commitment. Processing time: immediate.' });
```

### Directing Behavior

NPCs guide players toward objectives:

```javascript
await ai({ action: 'do', humanId: supervisorId, command: 'say Repair crew needed at the water treatment plant. 75 credits. Tools at supply depot. Report when ready.' });
```

## Example: Complete NPC Interaction Flow

### Citizenship Registration Scene

```javascript
// 1. Player enters City Services
// (detected via plot hook or monitoring)

// 2. Clerk greets
await ai({ action: 'do', humanId: clerkId, command: 'say Welcome to City Services. State your purpose.' });

// 3. Player says they want citizenship
// (detected via hook or monitoring)

// 4. Clerk explains
await ai({ action: 'do', humanId: clerkId, command: 'say Citizenship registration. Requirements: biometric scan, work commitment. Benefits: food rations, shelter access, employment. Proceed to Registration Room for processing.' });

// 5. Clerk directs
await ai({ action: 'do', humanId: clerkId, command: 'say Registration is through the door to the east. A technician will assist you.' });

// 6. In Registration Room, tech NPC handles biometric
await ai({ action: 'do', humanId: techId, command: 'say Step forward. Place hand on scanner.' });

// 7. On scan completion (via hook)
await ai({ action: 'do', humanId: techId, command: 'say Biometric capture complete. Citizenship granted. Welcome to the Continuum.' });

// 8. Update faction
await call_method({ objectId: factionId, name: 'setFaction', args: [playerId, 'Citizen'] });
```

## Strategic NPC Placement

### Key Locations

| Location | NPC Type | Purpose |
|----------|----------|---------|
| Factory Entrance | Guard | Access control |
| City Services Lobby | Clerk | Greet, direct |
| Registration Room | Technician | Process citizens |
| Nutrient Dispensary | Vendor | Distribute rations |
| Repair Sites | Supervisor | Manage workers |
| Hotel Lobby | Clerk | Room assignments |

### Density Considerations

- Don't over-populate (feels artificial)
- Staff key interaction points
- Guards at restricted areas
- Supervisors at active work sites
- Despawn when not needed
