import { type Platform } from '../schema';

// Platform detection patterns using regex for more accurate matching
const PLATFORM_PATTERNS = {
  youtube: [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i,
    /^https?:\/\/(m\.)?(youtube\.com)\//i,
    /^https?:\/\/youtu\.be\//i
  ],
  instagram: [
    /^https?:\/\/(www\.)?(instagram\.com)\//i,
    /^https?:\/\/(m\.)?(instagram\.com)\//i
  ],
  twitter: [
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i,
    /^https?:\/\/(mobile\.)?(twitter\.com|x\.com)\//i
  ],
  doodstream: [
    /^https?:\/\/(www\.)?(doodstream\.com)\//i
  ]
} as const;

export async function detectPlatformFromUrl(url: string): Promise<Platform> {
  try {
    // Basic validation - check if string is not empty
    if (!url || url.trim() === '') {
      return 'other';
    }
    
    // Validate that it's a proper URL first
    new URL(url);
    
    // Check each platform pattern
    for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(url)) {
          return platform as Platform;
        }
      }
    }
    
    return 'other';
  } catch (error) {
    // If URL parsing fails, still return 'other' rather than throwing
    return 'other';
  }
}

export async function validateUrl(url: string): Promise<{
  isValid: boolean;
  platform: Platform;
  error?: string;
}> {
  try {
    // First check if it's a valid URL format
    const parsedUrl = new URL(url);
    
    // Check for supported protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        isValid: false,
        platform: 'other',
        error: 'Only HTTP and HTTPS protocols are supported'
      };
    }
    
    // Detect the platform
    const platform = await detectPlatformFromUrl(url);
    
    // Additional validation for specific platforms
    const validationError = await validatePlatformSpecificUrl(url, platform);
    if (validationError) {
      return {
        isValid: false,
        platform,
        error: validationError
      };
    }
    
    return {
      isValid: true,
      platform
    };
  } catch (error) {
    return {
      isValid: false,
      platform: 'other',
      error: error instanceof Error ? error.message : 'Invalid URL format'
    };
  }
}

async function validatePlatformSpecificUrl(url: string, platform: Platform): Promise<string | null> {
  switch (platform) {
    case 'youtube':
      return validateYouTubeUrl(url);
    case 'instagram':
      return validateInstagramUrl(url);
    case 'twitter':
      return validateTwitterUrl(url);
    case 'doodstream':
      return validateDoodstreamUrl(url);
    default:
      return null;
  }
}

function validateYouTubeUrl(url: string): string | null {
  // Check for video ID patterns
  const videoIdPatterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,  // youtube.com/watch?v=...
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,  // youtu.be/...
    /embed\/([a-zA-Z0-9_-]{11})/,  // youtube.com/embed/...
  ];
  
  const hasValidVideoId = videoIdPatterns.some(pattern => pattern.test(url));
  if (!hasValidVideoId) {
    return 'Invalid YouTube video URL - no valid video ID found';
  }
  
  return null;
}

function validateInstagramUrl(url: string): string | null {
  // Check for valid Instagram URL patterns
  const validPatterns = [
    /\/p\/[a-zA-Z0-9_-]+/,  // Posts
    /\/reel\/[a-zA-Z0-9_-]+/,  // Reels
    /\/tv\/[a-zA-Z0-9_-]+/,  // IGTV
  ];
  
  const hasValidPattern = validPatterns.some(pattern => pattern.test(url));
  if (!hasValidPattern) {
    return 'Invalid Instagram URL - must be a post, reel, or IGTV link';
  }
  
  return null;
}

function validateTwitterUrl(url: string): string | null {
  // Check for valid Twitter URL patterns
  const validPatterns = [
    /\/status\/\d+/,  // Tweet status
    /\/[a-zA-Z0-9_]+\/status\/\d+/,  // User tweet status
  ];
  
  const hasValidPattern = validPatterns.some(pattern => pattern.test(url));
  if (!hasValidPattern) {
    return 'Invalid Twitter URL - must be a tweet status link';
  }
  
  return null;
}

function validateDoodstreamUrl(url: string): string | null {
  // Check for valid Doodstream URL patterns
  const validPatterns = [
    /\/d\/[a-zA-Z0-9]+/,  // Direct video links
    /\/e\/[a-zA-Z0-9]+/,  // Embed links
  ];
  
  const hasValidPattern = validPatterns.some(pattern => pattern.test(url));
  if (!hasValidPattern) {
    return 'Invalid Doodstream URL - must be a valid video or embed link';
  }
  
  return null;
}