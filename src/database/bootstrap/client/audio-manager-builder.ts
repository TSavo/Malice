import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the AudioManager class client module
 *
 * Creates $.audioManagerJs which serves /js/audio-manager.js
 * Handles TTS audio playback with per-object volume controls.
 */
export class AudioManagerBuilder implements Builder {
  static provides = ['audioManagerJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const $ = this.manager as any;

    if ($.audioManagerJs) {
      this.obj = $.audioManagerJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('AudioManagerBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'AudioManager JS Module',
        description: 'TTS audio playback with per-object volume controls',
      },
      methods: {},
    });

    const obj = this.obj;

    obj.setMethod(
      'getScript',
      `
      return \`
/**
 * AudioManager - TTS audio playback with per-object volume controls
 *
 * Handles the 'audio' channel from the server, requesting TTS audio
 * from the VibeVoice server and playing it with configurable volumes.
 *
 * Features:
 * - Per-object volume controls (persisted to localStorage)
 * - Global mute/unmute
 * - Master volume control
 * - Audio queue for sequential playback
 * - Settings UI for managing voices
 */
export class AudioManager {
  constructor(ttsServerUrl) {
    // TTS server URL (VibeVoice)
    this.ttsServerUrl = ttsServerUrl || '';

    // Volume settings
    this.masterVolume = 1.0;
    this.globalMuted = false;
    this.objectVolumes = new Map(); // objectId -> { volume: 0-1, muted: boolean, name: string }

    // Audio playback
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentAudio = null;
    this.currentSpeakerId = null;

    // Settings UI state
    this.settingsVisible = false;
    this.settingsElement = null;

    // Callback for mute state changes (taskbar icon updates)
    this.onMuteChange = null;

    // Load saved settings from localStorage
    this.loadSettings();

    // Create audio context on first user interaction (browser requirement)
    this.audioContext = null;
    this.initAudioContext();
  }

  /**
   * Initialize Web Audio API context
   * Must be done after user interaction in most browsers
   */
  initAudioContext() {
    const initOnInteraction = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      document.removeEventListener('click', initOnInteraction);
      document.removeEventListener('keydown', initOnInteraction);
    };

    document.addEventListener('click', initOnInteraction);
    document.addEventListener('keydown', initOnInteraction);
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('malice-audio-settings');
      if (saved) {
        const data = JSON.parse(saved);
        this.masterVolume = data.masterVolume ?? 1.0;
        this.globalMuted = data.globalMuted ?? false;

        // Validate masterVolume
        if (typeof data.masterVolume === 'number' && data.masterVolume >= 0 && data.masterVolume <= 1) {
          this.masterVolume = data.masterVolume;
        }

        // Validate globalMuted
        if (typeof data.globalMuted === 'boolean') {
          this.globalMuted = data.globalMuted;
        }

        // Restore object volumes with validation
        if (data.objectVolumes && typeof data.objectVolumes === 'object') {
          for (const [id, settings] of Object.entries(data.objectVolumes)) {
            if (settings && typeof settings === 'object') {
              const validated = {
                volume: typeof settings.volume === 'number' && settings.volume >= 0 && settings.volume <= 1
                  ? settings.volume : 1.0,
                muted: typeof settings.muted === 'boolean' ? settings.muted : false,
                name: typeof settings.name === 'string' ? settings.name : 'Unknown #' + id
              };
              this.objectVolumes.set(id, validated);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[AudioManager] Failed to load settings:', e);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      const data = {
        masterVolume: this.masterVolume,
        globalMuted: this.globalMuted,
        objectVolumes: Object.fromEntries(this.objectVolumes)
      };
      localStorage.setItem('malice-audio-settings', JSON.stringify(data));
    } catch (e) {
      console.warn('[AudioManager] Failed to save settings:', e);
    }
  }

  /**
   * Handle incoming audio segments from server
   * @param data - { segments: [{ speaker, speakerName, voiceId, text, voiceStyle? }] }
   */
  handleAudioMessage(data) {
    if (!data || !data.segments || !Array.isArray(data.segments)) {
      return;
    }

    for (const segment of data.segments) {
      this.queueSegment(segment);
    }
  }

  /**
   * Queue an audio segment for playback
   */
  queueSegment(segment) {
    const { speaker, speakerName, voiceId, text, voiceStyle } = segment;

    if (!text || !text.trim()) return;

    // Register this speaker if not already known
    if (!this.objectVolumes.has(speaker)) {
      this.objectVolumes.set(speaker, {
        volume: 1.0,
        muted: false,
        name: speakerName || 'Unknown #' + speaker
      });
      this.saveSettings();
      this.updateSettingsUI();
    } else {
      // Update name if it changed
      const settings = this.objectVolumes.get(speaker);
      if (settings.name !== speakerName && speakerName) {
        settings.name = speakerName;
        this.saveSettings();
        this.updateSettingsUI();
      }
    }

    // Add to queue
    this.audioQueue.push({
      speaker,
      speakerName,
      voiceId: voiceId || 'alloy',
      text: text.trim(),
      voiceStyle
    });

    // Start playback if not already playing
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Play next segment in queue
   */
  async playNext() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const segment = this.audioQueue.shift();

    // Check if muted - use setTimeout to avoid stack overflow
    if (this.globalMuted) {
      this.playNext();
      return;
    }

    const speakerSettings = this.objectVolumes.get(segment.speaker);
    if (speakerSettings?.muted) {
      this.playNext();
      return;
    }

    try {
      // Request TTS audio from server
      const audio = await this.fetchTTS(segment);
      if (audio) {
        await this.playAudio(audio, segment.speaker);
      }
    } catch (e) {
      console.warn('[AudioManager] TTS error:', e);
    }

    // Play next - use setTimeout to avoid stack buildup
    setTimeout(() => this.playNext(), 0);
  }

  /**
   * Fetch TTS audio from VibeVoice server
   */
  async fetchTTS(segment) {
    if (!this.ttsServerUrl) {
      console.warn('[AudioManager] No TTS server URL configured');
      return null;
    }

    const url = this.ttsServerUrl + '/tts';

    const body = {
      text: segment.text,
      voice_id: segment.voiceId,
      speed: 1.0
    };

    // Add voice style if present (for steerability)
    if (segment.voiceStyle) {
      body.voice_style = segment.voiceStyle;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('TTS request failed: ' + response.status);
    }

    // Response is audio/wav
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  }

  /**
   * Play audio buffer
   */
  async playAudio(arrayBuffer, speakerId) {
    return new Promise((resolve, reject) => {
      // Calculate effective volume
      const speakerSettings = this.objectVolumes.get(speakerId);
      const speakerVolume = speakerSettings?.volume ?? 1.0;
      const effectiveVolume = this.masterVolume * speakerVolume;

      if (effectiveVolume === 0) {
        resolve();
        return;
      }

      // Create audio element from blob
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      audio.volume = effectiveVolume;
      this.currentAudio = audio;
      this.currentSpeakerId = speakerId;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.currentSpeakerId = null;
        resolve();
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.currentSpeakerId = null;
        reject(e);
      };

      audio.play().catch(reject);
    });
  }

  /**
   * Stop current playback and clear queue
   */
  stop() {
    this.audioQueue = [];
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.currentSpeakerId = null;
    this.isPlaying = false;
  }

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio && this.currentSpeakerId) {
      const speakerSettings = this.objectVolumes.get(this.currentSpeakerId);
      const speakerVolume = speakerSettings?.volume ?? 1.0;
      this.currentAudio.volume = this.masterVolume * speakerVolume;
    }
    this.saveSettings();
  }

  /**
   * Toggle global mute
   */
  toggleMute() {
    this.globalMuted = !this.globalMuted;
    if (this.globalMuted && this.currentAudio) {
      this.currentAudio.pause();
    } else if (!this.globalMuted && this.currentAudio) {
      // Resume playback when unmuting
      this.currentAudio.play().catch(e => console.warn('[AudioManager] Failed to resume:', e));
    }
    this.saveSettings();
    // Notify listeners of mute state change
    if (this.onMuteChange) {
      this.onMuteChange(this.globalMuted);
    }
    return this.globalMuted;
  }

  /**
   * Set volume for a specific object (0-1)
   */
  setObjectVolume(objectId, volume) {
    const settings = this.objectVolumes.get(objectId);
    if (settings) {
      settings.volume = Math.max(0, Math.min(1, volume));
      this.saveSettings();
    }
  }

  /**
   * Toggle mute for a specific object
   */
  toggleObjectMute(objectId) {
    const settings = this.objectVolumes.get(objectId);
    if (settings) {
      settings.muted = !settings.muted;
      this.saveSettings();
      return settings.muted;
    }
    return false;
  }

  /**
   * Get all known voices/objects
   */
  getKnownVoices() {
    const voices = [];
    for (const [id, settings] of this.objectVolumes) {
      voices.push({
        id,
        name: settings.name,
        volume: settings.volume,
        muted: settings.muted
      });
    }
    return voices;
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Show sound settings UI
   */
  showSettings() {
    if (this.settingsVisible) return;

    this.settingsVisible = true;
    this.settingsElement = document.createElement('div');
    this.settingsElement.id = 'audio-settings-panel';
    this.settingsElement.style.cssText = \\\`
      position: fixed;
      bottom: 40px;
      right: 16px;
      width: 320px;
      max-height: 400px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    \\\`;

    this.updateSettingsUI();
    document.body.appendChild(this.settingsElement);

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', this._onClickOutside = (e) => {
        if (!this.settingsElement?.contains(e.target) &&
            !e.target.closest('#taskbar-sound-btn')) {
          this.hideSettings();
        }
      });
    }, 100);
  }

  /**
   * Hide sound settings UI
   */
  hideSettings() {
    if (!this.settingsVisible) return;

    this.settingsVisible = false;
    if (this.settingsElement) {
      this.settingsElement.remove();
      this.settingsElement = null;
    }
    if (this._onClickOutside) {
      document.removeEventListener('click', this._onClickOutside);
      this._onClickOutside = null;
    }
  }

  /**
   * Toggle settings visibility
   */
  toggleSettings() {
    if (this.settingsVisible) {
      this.hideSettings();
    } else {
      this.showSettings();
    }
  }

  /**
   * Update settings UI content
   */
  updateSettingsUI() {
    if (!this.settingsElement) return;

    const voices = this.getKnownVoices();

    this.settingsElement.innerHTML = \\\`
      <div style="padding: 16px; border-bottom: 1px solid #333;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <span style="color: #e0e0e0; font-weight: 600; font-size: 14px;">Sound Settings</span>
          <button id="audio-close-btn" style="background: none; border: none; color: #666; cursor: pointer; font-size: 18px; padding: 0 4px;">&times;</button>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <button id="audio-mute-btn" style="
            background: \\\${this.globalMuted ? '#ff4444' : '#333'};
            border: none;
            color: #e0e0e0;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">\\\${this.globalMuted ? '🔇 Unmute' : '🔊 Mute All'}</button>
          <button id="audio-stop-btn" style="
            background: #333;
            border: none;
            color: #e0e0e0;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">⏹ Stop</button>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #888; font-size: 12px; min-width: 50px;">Master</span>
          <input type="range" id="audio-master-volume" min="0" max="100" value="\\\${Math.round(this.masterVolume * 100)}" style="flex: 1; accent-color: #00ff88;">
          <span style="color: #888; font-size: 12px; min-width: 35px; text-align: right;">\\\${Math.round(this.masterVolume * 100)}%</span>
        </div>
      </div>

      <div style="flex: 1; overflow-y: auto; padding: 8px 16px;">
        <div style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Voice Volumes</div>
        \\\${voices.length === 0 ? '<div style="color: #666; font-size: 13px; padding: 16px 0;">No voices heard yet</div>' : ''}
        \\\${voices.map(v => \\\`
          <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #222;" data-voice-id="\\\${v.id}">
            <button class="voice-mute-btn" data-id="\\\${v.id}" style="
              background: \\\${v.muted ? '#ff4444' : '#333'};
              border: none;
              color: #e0e0e0;
              width: 28px;
              height: 28px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">\\\${v.muted ? '🔇' : '🔊'}</button>
            <span style="color: #e0e0e0; font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\\\${v.name}">\\\${v.name}</span>
            <input type="range" class="voice-volume" data-id="\\\${v.id}" min="0" max="100" value="\\\${Math.round(v.volume * 100)}" style="width: 80px; accent-color: #00ff88;">
          </div>
        \\\`).join('')}
      </div>
    \\\`;

    // Attach event listeners
    this.settingsElement.querySelector('#audio-close-btn')?.addEventListener('click', () => this.hideSettings());
    this.settingsElement.querySelector('#audio-mute-btn')?.addEventListener('click', () => {
      this.toggleMute();
      this.updateSettingsUI();
    });
    this.settingsElement.querySelector('#audio-stop-btn')?.addEventListener('click', () => this.stop());

    const masterSlider = this.settingsElement.querySelector('#audio-master-volume');
    masterSlider?.addEventListener('input', (e) => {
      this.setMasterVolume(e.target.value / 100);
      const label = masterSlider.nextElementSibling;
      if (label) label.textContent = Math.round(this.masterVolume * 100) + '%';
    });

    // Voice mute buttons
    this.settingsElement.querySelectorAll('.voice-mute-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleObjectMute(btn.dataset.id);
        this.updateSettingsUI();
      });
    });

    // Voice volume sliders
    this.settingsElement.querySelectorAll('.voice-volume').forEach(slider => {
      slider.addEventListener('input', () => {
        this.setObjectVolume(slider.dataset.id, slider.value / 100);
      });
    });
  }
}
\`;
    `,
    );

    obj.setMethod(
      'handleRequest',
      `
      const script = await self.getScript();
      return {
        status: 200,
        contentType: 'application/javascript',
        body: script,
        headers: { 'Cache-Control': 'public, max-age=3600' }
      };
    `,
    );

    console.log(`[AudioManagerBuilder] Built $.audioManagerJs -> #${obj.id}`);
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'audioManagerJs', this.obj.id);
  }
}

// Self-register
registerBuilder(AudioManagerBuilder);
