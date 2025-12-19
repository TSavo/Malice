# Prompt System Reference

The prompt system handles interactive player input including questions, menus, yes/no confirmations, and multiline text input.

## Overview

When you need to get input from a player during method execution, use `$prompt`. It suspends the method until the player responds, then returns their input.

```javascript
// Ask a question and wait for answer
const name = await $prompt.question(player, "What is your name? ");
await player.tell("Hello, " + name + "!");
```

## Prompt Types

### question - Text Input

Ask for free-form text input.

```javascript
const answer = await $prompt.question(player, "Enter your password: ");

// With validation
const answer = await $prompt.question(player, "Enter a number: ", (input) => {
  const num = parseInt(input);
  if (isNaN(num)) return "Please enter a valid number.";
  if (num < 0) return "Number must be positive.";
  return null;  // Valid
});
```

**Parameters:**
- `player` - The player to prompt
- `text` - The prompt text to display
- `validator` - Optional function that returns error string or null

**Returns:** The player's trimmed input string

### choice - Multiple Choice

Present numbered options and return the selected key.

```javascript
const result = await $prompt.choice(player, "Choose your class:", {
  warrior: "Warrior - Strong melee fighter",
  mage: "Mage - Powerful spellcaster",
  rogue: "Rogue - Stealthy assassin",
  healer: "Healer - Support and restoration",
});

// result = 'warrior', 'mage', 'rogue', or 'healer'
await player.tell("You chose: " + result);
```

**Display:**
```
Choose your class:
  1) Warrior - Strong melee fighter
  2) Mage - Powerful spellcaster
  3) Rogue - Stealthy assassin
  4) Healer - Support and restoration
Enter choice: _
```

**Parameters:**
- `player` - The player to prompt
- `text` - The header text
- `options` - Object with `{ key: 'Display label', ... }`

**Returns:** The selected option key (not the number)

### yesorno - Yes/No Confirmation

Ask a yes/no question.

```javascript
const confirmed = await $prompt.yesorno(player, "Delete all items?");
if (confirmed) {
  // Delete items
  await player.tell("Items deleted.");
} else {
  await player.tell("Cancelled.");
}
```

**Display:**
```
Delete all items? (yes/no): _
```

**Accepts:** `yes`, `y`, `no`, `n` (case-insensitive)

**Parameters:**
- `player` - The player to prompt
- `text` - The question text

**Returns:** `true` for yes, `false` for no

### menu - Columnar Menu

Present options in a multi-column layout.

```javascript
const direction = await $prompt.menu(player, "Where do you want to go?", {
  north: "Go North",
  south: "Go South",
  east: "Go East",
  west: "Go West",
  up: "Go Up",
  down: "Go Down",
}, 2);  // 2 columns
```

**Display:**
```
Where do you want to go?
1) Go North    2) Go South
3) Go East     4) Go West
5) Go Up       6) Go Down
Enter number or name: _
```

**Accepts:**
- Number (1-6)
- Exact key name (`north`)
- Partial key name (`nor`)

**Parameters:**
- `player` - The player to prompt
- `prompt` - The header text
- `options` - Object with `{ key: 'Display label', ... }`
- `numCols` - Number of columns (default: 3)

**Returns:** The selected option key

### multiline - Multi-Line Text

Collect multiple lines of text, ending with `.` on its own line.

```javascript
const description = await $prompt.multiline(player, "Enter room description:");
await player.tell("You entered:\n" + description);
```

**Display:**
```
Enter room description:
> This is a dark room.
> It smells of mold.
> .
```

**Special Commands:**
- `.` alone on a line - Finish and return text
- `@abort` - Cancel and throw Error

**Parameters:**
- `player` - The player to prompt
- `text` - The prompt text (default: "Enter text (end with . on its own line):")

**Returns:** Joined text (without the final `.`)

**Throws:** Error if player types `@abort`

## Prompt State Management

### isActive - Check for Active Prompt

```javascript
if (await $prompt.isActive(player)) {
  // Player is answering a prompt - don't send other output
}
```

### cancel - Cancel Active Prompt

```javascript
// Cancel current prompt (resolves with null)
await $prompt.cancel(player);
```

### handleInput - Process Player Input

This is called automatically by the player's input handler:

```javascript
// In player.onInput:
if ($prompt && await $prompt.isActive(self)) {
  const handled = await $prompt.handleInput(self, input);
  if (handled) return;  // Prompt handled the input
}
```

## How It Works

1. Calling a prompt method stores state on `player._promptState`
2. Returns a Promise that resolves when player responds
3. Player's next input goes through `handleInput()`
4. If valid, clears state and resolves the Promise
5. If invalid, shows error and re-prompts

```javascript
// Internal state structure
player._promptState = {
  type: 'question' | 'choice' | 'yesorno' | 'menu' | 'multiline',
  text: "The prompt text",
  validator: function | null,  // For question
  options: { key: label },     // For choice/menu
  keys: ['key1', 'key2'],      // For choice/menu
  lines: [],                   // For multiline
  resolve: promiseResolver,
  reject: promiseRejector,     // For multiline @abort
};
```

## Practical Examples

### Character Creation

