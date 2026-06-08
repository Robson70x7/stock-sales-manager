import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { useCreateClient } from '@/hooks/useCreateClient';
import { useTags } from '@/hooks/useTags';
import { TagChip } from '@/components/ui/TagChip';

export default function NewClientScreen() {
  const router = useRouter();
  const colors = useColors();
  const createClient = useCreateClient();
  const { data: tags = [] } = useTags();

  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createClient.mutateAsync({
        name: name.trim(),
        document: document.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        tagIds: selectedTags,
      });
      router.back();
    } catch {
      // error handled by mutation
    } finally {
      setSaving(false);
    }
  }, [name, document, phone, email, address, notes, selectedTags, createClient, router]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Nome *</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome do cliente"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.foreground, fontSize: 15,
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Documento</Text>
        <TextInput
          value={document}
          onChangeText={setDocument}
          placeholder="CPF / CNPJ"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.foreground, fontSize: 15,
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Telefone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="(11) 99999-8888"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          style={{
            backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.foreground, fontSize: 15,
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="cliente@email.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.foreground, fontSize: 15,
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Endereço</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Rua, número, bairro"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.foreground, fontSize: 15,
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Observações</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Observações sobre o cliente"
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
          style={{
            backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.foreground, fontSize: 15,
            minHeight: 80, textAlignVertical: 'top',
          }}
        />
      </View>

      {tags.length > 0 && (
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Tags</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {tags.map(tag => (
              <TagChip
                key={tag.id}
                tag={tag}
                selected={selectedTags.includes(tag.id)}
                onPress={() => toggleTag(tag.id)}
              />
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={handleSave}
        disabled={!name.trim() || saving}
        style={{
          backgroundColor: name.trim() && !saving ? colors.primary : colors.muted + '60',
          borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8,
        }}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Salvar Cliente</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
