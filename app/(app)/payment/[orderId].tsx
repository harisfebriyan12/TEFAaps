import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft, Copy, CircleCheck as CheckCircle } from 'lucide-react-native';
import PaymentMethodCard, { PaymentMethod } from '@/components/PaymentMethodCard';
import { scheduleLocalNotification } from '@/lib/notifications';

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'qris',
    name: 'QRIS',
    type: 'qris',
    description: 'Pay using any QRIS-compatible e-wallet',
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    type: 'bank_transfer',
    description: 'Transfer to our bank account',
  },
  {
    id: 'dana',
    name: 'DANA',
    type: 'e_wallet',
    description: 'Pay directly with DANA',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    type: 'e_wallet',
    description: 'Pay directly with GoPay',
  },
];

const BANK_ACCOUNTS = {
  BCA: {
    number: '1234567890',
    name: 'PT JOKI GAMING',
  },
  BNI: {
    number: '0987654321',
    name: 'PT JOKI GAMING',
  },
};

export default function Payment() {
  const { orderId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId as string));
      if (orderDoc.exists()) {
        setOrder(orderDoc.data());
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading order:', error);
      setLoading(false);
    }
  };

  const handleCopyAccount = (account: string) => {
    // In a real app, use clipboard API
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = async () => {
    try {
      await updateDoc(doc(db, 'orders', orderId as string), {
        status: 'processing',
        paymentMethod: selectedMethod?.id,
        updatedAt: new Date().toISOString(),
      });

      await scheduleLocalNotification(
        'Payment Received',
        'Your payment is being processed. We will notify you once your order starts.'
      );

      router.push('/orders');
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Game</Text>
              <Text style={styles.summaryValue}>{order?.gameName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{order?.serviceName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>${order?.price}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        {PAYMENT_METHODS.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            selected={selectedMethod?.id === method.id}
            onSelect={setSelectedMethod}
          />
        ))}

        {selectedMethod?.type === 'qris' && (
          <View style={styles.qrisContainer}>
            <QRCode
              value="https://example.com/pay"
              size={200}
              backgroundColor="white"
            />
            <Text style={styles.qrisText}>
              Scan with any QRIS-compatible e-wallet
            </Text>
          </View>
        )}

        {selectedMethod?.type === 'bank_transfer' && (
          <View style={styles.bankContainer}>
            {Object.entries(BANK_ACCOUNTS).map(([bank, account]) => (
              <View key={bank} style={styles.bankCard}>
                <Text style={styles.bankName}>{bank}</Text>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountNumber}>{account.number}</Text>
                  <TouchableOpacity
                    onPress={() => handleCopyAccount(account.number)}
                    style={styles.copyButton}
                  >
                    {copied ? (
                      <CheckCircle size={20} color="#10b981" />
                    ) : (
                      <Copy size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.accountName}>{account.name}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.confirmButton, !selectedMethod && styles.buttonDisabled]}
          onPress={handleConfirmPayment}
          disabled={!selectedMethod}
        >
          <Text style={styles.confirmButtonText}>Confirm Payment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#7C3AED',
    padding: 24,
    paddingTop: 48,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    padding: 16,
  },
  orderSummary: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
  },
  qrisContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  qrisText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  bankContainer: {
    gap: 12,
    marginBottom: 24,
  },
  bankCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  bankName: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountNumber: {
    flex: 1,
    fontSize: 20,
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
  },
  copyButton: {
    padding: 8,
  },
  accountName: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  confirmButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});