```javascript
async function createCharacter(player) {
  // Get name
  const name = await $prompt.question(player, "Enter character name: ", (input) => {
    if (input.length < 2) return "Name must be at least 2 characters.";
    if (input.length > 20) return "Name must be at most 20 characters.";
    if (!/^[a-zA-Z]+$/.test(input)) return "Name must contain only letters.";
    return null;
  });

  // Choose class
  const charClass = await $prompt.choice(player, "Choose your class:", {
    warrior: "Warrior - High strength, heavy armor",
    mage: "Mage - Powerful magic, low defense",
    rogue: "Rogue - Fast and stealthy",
  });

  // Choose sex
  const sex = await $prompt.choice(player, "Choose your sex:", {
    male: "Male",
    female: "Female",
    'non-binary': "Non-binary",
  });

  // Confirm
  const confirmed = await $prompt.yesorno(player,
    "Create " + name + " the " + charClass + "?"
  );

  if (!confirmed) {
    await player.tell("Character creation cancelled.");
    return null;
  }

  // Create the character
  const character = await createCharacterObject(name, charClass, sex);
  await player.tell("Welcome, " + name + "!");
  return character;
}
```

### Vending Machine

```javascript
async function vend(player, machine) {
  const items = machine.contents || [];
  if (items.length === 0) {
    return "The machine is empty.";
  }

  // Build menu options
  const options = {};
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const price = item.price || machine.defaultPrice || 0;
    options[i] = item.name + " - $" + price;
  }

  // Let player choose
  const choice = await $prompt.menu(player, "Select an item:", options, 2);
  const selectedIndex = parseInt(choice);
  const selected = items[selectedIndex];
  const price = selected.price || machine.defaultPrice || 0;

  // Confirm purchase
  const confirmed = await $prompt.yesorno(player,
    "Buy " + selected.name + " for $" + price + "?"
  );

  if (!confirmed) {
    return "Cancelled.";
  }

  // Process payment and dispense
  // ...
}
```

### Room Description Editor

```javascript
async function editRoomDescription(admin, room) {
  await admin.tell("Current description:");
  await admin.tell(room.description);
  await admin.tell("");

  const proceed = await $prompt.yesorno(admin, "Edit this description?");
  if (!proceed) {
    return "Cancelled.";
  }

  try {
    const newDesc = await $prompt.multiline(admin,
      "Enter new description (end with . on its own line, @abort to cancel):"
    );

    room.description = newDesc;
    await admin.tell("Description updated!");
    return newDesc;
  } catch (e) {
    if (e.message === 'Aborted by user') {
      return "Edit aborted.";
    }
    throw e;
  }
}
```

### ATM Menu System

```javascript
async function atmMenu(player, terminal) {
  while (true) {
    const action = await $prompt.choice(player, "ATM Menu:", {
      balance: "Check Balance",
      deposit: "Deposit",
      withdraw: "Withdraw",
      transfer: "Transfer",
      exit: "Exit",
    });

    switch (action) {
      case 'balance':
        const balance = await getBalance(player);
        await player.tell("Your balance: $" + balance);
        break;

      case 'deposit':
        const depositAmt = await $prompt.question(player, "Amount to deposit: $", (input) => {
          const num = parseFloat(input);
          if (isNaN(num) || num <= 0) return "Enter a positive amount.";
          return null;
        });
        await doDeposit(player, parseFloat(depositAmt));
        await player.tell("Deposited $" + depositAmt);
        break;

      case 'withdraw':
        const withdrawAmt = await $prompt.question(player, "Amount to withdraw: $", (input) => {
          const num = parseFloat(input);
          if (isNaN(num) || num <= 0) return "Enter a positive amount.";
          return null;
        });
        const result = await doWithdraw(player, parseFloat(withdrawAmt));
        if (result.error) {
          await player.tell(result.error);
        } else {
          await player.tell("Withdrew $" + withdrawAmt);
        }
        break;

      case 'transfer':
        const recipient = await $prompt.question(player, "Recipient account: ");
        const transferAmt = await $prompt.question(player, "Amount: $");
        await doTransfer(player, recipient, parseFloat(transferAmt));
        break;

      case 'exit':
        await player.tell("Thank you for using the ATM.");
        return;
    }
  }
}
```

## Integration with Exclusions

Prompts don't automatically acquire exclusions, but you may want to:

```javascript
// Start operating a terminal
const blocked = await $exclusions.start(player, 'operating', { terminal: self });
if (blocked) return blocked;

try {
  // Run the menu loop
  await atmMenu(player, self);
} finally {
  // Always end the exclusion
  await $exclusions.end(player, 'operating');
}
```

## Best Practices

### 1. Always Handle Cancelled Prompts

```javascript
const answer = await $prompt.question(player, "Enter value: ");
if (!answer) {
  // Prompt was cancelled or empty
  return "Cancelled.";
}
```

### 2. Use Validators for Input

```javascript
// Validate as you go, not after
const age = await $prompt.question(player, "Enter age: ", (input) => {
  const num = parseInt(input);
  if (isNaN(num)) return "Please enter a number.";
  if (num < 0 || num > 150) return "Please enter a realistic age.";
  return null;
});
```

### 3. Provide Clear Prompts

```javascript
// Good - tells user what to expect
await $prompt.question(player, "Enter your 4-digit PIN: ");

// Less clear
await $prompt.question(player, "PIN: ");
```

### 4. Handle multiline Abort

```javascript
try {
  const text = await $prompt.multiline(player, "Enter text:");
  // Use text
} catch (e) {
  if (e.message === 'Aborted by user') {
    await player.tell("Cancelled.");
    return;
  }
  throw e;
}
```

### 5. Check isActive Before Sending Output

```javascript
// Don't spam output during prompts
if (!await $prompt.isActive(player)) {
  await player.tell("Something happened!");
}
```

## See Also

- [$ Globals Reference](./globals.md) - $prompt
- [Verb System](./verbs.md) - Command handling that triggers prompts
- [Exclusions System](./exclusions.md) - Blocking actions during prompts
