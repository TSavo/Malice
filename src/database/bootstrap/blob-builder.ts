import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds $blob MOO object for binary storage
 *
 * Pure MOO object - uses MongoDB GridFS via dynamic import.
 * Binary data stored on disk, only 24-char keys in object properties.
 *
 * Usage from MOO code:
 *   const key = await $blob.write(base64Data, { contentType: 'image/png' });
 *   const data = await $blob.read(key);
 *   const buffer = await $blob.readBuffer(key);
 *   await $blob.delete(key);
 */
export class BlobBuilder implements Builder {
  static provides = ['blob'];
  static depends: string[] = [];

  private blob: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.blob) {
      this.blob = await this.manager.load(aliases.blob);
      if (this.blob) return;
    }

    if (!this.blob) {
      const root = await this.manager.load('root');
      this.blob = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Blob Storage',
          description: 'Binary storage using MongoDB GridFS',
          bucketName: 'blobs',
        },
      });
    }

    // Write binary data to GridFS
    // Returns 24-character ObjectId string (the blob key)
    this.blob.setMethod(
      'write',
      `
      const data = args[0];
      const metadata = args[1] || {};

      const { GridFSBucket, ObjectId } = await import('mongodb');
      const { Readable } = await import('stream');

      const db = $db.getDatabase();
      const bucket = new GridFSBucket(db, {
        bucketName: self.bucketName || 'blobs',
        chunkSizeBytes: 255 * 1024,
      });

      const buffer = typeof data === 'string'
        ? Buffer.from(data, 'base64')
        : data;

      const stream = Readable.from(buffer);
      const filename = metadata.filename || 'blob_' + Date.now();

      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          contentType: metadata.contentType || 'application/octet-stream',
          ...metadata,
        },
      });

      return new Promise((resolve, reject) => {
        stream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', () => {
            resolve(uploadStream.id.toHexString());
          });
      });
    `,
    );

    // Read binary data from GridFS (returns base64)
    this.blob.setMethod(
      'read',
      `
      const key = args[0];

      const { GridFSBucket, ObjectId } = await import('mongodb');

      const db = $db.getDatabase();
      const bucket = new GridFSBucket(db, {
        bucketName: self.bucketName || 'blobs',
      });

      const objectId = new ObjectId(key);
      const downloadStream = bucket.openDownloadStream(objectId);

      const chunks = [];
      return new Promise((resolve, reject) => {
        downloadStream
          .on('data', (chunk) => chunks.push(chunk))
          .on('error', reject)
          .on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer.toString('base64'));
          });
      });
    `,
    );

    // Read binary data as raw Buffer (for HTTP serving)
    this.blob.setMethod(
      'readBuffer',
      `
      const key = args[0];

      const { GridFSBucket, ObjectId } = await import('mongodb');

      const db = $db.getDatabase();
      const bucket = new GridFSBucket(db, {
        bucketName: self.bucketName || 'blobs',
      });

      const objectId = new ObjectId(key);
      const downloadStream = bucket.openDownloadStream(objectId);

      const chunks = [];
      return new Promise((resolve, reject) => {
        downloadStream
          .on('data', (chunk) => chunks.push(chunk))
          .on('error', reject)
          .on('end', () => resolve(Buffer.concat(chunks)));
      });
    `,
    );

    // Delete a blob from GridFS
    this.blob.setMethod(
      'delete',
      `
      const key = args[0];

      try {
        const { GridFSBucket, ObjectId } = await import('mongodb');

        const db = $db.getDatabase();
        const bucket = new GridFSBucket(db, {
          bucketName: self.bucketName || 'blobs',
        });

        const objectId = new ObjectId(key);
        await bucket.delete(objectId);
        return true;
      } catch (err) {
        return false;
      }
    `,
    );

    // Check if a blob exists
    this.blob.setMethod(
      'exists',
      `
      const key = args[0];

      try {
        const { GridFSBucket, ObjectId } = await import('mongodb');

        const db = $db.getDatabase();
        const bucket = new GridFSBucket(db, {
          bucketName: self.bucketName || 'blobs',
        });

        const objectId = new ObjectId(key);
        const cursor = bucket.find({ _id: objectId });
        const file = await cursor.next();
        return file !== null;
      } catch (err) {
        return false;
      }
    `,
    );

    // Get blob metadata
    this.blob.setMethod(
      'meta',
      `
      const key = args[0];

      try {
        const { GridFSBucket, ObjectId } = await import('mongodb');

        const db = $db.getDatabase();
        const bucket = new GridFSBucket(db, {
          bucketName: self.bucketName || 'blobs',
        });

        const objectId = new ObjectId(key);
        const cursor = bucket.find({ _id: objectId });
        const file = await cursor.next();

        if (!file) return null;

        return {
          key,
          filename: file.filename,
          contentType: file.metadata?.contentType,
          length: file.length,
          uploadDate: file.uploadDate,
          metadata: file.metadata,
        };
      } catch (err) {
        return null;
      }
    `,
    );

    // Generate URL for accessing the blob
    this.blob.setMethod(
      'url',
      `
      const key = args[0];
      const domain = args[1];

      const host = domain || 'localhost:8000';
      const protocol = domain ? 'https' : 'http';
      return protocol + '://' + host + '/blob/' + key;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.blob) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'blob', this.blob.id);
    console.log(`✅ Registered $blob alias -> #${this.blob.id}`);
  }
}

// Self-register
registerBuilder(BlobBuilder);
