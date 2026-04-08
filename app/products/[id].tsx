import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, deleteProduct } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const product = state.products.find(p => p.id === id);
  if (!product) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Produto não encontrado</Text>
    </View>
  );

  const tags = state.tags.filter(t => product.tagIds.includes(t.id));
  const stockColor = product.stock <= 0 ? '#DC2626' : product.stock <= 5 ? '#D97706' : '#16A34A';
  const margin = product.costPrice > 0 ? ((product.salePrice - product.costPrice) / product.costPrice * 100).toFixed(1) : null;

  const handleDelete = async () => {
    await deleteProduct(product.id);
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
            <MaterialIcons name="inventory" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
          {product.category && <Text style={[styles.category, { color: colors.muted }]}>{product.category}</Text>}
          {product.description && <Text style={[styles.description, { color: colors.muted }]}>{product.description}</Text>}
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map(tag => <TagChip key={tag.id} tag={tag} small />)}
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Preço de Venda</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{formatCurrency(product.salePrice)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Preço de Custo</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{formatCurrency(product.costPrice)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Estoque</Text>
            <Text style={[styles.statValue, { color: stockColor }]}>{product.stock} {product.unit || 'un'}</Text>
          </View>
          {margin && (
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Margem</Text>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>{margin}%</Text>
            </View>
          )}
        </View>

        <Text style={[styles.dateText, { color: colors.muted }]}>Cadastrado em {formatDate(product.createdAt)}</Text>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push(`/products/edit/${product.id}` as any)}
            style={({ pressed }) => [styles.editBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
          >
            <MaterialIcons name="edit" size={18} color="#fff" />
            <Text style={styles.editBtnText}>Editar</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowDelete(true)}
            style={({ pressed }) => [styles.deleteBtn, { borderColor: '#DC2626' }, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="delete" size={18} color="#DC2626" />
            <Text style={[styles.deleteBtnText, { color: '#DC2626' }]}>Excluir</Text>
          </Pressable>
        </View>
      </View>

      <ConfirmDialog
        visible={showDelete}
        title="Excluir Produto"
        message={`Deseja excluir "${product.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
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
  dateText: { fontSize: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});
