import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ClientRepository } from '@infra/database/repositories/client-repository';

export function useClient(id: string) {
  const repo = useMemo(() => new ClientRepository(), []);
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => repo.findById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}
