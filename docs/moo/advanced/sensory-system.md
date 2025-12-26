# Sensory System

Understanding Malice's six-method sensory system for rich, immersive output.

## Purpose

Players have **six distinct sensory methods**: see, hear, smell, taste, feel, and think. Use the appropriate sense method to create realistic, immersive experiences. A blind player can still hear the door slam. A deafened player can still see the explosion flash.

**Key distinction:**
- **Sensory methods** (see, hear, smell, taste, feel, think) - Recorded in sensory history for AI context
- **tell()** - Meta/system messages only, NOT recorded in history

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

## The Six Sensory Methods

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

**Tactile/physical sensation** - NOT mental/emotional. Use for:
- Temperature (hot, cold)
- Texture (rough, smooth)
- Pain
- Physical contact
- Air movement (wind, breeze)
- Pressure, weight

**DO NOT use feel() for:**
- Emotions (use think() instead)
- Mental states (use think() instead)
- Internal thoughts (use think() instead)

```javascript
await player.feel('The metal is ice-cold against your palm.');
await player.feel('Sharp pain lances through your wounded leg.');
await player.feel('A warm breeze caresses your face.');
await player.feel('The fabric is coarse and scratchy.');
```

### think(message)

**Internal voice and mental perception** - The narrator speaking to the player. Use for:
- Internal monologue
- Emotional states
- Mental realizations
- Memories surfacing
- Intuition and hunches
- The AI narrator's voice in their head

**This is the narrator's voice** - not the player's own thoughts, but what the AI narrator is telling them about their internal state.

```javascript
await player.think('Something feels wrong about this place.');
await player.think('A memory surfaces: your father once warned you about the underground.');
await player.think('Fear grips you. This could go very wrong.');
await player.think('You realize the guard is lying.');
await player.think('Rage builds inside you, hot and consuming.');
```

