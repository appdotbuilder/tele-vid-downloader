import { db } from '../db';
import { appSettingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateAppSettingsInput, type AppSettings } from '../schema';

export const updateAppSettings = async (input: UpdateAppSettingsInput): Promise<AppSettings> => {
  try {
    // First, try to find existing setting
    const existing = await db.select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, input.key))
      .execute();

    if (existing.length > 0) {
      // Update existing setting
      const result = await db.update(appSettingsTable)
        .set({
          value: input.value,
          updated_at: new Date()
        })
        .where(eq(appSettingsTable.key, input.key))
        .returning()
        .execute();

      return result[0];
    } else {
      // Create new setting
      const result = await db.insert(appSettingsTable)
        .values({
          key: input.key,
          value: input.value
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('App settings update/create failed:', error);
    throw error;
  }
};