import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input for creating a new user
const newUserInput: CreateUserInput = {
  telegram_id: '123456789',
  username: 'testuser',
  first_name: 'John',
  last_name: 'Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  is_admin: false
};

// Test input for creating an admin user
const adminUserInput: CreateUserInput = {
  telegram_id: '987654321',
  username: 'adminuser',
  first_name: 'Admin',
  last_name: 'User',
  avatar_url: 'https://example.com/admin.jpg',
  is_admin: true
};

// Test input with nullable fields
const minimalUserInput: CreateUserInput = {
  telegram_id: '555666777',
  username: null,
  first_name: null,
  last_name: null,
  avatar_url: null,
  is_admin: false
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new user', async () => {
    const result = await createUser(newUserInput);

    // Verify returned user data
    expect(result.telegram_id).toEqual('123456789');
    expect(result.username).toEqual('testuser');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.is_admin).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(newUserInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].telegram_id).toEqual('123456789');
    expect(users[0].username).toEqual('testuser');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(users[0].is_admin).toEqual(false);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create admin user with proper permissions', async () => {
    const result = await createUser(adminUserInput);

    expect(result.is_admin).toEqual(true);
    expect(result.telegram_id).toEqual('987654321');
    expect(result.username).toEqual('adminuser');

    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.telegram_id, '987654321'))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].is_admin).toEqual(true);
  });

  it('should create user with nullable fields', async () => {
    const result = await createUser(minimalUserInput);

    expect(result.telegram_id).toEqual('555666777');
    expect(result.username).toBeNull();
    expect(result.first_name).toBeNull();
    expect(result.last_name).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.is_admin).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing user when telegram_id already exists', async () => {
    // First, create a user
    const originalResult = await createUser(newUserInput);
    const originalId = originalResult.id;
    const originalCreatedAt = originalResult.created_at;

    // Try to create user with same telegram_id but different data
    const updateInput: CreateUserInput = {
      telegram_id: '123456789', // Same telegram_id
      username: 'updateduser',
      first_name: 'Jane',
      last_name: 'Smith',
      avatar_url: 'https://example.com/new-avatar.jpg',
      is_admin: false
    };

    const updatedResult = await createUser(updateInput);

    // Should have same ID and created_at, but updated fields
    expect(updatedResult.id).toEqual(originalId);
    expect(updatedResult.created_at).toEqual(originalCreatedAt);
    expect(updatedResult.telegram_id).toEqual('123456789');
    expect(updatedResult.username).toEqual('updateduser');
    expect(updatedResult.first_name).toEqual('Jane');
    expect(updatedResult.last_name).toEqual('Smith');
    expect(updatedResult.avatar_url).toEqual('https://example.com/new-avatar.jpg');
    expect(updatedResult.updated_at).not.toEqual(originalCreatedAt);
    
    // Verify in database - should still be only one user
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.telegram_id, '123456789'))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('updateduser');
    expect(users[0].first_name).toEqual('Jane');
    expect(users[0].last_name).toEqual('Smith');
  });

  it('should handle updating user to null values', async () => {
    // First create user with full data
    await createUser(newUserInput);

    // Update with null values
    const updateInput: CreateUserInput = {
      telegram_id: '123456789',
      username: null,
      first_name: null,
      last_name: null,
      avatar_url: null,
      is_admin: false
    };

    const result = await createUser(updateInput);

    expect(result.telegram_id).toEqual('123456789');
    expect(result.username).toBeNull();
    expect(result.first_name).toBeNull();
    expect(result.last_name).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.is_admin).toEqual(false);
  });

  it('should handle multiple users with different telegram_ids', async () => {
    // Create multiple users
    const user1 = await createUser(newUserInput);
    const user2 = await createUser(adminUserInput);
    const user3 = await createUser(minimalUserInput);

    // Verify all three users exist with unique IDs
    expect(user1.id).not.toEqual(user2.id);
    expect(user2.id).not.toEqual(user3.id);
    expect(user1.id).not.toEqual(user3.id);

    expect(user1.telegram_id).toEqual('123456789');
    expect(user2.telegram_id).toEqual('987654321');
    expect(user3.telegram_id).toEqual('555666777');

    // Verify all users are in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(3);
  });
});