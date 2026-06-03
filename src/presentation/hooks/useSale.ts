import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SaleRepository } from '@infra/database/repositories/sale-repository';

export function useSale(id: string) {
  const repo = useMemo(() => new SaleRepository(), []);
  return useQuery({
    queryKey: ['sale', id],
    queryFn: () => repo.findById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}
