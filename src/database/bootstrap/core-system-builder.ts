import { ObjectManager } from '../object-manager.js';
import { AuthManagerBuilder } from './auth-manager-builder.js';
import { CharGenBuilder } from './chargen-builder.js';
import { PreAuthHandlerBuilder } from './preauth-handler-builder.js';
import { RecyclerBuilder } from './recycler-builder.js';
import { PronounSubBuilder } from './pronoun-sub-builder.js';
import { ProportionalBuilder } from './proportional-builder.js';
import { EnglishBuilder } from './english-builder.js';
import { RoomBuilder } from './room-builder.js';
import { BodyFactoryBuilder } from './body-factory-builder.js';
import { PromptBuilder } from './prompt-builder.js';
import { SchedulerBuilder } from './scheduler-builder.js';
import { EmoteBuilder } from './emote-builder.js';
import { MutexBuilder } from './mutex-builder.js';
import { ExclusionsBuilder } from './exclusions-builder.js';
import { MementoBuilder } from './memento-builder.js';
import { FormatBuilder } from './format-builder.js';
import { PlotBuilder } from './plot-builder.js';
import { AiBuilder } from './ai-builder.js';

/**
 * Orchestrates building all core system objects
 *
 * Creates (with dynamic IDs):
 * - AuthManager: Interactive login (username/password)
 * - CharGen: Character creation
 * - PreAuthHandler: Pre-authenticated connections (SSL, HTTP auth)
 * - Recycler: Object deletion and cleanup
 * - PronounSub ($.pronoun): Pronoun substitution system
 * - Proportional ($.proportional): Proportional message selection
 * - English ($.english): English text formatting utilities
 * - Room ($.room): Room-wide announcement utility
 * - BodyFactory ($.bodyFactory): Creates human bodies
 * - Prompt ($.prompt): Interactive prompt system
 * - Scheduler ($.scheduler): Global job scheduler for periodic tasks
 * - Emote ($.emote): Freeform emote parsing and formatting
 * - Mutex ($.mutex): Object-based mutex locks with data and expiration
 * - Exclusions ($.exclusions): Action exclusion system using mutexes
 * - Memento ($.memento): Object graph serialization for cloning/templates
 * - Format ($.format): Text formatting for columns, tables, and layout
 * - Plot ($.plot): Narrative event log prototype
 * - PlotSpawner ($.plotSpawner): Base prototype for plot-generating entities
 * - AI ($.ai): Registry for AI-controlled humans
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
    const proportionalBuilder = new ProportionalBuilder(this.manager);
    const englishBuilder = new EnglishBuilder(this.manager);
    const roomBuilder = new RoomBuilder(this.manager);
    const bodyFactoryBuilder = new BodyFactoryBuilder(this.manager);
    const promptBuilder = new PromptBuilder(this.manager);
    const schedulerBuilder = new SchedulerBuilder(this.manager);
    const emoteBuilder = new EmoteBuilder(this.manager);
    const mutexBuilder = new MutexBuilder(this.manager);
    const exclusionsBuilder = new ExclusionsBuilder(this.manager);
    const mementoBuilder = new MementoBuilder(this.manager);
    const formatBuilder = new FormatBuilder(this.manager);
    const plotBuilder = new PlotBuilder(this.manager);
    const aiBuilder = new AiBuilder(this.manager);

    await authManagerBuilder.build();
    await charGenBuilder.build();
    await preAuthHandlerBuilder.build();
    await recyclerBuilder.build();
    await pronounSubBuilder.build();
    await proportionalBuilder.build();
    await englishBuilder.build();
    await roomBuilder.build();
    await bodyFactoryBuilder.build();
    await promptBuilder.build();
    await schedulerBuilder.build();
    await emoteBuilder.build();
    await mutexBuilder.build();
    await exclusionsBuilder.build();
    await mementoBuilder.build();
    await formatBuilder.build();
    await plotBuilder.build();
    await aiBuilder.build();

    // Register aliases
    await authManagerBuilder.registerAlias();
    await charGenBuilder.registerAlias();
    await preAuthHandlerBuilder.registerAlias();
    await recyclerBuilder.registerAlias();
    await pronounSubBuilder.registerAlias();
    await proportionalBuilder.registerAlias();
    await englishBuilder.registerAlias();
    await roomBuilder.registerAlias();
    await bodyFactoryBuilder.registerAlias();
    await promptBuilder.registerAlias();
    await schedulerBuilder.registerAlias();
    await emoteBuilder.registerAlias();
    await mutexBuilder.registerAlias();
    await exclusionsBuilder.registerAlias();
    await mementoBuilder.registerAlias();
    await formatBuilder.registerAlias();
    await plotBuilder.registerAliases();
    await aiBuilder.registerAlias();
  }
}
