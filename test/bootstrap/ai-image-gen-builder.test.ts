import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MinimalBootstrap } from '../../src/database/bootstrap/minimal-bootstrap.js';
import { AiImageGenBuilder } from '../../src/database/bootstrap/ai-image-gen-builder.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('AiImageGenBuilder', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_ai_image_gen');
    await db.connect();

    // Clean database
    await db.objects.deleteMany({});

    manager = new ObjectManager(db);

    // Set up minimal bootstrap (Root, System, and core aliases)
    const bootstrap = new MinimalBootstrap(manager);
    await bootstrap.bootstrap();

    // Create $blob mock (dependency)
    const root = await manager.load(1);
    const blob = await manager.create({
      parent: root!,
      properties: {
        name: 'Blob Storage',
      },
    });
    blob.setMethod(
      'write',
      `
      const data = args[0];
      const metadata = args[1] || {};
      // Mock blob key generation
      return 'mock_blob_key_' + Date.now();
    `,
    );

    const objectManager = await manager.load(0);
    await objectManager?.call('addAlias', 'blob', blob.id);

    // Store original env variable
    originalEnv = process.env.MIDJOURNEY_API_URL;
  });

  afterEach(async () => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.MIDJOURNEY_API_URL = originalEnv;
    } else {
      delete process.env.MIDJOURNEY_API_URL;
    }
    await db.disconnect();
  });

  describe('build()', () => {
    it('should create aiImageGen object with correct properties', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');

      expect(aiImageGen).toBeTruthy();
      expect(aiImageGen?.get('name')).toBe('AI Image Generator');
      expect(aiImageGen?.get('description')).toContain('Midjourney');
      expect(aiImageGen?.get('defaultModel')).toBe('7');
    });

    it('should have generate method', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const methodCode = await aiImageGen?.getMethodCode('generate');

      expect(methodCode).toBeTruthy();
      expect(methodCode?.code).toContain('MIDJOURNEY_API_URL');
      expect(methodCode?.code).toContain('midjourney-api:3000');
    });

    it('should have generateRaw method', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const methodCode = await aiImageGen?.getMethodCode('generateRaw');

      expect(methodCode).toBeTruthy();
      expect(methodCode?.code).toContain('MIDJOURNEY_API_URL');
      expect(methodCode?.code).toContain('midjourney-api:3000');
    });

    it('should have listModels method', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const models = await aiImageGen?.call('listModels');

      expect(Array.isArray(models)).toBe(true);
      expect(models?.length).toBeGreaterThan(0);
      expect(models?.[0].id).toBe('7');
      expect(models?.[0].name).toContain('Midjourney v7');
      expect(models?.[0].tier).toBe('quality');
    });

    it('should have setDefaultModel method', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const result = await aiImageGen?.call(
        'setDefaultModel',
        '6.1',
      );

      expect(result?.success).toBe(true);
      expect(result?.model).toBe('6.1');
      expect(aiImageGen?.get('defaultModel')).toBe('6.1');
    });

    it('should be idempotent (safe to run twice)', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();
      await builder.registerAliases();

      const firstId = (await manager.load('aiImageGen'))?.id;

      // Build again
      await builder.build();
      await builder.registerAliases();

      const secondId = (await manager.load('aiImageGen'))?.id;

      expect(firstId).toBe(secondId);
    });
  });

  describe('registerAliases()', () => {
    it('should register $aiImageGen alias', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();
      await builder.registerAliases();

      const objectManager = await manager.load(0);
      const aliases = objectManager?.get('aliases') as Record<string, number>;

      expect(aliases.aiImageGen).toBeTruthy();

      const aiImageGen = await manager.load('aiImageGen');
      expect(aiImageGen?.id).toBe(aliases.aiImageGen);
    });
  });

  describe('generate() method behavior', () => {
    it('should return error when prompt is missing', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const result = await aiImageGen?.call('generate');

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('Prompt is required');
    });

    it('should return error when Midjourney API is unreachable', async () => {
      process.env.MIDJOURNEY_API_URL = 'http://invalid-url:9999';

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const result = await aiImageGen?.call('generate', 'A test image');

      expect(result?.success).toBe(false);
      expect(result?.error).toBeTruthy();
    });

    it('should use default model when not specified', async () => {
      process.env.MIDJOURNEY_API_URL = 'http://midjourney-api:3000';

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');

      // Mock fetch to capture request
      const originalFetch = global.fetch;
      let capturedBody = '';
      global.fetch = vi.fn(async (_url: string, options?: any) => {
        capturedBody = options?.body || '';
        throw new Error('Mock error to prevent actual API call');
      }) as any;

      try {
        await aiImageGen?.call('generate', 'A test image');
      } catch {
        // Expected to fail
      }

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.options?.version || '7').toBe('7');

      global.fetch = originalFetch;
    });

    it('should map aspect ratio names correctly', async () => {
      process.env.MIDJOURNEY_API_URL = 'http://midjourney-api:3000';

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');

      // Mock fetch to capture request body
      const originalFetch = global.fetch;
      let capturedBody = '';
      global.fetch = vi.fn(async (_url: string, options?: any) => {
        capturedBody = options?.body || '';
        throw new Error('Mock error to prevent actual API call');
      }) as any;

      try {
        await aiImageGen?.call('generate', 'A test image', {
          aspectRatio: 'portrait',
        });
      } catch {
        // Expected to fail
      }

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.options.aspectRatio).toBe('9:16');

      global.fetch = originalFetch;
    });

    it('should use correct Content-Type header for Midjourney API', async () => {
      process.env.MIDJOURNEY_API_URL = 'http://midjourney-api:3000';

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');

      // Mock fetch to capture headers
      const originalFetch = global.fetch;
      let capturedHeaders: any = {};
      global.fetch = vi.fn(async (_url: string, options?: any) => {
        capturedHeaders = options?.headers || {};
        throw new Error('Mock error to prevent actual API call');
      }) as any;

      try {
        await aiImageGen?.call('generate', 'A test image');
      } catch {
        // Expected to fail
      }

      expect(capturedHeaders['Content-Type']).toBe('application/json');

      global.fetch = originalFetch;
    });

    it('should use Midjourney API endpoint', async () => {
      process.env.MIDJOURNEY_API_URL = 'http://midjourney-api:3000';

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');

      // Mock fetch to capture URL
      const originalFetch = global.fetch;
      let capturedUrl = '';
      global.fetch = vi.fn(async (url: string) => {
        capturedUrl = url;
        throw new Error('Mock error to prevent actual API call');
      }) as any;

      try {
        await aiImageGen?.call('generate', 'A test image');
      } catch {
        // Expected to fail
      }

      expect(capturedUrl).toContain('midjourney-api:3000');
      expect(capturedUrl).toContain('/generate');

      global.fetch = originalFetch;
    });

    it('should support Midjourney-specific parameters', async () => {
      process.env.MIDJOURNEY_API_URL = 'http://midjourney-api:3000';

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');

      // Mock fetch to capture request body
      const originalFetch = global.fetch;
      let capturedBody = '';
      global.fetch = vi.fn(async (_url: string, options?: any) => {
        capturedBody = options?.body || '';
        throw new Error('Mock error to prevent actual API call');
      }) as any;

      try {
        await aiImageGen?.call('generate', 'A test image', {
          stylize: 500,
          chaos: 50,
          no: 'text, watermarks',
        });
      } catch {
        // Expected to fail
      }

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.options.stylize).toBe(500);
      expect(parsedBody.options.chaos).toBe(50);
      expect(parsedBody.options.no).toBe('text, watermarks');

      global.fetch = originalFetch;
    });
  });

  describe('generateRaw() method behavior', () => {
    it('should return error when prompt is missing', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const result = await aiImageGen?.call('generateRaw');

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('Prompt is required');
    });

    it('should return error when Midjourney API is unreachable', async () => {
      process.env.MIDJOURNEY_API_URL = 'http://invalid-url:9999';

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const result = await aiImageGen?.call('generateRaw', 'A test image');

      expect(result?.success).toBe(false);
      expect(result?.error).toBeTruthy();
    });
  });

  describe('setDefaultModel() method behavior', () => {
    it('should reject when model ID is missing', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const result = await aiImageGen?.call('setDefaultModel');

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('Model ID is required');
    });

    it('should reject when model ID is not a string', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const result = await aiImageGen?.call('setDefaultModel', 123);

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('Model ID is required');
    });
  });
});
