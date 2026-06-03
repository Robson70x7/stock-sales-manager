import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Tag } from '@shared/types';

interface TagChipProps {
  tag: Tag;
  onPress?: () => void;
  selected?: boolean;
  small?: boolean;
}

export function TagChip({ tag, onPress, selected, small }: TagChipProps) {
  const bg = selected ? tag.color : tag.color + '20';
  const textColor = selected ? '#fff' : tag.color;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: bg,
          borderRadius: 20,
          paddingHorizontal: small ? 8 : 10,
          paddingVertical: small ? 2 : 4,
          marginRight: 6,
          opacity: pressed ? 0.7 : 1,
          borderWidth: 1,
          borderColor: tag.color + '40',
        })}
      >
        <Text style={{ color: textColor, fontSize: small ? 10 : 12, fontWeight: '600' }}>
          {tag.name}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={{
      backgroundColor: bg,
      borderRadius: 20,
      paddingHorizontal: small ? 8 : 10,
      paddingVertical: small ? 2 : 4,
      marginRight: 6,
      borderWidth: 1,
      borderColor: tag.color + '40',
    }}>
      <Text style={{ color: textColor, fontSize: small ? 10 : 12, fontWeight: '600' }}>
        {tag.name}
      </Text>
    </View>
  );
}
