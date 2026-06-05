import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@infra/database/db';

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, returnStock }: { id: string; returnStock?: boolean }) => {
      await db.deleteStockMovementsByReference(id);
      if (returnStock) {
        const items = await db.getSaleItems(id);
        for (const item of items) {
          await db.getProductStock(item.productId);
        }
      }
      await db.deleteSaleItems(id);
      await db.deleteInstallments(id);
      await db.deleteSale(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
