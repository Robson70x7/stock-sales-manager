import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable, StyleSheet,
  ScrollView, Animated, PanResponder, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { SaleStatusBadge, InstallmentStatusBadge } from '@/components/ui/StatusBadge';
import { TagChip } from '@/components/ui/TagChip';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import {
  formatCurrency, formatDate, getMonthName, isInMonth,
  getPaymentTypeLabel, getSaleStatusColor
} from '@/lib/utils';
import { SummaryItem } from '@/types';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HomeScreen() {
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [search, setSearch] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const translateX = useRef(new Animated.Value(0)).current;

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const slideOut = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    Animated.sequence([
      Animated.timing(translateX, { toValue: slideOut, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      if (direction === 'next') {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
      } else {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
      }
      translateX.setValue(-slideOut);
      Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    });
  }, [currentMonth, currentYear, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20 && Math.abs(gs.dy) < 50,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -50) navigateMonth('next');
        else if (gs.dx > 50) navigateMonth('prev');
      },
    })
  ).current;

  // Gerar itens do mês atual (vendas + parcelas)
  const summaryItems = useMemo((): SummaryItem[] => {
    const items: SummaryItem[] = [];

    state.sales.forEach(sale => {
      if (sale.installmentsCount <= 1) {
        // Venda simples - aparece no mês da data da venda
        if (isInMonth(sale.saleDate, currentYear, currentMonth)) {
          items.push({
            id: sale.id,
            type: 'sale',
            saleId: sale.id,
            title: sale.items[0]?.productName || 'Venda',
            description: sale.description,
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
        // Vendas parceladas - cada parcela aparece no seu mês de vencimento
        sale.installments.forEach(inst => {
          if (isInMonth(inst.dueDate, currentYear, currentMonth)) {
            items.push({
              id: inst.id,
              type: 'installment',
              saleId: sale.id,
              title: sale.items[0]?.productName || 'Venda',
              description: sale.description,
              clientName: sale.clientName,
              amount: inst.amount,
              dueDate: inst.dueDate,
              paidDate: inst.paidDate,
              status: inst.status,
              paymentType: sale.paymentType,
              tagIds: sale.tagIds,
              installmentInfo: { number: inst.number, total: inst.totalInstallments },
            });
          }
        });
      }
    });

    return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [state.sales, currentYear, currentMonth]);

  // Totais do mês
  const monthTotals = useMemo(() => {
    const total = summaryItems.reduce((sum, i) => sum + i.amount, 0);
    const received = summaryItems.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const pending = total - received;
    return { total, received, pending };
  }, [summaryItems]);

  // Tags usadas no mês
  const monthTags = useMemo(() => {
    const tagIds = new Set<string>();
    summaryItems.forEach(item => item.tagIds.forEach(t => tagIds.add(t)));
    return state.tags.filter(t => tagIds.has(t.id));
  }, [summaryItems, state.tags]);

  // Filtrar itens por pesquisa e tag
  const filteredItems = useMemo(() => {
    let result = summaryItems;

    if (activeTagFilter) {
      result = result.filter(item => item.tagIds.includes(activeTagFilter));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => {
        // Busca em título, descrição, nome do cliente
        if (item.title.toLowerCase().includes(q)) return true;
        if (item.description?.toLowerCase().includes(q)) return true;
        if (item.clientName?.toLowerCase().includes(q)) return true;
        // Busca em tags vinculadas
        const itemTags = state.tags.filter(t => item.tagIds.includes(t.id));
        if (itemTags.some(t => t.name.toLowerCase().includes(q))) return true;
        return false;
      });
    }

    return result;
  }, [summaryItems, search, activeTagFilter, state.tags]);

  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();

  const renderItem = ({ item }: { item: SummaryItem }) => {
    const itemTags = state.tags.filter(t => item.tagIds.includes(t.id));
    const isOverdue = item.status !== 'paid' && new Date(item.dueDate) < new Date();

    return (
      <Pressable
        onPress={() => router.push(`/sales/${item.saleId}` as any)}
        style={({ pressed }) => [
          styles.itemCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isOverdue && { borderLeftWidth: 3, borderLeftColor: '#DC2626' },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.itemLeft}>
          <View style={[styles.itemIcon, { backgroundColor: getSaleStatusColor(item.status as any) + '15' }]}>
            <MaterialIcons
              name={item.status === 'paid' ? 'check-circle' : 'access-time'}
              size={18}
              color={getSaleStatusColor(item.status as any)}
            />
          </View>
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemTopRow}>
            <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
              {item.title}
              {item.installmentInfo && (
                <Text style={[styles.installmentBadge, { color: colors.muted }]}>
                  {' '}({item.installmentInfo.number}/{item.installmentInfo.total})
                </Text>
              )}
            </Text>
            <Text style={[styles.itemAmount, { color: colors.foreground }]}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.itemBottomRow}>
            <View style={styles.itemMeta}>
              {item.clientName && (
                <Text style={[styles.itemMetaText, { color: colors.muted }]} numberOfLines={1}>{item.clientName}</Text>
              )}
              <Text style={[styles.itemMetaText, { color: isOverdue ? '#DC2626' : colors.muted }]}>
                {formatDate(item.dueDate)}
              </Text>
            </View>
            {item.type === 'installment'
              ? <InstallmentStatusBadge status={item.status as any} small />
              : <SaleStatusBadge status={item.status as any} small />
            }
          </View>
          {itemTags.length > 0 && (
            <View style={styles.itemTags}>
              {itemTags.map(tag => <TagChip key={tag.id} tag={tag} small />)}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header com navegação de mês */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigateMonth('prev')} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="chevron-left" size={28} color={colors.primary} />
        </Pressable>
        <View style={styles.monthTitle}>
          <Text style={[styles.monthText, { color: colors.foreground }]}>
            {getMonthName(currentMonth, true, currentYear)}
          </Text>
          {isCurrentMonth && <View style={[styles.currentDot, { backgroundColor: colors.primary }]} />}
        </View>
        <Pressable onPress={() => navigateMonth('next')} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="chevron-right" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {/* Cards de totais */}
      <Animated.View style={[styles.totalsContainer, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsScroll}>
          <View style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>Total do Mês</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatCurrency(monthTotals.total)}</Text>
          </View>
          <View style={[styles.totalCard, { backgroundColor: '#16A34A10', borderColor: '#16A34A30' }]}>
            <Text style={[styles.totalLabel, { color: '#16A34A' }]}>Recebido</Text>
            <Text style={[styles.totalValue, { color: '#16A34A' }]}>{formatCurrency(monthTotals.received)}</Text>
          </View>
          <View style={[styles.totalCard, { backgroundColor: '#D9770610', borderColor: '#D9770630' }]}>
            <Text style={[styles.totalLabel, { color: '#D97706' }]}>A Receber</Text>
            <Text style={[styles.totalValue, { color: '#D97706' }]}>{formatCurrency(monthTotals.pending)}</Text>
          </View>
          <View style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>Operações</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>{summaryItems.length}</Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Barra de pesquisa */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={18} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Buscar por título, cliente ou tag..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Chips de tags do mês */}
      {monthTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tagsScroll, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.tagsScrollContent}
        >
          <Pressable
            onPress={() => setActiveTagFilter(null)}
            style={[styles.allChip, !activeTagFilter && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.allChipText, { color: !activeTagFilter ? '#fff' : colors.muted }]}>Todos</Text>
          </Pressable>
          {monthTags.map(tag => (
            <TagChip
              key={tag.id}
              tag={tag}
              selected={activeTagFilter === tag.id}
              onPress={() => setActiveTagFilter(activeTagFilter === tag.id ? null : tag.id)}
              small
            />
          ))}
        </ScrollView>
      )}

      {/* Lista de operações */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, filteredItems.length === 0 && { flex: 1 }]}
        ListHeaderComponent={
          filteredItems.length > 0 ? (
            <Text style={[styles.listHeader, { color: colors.muted }]}>
              {filteredItems.length} operaç{filteredItems.length !== 1 ? 'ões' : 'ão'}
              {(search || activeTagFilter) ? ' encontrada' + (filteredItems.length !== 1 ? 's' : '') : ''}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="event-note" size={56} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.muted }]}>
              {search || activeTagFilter ? 'Nenhum resultado encontrado' : 'Nenhuma operação neste mês'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>
              {search || activeTagFilter
                ? 'Tente outros termos de busca'
                : `Registre vendas para ${getMonthName(currentMonth)}`
              }
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
  },
  navBtn: { padding: 8 },
  monthTitle: { alignItems: 'center', flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  monthText: { fontSize: 18, fontWeight: '700' },
  currentDot: { width: 6, height: 6, borderRadius: 3 },
  totalsContainer: { paddingVertical: 12 },
  totalsScroll: { paddingHorizontal: 16, gap: 10 },
  totalCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    minWidth: 120,
    gap: 4,
  },
  totalLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  totalValue: { fontSize: 18, fontWeight: '700' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  tagsScroll: { maxHeight: 44, borderBottomWidth: 0.5 },
  tagsScrollContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  allChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  allChipText: { fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  listHeader: { fontSize: 12, paddingVertical: 8 },
  itemCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemLeft: { padding: 12, justifyContent: 'flex-start', paddingTop: 14 },
  itemIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  itemContent: { flex: 1, padding: 12, paddingLeft: 0, gap: 4 },
  itemTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  installmentBadge: { fontSize: 12, fontWeight: '400' },
  itemAmount: { fontSize: 15, fontWeight: '700' },
  itemBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemMeta: { flex: 1, gap: 1 },
  itemMetaText: { fontSize: 12 },
  itemTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
