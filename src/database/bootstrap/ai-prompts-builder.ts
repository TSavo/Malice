import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, '../../../docs');
const PROMPTS_DIR = join(DOCS_DIR, 'prompts');

/** Prompt file definitions: property name -> filename */
const PROMPT_FILES: Record<string, string> = {
  narrator: 'NARRATOR-PROMPT.md', // In docs/ root
  pluribus: 'PLURIBUS.md',
  sisterGray: 'SISTER-GRAY.md',
  tailor: 'TAILOR.md',
  defaultAgent: 'DEFAULT-AGENT.md',
  immigrationOfficer: 'IMMIGRATION-OFFICER.md',
  ghostInterviewer: 'GHOST-INTERVIEWER.md',
};

/**
 * Builds AiPrompts utility object ($.aiPrompts)
 * Loads AI system prompts from disk as properties.
 *
 * Usage from MOO code:
 *   const narratorPrompt = $.aiPrompts.narrator;
 *   const pluribusPrompt = $.aiPrompts.pluribus;
 */
export class AiPromptsBuilder {
  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  /**
   * Load a prompt file from disk
   */
  private loadPrompt(name: string, filename: string): string {
    const fallback = `# ${name} Prompt\n\nFailed to load from disk.`;
    try {
      // narrator is in docs/, others are in docs/prompts/
      const dir = name === 'narrator' ? DOCS_DIR : PROMPTS_DIR;
      const content = readFileSync(join(dir, filename), 'utf-8');
      console.log(
        `[AiPromptsBuilder] Loaded ${filename} (${content.length} chars)`,
      );
      return content;
    } catch (e) {
      console.error(`[AiPromptsBuilder] Failed to load ${filename}:`, e);
      return fallback;
    }
  }

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

    // Load all prompts from disk
    const prompts: Record<string, string> = {};
    for (const [name, filename] of Object.entries(PROMPT_FILES)) {
      prompts[name] = this.loadPrompt(name, filename);
    }

    if (!this.obj) {
      // Create new AiPrompts utility
      const root = await this.manager.load(1);
      this.obj = await this.manager.create({
        parent: root!,
        properties: {
          name: 'AiPrompts',
          description: 'AI system prompts loaded from disk',
          ...prompts,
        },
        methods: {},
      });

      // Register alias
      aliases.aiPrompts = this.obj.id;
      objectManager.set('aliases', aliases);
      console.log(`[AiPromptsBuilder] Created $.aiPrompts as #${this.obj.id}`);
    } else {
      // Update existing - reload all prompts from disk
      for (const [name, content] of Object.entries(prompts)) {
        this.obj.set(name, content);
      }
      console.log(
        `[AiPromptsBuilder] Reloaded ${Object.keys(prompts).length} prompts from disk`,
      );
    }
  }
}
