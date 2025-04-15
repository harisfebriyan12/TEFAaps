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
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [expandedNewsId, setExpandedNewsId] = useState(null);
  
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

  const getPaymentIcon = (type) => {
    switch(type) {
      case 'qris': return 'qrcode';
      case 'bank': return 'building';
      case 'bca': return 'university';
      case 'mandiri': return 'university';
      case 'gopay': return 'money-bill-wave';
      case 'ovo': return 'wallet';
      case 'dana': return 'credit-card';
      case 'shopeepay': return 'shopping-bag';
      default: return 'credit-card';
    }
  };

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
      const paymentsQuery = query(collection(db, 'payments'));

      const [prodSnap, promoSnap, newsSnap, paymentsSnap] = await Promise.all([
        getDocs(prodQuery),
        getDocs(promoQuery),
        getDocs(newsQuery),
        getDocs(paymentsQuery),
      ]);

      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setPromotions(promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setNews(newsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      // Process payment methods from Firebase
      const fetchedPaymentMethods = paymentsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.namabank || data.name || '',
          accountNumber: data.nomorakun || '',
          accountHolder: data.pemegangAkun || '',
          description: data.keterangan || '',
          type: data.namabank?.toLowerCase() || 'bank',
          color: getPaymentMethodColor(data.namabank?.toLowerCase() || 'bank'),
          imageUrl: data.imageUrl || null,
          createdAt: data.dibuatPada || null
        };
      });
      
      // If no payment methods found in Firebase, use default ones
      if (fetchedPaymentMethods.length === 0) {
        setPaymentMethods([
          { id: 'mandiri', name: 'BANK MANDIRI', accountNumber: '370273', accountHolder: 'HARIS FEBRIYAN', type: 'Mandiri', color: '#1E40AF' },
          { id: 'gopay', name: 'GoPay',accountNumber: '30589477', accountHolder: 'HARIS FEBRIYAN', type: 'Gopay',  color: '#00AA13' },
          { id: 'ovo', name: 'OVO', accountNumber: '081574623847', accountHolder: 'HARIS FEBRIYAN', type: 'Ovo', color: '#4F46E5' },
          { id: 'dana', name: 'DANA',accountNumber: '0347305373', accountHolder: 'HARIS FEBRIYAN', type: 'Dana ',  color: '#0284C7' }
        ]);
      } else {
        setPaymentMethods(fetchedPaymentMethods);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Gagal memuat data. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  function getGreeting() {
    let hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }
  
  // Function to determine payment method color based on type
  const getPaymentMethodColor = (type) => {
    switch(type) {
      case 'qris': return '#9333EA';
      case 'mandiri': return '#1E40AF';
      case 'bca': return '#1E40AF';
      case 'bank': return '#1E40AF';
      case 'gopay': return '#00AA13';
      case 'ovo': return '#4F46E5';
      case 'dana': return '#0284C7';
      case 'shopeepay': return '#EA4335';
      default: return '#4F46E5';
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
    
    // Listen for payment methods updates
    const unsubPayments = onSnapshot(collection(db, 'payments'), snap => {
      const fetchedPaymentMethods = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.namabank || data.name || '',
          accountNumber: data.nomorakun || '',
          accountHolder: data.pemegangAkun || '',
          description: data.keterangan || '',
          type: data.namabank?.toLowerCase() || 'bank',
          color: getPaymentMethodColor(data.namabank?.toLowerCase() || 'bank'),
          imageUrl: data.imageUrl || null,
          createdAt: data.dibuatPada || null
        };
      });
      
      if (fetchedPaymentMethods.length > 0) {
        setPaymentMethods(fetchedPaymentMethods);
      }
    });

    fetchData();

    return () => {
      unsubProducts();
      unsubPromotions();
      unsubNews();
      unsubPayments();
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
      
      // Find the selected payment method details
      const selectedPaymentDetails = paymentMethods.find(p => p.id === selectedPaymentMethod);
      
      // Save to Firestore
      await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser?.uid,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        orderDetails: formData,
        paymentMethod: selectedPaymentDetails?.name || selectedPaymentMethod,
        paymentMethodId: selectedPaymentMethod,
        paymentAccountNumber: selectedPaymentDetails?.accountNumber || '',
        paymentAccountHolder: selectedPaymentDetails?.accountHolder || '',
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
    <Animated.Text
      entering={SlideInRight.delay(100).duration(500)}
      style={styles.greeting}
    >
      {getGreeting()}, selamat datang di
    </Animated.Text>
    <Animated.Text
      entering={SlideInRight.delay(150).duration(500)}
      style={styles.username}
    >
      {user?.name || user?.name || 'TEFA APLIKASI'}
    </Animated.Text>
  </View>
              
              <Animated.View entering={SlideInRight.delay(200).duration(500)} style={styles.headerActions}>
                <TouchableOpacity 
                  onPress={() => router.push('/notifications')}
                >
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

        {/* News Section - Fixed version */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="article" size={20} color="#4F46E5" />
              <Text style={styles.sectionTitle}>Berita Terbaru</Text>
            </View>
          </View>

          {news.slice(0, 3).map((item, index) => {
            const isExpanded = expandedNewsId === item.id;
            
            return (
              <Animated.View 
                key={item.id}
                entering={SlideInRight.delay(100 + index * 100).duration(500)}
              >
                <TouchableOpacity 
                  style={styles.newsCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setExpandedNewsId(isExpanded ? null : item.id);
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
                    <Text style={styles.newsTitle}>{item.title}</Text>
                    <Text
                      numberOfLines={isExpanded ? undefined : 2}
                      style={styles.newsDescription}
                    >
                      {item.description}
                    </Text>
                    <Text style={styles.readMoreText}>
                      {isExpanded ? 'Sembunyikan' : 'Baca Selengkapnya'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
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
                  {method.imageUrl ? (
                    <Image 
                      source={{ uri: method.imageUrl }} 
                      style={styles.paymentMethodImage} 
                      resizeMode="contain"
                    />
                  ) : (
                    <LinearGradient
                      colors={[method.color, lightenColor(method.color, 20)]}
                      style={styles.paymentMethodIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <FontAwesome5 
                        name={getPaymentIcon(method.type)} 
                        size={20} 
                        color="white" 
                      />
                    </LinearGradient>
                  )}
                  <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodName}>{method.name}</Text>
                    {method.accountNumber && (
                      <Text style={styles.paymentMethodNumber}>
                        {method.accountNumber} a.n {method.accountHolder}
                      </Text>
                    )}
                    {method.description && (
                      <Text style={styles.paymentMethodDescription}>{method.description}</Text>
                    )}
                  </View>
                  <View style={styles.paymentMethodRadio}>
                    {selectedPaymentMethod === method.id ? (
                      <Ionicons name="radio-button-on" size={24} color="#4F46E5" />
                    ) : (
                      <Ionicons name="radio-button-off" size={24} color="#9CA3AF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.paymentButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentSubmitButton,
                  !selectedPaymentMethod && styles.paymentSubmitButtonDisabled
                ]}
                onPress={handlePaymentSubmit}
                disabled={!selectedPaymentMethod || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.paymentSubmitButtonText}>Bayar Sekarang</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Order Confirmation Modal */}
      <Modal
        visible={confirmationVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeAllModals}
      >
        <View style={styles.confirmationOverlay}>
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          <Animated.View 
            style={styles.confirmationContent}
            entering={FadeIn.duration(400)}
          >
            <View style={styles.confirmationHeader}>
              <View style={styles.confirmationIcon}>
                <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
              </View>
              <Text style={styles.confirmationTitle}>Pesanan Berhasil!</Text>
              <Text style={styles.confirmationSubtitle}>
                Pesanan Anda telah berhasil dibuat dan sedang diproses.
              </Text>
            </View>
            
            <View style={styles.confirmationDetails}>
              <View style={styles.confirmationRow}>
                <Text style={styles.confirmationLabel}>Nomor Pesanan:</Text>
                <Text style={styles.confirmationValue}>{orderNumber}</Text>
              </View>
              <View style={styles.confirmationRow}>
                <Text style={styles.confirmationLabel}>Layanan:</Text>
                <Text style={styles.confirmationValue}>{selectedProduct?.name}</Text>
              </View>
              <View style={styles.confirmationRow}>
                <Text style={styles.confirmationLabel}>Total Pembayaran:</Text>
                <Text style={styles.confirmationValue}>
                  Rp {selectedProduct?.price.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.confirmationRow}>
                <Text style={styles.confirmationLabel}>Metode Pembayaran:</Text>
                <Text style={styles.confirmationValue}>
                  {paymentMethods.find(p => p.id === selectedPaymentMethod)?.name || selectedPaymentMethod}
                </Text>
              </View>
            </View>
            
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.confirmationButtonSecondary}
                onPress={closeAllModals}
              >
                <Text style={styles.confirmationButtonSecondaryText}>Kembali ke Beranda</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmationButtonPrimary}
                onPress={() => {
                  closeAllModals();
                  router.push('/orders');
                }}
              >
                <Text style={styles.confirmationButtonPrimaryText}>Lihat Pesanan</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
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
    fontSize: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerText: {
    flex: 1,
    marginLeft: 16,
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  username: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAll: {
    fontSize: 14,
    color: '#4F46E5',
    marginRight: 4,
  },
  promotionsContainer: {
    paddingBottom: 8,
  },
  promoCard: {
    width: width * 0.85,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  promoGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promoBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  promoTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  promoDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  promoFooter: {
    marginTop: 12,
  },
  promoValidText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  serviceImage: {
    width: '100%',
    height: 100,
  },
  serviceContent: {
    padding: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 16,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  orderButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  newsContainer: {
    marginTop: 8,
  },
  newsCard: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  newsImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  newsContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  newsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  footerSpace: {
    height: 80,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  selectedServiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedServiceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  selectedServiceDetails: {
    marginLeft: 12,
  },
  selectedServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  selectedServicePrice: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '700',
    marginTop: 4,
  },
  formContainer: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#111827',
  },
  formTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentSummary: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  paymentSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentSummaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
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
    color: '#111827',
    fontWeight: '600',
  },
  paymentSummaryTotalValue: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '700',
  },
  paymentMethodList: {
    padding: 20,
    maxHeight: 300,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentMethodItemSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  paymentMethodNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  paymentMethodRadio: {
    marginLeft: 8,
  },
  paymentButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentSubmitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  paymentSubmitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  paymentSubmitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '90%',
    padding: 24,
    elevation: 5,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmationIcon: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  confirmationDetails: {
    marginBottom: 24,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  confirmationValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmationButtonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  confirmationButtonSecondaryText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationButtonPrimary: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmationButtonPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;