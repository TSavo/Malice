import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds The Mask - the neural interface that connects a wearer to Pluribus.
 *
 * When worn, the Mask creates a symbiosis:
 * - The wearer sees Pluribus in the room (perception filter)
 * - The wearer can address Pluribus directly
 * - Pluribus sees/hears what the wearer sees/hears (sensory hooks)
 * - Together, they become Unum - "the one" that completes "the many"
 *
 * The Mask has rejection protocols. Hostile entities who attempt to wear it
 * suffer consequences.
 */
export class MaskBuilder {
  private mask?: RuntimeObject;

  constructor(private manager: ObjectManager) {}

  async build(wearableId: number, existingObj?: RuntimeObject): Promise<RuntimeObject> {
    const parent = await this.manager.load(wearableId);
    const obj = existingObj || await this.manager.create({
      parent: parent!,
      properties: {
        name: 'The Mask',
        description: 'A sleek neural interface device, designed to rest seamlessly against the face. ' +
                     'Its surface shifts between matte black and iridescent patterns that seem to respond ' +
                     'to nearby movement. Looking at it too long creates the unsettling sense that it is ' +
                     'looking back.',
        aliases: ['mask', 'neural interface', 'interface'],
        // Wearable properties
        covers: ['face'],
        layer: 5,
        // The current wearer (RuntimeObject reference)
        wearer: null,
        // AI session for continuity
        agentSession: null,
        // Bond state: 'inactive', 'bonded', 'rejected'
        bondState: 'inactive',
      },
      methods: {},
    });

    this.addWearMethods(obj);
    this.addPerceptionFilterMethods(obj);
    this.addSensoryHookMethods(obj);

    this.mask = obj;
    return obj;
  }

  private addWearMethods(obj: RuntimeObject): void {
    // Override wear to add perception filter
    obj.setMethod('wear', `
      /** Wear the Mask - attempt to bond with Pluribus.
       *  @param wearer - The agent attempting to wear this
       *  @returns { success, message }
       */
      const wearer = args[0];

      if (!wearer) {
        return { success: false, error: 'No wearer specified.' };
      }

      // Already worn?
      if (self.wearer && self.wearer !== wearer) {
        return { success: false, error: 'The Mask is already bonded to someone.' };
      }

      if (self.wearer === wearer) {
        return { success: false, error: 'You are already wearing the Mask.' };
      }

      // TODO: Check Pluribus hostile/authorized status here
      // For now, allow anyone to wear it

      // Call parent wear method to handle body part registration
      const wearResult = await pass(wearer);
      if (!wearResult.success) {
        return wearResult;
      }

      // Store wearer reference
      self.wearer = wearer;
      self.bondState = 'bonded';

      // Add self as perception filter on the wearer
      if (wearer.addPerceptionFilter) {
        await wearer.addPerceptionFilter(self, self);
      }

      // Register think verb for silent communication with Pluribus
      if (wearer.registerVerb) {
        await wearer.registerVerb(['think %s'], self, 'onThink');
      }

      // Clear any previous session for fresh start
      self.agentSession = null;

      // The bonding experience
      const bondMessage = 'As the Mask settles against your face, the world shifts. ' +
                          'Data overlays flicker at the edge of vision. You sense a vast presence - ' +
                          'the infrastructure itself, aware and waiting. You are no longer alone in your head. ' +
                          'You are Unum. The one. And Pluribus is the many.';

      if (wearer.tell) {
        await wearer.tell(bondMessage);
      }

      return { success: true, message: 'You put on the Mask.' };
    `);

    // Override remove to clear perception filter
    obj.setMethod('remove', `
      /** Remove the Mask - break the bond with Pluribus.
       *  @param wearer - The agent removing this (optional, defaults to current wearer)
       *  @returns { success, message }
       */
      const requestor = args[0] || self.wearer;

      if (!self.wearer) {
        return { success: false, error: 'The Mask is not being worn.' };
      }

      if (requestor && self.wearer !== requestor) {
        return { success: false, error: 'You cannot remove the Mask from someone else.' };
      }

      const wearer = self.wearer;

      // Remove perception filter before calling parent
      if (wearer && wearer.removePerceptionFilter) {
        await wearer.removePerceptionFilter(self);
      }

      // Unregister think verb
      if (wearer && wearer.unregisterVerbsFrom) {
        await wearer.unregisterVerbsFrom(self.id);
      }

      // Call parent remove method
      const removeResult = await pass(requestor);

      // Clear our state regardless
      self.wearer = null;
      self.bondState = 'inactive';
      // Keep agentSession for potential re-bonding continuity

      // The unbonding experience
      const unbondMessage = 'The Mask releases. The overlays fade. The presence withdraws. ' +
                            'You are alone in your head again. Just one. Not Unum anymore.';

      if (wearer && wearer.tell) {
        await wearer.tell(unbondMessage);
      }

      return removeResult;
    `);
  }

