import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { appSettingsTable } from '../db/schema';
import { getAppSettings, getAppSettingByKey } from '../handlers/get_app_settings';
import { eq } from 'drizzle-orm';

describe('getAppSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no settings exist', async () => {
    const result = await getAppSettings();

    expect(result).toEqual([]);
  });

  it('should return all app settings', async () => {
    // Create test settings
    await db.insert(appSettingsTable).values([
      {
        key: 'theme',
        value: 'dark'
      },
      {
        key: 'logo',
        value: 'https://example.com/logo.png'
      },
      {
        key: 'public_access',
        value: 'true'
      }
    ]).execute();

    const result = await getAppSettings();

    expect(result).toHaveLength(3);
    
    // Check each setting exists
    const themeSettings = result.find(s => s.key === 'theme');
    const logoSettings = result.find(s => s.key === 'logo');
    const publicAccessSettings = result.find(s => s.key === 'public_access');

    expect(themeSettings).toBeDefined();
    expect(themeSettings!.value).toBe('dark');
    expect(themeSettings!.created_at).toBeInstanceOf(Date);
    expect(themeSettings!.updated_at).toBeInstanceOf(Date);

    expect(logoSettings).toBeDefined();
    expect(logoSettings!.value).toBe('https://example.com/logo.png');

    expect(publicAccessSettings).toBeDefined();
    expect(publicAccessSettings!.value).toBe('true');
  });

  it('should handle settings with null values', async () => {
    // Create setting with null value
    await db.insert(appSettingsTable).values({
      key: 'disabled_feature',
      value: null
    }).execute();

    const result = await getAppSettings();

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('disabled_feature');
    expect(result[0].value).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return settings ordered by database insertion order', async () => {
    // Insert settings in specific order
    await db.insert(appSettingsTable).values({
      key: 'first_setting',
      value: 'first'
    }).execute();

    await db.insert(appSettingsTable).values({
      key: 'second_setting', 
      value: 'second'
    }).execute();

    const result = await getAppSettings();

    expect(result).toHaveLength(2);
    // Settings should maintain insertion order (by id)
    expect(result[0].key).toBe('first_setting');
    expect(result[1].key).toBe('second_setting');
  });
});

describe('getAppSettingByKey', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when setting does not exist', async () => {
    const result = await getAppSettingByKey('nonexistent');

    expect(result).toBeNull();
  });

  it('should return specific app setting by key', async () => {
    // Create multiple settings
    await db.insert(appSettingsTable).values([
      {
        key: 'theme',
        value: 'dark'
      },
      {
        key: 'logo',
        value: 'https://example.com/logo.png'
      },
      {
        key: 'public_access',
        value: 'true'
      }
    ]).execute();

    const result = await getAppSettingByKey('theme');

    expect(result).not.toBeNull();
    expect(result!.key).toBe('theme');
    expect(result!.value).toBe('dark');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return setting with null value', async () => {
    await db.insert(appSettingsTable).values({
      key: 'disabled_feature',
      value: null
    }).execute();

    const result = await getAppSettingByKey('disabled_feature');

    expect(result).not.toBeNull();
    expect(result!.key).toBe('disabled_feature');
    expect(result!.value).toBeNull();
  });

  it('should handle case-sensitive key lookup', async () => {
    await db.insert(appSettingsTable).values({
      key: 'CaseSensitive',
      value: 'test'
    }).execute();

    const result1 = await getAppSettingByKey('CaseSensitive');
    const result2 = await getAppSettingByKey('casesensitive');

    expect(result1).not.toBeNull();
    expect(result1!.key).toBe('CaseSensitive');
    
    expect(result2).toBeNull();
  });

  it('should return only the first matching setting if duplicates exist', async () => {
    // Create a setting
    await db.insert(appSettingsTable).values({
      key: 'duplicate_test',
      value: 'first'
    }).execute();

    // Verify there's exactly one setting
    const allSettings = await db.select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, 'duplicate_test'))
      .execute();

    expect(allSettings).toHaveLength(1);

    const result = await getAppSettingByKey('duplicate_test');

    expect(result).not.toBeNull();
    expect(result!.key).toBe('duplicate_test');
    expect(result!.value).toBe('first');
  });

  it('should handle special characters in keys', async () => {
    const specialKey = 'setting-with_special.chars@123';
    
    await db.insert(appSettingsTable).values({
      key: specialKey,
      value: 'special_value'
    }).execute();

    const result = await getAppSettingByKey(specialKey);

    expect(result).not.toBeNull();
    expect(result!.key).toBe(specialKey);
    expect(result!.value).toBe('special_value');
  });

  it('should handle empty string key lookup', async () => {
    await db.insert(appSettingsTable).values({
      key: '',
      value: 'empty_key_value'
    }).execute();

    const result = await getAppSettingByKey('');

    expect(result).not.toBeNull();
    expect(result!.key).toBe('');
    expect(result!.value).toBe('empty_key_value');
  });
});