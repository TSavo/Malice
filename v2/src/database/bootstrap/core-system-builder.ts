import { ObjectManager } from '../object-manager.js';
import { AuthManagerBuilder } from './auth-manager-builder.js';
import { CharGenBuilder } from './chargen-builder.js';
import { PreAuthHandlerBuilder } from './preauth-handler-builder.js';
import { RecyclerBuilder } from './recycler-builder.js';

/**
 * Orchestrates building all core system objects
 *
 * Creates:
 * - #4 AuthManager: Interactive login (username/password)
 * - #5 CharGen: Character creation
 * - #6 PreAuthHandler: Pre-authenticated connections (SSL, HTTP auth)
 * - #20 Recycler: Object deletion and cleanup
 */
export class CoreSystemBuilder {
  constructor(private manager: ObjectManager) {}

  /**
   * Build all core system objects
   */
  async buildCoreSystems(): Promise<void> {
    const authManagerBuilder = new AuthManagerBuilder(this.manager);
    const charGenBuilder = new CharGenBuilder(this.manager);
    const preAuthHandlerBuilder = new PreAuthHandlerBuilder(this.manager);
    const recyclerBuilder = new RecyclerBuilder(this.manager);

    await authManagerBuilder.build();
    await charGenBuilder.build();
    await preAuthHandlerBuilder.build();
    await recyclerBuilder.build();

    // Register aliases
    await authManagerBuilder.registerAlias();
    await charGenBuilder.registerAlias();
    await preAuthHandlerBuilder.registerAlias();
    await recyclerBuilder.registerAlias();
  }
}