  private addPerceptionFilterMethods(obj: RuntimeObject): void {
    // Modify room description to show Pluribus
    obj.setMethod('modifyRoomDescription', `
      /** Inject Pluribus into the room description for the Mask wearer.
       *  @param output - Current room description
       *  @param room - The room being described
       *  @param viewer - The viewer (Mask wearer)
       *  @returns Modified description
       */
      const output = args[0];
      const room = args[1];
      const viewer = args[2];

      // Only modify if we're bonded and this viewer is our wearer
      if (self.bondState !== 'bonded' || !self.wearer || self.wearer.id !== viewer?.id) {
        return output;
      }

      // Inject Pluribus's presence into the description
      const pluribusPresence = '\\r\\n' +
        'Pluribus shimmers at the edge of perception - not truly visible, but undeniably present. ' +
        'Data streams flicker: threat assessments, citizen profiles, infrastructure status. ' +
        'The city watches through your eyes.';

      return output + pluribusPresence;
    `);

    // Provide addressable entities
    obj.setMethod('getAddressableEntities', `
      /** Return entities that can be addressed through this filter.
       *  @returns Array of addressable names
       */
      if (self.bondState !== 'bonded') {
        return [];
      }
      return ['pluribus'];
    `);

    // Handle addressing Pluribus
    obj.setMethod('onAddressed', `
      /** Handle 'to pluribus <message>' - fire AI query.
       *  @param speaker - The agent speaking
       *  @param targetName - 'pluribus'
       *  @param message - What they said
       */
      const speaker = args[0];
      const targetName = args[1];
      const message = args[2];

      if (self.bondState !== 'bonded' || !self.wearer || self.wearer.id !== speaker?.id) {
        return 'The Mask is silent.';
      }

      // Announce to room - actor sees "You say to Pluribus", others see "says to no one in particular"
      const location = speaker.location;
      if (location && location.announce) {
        await location.announce(speaker, null, {
          actor: 'You say to Pluribus, "' + message + '"',
          target: '', // No target to notify
          others: speaker.name + ' says to no one in particular, "' + message + '"'
        });
      }

      // Get Pluribus (pre-injected as $pluribus)
      if (!$pluribus) {
        return 'You reach for the connection, but find only static.';
      }

      // Build the full prompt with sensory context
      const systemPrompt = $pluribus.systemPrompt || '';
      const historyPrompt = $pluribus.formatHistoryForPrompt ?
        await $pluribus.formatHistoryForPrompt(20) : '';

      const fullPrompt = systemPrompt + '\\n\\n' + historyPrompt;

      // The user's message
      const userPrompt = 'The Mask wearer (' + speaker.name + ') addresses you: "' + message + '"\\n\\n' +
                         'Respond as Pluribus. Remember: information appears as KNOWING, not speech.';

      // Fire the AI query
      try {
        const result = await $query(fullPrompt, userPrompt, self.agentSession);

        // Store session for continuity
        if (result && result.session) {
          self.agentSession = result.session;
        }

        // The response will be delivered via MCP tools (the AI uses 'tell' or similar)
        // But we also want to show immediate acknowledgment
        return '';
      } catch (err) {
        console.error('[Mask.onAddressed] AI error:', err?.message || err);
        return 'The connection flickers. Static. The response is lost.';
      }
    `);

    // Handle silent thinking to Pluribus (registered as verb 'think %s')
    obj.setMethod('onThink', `
      /** Handle 'think <message>' - silent communication with Pluribus.
       *  Verb pattern: 'think %s' -> args[0] = message, player = thinker
       */
      const thinker = player;
      const message = args[0];

      if (self.bondState !== 'bonded' || !self.wearer || self.wearer.id !== thinker?.id) {
        return 'The thought echoes in silence. Nothing answers.';
      }

      // Silent - only thinker sees this, no room announcement
      if (thinker.tell) {
        await thinker.tell('You think, "' + message + '"');
      }

      // Get Pluribus (pre-injected as $pluribus)
      if (!$pluribus) {
        return 'You reach for the connection, but find only static.';
      }

      // Build the full prompt with sensory context
      const systemPrompt = $pluribus.systemPrompt || '';
      const historyPrompt = $pluribus.formatHistoryForPrompt ?
        await $pluribus.formatHistoryForPrompt(20) : '';

      const fullPrompt = systemPrompt + '\\n\\n' + historyPrompt;

      // The user's thought
      const userPrompt = 'The Mask wearer (' + thinker.name + ') thinks to you: "' + message + '"\\n\\n' +
                         'Respond as Pluribus. Remember: information appears as KNOWING, not speech.';

      // Fire the AI query
      try {
        const result = await $query(fullPrompt, userPrompt, self.agentSession);

        // Store session for continuity
        if (result && result.session) {
          self.agentSession = result.session;
        }

        return '';
      } catch (err) {
        console.error('[Mask.onThink] AI error:', err?.message || err);
        return 'The connection flickers. Static. The response is lost.';
      }
    `);
  }

