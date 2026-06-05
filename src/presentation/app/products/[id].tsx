import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';
import { formatCurrency, formatDate, getMovementTypeLabel } from '@shared/lib/utils';
import { getStockMovementsByProduct, DbStockMovement, getProductTags } from '@infra/database/db';
import { useProduct } from '@/hooks/useProduct';
import { useTags } from '@/hooks/useTags';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { data: product, isLoading } = useProduct(id);
  const { data: tags = [] } = useTags();
  const [movements, setMovements] = useState<DbStockMovement[]>([]);
  const [productTagIds, setProductTagIds] = useState<string[]>([]);

  useEffect(() => {
    getStockMovementsByProduct(id).then(setMovements);
    getProductTags(id).then(setProductTagIds);
  }, [id]);

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Carregando...</Text>
    </View>
  );

  if (!product) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Produto não encontrado</Text>
    </View>
  );

  const stockColor = product.stock <= 0 ? '#DC2626' : product.stock <= 5 ? '#D97706' : '#16A34A';
  const margin = product.averageCost > 0 ? ((product.salePrice - product.averageCost) / product.averageCost * 100).toFixed(1) : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#1E293B' }]}>
            <MaterialIcons name="inventory" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
          {product.category && <Text style={[styles.category, { color: colors.muted }]}>{product.category}</Text>}
          {product.description && <Text style={[styles.description, { color: colors.muted }]}>{product.description}</Text>}
          {productTagIds.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.filter(t => productTagIds.includes(t.id)).map(tag => (
                <TagChip key={tag.id} tag={tag} small />
              ))}
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Preço de Venda</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{formatCurrency(product.salePrice)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Custo Médio</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{formatCurrency(product.averageCost)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Preço de Custo</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{formatCurrency(product.costPrice)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Estoque</Text>
            <View style={styles.stockRow}>
              <Text style={[styles.statValue, { color: stockColor }]}>{product.stock} {product.unit || 'un'}</Text>
            </View>
          </View>
          {margin && (
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Margem</Text>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>{margin}%</Text>
            </View>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: '#1E3A5F', borderColor: '#3B82F6' }]}>
          <MaterialIcons name="desktop-mac" size={16} color="#3B82F6" />
          <Text style={{ color: '#93C5FD', fontSize: 13, flex: 1 }}>
            Gerenciar no Desktop — Os dados de produtos são sincronizados do sistema desktop
          </Text>
        </View>

        <Text style={[styles.dateText, { color: colors.muted }]}>Cadastrado em {formatDate(product.createdAt)}</Text>

        {movements.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Histórico de Movimentações
              <Text style={{ color: colors.muted, fontWeight: '400' }}>  ({movements.length})</Text>
            </Text>
            {movements.map((mov, idx) => {
              const isIn = mov.type === 'in' || mov.type === 'initial';
              const color = mov.type === 'in' ? '#16A34A' : mov.type === 'out' ? '#DC2626' : mov.type === 'initial' ? '#3B82F6' : '#D97706';
              return (
                <View key={mov.id}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.movementRow}>
                    <View style={[styles.movementDot, { backgroundColor: color }]} />
                    <View style={styles.movementInfo}>
                      <View style={styles.movementTop}>
                        <Text style={[styles.movementType, { color: colors.foreground }]}>{getMovementTypeLabel(mov.type as any)}</Text>
                        <Text style={[styles.movementQty, { color }]}>
                          {isIn ? '+' : '-'}{mov.quantity} {product.unit || 'un'}
                        </Text>
                      </View>
                      <Text style={[styles.movementDate, { color: colors.muted }]}>
                        {formatDate(mov.createdAt)}
                        {mov.notes ? ` · ${mov.notes}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
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
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  productName: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  category: { fontSize: 14 },
  description: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 4 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '700' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, textAlign: 'center' },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, borderWidth: 0.5 },
  card: { borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  divider: { height: 0.5 },
  movementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  movementDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  movementInfo: { flex: 1, gap: 2 },
  movementTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  movementType: { fontSize: 14, fontWeight: '500' },
  movementQty: { fontSize: 14, fontWeight: '700' },
  movementDate: { fontSize: 12 },
});
