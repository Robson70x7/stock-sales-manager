import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
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
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                destructive ? styles.destructiveBtn : styles.confirmBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.confirmText, destructive && { color: '#fff' }]}>{confirmLabel}</Text>
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
    backgroundColor: '#fff',
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
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  message: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 20 },
  buttons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  confirmBtn: { backgroundColor: '#2563EB' },
  destructiveBtn: { backgroundColor: '#DC2626' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  confirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
