import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Player prototype
 * Base prototype for player characters with authentication and command handling
 */
export class PlayerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(humanId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: humanId,
      properties: {
        name: 'Player',
        description: 'Base prototype for player characters',

        // Authentication
        playername: '',
        email: '',
        passwordHash: '',
        sslFingerprint: '',
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
      },
      methods: {},
    });

    this.addConnectionMethods(obj);
    this.addInputMethods(obj);
    this.addAuthMethods(obj);
    this.addActionMethods(obj);

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
      await self.registerVerb(['emote %s', ':%s'], self, 'emote');
      await self.registerVerb('quit', self);
      await self.registerVerb(['@options', '@options %s', '@options %s %s'], self, 'options');
      await self.registerVerb(['get %i', 'take %i', 'pick up %i', 'grab %i'], self, 'get');
      await self.registerVerb(['lift %i', 'heft %i'], self, 'lift');
      await self.registerVerb(['drag %i'], self, 'drag');
      await self.registerVerb(['drop %i', 'put down %i', 'release %i'], self, 'drop');
      await self.registerVerb(['help', 'help %s', '?', '? %s'], self, 'help');
      await self.registerVerb(['sleep', 'go to sleep'], self, 'sleep');
      await self.registerVerb(['wake', 'wake up'], self, 'wake');

      // If we have a location, move into it to trigger verb registration
      if (self.location && self.location !== 0) {
        const location = await $.load(self.location);
        if (location) {
          // Trigger onArrived to register room verbs
          await self.onArrived(location, null, null);
          // Show room description (visual - uses see)
          const desc = await location.describe(self);
          await self.tell('');
          await self.see(desc);
        }
      }

      // Set up command loop - player handles their own input now
      context.setHandler(self);

      // Show prompt (system - uses tell)
      await self.tell('> ');
    `);

    obj.setMethod('disconnect', `
      // Unregister all verbs from current location
      if (self.location && self.location !== 0) {
        const location = await $.load(self.location);
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
  }

  private addInputMethods(obj: RuntimeObject): void {
    obj.setMethod('onInput', `
      const context = args[0];
      const input = args[1];

      const trimmed = input.trim();

      // Check if in prompt state ($.prompt handles questions, choices, yesorno)
      if (await $.prompt.isActive(self)) {
        await $.prompt.handleInput(self, trimmed);
        await self.tell('> ');
        return;
      }

      // Check if in options menu
      if (self._inOptionsMenu) {
        await self.handleOptionsInput(trimmed);
        return;
      }

      if (!trimmed) {
        await self.tell('> ');
        return;
      }

      // Check sleep state - only "wake" allowed while asleep
      const sleepState = self.sleepState || 'awake';
      if (sleepState !== 'awake') {
        const firstWord = trimmed.split(/\\s+/)[0].toLowerCase();
        const wakeCommands = ['wake', 'quit'];

        if (!wakeCommands.includes(firstWord)) {
          if (sleepState === 'asleep') {
            await self.tell('You are asleep. Type "wake" to wake up.');
          } else if (sleepState === 'falling_asleep') {
            await self.tell('You are falling asleep. Type "wake" to stay awake.');
          } else if (sleepState === 'waking_up') {
            await self.tell('You are waking up. Please wait...');
          }
          return;
        }
      }

      try {
        // Match input against registered verb patterns
        const match = await self.matchVerb(trimmed);

        if (match && match.error) {
          // Pattern matched but resolution failed (ambiguous item, not found)
          await self.tell(match.error);
        } else if (match && match.handler) {
          // Found matching pattern - dispatch to handler
          // Method receives: self=handler, player=self, command=trimmed, args=resolved
          const result = await match.handler.call(
            match.verbInfo.method,
            context,
            self,           // player
            trimmed,        // command (raw input)
            ...match.args   // resolved %i, %t, %s in pattern order
          );
          if (result !== undefined) {
            await self.tell(result);
          }
        } else {
          // No matching pattern found
          const firstWord = trimmed.split(/\\s+/)[0];
          await self.tell('I don\\'t understand "' + firstWord + '".');
        }

        await self.tell('> ');
      } catch (err) {
        await self.tell('Error: ' + err.message);
        await self.tell('> ');
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
  }

  private addActionMethods(obj: RuntimeObject): void {
    // Pattern: get %i - one-handed pickup for light items
    obj.setMethod('get', `
      /** Pick up a light item with one hand.
       *  Usage: get <item>, take <item>, grab <item>, pick up <item>
       *  For heavier items, use "lift" (two hands) or "drag".
       */
      const context = args[0];
      const item = args[1]; // Resolved item from %i

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

      // Announce to room
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        const msg = await $.pronoun.sub('%N picks up %t.', player, null, null, item);
        await location.announce(msg, player);
      }

      return 'You pick up ' + item.name + '.';
    `);

    // Pattern: lift %i - two-handed lift for heavier items
    obj.setMethod('lift', `
      /** Lift a heavy item using both hands.
       *  Usage: lift <item>, heft <item>
       *  Requires both hands free. For very heavy items, use "drag".
       */
      const context = args[0];
      const item = args[1]; // Resolved item from %i

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
      player.set('twoHandCarry', item.id);

      // Announce to room
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        const msg = await $.pronoun.sub('%N lifts %t with both hands.', player, null, null, item);
        await location.announce(msg, player);
      }

      return 'You lift ' + item.name + ' with both hands.';
    `);

    // Pattern: drag %i - drag very heavy items
    obj.setMethod('drag', `
      /** Drag a very heavy item along the ground.
       *  Usage: drag <item>
       *  For items too heavy to lift. Slower movement while dragging.
       */
      const context = args[0];
      const item = args[1]; // Resolved item from %i

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
      player.set('dragging', item.id);

      // Announce to room
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        const msg = await $.pronoun.sub('%N grabs %t and starts dragging it.', player, null, null, item);
        await location.announce(msg, player);
      }

      return 'You grab ' + item.name + ' and start dragging it.';
    `);

    // Pattern: drop %i - drops an item from your hand to the room
    obj.setMethod('drop', `
      /** Drop an item you are holding.
       *  Usage: drop <item>, put down <item>, release <item>
       *  Places the item on the ground in your current location.
       */
      const context = args[0];
      const item = args[1]; // Resolved item from %i

      if (!item) {
        return 'Drop what?';
      }

      // Check if player is holding this item
      const hands = await player.getHands();
      let holdingHand = null;

      for (const hand of hands.both) {
        if (hand) {
          const contents = hand.contents || [];
          if (contents.includes(item.id)) {
            holdingHand = hand;
            break;
          }
        }
      }

      if (!holdingHand) {
        return 'You aren\\'t holding ' + item.name + '.';
      }

      // Get current location
      const location = player.location ? await $.load(player.location) : null;
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
        player.set('dragging', null);
      }
      if (player.twoHandCarry === item.id) {
        player.set('twoHandCarry', null);
      }

      // Announce to room
      if (location.announce) {
        const msg = await $.pronoun.sub('%N drops %t.', player, null, null, item);
        await location.announce(msg, player);
      }

      return 'You drop ' + item.name + '.';
    `);

    // Pattern: help [verb] - shows help for a verb or lists all verbs
    obj.setMethod('help', `
      /** Get help on available commands.
       *  Usage: help, ?, help <command>, ? <command>
       *  Without arguments, lists all available commands.
       *  With a command name, shows detailed help for that command.
       */
      const context = args[0];
      const topic = args[1]; // Optional: verb to get help for

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
      const handler = await $.load(foundVerb.handler);
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
    // Handles digestion, metabolism, sleep, and other periodic effects
    obj.setMethod('heartbeat', `
      const results = {
        digestion: null,
        metabolism: 0,
        sleep: null,
      };

      // Remember previous status for change detection
      const prevCalorieStatus = self._lastCalorieStatus || 'satisfied';
      const prevFatStatus = self._lastFatStatus || 'lean';

      // 1. Sleep tick - handles sedation decay, etc.
      if (self.sleepTick) {
        results.sleep = await self.sleepTick();
      }

      // 2. Digestion - extract calories from stomach, burn fat if needed
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

      // 3. Base metabolism - burn calories just for being alive
      // ~2000 kcal/day = ~1.4 kcal/minute
      // Sleeping agents regenerate calories instead of burning
      const baseRate = 2; // kcal per heartbeat (1 minute)
      const regenMultiplier = await self.getCalorieRegenMultiplier();
      const body = await self.getBody();

      if (body) {
        const currentCalories = body.calories || 0;
        const maxCalories = body.maxCalories || 2000;

        if (regenMultiplier >= 1.0) {
          // Asleep - regenerate calories (from digestion, resting)
          const regen = Math.min(baseRate * regenMultiplier, maxCalories - currentCalories);
          if (regen > 0) {
            body.set('calories', currentCalories + regen);
            results.metabolism = -regen; // Negative = gained
          }
        } else {
          // Awake - burn calories
          const burned = Math.min(baseRate * regenMultiplier, currentCalories);
          body.set('calories', currentCalories - burned);
          results.metabolism = burned;
        }
      }

      // 4. Check for status changes and notify player
      const calorieStatus = await self.getCalorieStatus();
      const fatInfo = await self.getFat();

      // Notify on calorie status change (e.g., satisfied -> hungry)
      if (calorieStatus.status !== prevCalorieStatus) {
        self.set('_lastCalorieStatus', calorieStatus.status);

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

      // Notify on fat status change
      if (fatInfo.status !== prevFatStatus) {
        self.set('_lastFatStatus', fatInfo.status);

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

      // 5. Check for exhaustion -> forced sleep
      if (calorieStatus.status === 'exhausted' && self.sleepState === 'awake') {
        // Too exhausted - start falling asleep involuntarily
        await self.tell('You are so exhausted you can barely keep your eyes open...');
        await self.startSleep(5000); // Fall asleep in 5 seconds
      } else if (calorieStatus.status === 'starving') {
        // TODO: Apply starvation damage
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
        player.set('sleepState', 'awake');
        return 'You stop yourself from falling asleep.';
      }

      // Actually asleep
      const result = await player.startWake();
      if (!result.success) {
        return result.reason;
      }

      return 'You begin to stir awake...';
    `);

    // Sleep notification hooks - override Agent's empty ones
    obj.setMethod('onFellAsleep', `
      await self.tell('You fall asleep.');
    `);

    obj.setMethod('onWokeUp', `
      await self.tell('You wake up.');
      await self.tell('> ');
    `);

    obj.setMethod('onSleepInterrupted', `
      const reason = args[0];
      await self.tell(reason || 'Your sleep is interrupted!');
    `);

    obj.setMethod('onWakeBlocked', `
      const reason = args[0];
      await self.tell(reason || 'You fall back asleep.');
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
}
