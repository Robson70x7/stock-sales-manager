import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ProductRepository } from '@infra/database/repositories/product-repository';

export function useProduct(id: string) {
  const repo = useMemo(() => new ProductRepository(), []);
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => repo.findById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}