**Key distinction:**
- `feel()` = Physical sensations (pain, temperature, touch)
- `think()` = Mental/emotional voice (narrator's internal commentary)

## tell() vs Sensory Methods

### Critical Difference: History Recording

**Sensory methods are recorded** in the player's sensory history buffer. This history is:
- Used by the AI narrator for context
- Provides memory of recent events
- Enables coherent narration that references what just happened
- Limited to recent messages (buffer size configurable)

**tell() is NOT recorded** - it's purely meta/system communication.

### When to Use tell()

Use `tell()` for:
- **System messages** - non-diegetic information
- **Error messages** - "You can't do that."
- **Status information** - "You are carrying 5/10 items."
- **Out-of-character communication** - pages, whispers from admins
- **Meta information** - "You gain 50 XP"
- **UI feedback** - command confirmations, help text

```javascript
await player.tell('You cannot pick that up.');
await player.tell('Your health is at 45%.');
await player.tell('Admin whispers: Server restarting in 5 minutes.');
await player.tell('Type "help" for a list of commands.');
```

**Why tell() isn't recorded:** Meta information would pollute the AI's context with non-diegetic noise.

### When to Use Sensory Methods

Use sensory methods for:
- **Diegetic content** - things happening "in-world"
- **Environmental descriptions** - room ambiance, weather
- **Object interactions** - picking up items, opening doors
- **Combat** - attacks, damage
- **Atmospheric details** - background sounds, smells
- **Internal narration** - emotional states, realizations (think)

```javascript
// Visual description (recorded)
await player.see('Rain streaks the grimy window.');

// Audio ambiance (recorded)
await player.hear('Distant sirens wail.');

// Olfactory atmosphere (recorded)
await player.smell('The room stinks of stale sweat and old cigarettes.');

// Internal voice (recorded)
await player.think('This place gives you the creeps.');
```

**Why sensory methods are recorded:** The AI narrator needs context about what the player has experienced to narrate coherently.

## Sensory History and Context

Each sensory method (except `tell()`) records messages in the player's sensory history buffer:

```javascript
// All these are recorded for AI context:
await player.see('The door creaks open.');
await player.hear('Footsteps approach.');
await player.think('Danger. You should run.');

// When the AI narrator responds to a command, it sees:
// - The last N sensory messages
// - What the player has recently experienced
// - Environmental context for coherent narration

// tell() is NOT recorded:
await player.tell('Type "help" for commands.');  // Not in history
```

**Why this matters:**
- The AI narrator needs context about what just happened
- "You see a guard" followed by "attack guard" - the narrator knows which guard
- Recent sensory input informs narrative responses
- Creates continuity between actions

**Buffer management:**
- Limited size (configurable, typically 50-100 messages)
- Oldest messages drop off as new ones arrive
- Each sense type can have separate buffers (implementation detail)

## Consciousness Checks

All sensory methods automatically check if the player is conscious:

```javascript
// Built into each sense method:
if (!self.isConscious) return;

// So this works correctly:
await unconsciousPlayer.see('The world is dark.');  // Won't see it
await unconsciousPlayer.hear('The alarm blares.');  // Won't hear it
await unconsciousPlayer.think('...');  // Won't think it

// When they wake up:
unconsciousPlayer.isConscious = true;
await unconsciousPlayer.see('You regain consciousness.');  // Now they see it
await unconsciousPlayer.think('Your head throbs with pain.');  // Now they think it
```

You don't need to check consciousness yourself—the system handles it.

## Body Parts and Physical Sensations

Use body parts for localized physical sensations (use `think()` for emotional/mental responses):

```javascript
// Generic physical sensation
await player.feel('Pain shoots through your body.');

// Localized to body part
const leftLeg = await $load(player.bodyParts.leftLeg);
await leftLeg.feel('Searing pain erupts in your left leg!');

// Mental response to physical pain
await player.think('You can barely stand. The pain is overwhelming.');

// Temperature through body part
const rightHand = await $load(player.bodyParts.rightHand);
await rightHand.feel('The door handle is scorching hot!');

// Mental reaction to temperature
await player.think('You jerk your hand back instinctively.');
```

Body parts inherit from the player, so sensations route correctly. Combine physical `feel()` with mental `think()` for richer experiences.

## Emote Integration

The `$emote` system automatically routes to appropriate senses:

```javascript
await $emote.broadcast(
  room,
  player,
  {
    visual: '%N lights a cigarette.',
    audio: 'Click. Fsssssh.',
    smell: 'The acrid smell of tobacco fills the air.',
    mental: 'You need this. The stress is getting to you.'  // think() for player only
  }
);

// Results:
// - Those who can see: visual message
// - Those who can hear: audio message
// - Those who can smell: smell message
// - Target (player) also gets mental message via think()
```

**Note:** The `mental` field in emotes is delivered to the target via `think()` - it's the narrator's internal voice for that character only.

See [emote.md](../utilities/emote.md) for full details on sensory emotes.

## Room-Wide Sensory Output

Use in room hooks for atmospheric effects:

```javascript
// In $room.onContentArrived()
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

    // Mental impression (narrator's voice)
    if (self.atmosphere === 'ominous') {
      await obj.think('Something feels wrong about this place.');
    }
  }
}
```

## Broadcasting to Multiple Players

Iterate through room contents:

```javascript
// Get all players in room
const room = await $load(player.location);
for (const objId of room.contents || []) {
  const obj = await $load(objId);
  if (obj.isPlayer) {
    await obj.hear('The building shakes with a tremendous explosion!');
    await obj.feel('The floor vibrates beneath your feet.');
    await obj.think('That sounded close. Too close.');
  }
}
```

Or use `$pronoun.announce()` for visual events:

```javascript
// Combines visual output with perspective-aware grammar
await $pronoun.announce(room, '%N opens %d.', player, door);
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
  const room = await $load(opener.location);
  for (const objId of room.contents || []) {
    const obj = await $load(objId);
    if (obj.isPlayer && obj.id !== opener.id) {
      await obj.hear('CREEEEEAK.');
    }
  }

  // Mental - if it's a locked door they just opened
  if (self.wasLocked) {
    await opener.think('Finally. That took longer than expected.');
  }
`);
```

### Eating Food

```javascript
obj.setMethod('doEat', `
  const eater = args[0];

  // Visual - others see you eat
  const room = await $load(eater.location);
  await $pronoun.announce(room, '%N eats %d.', eater, self);

  // Taste - only eater experiences this
  await eater.taste('The synth-burger is greasy but satisfying.');

  // Feel - texture and temperature
  await eater.feel('It\\'s still warm.');

  // Mental - internal reaction (narrator's voice)
  if (eater.hunger > 80) {
    await eater.think('You were starving. This helps, even if it tastes like cardboard.');
  } else {
    await eater.think('Not the worst meal you\\'ve had, but close.');
  }

  // Consume the food
  await $recycler.recycle(self);
`);
```

### Room with Atmosphere

```javascript
// Heavy industrial area
const room = await $recycler.create($room, someLocation);
room.name = 'Factory Floor';
room.description = 'Massive machines line the walls, their pistons pumping rhythmically.';
room.ambientSound = 'CHUNK-HISS. CHUNK-HISS. The machines never stop.';
room.ambientSmell = 'The air reeks of machine oil and hot metal.';
room.temperature = 'sweltering';
room.atmosphere = 'oppressive';

