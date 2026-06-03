import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SaleService } from '@application/services/sale-service';
import { SaleRepository } from '@infra/database/repositories/sale-repository';
import { ProductRepository } from '@infra/database/repositories/product-repository';
import { StockMovementRepository } from '@infra/database/repositories/stock-movement-repository';
import { Installment } from '@domain/entities/installment';
import type { Installment as InstallmentType } from '@shared/types';

export function useUpdateInstallment() {
  const queryClient = useQueryClient();
  const saleService = useMemo(
    () => new SaleService(new SaleRepository(), new ProductRepository(), new StockMovementRepository()),
    [],
  );

  return useMutation({
    mutationFn: ({ saleId, installment }: { saleId: string; installment: InstallmentType }) => {
      const entity = Installment.fromDb({
        id: installment.id,
        saleId: installment.saleId,
        number: installment.number,
        totalInstallments: installment.totalInstallments,
        amount: installment.amount,
        dueDate: installment.dueDate,
        paidDate: installment.paidDate ?? null,
        status: installment.status,
        history: JSON.stringify(installment.history || []),
        type: installment.type || 'normal',
      });
      return saleService.updateInstallment(saleId, entity);
    },
    onSuccess: (_data, { saleId }) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
    },
  });
}
