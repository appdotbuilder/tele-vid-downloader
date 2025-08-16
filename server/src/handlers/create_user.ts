import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if user already exists by telegram_id
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.telegram_id, input.telegram_id))
      .execute();

    if (existingUser.length > 0) {
      // User exists, update their information
      const updatedUser = await db.update(usersTable)
        .set({
          username: input.username,
          first_name: input.first_name,
          last_name: input.last_name,
          avatar_url: input.avatar_url,
          updated_at: new Date()
        })
        .where(eq(usersTable.telegram_id, input.telegram_id))
        .returning()
        .execute();

      return updatedUser[0];
    } else {
      // User doesn't exist, create new one
      const newUser = await db.insert(usersTable)
        .values({
          telegram_id: input.telegram_id,
          username: input.username,
          first_name: input.first_name,
          last_name: input.last_name,
          avatar_url: input.avatar_url,
          is_admin: input.is_admin
        })
        .returning()
        .execute();

      return newUser[0];
    }
  } catch (error) {
    console.error('User creation/update failed:', error);
    throw error;
  }
};