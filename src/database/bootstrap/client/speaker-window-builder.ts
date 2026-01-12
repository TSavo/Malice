import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the SpeakerWindow class client module
 *
 * Creates $.speakerWindowJs which serves /js/speaker-window.js
 * Window type for displaying the current speaker's image during TTS playback.
 */
export class SpeakerWindowBuilder implements Builder {
  static provides = ['speakerWindowJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const $ = this.manager as any;

    if ($.speakerWindowJs) {
      this.obj = $.speakerWindowJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('SpeakerWindowBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'SpeakerWindow JS Module',
        description: 'Speaker image display window for TTS',
      },
      methods: {},
    });

    const obj = this.obj;

    obj.setMethod(
      'getScript',
      `
      return \`
import { Window } from '/js/window';

/**
 * SpeakerWindow - Window for displaying the current speaker's image
 * Shows the speaker's portrait/image while they're speaking via TTS.
 * Fades to blank when no one is speaking.
 */
export class SpeakerWindow extends Window {
  constructor(wm, config) {
    super(wm, config);
    this.imageEl = null;
    this.nameEl = null;
    this.placeholderEl = null;
    this.currentSpeakerId = null;
    this.fadeTimeout = null;
  }

  /**
   * Initialize speaker display area
   */
  initContent() {
    // Main container
    const container = document.createElement('div');
    container.className = 'speaker-window-content';
    container.style.cssText = \\\`
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #0a0a0a;
      overflow: hidden;
      position: relative;
    \\\`;

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'speaker-image-container';
    imageContainer.style.cssText = \\\`
      width: 100%;
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #0d0d0d;
    \\\`;

    // Speaker image
    this.imageEl = document.createElement('img');
    this.imageEl.className = 'speaker-image';
    this.imageEl.style.cssText = \\\`
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    \\\`;
    this.imageEl.onerror = () => {
      this.imageEl.style.opacity = '0';
      this._showPlaceholder();
    };
    this.imageEl.onload = () => {
      this.imageEl.style.opacity = '1';
      this._hidePlaceholder();
    };

    // Placeholder when no speaker or no image
    this.placeholderEl = document.createElement('div');
    this.placeholderEl.className = 'speaker-placeholder';
    this.placeholderEl.style.cssText = \\\`
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
      color: #333;
      font-size: 64px;
      transition: opacity 0.3s ease-in-out;
    \\\`;
    this.placeholderEl.innerHTML = '🔇';

    imageContainer.appendChild(this.imageEl);
    imageContainer.appendChild(this.placeholderEl);

    // Speaker name bar at bottom
    this.nameEl = document.createElement('div');
    this.nameEl.className = 'speaker-name';
    this.nameEl.style.cssText = \\\`
      padding: 8px 12px;
      background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7));
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #888;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    \\\`;
    this.nameEl.textContent = '';

    container.appendChild(imageContainer);
    container.appendChild(this.nameEl);
    this.content.appendChild(container);
  }

  _showPlaceholder() {
    if (this.placeholderEl) {
      this.placeholderEl.style.opacity = '1';
    }
  }

  _hidePlaceholder() {
    if (this.placeholderEl) {
      this.placeholderEl.style.opacity = '0';
    }
  }

  /**
   * Set the current speaker (called when TTS starts)
   * @param speakerId - Object ID of the speaker
   * @param speakerName - Display name of the speaker
   * @param imageUrl - URL to the speaker's image (optional)
   */
  setSpeaker(speakerId, speakerName, imageUrl) {
    // Clear any pending fade timeout
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    this.currentSpeakerId = speakerId;

    // Update name
    if (this.nameEl) {
      this.nameEl.textContent = speakerName || '';
      this.nameEl.style.color = speakerName ? '#00ff88' : '#888';
    }

    // Update placeholder icon to speaking
    if (this.placeholderEl) {
      this.placeholderEl.innerHTML = '🔊';
    }

    // Update image
    if (this.imageEl) {
      if (imageUrl) {
        this.imageEl.src = imageUrl;
        // onload/onerror handlers will handle display
      } else {
        this.imageEl.style.opacity = '0';
        this._showPlaceholder();
      }
    }
  }

  /**
   * Clear the speaker display (called when TTS ends)
   * Uses a fade transition for smooth visual effect
   */
  clearSpeaker() {
    this.currentSpeakerId = null;

    // Fade out the image
    if (this.imageEl) {
      this.imageEl.style.opacity = '0';
    }

    // Update placeholder to silent
    if (this.placeholderEl) {
      this.placeholderEl.innerHTML = '🔇';
      this._showPlaceholder();
    }

    // Clear the name after a short delay
    this.fadeTimeout = setTimeout(() => {
      if (this.nameEl) {
        this.nameEl.textContent = '';
        this.nameEl.style.color = '#888';
      }
    }, 300);
  }

  /**
   * Handle channel data (not typically used for speaker window)
   */
  onChannelData(data) {
    if (data && typeof data === 'object') {
      if (data.action === 'speaker') {
        this.setSpeaker(data.speakerId, data.speakerName, data.imageUrl);
      } else if (data.action === 'clear') {
        this.clearSpeaker();
      }
    }
  }

  /**
   * Handle resize
   */
  onResize() {}
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

    console.log(`[SpeakerWindowBuilder] Built $.speakerWindowJs -> #${obj.id}`);
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'speakerWindowJs', this.obj.id);
  }
}

// Self-register
registerBuilder(SpeakerWindowBuilder);
