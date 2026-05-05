import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, ScrollView, Modal, RefreshControl } from 'react-native';
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
import { isInMonth as isInMonthUtil } from '@/lib/utils';

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

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'client_name';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date_desc', label: 'Mais recentes' },
  { value: 'date_asc', label: 'Mais antigas' },
  { value: 'amount_desc', label: 'Maior valor' },
  { value: 'amount_asc', label: 'Menor valor' },
  { value: 'client_name', label: 'Cliente' },
];

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function SalesScreen() {
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<PaymentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<SaleStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [showSort, setShowSort] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isInMonth = (dateStr: string, year: number, month: number) => {
    const date = new Date(dateStr);
    return date.getFullYear() === year && date.getMonth() === month;
  };

  // Verifica se uma venda tem parcelas no mês especificado
  const hasParcelsInMonth = (sale: Sale, year: number, month: number): boolean => {
    if (sale.installmentsCount <= 1) return false;
    return sale.installments.some(inst => isInMonth(inst.dueDate, year, month));
  };

  const filtered = useMemo(() => {
    let result = [...state.sales]
      .filter(s => isInMonth(s.saleDate, currentYear, currentMonth) || hasParcelsInMonth(s, currentYear, currentMonth));

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
        case 'date_asc':
          return new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime();
        case 'amount_desc':
          return b.totalAmount - a.totalAmount;
        case 'amount_asc':
          return a.totalAmount - b.totalAmount;
        case 'client_name':
          return (a.clientName || '').localeCompare(b.clientName || '');
        default:
          return 0;
      }
    });

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.items.some(i => i.productName.toLowerCase().includes(q)) ||
        (s.description?.toLowerCase().includes(q)) ||
        (s.clientName?.toLowerCase().includes(q)) ||
        state.tags.filter(t => s.tagIds.includes(t.id)).some(t => t.name.toLowerCase().includes(q))
      );
    }
    if (filterPayment !== 'all') result = result.filter(s => s.paymentType === filterPayment);
    if (filterStatus !== 'all') result = result.filter(s => s.status === filterStatus);
    return result;
  }, [state.sales, state.tags, search, filterPayment, filterStatus, currentMonth, currentYear, isInMonth, hasParcelsInMonth, sortBy]);

  // Calculate monthly summary
  const monthlySummary = useMemo(() => {
    const salesInMonth = state.sales.filter(s => 
      isInMonth(s.saleDate, currentYear, currentMonth) || hasParcelsInMonth(s, currentYear, currentMonth)
    );

    const totalRevenue = salesInMonth
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const totalReceived = salesInMonth
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + s.totalAmount, 0) +
      salesInMonth
        .flatMap(s => s.installments)
        .filter(i => isInMonth(i.dueDate, currentYear, currentMonth) && i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);

    const pending = totalRevenue - totalReceived;
    const salesCount = salesInMonth.filter(s => s.status !== 'cancelled').length;
    const averageValue = salesCount > 0 ? totalRevenue / salesCount : 0;

    return { totalRevenue, totalReceived, pending, salesCount, averageValue };
  }, [state.sales, currentMonth, currentYear, isInMonth, hasParcelsInMonth]);

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
            <Text style={[styles.saleTitle, { color: colors.foreground }]} numberOfLines={1}>{item.items[0]?.productName || 'Venda'}</Text>
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
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowSort(true)}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="sort" size={20} color={colors.muted} />
          </Pressable>
          <Pressable
            onPress={() => setShowFilters(true)}
            style={({ pressed }) => [styles.filterBtn, hasFilters && { backgroundColor: colors.primary + '20' }, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="filter-list" size={20} color={hasFilters ? colors.primary : colors.muted} />
            {hasFilters && <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />}
          </Pressable>
        </View>
      </View>

      {/* Navegação por mês */}
      <View style={[styles.monthNav, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={handlePrevMonth} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.monthText, { color: colors.foreground }]}>
          {MONTHS[currentMonth]} {currentYear}
        </Text>
        <Pressable onPress={handleNextMonth} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Cards de resumo */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Receitas</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatCurrency(monthlySummary.totalRevenue)}</Text>
            <Text style={[styles.summarySubtext, { color: colors.muted }]}>{monthlySummary.salesCount} vendas</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Recebido</Text>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{formatCurrency(monthlySummary.totalReceived)}</Text>
            <Text style={[styles.summarySubtext, { color: colors.muted }]}>Média: {formatCurrency(monthlySummary.averageValue)}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Pendente</Text>
            <Text style={[styles.summaryValue, { color: monthlySummary.pending > 0 ? '#f59e0b' : colors.muted }]}>{formatCurrency(monthlySummary.pending)}</Text>
            <Text style={[styles.summarySubtext, { color: colors.muted }]}>A receber</Text>
          </View>
        </View>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
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

      {/* Modal de ordenação */}
      <Modal visible={showSort} transparent animationType="slide" onRequestClose={() => setShowSort(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowSort(false)}>
          <View style={[styles.filterSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Ordenar</Text>

            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map(option => (
                <Pressable
                  key={option.value}
                  onPress={() => { setSortBy(option.value); setShowSort(false); }}
                  style={[styles.sortOption, sortBy === option.value && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                >
                  <Text style={[styles.sortOptionText, { color: sortBy === option.value ? colors.primary : colors.foreground }]}>{option.label}</Text>
                  {sortBy === option.value && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => setShowSort(false)} style={[styles.sheetBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.sheetBtnText, { color: '#fff' }]}>Fechar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  title: { fontSize: 22, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 8, borderRadius: 8 },
  filterBtn: { padding: 8, borderRadius: 8, position: 'relative' },
  filterDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  navBtn: { padding: 8 },
  monthText: { fontSize: 16, fontWeight: '600' },
  summaryContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 10 },
  summaryLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  summarySubtext: { fontSize: 11, marginTop: 2 },
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
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#475569', alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  filterLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  filterOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  filterOptionText: { fontSize: 13, fontWeight: '500' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  sheetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  sheetBtnText: { fontSize: 15, fontWeight: '600' },
  sortOptions: { gap: 8 },
  sortOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  sortOptionText: { fontSize: 15, fontWeight: '500' },
});
