import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';

export default function TagDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, deleteTag } = useApp();
  const colors = useColors();
  const router = useRouter();

  const tag = state.tags.find(t => t.id === id);
  if (!tag) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Tag não encontrada</Text>
    </View>
  );

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a tag "${tag.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteTag(tag.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header da tag */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
          <Text style={[styles.tagName, { color: colors.foreground }]}>{tag.name}</Text>
          <Text style={[styles.tagDate, { color: colors.muted }]}>
            Criada em {new Date(tag.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        {/* Ações */}
        <View style={styles.actions}>
          <MaterialIcons name="info" size={18} color={colors.muted} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            As tags são usadas para categorizar produtos, clientes e vendas.
          </Text>
        </View>

        {/* Botão de excluir */}
        <View style={styles.deleteSection}>
          <MaterialIcons name="delete" size={20} color="#DC2626" />
          <Text 
            onPress={handleDelete}
            style={[styles.deleteText, { color: '#DC2626' }]}
          >
            Excluir Tag
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  heroCard: { 
    padding: 24, 
    borderRadius: 16, 
    borderWidth: 1,
    alignItems: 'center',
  },
  tagDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  tagName: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  tagDate: { fontSize: 14 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 14 },
  deleteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 20,
  },
  deleteText: { fontSize: 16, fontWeight: '600' },
});