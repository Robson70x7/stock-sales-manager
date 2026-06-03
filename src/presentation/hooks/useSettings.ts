import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SettingsRepository } from '@infra/database/repositories/settings-repository';
import { SettingsService } from '@application/services/settings-service';
import type { AppSettings } from '@domain/entities/settings';

export function useSettings() {
  const repo = useMemo(() => new SettingsRepository(), []);
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => repo.getAppSettings(),
    staleTime: Infinity,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const settingsService = useMemo(() => new SettingsService(new SettingsRepository()), []);

  return useMutation({
    mutationFn: (newSettings: Partial<AppSettings>) => settingsService.update(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
