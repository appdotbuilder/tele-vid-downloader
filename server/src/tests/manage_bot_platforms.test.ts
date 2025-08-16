import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { botPlatformsTable, telegramBotsTable, usersTable } from '../db/schema';
import { type CreateBotPlatformInput } from '../schema';
import { 
  assignBotToPlatform, 
  removeBotFromPlatform, 
  getBotForPlatform, 
  getBotPlatformAssignments 
} from '../handlers/manage_bot_platforms';
import { eq, and } from 'drizzle-orm';

describe('Bot Platform Management', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        telegram_id: 'user123',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        is_admin: true
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create a test bot
  const createTestBot = async (isDefault = false, isActive = true) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const uniqueId = `${timestamp}_${random}`;
    
    const result = await db.insert(telegramBotsTable)
      .values({
        name: isDefault ? `Default Bot ${uniqueId}` : `Test Bot ${uniqueId}`,
        token: isDefault ? `default_token_${uniqueId}` : `test_token_${uniqueId}`,
        username: isDefault ? `defaultbot${uniqueId}` : `testbot${uniqueId}`,
        is_default: isDefault,
        is_active: isActive
      })
      .returning()
      .execute();
    return result[0];
  };

  describe('assignBotToPlatform', () => {
    it('should assign a bot to a platform', async () => {
      const bot = await createTestBot();
      const input: CreateBotPlatformInput = {
        bot_id: bot.id,
        platform: 'youtube'
      };

      const result = await assignBotToPlatform(input);

      expect(result.bot_id).toEqual(bot.id);
      expect(result.platform).toEqual('youtube');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save assignment to database', async () => {
      const bot = await createTestBot();
      const input: CreateBotPlatformInput = {
        bot_id: bot.id,
        platform: 'instagram'
      };

      const result = await assignBotToPlatform(input);

      const assignments = await db.select()
        .from(botPlatformsTable)
        .where(eq(botPlatformsTable.id, result.id))
        .execute();

      expect(assignments).toHaveLength(1);
      expect(assignments[0].bot_id).toEqual(bot.id);
      expect(assignments[0].platform).toEqual('instagram');
    });

    it('should throw error when bot does not exist', async () => {
      const input: CreateBotPlatformInput = {
        bot_id: 999,
        platform: 'youtube'
      };

      await expect(assignBotToPlatform(input)).rejects.toThrow(/bot with ID 999 not found/i);
    });

    it('should throw error when platform is already assigned', async () => {
      const bot1 = await createTestBot();
      const bot2 = await createTestBot();

      // Assign platform to first bot
      await assignBotToPlatform({
        bot_id: bot1.id,
        platform: 'twitter'
      });

      // Try to assign same platform to second bot
      await expect(assignBotToPlatform({
        bot_id: bot2.id,
        platform: 'twitter'
      })).rejects.toThrow(/platform twitter is already assigned/i);
    });
  });

  describe('removeBotFromPlatform', () => {
    it('should remove bot assignment from platform', async () => {
      const bot = await createTestBot();
      
      // First create an assignment
      await assignBotToPlatform({
        bot_id: bot.id,
        platform: 'doodstream'
      });

      const result = await removeBotFromPlatform(bot.id, 'doodstream');

      expect(result).toBe(true);

      // Verify assignment is removed from database
      const assignments = await db.select()
        .from(botPlatformsTable)
        .where(and(
          eq(botPlatformsTable.bot_id, bot.id),
          eq(botPlatformsTable.platform, 'doodstream')
        ))
        .execute();

      expect(assignments).toHaveLength(0);
    });

    it('should return false when assignment does not exist', async () => {
      const bot = await createTestBot();

      const result = await removeBotFromPlatform(bot.id, 'youtube');

      expect(result).toBe(false);
    });

    it('should only remove specific bot-platform combination', async () => {
      const bot1 = await createTestBot();
      const bot2 = await createTestBot();

      // Create assignments for different platforms
      await assignBotToPlatform({ bot_id: bot1.id, platform: 'youtube' });
      await assignBotToPlatform({ bot_id: bot2.id, platform: 'instagram' });

      // Remove only bot1's assignment
      const result = await removeBotFromPlatform(bot1.id, 'youtube');

      expect(result).toBe(true);

      // Verify bot2's assignment still exists
      const remainingAssignments = await db.select()
        .from(botPlatformsTable)
        .where(eq(botPlatformsTable.bot_id, bot2.id))
        .execute();

      expect(remainingAssignments).toHaveLength(1);
      expect(remainingAssignments[0].platform).toEqual('instagram');
    });
  });

  describe('getBotForPlatform', () => {
    it('should return assigned bot for platform', async () => {
      const bot = await createTestBot();
      
      await assignBotToPlatform({
        bot_id: bot.id,
        platform: 'other'
      });

      const result = await getBotForPlatform('other');

      expect(result).toEqual(bot.id);
    });

    it('should return default bot when no specific assignment exists', async () => {
      const regularBot = await createTestBot(false);
      const defaultBot = await createTestBot(true);

      const result = await getBotForPlatform('youtube');

      expect(result).toEqual(defaultBot.id);
    });

    it('should return null when no assignment and no default bot exists', async () => {
      await createTestBot(false); // Create non-default bot

      const result = await getBotForPlatform('instagram');

      expect(result).toBeNull();
    });

    it('should return null when default bot is inactive', async () => {
      await createTestBot(true, false); // Create inactive default bot

      const result = await getBotForPlatform('twitter');

      expect(result).toBeNull();
    });

    it('should prefer specific assignment over default bot', async () => {
      const defaultBot = await createTestBot(true);
      const specificBot = await createTestBot(false);

      // Assign specific bot to platform
      await assignBotToPlatform({
        bot_id: specificBot.id,
        platform: 'doodstream'
      });

      const result = await getBotForPlatform('doodstream');

      expect(result).toEqual(specificBot.id);
      expect(result).not.toEqual(defaultBot.id);
    });
  });

  describe('getBotPlatformAssignments', () => {
    it('should return empty array when no assignments exist', async () => {
      const result = await getBotPlatformAssignments();

      expect(result).toEqual([]);
    });

    it('should return all bot platform assignments', async () => {
      const bot1 = await createTestBot();
      const bot2 = await createTestBot();

      await assignBotToPlatform({ bot_id: bot1.id, platform: 'youtube' });
      await assignBotToPlatform({ bot_id: bot2.id, platform: 'instagram' });
      await assignBotToPlatform({ bot_id: bot1.id, platform: 'twitter' });

      const result = await getBotPlatformAssignments();

      expect(result).toHaveLength(3);
      
      // Check that all assignments are returned
      const platforms = result.map(a => a.platform);
      expect(platforms).toContain('youtube');
      expect(platforms).toContain('instagram');
      expect(platforms).toContain('twitter');

      // Check bot IDs
      const botIds = result.map(a => a.bot_id);
      expect(botIds).toContain(bot1.id);
      expect(botIds).toContain(bot2.id);
    });

    it('should return assignments with proper structure', async () => {
      const bot = await createTestBot();
      
      await assignBotToPlatform({
        bot_id: bot.id,
        platform: 'other'
      });

      const result = await getBotPlatformAssignments();

      expect(result).toHaveLength(1);
      const assignment = result[0];
      
      expect(assignment.id).toBeDefined();
      expect(assignment.bot_id).toEqual(bot.id);
      expect(assignment.platform).toEqual('other');
      expect(assignment.created_at).toBeInstanceOf(Date);
    });
  });
});