import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
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
  Database,
  ShoppingBag,
  BarChart2,
  Bell,
  Calendar,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Memuat data dashboard...</Text>
      </View>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderOrderStatusBar = () => {
    const total = stats.totalOrders || 1; // Avoid division by zero
    const approvedPercent = (stats.approvedOrders / total) * 100;
    const pendingPercent = (stats.pendingOrders / total) * 100;
    const processingPercent = (stats.processingOrders / total) * 100;
    const cancelledPercent = (stats.cancelledOrders / total) * 100;

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, { width: `${approvedPercent}%`, backgroundColor: '#10B981' }]} />
          <View style={[styles.progressSegment, { width: `${processingPercent}%`, backgroundColor: '#3B82F6' }]} />
          <View style={[styles.progressSegment, { width: `${pendingPercent}%`, backgroundColor: '#F59E0B' }]} />
          <View style={[styles.progressSegment, { width: `${cancelledPercent}%`, backgroundColor: '#EF4444' }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { 
              setRefreshing(true); 
              loadStats(); 
            }} 
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {name}!</Text>
            <Text style={styles.title}>Dashboard Admin</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/login')} style={styles.logoutButton}>
              <LogOut size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Display */}
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Quick Stats */}
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.quickStatsCard}
        >
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>Total Pendapatan</Text>
            <Text style={styles.quickStatValue}>{formatCurrency(stats.totalRevenue)}</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>Total Pesanan</Text>
            <Text style={styles.quickStatValue}>{stats.totalOrders}</Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Ringkasan Statistik</Text>
        <View style={styles.statsGrid}>
          <StatCard 
            icon={<Users size={22} color="#4F46E5" />} 
            label="Total Pengguna" 
            value={stats.totalUsers} 
            bg="#EEF2FF" 
          />
          <StatCard 
            icon={<ShoppingBag size={22} color="#059669" />} 
            label="Total Produk" 
            value={stats.totalProduk} 
            bg="#ECFDF5" 
          />
          <StatCard 
            icon={<FileText size={22} color="#D97706" />} 
            label="Total Berita" 
            value={stats.totalBerita} 
            bg="#FFFBEB" 
          />
          <StatCard 
            icon={<BarChart2 size={22} color="#7C3AED" />} 
            label="Top Kategori" 
            value="Elektronik" 
            bg="#F5F3FF" 
          />
        </View>

        {/* Order Status */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Status Pesanan</Text>
          <TouchableOpacity onPress={loadStats} style={styles.refreshButton}>
            <RefreshCw size={16} color="#6366F1" />
          </TouchableOpacity>
        </View>

        <View style={styles.statusCardContainer}>
          {renderOrderStatusBar()}
          <View style={styles.statusLegendContainer}>
            <View style={styles.statusLegendItem}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusText}>Disetujui ({stats.approvedOrders})</Text>
            </View>
            <View style={styles.statusLegendItem}>
              <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.statusText}>Diproses ({stats.processingOrders})</Text>
            </View>
            <View style={styles.statusLegendItem}>
              <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.statusText}>Pending ({stats.pendingOrders})</Text>
            </View>
            <View style={styles.statusLegendItem}>
              <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.statusText}>Ditolak ({stats.cancelledOrders})</Text>
            </View>
          </View>
        </View>

        {/* Menu Admin */}
        <Text style={styles.sectionTitle}>Menu Admin</Text>
        <View style={styles.menuContainer}>
          <MenuItem
            title="Kelola Pengguna"
            description="Lihat dan kelola data pengguna"
            icon={<Users size={22} color="#FFFFFF" />}
            iconBg="#6366F1"
            onPress={() => router.push('/admin/users')}
          />
          <MenuItem
            title="Kelola Pesanan"
            description="Monitor dan update status pesanan"
            icon={<ShoppingBag size={22} color="#FFFFFF" />}
            iconBg="#10B981"
            onPress={() => router.push('/admin/orders')}
          />
          <MenuItem
            title="Kelola Produk"
            description="Tambah, edit, atau hapus produk"
            icon={<Database size={22} color="#FFFFFF" />}
            iconBg="#F59E0B"
            onPress={() => router.push('/admin/produk')}
          />
          <MenuItem
            title="Kelola Berita"
            description="Kelola artikel dan berita"
            icon={<FileText size={22} color="#FFFFFF" />}
            iconBg="#EC4899"
            onPress={() => router.push('/admin/berita')}
          />
          <MenuItem
            title="Data Master"
            description="Kelola kategori dan data dasar"
            icon={<TrendingUp size={22} color="#FFFFFF" />}
            iconBg="#7C3AED"
            onPress={() => router.push('/admin/data_master')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ icon, label, value, bg }) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <View style={styles.statIconContainer}>{icon}</View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuItem = ({ title, description, icon, iconBg, onPress }) => (
  <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.menuContent}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
    </View>
    <ArrowRight size={18} color="#6B7280" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB', 
    paddingHorizontal: 16 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB' 
  },
  loadingText: { 
    marginTop: 16, 
    fontFamily: 'Inter_500Medium', 
    color: '#6B7280',
    fontSize: 15
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 24 
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  notificationButton: {
    backgroundColor: '#F3F4F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  greeting: { 
    fontSize: 14, 
    fontFamily: 'Inter_500Medium', 
    color: '#6B7280' 
  },
  title: { 
    fontSize: 24, 
    fontFamily: 'Poppins_600SemiBold', 
    color: '#111827', 
    marginTop: 4 
  },
  logoutButton: { 
    backgroundColor: '#6366F1', 
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280'
  },
  quickStatsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center'
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6
  },
  quickStatValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold'
  },
  quickStatDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(255,255,255,0.3)'
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontFamily: 'Poppins_600SemiBold', 
    color: '#1F2937', 
    marginBottom: 16 
  },
  refreshButton: { 
    backgroundColor: '#EEF2FF', 
    padding: 8, 
    borderRadius: 20 
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    rowGap: 16,
    marginBottom: 24
  },
  statCard: { 
    width: '48%', 
    borderRadius: 16, 
    padding: 16,
    paddingVertical: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3
  },
  statIconContainer: { 
    backgroundColor: 'rgba(255,255,255,0.7)', 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  statValue: { 
    fontSize: 24, 
    fontFamily: 'Poppins_600SemiBold', 
    color: '#111827', 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 13, 
    fontFamily: 'Inter_500Medium', 
    color: '#6B7280' 
  },
  statusCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3
  },
  progressBarContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    overflow: 'hidden'
  },
  progressSegment: {
    height: '100%'
  },
  statusLegendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 16
  },
  statusLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#4B5563'
  },
  menuContainer: { 
    marginBottom: 32, 
    gap: 12
  },
  menuCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3
  },
  menuContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14 
  },
  menuIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  menuText: { 
    flex: 1 
  },
  menuTitle: { 
    fontSize: 16, 
    fontFamily: 'Poppins_600SemiBold', 
    color: '#111827', 
    marginBottom: 2 
  },
  menuDescription: { 
    fontSize: 13, 
    fontFamily: 'Inter_400Regular', 
    color: '#6B7280' 
  },
});