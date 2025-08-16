import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, telegramBotsTable, videoLinksTable } from '../db/schema';
import { type VideoLinkFilters } from '../schema';
import { getVideoLinks } from '../handlers/get_video_links';

// Test data
const testUser1 = {
  telegram_id: 'user123',
  username: 'testuser1',
  first_name: 'Test',
  last_name: 'User1',
  avatar_url: null,
  is_admin: false
};

const testUser2 = {
  telegram_id: 'user456',
  username: 'testuser2',
  first_name: 'Test',
  last_name: 'User2',
  avatar_url: null,
  is_admin: false
};

const testBot = {
  name: 'Test Bot',
  token: 'test_token_123',
  username: 'testbot',
  is_default: true,
  is_active: true
};

describe('getVideoLinks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty results when no video links exist', async () => {
    const filters: VideoLinkFilters = {
      limit: 20,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await getVideoLinks(filters);

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it('should return paginated video links with user relations', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test video links
    const testLinks = [
      {
        user_id: users[0].id,
        url: 'https://youtube.com/watch?v=test1',
        platform: 'youtube' as const,
        status: 'pending' as const,
        title: 'Test Video 1'
      },
      {
        user_id: users[1].id,
        url: 'https://instagram.com/p/test2',
        platform: 'instagram' as const,
        status: 'downloaded' as const,
        title: 'Test Video 2'
      },
      {
        user_id: users[0].id,
        url: 'https://twitter.com/status/test3',
        platform: 'twitter' as const,
        status: 'uploaded' as const,
        title: 'Test Video 3'
      }
    ];

    await db.insert(videoLinksTable)
      .values(testLinks)
      .execute();

    const filters: VideoLinkFilters = {
      limit: 20,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await getVideoLinks(filters);

    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);

    // Check first video link (should be most recent due to desc order)
    const firstLink = result.data[0];
    expect(firstLink.url).toBe('https://twitter.com/status/test3');
    expect(firstLink.platform).toBe('twitter');
    expect(firstLink.status).toBe('uploaded');
    expect(firstLink.title).toBe('Test Video 3');
    expect(firstLink.user_id).toBe(users[0].id);
    expect(firstLink.id).toBeDefined();
    expect(firstLink.created_at).toBeInstanceOf(Date);
    expect(firstLink.updated_at).toBeInstanceOf(Date);
  });

  it('should filter by platform', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    // Create video links with different platforms
    const testLinks = [
      {
        user_id: users[0].id,
        url: 'https://youtube.com/watch?v=test1',
        platform: 'youtube' as const,
        status: 'pending' as const,
        title: 'YouTube Video'
      },
      {
        user_id: users[0].id,
        url: 'https://instagram.com/p/test2',
        platform: 'instagram' as const,
        status: 'pending' as const,
        title: 'Instagram Video'
      }
    ];

    await db.insert(videoLinksTable)
      .values(testLinks)
      .execute();

    const filters: VideoLinkFilters = {
      platform: 'youtube',
      limit: 20,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await getVideoLinks(filters);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].platform).toBe('youtube');
    expect(result.data[0].title).toBe('YouTube Video');
  });

  it('should filter by status', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    // Create video links with different statuses
    const testLinks = [
      {
        user_id: users[0].id,
        url: 'https://youtube.com/watch?v=test1',
        platform: 'youtube' as const,
        status: 'pending' as const,
        title: 'Pending Video'
      },
      {
        user_id: users[0].id,
        url: 'https://youtube.com/watch?v=test2',
        platform: 'youtube' as const,
        status: 'downloaded' as const,
        title: 'Downloaded Video'
      }
    ];

    await db.insert(videoLinksTable)
      .values(testLinks)
      .execute();

    const filters: VideoLinkFilters = {
      status: 'downloaded',
      limit: 20,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await getVideoLinks(filters);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].status).toBe('downloaded');
    expect(result.data[0].title).toBe('Downloaded Video');
  });

  it('should filter by user_id', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create video links for different users
    const testLinks = [
      {
        user_id: users[0].id,
        url: 'https://youtube.com/watch?v=test1',
        platform: 'youtube' as const,
        status: 'pending' as const,
        title: 'User1 Video'
      },
      {
        user_id: users[1].id,
        url: 'https://youtube.com/watch?v=test2',
        platform: 'youtube' as const,
        status: 'pending' as const,
        title: 'User2 Video'
      }
    ];

    await db.insert(videoLinksTable)
      .values(testLinks)
      .execute();

    const filters: VideoLinkFilters = {
      user_id: users[0].id,
      limit: 20,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await getVideoLinks(filters);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].user_id).toBe(users[0].id);
    expect(result.data[0].title).toBe('User1 Video');
  });

  it('should handle multiple filters combined', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create video links with various combinations
    const testLinks = [
      {
        user_id: users[0].id,
        url: 'https://youtube.com/watch?v=test1',
        platform: 'youtube' as const,
        status: 'downloaded' as const,
        title: 'Target Video'
      },
      {
        user_id: users[0].id,
        url: 'https://instagram.com/p/test2',
        platform: 'instagram' as const,
        status: 'downloaded' as const,
        title: 'Wrong Platform'
      },
      {
        user_id: users[1].id,
        url: 'https://youtube.com/watch?v=test3',
        platform: 'youtube' as const,
        status: 'downloaded' as const,
        title: 'Wrong User'
      },
      {
        user_id: users[0].id,
        url: 'https://youtube.com/watch?v=test4',
        platform: 'youtube' as const,
        status: 'pending' as const,
        title: 'Wrong Status'
      }
    ];

    await db.insert(videoLinksTable)
      .values(testLinks)
      .execute();

    const filters: VideoLinkFilters = {
      user_id: users[0].id,
      platform: 'youtube',
      status: 'downloaded',
      limit: 20,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await getVideoLinks(filters);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].title).toBe('Target Video');
    expect(result.data[0].user_id).toBe(users[0].id);
    expect(result.data[0].platform).toBe('youtube');
    expect(result.data[0].status).toBe('downloaded');
  });

  it('should handle pagination correctly', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    // Create 5 video links
    const testLinks = Array.from({ length: 5 }, (_, i) => ({
      user_id: users[0].id,
      url: `https://youtube.com/watch?v=test${i + 1}`,
      platform: 'youtube' as const,
      status: 'pending' as const,
      title: `Video ${i + 1}`
    }));

    await db.insert(videoLinksTable)
      .values(testLinks)
      .execute();

    // Test first page
    const firstPageFilters: VideoLinkFilters = {
      limit: 2,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'asc'
    };

    const firstPage = await getVideoLinks(firstPageFilters);

    expect(firstPage.data).toHaveLength(2);
    expect(firstPage.total).toBe(5);
    expect(firstPage.limit).toBe(2);
    expect(firstPage.offset).toBe(0);
    expect(firstPage.data[0].title).toBe('Video 1');
    expect(firstPage.data[1].title).toBe('Video 2');

    // Test second page
    const secondPageFilters: VideoLinkFilters = {
      limit: 2,
      offset: 2,
      sort_by: 'created_at',
      sort_order: 'asc'
    };

    const secondPage = await getVideoLinks(secondPageFilters);

    expect(secondPage.data).toHaveLength(2);
    expect(secondPage.total).toBe(5);
    expect(secondPage.limit).toBe(2);
    expect(secondPage.offset).toBe(2);
    expect(secondPage.data[0].title).toBe('Video 3');
    expect(secondPage.data[1].title).toBe('Video 4');
  });

  it('should sort by title ascending', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    // Create video links with different titles
    const testLinks = [
      {
        user_id: users[0].id,
        url: 'https://youtube.com/watch?v=test1',
        platform: 'youtube' as const,
        status: 'pending' as const,
        title: 'Zebra Video'
      },
      {
        user_id: users[0].id,
        url: 'https://youtube.com/watch?v=test2',
        platform: 'youtube' as const,
        status: 'pending' as const,
        title: 'Alpha Video'
      },
      {
        user_id: users[0].id,
        url: 'https://youtube.com/watch?v=test3',
        platform: 'youtube' as const,
        status: 'pending' as const,
        title: 'Beta Video'
      }
    ];

    await db.insert(videoLinksTable)
      .values(testLinks)
      .execute();

    const filters: VideoLinkFilters = {
      limit: 20,
      offset: 0,
      sort_by: 'title',
      sort_order: 'asc'
    };

    const result = await getVideoLinks(filters);

    expect(result.data).toHaveLength(3);
    expect(result.data[0].title).toBe('Alpha Video');
    expect(result.data[1].title).toBe('Beta Video');
    expect(result.data[2].title).toBe('Zebra Video');
  });

  it('should include telegram bot relation when present', async () => {
    // Create test user and bot
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    const bots = await db.insert(telegramBotsTable)
      .values([testBot])
      .returning()
      .execute();

    // Create video link with telegram bot
    const testLink = {
      user_id: users[0].id,
      url: 'https://youtube.com/watch?v=test1',
      platform: 'youtube' as const,
      status: 'uploaded' as const,
      title: 'Uploaded Video',
      telegram_bot_id: bots[0].id,
      telegram_file_id: 'file123',
      telegram_message_link: 'https://t.me/testchannel/123'
    };

    await db.insert(videoLinksTable)
      .values([testLink])
      .execute();

    const filters: VideoLinkFilters = {
      limit: 20,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await getVideoLinks(filters);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].telegram_bot_id).toBe(bots[0].id);
    expect(result.data[0].telegram_file_id).toBe('file123');
    expect(result.data[0].telegram_message_link).toBe('https://t.me/testchannel/123');
  });

  it('should handle video links without telegram bot', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    // Create video link without telegram bot
    const testLink = {
      user_id: users[0].id,
      url: 'https://youtube.com/watch?v=test1',
      platform: 'youtube' as const,
      status: 'pending' as const,
      title: 'Pending Video'
    };

    await db.insert(videoLinksTable)
      .values([testLink])
      .execute();

    const filters: VideoLinkFilters = {
      limit: 20,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await getVideoLinks(filters);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].telegram_bot_id).toBe(null);
    expect(result.data[0].telegram_file_id).toBe(null);
    expect(result.data[0].telegram_message_link).toBe(null);
  });
});