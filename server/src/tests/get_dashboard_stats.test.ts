import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, videoLinksTable } from '../db/schema';
import { type DashboardStats } from '../schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

// Test data setup
const testUser = {
  telegram_id: '123456789',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  avatar_url: null,
  is_admin: false
};

const testUser2 = {
  telegram_id: '987654321',
  username: 'testuser2',
  first_name: 'Test2',
  last_name: 'User2',
  avatar_url: null,
  is_admin: false
};

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty stats when no data exists', async () => {
    const input: DashboardStats = {
      period: 'daily',
      days: 7
    };

    const result = await getDashboardStats(input);

    expect(result.total_links).toEqual(0);
    expect(result.total_users).toEqual(0);
    expect(result.links_by_platform.youtube).toEqual(0);
    expect(result.links_by_platform.instagram).toEqual(0);
    expect(result.links_by_platform.twitter).toEqual(0);
    expect(result.links_by_platform.doodstream).toEqual(0);
    expect(result.links_by_platform.other).toEqual(0);
    expect(result.links_by_status.pending).toEqual(0);
    expect(result.links_by_status.processing).toEqual(0);
    expect(result.links_by_status.downloaded).toEqual(0);
    expect(result.links_by_status.uploaded).toEqual(0);
    expect(result.links_by_status.failed).toEqual(0);
    expect(result.daily_stats).toHaveLength(7);
    
    // Check that daily stats are properly formatted
    result.daily_stats.forEach(stat => {
      expect(stat.links_count).toEqual(0);
      expect(stat.users_count).toEqual(0);
      expect(stat.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });
  });

  it('should calculate total counts correctly', async () => {
    // Create test users
    const [user1] = await db.insert(usersTable).values(testUser).returning().execute();
    const [user2] = await db.insert(usersTable).values(testUser2).returning().execute();

    // Create test video links with different platforms and statuses
    await db.insert(videoLinksTable).values([
      {
        user_id: user1.id,
        url: 'https://youtube.com/watch?v=123',
        platform: 'youtube',
        status: 'downloaded'
      },
      {
        user_id: user1.id,
        url: 'https://instagram.com/p/456',
        platform: 'instagram',
        status: 'pending'
      },
      {
        user_id: user2.id,
        url: 'https://twitter.com/status/789',
        platform: 'twitter',
        status: 'failed'
      }
    ]).execute();

    const input: DashboardStats = {
      period: 'daily',
      days: 30
    };

    const result = await getDashboardStats(input);

    expect(result.total_links).toEqual(3);
    expect(result.total_users).toEqual(2);
  });

  it('should calculate platform distribution correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();

    // Create video links for different platforms
    await db.insert(videoLinksTable).values([
      {
        user_id: user.id,
        url: 'https://youtube.com/watch?v=1',
        platform: 'youtube',
        status: 'downloaded'
      },
      {
        user_id: user.id,
        url: 'https://youtube.com/watch?v=2',
        platform: 'youtube',
        status: 'uploaded'
      },
      {
        user_id: user.id,
        url: 'https://instagram.com/p/1',
        platform: 'instagram',
        status: 'pending'
      },
      {
        user_id: user.id,
        url: 'https://doodstream.com/d/1',
        platform: 'doodstream',
        status: 'processing'
      },
      {
        user_id: user.id,
        url: 'https://example.com/video',
        platform: 'other',
        status: 'failed'
      }
    ]).execute();

    const input: DashboardStats = {
      period: 'daily',
      days: 30
    };

    const result = await getDashboardStats(input);

    expect(result.links_by_platform.youtube).toEqual(2);
    expect(result.links_by_platform.instagram).toEqual(1);
    expect(result.links_by_platform.twitter).toEqual(0);
    expect(result.links_by_platform.doodstream).toEqual(1);
    expect(result.links_by_platform.other).toEqual(1);
  });

  it('should calculate status distribution correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();

    // Create video links with different statuses
    await db.insert(videoLinksTable).values([
      {
        user_id: user.id,
        url: 'https://youtube.com/watch?v=1',
        platform: 'youtube',
        status: 'pending'
      },
      {
        user_id: user.id,
        url: 'https://youtube.com/watch?v=2',
        platform: 'youtube',
        status: 'pending'
      },
      {
        user_id: user.id,
        url: 'https://youtube.com/watch?v=3',
        platform: 'youtube',
        status: 'processing'
      },
      {
        user_id: user.id,
        url: 'https://youtube.com/watch?v=4',
        platform: 'youtube',
        status: 'downloaded'
      },
      {
        user_id: user.id,
        url: 'https://youtube.com/watch?v=5',
        platform: 'youtube',
        status: 'uploaded'
      },
      {
        user_id: user.id,
        url: 'https://youtube.com/watch?v=6',
        platform: 'youtube',
        status: 'failed'
      }
    ]).execute();

    const input: DashboardStats = {
      period: 'daily',
      days: 30
    };

    const result = await getDashboardStats(input);

    expect(result.links_by_status.pending).toEqual(2);
    expect(result.links_by_status.processing).toEqual(1);
    expect(result.links_by_status.downloaded).toEqual(1);
    expect(result.links_by_status.uploaded).toEqual(1);
    expect(result.links_by_status.failed).toEqual(1);
  });

  it('should handle different period types correctly', async () => {
    const weeklyInput: DashboardStats = {
      period: 'weekly',
      days: 14
    };

    const monthlyInput: DashboardStats = {
      period: 'monthly',
      days: 60
    };

    const weeklyResult = await getDashboardStats(weeklyInput);
    const monthlyResult = await getDashboardStats(monthlyInput);

    // Weekly should have fewer data points due to 7-day grouping
    expect(weeklyResult.daily_stats.length).toBeLessThanOrEqual(2);
    
    // Monthly should have fewer data points due to 30-day grouping
    expect(monthlyResult.daily_stats.length).toBeLessThanOrEqual(2);

    // All dates should be properly formatted
    weeklyResult.daily_stats.forEach(stat => {
      expect(stat.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    monthlyResult.daily_stats.forEach(stat => {
      expect(stat.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('should handle date range filtering for daily stats', async () => {
    // Create test user
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();

    // Create records with recent dates to ensure they fall within our query range
    const now = new Date();
    
    // Insert records - let database set created_at to current time
    await db.insert(videoLinksTable).values([
      {
        user_id: user.id,
        url: 'https://youtube.com/watch?v=recent1',
        platform: 'youtube',
        status: 'downloaded'
      },
      {
        user_id: user.id,
        url: 'https://youtube.com/watch?v=recent2',
        platform: 'youtube',
        status: 'uploaded'
      }
    ]).execute();

    const input: DashboardStats = {
      period: 'daily',
      days: 3
    };

    const result = await getDashboardStats(input);

    expect(result.daily_stats).toHaveLength(3);
    expect(result.total_links).toEqual(2);

    // Since we just created the records, they should appear in today's stats
    const totalDailyLinks = result.daily_stats.reduce((sum, stat) => sum + stat.links_count, 0);
    expect(totalDailyLinks).toEqual(2);
    
    // Check that at least one day has counts > 0 (should be today)
    const hasDataForSomeDay = result.daily_stats.some(stat => stat.links_count > 0);
    expect(hasDataForSomeDay).toBe(true);
  });

  it('should use default values from Zod schema', async () => {
    // Test with input that has defaults applied by Zod
    const inputWithDefaults: DashboardStats = {
      period: 'daily',
      days: 30
    };

    const result = await getDashboardStats(inputWithDefaults);

    // Should not throw and return properly structured response
    expect(result.total_links).toEqual(0);
    expect(result.total_users).toEqual(0);
    expect(result.daily_stats).toHaveLength(30);
    expect(result.links_by_platform).toBeDefined();
    expect(result.links_by_status).toBeDefined();
  });

  it('should handle large datasets efficiently', async () => {
    // Create test user
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();

    // Create multiple video links to test aggregation performance
    const videoLinks = [];
    for (let i = 0; i < 50; i++) {
      videoLinks.push({
        user_id: user.id,
        url: `https://youtube.com/watch?v=${i}`,
        platform: (i % 2 === 0 ? 'youtube' : 'instagram') as 'youtube' | 'instagram',
        status: (i % 3 === 0 ? 'downloaded' : 'pending') as 'downloaded' | 'pending'
      });
    }

    await db.insert(videoLinksTable).values(videoLinks).execute();

    const input: DashboardStats = {
      period: 'daily',
      days: 7
    };

    const result = await getDashboardStats(input);

    expect(result.total_links).toEqual(50);
    expect((result.links_by_platform.youtube || 0) + (result.links_by_platform.instagram || 0)).toEqual(50);
    expect((result.links_by_status.downloaded || 0) + (result.links_by_status.pending || 0)).toEqual(50);
  });
});