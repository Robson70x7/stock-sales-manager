import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useTags } from '@/hooks/useTags';

export default function TagsScreen() {
  const colors = useColors();
  const { data: tags = [] } = useTags();
  const [search, setSearch] = useState('');

  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags;
    const q = search.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(q));
  }, [tags, search]);

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

      <FlatList
        data={filteredTags}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, filteredTags.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="label" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.muted }]}>Nenhuma tag disponível</Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>
              As tags são sincronizadas do Desktop VendaFácil
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={[styles.tagName, { color: colors.foreground }]}>{item.name}</Text>
            </View>
          </View>
        )}
      />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
  tagName: {
    fontSize: 15,
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
});
