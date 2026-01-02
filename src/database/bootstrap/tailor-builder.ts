import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds $tailor object (dynamic ID)
 * AI-powered costume designer for NPCs
 */
export class TailorBuilder implements Builder {
  static provides = ['tailor'];
  static depends = ['aiPrompts']; // Uses $.aiPrompts.tailor

  private tailor: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(force = false): Promise<void> {
    console.log(`[TailorBuilder] build() called, force=${force}`);

    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};
    console.log(
      '[TailorBuilder] Checking for existing alias, found:',
      aliases.tailor,
    );

    if (aliases.tailor) {
      this.tailor = await this.manager.load(aliases.tailor);
      if (this.tailor) {
        console.log(`[TailorBuilder] Already exists at #${aliases.tailor}`);
        if (!force) return;
        console.log('[TailorBuilder] Force rebuilding methods...');
        await this.rebuildMethods();
        return;
      }
    }

    // Create new tailor object
    console.log('[TailorBuilder] Creating new tailor object...');
    const root = await this.manager.load('root');
    this.tailor = await this.manager.create({
      parent: root!,
      properties: {
        name: 'Tailor',
        description: 'AI-powered costume designer for NPCs',
      },
    });

    // Build methods
    await this.rebuildMethods();
  }

  async rebuildMethods(): Promise<void> {
    if (!this.tailor) throw new Error('Tailor object not initialized');

    // ═══════════════════════════════════════════════════════════════════
    // DRESS - Dress an NPC using AI costume designer
    // ═══════════════════════════════════════════════════════════════════

    this.tailor.setMethod(
      'dress',
      `
      const human = args[0];
      const context = args[1] || '';

      if (!human) {
        throw new Error('human is required');
      }

      // Verify it's an object
      if (typeof human.id !== 'number') {
        throw new Error('Expected RuntimeObject, got ' + typeof human);
      }

      // Tailor prompt loaded from docs/prompts/TAILOR.md via $.aiPrompts
      const systemPrompt = $.aiPrompts.tailor;


      const prompt = \`Dress NPC #\${human.id} (\${human.name || 'Unnamed'}).\${context ? \` Context: \${context}\` : ''}\`;

      // Use $query to call Claude with MCP tools
      const result = await $aiQuery('tailor', prompt, null, systemPrompt);

      console.log('[Tailor] Dressed ' + (human.name || 'NPC') + ' (#' + human.id + ')');
      return { success: true, message: result };
    `,
    );

    console.log('[TailorBuilder] Methods rebuilt');
  }

  async registerAliases(): Promise<void> {
    if (!this.tailor) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'tailor', this.tailor.id);
    console.log(`Registered tailor alias -> #${this.tailor.id}`);
  }

  getTailor(): RuntimeObject | null {
    return this.tailor;
  }
}

// Self-register
registerBuilder(TailorBuilder);
