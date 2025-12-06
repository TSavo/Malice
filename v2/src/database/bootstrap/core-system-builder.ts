import { ObjectManager } from '../object-manager.js';
import { AuthManagerBuilder } from './auth-manager-builder.js';
import { CharGenBuilder } from './chargen-builder.js';
import { PreAuthHandlerBuilder } from './preauth-handler-builder.js';
import { RecyclerBuilder } from './recycler-builder.js';
import { PronounSubBuilder } from './pronoun-sub-builder.js';
import { RoomBuilder } from './room-builder.js';
import { BodyFactoryBuilder } from './body-factory-builder.js';
import { PromptBuilder } from './prompt-builder.js';

/**
 * Orchestrates building all core system objects
 *
 * Creates (with dynamic IDs):
 * - AuthManager: Interactive login (username/password)
 * - CharGen: Character creation
 * - PreAuthHandler: Pre-authenticated connections (SSL, HTTP auth)
 * - Recycler: Object deletion and cleanup
 * - PronounSub ($.pronoun): Pronoun substitution system
 * - Room ($.room): Room-wide announcement utility
 * - BodyFactory ($.bodyFactory): Creates human bodies
 * - Prompt ($.prompt): Interactive prompt system
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
    const pronounSubBuilder = new PronounSubBuilder(this.manager);
    const roomBuilder = new RoomBuilder(this.manager);
    const bodyFactoryBuilder = new BodyFactoryBuilder(this.manager);
    const promptBuilder = new PromptBuilder(this.manager);

    await authManagerBuilder.build();
    await charGenBuilder.build();
    await preAuthHandlerBuilder.build();
    await recyclerBuilder.build();
    await pronounSubBuilder.build();
    await roomBuilder.build();
    await bodyFactoryBuilder.build();
    await promptBuilder.build();

    // Register aliases
    await authManagerBuilder.registerAlias();
    await charGenBuilder.registerAlias();
    await preAuthHandlerBuilder.registerAlias();
    await recyclerBuilder.registerAlias();
    await pronounSubBuilder.registerAlias();
    await roomBuilder.registerAlias();
    await bodyFactoryBuilder.registerAlias();
    await promptBuilder.registerAlias();
  }
}
