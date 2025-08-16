import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { telegramBotsTable } from '../db/schema';
import { type CreateTelegramBotInput } from '../schema';
import { getTelegramBots } from '../handlers/get_telegram_bots';

// Test input data
const testBot1: CreateTelegramBotInput = {
  name: 'Test Bot 1',
  token: 'bot123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh',
  username: 'test_bot_1',
  is_default: true,
  is_active: true
};

const testBot2: CreateTelegramBotInput = {
  name: 'Test Bot 2',
  token: 'bot789012:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh',
  username: 'test_bot_2',
  is_default: false,
  is_active: false
};

const testBot3: CreateTelegramBotInput = {
  name: 'Test Bot 3',
  token: 'bot345678:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh',
  username: null,
  is_default: false,
  is_active: true
};

describe('getTelegramBots', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no bots exist', async () => {
    const result = await getTelegramBots();

    expect(result).toEqual([]);
  });

  it('should return all telegram bots', async () => {
    // Insert test bots
    await db.insert(telegramBotsTable)
      .values([testBot1, testBot2, testBot3])
      .execute();

    const result = await getTelegramBots();

    expect(result).toHaveLength(3);
    
    // Verify all bots are returned (order may vary when inserted simultaneously)
    const botNames = result.map(bot => bot.name);
    expect(botNames).toContain('Test Bot 1');
    expect(botNames).toContain('Test Bot 2');
    expect(botNames).toContain('Test Bot 3');
    
    // Verify all have the correct properties
    result.forEach(bot => {
      expect(bot.id).toBeDefined();
      expect(typeof bot.name).toBe('string');
      expect(typeof bot.token).toBe('string');
      expect(typeof bot.is_active).toBe('boolean');
      expect(typeof bot.is_default).toBe('boolean');
      expect(bot.created_at).toBeInstanceOf(Date);
      expect(bot.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return bots with all required fields', async () => {
    // Insert one bot with all fields
    await db.insert(telegramBotsTable)
      .values(testBot1)
      .execute();

    const result = await getTelegramBots();

    expect(result).toHaveLength(1);
    const bot = result[0];

    // Verify all schema fields are present
    expect(bot.id).toBeDefined();
    expect(typeof bot.id).toBe('number');
    expect(bot.name).toEqual('Test Bot 1');
    expect(bot.token).toEqual('bot123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh');
    expect(bot.username).toEqual('test_bot_1');
    expect(bot.is_default).toBe(true);
    expect(bot.is_active).toBe(true);
    expect(bot.created_at).toBeInstanceOf(Date);
    expect(bot.updated_at).toBeInstanceOf(Date);
  });

  it('should handle bots with null username', async () => {
    // Insert bot with null username
    await db.insert(telegramBotsTable)
      .values(testBot3)
      .execute();

    const result = await getTelegramBots();

    expect(result).toHaveLength(1);
    expect(result[0].username).toBeNull();
    expect(result[0].name).toEqual('Test Bot 3');
  });

  it('should return bots ordered by creation date descending', async () => {
    // Insert bots with slight delay to ensure different timestamps
    await db.insert(telegramBotsTable)
      .values(testBot1)
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(telegramBotsTable)
      .values(testBot2)
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(telegramBotsTable)
      .values(testBot3)
      .execute();

    const result = await getTelegramBots();

    expect(result).toHaveLength(3);
    
    // Verify descending order by creation date
    expect(result[0].name).toEqual('Test Bot 3'); // Most recent
    expect(result[1].name).toEqual('Test Bot 2'); // Middle
    expect(result[2].name).toEqual('Test Bot 1'); // Oldest

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return bots with different active statuses', async () => {
    // Insert bots with different active statuses
    await db.insert(telegramBotsTable)
      .values([testBot1, testBot2]) // active: true, false
      .execute();

    const result = await getTelegramBots();

    expect(result).toHaveLength(2);
    
    const activeBot = result.find(bot => bot.is_active === true);
    const inactiveBot = result.find(bot => bot.is_active === false);

    expect(activeBot).toBeDefined();
    expect(inactiveBot).toBeDefined();
    expect(activeBot!.name).toEqual('Test Bot 1');
    expect(inactiveBot!.name).toEqual('Test Bot 2');
  });

  it('should return bots with different default statuses', async () => {
    // Insert bots with different default statuses
    await db.insert(telegramBotsTable)
      .values([testBot1, testBot2]) // default: true, false
      .execute();

    const result = await getTelegramBots();

    expect(result).toHaveLength(2);
    
    const defaultBot = result.find(bot => bot.is_default === true);
    const nonDefaultBot = result.find(bot => bot.is_default === false);

    expect(defaultBot).toBeDefined();
    expect(nonDefaultBot).toBeDefined();
    expect(defaultBot!.name).toEqual('Test Bot 1');
    expect(nonDefaultBot!.name).toEqual('Test Bot 2');
  });
});