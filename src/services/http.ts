export interface HttpRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface HttpResponse {
  status: number;
  body: unknown;
}

export class HttpService {
  /**
   * Make an HTTP request
   */
  async request(url: string, opts: HttpRequestOptions = {}): Promise<HttpResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      opts.timeout || 30000
    );

    try {
      const resp = await fetch(url, {
        method: opts.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...opts.headers,
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
      clearTimeout(timeout);
    }
  }

  /**
   * HTTP GET request
   */
  get = (
    url: string,
    headers?: Record<string, string>
  ): Promise<HttpResponse> => this.request(url, { method: 'GET', headers });

  /**
   * HTTP POST request
   */
  post = (
    url: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<HttpResponse> =>
    this.request(url, { method: 'POST', body, headers });
}
