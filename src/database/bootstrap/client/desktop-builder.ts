import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the Desktop entry point client module
 *
 * Creates $.desktopJs which serves /js/desktop.js
 * Main entry point that initializes the windowed desktop.
 */
export class DesktopBuilder {
  static readonly alias = 'desktopJs';

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<RuntimeObject> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    let obj: RuntimeObject | null = null;

    if (aliases[DesktopBuilder.alias]) {
      obj = await this.manager.load(aliases[DesktopBuilder.alias]);
      if (obj && !forceRebuild) {
        console.log(
          `[DesktopBuilder] Using existing $.${DesktopBuilder.alias}`,
        );
        return obj;
      }
    }

    if (!obj) {
      const root = await this.manager.load(1);
      obj = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Desktop JS Module',
          description: 'Desktop entry point - initializes windowed UI',
        },
        methods: {},
      });

      await objectManager.call('addAlias', DesktopBuilder.alias, obj.id);
    }

    obj.setMethod(
      'getScript',
      `
      return \`
import { WindowManager } from '/js/window-manager.js';
import { MaliceClient } from '/js/malice-client.js';

/**
 * Initialize the Malice desktop environment
 */
async function initDesktop() {
  console.log('[Desktop] Initializing...');

  // Load xterm.js from CDN
  const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
    import('https://cdn.jsdelivr.net/npm/xterm@5.3.0/+esm'),
    import('https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/+esm'),
    import('https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.9.0/+esm')
  ]);

  // Get DOM elements
  const windowArea = document.getElementById('window-area');
  const taskbarContainer = document.getElementById('taskbar-container');

  if (!windowArea || !taskbarContainer) {
    console.error('[Desktop] Missing DOM elements');
    return;
  }

  // Determine WebSocket URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = protocol + '//' + window.location.hostname + ':8080/mux';

  // Create window manager first (without client reference)
  const wm = new WindowManager(windowArea, taskbarContainer, null);

  // Set terminal libraries
  wm.setTerminalLibs(Terminal, FitAddon, WebLinksAddon);

  // Create client with window manager reference
  const client = new MaliceClient(wsUrl, wm);

  // Now set client on window manager
  wm.client = client;

  // Create initial terminal window
  await wm.openWindow({
    windowId: 'terminal-main',
    windowType: 'terminal',
    title: 'Terminal',
    channel: 'game',
    x: 50,
    y: 50,
    width: 800,
    height: 500,
    closable: false,  // Main terminal can't be closed
    resizable: true,
    minimizable: true
  });

  // Connect to server
  client.connect();

  // Handle window resize
  window.addEventListener('resize', () => {
    // Refit any maximized windows
    for (const [id, win] of wm.windows) {
      if (win.maximized) {
        win._applyMaximized();
      }
    }
  });

  // Expose for debugging
  window.malice = { wm, client };

  console.log('[Desktop] Initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDesktop);
} else {
  initDesktop();
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
      `[DesktopBuilder] Built $.${DesktopBuilder.alias} -> #${obj.id}`,
    );
    return obj;
  }
}
