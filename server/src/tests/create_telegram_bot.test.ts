import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { telegramBotsTable } from '../db/schema';
import { type CreateTelegramBotInput } from '../schema';
import { createTelegramBot } from '../handlers/create_telegram_bot';
import { eq } from 'drizzle-orm';

// Mock the global fetch function
const mockFetch = mock(() => Promise.resolve({
  json: () => Promise.resolve({})
}));
global.fetch = mockFetch as any;

const testInput: CreateTelegramBotInput = {
  name: 'Test Bot',
  token: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
  username: 'testbot',
  is_default: false,
  is_active: true
};

describe('createTelegramBot', () => {
  beforeEach(async () => {
    await createDB();
    mockFetch.mockClear();
  });

  afterEach(resetDB);

  it('should create a telegram bot with valid token', async () => {
    // Mock successful Telegram API response
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        ok: true,
        result: {
          username: 'testbot_api'
        }
      })
    });

    const result = await createTelegramBot(testInput);

    expect(result.name).toEqual('Test Bot');
    expect(result.token).toEqual(testInput.token);
    expect(result.username).toEqual('testbot'); // Uses input username, not API username
    expect(result.is_default).toEqual(false);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify the fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.telegram.org/bot${testInput.token}/getMe`
    );
  });

  it('should use API username when input username is not provided', async () => {
    // Mock successful Telegram API response
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        ok: true,
        result: {
          username: 'api_bot_username'
        }
      })
    });

    const inputWithoutUsername: CreateTelegramBotInput = {
      name: 'Bot Without Username',
      token: '987654321:XYZabcDEFghiJKLmnoPQRstuVWX',
      username: null,
      is_default: false,
      is_active: true
    };

    const result = await createTelegramBot(inputWithoutUsername);

    expect(result.username).toEqual('api_bot_username');
  });

  it('should save bot to database', async () => {
    // Mock successful Telegram API response
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        ok: true,
        result: {
          username: 'testbot'
        }
      })
    });

    const result = await createTelegramBot(testInput);

    const bots = await db.select()
      .from(telegramBotsTable)
      .where(eq(telegramBotsTable.id, result.id))
      .execute();

    expect(bots).toHaveLength(1);
    expect(bots[0].name).toEqual('Test Bot');
    expect(bots[0].token).toEqual(testInput.token);
    expect(bots[0].username).toEqual('testbot');
    expect(bots[0].is_default).toEqual(false);
    expect(bots[0].is_active).toEqual(true);
  });

  it('should set bot as default and unset other default bots', async () => {
    // Mock successful Telegram API response
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        ok: true,
        result: {
          username: 'testbot'
        }
      })
    });

    // Create an existing default bot
    await db.insert(telegramBotsTable)
      .values({
        name: 'Existing Default Bot',
        token: '111111111:AAAbbbCCCdddEEEfff',
        username: 'existing_bot',
        is_default: true,
        is_active: true
      })
      .execute();

    const defaultBotInput: CreateTelegramBotInput = {
      name: 'New Default Bot',
      token: '222222222:BBBcccDDDeeeFFfggg',
      username: 'new_default_bot',
      is_default: true,
      is_active: true
    };

    const result = await createTelegramBot(defaultBotInput);

    // Check that the new bot is marked as default
    expect(result.is_default).toEqual(true);

    // Check that the existing default bot is no longer default
    const allBots = await db.select()
      .from(telegramBotsTable)
      .execute();

    const defaultBots = allBots.filter(bot => bot.is_default);
    expect(defaultBots).toHaveLength(1);
    expect(defaultBots[0].id).toEqual(result.id);

    // Check that the previous default bot is still in the database but not default
    const previousBot = allBots.find(bot => bot.name === 'Existing Default Bot');
    expect(previousBot).toBeDefined();
    expect(previousBot!.is_default).toEqual(false);
  });

  it('should throw error for invalid bot token', async () => {
    // Mock failed Telegram API response
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        ok: false,
        description: 'Unauthorized'
      })
    });

    const invalidInput: CreateTelegramBotInput = {
      name: 'Invalid Bot',
      token: 'invalid_token_unique',
      username: 'invalid_bot',
      is_default: false,
      is_active: true
    };

    await expect(createTelegramBot(invalidInput)).rejects.toThrow(/Invalid bot token.*Unauthorized/i);
  });

  it('should throw error when Telegram API is unreachable', async () => {
    // Mock fetch to throw network error
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(createTelegramBot(testInput)).rejects.toThrow(/Failed to validate bot token/i);
  });

  it('should handle duplicate token constraint violation', async () => {
    // Mock successful Telegram API response
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        ok: true,
        result: {
          username: 'testbot'
        }
      })
    });

    const uniqueToken = '999888777:UNIQUEtokenFORduplicateTEST';
    
    // Create a bot with a unique token first
    await db.insert(telegramBotsTable)
      .values({
        name: 'Existing Bot',
        token: uniqueToken,
        username: 'existing',
        is_default: false,
        is_active: true
      })
      .execute();

    const duplicateInput: CreateTelegramBotInput = {
      name: 'Duplicate Bot',
      token: uniqueToken, // Same token as above
      username: 'duplicate_bot',
      is_default: false,
      is_active: true
    };

    // Try to create another bot with the same token
    await expect(createTelegramBot(duplicateInput)).rejects.toThrow();
  });

  it('should create bot with minimal input using defaults', async () => {
    // Mock successful Telegram API response
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        ok: true,
        result: {
          username: 'minimal_bot'
        }
      })
    });

    const minimalInput: CreateTelegramBotInput = {
      name: 'Minimal Bot',
      token: '555555555:MINimalTOKENforTEST',
      username: null,
      is_default: false, // Zod default
      is_active: true    // Zod default
    };

    const result = await createTelegramBot(minimalInput);

    expect(result.name).toEqual('Minimal Bot');
    expect(result.token).toEqual(minimalInput.token);
    expect(result.username).toEqual('minimal_bot'); // From API
    expect(result.is_default).toEqual(false);
    expect(result.is_active).toEqual(true);
  });
});