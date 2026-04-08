import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, Modal, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { TAG_COLORS, generateId } from '@/lib/utils';
import { Tag } from '@/types';
import { ScreenContainer } from '@/components/screen-container';
import { FAB } from '@/components/ui/FAB';

export default function TagsScreen() {
  const { state, addTag, updateTag, deleteTag } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor(TAG_COLORS[0]);
    setShowForm(true);
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!tagName.trim()) { Alert.alert('Atenção', 'Informe o nome da tag.'); return; }
    setSaving(true);
    try {
      if (editingTag) {
        await updateTag({ ...editingTag, name: tagName.trim(), color: tagColor });
      } else {
        await addTag({ name: tagName.trim(), color: tagColor });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTag(deleteId);
    setDeleteId(null);
  };

  const getTagCount = (tagId: string) => {
    const inProducts = state.products.filter(p => p.tagIds.includes(tagId)).length;
    const inClients = state.clients.filter(c => c.tagIds.includes(tagId)).length;
    const inSales = state.sales.filter(s => s.tagIds.includes(tagId)).length;
    return inProducts + inClients + inSales;
  };

  const renderTag = ({ item }: { item: Tag }) => {
    const count = getTagCount(item.id);
    return (
      <Pressable
        onPress={() => router.push(`/tags/${item.id}` as any)}
        style={({ pressed }) => [styles.tagCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <View style={styles.tagInfo}>
          <Text style={[styles.tagName, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.tagCount, { color: colors.muted }]}>{count} item{count !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.tagActions}>
          <Pressable onPress={() => openEdit(item)} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
            <MaterialIcons name="edit" size={18} color={colors.muted} />
          </Pressable>
          <Pressable onPress={() => setDeleteId(item.id)} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
            <MaterialIcons name="delete" size={18} color="#DC2626" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <FlatList
        data={state.tags}
        keyExtractor={item => item.id}
        renderItem={renderTag}
        contentContainerStyle={[styles.list, state.tags.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState icon="label" title="Nenhuma tag criada" subtitle="Crie tags para organizar seus produtos, clientes e vendas" />
        }
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={openNew} />

      {/* Modal de formulário */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowForm(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              {editingTag ? 'Editar Tag' : 'Nova Tag'}
            </Text>
            <TextInput
              style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={tagName}
              onChangeText={setTagName}
              placeholder="Nome da tag"
              placeholderTextColor={colors.muted}
              autoFocus
              returnKeyType="done"
            />
            <Text style={[styles.colorLabel, { color: colors.muted }]}>Cor</Text>
            <View style={styles.colorGrid}>
              {TAG_COLORS.map(c => (
                <Pressable
                  key={c}
                  onPress={() => setTagColor(c)}
                  style={[styles.colorOption, { backgroundColor: c }, tagColor === c && styles.colorSelected]}
                />
              ))}
            </View>
            <View style={styles.sheetActions}>
              <Pressable onPress={() => setShowForm(false)} style={[styles.sheetBtn, { backgroundColor: colors.background }]}>
                <Text style={[styles.sheetBtnText, { color: colors.muted }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={[styles.sheetBtn, { backgroundColor: tagColor }, saving && { opacity: 0.6 }]}
              >
                <Text style={[styles.sheetBtnText, { color: '#fff' }]}>{saving ? 'Salvando...' : 'Salvar'}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={!!deleteId}
        title="Excluir Tag"
        message="Deseja excluir esta tag? Ela será removida de todos os itens vinculados."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10, paddingBottom: 100 },
  tagCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 0.5, gap: 12 },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  tagInfo: { flex: 1 },
  tagName: { fontSize: 15, fontWeight: '600' },
  tagCount: { fontSize: 12, marginTop: 2 },
  tagActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  nameInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  colorLabel: { fontSize: 13, fontWeight: '600' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorOption: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  sheetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  sheetBtnText: { fontSize: 15, fontWeight: '600' },
});
