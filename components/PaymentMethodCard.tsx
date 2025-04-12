import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CreditCard, QrCode, Wallet } from 'lucide-react-native';

export type PaymentMethod = {
  id: string;
  name: string;
  type: 'qris' | 'bank_transfer' | 'e_wallet';
  description: string;
};

type Props = {
  method: PaymentMethod;
  selected: boolean;
  onSelect: (method: PaymentMethod) => void;
};

const ICONS = {
  qris: QrCode,
  bank_transfer: CreditCard,
  e_wallet: Wallet,
};

export default function PaymentMethodCard({ method, selected, onSelect }: Props) {
  const Icon = ICONS[method.type];

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selected]}
      onPress={() => onSelect(method)}
    >
      <View style={styles.iconContainer}>
        <Icon size={24} color={selected ? '#7C3AED' : '#666'} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{method.name}</Text>
        <Text style={styles.description}>{method.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f5f5f5',
  },
  selected: {
    borderColor: '#7C3AED',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
});