import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Voice Modulator prototype
 * Synthetic larynx with programmable voice synthesis
 */
export class VoiceModulatorBuilder implements Builder {
  static provides = ['voiceModulator'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('voiceModulator');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('voiceModulator', cyberware, {
        properties: {
          name: 'Voice Modulator',
          description: 'A synthetic larynx with programmable voice synthesis',
          weight: 80,
          slot: 'throat',
          activeVoice: 'natural',
          storedVoices: [],
          recordingBuffer: '',

          installAbilities: `VOICE MODULATOR: Cybernetic voicebox.
Change voice at will. Mimic specific voices with samples.
Record up to 1 hour of audio internally. Broadcast at higher volumes.
Natural voice still available - switch between.`,

          abilities: `Synthetic larynx with programmable voice synthesis.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Larynx enhanced with modulator unit. Nerve connections preserved.
Add installAbilities text to host abilities under "VOICE MODULATOR".
Recovery: 1 week of scratchy voice, then clears.

REMOVAL: Risky. Can damage natural voice permanently if done wrong.
Some hosts keep it forever rather than risk removal.
Only remove if modulator is malfunctioning.

VOICES: Default is natural voice. Switch to synthetic at will.
Adjust pitch, tone, accent. Sound male, female, neutral, robotic.
Create entirely new identity through voice alone.

MIMICRY: Record a voice sample (30+ seconds). Unit learns pattern.
Reproduce that voice convincingly. Not perfect under audio analysis.
Good enough to fool humans, not security voice-print systems.
Store up to 10 different voice patterns.

RECORDING: Internal buffer stores 1 hour of audio.
Record conversations secretly. Playback in your head.
Download via cable to external storage. Evidence gathering.

VOLUME: Project voice at high volume. Shout across large spaces.
Get attention, intimidate, issue commands.
Painful to listeners at close range - can disorient.

SUBSONIC: Generate frequencies below human hearing.
Cause unease, nausea in targets. Subtle intimidation.
Detectable by audio enhancers.

REJECTION: Rare. Signs: voice cracks, random pitch shifts.
Can usually be recalibrated. Severe rejection = removal needed.

MAINTENANCE: Calibration monthly. Voice drift occurs without it.
Neglected modulator sounds increasingly artificial.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'activeVoice',
        "Current voice profile ('natural' or stored voice name)",
      );
      this.obj.setPropertyDescription(
        'storedVoices',
        'Array of learned voice patterns',
      );
      this.obj.setPropertyDescription(
        'recordingBuffer',
        'Current audio recording buffer',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[VoiceModulatorBuilder] Type 'voiceModulator' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(VoiceModulatorBuilder);
