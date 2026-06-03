import type { ISettingsRepository } from '@application/ports/i-settings-repository';
import { Settings } from '@domain/entities/settings';
import type { AppSettings } from '@domain/entities/settings';

export class SettingsService {
  constructor(private settingsRepo: ISettingsRepository) {}

  async get(): Promise<AppSettings> {
    return this.settingsRepo.getAppSettings();
  }

  async update(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.settingsRepo.getAppSettings();
    const merged = Settings.merge(current, updates);
    await this.settingsRepo.saveAppSettings(merged);
    return merged;
  }
}
