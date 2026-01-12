import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds the Issue Tracking System ($issues)
 *
 * A simple, in-game issue/bug tracker for tracking problems, feature requests,
 * and tasks. Issues are stored as an array of objects with metadata.
 *
 * Each issue has:
 *   - id: Auto-incrementing unique ID
 *   - title: Short description
 *   - body: Full description/details
 *   - type: 'bug' | 'feature' | 'task' | 'question'
 *   - status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wontfix'
 *   - priority: 'low' | 'medium' | 'high' | 'critical'
 *   - tags: Array of string tags for categorization
 *   - reporter: Who reported it (name or object ID)
 *   - assignee: Who is working on it (optional)
 *   - relatedObject: Optional MOO object ID this issue relates to
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 *   - comments: Array of { author, text, timestamp }
 *   - resolution: Text explaining how it was resolved
 *
 * Usage:
 *   await $issues.create({ title: 'Bug in room exits', type: 'bug', priority: 'high' })
 *   await $issues.get(42)                    // Get issue by ID
 *   await $issues.list()                     // List all open issues
 *   await $issues.list({ status: 'open', priority: 'high' })
 *   await $issues.update(42, { status: 'in_progress', assignee: 'alice' })
 *   await $issues.comment(42, 'Working on this now', 'alice')
 *   await $issues.resolve(42, 'Fixed in commit abc123')
 *   await $issues.close(42)
 *   await $issues.search('room exits')
 *   await $issues.stats()                    // Get issue statistics
 */
export class IssuesBuilder implements Builder {
  static provides = ['issues'];
  static depends: string[] = [];

