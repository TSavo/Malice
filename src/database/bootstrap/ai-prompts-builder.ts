import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, '../../../docs');

/**
 * Builds AiPrompts utility object ($.aiPrompts)
 * Loads AI system prompts from disk as properties.
 *
 * Usage from MOO code:
 *   const narratorPrompt = $.aiPrompts.narrator;
 */
export class AiPromptsBuilder {
  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  /**
   * Build the AiPrompts utility or reload prompts on existing object
   */
  async build(_forceRebuild = false): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.aiPrompts) {
      this.obj = await this.manager.load(aliases.aiPrompts);
    }

    // Load prompts from disk
    let narrator = '# Narrator Prompt\n\nFailed to load from disk.';
    try {
      narrator = readFileSync(join(DOCS_DIR, 'NARRATOR-PROMPT.md'), 'utf-8');
      console.log('[AiPromptsBuilder] Loaded NARRATOR-PROMPT.md (' + narrator.length + ' chars)');
    } catch (e) {
      console.error('[AiPromptsBuilder] Failed to load NARRATOR-PROMPT.md:', e);
    }

    if (!this.obj) {
      // Create new AiPrompts utility
      const root = await this.manager.load(1);
      this.obj = await this.manager.create({
        parent: root!,
        properties: {
          name: 'AiPrompts',
          description: 'AI system prompts loaded from disk',
          narrator,
        },
        methods: {},
      });

      // Register alias
      aliases.aiPrompts = this.obj.id;
      objectManager.set('aliases', aliases);
      console.log('[AiPromptsBuilder] Created $.aiPrompts as #' + this.obj.id);
    } else {
      // Update existing - reload prompts from disk
      this.obj.set('narrator', narrator);
      console.log('[AiPromptsBuilder] Reloaded $.aiPrompts.narrator from disk');
    }
  }
}
