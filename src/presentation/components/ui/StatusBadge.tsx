import React from 'react';
import { View, Text } from 'react-native';
import { SaleStatus, InstallmentStatus } from '@shared/types';
import { getSaleStatusLabel, getSaleStatusColor, getInstallmentStatusLabel, getInstallmentStatusColor } from '@shared/lib/utils';

interface SaleStatusBadgeProps {
  status: SaleStatus;
  small?: boolean;
}

interface InstallmentStatusBadgeProps {
  status: InstallmentStatus;
  small?: boolean;
}

export function SaleStatusBadge({ status, small }: SaleStatusBadgeProps) {
  const color = getSaleStatusColor(status);
  const label = getSaleStatusLabel(status);
  return (
    <View style={{ backgroundColor: color + '20', borderRadius: 8, paddingHorizontal: small ? 6 : 8, paddingVertical: small ? 2 : 4 }}>
      <Text style={{ color, fontSize: small ? 10 : 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

export function InstallmentStatusBadge({ status, small }: InstallmentStatusBadgeProps) {
  const color = getInstallmentStatusColor(status);
  const label = getInstallmentStatusLabel(status);
  return (
    <View style={{ backgroundColor: color + '20', borderRadius: 8, paddingHorizontal: small ? 6 : 8, paddingVertical: small ? 2 : 4 }}>
      <Text style={{ color, fontSize: small ? 10 : 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
