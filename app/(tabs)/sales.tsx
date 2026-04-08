import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { FAB } from '@/components/ui/FAB';
import { EmptyState } from '@/components/ui/EmptyState';
import { SaleStatusBadge } from '@/components/ui/StatusBadge';
import { TagChip } from '@/components/ui/TagChip';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency, formatDate, getPaymentTypeLabel, getSaleStatusColor } from '@/lib/utils';
import { Sale, PaymentType, SaleStatus } from '@/types';

const PAYMENT_TYPES: { value: PaymentType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Crédito' },
  { value: 'debit_card', label: 'Débito' },
  { value: 'bank_transfer', label: 'Transferência' },
  { value: 'installment', label: 'Parcelado' },
];

const STATUSES: { value: SaleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'partial', label: 'Parcial' },
  { value: 'paid', label: 'Pago' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function SalesScreen() {
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<PaymentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<SaleStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...state.sales].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q)) ||
        (s.clientName?.toLowerCase().includes(q)) ||
        state.tags.filter(t => s.tagIds.includes(t.id)).some(t => t.name.toLowerCase().includes(q))
      );
    }
    if (filterPayment !== 'all') result = result.filter(s => s.paymentType === filterPayment);
    if (filterStatus !== 'all') result = result.filter(s => s.status === filterStatus);
    return result;
  }, [state.sales, state.tags, search, filterPayment, filterStatus]);

  const hasFilters = filterPayment !== 'all' || filterStatus !== 'all';

  const renderItem = ({ item }: { item: Sale }) => {
    const tags = state.tags.filter(t => item.tagIds.includes(t.id));
    const paidInstallments = item.installments.filter(i => i.status === 'paid').length;

    return (
      <Pressable
        onPress={() => router.push(`/sales/${item.id}` as any)}
        style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={[styles.saleTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
            {item.clientName && (
              <View style={styles.clientRow}>
                <MaterialIcons name="person" size={12} color={colors.muted} />
                <Text style={[styles.clientName, { color: colors.muted }]}>{item.clientName}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.muted }]}>{formatDate(item.saleDate)}</Text>
              <Text style={[styles.metaDot, { color: colors.muted }]}>·</Text>
              <Text style={[styles.metaText, { color: colors.muted }]}>{getPaymentTypeLabel(item.paymentType)}</Text>
              {item.installmentsCount > 1 && (
                <>
                  <Text style={[styles.metaDot, { color: colors.muted }]}>·</Text>
                  <Text style={[styles.metaText, { color: colors.muted }]}>{paidInstallments}/{item.installmentsCount}x</Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.amount, { color: colors.foreground }]}>{formatCurrency(item.totalAmount)}</Text>
            <SaleStatusBadge status={item.status} small />
          </View>
        </View>
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map(tag => <TagChip key={tag.id} tag={tag} small />)}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Vendas</Text>
        <Pressable
          onPress={() => setShowFilters(true)}
          style={({ pressed }) => [styles.filterBtn, hasFilters && { backgroundColor: colors.primary + '20' }, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="filter-list" size={20} color={hasFilters ? colors.primary : colors.muted} />
          {hasFilters && <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />}
        </Pressable>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Buscar vendas, clientes, tags..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {hasFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFilters} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}>
          {filterPayment !== 'all' && (
            <Pressable onPress={() => setFilterPayment('all')} style={[styles.filterChip, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterChipText}>{getPaymentTypeLabel(filterPayment)}</Text>
              <MaterialIcons name="close" size={14} color="#fff" />
            </Pressable>
          )}
          {filterStatus !== 'all' && (
            <Pressable onPress={() => setFilterStatus('all')} style={[styles.filterChip, { backgroundColor: getSaleStatusColor(filterStatus as SaleStatus) }]}>
              <Text style={styles.filterChipText}>{STATUSES.find(s => s.value === filterStatus)?.label}</Text>
              <MaterialIcons name="close" size={14} color="#fff" />
            </Pressable>
          )}
        </ScrollView>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState
            icon="shopping-cart"
            title="Nenhuma venda encontrada"
            subtitle={search || hasFilters ? 'Tente outros filtros' : 'Toque no botão + para registrar sua primeira venda'}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={() => router.push('/sales/new' as any)} />

      {/* Modal de filtros */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFilters(false)}>
          <View style={[styles.filterSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Filtros</Text>

            <Text style={[styles.filterLabel, { color: colors.muted }]}>Tipo de Pagamento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {PAYMENT_TYPES.map(pt => (
                <Pressable
                  key={pt.value}
                  onPress={() => setFilterPayment(pt.value)}
                  style={[styles.filterOption, filterPayment === pt.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.filterOptionText, { color: filterPayment === pt.value ? '#fff' : colors.foreground }]}>{pt.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.filterLabel, { color: colors.muted }]}>Status</Text>
            <View style={styles.statusGrid}>
              {STATUSES.map(s => (
                <Pressable
                  key={s.value}
                  onPress={() => setFilterStatus(s.value)}
                  style={[styles.filterOption, filterStatus === s.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.filterOptionText, { color: filterStatus === s.value ? '#fff' : colors.foreground }]}>{s.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <Pressable onPress={() => { setFilterPayment('all'); setFilterStatus('all'); }} style={[styles.sheetBtn, { backgroundColor: colors.background }]}>
                <Text style={[styles.sheetBtnText, { color: colors.muted }]}>Limpar</Text>
              </Pressable>
              <Pressable onPress={() => setShowFilters(false)} style={[styles.sheetBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.sheetBtnText, { color: '#fff' }]}>Aplicar</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  title: { fontSize: 22, fontWeight: '700' },
  filterBtn: { padding: 8, borderRadius: 8, position: 'relative' },
  filterDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10, borderBottomWidth: 0.5 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  activeFilters: { maxHeight: 50 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  filterChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  card: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 0.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  saleTitle: { fontSize: 15, fontWeight: '600' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clientName: { fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 12 },
  metaDot: { fontSize: 12 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 16, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 14, paddingBottom: 32 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  filterLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  filterOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  filterOptionText: { fontSize: 13, fontWeight: '500' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  sheetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  sheetBtnText: { fontSize: 15, fontWeight: '600' },
});
