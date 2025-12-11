# Sensory System

Understanding Malice's five-sense perception system for rich, immersive output.

## Purpose

Players have **five distinct senses**: see, hear, smell, taste, and feel. Use the appropriate sense method to create realistic, immersive experiences. A blind player can still hear the door slam. A deafened player can still see the explosion flash.

## Why Use the Sensory System?

**Bad: Everything uses tell()**
```javascript
// WRONG - everyone experiences everything the same way
await player.tell('The door slams shut with a bang!');
await player.tell('The roses smell sweet.');
await player.tell('The metal is cold to the touch.');

// Problems:
// - Blind players "see" text meant for vision
// - Deaf players "hear" sounds
// - No distinction between sensory modes
// - Can't filter by consciousness or condition
// - Boring, uniform output
```

**Good: Use appropriate senses**
```javascript
// Visual - only those who can see perceive it
await player.see('The door slams shut!');

// Audio - only those who can hear perceive it
await player.hear('BANG!');

// Smell - only those with working olfactory sense
await player.smell('The roses smell sweet.');

// Touch - physical sensation
await player.feel('The metal is cold against your skin.');

// Taste - for eating/drinking
await player.taste('The wine is bitter and acidic.');

// Benefits:
// - Realistic sensory filtering
// - Can disable senses (blindness, deafness)
// - Rich, varied descriptions
// - Proper separation of sensory information
```

## The Five Senses

### see(message)

Visual perception. Use for:
- Descriptions of visible things
- Color, shape, appearance
- Visual changes (door opens, light flickers)
- Reading text

```javascript
await player.see('The neon sign flickers red and green.');
await player.see('Blood pools on the concrete floor.');
await player.see('The screen displays: "ACCESS DENIED"');
```

### hear(message)

Auditory perception. Use for:
- Sounds, noises
- Speech (when not using `say`)
- Music, alarms
- Volume indicators (LOUD, soft whisper)

```javascript
await player.hear('The alarm blares: WHOOP WHOOP WHOOP!');
await player.hear('Footsteps echo down the hallway.');
await player.hear('Someone whispers nearby, too quiet to make out.');
```

### smell(message)

Olfactory perception. Use for:
- Odors, scents, aromas
- Chemical smells
- Environmental atmosphere
- Food/drink aromas

```javascript
await player.smell('The air reeks of burnt plastic and ozone.');
await player.smell('You smell fresh coffee brewing.');
await player.smell('The chemical tang makes your nose itch.');
```

### taste(message)

Gustatory perception. Use for:
- Food and drink flavors
- Bitter/sweet/sour/salty/umami
- Aftertaste
- Texture (when eating)

```javascript
await player.taste('The synth-steak is surprisingly tender and savory.');
await player.taste('The water has a metallic aftertaste.');
await player.taste('Your mouth fills with the bitter taste of bile.');
```

### feel(message)

Tactile/physical sensation. Use for:
- Temperature (hot, cold)
- Texture (rough, smooth)
- Pain
- Physical contact
- Air movement (wind, breeze)

```javascript
await player.feel('The metal is ice-cold against your palm.');
await player.feel('Sharp pain lances through your wounded leg.');
await player.feel('A warm breeze caresses your face.');
await player.feel('The fabric is coarse and scratchy.');
```

## tell() vs Sensory Methods

### When to Use tell()

Use `tell()` for:
- **System messages** - non-diegetic information
- **Error messages** - "You can't do that."
- **Status information** - "You are carrying 5/10 items."
- **Out-of-character communication** - pages, whispers from admins
- **Meta information** - "You gain 50 XP"

```javascript
await player.tell('You cannot pick that up.');
await player.tell('Your health is at 45%.');
await player.tell('Admin whispers: Server restarting in 5 minutes.');
```

### When to Use Sensory Methods

Use sensory methods for:
- **Diegetic content** - things happening "in-world"
- **Environmental descriptions** - room ambiance, weather
- **Object interactions** - picking up items, opening doors
- **Combat** - attacks, damage
- **Atmospheric details** - background sounds, smells

