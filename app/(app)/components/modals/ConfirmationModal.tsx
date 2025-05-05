import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Modal from '../shared/ModalWrapper';
import { router } from 'expo-router';
import moment from 'moment';

interface ConfirmationModalProps {
  visible: boolean;
  product: any;
  formData: any;
  paymentMethods: any[];
  selectedPaymentMethod: string | null;
  orderNumber: string;
  onClose: () => void;
  driveLink?: string; // <<< tambahkan props driveLink
}

const ConfirmationModal = ({
  visible,
  product,
  formData,
  paymentMethods,
  selectedPaymentMethod,
  orderNumber,
  onClose,
  driveLink,
}: ConfirmationModalProps) => {
  if (!product) return null;

  const getSelectedPaymentMethod = () => {
    return paymentMethods.find((p) => p.id === selectedPaymentMethod)?.name || '';
  };

  const handleViewOrdersPress = () => {
    onClose();
    router.push('/orders');
  };

  const handleDownloadPress = () => {
    if (driveLink) {
      Linking.openURL(driveLink);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

      <Animated.View style={styles.container} entering={FadeIn.duration(400)}>
        <View style={styles.header}>
          <Ionicons name="checkmark-done-circle" size={56} color="#10B981" style={styles.icon} />
          <Text style={styles.title}>Pesanan Berhasil!</Text>
          <Text style={styles.subtitle}>
            Pesanan Anda telah kami terima dan sedang diproses
          </Text>
        </View>

        <View style={styles.body}>
          <DetailRow label="No. Pesanan" value={orderNumber} />
          <DetailRow label="Layanan" value={product.name} />
          <DetailRow label="Deadline" value={moment(formData.deadline).format('DD MMMM YYYY')} />
          <DetailRow label="Metode Pembayaran" value={getSelectedPaymentMethod()} />
          <DetailRow
            label="Total Pembayaran"
            value={`Rp ${product.price.toLocaleString('id-ID')}`}
            isLast
          />

          {/* Tombol download file jika ada driveLink */}
          {driveLink && (
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPress}>
              <Ionicons name="cloud-download-outline" size={20} color="#3B82F6" />
              <Text style={styles.downloadButtonText}>Download File</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleViewOrdersPress}>
            <Text style={styles.primaryButtonText}>Lihat Pesanan</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

const DetailRow = ({ label, value, isLast }: DetailRowProps) => (
  <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  body: {
    width: '100%',
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
    maxWidth: '60%',
    textAlign: 'right',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  downloadButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConfirmationModal;
