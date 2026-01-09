import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds $aiImageGen MOO object for AI image generation
 *
 * Uses Google AI Studio direct API (Nano Banana / Gemini image models).
 * Free tier: 499 images/day tracked in MongoDB, then falls back to laozhang.ai.
 * Stores generated images in $blob for persistence.
 *
 * Usage from MOO code:
 *   const result = await $aiImageGen.generate('A cyberpunk banana');
 *   // result = { blobKey, contentType, prompt }
 *
 *   const base64 = await $aiImageGen.generateRaw('A glowing orb');
 *   // Returns base64 string directly
 *
 *   const usage = await $aiImageGen.getUsage();
 *   // { today: 42, limit: 499, remaining: 457 }
 */
export class AiImageGenBuilder implements Builder {
  static provides = ['aiImageGen'];
  static depends = ['blob']; // Needs $blob for storage

  private aiImageGen: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.aiImageGen) {
      this.aiImageGen = await this.manager.load(aliases.aiImageGen);
      if (this.aiImageGen) return;
    }

    if (!this.aiImageGen) {
      const root = await this.manager.load('root');
      this.aiImageGen = await this.manager.create({
        parent: root!,
        properties: {
          name: 'AI Image Generator',
          description: 'Generate images using Google AI (Nano Banana)',
          defaultModel: 'gemini-2.5-flash-image', // Nano Banana (stable)
          dailyLimit: 499, // Free tier limit (Google allows 500, we use 499 for safety)
        },
      });
    }

    // Generate image and store in $blob
    this.aiImageGen.setMethod(
      'generate',
      `
      /**
       * Generate an image and store in $blob using Google AI (Nano Banana)
       * Uses free tier (499/day) then falls back to laozhang.ai
       * @param prompt - Text description of the image to generate
       * @param options - { model?, metadata?, filename?, aspectRatio? }
       *   aspectRatio: 'landscape' (default), 'portrait', 'square'
       * @returns { success, blobKey, aspectRatio, contentType, prompt, provider?, error? }
       */
      const prompt = args[0];
      const options = args[1] || {};

      if (!prompt || typeof prompt !== 'string') {
        return { success: false, error: 'Prompt is required' };
      }

      const model = options.model || self.defaultModel;

      // Map aspect ratio names to API values
      const aspectRatioMap = {
        'landscape': '16:9',
        'portrait': '9:16',
        'square': '1:1',
        'wide': '16:9',
        'tall': '9:16',
      };
      const rawRatio = options.aspectRatio || 'landscape';
      const aspectRatio = aspectRatioMap[rawRatio] || rawRatio;

      // Check daily usage and determine which provider to use
      const db = $db.getDatabase();
      const usageCollection = db.collection('aiImageGenUsage');
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const usageDoc = await usageCollection.findOne({ date: today });
      const todayCount = usageDoc?.count || 0;
      const dailyLimit = self.dailyLimit || 499;

      // Determine provider: Google free tier or laozhang.ai fallback
      const googleKey = process.env.GOOGLE_AI_API_KEY;
      const laozhangKey = process.env.LAOZHANG_API_KEY;

      let useGoogle = googleKey && todayCount < dailyLimit;
      let provider = useGoogle ? 'google' : 'laozhang';

      if (!googleKey && !laozhangKey) {
        return { success: false, error: 'No API key set (GOOGLE_AI_API_KEY or LAOZHANG_API_KEY)' };
      }

      if (!useGoogle && !laozhangKey) {
        return { success: false, error: 'Daily limit reached (' + dailyLimit + ') and no LAOZHANG_API_KEY fallback' };
      }

      // Increment usage count BEFORE API call to prevent race condition
      if (useGoogle) {
        await usageCollection.updateOne(
          { date: today },
          { $inc: { count: 1 }, $setOnInsert: { date: today } },
          { upsert: true }
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      try {
        let apiUrl, headers;

        if (useGoogle) {
          apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
          headers = {
            'Content-Type': 'application/json',
            'x-goog-api-key': googleKey,
          };
        } else {
          apiUrl = 'https://api.laozhang.ai/v1beta/models/' + model + ':generateContent';
          headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + laozhangKey,
          };
        }

        // Build generationConfig
        // Google API uses nested imageConfig.aspectRatio
        // laozhang API uses top-level aspectRatio
        // This difference is due to API specification differences between providers
        const generationConfig = useGoogle
          ? { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspectRatio } }
          : { responseModalities: ['IMAGE'], aspectRatio: aspectRatio };

        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: generationConfig,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errorBody = await resp.text();
          return { success: false, error: 'API error ' + resp.status + ': ' + errorBody, provider };
        }

        const data = await resp.json();

        // Extract first image from response (generate method)
        const parts = data.candidates?.[0]?.content?.parts || [];
        let imageData = null;
        let mimeType = 'image/png';
        let textResponse = null;

        for (const part of parts) {
          if (part.inlineData && !imageData) {
            imageData = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
          }
          if (part.text) {
            textResponse = part.text;
          }
        }

        if (!imageData) {
          // Rollback usage count if we incremented it
          if (useGoogle) {
            const rollbackResult = await usageCollection.updateOne(
              { date: today, count: { $gt: 0 } },
              { $inc: { count: -1 } }
            );
            if (rollbackResult.matchedCount === 0) {
              console.error('[AI Image Gen] Failed to rollback usage count - count may already be 0');
            }
          }
          return { success: false, error: 'No image in response', textResponse, provider };
        }

        // Store in $blob
        const blob = $blob;
        if (!blob) {
          return { success: false, error: '$blob not available' };
        }

        const filename = (options.filename || 'ai_image_' + Date.now()) + '.png';
        const metadata = {
          contentType: mimeType,
          filename: filename,
          prompt: prompt,
          model: model,
          aspectRatio: aspectRatio,
          generatedAt: new Date().toISOString(),
          provider: provider,
          ...(options.metadata || {}),
        };

        const blobKey = await blob.write(imageData, metadata);

        return {
          success: true,
          blobKey: blobKey,
          contentType: mimeType,
          prompt: prompt,
          aspectRatio: aspectRatio,
          textResponse: textResponse,
          provider: provider,
        };
      } catch (err) {
        clearTimeout(timeoutId);
        // Rollback usage count on error
        if (useGoogle) {
          const rollbackResult = await usageCollection.updateOne(
            { date: today, count: { $gt: 0 } },
            { $inc: { count: -1 } }
          );
          if (rollbackResult.matchedCount === 0) {
            console.error('[AI Image Gen] Failed to rollback usage count - count may already be 0');
          }
        }
        if (err.name === 'AbortError') {
          return { success: false, error: 'Request timeout (120s)', provider };
        }
        return { success: false, error: err.message || String(err), provider };
      }
    `,
    );

    // Generate image and return base64 directly (no storage)
    this.aiImageGen.setMethod(
      'generateRaw',
      `
      /**
       * Generate an image and return base64 directly (not stored) using Google AI
       * Uses free tier (499/day) then falls back to laozhang.ai
       * @param prompt - Text description of the image to generate
       * @param options - { model?, aspectRatio? }
       * @returns { success, data, aspectRatio, contentType, prompt, provider?, error? }
       */
      const prompt = args[0];
      const options = args[1] || {};

      if (!prompt || typeof prompt !== 'string') {
        return { success: false, error: 'Prompt is required' };
      }

      const model = options.model || self.defaultModel;

      // Map aspect ratio names to API values
      const aspectRatioMap = {
        'landscape': '16:9',
        'portrait': '9:16',
        'square': '1:1',
        'wide': '16:9',
        'tall': '9:16',
      };
      const rawRatio = options.aspectRatio || 'landscape';
      const aspectRatio = aspectRatioMap[rawRatio] || rawRatio;

      // Check daily usage and determine which provider to use
      const db = $db.getDatabase();
      const usageCollection = db.collection('aiImageGenUsage');
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const usageDoc = await usageCollection.findOne({ date: today });
      const todayCount = usageDoc?.count || 0;
      const dailyLimit = self.dailyLimit || 499;

      // Determine provider: Google free tier or laozhang.ai fallback
      const googleKey = process.env.GOOGLE_AI_API_KEY;
      const laozhangKey = process.env.LAOZHANG_API_KEY;

      let useGoogle = googleKey && todayCount < dailyLimit;
      let provider = useGoogle ? 'google' : 'laozhang';

      if (!googleKey && !laozhangKey) {
        return { success: false, error: 'No API key set (GOOGLE_AI_API_KEY or LAOZHANG_API_KEY)' };
      }

      if (!useGoogle && !laozhangKey) {
        return { success: false, error: 'Daily limit reached (' + dailyLimit + ') and no LAOZHANG_API_KEY fallback' };
      }

      // Increment usage count BEFORE API call to prevent race condition
      if (useGoogle) {
        await usageCollection.updateOne(
          { date: today },
          { $inc: { count: 1 }, $setOnInsert: { date: today } },
          { upsert: true }
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        let apiUrl, headers;

        if (useGoogle) {
          apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
          headers = {
            'Content-Type': 'application/json',
            'x-goog-api-key': googleKey,
          };
        } else {
          apiUrl = 'https://api.laozhang.ai/v1beta/models/' + model + ':generateContent';
          headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + laozhangKey,
          };
        }

        // Build generationConfig
        // Google API uses nested imageConfig.aspectRatio
        // laozhang API uses top-level aspectRatio
        // This difference is due to API specification differences between providers
        const generationConfig = useGoogle
          ? { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspectRatio } }
          : { responseModalities: ['IMAGE'], aspectRatio: aspectRatio };

        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: generationConfig,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errorBody = await resp.text();
          return { success: false, error: 'API error ' + resp.status + ': ' + errorBody, provider };
        }

        const data = await resp.json();

        // Extract first image from response (generateRaw method)
        const parts = data.candidates?.[0]?.content?.parts || [];
        let imageData = null;
        let mimeType = 'image/png';
        let textResponse = null;

        for (const part of parts) {
          if (part.inlineData && !imageData) {
            imageData = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
          }
          if (part.text) {
            textResponse = part.text;
          }
        }

        if (!imageData) {
          // Rollback usage count if we incremented it
          if (useGoogle) {
            await usageCollection.updateOne(
              { date: today },
              { $inc: { count: -1 } }
            );
          }
          return { success: false, error: 'No image in response', textResponse, provider };
        }

        return {
          success: true,
          data: imageData,
          contentType: mimeType,
          prompt: prompt,
          aspectRatio: aspectRatio,
          textResponse: textResponse,
          provider: provider,
        };
      } catch (err) {
        clearTimeout(timeoutId);
        // Rollback usage count on error
        if (useGoogle) {
          const rollbackResult = await usageCollection.updateOne(
            { date: today, count: { $gt: 0 } },
            { $inc: { count: -1 } }
          );
          if (rollbackResult.matchedCount === 0) {
            console.error('[AI Image Gen] Failed to rollback usage count - count may already be 0');
          }
        }
        if (err.name === 'AbortError') {
          return { success: false, error: 'Request timeout (120s)', provider };
        }
        return { success: false, error: err.message || String(err), provider };
      }
    `,
    );

    // List available models
    this.aiImageGen.setMethod(
      'listModels',
      `
      /**
       * List available Nano Banana models
       * @returns Array of model info
       */
      return [
        { id: 'gemini-2.5-flash-image', name: 'Nano Banana (stable)', tier: 'budget', freePerDay: 499 },
        { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro (4K support)', tier: 'quality', freePerDay: 2 },
      ];
    `,
    );

    // Get current usage stats
    this.aiImageGen.setMethod(
      'getUsage',
      `
      /**
       * Get current daily usage stats for Google free tier
       * @returns { today, limit, remaining, date }
       */
      const db = $db.getDatabase();
      const usageCollection = db.collection('aiImageGenUsage');
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const usageDoc = await usageCollection.findOne({ date: today });
      const todayCount = usageDoc?.count || 0;
      const dailyLimit = self.dailyLimit || 499;

      return {
        today: todayCount,
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - todayCount),
        date: today,
      };
    `,
    );

    // Get remaining quota (convenience method)
    this.aiImageGen.setMethod(
      'getRemainingQuota',
      `
      /**
       * Get remaining quota for Google free tier today
       * @returns Number of images remaining in free tier
       */
      const usage = await self.getUsage();
      return usage.remaining;
    `,
    );

    // Set default model
    this.aiImageGen.setMethod(
      'setDefaultModel',
      `
      /**
       * Set the default model for image generation
       * @param model - Model ID
       */
      const model = args[0];
      if (!model || typeof model !== 'string') {
        return { success: false, error: 'Model ID is required' };
      }
      self.defaultModel = model;
      return { success: true, model: model };
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.aiImageGen) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'aiImageGen', this.aiImageGen.id);
    console.log(`✅ Registered $aiImageGen alias -> #${this.aiImageGen.id}`);
  }
}

// Self-register
registerBuilder(AiImageGenBuilder);
