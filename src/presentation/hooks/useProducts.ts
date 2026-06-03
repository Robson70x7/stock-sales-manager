import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ProductRepository } from '@infra/database/repositories/product-repository';

export function useProducts() {
  const repo = useMemo(() => new ProductRepository(), []);
  return useQuery({
    queryKey: ['products'],
    queryFn: () => repo.findAll(),
    staleTime: 1000 * 60 * 2,
  });
}
