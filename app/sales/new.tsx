import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';
import { generateInstallments, formatCurrency, getPaymentTypeLabel } from '@/lib/utils';
import { PaymentType, SaleItem } from '@/types';

const PAYMENT_TYPES: PaymentType[] = ['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'installment'];

export default function NewSaleScreen() {
  const { state, addSale } = useApp();
  const colors = useColors();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [manualAmount, setManualAmount] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedClient = state.clients.find(c => c.id === selectedClientId);

  const totalFromItems = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const totalAmount = totalFromItems > 0 ? totalFromItems : (parseFloat(manualAmount.replace(',', '.')) || 0);

  const toggleTag = (id: string) => {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const addProduct = (productId: string) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    const existing = items.find(i => i.productId === productId);
    if (existing) {
      setItems(items.map(i => i.productId === productId
        ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
        : i
      ));
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        totalPrice: product.salePrice,
      }]);
    }
    setShowProductPicker(false);
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const updateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(items.map(i => i.productId === productId ? { ...i, quantity: qty, totalPrice: qty * i.unitPrice } : i));
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Atenção', 'Informe um título para a venda.'); return; }
    if (totalAmount <= 0) { Alert.alert('Atenção', 'Informe o valor da venda.'); return; }

    setSaving(true);
    try {
      const saleId = Date.now().toString(36);
      const isInstallment = paymentType === 'installment' || installmentsCount > 1;
      const count = isInstallment ? installmentsCount : 1;
      const installments = count > 1
        ? generateInstallments(saleId, totalAmount, count, saleDate)
        : [{
            id: Date.now().toString(36) + 'i',
            saleId,
            number: 1,
            totalInstallments: 1,
            amount: totalAmount,
            dueDate: saleDate,
            status: 'pending' as const,
          }];

      await addSale({
        title: title.trim(),
        description: description.trim() || undefined,
        clientId: selectedClientId,
        clientName: selectedClient?.name,
        items,
        totalAmount,
        paymentType,
        status: 'pending',
        installmentsCount: count,
        installments,
        tagIds: selectedTagIds,
        saleDate: new Date(saleDate).toISOString(),
      });
      router.back();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a venda.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        {/* Informações básicas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Informações</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Título *</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={title} onChangeText={setTitle} placeholder="Ex: Venda de produtos" placeholderTextColor={colors.muted} returnKeyType="next" />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Descrição</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={description} onChangeText={setDescription} placeholder="Opcional" placeholderTextColor={colors.muted} multiline />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Data</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={saleDate} onChangeText={setSaleDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cliente</Text>
          <Pressable
            onPress={() => setShowClientPicker(true)}
            style={({ pressed }) => [styles.pickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="person" size={18} color={selectedClient ? colors.primary : colors.muted} />
            <Text style={[styles.pickerText, { color: selectedClient ? colors.foreground : colors.muted }]}>
              {selectedClient ? selectedClient.name : 'Selecionar cliente (opcional)'}
            </Text>
            {selectedClient && (
              <Pressable onPress={() => setSelectedClientId(undefined)}>
                <MaterialIcons name="close" size={18} color={colors.muted} />
              </Pressable>
            )}
          </Pressable>
        </View>

        {/* Produtos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Produtos</Text>
            <Pressable onPress={() => setShowProductPicker(true)} style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary + '20' }, pressed && { opacity: 0.7 }]}>
              <MaterialIcons name="add" size={16} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>Adicionar</Text>
            </Pressable>
          </View>
          {items.length > 0 ? (
            <View style={[styles.itemsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {items.map((item, idx) => (
                <View key={item.productId}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>{item.productName}</Text>
                      <Text style={[styles.itemPrice, { color: colors.muted }]}>{formatCurrency(item.unitPrice)} un.</Text>
                    </View>
                    <View style={styles.qtyControl}>
                      <Pressable onPress={() => updateItemQty(item.productId, item.quantity - 1)} style={styles.qtyBtn}>
                        <MaterialIcons name="remove" size={16} color={colors.primary} />
                      </Pressable>
                      <Text style={[styles.qtyText, { color: colors.foreground }]}>{item.quantity}</Text>
                      <Pressable onPress={() => updateItemQty(item.productId, item.quantity + 1)} style={styles.qtyBtn}>
                        <MaterialIcons name="add" size={16} color={colors.primary} />
                      </Pressable>
                    </View>
                    <Text style={[styles.itemTotal, { color: colors.foreground }]}>{formatCurrency(item.totalPrice)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.inputRow}>
                <Text style={[styles.label, { color: colors.muted }]}>Valor Total *</Text>
                <TextInput style={[styles.input, { color: colors.foreground }]} value={manualAmount} onChangeText={setManualAmount} placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
              </View>
            </View>
          )}
          {totalAmount > 0 && (
            <View style={[styles.totalRow, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.totalLabel, { color: colors.primary }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(totalAmount)}</Text>
            </View>
          )}
        </View>

        {/* Pagamento */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pagamento</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {PAYMENT_TYPES.map(pt => (
              <Pressable
                key={pt}
                onPress={() => { setPaymentType(pt); if (pt !== 'installment') setInstallmentsCount(1); }}
                style={[styles.paymentOption, { borderColor: colors.border }, paymentType === pt && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.paymentText, { color: paymentType === pt ? '#fff' : colors.foreground }]}>{getPaymentTypeLabel(pt)}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {(paymentType === 'installment' || installmentsCount > 1) && (
            <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 10 }]}>
              <View style={styles.inputRow}>
                <Text style={[styles.label, { color: colors.muted }]}>Nº de Parcelas</Text>
                <View style={styles.qtyControl}>
                  <Pressable onPress={() => setInstallmentsCount(Math.max(1, installmentsCount - 1))} style={styles.qtyBtn}>
                    <MaterialIcons name="remove" size={16} color={colors.primary} />
                  </Pressable>
                  <Text style={[styles.qtyText, { color: colors.foreground }]}>{installmentsCount}x</Text>
                  <Pressable onPress={() => setInstallmentsCount(Math.min(60, installmentsCount + 1))} style={styles.qtyBtn}>
                    <MaterialIcons name="add" size={16} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
              {totalAmount > 0 && installmentsCount > 1 && (
                <View style={styles.inputRow}>
                  <Text style={[styles.label, { color: colors.muted }]}>Valor por Parcela</Text>
                  <Text style={[styles.input, { color: colors.primary, textAlign: 'right' }]}>{formatCurrency(totalAmount / installmentsCount)}</Text>
                </View>
              )}
            </View>
          )}

          {paymentType === 'credit_card' && (
            <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 10 }]}>
              <View style={styles.inputRow}>
                <Text style={[styles.label, { color: colors.muted }]}>Parcelas</Text>
                <View style={styles.qtyControl}>
                  <Pressable onPress={() => setInstallmentsCount(Math.max(1, installmentsCount - 1))} style={styles.qtyBtn}>
                    <MaterialIcons name="remove" size={16} color={colors.primary} />
                  </Pressable>
                  <Text style={[styles.qtyText, { color: colors.foreground }]}>{installmentsCount}x</Text>
                  <Pressable onPress={() => setInstallmentsCount(Math.min(12, installmentsCount + 1))} style={styles.qtyBtn}>
                    <MaterialIcons name="add" size={16} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Tags */}
        {state.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tags</Text>
            <View style={styles.tagsWrap}>
              {state.tags.map(tag => (
                <TagChip key={tag.id} tag={tag} selected={selectedTagIds.includes(tag.id)} onPress={() => toggleTag(tag.id)} />
              ))}
            </View>
          </View>
        )}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }, saving && { opacity: 0.6 }]}
        >
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Registrar Venda'}</Text>
        </Pressable>
      </View>

      {/* Picker de cliente */}
      <Modal visible={showClientPicker} transparent animationType="slide" onRequestClose={() => setShowClientPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowClientPicker(false)}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Selecionar Cliente</Text>
            <FlatList
              data={state.clients}
              keyExtractor={c => c.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setSelectedClientId(item.id); setShowClientPicker(false); }}
                  style={({ pressed }) => [styles.pickerItem, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.background }]}
                >
                  <Text style={[styles.pickerItemText, { color: colors.foreground }]}>{item.name}</Text>
                  {item.phone && <Text style={[styles.pickerItemSub, { color: colors.muted }]}>{item.phone}</Text>}
                </Pressable>
              )}
              style={{ maxHeight: 300 }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Picker de produto */}
      <Modal visible={showProductPicker} transparent animationType="slide" onRequestClose={() => setShowProductPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowProductPicker(false)}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Adicionar Produto</Text>
            <FlatList
              data={state.products}
              keyExtractor={p => p.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => addProduct(item.id)}
                  style={({ pressed }) => [styles.pickerItem, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.background }]}
                >
                  <Text style={[styles.pickerItemText, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.pickerItemSub, { color: colors.primary }]}>{formatCurrency(item.salePrice)}</Text>
                </Pressable>
              )}
              style={{ maxHeight: 300 }}
            />
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 16, gap: 20, paddingBottom: 40 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  addBtnText: { fontSize: 13, fontWeight: '600' },
  inputGroup: { borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  label: { fontSize: 14, width: 120 },
  input: { flex: 1, fontSize: 14, textAlign: 'right' },
  divider: { height: 0.5, marginLeft: 14 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 0.5 },
  pickerText: { flex: 1, fontSize: 14 },
  itemsList: { borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '500' },
  itemPrice: { fontSize: 12, marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  itemTotal: { fontSize: 14, fontWeight: '600', minWidth: 70, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10 },
  totalLabel: { fontSize: 14, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  paymentOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  paymentText: { fontSize: 13, fontWeight: '500' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  pickerItem: { paddingVertical: 14, borderBottomWidth: 0.5, gap: 2 },
  pickerItemText: { fontSize: 15, fontWeight: '500' },
  pickerItemSub: { fontSize: 13 },
});
