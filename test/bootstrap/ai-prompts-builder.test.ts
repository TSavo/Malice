import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Test AiPromptsBuilder path resolution (PR #118)
 * Verifies that narrator prompt is loaded from internal/ subdirectory
 * and other prompts are loaded from prompts/ subdirectory
 */
describe('AiPromptsBuilder - Path Resolution', () => {
  const docsDir = join(process.cwd(), 'docs');

  it('should load narrator prompt from internal/ subdirectory', () => {
    const narratorPath = join(docsDir, 'internal', 'NARRATOR-PROMPT.md');
    expect(existsSync(narratorPath)).toBe(true);

    const content = readFileSync(narratorPath, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
    expect(content.toLowerCase()).toContain('narrator');
  });

  it('should load pluribus prompt from prompts/ subdirectory', () => {
    const pluribusPath = join(docsDir, 'prompts', 'PLURIBUS.md');
    expect(existsSync(pluribusPath)).toBe(true);

    const content = readFileSync(pluribusPath, 'utf-8');
    expect(content.length).toBeGreaterThan(50);
  });

  it('should load sister gray prompt from prompts/ subdirectory', () => {
    const sisterGrayPath = join(docsDir, 'prompts', 'SISTER-GRAY.md');
    expect(existsSync(sisterGrayPath)).toBe(true);

    const content = readFileSync(sisterGrayPath, 'utf-8');
    expect(content.length).toBeGreaterThan(50);
  });

  it('should load default agent prompt from prompts/ subdirectory', () => {
    const defaultAgentPath = join(docsDir, 'prompts', 'DEFAULT-AGENT.md');
    expect(existsSync(defaultAgentPath)).toBe(true);

    const content = readFileSync(defaultAgentPath, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('should not have narrator prompt in docs root (moved to internal/)', () => {
    const oldPath = join(docsDir, 'NARRATOR-PROMPT.md');
    expect(existsSync(oldPath)).toBe(false);
  });

  it('should load sysop prompt from prompts/ subdirectory', () => {
    const sysopPath = join(docsDir, 'prompts', 'SYSOP.md');
    expect(existsSync(sysopPath)).toBe(true);

    const content = readFileSync(sysopPath, 'utf-8');
    expect(content.length).toBeGreaterThan(50);
    expect(content.toLowerCase()).toContain('sysop');
  });

  it('should load sysop reinforcement prompt from prompts/ subdirectory', () => {
    const reinforcementPath = join(docsDir, 'prompts', 'SYSOP-REINFORCEMENT.md');
    expect(existsSync(reinforcementPath)).toBe(true);

    const content = readFileSync(reinforcementPath, 'utf-8');
    expect(content.length).toBeGreaterThan(10);
  });

  it('should have all prompts from PROMPT_FILES available', () => {
    // These are the files defined in ai-prompts-builder.ts PROMPT_FILES constant
    const promptFiles = [
      'NARRATOR-PROMPT.md', // internal/
      'PLURIBUS.md',
      'SISTER-GRAY.md',
      'TAILOR.md',
      'DEFAULT-AGENT.md',
      'IMMIGRATION-OFFICER.md',
      'GHOST-INTERVIEWER.md',
      'ARCHITECT-INTERVIEWER.md',
      'MECHANIC.md',
      'NAV-COMPUTER.md',
      'DEVICE.md',
      'AUTO-FIXER.md',
      'SYSOP.md',
      'SYSOP-REINFORCEMENT.md',
    ];

    for (const filename of promptFiles) {
      const isNarrator = filename === 'NARRATOR-PROMPT.md';
      const dir = isNarrator ? 'internal' : 'prompts';
      const filePath = join(docsDir, dir, filename);

      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    }
  });
});
