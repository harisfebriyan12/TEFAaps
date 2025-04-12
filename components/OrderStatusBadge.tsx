import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
};

const STATUS_COLORS = {
  pending: {
    bg: '#fef3c7',
    text: '#92400e',
  },
  processing: {
    bg: '#dbeafe',
    text: '#1e40af',
  },
  completed: {
    bg: '#dcfce7',
    text: '#15803d',
  },
  cancelled: {
    bg: '#fee2e2',
    text: '#b91c1c',
  },
};

export default function OrderStatusBadge({ status }: Props) {
  const colors = STATUS_COLORS[status];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});