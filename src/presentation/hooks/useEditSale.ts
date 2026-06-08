import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SaleService } from '@application/services/sale-service';
import { SaleRepository } from '@infra/database/repositories/sale-repository';
import { ProductRepository } from '@infra/database/repositories/product-repository';
import { StockMovementRepository } from '@infra/database/repositories/stock-movement-repository';
import { Sale, SaleItem } from '@domain/entities/sale';
import { Installment } from '@domain/entities/installment';
import { generateId } from '@shared/lib/utils';
import type { Sale as SaleType, SaleItem as SaleItemType, Installment as InstallmentType } from '@shared/types';

export function useEditSale() {
  const queryClient = useQueryClient();
  const saleService = useMemo(
    () => new SaleService(new SaleRepository(), new ProductRepository(), new StockMovementRepository()),
    [],
  );

  return useMutation({
    mutationFn: (data: SaleType) => {
      const sale = Sale.restore({
        id: data.id,
        description: data.description ?? null,
        clientId: data.clientId ?? null,
        clientName: data.clientName ?? null,
        paymentType: data.paymentType,
        installmentsCount: data.installmentsCount,
        subtotal: data.subtotal,
        discountType: data.discountType ?? null,
        discountValue: data.discountValue,
        totalAmount: data.totalAmount,
        entryAmount: data.entryAmount ?? null,
        entryPaymentType: data.entryPaymentType ?? null,
        status: data.status,
        saleDate: data.saleDate,
        firstInstallmentDate: data.firstInstallmentDate ?? null,
        tagIds: data.tagIds,
        items: data.items.map(i => SaleItem.create({
          id: i.id || generateId(),
          saleId: data.id,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          costAtSale: i.costAtSale ?? undefined,
          profitAmount: i.profitAmount ?? undefined,
        })),
        installments: data.installments.map(i => Installment.fromDb({
          id: i.id,
          saleId: i.saleId,
          number: i.number,
          totalInstallments: i.totalInstallments,
          amount: i.amount,
          dueDate: i.dueDate,
          paidDate: i.paidDate ?? null,
          status: i.status,
          history: JSON.stringify(i.history || []),
          type: i.type || 'normal',
        })),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        syncStatus: data.syncStatus ?? null,
        syncError: data.syncError ?? null,
        syncWarnings: data.syncWarnings ?? null,
        refundAmount: (data as any).refundAmount ?? null,
        returnProductsWithClient: (data as any).returnProductsWithClient ?? null,
      });
      return saleService.update(sale);
    },
    onSuccess: (_data, saleData) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', saleData.id] });
    },
  });
}


