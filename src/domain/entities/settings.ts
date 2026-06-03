export interface AppSettings {
  askReturnStockOnDelete: boolean;
}

export class Settings {
  private constructor() {}

  static defaultSettings(): AppSettings {
    return {
      askReturnStockOnDelete: true,
    };
  }

  static fromJson(json: string | null): AppSettings {
    if (!json) return Settings.defaultSettings();
    try {
      return JSON.parse(json);
    } catch {
      return Settings.defaultSettings();
    }
  }

  static toJson(settings: AppSettings): string {
    return JSON.stringify(settings);
  }

  static merge(current: AppSettings, updates: Partial<AppSettings>): AppSettings {
    return { ...current, ...updates };
  }
}
