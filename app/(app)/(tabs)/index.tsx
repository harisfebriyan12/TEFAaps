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
    const lowerType = type.toLowerCase();
    switch(lowerType) {
      case 'qris': return 'qrcode';
      case 'bank': return 'university';
      case 'bca': return 'university';
      case 'mandiri': return 'university';
      case 'bri': return 'university';
      case 'bni': return 'university';
      case 'gopay': return 'mobile-alt';
      case 'ovo': return 'wallet';
      case 'dana': return 'wallet';
      case 'shopeepay': return 'shopping-bag';
      case 'linkaja': return 'external-link-alt';
      default: return 'credit-card';
    }
  };

  const getPaymentMethodColor = (type) => {
    const lowerType = type.toLowerCase();
    switch(lowerType) {
      case 'qris': return '#9333EA';
      case 'mandiri': return '#1E40AF';
      case 'bca': return '#1E3A8A';
      case 'bri': return '#1E3F20';
      case 'bni': return '#8B0000';
      case 'bank': return '#1E40AF';
      case 'gopay': return '#00AA13';
      case 'ovo': return '#4F46E5';
      case 'dana': return '#0284C7';
      case 'shopeepay': return '#EA4335';
      case 'linkaja': return '#F59E0B';
      default: return '#4F46E5';
    }
  };

  const getPaymentMethodName = (type) => {
    const lowerType = type.toLowerCase();
    switch(lowerType) {
      case 'mandiri': return 'Bank Mandiri';
      case 'bca': return 'Bank BCA';
      case 'bri': return 'Bank BRI';
      case 'bni': return 'Bank BNI';
      case 'gopay': return 'Gopay';
      case 'ovo': return 'OVO';
      case 'dana': return 'DANA';
      case 'shopeepay': return 'ShopeePay';
      case 'linkaja': return 'LinkAja';
      default: return type;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
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
      const paymentsQuery = query(collection(db, 'payments'), where('isActive', '==', true));

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
        const type = data.type?.toLowerCase() || 'bank';
        return {
          id: doc.id,
          name: getPaymentMethodName(data.type || data.name || 'Bank'),
          accountNumber: data.accountNumber || data.nomorRekening || '',
          accountHolder: data.accountHolder || data.pemilikRekening || '',
          description: data.description || data.keterangan || '',
          type: type,
          color: getPaymentMethodColor(type),
          createdAt: data.createdAt || null
        };
      });
      
      setPaymentMethods(fetchedPaymentMethods);
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
    const unsubPayments = onSnapshot(
      query(collection(db, 'payments'), where('isActive', '==', true)),
      snap => {
        const fetchedPaymentMethods = snap.docs.map(doc => {
          const data = doc.data();
          const type = data.type?.toLowerCase() || 'bank';
          return {
            id: doc.id,
            name: getPaymentMethodName(data.type || data.name || 'Bank'),
            accountNumber: data.accountNumber || data.nomorRekening || '',
            accountHolder: data.accountHolder || data.pemilikRekening || '',
            description: data.description || data.keterangan || '',
            type: type,
            color: getPaymentMethodColor(type),
            createdAt: data.createdAt || null
          };
        });
        setPaymentMethods(fetchedPaymentMethods);
      }
    );

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

  const PaymentMethodItem = ({ method, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.paymentMethodItem,
        isSelected && styles.paymentMethodItemSelected,
        { borderColor: isSelected ? method.color : '#E5E7EB' }
      ]}
      onPress={onPress}
    >
      <View style={[styles.paymentMethodIconContainer, { backgroundColor: method.color }]}>
        <FontAwesome5 
          name={getPaymentIcon(method.type)} 
          size={20} 
          color="white" 
        />
      </View>
      <View style={styles.paymentMethodInfo}>
        <Text style={styles.paymentMethodName}>{method.name}</Text>
        <Text style={styles.paymentMethodNumber}>
          {method.accountNumber} • {method.accountHolder}
        </Text>
        {method.description && (
          <Text style={styles.paymentMethodDescription}>{method.description}</Text>
        )}
      </View>
      <View style={styles.paymentMethodRadio}>
        {isSelected ? (
          <Ionicons name="radio-button-on" size={24} color={method.color} />
        ) : (
          <Ionicons name="radio-button-off" size={24} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );

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
                    source={user?.photoURL ? { uri: user.photoURL } : require('../../../assets/images/icon.png')}
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
              </Animated.View>
          
              <View style={styles.headerText}>
                <Animated.Text
                  entering={SlideInRight.delay(100).duration(500)}
                  style={styles.greeting}
                >
                  {getGreeting()}, {user?.name || 'Pengguna'}
                </Animated.Text>
                <Animated.Text
                  entering={SlideInRight.delay(150).duration(500)}
                  style={styles.welcomeText}
                >
                  Selamat datang di TEFA APLIKASI
                </Animated.Text>
              </View>
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
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/products');
              }}
            >
              <Text style={styles.seeAll}>Lihat Semua</Text>
              <AntDesign name="right" size={14} color="#4F46E5" />
            </TouchableOpacity>
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
              <MaterialIcons name="article" size={20} color="#4F46E5" />
              <Text style={styles.sectionTitle}>Berita Terbaru</Text>
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
            
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Nama Lengkap*</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#9CA3AF"
                value={formData.username}
                onChangeText={(text) => setFormData({...formData, username: text})}
              />
              
              <Text style={styles.formLabel}>Detail Tugas*</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Masukkan detail tugas"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
              />
              
              <Text style={styles.formLabel}>Nomor WhatsApp*</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Contoh: 081234567890"
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
                  <Text style={styles.paymentSummaryLabel}>Nama</Text>
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
            
            <ScrollView 
              style={styles.paymentMethodList}
              contentContainerStyle={styles.paymentMethodListContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.paymentMethodSectionTitle}>Transfer Bank</Text>
              {paymentMethods.filter(m => ['bank', 'mandiri', 'bca', 'bri', 'bni'].includes(m.type.toLowerCase())).map((method) => (
                <PaymentMethodItem
                  key={method.id}
                  method={method}
                  isSelected={selectedPaymentMethod === method.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedPaymentMethod(method.id);
                  }}
                />
              ))}
              
              <Text style={styles.paymentMethodSectionTitle}>E-Wallet</Text>
              {paymentMethods.filter(m => ['gopay', 'ovo', 'dana', 'shopeepay', 'linkaja'].includes(m.type.toLowerCase())).map((method) => (
                <PaymentMethodItem
                  key={method.id}
                  method={method}
                  isSelected={selectedPaymentMethod === method.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedPaymentMethod(method.id);
                  }}
                />
              ))}
            </ScrollView>
            
            <View style={styles.paymentButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentSubmitButton,
                  !selectedPaymentMethod && styles.paymentSubmitButtonDisabled,
                  { backgroundColor: selectedPaymentMethod ? paymentMethods.find(m => m.id === selectedPaymentMethod)?.color || '#4F46E5' : '#9CA3AF' }
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
  welcomeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
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
  newsDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  readMoreText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
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
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#111827',
    fontSize: 14,
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
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  paymentMethodItemSelected: {
    backgroundColor: '#F5F3FF',
  },
  paymentMethodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  paymentMethodNumber: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  paymentMethodRadio: {
    marginLeft: 8,
  },
  paymentMethodSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
    marginLeft: 4,
  },
  paymentMethodList: {
    flex: 1,
  },
  paymentMethodListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paymentButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentSubmitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  paymentSubmitButtonDisabled: {
    opacity: 0.7,
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