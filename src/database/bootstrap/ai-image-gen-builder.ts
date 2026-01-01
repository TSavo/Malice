import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds $aiImageGen MOO object for AI image generation
 *
 * Uses Google's Gemini API (Nano Banana) to generate images,
 * then stores them in $blob for persistence.
 *
 * Usage from MOO code:
 *   const result = await $aiImageGen.generate('A cyberpunk banana');
 *   // result = { blobKey, contentType, prompt }
 *
 *   const base64 = await $aiImageGen.generateRaw('A glowing orb');
 *   // Returns base64 string directly
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
          description: 'Generate images using Gemini API (Nano Banana)',
          defaultModel: 'gemini-2.0-flash-exp-image-generation',
        },
      });
    }

    // Generate image and store in $blob
    this.aiImageGen.setMethod(
      'generate',
      `
      /**
       * Generate an image and store in $blob
       * @param prompt - Text description of the image to generate
       * @param options - { model?, metadata?, filename?, aspectRatio? }
       *   aspectRatio: 'landscape' (default), 'portrait', 'square', or '16:9', '9:16', '4:3', '3:4', '1:1'
       * @returns { success, blobKey, aspectRatio, contentType, prompt, error? }
       */
      const prompt = args[0];
      const options = args[1] || {};

      if (!prompt || typeof prompt !== 'string') {
        return { success: false, error: 'Prompt is required' };
      }

      // Get API key from environment
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return { success: false, error: 'GEMINI_API_KEY not set in environment' };
      }

      const model = options.model || self.defaultModel;
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';

      // Map friendly aspect ratio names to API values
      const aspectRatioMap = {
        'landscape': '16:9',
        'portrait': '9:16',
        'square': '1:1',
        'wide': '16:9',
        'tall': '9:16',
      };
      const rawRatio = options.aspectRatio || 'landscape';
      const aspectRatio = aspectRatioMap[rawRatio] || rawRatio;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      try {
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
              aspectRatio: aspectRatio,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errorBody = await resp.text();
          return { success: false, error: 'API error ' + resp.status + ': ' + errorBody };
        }

        const data = await resp.json();

        // Extract first image from response
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
          return { success: false, error: 'No image in response', textResponse };
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
        };
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          return { success: false, error: 'Request timeout (120s)' };
        }
        return { success: false, error: err.message || String(err) };
      }
    `,
    );

    // Generate image and return base64 directly (no storage)
    this.aiImageGen.setMethod(
      'generateRaw',
      `
      /**
       * Generate an image and return base64 directly (not stored)
       * @param prompt - Text description of the image to generate
       * @param options - { model?, aspectRatio? }
       * @returns { success, data, aspectRatio, contentType, prompt, error? }
       */
      const prompt = args[0];
      const options = args[1] || {};

      if (!prompt || typeof prompt !== 'string') {
        return { success: false, error: 'Prompt is required' };
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return { success: false, error: 'GEMINI_API_KEY not set in environment' };
      }

      const model = options.model || self.defaultModel;
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';

      // Map friendly aspect ratio names to API values
      const aspectRatioMap = {
        'landscape': '16:9',
        'portrait': '9:16',
        'square': '1:1',
        'wide': '16:9',
        'tall': '9:16',
      };
      const rawRatio = options.aspectRatio || 'landscape';
      const aspectRatio = aspectRatioMap[rawRatio] || rawRatio;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
              aspectRatio: aspectRatio,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errorBody = await resp.text();
          return { success: false, error: 'API error ' + resp.status + ': ' + errorBody };
        }

        const data = await resp.json();

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
          return { success: false, error: 'No image in response', textResponse };
        }

        return {
          success: true,
          data: imageData,
          contentType: mimeType,
          prompt: prompt,
          aspectRatio: aspectRatio,
          textResponse: textResponse,
        };
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          return { success: false, error: 'Request timeout (120s)' };
        }
        return { success: false, error: err.message || String(err) };
      }
    `,
    );

    // List available models
    this.aiImageGen.setMethod(
      'listModels',
      `
      /**
       * List available image generation models
       * @returns Array of model info
       */
      return [
        { id: 'gemini-2.0-flash-exp-image-generation', name: 'Gemini 2.0 Flash (Experimental)', tier: 'free' },
        { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (Nano Banana)', tier: 'free' },
        { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (Nano Banana Pro)', tier: 'free' },
        { id: 'imagen-4.0-generate-001', name: 'Imagen 4.0', tier: 'paid' },
        { id: 'imagen-4.0-ultra-generate-001', name: 'Imagen 4.0 Ultra', tier: 'paid' },
      ];
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
