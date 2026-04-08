import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';
import { SaleStatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, deleteClient } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const client = state.clients.find(c => c.id === id);
  if (!client) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Cliente não encontrado</Text>
    </View>
  );

  const tags = state.tags.filter(t => client.tagIds.includes(t.id));
  const clientSales = state.sales.filter(s => s.clientId === id);
  const totalSpent = clientSales.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + s.totalAmount, 0);
  const initials = getInitials(client.name);

  const handleDelete = async () => {
    await deleteClient(client.id);
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Hero */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.clientName, { color: colors.foreground }]}>{client.name}</Text>
          {client.document && <Text style={[styles.document, { color: colors.muted }]}>{client.document}</Text>}
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map(tag => <TagChip key={tag.id} tag={tag} small />)}
            </View>
          )}
        </View>

        {/* Contato */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Contato</Text>
          {client.phone && (
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={16} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>{client.phone}</Text>
            </View>
          )}
          {client.email && (
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={16} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>{client.email}</Text>
            </View>
          )}
          {client.address && (
            <View style={styles.infoRow}>
              <MaterialIcons name="place" size={16} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>{client.address}</Text>
            </View>
          )}
          {!client.phone && !client.email && !client.address && (
            <Text style={[styles.noInfo, { color: colors.muted }]}>Nenhum contato cadastrado</Text>
          )}
        </View>

        {/* Resumo financeiro */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total em Compras</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Nº de Vendas</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{clientSales.length}</Text>
          </View>
        </View>

        {/* Notas */}
        {client.notes && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Observações</Text>
            <Text style={[styles.notesText, { color: colors.muted }]}>{client.notes}</Text>
          </View>
        )}

        {/* Histórico de compras */}
        {clientSales.length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Histórico de Compras</Text>
            {clientSales.slice(0, 5).map(sale => (
              <Pressable
                key={sale.id}
                onPress={() => router.push(`/sales/${sale.id}` as any)}
                style={({ pressed }) => [styles.saleRow, { borderTopColor: colors.border }, pressed && { opacity: 0.7 }]}
              >
                <View style={styles.saleInfo}>
                  <Text style={[styles.saleTitle, { color: colors.foreground }]} numberOfLines={1}>{sale.title}</Text>
                  <Text style={[styles.saleDate, { color: colors.muted }]}>{formatDate(sale.saleDate)}</Text>
                </View>
                <View style={styles.saleRight}>
                  <Text style={[styles.saleAmount, { color: colors.foreground }]}>{formatCurrency(sale.totalAmount)}</Text>
                  <SaleStatusBadge status={sale.status} small />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[styles.dateText, { color: colors.muted }]}>Cadastrado em {formatDate(client.createdAt)}</Text>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push(`/clients/edit/${client.id}` as any)}
            style={({ pressed }) => [styles.editBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
          >
            <MaterialIcons name="edit" size={18} color="#fff" />
            <Text style={styles.editBtnText}>Editar</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowDelete(true)}
            style={({ pressed }) => [styles.deleteBtn, { borderColor: '#DC2626' }, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="delete" size={18} color="#DC2626" />
            <Text style={[styles.deleteBtnText, { color: '#DC2626' }]}>Excluir</Text>
          </Pressable>
        </View>
      </View>

      <ConfirmDialog
        visible={showDelete}
        title="Excluir Cliente"
        message={`Deseja excluir "${client.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  heroCard: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 0.5 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700' },
  clientName: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  document: { fontSize: 13 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  infoCard: { borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 14, flex: 1 },
  noInfo: { fontSize: 13 },
  notesText: { fontSize: 14, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 4 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '700' },
  saleRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 0.5, gap: 10 },
  saleInfo: { flex: 1 },
  saleTitle: { fontSize: 14, fontWeight: '500' },
  saleDate: { fontSize: 12, marginTop: 2 },
  saleRight: { alignItems: 'flex-end', gap: 4 },
  saleAmount: { fontSize: 14, fontWeight: '600' },
  dateText: { fontSize: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});
