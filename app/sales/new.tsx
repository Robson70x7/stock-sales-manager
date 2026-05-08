import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { generateInstallments, generateInstallmentsWithEntry, formatCurrency, getPaymentTypeLabel, applyCurrencyMask, unmaskCurrency } from '@/lib/utils';
import { PaymentType, SaleItem } from '@/types';

const PAYMENT_TYPES: PaymentType[] = ['cash', 'pix', 'credit_card', 'debit_card'];

export default function NewSaleScreen() {
  const { state, addSale, addClient } = useApp();
  const colors = useColors();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  // const [manualAmount, setManualAmount] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryPaymentType, setEntryPaymentType] = useState<PaymentType>(paymentType);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [saving, setSaving] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  const selectedClient = state.clients.find(c => c.id === selectedClientId);

  const totalFromItems = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const subtotal = totalFromItems

  const discountAmount = (() => {
    if (!discountValue || subtotal === 0) return 0;
    const val = discountType === 'percentage' ? parseFloat(discountValue.replace(',', '.')) || 0 : unmaskCurrency(discountValue);
    if (discountType === 'percentage') {
      return subtotal * (val / 100);
    }
    return val;
  })();

  const totalAmount = Math.max(0, subtotal - discountAmount);
  
  useEffect(() => {
    const entryVal = unmaskCurrency(entryAmount);
    if (entryVal === 0) {
      setEntryPaymentType(paymentType);
    }
  }, [paymentType, entryAmount]);
  
  const toggleTag = (id: string) => {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };


  const addProduct = (productId: string) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = items.find(i => i.productId === productId);
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + 1;
    
    if (newQty > product.stock) {
      Alert.alert('Estoque Insuficiente', `Apenas ${product.stock} unidade(s) disponivel(is) de "${product.name}".`);
      return;
    }
    
    if (existing) {
      setItems(items.map(i => i.productId === productId
        ? { ...i, quantity: newQty, totalPrice: newQty * i.unitPrice }
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
    
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    if (qty > product.stock) {
      Alert.alert('Estoque Insuficiente', `Apenas ${product.stock} unidade(s) disponivel(is) de "${product.name}".`);
      return;
    }
    
    setItems(items.map(i => i.productId === productId ? { ...i, quantity: qty, totalPrice: qty * i.unitPrice } : i));
  };

  const handleSave = async () => {
    if (totalAmount <=0) { Alert.alert('Atenção', 'Informe o valor da venda.'); return; }

    const entryVal = unmaskCurrency(entryAmount);
    if (entryVal > 0 && entryVal >= totalAmount) {
      Alert.alert('Entrada', 'O valor de entrada não pode ser igual ou maior que o total. Marque como à vista.');
      return;
    }
    if (entryVal > totalAmount) {
      Alert.alert('Atenção', 'O valor de entrada não pode exceder o total da venda.');
      return;
    }

    setSaving(true);
    try {
      const isCredit = paymentType === 'credit_card';
      const count = isCredit ? 1 : installmentsCount;
      const markAsPaid = isPaid || isCredit;
      const saleStatus = markAsPaid ? 'paid' as const : 'pending' as const;

      let installments;
      if (entryVal > 0 && count > 1) {
        installments = generateInstallmentsWithEntry(totalAmount, entryVal, count, firstInstallmentDate);
      } else if (count > 1 && !isCredit) {
        installments = generateInstallments(totalAmount, count, firstInstallmentDate);
      } else {
        installments = [{
            ...generateInstallments(totalAmount, 1, firstInstallmentDate)[0],
            status: markAsPaid ? 'paid' as const : 'pending' as const,
            paidDate: markAsPaid ? new Date().toISOString() : null,
            history: [{
              date: new Date().toISOString(),
              status: markAsPaid ? 'paid' as const : 'pending' as const,
              notes: markAsPaid ? 'Pago' : 'Parcela criada',
            }],
          }];
      }

      await addSale({
        description: description.trim() || undefined,
        clientId: selectedClientId,
        clientName: selectedClient?.name,
        items,
        subtotal,
        discountType: discountValue ? discountType : null,
        discountValue: discountValue ? (discountType === 'percentage' ? parseFloat(discountValue.replace(',', '.')) || 0 : unmaskCurrency(discountValue)) : 0,
        totalAmount,
        entryAmount: entryVal > 0 ? entryVal : undefined,
        entryPaymentType: entryVal > 0 ? entryPaymentType : undefined,
        paymentType,
        status: saleStatus,
        installmentsCount: count,
        installments,
        tagIds: selectedTagIds,
        saleDate: new Date(saleDate).toISOString(),
        firstInstallmentDate: new Date(firstInstallmentDate).toISOString(),
      });
      
      router.back();
    } catch (e) {
      console.error('Erro ao salvar venda:', e);
      const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
      Alert.alert('Erro', `Não foi possível salvar a venda: ${errorMessage}`);
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
              <Text style={[styles.label, { color: colors.muted }]}>Descrição</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={description} onChangeText={setDescription} placeholder="Opcional" placeholderTextColor={colors.muted} multiline />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <DatePickerField
              label="Data da Venda"
              value={saleDate}
              onChange={setSaleDate}
              placeholder="Selecione a data"
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            {paymentType !== 'credit_card' && (
              <DatePickerField
                label="Data da 1ª Parcela"
                value={firstInstallmentDate}
                onChange={setFirstInstallmentDate}
                placeholder="Selecione a data"
              />
            )}
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cliente</Text>
            <Pressable onPress={() => setShowNewClient(true)} style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary + '20' }, pressed && { opacity: 0.7 }]}>
              <MaterialIcons name="add" size={16} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>Novo</Text>
            </Pressable>
          </View>
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
          
          <View style={[styles.totalRow, { backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.totalLabel, { color: colors.primary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(totalAmount)}</Text>
          </View>
          
          {/* Seção de Desconto - Only when using products */}
          {totalFromItems > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Desconto</Text>
              <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.discountToggle}>
                  <Pressable
                    onPress={() => setDiscountType('percentage')}
                    style={[
                      styles.discountBtn,
                      { borderColor: colors.border },
                      discountType === 'percentage' && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                  >
                    <Text style={[styles.discountBtnText, { color: discountType === 'percentage' ? '#fff' : colors.foreground }]}>%</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setDiscountType('fixed')}
                    style={[
                      styles.discountBtn,
                      { borderColor: colors.border },
                      discountType === 'fixed' && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                  >
                    <Text style={[styles.discountBtnText, { color: discountType === 'fixed' ? '#fff' : colors.foreground }]}>R$</Text>
                  </Pressable>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.inputRow}>
                  <Text style={[styles.label, { color: colors.muted }]}>
                    {discountType === 'percentage' ? 'Percentual' : 'Valor'}
                  </Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={discountValue}
                    onChangeText={(text) => setDiscountValue(discountType === 'percentage' ? text.replace(/[^\d]/g, '') : applyCurrencyMask(text))}
                    placeholder={discountType === 'percentage' ? '0' : 'R$ 0,00'}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Resumo com desconto */}
              {discountAmount > 0 && (
                <View style={[styles.discountSummary, { backgroundColor: colors.surface }]}>
                  <View style={styles.discountRow}>
                    <Text style={[styles.discountLabel, { color: colors.muted }]}>Subtotal</Text>
                    <Text style={[styles.discountValue, { color: colors.foreground }]}>{formatCurrency(subtotal)}</Text>
                  </View>
                  <View style={styles.discountRow}>
                    <Text style={[styles.discountLabel, { color: colors.muted }]}>
                      Desconto ({discountType === 'percentage' ? `${discountValue}%` : discountValue})
                    </Text>
                    <Text style={[styles.discountValue, { color: '#DC2626' }]}>-{formatCurrency(discountAmount)}</Text>
                  </View>
                  <View style={[styles.discountTotal, { borderTopColor: colors.border }]}>
                    <Text style={[styles.discountLabel, { color: colors.primary, fontWeight: '700' }]}>Total</Text>
                    <Text style={[styles.discountValue, { color: colors.primary, fontWeight: '700' }]}>{formatCurrency(totalAmount)}</Text>
                  </View>
                </View>
              )}
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
                onPress={() => setPaymentType(pt)}
                style={[styles.paymentOption, { borderColor: colors.border }, paymentType === pt && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.paymentText, { color: paymentType === pt ? '#fff' : colors.foreground }]}>{getPaymentTypeLabel(pt)}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Opção de parcelas apenas para não-crédito */}
          {paymentType !== 'credit_card' && (
              <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 10 }]}>
              <View style={styles.inputRow}>
                <Text style={[styles.label, { color: colors.muted }]}>Valor de Entrada</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={entryAmount}
                  onChangeText={(text) => setEntryAmount(applyCurrencyMask(text))}
                  placeholder="R$ 0,00"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                />
              </View>
              {unmaskCurrency(entryAmount) > 0 && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.inputRow}>
                    <Text style={[styles.label, { color: colors.muted }]}>Tipo de Entrada</Text>
                  </View>
                  <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {PAYMENT_TYPES.map(pt => (
                        <Pressable
                          key={pt}
                          onPress={() => setEntryPaymentType(pt)}
                          style={[styles.paymentOption, { borderColor: colors.border }, entryPaymentType === pt && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        >
                          <Text style={[styles.paymentText, { color: entryPaymentType === pt ? '#fff' : colors.foreground }]}>{getPaymentTypeLabel(pt)}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
                  <Text style={[styles.input, { color: colors.primary, textAlign: 'right' }]}>
                    {formatCurrency((totalAmount - unmaskCurrency(entryAmount)) / Math.max(1, installmentsCount))}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Opção "Já pago" para parcela única não-crédito */}
          {paymentType !== 'credit_card' && installmentsCount === 1 && (
            <Pressable
              onPress={() => setIsPaid(!isPaid)}
              style={[styles.paymentOption, { borderColor: colors.border, alignSelf: 'flex-start', marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, isPaid && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <MaterialIcons name={isPaid ? 'check-box' : 'check-box-outline-blank'} size={20} color={isPaid ? '#fff' : colors.muted} />
              <Text style={[styles.paymentText, { color: isPaid ? '#fff' : colors.foreground }]}>Marcar como pago</Text>
            </Pressable>
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
            <TextInput
              style={[styles.searchInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Buscar cliente..."
              placeholderTextColor={colors.muted}
              value={clientSearch}
              onChangeText={setClientSearch}
            />
            <FlatList
              data={state.clients.filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()))}
              keyExtractor={c => c.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setSelectedClientId(item.id); setShowClientPicker(false); setClientSearch(''); }}
                  style={({ pressed }) => [styles.pickerItem, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.background }]}
                >
                  <Text style={[styles.pickerItemText, { color: colors.foreground }]}>{item.name}</Text>
                  {item.phone && <Text style={[styles.pickerItemSub, { color: colors.muted }]}>{item.phone}</Text>}
                </Pressable>
              )}
              style={{ minHeight: 500 }}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </Pressable>
      </Modal>

      {/* Picker de produto */}
      <Modal visible={showProductPicker}  transparent animationType="slide" onRequestClose={() => setShowProductPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowProductPicker(false)}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Adicionar Produto</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Buscar produto..."
              placeholderTextColor={colors.muted}
              value={productSearch}
              onChangeText={setProductSearch}
            />
            <FlatList
              data={state.products.filter(p => p.stock > 0 && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())))}
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
              style={{maxHeight: 500}}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </Pressable>
      </Modal>

      {/* Modal de novo cliente */}
      <Modal visible={showNewClient} transparent animationType="slide" onRequestClose={() => setShowNewClient(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.overlay} onPress={() => setShowNewClient(false)}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
              <View style={[styles.pickerSheet, { backgroundColor: colors.surface }]}>
                <View style={styles.sheetHandle} />
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>Novo Cliente</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 }]}
                  placeholder="Nome do cliente"
                  placeholderTextColor={colors.muted}
                  value={newClientName}
                  onChangeText={setNewClientName}
                  returnKeyType="done"
                  autoFocus
                />
                <Pressable
                  onPress={async () => {
                    if (!newClientName.trim()) {
                      Alert.alert('Atencao', 'Informe o nome do cliente.');
                      return;
                    }
                    const newClient = await addClient({ name: newClientName.trim() });
                    setSelectedClientId(newClient.id);
                    setNewClientName('');
                    setShowNewClient(false);
                  }}
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.saveBtnText}>Criar Cliente</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
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
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  itemTotal: { fontSize: 14, fontWeight: '600', minWidth: 70, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10 },
  totalLabel: { fontSize: 14, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  paymentOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  paymentText: { fontSize: 13, fontWeight: '500' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8 ,marginBottom:40 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: {  borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  pickerItem: { paddingVertical: 14, borderBottomWidth: 0.5, gap: 2 },
  pickerItemText: { fontSize: 15, fontWeight: '500' },
  pickerItemSub: { fontSize: 13 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#475569', alignSelf: 'center', marginBottom: 12 },
  searchInput: { fontSize: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  discountToggle: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  discountBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  discountBtnText: { fontSize: 13, fontWeight: '600' },
  discountSummary: { padding: 12, gap: 8, borderRadius: 10, marginTop: 8 },
  discountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discountLabel: { fontSize: 13 },
  discountValue: { fontSize: 14, fontWeight: '600' },
  discountTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 0.5 },
});
