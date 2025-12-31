import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the Desktop entry point client module
 *
 * Creates $.desktopJs which serves /js/desktop.js
 * Main entry point that initializes the windowed desktop.
 */
export class DesktopBuilder implements Builder {
  static provides = ['desktopJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.desktopJs && !forceRebuild) {
      this.obj = $.desktopJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('DesktopBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'Desktop JS Module',
        description: 'Desktop entry point - initializes windowed UI',
      },
      methods: {},
    });

    const obj = this.obj;

    obj.setMethod(
      'getScript',
      `
      return \`
import { WindowManager } from '/js/window-manager';
import { MaliceClient } from '/js/malice-client';

/**
 * Show login form for pre-authentication
 */
function showLoginForm() {
  document.body.innerHTML = \\\`
    <style>
      .login-container { min-height: 100vh; background: var(--theme-bg, #0a0a0a); display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif; }
      .login-box { background: #141414; border: 1px solid var(--theme-border, #333); border-radius: 12px; padding: 48px; width: 100%; max-width: 400px; box-shadow: 0 16px 64px rgba(0,0,0,0.5); }
      .login-title { color: var(--theme-accent, #00ff88); font-size: 32px; margin: 0 0 8px 0; font-weight: 700; }
      .login-subtitle { color: #888; margin: 0 0 32px 0; font-size: 14px; }
      .login-input { width: 100%; padding: 12px 16px; margin-bottom: 16px; background: var(--theme-bg, #0a0a0a); border: 1px solid var(--theme-border, #333); border-radius: 6px; color: #e0e0e0; font-size: 16px; box-sizing: border-box; outline: none; }
      .login-input:focus { border-color: var(--theme-accent, #00ff88); }
      .login-input.password { margin-bottom: 24px; }
      .login-button { width: 100%; padding: 12px 24px; background: var(--theme-accent, #00ff88); color: var(--theme-bg, #0a0a0a); border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; filter: brightness(1); transition: filter 0.15s; }
      .login-button:hover { filter: brightness(0.85); }
      .login-error { color: #ff6666; margin-top: 16px; font-size: 14px; text-align: center; }
      .login-footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--theme-border, #333); text-align: center; }
      .login-link { color: #6699ff; font-size: 14px; text-decoration: none; }
    </style>
    <div class="login-container">
      <div class="login-box">
        \\\${window.MALICE_THEME?.name ? '<h1 class="login-title">' + window.MALICE_THEME.name + '</h1>' : ''}
        \\\${window.MALICE_THEME?.tagline ? '<p class="login-subtitle">' + window.MALICE_THEME.tagline + '</p>' : ''}
        <form id="login-form">
          <input type="text" name="username" placeholder="Username" required class="login-input">
          <input type="password" name="password" placeholder="Password" required class="login-input password">
          <button type="submit" class="login-button">Connect</button>
        </form>
        <div id="error" class="login-error"></div>
        <div class="login-footer">
          <a href="#" id="create-link" class="login-link">Create new account</a>
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

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        if (data.needsVerification) {
          errorDiv.innerHTML = data.error + '<br><small style="color:#888;">Check ' + data.email + ' for verification link</small>';
        } else {
          errorDiv.textContent = data.error || 'Invalid credentials';
        }
        return;
      }

      const { token } = data;
      // Redirect with token - will auto-authenticate
      window.location.href = '/play?token=' + token;
    } catch (err) {
      errorDiv.textContent = 'Connection error. Please try again.';
    }
  };

  // Create new account - show registration form
  document.getElementById('create-link').onclick = (e) => {
    e.preventDefault();
    showRegisterForm();
  };
}

/**
 * Show registration form for creating new account
 */
function showRegisterForm() {
  document.body.innerHTML = \\\`
    <style>
      .reg-container { min-height: 100vh; background: var(--theme-bg, #0a0a0a); display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif; }
      .reg-box { background: #141414; border: 1px solid var(--theme-border, #333); border-radius: 12px; padding: 48px; width: 100%; max-width: 400px; box-shadow: 0 16px 64px rgba(0,0,0,0.5); }
      .reg-title { color: var(--theme-accent, #00ff88); font-size: 32px; margin: 0 0 8px 0; font-weight: 700; }
      .reg-subtitle { color: #888; margin: 0 0 32px 0; font-size: 14px; }
      .reg-input { width: 100%; padding: 12px 16px; margin-bottom: 16px; background: var(--theme-bg, #0a0a0a); border: 1px solid var(--theme-border, #333); border-radius: 6px; color: #e0e0e0; font-size: 16px; box-sizing: border-box; outline: none; }
      .reg-input:focus { border-color: var(--theme-accent, #00ff88); }
      .reg-input.last { margin-bottom: 24px; }
      .reg-button { width: 100%; padding: 12px 24px; background: var(--theme-accent, #00ff88); color: var(--theme-bg, #0a0a0a); border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; filter: brightness(1); transition: filter 0.15s; }
      .reg-button:hover { filter: brightness(0.85); }
      .reg-error { color: #ff6666; margin-top: 16px; font-size: 14px; text-align: center; }
      .reg-success { color: var(--theme-accent, #00ff88); margin-top: 16px; font-size: 14px; text-align: center; display: none; }
      .reg-footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--theme-border, #333); text-align: center; }
      .reg-link { color: #6699ff; font-size: 14px; text-decoration: none; }
    </style>
    <div class="reg-container">
      <div class="reg-box">
        \\\${window.MALICE_THEME?.name ? '<h1 class="reg-title">' + window.MALICE_THEME.name + '</h1>' : ''}
        \\\${window.MALICE_THEME?.registerTagline ? '<p class="reg-subtitle">' + window.MALICE_THEME.registerTagline + '</p>' : ''}
        <form id="register-form">
          <input type="text" name="username" placeholder="Username" required class="reg-input" pattern="[a-zA-Z][a-zA-Z0-9_]{2,15}" title="3-16 characters, start with letter, letters/numbers/underscore only">
          <input type="email" name="email" placeholder="Email address" required class="reg-input">
          <input type="password" name="password" placeholder="Password (min 6 chars)" required minlength="6" class="reg-input">
          <input type="password" name="confirmPassword" placeholder="Confirm Password" required class="reg-input last">
          <button type="submit" class="reg-button">Create Account</button>
        </form>
        <div id="error" class="reg-error"></div>
        <div id="success" class="reg-success"></div>
        <div class="reg-footer">
          <a href="#" id="login-link" class="reg-link">Already have an account? Login</a>
        </div>
      </div>
    </div>
  \\\`;

  // Register form handler
  document.getElementById('register-form').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');
    errorDiv.textContent = '';
    successDiv.style.display = 'none';

    // Validate passwords match
    if (form.password.value !== form.confirmPassword.value) {
      errorDiv.textContent = 'Passwords do not match';
      return;
    }

    try {
      const resp = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.value,
          email: form.email.value,
          password: form.password.value
        })
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        errorDiv.textContent = data.error || 'Registration failed';
        return;
      }

      // Success - show message to check email
      successDiv.textContent = 'Account created! Please check your email to verify your account.';
      successDiv.style.display = 'block';

      // Redirect to login after a bit longer for them to read the message
      setTimeout(() => {
        showLoginForm();
      }, 3000);
    } catch (err) {
      errorDiv.textContent = 'Connection error. Please try again.';
    }
  };

  // Back to login link
  document.getElementById('login-link').onclick = (e) => {
    e.preventDefault();
    showLoginForm();
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

  // Determine WebSocket URL (with token and/or mode if provided)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  let wsUrl = protocol + '//' + window.location.hostname + ':8080/mux';
  const params = [];
  if (token) {
    params.push('token=' + encodeURIComponent(token));
  }
  // Check for chargen mode (e.g., 'cartel' for Gray Cartel path)
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  if (mode) {
    params.push('mode=' + encodeURIComponent(mode));
  }
  if (params.length > 0) {
    wsUrl += '?' + params.join('&');
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
  const showReg = urlParams.get('register');

  if (showReg) {
    // Direct to registration form
    showRegisterForm();
    return;
  }

  if (!token) {
    // No auth - show login form
    showLoginForm();
    return;
  }

  // Have token - proceed with desktop
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

    console.log(`[DesktopBuilder] Built $.desktopJs -> #${obj.id}`);
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'desktopJs', this.obj.id);
  }
}

// Self-register
registerBuilder(DesktopBuilder);
