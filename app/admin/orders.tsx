import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { schedulePushNotification } from '@/lib/notifications';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  X,
  FileText,
  Calendar,
  DollarSign,
  MessageSquare,
  User,
  Mail,
  Phone,
  Info,
  Sliders,
  RefreshCw,
  ChevronRight
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
  SlideInUp,
  SlideOutDown
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

const ORDER_STATUS = {
  pending: {
    label: 'Menunggu',
    color: '#F59E0B',
    icon: Clock,
    bgColor: '#FFFBEB',
  },
  processing: {
    label: 'Diproses',
    color: '#3B82F6',
    icon: Package,
    bgColor: '#EFF6FF',
  },
  approved: {
    label: 'Selesai',
    color: '#10B981',
    icon: CheckCircle,
    bgColor: '#ECFDF5',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: '#EF4444',
    icon: XCircle,
    bgColor: '#FEF2F2',
  },
};

const STATUS_OPTIONS = [
  { label: 'Semua', value: 'all' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Diproses', value: 'processing' },
  { label: 'Selesai', value: 'approved' },
  { label: 'Dibatalkan', value: 'cancelled' },
];

const SORT_OPTIONS = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Terlama', value: 'oldest' },
  { label: 'Harga Tertinggi', value: 'price_high' },
  { label: 'Harga Terendah', value: 'price_low' },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ManageOrders() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const filterHeight = useSharedValue(0);
  const filterOpacity = useSharedValue(0);
  
  useEffect(() => {
    loadOrders();
    // Clean up expanded order when component unmounts
    return () => {
      setExpandedOrderId(null);
      setSelectedOrder(null);
    };
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, sortOption]);

  useEffect(() => {
    // Animate the filter container
    if (showFilters) {
      filterHeight.value = withTiming(130, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
      filterOpacity.value = withTiming(1, { duration: 400 });
    } else {
      filterHeight.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
      filterOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [showFilters]);

  const animatedFilterStyle = useAnimatedStyle(() => {
    return {
      height: filterHeight.value,
      opacity: filterOpacity.value,
      overflow: 'hidden',
    };
  });

  const loadOrders = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      // Create a query against the orders collection
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      
      // Get the snapshot
      const querySnapshot = await getDocs(q);
      
      // Process the results
      const ordersData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Handle Firestore Timestamp objects properly
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : data.createdAt ? new Date(data.createdAt) : new Date();
          
        return {
          id: doc.id,
          ...data,
          createdAt: createdAt,
        };
      });
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Gagal memuat pesanan: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoad(false);
    }
  };

  const filterOrders = () => {
    if (!orders.length) return;
    
    let result = [...orders];
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.orderNumber?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.productName?.toLowerCase().includes(query)
      );
    }
    
    // Sort orders
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'price_high':
        result.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        break;
      case 'price_low':
        result.sort((a, b) => (a.amount || 0) - (b.amount || 0));
        break;
    }
    
    setFilteredOrders(result);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setActionInProgress(true);
      const orderRef = doc(db, 'orders', orderId);
      
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      });

      // Send notification
      let notificationTitle = '';
      let notificationBody = '';

      switch (newStatus) {
        case 'processing':
          notificationTitle = 'Pesanan Diproses';
          notificationBody = 'Pesanan Anda sedang dikerjakan oleh tim kami';
          break;
        case 'approved':
          notificationTitle = 'Pesanan Selesai';
          notificationBody = 'Pesanan Anda telah selesai dikerjakan';
          break;
        case 'cancelled':
          notificationTitle = 'Pesanan Dibatalkan';
          notificationBody = 'Pesanan Anda telah dibatalkan';
          break;
      }

      if (notificationTitle) {
        try {
          await schedulePushNotification(notificationTitle, notificationBody);
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }
      
      // Reload orders to reflect the changes
      await loadOrders();
      
      // Show success toast
      Alert.alert('Sukses', `Status pesanan berhasil diubah menjadi ${ORDER_STATUS[newStatus].label}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Gagal memperbarui status pesanan: ' + error.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const saveAdminNote = async () => {
    if (!selectedOrder) return;
    
    try {
      setActionInProgress(true);
      const orderRef = doc(db, 'orders', selectedOrder.id);
      
      await updateDoc(orderRef, {
        adminNote,
        updatedAt: new Date(),
      });
      
      setNoteModalVisible(false);
      
      // Reload orders to reflect the changes
      await loadOrders();
      Alert.alert('Sukses', 'Catatan admin berhasil disimpan');
    } catch (error) {
      console.error('Error saving admin note:', error);
      Alert.alert('Error', 'Gagal menyimpan catatan: ' + error.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const renderStatusBadge = (status) => {
    const statusInfo = ORDER_STATUS[status] || ORDER_STATUS.pending;
    const StatusIcon = statusInfo.icon;
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
        <StatusIcon size={14} color={statusInfo.color} strokeWidth={2.5} />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.label}
        </Text>
      </View>
    );
  };

  const renderOrderItem = ({ item, index }) => {
    const isExpanded = expandedOrderId === item.id;
    const status = ORDER_STATUS[item.status] || ORDER_STATUS.pending;
    const StatusIcon = status.icon;
    const isEven = index % 2 === 0;

    const cardStyle = [
      styles.orderCard,
      { borderLeftColor: status.color, borderLeftWidth: 4 },
      isEven ? { backgroundColor: 'white' } : { backgroundColor: '#fafafa' }
    ];

    return (
      <Animated.View 
        entering={FadeIn.delay(index * 50).duration(300)}
        style={cardStyle}
      >
        <TouchableOpacity 
          style={styles.orderHeader}
          onPress={() => toggleOrderExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{item.orderNumber || 'No Order #'}</Text>
            <Text style={styles.orderService}>{item.productName || 'Unknown Product'}</Text>
            <Text style={styles.customerName}>{item.customerName || 'Unknown Customer'}</Text>
          </View>
          
          <View style={styles.headerRight}>
            {renderStatusBadge(item.status)}
            <Animated.View style={{
              transform: [{ 
                rotate: isExpanded ? '180deg' : '0deg' 
              }],
            }}>
              <ChevronDown size={18} color="#64748b" />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={styles.expandedContent}
          >
            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Calendar size={16} color="#64748b" />
                  <Text style={styles.detailLabel}>Tanggal:</Text>
                </View>
                <Text style={styles.detailValue}>
                  {item.createdAt.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <DollarSign size={16} color="#64748b" />
                  <Text style={styles.detailLabel}>Harga:</Text>
                </View>
                <Text style={[styles.detailValue, styles.priceText]}>
                  Rp {(item.amount || 0).toLocaleString('id-ID')}
                </Text>
              </View>
              
              {item.adminNote && (
                <View style={styles.noteContainer}>
                  <View style={styles.detailItem}>
                    <MessageSquare size={16} color="#64748b" />
                    <Text style={styles.noteLabel}>Catatan Admin:</Text>
                  </View>
                  <Text style={styles.noteText}>{item.adminNote}</Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => setSelectedOrder(item)}
              >
                <Info size={14} color="#7C3AED" />
                <Text style={styles.viewDetailsText}>Detail</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.noteButton}
                onPress={() => {
                  setSelectedOrder(item);
                  setAdminNote(item.adminNote || '');
                  setNoteModalVisible(true);
                }}
              >
                <FileText size={14} color="#7C3AED" />
                <Text style={styles.noteButtonText}>Catatan</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('@/assets/images/empty-order.jpg')} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Tidak ada pesanan ditemukan</Text>
      <Text style={styles.emptyText}>
        {searchQuery || statusFilter !== 'all' 
          ? 'Coba ubah filter pencarian Anda' 
          : 'Belum ada pesanan yang masuk'}
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={loadOrders}
      >
        <RefreshCw size={16} color="white" />
        <Text style={styles.refreshButtonText}>Muat Ulang</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <Animated.View 
      style={[styles.header]}
      entering={FadeIn.duration(500)}
    >
      <Text style={styles.headerTitle}>Kelola Pesanan</Text>
      <Text style={styles.headerSubtitle}>
        {filteredOrders.length} pesanan {
          statusFilter !== 'all' ? `dengan status ${ORDER_STATUS[statusFilter].label.toLowerCase()}` : 'aktif'
        }
      </Text>
    </Animated.View>
  );

  if (loading && initialLoad) {
    return (
      <SafeAreaView style={[styles.loadingContainer, {paddingTop: insets.top}]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.loadingLogo}
        />
        <ActivityIndicator size="large" color="#7C3AED" style={styles.loadingIndicator} />
        <Text style={styles.loadingText}>Memuat pesanan...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      {renderHeader()}
      
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari pesanan..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            showFilters && styles.filterButtonActive
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Sliders size={16} color={showFilters ? "white" : "#7C3AED"} />
          <Text style={[
            styles.filterButtonText,
            showFilters && styles.filterButtonTextActive
          ]}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Animated Filters */}
      <Animated.View style={[styles.filtersContainer, animatedFilterStyle]}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Status Pesanan:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusFilters}
            snapToAlignment="start"
            decelerationRate="fast"
          >
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusFilterChip,
                  statusFilter === option.value && styles.statusFilterChipActive
                ]}
                onPress={() => setStatusFilter(option.value)}
              >
                <Text style={[
                  styles.statusFilterText,
                  statusFilter === option.value && styles.statusFilterTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Urutkan:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusFilters}
            snapToAlignment="start"
            decelerationRate="fast"
          >
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusFilterChip,
                  sortOption === option.value && styles.statusFilterChipActive
                ]}
                onPress={() => setSortOption(option.value)}
              >
                <Text style={[
                  styles.statusFilterText,
                  sortOption === option.value && styles.statusFilterTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Animated.View>

      {/* Order List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderOrderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadOrders}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={[
          styles.listContent,
          filteredOrders.length === 0 && { flex: 1 }
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedOrder}
          onRequestClose={() => setSelectedOrder(null)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <BlurView intensity={isIOS ? 10 : 40} style={StyleSheet.absoluteFill} />
            <Animated.View 
              entering={SlideInRight.duration(300)}
              exiting={SlideOutRight.duration(300)}
              style={styles.modalContent}
            >
              <LinearGradient
                colors={['#7C3AED', '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalHeader}
              >
                <View style={styles.modalHeaderContent}>
                  <View>
                    <Text style={styles.modalOrderNumber}>#{selectedOrder.orderNumber || 'No Order #'}</Text>
                    <Text style={styles.modalTitle}>{selectedOrder.productName || 'Unknown Product'}</Text>
                    <View style={styles.modalStatusRow}>
                      {renderStatusBadge(selectedOrder.status)}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setSelectedOrder(null)}
                  >
                    <X size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
                  <View style={styles.detailCard}>
                    <View style={styles.modalDetailRow}>
                      <View style={styles.modalDetailItem}>
                        <Calendar size={16} color="#7C3AED" />
                        <Text style={styles.modalDetailLabel}>Tanggal Order</Text>
                      </View>
                      <Text style={styles.modalDetailValue}>
                        {selectedOrder.createdAt.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <View style={styles.modalDetailItem}>
                        <Clock size={16} color="#7C3AED" />
                        <Text style={styles.modalDetailLabel}>Waktu</Text>
                      </View>
                      <Text style={styles.modalDetailValue}>
                        {selectedOrder.createdAt.toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <View style={styles.modalDetailItem}>
                        <DollarSign size={16} color="#7C3AED" />
                        <Text style={styles.modalDetailLabel}>Total Harga</Text>
                      </View>
                      <Text style={[styles.modalDetailValue, styles.priceValue]}>
                        Rp {(selectedOrder.amount || 0).toLocaleString('id-ID')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Detail Pelanggan</Text>
                  <View style={styles.detailCard}>
                    <View style={styles.modalDetailRow}>
                      <View style={styles.modalDetailItem}>
                        <User size={16} color="#7C3AED" />
                        <Text style={styles.modalDetailLabel}>Nama</Text>
                      </View>
                      <Text style={styles.modalDetailValue}>{selectedOrder.customerName || '-'}</Text>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <View style={styles.modalDetailItem}>
                        <Mail size={16} color="#7C3AED" />
                        <Text style={styles.modalDetailLabel}>Email</Text>
                      </View>
                      <Text style={styles.modalDetailValue}>{selectedOrder.customerEmail || '-'}</Text>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <View style={styles.modalDetailItem}>
                        <Phone size={16} color="#7C3AED" />
                        <Text style={styles.modalDetailLabel}>WhatsApp</Text>
                      </View>
                      <Text style={styles.modalDetailValue}>{selectedOrder.customerPhone || '-'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Detail Tugas</Text>
                  <View style={styles.detailCard}>
                    <View style={styles.modalDetailRow}>
                      <View style={styles.modalDetailItem}>
                        <User size={16} color="#7C3AED" />
                        <Text style={styles.modalDetailLabel}>Nama</Text>
                      </View>
                      <Text style={styles.modalDetailValue}>{selectedOrder.orderDetails?.username || '-'}</Text>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <View style={styles.modalDetailItem}>
                        <FileText size={16} color="#7C3AED" />
                        <Text style={styles.modalDetailLabel}>Jenis Tugas</Text>
                      </View>
                      <Text style={styles.modalDetailValue}>{selectedOrder.orderDetails?.password || '-'}</Text>
                    </View>

                    <View style={[styles.modalDetailRow, { alignItems: 'flex-start' }]}>
                      <View style={styles.modalDetailItem}>
                        <MessageSquare size={16} color="#7C3AED" />
                        <Text style={styles.modalDetailLabel}>Catatan</Text>
                      </View>
                      <Text style={[styles.modalDetailValue, { flex: 1 }]}>
                        {selectedOrder.orderDetails?.notes || '-'}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedOrder.adminNote && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Catatan Admin</Text>
                    <View style={styles.adminNoteCard}>
                      <Text style={styles.adminNoteText}>{selectedOrder.adminNote}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Update Status</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.statusButtonsContainer}
                  >
                    {Object.entries(ORDER_STATUS).map(([key, value]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.statusUpdateButton,
                          selectedOrder.status === key && styles.activeStatusButton,
                          { backgroundColor: selectedOrder.status === key ? value.color : 'white' }
                        ]}
                        onPress={() => {
                          if (selectedOrder.status !== key) {
                            updateOrderStatus(selectedOrder.id, key);
                            setSelectedOrder(null);
                          }
                        }}
                        disabled={actionInProgress || selectedOrder.status === key}
                      >
                        {value.icon && (
                          <value.icon 
                            size={16} 
                            color={selectedOrder.status === key ? 'white' : value.color} 
                          />
                        )}
                        <Text
                          style={[
                            styles.statusButtonText,
                            { color: selectedOrder.status === key ? 'white' : value.color }
                          ]}
                        >
                          {value.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                {/* Add some padding at the bottom to ensure all content is visible */}
                <View style={{ height: 70 }} />
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.addNoteButton}
                  onPress={() => {
                    setAdminNote(selectedOrder.adminNote || '');
                    setNoteModalVisible(true);
                  }}
                >
                  <MessageSquare size={18} color="white" />
                  <Text style={styles.addNoteButtonText}>Tambah Catatan</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </Modal>
      )}

      {/* Admin Note Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={noteModalVisible}
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.noteModalContainer}
        >
          <BlurView intensity={isIOS ? 25 : 40} style={StyleSheet.absoluteFill} />
          <Animated.View 
            entering={SlideInUp.duration(300)}
            exiting={SlideOutDown.duration(200)}
            style={styles.noteModalContent}
          >
            <View style={styles.noteModalHeader}>
              <Text style={styles.noteModalTitle}>Catatan Admin</Text>
              <TouchableOpacity 
                style={styles.closeNoteButton}
                onPress={() => setNoteModalVisible(false)}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={6}
              placeholder="Masukkan catatan untuk pesanan ini..."
              placeholderTextColor="#9CA3AF"
              value={adminNote}
              onChangeText={setAdminNote}
              autoFocus
            />
            
            <View style={styles.noteModalButtons}>
              <TouchableOpacity
                style={[styles.noteModalButton, styles.cancelButton]}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.noteModalButton, styles.saveButton]}
                onPress={saveAdminNote}
                disabled={actionInProgress}
              >
                {actionInProgress ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterButtonText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  filterSection: {
    marginVertical: 8,
  },
  filterLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusFilters: {
    flexDirection: 'row',
    paddingRight: 16,
    paddingBottom: 4,
    gap: 8,
  },
  statusFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusFilterChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  statusFilterText: {
    color: '#64748B',
    fontWeight: '500',
    fontSize: 13,
  },
  statusFilterTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80, // Extra space at bottom for better scrolling
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  orderService: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 12,
    color: '#64748B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  orderDetails: {
    gap: 10,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  priceText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  noteContainer: {
    marginTop: 4,
    gap: 4,
  },
  noteLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  noteText: {
    fontSize: 12,
    color: '#334155',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#7C3AED',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  viewDetailsText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 13,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  noteButtonText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyImage: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 16,
    opacity: 0.9,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    width: '100%',
    borderTopLeftRadius: isIOS ? 20 : 0,
    borderTopRightRadius: isIOS ? 20 : 0,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalOrderNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  modalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalBody: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  detailSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    maxWidth: '55%',
    textAlign: 'right',
  },
  priceValue: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  adminNoteCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  adminNoteText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    paddingRight: 16,
  },
  statusUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1.5,
    minWidth: 110,
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  activeStatusButton: {
    borderWidth: 0,
  },
  statusButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addNoteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  noteModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  noteModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeNoteButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#334155',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  noteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  noteModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#7C3AED',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});