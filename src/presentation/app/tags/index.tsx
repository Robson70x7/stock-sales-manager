import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tag } from '@shared/types';
import { ScreenContainer } from '@/components/screen-container';
import { useTags } from '@/hooks/useTags';

export default function TagsScreen() {
  const { data: tags = [] } = useTags();
  const colors = useColors();

  const renderTag = ({ item }: { item: Tag }) => {
    return (
      <View
        style={[styles.tagCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <View style={styles.tagInfo}>
          <Text style={[styles.tagName, { color: colors.foreground }]}>{item.name}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <FlatList
        data={tags}
        keyExtractor={item => item.id}
        renderItem={renderTag}
        contentContainerStyle={[styles.list, tags.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState icon="label" title="Nenhuma tag cadastrada" subtitle="As tags são sincronizadas do sistema desktop" />
        }
        showsVerticalScrollIndicator={false}
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
});
