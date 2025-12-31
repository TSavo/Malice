import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds News system ($.news)
 *
 * Abilities-first news/announcement system for the game.
 * News items are stored with timestamps, categories, and expiration.
 *
 * This is NOT a verb-based system. The AI narrator reads the abilities
 * and can interact with news naturally.
 *
 * Usage:
 *   await $.news.post(title, body, category?, expiresAt?)
 *   await $.news.list(options?)
 *   await $.news.get(id)
 *   await $.news.remove(id)
 *   await $.news.getRecent(count?)
 *   await $.news.getByCategory(category)
 */
export class NewsBuilder implements Builder {
  static provides = ['news'];
  static depends: string[] = [];

  private news: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.news) {
      this.news = await this.manager.load(aliases.news);
    }

    const root = await this.manager.load(1);
    if (!this.news) {
      this.news = await this.manager.create({
        parent: root!,
        properties: {
          name: 'News',
          description: 'City-wide news and announcement system',
          // Array of news items: { id, title, body, category, author, authorId, postedAt, expiresAt, pinned }
          items: [],
          // Categories for filtering
          categories: ['announcement', 'event', 'update', 'lore', 'ooc'],
          // Counter for generating unique IDs
          nextId: 1,
          // Abilities describe how news works in the world
          abilities: `City-wide news and announcement system accessible throughout New Seattle.

WARNING: NEWS IS DISPLAYED ON THE PUBLIC WEBSITE. This is an IC channel that
leaks OOC - anyone can read it, including people not logged into the game.
DO NOT POST SECRETS, PLOT SPOILERS, SURVEILLANCE DATA, OR MOLE IDENTITIES.

VIEWING: Anyone can read public news. News terminals, the Mask's HUD, and
city announcement boards all display recent news items. The public website
homepage also displays recent news to all visitors.

POSTING: Only authorized sources can post news:
- City AI (Pluribus) posts official announcements
- Administrators post game updates and OOC notices
- Faction leaders can post faction-specific news
- Event runners can post event announcements

APPROPRIATE CONTENT:
- Official announcements (curfews, policies, facility hours)
- Public events (ceremonies, openings, scheduled activities)
- Lore and flavor (weather, propaganda, city statistics)
- IC propaganda and spin control

NOT APPROPRIATE (leaks secrets!):
- Hidden plot details or upcoming twists
- Surveillance data or who is being watched
- Suspected mole or infiltrator identities
- Faction strategic information
- Anything players shouldn't know OOC

CATEGORIES:
- 'announcement': Official city/game announcements
- 'event': Upcoming or ongoing events
- 'update': Game system updates and changes
- 'lore': In-world news, rumors, and story developments
- 'ooc': Out-of-character notices to players

EXPIRATION: News items can have an expiration date. Expired items
are hidden from default listings but remain in the archive.

PINNING: Important items can be pinned to always appear at the top.`,
        },
        methods: {},
      });
    }

    // Set property descriptions for AI understanding
    this.news.setPropertyDescription(
      'items',
      'Array of news items. WARNING: Visible on public website - no secrets!',
    );
    this.news.setPropertyDescription(
      'categories',
      'Valid category names for filtering news',
    );
    this.news.setPropertyDescription(
      'nextId',
      'Auto-incrementing ID counter for new items',
    );

    // Skip method rebuild if not forced
    if (aliases.news && !forceRebuild) {
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // INFRASTRUCTURE METHODS
    // These are infrastructure - not verbs. The AI reads abilities and
    // calls these methods to interact with the news system.
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Post a news item
     * @param title - Headline
     * @param body - Full content (supports markdown)
     * @param category - One of: announcement, event, update, lore, ooc
     * @param options - { expiresAt?, pinned?, author? }
     * @returns { success, id } or { success: false, error }
     */
    this.news.setMethod(
      'post',
      `
      const title = args[0];
      const body = args[1];
      const category = args[2] || 'announcement';
      const options = args[3] || {};

      if (!title || !body) {
        return { success: false, error: 'Title and body are required' };
      }

      const validCategories = self.categories || ['announcement', 'event', 'update', 'lore', 'ooc'];
      if (!validCategories.includes(category)) {
        return { success: false, error: 'Invalid category. Valid: ' + validCategories.join(', ') };
      }

      const items = self.items || [];
      const newsId = self.nextId || 1;

      const newsItem = {
        newsId: newsId,
        title: title,
        body: body,
        category: category,
        author: options.author || 'System',
        authorId: options.authorId || null,
        postedAt: new Date().toISOString(),
        expiresAt: options.expiresAt || null,
        pinned: options.pinned || false,
      };

      items.unshift(newsItem); // Add to front (newest first)
      self.items = items;
      self.nextId = newsId + 1;

      return { success: true, id: newsId };
    `,
    );

    /**
     * Get a specific news item by ID
     * @param id - News item ID
     * @returns News item or null
     */
    this.news.setMethod(
      'get',
      `
      const id = args[0];
      if (!id) return null;

      const items = self.items || [];
      return items.find(item => item.newsId === id) || null;
    `,
    );

    /**
     * Remove a news item
     * @param id - News item ID
     * @returns { success, removed } or { success: false, error }
     */
    this.news.setMethod(
      'remove',
      `
      const id = args[0];
      if (!id) {
        return { success: false, error: 'ID required' };
      }

      const items = self.items || [];
      const index = items.findIndex(item => item.newsId === id);

      if (index === -1) {
        return { success: false, error: 'News item not found' };
      }

      const removed = items.splice(index, 1)[0];
      self.items = items;

      return { success: true, removed: removed };
    `,
    );

    /**
     * List news items with filtering
     * @param options - { category?, limit?, includeExpired?, pinnedFirst? }
     * @returns Array of news items
     */
    this.news.setMethod(
      'list',
      `
      const options = args[0] || {};
      const limit = options.limit || 50;
      const includeExpired = options.includeExpired || false;
      const pinnedFirst = options.pinnedFirst !== false; // default true
      const category = options.category;

      let items = self.items || [];
      const now = new Date().toISOString();

      // Filter expired items
      if (!includeExpired) {
        items = items.filter(item => !item.expiresAt || item.expiresAt > now);
      }

      // Filter by category
      if (category) {
        items = items.filter(item => item.category === category);
      }

      // Sort: pinned first, then by date
      if (pinnedFirst) {
        items = [...items].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
        });
      }

      return items.slice(0, limit);
    `,
    );

    /**
     * Get recent news for display (convenience method)
     * @param count - Number of items (default 5)
     * @returns Array of { id, title, category, postedAt, pinned }
     */
    this.news.setMethod(
      'getRecent',
      `
      const count = args[0] || 5;
      const items = await self.list({ limit: count });

      return items.map(item => ({
        newsId: item.newsId,
        title: item.title,
        category: item.category,
        postedAt: item.postedAt,
        pinned: item.pinned,
        // Include a preview of the body (first 100 chars)
        preview: item.body.length > 100 ? item.body.substring(0, 100) + '...' : item.body,
      }));
    `,
    );

    /**
     * Get news by category
     * @param category - Category name
     * @param limit - Max items (default 20)
     * @returns Array of news items
     */
    this.news.setMethod(
      'getByCategory',
      `
      const category = args[0];
      const limit = args[1] || 20;

      if (!category) return [];

      return await self.list({ category: category, limit: limit });
    `,
    );

    /**
     * Pin/unpin a news item
     * @param id - News item ID
     * @param pinned - true to pin, false to unpin
     * @returns { success } or { success: false, error }
     */
    this.news.setMethod(
      'pin',
      `
      const id = args[0];
      const pinned = args[1] !== false; // default true

      if (!id) {
        return { success: false, error: 'ID required' };
      }

      const items = self.items || [];
      const item = items.find(i => i.newsId === id);

      if (!item) {
        return { success: false, error: 'News item not found' };
      }

      item.pinned = pinned;
      self.items = items;

      return { success: true, pinned: pinned };
    `,
    );

    /**
     * Update a news item
     * @param id - News item ID
     * @param updates - { title?, body?, category?, expiresAt?, pinned? }
     * @returns { success, item } or { success: false, error }
     */
    this.news.setMethod(
      'update',
      `
      const id = args[0];
      const updates = args[1] || {};

      if (!id) {
        return { success: false, error: 'ID required' };
      }

      const items = self.items || [];
      const item = items.find(i => i.newsId === id);

      if (!item) {
        return { success: false, error: 'News item not found' };
      }

      // Apply updates
      if (updates.title !== undefined) item.title = updates.title;
      if (updates.body !== undefined) item.body = updates.body;
      if (updates.category !== undefined) {
        const validCategories = self.categories || ['announcement', 'event', 'update', 'lore', 'ooc'];
        if (!validCategories.includes(updates.category)) {
          return { success: false, error: 'Invalid category' };
        }
        item.category = updates.category;
      }
      if (updates.expiresAt !== undefined) item.expiresAt = updates.expiresAt;
      if (updates.pinned !== undefined) item.pinned = updates.pinned;

      item.updatedAt = new Date().toISOString();
      self.items = items;

      return { success: true, item: item };
    `,
    );

    /**
     * Get news for API/homepage display
     * Returns JSON-ready data
     */
    this.news.setMethod(
      'getForApi',
      `
      const options = args[0] || {};
      const limit = options.limit || 10;

      const items = await self.list({ limit: limit });

      return items.map(item => ({
        newsId: item.newsId,
        title: item.title,
        body: item.body,
        category: item.category,
        author: item.author,
        postedAt: item.postedAt,
        pinned: item.pinned,
      }));
    `,
    );

    /**
     * Format news for in-game display
     * Returns formatted text for terminal output
     */
    this.news.setMethod(
      'format',
      `
      const options = args[0] || {};
      const limit = options.limit || 5;
      const showBody = options.showBody || false;

      const items = await self.list({ limit: limit });

      if (items.length === 0) {
        return 'No news at this time.';
      }

      let output = '';
      for (const item of items) {
        const date = new Date(item.postedAt);
        const dateStr = date.toLocaleDateString();
        const pin = item.pinned ? ' [PINNED]' : '';
        const cat = '[' + item.category.toUpperCase() + ']';

        output += '\\r\\n' + cat + pin + ' ' + item.title;
        output += '\\r\\n  Posted ' + dateStr + ' by ' + item.author;

        if (showBody) {
          output += '\\r\\n  ' + item.body.replace(/\\n/g, '\\r\\n  ');
        }

        output += '\\r\\n';
      }

      return output.trim();
    `,
    );

    /**
     * Describe for AI - provides context for the narrator
     */
    this.news.setMethod(
      'describeForAI',
      `
      const items = await self.list({ limit: 5 });
      const itemCount = (self.items || []).length;

      let desc = 'News System\\n';
      desc += 'Total items: ' + itemCount + '\\n';
      desc += 'Categories: ' + (self.categories || []).join(', ') + '\\n\\n';

      if (items.length > 0) {
        desc += 'Recent headlines:\\n';
        for (const item of items) {
          const pin = item.pinned ? '[PINNED] ' : '';
          desc += '- ' + pin + item.title + ' (' + item.category + ')\\n';
        }
      }

      desc += '\\nAbilities:\\n' + self.abilities;

      return desc;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.news) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'news', this.news.id);
    console.log(`Registered news alias -> #${this.news.id}`);
  }
}

// Self-register
registerBuilder(NewsBuilder);
