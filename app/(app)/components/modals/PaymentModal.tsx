import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { AntDesign, FontAwesome5 } from '@expo/vector-icons';
import Animated, { SlideInRight } from 'react-native-reanimated';
import Modal from '../shared/ModalWrapper';
import moment from 'moment';

interface PaymentModalProps {
  visible: boolean;
  product: any;
  formData: any;
  paymentMethods: any[];
  selectedPaymentMethod: string | null;
  isProcessing: boolean;
  onClose: () => void;
  onSelectPaymentMethod: (id: string) => void;
  onSubmit: () => void;
  onError?: (error: string) => void;
}

const PaymentModal = ({ 
  visible, 
  product, 
  formData, 
  paymentMethods = [], 
  selectedPaymentMethod,
  isProcessing,
  onClose, 
  onSelectPaymentMethod,
  onSubmit,
  onError 
}: PaymentModalProps) => {
  const { height: screenHeight } = Dimensions.get('window');
  
  const getPaymentIcon = (type: string) => {
    if (!type) return 'credit-card';
    
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'qris': return 'qrcode';
      case 'bank': 
      case 'bank_transfer': return 'university';
      case 'credit-card': 
      case 'card': return 'credit-card';
      default: return 'credit-card';
    }
  };

  // Enhanced debugging for better troubleshooting
  useEffect(() => {
    if (visible) {
      // Convert paymentMethods to a safe format before logging
      const safePaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
      
      console.log('PaymentModal rendered with:', {
        productAvailable: !!product,
        paymentMethodsCount: safePaymentMethods.length,
        platform: Platform.OS,
        selectedMethod: selectedPaymentMethod
      });
      
      // Validate data and show errors if needed
      if (!product) {
        onError?.('Product data tidak tersedia');
      }
      
      if (!safePaymentMethods.length) {
        onError?.('Metode pembayaran tidak tersedia');
      }
    }
  }, [visible, product, paymentMethods, selectedPaymentMethod]);

  // Safety check untuk menghindari render error
  if (!visible) return null;
  if (!product) return null;

  // Ensure paymentMethods is always an array
  const safePaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];

  const formatCurrency = (amount: number) => {
    try {
      return amount.toLocaleString('id-ID');
    } catch (error) {
      console.error('Error formatting currency:', error);
      return amount.toString();
    }
  };

  const deadline = formData?.deadline ? moment(formData.deadline).format('DD MMMM YYYY') : '-';
  const price = product?.price || 0;

  // Helper function for rendering bank logos
  const renderBankLogo = (method) => {
    if (method?.imageUrl) {
      return (
        <View style={styles.bankLogoContainer}>
          <Image
            source={{ uri: method.imageUrl }}
            style={styles.bankLogo}
            resizeMode="contain"
            defaultSource={require('../../../../assets/images/placeholder.jpg')}
          />
        </View>
      );
    } else {
      return renderFallbackIcon(method);
    }
  };
  
  const renderFallbackIcon = (method) => {
    const methodType = method?.type || (method?.bankName?.toLowerCase() === 'bank' ? 'bank' : 'credit-card');
    return (
      <View style={[styles.bankLogoPlaceholder, { backgroundColor: `${method?.color || '#3B82F6'}20` }]}>
        <FontAwesome5 name={getPaymentIcon(methodType)} size={24} color={method?.color || '#3B82F6'} />
      </View>
    );
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <Animated.View
        style={[styles.modalContent, { maxHeight: screenHeight * 0.85 }]}
        entering={SlideInRight.duration(400)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pilih Metode Pembayaran</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Tutup"
            >
              <AntDesign name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScrollView} contentContainerStyle={styles.contentScrollViewContainer}>
            <View style={styles.paymentSummary}>
              <Text style={styles.paymentSummaryTitle}>Ringkasan Pesanan</Text>
              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>Layanan</Text>
                <Text style={styles.paymentSummaryValue}>{product.name || '-'}</Text>
              </View>
              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>Nama</Text>
                <Text style={styles.paymentSummaryValue}>{formData?.username || formData?.nama || '-'}</Text>
              </View>
              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>Deadline</Text>
                <Text style={styles.paymentSummaryValue}>{deadline}</Text>
              </View>
              <View style={styles.paymentSummaryDivider} />
              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>Harga</Text>
                <Text style={styles.paymentSummaryValue}>
                  Rp {formatCurrency(price)}
                </Text>
              </View>
              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>Biaya Admin</Text>
                <Text style={styles.paymentSummaryValue}>Rp 0</Text>
              </View>
              <View style={styles.paymentSummaryTotal}>
                <Text style={styles.paymentSummaryTotalLabel}>Total Pembayaran</Text>
                <Text style={styles.paymentSummaryTotalValue}>
                  Rp {formatCurrency(price)}
                </Text>
              </View>
            </View>

            {/* Payment Methods Section */}
            <Text style={styles.paymentMethodsHeading}>Metode Pembayaran</Text>
            
            <View style={styles.paymentMethodListContainer}>
              {safePaymentMethods.length > 0 ? (
                safePaymentMethods.map((method, index) => (
                  <TouchableOpacity
                    key={method?.id || `payment-${index}`}
                    style={[
                      styles.paymentMethodItem,
                      selectedPaymentMethod === method?.id && styles.paymentMethodItemSelected,
                      { borderColor: selectedPaymentMethod === method?.id ? (method?.color || '#3B82F6') : '#E5E7EB' }
                    ]}
                    onPress={() => method?.id && onSelectPaymentMethod(method.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.paymentMethodContent}>
                      {/* Bank Logo or Icon */}
                      {renderBankLogo(method)}

                      {/* Bank Information */}
                      <View style={styles.paymentMethodInfo}>
                        <Text style={styles.bankName}>
                          {method?.bankName || method?.name || 'Metode Pembayaran'}
                        </Text>

                        <Text style={styles.accountNumber}>
                          No. Rekening: {method?.accountNumber || '-'}
                        </Text>
                        <Text style={styles.accountHolder}>
                          Atas Nama: {method?.accountHolder || method?.pemegangakun || "-"}
                        </Text>
                      </View>
                    </View>

                    {/* Selection Radio Button */}
                    <View style={styles.radioContainer}>
                      <View style={styles.radioOuter}>
                        {selectedPaymentMethod === method?.id && (
                          <View style={[styles.radioInner, { backgroundColor: method?.color || '#3B82F6' }]} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyPaymentMethods}>
                  <FontAwesome5 name="bank" size={40} color="#9CA3AF" />
                  <Text style={styles.emptyPaymentText}>Tidak ada metode pembayaran tersedia</Text>
                </View>
              )}
            </View>
          </ScrollView>
          
          <View style={styles.paymentModalFooter}>
            <TouchableOpacity
              style={[
                styles.paymentSubmitButton,
                (!selectedPaymentMethod || isProcessing || safePaymentMethods.length === 0) && styles.paymentSubmitButtonDisabled
              ]}
              onPress={onSubmit}
              disabled={!selectedPaymentMethod || isProcessing || safePaymentMethods.length === 0}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.paymentSubmitButtonText}>Bayar Sekarang</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  contentScrollView: {
    flex: 1,
  },
  contentScrollViewContainer: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  paymentSummary: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  paymentSummaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    maxWidth: '60%',
    textAlign: 'right',
  },
  paymentSummaryDivider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 8,
  },
  paymentSummaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paymentSummaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  paymentSummaryTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  paymentMethodsHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  paymentMethodListContainer: {
    marginBottom: 10,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    width: '100%',
    // More efficient shadow implementation for Android
    ...Platform.select({
      ios: {
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  paymentMethodItemSelected: {
    borderWidth: 2,
    backgroundColor: '#F0F7FF',
  },
  paymentMethodContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden', // Ensure image doesn't overflow container
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankLogo: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  bankLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 3,
  },
  accountNumber: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
  },
  accountHolder: {
    fontSize: 13,
    color: '#6B7280',
  },
  radioContainer: {
    marginLeft: 8,
    width: 30, // Fixed width for radio container
    alignItems: 'center',
  },
  radioOuter: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
  },
  emptyPaymentMethods: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    minHeight: 150,
    marginBottom: 10,
  },
  emptyPaymentText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  paymentModalFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
    backgroundColor: '#FFFFFF',
  },
  paymentSubmitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  paymentSubmitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  paymentSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentModal;