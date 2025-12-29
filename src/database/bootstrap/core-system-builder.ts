import type { ObjectManager } from '../object-manager.js';
import { AiBuilder } from './ai-builder.js';
import { AiPromptsBuilder } from './ai-prompts-builder.js';
import { AuthManagerBuilder } from './auth-manager-builder.js';
import { BodyFactoryBuilder } from './body-factory-builder.js';
import { CartelCharGenBuilder } from './cartel-chargen-builder.js';
import { CharGenBuilder } from './chargen-builder.js';
import { ClientBuilder } from './client/index.js';
import { CombatBuilder } from './combat-builder.js';
import { CartelDomainBuilder } from './cartel-domain-builder.js';
import { ContinuumDomainBuilder } from './continuum-domain-builder.js';
import { DomainRegistryBuilder } from './domain-registry-builder.js';
import { EmoteBuilder } from './emote-builder.js';
import { EnglishBuilder } from './english-builder.js';
import { ExclusionsBuilder } from './exclusions-builder.js';
import { FormatBuilder } from './format-builder.js';
import { GreeterBuilder } from './greeter-builder.js';
import { MaskBuilder } from './mask-builder.js';
import { MCPBuilder } from './mcp-builder.js';
import { MementoBuilder } from './memento-builder.js';
import { MutexBuilder } from './mutex-builder.js';
import { NewsBuilder } from './news-builder.js';
import { NotesBuilder } from './notes-builder.js';
import { PlotBuilder } from './plot-builder.js';
import { PluribusBuilder } from './pluribus-builder.js';
import { PreAuthHandlerBuilder } from './preauth-handler-builder.js';
import { PromptBuilder } from './prompt-builder.js';
import { PronounSubBuilder } from './pronoun-sub-builder.js';
import { ProportionalBuilder } from './proportional-builder.js';
import { RecyclerBuilder } from './recycler-builder.js';
import { RoomBuilder } from './room-builder.js';
import { SchedulerBuilder } from './scheduler-builder.js';
import { SessionBuilder } from './session-builder.js';
import { SisterGrayBuilder } from './sister-gray-builder.js';
import { SpatialBuilder } from './spatial-builder.js';
import { TailorBuilder } from './tailor-builder.js';
import { WebDomainBuilder } from './web-domain-builder.js';
import { WebNodeBuilder } from './web-node-builder.js';
import { WebRouteBuilder } from './web-route-builder.js';
import { WebRouterBuilder } from './web-router-builder.js';
import { WebsiteBuilder } from './website-builder.js';
import { WorldApiBuilder } from './world-api-builder.js';

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
 * - AiPrompts ($.aiPrompts): AI system prompts loaded from disk
 * - Notes ($.notes): Object note attachment system
 * - Combat ($.combat): Combat system manager
 */
export class CoreSystemBuilder {
  constructor(
    private manager: ObjectManager,
    private options: { disableDefaultJobs?: boolean } = {},
  ) {}

  /**
   * Build all core system objects
   */
  async buildCoreSystems(): Promise<void> {
    const authManagerBuilder = new AuthManagerBuilder(this.manager);
    const charGenBuilder = new CharGenBuilder(this.manager);
    const cartelCharGenBuilder = new CartelCharGenBuilder(this.manager);
    const preAuthHandlerBuilder = new PreAuthHandlerBuilder(this.manager);
    const recyclerBuilder = new RecyclerBuilder(this.manager);
    const spatialBuilder = new SpatialBuilder(this.manager);
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
    const aiPromptsBuilder = new AiPromptsBuilder(this.manager);
    const greeterBuilder = new GreeterBuilder(this.manager);
    const newsBuilder = new NewsBuilder(this.manager);
    const notesBuilder = new NotesBuilder(this.manager);
    const combatBuilder = new CombatBuilder(this.manager);
    const pluribusBuilder = new PluribusBuilder(this.manager);
    const maskBuilder = new MaskBuilder(this.manager);
    const sisterGrayBuilder = new SisterGrayBuilder(this.manager);
    const mcpBuilder = new MCPBuilder(this.manager);
    const sessionBuilder = new SessionBuilder(this.manager);
    const tailorBuilder = new TailorBuilder(this.manager);
    const webNodeBuilder = new WebNodeBuilder(this.manager);
    const webDomainBuilder = new WebDomainBuilder(this.manager);
    const domainRegistryBuilder = new DomainRegistryBuilder(this.manager);
    const webRouteBuilder = new WebRouteBuilder(this.manager);
    const webRouterBuilder = new WebRouterBuilder(this.manager);
    const worldApiBuilder = new WorldApiBuilder(this.manager);
    const websiteBuilder = new WebsiteBuilder(this.manager);
    const continuumDomainBuilder = new ContinuumDomainBuilder(this.manager);
    const cartelDomainBuilder = new CartelDomainBuilder(this.manager);

    await authManagerBuilder.build();
    await charGenBuilder.build();
    await cartelCharGenBuilder.build();
    await preAuthHandlerBuilder.build();
    await recyclerBuilder.build();
    await spatialBuilder.build();
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
    await aiPromptsBuilder.build();
    await greeterBuilder.build();
    await newsBuilder.build();
    await notesBuilder.build();
    await combatBuilder.build();

    // Build Pluribus and Mask
    // Get prototype IDs from aliases
    const objManager = await this.manager.load(0);
    const aliases = (objManager?.get('aliases') || {}) as Record<
      string,
      number
    >;
    const agentId = aliases.agent || 8; // agent prototype
    const wearableId = aliases.wearable || 36; // wearable prototype
    const humanId = aliases.human || 9; // human prototype
    await pluribusBuilder.build(agentId); // Agent as parent for Pluribus (it acts)
    await maskBuilder.build(wearableId); // Wearable prototype as parent for Mask
    await sisterGrayBuilder.build(humanId); // Human as parent for Sister Gray
    // Web node/domain/route tree - must register aliases immediately for dependencies
    await webNodeBuilder.build();
    await webNodeBuilder.registerAlias(); // Register now - webDomain needs it
    await webDomainBuilder.build();
    await webDomainBuilder.registerAlias(); // Register now - domainRegistry needs it
    await domainRegistryBuilder.build();
    await domainRegistryBuilder.registerAlias(); // Register now - continuumDomain needs it
    await webRouteBuilder.build();
    await webRouteBuilder.registerAlias(); // Register now - continuumDomain needs it
    await webRouterBuilder.build(); // Web router object (legacy, to be removed)
    await worldApiBuilder.build(); // World API for map routes
    await websiteBuilder.build(); // Website objects (includes API routes)

    // Build client JS modules (must be before continuumDomainBuilder which creates routes)
    const clientBuilder = new ClientBuilder(this.manager);
    await clientBuilder.build();

    await continuumDomainBuilder.build(); // thecontinuum.city domain
    await cartelDomainBuilder.build(); // graycartel.com domain
    await mcpBuilder.build(); // MCP code-first tools
    await sessionBuilder.build(); // Session management wrapper
    await tailorBuilder.build(); // AI costume designer

    // Register aliases
    await authManagerBuilder.registerAlias();
    await charGenBuilder.registerAlias();
    await cartelCharGenBuilder.registerAlias();
    await preAuthHandlerBuilder.registerAlias();
    await recyclerBuilder.registerAlias();
    await spatialBuilder.registerAlias();
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
    await greeterBuilder.registerAlias();
    await newsBuilder.registerAlias();
    await notesBuilder.registerAlias();
    await combatBuilder.registerAlias();
    await pluribusBuilder.registerAlias();
    await maskBuilder.registerAlias();
    await sisterGrayBuilder.registerAlias();
    // webNode, webDomain, domainRegistry, webRoute already registered above
    await webRouterBuilder.registerAlias();
    await worldApiBuilder.registerAlias();
    await websiteBuilder.registerAliases();
    await continuumDomainBuilder.registerAlias();
    await cartelDomainBuilder.registerAlias();
    await mcpBuilder.registerAliases();
    await tailorBuilder.registerAlias();

    // Register wake jobs now that Pluribus/SisterGray aliases exist
    await schedulerBuilder.registerWakeJobs();
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

    // Rebuild Spatial methods
    console.log('  Rebuilding Spatial methods...');
    const spatialBuilder = new SpatialBuilder(this.manager);
    await spatialBuilder.build(true);
    await spatialBuilder.registerAlias();

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

    // Rebuild Greeter methods
    console.log('  Rebuilding Greeter methods...');
    const greeterBuilder = new GreeterBuilder(this.manager);
    await greeterBuilder.build(true);
    await greeterBuilder.registerAlias();

    // Rebuild Plot methods
    console.log('  Rebuilding Plot methods...');
    const plotBuilder = new PlotBuilder(this.manager);
    await plotBuilder.build();
    await plotBuilder.registerAliases();

    // Rebuild News methods
    console.log('  Rebuilding News methods...');
    const newsBuilder = new NewsBuilder(this.manager);
    await newsBuilder.build(true);
    await newsBuilder.registerAlias();

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
    const aliases = (objManager?.get('aliases') || {}) as Record<
      string,
      number
    >;
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

    // Rebuild WebNode methods
    console.log('  Rebuilding WebNode methods...');
    const webNodeBuilder = new WebNodeBuilder(this.manager);
    await webNodeBuilder.build(true);
    await webNodeBuilder.registerAlias();

    // Rebuild WebDomain methods
    console.log('  Rebuilding WebDomain methods...');
    const webDomainBuilder = new WebDomainBuilder(this.manager);
    await webDomainBuilder.build(true);
    await webDomainBuilder.registerAlias();

    // Rebuild DomainRegistry methods
    console.log('  Rebuilding DomainRegistry methods...');
    const domainRegistryBuilder = new DomainRegistryBuilder(this.manager);
    await domainRegistryBuilder.build(true);
    await domainRegistryBuilder.registerAlias();

    // Rebuild WebRoute methods
    console.log('  Rebuilding WebRoute methods...');
    const webRouteBuilder = new WebRouteBuilder(this.manager);
    await webRouteBuilder.build(true);
    await webRouteBuilder.registerAlias();

    // Rebuild WebRouter methods
    console.log('  Rebuilding WebRouter methods...');
    const webRouterBuilder = new WebRouterBuilder(this.manager);
    await webRouterBuilder.build(true);
    await webRouterBuilder.registerAlias();

    // Rebuild Website methods
    console.log('  Rebuilding Website methods...');
    const websiteBuilder = new WebsiteBuilder(this.manager);
    await websiteBuilder.build(true);
    await websiteBuilder.registerAliases();

    // Rebuild Continuum Domain methods
    console.log('  Rebuilding ContinuumDomain methods...');
    const continuumDomainBuilder = new ContinuumDomainBuilder(this.manager);
    await continuumDomainBuilder.build(true);
    await continuumDomainBuilder.registerAlias();

    // Rebuild Cartel Domain methods
    console.log('  Rebuilding CartelDomain methods...');
    const cartelDomainBuilder = new CartelDomainBuilder(this.manager);
    await cartelDomainBuilder.build(true);
    await cartelDomainBuilder.registerAlias();

    // Rebuild MCP methods
    console.log('  Rebuilding MCP methods...');
    const mcpBuilder = new MCPBuilder(this.manager);
    await mcpBuilder.build(true);
    await mcpBuilder.registerAliases();

    // Rebuild Session methods
    console.log('  Rebuilding Session methods...');
    const sessionBuilder = new SessionBuilder(this.manager);
    await sessionBuilder.build(true);

    // Rebuild Tailor methods
    console.log('  Rebuilding Tailor methods...');
    const tailorBuilder = new TailorBuilder(this.manager);
    await tailorBuilder.build(true);
    await tailorBuilder.registerAlias();

    console.log('  ✅ Core system methods rebuilt');
    console.log('  ✅ Rebuilt AuthManager, CharGen, Prompt, etc. methods');
  }
}
