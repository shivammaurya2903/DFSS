import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  getFileDisplayName,
  getFileTypeCategory,
  getOriginalSize,
  getStoredSize,
} from './formatters';

describe('formatBytes', () => {
  it('formats zero and negative values safely', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(null)).toBe('0 Bytes');
  });

  it('formats byte, kilobyte and megabyte values', () => {
    expect(formatBytes(512)).toBe('512 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
  });
});

describe('getFileDisplayName', () => {
  it('prefers originalName and falls back through aliases', () => {
    expect(getFileDisplayName({ originalName: 'original.txt', filename: 'stored' })).toBe('original.txt');
    expect(getFileDisplayName({ filename: 'stored.txt' })).toBe('stored.txt');
    expect(getFileDisplayName(null)).toBe('Unknown File');
  });
});

describe('file size helpers', () => {
  it('distinguishes original and stored sizes with legacy fallback', () => {
    const file = { originalSize: 100, storedSize: 40, size: 40 };
    expect(getOriginalSize(file)).toBe(100);
    expect(getStoredSize(file)).toBe(40);
    expect(getOriginalSize({ size: 12 })).toBe(12);
    expect(getStoredSize({ size: 12 })).toBe(12);
    expect(getOriginalSize(null)).toBe(0);
  });
});

describe('getFileTypeCategory', () => {
  it('categorizes common MIME types', () => {
    expect(getFileTypeCategory('image/png')).toBe('image');
    expect(getFileTypeCategory('audio/mpeg')).toBe('audio');
    expect(getFileTypeCategory('application/pdf')).toBe('pdf');
    expect(getFileTypeCategory('application/zip')).toBe('archive');
    expect(getFileTypeCategory(null)).toBe('other');
  });
});
