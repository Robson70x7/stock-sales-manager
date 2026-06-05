import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useSale } from '@/hooks/useSale';
import { useTags } from '@/hooks/useTags';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useDeleteSale } from '@/hooks/useDeleteSale';
import { useUpdateInstallment } from '@/hooks/useUpdateInstallment';
import { TagChip } from '@/components/ui/TagChip';
import { SaleStatusBadge, InstallmentStatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate, getPaymentTypeLabel } from '@shared/lib/utils';
import { Installment } from '@shared/types';
import * as Haptics from 'expo-haptics';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: settings } = useSettings();
  const { data: sale, isLoading } = useSale(id);
  const { data: allTags = [] } = useTags();
  const { mutateAsync: deleteSale } = useDeleteSale();
  const { mutateAsync: updateInstallment } = useUpdateInstallment();
  const { mutateAsync: updateSettings } = useUpdateSettings();
  const colors = useColors();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showReturnStock, setShowReturnStock] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Carregando...</Text>
    </View>
  );

  if (!sale) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Venda não encontrada</Text>
    </View>
  );

  const tags = allTags.filter(t => sale.tagIds.includes(t.id));
  const paidAmount = sale.installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = sale.totalAmount - paidAmount;

  const handleDelete = async (returnStock: boolean = false) => {
    if (dontAskAgain) {
      await updateSettings({ askReturnStockOnDelete: false });
    }
    await deleteSale({ id: sale.id, returnStock });
    router.back();
  };

  const handleDeletePress = () => {
    if (settings?.askReturnStockOnDelete ?? true) {
      setShowReturnStock(true);
    } else {
      setShowDelete(true);
    }
  };

  const toggleInstallment = async (installment: Installment) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newStatus = installment.status === 'paid' ? 'pending' : 'paid';
    const updated: Installment = {
      ...installment,
      status: newStatus,
      paidDate: newStatus === 'paid' ? new Date().toISOString() : null,
      history: [
        ...(installment.history || []),
        {
          date: new Date().toISOString(),
          status: newStatus,
          notes: newStatus === 'paid' ? 'Parcela paga' : 'Parcela reaberta',
        },
      ],
    };
    console.log('Iniciando alteração de parcela');
    console.log(`Dados para alteração`, JSON.stringify(updated,null,2))
    await updateInstallment({ saleId: sale.id, installment: updated });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Hero */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroInfo}>
              <Text style={[styles.saleTitle, { color: colors.foreground }]}>{sale.items[0]?.productName || 'Venda'}</Text>
              {sale.clientName && (
                <View style={styles.clientRow}>
                  <MaterialIcons name="person" size={14} color={colors.muted} />
                  <Text style={[styles.clientName, { color: colors.muted }]}>{sale.clientName}</Text>
                </View>
              )}
              <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(sale.saleDate)}</Text>
            </View>
            <SaleStatusBadge status={sale.status} />
          </View>
          {sale.description && (
            <Text style={[styles.description, { color: colors.muted }]}>{sale.description}</Text>
          )}
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map(tag => <TagChip key={tag.id} tag={tag} small />)}
            </View>
          )}
        </View>

        {/* Resumo financeiro */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{formatCurrency(sale.totalAmount)}</Text>
            <Text style={[styles.statLabel, {color: colors.error }]}>Desconto: { formatCurrency(sale.discountValue) }</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Recebido</Text>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>{formatCurrency(paidAmount)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Pendente</Text>
            <Text style={[styles.statValue, { color: pendingAmount > 0 ? '#D97706' : '#16A34A' }]}>{formatCurrency(pendingAmount)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Pagamento</Text>
            <Text style={[styles.statValue, { color: colors.foreground, fontSize: 13 }]}>{getPaymentTypeLabel(sale.paymentType)}</Text>
          </View>
        </View>

        {/* Sync Status */}
        {sale.syncStatus && sale.syncStatus !== 'synced' && (
          <View style={[styles.syncStatusCard, { backgroundColor: sale.syncStatus === 'failed' ? '#7f1d1d' : '#1E3A5F', borderColor: sale.syncStatus === 'failed' ? '#ef4444' : '#3B82F6' }]}>
            <MaterialIcons
              name={sale.syncStatus === 'failed' ? 'error' : 'sync'}
              size={16}
              color={sale.syncStatus === 'failed' ? '#fca5a5' : '#93C5FD'}
            />
            <Text style={{ color: sale.syncStatus === 'failed' ? '#fca5a5' : '#93C5FD', fontSize: 13, flex: 1 }}>
              {sale.syncStatus === 'pending' ? 'Aguardando sincronização com o Desktop' : 'Falha na sincronização'}
            </Text>
          </View>
        )}

        {/* Over-sell warnings */}
        {sale.syncWarnings && sale.syncWarnings.length > 0 && (
          <View style={[styles.card, { backgroundColor: '#7f1d1d', borderColor: '#ef4444' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="warning" size={18} color="#fca5a5" />
              <Text style={[styles.cardTitle, { color: '#fca5a5' }]}>Warnings de Estoque</Text>
            </View>
            {sale.syncWarnings.map((w, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: idx > 0 ? 0.5 : 0, borderTopColor: '#ef444440' }}>
                <Text style={{ color: '#fca5a5', fontSize: 13, flex: 1 }}>{w.productName}</Text>
                <Text style={{ color: '#fca5a5', fontSize: 13 }}>
                  Disponível: {w.available} / Solicitado: {w.quantity}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Produtos */}
        {sale.items.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Produtos</Text>
            {sale.items.map((item, idx) => (
              <View key={item.productId || item.id} style={[styles.itemRow, idx > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{item.productName}</Text>
                  <Text style={[styles.itemQty, { color: colors.muted }]}>{item.quantity}x {formatCurrency(item.unitPrice)}</Text>
                  {item.costAtSale != null && (
                    <Text style={[styles.itemQty, { color: colors.muted }]}>
                      Lucro: {formatCurrency(item.profitAmount ?? 0)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.itemTotal, { color: colors.foreground }]}>{formatCurrency(item.totalPrice)}</Text>
              </View>
            ))}
          </View>
        )}
        {/* Parcelas */}
        {sale.installments.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {sale.installmentsCount > 1 ? `Parcelas (${sale.installmentsCount}x)` : 'Pagamento'}
            </Text>
            {sale.installments.map((inst, idx) => (
              <Pressable
                key={inst.id}
                onPress={() => toggleInstallment(inst)}
                style={({ pressed }) => [
                  styles.installmentRow,
                  idx > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.installmentCheck, { borderColor: inst.status === 'paid' ? '#16A34A' : colors.border, backgroundColor: inst.status === 'paid' ? '#16A34A' : 'transparent' }]}>
                  {inst.status === 'paid' && <MaterialIcons name="check" size={14} color="#fff" />}
                </View>
                <View style={styles.installmentInfo}>
                  <Text style={[styles.installmentLabel, { color: colors.foreground }]}>
                    {sale.entryAmount && inst.number === 0 && inst.status === 'paid'
                      ? `Entrada (${getPaymentTypeLabel(sale.entryPaymentType || sale.paymentType)})`
                      : sale.installmentsCount > 1
                        ? `Parcela ${inst.number}/${inst.totalInstallments}`
                        : 'Pagamento único'}
                  </Text>
                  <Text style={[styles.installmentDate, { color: colors.muted }]}>
                    Venc: {formatDate(inst.dueDate)}
                    {inst.paidDate && ` · Pago: ${formatDate(inst.paidDate)}`}
                  </Text>
                </View>
                <View style={styles.installmentRight}>
                  <Text style={[styles.installmentAmount, { color: colors.foreground }]}>{formatCurrency(inst.amount)}</Text>
                  <InstallmentStatusBadge status={inst.status} small />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push(`/sales/edit/${sale.id}` as any)}
            style={({ pressed }) => [styles.editBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
          >
            <MaterialIcons name="edit" size={18} color="#fff" />
            <Text style={styles.editBtnText}>Editar</Text>
          </Pressable>
          <Pressable
            onPress={handleDeletePress}
            style={({ pressed }) => [styles.deleteBtn, { borderColor: '#DC2626' }, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="delete" size={18} color="#DC2626" />
            <Text style={[styles.deleteBtnText, { color: '#DC2626' }]}>Excluir</Text>
          </Pressable>
        </View>
      </View>

      <ConfirmDialog
        visible={showReturnStock}
        title="Devolver ao Estoque?"
        message="Deseja devolver os itens desta venda ao estoque?"
        confirmLabel="Devolver"
        onConfirm={() => {
          setShowReturnStock(false);
          handleDelete(true);
        }}
        onCancel={() => {
          setShowReturnStock(false);
          setShowDelete(true);
        }}
        checkbox={{
          label: "Não perguntar novamente",
          checked: dontAskAgain,
          onCheckedChange: setDontAskAgain,
        }}
      />

      <ConfirmDialog
        visible={showDelete}
        title="Excluir Venda"
        message={`Deseja excluir esta venda? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => handleDelete(false)}
        onCancel={() => setShowDelete(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  heroCard: { borderRadius: 16, padding: 16, borderWidth: 0.5, gap: 10 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroInfo: { flex: 1, gap: 4 },
  saleTitle: { fontSize: 20, fontWeight: '700' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clientName: { fontSize: 13 },
  dateText: { fontSize: 13 },
  description: { fontSize: 14, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  syncStatusCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, borderWidth: 0.5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 4 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '700' },
  card: { borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, gap: 8 },
  itemName: { flex: 1, fontSize: 14 },
  itemQty: { fontSize: 12 },
  itemTotal: { fontSize: 14, fontWeight: '600', minWidth: 70, textAlign: 'right' },
  installmentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  installmentCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  installmentInfo: { flex: 1 },
  installmentLabel: { fontSize: 14, fontWeight: '500' },
  installmentDate: { fontSize: 12, marginTop: 2 },
  installmentRight: { alignItems: 'flex-end', gap: 4 },
  installmentAmount: { fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});
