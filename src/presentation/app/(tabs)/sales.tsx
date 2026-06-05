import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable, StyleSheet,
  ScrollView, Modal, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { FAB } from '@/components/ui/FAB';
import { EmptyState } from '@/components/ui/EmptyState';
import { SaleStatusBadge, InstallmentStatusBadge } from '@/components/ui/StatusBadge';
import { TagChip } from '@/components/ui/TagChip';
import { useColors } from '@/hooks/use-colors';
import {
  formatCurrency, formatDate, isInMonth, getSaleStatusColor,
  getPaymentTypeLabel,
} from '@shared/lib/utils';
import { SummaryItem, PaymentType, Sale as SaleType } from '@shared/types';
import { useSalesByMonth } from '@/hooks/useSalesByMonth';
import { useTags } from '@/hooks/useTags';

type TabType = 'vendas' | 'a-receber';

const PAYMENT_TYPES: { value: PaymentType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Crédito' },
  { value: 'debit_card', label: 'Débito' },
];

const STATUSES = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'paid' as const, label: 'Pagos' },
  { value: 'pending' as const, label: 'Pendentes' },
  { value: 'overdue' as const, label: 'Vencidos' },
];

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'client_name';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date_desc', label: 'Mais recentes' },
  { value: 'date_asc', label: 'Mais antigos' },
  { value: 'amount_desc', label: 'Maior valor' },
  { value: 'amount_asc', label: 'Menor valor' },
  { value: 'client_name', label: 'Cliente' },
];

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getStatusIcon(status: string): { name: keyof typeof MaterialIcons.glyphMap; color: string } {
  switch (status) {
    case 'paid': return { name: 'check-circle', color: '#16A34A' };
    case 'cancelled': return { name: 'cancel', color: '#DC2626' };
    case 'refunded': return { name: 'autorenew', color: '#06B6D4' };
    default: return { name: 'schedule', color: '#CA8A04' };
  }
}

function productPreview(sale: SaleType): string {
  const names = sale.items.map(i => i.productName);
  if (names.length === 0) return 'Venda';
  if (names.length <= 2) return names.join(', ');
  return `${names[0]}, ${names[1]} +${names.length - 2} itens`;
}

function installmentLabel(sale: SaleType): string | null {
  if (sale.status === 'cancelled') return null;
  if (sale.installmentsCount <= 1) return 'À vista';
  const first = sale.installments.filter(s => s.type !== 'entry')[0];
  return `${sale.installmentsCount}x ${formatCurrency(first?.amount || 0)}`;
}

function firstDueDate(sale: SaleType): string {
  if (sale.status === 'cancelled') return sale.saleDate;
  return sale.installments[0]?.dueDate || sale.saleDate;
}

