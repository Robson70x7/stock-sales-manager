import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';
import { formatCurrency, getPaymentTypeLabel } from '@/lib/utils';
import { PaymentType, SaleStatus } from '@/types';

const PAYMENT_TYPES: PaymentType[] = ['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'installment'];
const STATUSES: { value: SaleStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'partial', label: 'Parcial' },
  { value: 'paid', label: 'Pago' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function EditSaleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateSale } = useApp();
  const colors = useColors();
  const router = useRouter();

  const sale = state.sales.find(s => s.id === id);
  const [description, setDescription] = useState(sale?.description || '');
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(sale?.clientId);
  const [paymentType, setPaymentType] = useState<PaymentType>(sale?.paymentType || 'cash');
  const [status, setStatus] = useState<SaleStatus>(sale?.status || 'pending');
  const [saleDate, setSaleDate] = useState(sale?.saleDate ? sale.saleDate.split('T')[0] : '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(sale?.tagIds || []);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!sale) return null;

  const selectedClient = state.clients.find(c => c.id === selectedClientId);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSale({
        ...sale,
        description: description.trim() || undefined,
        clientId: selectedClientId,
        clientName: selectedClient?.name,
        paymentType,
        status,
        saleDate: new Date(saleDate).toISOString(),
        tagIds: selectedTagIds,
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Informações</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Status</Text>
          <View style={styles.statusGrid}>
            {STATUSES.map(s => (
              <Pressable
                key={s.value}
                onPress={() => setStatus(s.value)}
                style={[styles.statusOption, { borderColor: colors.border }, status === s.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.statusText, { color: status === s.value ? '#fff' : colors.foreground }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

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
        </View>

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
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Text>
        </Pressable>
      </View>

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
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputGroup: { borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  label: { fontSize: 14, width: 100 },
  input: { flex: 1, fontSize: 14, textAlign: 'right' },
  divider: { height: 0.5, marginLeft: 14 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 0.5 },
  pickerText: { flex: 1, fontSize: 14 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 13, fontWeight: '500' },
  paymentOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  paymentText: { fontSize: 13, fontWeight: '500' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  pickerItem: { paddingVertical: 14, borderBottomWidth: 0.5 },
  pickerItemText: { fontSize: 15, fontWeight: '500' },
});
