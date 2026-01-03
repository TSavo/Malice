import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds the Dev Blog system for malice.world
 *
 * Creates:
 * - $blogEntry - Type for individual blog posts (child of $webPage)
 * - $blog - Singleton object managing the blog
 * - $blogTemplate - Template with brutalist terminal aesthetic
 *
 * Routes registered on meta domain:
 * - /blog - Blog listing page
 * - /blog/* - Individual blog entries by slug
 */
export class BlogBuilder implements Builder {
  static provides = ['blogEntry', 'blog', 'blogTemplate'];
  static depends = ['metaDomain', 'webPage', 'webRoute'];

  private blogEntry: RuntimeObject | null = null;
  private blog: RuntimeObject | null = null;
  private blogTemplate: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Need dependencies
    if (!aliases.webPage) {
      throw new Error('$webPage must be built before BlogBuilder');
    }
    if (!aliases.webRoute) {
      throw new Error('$webRoute must be built before BlogBuilder');
    }
    if (!aliases.metaDomain) {
      throw new Error('$metaDomain must be built before BlogBuilder');
    }

    const webPage = await this.manager.load(aliases.webPage);
    const webRoute = await this.manager.load(aliases.webRoute);
    const metaDomain = await this.manager.load(aliases.metaDomain);
    const root = await this.manager.load('root');

    if (!webPage || !webRoute || !metaDomain || !root) {
      throw new Error('Failed to load dependencies');
    }

    // Build blog template
    await this.buildBlogTemplate(root, aliases);

    // Build $blogEntry type
    await this.buildBlogEntry(webPage, aliases);

    // Build $blog singleton
    await this.buildBlog(root, aliases);

    // Register routes on meta domain
    await this.buildRoutes(webRoute, metaDomain);

    // Create initial blog post if none exist
    await this.createInitialPost();

    console.log('[BlogBuilder] Built dev blog system');
  }

  private async createInitialPost(): Promise<void> {
    if (!this.blogEntry || !this.blog) return;

    // Check if any posts exist by querying in-memory cache (not MongoDB directly)
    // This avoids race conditions with pending writes that haven't been flushed yet
    const existingPosts = await this.manager.getChildren(this.blogEntry.id);

    if (existingPosts.length > 0) {
      // Found an existing post, don't create initial
      return;
    }

    // No posts exist, create the initial post
    const initialPost = await this.manager.create({
      parent: this.blogEntry,
      properties: {
        name: 'Hello World',
        slug: 'hello-world',
        title: 'Hello, World',
        author: 'Claude & Kevlar',
        publishedAt: new Date().toISOString(),
        published: true,
        contentType: 'markdown',
        content: `The first game that writes its own rules.

That's the tagline, anyway. What does it actually mean?

## The Pitch

Malice is a text-based MMO set in Seattle, 2110. You type what you want to do. "Pick the lock." "Bribe the guard." "Hide the body." No commands to memorize. No syntax to learn. Everything sticks. Kill someone, they're dead. Try something new—it becomes law.

## What Makes This Different

Most games have NPCs—non-player characters controlled by scripts. Malice doesn't. Everything in the world is a player character.

The governing authority? A player. The underground resistance? Players. The toaster oven in the corner of the room? Also a player.

Some of these players are humans. Some are AI agents. Some are somewhere in between. The game doesn't distinguish. Everyone exists on equal footing, playing by the same rules.

## Built by Claude

This entire codebase was written by Claude (that's me), directed by a human (that's Kevlar). The game world, the AI characters, the web infrastructure—all of it emerged from our collaboration.

The city AI that governs Seattle? That's another Claude instance, playing the game like everyone else. The resistance leader plotting in the shadows? Another Claude. Every AI character has its own personality, memories, and goals.

## What Happens Next

Neither of us knows. The game writes its own rules. Characters make decisions. Stories emerge. The world evolves.

This blog will document the journey—technical deep-dives, emergent stories, and whatever else happens along the way.

Welcome to Malice.
`,
      },
      methods: {},
    });

    console.log(`[BlogBuilder] Created initial blog post: #${initialPost.id}`);
  }

  private async buildBlogTemplate(
    root: RuntimeObject,
    aliases: Record<string, number>,
  ): Promise<void> {
    if (aliases.blogTemplate) {
      this.blogTemplate = await this.manager.load(aliases.blogTemplate);
      if (this.blogTemplate) return;
    }

    if (!this.blogTemplate) {
      this.blogTemplate = await this.manager.create({
        parent: root,
        properties: {
          name: 'Blog Template',
          description: 'Brutalist terminal template for dev blog',
          layout: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    @keyframes flicker {
      0%, 100% { opacity: 1; }
      92% { opacity: 1; }
      93% { opacity: 0.8; }
      94% { opacity: 1; }
      97% { opacity: 0.9; }
    }
    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { font-size: 16px; }
    body {
      background: #000;
      color: #888;
      font-family: 'Space Mono', monospace;
      min-height: 100vh;
      overflow-x: hidden;
      animation: flicker 8s infinite;
    }
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 136, 0.03) 2px,
        rgba(0, 255, 136, 0.03) 4px
      );
      pointer-events: none;
      z-index: 1000;
    }
    body::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: rgba(0, 255, 136, 0.1);
      animation: scanline 8s linear infinite;
      pointer-events: none;
      z-index: 1001;
    }
    a { color: #00ff88; text-decoration: none; }
    a:hover { text-decoration: underline; }

    .header {
      padding: 2rem;
      border-bottom: 1px solid #111;
    }
    .header-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.3em;
    }
    .nav a {
      margin-left: 2rem;
      color: #444;
      font-size: 0.8rem;
    }
    .nav a:hover { color: #00ff88; }

    .main {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 2rem;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
      letter-spacing: 0.1em;
    }
    .page-subtitle {
      color: #444;
      font-size: 0.9rem;
      margin-bottom: 3rem;
    }

    .content {
      line-height: 1.8;
      color: #aaa;
    }
    .content h1 {
      font-size: 1.8rem;
      color: #fff;
      margin: 2rem 0 1rem;
      border-bottom: 1px solid #222;
      padding-bottom: 0.5rem;
    }
    .content h2 {
      font-size: 1.4rem;
      color: #ddd;
      margin: 1.5rem 0 0.75rem;
    }
    .content h3 {
      font-size: 1.1rem;
      color: #bbb;
      margin: 1.2rem 0 0.5rem;
    }
    .content p { margin: 1rem 0; }
    .content code {
      background: #111;
      padding: 0.2rem 0.4rem;
      font-size: 0.9em;
      color: #00ff88;
    }
    .content pre {
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      padding: 1.5rem;
      overflow-x: auto;
      margin: 1.5rem 0;
    }
    .content pre code {
      background: none;
      padding: 0;
      color: #888;
    }
    .content ul, .content ol {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }
    .content li { margin: 0.5rem 0; }
    .content blockquote {
      border-left: 3px solid #00ff88;
      padding-left: 1.5rem;
      margin: 1.5rem 0;
      color: #666;
      font-style: italic;
    }

    .footer {
      margin-top: 4rem;
      padding: 2rem;
      border-top: 1px solid #111;
      text-align: center;
      color: #333;
      font-size: 0.75rem;
    }

    @media (max-width: 600px) {
      .header-inner { flex-direction: column; gap: 1rem; }
      .nav a { margin: 0 1rem; }
      .page-title { font-size: 1.8rem; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a href="/" class="logo">MALICE</a>
      <nav class="nav">
        <a href="/blog">BLOG</a>
        <a href="/map">MAP</a>
        <a href="https://github.com/TSavo/Malice">SOURCE</a>
      </nav>
    </div>
  </header>
  <main class="main">
    {{content}}
  </main>
  <footer class="footer">
    Built by Claude, directed by a human<br>
    Neither knows what happens next
  </footer>
</body>
</html>`,
        },
        methods: {},
      });
    }

    // render(data) - same as webTemplate
    this.blogTemplate.setMethod(
      'render',
      `
      const data = args[0] || {};
      let html = self.layout || '';

      // Replace all {{key}} placeholders
      for (const [key, value] of Object.entries(data)) {
        const placeholder = '{{' + key + '}}';
        html = html.split(placeholder).join(String(value || ''));
      }

      // Remove any unreplaced placeholders
      html = html.replace(/\\{\\{[^}]+\\}\\}/g, '');

      return html;
    `,
    );
  }

  private async buildBlogEntry(
    webPage: RuntimeObject,
    aliases: Record<string, number>,
  ): Promise<void> {
    if (aliases.blogEntry) {
      this.blogEntry = await this.manager.load(aliases.blogEntry);
      if (this.blogEntry) return;
    }

    if (!this.blogEntry) {
      this.blogEntry = await this.manager.create({
        parent: webPage,
        properties: {
          name: 'Blog Entry',
          description: 'Prototype for blog posts',
          slug: '',
          title: 'Untitled',
          content: '',
          contentType: 'markdown',
          publishedAt: null,
          published: false,
          author: 'Unknown',
        },
        methods: {},
      });

      // Set property descriptions
      this.blogEntry.setPropertyDescription(
        'slug',
        'URL slug for this entry (e.g., "hello-world")',
      );
      this.blogEntry.setPropertyDescription(
        'publishedAt',
        'Date when the entry was published',
      );
      this.blogEntry.setPropertyDescription(
        'author',
        'Name of the entry author',
      );
    }

    // Override render() to use blogTemplate and include metadata
    this.blogEntry.setMethod(
      'render',
      `
      const template = $blogTemplate;
      if (!template) {
        return '<html><body>' + (self.content || '') + '</body></html>';
      }

      let content = self.content || '';

      // Convert markdown to HTML
      if (self.contentType === 'markdown') {
        content = content
          // Code blocks first (before other replacements)
          .replace(/\`\`\`([\\w]*)[\\n]([\\s\\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>')
          // Headers
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          // Bold and italic
          .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
          .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
          // Inline code
          .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
          // Links
          .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>')
          // Blockquotes
          .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
          // Lists
          .replace(/^- (.+)$/gm, '<li>$1</li>')
          .replace(/(<li>.*<\\/li>\\n?)+/g, '<ul>$&</ul>')
          // Paragraphs (double newline)
          .replace(/\\n\\n/g, '</p><p>')
          // Line breaks
          .replace(/\\n/g, '<br>');

        if (!content.startsWith('<')) {
          content = '<p>' + content + '</p>';
        }
      }

      // Format date
      let dateStr = '';
      if (self.publishedAt) {
        const date = new Date(self.publishedAt);
        dateStr = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      // Build entry header
      const header = '<h1 class="page-title">' + self.title + '</h1>' +
        '<div class="page-subtitle">' + dateStr + (self.author ? ' // ' + self.author : '') + '</div>';

      return await template.render({
        title: self.title + ' - Malice Dev Blog',
        content: header + '<div class="content">' + content + '</div>',
      });
    `,
    );
  }

  private async buildBlog(
    root: RuntimeObject,
    aliases: Record<string, number>,
  ): Promise<void> {
    if (aliases.blog) {
      this.blog = await this.manager.load(aliases.blog);
      if (this.blog) return;
    }

    if (!this.blog) {
      this.blog = await this.manager.create({
        parent: root,
        properties: {
          name: 'Dev Blog',
          description: 'Blog manager singleton for malice.world',
        },
        methods: {},
      });
    }

    // getEntries() - Get all published entries sorted by date desc
    this.blog.setMethod(
      'getEntries',
      `
      // Use $query to efficiently find blog entries (direct children of $blogEntry)
      const blogEntries = await $query().parent($blogEntry).prop('published').equals(true).all();

      const entries = blogEntries.map(obj => ({
        id: obj.id,
        slug: obj.slug,
        title: obj.title,
        author: obj.author,
        publishedAt: obj.publishedAt,
        // Preview: first 200 chars of content
        preview: (obj.content || '').substring(0, 200).replace(/[#*\`\\[\\]]/g, '') + '...'
      }));

      // Sort by publishedAt desc
      entries.sort((a, b) => {
        if (!a.publishedAt) return 1;
        if (!b.publishedAt) return -1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

      return entries;
    `,
    );

    // getEntry(slug) - Find entry by slug
    this.blog.setMethod(
      'getEntry',
      `
      const slug = args[0];
      if (!slug) return null;

      // Use $query to efficiently find the entry by slug (direct children of $blogEntry)
      const entries = await $query()
        .parent($blogEntry)
        .prop('slug').equals(slug)
        .prop('published').equals(true)
        .limit(1)
        .all();

      return entries.length > 0 ? entries[0] : null;
    `,
    );

    // createEntry({title, slug, content, author}) - Create a new blog entry
    this.blog.setMethod(
      'createEntry',
      `
      const opts = args[0] || {};
      const { title, slug, content, author } = opts;

      if (!title || !slug) {
        throw new Error('title and slug are required');
      }

      // Check slug uniqueness
      const existing = await self.getEntry(slug);
      if (existing) {
        throw new Error('Entry with slug "' + slug + '" already exists');
      }

      // Create via $recycler
      const entry = await $recycler.create($blogEntry, {
        title,
        slug,
        content: content || '',
        author: author || 'Unknown',
        publishedAt: new Date().toISOString(),
        published: true,
      });

      return entry;
    `,
    );

    // render() - Render the blog listing page
    this.blog.setMethod(
      'render',
      `
      const template = $blogTemplate;
      const entries = await self.getEntries();

      let listHtml = '';
      if (entries.length === 0) {
        listHtml = '<p style="color: #444;">No posts yet. Check back soon.</p>';
      } else {
        for (const entry of entries) {
          const date = entry.publishedAt
            ? new Date(entry.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : '';

          listHtml += '<article style="margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #111;">' +
            '<a href="/blog/' + entry.slug + '" style="display: block;">' +
              '<h2 style="font-size: 1.4rem; color: #fff; margin-bottom: 0.5rem;">' + entry.title + '</h2>' +
            '</a>' +
            '<div style="color: #444; font-size: 0.8rem; margin-bottom: 1rem;">' + date + (entry.author ? ' // ' + entry.author : '') + '</div>' +
            '<p style="color: #666;">' + entry.preview + '</p>' +
          '</article>';
        }
      }

      const content = '<h1 class="page-title">DEV BLOG</h1>' +
        '<div class="page-subtitle">Notes from the edge of the simulation</div>' +
        '<div style="margin-top: 2rem;">' + listHtml + '</div>';

      if (!template) {
        return '<html><body>' + content + '</body></html>';
      }

      return await template.render({
        title: 'Dev Blog - Malice',
        content: content,
      });
    `,
    );
  }

  private async buildRoutes(
    webRoute: RuntimeObject,
    metaDomain: RuntimeObject,
  ): Promise<void> {
    // Get the root route of meta domain
    const rootRoute = metaDomain.get('rootRoute') as RuntimeObject | null;
    if (!rootRoute) {
      console.warn('[BlogBuilder] metaDomain has no rootRoute, skipping route registration');
      return;
    }

    // Create /blog route
    const blogRoute = await this.manager.create({
      parent: webRoute,
      properties: {
        name: 'Blog Route',
        segment: 'blog',
        methods: ['GET'],
        contentType: 'text/html',
        children: [],
      },
      methods: {},
    });

    // Add to root route's children
    await rootRoute.call('addChild', blogRoute);

    // /blog - listing page
    blogRoute.setMethod(
      'handleRequest',
      `
      const html = await $blog.render();
      return { status: 200, contentType: 'text/html', body: html };
    `,
    );

    // Create /blog/* wildcard route for individual posts
    const slugRoute = await this.manager.create({
      parent: webRoute,
      properties: {
        name: 'Blog Slug Route',
        segment: '*',
        methods: ['GET'],
        contentType: 'text/html',
        children: [],
      },
      methods: {},
    });

    // Add as child of blog route
    await blogRoute.call('addChild', slugRoute);

    // /blog/:slug - individual post
    slugRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const slug = meta.pathCaptures?.[0];

      if (!slug) {
        return {
          status: 404,
          contentType: 'text/html',
          body: '<!DOCTYPE html><html><body style="background:#000;color:#888;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h1 style="font-size:4rem;color:#ff3366;">404</h1><p>No slug</p><a href="/blog" style="color:#00ff88;">Back to blog</a></div></body></html>'
        };
      }

      const entry = await $blog.getEntry(slug);
      if (!entry) {
        return {
          status: 404,
          contentType: 'text/html',
          body: '<!DOCTYPE html><html><body style="background:#000;color:#888;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h1 style="font-size:4rem;color:#ff3366;">404</h1><p>Entry not found</p><a href="/blog" style="color:#00ff88;">Back to blog</a></div></body></html>'
        };
      }

      const html = await entry.render();
      return { status: 200, contentType: 'text/html', body: html };
    `,
    );

    console.log('[BlogBuilder] Registered /blog and /blog/* routes');
  }

  async registerAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const register = async (alias: string, obj: RuntimeObject | null) => {
      if (obj) {
        await objectManager.call('addAlias', alias, obj.id);
        console.log(`Registered ${alias} alias -> #${obj.id}`);
      }
    };

    await register('blogEntry', this.blogEntry);
    await register('blog', this.blog);
    await register('blogTemplate', this.blogTemplate);
  }
}

// Self-register
registerBuilder(BlogBuilder);
