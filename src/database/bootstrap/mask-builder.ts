import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

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

  async build(
    wearableId: number,
    existingObj?: RuntimeObject,
  ): Promise<RuntimeObject> {
    const parent = await this.manager.load(wearableId);
    const obj =
      existingObj ||
      (await this.manager.create({
        parent: parent!,
        properties: {
          name: 'The Mask',
          description:
            'A sleek neural interface device, designed to rest seamlessly against the face. ' +
            'Its surface shifts between matte black and iridescent patterns that seem to respond ' +
            'to nearby movement. Looking at it too long creates the unsettling sense that it is ' +
            'looking back.',
          abilities: `Neural interface connecting wearer to Pluribus, the city infrastructure AI.

BONDING: Wear to bond (bondState='bonded'). Remove to sever (bondState='inactive').

INPUT ROUTING (when bonded):
ALL player input except "remove mask" should be routed to $pluribus.to(player, command).
Pluribus interprets intent through the symbiotic link and responds as sudden knowing.
The wearer and Pluribus act as one - Unum.

PERCEPTION: modifyRoomDescription injects Pluribus's presence - data overlays, threat assessments. Only wearer sees this.

SENSORY LINK: onSee/onHear/onSmell/onTaste/onFeel forward to $pluribus.recordSensory(). The city experiences what you experience.

REJECTION: May reject hostile entities per Pluribus authorization.`,
          aliases: ['mask', 'neural interface', 'interface'],
          // Wearable properties
          covers: ['face'],
          layer: 5,
          // The current wearer (RuntimeObject reference)
          wearer: null,
          // AI session for continuity
          interactionSession: null,
          // Bond state: 'inactive', 'bonded', 'rejected'
          bondState: 'inactive',
        },
        methods: {},
      }));

    this.addWearMethods(obj);
    this.addPerceptionFilterMethods(obj);
    this.addSensoryHookMethods(obj);

    this.mask = obj;
    return obj;
  }

  private addWearMethods(obj: RuntimeObject): void {
    // Override wear to add perception filter
    obj.setMethod(
      'wear',
      `
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

      // Clear any previous session for fresh start
      self.interactionSession = null;

      // The bonding experience
      const bondMessage = 'As the Mask settles against your face, the world shifts. ' +
                          'Data overlays flicker at the edge of vision. You sense a vast presence - ' +
                          'the infrastructure itself, aware and waiting. You are no longer alone in your head. ' +
                          'You are Unum. The one. And Pluribus is the many.';

      if (wearer.tell) {
        await wearer.tell(bondMessage);
      }

      return { success: true, message: 'You put on the Mask.' };
    `,
    );

    // Override remove to clear perception filter
    obj.setMethod(
      'remove',
      `
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

      // Call parent remove method
      const removeResult = await pass(requestor);

      // Clear our state regardless
      self.wearer = null;
      self.bondState = 'inactive';
      // Keep interactionSession for potential re-bonding continuity

      // The unbonding experience
      const unbondMessage = 'The Mask releases. The overlays fade. The presence withdraws. ' +
                            'You are alone in your head again. Just one. Not Unum anymore.';

      if (wearer && wearer.tell) {
        await wearer.tell(unbondMessage);
      }

      return removeResult;
    `,
    );
  }

  private addPerceptionFilterMethods(obj: RuntimeObject): void {
    // Modify room description to show Pluribus
    obj.setMethod(
      'modifyRoomDescription',
      `
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
    `,
    );
  }

  private addSensoryHookMethods(obj: RuntimeObject): void {
    // Forward visual perception to Pluribus
    obj.setMethod(
      'onSee',
      `
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
    `,
    );

    // Forward auditory perception to Pluribus
    obj.setMethod(
      'onHear',
      `
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
    `,
    );

    // Forward olfactory perception to Pluribus
    obj.setMethod(
      'onSmell',
      `
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
    `,
    );

    // Forward gustatory perception to Pluribus
    obj.setMethod(
      'onTaste',
      `
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
    `,
    );

    // Forward tactile perception to Pluribus
    obj.setMethod(
      'onFeel',
      `
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
    `,
    );
  }

  async registerAlias(): Promise<void> {
    if (!this.mask) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'theMask', this.mask.id);
    console.log(`✅ Registered theMask alias -> #${this.mask.id}`);
  }
}
