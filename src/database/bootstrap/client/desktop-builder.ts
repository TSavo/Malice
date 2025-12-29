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
 * Show login form for pre-authentication
 */
function showLoginForm() {
  document.body.innerHTML = \\\`
    <div style="
      min-height: 100vh;
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="
        background: #141414;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 48px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 16px 64px rgba(0,0,0,0.5);
      ">
        <h1 style="
          color: #00ff88;
          font-size: 32px;
          margin: 0 0 8px 0;
          font-weight: 700;
        ">Malice</h1>
        <p style="
          color: #888;
          margin: 0 0 32px 0;
          font-size: 14px;
        ">Enter your credentials to connect</p>

        <form id="login-form">
          <input type="text" name="username" placeholder="Username" required style="
            width: 100%;
            padding: 12px 16px;
            margin-bottom: 16px;
            background: #0a0a0a;
            border: 1px solid #333;
            border-radius: 6px;
            color: #e0e0e0;
            font-size: 16px;
            box-sizing: border-box;
            outline: none;
          " onfocus="this.style.borderColor='#00ff88'" onblur="this.style.borderColor='#333'">

          <input type="password" name="password" placeholder="Password" required style="
            width: 100%;
            padding: 12px 16px;
            margin-bottom: 24px;
            background: #0a0a0a;
            border: 1px solid #333;
            border-radius: 6px;
            color: #e0e0e0;
            font-size: 16px;
            box-sizing: border-box;
            outline: none;
          " onfocus="this.style.borderColor='#00ff88'" onblur="this.style.borderColor='#333'">

          <button type="submit" style="
            width: 100%;
            padding: 12px 24px;
            background: #00ff88;
            color: #0a0a0a;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          " onmouseover="this.style.background='#00cc6a'" onmouseout="this.style.background='#00ff88'">Connect</button>
        </form>

        <div id="error" style="
          color: #ff6666;
          margin-top: 16px;
          font-size: 14px;
          text-align: center;
        "></div>

        <div style="
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #333;
          text-align: center;
        ">
          <a href="#" id="create-link" style="
            color: #6699ff;
            font-size: 14px;
            text-decoration: none;
          ">Create new character</a>
        </div>
      </div>
    </div>
  \\\`;

  // Login form handler
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '';

    try {
      const resp = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.value,
          password: form.password.value
        })
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        errorDiv.textContent = data.error || 'Invalid credentials';
        return;
      }

      const { token } = await resp.json();
      // Redirect with token - will auto-authenticate
      window.location.href = '/play?token=' + token;
    } catch (err) {
      errorDiv.textContent = 'Connection error. Please try again.';
    }
  };

  // Create new character - skip to terminal flow
  document.getElementById('create-link').onclick = (e) => {
    e.preventDefault();
    window.location.href = '/play?new=1';
  };
}

/**
 * Initialize the Malice desktop environment
 */
async function initDesktop(token) {
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

  // Determine WebSocket URL (with token if provided)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  let wsUrl = protocol + '//' + window.location.hostname + ':8080/mux';
  if (token) {
    wsUrl += '?token=' + encodeURIComponent(token);
  }

  // Create window manager first (without client reference)
  const wm = new WindowManager(windowArea, taskbarContainer, null);

  // Set terminal libraries
  wm.setTerminalLibs(Terminal, FitAddon, WebLinksAddon);

  // Create client with window manager reference
  const client = new MaliceClient(wsUrl, wm);

  // Now set client on window manager
  wm.client = client;

  // Create initial terminal window (maximized)
  await wm.openWindow({
    windowId: 'terminal-main',
    windowType: 'terminal',
    title: 'Terminal',
    channel: 'game',
    config: {
      x: 0,
      y: 0,
      width: 800,
      height: 500,
      maximized: true,
      resizable: true,
      minimizable: true
    }
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

  // Clear token from URL (security - don't leave token in history)
  if (token) {
    window.history.replaceState({}, '', '/play');
  }

  // Expose for debugging
  window.malice = { wm, client };

  console.log('[Desktop] Initialized');
}

/**
 * Main entry point
 */
function main() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const isNew = urlParams.get('new');

  if (!token && !isNew) {
    // No auth - show login form
    showLoginForm();
    return;
  }

  // Have token or new char flow - proceed with desktop
  initDesktop(token);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
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
