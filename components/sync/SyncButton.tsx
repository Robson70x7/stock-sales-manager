import React from 'react';
import { Pressable, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';

interface SyncButtonProps {
  onPress: () => void;
  status: 'idle' | 'syncing' | 'connected' | 'error';
  deviceCount: number;
}

export function SyncButton({ onPress, status, deviceCount }: SyncButtonProps) {
  const colors = useColors();

  const getStatusColor = () => {
    switch (status) {
      case 'syncing':
        return colors.primary;
      case 'connected':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return colors.muted;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return 'sync';
      case 'connected':
        return 'check-circle';
      case 'error':
        return 'error';
      default:
        return 'cloud-off';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: getStatusColor(),
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {status === 'syncing' ? (
          <ActivityIndicator size="small" color={getStatusColor()} />
        ) : (
          <MaterialIcons name={getStatusIcon()} size={18} color={getStatusColor()} />
        )}
        <Text style={[styles.text, { color: colors.foreground }]}>Sincronizar</Text>
        {deviceCount > 0 && (
          <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.badgeText}>{deviceCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});
