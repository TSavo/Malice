import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds $aiImageGen MOO object for AI image generation
 *
 * Uses Runware API to generate images (much cheaper than Google Gemini),
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
          description: 'Generate images using Runware API',
          defaultModel: 'runware:101@1', // Stable Diffusion XL base model
        },
      });
    }

    // Generate image and store in $blob
    this.aiImageGen.setMethod(
      'generate',
      `
      /**
       * Generate an image and store in $blob using Runware API
       * @param prompt - Text description of the image to generate
       * @param options - { model?, metadata?, filename?, aspectRatio? }
       *   aspectRatio: 'landscape' (default), 'portrait', 'square'
       * @returns { success, blobKey, aspectRatio, contentType, prompt, error? }
       */
      const prompt = args[0];
      const options = args[1] || {};

      if (!prompt || typeof prompt !== 'string') {
        return { success: false, error: 'Prompt is required' };
      }

      // Get API key from environment
      const apiKey = process.env.RUNWARE_API_KEY;
      if (!apiKey) {
        return { success: false, error: 'RUNWARE_API_KEY not set in environment' };
      }

      const model = options.model || self.defaultModel;
      const apiUrl = 'https://api.runware.ai/v1';

      // Map aspect ratio to dimensions
      const rawRatio = options.aspectRatio || 'landscape';
      const dimensionMap = {
        'landscape': { width: 1024, height: 576 },   // 16:9
        'wide': { width: 1024, height: 576 },        // 16:9
        'portrait': { width: 576, height: 1024 },    // 9:16
        'tall': { width: 576, height: 1024 },        // 9:16
        'square': { width: 1024, height: 1024 },     // 1:1
        '16:9': { width: 1024, height: 576 },
        '9:16': { width: 576, height: 1024 },
        '1:1': { width: 1024, height: 1024 },
      };
      const dims = dimensionMap[rawRatio] || dimensionMap['landscape'];
      const aspectRatio = rawRatio;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      try {
        // Generate unique task ID
        const taskUUID = crypto.randomUUID();

        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey,
          },
          body: JSON.stringify([
            {
              taskType: 'imageInference',
              taskUUID: taskUUID,
              positivePrompt: prompt,
              negativePrompt: options.negativePrompt || 'blurry, low quality, distorted',
              model: model,
              width: dims.width,
              height: dims.height,
              steps: options.steps || 30,
              CFGScale: options.cfgScale || 7.5,
              numberResults: 1,
              outputType: 'base64Data',
              outputFormat: 'PNG',
            },
          ]),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errorBody = await resp.text();
          return { success: false, error: 'API error ' + resp.status + ': ' + errorBody };
        }

        const data = await resp.json();

        // Runware returns an array of task results
        const result = data.data?.[0] || data[0];
        if (!result) {
          return { success: false, error: 'No result in response', data };
        }

        if (result.error) {
          return { success: false, error: result.error };
        }

        const imageData = result.imageBase64Data || result.base64Data;
        if (!imageData) {
          return { success: false, error: 'No image data in response', result };
        }

        const mimeType = 'image/png';

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
       * Generate an image and return base64 directly (not stored) using Runware API
       * @param prompt - Text description of the image to generate
       * @param options - { model?, aspectRatio? }
       * @returns { success, data, aspectRatio, contentType, prompt, error? }
       */
      const prompt = args[0];
      const options = args[1] || {};

      if (!prompt || typeof prompt !== 'string') {
        return { success: false, error: 'Prompt is required' };
      }

      const apiKey = process.env.RUNWARE_API_KEY;
      if (!apiKey) {
        return { success: false, error: 'RUNWARE_API_KEY not set in environment' };
      }

      const model = options.model || self.defaultModel;
      const apiUrl = 'https://api.runware.ai/v1';

      // Map aspect ratio to dimensions
      const rawRatio = options.aspectRatio || 'landscape';
      const dimensionMap = {
        'landscape': { width: 1024, height: 576 },   // 16:9
        'wide': { width: 1024, height: 576 },        // 16:9
        'portrait': { width: 576, height: 1024 },    // 9:16
        'tall': { width: 576, height: 1024 },        // 9:16
        'square': { width: 1024, height: 1024 },     // 1:1
        '16:9': { width: 1024, height: 576 },
        '9:16': { width: 576, height: 1024 },
        '1:1': { width: 1024, height: 1024 },
      };
      const dims = dimensionMap[rawRatio] || dimensionMap['landscape'];
      const aspectRatio = rawRatio;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const taskUUID = crypto.randomUUID();

        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey,
          },
          body: JSON.stringify([
            {
              taskType: 'imageInference',
              taskUUID: taskUUID,
              positivePrompt: prompt,
              negativePrompt: options.negativePrompt || 'blurry, low quality, distorted',
              model: model,
              width: dims.width,
              height: dims.height,
              steps: options.steps || 30,
              CFGScale: options.cfgScale || 7.5,
              numberResults: 1,
              outputType: 'base64Data',
              outputFormat: 'PNG',
            },
          ]),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errorBody = await resp.text();
          return { success: false, error: 'API error ' + resp.status + ': ' + errorBody };
        }

        const data = await resp.json();

        const result = data.data?.[0] || data[0];
        if (!result) {
          return { success: false, error: 'No result in response', data };
        }

        if (result.error) {
          return { success: false, error: result.error };
        }

        const imageData = result.imageBase64Data || result.base64Data;
        if (!imageData) {
          return { success: false, error: 'No image data in response', result };
        }

        return {
          success: true,
          data: imageData,
          contentType: 'image/png',
          prompt: prompt,
          aspectRatio: aspectRatio,
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
       * List available Runware image generation models
       * @returns Array of model info
       */
      return [
        { id: 'runware:101@1', name: 'Stable Diffusion XL Base', tier: 'budget', pricePerImage: 0.015 },
        { id: 'civitai:102438@133677', name: 'SDXL Turbo (Civitai)', tier: 'budget', pricePerImage: 0.008 },
        { id: 'runware:100@1', name: 'Stable Diffusion 1.5', tier: 'cheapest', pricePerImage: 0.005 },
        { id: 'civitai:139562@297320', name: 'Realistic Vision (Civitai)', tier: 'quality', pricePerImage: 0.02 },
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
