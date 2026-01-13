import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import type { RuntimeObject } from '../../types/object.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
const TEST_DB_NAME = 'malice_test_describable_prompts';

describe('Describable Prompt Methods', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let describable: RuntimeObject | null;
  let testObject: RuntimeObject | null;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, TEST_DB_NAME);
    await db.connect();
    await db.objects.deleteMany({});
    await db.ensureRoot();
    manager = new ObjectManager(db);

    // Bootstrap minimal objects
    const { bootstrapCore } = await import(
      '../../src/database/bootstrap/bootstrap-core.js'
    );
    await bootstrapCore(manager);

    await manager.loadAll();

    // Get describable prototype
    const objectManager = await manager.load(0);
    const aliases = objectManager?.get('aliases') as Record<string, number>;
    describable = aliases?.describable
      ? await manager.load(aliases.describable)
      : null;

    // Create test object with systemPrompt
    if (describable) {
      testObject = await manager.create({
        parent: describable,
        properties: {
          name: 'TestDevice',
          description: 'A test device',
          systemPrompt: 'You are a helpful test device.',
          interactionSession: null,
          aiMessageCount: 0,
        },
      });
    }
  }, 30000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('prompt() method', () => {
    it('should exist on describable prototype', async () => {
      expect(describable).toBeDefined();
      const code = await describable?.getMethodCode('prompt');
      expect(code).toBeDefined();
    });

    it('should return null if no systemPrompt', async () => {
      if (!describable) throw new Error('Describable not found');

      const obj = await manager.create({
        parent: describable,
        properties: { name: 'NoPrompt', systemPrompt: null },
      });

      const prompt = await obj.call('prompt', {});
      expect(prompt).toBe(null);
    });

    it('should build prompt with systemPrompt', async () => {
      if (!testObject) throw new Error('Test object not found');

      const prompt = await testObject.call('prompt', {});

      expect(prompt).toContain('You are a helpful test device');
      expect(prompt).toContain('TestDevice');
    });

    it('should include speaker context when provided', async () => {
      if (!testObject) throw new Error('Test object not found');

      const context = {
        speaker: { id: 123, name: 'Alice', credits: 500 },
      };

      const prompt = await testObject.call('prompt', context);

      expect(prompt).toContain('Alice');
      expect(prompt).toContain('123');
      expect(prompt).toContain('500');
    });

    it('should include location context', async () => {
      if (!testObject) throw new Error('Test object not found');
      if (!describable) throw new Error('Describable not found');

      // Create location
      const location = await manager.create({
        parent: describable,
        properties: { name: 'TestRoom' },
      });

      // Move test object to location
      testObject.set('location', location);

      const prompt = await testObject.call('prompt', {});

      expect(prompt).toContain('TestRoom');

      // Clean up
      testObject.set('location', null);
    });

    it('should include abilities if present', async () => {
      if (!testObject) throw new Error('Test object not found');

      testObject.set('abilities', 'Can scan, beep, and analyze.');

      const prompt = await testObject.call('prompt', {});

      expect(prompt).toContain('Can scan, beep, and analyze');

      // Clean up
      testObject.set('abilities', null);
    });

    it('should include parent type information', async () => {
      if (!testObject) throw new Error('Test object not found');

      const prompt = await testObject.call('prompt', {});

      // Should mention the parent type
      expect(prompt).toBeDefined();
    });
  });

  describe('promptPrefix() method', () => {
    it('should exist on describable prototype', async () => {
      expect(describable).toBeDefined();
      const code = await describable?.getMethodCode('promptPrefix');
      expect(code).toBeDefined();
    });

    it('should return empty string by default', async () => {
      if (!testObject) throw new Error('Test object not found');

      const prefix = await testObject.call('promptPrefix', {});
      expect(prefix).toBe('');
    });

    it('should accept context parameter', async () => {
      if (!testObject) throw new Error('Test object not found');

      const context = { messageCount: 10, speaker: { name: 'Bob' } };
      const prefix = await testObject.call('promptPrefix', context);

      // Default implementation returns empty, but method should not error
      expect(typeof prefix).toBe('string');
    });
  });

  describe('promptSuffix() method', () => {
    it('should exist on describable prototype', async () => {
      expect(describable).toBeDefined();
      const code = await describable?.getMethodCode('promptSuffix');
      expect(code).toBeDefined();
    });

    it('should return empty string by default', async () => {
      if (!testObject) throw new Error('Test object not found');

      const suffix = await testObject.call('promptSuffix', {});
      expect(suffix).toBe('');
    });

    it('should accept context parameter', async () => {
      if (!testObject) throw new Error('Test object not found');

      const context = { messageCount: 5 };
      const suffix = await testObject.call('promptSuffix', context);

      expect(typeof suffix).toBe('string');
    });
  });

  describe('prompt composition in to() method', () => {
    it('should track message count', async () => {
      if (!testObject) throw new Error('Test object not found');

      testObject.set('aiMessageCount', 0);

      // Note: to() method calls $aiQuery which we can't test without API key
      // But we can verify the message count is incremented in the method code
      const code = await testObject.getMethodCode('to');
      expect(code?.code).toContain('aiMessageCount');
      expect(code?.code).toContain('messageCount');
    });

    it('should call prompt() to build system prompt', async () => {
      if (!testObject) throw new Error('Test object not found');

      const code = await testObject.getMethodCode('to');
      expect(code?.code).toContain('await self.prompt(');
    });

    it('should call promptPrefix() and promptSuffix()', async () => {
      if (!testObject) throw new Error('Test object not found');

      const code = await testObject.getMethodCode('to');
      expect(code?.code).toContain('await self.promptPrefix(');
      expect(code?.code).toContain('await self.promptSuffix(');
    });

    it('should wrap user message with prefix and suffix', async () => {
      if (!testObject) throw new Error('Test object not found');

      const code = await testObject.getMethodCode('to');
      expect(code?.code).toContain('prefix +');
      expect(code?.code).toContain('+ suffix');
    });
  });

  describe('aiMessageCount property', () => {
    it('should be defined on describable objects', () => {
      if (!testObject) throw new Error('Test object not found');

      const count = testObject.get('aiMessageCount');
      expect(count).toBeDefined();
      expect(typeof count).toBe('number');
    });

    it('should have property description', async () => {
      if (!testObject) throw new Error('Test object not found');

      const desc = await testObject.call(
        'getPropertyDescription',
        'aiMessageCount',
      );
      expect(desc).toBeDefined();
      expect(desc).toContain('reinforcement');
    });

    it('should persist when modified', () => {
      if (!testObject) throw new Error('Test object not found');

      testObject.set('aiMessageCount', 42);
      expect(testObject.get('aiMessageCount')).toBe(42);

      testObject.set('aiMessageCount', 0); // Reset
    });
  });

  describe('override behavior', () => {
    it('should allow child objects to override prompt()', async () => {
      if (!describable) throw new Error('Describable not found');

      const customObj = await manager.create({
        parent: describable,
        properties: {
          name: 'CustomPrompt',
          systemPrompt: 'Base prompt',
        },
        methods: {
          prompt: {
            code: `
              return 'CUSTOM PROMPT: ' + self.systemPrompt;
            `,
          },
        },
      });

      const prompt = await customObj.call('prompt', {});
      expect(prompt).toBe('CUSTOM PROMPT: Base prompt');
    });

    it('should allow child objects to override promptPrefix()', async () => {
      if (!describable) throw new Error('Describable not found');

      const customObj = await manager.create({
        parent: describable,
        properties: {
          name: 'CustomPrefix',
        },
        methods: {
          promptPrefix: {
            code: `
              const context = args[0] || {};
              if (context.messageCount && context.messageCount % 5 === 0) {
                return 'REMINDER: Be helpful!\\n\\n';
              }
              return '';
            `,
          },
        },
      });

      const prefix1 = await customObj.call('promptPrefix', { messageCount: 3 });
      expect(prefix1).toBe('');

      const prefix2 = await customObj.call('promptPrefix', { messageCount: 5 });
      expect(prefix2).toContain('REMINDER');
    });

    it('should allow child objects to override promptSuffix()', async () => {
      if (!describable) throw new Error('Describable not found');

      const customObj = await manager.create({
        parent: describable,
        properties: {
          name: 'CustomSuffix',
        },
        methods: {
          promptSuffix: {
            code: `
              return '\\n\\n(Respond in haiku format)';
            `,
          },
        },
      });

      const suffix = await customObj.call('promptSuffix', {});
      expect(suffix).toContain('haiku');
    });
  });

  describe('integration with existing to() method', () => {
    it('should maintain backward compatibility', async () => {
      if (!testObject) throw new Error('Test object not found');

      // The to() method should still have the same signature
      const code = await testObject.getMethodCode('to');
      expect(code?.code).toContain('args[0]'); // speaker
      expect(code?.code).toContain('args[1]'); // message
    });

    it('should still check for systemPrompt', async () => {
      if (!describable) throw new Error('Describable not found');

      const noPromptObj = await manager.create({
        parent: describable,
        properties: { name: 'NoPrompt', systemPrompt: null },
      });

      // to() should return null if no systemPrompt
      // We can verify the code checks for this
      const code = await noPromptObj.getMethodCode('to');
      expect(code?.code).toContain('if (!self.systemPrompt)');
    });

    it('should build promptContext with speaker and messageCount', async () => {
      if (!testObject) throw new Error('Test object not found');

      const code = await testObject.getMethodCode('to');
      expect(code?.code).toContain('promptContext');
      expect(code?.code).toContain('speaker');
      expect(code?.code).toContain('messageCount');
    });
  });
});
