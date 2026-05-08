import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate, getMovementTypeLabel } from '@/lib/utils';
import { getStockMovementsByProduct, DbStockMovement } from '@/lib/database/db';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, deleteProduct, addStockMovement } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [entryQuantity, setEntryQuantity] = useState('1');
  const [entryNotes, setEntryNotes] = useState('');
  const [movements, setMovements] = useState<DbStockMovement[]>([]);

  useEffect(() => {
    getStockMovementsByProduct(id).then(setMovements);
  }, [id]);

  const product = state.products.find(p => p.id === id);
  if (!product) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Produto não encontrado</Text>
    </View>
  );

  const stockColor = product.stock <= 0 ? '#DC2626' : product.stock <= 5 ? '#D97706' : '#16A34A';
  const margin = product.costPrice > 0 ? ((product.salePrice - product.costPrice) / product.costPrice * 100).toFixed(1) : null;

  const handleDelete = async () => {
    await deleteProduct(product.id);
    router.back();
  };

  const handleStockEntry = async () => {
    const qty = parseInt(entryQuantity) || 0;
    if (qty <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida.');
      return;
    }
    await addStockMovement({
      productId: product.id,
      quantity: qty,
      type: 'in',
      notes: entryNotes.trim() || undefined,
    });
    setShowEntry(false);
    setEntryQuantity('1');
    setEntryNotes('');

    getStockMovementsByProduct(id).then(setMovements);
    
  };

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

        <View style={styles.actions}>
          <Pressable
            onPress={() => setShowEntry(true)}
            style={({ pressed }) => [styles.editBtn, { backgroundColor: '#16A34A' }, pressed && { opacity: 0.8 }]}
          >
            <MaterialIcons name="add-circle" size={18} color="#fff" />
            <Text style={styles.editBtnText}>Entrada</Text>
          </Pressable>
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

      <Modal visible={showEntry} transparent animationType="slide" onRequestClose={() => setShowEntry(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowEntry(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Entrada Manual de Estoque</Text>
            <Text style={[styles.modalProduct, { color: colors.muted }]}>{product.name}</Text>

            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Quantidade</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={entryQuantity}
                onChangeText={setEntryQuantity}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Observação</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={entryNotes}
                onChangeText={setEntryNotes}
                placeholder="Opcional"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowEntry(false)}
                style={[styles.modalBtn, { backgroundColor: colors.background }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.muted }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleStockEntry}
                style={[styles.modalBtn, { backgroundColor: '#16A34A' }]}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Adicionar</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

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
  sku: { fontSize: 12, fontFamily: 'monospace' },
  supplier: { fontSize: 12 },
  description: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 4 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '700' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  minStockText: { fontSize: 10 },
  dateText: { fontSize: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 16, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalProduct: { fontSize: 14, marginTop: -12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 14, width: 100 },
  input: { flex: 1, fontSize: 14, textAlign: 'right' },
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
