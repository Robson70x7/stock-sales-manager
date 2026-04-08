import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { SaleStatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

export default function TagDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();

  const tag = state.tags.find(t => t.id === id);
  if (!tag) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Tag não encontrada</Text>
    </View>
  );

  const taggedProducts = state.products.filter(p => p.tagIds.includes(id));
  const taggedClients = state.clients.filter(c => c.tagIds.includes(id));
  const taggedSales = state.sales.filter(s => s.tagIds.includes(id));

  const totalItems = taggedProducts.length + taggedClients.length + taggedSales.length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header da tag */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
          <Text style={[styles.tagName, { color: colors.foreground }]}>{tag.name}</Text>
          <Text style={[styles.tagCount, { color: colors.muted }]}>{totalItems} item{totalItems !== 1 ? 's' : ''} vinculado{totalItems !== 1 ? 's' : ''}</Text>
        </View>

        {/* Clientes */}
        {taggedClients.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="people" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Clientes ({taggedClients.length})</Text>
            </View>
            {taggedClients.map((client, idx) => (
              <Pressable
                key={client.id}
                onPress={() => router.push(`/clients/${client.id}` as any)}
                style={({ pressed }) => [styles.itemRow, idx > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }, pressed && { opacity: 0.7 }]}
              >
                <View style={[styles.avatar, { backgroundColor: tag.color + '20' }]}>
                  <Text style={[styles.avatarText, { color: tag.color }]}>{getInitials(client.name)}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{client.name}</Text>
                  {client.phone && <Text style={[styles.itemSub, { color: colors.muted }]}>{client.phone}</Text>}
                </View>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Produtos */}
        {taggedProducts.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="inventory" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Produtos ({taggedProducts.length})</Text>
            </View>
            {taggedProducts.map((product, idx) => (
              <Pressable
                key={product.id}
                onPress={() => router.push(`/products/${product.id}` as any)}
                style={({ pressed }) => [styles.itemRow, idx > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }, pressed && { opacity: 0.7 }]}
              >
                <View style={[styles.iconBox, { backgroundColor: tag.color + '20' }]}>
                  <MaterialIcons name="inventory" size={18} color={tag.color} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{product.name}</Text>
                  <Text style={[styles.itemSub, { color: colors.muted }]}>Estoque: {product.stock} {product.unit || 'un'}</Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>{formatCurrency(product.salePrice)}</Text>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Vendas */}
        {taggedSales.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="shopping-cart" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Vendas ({taggedSales.length})</Text>
            </View>
            {taggedSales.map((sale, idx) => (
              <Pressable
                key={sale.id}
                onPress={() => router.push(`/sales/${sale.id}` as any)}
                style={({ pressed }) => [styles.itemRow, idx > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }, pressed && { opacity: 0.7 }]}
              >
                <View style={[styles.iconBox, { backgroundColor: tag.color + '20' }]}>
                  <MaterialIcons name="shopping-cart" size={18} color={tag.color} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>{sale.title}</Text>
                  <Text style={[styles.itemSub, { color: colors.muted }]}>
                    {formatDate(sale.saleDate)}{sale.clientName ? ` · ${sale.clientName}` : ''}
                  </Text>
                </View>
                <View style={styles.saleRight}>
                  <Text style={[styles.itemPrice, { color: colors.foreground }]}>{formatCurrency(sale.totalAmount)}</Text>
                  <SaleStatusBadge status={sale.status} small />
                </View>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}

        {totalItems === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="label" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.muted }]}>Nenhum item vinculado</Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>Adicione esta tag em produtos, clientes ou vendas</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  heroCard: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 0.5 },
  tagDot: { width: 24, height: 24, borderRadius: 12 },
  tagName: { fontSize: 24, fontWeight: '700' },
  tagCount: { fontSize: 14 },
  section: { borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, paddingBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '500' },
  itemSub: { fontSize: 12, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '600' },
  saleRight: { alignItems: 'flex-end', gap: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
