import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { 
  collection, 
  getDocs, 
  query, 
  onSnapshot, 
  orderBy, 
  limit,
  doc,
  getDoc,
  collectionGroup
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
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
  CreditCard,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width - 32; // Account for padding

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    approvedOrders: 0,
    processingOrders: 0,
    totalProduk: 0,
    totalBerita: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [monthlyData, setMonthlyData] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [{ data: [0, 0, 0, 0, 0, 0] }]
  });
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('Admin');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // Get admin name from Firebase auth
    const getCurrentAdmin = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setName(currentUser.name || 'Admin');
      }
    };
    
    getCurrentAdmin();
    loadStats(); // Initial data load
    setupRealtimeListeners();
    
    return () => {
      // Clean up listeners when component unmounts
      unsubscribeFromFirestore();
    };
  }, []);

  // Collection listeners
  let unsubscribeUsers = null;
  let unsubscribeOrders = null;
  let unsubscribeProducts = null;
  let unsubscribeBerita = null;
  let unsubscribeNotifications = null;

  const unsubscribeFromFirestore = () => {
    if (unsubscribeUsers) unsubscribeUsers();
    if (unsubscribeOrders) unsubscribeOrders();
    if (unsubscribeProducts) unsubscribeProducts();
    if (unsubscribeBerita) unsubscribeBerita();
    if (unsubscribeNotifications) unsubscribeNotifications();
  };

  // Initial data load with error handling
  const loadStats = async () => {
    try {
      setLoading(true);
      console.log("Loading initial stats...");
      
      // Load users data
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        setStats(prevStats => ({ ...prevStats, totalUsers: usersSnapshot.size }));
        console.log(`Loaded ${usersSnapshot.size} users`);
      } catch (error) {
        console.error("Error loading users:", error);
      }
      
      // Load products data
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        setStats(prevStats => ({ ...prevStats, totalProduk: productsSnapshot.size }));
        console.log(`Loaded ${productsSnapshot.size} products`);
        
        // Process category data
        const categories = {};
        productsSnapshot.docs.forEach(doc => {
          const product = doc.data();
          const category = product.category || 'Uncategorized';
          categories[category] = (categories[category] || 0) + 1;
        });
        
        // Format for pie chart
        const pieData = Object.keys(categories).map((key, index) => {
          const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
          return {
            name: key,
            population: categories[key],
            color: colors[index % colors.length],
            legendFontColor: '#7F7F7F',
            legendFontSize: 12
          };
        });
        
        setCategoryData(pieData);
      } catch (error) {
        console.error("Error loading products:", error);
      }
      
      // Load news/berita data with proper error handling
      try {
        // Try first with collection reference
        const beritaRef = collection(db, 'news');
        const beritaSnapshot = await getDocs(beritaRef);
        
        if (beritaSnapshot.empty) {
          // If collection is empty, try alternative collection name 'berita'
          const altBeritaRef = collection(db, 'berita');
          const altBeritaSnapshot = await getDocs(altBeritaRef);
          setStats(prevStats => ({ ...prevStats, totalBerita: altBeritaSnapshot.size }));
          console.log(`Loaded ${altBeritaSnapshot.size} berita (alternative collection)`);
        } else {
          setStats(prevStats => ({ ...prevStats, totalBerita: beritaSnapshot.size }));
          console.log(`Loaded ${beritaSnapshot.size} news`);
        }
      } catch (error) {
        console.error("Error loading news/berita:", error);
        // Set to 0 if both attempts fail
        setStats(prevStats => ({ ...prevStats, totalBerita: 0 }));
      }
      
      // Load orders data with enhanced error handling
      try {
        const ordersRef = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersRef);
        
        if (ordersSnapshot.empty) {
          console.log("Orders collection is empty or doesn't exist");
          setStats(prevStats => ({ 
            ...prevStats, 
            totalOrders: 0,
            pendingOrders: 0,
            processingOrders: 0,
            approvedOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0
          }));
        } else {
          const orders = [];
          let totalRevenue = 0;
          let approvedCount = 0;
          let pendingCount = 0;
          let processingCount = 0;
          let cancelledCount = 0;
          
          ordersSnapshot.forEach(doc => {
            const orderData = doc.data();
            orderData.id = doc.id;
            orders.push(orderData);
            
            // Count by status
            switch (orderData.status) {
              case 'approved':
                approvedCount++;
                // Calculate revenue (handle potential missing price) ONLY for approved orders
                if (orderData.price && !isNaN(parseFloat(orderData.price))) {
                  totalRevenue += parseFloat(orderData.price);
                } else if (orderData.totalPrice && !isNaN(parseFloat(orderData.totalPrice))) {
                  totalRevenue += parseFloat(orderData.totalPrice);
                } else if (orderData.amount && !isNaN(parseFloat(orderData.amount))) {
                  totalRevenue += parseFloat(orderData.amount);
                } else if (orderData.totalamount && !isNaN(parseFloat(orderData.totalamount))) {
                  totalRevenue += parseFloat(orderData.totalamount);
                }
                break;
              case 'pending':
                pendingCount++;
                break;
              case 'processing':
                processingCount++;
                break;
              case 'cancelled':
                cancelledCount++;
                break;
            }
          });
          
          console.log(`Loaded ${orders.length} orders with ${totalRevenue} revenue`);
          
          // Sort by date and get recent orders
          const recentOrdersList = orders
            .sort((a, b) => {
              const dateA = a.createdAt?.seconds || 0;
              const dateB = b.createdAt?.seconds || 0;
              return dateB - dateA;
            })
            .slice(0, 5);
            
          setRecentOrders(recentOrdersList);
          
          // Update stats
          setStats(prevStats => ({
            ...prevStats,
            totalOrders: orders.length,
            pendingOrders: pendingCount,
            processingOrders: processingCount,
            approvedOrders: approvedCount,
            cancelledOrders: cancelledCount,
            totalRevenue: totalRevenue
          }));
          
          // Update monthly data for line chart
          updateMonthlyData(orders);
        }
      } catch (error) {
        console.error("Error loading orders:", error);
        setStats(prevStats => ({ 
          ...prevStats, 
          totalOrders: 0,
          pendingOrders: 0,
          processingOrders: 0,
          approvedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeListeners = () => {
    // Listen for users changes
    try {
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const totalUsers = snapshot.size;
        setStats(prevStats => ({ ...prevStats, totalUsers }));
        console.log(`Realtime update: ${totalUsers} users`);
      }, (error) => {
        console.error("Error in users listener:", error);
      });
    } catch (error) {
      console.error("Failed to set up users listener:", error);
    }

    // Listen for products changes
    try {
      unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        const totalProduk = snapshot.size;
        setStats(prevStats => ({ ...prevStats, totalProduk }));
        console.log(`Realtime update: ${totalProduk} products`);
        
        // Process category data for pie chart
        const categories = {};
        snapshot.docs.forEach(doc => {
          const product = doc.data();
          const category = product.category || 'Uncategorized';
          if (categories[category]) {
            categories[category]++;
          } else {
            categories[category] = 1;
          }
        });
        
        // Convert to chart format
        const pieData = Object.keys(categories).map((key, index) => {
          // Color palette for chart
          const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
          return {
            name: key,
            population: categories[key],
            color: colors[index % colors.length],
            legendFontColor: '#7F7F7F',
            legendFontSize: 12
          };
        });
        
        setCategoryData(pieData);
      }, (error) => {
        console.error("Error in products listener:", error);
      });
    } catch (error) {
      console.error("Failed to set up products listener:", error);
    }

    // Listen for news/berita changes with fallback
    try {
      // Try primary collection name 'news'
      const newsRef = collection(db, 'news');
      unsubscribeBerita = onSnapshot(newsRef, (snapshot) => {
        if (snapshot.empty) {
          // If empty, try alternative collection name
          try {
            const altBeritaRef = collection(db, 'berita');
            onSnapshot(altBeritaRef, (altSnapshot) => {
              const totalBerita = altSnapshot.size;
              setStats(prevStats => ({ ...prevStats, totalBerita }));
              console.log(`Realtime update: ${totalBerita} berita (from alt collection)`);
            }, (error) => {
              console.error("Error in alt berita listener:", error);
            });
          } catch (innerError) {
            console.error("Failed to set up alternative berita listener:", innerError);
          }
        } else {
          const totalBerita = snapshot.size;
          setStats(prevStats => ({ ...prevStats, totalBerita }));
          console.log(`Realtime update: ${totalBerita} news`);
        }
      }, (error) => {
        console.error("Error in news listener:", error);
      });
    } catch (error) {
      console.error("Failed to set up news listener:", error);
    }

    // Listen for orders changes with enhanced error handling
    try {
      unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        if (snapshot.empty) {
          console.log("No orders data available in realtime listener");
          return;
        }
        
        const orders = [];
        let totalRevenue = 0;
        let approvedCount = 0;
        let pendingCount = 0;
        let processingCount = 0;
        let cancelledCount = 0;
        
        snapshot.docs.forEach(doc => {
          const orderData = doc.data();
          orderData.id = doc.id;
          orders.push(orderData);
          
          // Count by status
          switch (orderData.status) {
            case 'approved':
              approvedCount++;
              // Calculate revenue (handle potential missing price) ONLY for approved orders
              if (orderData.price && !isNaN(parseFloat(orderData.price))) {
                totalRevenue += parseFloat(orderData.price);
              } else if (orderData.totalPrice && !isNaN(parseFloat(orderData.totalPrice))) {
                totalRevenue += parseFloat(orderData.totalPrice);
              } else if (orderData.amount && !isNaN(parseFloat(orderData.amount))) {
                totalRevenue += parseFloat(orderData.amount);
              } else if (orderData.totalamount && !isNaN(parseFloat(orderData.totalamount))) {
                totalRevenue += parseFloat(orderData.totalamount);
              }
              break;
            case 'pending':
              pendingCount++;
              break;
            case 'processing':
              processingCount++;
              break;
            case 'cancelled':
              cancelledCount++;
              break;
          }
        });
        
        console.log(`Realtime update: ${orders.length} orders with ${totalRevenue} revenue`);
        
        // Sort by date and get recent orders
        const recentOrdersList = orders
          .sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          })
          .slice(0, 5);
          
        setRecentOrders(recentOrdersList);
        
        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          totalOrders: orders.length,
          pendingOrders: pendingCount,
          processingOrders: processingCount,
          approvedOrders: approvedCount,
          cancelledOrders: cancelledCount,
          totalRevenue: totalRevenue
        }));
        
        // Update monthly data for chart
        updateMonthlyData(orders);
      }, (error) => {
        console.error("Error in orders listener:", error);
      });
    } catch (error) {
      console.error("Failed to set up orders listener:", error);
    }
    
    // Listen for notifications
    try {
      unsubscribeNotifications = onSnapshot(
        query(collection(db, 'notifications'), 
          orderBy('createdAt', 'desc'), 
          limit(20)
        ), 
        (snapshot) => {
          const unread = snapshot.docs.filter(doc => !doc.data().read).length;
          setUnreadNotifications(unread);
        }, 
        (error) => {
          console.error("Error in notifications listener:", error);
        }
      );
    } catch (error) {
      console.error("Failed to set up notifications listener:", error);
    }
  };

  const updateMonthlyData = (orders) => {
    // Group orders by month
    const months = [0, 0, 0, 0, 0, 0];
    const currentMonth = new Date().getMonth();
    
    orders.forEach(order => {
      if (order.createdAt) {
        let orderDate;
        
        // Handle different timestamp formats
        if (order.createdAt.seconds) {
          // Firestore Timestamp object
          orderDate = new Date(order.createdAt.seconds * 1000);
        } else if (order.createdAt.toDate) {
          // Firestore Timestamp with toDate method
          orderDate = order.createdAt.toDate();
        } else if (typeof order.createdAt === 'string') {
          // ISO string or similar
          orderDate = new Date(order.createdAt);
        } else {
          // Skip if format can't be determined
          return;
        }
        
        const orderMonth = orderDate.getMonth();
        
        // Only count orders from the last 6 months
        const monthDiff = currentMonth - orderMonth;
        if (monthDiff >= 0 && monthDiff < 6) {
          months[5 - monthDiff] += 1;
        } else if (monthDiff < 0) {
          // Handle wrap-around for previous year
          const wrappedDiff = 12 - orderMonth + currentMonth;
          if (wrappedDiff < 6) {
            months[5 - wrappedDiff] += 1;
          }
        }
      }
    });
    
    // Get month names for the last 6 months
    const monthNames = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      monthNames.push(month.toLocaleString('default', { month: 'short' }));
    }
    
    setMonthlyData({
      labels: monthNames,
      datasets: [{ data: months }]
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.seconds) {
      // Firestore Timestamp object
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      // Firestore Timestamp with toDate method
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      // ISO string or similar
      date = new Date(timestamp);
    } else {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
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
        </LinearGradient>

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pesanan Terbaru</Text>
          <TouchableOpacity onPress={loadStats} style={styles.refreshButton}>
            <RefreshCw size={16} color="#6366F1" />
          </TouchableOpacity>
        </View>

        <View style={styles.recentOrdersContainer}>
          {recentOrders.length > 0 ? (
            recentOrders.map((order, index) => (
              <TouchableOpacity 
                key={order.id || order.orderNumber || index}
                style={styles.orderItem}
                >
                <View style={styles.orderItemLeft}>
                  <View style={[styles.orderStatusIndicator, {
                    backgroundColor: 
                      order.status === 'approved' ? '#10B981' :
                      order.status === 'processing' ? '#3B82F6' :
                      order.status === 'pending' ? '#F59E0B' : '#EF4444'
                  }]} />
                  <View>
                    <Text style={styles.orderItemTitle}>{order.productName?.slice(0, 18) || 'Order'}</Text>
                    <Text style={styles.orderItemSubtitle}>
                      {order.customerName || 'User'} · {formatDate(order.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderItemPrice}>
                  {formatCurrency(order.amount || order.totalamount || order.price || order.totalPrice || 0)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noOrdersContainer}>
              <Text style={styles.noOrdersText}>Tidak ada pesanan terbaru</Text>
            </View>
          )}
        </View>

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
            icon={<CreditCard size={22} color="#7C3AED" />} 
            label="Pesanan Selesai" 
            value={stats.approvedOrders} 
            bg="#F5F3FF" 
          />
        </View>

        {/* Monthly Order Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Tren Pesanan Bulanan</Text>
          <LineChart
            data={monthlyData}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#FFFFFF',
              }
            }}
            bezier
            style={styles.chart}
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
            title="Kelola Pengumuman"
            description="Tambah dan kelola pengumuman"
            icon={<Database size={22} color="#FFFFFF" />}
            iconBg="#F59E0B"
            onPress={() => router.push('/admin/pengumuman')}
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
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIconContainer, { backgroundColor: iconBg }]}>
      {icon}
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuDescription}>{description}</Text>
    </View>
    <ArrowRight size={18} color="#9CA3AF" />
  </TouchableOpacity>
);

// Styles for the component
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  quickStatsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  quickStatItem: {
    alignItems: 'flex-start',
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  quickStatNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  recentOrdersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderStatusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  orderItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  orderItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  noOrdersContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noOrdersText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  menuDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  statusLegendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
});