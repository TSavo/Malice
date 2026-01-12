import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the LocationWindow class client module
 *
 * Creates $.locationWindowJs which serves /js/location-window.js
 * Window type for displaying room images and location information.
 */
export class LocationWindowBuilder implements Builder {
  static provides = ['locationWindowJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const $ = this.manager as any;

    if ($.locationWindowJs) {
      this.obj = $.locationWindowJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('LocationWindowBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'LocationWindow JS Module',
        description: 'Room image and location info window',
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
 * LocationWindow - Window for displaying room images and location info
 * Shows room image, name, description, exits, and coordinates.
 * Listens to 'location' state updates from server.
 */
export class LocationWindow extends Window {
  constructor(wm, config) {
    super(wm, config);
    this.locationData = null;
    this.imageEl = null;
    this.nameEl = null;
    this.descEl = null;
    this.exitsEl = null;
    this.coordsEl = null;
  }

  /**
   * Initialize location content area
   */
  initContent() {
    // Main container with dark background
    const container = document.createElement('div');
    container.className = 'location-window-content';
    container.style.cssText = \\\`
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #0a0a0a;
      overflow: hidden;
    \\\`;

    // Image container (takes up top portion)
    const imageContainer = document.createElement('div');
    imageContainer.className = 'location-image-container';
    imageContainer.style.cssText = \\\`
      width: 100%;
      flex: 1;
      min-height: 150px;
      position: relative;
      overflow: hidden;
      background: #0d0d0d;
    \\\`;

    // Room image
    this.imageEl = document.createElement('img');
    this.imageEl.className = 'location-image';
    this.imageEl.style.cssText = \\\`
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: none;
    \\\`;
    this.imageEl.onerror = () => {
      this.imageEl.style.display = 'none';
      this._showPlaceholder();
    };
    this.imageEl.onload = () => {
      this.imageEl.style.display = 'block';
      this._hidePlaceholder();
    };

    // Placeholder when no image
    this.placeholderEl = document.createElement('div');
    this.placeholderEl.className = 'location-placeholder';
    this.placeholderEl.style.cssText = \\\`
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
      color: #333;
      font-size: 48px;
    \\\`;
    this.placeholderEl.textContent = '🗺';

    imageContainer.appendChild(this.imageEl);
    imageContainer.appendChild(this.placeholderEl);

    // Info panel at bottom
    const infoPanel = document.createElement('div');
    infoPanel.className = 'location-info-panel';
    infoPanel.style.cssText = \\\`
      padding: 12px 16px;
      background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7));
      font-family: system-ui, -apple-system, sans-serif;
      position: relative;
    \\\`;

    // Room name
    this.nameEl = document.createElement('div');
    this.nameEl.className = 'location-name';
    this.nameEl.style.cssText = \\\`
      font-size: 16px;
      font-weight: 600;
      color: #00ff88;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    \\\`;
    this.nameEl.textContent = 'Unknown Location';

    // Coordinates badge (top right of info panel)
    this.coordsEl = document.createElement('div');
    this.coordsEl.className = 'location-coords';
    this.coordsEl.style.cssText = \\\`
      position: absolute;
      top: 12px;
      right: 16px;
      font-size: 11px;
      font-family: ui-monospace, monospace;
      color: #666;
      background: rgba(0,0,0,0.5);
      padding: 2px 6px;
      border-radius: 3px;
    \\\`;

    // Room description (abbreviated)
    this.descEl = document.createElement('div');
    this.descEl.className = 'location-description';
    this.descEl.style.cssText = \\\`
      font-size: 12px;
      color: #888;
      line-height: 1.4;
      max-height: 52px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      margin-bottom: 8px;
    \\\`;

    // Exits row
    this.exitsEl = document.createElement('div');
    this.exitsEl.className = 'location-exits';
    this.exitsEl.style.cssText = \\\`
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      font-size: 11px;
    \\\`;

    infoPanel.appendChild(this.nameEl);
    infoPanel.appendChild(this.coordsEl);
    infoPanel.appendChild(this.descEl);
    infoPanel.appendChild(this.exitsEl);

    container.appendChild(imageContainer);
    container.appendChild(infoPanel);
    this.content.appendChild(container);
  }

  _showPlaceholder() {
    if (this.placeholderEl) {
      this.placeholderEl.style.display = 'flex';
    }
  }

  _hidePlaceholder() {
    if (this.placeholderEl) {
      this.placeholderEl.style.display = 'none';
    }
  }

  /**
   * Update location display
   */
  setLocation(data) {
    this.locationData = data;

    // Update name
    if (this.nameEl) {
      this.nameEl.textContent = data.name || 'Unknown Location';
    }

    // Update description
    if (this.descEl) {
      this.descEl.textContent = data.description || '';
    }

    // Update coordinates
    if (this.coordsEl) {
      if (data.coordinates) {
        const { x, y, z } = data.coordinates;
        this.coordsEl.textContent = \\\`(\\\${x}, \\\${y}, \\\${z})\\\`;
        this.coordsEl.style.display = 'block';
      } else {
        this.coordsEl.style.display = 'none';
      }
    }

    // Update exits
    if (this.exitsEl) {
      this.exitsEl.innerHTML = '';
      const exits = data.exits || {};
      const exitDirs = Object.keys(exits);
      if (exitDirs.length > 0) {
        // Add "Exits:" label
        const label = document.createElement('span');
        label.textContent = 'Exits:';
        label.style.color = '#555';
        label.style.marginRight = '4px';
        this.exitsEl.appendChild(label);

        for (const dir of exitDirs) {
          const badge = document.createElement('span');
          badge.textContent = dir;
          badge.style.cssText = \\\`
            background: #1a1a1a;
            color: #888;
            padding: 2px 6px;
            border-radius: 3px;
            border: 1px solid #333;
          \\\`;
          this.exitsEl.appendChild(badge);
        }
      }
    }

    // Update image
    if (this.imageEl) {
      if (data.imageUrl) {
        this.imageEl.src = data.imageUrl;
        // onload/onerror handlers will show/hide as needed
      } else {
        this.imageEl.style.display = 'none';
        this._showPlaceholder();
      }
    }
  }

  /**
   * Handle state channel data
   */
  onChannelData(data) {
    // Handle location state updates
    if (data && typeof data === 'object') {
      this.setLocation(data);
    }
  }

  /**
   * Handle resize - nothing special needed
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

    console.log(
      `[LocationWindowBuilder] Built $.locationWindowJs -> #${obj.id}`,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'locationWindowJs', this.obj.id);
  }
}

// Self-register
registerBuilder(LocationWindowBuilder);
