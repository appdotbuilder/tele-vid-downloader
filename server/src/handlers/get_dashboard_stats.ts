import { db } from '../db';
import { usersTable, videoLinksTable } from '../db/schema';
import { type DashboardStats, type StatsResponse } from '../schema';
import { sql, count, gte, and, lte } from 'drizzle-orm';

export async function getDashboardStats(input: DashboardStats): Promise<StatsResponse> {
  try {
    // Calculate date range based on period and days
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - input.days);

    // Get total counts
    const [totalLinksResult] = await db.select({ count: count() }).from(videoLinksTable).execute();
    const [totalUsersResult] = await db.select({ count: count() }).from(usersTable).execute();

    const totalLinks = totalLinksResult.count;
    const totalUsers = totalUsersResult.count;

    // Get platform distribution
    const platformResults = await db
      .select({
        platform: videoLinksTable.platform,
        count: count()
      })
      .from(videoLinksTable)
      .groupBy(videoLinksTable.platform)
      .execute();

    // Initialize platform counts with zeros
    const linksByPlatform = {
      youtube: 0,
      instagram: 0,
      twitter: 0,
      doodstream: 0,
      other: 0
    };

    // Populate actual counts
    platformResults.forEach(result => {
      linksByPlatform[result.platform] = result.count;
    });

    // Get status distribution
    const statusResults = await db
      .select({
        status: videoLinksTable.status,
        count: count()
      })
      .from(videoLinksTable)
      .groupBy(videoLinksTable.status)
      .execute();

    // Initialize status counts with zeros
    const linksByStatus = {
      pending: 0,
      processing: 0,
      downloaded: 0,
      uploaded: 0,
      failed: 0
    };

    // Populate actual counts
    statusResults.forEach(result => {
      linksByStatus[result.status] = result.count;
    });

    // Generate daily stats based on period
    const dailyStats = [];
    
    // Calculate step size based on period
    let stepDays = 1;
    if (input.period === 'weekly') {
      stepDays = 7;
    } else if (input.period === 'monthly') {
      stepDays = 30;
    }

    // Generate date ranges going backwards from today
    const now = new Date();
    for (let i = 0; i < input.days; i += stepDays) {
      // Start from today and go backwards
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() - i);
      periodEnd.setHours(23, 59, 59, 999); // End of day
      
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - stepDays + 1);
      periodStart.setHours(0, 0, 0, 0); // Start of day
      
      // For the first iteration (today), make sure we include all of today
      if (i === 0) {
        periodEnd.setTime(now.getTime());
      }

      // Count links created in this period
      const [linksCount] = await db
        .select({ count: count() })
        .from(videoLinksTable)
        .where(
          and(
            gte(videoLinksTable.created_at, periodStart),
            lte(videoLinksTable.created_at, periodEnd)
          )
        )
        .execute();

      // Count users created in this period
      const [usersCount] = await db
        .select({ count: count() })
        .from(usersTable)
        .where(
          and(
            gte(usersTable.created_at, periodStart),
            lte(usersTable.created_at, periodEnd)
          )
        )
        .execute();

      dailyStats.push({
        date: periodStart.toISOString().split('T')[0], // Format as YYYY-MM-DD
        links_count: linksCount.count,
        users_count: usersCount.count
      });
    }
    
    // Reverse to show chronologically (oldest first)
    dailyStats.reverse();

    return {
      total_links: totalLinks,
      total_users: totalUsers,
      links_by_platform: linksByPlatform,
      links_by_status: linksByStatus,
      daily_stats: dailyStats
    };
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
}