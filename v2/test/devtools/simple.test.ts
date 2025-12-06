/**
 * Simple DevTools Test to verify basic functionality
 */

import { describe, it, expect } from 'vitest';

describe('DevTools Simple', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should import DevToolsServer', async () => {
    const { DevToolsServer } = await import('../../src/devtools/devtools-server.js');
    expect(DevToolsServer).toBeDefined();
  });
});
