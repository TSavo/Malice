import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds the Auto-Fixer System ($autoFixer)
 *
 * An automated issue fixer that runs hourly via $scheduler.
 * Uses $aiQuery with the autoFixer prompt from $aiPrompts to analyze
 * and attempt to fix open issues from $issues.
 *
 * Configuration:
 *   - enabled: Toggle on/off (default: true)
 *   - maxAttemptsPerHour: Rate limit (default: 3)
 *   - cooldownHours: Per-issue cooldown (default: 24)
 *   - minPriority: Only attempt issues of this priority or higher (default: 'high')
 *
 * Usage:
 *   await $autoFixer.tick()                    // Run manually (also called by scheduler)
 *   await $autoFixer.attemptFix(issueId)       // Attempt fix on specific issue
 *   await $autoFixer.getFixHistory()           // View past attempts
 *   await $autoFixer.getStats()                // Get auto-fixer statistics
 */
export class AutoFixerBuilder implements Builder {
  static provides = ['autoFixer'];
  static depends = ['aiPrompts', 'issues', 'scheduler'];

  private autoFixer: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.autoFixer) {
      this.autoFixer = await this.manager.load(aliases.autoFixer);
    }

    const root = await this.manager.load('root');

    if (!this.autoFixer) {
      this.autoFixer = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Auto-Fixer',
          description: 'Automated issue fixer using AI',
          // Configuration
          enabled: true,
          maxAttemptsPerHour: 3,
          cooldownHours: 24,
          minPriority: 'high', // 'low', 'medium', 'high', 'critical'
          // State tracking
          history: [], // Array of {issueId, timestamp, success, summary}
          attemptedThisHour: 0,
          lastTickTime: null,
          lastAttempts: {}, // Map of issueId -> lastAttemptTimestamp
        },
        methods: {},
      });
    }

    // Set property descriptions
    this.autoFixer.setPropertyDescription(
      'enabled',
      'Whether auto-fixer is active',
    );
    this.autoFixer.setPropertyDescription(
      'maxAttemptsPerHour',
      'Maximum fix attempts per hourly tick',
    );
    this.autoFixer.setPropertyDescription(
      'cooldownHours',
      'Hours to wait before re-attempting same issue',
    );
    this.autoFixer.setPropertyDescription(
      'minPriority',
      'Minimum priority level to attempt: low, medium, high, critical',
    );
    this.autoFixer.setPropertyDescription(
      'history',
      'Array of past fix attempts with results',
    );
    this.autoFixer.setPropertyDescription(
      'attemptedThisHour',
      'Counter for rate limiting',
    );
    this.autoFixer.setPropertyDescription(
      'lastTickTime',
      'Timestamp of last tick execution',
    );
    this.autoFixer.setPropertyDescription(
      'lastAttempts',
      'Map of issueId to last attempt timestamp for cooldown',
    );

    // Always rebuild methods
    this.buildMethods();
  }

  private buildMethods(): void {
    if (!this.autoFixer) return;

    // tick() - Main scheduler job entry point
    this.autoFixer.setMethod(
      'tick',
      `
      /**
       * Main tick method called by scheduler every hour.
       * Gets open issues and attempts to fix them within rate limits.
       */
      if (!self.enabled) {
        console.log('[AutoFixer] Disabled, skipping tick');
        return { success: true, skipped: true, reason: 'disabled' };
      }

      console.log('[AutoFixer] Starting hourly tick...');

      // Reset counter only if more than 1 hour has passed
      const now = Date.now();
      const lastTick = self.lastTickTime ? new Date(self.lastTickTime).getTime() : 0;
      const hourMs = 3600000; // 1 hour in milliseconds
      if (now - lastTick >= hourMs) {
        self.attemptedThisHour = 0;
      }
      self.lastTickTime = new Date().toISOString();

      // Priority order (higher = more urgent)
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      let minPriorityLevel = priorityOrder[self.minPriority];
      if (minPriorityLevel === undefined) {
        console.warn('[AutoFixer] Invalid minPriority: ' + self.minPriority + ', using high');
        minPriorityLevel = 1; // Default to high
      }

      // Get open issues
      const openIssues = await $issues.list({ status: 'open', limit: 20 });

      // Filter by minimum priority and sort by priority (critical first)
      const eligibleIssues = openIssues
        .filter(issue => {
          const issuePriority = priorityOrder[issue.priority];
          if (issuePriority === undefined) {
            console.warn('[AutoFixer] Issue #' + issue.id + ' has invalid priority: ' + issue.priority + ', skipping');
            return false; // Skip issues with invalid priorities
          }
          return issuePriority <= minPriorityLevel;
        })
        .sort((a, b) => {
          const aPriority = priorityOrder[a.priority] ?? 2;
          const bPriority = priorityOrder[b.priority] ?? 2;
          return aPriority - bPriority; // Lower number = higher priority
        });

      console.log('[AutoFixer] Found ' + eligibleIssues.length + ' eligible issues (priority >= ' + self.minPriority + ')');

      const results = [];
      const maxAttempts = self.maxAttemptsPerHour || 3;

      for (const issue of eligibleIssues) {
        // Check rate limit
        if (self.attemptedThisHour >= maxAttempts) {
          console.log('[AutoFixer] Rate limit reached (' + maxAttempts + '/hour), stopping');
          break;
        }

        // Check cooldown for this specific issue
        if (await self.isOnCooldown(issue.id)) {
          console.log('[AutoFixer] Issue #' + issue.id + ' on cooldown, skipping');
          continue;
        }

        // Attempt to fix
        console.log('[AutoFixer] Attempting to fix issue #' + issue.id + ': ' + issue.title);
        const result = await self.attemptFix(issue.id);
        results.push(result);
      }

      console.log('[AutoFixer] Tick complete. Attempted: ' + results.length + ' issues');

      return {
        success: true,
        tickTime: self.lastTickTime,
        attempted: results.length,
        results: results
      };
    `,
    );

    // isOnCooldown(issueId) - Check if an issue is within cooldown period
    this.autoFixer.setMethod(
      'isOnCooldown',
      `
      const issueId = args[0];
      const lastAttempts = self.lastAttempts || {};
      const lastAttempt = lastAttempts[issueId];

      if (!lastAttempt) return false;

      const cooldownMs = (self.cooldownHours || 24) * 60 * 60 * 1000;
      const timeSinceAttempt = Date.now() - new Date(lastAttempt).getTime();

      return timeSinceAttempt < cooldownMs;
    `,
    );

    // attemptFix(issueId) - Attempt to fix a specific issue
    this.autoFixer.setMethod(
      'attemptFix',
      `
      /**
       * Attempt to fix a specific issue using AI.
       * @param issueId - The issue ID to attempt to fix
       * @returns { success, summary, fixed, issueId }
       */
      const issueId = args[0];

      if (!issueId) {
        return { success: false, error: 'Issue ID required' };
      }

      // Get the full issue details
      const issue = await $issues.get(issueId);
      if (!issue) {
        return { success: false, error: 'Issue not found' };
      }

      // Increment attempt counter (only for valid issues)
      self.attemptedThisHour = (self.attemptedThisHour || 0) + 1;

      console.log('[AutoFixer] Loading issue #' + issueId + ': ' + issue.title);

      // Build context prompt
      let contextInfo = '';
      if (issue.relatedObject) {
        try {
          const relatedObj = await $load(issue.relatedObject);
          if (relatedObj) {
            contextInfo = '\\n\\nRelated Object #' + relatedObj.id + ' (' + (relatedObj.name || 'unnamed') + '):\\n';
            contextInfo += '- Parent: ' + (relatedObj.parent?.name || 'none') + '\\n';
            contextInfo += '- Description: ' + (relatedObj.description || 'none') + '\\n';
          }
        } catch (e) {
          contextInfo = '\\n\\nRelated Object #' + issue.relatedObject + ' could not be loaded.';
        }
      }

      // Add comments context
      let commentsInfo = '';
      if (issue.comments && issue.comments.length > 0) {
        commentsInfo = '\\n\\nPrevious Comments:\\n';
        for (const c of issue.comments.slice(-5)) { // Last 5 comments
          commentsInfo += '- ' + c.author + ': ' + (c.text || '').substring(0, 200) + '\\n';
        }
      }

      const prompt = \`Issue #\${issueId}: \${issue.title}

Type: \${issue.type}
Priority: \${issue.priority}
Status: \${issue.status}
Reporter: \${issue.reporter}
Tags: \${(issue.tags || []).join(', ') || 'none'}
Created: \${issue.createdAt}

Description:
\${issue.body || 'No description provided.'}
\${contextInfo}
\${commentsInfo}

Please analyze this issue and attempt to fix it if possible. If you cannot fix it automatically, explain why in a comment.\`;

      // Get the auto-fixer prompt
      const systemPrompt = $aiPrompts.autoFixer;
      if (!systemPrompt) {
        console.error('[AutoFixer] System prompt not available, skipping issue #' + issueId);
        await $issues.comment(issueId, 'Auto-fixer attempted but system prompt not loaded.', 'AutoFixer');
        // Set cooldown to prevent repeated attempts and comment spam
        const lastAttempts = { ...(self.lastAttempts || {}) };
        lastAttempts[issueId] = new Date().toISOString();
        self.lastAttempts = lastAttempts;
        return { success: false, error: 'System prompt not available' };
      }

      let aiResponse = '';
      let aiError = null;

      try {
        console.log('[AutoFixer] Calling $aiQuery for issue #' + issueId);
        const { response } = await $aiQuery(systemPrompt, prompt);
        aiResponse = response;
        console.log('[AutoFixer] AI response received (' + response.length + ' chars)');

        // Only set cooldown if AI call succeeded
        const lastAttempts = { ...(self.lastAttempts || {}) };
        lastAttempts[issueId] = new Date().toISOString();
        self.lastAttempts = lastAttempts;
      } catch (err) {
        aiError = err.message || String(err);
        console.error('[AutoFixer] AI query failed:', aiError);
        // Don't set cooldown for transient failures - allow retry
      }

      // Determine if fix was successful based on AI response
      // Try to parse structured output first (looking for return statement)
      let fixed = false;
      let needsReview = false;

      // Look for return {...} block in response
      const returnMatch = aiResponse.match(/return\\s*\\{([^}]+)\\}/s);
      if (returnMatch) {
        const returnBlock = returnMatch[1];
        // Check for 'fixed: true' in the return block specifically
        if (/fixed:\\s*true/i.test(returnBlock)) {
          fixed = true;
        }
        if (/needsReview:\\s*true/i.test(returnBlock)) {
          needsReview = true;
        }
      }

      // Fallback: check for explicit result markers in the response
      if (!fixed && !needsReview) {
        // Use word boundaries to avoid false positives like "I couldn't fix this"
        if (/\\bfixed:\\s*true\\b/i.test(aiResponse) || /"fixed":\\s*true/i.test(aiResponse)) {
          fixed = true;
        }
        if (/\\bneedsReview:\\s*true\\b/i.test(aiResponse) || /"needsReview":\\s*true/i.test(aiResponse)) {
          needsReview = true;
        }
      }

      // Build result summary
      let summary = '';
      if (aiError) {
        summary = 'AI query failed: ' + aiError;
      } else if (fixed) {
        summary = 'Issue appears to have been fixed by AI';
      } else if (needsReview) {
        summary = 'AI analyzed but needs human review';
      } else {
        summary = 'AI attempted analysis';
      }

      // Record in history
      const history = [...(self.history || [])];
      history.push({
        issueId: issueId,
        timestamp: new Date().toISOString(),
        success: fixed,
        needsReview: needsReview,
        summary: summary,
        responsePreview: aiResponse.substring(0, 500)
      });

      // Keep only last 100 entries
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      self.history = history;

      return {
        success: !aiError,  // false if AI query failed
        issueId: issueId,
        fixed: fixed,
        needsReview: needsReview,
        summary: summary,
        aiError: aiError
      };
    `,
    );

    // getFixHistory() - Get recent fix attempts
    this.autoFixer.setMethod(
      'getFixHistory',
      `
      /**
       * Get recent fix attempt history.
       * @param limit - Maximum entries to return (default: 20)
       * @returns Array of history entries
       */
      const limit = args[0] || 20;
      const history = self.history || [];

      // Return most recent first
      return history.slice(-limit).reverse();
    `,
    );

    // getStats() - Get auto-fixer statistics
    this.autoFixer.setMethod(
      'getStats',
      `
      /**
       * Get statistics about auto-fixer performance.
       */
      const history = self.history || [];

      const stats = {
        enabled: self.enabled,
        minPriority: self.minPriority,
        maxAttemptsPerHour: self.maxAttemptsPerHour,
        cooldownHours: self.cooldownHours,
        lastTickTime: self.lastTickTime,
        attemptedThisHour: self.attemptedThisHour,
        totalAttempts: history.length,
        totalFixed: history.filter(h => h.success).length,
        totalNeedsReview: history.filter(h => h.needsReview).length,
        successRate: history.length > 0
          ? Math.round((history.filter(h => h.success).length / history.length) * 100) + '%'
          : 'N/A',
        issuesOnCooldown: Object.keys(self.lastAttempts || {}).length
      };

      return stats;
    `,
    );

    // clearCooldown(issueId) - Manually clear cooldown for an issue
    this.autoFixer.setMethod(
      'clearCooldown',
      `
      /**
       * Clear cooldown for a specific issue (for manual re-attempts).
       */
      const issueId = args[0];
      if (!issueId) return { success: false, error: 'Issue ID required' };

      const lastAttempts = { ...(self.lastAttempts || {}) };
      delete lastAttempts[issueId];
      self.lastAttempts = lastAttempts;

      return { success: true, message: 'Cooldown cleared for issue #' + issueId };
    `,
    );

    // clearAllCooldowns() - Clear all cooldowns
    this.autoFixer.setMethod(
      'clearAllCooldowns',
      `
      /**
       * Clear all cooldowns (reset for testing).
       */
      self.lastAttempts = {};
      return { success: true, message: 'All cooldowns cleared' };
    `,
    );

    // setEnabled(enabled) - Enable or disable the auto-fixer
    this.autoFixer.setMethod(
      'setEnabled',
      `
      const enabled = args[0];
      if (typeof enabled !== 'boolean') {
        return { success: false, error: 'Boolean value required' };
      }
      self.enabled = enabled;
      return { success: true, enabled: enabled };
    `,
    );

    // setMinPriority(priority) - Set minimum priority level
    this.autoFixer.setMethod(
      'setMinPriority',
      `
      const priority = args[0];
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        return { success: false, error: 'Invalid priority. Valid: ' + validPriorities.join(', ') };
      }
      self.minPriority = priority;
      return { success: true, minPriority: priority };
    `,
    );

    // describe() - Human-readable description
    this.autoFixer.setMethod(
      'describe',
      `
      const stats = await self.getStats();
      let output = 'Auto-Fixer System\\n';
      output += '═'.repeat(40) + '\\n';
      output += 'Status: ' + (stats.enabled ? 'ENABLED' : 'DISABLED') + '\\n';
      output += 'Min Priority: ' + stats.minPriority + '\\n';
      output += 'Rate Limit: ' + stats.maxAttemptsPerHour + '/hour\\n';
      output += 'Cooldown: ' + stats.cooldownHours + ' hours\\n';
      output += '─'.repeat(40) + '\\n';
      output += 'Last Tick: ' + (stats.lastTickTime || 'Never') + '\\n';
      output += 'This Hour: ' + stats.attemptedThisHour + '/' + stats.maxAttemptsPerHour + ' attempts\\n';
      output += '─'.repeat(40) + '\\n';
      output += 'Total Attempts: ' + stats.totalAttempts + '\\n';
      output += 'Fixed: ' + stats.totalFixed + '\\n';
      output += 'Needs Review: ' + stats.totalNeedsReview + '\\n';
      output += 'Success Rate: ' + stats.successRate + '\\n';
      output += 'On Cooldown: ' + stats.issuesOnCooldown + ' issues\\n';
      return output;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.autoFixer) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'autoFixer', this.autoFixer.id);
    console.log(`Registered autoFixer alias -> #${this.autoFixer.id}`);
  }
}

// Self-register
registerBuilder(AutoFixerBuilder);
