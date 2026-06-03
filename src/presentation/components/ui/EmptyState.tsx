import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'inbox', title, subtitle }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <MaterialIcons name={icon} size={56} color="#94A3B8" />
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748B', marginTop: 12, textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
