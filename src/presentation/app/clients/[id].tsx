import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { TagChip } from '@/components/ui/TagChip';
import { SaleStatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, getInitials } from '@shared/lib/utils';
import { useClient } from '@/hooks/useClient';
import { useAllSales } from '@/hooks/useAllSales';
import { useTags } from '@/hooks/useTags';
import { usePermissions } from '@shared/hooks/use-permissions';
import { PERMISSIONS } from '@shared/auth/permissions';
import { ClientService } from '@application/services/client-service';
import { ClientRepository } from '@infra/database/repositories/client-repository';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const { data: client, isLoading } = useClient(id);
  const { data: sales = [] } = useAllSales();
  const { data: tags = [] } = useTags();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const service = new ClientService(new ClientRepository());
      await service.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.back();
    },
  });

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Excluir Cliente',
      'Tem certeza que deseja excluir este cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  }, [deleteMutation]);

  const canEdit = can(PERMISSIONS.CLIENTS_CREATE);
  const canDelete = can(PERMISSIONS.CLIENTS_DELETE);

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Carregando...</Text>
    </View>
  );

  if (!client) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.muted }}>Cliente não encontrado</Text>
    </View>
  );

  const clientSales = sales.filter(s => s.clientId === id);
  const totalSpent = clientSales.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + s.totalAmount, 0);
  const initials = getInitials(client.name);

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
          {client.tagIds.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.filter(t => client.tagIds.includes(t.id)).map(tag => (
                <TagChip key={tag.id} tag={tag} small />
              ))}
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
                  <Text style={[styles.saleTitle, { color: colors.foreground }]} numberOfLines={1}>{sale.items[0]?.productName || 'Venda'}</Text>
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

        {(canEdit || canDelete) && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {canEdit && (
              <Pressable
                onPress={() => router.push(`/clients/edit/${id}` as any)}
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name="edit" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Editar</Text>
              </Pressable>
            )}
            {canDelete && (
              <Pressable
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: '#ef444420', borderColor: '#ef444440' }, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name="delete" size={18} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '600' }}>
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={[styles.dateText, { color: colors.muted }]}>Cadastrado em {formatDate(client.createdAt)}</Text>
      </View>
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
  syncStatusCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, borderWidth: 0.5 },
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
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12, borderWidth: 0.5 },
});
