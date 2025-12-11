# $.prompt - Interactive Prompts

Use `$.prompt` for gathering input from players. All prompts return Promises that resolve when the player responds.

## Purpose

Provides interactive player input handling: text questions, yes/no, multiple choice menus, and multiline input. Handles validation, retries, cancellation, and prevents nested prompts.

## Why Use This?

**Bad: Manual input handling nightmare**
```javascript
async function getPlayerChoice(player, options) {
  await player.tell('Choose an option:');
  for (let i = 0; i < options.length; i++) {
    await player.tell((i + 1) + '. ' + options[i]);
  }
  
  player.pendingInput = true;
  player.inputCallback = (input) => {
    player.pendingInput = false;
    const num = parseInt(input, 10);
    if (isNaN(num) || num < 1 || num > options.length) {
      player.tell('Invalid choice.');
      return getPlayerChoice(player, options); // Retry - stack overflow risk!
    }
    return options[num - 1];
  };
  // What about:
  // - Disconnects during prompt?
  // - Nested prompts?
  // - @abort cancellation?
  // - Timeout?
  // ... 50 more lines of edge cases
}
```

**Good: Robust prompt system**
```javascript
const choice = await $.prompt.choice(player, 'Choose:', {
  opt1: 'Option 1',
  opt2: 'Option 2'
});
// Handles everything: display, validation, retry, abort, disconnects
```

## What $.prompt Handles

- ✅ Display formatting (numbered lists, columns)
- ✅ Input validation and retry loops
- ✅ Nested prompt prevention (queues if busy)
- ✅ @abort cancellation support
- ✅ Disconnect cleanup (resolves with null)
- ✅ Timeout support (optional)

## API Reference

### question() - Text Input

```javascript
await $.prompt.question(player, prompt, validator?)
```

Asks a question and returns the answer.

| Parameter | Type | Description |
|-----------|------|-------------|
| `player` | RuntimeObject | Player to prompt |
| `prompt` | string | Question text |
| `validator` | function | (input) => null or error string (optional) |

