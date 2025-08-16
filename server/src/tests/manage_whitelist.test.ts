import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, whitelistTable } from '../db/schema';
import { type CreateWhitelistInput } from '../schema';
import { addToWhitelist, removeFromWhitelist, getWhitelist, isWhitelisted } from '../handlers/manage_whitelist';
import { eq } from 'drizzle-orm';

describe('manage_whitelist', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup helper
  const createTestUser = async (telegramId: string) => {
    const result = await db.insert(usersTable)
      .values({
        telegram_id: telegramId,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        avatar_url: null,
        is_admin: true
      })
      .returning()
      .execute();
    return result[0];
  };

  describe('addToWhitelist', () => {
    it('should add a new telegram ID to whitelist', async () => {
      const adminUser = await createTestUser('admin123');
      
      const input: CreateWhitelistInput = {
        telegram_id: 'user456',
        added_by_user_id: adminUser.id
      };

      const result = await addToWhitelist(input);

      expect(result.telegram_id).toEqual('user456');
      expect(result.added_by_user_id).toEqual(adminUser.id);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);

      // Verify it was saved to database
      const saved = await db.select()
        .from(whitelistTable)
        .where(eq(whitelistTable.id, result.id))
        .execute();

      expect(saved).toHaveLength(1);
      expect(saved[0].telegram_id).toEqual('user456');
    });

    it('should return existing entry when telegram ID already whitelisted', async () => {
      const adminUser = await createTestUser('admin123');
      
      // Create initial whitelist entry
      const existing = await db.insert(whitelistTable)
        .values({
          telegram_id: 'user456',
          added_by_user_id: adminUser.id
        })
        .returning()
        .execute();

      const input: CreateWhitelistInput = {
        telegram_id: 'user456',
        added_by_user_id: adminUser.id
      };

      const result = await addToWhitelist(input);

      // Should return the existing entry, not create a new one
      expect(result.id).toEqual(existing[0].id);
      expect(result.telegram_id).toEqual('user456');

      // Verify no duplicate was created
      const allEntries = await db.select()
        .from(whitelistTable)
        .where(eq(whitelistTable.telegram_id, 'user456'))
        .execute();

      expect(allEntries).toHaveLength(1);
    });

    it('should throw error when adding user does not exist', async () => {
      const input: CreateWhitelistInput = {
        telegram_id: 'user456',
        added_by_user_id: 999 // Non-existent user ID
      };

      await expect(addToWhitelist(input)).rejects.toThrow(/User with ID 999 does not exist/);
    });

    it('should handle different telegram ID formats', async () => {
      const adminUser = await createTestUser('admin123');
      
      const testCases = [
        '12345',
        'username123',
        '@username',
        'very_long_telegram_id_12345'
      ];

      for (const telegramId of testCases) {
        const input: CreateWhitelistInput = {
          telegram_id: telegramId,
          added_by_user_id: adminUser.id
        };

        const result = await addToWhitelist(input);
        expect(result.telegram_id).toEqual(telegramId);
      }

      // Verify all were saved
      const allEntries = await getWhitelist();
      expect(allEntries).toHaveLength(testCases.length);
    });
  });

  describe('removeFromWhitelist', () => {
    it('should remove existing telegram ID from whitelist', async () => {
      const adminUser = await createTestUser('admin123');
      
      // Add to whitelist first
      await db.insert(whitelistTable)
        .values({
          telegram_id: 'user456',
          added_by_user_id: adminUser.id
        })
        .execute();

      const result = await removeFromWhitelist('user456');

      expect(result).toBe(true);

      // Verify it was removed
      const remaining = await db.select()
        .from(whitelistTable)
        .where(eq(whitelistTable.telegram_id, 'user456'))
        .execute();

      expect(remaining).toHaveLength(0);
    });

    it('should return false when telegram ID not in whitelist', async () => {
      const result = await removeFromWhitelist('nonexistent');

      expect(result).toBe(false);
    });

    it('should only remove the specified telegram ID', async () => {
      const adminUser = await createTestUser('admin123');
      
      // Add multiple entries
      await db.insert(whitelistTable)
        .values([
          { telegram_id: 'user1', added_by_user_id: adminUser.id },
          { telegram_id: 'user2', added_by_user_id: adminUser.id },
          { telegram_id: 'user3', added_by_user_id: adminUser.id }
        ])
        .execute();

      const result = await removeFromWhitelist('user2');

      expect(result).toBe(true);

      // Verify only user2 was removed
      const remaining = await getWhitelist();
      expect(remaining).toHaveLength(2);
      
      const telegramIds = remaining.map(entry => entry.telegram_id);
      expect(telegramIds).toContain('user1');
      expect(telegramIds).toContain('user3');
      expect(telegramIds).not.toContain('user2');
    });
  });

  describe('getWhitelist', () => {
    it('should return empty array when no whitelist entries exist', async () => {
      const result = await getWhitelist();

      expect(result).toEqual([]);
    });

    it('should return all whitelist entries', async () => {
      const adminUser = await createTestUser('admin123');
      const anotherUser = await createTestUser('user789');
      
      // Add multiple entries
      await db.insert(whitelistTable)
        .values([
          { telegram_id: 'user1', added_by_user_id: adminUser.id },
          { telegram_id: 'user2', added_by_user_id: adminUser.id },
          { telegram_id: 'user3', added_by_user_id: anotherUser.id }
        ])
        .execute();

      const result = await getWhitelist();

      expect(result).toHaveLength(3);
      
      // Check that all expected fields are present
      result.forEach(entry => {
        expect(entry.id).toBeDefined();
        expect(entry.telegram_id).toBeDefined();
        expect(entry.added_by_user_id).toBeDefined();
        expect(entry.created_at).toBeInstanceOf(Date);
      });

      const telegramIds = result.map(entry => entry.telegram_id);
      expect(telegramIds).toContain('user1');
      expect(telegramIds).toContain('user2');
      expect(telegramIds).toContain('user3');
    });

    it('should include added_by_user_id information', async () => {
      const adminUser = await createTestUser('admin123');
      
      await db.insert(whitelistTable)
        .values({
          telegram_id: 'user456',
          added_by_user_id: adminUser.id
        })
        .execute();

      const result = await getWhitelist();

      expect(result).toHaveLength(1);
      expect(result[0].added_by_user_id).toEqual(adminUser.id);
    });
  });

  describe('isWhitelisted', () => {
    it('should return true for whitelisted telegram ID', async () => {
      const adminUser = await createTestUser('admin123');
      
      await db.insert(whitelistTable)
        .values({
          telegram_id: 'user456',
          added_by_user_id: adminUser.id
        })
        .execute();

      const result = await isWhitelisted('user456');

      expect(result).toBe(true);
    });

    it('should return false for non-whitelisted telegram ID', async () => {
      const result = await isWhitelisted('nonexistent');

      expect(result).toBe(false);
    });

    it('should be case sensitive', async () => {
      const adminUser = await createTestUser('admin123');
      
      await db.insert(whitelistTable)
        .values({
          telegram_id: 'User456',
          added_by_user_id: adminUser.id
        })
        .execute();

      const result1 = await isWhitelisted('User456');
      const result2 = await isWhitelisted('user456');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should handle special characters in telegram ID', async () => {
      const adminUser = await createTestUser('admin123');
      
      const specialId = '@user_123-test';
      await db.insert(whitelistTable)
        .values({
          telegram_id: specialId,
          added_by_user_id: adminUser.id
        })
        .execute();

      const result = await isWhitelisted(specialId);

      expect(result).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete whitelist management workflow', async () => {
      const adminUser = await createTestUser('admin123');
      
      // Start with empty whitelist
      let whitelist = await getWhitelist();
      expect(whitelist).toHaveLength(0);

      // Add user to whitelist
      const input: CreateWhitelistInput = {
        telegram_id: 'newuser456',
        added_by_user_id: adminUser.id
      };

      await addToWhitelist(input);

      // Verify user is now whitelisted
      let isListed = await isWhitelisted('newuser456');
      expect(isListed).toBe(true);

      // Check whitelist contains the user
      whitelist = await getWhitelist();
      expect(whitelist).toHaveLength(1);
      expect(whitelist[0].telegram_id).toEqual('newuser456');

      // Remove user from whitelist
      const removed = await removeFromWhitelist('newuser456');
      expect(removed).toBe(true);

      // Verify user is no longer whitelisted
      isListed = await isWhitelisted('newuser456');
      expect(isListed).toBe(false);

      // Check whitelist is empty again
      whitelist = await getWhitelist();
      expect(whitelist).toHaveLength(0);
    });

    it('should handle multiple users adding to whitelist', async () => {
      const admin1 = await createTestUser('admin1');
      const admin2 = await createTestUser('admin2');

      // Both admins add different users
      await addToWhitelist({
        telegram_id: 'user1',
        added_by_user_id: admin1.id
      });

      await addToWhitelist({
        telegram_id: 'user2',
        added_by_user_id: admin2.id
      });

      const whitelist = await getWhitelist();
      expect(whitelist).toHaveLength(2);

      // Verify added_by information is preserved
      const user1Entry = whitelist.find(entry => entry.telegram_id === 'user1');
      const user2Entry = whitelist.find(entry => entry.telegram_id === 'user2');

      expect(user1Entry?.added_by_user_id).toEqual(admin1.id);
      expect(user2Entry?.added_by_user_id).toEqual(admin2.id);
    });
  });
});