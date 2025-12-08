import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Embodied prototype
 * Base prototype for agents with physical bodies and sensory organs.
 *
 * Embodied agents have:
 * - A body with head, torso, limbs
 * - Sensory organs (eyes, ears, nose, tongue)
 * - Calorie/fat/decay metabolism
 * - Consciousness state
 *
 * Human inherits from Embodied and adds:
 * - Human-specific body structure (2 arms, 2 legs)
 * - Pronouns, age, species
 * - Stat aggregation
 */
export class EmbodiedBuilder {
  constructor(private manager: ObjectManager) {}

  async build(agentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: agentId,
      properties: {
        name: 'Embodied',
        description: 'Base prototype for agents with physical bodies',
        // Body reference - set when body is created
        body: null, // ObjRef to torso (root of body tree)
        // Consciousness state
        conscious: true,
        // Breath/air tracking for drowning
        breath: 100, // Current breath 0-100 (100 = full lungs)
        maxBreath: 100, // Max breath capacity (trained swimmers have more)
      },
      methods: {},
    });

    this.addBodyAccessMethods(obj);
    this.addSensoryMethods(obj);
    this.addCalorieMethods(obj);

    return obj;
  }

  private addBodyAccessMethods(obj: RuntimeObject): void {
    obj.setMethod('getBody', `
      /** Get the body (torso root) of this embodied agent.
       *  @returns The torso RuntimeObject or null if no body
       */
      if (self.body) {
        return await $.load(self.body);
      }
      return null;
    `);

    obj.setMethod('getTorso', `
      /** Get the torso (alias for getBody).
       *  @returns The torso RuntimeObject or null
       */
      return await self.getBody();
    `);

    obj.setMethod('getHead', `
      /** Get the head body part.
       *  @returns The head RuntimeObject or null
       */
      const body = await self.getBody();
      if (body) {
        return await body.getPart('head');
      }
      return null;
    `);

    obj.setMethod('getMouth', `
      /** Get the mouth body part (for speaking).
       *  @returns The mouth RuntimeObject or null
       */
      const head = await self.getHead();
      if (head) {
        const face = await head.getPart('face');
        if (face) {
          return await face.getPart('mouth');
        }
      }
      return null;
    `);

    obj.setMethod('getEars', `
      /** Get all ear body parts (for hearing).
       *  @returns Array of ear RuntimeObjects
       */
      const head = await self.getHead();
      if (head) {
        const face = await head.getPart('face');
        if (face) {
          const leftEar = await face.getPart('leftEar');
          const rightEar = await face.getPart('rightEar');
          return [leftEar, rightEar].filter(e => e !== null);
        }
      }
      return [];
    `);

    obj.setMethod('getEyes', `
      /** Get all eye body parts (for seeing).
       *  @returns Array of eye RuntimeObjects
       */
      const head = await self.getHead();
      if (head) {
        const face = await head.getPart('face');
        if (face) {
          const leftEye = await face.getPart('leftEye');
          const rightEye = await face.getPart('rightEye');
          return [leftEye, rightEye].filter(e => e !== null);
        }
      }
      return [];
    `);

    obj.setMethod('getHands', `
      /** Get hand body parts.
       *  @returns Object with primary, secondary, and both hand arrays
       */
      const body = await self.getBody();
      if (!body) return { primary: null, secondary: null, both: [] };

      const primaryHand = body.primaryHand || 'right';

      const getHand = async (side) => {
        const shoulder = await body.getPart(side + 'Shoulder');
        if (!shoulder) return null;
        const arm = await shoulder.getPart('arm');
        if (!arm) return null;
        const forearm = await arm.getPart('forearm');
        if (!forearm) return null;
        return await forearm.getPart('hand');
      };

      const rightHand = await getHand('right');
      const leftHand = await getHand('left');

      return {
        primary: primaryHand === 'right' ? rightHand : leftHand,
        secondary: primaryHand === 'right' ? leftHand : rightHand,
        both: [rightHand, leftHand].filter(h => h !== null),
      };
    `);

    obj.setMethod('resolveAllContents', `
      /** Get all contents including items in body (hands, etc).
       *  @returns Array of object IDs
       */
      // Start with direct contents
      let allContents = [...(self.contents || [])];

      // Add body contents (items held in hands, etc.)
      const body = await self.getBody();
      if (body && body.resolveAllContents) {
        const bodyContents = await body.resolveAllContents();
        allContents = allContents.concat(bodyContents);
      }

      // Add location contents for searching
      if (self.location) {
        const location = await $.load(self.location);
        if (location) {
          allContents = allContents.concat(location.contents || []);
        }
      }

      return allContents;
    `);

    obj.setMethod('getCarriedWeight', `
      /** Get total weight of items being carried (in hands, worn, etc).
       *  Used for movement calorie cost calculations.
       *  @returns Total weight in grams
       */
      let totalWeight = 0;

      // Get items in hands
      const hands = await self.getHands();
      for (const hand of hands.both) {
        if (hand) {
          const contents = hand.contents || [];
          for (const itemId of contents) {
            const item = await $.load(itemId);
            if (item) {
              // Weight in grams, default to 100g if not specified
              totalWeight += item.weight || 100;
            }
          }
        }
      }

      // Also count worn items (on body)
      const body = await self.getBody();
      if (body) {
        // Check for worn items on various body parts
        const checkParts = ['torso', 'head', 'rightShoulder', 'leftShoulder'];
        for (const partName of checkParts) {
          let part;
          if (partName === 'torso') {
            part = body;
          } else if (partName === 'head') {
            part = await self.getHead();
          } else {
            part = await body.getPart(partName);
          }

          if (part) {
            const worn = part.worn || [];
            for (const itemId of worn) {
              const item = await $.load(itemId);
              if (item) {
                totalWeight += item.weight || 100;
              }
            }
          }
        }
      }

      // Check direct contents (backpack, etc.)
      const directContents = self.contents || [];
      for (const itemId of directContents) {
        const item = await $.load(itemId);
        if (item) {
          // If item has its own contents (container), add those too
          let itemWeight = item.weight || 100;
          if (item.contents && item.contents.length > 0) {
            for (const subItemId of item.contents) {
              const subItem = await $.load(subItemId);
              if (subItem) {
                itemWeight += subItem.weight || 100;
              }
            }
          }
          totalWeight += itemWeight;
        }
      }

      return totalWeight;
    `);
  }

  private addSensoryMethods(obj: RuntimeObject): void {
    obj.setMethod('speak', `
      /** Speak a message through the mouth.
       *  Routes through mouth body part and broadcasts to room.
       *  @param message - The text to speak
       *  @returns Speech object or error
       */
      const message = args[0];

      if (!self.conscious) {
        return { error: 'You are unconscious.' };
      }

      const mouth = await self.getMouth();
      if (!mouth) {
        return { error: 'You have no mouth.' };
      }

      // Delegate to mouth - it handles language, voice modifiers, etc.
      const speech = await mouth.speak(message, self);

      if (speech.error) {
        return speech;
      }

      // Broadcast speech to location
      // The room/location will distribute to nearby players
      if (self.location) {
        const location = await $.load(self.location);
        if (location && location.broadcastSpeech) {
          await location.broadcastSpeech(speech, self);
        }
      }

      return speech;
    `);

    obj.setMethod('hear', `
      /** Hear a sound or speech through the ears.
       *  Routes through ear body parts.
       *  @param message - String or speech object
       *  @param languageOrSource - Optional language or source
       *  @param sourceArg - Optional source object (speaker)
       *  @returns Heard speech object or null if deaf/unconscious
       */
      const messageOrSpeech = args[0];
      const languageOrSource = args[1];
      const sourceArg = args[2];

      if (!self.conscious) {
        return null; // Can't hear when unconscious
      }

      // Build speech object from args
      let speech;
      if (typeof messageOrSpeech === 'string') {
        // Called as hear(message, language?, source?)
        const language = typeof languageOrSource === 'string' ? languageOrSource : 'English';
        const source = typeof languageOrSource === 'object' ? languageOrSource : sourceArg;
        speech = {
          type: 'speech',
          content: messageOrSpeech,
          language: language,
          speaker: source?.id || null,
        };
      } else {
        // Called with speech object directly
        speech = messageOrSpeech;
      }

      const ears = await self.getEars();
      if (ears.length === 0) {
        return null; // No ears - can't hear
      }

      // Try each ear - use first that can hear
      let heard = null;
      for (const ear of ears) {
        if (ear && ear.hear) {
          const result = await ear.hear(speech);
          if (result) {
            heard = result;
            break;
          }
        }
      }

      if (!heard) {
        return null; // Couldn't hear anything (all ears blocked/deaf)
      }

      // Sound is a stimulus - may wake from dozing
      if (self.receiveStimulus) {
        // Intensity 5 for normal speech, could vary by volume
        await self.receiveStimulus(5);
      }

      // Output what was heard via tell()
      if (self.tell) {
        const options = self.options || {};
        const prefix = options.hearPrompt || '';
        await self.tell(prefix + heard.content);
      }

      return heard;
    `);

    obj.setMethod('see', `
      /** See a visual message through the eyes.
       *  If can see, sends message via tell() and returns true.
       *  @param message - The visual message to see
       *  @param source - Optional source of the message
       *  @returns true if seen, false if blind/unconscious
       */
      const message = args[0];
      const source = args[1];

      if (!self.conscious) {
        return false;
      }

      const eyes = await self.getEyes();
      if (eyes.length === 0) {
        return false;
      }

      // Check if at least one eye can see
      for (const eye of eyes) {
        if (eye) {
          const condition = eye.condition || {};
          if (!condition.blind && !condition.destroyed) {
            // Visual stimulus - may wake from dozing
            if (self.receiveStimulus) {
              await self.receiveStimulus(4); // Slightly less than sound
            }

            // Can see - send the message
            if (self.tell) {
              const options = self.options || {};
              const prefix = options.seePrompt || '';
              await self.tell(prefix + message);
            }
            return true;
          }
        }
      }

      return false; // All eyes blocked/blind
    `);

    obj.setMethod('canSmell', `
      /** Check if can smell (nose is working).
       *  Delegates to head.canSmell() for actual capability check.
       *  @returns boolean - true if can smell
       */
      if (!self.conscious) {
        return false;
      }
      const head = await self.getHead();
      if (!head || !head.canSmell) {
        return false;
      }
      return await head.canSmell();
    `);

    obj.setMethod('canTaste', `
      /** Check if can taste (tongue is working).
       *  Delegates to head.canTaste() for actual capability check.
       *  @returns boolean - true if can taste
       */
      if (!self.conscious) {
        return false;
      }
      const head = await self.getHead();
      if (!head || !head.canTaste) {
        return false;
      }
      return await head.canTaste();
    `);

    obj.setMethod('smell', `
      /** Smell an olfactory message through the nose.
       *  If can smell, sends message via tell() and returns true.
       *  @param message - The smell description
       *  @param source - Optional source of the smell
       *  @returns true if smelled, false if anosmic/unconscious
       */
      const message = args[0];
      const source = args[1];

      if (!self.conscious) {
        return false;
      }

      const head = await self.getHead();
      if (!head) {
        return false;
      }

      // Check if can smell (delegates to head -> face -> nose)
      const canSmellResult = head.canSmell ? await head.canSmell() : false;
      if (!canSmellResult) {
        return false; // Nose blocked/destroyed/missing
      }

      // Smell is weak stimulus
      if (self.receiveStimulus) {
        await self.receiveStimulus(3); // 30% wake chance
      }

      // Can smell - send the message
      if (self.tell) {
        const options = self.options || {};
        const prefix = options.smellPrompt || '';
        await self.tell(prefix + message);
      }
      return true;
    `);

    obj.setMethod('taste', `
      /** Taste a gustatory message through the tongue.
       *  If can taste, sends message via tell() and returns true.
       *  @param message - The taste description
       *  @param source - Optional source of the taste
       *  @returns true if tasted, false if tongueless/unconscious
       */
      const message = args[0];
      const source = args[1];

      if (!self.conscious) {
        return false;
      }

      const head = await self.getHead();
      if (!head) {
        return false;
      }

      // Check if can taste (delegates to head -> face -> mouth -> tongue)
      const canTasteResult = head.canTaste ? await head.canTaste() : false;
      if (!canTasteResult) {
        return false; // Tongue missing/destroyed
      }

      // Taste is very weak stimulus
      if (self.receiveStimulus) {
        await self.receiveStimulus(2); // 20% wake chance
      }

      // Can taste - send the message
      if (self.tell) {
        const options = self.options || {};
        const prefix = options.tastePrompt || '';
        await self.tell(prefix + message);
      }
      return true;
    `);

    obj.setMethod('onSensation', `
      /** Handle incoming sensation from body parts.
       *  @param sensation - Object with part, partName, type, intensity
       */
      const sensation = args[0]; // { part, partName, type, intensity, ... }

      if (!self.conscious) {
        return; // No sensation when unconscious
      }

      // Physical sensation is strong stimulus - wakes from dozing
      if (self.receiveStimulus) {
        // Pain is very alerting (8-10), touch moderate (6-7)
        let stimulusIntensity = 6; // Default for touch
        if (sensation.type === 'pain') {
          // Pain intensity 1-10 maps to stimulus 8-10
          const painLevel = sensation.intensity || 5;
          stimulusIntensity = Math.min(10, 8 + (painLevel / 5));
        } else if (sensation.type === 'temperature') {
          // Extreme temp is alerting
          stimulusIntensity = 7;
        }
        await self.receiveStimulus(stimulusIntensity);
      }

      // Different handling based on sensation type
      if (sensation.type === 'pain') {
        // Pain sensation - could trigger reactions
        // Future: pain tolerance, shock, etc.
      }
    `);

    obj.setMethod('onCriticalDamage', `
      /** Handle critical damage to body parts (may cause death).
       *  @param part - The body part that was critically damaged
       */
      const part = args[0]; // The body part that was critically damaged

      // Critical parts being destroyed = death
      // Head, torso, etc.
      if (part.critical) {
        self.conscious = false;
        // Trigger death sequence
        if (self.onDeath) {
          await self.onDeath(part);
        }
      }
    `);
  }

  private addCalorieMethods(obj: RuntimeObject): void {
    obj.setMethod('getArmPath', `
      /** Get the arm path from hand to torso for a given side.
       *  @param side - 'right' or 'left'
       *  @returns Array of parts: [hand, forearm, arm, shoulder, torso]
       */
      const side = args[0]; // 'right' or 'left'
      const body = await self.getBody();
      if (!body) return [];

      const path = [];
      const shoulder = await body.getPart(side + 'Shoulder');
      if (!shoulder) return [];

      const arm = await shoulder.getPart('arm');
      if (!arm) return [shoulder, body];

      const forearm = await arm.getPart('forearm');
      if (!forearm) return [arm, shoulder, body];

      const hand = await forearm.getPart('hand');
      if (!hand) return [forearm, arm, shoulder, body];

      return [hand, forearm, arm, shoulder, body];
    `);

    obj.setMethod('getBothArmPaths', `
      /** Get both arm paths for two-handed operations.
       *  @returns Object with right and left arm paths
       */
      const rightPath = await self.getArmPath('right');
      const leftPath = await self.getArmPath('left');
      return { right: rightPath, left: leftPath };
    `);

    obj.setMethod('getTotalCalories', `
      /** Get total calories stored in the body.
       *  @returns Total calorie count across all body parts
       */
      const body = await self.getBody();
      if (!body) return 0;

      let total = body.calories || 0;

      // Add limb calories
      const armPaths = await self.getBothArmPaths();
      for (const path of [armPaths.right, armPaths.left]) {
        for (const part of path) {
          if (part && part !== body) {
            total += part.calories || 0;
          }
        }
      }

      // Add leg calories
      for (const side of ['right', 'left']) {
        const thigh = await body.getPart(side + 'Thigh');
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              total += leg.calories || 0;
            }
          }
        }
      }

      return total;
    `);

    obj.setMethod('strengthCheck', `
      /** Check if a body part path can handle a given weight.
       *  @param weight - Weight in grams
       *  @param path - Array of body parts from extremity to torso
       *  @returns Object with canLift, canHold, canDrag, capacities, calories
       */
      const weight = args[0]; // in grams
      const path = args[1]; // array of body parts from extremity to torso

      if (!path || path.length === 0) {
        return { canLift: false, canHold: false, canDrag: false, error: 'No body path available' };
      }

      // Find the weakest link in the chain
      let minStrength = Infinity;
      let minCalories = Infinity;
      let weakestPart = null;
      let lowestCaloriePart = null;
      let totalPathStrength = 0;

      for (const part of path) {
        if (!part) continue;
        const str = part.strength || 0;
        const cal = part.calories || 0;

        totalPathStrength += str;

        if (str > 0 && str < minStrength) {
          minStrength = str;
          weakestPart = part;
        }
        if (cal < minCalories) {
          minCalories = cal;
          lowestCaloriePart = part;
        }
      }

      // Each strength point gives ~5kg lift capacity
      // Weakest link determines max lift
      const liftCapacity = minStrength * 5000; // grams
      // Can hold longer at lower weights - hold capacity is 2x lift
      const holdCapacity = minStrength * 10000;
      // Dragging uses legs primarily but arms help - much higher capacity
      const dragCapacity = minStrength * 25000;

      // Calorie cost scales with weight relative to capacity
      // Lifting something at max capacity costs ~10 cal/action
      // Holding costs ~1 cal/second at max capacity
      const liftCaloriesNeeded = Math.ceil((weight / liftCapacity) * 10);
      const holdCaloriesPerSecond = Math.ceil((weight / holdCapacity) * 1);

      // Check if we have enough calories
      const hasCalories = minCalories >= liftCaloriesNeeded;

      return {
        canLift: weight <= liftCapacity && hasCalories,
        canHold: weight <= holdCapacity && hasCalories,
        canDrag: weight <= dragCapacity && hasCalories,
        liftCapacity,
        holdCapacity,
        dragCapacity,
        weight,
        weakestPart: weakestPart?.name || 'unknown',
        lowestCaloriePart: lowestCaloriePart?.name || 'unknown',
        minCalories,
        liftCaloriesNeeded,
        holdCaloriesPerSecond,
        hasCalories,
      };
    `);

    obj.setMethod('burnCalories', `
      /** Burn calories from body parts doing work.
       *  Cascade: body parts → torso → fat → decay.
       *  When fat is exhausted, decay consumes the body part itself,
       *  restoring some calories but permanently reducing maxCalories.
       *  @param path - Array of body parts
       *  @param amount - Total calories to burn
       *  @returns {burned, fromFat, decayed} - calories burned, fat used, decay caused
       */
      const path = args[0]; // array of body parts
      let amount = args[1]; // total calories to burn
      const body = await self.getBody();

      if (!path || path.length === 0 || !body) return { burned: 0, fromFat: 0, decayed: 0 };

      let totalBurned = 0;
      let fromFat = 0;
      let decayed = 0;

      // Step 1: Try to burn from body parts with calories
      const partsWithCalories = path.filter(p => p && (p.calories || 0) > 0);
      if (partsWithCalories.length > 0) {
        const perPart = Math.ceil(amount / partsWithCalories.length);
        for (const part of partsWithCalories) {
          const current = part.calories || 0;
          const burned = Math.min(current, perPart);
          part.set('calories', current - burned);
          totalBurned += burned;
          amount -= burned;
        }
      }

      if (amount <= 0) return { burned: totalBurned, fromFat: 0, decayed: 0 };

      // Step 2: Fall back to torso
      const torsoCurrent = body.calories || 0;
      if (torsoCurrent > 0) {
        const fromTorso = Math.min(torsoCurrent, amount);
        body.set('calories', torsoCurrent - fromTorso);
        totalBurned += fromTorso;
        amount -= fromTorso;
      }

      if (amount <= 0) return { burned: totalBurned, fromFat: 0, decayed: 0 };

      // Step 3: Burn fat (1 fat = 100 calories)
      const currentFat = body.fat || 0;
      if (currentFat > 0) {
        const fatNeeded = Math.ceil(amount / 100);
        const fatToBurn = Math.min(fatNeeded, currentFat);
        body.set('fat', currentFat - fatToBurn);
        const caloriesFromFat = fatToBurn * 100;
        fromFat = fatToBurn;
        totalBurned += Math.min(caloriesFromFat, amount);
        amount -= caloriesFromFat;
      }

      if (amount <= 0) return { burned: totalBurned, fromFat, decayed: 0 };

      // Step 4: Decay - consume muscle tissue from the first body part in the path
      // This permanently reduces maxCalories but restores some calories
      const partToDecay = path.find(p => p && (p.maxCalories || 0) > 0);
      if (partToDecay) {
        // Each 1% decay restores 10 calories but permanently reduces maxCalories by 1
        const decayNeeded = Math.ceil(amount / 10);
        const currentDecay = partToDecay.decayLevel || 0;
        const maxDecayPossible = 100 - currentDecay;
        const actualDecay = Math.min(decayNeeded, maxDecayPossible);

        if (actualDecay > 0) {
          // Increase decay level
          partToDecay.set('decayLevel', currentDecay + actualDecay);
          decayed = actualDecay;

          // Reduce maxCalories permanently
          const currentMax = partToDecay.maxCalories || 100;
          const newMax = Math.max(0, currentMax - actualDecay);
          partToDecay.set('maxCalories', newMax);

          // Restore some calories from consuming muscle tissue
          const caloriesRestored = actualDecay * 10;
          const partCurrent = partToDecay.calories || 0;
          partToDecay.set('calories', Math.min(newMax, partCurrent + caloriesRestored));

          totalBurned += Math.min(caloriesRestored, amount);
        }
      }

      // Check for death by starvation (total body decay > 50%)
      const bodyDecay = await self.getTotalBodyDecay();
      if (bodyDecay.percentage >= 50) {
        // Death by starvation - body has consumed too much of itself
        if (self.onStarvationDeath) {
          await self.onStarvationDeath(bodyDecay);
        }
      }

      return { burned: totalBurned, fromFat, decayed };
    `);

    obj.setMethod('replenishCalories', `
      /** Replenish calories from eating (distributes to body and limbs).
       *  Excess calories stored as fat.
       *  @param amount - Calories from food
       *  @returns Object with absorbed and storedAsFat counts
       */
      const amount = args[0]; // calories from food
      const body = await self.getBody();
      if (!body) return { absorbed: 0, storedAsFat: 0 };

      // First fill torso (main storage), then distribute to limbs
      const torsoMax = body.maxCalories || 3000;
      const torsoCurrent = body.calories || 0;
      const torsoSpace = torsoMax - torsoCurrent;
      const toTorso = Math.min(amount, torsoSpace);
      body.set('calories', torsoCurrent + toTorso);

      let remaining = amount - toTorso;
      if (remaining <= 0) return { absorbed: amount, storedAsFat: 0 };

      // Distribute remainder to limbs
      const limbs = [];
      const armPaths = await self.getBothArmPaths();
      for (const path of [armPaths.right, armPaths.left]) {
        for (const part of path) {
          if (part && part !== body && (part.maxCalories || 0) > 0) {
            limbs.push(part);
          }
        }
      }

      // Add legs
      for (const side of ['right', 'left']) {
        const thigh = await body.getPart(side + 'Thigh');
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg && (leg.maxCalories || 0) > 0) {
              limbs.push(leg);
            }
          }
        }
      }

      // Distribute evenly to limbs
      if (limbs.length > 0) {
        const perLimb = Math.floor(remaining / limbs.length);
        for (const limb of limbs) {
          const max = limb.maxCalories || 0;
          const current = limb.calories || 0;
          const space = max - current;
          const toLimb = Math.min(perLimb, space);
          limb.set('calories', current + toLimb);
          remaining -= toLimb;
        }
      }

      // If still remaining, store as fat (1 fat = 100 calories)
      let storedAsFat = 0;
      if (remaining > 0) {
        const currentFat = body.fat || 0;
        const maxFat = body.maxFat || 100;
        const fatSpace = maxFat - currentFat;

        // Convert calories to fat: 100 cal = 1 fat unit
        const fatToAdd = Math.min(Math.floor(remaining / 100), fatSpace);
        if (fatToAdd > 0) {
          body.set('fat', currentFat + fatToAdd);
          storedAsFat = fatToAdd;
          remaining -= fatToAdd * 100;
        }
      }

      return { absorbed: amount - remaining, storedAsFat };
    `);

    obj.setMethod('digestTick', `
      /** Process stomach contents and absorb calories.
       *  Called periodically by heartbeat. Burns fat if needed.
       *  Infected wounds reduce calorie absorption.
       *  @returns Object with digested calories, fatBurned, fatGained, infectionPenalty
       */
      const body = await self.getBody();
      if (!body) return { digested: 0, fatBurned: 0, infectionPenalty: 0 };

      const stomach = await body.getPart('digestiveStomach');
      let digestedCalories = 0;

      // First try to digest food in stomach
      if (stomach && stomach.digest) {
        digestedCalories = await stomach.digest();
      }

      // Check for infected wounds - they inhibit calorie absorption
      // Body diverts energy to fighting infection
      let totalInfectionSeverity = 0;
      const countInfections = async (part) => {
        if (!part) return;

        // Check wounds on this part
        const woundIds = part.wounds || [];
        for (const woundId of woundIds) {
          const wound = await $.load(woundId);
          if (wound && wound.infected) {
            totalInfectionSeverity += (wound.infectionSeverity || 10);
          }
        }

        // Recurse to child parts
        const parts = part.parts || {};
        for (const partName of Object.keys(parts)) {
          const childId = parts[partName];
          if (childId) {
            const child = await $.load(childId);
            await countInfections(child);
          }
        }
      };
      await countInfections(body);

      // Infection penalty: each 10 severity = 5% less absorption (max 80% penalty)
      const infectionPenalty = Math.min(0.8, totalInfectionSeverity * 0.005);
      const effectiveCalories = Math.floor(digestedCalories * (1 - infectionPenalty));
      const caloriesLostToInfection = digestedCalories - effectiveCalories;

      // Replenish body with extracted calories (reduced by infection)
      let fatGained = 0;
      if (effectiveCalories > 0) {
        const result = await self.replenishCalories(effectiveCalories);
        fatGained = result.storedAsFat || 0;
      }

      // If stomach is empty and we're low on calories, burn fat
      let fatBurned = 0;
      const stomachContents = stomach ? (stomach.contents || []) : [];
      const currentCalories = body.calories || 0;
      const maxCalories = body.maxCalories || 3000;
      const caloriePercent = currentCalories / maxCalories;

      // Start burning fat when below 50% calories and stomach is empty
      if (stomachContents.length === 0 && caloriePercent < 0.5) {
        const currentFat = body.fat || 0;
        if (currentFat > 0) {
          // Burn fat to replenish calories
          // Burn more aggressively when more depleted
          const urgency = 1 - (caloriePercent * 2); // 1.0 at 0%, 0.0 at 50%
          const fatToBurn = Math.max(1, Math.ceil(urgency * 3)); // 1-3 fat per tick
          const actualBurn = Math.min(fatToBurn, currentFat);

          body.set('fat', currentFat - actualBurn);
          fatBurned = actualBurn;

          // Convert fat back to calories (1 fat = 100 cal)
          const caloriesFromFat = actualBurn * 100;
          await self.replenishCalories(caloriesFromFat);
        }
      }

      return {
        digested: digestedCalories,
        absorbed: effectiveCalories,
        fatBurned,
        fatGained,
        infectionPenalty: Math.round(infectionPenalty * 100),
        caloriesLostToInfection
      };
    `);

    obj.setMethod('bleedTick', `
      /** Process all wounds on all body parts.
       *  Called periodically by heartbeat.
       *  Wounds tick (bleed, heal, infect, cause pain).
       *  Bleeding drains hydration. Severe blood loss causes decay.
       *  @returns Object with totalBleeding, woundsHealed, infections, messages
       */
      const body = await self.getBody();
      if (!body) return { totalBleeding: 0, woundsHealed: 0, infections: 0, messages: [] };

      const messages = [];
      let totalBleeding = 0;
      let totalWoundsHealed = 0;
      let totalInfections = 0;

      // Process wounds on all body parts recursively
      const processPartWounds = async (part) => {
        if (!part) return;

        // Tick wounds on this part
        if (part.tickWounds) {
          // Get wound descriptions before ticking (for reporting)
          const woundsBefore = part.getWounds ? await part.getWounds() : [];
          const woundDescriptions = {};
          for (const w of woundsBefore) {
            woundDescriptions[w.id] = w.description || ('wound on your ' + part.name.toLowerCase());
          }

          const result = await part.tickWounds();
          totalBleeding += result.totalBled || 0;
          totalWoundsHealed += result.fullyHealedIds?.length || 0;
          totalInfections += result.woundsInfected || 0;

          // Report newly healed wounds with their description
          if (result.fullyHealedIds?.length > 0) {
            for (const healedId of result.fullyHealedIds) {
              const desc = woundDescriptions[healedId] || 'wound';
              // desc is like "A moderate deep cut, bleeding steadily."
              // Convert to "The moderate deep cut on your arm has healed."
              const cleanDesc = desc.replace(/^A /, '').replace(/[,.].*$/, '');
              messages.push('The ' + cleanDesc + ' on your ' + part.name.toLowerCase() + ' has healed.');
            }
          }

          // Report new infections - get current wound descriptions
          if (result.woundsInfected > 0) {
            const currentWounds = part.getWounds ? await part.getWounds() : [];
            for (const w of currentWounds) {
              if (w.infected && w.infectionSeverity < 15) { // Newly infected
                const desc = (w.description || 'wound').replace(/^A /, '').replace(/[,.].*$/, '');
                messages.push('The ' + desc + ' on your ' + part.name.toLowerCase() + ' has become infected!');
              }
            }
          }
        }

        // Process child parts
        const parts = part.parts || {};
        for (const partName of Object.keys(parts)) {
          const childId = parts[partName];
          if (childId) {
            const child = await $.load(childId);
            await processPartWounds(child);
          }
        }
      };

      await processPartWounds(body);

      // Report bleeding status
      if (totalBleeding > 0) {
        const bleedingRate = totalBleeding; // Hydration lost this tick
        if (bleedingRate >= 20) {
          messages.push('You are losing blood rapidly!');
        } else if (bleedingRate >= 10) {
          messages.push('You are bleeding badly.');
        } else if (bleedingRate >= 5) {
          messages.push('You are bleeding.');
        }
      }

      // Notify the agent
      if (self.tell && messages.length > 0 && self.sleepState === 'awake') {
        for (const msg of messages) {
          await self.tell(msg);
        }
      }

      // Check for death from blood loss (severe hydration depletion)
      const hydration = body.hydration ?? 100;
      if (hydration <= 0) {
        // Already handled by hydration depletion in heartbeat
        // But set cause of death if bleeding caused it
        if (totalBleeding > 0) {
          self.causeOfDeath = 'blood loss';
        }
      }

      // Check for sepsis (severe infection spreads to whole body)
      // This is handled by wound.tick() adding sepsis status effect

      return { totalBleeding, woundsHealed: totalWoundsHealed, infections: totalInfections, messages };
    `);

    obj.setMethod('breathTick', `
      /** Process breathing/drowning for submerged agents.
       *  Called periodically by heartbeat.
       *  When underwater: breath depletes. When out: breath refills.
       *  Drowning drains calories like bleeding does.
       *  @returns Object with isUnderwater, breath, maxBreath, drowning, messages
       */
      const messages = [];
      let drowning = false;

      // Check if we're in a location with water
      if (!self.location) {
        return { isUnderwater: false, breath: self.breath, maxBreath: self.maxBreath, drowning: false, messages: [] };
      }

      const location = await $.load(self.location);
      if (!location) {
        return { isUnderwater: false, breath: self.breath, maxBreath: self.maxBreath, drowning: false, messages: [] };
      }

      // Get agent height (from body or default)
      let agentHeight = 170; // Default human height in cm
      const body = await self.getBody();
      if (body && body.height) {
        agentHeight = body.height;
      }

      // Check if submerged
      const isUnderwater = location.isSubmerged ? await location.isSubmerged(agentHeight) : false;
      const currentBreath = self.breath ?? 100;
      const maxBreath = self.maxBreath || 100;

      if (isUnderwater) {
        // Underwater - deplete breath
        // Lose 20 breath per tick (can hold breath for 5 ticks/5 minutes at full)
        const breathLoss = 20;
        const newBreath = Math.max(0, currentBreath - breathLoss);
        self.set('breath', newBreath);

        if (newBreath <= 0) {
          // Out of breath - drowning!
          drowning = true;
          messages.push('You are drowning! You desperately need air!');

          // Drowning damage - drain calories like bleeding
          // 100 calories per tick of drowning (severe)
          if (self.burnCalories) {
            await self.burnCalories(100, [body]);
          }

          // Generate pain/panic sensation
          if (body && body.feel) {
            await body.feel({
              type: 'pain',
              subtype: 'drowning',
              intensity: 10,
            });
          }

          // Check for death from drowning (same as other decay deaths)
          const decayInfo = await self.getTotalBodyDecay();
          if (decayInfo.percentage >= 50) {
            if (self.onStarvationDeath) {
              self.set('causeOfDeath', 'drowning');
              await self.onStarvationDeath(decayInfo);
            } else if (self.die) {
              await self.die('drowning');
            }
          }
        } else if (newBreath <= 20) {
          messages.push('Your lungs burn! You are running out of air!');
        } else if (newBreath <= 50) {
          messages.push('You are holding your breath underwater.');
        } else if (currentBreath === maxBreath) {
          // Just went underwater
          messages.push('You take a deep breath as the water closes over you.');
        }
      } else {
        // Above water - restore breath
        if (currentBreath < maxBreath) {
          // Restore 50 breath per tick (quick recovery when surfacing)
          const newBreath = Math.min(maxBreath, currentBreath + 50);
          self.set('breath', newBreath);

          if (currentBreath <= 20 && newBreath > 20) {
            messages.push('You gasp for air as you surface!');
          } else if (currentBreath < maxBreath && newBreath >= maxBreath) {
            messages.push('You catch your breath.');
          }
        }
      }

      // Notify the agent
      if (self.tell && messages.length > 0) {
        for (const msg of messages) {
          await self.tell(msg);
        }
      }

      return {
        isUnderwater,
        breath: self.breath,
        maxBreath: self.maxBreath,
        drowning,
        messages,
      };
    `);

    obj.setMethod('getStomachContents', `
      /** Get stomach contents (for examining corpses, etc).
       *  @returns Array of item RuntimeObjects in stomach
       */
      const body = await self.getBody();
      if (!body) return [];

      const stomach = await body.getPart('digestiveStomach');
      if (!stomach) return [];

      const contents = stomach.contents || [];
      const items = [];
      for (const itemId of contents) {
        const item = await $.load(itemId);
        if (item) {
          items.push(item);
        }
      }
      return items;
    `);

    obj.setMethod('getFat', `
      /** Get current fat level and status.
       *  @returns Object with fat, maxFat, percentage, status
       */
      const body = await self.getBody();
      if (!body) return { fat: 0, maxFat: 100, percentage: 0, status: 'lean' };

      const fat = body.fat || 0;
      const maxFat = body.maxFat || 100;
      const percentage = Math.round((fat / maxFat) * 100);

      // Status description based on fat percentage
      const status = await $.proportional.sub(
        ['lean', 'fit', 'soft', 'overweight', 'obese', 'morbidly obese'],
        fat,
        maxFat
      );

      return { fat, maxFat, percentage, status };
    `);

    obj.setMethod('getFatModifier', `
      /** Get fat modifier for stats (dexterity, speed, stealth).
       *  Returns multiplier: 1.0 = no penalty, lower = penalty.
       *  No penalty for fat <= 20% (healthy weight).
       *  @returns Modifier between 0.5 and 1.0
       */
      const body = await self.getBody();
      if (!body) return 1.0;

      const fat = body.fat || 0;
      const maxFat = body.maxFat || 100;

      // No penalty for healthy weight (very lean through healthy-looking)
      // ~20% of maxFat is the threshold
      const healthyThreshold = Math.floor(maxFat * 0.2); // 20 for maxFat=100
      if (fat <= healthyThreshold) return 1.0;

      // Penalty only applies to fat above healthy threshold
      // Scales from 1.0 at threshold to 0.5 at max fat
      const excessFat = fat - healthyThreshold;
      const excessRange = maxFat - healthyThreshold; // 80 for maxFat=100
      const penalty = (excessFat / excessRange) * 0.5; // 0 to 0.5

      return Math.max(0.5, 1.0 - penalty);
    `);

    obj.setMethod('getCalorieStatus', `
      /** Get calorie status for display.
       *  @returns Object with status, percentage, total, maxTotal, feeling
       */
      const body = await self.getBody();
      if (!body) return { status: 'no body', percentage: 0, feeling: '' };

      const total = await self.getTotalCalories();
      // Rough max based on body + 2 arms + 2 legs
      // torso: 3000 + 2*(arm:150 + hand:75) + 2*(leg:300) = 3000 + 450 + 600 = 4050
      const maxTotal = 4050;
      const percentage = Math.round((total / maxTotal) * 100);

      const status = await $.proportional.sub(
        ['exhausted', 'starving', 'very hungry', 'hungry', 'satisfied', 'well-fed'],
        total,
        maxTotal
      );

      // Feeling is how the player experiences their calorie level
      const feeling = await $.proportional.sub(
        [
          'completely drained, barely able to move',
          'weak and shaky from hunger',
          'very hungry, stomach growling',
          'hungry, could use a meal',
          'comfortable and satisfied',
          'energized and well-fed'
        ],
        total,
        maxTotal
      );

      return { status, percentage, total, maxTotal, feeling };
    `);

    obj.setMethod('getFeeling', `
      /** Get how the player feels overall.
       *  Combines calorie status, sleep, fat, sedation.
       *  @returns Description string of current feeling
       */
      const calorieStatus = await self.getCalorieStatus();
      const fatInfo = await self.getFat();
      const sleepState = self.sleepState || 'awake';

      const parts = [];

      // Sleep state feeling
      if (sleepState === 'falling_asleep') {
        parts.push('drowsy and drifting off');
      } else if (sleepState === 'waking_up') {
        parts.push('groggy and waking');
      } else if (sleepState === 'asleep') {
        parts.push('asleep');
      }

      // Calorie feeling (only mention if notable)
      if (calorieStatus.percentage < 50) {
        parts.push(calorieStatus.feeling);
      } else if (calorieStatus.percentage >= 90) {
        parts.push('well-fed');
      }

      // Fat feeling (only mention if notable)
      if (fatInfo.fat >= 50) {
        const fatFeeling = await $.proportional.sub(
          ['sluggish', 'heavy', 'labored'],
          fatInfo.fat - 50,
          50
        );
        parts.push(fatFeeling);
      }

      // Sedation
      const sedation = self.sedation || 0;
      if (sedation > 0) {
        const sedFeeling = await $.proportional.sub(
          ['slightly foggy', 'sedated', 'heavily drugged'],
          sedation,
          10
        );
        parts.push(sedFeeling);
      }

      if (parts.length === 0) {
        return 'normal';
      }

      return parts.join(', ');
    `);

    obj.setMethod('getTotalBodyDecay', `
      /** Get total body decay across all body parts.
       *  Used to determine death by starvation (>= 50% decay).
       *  @returns Object with percentage, totalDecay, maxPossibleDecay, parts array
       */
      const body = await self.getBody();
      if (!body) return { percentage: 0, totalDecay: 0, maxPossibleDecay: 0, parts: [] };

      const decayParts = [];
      let totalDecay = 0;
      let maxPossibleDecay = 0;

      // Torso
      const torsoDecay = body.decayLevel || 0;
      totalDecay += torsoDecay;
      maxPossibleDecay += 100;
      if (torsoDecay > 0) {
        decayParts.push({ name: 'torso', decay: torsoDecay });
      }

      // Arms (both sides)
      for (const side of ['right', 'left']) {
        const shoulder = await body.getPart(side + 'Shoulder');
        if (shoulder) {
          const arm = await shoulder.getPart('arm');
          if (arm) {
            const armDecay = arm.decayLevel || 0;
            totalDecay += armDecay;
            maxPossibleDecay += 100;
            if (armDecay > 0) decayParts.push({ name: side + ' arm', decay: armDecay });

            const forearm = await arm.getPart('forearm');
            if (forearm) {
              const hand = await forearm.getPart('hand');
              if (hand) {
                const handDecay = hand.decayLevel || 0;
                totalDecay += handDecay;
                maxPossibleDecay += 100;
                if (handDecay > 0) decayParts.push({ name: side + ' hand', decay: handDecay });
              }
            }
          }
        }
      }

      // Legs (both sides)
      for (const side of ['right', 'left']) {
        const thigh = await body.getPart(side + 'Thigh');
        if (thigh) {
          const knee = await thigh.getPart('knee');
          if (knee) {
            const leg = await knee.getPart('leg');
            if (leg) {
              const legDecay = leg.decayLevel || 0;
              totalDecay += legDecay;
              maxPossibleDecay += 100;
              if (legDecay > 0) decayParts.push({ name: side + ' leg', decay: legDecay });
            }
          }
        }
      }

      const percentage = maxPossibleDecay > 0
        ? Math.round((totalDecay / maxPossibleDecay) * 100)
        : 0;

      return {
        percentage,
        totalDecay,
        maxPossibleDecay,
        parts: decayParts,
      };
    `);

    obj.setMethod('onStarvationDeath', `
      /** Called when body decay reaches fatal levels (>= 50%).
       *  The body has consumed too much of itself to survive.
       *  @param decayInfo - Object from getTotalBodyDecay
       */
      const decayInfo = args[0];

      // Mark as dead
      self.set('alive', false);
      self.set('conscious', false);
      self.set('causeOfDeath', 'starvation');
      self.set('deathDecay', decayInfo);

      // Notify if we have an onDeath handler
      if (self.onDeath) {
        await self.onDeath({ cause: 'starvation', decay: decayInfo });
      }

      // Announce to location if possible
      if (self.location && self.tell) {
        await self.tell('Your body has consumed too much of itself. You collapse from starvation.');
      }
    `);
  }
}
