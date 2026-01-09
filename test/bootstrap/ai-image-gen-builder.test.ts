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
    originalEnv = process.env.LAOZHANG_API_KEY;
  });

  afterEach(async () => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.LAOZHANG_API_KEY = originalEnv;
    } else {
      delete process.env.LAOZHANG_API_KEY;
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
      expect(aiImageGen?.get('description')).toContain('Google AI');
      expect(aiImageGen?.get('defaultModel')).toBe('gemini-2.5-flash-image');
    });

    it('should have generate method', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const methodCode = await aiImageGen?.getMethodCode('generate');

      expect(methodCode).toBeTruthy();
      expect(methodCode?.code).toContain('GOOGLE_AI_API_KEY');
      expect(methodCode?.code).toContain('LAOZHANG_API_KEY');
      expect(methodCode?.code).toContain('generativelanguage.googleapis.com');
      expect(methodCode?.code).toContain('api.laozhang.ai');
    });

    it('should have generateRaw method', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const methodCode = await aiImageGen?.getMethodCode('generateRaw');

      expect(methodCode).toBeTruthy();
      expect(methodCode?.code).toContain('GOOGLE_AI_API_KEY');
      expect(methodCode?.code).toContain('LAOZHANG_API_KEY');
      expect(methodCode?.code).toContain('generativelanguage.googleapis.com');
      expect(methodCode?.code).toContain('api.laozhang.ai');
    });

    it('should have listModels method', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const models = await aiImageGen?.call('listModels');

      expect(Array.isArray(models)).toBe(true);
      expect(models?.length).toBe(2);
      expect(models?.[0].id).toBe('gemini-2.5-flash-image');
      expect(models?.[0].name).toContain('Nano Banana');
      expect(models?.[0].tier).toBe('budget');
      expect(models?.[0].freePerDay).toBe(499);
    });

    it('should have setDefaultModel method', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const result = await aiImageGen?.call(
        'setDefaultModel',
        'gemini-3-pro-image-preview',
      );

      expect(result?.success).toBe(true);
      expect(result?.model).toBe('gemini-3-pro-image-preview');
      expect(aiImageGen?.get('defaultModel')).toBe('gemini-3-pro-image-preview');
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

    it('should return error when no API key is set', async () => {
      delete process.env.LAOZHANG_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const result = await aiImageGen?.call('generate', 'A test image');

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('No API key set');
    });

    it('should use default model when not specified', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');

      // Mock fetch to capture request
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

      expect(capturedUrl).toContain('gemini-2.5-flash-image');

      global.fetch = originalFetch;
      delete process.env.GOOGLE_AI_API_KEY;
    });

    it('should map aspect ratio names correctly', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';

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
      // Google uses nested imageConfig.aspectRatio
      expect(parsedBody.generationConfig.imageConfig.aspectRatio).toBe('9:16');

      global.fetch = originalFetch;
      delete process.env.GOOGLE_AI_API_KEY;
    });

    it('should use x-goog-api-key header for Google AI', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-google-key-456';

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

      expect(capturedHeaders['x-goog-api-key']).toBe('test-google-key-456');
      expect(capturedHeaders['Authorization']).toBeUndefined();

      global.fetch = originalFetch;
      delete process.env.GOOGLE_AI_API_KEY;
    });

    it('should use Authorization Bearer header for laozhang.ai fallback', async () => {
      // Set only laozhang key (no Google key), so it uses laozhang
      delete process.env.GOOGLE_AI_API_KEY;
      process.env.LAOZHANG_API_KEY = 'test-api-key-123';

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

      expect(capturedHeaders['Authorization']).toBe('Bearer test-api-key-123');
      expect(capturedHeaders['x-goog-api-key']).toBeUndefined();

      global.fetch = originalFetch;
    });

    it('should use Google AI endpoint when Google key is set', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';

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

      expect(capturedUrl).toContain('generativelanguage.googleapis.com');
      expect(capturedUrl).not.toContain('api.laozhang.ai');

      global.fetch = originalFetch;
      delete process.env.GOOGLE_AI_API_KEY;
    });

    it('should use api.laozhang.ai endpoint when only laozhang key is set', async () => {
      delete process.env.GOOGLE_AI_API_KEY;
      process.env.LAOZHANG_API_KEY = 'test-key';

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

      expect(capturedUrl).toContain('api.laozhang.ai');
      expect(capturedUrl).not.toContain('generativelanguage.googleapis.com');

      global.fetch = originalFetch;
    });

    it('should only request IMAGE responseModality (not TEXT)', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';

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
        await aiImageGen?.call('generate', 'A test image');
      } catch {
        // Expected to fail
      }

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.generationConfig.responseModalities).toEqual(['IMAGE']);
      expect(parsedBody.generationConfig.responseModalities).not.toContain(
        'TEXT',
      );

      global.fetch = originalFetch;
      delete process.env.GOOGLE_AI_API_KEY;
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

    it('should return error when no API key is set', async () => {
      delete process.env.LAOZHANG_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const result = await aiImageGen?.call('generateRaw', 'A test image');

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('No API key set');
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

  describe('getUsage() method behavior', () => {
    it('should return current usage stats', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const usage = await aiImageGen?.call('getUsage');

      expect(usage).toBeTruthy();
      expect(typeof usage?.today).toBe('number');
      expect(typeof usage?.limit).toBe('number');
      expect(typeof usage?.remaining).toBe('number');
      expect(typeof usage?.date).toBe('string');
      expect(usage?.limit).toBe(499);
      expect(usage?.remaining).toBe(usage?.limit - usage?.today);
    });

    it('should return zero usage when no usage doc exists', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const usage = await aiImageGen?.call('getUsage');

      expect(usage?.today).toBe(0);
      expect(usage?.remaining).toBe(499);
    });

    it('should read usage from MongoDB correctly', async () => {
      // Manually insert usage doc
      const today = new Date().toISOString().slice(0, 10);
      const usageCollection = db.getDatabase().collection('aiImageGenUsage');
      await usageCollection.insertOne({ date: today, count: 42 });

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const usage = await aiImageGen?.call('getUsage');

      expect(usage?.today).toBe(42);
      expect(usage?.remaining).toBe(457);
      expect(usage?.date).toBe(today);
    });
  });

  describe('getRemainingQuota() method behavior', () => {
    it('should return remaining quota as number', async () => {
      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const remaining = await aiImageGen?.call('getRemainingQuota');

      expect(typeof remaining).toBe('number');
      expect(remaining).toBe(499); // Default when no usage
    });

    it('should calculate remaining quota correctly with existing usage', async () => {
      // Insert usage doc
      const today = new Date().toISOString().slice(0, 10);
      const usageCollection = db.getDatabase().collection('aiImageGenUsage');
      await usageCollection.insertOne({ date: today, count: 100 });

      const builder = new AiImageGenBuilder(manager);
      await builder.build();

      const aiImageGen = await manager.load('aiImageGen');
      const remaining = await aiImageGen?.call('getRemainingQuota');

      expect(remaining).toBe(399);
    });
  });
});
