import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency, getMonthName, getPaymentTypeLabel, isInMonth } from '@/lib/utils';
import { PaymentType } from '@/types';

const PAYMENT_TYPES: { value: PaymentType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Crédito' },
  { value: 'debit_card', label: 'Débito' },
  { value: 'bank_transfer', label: 'Transferência' },
  { value: 'installment', label: 'Parcelado' },
];

export default function ReportsScreen() {
  const { state } = useApp();
  const colors = useColors();

  const now = new Date();
  const [startYear, setStartYear] = useState(now.getFullYear());
  const [startMonth, setStartMonth] = useState(0);
  const [endYear, setEndYear] = useState(now.getFullYear());
  const [endMonth, setEndMonth] = useState(now.getMonth());
  const [filterPayment, setFilterPayment] = useState<PaymentType | 'all'>('all');
  const [filterClientId, setFilterClientId] = useState<string | 'all'>('all');
  const [filterTagId, setFilterTagId] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Calcular dados do relatório
  const reportData = useMemo(() => {
    const startDate = new Date(startYear, startMonth, 1);
    const endDate = new Date(endYear, endMonth + 1, 0, 23, 59, 59);

    // Filtrar vendas no período
    let filteredSales = state.sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      if (saleDate < startDate || saleDate > endDate) return false;
      if (filterPayment !== 'all' && sale.paymentType !== filterPayment) return false;
      if (filterClientId !== 'all' && sale.clientId !== filterClientId) return false;
      if (filterTagId !== 'all' && !sale.tagIds.includes(filterTagId)) return false;
      return true;
    });

    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalReceived = filteredSales.reduce((sum, s) => {
      return sum + s.installments.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0);
    }, 0);
    const totalPending = totalRevenue - totalReceived;
    const cancelledAmount = filteredSales.filter(s => s.status === 'cancelled').reduce((sum, s) => sum + s.totalAmount, 0);

    // Por tipo de pagamento
    const byPaymentType: Record<string, number> = {};
    filteredSales.forEach(s => {
      const key = s.paymentType;
      byPaymentType[key] = (byPaymentType[key] || 0) + s.totalAmount;
    });

    // Por mês (para o gráfico de barras)
    const months: Array<{ year: number; month: number; revenue: number; received: number }> = [];
    let y = startYear, m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const monthSales = filteredSales.filter(s => isInMonth(s.saleDate, y, m));
      const revenue = monthSales.reduce((sum, s) => sum + s.totalAmount, 0);
      const received = monthSales.reduce((sum, s) =>
        sum + s.installments.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0), 0
      );
      months.push({ year: y, month: m, revenue, received });
      if (m === 11) { m = 0; y++; } else m++;
    }

    return {
      salesCount: filteredSales.length,
      totalRevenue,
      totalReceived,
      totalPending,
      cancelledAmount,
      byPaymentType,
      months,
    };
  }, [state.sales, startYear, startMonth, endYear, endMonth, filterPayment, filterClientId, filterTagId]);

  const maxBarValue = Math.max(...reportData.months.map(m => m.revenue), 1);
  const hasFilters = filterPayment !== 'all' || filterClientId !== 'all' || filterTagId !== 'all';

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Relatórios</Text>
        <Pressable
          onPress={() => setShowFilters(true)}
          style={({ pressed }) => [styles.filterBtn, hasFilters && { backgroundColor: colors.primary + '20' }, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="filter-list" size={20} color={hasFilters ? colors.primary : colors.muted} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Seletor de período */}
        <View style={[styles.periodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Período</Text>
          <View style={styles.periodRow}>
            <View style={styles.periodItem}>
              <Text style={[styles.periodLabel, { color: colors.muted }]}>De</Text>
              <View style={styles.monthPicker}>
                <Pressable onPress={() => { if (startMonth === 0) { setStartMonth(11); setStartYear(y => y - 1); } else setStartMonth(m => m - 1); }}>
                  <MaterialIcons name="chevron-left" size={20} color={colors.primary} />
                </Pressable>
                <Text style={[styles.monthPickerText, { color: colors.foreground }]}>
                  {getMonthName(startMonth, true)} {startYear}
                </Text>
                <Pressable onPress={() => { if (startMonth === 11) { setStartMonth(0); setStartYear(y => y + 1); } else setStartMonth(m => m + 1); }}>
                  <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                </Pressable>
              </View>
            </View>
            <MaterialIcons name="arrow-forward" size={16} color={colors.muted} />
            <View style={styles.periodItem}>
              <Text style={[styles.periodLabel, { color: colors.muted }]}>Até</Text>
              <View style={styles.monthPicker}>
                <Pressable onPress={() => { if (endMonth === 0) { setEndMonth(11); setEndYear(y => y - 1); } else setEndMonth(m => m - 1); }}>
                  <MaterialIcons name="chevron-left" size={20} color={colors.primary} />
                </Pressable>
                <Text style={[styles.monthPickerText, { color: colors.foreground }]}>
                  {getMonthName(endMonth, true)} {endYear}
                </Text>
                <Pressable onPress={() => { if (endMonth === 11) { setEndMonth(0); setEndYear(y => y + 1); } else setEndMonth(m => m + 1); }}>
                  <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Cards de resumo */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Faturamento Total</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{formatCurrency(reportData.totalRevenue)}</Text>
            <Text style={[styles.statSub, { color: colors.muted }]}>{reportData.salesCount} venda{reportData.salesCount !== 1 ? 's' : ''}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#16A34A10', borderColor: '#16A34A30' }]}>
            <Text style={[styles.statLabel, { color: '#16A34A' }]}>Recebido</Text>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>{formatCurrency(reportData.totalReceived)}</Text>
            <Text style={[styles.statSub, { color: '#16A34A' }]}>
              {reportData.totalRevenue > 0 ? ((reportData.totalReceived / reportData.totalRevenue) * 100).toFixed(0) : 0}%
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D9770610', borderColor: '#D9770630' }]}>
            <Text style={[styles.statLabel, { color: '#D97706' }]}>A Receber</Text>
            <Text style={[styles.statValue, { color: '#D97706' }]}>{formatCurrency(reportData.totalPending)}</Text>
            <Text style={[styles.statSub, { color: '#D97706' }]}>pendente</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#DC262610', borderColor: '#DC262630' }]}>
            <Text style={[styles.statLabel, { color: '#DC2626' }]}>Cancelado</Text>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{formatCurrency(reportData.cancelledAmount)}</Text>
            <Text style={[styles.statSub, { color: '#DC2626' }]}>cancelado</Text>
          </View>
        </View>

        {/* Gráfico de barras mensal */}
        {reportData.months.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fluxo de Caixa Mensal</Text>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>Faturado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>Recebido</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
              {reportData.months.map((m, idx) => {
                const revenueHeight = maxBarValue > 0 ? (m.revenue / maxBarValue) * 100 : 0;
                const receivedHeight = maxBarValue > 0 ? (m.received / maxBarValue) * 100 : 0;
                return (
                  <View key={idx} style={styles.barGroup}>
                    <View style={styles.bars}>
                      <View style={[styles.bar, { height: Math.max(revenueHeight, 2), backgroundColor: colors.primary + '80' }]} />
                      <View style={[styles.bar, { height: Math.max(receivedHeight, 2), backgroundColor: '#16A34A' }]} />
                    </View>
                    <Text style={[styles.barLabel, { color: colors.muted }]}>{getMonthName(m.month, true)}</Text>
                    {m.revenue > 0 && (
                      <Text style={[styles.barValue, { color: colors.muted }]}>{formatCurrency(m.revenue).replace('R$\u00a0', '')}</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Por tipo de pagamento */}
        {Object.keys(reportData.byPaymentType).length > 0 && (
          <View style={[styles.breakdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Por Tipo de Pagamento</Text>
            {Object.entries(reportData.byPaymentType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, amount]) => {
                const pct = reportData.totalRevenue > 0 ? (amount / reportData.totalRevenue) * 100 : 0;
                return (
                  <View key={type} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{getPaymentTypeLabel(type as PaymentType)}</Text>
                    <View style={styles.breakdownBar}>
                      <View style={[styles.breakdownFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <View style={styles.breakdownRight}>
                      <Text style={[styles.breakdownValue, { color: colors.foreground }]}>{formatCurrency(amount)}</Text>
                      <Text style={[styles.breakdownPct, { color: colors.muted }]}>{pct.toFixed(0)}%</Text>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {reportData.salesCount === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="bar-chart" size={56} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.muted }]}>Nenhum dado no período</Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>Ajuste o período ou registre vendas</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de filtros */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFilters(false)}>
          <View style={[styles.filterSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Filtros do Relatório</Text>

            <Text style={[styles.filterLabel, { color: colors.muted }]}>Tipo de Pagamento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {PAYMENT_TYPES.map(pt => (
                <Pressable
                  key={pt.value}
                  onPress={() => setFilterPayment(pt.value)}
                  style={[styles.filterOption, { borderColor: colors.border }, filterPayment === pt.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.filterOptionText, { color: filterPayment === pt.value ? '#fff' : colors.foreground }]}>{pt.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.filterLabel, { color: colors.muted }]}>Cliente</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Pressable
                onPress={() => setFilterClientId('all')}
                style={[styles.filterOption, { borderColor: colors.border }, filterClientId === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.filterOptionText, { color: filterClientId === 'all' ? '#fff' : colors.foreground }]}>Todos</Text>
              </Pressable>
              {state.clients.map(c => (
                <Pressable
                  key={c.id}
                  onPress={() => setFilterClientId(c.id)}
                  style={[styles.filterOption, { borderColor: colors.border }, filterClientId === c.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.filterOptionText, { color: filterClientId === c.id ? '#fff' : colors.foreground }]}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {state.tags.length > 0 && (
              <>
                <Text style={[styles.filterLabel, { color: colors.muted }]}>Tag</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <Pressable
                    onPress={() => setFilterTagId('all')}
                    style={[styles.filterOption, { borderColor: colors.border }, filterTagId === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.filterOptionText, { color: filterTagId === 'all' ? '#fff' : colors.foreground }]}>Todas</Text>
                  </Pressable>
                  {state.tags.map(tag => (
                    <Pressable
                      key={tag.id}
                      onPress={() => setFilterTagId(tag.id)}
                      style={[styles.filterOption, { borderColor: tag.color }, filterTagId === tag.id && { backgroundColor: tag.color }]}
                    >
                      <Text style={[styles.filterOptionText, { color: filterTagId === tag.id ? '#fff' : colors.foreground }]}>{tag.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.sheetActions}>
              <Pressable onPress={() => { setFilterPayment('all'); setFilterClientId('all'); setFilterTagId('all'); }} style={[styles.sheetBtn, { backgroundColor: colors.background }]}>
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
  filterBtn: { padding: 8, borderRadius: 8 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  periodCard: { borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  periodItem: { flex: 1, gap: 4 },
  periodLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  monthPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthPickerText: { fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statSub: { fontSize: 12 },
  chartCard: { borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 12 },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },
  chartScroll: { gap: 8, paddingBottom: 4, alignItems: 'flex-end', minHeight: 120 },
  barGroup: { alignItems: 'center', gap: 4, width: 52 },
  bars: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 100 },
  bar: { width: 18, borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 10, fontWeight: '600' },
  barValue: { fontSize: 9, textAlign: 'center' },
  breakdownCard: { borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 12 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownLabel: { fontSize: 13, width: 90 },
  breakdownBar: { flex: 1, height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 3 },
  breakdownRight: { alignItems: 'flex-end', width: 80 },
  breakdownValue: { fontSize: 12, fontWeight: '600' },
  breakdownPct: { fontSize: 11 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 14, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 14, paddingBottom: 32 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#475569', alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  filterLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  filterOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterOptionText: { fontSize: 13, fontWeight: '500' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  sheetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  sheetBtnText: { fontSize: 15, fontWeight: '600' },
});
