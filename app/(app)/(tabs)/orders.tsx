import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Clock, Package, CircleCheck as CheckCircle, Circle as XCircle, Info, ShoppingBag, FileText, Phone, Eye, ChevronDown, ChevronUp, CreditCard, Smartphone, DollarSign, Maximize } from 'lucide-react-native';
import moment from 'moment';

const COLORS = {
  primary: '#0557B5',
  primaryLight: '#E1EFFF',
  primaryDark: '#044289',
  secondary: '#2C7DFA',
  accent: '#70B3FF',
  success: '#00B884',
  successLight: '#E6F9F4',
  warning: '#FF9D00',
  warningLight: '#FFF5E6',
  danger: '#FF4757',
  dangerLight: '#FFECEE',
  neutral: '#F8FAFC',
  neutralDark: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#64748B',
  white: '#FFFFFF',
};

const PAYMENT_METHODS = {
  bank_transfer: {
    label: 'Transfer Bank',
    icon: CreditCard,
    color: COLORS.primary
  },
  e_wallet: {
    label: 'E-Wallet',
    icon: Smartphone,
    color: COLORS.secondary
  },
  cash: {
    label: 'Tunai',
    icon: DollarSign,
    color: COLORS.success
  },
  qris: {
    label: 'QRIS',
    icon: Maximize,
    color: COLORS.warning
  }
};

const ORDER_STATUS = {
  pending: {
    label: 'Menunggu Pembayaran',
    color: COLORS.warning,
    icon: Clock,
    bgColor: COLORS.warningLight
  },
  processing: {
    label: 'Diproses',
    color: COLORS.secondary,
    icon: Package,
    bgColor: COLORS.primaryLight
  },
  approved: {
    label: 'Selesai',
    color: COLORS.success,
    icon: CheckCircle,
    bgColor: COLORS.successLight
  },
  cancelled: {
    label: 'Dibatalkan',
    color: COLORS.danger,
    icon: XCircle,
    bgColor: COLORS.dangerLight
  }
};

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', auth.currentUser?.uid)
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
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

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '-';
    return moment(timestamp.seconds * 1000).format('DD MMM YYYY, HH:mm');
  };

  const handleCallAdmin = (phoneNumber) => {
    router.push(`tel:${phoneNumber}`);
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => 
        filterStatus === 'active' 
          ? ['pending', 'processing'].includes(order.status)
          : ['approved', 'cancelled'].includes(order.status)
      );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Memuat pesanan...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image 
          source={{ uri: "../../../assets/images/empty-order.jpg" }}
          style={styles.emptyImage}
        />
        <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
        <Text style={styles.emptySubtitle}>Mulai berbelanja untuk melihat pesanan Anda di sini</Text>
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.browseButtonText}>Jelajahi Produk</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan Saya</Text>
        <ShoppingBag color={COLORS.white} size={24} />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {['all', 'active', 'approved'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                filterStatus === filter && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(filter)}
            >
              <Text style={[
                styles.filterText,
                filterStatus === filter && styles.filterTextActive
              ]}>
                {filter === 'all' ? 'Semua' : filter === 'active' ? 'Aktif' : 'Selesai'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {filteredOrders.map((order, index) => {
          const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
          const StatusIcon = status.icon;
          const isExpanded = expandedOrder === order.id;

          return (
            <Animatable.View
              key={order.id}
              animation="fadeInUp"
              delay={index * 100}
              style={styles.orderCard}
            >
              <TouchableOpacity
                style={styles.orderHeader}
                onPress={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>#{order.orderNumber || order.id}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                  <StatusIcon size={16} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <Animatable.View 
                  animation="fadeIn"
                  duration={300}
                  style={styles.orderDetails}
                >
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Pembayaran</Text>
                    <Text style={styles.detailValue}>
                      Rp {order.amount?.toLocaleString('id-ID')}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: COLORS.primaryLight }]}
                      onPress={() => router.push(`/order/${order.id}`)}
                    >
                      <Eye size={20} color="#1E88E5" />
                      <Text style={[styles.actionText, { color: "#1E88E5" }]}>
                        Detail
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: COLORS.successLight }]}
                      onPress={() => handleCallAdmin(order.adminContact || "+6281574623974")}
                    >
                      <Phone size={20} color={COLORS.success} />
                      <Text style={[styles.actionText, { color: COLORS.success }]}>
                        Hubungi
                      </Text>
                    </TouchableOpacity>

                    {order.status === 'approved' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: COLORS.primaryLight }]}
                      >
                        <FileText size={20} color="#1E88E5" />
                        <Text style={[styles.actionText, { color: "#1E88E5" }]}>
                          Invoice
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animatable.View>
              )}

              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                {isExpanded ? (
                  <ChevronUp size={20} color={COLORS.textSecondary} />
                ) : (
                  <ChevronDown size={20} color={COLORS.textSecondary} />
                )}
              </TouchableOpacity>
            </Animatable.View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#1E88E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralDark,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: COLORS.neutral,
  },
  filterButtonActive: {
    backgroundColor: '#1E88E5',
  },
  filterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralDark,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  expandButton: {
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrdersScreen;