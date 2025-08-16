import { type CreateUserInput, type User } from '../schema';

export async function createUser(input: CreateUserInput): Promise<User> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is creating a new user after Telegram OAuth authentication.
    // It should check if user already exists by telegram_id and update or create accordingly.
    return Promise.resolve({
        id: 0, // Placeholder ID
        telegram_id: input.telegram_id,
        username: input.username,
        first_name: input.first_name,
        last_name: input.last_name,
        avatar_url: input.avatar_url,
        is_admin: input.is_admin,
        created_at: new Date(),
        updated_at: new Date()
    } as User);
}