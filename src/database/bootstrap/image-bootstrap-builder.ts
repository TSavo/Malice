import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ImageManifestEntry {
  file: string;
  target: string; // $alias or #id
  aspectRatio: string; // '16:9', '9:16', '1:1', etc.
  _comment?: string;
}

interface ImageManifest {
  description?: string;
  images: ImageManifestEntry[];
}

/**
 * Bootstraps pre-generated images from disk into the database.
 *
 * Images are stored in assets/images/ and tracked with Git LFS.
 * The manifest.json file maps images to objects by alias or ID.
 *
 * This runs in postRegister phase so all aliases are available.
 *
 * Usage:
 *   1. Generate images offline (e.g., using $aiImageGen locally)
 *   2. Save to assets/images/{category}/filename.png
 *   3. Add entry to assets/images/manifest.json
 *   4. Run bootstrap - images are loaded into GridFS and linked to objects
 */
export class ImageBootstrapBuilder implements Builder {
  static provides = ['imageBootstrap'];
  static depends = ['blob']; // Need $blob for storage

  private assetsDir: string;
  private manifestPath: string;

  constructor(private manager: ObjectManager) {
    // Assets directory is at repo root: malice/assets/images/
    this.assetsDir = join(__dirname, '../../../assets/images');
    this.manifestPath = join(this.assetsDir, 'manifest.json');
  }

  async build(): Promise<void> {
    // Nothing to build - we just load images in postRegister
  }

  async registerAliases(): Promise<void> {
    // No aliases to register
  }

  async postRegister(): Promise<void> {
    if (!existsSync(this.manifestPath)) {
      console.log('📷 [ImageBootstrap] No manifest.json found, skipping');
      return;
    }

    const manifest: ImageManifest = JSON.parse(
      readFileSync(this.manifestPath, 'utf-8')
    );

    // Filter out comment-only entries (those starting with _)
    const entries = manifest.images.filter(
      (e) => e.file && e.target && e.aspectRatio
    );

    if (entries.length === 0) {
      console.log('📷 [ImageBootstrap] No images in manifest, skipping');
      return;
    }

    console.log(`📷 [ImageBootstrap] Processing ${entries.length} images...`);

    const blob = await this.manager.load('blob');
    if (!blob) {
      console.error('📷 [ImageBootstrap] $blob not available, skipping');
      return;
    }

    let loaded = 0;
    let skipped = 0;
    let errors = 0;

    for (const entry of entries) {
      try {
        const result = await this.processEntry(entry, blob);
        if (result === 'loaded') loaded++;
        else if (result === 'skipped') skipped++;
        else errors++;
      } catch (err) {
        console.error(
          `📷 [ImageBootstrap] Error processing ${entry.file}:`,
          err
        );
        errors++;
      }
    }

    console.log(
      `📷 [ImageBootstrap] Done: ${loaded} loaded, ${skipped} skipped, ${errors} errors`
    );
  }

  private async processEntry(
    entry: ImageManifestEntry,
    blob: RuntimeObject
  ): Promise<'loaded' | 'skipped' | 'error'> {
    const imagePath = join(this.assetsDir, entry.file);

    if (!existsSync(imagePath)) {
      console.warn(`📷 [ImageBootstrap] File not found: ${entry.file}`);
      return 'error';
    }

    // Resolve target object
    const target = await this.resolveTarget(entry.target);
    if (!target) {
      console.warn(
        `📷 [ImageBootstrap] Target not found: ${entry.target} for ${entry.file}`
      );
      return 'error';
    }

    // Check if image already exists for this aspect ratio
    const existingImages = (target.get('images') as Record<string, string>) || {};
    if (existingImages[entry.aspectRatio]) {
      // Already have an image for this aspect ratio, skip
      return 'skipped';
    }

    // Read image file and convert to base64
    const imageBuffer = readFileSync(imagePath);
    const base64Data = imageBuffer.toString('base64');

    // Determine content type from extension
    const ext = entry.file.split('.').pop()?.toLowerCase() || 'png';
    const contentTypeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };
    const contentType = contentTypeMap[ext] || 'image/png';

    // Upload to GridFS via $blob
    const blobKey = await blob.call('write', base64Data, {
      contentType,
      filename: entry.file.split('/').pop(),
      source: 'bootstrap',
      aspectRatio: entry.aspectRatio,
      target: entry.target,
    });

    // Update object's images property
    const images: Record<string, string> = {
      ...existingImages,
      [entry.aspectRatio]: blobKey as string,
    };
    target.set('images', images);

    console.log(
      `📷 [ImageBootstrap] Loaded ${entry.file} -> ${entry.target} [${entry.aspectRatio}]`
    );
    return 'loaded';
  }

  private async resolveTarget(target: string): Promise<RuntimeObject | null> {
    if (target.startsWith('$')) {
      // Alias reference
      const alias = target.slice(1);
      return await this.manager.load(alias);
    } else if (target.startsWith('#')) {
      // ID reference
      const id = parseInt(target.slice(1), 10);
      if (isNaN(id)) return null;
      return await this.manager.load(id);
    }
    return null;
  }
}

// Self-register
registerBuilder(ImageBootstrapBuilder);