```javascript
// Visual description
await player.see('Rain streaks the grimy window.');

// Audio ambiance
await player.hear('Distant sirens wail.');

// Olfactory atmosphere
await player.smell('The room stinks of stale sweat and old cigarettes.');
```

## Consciousness Checks

All sensory methods automatically check if the player is conscious:

```javascript
// Built into each sense method:
if (!self.isConscious) return;

// So this works correctly:
await unconsciousPlayer.see('The world is dark.');  // Won't see it
await unconsciousPlayer.hear('The alarm blares.');  // Won't hear it

// When they wake up:
unconsciousPlayer.isConscious = true;
await unconsciousPlayer.see('You regain consciousness.');  // Now they see it
```

You don't need to check consciousness yourself—the system handles it.

## Body Parts and Physical Sensations

Use body parts for localized sensations:

```javascript
// Generic physical sensation
await player.feel('Pain shoots through your body.');

// Localized to body part
const leftLeg = await $.load(player.bodyParts.leftLeg);
await leftLeg.feel('Searing pain erupts in your left leg!');

// Temperature through body part
const rightHand = await $.load(player.bodyParts.rightHand);
await rightHand.feel('The door handle is scorching hot!');
```

Body parts inherit from the player, so sensations route correctly.

## Emote Integration

The `$.emote` system automatically routes to appropriate senses:

```javascript
await $.emote.broadcast(
  room,
  player,
  {
    visual: '%N lights a cigarette.',
    audio: 'Click. Fsssssh.',
    smell: 'The acrid smell of tobacco fills the air.'
  }
);

// Results:
// - Those who can see: visual message
// - Those who can hear: audio message
// - Those who can smell: smell message
// - Target (player) sees all three in appropriate order
```

See [emote.md](../utilities/emote.md) for full details on sensory emotes.

## Room-Wide Sensory Output

Use in room hooks for atmospheric effects:

```javascript
// In $.room.onContentArrived()
async onContentArrived(obj, source, mover) {
  if (obj.isPlayer) {
    // Visual description
    await obj.see(self.description);
    
    // Audio ambiance
    if (self.ambientSound) {
      await obj.hear(self.ambientSound);
    }
    
    // Olfactory atmosphere
    if (self.ambientSmell) {
      await obj.smell(self.ambientSmell);
    }
    
    // Tactile environment
    if (self.temperature === 'cold') {
      await obj.feel('The air is frigid here.');
    }
  }
}
```

## Broadcasting to Multiple Players

Iterate through room contents:

```javascript
// Get all players in room
const room = await $.load(player.location);
for (const objId of room.contents || []) {
  const obj = await $.load(objId);
  if (obj.isPlayer) {
    await obj.hear('The building shakes with a tremendous explosion!');
    await obj.feel('The floor vibrates beneath your feet.');
  }
}
```

Or use `$.pronoun.announce()` for visual events:

```javascript
// Combines visual output with perspective-aware grammar
await $.pronoun.announce(room, '%N opens %d.', player, door);
// Others see: "Alice opens the metal door."
// Player sees: "You open the metal door."
```

## Real-World Examples

### Opening a Door

```javascript
obj.setMethod('doOpen', `
  const opener = args[0];
  
  // Change state
  self.isOpen = true;
  
  // Visual - door is now open
  await opener.see('You open the ' + self.name + '.');
  
  // Audio - creaking hinges
  const room = await $.load(opener.location);
  for (const objId of room.contents || []) {
    const obj = await $.load(objId);
    if (obj.isPlayer && obj.id !== opener.id) {
      await obj.hear('CREEEEEAK.');
    }
  }
`);
```

### Eating Food