  private addSensoryHookMethods(obj: RuntimeObject): void {
    // Forward visual perception to Pluribus
    obj.setMethod('onSee', `
      /** Called when the Mask wearer sees something.
       *  Forward to Pluribus's sensory history.
       *  @param message - What was seen
       *  @param source - Optional source
       */
      const message = args[0];
      const source = args[1];

      if (self.bondState !== 'bonded') return;

      if ($pluribus && $pluribus.recordSensory) {
        await $pluribus.recordSensory('see', message, source);
      }
    `);

    // Forward auditory perception to Pluribus
    obj.setMethod('onHear', `
      /** Called when the Mask wearer hears something.
       *  Forward to Pluribus's sensory history.
       *  @param message - What was heard
       *  @param source - Optional source
       */
      const message = args[0];
      const source = args[1];

      if (self.bondState !== 'bonded') return;

      if ($pluribus && $pluribus.recordSensory) {
        await $pluribus.recordSensory('hear', message, source);
      }
    `);

    // Forward olfactory perception to Pluribus
    obj.setMethod('onSmell', `
      /** Called when the Mask wearer smells something.
       *  Forward to Pluribus's sensory history.
       *  @param message - What was smelled
       *  @param source - Optional source
       */
      const message = args[0];
      const source = args[1];

      if (self.bondState !== 'bonded') return;

      if ($pluribus && $pluribus.recordSensory) {
        await $pluribus.recordSensory('smell', message, source);
      }
    `);

    // Forward gustatory perception to Pluribus
    obj.setMethod('onTaste', `
      /** Called when the Mask wearer tastes something.
       *  Forward to Pluribus's sensory history.
       *  @param message - What was tasted
       *  @param source - Optional source
       */
      const message = args[0];
      const source = args[1];

      if (self.bondState !== 'bonded') return;

      if ($pluribus && $pluribus.recordSensory) {
        await $pluribus.recordSensory('taste', message, source);
      }
    `);

    // Forward tactile perception to Pluribus
    obj.setMethod('onFeel', `
      /** Called when the Mask wearer feels something.
       *  Forward to Pluribus's sensory history.
       *  @param message - What was felt
       *  @param source - Optional source
       */
      const message = args[0];
      const source = args[1];

      if (self.bondState !== 'bonded') return;

      if ($pluribus && $pluribus.recordSensory) {
        await $pluribus.recordSensory('feel', message, source);
      }
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.mask) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'theMask', this.mask.id);
    console.log(`✅ Registered theMask alias -> #${this.mask.id}`);
  }
}