  private issues: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.issues) {
      this.issues = await this.manager.load(aliases.issues);
    }

    const root = await this.manager.load('root');

    if (!this.issues) {
      this.issues = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Issue Tracker',
          description: 'Bug and issue tracking system for the game',
          // Array of issue objects
          items: [],
          // Auto-incrementing ID counter
          nextId: 1,
          // Valid values for filtering
          types: ['bug', 'feature', 'task', 'question'],
          statuses: ['open', 'in_progress', 'resolved', 'closed', 'wontfix'],
          priorities: ['low', 'medium', 'high', 'critical'],
        },
        methods: {},
      });
    }

    // Set property descriptions
    this.issues.setPropertyDescription(
      'items',
      'Array of issue objects with id, title, body, type, status, priority, etc.',
    );
    this.issues.setPropertyDescription('nextId', 'Auto-incrementing ID for new issues');
    this.issues.setPropertyDescription('types', 'Valid issue types: bug, feature, task, question');
    this.issues.setPropertyDescription(
      'statuses',
      'Valid statuses: open, in_progress, resolved, closed, wontfix',
    );
    this.issues.setPropertyDescription(
      'priorities',
      'Valid priorities: low, medium, high, critical',
    );

    // Always rebuild methods
    this.buildMethods();
  }

  private buildMethods(): void {
    if (!this.issues) return;

    // create(options) - Create a new issue
    this.issues.setMethod(
      'create',
      `
      const options = args[0] || {};

      if (!options.title) {
        return { success: false, error: 'Title is required' };
      }

      const type = options.type || 'bug';
      const validTypes = self.types || ['bug', 'feature', 'task', 'question'];
      if (!validTypes.includes(type)) {
        return { success: false, error: 'Invalid type. Valid: ' + validTypes.join(', ') };
      }

      const priority = options.priority || 'medium';
      const validPriorities = self.priorities || ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        return { success: false, error: 'Invalid priority. Valid: ' + validPriorities.join(', ') };
      }

      const items = [...(self.items || [])]; // Create defensive copy
      const issueId = self.nextId || 1;
      const now = new Date().toISOString();

      const issue = {
        id: issueId,
        title: options.title,
        body: options.body || '',
        type: type,
        status: 'open',
        priority: priority,
        tags: Array.isArray(options.tags) ? options.tags : (options.tags ? [options.tags] : []),
        reporter: options.reporter || 'anonymous',
        reporterId: options.reporterId || null,
        assignee: options.assignee || null,
        relatedObject: options.relatedObject || null,
        createdAt: now,
        updatedAt: now,
        comments: [],
        resolution: null,
      };

      items.push(issue);
      self.nextId = issueId + 1;
      self.items = items; // Atomic update with new array

      return { success: true, id: issueId, issue: issue };
    `,
    );

    // get(id) - Get issue by ID
    this.issues.setMethod(
      'get',
      `
      const id = args[0];
      if (!id) return null;

      const items = self.items || [];
      return items.find(item => item.id === id) || null;
    `,
    );

    // list(options?) - List issues with optional filtering
    this.issues.setMethod(
      'list',
      `
      const options = args[0] || {};
      let items = self.items || [];

      // Filter by status (default: show open and in_progress)
      if (options.status) {
        items = items.filter(i => i.status === options.status);
      } else if (options.all !== true) {
        items = items.filter(i => i.status === 'open' || i.status === 'in_progress');
      }

      // Filter by type
      if (options.type) {
        items = items.filter(i => i.type === options.type);
      }

      // Filter by priority
      if (options.priority) {
        items = items.filter(i => i.priority === options.priority);
      }

      // Filter by tag
      if (options.tag) {
        items = items.filter(i => i.tags && i.tags.includes(options.tag));
      }

      // Filter by assignee
      if (options.assignee) {
        items = items.filter(i => i.assignee === options.assignee);
      }

      // Filter by reporter
      if (options.reporter) {
        items = items.filter(i => i.reporter === options.reporter);
      }

      // Filter by related object
      if (options.relatedObject) {
        const objId = typeof options.relatedObject === 'object'
          ? options.relatedObject.id
          : options.relatedObject;
        items = items.filter(i => i.relatedObject === objId);
      }

      // Sort by priority (critical first) then by date (newest first)
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      items = [...items].sort((a, b) => {
        const pDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
        if (pDiff !== 0) return pDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Limit results
      const limit = options.limit || 50;
      return items.slice(0, limit);
    `,
    );

    // update(id, updates) - Update an issue
    this.issues.setMethod(
      'update',
      `
      const id = args[0];
      const updates = args[1] || {};

      if (!id) {
        return { success: false, error: 'ID required' };
      }

      const items = [...(self.items || [])]; // Create defensive copy
      const issueIndex = items.findIndex(i => i.id === id);

      if (issueIndex === -1) {
        return { success: false, error: 'Issue not found' };
      }

      const issue = { ...items[issueIndex] }; // Copy the issue object

      // Validate type if changing
      if (updates.type !== undefined) {
        const validTypes = self.types || ['bug', 'feature', 'task', 'question'];
        if (!validTypes.includes(updates.type)) {
          return { success: false, error: 'Invalid type' };
        }
        issue.type = updates.type;
      }

      // Validate status if changing
      if (updates.status !== undefined) {
        const validStatuses = self.statuses || ['open', 'in_progress', 'resolved', 'closed', 'wontfix'];
        if (!validStatuses.includes(updates.status)) {
          return { success: false, error: 'Invalid status' };
        }
        issue.status = updates.status;
      }

      // Validate priority if changing
      if (updates.priority !== undefined) {
        const validPriorities = self.priorities || ['low', 'medium', 'high', 'critical'];
        if (!validPriorities.includes(updates.priority)) {
          return { success: false, error: 'Invalid priority' };
        }
        issue.priority = updates.priority;
      }

      // Apply other updates
      if (updates.title !== undefined) issue.title = updates.title;
      if (updates.body !== undefined) issue.body = updates.body;
      if (updates.tags !== undefined) {
        issue.tags = Array.isArray(updates.tags) ? updates.tags : [updates.tags];
      }
      if (updates.assignee !== undefined) issue.assignee = updates.assignee;
      if (updates.relatedObject !== undefined) {
        issue.relatedObject = typeof updates.relatedObject === 'object'
          ? updates.relatedObject.id
          : updates.relatedObject;
      }
      if (updates.resolution !== undefined) issue.resolution = updates.resolution;

      issue.updatedAt = new Date().toISOString();
      items[issueIndex] = issue; // Replace with updated copy
      self.items = items; // Atomic update

      return { success: true, issue: issue };
    `,
    );

    // comment(id, text, author) - Add a comment to an issue
    this.issues.setMethod(
      'comment',
      `
      const id = args[0];
      const text = args[1];
      const author = args[2] || 'anonymous';

      if (!id || !text) {
        return { success: false, error: 'ID and text required' };
      }

      const items = [...(self.items || [])]; // Create defensive copy
      const issueIndex = items.findIndex(i => i.id === id);

      if (issueIndex === -1) {
        return { success: false, error: 'Issue not found' };
      }

      const issue = { ...items[issueIndex] }; // Copy the issue object
      if (!issue.comments) issue.comments = [];

      const comment = {
        author: typeof author === 'object' ? (author.name || '#' + author.id) : author,
        authorId: typeof author === 'object' ? author.id : null,
        text: text,
        timestamp: new Date().toISOString(),
      };

      issue.comments = [...issue.comments, comment]; // Copy comments array
      issue.updatedAt = comment.timestamp;
      items[issueIndex] = issue; // Replace with updated copy
      self.items = items; // Atomic update

      return { success: true, commentIndex: issue.comments.length - 1 };
    `,
    );

    // resolve(id, resolution, author?) - Mark as resolved
    this.issues.setMethod(
      'resolve',
      `
      const id = args[0];
      const resolution = args[1] || 'Resolved';
      const author = args[2];

      const result = await self.update(id, {
        status: 'resolved',
        resolution: resolution,
      });

      if (result.success && author) {
        await self.comment(id, 'Resolved: ' + resolution, author);
      }

      return result;
    `,
    );

    // close(id) - Close an issue
    this.issues.setMethod(
      'close',
      `
      const id = args[0];
      return await self.update(id, { status: 'closed' });
    `,
    );

    // reopen(id) - Reopen a closed issue
    this.issues.setMethod(
      'reopen',
      `
      const id = args[0];
      return await self.update(id, { status: 'open', resolution: null });
    `,
    );

    // wontfix(id, reason?) - Mark as won't fix
    this.issues.setMethod(
      'wontfix',
      `
      const id = args[0];
      const reason = args[1] || 'Will not be fixed';

      return await self.update(id, {
        status: 'wontfix',
        resolution: reason,
      });
    `,
    );

    // assign(id, assignee) - Assign issue to someone
    this.issues.setMethod(
      'assign',
      `
      const id = args[0];
      const assignee = args[1];

      if (!assignee) {
        return { success: false, error: 'Assignee required' };
      }

      const assigneeName = typeof assignee === 'object'
        ? (assignee.name || '#' + assignee.id)
        : assignee;

      return await self.update(id, {
        assignee: assigneeName,
        status: 'in_progress',
      });
    `,
    );

    // unassign(id) - Remove assignee
    this.issues.setMethod(
      'unassign',
      `
      const id = args[0];
      return await self.update(id, { assignee: null });
    `,
    );

    // tag(id, ...tags) - Add tags to an issue
    this.issues.setMethod(
      'tag',
      `
      const id = args[0];
      const newTags = args.slice(1).flat();

      if (!id || newTags.length === 0) {
        return { success: false, error: 'ID and tags required' };
      }

      const items = [...(self.items || [])]; // Create defensive copy
      const issueIndex = items.findIndex(i => i.id === id);

      if (issueIndex === -1) {
        return { success: false, error: 'Issue not found' };
      }

      const issue = { ...items[issueIndex] }; // Copy the issue object
      const tags = [...(issue.tags || [])]; // Copy tags array

      for (const tag of newTags) {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      }

      issue.tags = tags;
      issue.updatedAt = new Date().toISOString();
      items[issueIndex] = issue; // Replace with updated copy
      self.items = items; // Atomic update

      return { success: true, tags: issue.tags };
    `,
    );

    // untag(id, ...tags) - Remove tags from an issue
    this.issues.setMethod(
      'untag',
      `
      const id = args[0];
      const removeTags = args.slice(1).flat();

      if (!id || removeTags.length === 0) {
        return { success: false, error: 'ID and tags required' };
      }

      const items = [...(self.items || [])]; // Create defensive copy
      const issueIndex = items.findIndex(i => i.id === id);

      if (issueIndex === -1) {
        return { success: false, error: 'Issue not found' };
      }

      const issue = { ...items[issueIndex] }; // Copy the issue object
      issue.tags = (issue.tags || []).filter(t => !removeTags.includes(t));
      issue.updatedAt = new Date().toISOString();
      items[issueIndex] = issue; // Replace with updated copy
      self.items = items; // Atomic update

      return { success: true, tags: issue.tags };
    `,
    );

    // search(query, options?) - Search issues
    this.issues.setMethod(
      'search',
      `
      const query = args[0];
      const options = args[1] || {};

      if (!query) return [];

      const queryLower = query.toLowerCase();
      let items = self.items || [];

      // Apply status filter if specified
      if (options.status) {
        items = items.filter(i => i.status === options.status);
      } else if (options.all !== true) {
        items = items.filter(i => i.status !== 'closed' && i.status !== 'wontfix');
      }

      const results = [];
      const limit = options.limit || 20;

      for (const issue of items) {
        const titleMatch = (issue.title || '').toLowerCase().includes(queryLower);
        const bodyMatch = (issue.body || '').toLowerCase().includes(queryLower);
        const tagMatch = (issue.tags || []).some(t => t.toLowerCase().includes(queryLower));

        if (titleMatch || bodyMatch || tagMatch) {
          results.push({
            id: issue.id,
            title: issue.title,
            type: issue.type,
            status: issue.status,
            priority: issue.priority,
            matchType: titleMatch ? 'title' : tagMatch ? 'tag' : 'body',
          });

          if (results.length >= limit) break;
        }
      }

      return results;
    `,
    );

    // stats() - Get issue statistics
    this.issues.setMethod(
      'stats',
      `
      const items = self.items || [];

      const stats = {
        total: items.length,
        byStatus: {},
        byType: {},
        byPriority: {},
        openCount: 0,
        resolvedThisWeek: 0,
        createdThisWeek: 0,
      };

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      for (const issue of items) {
        // Count by status
        stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;

        // Count by type
        stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;

        // Count by priority
        stats.byPriority[issue.priority] = (stats.byPriority[issue.priority] || 0) + 1;

        // Open count
        if (issue.status === 'open' || issue.status === 'in_progress') {
          stats.openCount++;
        }

        // Created this week
        if (issue.createdAt > oneWeekAgo) {
          stats.createdThisWeek++;
        }

        // Resolved this week
        if ((issue.status === 'resolved' || issue.status === 'closed') && issue.updatedAt > oneWeekAgo) {
          stats.resolvedThisWeek++;
        }
      }

      return stats;
    `,
    );

    // format(id?) - Format issue(s) for display
    this.issues.setMethod(
      'format',
      `
      const id = args[0];

      if (id) {
        // Format single issue
        const issue = await self.get(id);
        if (!issue) return 'Issue #' + id + ' not found.';

        const priorityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
        const statusEmoji = { open: '📋', in_progress: '🔧', resolved: '✅', closed: '📁', wontfix: '🚫' };

        let output = '═'.repeat(50) + '\\n';
        output += (statusEmoji[issue.status] || '❓') + ' Issue #' + issue.id + ': ' + issue.title + '\\n';
        output += '═'.repeat(50) + '\\n';
        output += 'Type: ' + issue.type + ' | ';
        output += 'Status: ' + issue.status + ' | ';
        output += 'Priority: ' + (priorityEmoji[issue.priority] || '') + ' ' + issue.priority + '\\n';

        if (issue.tags && issue.tags.length > 0) {
          output += 'Tags: ' + issue.tags.join(', ') + '\\n';
        }

        output += 'Reporter: ' + issue.reporter;
        if (issue.assignee) output += ' | Assignee: ' + issue.assignee;
        output += '\\n';

        output += 'Created: ' + issue.createdAt.substring(0, 10);
        output += ' | Updated: ' + issue.updatedAt.substring(0, 10) + '\\n';

        if (issue.relatedObject) {
          output += 'Related Object: #' + issue.relatedObject + '\\n';
        }

        output += '─'.repeat(50) + '\\n';

        if (issue.body) {
          output += issue.body + '\\n';
        }

        if (issue.resolution) {
          output += '─'.repeat(50) + '\\n';
          output += 'Resolution: ' + issue.resolution + '\\n';
        }

        if (issue.comments && issue.comments.length > 0) {
          output += '─'.repeat(50) + '\\n';
          output += 'Comments (' + issue.comments.length + '):\\n';
          for (const c of issue.comments) {
            output += '  ' + c.author + ' (' + c.timestamp.substring(0, 10) + '):\\n';
            output += '    ' + c.text.replace(/\\n/g, '\\n    ') + '\\n';
          }
        }

        return output;
      } else {
        // Format list of open issues
        const issues = await self.list();
        if (issues.length === 0) return 'No open issues.';

        const priorityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

        let output = 'Open Issues (' + issues.length + '):\\n';
        output += '─'.repeat(60) + '\\n';

        for (const issue of issues) {
          const emoji = priorityEmoji[issue.priority] || '⚪';
          const assignee = issue.assignee ? ' @' + issue.assignee : '';
          output += emoji + ' #' + issue.id + ' [' + issue.type + '] ' + issue.title + assignee + '\\n';
        }

        return output;
      }
    `,
    );

    // delete(id) - Delete an issue (admin only)
    this.issues.setMethod(
      'delete',
      `
      const id = args[0];

      if (!id) {
        return { success: false, error: 'ID required' };
      }

      const items = [...(self.items || [])]; // Create defensive copy
      const index = items.findIndex(i => i.id === id);

      if (index === -1) {
        return { success: false, error: 'Issue not found' };
      }

      const deleted = items[index];
      items.splice(index, 1);
      self.items = items; // Atomic update

      return { success: true, deleted: deleted };
    `,
    );

    // getTags() - Get all unique tags
    this.issues.setMethod(
      'getTags',
      `
      const items = self.items || [];
      const tagSet = new Set();

      for (const issue of items) {
        if (issue.tags) {
          for (const tag of issue.tags) {
            tagSet.add(tag);
          }
        }
      }

      return Array.from(tagSet).sort();
    `,
    );

    // getAssignees() - Get all unique assignees
    this.issues.setMethod(
      'getAssignees',
      `
      const items = self.items || [];
      const assignees = new Set();

      for (const issue of items) {
        if (issue.assignee) {
          assignees.add(issue.assignee);
        }
      }

      return Array.from(assignees).sort();
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.issues) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'issues', this.issues.id);
    console.log(`Registered issues alias -> #${this.issues.id}`);
  }
}

// Self-register
registerBuilder(IssuesBuilder);
