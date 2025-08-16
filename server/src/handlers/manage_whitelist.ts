import { db } from '../db';
import { whitelistTable, usersTable } from '../db/schema';
import { type CreateWhitelistInput, type Whitelist } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function addToWhitelist(input: CreateWhitelistInput): Promise<Whitelist> {
  try {
    // First, verify that the user who is adding exists
    const addingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.added_by_user_id))
      .limit(1)
      .execute();

    if (addingUser.length === 0) {
      throw new Error(`User with ID ${input.added_by_user_id} does not exist`);
    }

    // Check if the telegram_id is already whitelisted
    const existing = await db.select()
      .from(whitelistTable)
      .where(eq(whitelistTable.telegram_id, input.telegram_id))
      .limit(1)
      .execute();

    if (existing.length > 0) {
      // Return the existing whitelist entry instead of creating a duplicate
      return existing[0];
    }

    // Add new entry to whitelist
    const result = await db.insert(whitelistTable)
      .values({
        telegram_id: input.telegram_id,
        added_by_user_id: input.added_by_user_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to add to whitelist:', error);
    throw error;
  }
}

export async function removeFromWhitelist(telegramId: string): Promise<boolean> {
  try {
    const result = await db.delete(whitelistTable)
      .where(eq(whitelistTable.telegram_id, telegramId))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Failed to remove from whitelist:', error);
    throw error;
  }
}

export async function getWhitelist(): Promise<Whitelist[]> {
  try {
    const results = await db.select({
      id: whitelistTable.id,
      telegram_id: whitelistTable.telegram_id,
      added_by_user_id: whitelistTable.added_by_user_id,
      created_at: whitelistTable.created_at
    })
      .from(whitelistTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get whitelist:', error);
    throw error;
  }
}

export async function isWhitelisted(telegramId: string): Promise<boolean> {
  try {
    const result = await db.select()
      .from(whitelistTable)
      .where(eq(whitelistTable.telegram_id, telegramId))
      .limit(1)
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Failed to check whitelist status:', error);
    throw error;
  }
}