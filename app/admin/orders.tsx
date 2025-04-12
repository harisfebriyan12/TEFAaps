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
} from 'react-native';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { schedulePushNotification } from '@/lib/notifications';
import { Package, Clock, CheckCircle, XCircle, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { BlurView } from 'expo-blur';

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
  completed: {
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
  { label: 'Semua Status', value: 'all' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Diproses', value: 'processing' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Dibatalkan', value: 'cancelled' },
];

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      // Create a query against the orders collection
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      
      // Get the snapshot
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No orders found');
      } else {
        console.log(`Found ${querySnapshot.size} orders`);
      }
      
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
      console.log('Orders loaded:', ordersData.length);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Gagal memuat pesanan: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrders = () => {
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
    
    setFilteredOrders(result);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      });

      console.log(`Order ${orderId} status updated to ${newStatus}`);

      // Send notification
      let notificationTitle = '';
      let notificationBody = '';

      switch (newStatus) {
        case 'processing':
          notificationTitle = 'Pesanan Diproses';
          notificationBody = 'Pesanan Anda sedang dikerjakan oleh tim kami';
          break;
        case 'completed':
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
      loadOrders();
      Alert.alert('Sukses', `Status pesanan berhasil diubah menjadi ${ORDER_STATUS[newStatus].label}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Gagal memperbarui status pesanan: ' + error.message);
    }
  };

  const saveAdminNote = async () => {
    if (!selectedOrder) return;
    
    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      
      await updateDoc(orderRef, {
        adminNote,
        updatedAt: new Date(),
      });
      
      console.log(`Admin note updated for order ${selectedOrder.id}`);
      setNoteModalVisible(false);
      
      // Reload orders to reflect the changes
      loadOrders();
      Alert.alert('Sukses', 'Catatan admin berhasil disimpan');
    } catch (error) {
      console.error('Error saving admin note:', error);
      Alert.alert('Error', 'Gagal menyimpan catatan: ' + error.message);
    }
  };

  const renderOrderItem = ({ item }) => {
    const status = ORDER_STATUS[item.status] || ORDER_STATUS.pending;
    const StatusIcon = status.icon;

    return (
      <TouchableOpacity 
        style={[styles.orderCard, { borderLeftColor: status.color, borderLeftWidth: 4 }]}
        onPress={() => setSelectedOrder(item)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{item.orderNumber || 'No Order #'}</Text>
            <Text style={styles.orderService}>{item.productName || 'Unknown Product'}</Text>
            <Text style={styles.customerName}>{item.customerName || 'Unknown Customer'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <StatusIcon size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tanggal:</Text>
            <Text style={styles.detailValue}>
              {item.createdAt.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Harga:</Text>
            <Text style={[styles.detailValue, styles.priceText]}>
              Rp {(item.amount || 0).toLocaleString('id-ID')}
            </Text>
          </View>
          {item.adminNote && (
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>Catatan Admin:</Text>
              <Text style={styles.noteText}>{item.adminNote}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.noteButton]}
            onPress={() => {
              setSelectedOrder(item);
              setAdminNote(item.adminNote || '');
              setNoteModalVisible(true);
            }}
          >
            <Text style={styles.actionButtonText}>Tambah Catatan</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Memuat pesanan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari pesanan..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#7C3AED" />
          <Text style={styles.filterButtonText}>Filter</Text>
          {showFilters ? <ChevronUp size={18} color="#7C3AED" /> : <ChevronDown size={18} color="#7C3AED" />}
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Status Pesanan:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={statusFilter}
              onValueChange={(itemValue) => setStatusFilter(itemValue)}
              style={styles.picker}
              dropdownIconColor="#7C3AED"
            >
              {STATUS_OPTIONS.map((option) => (
                <Picker.Item 
                  key={option.value} 
                  label={option.label} 
                  value={option.value} 
                />
              ))}
            </Picker>
          </View>
        </View>
      )}

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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada pesanan ditemukan</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadOrders}
            >
              <Text style={styles.refreshButtonText}>Muat Ulang</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          filteredOrders.length === 0 && { flex: 1 }
        ]}
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedOrder}
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View style={styles.modalContainer}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detail Pesanan</Text>
                <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                  <XCircle size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nomor Pesanan:</Text>
                    <Text style={styles.detailValue}>#{selectedOrder.orderNumber || 'No Order #'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Layanan:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.productName || 'Unknown Product'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={styles.statusValue}>
                      <Text style={[styles.detailValue, { color: ORDER_STATUS[selectedOrder.status]?.color || '#F59E0B' }]}>
                        {ORDER_STATUS[selectedOrder.status]?.label || 'Menunggu'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tanggal:</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.createdAt.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Harga:</Text>
                    <Text style={[styles.detailValue, styles.priceText]}>
                      Rp {(selectedOrder.amount || 0).toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Detail Pelanggan</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nama:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.customerName || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.customerEmail || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>WhatsApp:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.customerPhone || '-'}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Detail Tugas</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Username/NIM:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.orderDetails?.username || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Jenis Tugas:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.orderDetails?.taskType || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Catatan:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.orderDetails?.notes || '-'}</Text>
                  </View>
                </View>

                {selectedOrder.adminNote && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Catatan Admin</Text>
                    <Text style={styles.adminNoteText}>{selectedOrder.adminNote}</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <View style={styles.statusActions}>
                  {Object.entries(ORDER_STATUS).map(([key, value]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.statusButton,
                        selectedOrder.status === key && styles.activeStatusButton,
                        { borderColor: value.color }
                      ]}
                      onPress={() => {
                        updateOrderStatus(selectedOrder.id, key);
                        setSelectedOrder(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          { color: value.color },
                          selectedOrder.status === key && { color: 'white' }
                        ]}
                      >
                        {value.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.noteButton}
                  onPress={() => {
                    setAdminNote(selectedOrder.adminNote || '');
                    setNoteModalVisible(true);
                  }}
                >
                  <Text style={styles.noteButtonText}>Tambah Catatan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Admin Note Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={noteModalVisible}
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.noteModalContainer}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={styles.noteModalContent}>
            <Text style={styles.noteModalTitle}>Catatan Admin</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={4}
              placeholder="Masukkan catatan untuk pesanan ini..."
              value={adminNote}
              onChangeText={setAdminNote}
            />
            <View style={styles.noteModalButtons}>
              <TouchableOpacity
                style={[styles.noteModalButton, styles.cancelButton]}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={[styles.noteModalButtonText, { color: '#64748b' }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.noteModalButton, styles.saveButton]}
                onPress={saveAdminNote}
              >
                <Text style={[styles.noteModalButtonText, { color: 'white' }]}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingLeft: 8,
    color: '#334155',
    fontFamily: 'Inter_400Regular',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  filterButtonText: {
    marginLeft: 4,
    marginRight: 4,
    color: '#7C3AED',
    fontFamily: 'Inter_600SemiBold',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterLabel: {
    marginBottom: 8,
    color: '#334155',
    fontFamily: 'Inter_600SemiBold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    color: '#334155',
    backgroundColor: 'white',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  orderService: {
    fontSize: 16,
    color: '#1e293b',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Inter_500Medium',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    marginLeft: 4,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Inter_500Medium',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontFamily: 'Inter_600SemiBold',
  },
  priceText: {
    color: '#7C3AED',
  },
  noteContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  noteLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'Inter_400Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: 'Inter_600SemiBold',
  },
  noteButton: {
    backgroundColor: '#e9d5ff',
    borderColor: '#c084fc',
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    color: '#1e293b',
    fontFamily: 'Inter_700Bold',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1e293b',
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminNoteText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  statusButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeStatusButton: {
    backgroundColor: '#7C3AED',
  },
  statusButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  noteButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  noteButtonText: {
    color: 'white',
    fontFamily: 'Inter_600SemiBold',
  },
  // Note Modal Styles
  noteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  noteModalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  noteModalTitle: {
    fontSize: 18,
    color: '#1e293b',
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  noteInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
    fontFamily: 'Inter_400Regular',
  },
  noteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteModalButton: {
    flex: 1,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
  },
  noteModalButtonText: {
    fontFamily: 'Inter_600SemiBold',
  },
});