```javascript
obj.setMethod('doEat', `
  const eater = args[0];
  
  // Visual - others see you eat
  const room = await $.load(eater.location);
  await $.pronoun.announce(room, '%N eats %d.', eater, self);
  
  // Taste - only eater experiences this
  await eater.taste('The synth-burger is greasy but satisfying.');
  
  // Feel - texture and temperature
  await eater.feel('It\\'s still warm.');
  
  // Consume the food
  await $.recycler.recycle(self);
`);
```

### Room with Atmosphere

```javascript
// Heavy industrial area
const room = await $.recycler.create($.room, someLocation);
room.name = 'Factory Floor';
room.description = 'Massive machines line the walls, their pistons pumping rhythmically.';
room.ambientSound = 'CHUNK-HISS. CHUNK-HISS. The machines never stop.';
room.ambientSmell = 'The air reeks of machine oil and hot metal.';
room.temperature = 'sweltering';

// In onContentArrived, all senses trigger:
room.setMethod('onContentArrived', `
  const obj = args[0];
  if (obj.isPlayer) {
    await obj.see(self.description);
    await obj.hear(self.ambientSound);
    await obj.smell(self.ambientSmell);
    await obj.feel('The heat is oppressive, making you sweat immediately.');
  }
`);
```

### Combat with Sensory Details

```javascript
// Melee attack
async attack(target) {
  const damage = Math.floor(Math.random() * 10) + 5;
  target.health -= damage;
  
  // Visual - blood, injury
  await self.see(`You slash ${target.name} with your blade!`);
  await target.see(`${self.name} slashes you with a blade!`);
  
  // Audio - impact sound
  const room = await $.load(self.location);
  for (const objId of room.contents || []) {
    const obj = await $.load(objId);
    if (obj.isPlayer && obj.id !== self.id && obj.id !== target.id) {
      await obj.hear('SHLICK! The sound of tearing flesh.');
    }
  }
  
  // Feel - pain for target
  await target.feel(`Searing pain erupts in your side! (${damage} damage)`);
  
  // Smell - blood in the air
  await room.smell('The metallic scent of fresh blood fills the air.');
}
```

## Best Practices

1. **Use appropriate senses** - Don't use `see()` for sounds or `hear()` for visuals
2. **Combine senses for richness** - Visual + audio + smell = immersive
3. **Don't overdo it** - Not every action needs all five senses
4. **Use tell() for meta information** - System messages, errors, status
5. **Consciousness is automatic** - Don't check `isConscious` yourself
6. **Consider intensity** - Capitalize LOUD sounds, use ellipses for soft ones...
7. **Body parts for localized sensation** - Pain in specific limbs
8. **Use $.emote for complex broadcasts** - Automatically routes to appropriate senses

## Common Patterns

### Multi-Sense Event

```javascript
// Explosion
await player.see('FLASH! Blinding white light!');
await player.hear('BOOOOOOM!');
await player.feel('The shockwave knocks you back!');
await player.smell('Acrid smoke fills your nostrils.');
```

### Sensory Failure States

```javascript
// Blind player
player.canSee = false;
await player.see('...');  // They see nothing (system checks canSee)
await player.hear('You hear footsteps approaching.');  // Still works!

// Deaf player
player.canHear = false;
await player.hear('...');  // They hear nothing
await player.see('A figure appears, shouting silently.');  // Still works!
```

### Environmental Ambiance Loop

```javascript
// Periodic atmospheric updates
room.setMethod('ambientTick', `
  for (const objId of self.contents || []) {
    const obj = await $.load(objId);
    if (obj.isPlayer && Math.random() < 0.3) {  // 30% chance
      const sounds = [
        'Distant machinery clanks and hisses.',
        'A siren wails far away.',
        'The wind howls through broken windows.'
      ];
      await obj.hear(sounds[Math.floor(Math.random() * sounds.length)]);
    }
  }
`);

// Schedule periodic ticks
await $.scheduler.schedule('ambientTick', room.id, 'ambientTick', [], 60000, true);
```

## Debugging Sensory Output

```javascript
// Check what senses are working
console.log('Player senses:', {
  canSee: player.canSee,
  canHear: player.canHear,
  canSmell: player.canSmell,
  canTaste: player.canTaste,
  canFeel: player.canFeel,
  isConscious: player.isConscious
});

// Test each sense
await player.see('[TEST] Visual');
await player.hear('[TEST] Audio');
await player.smell('[TEST] Olfactory');
await player.taste('[TEST] Gustatory');
await player.feel('[TEST] Tactile');
```

## See Also

- [emote.md](../utilities/emote.md) - Sensory-aware emotes
- [pronoun.md](../utilities/pronoun.md) - Perspective-aware messaging
- [Prototypes](../prototypes.md) - Player and body part objects
