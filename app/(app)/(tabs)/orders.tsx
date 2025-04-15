import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Image } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { router } from 'expo-router';
import { MaterialIcons, AntDesign, Ionicons, Feather } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const ORDER_STATUS = {
  pending: {
    label: 'Menunggu Pembayaran',
    color: '#F59E0B',
    icon: 'clock',
    bgColor: '#FFFBEB',
    unpaid: true,
  },
  processing: {
    label: 'Diproses',
    color: '#3B82F6',
    icon: 'package',
    bgColor: '#EFF6FF',
    unpaid: false,
  },
  completed: {
    label: 'Selesai',
    color: '#10B981',
    icon: 'check-circle',
    bgColor: '#ECFDF5',
    unpaid: false,
  },
  cancelled: {
    label: 'Dibatalkan',
    color: '#EF4444',
    icon: 'x-circle',
    bgColor: '#FEF2F2',
    unpaid: true,
  },
  paid: {
    label: 'Sudah Bayar',
    color: '#10B981',
    icon: 'check-circle',
    bgColor: '#ECFDF5',
    unpaid: false,
  },
  waiting_confirmation: {
    label: 'Menunggu Konfirmasi',
    color: '#F59E0B',
    icon: 'clock',
    bgColor: '#FFFBEB',
    unpaid: false,
  },
};

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', auth.currentUser?.uid)
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const ordersData = [];
          querySnapshot.forEach((doc) => {
            ordersData.push({ id: doc.id, ...doc.data() });
          });
          setOrders(ordersData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCallAdmin = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusConfig = (order) => {
    if (order.paymentStatus === 'paid') {
      return ORDER_STATUS.paid;
    }
    
    if (order.status === 'pending' && order.paymentProof) {
      return ORDER_STATUS.waiting_confirmation;
    }
    
    return ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Memuat pesanan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Pesanan</Text>
        <TouchableOpacity onPress={() => router.push('/help')}>
          <Ionicons name="help-circle-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      
      {orders.length === 0 ? (
        <Animatable.View 
          animation="fadeIn"
          style={styles.emptyContainer}
        >
          <Image 
            source={require('../../../assets/images/empty-order.jpg')} 
            style={styles.emptyImage}
          />
          <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
          <Text style={styles.emptySubtitle}>Pesanan yang Anda buat akan muncul di sini</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.browseButtonText}>Jelajahi Produk</Text>
          </TouchableOpacity>
        </Animatable.View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order);
            const isUnpaid = statusConfig.unpaid;
            const isExpanded = expandedOrder === order.id;
            
            return (
              <Animatable.View 
                key={order.id}
                animation="fadeInUp"
                duration={600}
                style={styles.orderCard}
              >
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => toggleExpandOrder(order.id)}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderNumberContainer}>
                      <Feather name="shopping-bag" size={16} color="#4F46E5" />
                      <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: statusConfig.bgColor,
                      }
                    ]}>
                      <Feather 
                        name={statusConfig.icon} 
                        size={14} 
                        color={statusConfig.color} 
                        style={styles.statusIcon}
                      />
                      <Text style={[
                        styles.statusText, 
                        { 
                          color: statusConfig.color,
                        }
                      ]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.productContainer}>
                    {order.productImage && (
                      <Image 
                        source={{ uri: order.productImage }} 
                        style={styles.productImage}
                      />
                    )}
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {order.productName}
                      </Text>
                      <Text style={styles.productPrice}>
                        Rp {order.amount?.toLocaleString('id-ID')}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.paymentStatusContainer}>
                    <View style={[
                      styles.paymentStatusBadge,
                      { 
                        backgroundColor: isUnpaid ? '#FEE2E2' : '#D1FAE5',
                      }
                    ]}>
                      <Text style={[
                        styles.paymentStatusText,
                        { color: isUnpaid ? '#EF4444' : '#10B981' }
                      ]}>
                        {isUnpaid ? 'BELUM BAYAR' : 'SUDAH BAYAR'}
                      </Text>
                    </View>
                    <Text style={styles.orderDate}>
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {isExpanded && (
                  <Animatable.View 
                    animation="fadeIn"
                    duration={300}
                    style={styles.expandedContent}
                  >
                    <View style={styles.divider} />
                    
                    <View style={styles.detailSection}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Metode Pembayaran:</Text>
                        <Text style={styles.detailValue}>{order.paymentMethod}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status Pembayaran:</Text>
                        <Text style={[
                          styles.detailValue,
                          { color: isUnpaid ? '#EF4444' : '#10B981' }
                        ]}>
                          {order.paymentStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Admin notes */}
                    <View style={[
                      styles.adminNotesContainer, 
                      { borderLeftColor: statusConfig.color }
                    ]}>
                      <Text style={styles.adminNotesTitle}>Catatan:</Text>
                      <Text style={styles.adminNotesText}>
                        {order.adminNotes || 
                          (order.status === 'pending' && !order.paymentProof 
                            ? "Silakan lakukan pembayaran untuk melanjutkan." 
                            : order.status === 'pending' 
                              ? "Pembayaran Anda sedang diverifikasi." 
                              : order.status === 'processing' 
                                ? "Pesanan Anda sedang diproses oleh tim kami." 
                                : order.status === 'cancelled' 
                                  ? "Pesanan Anda telah dibatalkan." 
                                  : "Pesanan Anda telah selesai.")}
                      </Text>
                    </View>
                    
                    {/* Action buttons */}
                    <View style={styles.actionButtons}>
                      {isUnpaid && order.status === 'pending' && !order.paymentProof && (
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.primaryButton]}
                          onPress={() => router.push(`/order/${order.id}?showPayment=true`)}
                        >
                          <Feather name="upload" size={16} color="white" />
                          <Text style={styles.actionButtonText}>Upload Bukti Bayar</Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() => router.push(`/order/${order.id}`)}
                      >
                        <Feather name="eye" size={16} color="#4F46E5" />
                        <Text style={[styles.actionButtonText, { color: '#4F46E5' }]}>
                          Detail Pesanan
                        </Text>
                      </TouchableOpacity>
                      
                      {(order.adminContact || ['pending', 'processing'].includes(order.status)) && (
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.tertiaryButton]}
                          onPress={() => handleCallAdmin(order.adminContact || "+6281574623974")}
                        >
                          <Ionicons name="call" size={16} color="#10B981" />
                          <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                            Hubungi Admin
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Animatable.View>
                )}
                
                <TouchableOpacity 
                  style={styles.expandButton}
                  onPress={() => toggleExpandOrder(order.id)}
                >
                  <Text style={styles.expandButtonText}>
                    {isExpanded ? 'Tutup Detail' : 'Lihat Detail'}
                  </Text>
                  <Feather 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={18} 
                    color="#4F46E5" 
                  />
                </TouchableOpacity>
              </Animatable.View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  adminNotesContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  adminNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    margin: 4,
    flex: 1,
    minWidth: '48%',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  secondaryButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  tertiaryButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  actionButtonText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
    color: 'white',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  expandButtonText: {
    color: '#4F46E5',
    fontWeight: '500',
    fontSize: 14,
    marginRight: 8,
  },
});

export default OrdersScreen;