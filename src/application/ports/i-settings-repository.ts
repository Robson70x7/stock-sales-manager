import type { AppSettings } from '@domain/entities/settings';

export interface ISettingsRepository {
  findAll(): Promise<Record<string, string>>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  getAppSettings(): Promise<AppSettings>;
  saveAppSettings(settings: AppSettings): Promise<void>;
}
