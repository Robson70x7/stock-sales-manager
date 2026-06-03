import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SaleService } from '@application/services/sale-service';
import { SaleRepository } from '@infra/database/repositories/sale-repository';
import { ProductRepository } from '@infra/database/repositories/product-repository';
import { StockMovementRepository } from '@infra/database/repositories/stock-movement-repository';
import type { Sale as SaleType } from '@shared/types';
import type { CreateSaleInput } from '@domain/entities/sale';

export function useCreateSale() {
  const queryClient = useQueryClient();
  const saleService = useMemo(
    () => new SaleService(new SaleRepository(), new ProductRepository(), new StockMovementRepository()),
    [],
  );

  return useMutation({
    mutationFn: (data: Omit<SaleType, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'syncError' | 'syncWarnings'>) => {
      const input: CreateSaleInput = {
        description: data.description ?? undefined,
        clientId: data.clientId ?? undefined,
        clientName: data.clientName ?? undefined,
        paymentType: data.paymentType,
        installmentsCount: data.installmentsCount,
        subtotal: data.subtotal,
        discountType: data.discountType ?? undefined,
        discountValue: data.discountValue,
        totalAmount: data.totalAmount,
        entryAmount: data.entryAmount ?? undefined,
        entryPaymentType: data.entryPaymentType ?? undefined,
        status: data.status,
        saleDate: data.saleDate,
        firstInstallmentDate: data.firstInstallmentDate ?? undefined,
        tagIds: data.tagIds,
        items: data.items.map(i => ({
          id: i.id ?? undefined,
          saleId: undefined,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          costAtSale: i.costAtSale ?? undefined,
          profitAmount: i.profitAmount ?? undefined,
        })),
        installments: data.installments.map(inst => ({
          id: inst.id,
          saleId: inst.saleId,
          number: inst.number,
          totalInstallments: inst.totalInstallments,
          amount: inst.amount,
          dueDate: inst.dueDate,
          paidDate: inst.paidDate ?? null,
          status: inst.status,
          history: inst.history,
          type: inst.type || 'normal',
        })),
      };
      return saleService.create(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
