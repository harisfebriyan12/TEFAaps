import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Package,
  Clock,
  CircleCheck as CheckCircle,
  Circle as XCircle,
} from 'lucide-react-native';

const ORDER_STATUS = {
  pending: {
    label: 'Menunggu',
    color: '#F59E0B',
    icon: Clock,
  },
  processing: {
    label: 'Diproses',
    color: '#3B82F6',
    icon: Package,
  },
  completed: {
    label: 'Selesai',
    color: '#10B981',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Dibatalkan',
    color: '#EF4444',
    icon: XCircle,
  },
};

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef);
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      loadOrders(); // Reload orders after update
    } catch (error) {
      console.error('Error updating order status:', error);
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
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const status = ORDER_STATUS[item.status] || {
            label: 'Tidak Diketahui',
            color: '#6B7280',
            icon: XCircle,
          };
          const StatusIcon = status.icon;

          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderService}>{item.serviceName}</Text>
                  <Text style={styles.orderDate}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('id-ID')
                      : 'Tidak tersedia'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${status.color}20` },
                  ]}
                >
                  <StatusIcon size={16} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <Text style={styles.orderDescription}>
                  {item.description || 'Tidak ada deskripsi'}
                </Text>
                <Text style={styles.orderPrice}>
                  Rp {item.price ? item.price.toLocaleString('id-ID') : '0'}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                {Object.entries(ORDER_STATUS).map(([key, value]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.actionButton,
                      item.status === key && styles.activeButton,
                    ]}
                    onPress={() => updateOrderStatus(item.id, key)}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        item.status === key && styles.activeButtonText,
                      ]}
                    >
                      {value.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderService: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_600SemiBold',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12,
    marginBottom: 12,
  },
  orderDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  orderPrice: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Poppins_600SemiBold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  activeButton: {
    backgroundColor: '#7C3AED',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_600SemiBold',
  },
  activeButtonText: {
    color: '#fff',
  },
});
