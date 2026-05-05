import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Switch } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface CheckboxOption {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  checkbox?: CheckboxOption;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  destructive = false,
  checkbox,
}: ConfirmDialogProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
          {checkbox && (
            <View style={styles.checkbox}>
              <Text style={[styles.checkboxLabel, { color: colors.foreground }]}>{checkbox.label}</Text>
              <Switch
                value={checkbox.checked}
                onValueChange={checkbox.onCheckedChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          )}
          <View style={styles.buttons}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.muted }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                destructive ? { backgroundColor: '#DC2626' } : { backgroundColor: colors.primary },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.confirmText, { color: '#fff' }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  checkbox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
  checkboxLabel: { fontSize: 14 },
  buttons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
  confirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
