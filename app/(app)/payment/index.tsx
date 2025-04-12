import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  Easing
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';

export default function Payment() {
  const [selectedMethod, setSelectedMethod] = useState('BCA');
  const [showSuccess, setShowSuccess] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const handleConfirmPayment = () => {
    // Start animation
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true
    }).start();

    // Show success modal
    setShowSuccess(true);

    // After 3 seconds, redirect to support
    setTimeout(() => {
      router.push('/orders');
    }, 3000);
  };

  const scale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 1]
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Pembayaran</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.infoTitle}>Pilih Metode Pembayaran:</Text>
          <View style={styles.methodContainer}>
            {['BCA'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.methodButton, selectedMethod === method && styles.selectedMethod]}
                onPress={() => setSelectedMethod(method)}
              >
                <Text style={[
                  styles.methodText,
                  selectedMethod === method && styles.selectedMethodText
                ]}>
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.bankContainer}>
            <Text style={styles.bankText}>Silakan transfer ke:</Text>
            <Text style={styles.bankAccount}>{selectedMethod} - 5765926596</Text>
            <Text style={styles.bankName}>A/N Haris Febriyan</Text>
            <Text style={styles.noteText}>Pastikan transfer sesuai nominal yang tertera Pada Awal.</Text>
          </View>

          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleConfirmPayment}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Konfirmasi Pembayaran</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.successBox, { transform: [{ scale }] }]}>
            <CheckCircle size={64} color="#4BB543" />
            <Text style={styles.successTitle}>Yeayy! Pembayaran Berhasil</Text>
            <Text style={styles.successText}>Pembayaran Anda sedang kami proses</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollContent: {
    flexGrow: 1
  },
  header: {
    backgroundColor: '#7C3AED',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    marginRight: 16
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  infoTitle: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 16,
    fontFamily: 'Poppins_600SemiBold'
  },
  methodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  methodButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
    width: '23%',
    alignItems: 'center',
    marginBottom: 8
  },
  selectedMethod: {
    backgroundColor: '#7C3AED'
  },
  methodText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium'
  },
  selectedMethodText: {
    color: '#fff'
  },
  bankContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  bankText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: 'Poppins_500Medium'
  },
  bankAccount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center'
  },
  bankName: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
    textAlign: 'center'
  },
  noteText: {
    fontSize: 14,
    color: '#ff0000',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular'
  },
  confirmButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  successBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  successText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center'
  }
});