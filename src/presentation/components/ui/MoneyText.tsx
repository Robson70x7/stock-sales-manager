import React from 'react';
import { Text, TextProps } from 'react-native';
import { formatCurrency } from '@shared/lib/utils';

interface MoneyTextProps extends TextProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  positive?: boolean;
  negative?: boolean;
}

export function MoneyText({ value, size = 'md', positive, negative, style, ...props }: MoneyTextProps) {
  const sizeClass = {
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    '2xl': 24,
  }[size];

  const color = positive ? '#16A34A' : negative ? '#DC2626' : undefined;

  return (
    <Text
      style={[{ fontSize: sizeClass, fontWeight: '600', color }, style]}
      {...props}
    >
      {formatCurrency(value)}
    </Text>
  );
}
