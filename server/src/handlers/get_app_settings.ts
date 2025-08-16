import { db } from '../db';
import { appSettingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type AppSettings } from '../schema';

export async function getAppSettings(): Promise<AppSettings[]> {
  try {
    const results = await db.select()
      .from(appSettingsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch app settings:', error);
    throw error;
  }
}

export async function getAppSettingByKey(key: string): Promise<AppSettings | null> {
  try {
    const results = await db.select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, key))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch app setting by key:', error);
    throw error;
  }
}