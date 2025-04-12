import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, AntDesign, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form and payment related state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    notes: '',
    contactNumber: '',
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    { id: 'qris', name: 'QRIS', icon: 'qrcode', color: '#9333EA' },
    { id: 'bca', name: 'BCA Transfer', icon: 'bank', color: '#1E40AF' },
    { id: 'gopay', name: 'GoPay', icon: 'money-bill-wave', color: '#00AA13' },
    { id: 'ovo', name: 'OVO', icon: 'wallet', color: '#4F46E5' },
    { id: 'dana', name: 'DANA', icon: 'credit-card', color: '#0284C7' }
  ];

  const serviceCategories = [
    { id: 'game', name: 'Game', icon: 'gamepad', color: '#7C3AED' },
    { id: 'tugas', name: 'Tugas', icon: 'book-open', color: '#10B981' },
    { id: 'design', name: 'Design', icon: 'palette', color: '#EC4899' },
    { id: 'coding', name: 'Coding', icon: 'code', color: '#F59E0B' },
  ];

  const fetchData = async () => {
    try {
      const userQuery = query(collection(db, 'users'), where('uid', '==', auth.currentUser?.uid));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) setUser(userSnapshot.docs[0].data());

      const prodQuery = query(collection(db, 'products'), where('isActive', '==', true));
      const promoQuery = query(
        collection(db, 'promotions'),
        where('isActive', '==', true),
        where('validUntil', '>=', new Date())
      );
      const newsQuery = query(collection(db, 'news'));

      const [prodSnap, promoSnap, newsSnap] = await Promise.all([
        getDocs(prodQuery),
        getDocs(promoQuery),
        getDocs(newsQuery),
      ]);

      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setPromotions(promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setNews(newsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Gagal memuat data. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), where('isActive', '==', true)),
      snap => setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    const unsubPromotions = onSnapshot(
      query(collection(db, 'promotions'), where('isActive', '==', true), where('validUntil', '>=', new Date())),
      snap => setPromotions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    const unsubNews = onSnapshot(collection(db, 'news'), snap => {
      setNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    fetchData();

    return () => {
      unsubProducts();
      unsubPromotions();
      unsubNews();
    };
  }, []);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchData();
  };

  const handleProductPress = (product) => {
    Haptics.selectionAsync();
    setSelectedProduct(product);
    setFormVisible(true);
    // Reset form data when selecting a new product
    setFormData({
      username: '',
      password: '',
      notes: '',
      contactNumber: '',
    });
    setSelectedPaymentMethod(null);
  };

  const handleFormSubmit = () => {
    if (!formData.username || !formData.contactNumber) {
      Alert.alert('Form tidak lengkap', 'Mohon isi username dan nomor kontak.');
      return;
    }
    
    setFormVisible(false);
    setPaymentVisible(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Pilih metode pembayaran', 'Silakan pilih salah satu metode pembayaran.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const timestamp = new Date().getTime();
      const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const newOrderNumber = `JK-${timestamp}-${randomDigits}`;
      setOrderNumber(newOrderNumber);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to Firestore
      await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser?.uid,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        orderDetails: formData,
        paymentMethod: selectedPaymentMethod,
        status: 'pending',
        orderNumber: newOrderNumber,
        createdAt: serverTimestamp(),
        amount: selectedProduct.price,
        customerName: user?.name || '',
        customerEmail: user?.email || ''
      });
      
      setPaymentVisible(false);
      setConfirmationVisible(true);
      setIsProcessing(false);
      
    } catch (error) {
      console.error("Order placement error:", error);
      Alert.alert('Error', 'Terjadi kesalahan saat memproses pesanan Anda.');
      setIsProcessing(false);
    }
  };

  const closeAllModals = () => {
    setFormVisible(false);
    setPaymentVisible(false);
    setConfirmationVisible(false);
    setSelectedProduct(null);
    setSelectedPaymentMethod(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#4F46E5"
            colors={['#4F46E5']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <Animated.View entering={FadeIn.duration(800)}>
          <LinearGradient 
            colors={['#4F46E5', '#6366F1']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            
            <View style={styles.headerContent}>
              <Animated.View entering={SlideInLeft.duration(500)}>
                <TouchableOpacity onPress={() => router.push('/profile')}>
                  <Image
                    source={user?.photoURL ? { uri: user.photoURL } : require('../../../assets/images/avatar-default.png')}
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
              </Animated.View>
              
              <View style={styles.headerText}>
                <Animated.Text entering={SlideInRight.delay(100).duration(500)} style={styles.greeting}>
                  Selamat datang
                </Animated.Text>
                <Animated.Text entering={SlideInRight.delay(150).duration(500)} style={styles.username}>
                  {user?.name || user?.email || 'Pengguna'}
                </Animated.Text>
              </View>
              
              <Animated.View entering={SlideInRight.delay(200).duration(500)} style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.notificationIcon}
                  onPress={() => router.push('/notifications')}
                >
                  <Ionicons name="notifications-outline" size={24} color="white" />
                  <View style={styles.notificationBadge} />
                </TouchableOpacity>
              </Animated.View>
            </View>
            
          </LinearGradient>
        </Animated.View>

        {/* Promotions Carousel */}
        {promotions.length > 0 && (
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons name="local-offer" size={20} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Promo Spesial</Text>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/promotions');
                }}
              >
                <Text style={styles.seeAll}>Lihat Semua</Text>
                <AntDesign name="right" size={14} color="#4F46E5" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.promotionsContainer}
              decelerationRate="fast"
              snapToInterval={width * 0.85 + 16}
            >
              {promotions.map((promo, index) => (
                <Animated.View 
                  key={promo.id}
                  entering={SlideInRight.delay(100 + index * 100).duration(500)}
                >
                  <TouchableOpacity 
                    style={styles.promoCard}
                    activeOpacity={0.9}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(`/promotion/${promo.id}`);
                    }}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#4F46E5']}
                      style={styles.promoGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.promoBadge}>
                        <Text style={styles.promoBadgeText}>{promo.discountPercentage}% OFF</Text>
                      </View>
                      <Text style={styles.promoTitle}>{promo.title}</Text>
                      <Text style={styles.promoDescription}>{promo.description}</Text>
                      <View style={styles.promoFooter}>
                        <Text style={styles.promoValidText}>
                          Berlaku hingga {new Date(promo.validUntil?.seconds * 1000).toLocaleDateString('id-ID')}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Popular Services Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="star" size={20} color="#4F46E5" />
              <Text style={styles.sectionTitle}>Layanan Populer</Text>
            </View>
          </View>
          
          {products.length > 0 ? (
            <View style={styles.serviceGrid}>
              {products.slice(0, 4).map((product, index) => (
                <Animated.View 
                  key={product.id}
                  entering={FadeInDown.delay(100 + index * 100).duration(500)}
                  style={styles.serviceGridItem}
                >
                  <TouchableOpacity 
                    style={styles.serviceCard}
                    activeOpacity={0.9}
                    onPress={() => handleProductPress(product)}
                  >
                    <Image 
                      source={{ uri: product.imageUrl }} 
                      style={styles.serviceImage} 
                      resizeMode="cover"
                    />
                    <View style={styles.serviceContent}>
                      <View style={styles.serviceHeader}>
                        <Text style={styles.serviceName} numberOfLines={1}>{product.name}</Text>
                        <View style={styles.serviceRating}>
                          <AntDesign name="star" size={12} color="#F59E0B" />
                          <Text style={styles.ratingText}>{product.rating || 4.5}</Text>
                        </View>
                      </View>
                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {product.description || "Layanan joki profesional dengan jaminan kepuasan."}
                      </Text>
                      <View style={styles.serviceFooter}>
                        <Text style={styles.servicePrice}>Rp {product.price.toLocaleString('id-ID')}</Text>
                        <View style={styles.orderButton}>
                          <Text style={styles.orderButtonText}>Pesan</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
              <MaterialIcons name="error-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>Tidak ada layanan tersedia saat ini</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* News Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Feather name="book-open" size={20} color="#4F46E5" />
              <Text style={styles.sectionTitle}>Berita Terkini</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/news');
              }}
            >
              <Text style={styles.seeAll}>Lihat Semua</Text>
              <AntDesign name="right" size={14} color="#4F46E5" />
            </TouchableOpacity>
          </View>
          
          {news.length > 0 ? (
            <View style={styles.newsContainer}>
              {news.slice(0, 3).map((item, index) => (
                <Animated.View 
                  key={item.id}
                  entering={SlideInRight.delay(100 + index * 100).duration(500)}
                >
                  <TouchableOpacity 
                    style={styles.newsCard}
                    activeOpacity={0.9}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(`/news/${item.id}`);
                    }}
                  >
                    <Image 
                      source={{ uri: item.imageUrl }} 
                      style={styles.newsImage} 
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.newsImageOverlay}
                    />
                    <View style={styles.newsContent}>
                      <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                      <View style={styles.newsFooter}>
                        <Text style={styles.newsDate}>
                          {item.createdAt?.seconds ? 
                            new Date(item.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            }) : ''}
                        </Text>
                        <View style={styles.readMore}>
                          <Text style={styles.readMoreText}>Baca Selengkapnya</Text>
                          <AntDesign name="arrowright" size={14} color="#4F46E5" />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
              <Feather name="book-open" size={32} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>Tidak ada berita terbaru</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Service Order Form Modal */}
      <Modal
        visible={formVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setFormVisible(false)}
          />
          <Animated.View 
            style={styles.modalContent}
            entering={SlideInRight.duration(400)}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Form Pemesanan</Text>
              <TouchableOpacity 
                onPress={() => setFormVisible(false)}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedProduct && (
              <View style={styles.selectedServiceInfo}>
                <Image 
                  source={{ uri: selectedProduct.imageUrl }} 
                  style={styles.selectedServiceImage} 
                />
                <View style={styles.selectedServiceDetails}>
                  <Text style={styles.selectedServiceName}>{selectedProduct.name}</Text>
                  <Text style={styles.selectedServicePrice}>
                    Rp {selectedProduct.price.toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>
            )}
            
            <ScrollView style={styles.formContainer}>
              <Text style={styles.formLabel}>Masukkan nama Lengkap*</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nama Lengkap"
                placeholderTextColor="#9CA3AF"
                value={formData.username}
                onChangeText={(text) => setFormData({...formData, username: text})}
              />
              
              <Text style={styles.formLabel}>Jenis Tugas</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Masukkan Jenis Tugas"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
              />
              
              <Text style={styles.formLabel}>Nomor WhatsApp *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Masukkan nomor WhatsApp"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={formData.contactNumber}
                onChangeText={(text) => setFormData({...formData, contactNumber: text})}
              />
              
              <Text style={styles.formLabel}>Catatan Tambahan</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder="Masukkan catatan tambahan jika ada"
                placeholderTextColor="#9CA3AF"
                multiline={true}
                numberOfLines={4}
                value={formData.notes}
                onChangeText={(text) => setFormData({...formData, notes: text})}
              />
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleFormSubmit}
              >
                <Text style={styles.submitButtonText}>Lanjut ke Pembayaran</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Payment Method Selection Modal */}
      <Modal
        visible={paymentVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setPaymentVisible(false)}
          />
          <Animated.View 
            style={styles.modalContent}
            entering={SlideInRight.duration(400)}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Metode Pembayaran</Text>
              <TouchableOpacity 
                onPress={() => setPaymentVisible(false)}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedProduct && (
              <View style={styles.paymentSummary}>
                <Text style={styles.paymentSummaryTitle}>Ringkasan Pesanan</Text>
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>Layanan</Text>
                  <Text style={styles.paymentSummaryValue}>{selectedProduct.name}</Text>
                </View>
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>Username</Text>
                  <Text style={styles.paymentSummaryValue}>{formData.username}</Text>
                </View>
                <View style={styles.paymentSummaryDivider} />
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>Harga</Text>
                  <Text style={styles.paymentSummaryValue}>
                    Rp {selectedProduct.price.toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>Biaya Admin</Text>
                  <Text style={styles.paymentSummaryValue}>Rp 0</Text>
                </View>
                <View style={styles.paymentSummaryTotal}>
                  <Text style={styles.paymentSummaryTotalLabel}>Total Pembayaran</Text>
                  <Text style={styles.paymentSummaryTotalValue}>
                    Rp {selectedProduct.price.toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>
            )}
            
            <Text style={styles.paymentMethodTitle}>Metode Pembayaran</Text>
            <ScrollView style={styles.paymentMethodList}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodItem,
                    selectedPaymentMethod === method.id && styles.paymentMethodItemSelected
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedPaymentMethod(method.id);
                  }}
                >
                  <LinearGradient
                    colors={[method.color, lightenColor(method.color, 20)]}
                    style={styles.paymentMethodIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <FontAwesome5 name={method.icon} size={20} color="white" />
                  </LinearGradient>
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                  {selectedPaymentMethod === method.id && (
                    <MaterialIcons name="check-circle" size={24} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedPaymentMethod || isProcessing) && styles.submitButtonDisabled
              ]}
              onPress={handlePaymentSubmit}
              disabled={!selectedPaymentMethod || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Bayar Sekarang</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Order Confirmation Modal */}
      <Modal
        visible={confirmationVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAllModals}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeAllModals}
          />
          <Animated.View 
            style={styles.confirmationModalContent}
            entering={SlideInRight.duration(400)}
          >
            <View style={styles.successIcon}>
              <MaterialCommunityIcons name="check-circle-outline" size={80} color="#10B981" />
            </View>
            
            <Text style={styles.confirmationTitle}>Pembayaran Berhasil</Text>
            <Text style={styles.confirmationMessage}>
              Pesanan Anda telah berhasil dibuat dan sedang diproses. Silakan pantau status pesanan Anda.
            </Text>
            
            <View style={styles.orderDetailsContainer}>
              <Text style={styles.orderDetailsLabel}>Nomor Pesanan:</Text>
              <Text style={styles.orderDetailsValue}>{orderNumber}</Text>
              
              <Text style={styles.orderDetailsLabel}>Layanan:</Text>
              <Text style={styles.orderDetailsValue}>{selectedProduct?.name}</Text>
              
              <Text style={styles.orderDetailsLabel}>Total Pembayaran:</Text>
              <Text style={styles.orderDetailsValue}>
                Rp {selectedProduct?.price.toLocaleString('id-ID')}
              </Text>
              
              <Text style={styles.orderDetailsLabel}>Status:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Sedang Diproses</Text>
              </View>
            </View>
            
            <View style={styles.confirmationActions}>
              <TouchableOpacity 
                style={styles.trackOrderButton}
                onPress={() => {
                  closeAllModals();
                  router.push('/orders');
                }}
              >
                <Text style={styles.trackOrderButtonText}>Pantau Pesanan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeAllModals}
              >
                <Text style={styles.closeButtonText}>Kembali ke Beranda</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

// Helper function to lighten colors
const lightenColor = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)}`;
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
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerText: {
    flex: 1,
    marginLeft: 16,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_400Regular',
  },
  username: {
    fontSize: 20,
    color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC4899',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAll: {
    fontSize: 14,
    color: '#4F46E5',
    fontFamily: 'Inter_500Medium',
    marginRight: 4,
  },
  promotionsContainer: {
    paddingLeft: 24,
    paddingRight: 8,
    paddingBottom: 8,
  },
  promoCard: {
    width: width * 0.85,
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  promoGradient: {
    padding: 20,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  promoBadge: {
    backgroundColor: '#EC4899',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  promoBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  promoTitle: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  promoDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  promoFooter: {
    marginTop: 12,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
  },
  promoValidText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_400Regular',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  serviceGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  serviceImage: {
    width: '100%',
    height: 120,
  },
  serviceContent: {
    padding: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#1F2937',
    flex: 1,
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#D97706',
    marginLeft: 2,
  },
  serviceDescription: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#10B981',
  },
  orderButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 24,
    marginVertical: 8,
    elevation: 1,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  newsContainer: {
    paddingHorizontal: 24,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  newsImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    color: '#7C3AED',
    fontFamily: 'Inter_500Medium',
    marginRight: 4,
  },
  footerSpace: {
    height: 100,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  
  // Form Modal Styles
  selectedServiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedServiceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  selectedServiceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  selectedServiceName: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#1F2937',
  },
  selectedServicePrice: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#10B981',
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1F2937',
    marginBottom: 16,
  },
  formTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  
  // Payment Modal Styles
  paymentSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentSummaryTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },
  paymentSummaryValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1F2937',
  },
  paymentSummaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  paymentSummaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paymentSummaryTotalLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
  },
  paymentSummaryTotalValue: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#7C3AED',
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  paymentMethodList: {
    maxHeight: 240,
    marginBottom: 16,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentMethodItemSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3F4F6',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1F2937',
  },
  
  // Confirmation Modal Styles
  confirmationModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  confirmationMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  orderDetailsContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  orderDetailsLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  orderDetailsValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#059669',
  },
  confirmationActions: {
    width: '100%',
  },
  trackOrderButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  trackOrderButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  closeButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  submitButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;