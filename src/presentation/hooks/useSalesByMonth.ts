import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SaleRepository } from '@infra/database/repositories/sale-repository';

export function useSalesByMonth(year: number, month: number) {
  const repo = useMemo(() => new SaleRepository(), []);
  return useQuery({
    queryKey: ['sales', year, month],
    queryFn: () => repo.findByMonth(year, month),
    staleTime: 1000 * 60 * 2,
  });
}
