import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Users,
  FileText,
  TrendingUp,
  LogOut,
  ArrowRight,
  RefreshCw,
} from 'lucide-react-native';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    approvedOrders: 0,
    processingOrders: 0,
    totalProduk: 0,
    totalBerita: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('Admin');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const usersSnap = await getDocs(collection(db, 'users'));
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const produkSnap = await getDocs(collection(db, 'produk'));
      const beritaSnap = await getDocs(collection(db, 'berita'));

      const orders = ordersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const approvedOrders = orders.filter((order) => order.status === 'approved');
      const totalRevenue = approvedOrders.reduce((sum, order) => sum + (order.price || 0), 0);

      setStats({
        totalUsers: usersSnap.size,
        totalOrders: ordersSnap.size,
        totalRevenue,
        pendingOrders: orders.filter((order) => order.status === 'pending').length,
        cancelledOrders: orders.filter((order) => order.status === 'cancelled').length,
        approvedOrders: approvedOrders.length,
        processingOrders: orders.filter((order) => order.status === 'processing').length,
        totalProduk: produkSnap.size,
        totalBerita: beritaSnap.size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}, {name}!</Text>
          <Text style={styles.title}>Dashboard Admin</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/login')} style={styles.logoutButton}>
          <LogOut size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ringkasan Statistik</Text>
        <TouchableOpacity onPress={loadStats} style={styles.refreshButton}>
          <RefreshCw size={18} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon={<Users size={20} color="#6D28D9" />} label="Total Pengguna" value={stats.totalUsers} bg="#EDE9FE" />
        <StatCard icon={<FileText size={20} color="#059669" />} label="Total Pesanan" value={stats.totalOrders} bg="#D1FAE5" />
        <StatCard icon={<TrendingUp size={20} color="#F59E0B" />} label="Total Pendapatan" value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`} bg="#FEF3C7" />
        <StatCard icon={<FileText size={20} color="#7C3AED" />} label="Total Produk" value={stats.totalProduk} bg="#DDD6FE" />
        <StatCard icon={<FileText size={20} color="#EC4899" />} label="Total Berita" value={stats.totalBerita} bg="#FCE7F3" />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Status Pesanan</Text>
        <View style={{ marginTop: 12 }}>
          <Text style={styles.legendText}>✅ Disetujui: {stats.approvedOrders}</Text>
          <Text style={styles.legendText}>🕒 Diproses: {stats.processingOrders}</Text>
          <Text style={styles.legendText}>⏳ Pending: {stats.pendingOrders}</Text>
          <Text style={styles.legendText}>❌ Ditolak: {stats.cancelledOrders}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Menu Admin</Text>
        <MenuItem
          title="Kelola Pengguna"
          description="Lihat dan kelola data pengguna"
          icon={<Users size={20} color="#7C3AED" />}
          bg="#EDE9FE"
          onPress={() => router.push('/admin/users')}
        />
        <MenuItem
          title="Kelola Pesanan"
          description="Monitor dan update status pesanan"
          icon={<FileText size={20} color="#3B82F6" />}
          bg="#DBEAFE"
          onPress={() => router.push('/admin/orders')}
        />
        <MenuItem
          title="Kelola Data Master"
          description="Kelola kategori dan data dasar"
          icon={<FileText size={20} color="#D97706" />}
          bg="#FEF3C7"
          onPress={() => router.push('/admin/data_master')}
        />
        <MenuItem
          title="Kelola Produk"
          description="Tambah, edit, atau hapus produk"
          icon={<FileText size={20} color="#10B981" />}
          bg="#D1FAE5"
          onPress={() => router.push('/admin/produk')}
        />
      </View>
    </ScrollView>
  );
}

const StatCard = ({ icon, label, value, bg }) => (
  <View style={[styles.statCard, styles.cardShadow, { backgroundColor: bg }]}>
    <View style={styles.statIconContainer}>{icon}</View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuItem = ({ title, description, icon, onPress, bg }) => (
  <TouchableOpacity style={[styles.menuCard, styles.cardShadow]} onPress={onPress}>
    <View style={styles.menuContent}>
      <View style={[styles.menuIcon, { backgroundColor: bg }]}>{icon}</View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
    </View>
    <ArrowRight size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 16, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24 },
  greeting: { fontSize: 16, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  title: { fontSize: 24, fontFamily: 'Poppins_600SemiBold', color: '#111827', marginTop: 4 },
  logoutButton: { backgroundColor: '#EDE9FE', padding: 12, borderRadius: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  refreshButton: { backgroundColor: '#F3E8FF', padding: 8, borderRadius: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  statCard: { width: '48%', borderRadius: 16, padding: 16 },
  statIconContainer: { backgroundColor: 'rgba(255,255,255,0.7)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontFamily: 'Poppins_600SemiBold', color: '#111827', marginBottom: 4 },
  statLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  chartContainer: { marginBottom: 24 },
  legendText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#4B5563', marginBottom: 6 },
  menuContainer: { marginBottom: 32 },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#111827', marginBottom: 4 },
  menuDescription: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#6B7280' },
  cardShadow: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
});
