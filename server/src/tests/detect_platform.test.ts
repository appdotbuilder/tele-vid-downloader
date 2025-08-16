import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { detectPlatformFromUrl, validateUrl } from '../handlers/detect_platform';
import { type Platform } from '../schema';

describe('detectPlatformFromUrl', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should detect YouTube platform from various URL formats', async () => {
    const youtubeUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/watch?v=dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'http://youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
    ];

    for (const url of youtubeUrls) {
      const platform = await detectPlatformFromUrl(url);
      expect(platform).toEqual('youtube');
    }
  });

  it('should detect Instagram platform from various URL formats', async () => {
    const instagramUrls = [
      'https://www.instagram.com/p/ABC123/',
      'https://instagram.com/p/ABC123/',
      'https://m.instagram.com/p/ABC123/',
      'https://www.instagram.com/reel/ABC123/',
      'https://www.instagram.com/tv/ABC123/',
    ];

    for (const url of instagramUrls) {
      const platform = await detectPlatformFromUrl(url);
      expect(platform).toEqual('instagram');
    }
  });

  it('should detect Twitter platform from various URL formats', async () => {
    const twitterUrls = [
      'https://twitter.com/user/status/123456789',
      'https://www.twitter.com/user/status/123456789',
      'https://mobile.twitter.com/user/status/123456789',
      'https://x.com/user/status/123456789',
      'https://www.x.com/user/status/123456789',
    ];

    for (const url of twitterUrls) {
      const platform = await detectPlatformFromUrl(url);
      expect(platform).toEqual('twitter');
    }
  });

  it('should detect Doodstream platform from various URL formats', async () => {
    const doodstreamUrls = [
      'https://doodstream.com/d/abc123def',
      'https://www.doodstream.com/d/abc123def',
      'https://doodstream.com/e/abc123def',
    ];

    for (const url of doodstreamUrls) {
      const platform = await detectPlatformFromUrl(url);
      expect(platform).toEqual('doodstream');
    }
  });

  it('should return "other" for unknown platforms', async () => {
    const unknownUrls = [
      'https://example.com/video/123',
      'https://vimeo.com/123456789',
      'https://dailymotion.com/video/xyz',
      'https://tiktok.com/@user/video/123',
    ];

    for (const url of unknownUrls) {
      const platform = await detectPlatformFromUrl(url);
      expect(platform).toEqual('other');
    }
  });

  it('should handle invalid URLs gracefully', async () => {
    const invalidUrls = [
      'not-a-url',
      'ftp://example.com/file',
      'just some text',
      '',
      'http://',
      'https://',
    ];

    for (const url of invalidUrls) {
      const platform = await detectPlatformFromUrl(url);
      expect(platform).toEqual('other');
    }
  });

  it('should be case insensitive', async () => {
    const mixedCaseUrls = [
      'HTTPS://WWW.YOUTUBE.COM/WATCH?V=dQw4w9WgXcQ',
      'https://INSTAGRAM.com/p/ABC123/',
      'https://TWITTER.com/user/status/123456789',
    ];

    const expectedPlatforms = ['youtube', 'instagram', 'twitter'];

    for (let i = 0; i < mixedCaseUrls.length; i++) {
      const platform = await detectPlatformFromUrl(mixedCaseUrls[i]);
      expect(platform).toEqual(expectedPlatforms[i] as Platform);
    }
  });
});

describe('validateUrl', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should validate correct YouTube URLs', async () => {
    const validYouTubeUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    ];

    for (const url of validYouTubeUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.platform).toEqual('youtube');
      expect(result.error).toBeUndefined();
    }
  });

  it('should reject invalid YouTube URLs', async () => {
    const invalidYouTubeUrls = [
      'https://www.youtube.com/',
      'https://www.youtube.com/user/testuser',
      'https://www.youtube.com/watch',
      'https://youtu.be/',
    ];

    for (const url of invalidYouTubeUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.platform).toEqual('youtube');
      expect(result.error).toContain('Invalid YouTube video URL');
    }
  });

  it('should validate correct Instagram URLs', async () => {
    const validInstagramUrls = [
      'https://www.instagram.com/p/ABC123/',
      'https://www.instagram.com/reel/XYZ789/',
      'https://www.instagram.com/tv/DEF456/',
    ];

    for (const url of validInstagramUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.platform).toEqual('instagram');
      expect(result.error).toBeUndefined();
    }
  });

  it('should reject invalid Instagram URLs', async () => {
    const invalidInstagramUrls = [
      'https://www.instagram.com/',
      'https://www.instagram.com/username/',
      'https://www.instagram.com/explore/',
    ];

    for (const url of invalidInstagramUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.platform).toEqual('instagram');
      expect(result.error).toContain('Invalid Instagram URL');
    }
  });

  it('should validate correct Twitter URLs', async () => {
    const validTwitterUrls = [
      'https://twitter.com/user/status/1234567890',
      'https://x.com/username/status/9876543210',
      'https://www.twitter.com/status/5555555555',
    ];

    for (const url of validTwitterUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.platform).toEqual('twitter');
      expect(result.error).toBeUndefined();
    }
  });

  it('should reject invalid Twitter URLs', async () => {
    const invalidTwitterUrls = [
      'https://twitter.com/',
      'https://twitter.com/username',
      'https://x.com/explore',
      'https://twitter.com/user/likes',
    ];

    for (const url of invalidTwitterUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.platform).toEqual('twitter');
      expect(result.error).toContain('Invalid Twitter URL');
    }
  });

  it('should validate correct Doodstream URLs', async () => {
    const validDoodstreamUrls = [
      'https://doodstream.com/d/abc123def456',
      'https://www.doodstream.com/e/xyz789ghi012',
    ];

    for (const url of validDoodstreamUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.platform).toEqual('doodstream');
      expect(result.error).toBeUndefined();
    }
  });

  it('should reject invalid Doodstream URLs', async () => {
    const invalidDoodstreamUrls = [
      'https://doodstream.com/',
      'https://doodstream.com/home',
      'https://doodstream.com/upload',
    ];

    for (const url of invalidDoodstreamUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.platform).toEqual('doodstream');
      expect(result.error).toContain('Invalid Doodstream URL');
    }
  });

  it('should accept other platform URLs as valid', async () => {
    const otherPlatformUrls = [
      'https://vimeo.com/123456789',
      'https://example.com/video/abc',
      'https://custom-site.com/media/xyz',
    ];

    for (const url of otherPlatformUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.platform).toEqual('other');
      expect(result.error).toBeUndefined();
    }
  });

  it('should reject URLs with unsupported protocols', async () => {
    const unsupportedProtocolUrls = [
      'ftp://example.com/file.mp4',
      'file:///path/to/video.mp4',
      'data:video/mp4;base64,abc123',
    ];

    for (const url of unsupportedProtocolUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.platform).toEqual('other');
      expect(result.error).toContain('Only HTTP and HTTPS protocols are supported');
    }
  });

  it('should reject malformed URLs', async () => {
    const malformedUrls = [
      'not-a-url-at-all',
      'http://',
      'https://',
      '',
      'just some random text',
    ];

    for (const url of malformedUrls) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.platform).toEqual('other');
      expect(result.error).toBeDefined();
    }
  });

  it('should handle edge cases correctly', async () => {
    const edgeCases = [
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLTest',
        expectedValid: true,
        expectedPlatform: 'youtube' as Platform
      },
      {
        url: 'https://instagram.com/p/ABC123/?utm_source=ig_web_copy_link',
        expectedValid: true,
        expectedPlatform: 'instagram' as Platform
      },
      {
        url: 'https://twitter.com/user/status/123?ref_src=twsrc',
        expectedValid: true,
        expectedPlatform: 'twitter' as Platform
      }
    ];

    for (const testCase of edgeCases) {
      const result = await validateUrl(testCase.url);
      expect(result.isValid).toBe(testCase.expectedValid);
      expect(result.platform).toEqual(testCase.expectedPlatform);
    }
  });

  it('should validate YouTube URLs with various query parameters', async () => {
    const youtubeUrlsWithParams = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLTest123',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&index=1&t=0s',
    ];

    for (const url of youtubeUrlsWithParams) {
      const result = await validateUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.platform).toEqual('youtube');
      expect(result.error).toBeUndefined();
    }
  });

  it('should handle concurrent validation requests', async () => {
    const urls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.instagram.com/p/ABC123/',
      'https://twitter.com/user/status/123456789',
      'https://doodstream.com/d/abc123def',
      'https://example.com/unknown/video',
    ];

    const expectedPlatforms: Platform[] = ['youtube', 'instagram', 'twitter', 'doodstream', 'other'];

    // Run all validations concurrently
    const results = await Promise.all(urls.map(url => validateUrl(url)));

    for (let i = 0; i < results.length; i++) {
      expect(results[i].isValid).toBe(true);
      expect(results[i].platform).toEqual(expectedPlatforms[i]);
    }
  });
});