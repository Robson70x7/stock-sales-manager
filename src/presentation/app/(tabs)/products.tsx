import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, Image, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { EmptyState } from '@/components/ui/EmptyState';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency } from '@shared/lib/utils';
import { Product } from '@shared/types';
import { useProducts } from '@/hooks/useProducts';

type StockFilter = 'all' | 'out' | 'low' | 'normal';
type SortOption = 'name' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'date_desc';

const STOCK_FILTERS: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'out', label: 'Esgotado' },
  { value: 'low', label: 'Estoque baixo' },
  { value: 'normal', label: 'Normal' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Nome' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'stock_asc', label: 'Menor estoque' },
  { value: 'stock_desc', label: 'Maior estoque' },
  { value: 'date_desc', label: 'Mais recentes' },
];

export default function ProductsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data: products = [] } = useProducts();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...products];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q)) ||
        (p.description?.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter !== 'all') {
      result = result.filter(p => {
        if (stockFilter === 'out') return p.stock <= 0;
        if (stockFilter === 'low') return p.stock > 0 && p.stock <= 5;
        if (stockFilter === 'normal') return p.stock > 5;
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price_asc':
          return a.salePrice - b.salePrice;
        case 'price_desc':
          return b.salePrice - a.salePrice;
        case 'stock_asc':
          return a.stock - b.stock;
        case 'stock_desc':
          return b.stock - a.stock;
        case 'date_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [products, search, categoryFilter, stockFilter, sortBy]);

  const renderItem = ({ item }: { item: Product }) => {
    const stockColor = item.stock <= 0 ? '#DC2626' : item.stock <= 5 ? '#D97706' : '#16A34A';

    return (
      <Pressable
        onPress={() => router.push(`/products/${item.id}`)}
        style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.productIcon, { backgroundColor: colors.surface }]}>
            {item.photoUri ? (
              <Image source={{ uri: item.photoUri }} style={styles.productPhoto} />
            ) : (
              <MaterialIcons name="inventory" size={20} color={colors.primary} />
            )}
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
            {item.category && <Text style={[styles.category, { color: colors.muted }]}>{item.category}</Text>}
          </View>
          <View style={styles.priceBlock}>
            <Text style={[styles.price, { color: colors.primary }]}>{formatCurrency(item.salePrice)}</Text>
            <View style={[styles.stockBadge, { backgroundColor: stockColor + '20' }]}>
              <Text style={[styles.stockText, { color: stockColor }]}>{item.stock} un.</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const hasFilters = categoryFilter !== 'all' || stockFilter !== 'all' || sortBy !== 'name';

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Produtos</Text>
        <View style={styles.headerActions}>
          <Pressable 
            onPress={() => setShowFilters(true)}
            style={({ pressed }) => [styles.filterBtn, hasFilters && { backgroundColor: colors.primary + '20' }, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="filter-list" size={20} color={hasFilters ? colors.primary : colors.muted} />
            {hasFilters && <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />}
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Buscar produtos..."
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
          {categoryFilter !== 'all' && (
            <Pressable onPress={() => setCategoryFilter('all')} style={[styles.filterChip, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterChipText}>{categoryFilter}</Text>
              <MaterialIcons name="close" size={14} color="#fff" />
            </Pressable>
          )}
          {stockFilter !== 'all' && (
            <Pressable onPress={() => setStockFilter('all')} style={[styles.filterChip, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterChipText}>{STOCK_FILTERS.find(f => f.value === stockFilter)?.label}</Text>
              <MaterialIcons name="close" size={14} color="#fff" />
            </Pressable>
          )}
          {sortBy !== 'name' && (
            <Pressable onPress={() => setSortBy('name')} style={[styles.filterChip, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterChipText}>{SORT_OPTIONS.find(s => s.value === sortBy)?.label}</Text>
              <MaterialIcons name="close" size={14} color="#fff" />
            </Pressable>
          )}
        </ScrollView>
      )}

      <View style={styles.statsRow}>
        <Text style={[styles.statsText, { color: colors.muted }]}>
          {filtered.length} produto{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState
            icon="inventory"
            title="Nenhum produto encontrado"
            subtitle={search || hasFilters ? 'Tente outros filtros' : 'Conecte ao desktop para sincronizar dados'}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de filtros */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFilters(false)}>
          <View style={[styles.filterSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Filtros</Text>

            <Text style={[styles.filterLabel, { color: colors.muted }]}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              <Pressable
                onPress={() => setCategoryFilter('all')}
                style={[styles.filterOption, categoryFilter === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.filterOptionText, { color: categoryFilter === 'all' ? '#fff' : colors.foreground }]}>Todos</Text>
              </Pressable>
              {categories.map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setCategoryFilter(cat)}
                  style={[styles.filterOption, categoryFilter === cat && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.filterOptionText, { color: categoryFilter === cat ? '#fff' : colors.foreground }]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.filterLabel, { color: colors.muted }]}>Estoque</Text>
            <View style={styles.statusGrid}>
              {STOCK_FILTERS.map(f => (
                <Pressable
                  key={f.value}
                  onPress={() => setStockFilter(f.value)}
                  style={[styles.filterOption, stockFilter === f.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.filterOptionText, { color: stockFilter === f.value ? '#fff' : colors.foreground }]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.filterLabel, { color: colors.muted }]}>Ordenar por</Text>
            <View style={styles.statusGrid}>
              {SORT_OPTIONS.map(s => (
                <Pressable
                  key={s.value}
                  onPress={() => setSortBy(s.value)}
                  style={[styles.filterOption, sortBy === s.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.filterOptionText, { color: sortBy === s.value ? '#fff' : colors.foreground }]}>{s.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <Pressable onPress={() => { setCategoryFilter('all'); setStockFilter('all'); setSortBy('name'); }} style={[styles.sheetBtn, { backgroundColor: colors.background }]}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 22, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 4 },
  filterBtn: { padding: 8, borderRadius: 8, position: 'relative' },
  filterDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
  tagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  tagBtnText: { fontSize: 13, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 0.5,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  activeFilters: { maxHeight: 50 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  filterChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsRow: { paddingHorizontal: 16, paddingVertical: 8 },
  statsText: { fontSize: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productPhoto: { width: 40, height: 40, borderRadius: 10 },
  cardInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600' },
  category: { fontSize: 12, marginTop: 2 },
  priceBlock: { alignItems: 'flex-end', gap: 4 },
  price: { fontSize: 15, fontWeight: '700' },
  stockBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  stockText: { fontSize: 11, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 4 },

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
});
