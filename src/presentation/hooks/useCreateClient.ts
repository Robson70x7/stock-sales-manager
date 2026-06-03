import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ClientService } from '@application/services/client-service';
import { ClientRepository } from '@infra/database/repositories/client-repository';
import type { CreateClientInput } from '@domain/entities/client';

export function useCreateClient() {
  const queryClient = useQueryClient();
  const clientService = useMemo(() => new ClientService(new ClientRepository()), []);

  return useMutation({
    mutationFn: (input: CreateClientInput) => clientService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
