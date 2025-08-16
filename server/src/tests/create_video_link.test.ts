import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoLinksTable, usersTable } from '../db/schema';
import { type CreateVideoLinkInput, type CreateUserInput } from '../schema';
import { createVideoLink } from '../handlers/create_video_link';
import { eq } from 'drizzle-orm';

// Test user for foreign key relationships
const testUser: CreateUserInput = {
  telegram_id: '123456789',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  avatar_url: 'https://example.com/avatar.jpg',
  is_admin: false
};

// Test inputs for different scenarios
const youtubeVideoInput: CreateVideoLinkInput = {
  user_id: 1,
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  // platform will be auto-detected
};

const instagramVideoInput: CreateVideoLinkInput = {
  user_id: 1,
  url: 'https://www.instagram.com/p/ABC123/',
  platform: 'instagram' // explicitly provided
};

const twitterVideoInput: CreateVideoLinkInput = {
  user_id: 1,
  url: 'https://twitter.com/user/status/123456789'
};

const doodstreamVideoInput: CreateVideoLinkInput = {
  user_id: 1,
  url: 'https://doodstream.com/d/abc123def'
};

const unknownVideoInput: CreateVideoLinkInput = {
  user_id: 1,
  url: 'https://example.com/video.mp4'
};

describe('createVideoLink', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create a test user for foreign key relationships
    await db.insert(usersTable)
      .values({
        telegram_id: testUser.telegram_id,
        username: testUser.username,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        avatar_url: testUser.avatar_url,
        is_admin: testUser.is_admin
      })
      .execute();
  });

  it('should create a video link with auto-detected YouTube platform', async () => {
    const result = await createVideoLink(youtubeVideoInput);

    // Basic field validation
    expect(result.user_id).toEqual(1);
    expect(result.url).toEqual(youtubeVideoInput.url);
    expect(result.platform).toEqual('youtube'); // Auto-detected
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Nullable fields should be null initially
    expect(result.title).toBeNull();
    expect(result.thumbnail_url).toBeNull();
    expect(result.file_size).toBeNull();
    expect(result.duration).toBeNull();
    expect(result.error_message).toBeNull();
    expect(result.telegram_bot_id).toBeNull();
    expect(result.telegram_file_id).toBeNull();
    expect(result.telegram_message_link).toBeNull();
    expect(result.downloaded_at).toBeNull();
    expect(result.uploaded_at).toBeNull();
  });

  it('should create a video link with explicitly provided platform', async () => {
    const result = await createVideoLink(instagramVideoInput);

    expect(result.user_id).toEqual(1);
    expect(result.url).toEqual(instagramVideoInput.url);
    expect(result.platform).toEqual('instagram'); // Explicitly provided
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save video link to database', async () => {
    const result = await createVideoLink(youtubeVideoInput);

    // Query the database to verify the record was saved
    const videoLinks = await db.select()
      .from(videoLinksTable)
      .where(eq(videoLinksTable.id, result.id))
      .execute();

    expect(videoLinks).toHaveLength(1);
    expect(videoLinks[0].user_id).toEqual(1);
    expect(videoLinks[0].url).toEqual(youtubeVideoInput.url);
    expect(videoLinks[0].platform).toEqual('youtube');
    expect(videoLinks[0].status).toEqual('pending');
    expect(videoLinks[0].created_at).toBeInstanceOf(Date);
  });

  it('should auto-detect platform for Twitter URLs', async () => {
    const result = await createVideoLink(twitterVideoInput);

    expect(result.platform).toEqual('twitter');
    expect(result.url).toEqual(twitterVideoInput.url);
    expect(result.status).toEqual('pending');
  });

  it('should auto-detect platform for Doodstream URLs', async () => {
    const result = await createVideoLink(doodstreamVideoInput);

    expect(result.platform).toEqual('doodstream');
    expect(result.url).toEqual(doodstreamVideoInput.url);
    expect(result.status).toEqual('pending');
  });

  it('should default to "other" platform for unknown URLs', async () => {
    const result = await createVideoLink(unknownVideoInput);

    expect(result.platform).toEqual('other');
    expect(result.url).toEqual(unknownVideoInput.url);
    expect(result.status).toEqual('pending');
  });

  it('should handle YouTube short URLs (youtu.be)', async () => {
    const shortUrlInput: CreateVideoLinkInput = {
      user_id: 1,
      url: 'https://youtu.be/dQw4w9WgXcQ'
    };

    const result = await createVideoLink(shortUrlInput);

    expect(result.platform).toEqual('youtube');
    expect(result.url).toEqual(shortUrlInput.url);
  });

  it('should handle Twitter/X domain variations', async () => {
    const xUrlInput: CreateVideoLinkInput = {
      user_id: 1,
      url: 'https://x.com/user/status/123456789'
    };

    const result = await createVideoLink(xUrlInput);

    expect(result.platform).toEqual('twitter');
    expect(result.url).toEqual(xUrlInput.url);
  });

  it('should throw error when user does not exist', async () => {
    const invalidUserInput: CreateVideoLinkInput = {
      user_id: 999, // Non-existent user
      url: 'https://www.youtube.com/watch?v=test'
    };

    await expect(createVideoLink(invalidUserInput))
      .rejects
      .toThrow(/User with ID 999 not found/i);
  });

  it('should handle case-insensitive URL matching', async () => {
    const upperCaseInput: CreateVideoLinkInput = {
      user_id: 1,
      url: 'https://WWW.YOUTUBE.COM/watch?v=test'
    };

    const result = await createVideoLink(upperCaseInput);

    expect(result.platform).toEqual('youtube');
    expect(result.url).toEqual(upperCaseInput.url); // Original casing preserved
  });
});