import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoLinksTable, usersTable, telegramBotsTable } from '../db/schema';
import { type UpdateVideoLinkInput } from '../schema';
import { updateVideoLink } from '../handlers/update_video_link';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
  telegram_id: '123456789',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  avatar_url: null,
  is_admin: false
};

const testBot = {
  name: 'Test Bot',
  token: 'test-token-123',
  username: 'testbot',
  is_default: true,
  is_active: true
};

const testVideoLink = {
  url: 'https://youtube.com/watch?v=test123',
  platform: 'youtube' as const,
  status: 'pending' as const,
  title: 'Original Title',
  thumbnail_url: null,
  file_size: null,
  duration: null,
  error_message: null,
  telegram_bot_id: null,
  telegram_file_id: null,
  telegram_message_link: null,
  downloaded_at: null,
  uploaded_at: null
};

describe('updateVideoLink', () => {
  let testUserId: number;
  let testBotId: number;
  let testVideoLinkId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test bot
    const botResult = await db.insert(telegramBotsTable)
      .values(testBot)
      .returning()
      .execute();
    testBotId = botResult[0].id;

    // Create test video link
    const videoLinkResult = await db.insert(videoLinksTable)
      .values({
        ...testVideoLink,
        user_id: testUserId
      })
      .returning()
      .execute();
    testVideoLinkId = videoLinkResult[0].id;
  });

  afterEach(resetDB);

  it('should update video link status', async () => {
    const input: UpdateVideoLinkInput = {
      id: testVideoLinkId,
      status: 'processing'
    };

    const result = await updateVideoLink(input);

    expect(result.id).toEqual(testVideoLinkId);
    expect(result.status).toEqual('processing');
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields simultaneously', async () => {
    const input: UpdateVideoLinkInput = {
      id: testVideoLinkId,
      status: 'downloaded',
      title: 'Updated Video Title',
      thumbnail_url: 'https://example.com/thumb.jpg',
      file_size: 1024000,
      duration: 300,
      downloaded_at: new Date('2024-01-01T10:00:00Z')
    };

    const result = await updateVideoLink(input);

    expect(result.status).toEqual('downloaded');
    expect(result.title).toEqual('Updated Video Title');
    expect(result.thumbnail_url).toEqual('https://example.com/thumb.jpg');
    expect(result.file_size).toEqual(1024000);
    expect(result.duration).toEqual(300);
    expect(result.downloaded_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update telegram-related fields', async () => {
    const input: UpdateVideoLinkInput = {
      id: testVideoLinkId,
      status: 'uploaded',
      telegram_bot_id: testBotId,
      telegram_file_id: 'BAACAgIAAxkBAAIC',
      telegram_message_link: 'https://t.me/testchannel/123',
      uploaded_at: new Date('2024-01-01T12:00:00Z')
    };

    const result = await updateVideoLink(input);

    expect(result.status).toEqual('uploaded');
    expect(result.telegram_bot_id).toEqual(testBotId);
    expect(result.telegram_file_id).toEqual('BAACAgIAAxkBAAIC');
    expect(result.telegram_message_link).toEqual('https://t.me/testchannel/123');
    expect(result.uploaded_at).toBeInstanceOf(Date);
  });

  it('should update error message for failed status', async () => {
    const input: UpdateVideoLinkInput = {
      id: testVideoLinkId,
      status: 'failed',
      error_message: 'Video download failed: Network timeout'
    };

    const result = await updateVideoLink(input);

    expect(result.status).toEqual('failed');
    expect(result.error_message).toEqual('Video download failed: Network timeout');
  });

  it('should set fields to null when explicitly provided', async () => {
    // First set some values
    await updateVideoLink({
      id: testVideoLinkId,
      title: 'Some Title',
      error_message: 'Some Error'
    });

    // Then set them to null
    const input: UpdateVideoLinkInput = {
      id: testVideoLinkId,
      title: null,
      error_message: null
    };

    const result = await updateVideoLink(input);

    expect(result.title).toBeNull();
    expect(result.error_message).toBeNull();
  });

  it('should not update fields that are not provided', async () => {
    const input: UpdateVideoLinkInput = {
      id: testVideoLinkId,
      status: 'processing'
    };

    const result = await updateVideoLink(input);

    // These fields should remain unchanged
    expect(result.title).toEqual('Original Title');
    expect(result.url).toEqual(testVideoLink.url);
    expect(result.platform).toEqual(testVideoLink.platform);
    expect(result.user_id).toEqual(testUserId);
  });

  it('should save changes to database', async () => {
    const input: UpdateVideoLinkInput = {
      id: testVideoLinkId,
      status: 'downloaded',
      title: 'Database Test Title',
      file_size: 2048000
    };

    await updateVideoLink(input);

    // Verify changes were saved to database
    const savedLink = await db.select()
      .from(videoLinksTable)
      .where(eq(videoLinksTable.id, testVideoLinkId))
      .execute();

    expect(savedLink).toHaveLength(1);
    expect(savedLink[0].status).toEqual('downloaded');
    expect(savedLink[0].title).toEqual('Database Test Title');
    expect(savedLink[0].file_size).toEqual(2048000);
    expect(savedLink[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent video link', async () => {
    const input: UpdateVideoLinkInput = {
      id: 99999, // Non-existent ID
      status: 'processing'
    };

    expect(updateVideoLink(input)).rejects.toThrow(/Video link with id 99999 not found/i);
  });

  it('should handle status transition workflow', async () => {
    // Test complete workflow: pending -> processing -> downloaded -> uploaded
    
    // Step 1: Start processing
    await updateVideoLink({
      id: testVideoLinkId,
      status: 'processing'
    });

    let result = await db.select()
      .from(videoLinksTable)
      .where(eq(videoLinksTable.id, testVideoLinkId))
      .execute();
    
    expect(result[0].status).toEqual('processing');

    // Step 2: Mark as downloaded with metadata
    await updateVideoLink({
      id: testVideoLinkId,
      status: 'downloaded',
      title: 'Downloaded Video',
      file_size: 5000000,
      duration: 600,
      downloaded_at: new Date()
    });

    result = await db.select()
      .from(videoLinksTable)
      .where(eq(videoLinksTable.id, testVideoLinkId))
      .execute();

    expect(result[0].status).toEqual('downloaded');
    expect(result[0].title).toEqual('Downloaded Video');
    expect(result[0].file_size).toEqual(5000000);
    expect(result[0].downloaded_at).toBeInstanceOf(Date);

    // Step 3: Mark as uploaded with telegram info
    await updateVideoLink({
      id: testVideoLinkId,
      status: 'uploaded',
      telegram_bot_id: testBotId,
      telegram_file_id: 'uploaded_file_id',
      uploaded_at: new Date()
    });

    result = await db.select()
      .from(videoLinksTable)
      .where(eq(videoLinksTable.id, testVideoLinkId))
      .execute();

    expect(result[0].status).toEqual('uploaded');
    expect(result[0].telegram_bot_id).toEqual(testBotId);
    expect(result[0].telegram_file_id).toEqual('uploaded_file_id');
    expect(result[0].uploaded_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraint for telegram_bot_id', async () => {
    const nonExistentBotId = 99999;
    
    const input: UpdateVideoLinkInput = {
      id: testVideoLinkId,
      telegram_bot_id: nonExistentBotId
    };

    expect(updateVideoLink(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});