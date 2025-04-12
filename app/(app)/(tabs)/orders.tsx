import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { router } from 'expo-router';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Riwayat Pesanan</Text>
      
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="history" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Belum ada pesanan</Text>
        </View>
      ) : (
        orders.map((order) => (
          <TouchableOpacity 
            key={order.id}
            style={styles.orderCard}
            onPress={() => router.push(`/order/${order.id}`)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <View style={[
                styles.statusBadge,
                order.status === 'completed' && styles.statusCompleted,
                order.status === 'pending' && styles.statusPending,
                order.status === 'failed' && styles.statusFailed
              ]}>
                <Text style={styles.statusText}>
                  {order.status === 'completed' ? 'Selesai' : 
                   order.status === 'pending' ? 'Diproses' : 'Gagal'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.productName}>{order.productName}</Text>
            
            <View style={styles.orderDetail}>
              <Text style={styles.detailLabel}>Total Pembayaran:</Text>
              <Text style={styles.detailValue}>Rp {order.amount?.toLocaleString('id-ID')}</Text>
            </View>
            
            <View style={styles.orderDetail}>
              <Text style={styles.detailLabel}>Metode Pembayaran:</Text>
              <Text style={styles.detailValue}>{order.paymentMethod}</Text>
            </View>
            
            <View style={styles.orderFooter}>
              <Text style={styles.orderDate}>
                {order.createdAt?.seconds ? 
                  new Date(order.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : ''}
              </Text>
              <AntDesign name="right" size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  orderDetail: {
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
    color: '#111827',
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default OrdersScreen;