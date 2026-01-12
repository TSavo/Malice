import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('$issues - Issue Tracking System', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;
  let $issues: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_issues');
    await db.connect();
    await db.objects.deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager, {
      _testMode: true,
    });
    await bootstrap.bootstrap();
    $ = manager as any;
    $issues = await $.issues;
  }, 180000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('Initialization', () => {
    it('should create $issues object', async () => {
      expect($issues).toBeDefined();
      expect($issues.name).toBe('Issue Tracker');
      expect($issues.description).toContain('tracking');
    });

    it('should have items array', () => {
      const items = $issues.items;
      expect(Array.isArray(items)).toBe(true);
    });

    it('should have nextId counter', () => {
      const nextId = $issues.nextId;
      expect(typeof nextId).toBe('number');
      expect(nextId).toBeGreaterThanOrEqual(1);
    });

    it('should have valid type definitions', () => {
      const types = $issues.types;
      expect(Array.isArray(types)).toBe(true);
      expect(types).toContain('bug');
      expect(types).toContain('feature');
      expect(types).toContain('task');
      expect(types).toContain('question');
    });

    it('should have valid status definitions', () => {
      const statuses = $issues.statuses;
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses).toContain('open');
      expect(statuses).toContain('in_progress');
      expect(statuses).toContain('resolved');
      expect(statuses).toContain('closed');
      expect(statuses).toContain('wontfix');
    });

    it('should have valid priority definitions', () => {
      const priorities = $issues.priorities;
      expect(Array.isArray(priorities)).toBe(true);
      expect(priorities).toContain('low');
      expect(priorities).toContain('medium');
      expect(priorities).toContain('high');
      expect(priorities).toContain('critical');
    });
  });

  describe('create()', () => {
    it('should create a new issue', async () => {
      const result = await $issues.create({
        title: 'Test bug',
        body: 'This is a test bug',
        type: 'bug',
        priority: 'high',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.issue).toBeDefined();
      expect(result.issue.title).toBe('Test bug');
      expect(result.issue.type).toBe('bug');
      expect(result.issue.status).toBe('open');
      expect(result.issue.priority).toBe('high');
    });

    it('should require title', async () => {
      const result = await $issues.create({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Title is required');
    });

    it('should default to bug type', async () => {
      const result = await $issues.create({
        title: 'Test issue without type',
      });

      expect(result.success).toBe(true);
      expect(result.issue.type).toBe('bug');
    });

    it('should default to medium priority', async () => {
      const result = await $issues.create({
        title: 'Test issue without priority',
      });

      expect(result.success).toBe(true);
      expect(result.issue.priority).toBe('medium');
    });

    it('should reject invalid type', async () => {
      const result = await $issues.create({
        title: 'Test issue',
        type: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid type');
    });

    it('should reject invalid priority', async () => {
      const result = await $issues.create({
        title: 'Test issue',
        priority: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid priority');
    });

    it('should auto-increment issue IDs', async () => {
      const result1 = await $issues.create({ title: 'Issue 1' });
      const result2 = await $issues.create({ title: 'Issue 2' });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.id).toBeGreaterThan(result1.id);
    });

    it('should set timestamps', async () => {
      const result = await $issues.create({
        title: 'Test timestamp issue',
      });

      expect(result.success).toBe(true);
      expect(result.issue.createdAt).toBeDefined();
      expect(result.issue.updatedAt).toBeDefined();
      expect(result.issue.createdAt).toBe(result.issue.updatedAt);
    });

    it('should support tags as array', async () => {
      const result = await $issues.create({
        title: 'Test tags',
        tags: ['rooms', 'exits'],
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.issue.tags)).toBe(true);
      expect(result.issue.tags).toEqual(['rooms', 'exits']);
    });

    it('should support tags as single string', async () => {
      const result = await $issues.create({
        title: 'Test single tag',
        tags: 'important',
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.issue.tags)).toBe(true);
      expect(result.issue.tags).toEqual(['important']);
    });

    it('should support reporter and relatedObject', async () => {
      const result = await $issues.create({
        title: 'Test metadata',
        reporter: 'alice',
        relatedObject: 42,
      });

      expect(result.success).toBe(true);
      expect(result.issue.reporter).toBe('alice');
      expect(result.issue.relatedObject).toBe(42);
    });

    it('should initialize empty comments array', async () => {
      const result = await $issues.create({
        title: 'Test comments',
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.issue.comments)).toBe(true);
      expect(result.issue.comments.length).toBe(0);
    });
  });

  describe('get()', () => {
    it('should retrieve issue by ID', async () => {
      const created = await $issues.create({
        title: 'Test get issue',
      });

      const issue = await $issues.get(created.id);

      expect(issue).toBeDefined();
      expect(issue.id).toBe(created.id);
      expect(issue.title).toBe('Test get issue');
    });

    it('should return null for non-existent ID', async () => {
      const issue = await $issues.get(999999);

      expect(issue).toBeNull();
    });

    it('should return null when no ID provided', async () => {
      const issue = await $issues.get();

      expect(issue).toBeNull();
    });
  });

  describe('list()', () => {
    beforeAll(async () => {
      // Clear and create test issues
      $issues.items = [];
      $issues.nextId = 1;

      await $issues.create({
        title: 'Open bug',
        type: 'bug',
        priority: 'high',
      });
      await $issues.create({
        title: 'In progress feature',
        type: 'feature',
        status: 'in_progress',
        priority: 'medium',
      });
      await $issues.create({
        title: 'Closed task',
        type: 'task',
        status: 'closed',
        priority: 'low',
      });
    });

    it('should list open and in_progress issues by default', async () => {
      const issues = await $issues.list();

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThanOrEqual(2);

      for (const issue of issues) {
        expect(['open', 'in_progress']).toContain(issue.status);
      }
    });

    it('should filter by status', async () => {
      const openIssues = await $issues.list({ status: 'open' });

      expect(Array.isArray(openIssues)).toBe(true);

      for (const issue of openIssues) {
        expect(issue.status).toBe('open');
      }
    });

    it('should filter by type', async () => {
      const bugs = await $issues.list({ type: 'bug' });

      expect(Array.isArray(bugs)).toBe(true);

      for (const bug of bugs) {
        expect(bug.type).toBe('bug');
      }
    });

    it('should filter by priority', async () => {
      const highPriority = await $issues.list({ priority: 'high' });

      expect(Array.isArray(highPriority)).toBe(true);

      for (const issue of highPriority) {
        expect(issue.priority).toBe('high');
      }
    });

    it('should include all statuses when all: true', async () => {
      const allIssues = await $issues.list({ all: true });

      expect(Array.isArray(allIssues)).toBe(true);
      expect(allIssues.length).toBeGreaterThanOrEqual(3);

      const statuses = allIssues.map((i) => i.status);
      expect(statuses).toContain('open');
      expect(statuses).toContain('closed');
    });

    it('should sort by priority then date', async () => {
      const issues = await $issues.list({ all: true });

      if (issues.length > 1) {
        const priorityOrder: any = { critical: 0, high: 1, medium: 2, low: 3 };

        for (let i = 1; i < issues.length; i++) {
          const prevPriority = priorityOrder[issues[i - 1].priority] || 2;
          const currPriority = priorityOrder[issues[i].priority] || 2;

          expect(prevPriority).toBeLessThanOrEqual(currPriority);
        }
      }
    });

    it('should respect limit option', async () => {
      const issues = await $issues.list({ limit: 1, all: true });

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeLessThanOrEqual(1);
    });

    it('should filter by tag', async () => {
      await $issues.create({
        title: 'Tagged issue',
        tags: ['test-tag'],
      });

      const tagged = await $issues.list({ tag: 'test-tag' });

      expect(Array.isArray(tagged)).toBe(true);
      expect(tagged.length).toBeGreaterThan(0);

      for (const issue of tagged) {
        expect(issue.tags).toContain('test-tag');
      }
    });
  });

  describe('update()', () => {
    it('should update issue properties', async () => {
      const created = await $issues.create({
        title: 'Original title',
        priority: 'low',
      });

      const result = await $issues.update(created.id, {
        title: 'Updated title',
        priority: 'high',
        status: 'in_progress',
      });

      expect(result.success).toBe(true);
      expect(result.issue.title).toBe('Updated title');
      expect(result.issue.priority).toBe('high');
      expect(result.issue.status).toBe('in_progress');
    });

    it('should require ID', async () => {
      const result = await $issues.update(null, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ID required');
    });

    it('should return error for non-existent issue', async () => {
      const result = await $issues.update(999999, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should validate type on update', async () => {
      const created = await $issues.create({ title: 'Test' });

      const result = await $issues.update(created.id, { type: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid type');
    });

    it('should validate status on update', async () => {
      const created = await $issues.create({ title: 'Test' });

      const result = await $issues.update(created.id, { status: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status');
    });

    it('should validate priority on update', async () => {
      const created = await $issues.create({ title: 'Test' });

      const result = await $issues.update(created.id, { priority: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid priority');
    });

    it('should update updatedAt timestamp', async () => {
      const created = await $issues.create({ title: 'Test' });
      const originalUpdated = created.issue.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await $issues.update(created.id, {
        title: 'Updated',
      });

      expect(result.success).toBe(true);
      expect(result.issue.updatedAt).not.toBe(originalUpdated);
    });
  });

  describe('comment()', () => {
    it('should add comment to issue', async () => {
      const created = await $issues.create({ title: 'Test comments' });

      const result = await $issues.comment(created.id, 'Test comment', 'alice');

      expect(result.success).toBe(true);
      expect(result.commentIndex).toBe(0);

      const issue = await $issues.get(created.id);
      expect(issue.comments.length).toBe(1);
      expect(issue.comments[0].text).toBe('Test comment');
      expect(issue.comments[0].author).toBe('alice');
      expect(issue.comments[0].timestamp).toBeDefined();
    });

    it('should require ID and text', async () => {
      const result = await $issues.comment(null, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ID and text required');
    });

    it('should default author to anonymous', async () => {
      const created = await $issues.create({ title: 'Test' });

      const result = await $issues.comment(created.id, 'Anonymous comment');

      expect(result.success).toBe(true);

      const issue = await $issues.get(created.id);
      expect(issue.comments[0].author).toBe('anonymous');
    });

    it('should support object as author', async () => {
      const created = await $issues.create({ title: 'Test' });
      const mockAuthor = { id: 42, name: 'Bob' };

      const result = await $issues.comment(
        created.id,
        'Object author test',
        mockAuthor,
      );

      expect(result.success).toBe(true);

      const issue = await $issues.get(created.id);
      expect(issue.comments[0].author).toBe('Bob');
      expect(issue.comments[0].authorId).toBe(42);
    });
  });

  describe('resolve()', () => {
    it('should mark issue as resolved', async () => {
      const created = await $issues.create({ title: 'Test resolve' });

      const result = await $issues.resolve(created.id, 'Fixed the bug');

      expect(result.success).toBe(true);

      const issue = await $issues.get(created.id);
      expect(issue.status).toBe('resolved');
      expect(issue.resolution).toBe('Fixed the bug');
    });

    it('should add comment when author provided', async () => {
      const created = await $issues.create({ title: 'Test resolve comment' });

      await $issues.resolve(created.id, 'Fixed', 'alice');

      const issue = await $issues.get(created.id);
      expect(issue.comments.length).toBeGreaterThan(0);
      expect(issue.comments[0].text).toContain('Resolved: Fixed');
      expect(issue.comments[0].author).toBe('alice');
    });
  });

  describe('close()', () => {
    it('should close an issue', async () => {
      const created = await $issues.create({ title: 'Test close' });

      const result = await $issues.close(created.id);

      expect(result.success).toBe(true);

      const issue = await $issues.get(created.id);
      expect(issue.status).toBe('closed');
    });
  });

  describe('reopen()', () => {
    it('should reopen a closed issue', async () => {
      const created = await $issues.create({ title: 'Test reopen' });
      await $issues.close(created.id);

      const result = await $issues.reopen(created.id);

      expect(result.success).toBe(true);

      const issue = await $issues.get(created.id);
      expect(issue.status).toBe('open');
      expect(issue.resolution).toBeNull();
    });
  });

  describe('wontfix()', () => {
    it('should mark issue as wontfix', async () => {
      const created = await $issues.create({ title: 'Test wontfix' });

      const result = await $issues.wontfix(created.id, 'Working as designed');

      expect(result.success).toBe(true);

      const issue = await $issues.get(created.id);
      expect(issue.status).toBe('wontfix');
      expect(issue.resolution).toBe('Working as designed');
    });
  });

  describe('assign()', () => {
    it('should assign issue to user', async () => {
      const created = await $issues.create({ title: 'Test assign' });

      const result = await $issues.assign(created.id, 'bob');

      expect(result.success).toBe(true);

      const issue = await $issues.get(created.id);
      expect(issue.assignee).toBe('bob');
      expect(issue.status).toBe('in_progress');
    });

    it('should require assignee', async () => {
      const created = await $issues.create({ title: 'Test' });

      const result = await $issues.assign(created.id, null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Assignee required');
    });

    it('should support object as assignee', async () => {
      const created = await $issues.create({ title: 'Test' });
      const mockUser = { id: 42, name: 'Alice' };

      const result = await $issues.assign(created.id, mockUser);

      expect(result.success).toBe(true);

      const issue = await $issues.get(created.id);
      expect(issue.assignee).toBe('Alice');
    });
  });

  describe('unassign()', () => {
    it('should remove assignee', async () => {
      const created = await $issues.create({ title: 'Test' });
      await $issues.assign(created.id, 'bob');

      const result = await $issues.unassign(created.id);

      expect(result.success).toBe(true);

      const issue = await $issues.get(created.id);
      expect(issue.assignee).toBeNull();
    });
  });

  describe('tag() and untag()', () => {
    it('should add tags to issue', async () => {
      const created = await $issues.create({ title: 'Test tagging' });

      const result = await $issues.tag(created.id, 'urgent', 'blocking');

      expect(result.success).toBe(true);
      expect(result.tags).toEqual(['urgent', 'blocking']);

      const issue = await $issues.get(created.id);
      expect(issue.tags).toContain('urgent');
      expect(issue.tags).toContain('blocking');
    });

    it('should not add duplicate tags', async () => {
      const created = await $issues.create({
        title: 'Test',
        tags: ['existing'],
      });

      await $issues.tag(created.id, 'existing', 'new');

      const issue = await $issues.get(created.id);
      expect(issue.tags.filter((t: string) => t === 'existing').length).toBe(1);
      expect(issue.tags).toContain('new');
    });

    it('should remove tags from issue', async () => {
      const created = await $issues.create({
        title: 'Test',
        tags: ['tag1', 'tag2', 'tag3'],
      });

      const result = await $issues.untag(created.id, 'tag2');

      expect(result.success).toBe(true);

      const issue = await $issues.get(created.id);
      expect(issue.tags).toEqual(['tag1', 'tag3']);
    });
  });

  describe('search()', () => {
    beforeAll(async () => {
      await $issues.create({
        title: 'Search test issue with unique keyword',
        body: 'This contains searchable content',
      });
    });

    it('should search in title', async () => {
      const results = await $issues.search('unique keyword');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchType).toBe('title');
    });

    it('should search in body', async () => {
      const results = await $issues.search('searchable content');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array when no query provided', async () => {
      const results = await $issues.search();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should respect limit option', async () => {
      const results = await $issues.search('test', { limit: 2 });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should exclude closed/wontfix by default', async () => {
      const results = await $issues.search('test');

      for (const result of results) {
        expect(['closed', 'wontfix']).not.toContain(result.status);
      }
    });

    it('should include all when all: true', async () => {
      const results = await $issues.search('test', { all: true });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('stats()', () => {
    it('should return statistics', async () => {
      const stats = await $issues.stats();

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.openCount).toBeGreaterThanOrEqual(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byType).toBeDefined();
      expect(stats.byPriority).toBeDefined();
      expect(typeof stats.createdThisWeek).toBe('number');
      expect(typeof stats.resolvedThisWeek).toBe('number');
    });

    it('should count by status', async () => {
      const stats = await $issues.stats();

      expect(typeof stats.byStatus.open).toBe('number');
    });

    it('should count by type', async () => {
      const stats = await $issues.stats();

      expect(typeof stats.byType.bug).toBe('number');
    });

    it('should count by priority', async () => {
      const stats = await $issues.stats();

      for (const priority of ['low', 'medium', 'high', 'critical']) {
        if (stats.byPriority[priority] !== undefined) {
          expect(typeof stats.byPriority[priority]).toBe('number');
        }
      }
    });
  });

  describe('format()', () => {
    it('should format single issue', async () => {
      const created = await $issues.create({
        title: 'Format test issue',
        body: 'Test body',
      });

      const output = await $issues.format(created.id);

      expect(typeof output).toBe('string');
      expect(output).toContain('Format test issue');
      expect(output).toContain('Test body');
    });

    it('should format list of issues', async () => {
      const output = await $issues.format();

      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle non-existent issue', async () => {
      const output = await $issues.format(999999);

      expect(typeof output).toBe('string');
      expect(output).toContain('not found');
    });
  });

  describe('delete()', () => {
    it('should delete an issue', async () => {
      const created = await $issues.create({ title: 'Test delete' });

      const result = await $issues.delete(created.id);

      expect(result.success).toBe(true);
      expect(result.deleted).toBeDefined();

      const issue = await $issues.get(created.id);
      expect(issue).toBeNull();
    });

    it('should require ID', async () => {
      const result = await $issues.delete(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ID required');
    });

    it('should return error for non-existent issue', async () => {
      const result = await $issues.delete(999999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getTags()', () => {
    it('should return all unique tags', async () => {
      await $issues.create({ title: 'Test', tags: ['tag1', 'tag2'] });
      await $issues.create({ title: 'Test', tags: ['tag2', 'tag3'] });

      const tags = await $issues.getTags();

      expect(Array.isArray(tags)).toBe(true);
      expect(tags).toContain('tag1');
      expect(tags).toContain('tag2');
      expect(tags).toContain('tag3');

      // Should be sorted
      const sorted = [...tags].sort();
      expect(tags).toEqual(sorted);
    });
  });

  describe('getAssignees()', () => {
    it('should return all unique assignees', async () => {
      await $issues.create({ title: 'Test', assignee: 'alice' });
      await $issues.create({ title: 'Test', assignee: 'bob' });

      const assignees = await $issues.getAssignees();

      expect(Array.isArray(assignees)).toBe(true);
      expect(assignees).toContain('alice');
      expect(assignees).toContain('bob');

      // Should be sorted
      const sorted = [...assignees].sort();
      expect(assignees).toEqual(sorted);
    });
  });
});
