import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SaleRepository } from '@infra/database/repositories/sale-repository';

export function useAllSales() {
  const repo = useMemo(() => new SaleRepository(), []);
  return useQuery({
    queryKey: ['sales', 'all'],
    queryFn: () => repo.findAll(),
    staleTime: 1000 * 60 * 2,
  });
}
