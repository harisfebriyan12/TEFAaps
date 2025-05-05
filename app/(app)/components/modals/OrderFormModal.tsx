import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  TextInput,
  ScrollView, 
  Platform, 
  Dimensions,
  ActivityIndicator,
  ToastAndroid,
  Alert
} from 'react-native';
import { AntDesign, MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import Animated, { SlideInRight, FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Modal from '../shared/ModalWrapper';
import moment from 'moment';
import 'moment/locale/id';  // Import Indonesian locale
import DateTimePicker from '@/components/DateTimePicker';
import * as Haptics from 'expo-haptics';

// Get screen dimensions for responsive sizing
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Firebase timestamp interface
interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

interface Promotion {
  id?: string;
  title: string;
  discountPercentage: number;
  imageUrl?: string;
  validUntil: FirebaseTimestamp | Date;
  createdAt?: FirebaseTimestamp | Date;
  updatedAt?: FirebaseTimestamp | Date;
}

interface OrderFormModalProps {
  visible: boolean;
  product: any;
  formData: any;
  onClose: () => void;
  onFormChange: (data: any) => void;
  onSubmit: () => void;
  onDateChange: (event: any, date?: Date) => void;
  promotions?: Promotion[];  // Optional array of promotions
}

const OrderFormModal = ({ 
  visible, 
  product, 
  formData, 
  onClose, 
  onFormChange, 
  onSubmit,
  onDateChange,
  promotions = []  // Default to empty array
}: OrderFormModalProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPromoList, setShowPromoList] = useState(false);

  // Helper function to convert Firebase timestamp to Date
  const timestampToDate = (timestamp: any): Date => {
    if (timestamp && typeof timestamp === 'object') {
      // Check if it's a Firebase timestamp
      if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
        // Use toDate() method if available
        if (typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        // Otherwise, construct a date manually
        return new Date(timestamp.seconds * 1000);
      }
      // Handle JavaScript Date object
      if (timestamp instanceof Date) {
        return timestamp;
      }
    }
    // Fallback to current date if timestamp is invalid
    return new Date();
  };

  // Format for Indonesian currency
  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Find valid promotions (not expired)
  const getValidPromotions = (): Promotion[] => {
    const now = new Date();
    console.log("Current promotions:", promotions);
    
    return promotions.filter(promo => {
      if (!promo.validUntil) return false;
      
      const validUntilDate = timestampToDate(promo.validUntil);
      console.log(`Promo: ${promo.title}, Valid until: ${validUntilDate}, Now: ${now}`);
      return validUntilDate > now;
    });
  };

  // Check and apply promotions when component mounts or promotions change
  useEffect(() => {
    console.log("Running useEffect with promotions:", promotions);
    const validPromos = getValidPromotions();
    console.log("Valid promotions found:", validPromos.length);
    
    if (validPromos.length > 0 && product?.price) {
      // Sort by highest discount
      const bestPromo = [...validPromos].sort((a, b) => 
        b.discountPercentage - a.discountPercentage
      )[0];
      
      if (bestPromo) {
        console.log("Best promo selected:", bestPromo.title, bestPromo.discountPercentage);
        applyPromotion(bestPromo);
        showPromotionToast(bestPromo);
      }
    } else {
      console.log("No valid promotions found or product price missing");
    }
  }, [product?.price, promotions]);

  const showPromotionToast = (promo: Promotion) => {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        `Promo ${promo.title} (${promo.discountPercentage}%) berhasil diterapkan!`,
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
    } else {
      // For iOS, you might use a custom toast or Alert
      Alert.alert("Promo Diterapkan", `Promo ${promo.title} (${promo.discountPercentage}%) berhasil diterapkan!`);
    }
  };

  const applyPromotion = (promo: Promotion) => {
    if (!product?.price) {
      console.log("Cannot apply promotion - product price missing");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate loading for better UX
    setTimeout(() => {
      const discount = (product.price * promo.discountPercentage) / 100;
      const newPrice = Math.floor(product.price - discount);
      console.log(`Applied discount: ${discount}, New price: ${newPrice}`);
      setDiscountedPrice(newPrice);
      setSelectedPromo(promo);
      setIsLoading(false);
      
      // Provide haptic feedback when promo applied
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 500);
  };

  const removePromotion = () => {
    setDiscountedPrice(null);
    setSelectedPromo(null);
    
    // Provide haptic feedback when promo removed
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleDatePickerPress = () => {
    setShowDatePicker(true);
  };

  const handleDateSelect = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    onDateChange(event, selectedDate);
  };

  const togglePromoList = () => {
    setShowPromoList(!showPromoList);
  };

  // Calculate final price
  const finalPrice = discountedPrice !== null ? discountedPrice : (product?.price || 0);

  // Format a Firebase timestamp or Date for display
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestampToDate(timestamp);
    moment.locale('id'); // Set locale to Indonesian
    return moment(date).format('DD MMM YYYY');
  };

  // Get valid promotions for display
  const validPromotions = getValidPromotions();

  if (!product) return null;

  return (
    <Modal visible={visible} onClose={onClose}>
      <Animated.View
        style={styles.modalContent}
        entering={SlideInRight.duration(300)}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Form Pemesanan</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <AntDesign name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Animated.View 
          style={styles.selectedServiceInfo}
          entering={FadeIn.duration(400)}
        >
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.selectedServiceImage}
              defaultSource={require('@/assets/images/placeholder.jpg')}
            />
          ) : (
            <View style={[styles.selectedServiceImage, styles.imagePlaceholder]}>
              <AntDesign name="picture" size={24} color="#9CA3AF" />
            </View>
          )}
          <View style={styles.selectedServiceDetails}>
            <Text style={styles.selectedServiceName}>{product.name || 'Item'}</Text>
            <View style={styles.priceContainer}>
              {discountedPrice !== null && (
                <Text style={styles.originalPrice}>
                  {formatCurrency(product.price || 0)}
                </Text>
              )}
              <Text style={[
                styles.selectedServicePrice,
                discountedPrice !== null && styles.discountedPrice
              ]}>
                {formatCurrency(finalPrice)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Available Promotions Button */}
        {validPromotions.length > 0 && !selectedPromo && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <TouchableOpacity 
              style={styles.availablePromosButton}
              onPress={togglePromoList}
            >
              <Ionicons name="pricetag" size={16} color="#4F46E5" />
              <Text style={styles.availablePromosText}>
                {validPromotions.length} Promo Tersedia
              </Text>
              <Ionicons 
                name={showPromoList ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#4F46E5" 
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Promotions List */}
        {showPromoList && validPromotions.length > 0 && !selectedPromo && (
          <Animated.View 
            style={styles.promoListContainer}
            entering={FadeInDown.duration(300)}
          >
            {validPromotions.map((promo, index) => (
              <TouchableOpacity
                key={promo.id || index}
                style={styles.promoListItem}
                onPress={() => {
                  applyPromotion(promo);
                  setShowPromoList(false);
                }}
              >
                <View style={styles.promoListItemContent}>
                  <View style={styles.promoBadge}>
                    <Text style={styles.promoBadgeText}>
                      {promo.discountPercentage}%
                    </Text>
                  </View>
                  <View style={styles.promoListItemInfo}>
                    <Text style={styles.promoListItemTitle}>{promo.title}</Text>
                    <Text style={styles.promoListItemValidity}>
                      Berlaku hingga {formatDate(promo.validUntil)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Applied Promotion badge */}
        {selectedPromo && (
          <Animated.View 
            style={styles.promoContainer}
            entering={ZoomIn.duration(300)}
          >
            <View style={styles.promoLeftSection}>
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>PROMO</Text>
              </View>
              <View style={styles.promoInfo}>
                <Text style={styles.promoTitle}>{selectedPromo.title}</Text>
                <Text style={styles.promoDiscount}>
                  Diskon {selectedPromo.discountPercentage}% • Berlaku hingga {formatDate(selectedPromo.validUntil)}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.removePromoButton}
              onPress={removePromotion}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Feather name="x" size={18} color="#6B7280" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Loading indicator for promotion application */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Menerapkan promo...</Text>
          </View>
        )}

        <ScrollView 
          style={styles.formContainer} 
          contentContainerStyle={styles.formContentContainer}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <Text style={styles.formLabel}>Nama Lengkap<Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            style={styles.formInput}
            placeholder="Masukkan nama lengkap"
            placeholderTextColor="#9CA3AF"
            value={formData.username}
            onChangeText={(text) => onFormChange({ ...formData, username: text })}
          />

          <Text style={styles.formLabel}>Detail Tugas<Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            style={styles.formInput}
            placeholder="Masukkan detail tugas"
            placeholderTextColor="#9CA3AF"
            value={formData.password}
            onChangeText={(text) => onFormChange({ ...formData, password: text })}
          />

          <Text style={styles.formLabel}>Tenggat Waktu<Text style={styles.requiredStar}>*</Text></Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={handleDatePickerPress}
          >
            <Text style={[
              styles.datePickerButtonText,
              !formData.deadline && { color: '#9CA3AF' }
            ]}>
              {formData.deadline ? moment(formData.deadline).format('DD MMMM YYYY') : 'Pilih tanggal'}
            </Text>
            <MaterialIcons name="date-range" size={20} color="#6B7280" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.deadline || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateSelect}
              minimumDate={new Date()}
            />
          )}

          <Text style={styles.formLabel}>Nomor WhatsApp<Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            style={styles.formInput}
            placeholder="Contoh: 081234567890"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={formData.contactNumber}
            onChangeText={(text) => onFormChange({ ...formData, contactNumber: text })}
          />

          <Text style={styles.formLabel}>Catatan Tambahan</Text>
          <TextInput
            style={[styles.formInput, styles.formTextarea]}
            placeholder="Masukkan catatan tambahan jika ada"
            placeholderTextColor="#9CA3AF"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            value={formData.notes}
            onChangeText={(text) => onFormChange({ ...formData, notes: text })}
          />

          {/* Order Summary */}
          <Animated.View 
            style={styles.orderSummary}
            entering={FadeIn.delay(300)}
          >
            <Text style={styles.orderSummaryTitle}>Ringkasan Pembayaran</Text>
            <View style={styles.orderSummaryItem}>
              <Text style={styles.orderSummaryItemLabel}>Harga</Text>
              <Text style={styles.orderSummaryItemValue}>{formatCurrency(product.price || 0)}</Text>
            </View>
            
            {selectedPromo && (
              <View style={styles.orderSummaryItem}>
                <Text style={styles.orderSummaryItemLabel}>Diskon ({selectedPromo.discountPercentage}%)</Text>
                <Text style={styles.orderSummaryItemDiscount}>
                  -{formatCurrency((product.price || 0) - (discountedPrice || 0))}
                </Text>
              </View>
            )}
            
            <View style={[styles.orderSummaryItem, styles.orderSummaryTotal]}>
              <Text style={styles.orderSummaryTotalLabel}>Total Pembayaran</Text>
              <Text style={styles.orderSummaryTotalValue}>{formatCurrency(finalPrice)}</Text>
            </View>
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!formData.username || !formData.password || !formData.deadline || 
               !formData.contactNumber) && styles.submitButtonDisabled
            ]}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              onSubmit();
            }}
            disabled={!formData.username || !formData.password || !formData.deadline || !formData.contactNumber}
          >
            <Text style={styles.submitButtonText}>Lanjut ke Pembayaran</Text>
          </TouchableOpacity>
          
          {/* Add extra padding at the bottom for Android */}
          {Platform.OS === 'android' && <View style={{ height: 20 }} />}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
    height: Platform.OS === 'ios' ? '80%' : screenHeight * 0.85,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  closeButton: {
    padding: 4,
  },
  selectedServiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#93C5FD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedServiceImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14,
  },
  imagePlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedServiceDetails: {
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  selectedServicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
  },
  originalPrice: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    color: '#10B981',
  },
  availablePromosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  availablePromosText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 8,
  },
  promoListContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  promoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  promoListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  promoListItemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  promoListItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  promoListItemValidity: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  promoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promoLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  promoBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  promoInfo: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 3,
  },
  promoDiscount: {
    fontSize: 13,
    color: '#065F46',
  },
  removePromoButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
    fontSize: 15,
  },
  formInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 16,
  },
  formTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 15,
    color: '#1F2937',
  },
  orderSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  orderSummaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 14,
  },
  orderSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderSummaryItemLabel: {
    fontSize: 15,
    color: '#4B5563',
  },
  orderSummaryItemValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  orderSummaryItemDiscount: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '500',
  },
  orderSummaryTotal: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  orderSummaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  orderSummaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderFormModal;