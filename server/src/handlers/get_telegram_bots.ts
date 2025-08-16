import { db } from '../db';
import { telegramBotsTable } from '../db/schema';
import { type TelegramBot } from '../schema';
import { desc } from 'drizzle-orm';

export const getTelegramBots = async (): Promise<TelegramBot[]> => {
  try {
    const results = await db.select()
      .from(telegramBotsTable)
      .orderBy(desc(telegramBotsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch telegram bots:', error);
    throw error;
  }
};