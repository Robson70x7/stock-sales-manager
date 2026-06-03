import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ClientRepository } from '@infra/database/repositories/client-repository';

export function useClients() {
  const repo = useMemo(() => new ClientRepository(), []);
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => repo.findAll(),
    staleTime: 1000 * 60 * 2,
  });
}
