import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { appSettingsTable } from '../db/schema';
import { type UpdateAppSettingsInput } from '../schema';
import { updateAppSettings } from '../handlers/update_app_settings';
import { eq } from 'drizzle-orm';

describe('updateAppSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new app setting when key does not exist', async () => {
    const input: UpdateAppSettingsInput = {
      key: 'theme',
      value: 'dark'
    };

    const result = await updateAppSettings(input);

    // Verify returned data
    expect(result.key).toEqual('theme');
    expect(result.value).toEqual('dark');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save new setting to database', async () => {
    const input: UpdateAppSettingsInput = {
      key: 'logo_url',
      value: 'https://example.com/logo.png'
    };

    const result = await updateAppSettings(input);

    // Verify in database
    const settings = await db.select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.id, result.id))
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].key).toEqual('logo_url');
    expect(settings[0].value).toEqual('https://example.com/logo.png');
    expect(settings[0].created_at).toBeInstanceOf(Date);
    expect(settings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update existing app setting when key exists', async () => {
    // First, create a setting
    const initialInput: UpdateAppSettingsInput = {
      key: 'public_access',
      value: 'false'
    };

    const initialResult = await updateAppSettings(initialInput);
    const initialUpdatedAt = initialResult.updated_at;

    // Wait a moment to ensure updated_at timestamp will be different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Now update the same setting
    const updateInput: UpdateAppSettingsInput = {
      key: 'public_access',
      value: 'true'
    };

    const updateResult = await updateAppSettings(updateInput);

    // Verify the setting was updated, not duplicated
    expect(updateResult.id).toEqual(initialResult.id);
    expect(updateResult.key).toEqual('public_access');
    expect(updateResult.value).toEqual('true');
    expect(updateResult.created_at).toEqual(initialResult.created_at);
    expect(updateResult.updated_at.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
  });

  it('should verify only one record exists after update', async () => {
    // Create initial setting
    await updateAppSettings({
      key: 'max_file_size',
      value: '100MB'
    });

    // Update the same setting
    await updateAppSettings({
      key: 'max_file_size',
      value: '500MB'
    });

    // Verify only one record exists
    const settings = await db.select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, 'max_file_size'))
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].value).toEqual('500MB');
  });

  it('should handle null values', async () => {
    const input: UpdateAppSettingsInput = {
      key: 'maintenance_message',
      value: null
    };

    const result = await updateAppSettings(input);

    expect(result.key).toEqual('maintenance_message');
    expect(result.value).toBeNull();
  });

  it('should update null value to string and back', async () => {
    // Create with null value
    const nullInput: UpdateAppSettingsInput = {
      key: 'temp_setting',
      value: null
    };

    const nullResult = await updateAppSettings(nullInput);
    expect(nullResult.value).toBeNull();

    // Update to string value
    const stringInput: UpdateAppSettingsInput = {
      key: 'temp_setting',
      value: 'enabled'
    };

    const stringResult = await updateAppSettings(stringInput);
    expect(stringResult.id).toEqual(nullResult.id);
    expect(stringResult.value).toEqual('enabled');

    // Update back to null
    const backToNullInput: UpdateAppSettingsInput = {
      key: 'temp_setting',
      value: null
    };

    const backToNullResult = await updateAppSettings(backToNullInput);
    expect(backToNullResult.id).toEqual(nullResult.id);
    expect(backToNullResult.value).toBeNull();
  });

  it('should handle multiple different settings', async () => {
    const settings = [
      { key: 'theme', value: 'light' },
      { key: 'timezone', value: 'UTC' },
      { key: 'debug_mode', value: 'false' },
      { key: 'api_rate_limit', value: '1000' }
    ];

    const results = [];
    for (const setting of settings) {
      const result = await updateAppSettings(setting);
      results.push(result);
    }

    // Verify all settings were created
    expect(results).toHaveLength(4);
    
    // Verify each setting has unique ID and correct values
    const uniqueIds = new Set(results.map(r => r.id));
    expect(uniqueIds.size).toEqual(4);

    for (let i = 0; i < settings.length; i++) {
      expect(results[i].key).toEqual(settings[i].key);
      expect(results[i].value).toEqual(settings[i].value);
    }

    // Verify all settings exist in database
    const allSettings = await db.select()
      .from(appSettingsTable)
      .execute();

    expect(allSettings).toHaveLength(4);
  });

  it('should handle empty string values', async () => {
    const input: UpdateAppSettingsInput = {
      key: 'empty_setting',
      value: ''
    };

    const result = await updateAppSettings(input);

    expect(result.key).toEqual('empty_setting');
    expect(result.value).toEqual('');
  });
});