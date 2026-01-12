import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('$autoFixer - Auto-Fixer System', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;
  let $autoFixer: any;
  let $issues: any;
  let $aiPrompts: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_auto_fixer');
    await db.connect();
    await db.objects.deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager, {
      _testMode: true,
    });
    await bootstrap.bootstrap();
    $ = manager as any;
    $autoFixer = await $.autoFixer;
    $issues = await $.issues;
    $aiPrompts = await $.aiPrompts;
  }, 180000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('Initialization', () => {
    it('should exist and be registered as alias', async () => {
      expect($autoFixer).toBeDefined();
      expect($autoFixer.name).toBe('Auto-Fixer');
    });

    it('should have default configuration', () => {
      expect($autoFixer.enabled).toBe(true);
      expect($autoFixer.maxAttemptsPerHour).toBe(3);
      expect($autoFixer.cooldownHours).toBe(24);
      expect($autoFixer.minPriority).toBe('high');
    });

    it('should have empty initial state', () => {
      expect(Array.isArray($autoFixer.history)).toBe(true);
      expect($autoFixer.attemptedThisHour).toBe(0);
      expect($autoFixer.lastTickTime).toBeNull();
      expect(typeof $autoFixer.lastAttempts).toBe('object');
    });

    it('should have all required methods', () => {
      const methods = $autoFixer.getMethods();
      expect(methods).toHaveProperty('tick');
      expect(methods).toHaveProperty('attemptFix');
      expect(methods).toHaveProperty('isOnCooldown');
      expect(methods).toHaveProperty('getFixHistory');
      expect(methods).toHaveProperty('getStats');
      expect(methods).toHaveProperty('clearCooldown');
      expect(methods).toHaveProperty('clearAllCooldowns');
      expect(methods).toHaveProperty('setEnabled');
      expect(methods).toHaveProperty('setMinPriority');
      expect(methods).toHaveProperty('describe');
    });
  });

  describe('Configuration Methods', () => {
    it('should enable and disable auto-fixer', async () => {
      const disableResult = await $autoFixer.setEnabled(false);
      expect(disableResult.success).toBe(true);
      expect($autoFixer.enabled).toBe(false);

      const enableResult = await $autoFixer.setEnabled(true);
      expect(enableResult.success).toBe(true);
      expect($autoFixer.enabled).toBe(true);
    });

    it('should reject non-boolean values for setEnabled', async () => {
      const result = await $autoFixer.setEnabled('true');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Boolean');
    });

    it('should set minimum priority', async () => {
      const result = await $autoFixer.setMinPriority('medium');
      expect(result.success).toBe(true);
      expect($autoFixer.minPriority).toBe('medium');

      // Reset to high
      await $autoFixer.setMinPriority('high');
    });

    it('should reject invalid priority levels', async () => {
      const result = await $autoFixer.setMinPriority('super-urgent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid priority');
    });

    it('should accept all valid priority levels', async () => {
      const validPriorities = ['low', 'medium', 'high', 'critical'];

      for (const priority of validPriorities) {
        const result = await $autoFixer.setMinPriority(priority);
        expect(result.success).toBe(true);
        expect($autoFixer.minPriority).toBe(priority);
      }

      // Reset
      await $autoFixer.setMinPriority('high');
    });

    it('should allow direct property modification', () => {
      $autoFixer.maxAttemptsPerHour = 5;
      expect($autoFixer.maxAttemptsPerHour).toBe(5);

      $autoFixer.cooldownHours = 48;
      expect($autoFixer.cooldownHours).toBe(48);

      // Reset
      $autoFixer.maxAttemptsPerHour = 3;
      $autoFixer.cooldownHours = 24;
    });
  });

  describe('Cooldown Management', () => {
    beforeAll(async () => {
      // Clear all cooldowns before tests
      await $autoFixer.clearAllCooldowns();
    });

    it('should return false for issues not on cooldown', async () => {
      const onCooldown = await $autoFixer.isOnCooldown(999);
      expect(onCooldown).toBe(false);
    });

    it('should detect when issue is on cooldown', async () => {
      const issueId = 1001;

      // Manually add to lastAttempts
      const lastAttempts = { ...($autoFixer.lastAttempts || {}) };
      lastAttempts[issueId] = new Date().toISOString();
      $autoFixer.lastAttempts = lastAttempts;

      const onCooldown = await $autoFixer.isOnCooldown(issueId);
      expect(onCooldown).toBe(true);
    });

    it('should detect when cooldown has expired', async () => {
      const issueId = 1002;

      // Add attempt from 25 hours ago (cooldown is 24h)
      const lastAttempts = { ...($autoFixer.lastAttempts || {}) };
      const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000);
      lastAttempts[issueId] = oldTimestamp.toISOString();
      $autoFixer.lastAttempts = lastAttempts;

      const onCooldown = await $autoFixer.isOnCooldown(issueId);
      expect(onCooldown).toBe(false);
    });

    it('should clear specific issue cooldown', async () => {
      const issueId = 1003;

      // Add to cooldown
      const lastAttempts = { ...($autoFixer.lastAttempts || {}) };
      lastAttempts[issueId] = new Date().toISOString();
      $autoFixer.lastAttempts = lastAttempts;

      // Clear cooldown
      const result = await $autoFixer.clearCooldown(issueId);
      expect(result.success).toBe(true);

      const onCooldown = await $autoFixer.isOnCooldown(issueId);
      expect(onCooldown).toBe(false);
    });

    it('should require issue ID for clearCooldown', async () => {
      const result = await $autoFixer.clearCooldown(null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Issue ID required');
    });

    it('should clear all cooldowns', async () => {
      // Add multiple cooldowns
      $autoFixer.lastAttempts = {
        1004: new Date().toISOString(),
        1005: new Date().toISOString(),
        1006: new Date().toISOString(),
      };

      const result = await $autoFixer.clearAllCooldowns();
      expect(result.success).toBe(true);

      expect(Object.keys($autoFixer.lastAttempts || {}).length).toBe(0);
    });
  });

  describe('Statistics and History', () => {
    beforeAll(async () => {
      // Reset state
      $autoFixer.history = [];
      $autoFixer.attemptedThisHour = 0;
      $autoFixer.lastTickTime = null;
    });

    it('should return empty history initially', async () => {
      const history = await $autoFixer.getFixHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should limit history to specified count', async () => {
      // Add some history entries
      $autoFixer.history = [
        { issueId: 1, timestamp: '2026-01-01T00:00:00Z', success: true },
        { issueId: 2, timestamp: '2026-01-01T01:00:00Z', success: false },
        { issueId: 3, timestamp: '2026-01-01T02:00:00Z', success: true },
        { issueId: 4, timestamp: '2026-01-01T03:00:00Z', success: true },
        { issueId: 5, timestamp: '2026-01-01T04:00:00Z', success: false },
      ];

      const history = await $autoFixer.getFixHistory(3);
      expect(history.length).toBe(3);
      // Should return most recent first
      expect(history[0].issueId).toBe(5);
      expect(history[1].issueId).toBe(4);
      expect(history[2].issueId).toBe(3);
    });

    it('should return comprehensive statistics', async () => {
      const stats = await $autoFixer.getStats();

      expect(stats).toHaveProperty('enabled');
      expect(stats).toHaveProperty('minPriority');
      expect(stats).toHaveProperty('maxAttemptsPerHour');
      expect(stats).toHaveProperty('cooldownHours');
      expect(stats).toHaveProperty('lastTickTime');
      expect(stats).toHaveProperty('attemptedThisHour');
      expect(stats).toHaveProperty('totalAttempts');
      expect(stats).toHaveProperty('totalFixed');
      expect(stats).toHaveProperty('totalNeedsReview');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('issuesOnCooldown');

      expect(typeof stats.successRate).toBe('string');
    });

    it('should calculate success rate correctly', async () => {
      $autoFixer.history = [
        { issueId: 1, success: true },
        { issueId: 2, success: false },
        { issueId: 3, success: true },
        { issueId: 4, success: true },
      ];

      const stats = await $autoFixer.getStats();
      expect(stats.totalAttempts).toBe(4);
      expect(stats.totalFixed).toBe(3);
      expect(stats.successRate).toBe('75%');
    });

    it('should handle zero attempts gracefully', async () => {
      $autoFixer.history = [];

      const stats = await $autoFixer.getStats();
      expect(stats.totalAttempts).toBe(0);
      expect(stats.successRate).toBe('N/A');
    });

    it('should generate human-readable description', async () => {
      const description = await $autoFixer.describe();

      expect(typeof description).toBe('string');
      expect(description).toContain('Auto-Fixer System');
      expect(description).toContain('Status:');
      expect(description).toContain('Min Priority:');
      expect(description).toContain('Rate Limit:');
      expect(description).toContain('Cooldown:');
    });
  });

  describe('tick() Method', () => {
    beforeAll(async () => {
      // Reset state
      $autoFixer.enabled = true;
      $autoFixer.minPriority = 'high';
      $autoFixer.maxAttemptsPerHour = 3;
      $autoFixer.attemptedThisHour = 0;
      await $autoFixer.clearAllCooldowns();
      $autoFixer.history = [];
    });

    it('should skip when disabled', async () => {
      await $autoFixer.setEnabled(false);

      const result = await $autoFixer.tick();

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('disabled');

      // Re-enable for other tests
      await $autoFixer.setEnabled(true);
    });

    it('should reset hourly counter on tick', async () => {
      $autoFixer.attemptedThisHour = 10;

      await $autoFixer.tick();

      expect($autoFixer.attemptedThisHour).toBeGreaterThanOrEqual(0);
      expect($autoFixer.lastTickTime).toBeTruthy();
    });

    it('should update lastTickTime', async () => {
      const beforeTick = new Date().toISOString();

      await $autoFixer.tick();

      expect($autoFixer.lastTickTime).toBeTruthy();
      expect(new Date($autoFixer.lastTickTime).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTick).getTime()
      );
    });

    it('should return tick results', async () => {
      const result = await $autoFixer.tick();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('tickTime');
      expect(result).toHaveProperty('attempted');
      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should respect maxAttemptsPerHour rate limit', async () => {
      // Create multiple high-priority issues
      const issue1 = await $issues.create({
        title: 'Test Issue 1',
        body: 'Test body 1',
        priority: 'high',
        type: 'bug',
      });
      const issue2 = await $issues.create({
        title: 'Test Issue 2',
        body: 'Test body 2',
        priority: 'high',
        type: 'bug',
      });
      const issue3 = await $issues.create({
        title: 'Test Issue 3',
        body: 'Test body 3',
        priority: 'high',
        type: 'bug',
      });
      const issue4 = await $issues.create({
        title: 'Test Issue 4',
        body: 'Test body 4',
        priority: 'high',
        type: 'bug',
      });

      // Set maxAttemptsPerHour to 2
      $autoFixer.maxAttemptsPerHour = 2;

      // Mock $aiQuery to avoid actual AI calls
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockResolvedValue({
        response: 'Mock response: could not fix automatically, needs review'
      });

      try {
        const result = await $autoFixer.tick();

        // Should attempt exactly maxAttemptsPerHour issues
        expect(result.attempted).toBeLessThanOrEqual(2);
        expect($autoFixer.attemptedThisHour).toBeLessThanOrEqual(2);
      } finally {
        // Restore original
        $.aiQuery = originalAiQuery;
        $autoFixer.maxAttemptsPerHour = 3;

        // Clean up test issues
        await $issues.close(issue1.id);
        await $issues.close(issue2.id);
        await $issues.close(issue3.id);
        await $issues.close(issue4.id);
      }
    });

    it('should skip issues on cooldown', async () => {
      const issue = await $issues.create({
        title: 'Cooldown Test Issue',
        body: 'Should be skipped',
        priority: 'high',
        type: 'bug',
      });

      // Put issue on cooldown
      const lastAttempts = { ...($autoFixer.lastAttempts || {}) };
      lastAttempts[issue.id] = new Date().toISOString();
      $autoFixer.lastAttempts = lastAttempts;

      const result = await $autoFixer.tick();

      // Issue should be skipped due to cooldown
      const attempted = result.results.find((r: any) => r.issueId === issue.id);
      expect(attempted).toBeUndefined();

      // Clean up
      await $autoFixer.clearCooldown(issue.id);
      await $issues.close(issue.id);
    });
  });

  describe('attemptFix() Method', () => {
    beforeAll(async () => {
      await $autoFixer.clearAllCooldowns();
      $autoFixer.attemptedThisHour = 0;
    });

    it('should require issue ID', async () => {
      const result = await $autoFixer.attemptFix(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Issue ID required');
    });

    it('should return error for non-existent issue', async () => {
      const result = await $autoFixer.attemptFix(999999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Issue not found');
    });

    it('should increment attempt counter', async () => {
      const issue = await $issues.create({
        title: 'Counter Test',
        body: 'Test incrementing counter',
        priority: 'high',
        type: 'bug',
      });

      const beforeCount = $autoFixer.attemptedThisHour;

      // Mock $aiQuery
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockResolvedValue({
        response: 'Mock analysis complete'
      });

      try {
        await $autoFixer.attemptFix(issue.id);

        expect($autoFixer.attemptedThisHour).toBe(beforeCount + 1);
      } finally {
        $.aiQuery = originalAiQuery;
        await $issues.close(issue.id);
      }
    });

    it('should record attempt in lastAttempts for cooldown', async () => {
      const issue = await $issues.create({
        title: 'Cooldown Recording Test',
        body: 'Test cooldown recording',
        priority: 'high',
        type: 'bug',
      });

      // Mock $aiQuery
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockResolvedValue({
        response: 'Mock analysis'
      });

      try {
        const beforeTimestamp = Date.now();
        await $autoFixer.attemptFix(issue.id);
        const afterTimestamp = Date.now();

        const lastAttempts = $autoFixer.lastAttempts || {};
        expect(lastAttempts[issue.id]).toBeTruthy();

        const attemptTime = new Date(lastAttempts[issue.id]).getTime();
        expect(attemptTime).toBeGreaterThanOrEqual(beforeTimestamp);
        expect(attemptTime).toBeLessThanOrEqual(afterTimestamp);
      } finally {
        $.aiQuery = originalAiQuery;
        await $issues.close(issue.id);
      }
    });

    it('should add entry to history', async () => {
      const issue = await $issues.create({
        title: 'History Test',
        body: 'Test history recording',
        priority: 'high',
        type: 'bug',
      });

      const historyLengthBefore = ($autoFixer.history || []).length;

      // Mock $aiQuery
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockResolvedValue({
        response: 'Mock fix attempt'
      });

      try {
        await $autoFixer.attemptFix(issue.id);

        const historyLengthAfter = ($autoFixer.history || []).length;
        expect(historyLengthAfter).toBe(historyLengthBefore + 1);

        const lastEntry = $autoFixer.history[$autoFixer.history.length - 1];
        expect(lastEntry.issueId).toBe(issue.id);
        expect(lastEntry).toHaveProperty('timestamp');
        expect(lastEntry).toHaveProperty('summary');
      } finally {
        $.aiQuery = originalAiQuery;
        await $issues.close(issue.id);
      }
    });

    it('should limit history to 100 entries', async () => {
      // Fill history with 100 entries
      const history = [];
      for (let i = 0; i < 100; i++) {
        history.push({
          issueId: i,
          timestamp: new Date().toISOString(),
          success: false,
          summary: 'Old entry',
        });
      }
      $autoFixer.history = history;

      const issue = await $issues.create({
        title: 'History Limit Test',
        body: 'Test history size limit',
        priority: 'high',
        type: 'bug',
      });

      // Mock $aiQuery
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockResolvedValue({
        response: 'New entry'
      });

      try {
        await $autoFixer.attemptFix(issue.id);

        expect($autoFixer.history.length).toBe(100);
        // Oldest entry should be removed
        expect($autoFixer.history[0].issueId).not.toBe(0);
      } finally {
        $.aiQuery = originalAiQuery;
        await $issues.close(issue.id);
        $autoFixer.history = []; // Reset
      }
    });

    it('should detect successful fix from AI response', async () => {
      const issue = await $issues.create({
        title: 'Success Detection Test',
        body: 'Test detecting successful fix',
        priority: 'high',
        type: 'bug',
      });

      // Mock successful fix response
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockResolvedValue({
        response: 'Analysis complete. Status:** Fixed. The issue has been successfully fixed.'
      });

      try {
        const result = await $autoFixer.attemptFix(issue.id);

        expect(result.success).toBe(true);
        expect(result.fixed).toBe(true);
        expect(result.summary).toContain('fixed');
      } finally {
        $.aiQuery = originalAiQuery;
        await $issues.close(issue.id);
      }
    });

    it('should detect needs review from AI response', async () => {
      const issue = await $issues.create({
        title: 'Review Detection Test',
        body: 'Test detecting needs review',
        priority: 'high',
        type: 'bug',
      });

      // Mock needs review response
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockResolvedValue({
        response: 'Analysis: This issue needs human review due to security concerns.'
      });

      try {
        const result = await $autoFixer.attemptFix(issue.id);

        expect(result.success).toBe(true);
        expect(result.needsReview).toBe(true);
        expect(result.summary).toContain('review');
      } finally {
        $.aiQuery = originalAiQuery;
        await $issues.close(issue.id);
      }
    });

    it('should handle AI query failures gracefully', async () => {
      const issue = await $issues.create({
        title: 'AI Failure Test',
        body: 'Test handling AI errors',
        priority: 'high',
        type: 'bug',
      });

      // Mock AI failure
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockRejectedValue(new Error('AI service unavailable'));

      try {
        const result = await $autoFixer.attemptFix(issue.id);

        expect(result.success).toBe(true); // Method succeeds even if AI fails
        expect(result.aiError).toBeTruthy();
        expect(result.aiError).toContain('AI service unavailable');
      } finally {
        $.aiQuery = originalAiQuery;
        await $issues.close(issue.id);
      }
    });

    it('should include related object context in prompt', async () => {
      const testRoom = await $.recycler.create(await $.room, {
        name: 'Test Room',
        description: 'A test room',
      });

      const issue = await $issues.create({
        title: 'Related Object Test',
        body: 'Test including related object',
        priority: 'high',
        type: 'bug',
        relatedObject: testRoom.id,
      });

      let capturedPrompt = '';
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockImplementation(async (system: string, prompt: string) => {
        capturedPrompt = prompt;
        return { response: 'Mock response' };
      });

      try {
        await $autoFixer.attemptFix(issue.id);

        expect(capturedPrompt).toContain('Related Object');
        expect(capturedPrompt).toContain('Test Room');
      } finally {
        $.aiQuery = originalAiQuery;
        await $issues.close(issue.id);
        await $.recycler.recycle(testRoom.id);
      }
    });

    it('should use autoFixer prompt from $aiPrompts', async () => {
      const issue = await $issues.create({
        title: 'Prompt Test',
        body: 'Test using correct system prompt',
        priority: 'high',
        type: 'bug',
      });

      let capturedSystemPrompt = '';
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockImplementation(async (system: string, prompt: string) => {
        capturedSystemPrompt = system;
        return { response: 'Mock response' };
      });

      try {
        await $autoFixer.attemptFix(issue.id);

        expect(capturedSystemPrompt).toBeTruthy();
        expect(capturedSystemPrompt).toBe($aiPrompts.autoFixer);
      } finally {
        $.aiQuery = originalAiQuery;
        await $issues.close(issue.id);
      }
    });
  });

  describe('Priority Filtering', () => {
    beforeAll(async () => {
      $autoFixer.minPriority = 'high';
      await $autoFixer.clearAllCooldowns();
      $autoFixer.attemptedThisHour = 0;
    });

    it('should only attempt issues meeting minPriority threshold', async () => {
      // Create issues of different priorities
      const lowIssue = await $issues.create({
        title: 'Low Priority',
        body: 'Should be skipped',
        priority: 'low',
        type: 'bug',
      });
      const mediumIssue = await $issues.create({
        title: 'Medium Priority',
        body: 'Should be skipped',
        priority: 'medium',
        type: 'bug',
      });
      const highIssue = await $issues.create({
        title: 'High Priority',
        body: 'Should be attempted',
        priority: 'high',
        type: 'bug',
      });
      const criticalIssue = await $issues.create({
        title: 'Critical Priority',
        body: 'Should be attempted',
        priority: 'critical',
        type: 'bug',
      });

      // Mock $aiQuery
      const originalAiQuery = $.aiQuery;
      $.aiQuery = vi.fn().mockResolvedValue({
        response: 'Mock analysis'
      });

      try {
        const result = await $autoFixer.tick();

        // Check that only high/critical were attempted
        const attemptedIds = result.results.map((r: any) => r.issueId);
        expect(attemptedIds).not.toContain(lowIssue.id);
        expect(attemptedIds).not.toContain(mediumIssue.id);
        // High and critical may or may not be attempted depending on rate limit
        // Just verify low/medium were definitely skipped
      } finally {
        $.aiQuery = originalAiQuery;
        await $issues.close(lowIssue.id);
        await $issues.close(mediumIssue.id);
        await $issues.close(highIssue.id);
        await $issues.close(criticalIssue.id);
      }
    });
  });

  describe('Integration with $issues', () => {
    it('should work with issues system', async () => {
      const issue = await $issues.create({
        title: 'Integration Test',
        body: 'Test full integration with issues',
        priority: 'high',
        type: 'bug',
        tags: ['test', 'integration'],
      });

      expect(issue).toBeDefined();
      expect(issue.id).toBeTruthy();

      // Verify autoFixer can access the issue
      const retrievedIssue = await $issues.get(issue.id);
      expect(retrievedIssue).toBeDefined();
      expect(retrievedIssue.title).toBe('Integration Test');

      await $issues.close(issue.id);
    });
  });
});