// In onContentArrived, all senses trigger:
room.setMethod('onContentArrived', `
  const obj = args[0];
  if (obj.isPlayer) {
    await obj.see(self.description);
    await obj.hear(self.ambientSound);
    await obj.smell(self.ambientSmell);
    await obj.feel('The heat is oppressive, making you sweat immediately.');
    await obj.think('This place is brutal. How do people work here?');
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
  const room = await $load(self.location);
  for (const objId of room.contents || []) {
    const obj = await $load(objId);
    if (obj.isPlayer && obj.id !== self.id && obj.id !== target.id) {
      await obj.hear('SHLICK! The sound of tearing flesh.');
      await obj.think('That could have been you.');
    }
  }

  // Feel - pain for target (physical sensation)
  await target.feel(`Searing pain erupts in your side! (${damage} damage)`);

  // Think - mental response to injury
  if (target.health < 20) {
    await target.think('You\\'re dying. This is it.');
  } else if (target.health < 50) {
    await target.think('You can\\'t take much more of this.');
  } else {
    await target.think('That hurt, but you can still fight.');
  }

  // Mental state for attacker
  await self.think('Blood. Just like last time. You can\\'t stop now.');

  // Smell - blood in the air (everyone in room)
  for (const objId of room.contents || []) {
    const obj = await $load(objId);
    if (obj.isPlayer) {
      await obj.smell('The metallic scent of fresh blood fills the air.');
    }
  }
}
```

## The Narrator's Voice

The `think()` method represents **the narrator speaking to the player** - not the player's own thoughts, but the AI's internal commentary on their mental/emotional state.

```javascript
// The narrator tells them what they're feeling:
await player.think('Fear grips you. This could go very wrong.');

// Not the player thinking to themselves, but the narrator describing their state:
await player.think('A memory surfaces: your father once warned you about this place.');

// The narrator's voice in their head:
await player.think('You realize the guard is lying. His eyes betray him.');
```

This creates the illusion of internal monologue while actually being the AI narrator's voice. It's recorded in sensory history so the AI can maintain continuity in its narrative voice.

## Best Practices

1. **Use appropriate senses** - Don't use `see()` for sounds or `hear()` for visuals
2. **feel() is physical only** - Use `think()` for emotions and mental states
3. **think() is the narrator's voice** - Internal commentary about emotional/mental state
4. **Combine senses for richness** - Visual + audio + smell + internal voice = immersive
5. **Don't overdo it** - Not every action needs all six methods
6. **Use tell() for meta information** - System messages, errors, status (NOT recorded)
7. **Sensory methods are recorded** - They provide context for the AI narrator
8. **Consciousness is automatic** - Don't check `isConscious` yourself
9. **Consider intensity** - Capitalize LOUD sounds, use ellipses for soft ones...
10. **Body parts for localized sensation** - Pain in specific limbs
11. **Use $emote for complex broadcasts** - Automatically routes to appropriate senses

## Common Patterns

### Multi-Sense Event

```javascript
// Explosion
await player.see('FLASH! Blinding white light!');
await player.hear('BOOOOOOM!');
await player.feel('The shockwave knocks you back!');
await player.smell('Acrid smoke fills your nostrils.');
await player.think('That was too close. You could have died.');
```

### Sensory Failure States

```javascript
// Blind player
player.canSee = false;
await player.see('...');  // They see nothing (system checks canSee)
await player.hear('You hear footsteps approaching.');  // Still works!
await player.think('Blind and vulnerable. Not good.');  // Still works!

// Deaf player
player.canHear = false;
await player.hear('...');  // They hear nothing
await player.see('A figure appears, shouting silently.');  // Still works!

// Unconscious player - ALL senses fail
player.isConscious = false;
await player.see('...');  // Nothing
await player.hear('...');  // Nothing
await player.think('...');  // Nothing - not even internal voice
```

### Environmental Ambiance Loop

```javascript
// Periodic atmospheric updates
room.setMethod('ambientTick', `
  for (const objId of self.contents || []) {
    const obj = await $load(objId);
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
await $scheduler.schedule('ambientTick', room.id, 'ambientTick', [], 60000, true);
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
await player.feel('[TEST] Tactile (physical)');
await player.think('[TEST] Mental/internal voice');

// Meta message (not recorded)
await player.tell('[TEST] Meta/system message (not in history)');
```

## Summary: All Six Methods

| Method | Purpose | Recorded? | Requires Consciousness? |
|--------|---------|-----------|------------------------|
| `see()` | Visual perception | Yes | Yes |
| `hear()` | Auditory perception | Yes | Yes |
| `smell()` | Olfactory perception | Yes | Yes |
| `taste()` | Gustatory perception | Yes | Yes |
| `feel()` | Physical/tactile sensation | Yes | Yes |
| `think()` | Mental/emotional narrator voice | Yes | Yes |
| `tell()` | Meta/system messages | **NO** | No |

**Key takeaways:**
- Six sensory methods are recorded for AI context
- `tell()` is meta-only and not recorded
- `feel()` is physical, `think()` is mental
- `think()` is the narrator's voice in the player's head
- All sensory methods check consciousness automatically

## See Also

- [emote.md](../utilities/emote.md) - Sensory-aware emotes
- [pronoun.md](../utilities/pronoun.md) - Perspective-aware messaging
- [Prototypes](../prototypes.md) - Player and body part objects
