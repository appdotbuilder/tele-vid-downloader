import { db } from '../db';
import { videoLinksTable, usersTable, telegramBotsTable } from '../db/schema';
import { type VideoLinkFilters, type PaginatedVideoLinks, type VideoLink } from '../schema';
import { eq, and, count, desc, asc, type SQL } from 'drizzle-orm';

export async function getVideoLinks(filters: VideoLinkFilters): Promise<PaginatedVideoLinks> {
  try {
    // Build conditions for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters.platform) {
      conditions.push(eq(videoLinksTable.platform, filters.platform));
    }

    if (filters.status) {
      conditions.push(eq(videoLinksTable.status, filters.status));
    }

    if (filters.user_id) {
      conditions.push(eq(videoLinksTable.user_id, filters.user_id));
    }

    // Build the base query with relations
    const baseQuery = db.select({
      // Video link fields
      id: videoLinksTable.id,
      user_id: videoLinksTable.user_id,
      url: videoLinksTable.url,
      platform: videoLinksTable.platform,
      status: videoLinksTable.status,
      title: videoLinksTable.title,
      thumbnail_url: videoLinksTable.thumbnail_url,
      file_size: videoLinksTable.file_size,
      duration: videoLinksTable.duration,
      error_message: videoLinksTable.error_message,
      telegram_bot_id: videoLinksTable.telegram_bot_id,
      telegram_file_id: videoLinksTable.telegram_file_id,
      telegram_message_link: videoLinksTable.telegram_message_link,
      downloaded_at: videoLinksTable.downloaded_at,
      uploaded_at: videoLinksTable.uploaded_at,
      created_at: videoLinksTable.created_at,
      updated_at: videoLinksTable.updated_at,
      // User relation fields
      user_telegram_id: usersTable.telegram_id,
      user_username: usersTable.username,
      user_first_name: usersTable.first_name,
      user_last_name: usersTable.last_name,
      // Telegram bot relation fields (nullable)
      bot_name: telegramBotsTable.name,
      bot_username: telegramBotsTable.username,
    })
    .from(videoLinksTable)
    .innerJoin(usersTable, eq(videoLinksTable.user_id, usersTable.id))
    .leftJoin(telegramBotsTable, eq(videoLinksTable.telegram_bot_id, telegramBotsTable.id));

    // Apply sorting
    const sortColumn = videoLinksTable[filters.sort_by];
    const orderByClause = filters.sort_order === 'desc' ? desc(sortColumn) : asc(sortColumn);

    // Build the complete query
    const query = conditions.length > 0
      ? baseQuery.where(and(...conditions)).orderBy(orderByClause).limit(filters.limit).offset(filters.offset)
      : baseQuery.orderBy(orderByClause).limit(filters.limit).offset(filters.offset);

    // Execute the main query
    const results = await query.execute();

    // Get total count for pagination
    const countQuery = conditions.length > 0
      ? db.select({ count: count() }).from(videoLinksTable).where(and(...conditions))
      : db.select({ count: count() }).from(videoLinksTable);

    const totalResults = await countQuery.execute();
    const total = totalResults[0].count;

    // Transform results to VideoLink format
    const data: VideoLink[] = results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      url: result.url,
      platform: result.platform,
      status: result.status,
      title: result.title,
      thumbnail_url: result.thumbnail_url,
      file_size: result.file_size,
      duration: result.duration,
      error_message: result.error_message,
      telegram_bot_id: result.telegram_bot_id,
      telegram_file_id: result.telegram_file_id,
      telegram_message_link: result.telegram_message_link,
      downloaded_at: result.downloaded_at,
      uploaded_at: result.uploaded_at,
      created_at: result.created_at,
      updated_at: result.updated_at,
    }));

    return {
      data,
      total,
      limit: filters.limit,
      offset: filters.offset
    };
  } catch (error) {
    console.error('Get video links failed:', error);
    throw error;
  }
}