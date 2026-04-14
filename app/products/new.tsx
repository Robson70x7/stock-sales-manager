import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';

export default function NewProductScreen() {
  const { state, addProduct } = useApp();
  const colors = useColors();
  const router = useRouter();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('un');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleTag = (id: string) => {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const parsePrice = (val: string) => {
    const cleaned = val.replace(/[^0-9,\.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Atenção', 'Informe o nome do produto.'); return; }
    if (!salePrice.trim()) { Alert.alert('Atenção', 'Informe o preço de venda.'); return; }
    setSaving(true);
    try {
      await addProduct({
        name: name.trim(),
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        costPrice: parsePrice(costPrice),
        salePrice: parsePrice(salePrice),
        stock: parseInt(stock) || 0,
        unit: unit.trim() || 'un',
        photoUri: photoUri || undefined,
        tagIds: selectedTagIds,
      });
      router.back();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o produto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Foto do Produto</Text>
          <Pressable onPress={pickImage} style={[styles.photoPickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <>
                <MaterialIcons name="image" size={40} color={colors.muted} />
                <Text style={[styles.photoPickerText, { color: colors.muted }]}>Toque para adicionar foto</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Informações Básicas</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Nome *</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={name} onChangeText={setName} placeholder="Nome do produto" placeholderTextColor={colors.muted} returnKeyType="next" />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Categoria</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={category} onChangeText={setCategory} placeholder="Ex: Eletrônicos, Roupas..." placeholderTextColor={colors.muted} returnKeyType="next" />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Descrição</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={description} onChangeText={setDescription} placeholder="Descrição opcional" placeholderTextColor={colors.muted} multiline numberOfLines={2} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preços e Estoque</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Preço de Custo</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={costPrice} onChangeText={setCostPrice} placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad" returnKeyType="next" />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Preço de Venda *</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={salePrice} onChangeText={setSalePrice} placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad" returnKeyType="next" />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Estoque</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={stock} onChangeText={setStock} placeholder="0" placeholderTextColor={colors.muted} keyboardType="number-pad" returnKeyType="next" />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Unidade</Text>
              <TextInput style={[styles.input, { color: colors.foreground }]} value={unit} onChangeText={setUnit} placeholder="un, kg, m, L..." placeholderTextColor={colors.muted} returnKeyType="done" />
            </View>
          </View>
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
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar Produto'}</Text>
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
  photoPickerBtn: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', height: 160, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoPreview: { width: '100%', height: '100%', borderRadius: 12 },
  photoPickerText: { fontSize: 14 },
  inputGroup: { borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  label: { fontSize: 14, width: 120 },
  input: { flex: 1, fontSize: 14, textAlign: 'right' },
  divider: { height: 0.5, marginLeft: 14 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
