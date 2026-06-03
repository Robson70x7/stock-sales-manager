import * as db from '@infra/database/db';
import { Settings } from '@domain/entities/settings';
import type { AppSettings } from '@domain/entities/settings';
import type { ISettingsRepository } from '@application/ports/i-settings-repository';

export class SettingsRepository implements ISettingsRepository {
  async findAll(): Promise<Record<string, string>> {
    return db.getAllSettings();
  }

  async get(key: string): Promise<string | null> {
    return db.getSetting(key);
  }

  async set(key: string, value: string): Promise<void> {
    await db.saveSetting(key, value);
  }

  async getAppSettings(): Promise<AppSettings> {
    const settings = await db.getAllSettings();
    return Settings.fromJson(settings['app_settings'] ?? null);
  }

  async saveAppSettings(appSettings: AppSettings): Promise<void> {
    await db.saveSetting('app_settings', Settings.toJson(appSettings));
  }
}
