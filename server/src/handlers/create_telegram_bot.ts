import { db } from '../db';
import { telegramBotsTable } from '../db/schema';
import { type CreateTelegramBotInput, type TelegramBot } from '../schema';
import { eq } from 'drizzle-orm';

// Type for Telegram API response
interface TelegramBotInfo {
  ok: boolean;
  result?: {
    username?: string;
  };
  description?: string;
}

// Validate Telegram bot token by calling the Telegram Bot API
async function validateTelegramBotToken(token: string): Promise<{ username?: string }> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json() as TelegramBotInfo;
    
    if (!data.ok) {
      throw new Error(`Invalid bot token: ${data.description || 'Token validation failed'}`);
    }
    
    return {
      username: data.result?.username
    };
  } catch (error) {
    console.error('Bot token validation failed:', error);
    // Re-throw the original error if it's already a validation error
    if (error instanceof Error && error.message.includes('Invalid bot token')) {
      throw error;
    }
    throw new Error('Failed to validate bot token. Please check the token and try again.');
  }
}

export async function createTelegramBot(input: CreateTelegramBotInput): Promise<TelegramBot> {
  try {
    // Validate the bot token with Telegram API
    const botInfo = await validateTelegramBotToken(input.token);
    
    // Use the username from Telegram API if not provided
    const username = input.username || botInfo.username || null;
    
    // If this bot should be the default, unset other default bots first
    if (input.is_default) {
      await db
        .update(telegramBotsTable)
        .set({ is_default: false, updated_at: new Date() })
        .where(eq(telegramBotsTable.is_default, true))
        .execute();
    }
    
    // Insert the new bot
    const result = await db
      .insert(telegramBotsTable)
      .values({
        name: input.name,
        token: input.token,
        username: username,
        is_default: input.is_default,
        is_active: input.is_active
      })
      .returning()
      .execute();
    
    return result[0];
  } catch (error) {
    console.error('Telegram bot creation failed:', error);
    throw error;
  }
}