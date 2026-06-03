import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { EmptyState } from '@/components/ui/EmptyState';
import { useColors } from '@/hooks/use-colors';
import { getInitials, formatCurrency } from '@shared/lib/utils';
import { Client } from '@shared/types';
import { useClients } from '@/hooks/useClients';
import { useAllSales } from '@/hooks/useAllSales';

export default function ClientsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data: clients = [] } = useClients();
  const { data: sales = [] } = useAllSales();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone?.toLowerCase().includes(q)) ||
      (c.email?.toLowerCase().includes(q)) ||
      (c.document?.toLowerCase().includes(q))
    );
  }, [clients, search]);

  const getClientTotal = (clientId: string) => {
    return sales
      .filter(s => s.clientId === clientId && s.status !== 'cancelled')
      .reduce((sum, s) => sum + s.totalAmount, 0);
  };

  const renderItem = ({ item }: { item: Client }) => {
    const total = getClientTotal(item.id);
    const initials = getInitials(item.name);

    return (
      <Pressable
        onPress={() => router.push(`/clients/${item.id}` as any)}
        style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={[styles.clientName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
          <View style={styles.contactRow}>
            {item.phone && (
              <View style={styles.contactItem}>
                <MaterialIcons name="phone" size={12} color={colors.muted} />
                <Text style={[styles.contactText, { color: colors.muted }]}>{item.phone}</Text>
              </View>
            )}
            {item.email && (
              <View style={styles.contactItem}>
                <MaterialIcons name="email" size={12} color={colors.muted} />
                <Text style={[styles.contactText, { color: colors.muted }]} numberOfLines={1}>{item.email}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.totalBlock}>
          {total > 0 && <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(total)}</Text>}
          <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Clientes</Text>
        <Text style={[styles.count, { color: colors.muted }]}>{clients.length}</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Buscar clientes..."
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
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState
            icon="people"
            title="Nenhum cliente encontrado"
            subtitle={search ? 'Tente outro termo de busca' : 'Conecte ao desktop para sincronizar dados'}
          />
        }
        showsVerticalScrollIndicator={false}
      />

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  title: { fontSize: 22, fontWeight: '700' },
  count: { fontSize: 14, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10, borderBottomWidth: 0.5 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 0.5, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  clientInfo: { flex: 1, gap: 4 },
  clientName: { fontSize: 15, fontWeight: '600' },
  contactRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  contactText: { fontSize: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  totalBlock: { alignItems: 'flex-end', gap: 2 },
  totalValue: { fontSize: 13, fontWeight: '700' },
});
