import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Test for documentation reorganization (PR #118)
 * Verifies that docs have been moved to correct subdirectories
 */
describe('Documentation Reorganization', () => {
  const docsDir = join(process.cwd(), 'docs');

  it('should have reorganized guides into guides/ subdirectory', () => {
    expect(existsSync(join(docsDir, 'guides', 'BUILDERS-GUIDE.md'))).toBe(true);
    expect(existsSync(join(docsDir, 'guides', 'ABILITIES-FIRST.md'))).toBe(true);
    expect(existsSync(join(docsDir, 'guides', 'DEPLOYMENT.md'))).toBe(true);
  });

  it('should have reorganized reference docs into reference/ subdirectory', () => {
    expect(existsSync(join(docsDir, 'reference', 'MCP-TOOLS.md'))).toBe(true);
    expect(existsSync(join(docsDir, 'reference', 'moo-programming.md'))).toBe(true);
    expect(existsSync(join(docsDir, 'reference', 'plot-jobs.md'))).toBe(true);
  });

  it('should have reorganized lore into lore/ subdirectory', () => {
    expect(existsSync(join(docsDir, 'lore', 'TIMELINE.md'))).toBe(true);
    expect(existsSync(join(docsDir, 'lore', 'WHAT-IS-MALICE.md'))).toBe(true);
  });

  it('should have reorganized internal docs into internal/ subdirectory', () => {
    expect(existsSync(join(docsDir, 'internal', 'NARRATOR-PROMPT.md'))).toBe(true);
    expect(existsSync(join(docsDir, 'internal', 'npc-agent.md'))).toBe(true);
  });

  it('should not have old docs at root level', () => {
    // These files should have been moved
    expect(existsSync(join(docsDir, 'BUILDERS-GUIDE.md'))).toBe(false);
    expect(existsSync(join(docsDir, 'MCP-TOOLS.md'))).toBe(false);
    expect(existsSync(join(docsDir, 'TIMELINE.md'))).toBe(false);
    expect(existsSync(join(docsDir, 'NARRATOR-PROMPT.md'))).toBe(false);
  });
});