**Returns:** String (player's answer) or null (if @abort or disconnect)

**Examples:**
```javascript
// Simple text question
const name = await $.prompt.question(player, 'What is your name? ');
await player.tell('Hello, ' + name + '!');

// With validation
const age = await $.prompt.question(player, 'Enter your age: ', (input) => {
  const num = parseInt(input, 10);
  if (isNaN(num) || num < 1 || num > 150) {
    return 'Please enter a valid age (1-150).';
  }
  return null; // null = valid
});

// Validator returns error message or null
const email = await $.prompt.question(player, 'Email: ', (input) => {
  if (!input.includes('@')) return 'Invalid email address.';
  return null;
});
```

### yesorno() - Yes/No Question

```javascript
await $.prompt.yesorno(player, prompt)
```

Asks a yes/no question.

**Returns:** `true` (yes) or `false` (no)

**Accepts:** yes, y, no, n (case insensitive)

**Examples:**
```javascript
const confirmed = await $.prompt.yesorno(player, 'Are you sure?');
if (confirmed) {
  await player.tell('Proceeding...');
} else {
  await player.tell('Cancelled.');
}

// In a method
async deleteItem(player, item) {
  const confirm = await $.prompt.yesorno(
    player,
    `Really delete ${item.name}? This cannot be undone.`
  );
  
  if (confirm) {
    await $.recycler.recycle(item);
    await player.tell('Item deleted.');
  }
}
```

### choice() - Simple Choice Menu

```javascript
await $.prompt.choice(player, prompt, choices)
```

Presents numbered choices and returns the selected key.

| Parameter | Type | Description |
|-----------|------|-------------|
| `player` | RuntimeObject | Player to prompt |
| `prompt` | string | Header text |
| `choices` | object | { key: 'description', ... } |

**Returns:** String (selected key) or null (if @abort)

**Examples:**
```javascript
const choice = await $.prompt.choice(player, 'Pick a class:', {
  warrior: 'Warrior - Strong melee fighter',
  mage: 'Mage - Powerful spellcaster',
  rogue: 'Rogue - Stealthy assassin',
});

await player.tell('You chose: ' + choice); // 'warrior', 'mage', or 'rogue'

// Use the result
if (choice === 'warrior') {
  player.strength = 18;
  player.intelligence = 10;
} else if (choice === 'mage') {
  player.strength = 10;
  player.intelligence = 18;
}
```

### menu() - Columnar Menu

```javascript
await $.prompt.menu(player, prompt, choices, columns?)
```

Presents choices in columns (better for many options).

**Accepts:** number, key name, or partial match

**Examples:**
```javascript
const race = await $.prompt.menu(player, 'Choose your race:', {
  human: 'Human',
  elf: 'Elf',
  dwarf: 'Dwarf',
  orc: 'Orc',
  halfling: 'Halfling',
  gnome: 'Gnome',
}, 2); // 2 columns

// Player can type:
// - Number: "3" (dwarf)
// - Full key: "dwarf"
// - Partial: "dw" (dwarf)
```

### multiline() - Multi-Line Input

```javascript
await $.prompt.multiline(player, prompt)
```

Collects multiple lines of text (ends with '.' on its own line).

**Returns:** String (all lines joined with \n)

**Player types `@abort` to cancel**

**Examples:**
```javascript
const description = await $.prompt.multiline(
  player,
  'Enter your character description (end with . on its own line):'
);

if (description === null) {
  await player.tell('Cancelled.');
  return;
}

player.description = description;
await player.tell('Description set!');

// Usage in editor
async editDescription(player, obj) {
  await player.tell('Current description:');
  await player.tell(obj.description);
  await player.tell('');
  
  const newDesc = await $.prompt.multiline(
    player,
    'Enter new description (. to finish, @abort to cancel):'
  );
  
  if (newDesc !== null) {
    obj.description = newDesc;
    await player.tell('Description updated.');
  }
}
```

### isActive() - Check Prompt State

```javascript
await $.prompt.isActive(player)
```

Returns `true` if player is currently in a prompt.

**Examples:**
```javascript
if (await $.prompt.isActive(player)) {
  await player.tell('Please answer the current question first.');
  return;
}

// Before starting another prompt
async startChargen(player) {
  if (await $.prompt.isActive(player)) {
    return 'You are already in a prompt.';
  }
  
  // Safe to start new prompt sequence
  await this.runChargen(player);
}
```

### cancel() - Cancel Prompt

```javascript
await $.prompt.cancel(player)
```

Cancels current prompt (resolves with null).

**Examples:**
```javascript
// Admin command to break stuck prompts
async cancelPrompt(admin, targetPlayer) {
  if (await $.prompt.isActive(targetPlayer)) {
    await $.prompt.cancel(targetPlayer);
    await admin.tell('Prompt cancelled for ' + targetPlayer.name);
  } else {
    await admin.tell('Player is not in a prompt.');
  }
}
```

## Real-World Examples

### Character Creation

```javascript
async createCharacter(player) {
  await player.tell('=== Character Creation ===');
  
  // Get name
  const name = await $.prompt.question(player, 'Character name: ', (input) => {
    if (input.length < 3) return 'Name must be at least 3 characters.';
    if (input.length > 20) return 'Name must be 20 characters or less.';
    if (!/^[a-zA-Z]+$/.test(input)) return 'Name must contain only letters.';
    return null;
  });
  
  if (!name) return; // Aborted
  
  // Choose race
  const race = await $.prompt.menu(player, 'Choose your race:', {
    human: 'Human - Versatile and adaptable',
    elf: 'Elf - Graceful and long-lived',
    dwarf: 'Dwarf - Hardy and strong',
    orc: 'Orc - Powerful and fierce',
  }, 2);
  
  if (!race) return;
  
  // Choose class
  const charClass = await $.prompt.choice(player, 'Choose your class:', {
    warrior: 'Warrior - Master of melee combat',
    mage: 'Mage - Wielder of arcane magic',
    rogue: 'Rogue - Stealthy and cunning',
    cleric: 'Cleric - Healer and divine caster',
  });
  
  if (!charClass) return;
  
  // Confirm
  const confirm = await $.prompt.yesorno(
    player,
    `Create ${name} the ${race} ${charClass}?`
  );
  
  if (confirm) {
    await this.finalizeCharacter(player, name, race, charClass);
  }
}
```

### Room Editor

```javascript
async editRoom(builder, room) {
  while (true) {
    const action = await $.prompt.choice(builder, 'Edit room:', {
      name: 'Edit name',
      desc: 'Edit description',
      exits: 'Edit exits',
      done: 'Finish editing',
    });
    
    if (action === 'done' || action === null) break;
    
    switch (action) {
      case 'name':
        const name = await $.prompt.question(builder, 'New name: ');
        if (name) room.name = name;
        break;
        
      case 'desc':
        const desc = await $.prompt.multiline(builder, 'New description:');
        if (desc) room.description = desc;
        break;
        
      case 'exits':
        await this.editExits(builder, room);
        break;
    }
  }
}
```

### Confirmation Prompt

```javascript
async dangerousAction(player, target) {
  const confirm = await $.prompt.yesorno(
    player,
    `⚠️  WARNING: This will permanently delete ${target.name}. Continue?`
  );
  
  if (!confirm) {
    return 'Action cancelled.';
  }
  
  const doubleCheck = await $.prompt.question(
    player,
    `Type "${target.name}" to confirm: `,
    (input) => {
      if (input !== target.name) return 'Name does not match.';
      return null;
    }
  );
  
  if (!doubleCheck) {
    return 'Action cancelled.';
  }
  
  await $.recycler.recycle(target);
  return 'Deleted.';
}
```

### Wizard Interview

```javascript
async interviewWizard(player) {
  const answers = {};
  
  answers.experience = await $.prompt.question(
    player,
    'Years of MUD admin experience: ',
    (input) => {
      const num = parseInt(input, 10);
      if (isNaN(num) || num < 0) return 'Please enter a number.';
      return null;
    }
  );
  
  answers.reason = await $.prompt.multiline(
    player,
    'Why do you want to be a wizard?'
  );
  
  answers.availability = await $.prompt.choice(player, 'Availability:', {
    full: 'Full-time (20+ hours/week)',
    part: 'Part-time (10-20 hours/week)',
    casual: 'Casual (< 10 hours/week)',
  });
  
  answers.skills = await $.prompt.menu(player, 'Primary skills:', {
    building: 'World building',
    coding: 'MOO programming',
    plot: 'Plot/RP management',
    players: 'Player support',
  }, 2);
  
  // Submit application
  await this.submitApplication(player, answers);
}
```

## Tips & Best Practices

1. **Check for null** - Player can always @abort or disconnect
2. **Validate input** - Use validator function for question()
3. **Check isActive()** - Before starting new prompts
4. **Use yesorno() for confirms** - Clearer than yes/no choice
5. **Provide clear prompts** - Tell user what format you expect
6. **Handle cancellation gracefully** - Don't assume completion
7. **Use multiline for long text** - Descriptions, messages, etc.

## Common Patterns

### Input with Validation

```javascript
const value = await $.prompt.question(player, 'Enter value: ', (input) => {
  if (/* invalid */) return 'Error message';
  return null;
});
```

### Sequential Prompts

```javascript
const name = await $.prompt.question(player, 'Name: ');
if (!name) return;

const age = await $.prompt.question(player, 'Age: ');
if (!age) return;

// Continue...
```

### Confirmation Pattern

```javascript
const confirm = await $.prompt.yesorno(player, 'Are you sure?');
if (!confirm) return 'Cancelled.';

// Proceed with action
```

### Menu Loop

```javascript
while (true) {
  const choice = await $.prompt.choice(player, 'Menu:', choices);
  if (!choice || choice === 'quit') break;
  
  await this.handleChoice(choice);
}
```

## See Also

- [$.format](./format.md) - Format prompt text
- [$.english](./english.md) - Grammar for prompts
- [Best Practices](../best-practices.md) - User interaction patterns
