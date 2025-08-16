import { db } from '../db';
import { botPlatformsTable, telegramBotsTable } from '../db/schema';
import { type CreateBotPlatformInput, type BotPlatform, type Platform } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function assignBotToPlatform(input: CreateBotPlatformInput): Promise<BotPlatform> {
  try {
    // Check if bot exists
    const bot = await db.select()
      .from(telegramBotsTable)
      .where(eq(telegramBotsTable.id, input.bot_id))
      .execute();

    if (bot.length === 0) {
      throw new Error(`Telegram bot with ID ${input.bot_id} not found`);
    }

    // Check if platform is already assigned to another bot
    const existingAssignment = await db.select()
      .from(botPlatformsTable)
      .where(eq(botPlatformsTable.platform, input.platform))
      .execute();

    if (existingAssignment.length > 0) {
      throw new Error(`Platform ${input.platform} is already assigned to bot ${existingAssignment[0].bot_id}`);
    }

    // Create the assignment
    const result = await db.insert(botPlatformsTable)
      .values({
        bot_id: input.bot_id,
        platform: input.platform
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Bot platform assignment failed:', error);
    throw error;
  }
}

export async function removeBotFromPlatform(botId: number, platform: Platform): Promise<boolean> {
  try {
    const result = await db.delete(botPlatformsTable)
      .where(and(
        eq(botPlatformsTable.bot_id, botId),
        eq(botPlatformsTable.platform, platform)
      ))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Bot platform removal failed:', error);
    throw error;
  }
}

export async function getBotForPlatform(platform: Platform): Promise<number | null> {
  try {
    // First, try to find a specific bot assigned to this platform
    const assignment = await db.select()
      .from(botPlatformsTable)
      .where(eq(botPlatformsTable.platform, platform))
      .execute();

    if (assignment.length > 0) {
      return assignment[0].bot_id;
    }

    // If no specific assignment, return the default bot
    const defaultBot = await db.select()
      .from(telegramBotsTable)
      .where(and(
        eq(telegramBotsTable.is_default, true),
        eq(telegramBotsTable.is_active, true)
      ))
      .execute();

    if (defaultBot.length > 0) {
      return defaultBot[0].id;
    }

    // If no default bot, return null
    return null;
  } catch (error) {
    console.error('Get bot for platform failed:', error);
    throw error;
  }
}

export async function getBotPlatformAssignments(): Promise<BotPlatform[]> {
  try {
    const assignments = await db.select()
      .from(botPlatformsTable)
      .execute();

    return assignments;
  } catch (error) {
    console.error('Get bot platform assignments failed:', error);
    throw error;
  }
}