export default function SalesScreen() {
  const colors = useColors();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('vendas');
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<PaymentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const { data: monthSales = [], refetch } = useSalesByMonth(currentYear, currentMonth);
  const { data: tags = [] } = useTags();

  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  }, [currentMonth]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Tab "Vendas": só vendas com saleDate no mês corrente
  const vendasSales = useMemo(() => {
    return monthSales.filter(s => isInMonth(s.saleDate, currentYear, currentMonth));
  }, [monthSales, currentYear, currentMonth]);

  // Tab "A Receber": SummaryItems (vendas avista + parcelas individuais)
  const summaryItems = useMemo((): SummaryItem[] => {
    const items: SummaryItem[] = [];
    monthSales.forEach(sale => {
      if (sale.installmentsCount <= 1 || sale.status === 'cancelled' || sale.status === 'refunded') {
        if (isInMonth(sale.saleDate, currentYear, currentMonth)) {
          items.push({
            id: sale.id,
            type: 'sale',
            saleId: sale.id,
            title: sale.items[0]?.productName || 'Venda',
            clientName: sale.clientName,
            amount: sale.totalAmount,
            dueDate: sale.saleDate,
            paidDate: sale.status === 'paid' ? sale.saleDate : undefined,
            status: sale.status,
            paymentType: sale.paymentType,
            tagIds: sale.tagIds,
          });
        }
      } else {
        sale.installments.forEach(inst => {
          const showInMonth = inst.status === 'paid'
            ? isInMonth(inst.paidDate as string, currentYear, currentMonth)
            : isInMonth(inst.dueDate, currentYear, currentMonth);
          if (showInMonth) {
            items.push({
              id: inst.id,
              type: 'installment',
              saleId: sale.id,
              title: sale.items[0]?.productName || 'Venda',
              clientName: sale.clientName,
              amount: inst.amount,
              dueDate: inst.dueDate,
              paidDate: inst.paidDate ?? undefined,
              status: inst.status,
              paymentType: sale.paymentType,
              tagIds: sale.tagIds,
              installmentInfo: {
                number: inst.number,
                total: inst.totalInstallments,
                isEntry: sale.entryAmount ? inst.number === 0 : undefined,
                entryPaymentType: sale.entryPaymentType,
              },
            });
          }
        });
      }
    });
    return items;
  }, [monthSales, currentYear, currentMonth]);

  // Filtra conforme a tab ativa
  const tabFiltered = useMemo(() => {
    if (activeTab === 'vendas') {
      return vendasSales;
    }
    return summaryItems.filter(i => i.status !== 'paid');
  }, [vendasSales, summaryItems, activeTab]);

  // Aplicar busca, filtros e ordenação
  const filteredItems = useMemo(() => {
    let result = tabFiltered;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => {
        const clientMatch = 'clientName' in item ? (item.clientName || '').toLowerCase().includes(q) : false;
        const titleMatch = ('title' in item ? (item.title || '') : '').toLowerCase().includes(q);
        const tagMatch = tags.filter(t => item.tagIds.includes(t.id)).some(t => t.name.toLowerCase().includes(q));
        return clientMatch || titleMatch || tagMatch;
      });
    }

    if (filterPayment !== 'all') {
      result = result.filter(i => i.paymentType === filterPayment);
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'overdue') {
        result = result.filter(i => {
          if (i.status === 'paid') return false;
          const dueStr = 'dueDate' in i ? (i.dueDate as string) : '';
          const d = dueStr.split('T')[0];
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          return d < todayStr;
        });
      } else {
        result = result.filter(i => i.status === filterStatus);
      }
    }

    result.sort((a, b) => {
      const aDate = 'saleDate' in a ? (a as any).saleDate || a.dueDate : a.dueDate;
      const bDate = 'saleDate' in b ? (b as any).saleDate || b.dueDate : b.dueDate;
      switch (sortBy) {
        case 'date_asc': return aDate.localeCompare(bDate);
        case 'amount_desc': return b.amount - a.amount;
        case 'amount_asc': return a.amount - b.amount;
        case 'client_name': return (a.clientName || '').localeCompare(b.clientName || '');
        default: return bDate.localeCompare(aDate);
      }
    });

    return result;
  }, [tabFiltered, search, filterPayment, filterStatus, sortBy, tags]);

  const hasFilters = filterPayment !== 'all' || filterStatus !== 'all';

  const ativoFilterText = activeTab === 'vendas' ? 'Vendas' : 'A Receber';

  const renderSaleCard = ({ item }: { item: SaleType }) => {
    const icon = getStatusIcon(item.status);
    const itemTags = tags.filter(t => item.tagIds.includes(t.id));
    const instLabel = installmentLabel(item);
    const due = firstDueDate(item);
    const isCancelled = item.status === 'cancelled';

    return (
      <Pressable
        onPress={() => router.push(`/sales/${item.id}` as any)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.saleCardRow}>
          <MaterialIcons name={icon.name} size={20} color={icon.color} style={{ marginTop: 2 }} />

          <View style={styles.saleCardBody}>
            <View style={styles.saleCardTop}>
              <View style={styles.saleCardInfo}>
                <Text style={[styles.saleCardClient, { color: colors.foreground }]} numberOfLines={1}>
                  {item.clientName || 'Sem cliente'}
                </Text>
                <Text style={[styles.saleCardProducts, { color: colors.muted }]} numberOfLines={1}>
                  {productPreview(item)}
                </Text>
                <View style={styles.saleCardMeta}>
                  {instLabel && (
                    <View style={[styles.instBadge, { backgroundColor: colors.background }]}>
                      <Text style={[styles.instBadgeText, { color: colors.muted }]}>{instLabel}</Text>
                    </View>
                  )}
                  {!isCancelled && (
                    <Text style={[styles.saleCardDue, { color: colors.muted }]}>vence {formatDate(due)}</Text>
                  )}
                </View>
              </View>

              <View style={styles.saleCardRight}>
                <Text style={[styles.saleCardAmount, { color: colors.foreground }]}>
                  {formatCurrency(item.totalAmount)}
                </Text>
                <SaleStatusBadge status={item.status} small />
              </View>
            </View>

            {itemTags.length > 0 && (
              <View style={styles.tagsRow}>
                {itemTags.map(tag => (
                  <TagChip key={tag.id} tag={tag} small />
                ))}
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderSummaryCard = ({ item }: { item: SummaryItem }) => {
    const itemTags = tags.filter(t => item.tagIds.includes(t.id));
    const dueStr = item.dueDate.split('T')[0];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isOverdue = item.status === 'pending' && item.status !== 'paid' && dueStr < todayStr;

    return (
      <Pressable
        onPress={() => router.push(`/sales/${item.saleId}` as any)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isOverdue ? '#EF4444' : colors.border,
            borderLeftWidth: isOverdue ? 4 : 1,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={[styles.saleTitle, { color: colors.foreground }]} numberOfLines={1}>
              {item.title || 'Venda'}
              {item.installmentInfo && (
                <Text style={[styles.installmentMeta, { color: colors.muted }]}>
                  {' '}({item.installmentInfo.isEntry
                    ? `Entrada · ${getPaymentTypeLabel((item.installmentInfo.entryPaymentType || item.paymentType) as PaymentType)}`
                    : `${item.installmentInfo.number}/${item.installmentInfo.total}`})
                </Text>
              )}
            </Text>
            {item.clientName && (
              <View style={styles.clientRow}>
                <MaterialIcons name="person" size={12} color={colors.muted} />
                <Text style={[styles.clientName, { color: colors.muted }]}>{item.clientName}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.muted }]}>
                {formatDate(item.dueDate)}
                {item.paidDate ? ` · Pago: ${formatDate(item.paidDate)}` : ''}
              </Text>
              {isOverdue && (
                <Text style={[styles.overdueText, { color: '#EF4444' }]}> · Vencido</Text>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.amount, { color: isOverdue ? '#EF4444' : colors.foreground }]}>
              {formatCurrency(item.amount)}
            </Text>
            {item.type === 'installment' ? (
              <InstallmentStatusBadge status={item.status as any} small />
            ) : (
              <SaleStatusBadge status={item.status as any} small />
            )}
          </View>
        </View>
        {itemTags.length > 0 && (
          <View style={styles.tagsRow}>
            {itemTags.map(tag => (
              <TagChip key={tag.id} tag={tag} small />
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  const renderTableItem = ({ item }: { item: any }) => {
    const dueStr = item.dueDate?.split('T')[0] || '';
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isOverdue = item.status === 'pending' && item.status !== 'paid' && dueStr < todayStr;

    return (
      <Pressable
        onPress={() => router.push(`/sales/${item.saleId || item.id}` as any)}
        style={({ pressed }) => [
          styles.tableRow,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.tableColDate}>
          <Text style={[styles.tableText, { color: colors.foreground }]}>{formatDate(item.dueDate)}</Text>
        </View>
        <View style={styles.tableColClient}>
          <Text style={[styles.tableText, { color: colors.foreground }]} numberOfLines={1}>
            {item.clientName || '-'}
          </Text>
        </View>
        <View style={styles.tableColTitle}>
          <Text style={[styles.tableText, { color: colors.foreground }]} numberOfLines={1}>
            {item.title || 'Venda'}
          </Text>
        </View>
        <View style={styles.tableColAmount}>
          <Text style={[styles.tableText, { color: isOverdue ? '#EF4444' : colors.foreground, textAlign: 'right' }]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
        <View style={styles.tableColStatus}>
          {item.type === 'installment' ? (
            <InstallmentStatusBadge status={item.status as any} small />
          ) : (
            <SaleStatusBadge status={item.status as any} small />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header com tabs e navegação de mês */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab('vendas')}
            style={[
              styles.tab,
              activeTab === 'vendas' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <MaterialIcons name="shopping-cart" size={20} color={activeTab === 'vendas' ? colors.primary : colors.muted} />
            <Text style={[styles.tabText, { color: activeTab === 'vendas' ? colors.primary : colors.muted }]}>Vendas</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('a-receber')}
            style={[
              styles.tab,
              activeTab === 'a-receber' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <MaterialIcons name="monetization-on" size={20} color={activeTab === 'a-receber' ? colors.primary : colors.muted} />
            <Text style={[styles.tabText, { color: activeTab === 'a-receber' ? colors.primary : colors.muted }]}>A Receber</Text>
          </Pressable>
        </View>

        <View style={styles.monthNav}>
          <Pressable onPress={handlePrevMonth} style={styles.navBtn}>
            <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
          </Pressable>
          <Text style={[styles.monthText, { color: colors.foreground }]}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          <Pressable onPress={handleNextMonth} style={styles.navBtn}>
            <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Barra de busca + filtros */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder={`Buscar em ${ativoFilterText.toLowerCase()}...`}
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
        <View style={[styles.headerActions, { borderLeftColor: colors.border }]}>
          <Pressable
            onPress={() => setViewMode(v => v === 'card' ? 'table' : 'card')}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name={viewMode === 'card' ? 'view-list' : 'grid-view'} size={20} color={colors.muted} />
          </Pressable>
          <Pressable
            onPress={() => setShowSort(true)}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="sort" size={20} color={colors.muted} />
          </Pressable>
          <Pressable
            onPress={() => setShowFilters(true)}
            style={({ pressed }) => [
              styles.filterBtn,
              hasFilters && { backgroundColor: colors.primary + '20' },
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialIcons name="filter-list" size={20} color={hasFilters ? colors.primary : colors.muted} />
            {hasFilters && <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />}
          </Pressable>
        </View>
      </View>

      {/* Chips de filtros ativos */}
      {hasFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersContent}>
          {filterPayment !== 'all' && (
            <Pressable onPress={() => setFilterPayment('all')} style={[styles.filterChip, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterChipText}>{getPaymentTypeLabel(filterPayment)}</Text>
              <MaterialIcons name="close" size={14} color="#fff" />
            </Pressable>
          )}
          {filterStatus !== 'all' && (
            <Pressable onPress={() => setFilterStatus('all')} style={[styles.filterChip, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterChipText}>{STATUSES.find(s => s.value === filterStatus)?.label}</Text>
              <MaterialIcons name="close" size={14} color="#fff" />
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* Lista */}
      {viewMode === 'card' ? (
        <FlatList
          data={filteredItems}
          keyExtractor={item => 'id' in item ? (item as any).id : (item as SaleType).id}
          renderItem={activeTab === 'vendas' ? renderSaleCard : renderSummaryCard}
          contentContainerStyle={[styles.list, filteredItems.length === 0 && { flex: 1 }]}
          ListEmptyComponent={
            <EmptyState
              icon="shopping-cart"
              title={`Nenhum resultado em ${ativoFilterText}`}
              subtitle={
                search || hasFilters
                  ? 'Tente outros filtros'
                  : `Nenhuma venda encontrada em ${MONTHS[currentMonth]}`
              }
            />
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => 'id' in item ? (item as any).id : (item as SaleType).id}
          renderItem={renderTableItem}
          contentContainerStyle={[styles.list, filteredItems.length === 0 && { flex: 1 }]}
          ListHeaderComponent={
            <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[styles.tableHeaderText, styles.tableColDate, { color: colors.muted }]}>Data</Text>
              <Text style={[styles.tableHeaderText, styles.tableColClient, { color: colors.muted }]}>Cliente</Text>
              <Text style={[styles.tableHeaderText, styles.tableColTitle, { color: colors.muted }]}>Produto</Text>
              <Text style={[styles.tableHeaderText, styles.tableColAmount, { color: colors.muted, textAlign: 'right' }]}>Valor</Text>
              <Text style={[styles.tableHeaderText, styles.tableColStatus, { color: colors.muted }]}>Status</Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="shopping-cart"
              title={`Nenhum resultado em ${ativoFilterText}`}
              subtitle={
                search || hasFilters
                  ? 'Tente outros filtros'
                  : `Nenhuma venda encontrada em ${MONTHS[currentMonth]}`
              }
            />
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        />
      )}

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
                  <Text style={[styles.filterOptionText, { color: filterPayment === pt.value ? '#fff' : colors.foreground }]}>
                    {pt.label}
                  </Text>
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
                  <Text style={[styles.filterOptionText, { color: filterStatus === s.value ? '#fff' : colors.foreground }]}>
                    {s.label}
                  </Text>
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
                  <Text style={[styles.sortOptionText, { color: sortBy === option.value ? colors.primary : colors.foreground }]}>
                    {option.label}
                  </Text>
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
  header: { borderBottomWidth: 0.5 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 15, fontWeight: '600' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 8 },
  navBtn: { padding: 8 },
  monthText: { fontSize: 16, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 10, borderBottomWidth: 0.5 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  headerActions: { flexDirection: 'row', gap: 4, borderLeftWidth: 1, paddingLeft: 8 },
  headerBtn: { padding: 8, borderRadius: 8 },
  filterBtn: { padding: 8, borderRadius: 8, position: 'relative' },
  filterDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
  activeFiltersContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  filterChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  card: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

  // Sale card (tab Vendas)
  saleCardRow: { flexDirection: 'row', gap: 10 },
  saleCardBody: { flex: 1, minWidth: 0 },
  saleCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  saleCardInfo: { flex: 1, minWidth: 0, gap: 2 },
  saleCardClient: { fontSize: 14, fontWeight: '700' },
  saleCardProducts: { fontSize: 12 },
  saleCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  instBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  instBadgeText: { fontSize: 11, fontWeight: '600' },
  saleCardDue: { fontSize: 11 },
  saleCardRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  saleCardAmount: { fontSize: 16, fontWeight: '700' },

  // Summary card (tab A Receber)
  cardTop: { flexDirection: 'row', gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  saleTitle: { fontSize: 15, fontWeight: '600' },
  installmentMeta: { fontSize: 12, fontWeight: '400' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clientName: { fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 12 },
  overdueText: { fontSize: 12, fontWeight: '600' },
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

  // Table styles
  tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, gap: 8 },
  tableHeaderText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 0.5, alignItems: 'center', gap: 8 },
  tableText: { fontSize: 13 },
  tableColDate: { width: 70 },
  tableColClient: { flex: 1 },
  tableColTitle: { flex: 1.5 },
  tableColAmount: { width: 90 },
  tableColStatus: { width: 70, alignItems: 'flex-end' },
});
