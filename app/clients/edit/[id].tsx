import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateClient } = useApp();
  const colors = useColors();
  const router = useRouter();

  const client = state.clients.find(c => c.id === id);
  const [name, setName] = useState(client?.name || '');
  const [document, setDocument] = useState(client?.document || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [address, setAddress] = useState(client?.address || '');
  const [notes, setNotes] = useState(client?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!client) return null;

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Atenção', 'Informe o nome do cliente.'); return; }
    setSaving(true);
    try {
      await updateClient({
        ...client,
        name: name.trim(),
        document: document.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o cliente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dados Pessoais</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Nome *</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={name} onChangeText={setName} placeholder="Nome completo" placeholderTextColor={colors.muted} />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>CPF/CNPJ</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={document} onChangeText={setDocument} placeholder="Opcional" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contato</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Telefone</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>E-mail</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={email} onChangeText={setEmail} placeholder="email@exemplo.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Endereço</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={address} onChangeText={setAddress} placeholder="Endereço completo" placeholderTextColor={colors.muted} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Observações</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.notesInput, { color: colors.foreground }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Anotações sobre o cliente..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }, saving && { opacity: 0.6 }]}
        >
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Text>
        </Pressable>
      </View>
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
  notesInput: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 80 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
