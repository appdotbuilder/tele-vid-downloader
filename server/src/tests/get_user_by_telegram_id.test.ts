import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUserByTelegramId } from '../handlers/get_user_by_telegram_id';

// Test input for creating a user
const testUserInput: CreateUserInput = {
  telegram_id: '123456789',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  avatar_url: 'https://example.com/avatar.jpg',
  is_admin: false
};

describe('getUserByTelegramId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when telegram_id exists', async () => {
    // Create a user first
    const insertResult = await db.insert(usersTable)
      .values({
        telegram_id: testUserInput.telegram_id,
        username: testUserInput.username,
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        avatar_url: testUserInput.avatar_url,
        is_admin: testUserInput.is_admin
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Test the handler
    const result = await getUserByTelegramId('123456789');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.telegram_id).toEqual('123456789');
    expect(result!.username).toEqual('testuser');
    expect(result!.first_name).toEqual('Test');
    expect(result!.last_name).toEqual('User');
    expect(result!.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result!.is_admin).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when telegram_id does not exist', async () => {
    const result = await getUserByTelegramId('nonexistent_id');

    expect(result).toBeNull();
  });

  it('should return correct user when multiple users exist', async () => {
    // Create multiple users
    await db.insert(usersTable)
      .values([
        {
          telegram_id: '111111111',
          username: 'user1',
          first_name: 'User',
          last_name: 'One',
          avatar_url: null,
          is_admin: false
        },
        {
          telegram_id: '222222222',
          username: 'user2',
          first_name: 'User',
          last_name: 'Two',
          avatar_url: null,
          is_admin: true
        },
        {
          telegram_id: '333333333',
          username: null,
          first_name: 'User',
          last_name: 'Three',
          avatar_url: null,
          is_admin: false
        }
      ])
      .execute();

    // Test finding the middle user
    const result = await getUserByTelegramId('222222222');

    expect(result).not.toBeNull();
    expect(result!.telegram_id).toEqual('222222222');
    expect(result!.username).toEqual('user2');
    expect(result!.first_name).toEqual('User');
    expect(result!.last_name).toEqual('Two');
    expect(result!.is_admin).toBe(true);
  });

  it('should handle user with null fields correctly', async () => {
    // Create user with null optional fields
    await db.insert(usersTable)
      .values({
        telegram_id: '999999999',
        username: null,
        first_name: null,
        last_name: null,
        avatar_url: null,
        is_admin: false
      })
      .execute();

    const result = await getUserByTelegramId('999999999');

    expect(result).not.toBeNull();
    expect(result!.telegram_id).toEqual('999999999');
    expect(result!.username).toBeNull();
    expect(result!.first_name).toBeNull();
    expect(result!.last_name).toBeNull();
    expect(result!.avatar_url).toBeNull();
    expect(result!.is_admin).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle empty string telegram_id', async () => {
    const result = await getUserByTelegramId('');

    expect(result).toBeNull();
  });

  it('should be case sensitive for telegram_id', async () => {
    // Create user with specific telegram_id
    await db.insert(usersTable)
      .values({
        telegram_id: 'CaseSensitiveId',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        avatar_url: null,
        is_admin: false
      })
      .execute();

    // Test exact match
    const exactResult = await getUserByTelegramId('CaseSensitiveId');
    expect(exactResult).not.toBeNull();
    expect(exactResult!.telegram_id).toEqual('CaseSensitiveId');

    // Test different case - should not match
    const differentCaseResult = await getUserByTelegramId('casesensitiveid');
    expect(differentCaseResult).toBeNull();
  });
});