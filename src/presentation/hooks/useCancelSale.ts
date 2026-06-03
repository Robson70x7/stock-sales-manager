import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SaleService } from '@application/services/sale-service';
import { SaleRepository } from '@infra/database/repositories/sale-repository';
import { ProductRepository } from '@infra/database/repositories/product-repository';
import { StockMovementRepository } from '@infra/database/repositories/stock-movement-repository';

export function useCancelSale() {
  const queryClient = useQueryClient();
  const saleService = useMemo(
    () => new SaleService(new SaleRepository(), new ProductRepository(), new StockMovementRepository()),
    [],
  );

  return useMutation({
    mutationFn: ({ id, returnStock }: { id: string; returnStock?: boolean }) =>
      saleService.cancel(id, returnStock),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', id] });
    },
  });
}
