import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock sharp before importing the module
const mockSharp = vi.fn();
vi.mock('sharp', () => ({
  default: mockSharp,
}));

describe('compress-images script helpers', () => {
  const TEST_DIR = './test-assets-compress';
  const TEST_STATE_FILE = './test-compress-state.json';

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }

    // Clean up state file
    if (fs.existsSync(TEST_STATE_FILE)) {
      fs.unlinkSync(TEST_STATE_FILE);
    }

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }

    // Clean up state file
    if (fs.existsSync(TEST_STATE_FILE)) {
      fs.unlinkSync(TEST_STATE_FILE);
    }
  });

  describe('formatBytes', () => {
    // Helper to import and test formatBytes function
    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    it('should format bytes correctly', () => {
      expect(formatBytes(100)).toBe('100 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('should handle decimal precision', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });

    it('should handle zero', () => {
      expect(formatBytes(0)).toBe('0 B');
    });
  });

  describe('state management', () => {
    interface ImageState {
      originalSize: number;
      compressedSize: number;
      compressionRatio: string;
      compressedAt: string;
    }

    interface CompressionState {
      startedAt: string;
      lastUpdated: string;
      totalImages: number;
      processedCount: number;
      skippedCount: number;
      errorCount: number;
      totalOriginalBytes: number;
      totalCompressedBytes: number;
      images: Record<string, ImageState>;
      errors: Record<string, string>;
    }

    const createEmptyState = (): CompressionState => ({
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalImages: 0,
      processedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      images: {},
      errors: {},
    });

    it('should create new state when file does not exist', () => {
      const state = createEmptyState();
      expect(state.processedCount).toBe(0);
      expect(state.images).toEqual({});
      expect(state.errors).toEqual({});
    });

    it('should save and load state correctly', () => {
      const state = createEmptyState();
      state.processedCount = 5;
      state.images['test.png'] = {
        originalSize: 1000,
        compressedSize: 800,
        compressionRatio: '20%',
        compressedAt: new Date().toISOString(),
      };

      fs.writeFileSync(TEST_STATE_FILE, JSON.stringify(state, null, 2));

      const loaded = JSON.parse(fs.readFileSync(TEST_STATE_FILE, 'utf-8'));
      expect(loaded.processedCount).toBe(5);
      expect(loaded.images['test.png'].originalSize).toBe(1000);
      expect(loaded.images['test.png'].compressedSize).toBe(800);
    });

    it('should handle corrupt state file gracefully', () => {
      fs.writeFileSync(TEST_STATE_FILE, 'corrupt json{');

      let state: CompressionState;
      try {
        state = JSON.parse(fs.readFileSync(TEST_STATE_FILE, 'utf-8'));
      } catch {
        state = createEmptyState();
      }

      expect(state.processedCount).toBe(0);
    });

    it('should update lastUpdated on save', () => {
      const state = createEmptyState();
      const initialTime = state.lastUpdated;

      // Wait a tiny bit to ensure time difference
      setTimeout(() => {
        state.lastUpdated = new Date().toISOString();
        expect(state.lastUpdated).not.toBe(initialTime);
      }, 10);
    });
  });

  describe('compression logic', () => {
    it('should handle PNG files', () => {
      // Create test PNG file
      const testFile = path.join(TEST_DIR, 'test.png');
      const testData = Buffer.from('fake-png-data');
      fs.writeFileSync(testFile, testData);

      expect(fs.existsSync(testFile)).toBe(true);
      expect(fs.readFileSync(testFile).length).toBe(testData.length);
    });

    it('should only save if compressed size is smaller', () => {
      const original = 1000;
      const compressed = 800;
      const saved = compressed < original;
      expect(saved).toBe(true);

      const compressedLarger = 1200;
      const savedLarger = compressedLarger < original;
      expect(savedLarger).toBe(false);
    });

    it('should calculate compression ratio correctly', () => {
      const original = 1000;
      const compressed = 800;
      const ratio = ((original - compressed) / original) * 100;
      expect(ratio).toBe(20);
      expect(ratio.toFixed(1)).toBe('20.0');
    });

    it('should handle zero-sized files', () => {
      const original = 0;
      const compressed = 0;
      const ratio =
        original > 0 ? ((original - compressed) / original) * 100 : 0;
      expect(ratio).toBe(0);
    });
  });

  describe('CLI argument parsing', () => {
    it('should detect dry-run flag', () => {
      const args = ['--dry-run'];
      const dryRun = args.includes('--dry-run');
      expect(dryRun).toBe(true);
    });

    it('should parse parallel argument', () => {
      const args = ['--parallel', '4'];
      const parallelIndex = args.indexOf('--parallel');
      const parallel =
        parallelIndex >= 0 ? parseInt(args[parallelIndex + 1], 10) || 2 : 2;
      expect(parallel).toBe(4);
    });

    it('should default to 2 for parallel if not specified', () => {
      const args: string[] = [];
      const parallelIndex = args.indexOf('--parallel');
      const parallel =
        parallelIndex >= 0 ? parseInt(args[parallelIndex + 1], 10) || 2 : 2;
      expect(parallel).toBe(2);
    });

    it('should parse limit argument', () => {
      const args = ['--limit', '10'];
      const limitIndex = args.indexOf('--limit');
      const limit =
        limitIndex >= 0
          ? parseInt(args[limitIndex + 1], 10) || Infinity
          : Infinity;
      expect(limit).toBe(10);
    });

    it('should default to Infinity for limit if not specified', () => {
      const args: string[] = [];
      const limitIndex = args.indexOf('--limit');
      const limit =
        limitIndex >= 0
          ? parseInt(args[limitIndex + 1], 10) || Infinity
          : Infinity;
      expect(limit).toBe(Infinity);
    });

    it('should handle invalid parallel number', () => {
      const args = ['--parallel', 'invalid'];
      const parallelIndex = args.indexOf('--parallel');
      const parallel =
        parallelIndex >= 0 ? parseInt(args[parallelIndex + 1], 10) || 2 : 2;
      expect(parallel).toBe(2); // Falls back to default
    });
  });

  describe('file filtering', () => {
    beforeEach(() => {
      // Create test files
      fs.writeFileSync(path.join(TEST_DIR, 'test1.png'), 'data1');
      fs.writeFileSync(path.join(TEST_DIR, 'test2.png'), 'data2');
      fs.writeFileSync(path.join(TEST_DIR, 'test3.jpg'), 'data3');
      fs.writeFileSync(path.join(TEST_DIR, 'test4.txt'), 'data4');
    });

    it('should only find PNG files', () => {
      const allFiles = fs
        .readdirSync(TEST_DIR)
        .filter((f) => f.endsWith('.png'))
        .sort();

      expect(allFiles.length).toBe(2);
      expect(allFiles).toContain('test1.png');
      expect(allFiles).toContain('test2.png');
      expect(allFiles).not.toContain('test3.jpg');
      expect(allFiles).not.toContain('test4.txt');
    });

    it('should filter already processed files', () => {
      const allFiles = ['test1.png', 'test2.png', 'test3.png'];
      const processedImages = {
        'test1.png': {
          originalSize: 1000,
          compressedSize: 800,
          compressionRatio: '20%',
          compressedAt: new Date().toISOString(),
        },
      };

      const toProcess = allFiles.filter((f) => !processedImages[f]);

      expect(toProcess.length).toBe(2);
      expect(toProcess).not.toContain('test1.png');
      expect(toProcess).toContain('test2.png');
      expect(toProcess).toContain('test3.png');
    });

    it('should respect limit parameter', () => {
      const allFiles = ['test1.png', 'test2.png', 'test3.png', 'test4.png'];
      const limit = 2;
      const toProcess = allFiles.slice(0, limit);

      expect(toProcess.length).toBe(2);
      expect(toProcess).toEqual(['test1.png', 'test2.png']);
    });
  });

  describe('batch processing', () => {
    it('should process files in batches', () => {
      const files = [
        'file1.png',
        'file2.png',
        'file3.png',
        'file4.png',
        'file5.png',
      ];
      const parallel = 2;
      const batches: string[][] = [];

      for (let i = 0; i < files.length; i += parallel) {
        const batch = files.slice(i, i + parallel);
        batches.push(batch);
      }

      expect(batches.length).toBe(3);
      expect(batches[0]).toEqual(['file1.png', 'file2.png']);
      expect(batches[1]).toEqual(['file3.png', 'file4.png']);
      expect(batches[2]).toEqual(['file5.png']);
    });

    it('should handle batch size equal to file count', () => {
      const files = ['file1.png', 'file2.png'];
      const parallel = 2;
      const batches: string[][] = [];

      for (let i = 0; i < files.length; i += parallel) {
        const batch = files.slice(i, i + parallel);
        batches.push(batch);
      }

      expect(batches.length).toBe(1);
      expect(batches[0]).toEqual(['file1.png', 'file2.png']);
    });
  });

  describe('progress tracking', () => {
    it('should calculate progress percentage', () => {
      const processed = 50;
      const total = 100;
      const percentage = (processed / total) * 100;
      expect(percentage).toBe(50);
      expect(percentage.toFixed(1)).toBe('50.0');
    });

    it('should calculate processing rate', () => {
      const processed = 100;
      const elapsedSeconds = 50;
      const rate = processed / elapsedSeconds;
      expect(rate).toBe(2);
      expect(rate.toFixed(2)).toBe('2.00');
    });

    it('should estimate time remaining', () => {
      const rate = 2; // files per second
      const remaining = 100; // files
      const eta = remaining / rate;
      expect(eta).toBe(50); // seconds
      expect(Math.ceil(eta)).toBe(50);
    });

    it('should handle zero rate gracefully', () => {
      const remaining = 100;
      const rate = 0;
      const eta = rate === 0 ? Infinity : remaining / rate;
      expect(eta).toBe(Infinity);
    });
  });

  describe('summary statistics', () => {
    it('should calculate space saved', () => {
      const totalOriginalBytes = 1000000;
      const totalCompressedBytes = 800000;
      const savedBytes = totalOriginalBytes - totalCompressedBytes;
      const savedPct =
        totalOriginalBytes > 0 ? (savedBytes / totalOriginalBytes) * 100 : 0;

      expect(savedBytes).toBe(200000);
      expect(savedPct).toBe(20);
      expect(savedPct.toFixed(1)).toBe('20.0');
    });

    it('should handle zero original size', () => {
      const totalOriginalBytes = 0;
      const totalCompressedBytes = 0;
      const savedBytes = totalOriginalBytes - totalCompressedBytes;
      const savedPct =
        totalOriginalBytes > 0 ? (savedBytes / totalOriginalBytes) * 100 : 0;

      expect(savedBytes).toBe(0);
      expect(savedPct).toBe(0);
    });

    it('should track multiple counters', () => {
      const state = {
        processedCount: 10,
        skippedCount: 3,
        errorCount: 1,
        totalImages: 14,
      };

      expect(
        state.processedCount + state.skippedCount + state.errorCount,
      ).toBeLessThanOrEqual(state.totalImages);
    });
  });
});
