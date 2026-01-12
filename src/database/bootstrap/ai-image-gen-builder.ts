import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds $aiImageGen MOO object for AI image generation
 *
 * Uses Midjourney API server for high-quality image generation.
 * Stores generated images in $blob for persistence.
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
          description: 'Generate images using Midjourney',
          apiUrl:
            process.env.MIDJOURNEY_API_URL || 'http://midjourney-api:3000',
          defaultModel: '7',
        },
      });
    }

    // Generate image and store in $blob
    this.aiImageGen.setMethod(
      'generate',
      `
      /**
       * Generate an image and store in $blob using Midjourney
       * @param prompt - Text description of the image to generate
       * @param options - { metadata?, filename?, aspectRatio?, stylize?, chaos?, no?, version?, style? }
       *   aspectRatio: '16:9' (landscape), '9:16' (portrait), '1:1' (square), etc.
       *   stylize: 0-1000, artistic influence (default: 100)
       *   chaos: 0-100, variation/randomness (default: 0)
       *   no: string, elements to exclude
       *   version: '5', '6', '7' etc (default: 7)
       *   style: 'raw' or 'scenic'
       *   upscaleIndex: 1-4, which image from grid to use (default: 1)
       * @returns { success, blobKey, aspectRatio, contentType, prompt, error?, uri? }
       */
      const prompt = args[0];
      const options = args[1] || {};

      if (!prompt || typeof prompt !== 'string') {
        return { success: false, error: 'Prompt is required' };
      }

      const apiUrl = self.apiUrl || process.env.MIDJOURNEY_API_URL || 'http://midjourney-api:3000';

      // Map friendly aspect ratio names to MJ format
      const aspectRatioMap = {
        'landscape': '16:9',
        'portrait': '9:16',
        'square': '1:1',
        'wide': '16:9',
        'tall': '9:16',
      };
      const rawRatio = options.aspectRatio || 'landscape';
      const aspectRatio = aspectRatioMap[rawRatio] || rawRatio;

      // Validate Midjourney-specific parameters
      if (options.stylize !== undefined) {
        if (typeof options.stylize !== 'number' || options.stylize < 0 || options.stylize > 1000) {
          return { success: false, error: 'stylize must be a number between 0 and 1000' };
        }
      }
      if (options.chaos !== undefined) {
        if (typeof options.chaos !== 'number' || options.chaos < 0 || options.chaos > 100) {
          return { success: false, error: 'chaos must be a number between 0 and 100' };
        }
      }
      if (options.weird !== undefined) {
        if (typeof options.weird !== 'number' || options.weird < 0 || options.weird > 3000) {
          return { success: false, error: 'weird must be a number between 0 and 3000' };
        }
      }
      if (options.quality !== undefined) {
        if (typeof options.quality !== 'number' || options.quality < 0.25 || options.quality > 2) {
          return { success: false, error: 'quality must be a number between 0.25 and 2' };
        }
      }

      // Build MJ options object
      const mjOptions = {};
      if (aspectRatio) mjOptions.aspectRatio = aspectRatio;
      if (options.stylize !== undefined) mjOptions.stylize = options.stylize;
      if (options.chaos !== undefined) mjOptions.chaos = options.chaos;
      if (options.no) mjOptions.no = options.no;
      // Use explicit version, or fall back to defaultModel if set
      const version = options.version || self.defaultModel;
      if (version) mjOptions.version = version;
      if (options.style) mjOptions.style = options.style;
      if (options.seed !== undefined) mjOptions.seed = options.seed;
      if (options.quality !== undefined) mjOptions.quality = options.quality;
      if (options.weird !== undefined) mjOptions.weird = options.weird;
      if (options.tile) mjOptions.tile = options.tile;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 min timeout for MJ (generation can take 2-4min + queue time)

      try {
        // Call Midjourney API /generate endpoint (full pipeline)
        const resp = await fetch(apiUrl + '/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            options: Object.keys(mjOptions).length > 0 ? mjOptions : undefined,
            upscaleIndex: options.upscaleIndex || 1,
            download: false, // We'll fetch the image ourselves
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errorBody = await resp.text();
          return { success: false, error: 'Midjourney API error ' + resp.status + ': ' + errorBody };
        }

        const data = await resp.json();

        if (!data.uri) {
          return { success: false, error: 'No image URI in response', data };
        }

        // Fetch the image from Discord CDN with timeout
        const cdnController = new AbortController();
        const cdnTimeoutId = setTimeout(() => cdnController.abort(), 60000); // 1 min timeout for CDN
        let imageResp;
        try {
          imageResp = await fetch(data.uri, { signal: cdnController.signal });
        } finally {
          clearTimeout(cdnTimeoutId);
        }
        if (!imageResp.ok) {
          return { success: false, error: 'Failed to fetch image from CDN: ' + imageResp.status };
        }

        const imageBuffer = await imageResp.arrayBuffer();
        const mimeType = imageResp.headers.get('content-type') || 'image/png';

        // Lossless PNG compression using oxipng -o4
        let compressedBase64;
        let originalSize = imageBuffer.byteLength;
        let compressedSize = originalSize;
        try {
          const fs = require('fs');
          const path = require('path');
          const { execFile } = require('child_process');
          const { promisify } = require('util');
          const execFileAsync = promisify(execFile);

          // Write to temp file, compress, read back
          const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
          const tempFile = path.join(tempDir, 'mj_compress_' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.png');

          fs.writeFileSync(tempFile, Buffer.from(imageBuffer));

          const oxipngModule = require('oxipng-bin');
          const oxipng = oxipngModule.default || oxipngModule;
          await execFileAsync(oxipng, ['-o', '4', '--strip', 'safe', tempFile]);

          const compressedBuffer = fs.readFileSync(tempFile);
          compressedBase64 = compressedBuffer.toString('base64');
          compressedSize = compressedBuffer.length;

          // Cleanup temp file
          try { fs.unlinkSync(tempFile); } catch {}
        } catch (compressErr) {
          // If compression fails, fall back to original
          console.warn('PNG compression failed, using original:', compressErr.message);
          compressedBase64 = Buffer.from(imageBuffer).toString('base64');
        }

        // Store in $blob
        const blob = $blob;
        if (!blob) {
          return { success: false, error: '$blob not available' };
        }

        const filename = (options.filename || 'mj_image_' + Date.now()) + '.png';
        const compressionRatio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize * 100).toFixed(1) : '0';
        const metadata = {
          contentType: mimeType,
          filename: filename,
          prompt: prompt,
          aspectRatio: aspectRatio,
          midjourneyId: data.id,
          midjourneyHash: data.hash,
          generatedAt: new Date().toISOString(),
          originalSize: originalSize,
          compressedSize: compressedSize,
          compressionRatio: compressionRatio + '%',
          ...(options.metadata || {}),
        };

        let blobKey;
        try {
          blobKey = await blob.write(compressedBase64, metadata);
        } catch (blobErr) {
          return {
            success: false,
            error: 'Failed to store image in blob storage: ' + (blobErr.message || String(blobErr))
          };
        }

        return {
          success: true,
          blobKey: blobKey,
          contentType: mimeType,
          prompt: prompt,
          aspectRatio: aspectRatio,
          uri: data.uri,
          width: data.width,
          height: data.height,
          originalSize: originalSize,
          compressedSize: compressedSize,
          compressionRatio: compressionRatio + '%',
        };
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          return {
            success: false,
            error: 'Midjourney generation timeout (5 minutes). Check API health with health() method and verify Discord bot status.'
          };
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
       * Generate an image and return base64 directly (not stored) using Midjourney
       * @param prompt - Text description of the image to generate
       * @param options - { aspectRatio?, stylize?, chaos?, no?, version?, style? }
       * @returns { success, data, aspectRatio, contentType, prompt, error?, uri? }
       */
      const prompt = args[0];
      const options = args[1] || {};

      if (!prompt || typeof prompt !== 'string') {
        return { success: false, error: 'Prompt is required' };
      }

      const apiUrl = self.apiUrl || process.env.MIDJOURNEY_API_URL || 'http://midjourney-api:3000';

      // Map friendly aspect ratio names to MJ format
      const aspectRatioMap = {
        'landscape': '16:9',
        'portrait': '9:16',
        'square': '1:1',
        'wide': '16:9',
        'tall': '9:16',
      };
      const rawRatio = options.aspectRatio || 'landscape';
      const aspectRatio = aspectRatioMap[rawRatio] || rawRatio;

      // Validate Midjourney-specific parameters
      if (options.stylize !== undefined) {
        if (typeof options.stylize !== 'number' || options.stylize < 0 || options.stylize > 1000) {
          return { success: false, error: 'stylize must be a number between 0 and 1000' };
        }
      }
      if (options.chaos !== undefined) {
        if (typeof options.chaos !== 'number' || options.chaos < 0 || options.chaos > 100) {
          return { success: false, error: 'chaos must be a number between 0 and 100' };
        }
      }
      if (options.weird !== undefined) {
        if (typeof options.weird !== 'number' || options.weird < 0 || options.weird > 3000) {
          return { success: false, error: 'weird must be a number between 0 and 3000' };
        }
      }
      if (options.quality !== undefined) {
        if (typeof options.quality !== 'number' || options.quality < 0.25 || options.quality > 2) {
          return { success: false, error: 'quality must be a number between 0.25 and 2' };
        }
      }

      // Build MJ options object
      const mjOptions = {};
      if (aspectRatio) mjOptions.aspectRatio = aspectRatio;
      if (options.stylize !== undefined) mjOptions.stylize = options.stylize;
      if (options.chaos !== undefined) mjOptions.chaos = options.chaos;
      if (options.no) mjOptions.no = options.no;
      // Use explicit version, or fall back to defaultModel if set
      const version = options.version || self.defaultModel;
      if (version) mjOptions.version = version;
      if (options.style) mjOptions.style = options.style;
      if (options.seed !== undefined) mjOptions.seed = options.seed;
      if (options.quality !== undefined) mjOptions.quality = options.quality;
      if (options.weird !== undefined) mjOptions.weird = options.weird;
      if (options.tile) mjOptions.tile = options.tile;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout

      try {
        // Call Midjourney API /generate endpoint
        const resp = await fetch(apiUrl + '/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            options: Object.keys(mjOptions).length > 0 ? mjOptions : undefined,
            upscaleIndex: options.upscaleIndex || 1,
            download: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errorBody = await resp.text();
          return { success: false, error: 'Midjourney API error ' + resp.status + ': ' + errorBody };
        }

        const data = await resp.json();

        if (!data.uri) {
          return { success: false, error: 'No image URI in response', data };
        }

        // Fetch the image from Discord CDN with timeout
        const cdnController = new AbortController();
        const cdnTimeoutId = setTimeout(() => cdnController.abort(), 60000); // 1 min timeout for CDN
        let imageResp;
        try {
          imageResp = await fetch(data.uri, { signal: cdnController.signal });
        } finally {
          clearTimeout(cdnTimeoutId);
        }
        if (!imageResp.ok) {
          return { success: false, error: 'Failed to fetch image from CDN: ' + imageResp.status };
        }

        const imageBuffer = await imageResp.arrayBuffer();
        const mimeType = imageResp.headers.get('content-type') || 'image/png';

        // Lossless PNG compression using oxipng -o4
        let compressedBase64;
        let originalSize = imageBuffer.byteLength;
        let compressedSize = originalSize;
        try {
          const fs = require('fs');
          const path = require('path');
          const { execFile } = require('child_process');
          const { promisify } = require('util');
          const execFileAsync = promisify(execFile);

          // Write to temp file, compress, read back
          const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
          const tempFile = path.join(tempDir, 'mj_compress_' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.png');

          fs.writeFileSync(tempFile, Buffer.from(imageBuffer));

          const oxipngModule = require('oxipng-bin');
          const oxipng = oxipngModule.default || oxipngModule;
          await execFileAsync(oxipng, ['-o', '4', '--strip', 'safe', tempFile]);

          const compressedBuffer = fs.readFileSync(tempFile);
          compressedBase64 = compressedBuffer.toString('base64');
          compressedSize = compressedBuffer.length;

          // Cleanup temp file
          try { fs.unlinkSync(tempFile); } catch {}
        } catch (compressErr) {
          // If compression fails, fall back to original
          console.warn('PNG compression failed, using original:', compressErr.message);
          compressedBase64 = Buffer.from(imageBuffer).toString('base64');
        }

        const compressionRatio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize * 100).toFixed(1) : '0';

        return {
          success: true,
          data: compressedBase64,
          contentType: mimeType,
          prompt: prompt,
          aspectRatio: aspectRatio,
          uri: data.uri,
          width: data.width,
          height: data.height,
          originalSize: originalSize,
          compressedSize: compressedSize,
          compressionRatio: compressionRatio + '%',
        };
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          return {
            success: false,
            error: 'Midjourney generation timeout (5 minutes). Check API health with health() method and verify Discord bot status.'
          };
        }
        return { success: false, error: err.message || String(err) };
      }
    `,
    );

    // List available options (MJ has many more than the old provider)
    this.aiImageGen.setMethod(
      'listModels',
      `
      /**
       * List available Midjourney versions/options
       * @returns Array of version info
       */
      return [
        { id: '7', name: 'Midjourney v7 (latest)', tier: 'quality', default: true },
        { id: '6.1', name: 'Midjourney v6.1', tier: 'quality' },
        { id: '6', name: 'Midjourney v6', tier: 'quality' },
        { id: '5.2', name: 'Midjourney v5.2', tier: 'quality' },
        { id: 'niji6', name: 'Niji 6 (anime)', tier: 'specialty' },
        { id: 'niji5', name: 'Niji 5 (anime)', tier: 'specialty' },
      ];
    `,
    );

    // Set default model/version
    this.aiImageGen.setMethod(
      'setDefaultModel',
      `
      /**
       * Set the default Midjourney version
       * @param version - Version ID (e.g., '7', '6.1', '6')
       */
      const version = args[0];
      if (!version || typeof version !== 'string') {
        return { success: false, error: 'Version ID is required' };
      }
      self.defaultModel = version;
      return { success: true, model: version };
    `,
    );

    // Health check for the Midjourney API
    this.aiImageGen.setMethod(
      'health',
      `
      /**
       * Check if the Midjourney API is available
       * @returns { success, connected, error? }
       */
      const apiUrl = self.apiUrl || process.env.MIDJOURNEY_API_URL || 'http://midjourney-api:3000';

      try {
        const resp = await fetch(apiUrl + '/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (!resp.ok) {
          return { success: false, connected: false, error: 'API returned ' + resp.status };
        }

        const data = await resp.json();
        return {
          success: true,
          connected: data.connected || false,
          status: data.status,
        };
      } catch (err) {
        return { success: false, connected: false, error: err.message || String(err) };
      }
    `,
    );

    // Get available prompt options documentation
    this.aiImageGen.setMethod(
      'getOptions',
      `
      /**
       * Get documentation for available Midjourney prompt options
       * @returns Object describing all available options
       */
      const apiUrl = self.apiUrl || process.env.MIDJOURNEY_API_URL || 'http://midjourney-api:3000';

      try {
        const resp = await fetch(apiUrl + '/options', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (!resp.ok) {
          return { success: false, error: 'API returned ' + resp.status };
        }

        return await resp.json();
      } catch (err) {
        return { success: false, error: err.message || String(err) };
      }
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
