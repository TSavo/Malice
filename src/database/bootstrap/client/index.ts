import type { ObjectManager } from '../../object-manager.js';
import { DesktopBuilder } from './desktop-builder.js';
import { HtmlWindowBuilder } from './html-window-builder.js';
import { IframeWindowBuilder } from './iframe-window-builder.js';
import { MaliceClientBuilder } from './malice-client-builder.js';
import { TaskbarBuilder } from './taskbar-builder.js';
import { TerminalWindowBuilder } from './terminal-window-builder.js';
import { WindowBuilder } from './window-builder.js';
import { WindowManagerBuilder } from './window-manager-builder.js';

/**
 * Orchestrates building all client-side JavaScript modules
 *
 * Each module is a MOO object with getScript() that returns ES module code.
 * The browser loads /js/desktop.js which imports the other modules.
 *
 * Build order matters - dependencies must be built first:
 * 1. Window (base class)
 * 2. TerminalWindow, HtmlWindow, IframeWindow (extend Window)
 * 3. Taskbar
 * 4. WindowManager (uses Window types, Taskbar)
 * 5. MaliceClient (WebSocket handling)
 * 6. Desktop (entry point, imports all)
 */
export class ClientBuilder {
  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    console.log('[ClientBuilder] Building client modules...');

    // Build in dependency order
    const windowBuilder = new WindowBuilder(this.manager);
    await windowBuilder.build(forceRebuild);

    const terminalWindowBuilder = new TerminalWindowBuilder(this.manager);
    await terminalWindowBuilder.build(forceRebuild);

    const htmlWindowBuilder = new HtmlWindowBuilder(this.manager);
    await htmlWindowBuilder.build(forceRebuild);

    const iframeWindowBuilder = new IframeWindowBuilder(this.manager);
    await iframeWindowBuilder.build(forceRebuild);

    const taskbarBuilder = new TaskbarBuilder(this.manager);
    await taskbarBuilder.build(forceRebuild);

    const windowManagerBuilder = new WindowManagerBuilder(this.manager);
    await windowManagerBuilder.build(forceRebuild);

    const maliceClientBuilder = new MaliceClientBuilder(this.manager);
    await maliceClientBuilder.build(forceRebuild);

    const desktopBuilder = new DesktopBuilder(this.manager);
    await desktopBuilder.build(forceRebuild);

    console.log('[ClientBuilder] Client modules built');
  }
}

// Export individual builders for direct use
export { DesktopBuilder } from './desktop-builder.js';
export { HtmlWindowBuilder } from './html-window-builder.js';
export { IframeWindowBuilder } from './iframe-window-builder.js';
export { MaliceClientBuilder } from './malice-client-builder.js';
export { TaskbarBuilder } from './taskbar-builder.js';
export { TerminalWindowBuilder } from './terminal-window-builder.js';
export { WindowBuilder } from './window-builder.js';
export { WindowManagerBuilder } from './window-manager-builder.js';
