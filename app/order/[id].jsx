import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';

const OrderDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error getting order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="error-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>Pesanan tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="arrowleft" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.orderCard}>
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
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Layanan</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nama Layanan:</Text>
            <Text style={styles.detailValue}>{order.productName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Username/NIM:</Text>
            <Text style={styles.detailValue}>{order.orderDetails?.username}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Jenis Tugas:</Text>
            <Text style={styles.detailValue}>{order.orderDetails?.password || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Catatan:</Text>
            <Text style={styles.detailValue}>{order.orderDetails?.notes || '-'}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Pembayaran</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Metode Pembayaran:</Text>
            <Text style={styles.detailValue}>{order.paymentMethod}</Text>
          </View>
          {order.paymentAccountNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nomor Rekening:</Text>
              <Text style={styles.detailValue}>{order.paymentAccountNumber}</Text>
            </View>
          )}
          {order.paymentAccountHolder && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Atas Nama:</Text>
              <Text style={styles.detailValue}>{order.paymentAccountHolder}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Pembayaran:</Text>
            <Text style={[styles.detailValue, styles.priceText]}>
              Rp {order.amount?.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status Pembayaran:</Text>
            <Text style={styles.detailValue}>
              {order.paymentStatus === 'paid' ? 'Lunas' : 'Belum Dibayar'}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Kontak</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nama:</Text>
            <Text style={styles.detailValue}>{order.customerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{order.customerEmail}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nomor WhatsApp:</Text>
            <Text style={styles.detailValue}>{order.customerPhone}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waktu Pesanan</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>
              {order.createdAt?.seconds ? 
                new Date(order.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '-'}
            </Text>
          </View>
        </View>
        
        {order.status === 'pending' && (
          <TouchableOpacity style={styles.contactButton}>
            <FontAwesome name="whatsapp" size={20} color="white" />
            <Text style={styles.contactButtonText}>Hubungi Admin via WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  priceText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  contactButton: {
    backgroundColor: '#25D366',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrderDetailScreen;