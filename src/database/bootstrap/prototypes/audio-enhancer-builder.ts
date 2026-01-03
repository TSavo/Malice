import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Audio Enhancer prototype
 * Cybernetic ear with enhanced audio processing
 */
export class AudioEnhancerBuilder implements Builder {
  static provides = ['audioEnhancer'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('audioEnhancer');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('audioEnhancer', cyberware, {
        properties: {
          name: 'Audio Enhancer',
          description:
            'A cybernetic ear replacement with enhanced audio processing',
          weight: 30,
          slot: 'ear',
          recordingCapacity: 6,
          recording: false,

          installAbilities: `AUDIO ENHANCER: Cybernetic hearing replacement.
Directional hearing - focus on specific sounds in noisy rooms.
Record conversations internally. Filter out painful frequencies.
Detect lies by heartbeat. Hear whispers at 20 meters.`,

          abilities: `Cybernetic ear replacement with enhanced audio processing.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Doc removes biological ear canal and drum. Chrome unit attaches
to auditory nerve. Outer ear appearance unchanged (internal chrome).
Add installAbilities text to host abilities under "AUDIO ENHANCER".
Recovery: 48 hours of tinnitus, sound sensitivity.

REMOVAL: Surgical extraction. Host is deaf in that ear until replacement.

DIRECTIONAL: Focus hearing on specific target. Conversations across
room become clear. Background noise suppressed. Like pointing a mic.

RECORDING: Store up to 6 hours internally. Playback in your head.
Download via data cable to external storage. Evidence, blackmail, notes.

FILTERING: Block harmful frequencies. Flashbangs less effective.
Loud noises capped. Music concerts comfortable. Cannot be deafened.

HEARTBEAT: Detect pulse from close range. Stress, fear, arousal all
affect heart rate. Crude lie detection - not foolproof.

REJECTION: Rare. Signs: persistent tinnitus, vertigo, nausea.
May require removal if symptoms don't resolve.

MAINTENANCE: Calibration every 6 months. Damaged unit causes
audio distortion, phantom sounds, hearing loss.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'recordingCapacity',
        'Hours of audio storage capacity',
      );
      this.obj.setPropertyDescription(
        'recording',
        'Whether currently recording audio',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[AudioEnhancerBuilder] Type 'audioEnhancer' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AudioEnhancerBuilder);
