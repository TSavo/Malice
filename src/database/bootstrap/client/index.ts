import type { ObjectManager } from '../../object-manager';
import { DesktopBuilder } from './desktop-builder';
import { HtmlWindowBuilder } from './html-window-builder';
import { IframeWindowBuilder } from './iframe-window-builder';
import { MaliceClientBuilder } from './malice-client-builder';
import { TaskbarBuilder } from './taskbar-builder';
import { TerminalWindowBuilder } from './terminal-window-builder';
import { WindowBuilder } from './window-builder';
import { WindowManagerBuilder } from './window-manager-builder';

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

  async build(): Promise<void> {
    console.log('[ClientBuilder] Building client modules...');

    // Build in dependency order
    const windowBuilder = new WindowBuilder(this.manager);
    await windowBuilder.build();

    const terminalWindowBuilder = new TerminalWindowBuilder(this.manager);
    await terminalWindowBuilder.build();

    const htmlWindowBuilder = new HtmlWindowBuilder(this.manager);
    await htmlWindowBuilder.build();

    const iframeWindowBuilder = new IframeWindowBuilder(this.manager);
    await iframeWindowBuilder.build();

    const taskbarBuilder = new TaskbarBuilder(this.manager);
    await taskbarBuilder.build();

    const windowManagerBuilder = new WindowManagerBuilder(this.manager);
    await windowManagerBuilder.build();

    const maliceClientBuilder = new MaliceClientBuilder(this.manager);
    await maliceClientBuilder.build();

    const desktopBuilder = new DesktopBuilder(this.manager);
    await desktopBuilder.build();

    console.log('[ClientBuilder] Client modules built');
  }
}

// Export individual builders for direct use
export { DesktopBuilder } from './desktop-builder';
export { HtmlWindowBuilder } from './html-window-builder';
export { IframeWindowBuilder } from './iframe-window-builder';
export { MaliceClientBuilder } from './malice-client-builder';
export { TaskbarBuilder } from './taskbar-builder';
export { TerminalWindowBuilder } from './terminal-window-builder';
export { WindowBuilder } from './window-builder';
export { WindowManagerBuilder } from './window-manager-builder';
