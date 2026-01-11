import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds $tts MOO object for Text-to-Speech voice management
 *
 * Interfaces with VibeVoice server (self-hosted TTS with voice cloning).
 * Built-in voices: alloy, echo, fable, onyx, nova, shimmer
 * Custom voices can be added from audio samples.
 *
 * Usage from MOO code:
 *   const voices = await $tts.listVoices();
 *   await $tts.addVoice('villain', audioBase64);
 *   const audio = await $tts.speak('Hello', 'villain');
 */
export class TtsBuilder implements Builder {
  static provides = ['tts'];
  static depends = ['http']; // Uses $http for API calls

  private tts: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.tts) {
      this.tts = await this.manager.load(aliases.tts);
      if (this.tts) {
        // Rebuild methods even if object exists
        this.buildMethods();
        return;
      }
    }

    if (!this.tts) {
      const root = await this.manager.load('root');
      this.tts = await this.manager.create({
        parent: root!,
        properties: {
          name: 'TTS Voice Manager',
          description:
            'Text-to-Speech voice manager using VibeVoice (self-hosted)',
          // VibeVoice server URL (Docker internal network)
          serverUrl: process.env.VIBEVOICE_URL || 'http://vibevoice-server:8880',
          // Built-in voices available in VibeVoice
          builtinVoices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
          // Custom voices added via addVoice() - maps name -> true
          customVoices: {},
        },
      });
    }

    this.buildMethods();
  }

  private buildMethods(): void {
    if (!this.tts) return;

    // List all available voices (built-in + custom)
    this.tts.setMethod(
      'listVoices',
      `
      /** List all available TTS voices (built-in + custom).
       *  @returns Array of voice info objects
       */
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const resp = await fetch(self.serverUrl + '/v1/voices', {
          method: 'GET',
          signal: controller.signal,
        });

        if (!resp.ok) {
          throw new Error('Failed to list voices: ' + resp.status);
        }

        const data = await resp.json();
        return data.voices || [];
      } catch (e) {
        // Fallback to built-in list if server unavailable
        console.error('TTS listVoices error:', e.message);
        return self.builtinVoices.map(v => ({ voice_id: v, name: v }));
      } finally {
        clearTimeout(timeoutId);
      }
    `,
    );

    // Add a custom voice from audio sample
    this.tts.setMethod(
      'addVoice',
      `
      /** Add a custom voice from an audio sample.
       *  The audio should be a clear voice sample (5-30 seconds recommended).
       *  @param name - Unique name for the voice (e.g., 'villain', 'narrator')
       *  @param audioBase64 - Base64-encoded audio (WAV, MP3, FLAC, or M4A)
       *  @param format - Audio format extension (default: 'wav')
       *  @returns { success: true, voice_id } or { success: false, error }
       */
      const name = args[0];
      const audioBase64 = args[1];
      const format = args[2] || 'wav';

      if (!name || !audioBase64) {
        return { success: false, error: 'name and audioBase64 are required' };
      }

      // Validate name (alphanumeric + underscore only)
      if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        return { success: false, error: 'Voice name must be alphanumeric (a-z, 0-9, _)' };
      }

      // Convert base64 to Buffer for multipart upload
      const audioBuffer = Buffer.from(audioBase64, 'base64');

      // Create FormData-like body for file upload
      const boundary = '----VoiceUpload' + Date.now();
      const body = [
        '--' + boundary,
        'Content-Disposition: form-data; name="file"; filename="' + name + '.' + format + '"',
        'Content-Type: audio/' + format,
        '',
        audioBuffer.toString('binary'),
        '--' + boundary + '--',
      ].join('\\r\\n');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const resp = await fetch(self.serverUrl + '/v1/voices/add?name=' + encodeURIComponent(name), {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data; boundary=' + boundary,
          },
          body: body,
          signal: controller.signal,
        });

        if (!resp.ok) {
          const error = await resp.text();
          return { success: false, error: 'Server error: ' + error };
        }

        const data = await resp.json();

        // Track custom voice
        const customVoices = self.customVoices || {};
        customVoices[name] = true;
        self.customVoices = customVoices;

        return { success: true, voice_id: data.voice_id || name };
      } catch (e) {
        return { success: false, error: e.message };
      } finally {
        clearTimeout(timeoutId);
      }
    `,
    );

    // Generate speech from text
    this.tts.setMethod(
      'speak',
      `
      /** Generate speech audio from text.
       *  @param text - Text to speak
       *  @param voice - Voice ID (built-in or custom)
       *  @param options - { speed?, format? }
       *  @returns { success: true, audio: base64, contentType } or { success: false, error }
       */
      const text = args[0];
      const voice = args[1] || 'alloy';
      const options = args[2] || {};

      if (!text) {
        return { success: false, error: 'text is required' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const resp = await fetch(self.serverUrl + '/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: voice,
            response_format: options.format || 'wav',
            speed: options.speed || 1.0,
          }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const error = await resp.text();
          return { success: false, error: 'TTS error: ' + error };
        }

        const buffer = await resp.arrayBuffer();
        const contentType = resp.headers.get('content-type') || 'audio/wav';
        const audio = Buffer.from(buffer).toString('base64');

        return { success: true, audio, contentType };
      } catch (e) {
        return { success: false, error: e.message };
      } finally {
        clearTimeout(timeoutId);
      }
    `,
    );

    // Check TTS server health
    this.tts.setMethod(
      'health',
      `
      /** Check TTS server health and status.
       *  @returns { healthy, model, gpu_available, vram_allocated_gb, ... }
       */
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const resp = await fetch(self.serverUrl + '/health', {
          method: 'GET',
          signal: controller.signal,
        });

        if (!resp.ok) {
          return { healthy: false, error: 'Server returned ' + resp.status };
        }

        const data = await resp.json();
        return { healthy: data.status === 'healthy', ...data };
      } catch (e) {
        return { healthy: false, error: e.message };
      } finally {
        clearTimeout(timeoutId);
      }
    `,
    );

    // Get voice info
    this.tts.setMethod(
      'getVoice',
      `
      /** Get info about a specific voice.
       *  @param voiceId - Voice ID to look up
       *  @returns Voice info or null if not found
       */
      const voiceId = args[0];
      const voices = await self.listVoices();
      return voices.find(v => v.voice_id === voiceId) || null;
    `,
    );

    // Check if voice exists
    this.tts.setMethod(
      'hasVoice',
      `
      /** Check if a voice exists (built-in or custom).
       *  @param voiceId - Voice ID to check
       *  @returns true if voice exists
       */
      const voiceId = args[0];

      // Check built-in
      if (self.builtinVoices.includes(voiceId)) {
        return true;
      }

      // Check custom
      if (self.customVoices && self.customVoices[voiceId]) {
        return true;
      }

      // Check server
      const voice = await self.getVoice(voiceId);
      return voice !== null;
    `,
    );

    // Property descriptions
    this.tts.setPropertyDescription(
      'serverUrl',
      'URL of the VibeVoice TTS server',
    );
    this.tts.setPropertyDescription(
      'builtinVoices',
      'Array of built-in voice IDs: alloy, echo, fable, onyx, nova, shimmer',
    );
    this.tts.setPropertyDescription(
      'customVoices',
      'Map of custom voice names added via addVoice()',
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.tts) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'tts', this.tts.id);
    console.log(`✅ Registered $tts alias -> #${this.tts.id}`);
  }
}

// Self-register
registerBuilder(TtsBuilder);
