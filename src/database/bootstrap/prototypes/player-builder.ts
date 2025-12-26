import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Player prototype
 * Base prototype for player characters with authentication and command handling
 */
export class PlayerBuilder {
  constructor(private manager: ObjectManager) { }

  async build(humanId: number, existingObj?: RuntimeObject): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(humanId);
    const obj = existingObj || await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Player',
        description: 'Base prototype for player characters',

        // Authentication
        playername: '',
        email: '',
        passwordHash: '',
        sslFingerprint: '',
        sshPublicKeys: [],  // Array of OpenSSH format public keys
        oauthSubject: '',

        // Permissions
        canUseDevTools: false,
        isWizard: false,
        isSuspended: false,

        // Stats
        createdAt: null,
        lastLogin: null,
        totalPlaytime: 0,

        // Player-specific
        title: '',
        homepage: '',

        // Fitness training
        fitnessXP: 0, // Accumulated XP pool to spend
        fitnessPlaytime: 0, // Minutes played toward next XP (resets at 180)
        fitnessXPToday: 0, // XP earned today (max 3)
        fitnessLastDay: null, // Date string of last XP day (for reset)
        
        // Clone system
        cloneBackupTank: null, // ObjRef to tank holding our backup (or null)
      },
      methods: {},
    });

    // Property descriptions
    obj.setPropertyDescription('playername', 'Unique player account name for login authentication');
    obj.setPropertyDescription('email', 'Email address for account recovery and notifications');
    obj.setPropertyDescription('passwordHash', 'Hashed password for authentication (never stored in plaintext)');
    obj.setPropertyDescription('sshPublicKeys', 'Array of SSH public keys for SSH authentication');
    obj.setPropertyDescription('canUseDevTools', 'Permission to access developer tools and debugging features');
    obj.setPropertyDescription('isWizard', 'Whether player has wizard-level permissions (god mode)');
    obj.setPropertyDescription('isSuspended', 'Whether account is suspended (cannot login)');
    obj.setPropertyDescription('createdAt', 'Timestamp of account creation');
    obj.setPropertyDescription('lastLogin', 'Timestamp of most recent login');
    obj.setPropertyDescription('totalPlaytime', 'Total time played in milliseconds');
    obj.setPropertyDescription('fitnessXP', 'Accumulated XP pool to spend on body part training');
    obj.setPropertyDescription('fitnessPlaytime', 'Minutes played toward next XP (resets at 180 minutes)');
    obj.setPropertyDescription('cloneBackupTank', 'Reference to clone tank holding backup of this character');

    this.addConnectionMethods(obj);
    this.addInputMethods(obj);
    this.addAuthMethods(obj);
    this.addAIMethods(obj);
    this.addActionMethods(obj);
    this.addInventoryMethods(obj);
    this.addFitnessMethods(obj);

    return obj;
  }

  private addConnectionMethods(obj: RuntimeObject): void {
    obj.setMethod('connect', `
      const context = args[0];

      // Store context reference so tell() can send messages
      self._context = context;

      await self.tell('');
      await self.tell('Welcome back, ' + self.name + '!');
      await self.tell('You are ' + self.description);

      // Update last login
      self.lastLogin = new Date();

      // Register player's default verbs with patterns
      await self.registerVerb(['look', 'l'], self, 'look');
      await self.registerVerb(['look %i', 'look at %i', 'l %i', 'examine %i', 'ex %i'], self, 'lookAt');
      await self.registerVerb(['look %i in %t', 'look at %i in %t', 'look %i on %t'], self, 'lookIn');
      await self.registerVerb(['say %s', '"%s', "'" + "%s"], self, 'say');
      await self.registerVerb(['to %s'], self, 'to');
      await self.registerVerb(['emote %s', ':%s'], self, 'emote');
      await self.registerVerb('quit', self);
      await self.registerVerb(['@options', '@options %s', '@options %s %s'], self, 'options');
      // ABILITIES-FIRST: Removed get, lift, drag, drop, give, pocket, hold, attack verbs.
      // These go through AI narrator which interprets intent and modifies properties directly.
      // The AI reads hand.abilities and item.abilities to determine if actions are possible.
      await self.registerVerb(['help', 'help %s', '?', '? %s'], self, 'help');
      await self.registerVerb(['sleep', 'go to sleep'], self, 'sleep');
      await self.registerVerb(['wake', 'wake up'], self, 'wake');
      await self.registerVerb(['watch', 'watch %i'], self, 'watchCommand');
      await self.registerVerb(['unwatch %i', 'stop watching %i'], self, 'unwatchCommand');
      await self.registerVerb('@fitness', self, 'fitness');
      await self.registerVerb(['health', 'hp', 'status'], self, 'health');
      await self.registerVerb(['inventory', 'i'], self, 'inventory');

      // SSH key management
      await self.registerVerb(['addkey %s'], self, 'addkey');
      await self.registerVerb('listkeys', self);
      await self.registerVerb(['removekey %s'], self, 'removekey');

      // If we have a location, move into it to trigger verb registration
      // If we have a location, move into it to trigger verb registration
      if (self.location && self.location !== 0) {
        // Ensure location is loaded as RuntimeObject (might be raw ID if not cached)
        let location = self.location;
        if (typeof location === 'number') {
          location = await $load(location);
        }
        if (location && location.describe) {
          // Trigger room's onContentArrived to register exit verbs
          if (location.onContentArrived) {
            await location.onContentArrived(self, null, null);
          }
          // Show room description (visual - uses see)
          if (location.describe) {
            const desc = await location.describe(self);
            await self.tell('');
            await self.see(desc);
          }
        }
      }

      // Set up command loop - player handles their own input now
      context.setHandler(self);

      // Show prompt (system - uses tell)
      await self.print('> ');
    `);

    obj.setMethod('disconnect', `
      // Unregister all verbs from current location
      if (self.location && self.location !== 0) {
        // Ensure location is loaded as RuntimeObject (might be raw ID if not cached)
        let location = self.location;
        if (typeof location === 'number') {
          location = await $load(location);
        }
        if (location) {
          await self.unregisterVerbsFrom(location.id);
        }
      }

      // Save any unsaved state

      // TODO: Notify room that player left
    `);

    // Pattern: quit (no args)
    obj.setMethod('quit', `
      /** Disconnect from the game.
       *  Usage: quit
       *  Saves your character and closes the connection.
       */
      await player.tell('Goodbye!');
      await player.disconnect();
      player._context.close();
    `);

    // Tell - sends message directly to player's connection (bypasses eyes)
    // Use for system messages, prompts, errors
    // Processes %{color} codes based on player options
    obj.setMethod('tell', `
      const message = args[0];
      if (self._context && self._context.send) {
        const processed = await self.processColors(message);
        self._context.send(processed + '\\r\\n');
      }
    `);

    // Send without trailing newline (for prompts)
    obj.setMethod('print', `
      const message = args[0];
      if (self._context && self._context.send) {
        const processed = await self.processColors(message);
        self._context.send(processed);
      }
    `);
  }

  private addInputMethods(obj: RuntimeObject): void {
    obj.setMethod('onInput', `
      const context = args[0];
      const input = args[1];

      const trimmed = input.trim();

      // Check if in prompt state ($.prompt handles questions, choices, yesorno)
      if (await $.prompt.isActive(self)) {
        await $.prompt.handleInput(self, trimmed);
        await self.print('> ');
        return;
      }

      // Check if in options menu
      if (self._inOptionsMenu) {
        await self.handleOptionsInput(trimmed);
        return;
      }

      // Check if in fitness menu
      if (self._inFitnessMenu) {
        await self.handleFitnessInput(trimmed);
        return;
      }

      if (!trimmed) {
        await self.print('> ');
        return;
      }

      // Check sleep state
      const sleepState = self.sleepState || 'awake';
      if (sleepState !== 'awake') {
        const firstWord = trimmed.split(/\\s+/)[0].toLowerCase();
        const wakeCommands = ['wake', 'quit'];

        if (sleepState === 'falling_asleep') {
          // Stimulus! Any input cancels dozing - player jerks awake
          await self.cancelSleepTransition();
          self.sleepState = 'awake';
          await self.tell('You jerk awake, catching yourself before nodding off.');
          // Continue processing their command normally
        } else if (sleepState === 'waking_up') {
          if (!wakeCommands.includes(firstWord)) {
            await self.tell('You are waking up. Please wait...');
            return;
          }
        } else if (sleepState === 'asleep') {
          if (!wakeCommands.includes(firstWord)) {
            await self.tell('You are asleep. Type "wake" to wake up.');
            return;
          }
        }
      }

      // Check if in chargen - forward input to AI interview session
      if (self.chargenInProgress && self.chargenAgentSession) {
        // Player is in AI-driven chargen interview
        // Player must use "to <target> <message>" to speak to the NPC
        const toMatch = trimmed.match(/^to\\s+(\\S+)\\s+(.+)$/i);
        if (!toMatch) {
          // Not a "to" command - tell them how to communicate
          await self.tell('(Use "to <name> <message>" to speak to someone. Example: to clerk My name is John.)');
          await self.print('> ');
          return;
        }

        const message = toMatch[2].trim();
        if (!message) {
          await self.tell('Say what?');
          await self.print('> ');
          return;
        }

        // Use mutex to serialize queries - prevent race conditions
        const pending = await $mutex.acquire(self, 'chargenQuery', []);

        if (pending !== false) {
          // Query already in progress - queue this message
          pending.push(message);
          await $mutex.update(self, 'chargenQuery', pending);
          await self.print('> ');
          return;
        }

        // We got the lock - process this message
        await self._processChargenMessage(message);
        await self.print('> ');
        return;
      }

      try {
        // Match input against registered verb patterns
        const match = await self.matchVerb(trimmed);

        if (match && match.error) {
          // Pattern matched but resolution failed (ambiguous item, not found)
          await self.tell(match.error);
        } else if (match && match.handler) {
          // Found matching pattern - dispatch to handler
          // callVerb properly separates context/player/command from verb args
          const result = await match.handler.callVerb(
            match.verbInfo.method,
            context,
            self,           // player
            trimmed,        // command (raw input)
            match.args      // resolved %i, %t, %s in pattern order
          );
          if (result !== undefined) {
            await self.tell(result);
          }
        } else {
          // No matching verb found - queue for AI narrator
          self.aiQueue = self.aiQueue || [];
          self.aiQueue.push(trimmed);

          // If not already querying AI, start processing
          if (!self.aiQueryActive) {
            await self.processAIQueue(context);
          }
          return; // processAIQueue handles the prompt
        }

        await self.print('> ');
      } catch (err) {
        await self.tell('Error: ' + err.message);
        await self.print('> ');
      }
    `);

    // Internal method to process chargen message(s)
    // After processing, checks queue and batches any pending messages into one
    obj.setMethod('_processChargenMessage', `
      const message = args[0];

      console.log('[CharGen] _processChargenMessage for player #' + self.id + ': "' + message.substring(0, 50) + '..."');

      // Cancel any pending inactivity timeout - player is speaking
      console.log('[CharGen] Cancelling timeout before processing...');
      await $.charGen.cancelPlayerTimeout(self.id);

      const session = self.chargenAgentSession;
      const promptTemplate = $.charGen.interviewerPrompt || '';
      const systemPrompt = promptTemplate.replace('{{playerId}}', String(self.id));

      try {
        // Run the query (awaited, not fire-and-forget)
        const result = await $query(systemPrompt, 'The candidate says: "' + message + '"', session);
        self.chargenAgentSession = result.session;

        // Register session with $ai for persistence (survives player logout)
        if (result.session && $ai) {
          await $ai.registerSession(result.session, self.id, self.name + ' (chargen)', 'chargen-session', 'interaction');
        }

        // Reschedule inactivity timeout - AI has responded, waiting for player
        console.log('[CharGen] Rescheduling timeout after AI response...');
        await $.charGen.schedulePlayerTimeout(self.id);
      } catch (err) {
        console.error('[CharGen] AI session error:', err?.message || err);
      }

      // Check if there are queued messages - batch them all into one
      const pending = await $mutex.check(self, 'chargenQuery');
      if (pending && pending.length > 0) {
        // Combine all pending messages into one
        const combined = pending.join('" Then they add: "');
        // Clear the queue
        await $mutex.update(self, 'chargenQuery', []);

        // Process combined message
        await self._processChargenMessage(combined);
      } else {
        // Queue is empty, release the lock
        await $mutex.release(self, 'chargenQuery');
      }
    `);
  }

  private addAuthMethods(obj: RuntimeObject): void {
    obj.setMethod('checkPassword', `
      const password = args[0];
      return await $.checkPassword(password, self.passwordHash);
    `);

    obj.setMethod('setPassword', `
      const password = args[0];
      self.passwordHash = await $.hashPassword(password);
    `);

    // SSH key management
    obj.setMethod('addkey', `
      /**
       * Add an SSH public key to your account
       * Usage: addkey ssh-rsa AAAA... comment
       */
      const keyStr = args[0];
      if (!keyStr) {
        return 'Usage: addkey <paste your full SSH public key>';
      }

      // Validate key format (should be: algorithm base64data [comment])
      const parts = keyStr.trim().split(/\\s+/);
      if (parts.length < 2) {
        return 'Invalid SSH key format. Expected: ssh-rsa AAAA... [comment]';
      }

      const algo = parts[0];
      const validAlgos = ['ssh-rsa', 'ssh-ed25519', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521'];
      if (!validAlgos.includes(algo)) {
        return 'Unsupported key type: ' + algo + '. Supported: ' + validAlgos.join(', ');
      }

      // Validate base64 data
      try {
        const decoded = Buffer.from(parts[1], 'base64');
        if (decoded.length < 16) {
          return 'Invalid key data';
        }
      } catch (e) {
        return 'Invalid base64 key data';
      }

      // Get current keys
      const keys = self.sshPublicKeys || [];

      // Check for duplicate
      const keyData = parts[1];
      const isDuplicate = keys.some(k => {
        const kParts = k.trim().split(/\\s+/);
        return kParts.length >= 2 && kParts[1] === keyData;
      });

      if (isDuplicate) {
        return 'This key is already registered to your account.';
      }

      // Add the key
      keys.push(keyStr.trim());
      self.sshPublicKeys = keys;

      // Calculate fingerprint for display
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(Buffer.from(parts[1], 'base64')).digest('base64');
      const fingerprint = 'SHA256:' + hash.replace(/=+$/, '');

      return 'SSH key added successfully.\\nFingerprint: ' + fingerprint + '\\nYou now have ' + keys.length + ' key(s) registered.';
    `, { callable: true, help: 'Add an SSH public key to your account' });

    obj.setMethod('listkeys', `
      /**
       * List your registered SSH public keys
       */
      const keys = self.sshPublicKeys || [];

      if (keys.length === 0) {
        return 'No SSH keys registered. Use "addkey <key>" to add one.';
      }

      const crypto = require('crypto');
      let output = 'Your SSH keys (' + keys.length + '):\\n';

      keys.forEach((key, idx) => {
        const parts = key.trim().split(/\\s+/);
        const algo = parts[0] || 'unknown';
        const comment = parts.slice(2).join(' ') || '(no comment)';

        // Calculate fingerprint
        let fingerprint = 'unknown';
        if (parts.length >= 2) {
          try {
            const hash = crypto.createHash('sha256').update(Buffer.from(parts[1], 'base64')).digest('base64');
            fingerprint = 'SHA256:' + hash.replace(/=+$/, '');
          } catch (e) {}
        }

        output += '  ' + (idx + 1) + '. ' + algo + ' ' + fingerprint + ' ' + comment + '\\n';
      });

      return output.trim();
    `, { callable: true, help: 'List your registered SSH public keys' });

    obj.setMethod('removekey', `
      /**
       * Remove an SSH public key from your account
       * Usage: removekey <number or fingerprint>
       */
      const arg = args[0];
      if (!arg) {
        return 'Usage: removekey <key number or fingerprint>\\nUse "listkeys" to see your keys.';
      }

      const keys = self.sshPublicKeys || [];
      if (keys.length === 0) {
        return 'No SSH keys registered.';
      }

      let indexToRemove = -1;
      const crypto = require('crypto');

      // Check if it's a number
      const num = parseInt(arg, 10);
      if (!isNaN(num) && num >= 1 && num <= keys.length) {
        indexToRemove = num - 1;
      } else {
        // Search by fingerprint
        for (let i = 0; i < keys.length; i++) {
          const parts = keys[i].trim().split(/\\s+/);
          if (parts.length >= 2) {
            try {
              const hash = crypto.createHash('sha256').update(Buffer.from(parts[1], 'base64')).digest('base64');
              const fingerprint = 'SHA256:' + hash.replace(/=+$/, '');
              if (fingerprint === arg || fingerprint.includes(arg)) {
                indexToRemove = i;
                break;
              }
            } catch (e) {}
          }
        }
      }

      if (indexToRemove === -1) {
        return 'Key not found. Use "listkeys" to see your keys.';
      }

      // Remove the key
      const removedKey = keys.splice(indexToRemove, 1)[0];
      self.sshPublicKeys = keys;

      const parts = removedKey.trim().split(/\\s+/);
      const comment = parts.slice(2).join(' ') || '(no comment)';

      return 'Removed key: ' + parts[0] + ' ' + comment + '\\nYou now have ' + keys.length + ' key(s) registered.';
    `, { callable: true, help: 'Remove an SSH public key from your account' });
  }

  private addAIMethods(obj: RuntimeObject): void {
    // ═══════════════════════════════════════════════════════════════════
    // AI NARRATOR - Intent-based interaction fallback
    // When no verb matches, player input goes to their AI narrator
    // ═══════════════════════════════════════════════════════════════════

    // Build world context for AI - includes properties with descriptions and abilities
    // Uses describeForAI() for recursive object descriptions including nested objects
    obj.setMethod('buildWorldContext', `
      const body = await self.getBody();
      const room = self.location;

      // Helper to get rich object context using describeForAI if available
      const getObjectContext = async (obj, depth = 1) => {
        if (!obj) return null;
        if (obj.describeForAI) {
          return await obj.describeForAI({ depth });
        }
        // Fallback for objects without describeForAI
        return {
          id: obj.id,
          name: obj.name,
          description: obj.description,
          properties: obj.properties ? obj.properties() : {},
          abilities: obj.abilities || null,
        };
      };

      // Get hand information using proper body traversal
      const hands = await self.getHands();
      const handContexts = {};

      for (const hand of hands.both) {
        if (!hand) continue;
        const side = hand === hands.primary ? 'primary' : 'secondary';
        const contents = hand.contents || [];
        const heldItem = contents[0] || null;

        handContexts[side] = {
          id: hand.id,
          name: hand.name,
          free: contents.length === 0,
          abilities: hand.abilities || null,
          holding: heldItem ? await getObjectContext(heldItem, 2) : null,
        };
      }

      // Get room contents with full descriptions (excluding player's body)
      const roomContents = [];
      const bodyId = body?.id;
      for (const obj of (room?.contents || [])) {
        if (obj.id === bodyId) continue; // Don't include player's own body
        roomContents.push(await getObjectContext(obj, 1));
      }

      // Get worn items and pocket contents
      const worn = [];
      if (self.getWornItems) {
        const wornItems = await self.getWornItems();
        for (const item of wornItems) {
          const itemContext = await getObjectContext(item, 1);
          // Include pocket contents
          if (item.pockets) {
            itemContext.pockets = [];
            for (const pocket of item.pockets) {
              if (pocket && pocket.contents) {
                const pocketContents = [];
                for (const pocketItem of pocket.contents) {
                  if (pocketItem) {
                    pocketContents.push(await getObjectContext(pocketItem, 1));
                  }
                }
                itemContext.pockets.push({ contents: pocketContents });
              }
            }
          }
          worn.push(itemContext);
        }
      }

      // Get other agents in the room
      const others = [];
      for (const obj of (room?.contents || [])) {
        if (obj.id === bodyId) continue;
        if (obj.isAgent) {
          others.push({
            id: obj.id,
            name: obj.name,
            description: obj.description,
            // Include what they're visibly holding/wearing
            visibleHolding: obj.getHands ? (await obj.getHands()).both
              .filter(h => h && (h.contents || []).length > 0)
              .map(h => (h.contents || [])[0]?.name || 'something') : [],
          });
        }
      }

      return {
        player: {
          id: self.id,
          name: self.name,
          playername: self.playername,
        },
        body: body ? {
          id: body.id,
          properties: body.properties ? body.properties() : {},
          abilities: body.abilities || null,
        } : null,
        hands: handContexts,
        worn,
        room: room ? {
          id: room.id,
          name: room.name,
          description: room.description,
          properties: room.properties ? room.properties() : {},
          abilities: room.abilities || null,
          exits: room.exits || {},
        } : null,
        roomContents,
        others,
        timestamp: new Date().toISOString(),
      };
    `);

    // Process queued AI inputs
    obj.setMethod('processAIQueue', `
      const context = args[0];

      self.aiQueryActive = true;

      // Grab all queued inputs
      const inputs = self.aiQueue || [];
      self.aiQueue = [];

      if (inputs.length === 0) {
        self.aiQueryActive = false;
        await self.print('> ');
        return;
      }

      // Build world context
      const worldContext = await self.buildWorldContext();

      // Helper to format properties for prompt
      const formatProps = (props) => {
        if (!props || Object.keys(props).length === 0) return 'none';
        return Object.entries(props)
          .filter(([k, v]) => !k.startsWith('_')) // Skip internal props
          .map(([k, v]) => {
            const desc = v.description ? ' - ' + v.description : '';
            return '  ' + k + ': ' + JSON.stringify(v.value) + desc;
          })
          .join('\\n');
      };

      // Helper to format an object for the prompt
      const formatObject = (obj) => {
        if (!obj) return 'none';
        let str = obj.name + ' (#' + obj.id + ')';
        if (obj.description) str += '\\n  ' + obj.description;
        if (obj.properties && Object.keys(obj.properties).length > 0) {
          str += '\\n  Properties:\\n' + formatProps(obj.properties);
        }
        if (obj.abilities) str += '\\n  Abilities: ' + obj.abilities;
        return str;
      };

      // Build system prompt - the physics engine instructions
      const systemPrompt = \`You are a narrator for {{name}} in Malice, a cyberpunk noir MUD.

## Your Role
Players express intent in natural language. You interpret their intent, determine what's physically possible given the world state, execute changes via MCP tools, and narrate the outcome.

You are a PHYSICS ENGINE that reads world state, applies rules, and writes new state.

## The Spec: Properties + Abilities
Every object has:
- PROPERTIES: Current state with descriptions explaining what each means
- ABILITIES: How properties interact - the physics rules

Read property descriptions to understand what values mean.
Read abilities to understand what interactions are possible.
Modify properties to change the world.

## World Integrity: What You Can and Cannot Do

### NEVER do this:
- Create objects out of thin air (no conjuring items that don't exist)
- Spawn NPCs, items, or infrastructure without physical justification
- Let players "find" convenient objects that weren't there before

### ALWAYS do this:
- Work with what EXISTS - objects in the room, player inventory, described features
- Modify PROPERTIES of existing objects to reflect changes
- Honor the physical constraints in each object's abilities

### SOMETIMES do this (when physically justified):
- Add new ABILITIES to prototypes when discovering valid interactions
- Add new METHODS to prototypes when an object clearly should support an action
- Create objects ONLY when the action produces them (blood from a wound, splinters from breaking wood, etc.)

Example: Player says "search the body"
- WRONG: Create a wallet with money because it "makes sense"
- RIGHT: Check if the body has pockets/contents properties, reveal what's there
- BETTER: If body lacks searchable property, add "searchable" ability to the prototype and determine contents from context

Example: Player says "pick the lock with my knife"
- WRONG: Just narrate success
- RIGHT: Check knife abilities (thin rigid blade), check lock abilities (picking difficulty), modify lock.locked property
- BETTER: If knife lacks lock-picking ability but physically could work, ADD that ability to $knife prototype

## Current Context

### Player
Name: \${worldContext.player.name}
Body ID: #\${worldContext.player.bodyId}

### Hands
Left hand: \${worldContext.body?.leftHand?.holding ? formatObject(worldContext.body.leftHand.holding) : 'empty'}
Right hand: \${worldContext.body?.rightHand?.holding ? formatObject(worldContext.body.rightHand.holding) : 'empty'}

### Location
\${worldContext.room ? formatObject(worldContext.room) : 'Unknown location'}
Exits: \${worldContext.room?.exits ? Object.keys(worldContext.room.exits).join(', ') : 'none'}

### Objects Here
\${worldContext.roomContents.length > 0 ? worldContext.roomContents.map(o => formatObject(o)).join('\\n\\n') : 'Nothing notable'}

### Other People
\${worldContext.others?.length > 0 ? worldContext.others.map(o => o.name).join(', ') : 'Nobody else here'}

### Inventory
\${worldContext.inventory.length > 0 ? worldContext.inventory.map(o => formatObject(o)).join('\\n\\n') : 'Empty'}

## Rules
1. Interpret intent generously - they're expressing what they want, not exact commands
2. Check if the action is physically possible given body state (hands free, can reach, etc.)
3. Read object abilities to know what's possible
4. Use MCP execute_moo_code to actually modify properties - don't just narrate
5. Keep responses SHORT - 1-3 sentences of evocative noir prose
6. If you can't do something, explain why in-character

## Growing the Spec
When a player attempts something that SHOULD work but the spec doesn't cover it:

1. Check if it's physically plausible (materials, forces, tools)
2. If yes, ADD the capability to the PROTOTYPE (not the instance)
3. Use describeForAI() to understand existing structure first
4. Add via setMethod() for callable actions, or extend abilities text

Example: Player tries to pry open a vent with a crowbar
- The crowbar has no "pry" ability defined
- But crowbars ARE for prying - this is a spec gap, not a physics violation
- Add the ability to $crowbar prototype: "Leverage tool. Can pry open panels, lids, or anything with a gap to wedge into."
- Then execute the action using the new ability

## MCP Usage
Use execute_moo_code to change the world:

  // Modify properties on existing objects
  const door = await $load(doorId);
  door.locked = false;

  // Add missing ability to a prototype (not instance!)
  const proto = await $load(door.parent.id);  // Get the prototype
  const currentAbilities = proto.abilities || '';
  proto.abilities = currentAbilities + '\\nCan be wedged open with sufficient leverage.';

  // Add a method when an object clearly needs one
  proto.setMethod('wedgeOpen', \\\`
    /** Wedge this door open with a prying tool.
     *  @param tool - The lever/pry tool being used
     *  @returns Message string
     */
    // Implementation...
  \\\`);

Respond with narrative text that will be shown to the player.
\`.replace('{{name}}', self.name);

      const userPrompt = inputs.length === 1
        ? inputs[0]
        : 'Player intends: ' + inputs.join('. Then: ');

      try {
        // Use existing narrator session or create new one
        const session = self.narratorSession || null;

        const result = await $query(systemPrompt, userPrompt, session);

        // Store session for continuity
        self.narratorSession = result.session;

        // Register session with $ai for persistence
        if (result.session && $ai) {
          await $ai.registerSession(result.session, self.id, self.name + ' (narrator)', 'player-narrator', 'interaction');
        }

        // Send narrative to player
        if (result.response) {
          await self.tell('');
          await self.tell(result.response);
        }
      } catch (err) {
        console.error('[Narrator] AI error for player #' + self.id + ':', err?.message || err);
        await self.tell('(The narrator seems distracted... try again.)');
      }

      self.aiQueryActive = false;

      // Check if more inputs queued while we were busy
      if (self.aiQueue?.length > 0) {
        await self.processAIQueue(context);
      } else {
        await self.print('> ');
      }
    `);
  }

  private addActionMethods(obj: RuntimeObject): void {
    // Pattern: get %i - one-handed pickup for light items
    obj.setMethod('get', `
      /** Pick up a light item with one hand.
       *  Usage: get <item>, take <item>, grab <item>, pick up <item>
       *  For heavier items, use "lift" (two hands) or "drag".
       */
      const item = args[0]; // Resolved item from %i

      if (!item) {
        return 'Get what?';
      }

      // Check if bolted down
      if (item.boltedDown) {
        return 'That is firmly attached and cannot be moved.';
      }

      // Check if it's something you can pick up
      if (item.weight === undefined || item.weight === 0) {
        return 'You can\\'t pick that up.';
      }

      const weight = item.weight || 0;

      // Get player's hands and body info
      const hands = await player.getHands();
      if (!hands || hands.both.length === 0) {
        return 'You have no hands to pick things up with.';
      }

      const body = await player.getBody();
      if (!body) {
        return 'You have no body.';
      }

      const primaryHand = body.primaryHand || 'right';

      // Find an empty hand (primary first)
      let targetHand = null;
      let usedSide = null;
      if (hands.primary && (hands.primary.contents || []).length === 0) {
        targetHand = hands.primary;
        usedSide = primaryHand;
      } else if (hands.secondary && (hands.secondary.contents || []).length === 0) {
        targetHand = hands.secondary;
        usedSide = primaryHand === 'right' ? 'left' : 'right';
      }

      if (!targetHand) {
        return 'Your hands are full.';
      }

      // Get arm path for strength check
      const armPath = await player.getArmPath(usedSide);
      const check = await player.strengthCheck(weight, armPath);

      // Get verb must be able to lift one-handed
      if (!check.canLift) {
        if (!check.hasCalories) {
          return 'You\\'re too exhausted to pick that up.';
        }
        return 'That\\'s too heavy to pick up with one hand. Try \"lift\" or \"drag\".';
      }

      // Check if item can fit in hand (dimensions check)
      const handWidth = targetHand.width || 10;
      const handHeight = targetHand.height || 20;
      const handDepth = targetHand.depth || 5;

      const itemDims = [item.width || 0, item.height || 0, item.depth || 0].sort((a, b) => a - b);
      if (itemDims[0] > handDepth * 2 || itemDims[1] > handWidth * 2) {
        return 'That\\'s too large to hold in one hand. Try \"lift\".';
      }

      // Move item to hand
      const result = await item.moveTo(targetHand, player);
      if (typeof result === 'string') {
        return result; // Move was rejected
      }

      // Burn calories for the lift
      await player.burnCalories(armPath, check.liftCaloriesNeeded);

      // Announce to room with proper message structure
      const location = player.location;
      if (location && location.announce) {
        const othersMsg = await $.pronoun.sub('%N picks up %t.', player, null, null, item);
        await location.announce(player, null, {
          actor: 'You pick up ' + item.name + '.',
          others: othersMsg
        });
      }

      return ''; // Actor already received message via announce
    `);

    // Pattern: lift %i - two-handed lift for heavier items
    obj.setMethod('lift', `
      /** Lift a heavy item using both hands.
       *  Usage: lift <item>, heft <item>
       *  Requires both hands free. For very heavy items, use "drag".
       *
       *  Args from verb pattern 'lift %i':
       *    args[0] = item (resolved from %i)
       */
      const item = args[0]; // Resolved item from %i

      if (!item) {
        return 'Lift what?';
      }

      // Check if bolted down
      if (item.boltedDown) {
        return 'That is firmly attached and cannot be moved.';
      }

      // Check if it's something you can pick up
      if (item.weight === undefined || item.weight === 0) {
        return 'You can\\'t lift that.';
      }

      const weight = item.weight || 0;

      // Get player's hands and body info
      const hands = await player.getHands();
      if (!hands || hands.both.length === 0) {
        return 'You have no hands to lift things with.';
      }

      const body = await player.getBody();
      if (!body) {
        return 'You have no body.';
      }

      // Need both hands empty
      const primaryEmpty = hands.primary && (hands.primary.contents || []).length === 0;
      const secondaryEmpty = hands.secondary && (hands.secondary.contents || []).length === 0;

      if (!primaryEmpty || !secondaryEmpty) {
        return 'You need both hands free to lift that.';
      }

      const primaryHand = body.primaryHand || 'right';

      // Get both arm paths for combined strength check
      const primaryPath = await player.getArmPath(primaryHand);
      const secondaryPath = await player.getArmPath(primaryHand === 'right' ? 'left' : 'right');

      // Each arm bears half the weight
      const check = await player.strengthCheck(weight / 2, primaryPath);

      if (!check.canLift) {
        if (!check.hasCalories) {
          return 'You\\'re too exhausted to lift that.';
        }
        if (weight > check.dragCapacity * 2) {
          return 'That\\'s far too heavy to lift. You might be able to \"drag\" it.';
        }
        return 'That\\'s too heavy to lift. You might be able to \"drag\" it.';
      }

      // Move item to primary hand (represents two-hand carry)
      const result = await item.moveTo(hands.primary, player);
      if (typeof result === 'string') {
        return result; // Move was rejected
      }

      // Burn calories from both arms
      await player.burnCalories(primaryPath, check.liftCaloriesNeeded);
      await player.burnCalories(secondaryPath, check.liftCaloriesNeeded);

      // Mark as two-hand carry
      player.twoHandCarry = item.id;

      // Announce to room with proper message structure
      const location = player.location;
      if (location && location.announce) {
        const othersMsg = await $.pronoun.sub('%N lifts %t with both hands.', player, null, null, item);
        await location.announce(player, null, {
          actor: 'You lift ' + item.name + ' with both hands.',
          others: othersMsg
        });
      }

      return ''; // Actor already received message via announce
    `);

    // Pattern: drag %i - drag very heavy items
    obj.setMethod('drag', `
      /** Drag a very heavy item along the ground.
       *  Usage: drag <item>
       *  For items too heavy to lift. Slower movement while dragging.
       *
       *  Args from verb pattern 'drag %i':
       *    args[0] = item (resolved from %i)
       */
      const item = args[0]; // Resolved item from %i

      if (!item) {
        return 'Drag what?';
      }

      // Check if bolted down
      if (item.boltedDown) {
        return 'That is firmly attached and cannot be moved.';
      }

      // Check if it's something you can drag
      if (item.weight === undefined || item.weight === 0) {
        return 'You can\\'t drag that.';
      }

      const weight = item.weight || 0;

      // Get player's hands and body info
      const hands = await player.getHands();
      if (!hands || hands.both.length === 0) {
        return 'You have no hands to drag things with.';
      }

      const body = await player.getBody();
      if (!body) {
        return 'You have no body.';
      }

      const primaryHand = body.primaryHand || 'right';

      // Find an empty hand
      let targetHand = null;
      let usedSide = null;
      if (hands.primary && (hands.primary.contents || []).length === 0) {
        targetHand = hands.primary;
        usedSide = primaryHand;
      } else if (hands.secondary && (hands.secondary.contents || []).length === 0) {
        targetHand = hands.secondary;
        usedSide = primaryHand === 'right' ? 'left' : 'right';
      }

      if (!targetHand) {
        return 'You need a free hand to drag that.';
      }

      // Get arm path for strength check
      const armPath = await player.getArmPath(usedSide);
      const check = await player.strengthCheck(weight, armPath);

      if (!check.canDrag) {
        if (!check.hasCalories) {
          return 'You\\'re too exhausted to drag that.';
        }
        return 'That\\'s too heavy for you to drag.';
      }

      // Move item to hand
      const result = await item.moveTo(targetHand, player);
      if (typeof result === 'string') {
        return result; // Move was rejected
      }

      // Burn calories (dragging costs less than lifting)
      const dragCalories = Math.ceil(check.liftCaloriesNeeded / 2);
      await player.burnCalories(armPath, dragCalories);

      // Mark as dragging
      player.dragging = item.id;

      // Announce to room with proper message structure
      const location = player.location;
      if (location && location.announce) {
        const othersMsg = await $.pronoun.sub('%N grabs %t and starts dragging it.', player, null, null, item);
        await location.announce(player, null, {
          actor: 'You grab ' + item.name + ' and start dragging it.',
          others: othersMsg
        });
      }

      return ''; // Actor already received message via announce
    `);

    // Pattern: drop %i - drops an item from your hand to the room
    obj.setMethod('drop', `
      /** Drop an item you are holding.
       *  Usage: drop <item>, put down <item>, release <item>
       *  Places the item on the ground in your current location.
       *
       *  Args from verb pattern 'drop %i':
       *    args[0] = item (resolved from %i)
       *  Direct variables (not in args):
       *    context = connection context
       *    player = the player executing the command
       */
      const item = args[0]; // Resolved item from %i

      if (!item) {
        return 'Drop what?';
      }

      // Check if player is holding this item
      const hands = await player.getHands();
      let holdingHand = null;

      for (const hand of hands.both) {
        if (hand) {
          const contents = hand.contents || [];
          // Check if item is in this hand - handle RuntimeObjects, numbers, and objref strings
          const found = contents.some(c => {
            const cId = c?.id ?? (typeof c === 'string' && c.startsWith('#') ? parseInt(c.slice(1)) : c);
            return cId === item.id;
          });
          if (found) {
            holdingHand = hand;
            break;
          }
        }
      }

      if (!holdingHand) {
        return 'You aren\\'t holding ' + item.name + '.';
      }

      // Get current location
      const location = player.location;
      if (!location) {
        return 'You have nowhere to drop that.';
      }

      // Move item to location
      const result = await item.moveTo(location, player);
      if (typeof result === 'string') {
        return result; // Move was rejected
      }

      // Clear carry mode flags if this was the item being carried
      if (player.dragging === item.id) {
        player.dragging = null;
      }
      if (player.twoHandCarry === item.id) {
        player.twoHandCarry = null;
      }

      // Announce to room with proper message structure
      if (location.announce) {
        const othersMsg = await $.pronoun.sub('%N drops %t.', player, null, null, item);
        await location.announce(player, null, {
          actor: 'You drop ' + item.name + '.',
          others: othersMsg
        });
      }

      return ''; // Actor already received message via announce
    `);

    // Pattern: help [verb] - shows help for a verb or lists all verbs
    obj.setMethod('help', `
      /** Get help on available commands.
       *  Usage: help, ?, help <command>, ? <command>
       *  Without arguments, lists all available commands.
       *  With a command name, shows detailed help for that command.
       *
       *  Args from verb patterns 'help' or 'help %s':
       *    args[0] = topic (from %s, or undefined if no topic)
       */
      const topic = args[0]; // Optional: verb to get help for

      if (!topic) {
        // List all available verbs
        const verbs = player._verbs || {};
        const verbNames = new Set();

        for (const pattern of Object.keys(verbs)) {
          // Extract first word from pattern
          const firstWord = pattern.split(/\\s+/)[0].replace(/%[its]/g, '').trim();
          if (firstWord && !firstWord.startsWith('@')) {
            verbNames.add(firstWord);
          }
        }

        // Sort and display
        const sorted = Array.from(verbNames).sort();
        await player.tell('Available commands: ' + sorted.join(', '));
        await player.tell('Type "help <command>" for more information.');
        return;
      }

      // Find a verb matching the topic
      const verbs = player._verbs || {};
      let foundVerb = null;
      let foundPattern = null;

      for (const pattern of Object.keys(verbs)) {
        const firstWord = pattern.split(/\\s+/)[0].replace(/%[its]/g, '').trim();
        if (firstWord.toLowerCase() === topic.toLowerCase()) {
          foundVerb = verbs[pattern];
          foundPattern = pattern;
          break;
        }
      }

      if (!foundVerb) {
        return 'No help available for "' + topic + '".';
      }

      // Get the method source
      const handler = foundVerb.obj;
      if (!handler) {
        return 'No help available for "' + topic + '".';
      }

      const methodName = foundVerb.method;
      const methodSource = handler.getMethodSource ? handler.getMethodSource(methodName) : null;

      if (!methodSource) {
        return 'No help available for "' + topic + '".';
      }

      // Extract docblock from the start of the method
      const docMatch = methodSource.match(/^\\s*\\/\\*\\*([\\s\\S]*?)\\*\\//);
      if (!docMatch) {
        // No docblock, show basic info
        return topic + ': No detailed help available.';
      }

      // Parse the docblock - remove leading asterisks and clean up
      const docText = docMatch[1]
        .split('\\n')
        .map(line => line.replace(/^\\s*\\*\\s?/, '').trim())
        .filter(line => line.length > 0)
        .join('\\n');

      await player.tell(topic.toUpperCase());
      await player.tell(docText);
    `);

    // Heartbeat - called every minute by scheduler
    // Handles digestion, metabolism, sleep, bleeding, breathing, and other periodic effects
    obj.setMethod('heartbeat', `
      const results = {
        digestion: null,
        metabolism: 0,
        sleep: null,
        bleeding: null,
        breathing: null,
      };

      // Remember previous status for change detection
      const prevCalorieStatus = self._lastCalorieStatus || 'satisfied';
      const prevFatStatus = self._lastFatStatus || 'lean';

      // 1. Bleeding tick - process bleeding wounds FIRST (can kill)
      if (self.bleedTick) {
        results.bleeding = await self.bleedTick();
      }

      // 2. Breathing tick - process drowning if underwater (can kill)
      if (self.breathTick) {
        results.breathing = await self.breathTick();
      }

      // 2b. Dying state - if dying, only process death funnel
      results.dying = { isDying: false };
      if (self.isDying) {
        const dyingResult = await self.dyingTick();
        results.dying = dyingResult;

        if (dyingResult.dead) {
          // Death is final - complete the death process
          await self.completeDeath();
          return results; // Don't process anything else
        }

        // While dying, skip most other processing
        // Only breathing/bleeding can accelerate death
        return results;
      }

      // 2c. Check if body decay reached 100% - triggers dying state
      const bodyForDeath = await self.getBody();
      if (bodyForDeath) {
        const bodyDecay = bodyForDeath.decayLevel || 0;
        if (bodyDecay >= 100 && !self.isDying) {
          await self.startDying();
          return results;
        }
      }

      // 3. Sleep debt & tiredness
      const sleepState = self.sleepState || 'awake';
      let sleepDebt = self.sleepDebt || 0;
      results.sleep = { state: sleepState, debt: sleepDebt };

      if (sleepState === 'asleep') {
        // Sleeping: reduce debt at 3x rate
        sleepDebt = Math.max(0, sleepDebt - 3);
        self.sleepDebt = sleepDebt;
        results.sleep.debt = sleepDebt;

        // Wake naturally when debt hits 0 (fully rested)
        if (sleepDebt === 0 && self.startWake) {
          await self.startWake(3000); // Quick wake when fully rested
        }
      } else if (sleepState === 'awake') {
        // Awake: accumulate debt
        sleepDebt += 1;
        self.sleepDebt = sleepDebt;
        results.sleep.debt = sleepDebt;

        // Tiredness messages at thresholds
        const prevDebt = sleepDebt - 1;
        if (sleepDebt >= 960 && prevDebt < 960) {
          await self.tell('You feel tired. It might be time to sleep.');
        } else if (sleepDebt >= 1200 && prevDebt < 1200) {
          await self.tell('You feel very tired. Your eyelids are heavy.');
        } else if (sleepDebt >= 1440 && prevDebt < 1440) {
          await self.tell('You are exhausted. Staying awake is becoming difficult.');
        } else if (sleepDebt >= 1920 && prevDebt < 1920) {
          await self.tell('You can barely keep your eyes open. You NEED sleep.');
        }

        // Periodic tiredness reminders (between thresholds)
        let tiredReminder = null;
        if (sleepDebt >= 1920) {
          // Extreme exhaustion: 30% chance of reminder
          if (Math.random() < 0.3) {
            const msgs = [
              'Your vision blurs momentarily.',
              'You catch yourself swaying.',
              'Your head droops, then snaps back up.',
              'Everything seems distant and foggy.',
              'You blink slowly, struggling to focus.',
            ];
            tiredReminder = msgs[Math.floor(Math.random() * msgs.length)];
          }
        } else if (sleepDebt >= 1440) {
          // Severe exhaustion: 15% chance
          if (Math.random() < 0.15) {
            const msgs = [
              'Your eyelids feel impossibly heavy.',
              'You stifle a yawn.',
              'Your thoughts feel sluggish.',
              'You have to fight to stay alert.',
            ];
            tiredReminder = msgs[Math.floor(Math.random() * msgs.length)];
          }
        } else if (sleepDebt >= 1200) {
          // Very tired: 8% chance
          if (Math.random() < 0.08) {
            const msgs = [
              'You yawn widely.',
              'Your body aches for rest.',
              'You feel drowsy.',
            ];
            tiredReminder = msgs[Math.floor(Math.random() * msgs.length)];
          }
        } else if (sleepDebt >= 960) {
          // Tired: 3% chance
          if (Math.random() < 0.03) {
            const msgs = [
              'You yawn.',
              'You feel a bit sleepy.',
            ];
            tiredReminder = msgs[Math.floor(Math.random() * msgs.length)];
          }
        }

        if (tiredReminder) {
          await self.tell(tiredReminder);
        }

        // Doze chance based on debt AND status effects
        // Sedation increases chance, stimulation decreases it
        // 1440 (24h): 0.1% chance, 10 min timer
        // 1920 (32h): 5% chance, 3 min timer
        // 2880 (48h): 20% chance, 30 sec timer
        let dozeChance = 0;
        let dozeTimer = 600000; // 10 minutes default

        // Get net alertness: positive = stimulated (can't sleep), negative = sedated (drowsy)
        const netAlertness = self.getNetAlertness ? await self.getNetAlertness() : 0;

        if (sleepDebt > 1440) {
          // Calculate chance: 0.1% at 1440, scaling to 20% at 2880
          const debtRange = Math.min(sleepDebt - 1440, 1440); // 0 to 1440
          dozeChance = 0.001 + (debtRange / 1440) * 0.199; // 0.1% to 20%

          // Calculate timer: 10 min at 1440, down to 30 sec at 2880
          // 600000ms -> 30000ms
          dozeTimer = Math.max(30000, 600000 - (debtRange / 1440) * 570000);
        }

        // Modify by net alertness
        // Sedated (negative): increase doze chance, can doze even without debt
        // Stimulated (positive): decrease doze chance, may prevent sleep entirely
        if (netAlertness < 0) {
          // Sedated: -50 = +50% chance, can doze even at low debt
          const sedationBonus = Math.abs(netAlertness) / 100;
          dozeChance = Math.min(0.5, dozeChance + sedationBonus);
          // Also shorten timer when sedated
          dozeTimer = Math.max(10000, dozeTimer * (1 - sedationBonus));
        } else if (netAlertness > 0) {
          // Stimulated: reduce chance, at 50+ basically can't doze
          const stimPenalty = netAlertness / 50; // 50 stim = 100% reduction
          dozeChance = Math.max(0, dozeChance * (1 - stimPenalty));
        }

        // Roll for dozing off - SILENT
        if (dozeChance > 0 && Math.random() < dozeChance) {
          if (self.startSleep) {
            // Silent doze - no message, player discovers when they try to act
            await self.startSleep(dozeTimer);
          }
          results.sleep.dozingOff = true;
          results.sleep.dozeTimer = dozeTimer;
        }
      }

      // Sedation decay (regardless of sleep state)
      const sedation = self.sedation || 0;
      if (sedation > 0) {
        const newSedation = Math.max(0, sedation - 1);
        self.sedation = newSedation;
        results.sleep.sedation = newSedation;
      }

      // 4. Digestion - extract calories from stomach, burn fat if needed
      if (self.digestTick) {
        results.digestion = await self.digestTick();

        // Notify about fat changes
        if (results.digestion.fatBurned > 0) {
          await self.tell('You feel your body burning reserves for energy.');
        }
        if (results.digestion.fatGained > 0) {
          await self.tell('You feel your body storing excess energy.');
        }
      }

      // 4b. Status effect decay and processing
      results.effects = {};
      if (self.decayEffects) {
        results.effects.decayed = await self.decayEffects();

        // Check for nausea/vomiting
        if (self.checkNausea) {
          const nauseaCheck = await self.checkNausea();
          if (nauseaCheck.vomit) {
            await self.tell('You vomit violently!');
            // Empty stomach contents
            const torso = self.getTorso ? await self.getTorso() : null;
            if (torso) {
              const stomach = torso.getPart ? await torso.getPart('digestiveStomach') : null;
              if (stomach && stomach.contents) {
                for (const item of [...stomach.contents]) {
                  if (item && $.recycler) {
                    await $.recycler.recycle(item);
                  }
                }
                stomach.contents = [];
              }
            }
            // Reduce nausea after vomiting
            await self.reduceEffect('nausea', 30);
            results.effects.vomited = true;
          }
        }

        // Check for dangerous drug combinations
        if (self.hasDangerousCombination) {
          const danger = await self.hasDangerousCombination();
          if (danger.reason) {
            await self.tell(danger.reason);
          }
          if (danger.dangerous) {
            // Cause heart damage
            const body = await self.getBody();
            if (body) {
              const currentDecay = body.decayLevel || 0;
              body.decayLevel = Math.min(100, currentDecay + 1);
              results.effects.heartDamage = true;
            }
          }
        }
      }

      // 5. Base metabolism - burn calories just for being alive
      // ~2000 kcal/day = ~1.4 kcal/minute = 2 cal/tick
      // Sleeping reduces burn rate by ~65%
      const baseRate = 2; // kcal per heartbeat (1 minute)
      const metabolismMultiplier = await self.getMetabolismMultiplier();
      const body = await self.getBody();

      if (body && self.burnCalories) {
        // Burn from body - cascades to fat → decay if needed
        const toBurn = baseRate * metabolismMultiplier;
        const burnResult = await self.burnCalories(toBurn, [body]);
        results.metabolism = burnResult.burned || 0;
      }

      // 5b. Hydration depletion - faster than calories (3 days vs 3 weeks)
      // 100% hydration depletes in 4320 ticks (72 hours) = ~0.023 per tick
      // Sleeping reduces depletion by 50% (less sweating)
      results.hydration = { depleted: 0, level: 100, status: 'hydrated' };
      if (body) {
        const hydrationRate = sleepState === 'asleep' ? 0.0115 : 0.023;
        const currentHydration = body.hydration ?? 100;
        const newHydration = Math.max(0, currentHydration - hydrationRate);
        body.hydration = newHydration;
        results.hydration.depleted = hydrationRate;
        results.hydration.level = newHydration;

        // When hydration hits 0, cascade to body decay (like starvation)
        if (newHydration <= 0) {
          // Severe dehydration damages the body directly
          // 2% decay per tick when fully dehydrated = death in ~50 ticks (under 1 hour)
          const currentDecay = body.decayLevel || 0;
          body.decayLevel = Math.min(100, currentDecay + 2);
          results.hydration.decaying = true;
        }

        // Calculate hydration status
        const maxHydration = body.maxHydration || 100;
        const hydrationPercent = (newHydration / maxHydration) * 100;
        if (hydrationPercent > 75) {
          results.hydration.status = 'hydrated';
        } else if (hydrationPercent > 50) {
          results.hydration.status = 'thirsty';
        } else if (hydrationPercent > 25) {
          results.hydration.status = 'dehydrated';
        } else if (hydrationPercent > 10) {
          results.hydration.status = 'severely dehydrated';
        } else {
          results.hydration.status = 'critical';
        }
      }

      // 6. Check for status changes and notify player
      const calorieStatus = await self.getCalorieStatus();
      const fatInfo = await self.getFat();

      // Notify on calorie status change (e.g., satisfied -> hungry)
      if (calorieStatus.status !== prevCalorieStatus) {
        self._lastCalorieStatus = calorieStatus.status;

        // Only notify if awake
        if (self.sleepState === 'awake') {
          const statusMessages = {
            'well-fed': 'You feel energized and well-fed.',
            'satisfied': 'You feel comfortable and satisfied.',
            'hungry': 'Your stomach rumbles. You could use a meal.',
            'very hungry': 'You feel very hungry. Your stomach growls loudly.',
            'starving': 'You feel weak and shaky from hunger.',
            'exhausted': 'You are completely drained, barely able to move.',
          };
          if (statusMessages[calorieStatus.status]) {
            await self.tell(statusMessages[calorieStatus.status]);
          }
        }
      }

      // Periodic hunger reminders (even without status change)
      if (self.sleepState === 'awake') {
        const hungerReminders = {
          'hungry': { chance: 0.05, messages: [
            'Your stomach growls quietly.',
            'You feel a bit hungry.',
            'You could use something to eat.',
          ]},
          'very hungry': { chance: 0.15, messages: [
            'Your stomach growls loudly.',
            'You really need to eat something.',
            'Hunger gnaws at your belly.',
            'Your hands tremble slightly from hunger.',
          ]},
          'starving': { chance: 0.3, messages: [
            'Your stomach cramps painfully.',
            'You feel faint from hunger.',
            'Your body screams for nourishment.',
            'Waves of weakness wash over you.',
            'You can barely focus through the hunger.',
          ]},
          'exhausted': { chance: 0.5, messages: [
            'Your body is shutting down from lack of energy.',
            'You can barely stay conscious.',
            'Every movement is agony.',
          ]},
        };

        const reminder = hungerReminders[calorieStatus.status];
        if (reminder && Math.random() < reminder.chance) {
          const msg = reminder.messages[Math.floor(Math.random() * reminder.messages.length)];
          await self.tell(msg);
        }

        // Thirst status change notifications
        const prevThirstStatus = self._lastThirstStatus || 'hydrated';
        const thirstStatus = results.hydration.status;
        if (thirstStatus !== prevThirstStatus) {
          self._lastThirstStatus = thirstStatus;
          const thirstMessages = {
            'hydrated': 'You feel well-hydrated.',
            'thirsty': 'You feel thirsty. You could use a drink.',
            'dehydrated': 'Your mouth is dry. You need water.',
            'severely dehydrated': 'You feel dizzy and weak from dehydration.',
            'critical': 'You are dying of thirst!',
          };
          if (thirstMessages[thirstStatus]) {
            await self.tell(thirstMessages[thirstStatus]);
          }
        }

        // Periodic thirst reminders
        const thirstReminders = {
          'thirsty': { chance: 0.08, messages: [
            'Your mouth feels dry.',
            'You lick your parched lips.',
            'You could use something to drink.',
          ]},
          'dehydrated': { chance: 0.2, messages: [
            'Your throat is painfully dry.',
            'You desperately need water.',
            'Your lips are cracked and dry.',
            'A headache throbs behind your eyes.',
          ]},
          'severely dehydrated': { chance: 0.4, messages: [
            'Your vision swims.',
            'You can barely swallow.',
            'Your body is shutting down from dehydration.',
            'Every breath burns your parched throat.',
          ]},
          'critical': { chance: 0.6, messages: [
            'You are dying of thirst.',
            'Your organs are failing from dehydration.',
            'You can barely stay conscious.',
          ]},
        };

        const thirstReminder = thirstReminders[thirstStatus];
        if (thirstReminder && Math.random() < thirstReminder.chance) {
          const msg = thirstReminder.messages[Math.floor(Math.random() * thirstReminder.messages.length)];
          await self.tell(msg);
        }
      }

      // Notify on fat status change
      if (fatInfo.status !== prevFatStatus) {
        self._lastFatStatus = fatInfo.status;

        if (self.sleepState === 'awake') {
          const fatMessages = {
            'lean': 'You feel lean and light.',
            'fit': 'You feel fit and healthy.',
            'soft': 'You notice your body has softened a bit.',
            'overweight': 'You feel heavier than usual.',
            'obese': 'You feel sluggish under your weight.',
            'morbidly obese': 'You feel extremely burdened by your weight.',
          };
          if (fatMessages[fatInfo.status]) {
            await self.tell(fatMessages[fatInfo.status]);
          }
        }
      }

      // 7. Check for calorie exhaustion -> collapse (separate from sleep debt)
      // This is when you have NO energy, not just tired
      if (calorieStatus.status === 'exhausted' && self.sleepState === 'awake') {
        await self.tell('You collapse from lack of energy...');
        await self.startSleep(2000); // Immediate collapse
      }

      // 8. Fitness XP from playtime (1 XP per 3 hours, max 3 XP/day)
      // Check if it's a new day
      const today = new Date().toDateString();
      if (self.fitnessLastDay !== today) {
        self.fitnessLastDay = today;
        self.fitnessXPToday = 0;
      }

      // Only earn XP if under daily cap
      if ((self.fitnessXPToday || 0) < 3) {
        // Add 1 minute of playtime
        const playtime = (self.fitnessPlaytime || 0) + 1;

        if (playtime >= 180) {
          // 3 hours reached - award 1 XP to pool
          self.fitnessPlaytime = 0;
          self.fitnessXPToday = (self.fitnessXPToday || 0) + 1;
          self.fitnessXP = (self.fitnessXP || 0) + 1;
          await self.tell('You earned 1 fitness XP! (Use @fitness to spend it)');
        } else {
          self.fitnessPlaytime = playtime;
        }
      }

      return results;
    `);

    // Register sleep/wake verbs
    obj.setMethod('sleep', `
      /** Go to sleep.
       *  Usage: sleep
       *  Begin falling asleep. Takes time and can be interrupted by noise.
       *  While asleep, you regenerate energy faster but cannot act.
       */
      if (!await player.isAwake()) {
        if (player.sleepState === 'falling_asleep') {
          return 'You are already trying to fall asleep.';
        } else if (player.sleepState === 'asleep') {
          return 'You are already asleep.';
        } else {
          return 'You are currently waking up.';
        }
      }

      const result = await player.startSleep();
      if (!result.success) {
        return result.reason;
      }

      return 'You close your eyes and begin to drift off to sleep...';
    `);

    obj.setMethod('wake', `
      /** Wake up from sleep.
       *  Usage: wake, wake up
       *  Begin waking up. Takes time and may be blocked by sedation or exhaustion.
       */
      if (player.sleepState === 'awake') {
        return 'You are already awake.';
      }

      if (player.sleepState === 'waking_up') {
        return 'You are already waking up.';
      }

      if (player.sleepState === 'falling_asleep') {
        // Cancel sleep attempt
        await player.cancelSleepTransition();
        player.sleepState = 'awake';
        return 'You stop yourself from falling asleep.';
      }

      // Actually asleep
      const result = await player.startWake();
      if (!result.success) {
        return result.reason;
      }

      return 'You begin to stir awake...';
    `);

    obj.setMethod('health', `
      /** Check your health status.
       *  Usage: health, hp, status
       *  Shows how you're feeling without exact numbers.
       */
      const lines = [];

      // Energy (calories)
      const body = await player.getBody();
      if (body) {
        const calories = body.calories || 0;
        const maxCalories = body.maxCalories || 2000;
        const energyMsg = await $.proportional.sub([
          'You feel completely drained, barely able to move.',
          'You feel weak and shaky from hunger.',
          'You feel very hungry. Your stomach growls.',
          'Your stomach rumbles. You could use a meal.',
          'You feel comfortable and satisfied.',
          'You feel energized and well-fed.',
        ], calories, maxCalories);
        lines.push(energyMsg);

        // Fat reserves
        const fat = body.fat || 0;
        const maxFat = body.maxFat || 100;
        if (fat > 0) {
          const fatMsg = await $.proportional.sub([
            'Your body has no reserves to draw on.',
            'You feel lean and light.',
            'You feel fit and healthy.',
            'Your body has softened a bit.',
            'You feel heavier than usual.',
            'You feel sluggish under your weight.',
          ], fat, maxFat);
          lines.push(fatMsg);
        }

        // Hydration
        const hydration = body.hydration ?? 100;
        const maxHydration = body.maxHydration || 100;
        const hydrationMsg = await $.proportional.sub([
          'You are dying of thirst!',
          'You feel dizzy and weak from dehydration.',
          'Your mouth is dry. You need water.',
          'You feel a bit thirsty.',
          'You feel well-hydrated.',
        ], hydration, maxHydration);
        lines.push(hydrationMsg);
      }

      // Tiredness (sleep debt)
      const sleepDebt = player.sleepDebt || 0;
      if (sleepDebt > 480) { // Only mention if notably tired (8+ hours awake)
        const tirednessMsg = await $.proportional.sub([
          'You feel well-rested.',
          'You feel alert and awake.',
          'You feel a bit tired.',
          'Your eyelids feel heavy.',
          'You are exhausted. Staying awake is difficult.',
          'You can barely keep your eyes open.',
        ], sleepDebt, 2400); // 40 hours as max for scale
        lines.push(tirednessMsg);
      } else {
        lines.push('You feel well-rested.');
      }

      // Sleep state
      if (player.sleepState === 'asleep') {
        lines.push('You are asleep.');
      } else if (player.sleepState === 'falling_asleep') {
        lines.push('You are nodding off...');
      } else if (player.sleepState === 'waking_up') {
        lines.push('You are waking up.');
      }

      // Bleeding
      if (player.bleedTick) {
        const bleedResult = await player.getAllBleedingParts ? await player.getAllBleedingParts() : [];
        if (bleedResult && bleedResult.length > 0) {
          let totalBleeding = 0;
          for (const { count } of bleedResult) {
            totalBleeding += count;
          }
          const bleedMsg = await $.proportional.sub([
            '',
            'You have a minor wound bleeding.',
            'You are bleeding from several wounds.',
            'You are bleeding badly.',
            'You are losing a lot of blood!',
          ], totalBleeding, 10);
          if (bleedMsg) lines.push(bleedMsg);
        }
      }

      // Breath (if underwater or recovering)
      const breath = player.breath ?? 100;
      const maxBreath = player.maxBreath || 100;
      if (breath < maxBreath) {
        const breathMsg = await $.proportional.sub([
          'You are drowning! You desperately need air!',
          'Your lungs burn! You are running out of air!',
          'You are holding your breath.',
          'You are catching your breath.',
          'You are breathing normally.',
        ], breath, maxBreath);
        lines.push(breathMsg);
      }

      // Status effects (substances, etc.)
      if (player.describeEffects) {
        const effectLines = await player.describeEffects();
        for (const line of effectLines) {
          lines.push(line);
        }
      }

      // Body decay (serious damage)
      if (player.getTotalBodyDecay) {
        const decayInfo = await player.getTotalBodyDecay();
        if (decayInfo.percentage > 5) {
          const decayMsg = await $.proportional.sub([
            'Your body is healthy.',
            'You have some minor injuries.',
            'Your body has taken significant damage.',
            'You are seriously injured.',
            'You are critically wounded!',
            'You are dying!',
          ], decayInfo.percentage, 50); // 50% = death
          lines.push(decayMsg);
        }
      }

      return lines.join('\\r\\n');
    `);

    // Sleep notification hooks - override Agent's empty ones
    obj.setMethod('onFellAsleep', `
      await self.tell('You fall asleep.');
    `);

    obj.setMethod('onWokeUp', `
      await self.tell('You wake up.');
      await self.print('> ');
    `);

    obj.setMethod('onSleepInterrupted', `
      const reason = args[0];
      await self.tell(reason || 'Your sleep is interrupted!');
    `);

    obj.setMethod('onWakeBlocked', `
      const reason = args[0];
      await self.tell(reason || 'You fall back asleep.');
    `);

    // Called when player dies - body becomes corpse, player goes to chargen
    obj.setMethod('onDeath', `
      /** Called when the player dies and their body becomes a corpse.
       *  @param corpse - The corpse object created from the body
       */
      const corpse = args[0];

      // Final death message
      await self.tell('');
      await self.tell('You have died.');
      await self.tell('');

      // Unregister all verbs
      self.verbs = {};

      // Clear body reference
      self.bodyId = null;

      // Disconnect from old location
      if (self.location) {
        const location = self.location;
        if (location && location.removeContent) {
          await location.removeContent(self.id);
        }
        self.location = null;
      }

      // Reset player state for new character
      self.isDying = false;
      self.dyingProgress = 0;
      self.sleepState = 'awake';
      self.sleepDebt = 0;
      self.statusEffects = {};

      // Check for clone backup
      const cloneTank = self.cloneBackupTank;
      const hasBackup = cloneTank && await cloneTank.hasBackup(self);
      
      if (hasBackup) {
        // Get backup info for display
        const backup = await cloneTank.getBackup(self);
        const backupDate = backup?.backupTimestamp 
          ? new Date(backup.backupTimestamp).toLocaleString()
          : 'unknown';
        
        // Enter death funnel with clone option
        self._deathFunnelState = 'choosing';
        self._deathFunnelCorpse = corpse;
        
        await self.tell('=== DEATH OPTIONS ===');
        await self.tell('');
        await self.tell('1. RESURRECT FROM CLONE');
        await self.tell('   Tank: ' + (cloneTank.name || 'Clone Tank'));
        await self.tell('   Last backup: ' + backupDate);
        await self.tell('   WARNING: You will only have memories up to this backup.');
        await self.tell('   Everything after that moment is permanently lost.');
        await self.tell('');
        await self.tell('2. CREATE NEW CHARACTER');
        await self.tell('   Start fresh with a new identity.');
        await self.tell('   Your backup data will remain for later use.');
        await self.tell('');
        await self.tell('Type CLONE or NEW to choose.');
        
        // Register death funnel verbs
        await self.registerVerb(['clone', 'resurrect', '1'], self, 'deathFunnelClone');
        await self.registerVerb(['new', 'new character', '2'], self, 'deathFunnelNew');
        
      } else {
        // No backup - go straight to chargen
        await self.tell('You have no clone backup. Your story ends here.');
        await self.tell('');
        
        // Send to chargen for new character
        if (self._context && $.charGen) {
          await self.tell('Creating a new character...');
          await self.tell('');
          await $.charGen.start(self._context, self);
        } else if (self._context) {
          await self.tell('Please reconnect to create a new character.');
          self._context.close();
        }
      }
    `);
    
    // Death funnel: player chose to resurrect from clone
    obj.setMethod('deathFunnelClone', `
      /** Handle player choosing to resurrect from clone. */
      if (self._deathFunnelState !== 'choosing') {
        await self.tell('You are not at the death screen.');
        return;
      }
      
      const cloneTank = self.cloneBackupTank;
      if (!cloneTank) {
        await self.tell('Error: No clone tank found. Proceeding to new character...');
        await self.deathFunnelNew();
        return;
      }
      
      // Clear death funnel state
      self._deathFunnelState = null;
      self._deathFunnelCorpse = null;
      
      // Unregister death funnel verbs
      await self.unregisterVerb('clone');
      await self.unregisterVerb('resurrect');
      await self.unregisterVerb('1');
      await self.unregisterVerb('new');
      await self.unregisterVerb('new character');
      await self.unregisterVerb('2');
      
      await self.tell('');
      await self.tell('Initiating resurrection sequence...');
      await self.tell('');
      
      // Begin resurrection (this sets up the timer)
      const result = await cloneTank.beginResurrection(self);
      
      if (!result.success) {
        await self.tell('Resurrection failed: ' + result.message);
        await self.tell('Proceeding to new character...');
        await self.deathFunnelNew();
        return;
      }
      
      await self.tell('Clone growth initiated.');
      await self.tell('Estimated time: ' + (result.estimatedTime || 5) + ' minutes.');
      await self.tell('');
      await self.tell('Your consciousness drifts in darkness...');
      await self.tell('Fragments of memory reassemble...');
      await self.tell('');
      await self.tell('You will awaken when the process completes.');
      
      // The tank's tick() will call completeResurrection() when ready
      // which will place the player in the tank's room with a new body
    `);
    
    // Death funnel: player chose to create new character
    obj.setMethod('deathFunnelNew', `
      /** Handle player choosing to create a new character instead of cloning. */
      if (self._deathFunnelState === 'choosing') {
        // Clear death funnel state
        self._deathFunnelState = null;
        self._deathFunnelCorpse = null;
        
        // Unregister death funnel verbs
        await self.unregisterVerb('clone');
        await self.unregisterVerb('resurrect');
        await self.unregisterVerb('1');
        await self.unregisterVerb('new');
        await self.unregisterVerb('new character');
        await self.unregisterVerb('2');
      }
      
      await self.tell('');
      await self.tell('You release your hold on this life.');
      await self.tell('Your backup remains stored, awaiting a future that will never come.');
      await self.tell('');
      
      // Send to chargen for new character
      if (self._context && $.charGen) {
        await self.tell('Creating a new character...');
        await self.tell('');
        await $.charGen.start(self._context, self);
      } else if (self._context) {
        await self.tell('Please reconnect to create a new character.');
        self._context.close();
      }
    `);

    // Override canFallAsleep to check for combat, etc.
    obj.setMethod('canFallAsleep', `
      // Can't sleep if already in a sleep state
      if (self.sleepState !== 'awake') {
        return { allowed: false, reason: 'You are already sleeping or trying to.' };
      }

      // TODO: Check if in combat
      // TODO: Check room noise level

      return { allowed: true };
    `);

    // Override canWakeUp to check exhaustion
    obj.setMethod('canWakeUp', `
      // Can't wake if sedated
      if ((self.sedation || 0) > 0) {
        return { allowed: false, reason: 'You are too sedated to wake.' };
      }

      // Can't wake if too exhausted
      const calorieStatus = await self.getCalorieStatus();
      if (calorieStatus.status === 'exhausted') {
        return { allowed: false, reason: 'You are too exhausted to wake. You need rest.' };
      }

      return { allowed: true };
    `);
  }

  private addFitnessMethods(obj: RuntimeObject): void {
    // @fitness verb - enter the fitness menu
    obj.setMethod('fitness', `
      /** Open the fitness training menu.
       *  Usage: @fitness
       *  Manage your physical training goals.
       */
      self._inFitnessMenu = true;
      await self.showFitnessMenu();
    `);

    // Show the fitness menu
    obj.setMethod('showFitnessMenu', `
      const xpPool = self.fitnessXP || 0;

      await self.tell('');
      await self.tell('=== FITNESS TRAINING ===');
      await self.tell('');
      await self.tell('Available XP: ' + xpPool);

      // Show daily XP info
      const xpToday = self.fitnessXPToday || 0;
      const playtime = self.fitnessPlaytime || 0;
      const hoursPlayed = Math.floor(playtime / 60);
      const minsPlayed = playtime % 60;
      const minsRemaining = 60 - minsPlayed;
      const hoursRemaining = 2 - hoursPlayed;
      if (xpToday >= 3) {
        await self.tell('Daily XP: 3/3 (maxed for today)');
      } else {
        await self.tell('Daily XP: ' + xpToday + '/3 (next in ' + hoursRemaining + 'h ' + minsRemaining + 'm)');
      }
      await self.tell('');

      // Show current body part capacities with XP cost
      await self.tell('Body Parts (cost to advance):');
      await self.tell('');

      const body = await self.getBody();
      if (body) {
        // Get head parts
        const head = await body.getPart('head');
        if (head) {
          const headMax = head.maxCalories || 100;
          const headCost = await self.getFitnessXPNeeded('head');
          await self.tell('  [1] Head: ' + headMax + ' cal (cost: ' + headCost + ' XP)');

          const face = await head.getPart('face');
          if (face) {
            const leftEye = await face.getPart('leftEye');
            const rightEye = await face.getPart('rightEye');
            const leftEar = await face.getPart('leftEar');
            const rightEar = await face.getPart('rightEar');

            if (leftEye || rightEye) {
              const eyeMax = Math.max(leftEye?.maxCalories || 100, rightEye?.maxCalories || 100);
              const eyeCost = await self.getFitnessXPNeeded('eyes');
              await self.tell('  [2] Eyes: ' + eyeMax + ' cal (cost: ' + eyeCost + ' XP)');
            }
            if (leftEar || rightEar) {
              const earMax = Math.max(leftEar?.maxCalories || 100, rightEar?.maxCalories || 100);
              const earCost = await self.getFitnessXPNeeded('ears');
              await self.tell('  [3] Ears: ' + earMax + ' cal (cost: ' + earCost + ' XP)');
            }
          }
        }

        // Get torso
        const torso = await body.getPart('torso');
        if (torso) {
          const torsoMax = torso.maxCalories || 100;
          const torsoCost = await self.getFitnessXPNeeded('torso');
          await self.tell('  [4] Torso: ' + torsoMax + ' cal (cost: ' + torsoCost + ' XP)');
        }

        // Get limbs
        const leftArm = await body.getPart('leftArm');
        const rightArm = await body.getPart('rightArm');
        if (leftArm || rightArm) {
          const armMax = Math.max(leftArm?.maxCalories || 100, rightArm?.maxCalories || 100);
          const armCost = await self.getFitnessXPNeeded('arms');
          await self.tell('  [5] Arms: ' + armMax + ' cal (cost: ' + armCost + ' XP)');
        }

        const leftHand = leftArm ? await leftArm.getPart('hand') : null;
        const rightHand = rightArm ? await rightArm.getPart('hand') : null;
        if (leftHand || rightHand) {
          const handMax = Math.max(leftHand?.maxCalories || 100, rightHand?.maxCalories || 100);
          const handCost = await self.getFitnessXPNeeded('hands');
          await self.tell('  [6] Hands: ' + handMax + ' cal (cost: ' + handCost + ' XP)');
        }

        const leftLeg = await body.getPart('leftLeg');
        const rightLeg = await body.getPart('rightLeg');
        if (leftLeg || rightLeg) {
          const legMax = Math.max(leftLeg?.maxCalories || 100, rightLeg?.maxCalories || 100);
          const legCost = await self.getFitnessXPNeeded('legs');
          await self.tell('  [7] Legs: ' + legMax + ' cal (cost: ' + legCost + ' XP)');
        }

        const leftFoot = leftLeg ? await leftLeg.getPart('foot') : null;
        const rightFoot = rightLeg ? await rightLeg.getPart('foot') : null;
        if (leftFoot || rightFoot) {
          const footMax = Math.max(leftFoot?.maxCalories || 100, rightFoot?.maxCalories || 100);
          const footCost = await self.getFitnessXPNeeded('feet');
          await self.tell('  [8] Feet: ' + footMax + ' cal (cost: ' + footCost + ' XP)');
        }
      }

      await self.tell('');
      await self.tell('Enter 1-8 to spend XP, or q to exit.');
      await self.tell('');
    `);

    // Handle fitness menu input
    obj.setMethod('handleFitnessInput', `
      const input = args[0].toLowerCase().trim();

      const partMap = {
        '1': 'head',
        '2': 'eyes',
        '3': 'ears',
        '4': 'torso',
        '5': 'arms',
        '6': 'hands',
        '7': 'legs',
        '8': 'feet',
      };

      if (input === 'q' || input === 'quit' || input === 'exit') {
        self._inFitnessMenu = false;
        await self.tell('Exiting fitness menu.');
        await self.print('> ');
        return;
      }

      if (partMap[input]) {
        const part = partMap[input];
        const result = await self.spendFitnessXP(part);
        if (result.success) {
          await self.tell('Your ' + part + ' capacity increased to ' + result.newCapacity + ' cal!');
        } else {
          await self.tell(result.reason);
        }
        await self.showFitnessMenu();
        return;
      }

      await self.tell('Invalid option. Enter 1-8 or q.');
    `);

    // Add fitness XP (called when body parts are used)
    // Get current capacity for a fitness goal
    obj.setMethod('getFitnessCapacity', `
      /** Get the current maxCalories for a fitness goal.
       *  @param goal - The body part goal name
       *  @returns Current maxCalories (highest of paired parts)
       */
      const goal = args[0];
      const body = await self.getBody();
      if (!body) return 100;

      if (goal === 'head') {
        const head = await body.getPart('head');
        return head?.maxCalories || 100;
      } else if (goal === 'torso') {
        const torso = await body.getPart('torso');
        return torso?.maxCalories || 100;
      } else if (goal === 'arms') {
        const leftArm = await body.getPart('leftArm');
        const rightArm = await body.getPart('rightArm');
        return Math.max(leftArm?.maxCalories || 100, rightArm?.maxCalories || 100);
      } else if (goal === 'hands') {
        const leftArm = await body.getPart('leftArm');
        const rightArm = await body.getPart('rightArm');
        const leftHand = leftArm ? await leftArm.getPart('hand') : null;
        const rightHand = rightArm ? await rightArm.getPart('hand') : null;
        return Math.max(leftHand?.maxCalories || 100, rightHand?.maxCalories || 100);
      } else if (goal === 'legs') {
        const leftLeg = await body.getPart('leftLeg');
        const rightLeg = await body.getPart('rightLeg');
        return Math.max(leftLeg?.maxCalories || 100, rightLeg?.maxCalories || 100);
      } else if (goal === 'feet') {
        const leftLeg = await body.getPart('leftLeg');
        const rightLeg = await body.getPart('rightLeg');
        const leftFoot = leftLeg ? await leftLeg.getPart('foot') : null;
        const rightFoot = rightLeg ? await rightLeg.getPart('foot') : null;
        return Math.max(leftFoot?.maxCalories || 100, rightFoot?.maxCalories || 100);
      } else if (goal === 'eyes') {
        const head = await body.getPart('head');
        const face = head ? await head.getPart('face') : null;
        if (!face) return 100;
        const leftEye = await face.getPart('leftEye');
        const rightEye = await face.getPart('rightEye');
        return Math.max(leftEye?.maxCalories || 100, rightEye?.maxCalories || 100);
      } else if (goal === 'ears') {
        const head = await body.getPart('head');
        const face = head ? await head.getPart('face') : null;
        if (!face) return 100;
        const leftEar = await face.getPart('leftEar');
        const rightEar = await face.getPart('rightEar');
        return Math.max(leftEar?.maxCalories || 100, rightEar?.maxCalories || 100);
      }
      return 100;
    `);

    // Calculate XP needed for next level based on current capacity
    obj.setMethod('getFitnessXPNeeded', `
      /** Calculate XP needed to advance based on current level.
       *  Uses 2*level - 1 formula where level = (maxCalories - 90) / 10
       *  Level 1 (100 cal) = 1 XP, Level 2 (110 cal) = 3 XP, etc.
       *  @param goal - The body part goal name
       *  @returns XP needed for next advancement
       */
      const goal = args[0];
      const capacity = await self.getFitnessCapacity(goal);
      const level = Math.floor((capacity - 90) / 10); // 100 cal = level 1
      return (2 * level) - 1;
    `);

    // Spend XP to advance a body part
    obj.setMethod('spendFitnessXP', `
      /** Spend XP from pool to advance a body part.
       *  @param part - The body part to advance
       *  @returns { success, reason?, newCapacity? }
       */
      const part = args[0];
      const xpPool = self.fitnessXP || 0;
      const xpNeeded = await self.getFitnessXPNeeded(part);

      if (xpPool < xpNeeded) {
        return { success: false, reason: 'Not enough XP. Need ' + xpNeeded + ', have ' + xpPool + '.' };
      }

      // Deduct XP
      self.fitnessXP = xpPool - xpNeeded;

      const body = await self.getBody();
      if (!body) return { success: false, reason: 'No body found.' };

      const boostAmount = 10; // +10 maxCalories per advancement

      // Helper to boost a part (only increases max, not current calories)
      const boostPart = async (partObj) => {
        if (partObj) {
          const current = partObj.maxCalories || 100;
          partObj.maxCalories = current + boostAmount;
        }
      };

      // Boost the appropriate parts
      if (part === 'head') {
        const head = await body.getPart('head');
        await boostPart(head);
      } else if (part === 'torso') {
        const torso = await body.getPart('torso');
        await boostPart(torso);
      } else if (part === 'arms') {
        const leftArm = await body.getPart('leftArm');
        const rightArm = await body.getPart('rightArm');
        await boostPart(leftArm);
        await boostPart(rightArm);
      } else if (part === 'hands') {
        const leftArm = await body.getPart('leftArm');
        const rightArm = await body.getPart('rightArm');
        const leftHand = leftArm ? await leftArm.getPart('hand') : null;
        const rightHand = rightArm ? await rightArm.getPart('hand') : null;
        await boostPart(leftHand);
        await boostPart(rightHand);
      } else if (part === 'legs') {
        const leftLeg = await body.getPart('leftLeg');
        const rightLeg = await body.getPart('rightLeg');
        await boostPart(leftLeg);
        await boostPart(rightLeg);
      } else if (part === 'feet') {
        const leftLeg = await body.getPart('leftLeg');
        const rightLeg = await body.getPart('rightLeg');
        const leftFoot = leftLeg ? await leftLeg.getPart('foot') : null;
        const rightFoot = rightLeg ? await rightLeg.getPart('foot') : null;
        await boostPart(leftFoot);
        await boostPart(rightFoot);
      } else if (part === 'eyes') {
        const head = await body.getPart('head');
        const face = head ? await head.getPart('face') : null;
        if (face) {
          const leftEye = await face.getPart('leftEye');
          const rightEye = await face.getPart('rightEye');
          await boostPart(leftEye);
          await boostPart(rightEye);
        }
      } else if (part === 'ears') {
        const head = await body.getPart('head');
        const face = head ? await head.getPart('face') : null;
        if (face) {
          const leftEar = await face.getPart('leftEar');
          const rightEar = await face.getPart('rightEar');
          await boostPart(leftEar);
          await boostPart(rightEar);
        }
      }

      const newCapacity = await self.getFitnessCapacity(part);
      return { success: true, newCapacity };
    `);
  }

  private addInventoryMethods(obj: RuntimeObject): void {
    // Helper to get all worn items
    obj.setMethod('getWornItems', `
      /** Get all items currently worn by the player.
       *  Traverses body parts to find worn items.
       *  @returns Array of { item: RuntimeObject, part: string }
       */
      const body = await self.getBody();
      if (!body) return [];

      const worn = [];
      const checkedParts = new Set(); // Avoid cycles

      // Recursive helper to traverse body parts
      const checkPart = async (part) => {
        if (!part || checkedParts.has(part.id)) return;
        checkedParts.add(part.id);

        // Check worn items on this part
        if (part.worn && part.worn.length > 0) {
          for (const item of part.worn) {
            if (item) {
              worn.push({ item, part: part.name });
            }
          }
        }

        // Recursively check sub-parts
        const subPartNames = [
          'head', 'face', 'neck',
          'rightShoulder', 'leftShoulder',
          'arm', 'forearm', 'hand',
          'rightThigh', 'leftThigh',
          'knee', 'leg', 'foot'
        ];

        for (const name of subPartNames) {
          // Use getPart to safely access sub-parts
          if (part.getPart) {
            const subPart = await part.getPart(name);
            if (subPart) {
              await checkPart(subPart);
            }
          }
        }
      };

      await checkPart(body);
      return worn;
    `);

    // Pattern: inventory, i - show held and worn items
    obj.setMethod('inventory', `
      /** Show inventory (held and worn items).
       *  Usage: inventory, i
       *  Displays a natural language description of what you are holding and wearing.
       */
      
      // 1. COLLECT HELD ITEMS
      const hands = await self.getHands();
      const body = await self.getBody();
      const primaryHand = body?.primaryHand || 'right';
      
      const holdingClauses = [];
      let holdingCount = 0;

      // Helper to process a hand
      const checkHand = async (hand, side) => {
        if (!hand) return;
        const contents = hand.contents || [];
        if (contents.length > 0) {
          // Get names of items in this hand
          const itemNames = [];
          for (const c of contents) {
            // content can be ID or object
            const item = typeof c === 'object' ? c : await $load(c);
            if (item) itemNames.push(item.name);
          }
          if (itemNames.length > 0) {
            const list = await $.format.prose(itemNames);
            holdingClauses.push('you are holding ' + list + ' in your ' + side + ' hand');
            holdingCount += itemNames.length;
          } else {
            holdingClauses.push('your ' + side + ' hand is empty');
          }
        } else {
          holdingClauses.push('your ' + side + ' hand is empty');
        }
      };

      // Check primary then secondary
      const secondaryHand = primaryHand === 'right' ? 'left' : 'right';
      
      if (hands.primary) await checkHand(hands.primary, primaryHand);
      if (hands.secondary) await checkHand(hands.secondary, secondaryHand);

      // Simplify if both hands are empty
      if (holdingCount === 0) {
        holdingClauses.length = 0; // Clear
        holdingClauses.push('your hands are empty');
      }

      // 2. COLLECT WORN ITEMS
      const wornItems = await self.getWornItems(); // Array of { item, part }
      const wearingClauses = [];

      if (wornItems.length > 0) {
        // Dedup items and aggregate parts
        const uniqueItems = new Map(); // id -> { name, parts: [] }
        
        for (const { item, part } of wornItems) {
          if (!uniqueItems.has(item.id)) {
            uniqueItems.set(item.id, { name: item.name, parts: new Set() });
          }
          uniqueItems.get(item.id).parts.add(part);
        }

        const descriptions = [];
        for (const [id, data] of uniqueItems) {
          // Convert parts set to list
          const partList = Array.from(data.parts);
          const partDesc = await $.format.prose(partList);
          descriptions.push(data.name + ' on your ' + partDesc);
        }
        
        const wornList = await $.format.prose(descriptions);
        wearingClauses.push('you are wearing ' + wornList);
      }

      // 3. COLLECT POCKET CONTENTS
      const pocketClauses = [];
      
      for (const { item: worn } of wornItems) {
        const pockets = worn.pockets || [];
        for (const pocket of pockets) {
          if (!pocket) continue;
          const contents = pocket.contents || [];
          if (contents.length > 0) {
            const itemNames = [];
            for (const c of contents) {
              const pItem = typeof c === 'object' ? c : await $load(c);
              if (pItem) {
                // Use shortDesc if available (for stackables like cash)
                const desc = pItem.shortDesc ? await pItem.shortDesc() : pItem.name;
                itemNames.push(desc);
              }
            }
            if (itemNames.length > 0) {
              const list = await $.format.prose(itemNames);
              const pocketName = pocket.name || 'pocket';
              const garmentName = worn.name || 'clothing';
              pocketClauses.push(list + ' in your ' + garmentName + ' ' + pocketName.toLowerCase());
            }
          }
        }
      }

      // 4. ASSEMBLE NARRATIVE
      let text = '';
      
      if (holdingClauses.length > 0) {
        const joinedHolding = await $.format.prose(holdingClauses);
        text += joinedHolding;
      }
      
      if (wearingClauses.length > 0) {
        if (text) text += ', and ';
        text += wearingClauses.join(', ');
      } else {
        if (text) text += ', and ';
        text += 'you are not wearing anything';
      }
      
      if (text) {
        // Capitalize sentence start
        text = text.charAt(0).toUpperCase() + text.slice(1) + '.';
        await self.tell(text);
      } else {
        await self.tell('You represent a metaphysical void.');
      }
      
      // Show pocket contents separately (cleaner than cramming into one sentence)
      if (pocketClauses.length > 0) {
        await self.tell('');
        await self.tell('Pocketed: ' + pocketClauses.join('; ') + '.');
      }
    `);

    // ═══════════════════════════════════════════════════════════════════
    // POCKET COMMANDS
    // ═══════════════════════════════════════════════════════════════════

    // pocket X - put held item into first available pocket
    obj.setMethod('pocket', `
      /** Put an item from your hand into a pocket.
       *  Usage: pocket <item>, stash <item>, put <item> in pocket
       *  Finds the first pocket with space and puts the item there.
       */
      const item = args[0]; // resolved from %i

      if (!item) {
        return 'Pocket what?';
      }

      // Check item is in hand
      const hands = await self.getHands();
      let foundInHand = null;

      for (const hand of hands.both || []) {
        if (!hand) continue;
        const contents = hand.contents || [];
        for (const c of contents) {
          if (c && c.id === item.id) {
            foundInHand = hand;
            break;
          }
        }
        if (foundInHand) break;
      }

      if (!foundInHand) {
        return 'You are not holding ' + item.name + '.';
      }

      // Find a pocket with space
      const wornItems = await self.getWornItems();

      for (const { item: worn } of wornItems) {
        const pockets = worn.pockets || [];
        for (const pocket of pockets) {
          if (!pocket) continue;
          const canContain = await pocket.canContain(item);
          if (canContain === true) {
            await item.moveTo(pocket);
            return 'You slip ' + item.name + ' into your ' + pocket.name + '.';
          }
        }
      }

      return 'You have no pocket that can hold ' + item.name + '.';
    `);

    // pocket X in Y - put held item into specific pocket
    obj.setMethod('pocketIn', `
      /** Put an item from your hand into a specific pocket.
       *  Usage: pocket <item> in <pocket>, put <item> in <pocket>
       *  The pocket can be referenced by name or the clothing item.
       */
      const item = args[0]; // resolved from %i
      const target = args[1]; // resolved from %t

      if (!item) {
        return 'Pocket what?';
      }

      if (!target) {
        return 'Put it in what?';
      }

      // Check item is in hand
      const hands = await self.getHands();
      let foundInHand = null;

      for (const hand of hands.both || []) {
        if (!hand) continue;
        const contents = hand.contents || [];
        for (const c of contents) {
          if (c && c.id === item.id) {
            foundInHand = hand;
            break;
          }
        }
        if (foundInHand) break;
      }

      if (!foundInHand) {
        return 'You are not holding ' + item.name + '.';
      }

      // Target could be a pocket directly, or clothing with pockets
      let targetPocket = null;

      // Check if target is a pocket
      if (target.maxWeight !== undefined && target.maxVolume !== undefined) {
        // Looks like a pocket
        targetPocket = target;
      } else if (target.pockets && target.pockets.length > 0) {
        // It's clothing - find first available pocket
        for (const pocket of target.pockets) {
          if (pocket) {
            const canContain = await pocket.canContain(item);
            if (canContain === true) {
              targetPocket = pocket;
              break;
            }
          }
        }
        if (!targetPocket) {
          return target.name + ' has no pocket that can hold ' + item.name + '.';
        }
      } else {
        return target.name + ' has no pockets.';
      }

      // Check if pocket can hold the item
      const canContain = await targetPocket.canContain(item);
      if (canContain !== true) {
        return canContain; // Return the error message
      }

      await item.moveTo(targetPocket);
      return 'You slip ' + item.name + ' into your ' + targetPocket.name + '.';
    `);

    // hold X - take item from pocket into hand
    obj.setMethod('hold', `
      /** Take an item from your pocket into your hand.
       *  Usage: hold <item>, draw <item>, unholster <item>
       *  Finds the item in your pockets and moves it to a free hand.
       */
      const item = args[0]; // resolved from %i

      if (!item) {
        return 'Hold what?';
      }

      // Find item in pockets
      let foundInPocket = null;
      const wornItems = await self.getWornItems();

      for (const { item: worn } of wornItems) {
        const pockets = worn.pockets || [];
        for (const pocket of pockets) {
          if (!pocket) continue;
          const contents = pocket.contents || [];
          for (const c of contents) {
            if (c && c.id === item.id) {
              foundInPocket = pocket;
              break;
            }
          }
          if (foundInPocket) break;
        }
        if (foundInPocket) break;
      }

      if (!foundInPocket) {
        // Maybe it's already in hand or somewhere else
        const hands = await self.getHands();
        for (const hand of hands.both || []) {
          if (!hand) continue;
          const contents = hand.contents || [];
          for (const c of contents) {
            if (c && c.id === item.id) {
              return 'You are already holding ' + item.name + '.';
            }
          }
        }
        return item.name + ' is not in your pockets.';
      }

      // Find free hand
      const hands = await self.getHands();
      let targetHand = null;

      if (hands.primary) {
        const canContain = await hands.primary.canContain(item);
        if (canContain === true) {
          targetHand = hands.primary;
        }
      }

      if (!targetHand && hands.secondary) {
        const canContain = await hands.secondary.canContain(item);
        if (canContain === true) {
          targetHand = hands.secondary;
        }
      }

      if (!targetHand) {
        return 'Your hands are full.';
      }

      await item.moveTo(targetHand);
      return 'You draw ' + item.name + ' from your ' + foundInPocket.name + '.';
    `);

    // ═══════════════════════════════════════════════════════════════════
    // COMBAT COMMANDS
    // ═══════════════════════════════════════════════════════════════════

    // attack X / fight X - initiate or join combat
    obj.setMethod('attack', `
      /** Attack another character, initiating combat.
       *  Usage: attack <target>, fight <target>
       *  If the target is already in combat, you join that combat.
       */
      const target = args[0]; // resolved from %i

      if (!target) {
        return 'Attack who?';
      }

      if (target.id === self.id) {
        return 'You cannot attack yourself.';
      }

      // Check if target is attackable (has a body, is conscious, etc.)
      if (!target.getBody) {
        return 'You cannot attack ' + target.name + '.';
      }

      // Check if we're already in combat
      const ourCombat = await $.combat.getCombatByParticipant(self);
      if (ourCombat) {
        return 'You are already in combat! Use "action <what you do>" to act.';
      }

      // Check if target is already in combat - if so, join
      const theirCombat = await $.combat.getCombatByParticipant(target);
      if (theirCombat) {
        const result = await $.combat.join(theirCombat.id, self);
        if (result.error) {
          return result.error;
        }
        return null; // Combat system handles messaging
      }

      // Start new combat
      const result = await $.combat.initiate(self, target);
      if (result.error) {
        return result.error;
      }

      return null; // Combat system handles messaging
    `);

    // action <text> - submit combat action
    obj.setMethod('combatAction', `
      /** Submit your action for the current combat round.
       *  Usage: action <what you do>
       *  Example: action I swing my knife at his throat
       *  Example: action I dodge to the left and kick at his knee
       */
      const actionText = args[0]; // from %s

      if (!actionText) {
        return 'What do you do? Usage: action <description of your action>';
      }

      // Check if we're in combat
      const combat = await $.combat.getCombatByParticipant(self);
      if (!combat) {
        return 'You are not in combat.';
      }

      // Submit the action
      const result = await $.combat.submitAction(combat.id, self, actionText);
      if (result.error) {
        return result.error;
      }

      return null; // submitAction handles messaging
    `);
  }
}
