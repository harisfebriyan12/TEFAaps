import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Image, Platform } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { router } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const ORDER_STATUS = {
  pending: {
    label: 'Menunggu Pembayaran',
    color: '#F59E0B',
    icon: 'clock',
    bgColor: '#FFFBEB',
    unpaid: true,
    gradient: ['#FEF3C7', '#FFFBEB'],
  },
  processing: {
    label: 'Diproses',
    color: '#3B82F6',
    icon: 'package',
    bgColor: '#EFF6FF',
    unpaid: false,
    gradient: ['#DBEAFE', '#EFF6FF'],
  },
  completed: {
    label: 'Selesai',
    color: '#10B981',
    icon: 'check-circle',
    bgColor: '#ECFDF5',
    unpaid: false,
    gradient: ['#D1FAE5', '#ECFDF5'],
  },
  cancelled: {
    label: 'Dibatalkan',
    color: '#EF4444',
    icon: 'x-circle',
    bgColor: '#FEF2F2',
    unpaid: true,
    gradient: ['#FEE2E2', '#FEF2F2'],
  },
  paid: {
    label: 'Sudah Bayar',
    color: '#10B981',
    icon: 'check-circle',
    bgColor: '#ECFDF5',
    unpaid: false,
    gradient: ['#D1FAE5', '#ECFDF5'],
  },
  waiting_confirmation: {
    label: 'Menunggu Konfirmasi',
    color: '#F59E0B',
    icon: 'clock',
    bgColor: '#FFFBEB',
    unpaid: false,
    gradient: ['#FEF3C7', '#FFFBEB'],
  },
};

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [printingOrderId, setPrintingOrderId] = useState(null);

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

  const generateReceiptHTML = (order) => {
    const statusConfig = getStatusConfig(order);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #1F2937;
          }
          .receipt {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #E5E7EB;
            border-radius: 10px;
            overflow: hidden;
          }
          .receipt-header {
            background: linear-gradient(to right, #4F46E5, #6366F1);
            color: white;
            padding: 20px;
            text-align: center;
          }
          .receipt-logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt-title {
            font-size: 18px;
            opacity: 0.9;
          }
          .receipt-body {
            padding: 20px;
          }
          .order-number {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #4F46E5;
          }
          .order-status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            background-color: ${statusConfig.bgColor};
            color: ${statusConfig.color};
          }
          .product-details {
            margin-bottom: 20px;
            border: 1px solid #F3F4F6;
            border-radius: 8px;
            padding: 15px;
            background-color: #F9FAFB;
          }
          .product-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .product-price {
            font-size: 15px;
            color: #4F46E5;
            font-weight: bold;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .details-table th {
            text-align: left;
            padding: 10px;
            background-color: #F3F4F6;
            font-weight: normal;
            color: #6B7280;
          }
          .details-table td {
            padding: 10px;
            border-bottom: 1px solid #F3F4F6;
          }
          .total-row td {
            font-weight: bold;
            color: #4F46E5;
            border-top: 2px solid #E5E7EB;
          }
          .receipt-footer {
            text-align: center;
            padding: 20px;
            border-top: 1px solid #F3F4F6;
            color: #6B7280;
            font-size: 12px;
          }
          .info-note {
            padding: 15px;
            background-color: ${statusConfig.bgColor};
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid ${statusConfig.color};
          }
          .info-note-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: ${statusConfig.color};
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <div class="receipt-logo">Toko Online</div>
            <div class="receipt-title">Bukti Pemesanan</div>
          </div>
          
          <div class="receipt-body">
            <div class="order-number">Nomor Pesanan: ${order.orderNumber}</div>
            
            <div class="order-status">${statusConfig.label}</div>
            
            <div class="product-details">
              <div class="product-name">${order.productName}</div>
              <div class="product-price">Rp ${order.amount?.toLocaleString('id-ID')}</div>
            </div>
            
            <table class="details-table">
              <tr>
                <th>Detail Pesanan</th>
                <th>Informasi</th>
              </tr>
              <tr>
                <td>Tanggal Pemesanan</td>
                <td>${formatDate(order.createdAt)}</td>
              </tr>
              <tr>
                <td>Metode Pembayaran</td>
                <td>${order.paymentMethod || 'Transfer Bank'}</td>
              </tr>
              <tr>
                <td>Status Pembayaran</td>
                <td>${getStatusConfig(order).unpaid ? 'BELUM BAYAR' : 'SUDAH BAYAR'}</td>
              </tr>
              <tr class="total-row">
                <td>Total Pembayaran</td>
                <td>Rp ${order.amount?.toLocaleString('id-ID')}</td>
              </tr>
            </table>
            
            <div class="info-note">
              <div class="info-note-title">Catatan:</div>
              <div>${order.adminNotes || 
                (order.status === 'pending' && !order.paymentProof 
                  ? "Silakan lakukan pembayaran untuk melanjutkan proses pesanan Anda." 
                  : order.status === 'pending' 
                    ? "Pembayaran Anda sedang dalam proses verifikasi oleh tim kami." 
                    : order.status === 'processing' 
                      ? "Pesanan Anda sedang diproses dan akan segera disiapkan." 
                      : order.status === 'cancelled' 
                        ? "Mohon maaf, pesanan Anda telah ditolak." 
                        : "Terima kasih, pesanan Anda telah selesai.")}</div>
            </div>
          </div>
          
          <div class="receipt-footer">
            <p>Terima kasih telah berbelanja di Toko Online</p>
            <p>Dokumen ini sah dan diproses secara elektronik</p>
            <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintReceipt = async (order) => {
    try {
      setPrintingOrderId(order.id);
      
      // Generate receipt HTML
      const html = generateReceiptHTML(order);
      
      // Generate PDF file
      const { uri } = await Print.printToFileAsync({ html });
      
      // On iOS, share the file
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } 
      // On Android, save to downloads and share
      else {
        const downloadPath = FileSystem.documentDirectory + `receipt-${order.orderNumber}.pdf`;
        await FileSystem.moveAsync({
          from: uri,
          to: downloadPath
        });
        
        await Sharing.shareAsync(downloadPath);
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Tidak dapat mencetak struk. Silakan coba lagi.');
    } finally {
      setPrintingOrderId(null);
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => 
        filterStatus === 'active' 
          ? ['pending', 'processing', 'waiting_confirmation'].includes(order.status) 
          : ['completed', 'cancelled'].includes(order.status)
      );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animatable.View animation="pulse" easing="ease-out" iterationCount="infinite">
          <ActivityIndicator size="large" color="#4F46E5" />
        </Animatable.View>
        <Text style={styles.loadingText}>Memuat pesanan Anda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.title}>Riwayat Pesanan</Text>
        <Feather name="shopping-bag" size={24} color="white" />
      </LinearGradient>
      
      {orders.length > 0 && (
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, filterStatus === 'all' && styles.activeFilter]} 
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterText, filterStatus === 'all' && styles.activeFilterText]}>
              Semua
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterStatus === 'active' && styles.activeFilter]} 
            onPress={() => setFilterStatus('active')}
          >
            <Text style={[styles.filterText, filterStatus === 'active' && styles.activeFilterText]}>
              Aktif
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterStatus === 'completed' && styles.activeFilter]} 
            onPress={() => setFilterStatus('completed')}
          >
            <Text style={[styles.filterText, filterStatus === 'completed' && styles.activeFilterText]}>
              Selesai
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {orders.length === 0 ? (
        <Animatable.View 
          animation="fadeIn"
          style={styles.emptyContainer}
        >
          <Image 
            source={require('../../../assets/images/empty-order.jpg')} 
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
          <Text style={styles.emptySubtitle}>Pesanan yang Anda buat akan muncul di sini</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/')}
          >
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Feather name="shopping-cart" size={16} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.browseButtonText}>Jelajahi Produk</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      ) : filteredOrders.length === 0 ? (
        <Animatable.View 
          animation="fadeIn"
          style={styles.emptyContainer}
        >
          <Feather name="search" size={60} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Tidak ada pesanan</Text>
          <Text style={styles.emptySubtitle}>Tidak ada pesanan dengan filter yang dipilih</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={styles.browseButtonText}>Lihat Semua Pesanan</Text>
          </TouchableOpacity>
        </Animatable.View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.map((order, index) => {
            const statusConfig = getStatusConfig(order);
            const isUnpaid = statusConfig.unpaid;
            const isExpanded = expandedOrder === order.id;
            const isPrinting = printingOrderId === order.id;
            
            return (
              <Animatable.View 
                key={order.id}
                animation="fadeInUp"
                duration={500}
                delay={index * 100}
                style={[
                  styles.orderCard,
                  isExpanded && styles.expandedCard
                ]}
              >
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => toggleExpandOrder(order.id)}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderNumberContainer}>
                      <Feather name="shopping-bag" size={16} color="#4F46E5" />
                      <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    </View>
                    <View style={styles.headerActions}>
                      <TouchableOpacity
                        style={styles.receiptIconButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handlePrintReceipt(order);
                        }}
                        disabled={isPrinting}
                      >
                        {isPrinting ? (
                          <ActivityIndicator size="small" color="#4F46E5" />
                        ) : (
                          <MaterialCommunityIcons 
                            name="receipt" 
                            size={20} 
                            color="#4F46E5" 
                          />
                        )}
                      </TouchableOpacity>
                      <LinearGradient
                        colors={statusConfig.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.statusBadge}
                      >
                        <Feather 
                          name={statusConfig.icon} 
                          size={14} 
                          color={statusConfig.color} 
                          style={styles.statusIcon}
                        />
                        <Text style={[
                          styles.statusText, 
                          { color: statusConfig.color }
                        ]}>
                          {statusConfig.label}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                  
                  <View style={styles.productContainer}>
                    {order.productImage ? (
                      <Image 
                        source={{ uri: order.productImage }} 
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.productImage, styles.noProductImage]}>
                        <Feather name="image" size={24} color="#CBD5E1" />
                      </View>
                    )}
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {order.productName}
                      </Text>
                      <Text style={styles.productPrice}>
                        Rp {order.amount?.toLocaleString('id-ID')}
                      </Text>
                      <Text style={styles.orderDate}>
                        {formatDate(order.createdAt)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.paymentStatusContainer}>
                    <LinearGradient
                      colors={isUnpaid ? ['#FEE2E2', '#FEF2F2'] : ['#D1FAE5', '#ECFDF5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.paymentStatusBadge}
                    >
                      <Text style={[
                        styles.paymentStatusText,
                        { color: isUnpaid ? '#EF4444' : '#10B981' }
                      ]}>
                        {isUnpaid ? 'BELUM BAYAR' : 'SUDAH BAYAR'}
                      </Text>
                    </LinearGradient>
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
                        <View style={styles.paymentMethodBadge}>
                          <Feather 
                            name={order.paymentMethod?.toLowerCase().includes('transfer') ? 'credit-card' : 'dollar-sign'} 
                            size={14} 
                            color="#4F46E5" 
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.detailValue}>{order.paymentMethod || 'Transfer Bank'}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Tanggal Pesanan:</Text>
                        <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Pembayaran:</Text>
                        <Text style={[styles.detailValue, styles.totalPrice]}>
                          Rp {order.amount?.toLocaleString('id-ID')}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Admin notes */}
                    <LinearGradient
                      colors={[statusConfig.bgColor, '#FFFFFF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.adminNotesContainer, 
                        { borderLeftColor: statusConfig.color }
                      ]}
                    >
                      <View style={styles.adminNotesHeader}>
                        <Feather name="info" size={16} color={statusConfig.color} />
                        <Text style={[styles.adminNotesTitle, { color: statusConfig.color }]}>Catatan:</Text>
                      </View>
                      <Text style={styles.adminNotesText}>
                        {order.adminNotes || 
                          (order.status === 'pending' && !order.paymentProof 
                            ? "Silakan lakukan pembayaran untuk melanjutkan proses pesanan Anda." 
                            : order.status === 'pending' 
                              ? "Pembayaran Anda sedang dalam proses verifikasi oleh tim kami." 
                              : order.status === 'processing' 
                                ? "Pesanan Anda sedang diproses dan akan segera disiapkan." 
                                : order.status === 'cancelled' 
                                  ? "Mohon maaf, pesanan Anda telah ditolak." 
                                  : "Terima kasih, pesanan Anda telah selesai.")}
                      </Text>
                    </LinearGradient>
                    
                    {/* Action buttons */}
                    <View style={styles.actionButtons}>
                      {isUnpaid && order.status === 'pending' && !order.paymentProof && (
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.primaryButton]}
                          onPress={() => router.push(`/order/${order.id}?showPayment=true`)}
                        >
                          <LinearGradient
                            colors={['#4F46E5', '#6366F1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                          >
                            <Feather name="upload" size={16} color="white" />
                            <Text style={styles.actionButtonText}>Upload Bukti Bayar</Text>
                          </LinearGradient>
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
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
  },
  activeFilter: {
    backgroundColor: '#EEF2FF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  scrollContainer: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyImage: {
    width: 240,
    height: 240,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    overflow: 'hidden',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  gradientButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#F3F4F6',
  },
  expandedCard: {
    shadowColor: '#4F46E5',
    shadowOpacity: 0.12,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 6,
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
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
  },
  noProductImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  totalPrice: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminNotesContainer: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  adminNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  adminNotesTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  adminNotesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  actionButton: {
    margin: 4,
    flex: 1,
    minWidth: '48%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  primaryButton: {
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  secondaryButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  tertiaryButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
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
    fontWeight: '600',
    fontSize: 14,
    marginRight: 8,
  },
});

export default OrdersScreen;