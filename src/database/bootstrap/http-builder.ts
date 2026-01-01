import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds $http MOO object for HTTP requests
 *
 * Pure MOO object - uses native fetch() directly.
 * No TypeScript service class needed.
 *
 * Usage from MOO code:
 *   const resp = await $http.get('https://api.example.com/data');
 *   const resp = await $http.post('https://api.example.com', { key: 'value' });
 *   const resp = await $http.getBinary('https://example.com/image.png');
 */
export class HttpBuilder implements Builder {
  static provides = ['http'];
  static depends: string[] = [];

  private http: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.http) {
      this.http = await this.manager.load(aliases.http);
      if (this.http) return;
    }

    if (!this.http) {
      const root = await this.manager.load('root');
      this.http = await this.manager.create({
        parent: root!,
        properties: {
          name: 'HTTP Client',
          description: 'HTTP client for external requests using native fetch',
        },
      });
    }

    // GET request
    this.http.setMethod(
      'get',
      `
      const url = args[0];
      const headers = args[1] || {};

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const resp = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        const contentType = resp.headers.get('content-type') || '';
        const body = contentType.includes('json')
          ? await resp.json()
          : await resp.text();

        return { status: resp.status, body };
      } finally {
        clearTimeout(timeoutId);
      }
    `,
    );

    // POST request
    this.http.setMethod(
      'post',
      `
      const url = args[0];
      const body = args[1];
      const headers = args[2] || {};

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const contentType = resp.headers.get('content-type') || '';
        const respBody = contentType.includes('json')
          ? await resp.json()
          : await resp.text();

        return { status: resp.status, body: respBody };
      } finally {
        clearTimeout(timeoutId);
      }
    `,
    );

    // Full request with options
    this.http.setMethod(
      'request',
      `
      const url = args[0];
      const opts = args[1] || {};

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.timeout || 30000);

      try {
        const resp = await fetch(url, {
          method: opts.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(opts.headers || {}),
          },
          body: opts.body ? JSON.stringify(opts.body) : undefined,
          signal: controller.signal,
        });

        const contentType = resp.headers.get('content-type') || '';
        const body = contentType.includes('json')
          ? await resp.json()
          : await resp.text();

        return { status: resp.status, body };
      } finally {
        clearTimeout(timeoutId);
      }
    `,
    );

    // GET binary data (returns base64)
    this.http.setMethod(
      'getBinary',
      `
      const url = args[0];
      const headers = args[1] || {};

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const resp = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        const buffer = await resp.arrayBuffer();
        const contentType = resp.headers.get('content-type') || 'application/octet-stream';

        // Convert to base64 using Buffer (Node.js global)
        const base64 = Buffer.from(buffer).toString('base64');

        return {
          status: resp.status,
          body: base64,
          contentType,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.http) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'http', this.http.id);
    console.log(`✅ Registered $http alias -> #${this.http.id}`);
  }
}

// Self-register
registerBuilder(HttpBuilder);
