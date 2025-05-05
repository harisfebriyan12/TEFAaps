import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Linking, 
  Alert,
  Animated,
  Platform
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons, AntDesign, FontAwesome, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { generateOrderReceipt } from '@/utils/receiptGenerator';

const OrderDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [error, setError] = useState(null);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('ID pesanan tidak valid');
        setLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Pesanan tidak ditemukan');
        }
      } catch (error) {
        console.error('Error getting order:', error);
        setError('Gagal memuat data pesanan');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!loading) {
      // Fade in and slide up animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [loading, fadeAnim, slideAnim]);

  // Fixed payment status logic to match order status
  const getPaymentStatus = (status) => {
    return status === 'completed' || status === 'processing' ? 'paid' : 'unpaid';
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = '6281574623974'; // Admin WhatsApp number
    const message = `Halo Admin, saya ingin konfirmasi pesanan dengan nomor: ${order?.orderNumber || 'tidak tersedia'}`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp tidak terinstall di perangkat Anda');
      }
    }).catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka WhatsApp');
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '-';
    
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const handleGenerateReceipt = async () => {
    if (!order) {
      Alert.alert('Error', 'Data pesanan tidak tersedia');
      return;
    }
    
    try {
      setGeneratingReceipt(true);
      await generateOrderReceipt(order);
    } catch (error) {
      Alert.alert('Error', 'Gagal membuat struk: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setGeneratingReceipt(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#0A85D1" />
        <Text style={styles.loadingText}>Memuat Data Pesanan...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar style="light" />
        <MaterialIcons name="error-outline" size={60} color="#0A85D1" />
        <Text style={styles.emptyText}>{error || 'Pesanan tidak ditemukan'}</Text>
        <TouchableOpacity 
          style={styles.backButtonEmpty}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonEmptyText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Payment status using updated logic
  const paymentStatus = getPaymentStatus(order.status);
  const isPaid = paymentStatus === 'paid';
  
  const statusColor = 
    order.status === 'completed' ? '#10B981' : 
    order.status === 'pending' ? '#F59E0B' : 
    order.status === 'processing' ? '#3B82F6' : 
    '#EF4444';

  const statusIcon = 
    order.status === 'completed' ? 'check-circle' : 
    order.status === 'pending' ? 'clock' : 
    order.status === 'processing' ? 'progress-clock' : 
    'close-circle';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <TouchableOpacity 
          onPress={handleGenerateReceipt} 
          disabled={generatingReceipt}
          style={styles.receiptButton}
        >
          {generatingReceipt ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather name="file-text" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View 
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumberLabel}>Nomor Pesanan</Text>
                <Text style={styles.orderNumber}>
                  #{order.orderNumber?.padStart(8, '0') || '00000001'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: isPaid ? '#E1F5FE' : '#FFEBEE' }
              ]}>
                <Text style={[styles.statusText, { color: isPaid ? '#0277BD' : '#C62828' }]}>
                  {isPaid ? 'LUNAS' : 'BELUM LUNAS'}
                </Text>
              </View>
            </View>
            
            <View style={styles.statusContainer}>
              <MaterialCommunityIcons name={statusIcon} size={24} color={statusColor} />
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusIndicatorText, {color: statusColor}]}>
                  {order.status === 'completed' ? 'PESANAN SELESAI' : 
                  order.status === 'pending' ? 'MENUNGGU PEMBAYARAN' : 
                  order.status === 'processing' ? 'SEDANG DIPROSES' :
                  order.status === 'canceled' ? 'PESANAN DIBATALKAN' : 'PESANAN GAGAL'}
                </Text>
                <Text style={styles.statusDate}>
                  {formatDate(order.createdAt)}
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="description" size={22} color="#054e79" />
                <Text style={styles.sectionTitle}>Detail Layanan</Text>
              </View>
              
              <View style={styles.infoCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nama Layanan</Text>
                  <Text style={styles.detailValue}>{order.productName || '-'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nama Lengkap</Text>
                  <Text style={styles.detailValue}>{order.orderDetails?.username || order.customerName || '-'}</Text>
                </View>
                
                {order.orderDetails?.taskType && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Jenis Tugas</Text>
                    <Text style={styles.detailValue}>{order.orderDetails.taskType}</Text>
                  </View>
                )}
                
                {order.orderDetails?.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Catatan:</Text>
                    <Text style={styles.notesValue}>
                      {order.orderDetails.notes}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="payment" size={22} color="#054e79" />
                <Text style={styles.sectionTitle}>Detail Pembayaran</Text>
              </View>
              
              <View style={styles.infoCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Metode Pembayaran</Text>
                  <Text style={styles.detailValue}>{order.bankname || 'TRANSFER'}</Text>
                </View>
                
                {order.paymentAccountNumber && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>No Rekening</Text>
                    <Text style={styles.detailValue}>{order.paymentAccountNumber}</Text>
                  </View>
                )}
                
                {order.paymentAccountHolder && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nama Bank | Atas Nama</Text>
                    <Text style={styles.detailValue}>{order.paymentAccountHolder}</Text>
                  </View>
                )}
                
                {order.paymentnameBank && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nama Bank</Text>
                    <Text style={styles.detailValue}>{order.paymentnameBank}</Text>
                  </View>
                )}
                
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Total Pembayaran</Text>
                  <Text style={styles.priceValue}>
                    Rp {order.amount?.toLocaleString('id-ID') || '0'}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Action buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.printButton}
                onPress={handleGenerateReceipt}
                disabled={generatingReceipt}
              >
                {generatingReceipt ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialIcons name="receipt" size={20} color="white" />
                    <Text style={styles.buttonText}>Cetak Struk</Text>
                  </>
                )}
              </TouchableOpacity>
              
              {/* Show "Tanya Admin" button for paid orders in processing state */}
              {order.status === 'processing' && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={handleWhatsAppContact}
                >
                  <FontAwesome name="question-circle" size={20} color="white" />
                  <Text style={styles.contactButtonText}>Tanya Admin</Text>
                </TouchableOpacity>
              )}
              
              {/* Show WhatsApp contact button for pending orders */}
              {order.status === 'pending' && (
                <TouchableOpacity 
                  style={styles.whatsappButton}
                  onPress={handleWhatsAppContact}
                >
                  <FontAwesome name="whatsapp" size={20} color="white" />
                  <Text style={styles.contactButtonText}>Konfirmasi Pembayaran</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#054e79',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  animatedContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#054e79',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#054e79',
  },
  emptyText: {
    fontSize: 16,
    color: 'white',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButtonEmpty: {
    backgroundColor: '#0A85D1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButtonEmptyText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#054e79',
    ...Platform.select({
      ios: {
        paddingTop: 50, // extra padding for iOS status bar
      },
      android: {
        paddingTop: 24, // extra padding for Android status bar
      },
    }),
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  receiptButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orderNumberLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#054e79',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusIndicatorText: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 12,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'right',
    flex: 2,
  },
  notesContainer: {
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  notesValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#066193',
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  printButton: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#054e79',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  contactButton: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#0277BD',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  whatsappButton: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#075E54',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrderDetailScreen;