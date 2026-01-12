import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Test subdirectory search logic added in PR #118
 * Verifies that the subdirectory structure supports backward compatibility
 * (files can be found by filename alone, without needing the subdirectory path)
 */
describe('Documentation Subdirectory Search Logic', () => {
  const docsDir = join(process.cwd(), 'docs');

  // Simulate the search logic from mcp-server-codefirst.ts and other builders
  const searchDirs = [
    'guides',
    'reference',
    'lore',
    'internal',
    'moo',
    'city-ai',
    'greeter',
    'prompts',
  ];

  function findDocByFilename(filename: string): string | null {
    const upper = filename.toUpperCase();
    const normalizedFilename = upper.endsWith('.MD') ? upper : `${upper}.MD`;

    // First try root directory
    const rootPath = join(docsDir, normalizedFilename);
    if (existsSync(rootPath)) {
      return rootPath;
    }

    // Search in subdirectories
    for (const dir of searchDirs) {
      const dirPath = join(docsDir, dir);
      if (existsSync(dirPath)) {
        const files = readdirSync(dirPath);
        const match = files.find((f) => f.toUpperCase() === normalizedFilename);
        if (match) {
          return join(dirPath, match);
        }
      }
    }

    return null;
  }

  it('should verify all expected subdirectories exist', () => {
    for (const dir of searchDirs) {
      const dirPath = join(docsDir, dir);
      expect(existsSync(dirPath)).toBe(true);
    }
  });

  it('should find BUILDERS-GUIDE in guides/ subdirectory', () => {
    const path = findDocByFilename('BUILDERS-GUIDE');
    expect(path).not.toBeNull();
    expect(path).toContain('guides');
    expect(existsSync(path!)).toBe(true);
  });

  it('should find MCP-TOOLS in reference/ subdirectory', () => {
    const path = findDocByFilename('MCP-TOOLS');
    expect(path).not.toBeNull();
    expect(path).toContain('reference');
    expect(existsSync(path!)).toBe(true);
  });

  it('should find TIMELINE in lore/ subdirectory', () => {
    const path = findDocByFilename('TIMELINE');
    expect(path).not.toBeNull();
    expect(path).toContain('lore');
    expect(existsSync(path!)).toBe(true);
  });

  it('should find NARRATOR-PROMPT in internal/ subdirectory', () => {
    const path = findDocByFilename('NARRATOR-PROMPT');
    expect(path).not.toBeNull();
    expect(path).toContain('internal');
    expect(existsSync(path!)).toBe(true);
  });

  it('should find ABILITIES-FIRST in guides/ subdirectory', () => {
    const path = findDocByFilename('ABILITIES-FIRST');
    expect(path).not.toBeNull();
    expect(path).toContain('guides');
    expect(existsSync(path!)).toBe(true);
  });

  it('should find moo-programming in reference/ subdirectory', () => {
    const path = findDocByFilename('moo-programming');
    expect(path).not.toBeNull();
    expect(path).toContain('reference');
    expect(existsSync(path!)).toBe(true);
  });

  it('should find WHAT-IS-MALICE in lore/ subdirectory', () => {
    const path = findDocByFilename('WHAT-IS-MALICE');
    expect(path).not.toBeNull();
    expect(path).toContain('lore');
    expect(existsSync(path!)).toBe(true);
  });

  it('should return null for non-existent docs', () => {
    const path = findDocByFilename('does-not-exist');
    expect(path).toBeNull();
  });

  it('should handle case-insensitive searches', () => {
    // BUILDERS-GUIDE.md exists
    const path1 = findDocByFilename('BUILDERS-GUIDE');
    const path2 = findDocByFilename('builders-guide');
    const path3 = findDocByFilename('BuIlDeRs-GuIdE');

    expect(path1).not.toBeNull();
    expect(path2).not.toBeNull();
    expect(path3).not.toBeNull();

    // All should resolve to the same file
    expect(path1).toBe(path2);
    expect(path2).toBe(path3);
  });

  it('should support filename with or without .md extension', () => {
    const withExt = findDocByFilename('BUILDERS-GUIDE.md');
    const withoutExt = findDocByFilename('BUILDERS-GUIDE');

    expect(withExt).not.toBeNull();
    expect(withoutExt).not.toBeNull();
    expect(withExt).toBe(withoutExt);
  });

  it('should find docs from multiple subdirectories', () => {
    // Sample one doc from each subdirectory to verify search works
    const samples = [
      { name: 'BUILDERS-GUIDE', expectedDir: 'guides' },
      { name: 'MCP-TOOLS', expectedDir: 'reference' },
      { name: 'TIMELINE', expectedDir: 'lore' },
      { name: 'NARRATOR-PROMPT', expectedDir: 'internal' },
    ];

    for (const { name, expectedDir } of samples) {
      const path = findDocByFilename(name);
      expect(path).not.toBeNull();
      expect(path).toContain(expectedDir);
    }
  });

  it('should not find old docs at root level (backward compatibility check)', () => {
    // These files should have been moved
    const oldPaths = [
      join(docsDir, 'BUILDERS-GUIDE.md'),
      join(docsDir, 'MCP-TOOLS.md'),
      join(docsDir, 'TIMELINE.md'),
      join(docsDir, 'NARRATOR-PROMPT.md'),
    ];

    for (const oldPath of oldPaths) {
      expect(existsSync(oldPath)).toBe(false);
    }
  });
});
