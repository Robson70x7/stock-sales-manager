import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { FAB } from '@/components/ui/FAB';
import { EmptyState } from '@/components/ui/EmptyState';
import { TagChip } from '@/components/ui/TagChip';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';

export default function ProductsScreen() {
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return state.products;
    return state.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category?.toLowerCase().includes(q)) ||
      (p.description?.toLowerCase().includes(q))
    );
  }, [state.products, search]);

  const renderItem = ({ item }: { item: Product }) => {
    const tags = state.tags.filter(t => item.tagIds.includes(t.id));
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
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map(tag => <TagChip key={tag.id} tag={tag} small />)}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Produtos</Text>
        <Pressable onPress={() => router.push('/tags/index' as any)} style={({ pressed }) => [styles.tagBtn, pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="label" size={20} color={colors.primary} />
          <Text style={[styles.tagBtnText, { color: colors.primary }]}>Tags</Text>
        </Pressable>
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
            subtitle={search ? 'Tente outro termo de busca' : 'Toque no botão + para adicionar seu primeiro produto'}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={() => router.push('/products/new')} />
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
});
