import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

export function useHomeData() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
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
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default deadline: 7 days from now
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getPaymentMethodColor = (type) => {
    const lowerType = type?.toLowerCase();
    switch (lowerType) {
      case 'qris': return '#9333EA';
      default: return '#4F46E5';
    }
  };

  const getPaymentMethodName = (type) => {
    const lowerType = type?.toLowerCase();
    switch (lowerType) {
      default: return type;
    }
  };

  const fetchData = async () => {
    try {
      // Fetch user data
      if (auth.currentUser?.uid) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUser(data);
        }
      }

      // Fetch other data
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

      // Normalized payment method processing
      const fetchedPaymentMethods = paymentsSnap.docs.map(doc => {
        const data = doc.data();
        // Determine the payment type from various possible fields
        const type = data.type || data.bankName?.toLowerCase() || 'bank';

        return {
          id: doc.id,
          name: data.bankName || data.name || getPaymentMethodName(type) || 'Bank',
          accountNumber: data.accountNumber || data.nomorRekening || data.nomorakun || '',
          accountHolder: data.accountHolder || data.pemilikRekening || data.pemegangakun || '',
          description: data.description || data.keterangan || '',
          type: type.toLowerCase(),
          color: getPaymentMethodColor(type),
          imageUrl: data.imageUrl || data.URL_gambar || null,
          rawData: data
        };
      });

      setPaymentMethods(fetchedPaymentMethods);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Gagal memuat data. Silakan coba lagi.');
    } finally {
      setLoading(false);
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
          const type = data.type || data.bankName?.toLowerCase() || 'bank';

          return {
            id: doc.id,
            name: data.bankName || data.name || getPaymentMethodName(type) || 'Bank',
            accountNumber: data.accountNumber || data.nomorRekening || data.nomorakun || '',
            accountHolder: data.accountHolder || data.pemilikRekening || data.pemegangakun || '',
            description: data.description || data.keterangan || '',
            type: type.toLowerCase(),
            color: getPaymentMethodColor(type),
            imageUrl: data.imageUrl || data.URL_gambar || null,
            rawData: data
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

  const handleProductPress = (product) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedProduct(product);
    setFormVisible(true);
    setFormData({
      username: '',
      password: '',
      notes: '',
      contactNumber: '',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default deadline: 7 days from now
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

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setFormData({ ...formData, deadline: selectedDate });
    }
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
      const newOrderNumber = `TEFA-${timestamp}-${randomDigits}`;
      setOrderNumber(newOrderNumber);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Find the selected payment method details
      const selectedPaymentDetails = paymentMethods.find(p => p.id === selectedPaymentMethod);

      // Save to Firestore with consistent field names
      await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser?.uid,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        orderDetails: formData,
        paymentMethod: selectedPaymentDetails?.name || 'Unknown payment method',
        paymentMethodId: selectedPaymentMethod,
        paymentAccountNumber: selectedPaymentDetails?.accountNumber || '',
        paymentAccountHolder: selectedPaymentDetails?.accountHolder || '',
        status: 'pending',
        orderNumber: newOrderNumber,
        createdAt: serverTimestamp(),
        amount: selectedProduct.price,
        customerName: user?.name || '',
        customerEmail: user?.email || '',
        deadline: formData.deadline,
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

  return {
    loading,
    user,
    products,
    news,
    promotions,
    paymentMethods,
    selectedProduct,
    formData,
    formVisible,
    paymentVisible,
    confirmationVisible,
    selectedPaymentMethod,
    orderNumber,
    isProcessing,
    expandedNewsId,
    handleProductPress,
    handleFormSubmit,
    handlePaymentSubmit,
    handleDateChange,
    closeAllModals,
    setFormVisible,
    setPaymentVisible,
    setExpandedNewsId,
    setSelectedPaymentMethod,
    setFormData,
    fetchData
  };
}