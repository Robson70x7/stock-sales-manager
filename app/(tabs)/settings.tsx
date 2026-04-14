import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/use-colors';

export default function SettingsScreen() {
  const { state, updateSettings } = useApp();
  const colors = useColors();

  const handleToggleAskReturnStock = async (value: boolean) => {
    await updateSettings({ askReturnStockOnDelete: value });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exclusão de Vendas</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="delete" size={24} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Perguntar ao Excluir</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  Perguntar se deseja devolver itens ao estoque
                </Text>
              </View>
            </View>
            <Switch
              value={state.settings.askReturnStockOnDelete}
              onValueChange={handleToggleAskReturnStock}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={state.settings.askReturnStockOnDelete ? colors.primary : colors.muted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sobre</Text>
          
          <View style={[styles.infoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Versão</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>1.5.0</Text>
            </View>
          </View>

          <View style={[styles.infoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Aplicativo</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>VendaFácil</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 24,
    paddingBottom: 40,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    gap: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  infoItem: {
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
