import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  try {
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.telegram_id, telegramId))
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Return the first (and should be only) user found
    return result[0];
  } catch (error) {
    console.error('Failed to get user by telegram ID:', error);
    throw error;
  }
}