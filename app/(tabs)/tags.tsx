import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FAB } from '@/components/ui/FAB';
import { TAG_COLORS } from '@/lib/utils';

export default function TagsScreen() {
  const { state, addTag, updateTag, deleteTag } = useApp();
  const colors = useColors();
  const router = useRouter();
  
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<typeof state.tags[0] | null>(null);
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

  const openEdit = (tag: typeof state.tags[0]) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!tagName.trim()) return;
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

  const filteredTags = useMemo(() => {
    if (!search.trim()) return state.tags;
    const q = search.toLowerCase();
    return state.tags.filter(t => t.name.toLowerCase().includes(q));
  }, [state.tags, search]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Tags</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Buscar tags..."
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

      {state.tags.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="label" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>Nenhuma tag criada</Text>
          <Text style={[styles.emptySub, { color: colors.muted }]}>
            Crie tags para organizar seus produtos, clientes e vendas
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTags}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={48} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.muted }]}>Nenhuma tag encontrada</Text>
            </View>
          }
          renderItem={({ item }) => {
            return (
              <Pressable
                onPress={() => router.push(`/tags/${item.id}` as any)}
                style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <View style={styles.cardInfo}>
                    <Text style={[styles.tagName, { color: colors.foreground }]}>{item.name}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); openEdit(item); }}
                    style={styles.actionBtn}
                  >
                    <MaterialIcons name="edit" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); setDeleteId(item.id); }}
                    style={styles.actionBtn}
                  >
                    <MaterialIcons name="delete" size={18} color="#DC2626" />
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <View style={styles.overlay}>
          <View style={[styles.formSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              {editingTag ? 'Editar Tag' : 'Nova Tag'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>Nome</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                value={tagName}
                onChangeText={setTagName}
                placeholder="Nome da tag"
                placeholderTextColor={colors.muted}
                autoFocus
              />
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>Cor</Text>
            <View style={styles.colorsGrid}>
              {TAG_COLORS.map(c => (
                <Pressable
                  key={c}
                  onPress={() => setTagColor(c)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    tagColor === c && styles.colorSelected,
                  ]}
                />
              ))}
            </View>

            <View style={styles.sheetActions}>
              <Pressable
                onPress={() => setShowForm(false)}
                style={[styles.sheetBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.sheetBtnText, { color: colors.muted }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={[styles.sheetBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        visible={!!deleteId}
        title="Excluir Tag"
        message="Deseja excluir esta tag? Ela será removida de todos os itens vinculados."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <FAB onPress={openNew} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  cardInfo: {
    flex: 1,
  },
  tagName: {
    fontSize: 15,
    fontWeight: '600',
  },
  tagCount: {
    fontSize: 12,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  formSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  sheetBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  sheetBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10, borderBottomWidth: 0.5 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
});
