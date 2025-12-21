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
import { NotesBuilder } from './notes-builder.js';
import { CombatBuilder } from './combat-builder.js';
import { PluribusBuilder } from './pluribus-builder.js';
import { MaskBuilder } from './mask-builder.js';
import { SisterGrayBuilder } from './sister-gray-builder.js';

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
 * - Notes ($.notes): Object note attachment system
 * - Combat ($.combat): Combat system manager
 */
export class CoreSystemBuilder {
  constructor(
    private manager: ObjectManager,
    private options: { disableDefaultJobs?: boolean } = {}
  ) {}


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
    const schedulerBuilder = new SchedulerBuilder(this.manager, {
      disableDefaultJobs: this.options.disableDefaultJobs,
    });

    const emoteBuilder = new EmoteBuilder(this.manager);
    const mutexBuilder = new MutexBuilder(this.manager);
    const exclusionsBuilder = new ExclusionsBuilder(this.manager);
    const mementoBuilder = new MementoBuilder(this.manager);
    const formatBuilder = new FormatBuilder(this.manager);
    const plotBuilder = new PlotBuilder(this.manager);
    const aiBuilder = new AiBuilder(this.manager);
    const notesBuilder = new NotesBuilder(this.manager);
    const combatBuilder = new CombatBuilder(this.manager);
    const pluribusBuilder = new PluribusBuilder(this.manager);
    const maskBuilder = new MaskBuilder(this.manager);
    const sisterGrayBuilder = new SisterGrayBuilder(this.manager);

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
    await notesBuilder.build();
    await combatBuilder.build();

    // Build Pluribus and Mask
    // Get prototype IDs from aliases
    const objManager = await this.manager.load(0);
    const aliases = (objManager?.get('aliases') || {}) as Record<string, number>;
    const agentId = aliases.agent || 8; // agent prototype
    const wearableId = aliases.wearable || 36; // wearable prototype
    const humanId = aliases.human || 9; // human prototype
    await pluribusBuilder.build(agentId); // Agent as parent for Pluribus (it acts)
    await maskBuilder.build(wearableId); // Wearable prototype as parent for Mask
    await sisterGrayBuilder.build(humanId); // Human as parent for Sister Gray

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
    await notesBuilder.registerAlias();
    await combatBuilder.registerAlias();
    await pluribusBuilder.registerAlias();
    await maskBuilder.registerAlias();
    await sisterGrayBuilder.registerAlias();
  }

  /**
   * Rebuild methods on existing core system objects
   * Called when FORCE_BOOTSTRAP=true to update methods without recreating objects
   */
  async rebuildMethods(): Promise<void> {
    // Rebuild Prompt methods (critical for chargen)
    console.log('  Rebuilding Prompt methods...');
    const promptBuilder = new PromptBuilder(this.manager);
    await promptBuilder.build(true); // true = force rebuild

    // Rebuild Scheduler methods (critical for timeouts)
    console.log('  Rebuilding Scheduler methods...');
    const schedulerBuilder = new SchedulerBuilder(this.manager, {
      disableDefaultJobs: true, // Don't re-register default jobs
    });
    await schedulerBuilder.build(true);

    // Rebuild CharGen methods
    console.log('  Rebuilding CharGen methods...');
    const charGenBuilder = new CharGenBuilder(this.manager);
    await charGenBuilder.build(true);
    await charGenBuilder.registerAlias();

    // Rebuild AuthManager methods
    console.log('  Rebuilding AuthManager methods...');
    const authManagerBuilder = new AuthManagerBuilder(this.manager);
    await authManagerBuilder.build(true);

    // Rebuild BodyFactory methods
    console.log('  Rebuilding BodyFactory methods...');
    const bodyFactoryBuilder = new BodyFactoryBuilder(this.manager);
    await bodyFactoryBuilder.build(true);

    // Rebuild Format methods
    console.log('  Rebuilding Format methods...');
    const formatBuilder = new FormatBuilder(this.manager);
    await formatBuilder.build(true);

    // Rebuild Recycler methods
    console.log('  Rebuilding Recycler methods...');
    const recyclerBuilder = new RecyclerBuilder(this.manager);
    await recyclerBuilder.build(true);

    // Rebuild PronounSub methods
    console.log('  Rebuilding PronounSub methods...');
    const pronounSubBuilder = new PronounSubBuilder(this.manager);
    await pronounSubBuilder.build(true);

    // Rebuild Exclusions methods
    console.log('  Rebuilding Exclusions methods...');
    const exclusionsBuilder = new ExclusionsBuilder(this.manager);
    await exclusionsBuilder.build(true);

    // Rebuild Emote methods
    console.log('  Rebuilding Emote methods...');
    const emoteBuilder = new EmoteBuilder(this.manager);
    await emoteBuilder.build(true);

    // Rebuild AI methods
    console.log('  Rebuilding AI methods...');
    const aiBuilder = new AiBuilder(this.manager);
    await aiBuilder.build(true);
    await aiBuilder.registerAlias();

    // Rebuild Plot methods
    console.log('  Rebuilding Plot methods...');
    const plotBuilder = new PlotBuilder(this.manager);
    await plotBuilder.build();
    await plotBuilder.registerAliases();

    // Rebuild Notes methods
    console.log('  Rebuilding Notes methods...');
    const notesBuilder = new NotesBuilder(this.manager);
    await notesBuilder.build();
    await notesBuilder.registerAlias();

    // Rebuild Combat methods
    console.log('  Rebuilding Combat methods...');
    const combatBuilder = new CombatBuilder(this.manager);
    await combatBuilder.build();
    await combatBuilder.registerAlias();

    // Rebuild Pluribus/Mask methods
    console.log('  Rebuilding Pluribus/Mask methods...');
    const objManager = await this.manager.load(0);
    const aliases = (objManager?.get('aliases') || {}) as Record<string, number>;
    const agentId = aliases.agent || 8;
    const wearableId = aliases.wearable || 36;
    const humanId = aliases.human || 9;
    const pluribusBuilder = new PluribusBuilder(this.manager);
    const maskBuilder = new MaskBuilder(this.manager);
    const sisterGrayBuilder = new SisterGrayBuilder(this.manager);
    await pluribusBuilder.build(agentId, undefined);
    await maskBuilder.build(wearableId, undefined);
    await sisterGrayBuilder.build(humanId, undefined);
    await pluribusBuilder.registerAlias();
    await maskBuilder.registerAlias();
    await sisterGrayBuilder.registerAlias();

    console.log('  ✅ Core system methods rebuilt');
    console.log('  ✅ Rebuilt AuthManager, CharGen, Prompt, etc. methods');
  }
}
