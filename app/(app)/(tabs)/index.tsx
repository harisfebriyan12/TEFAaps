import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { useRefreshable } from '@/hooks/useRefreshable';
import { useHomeData } from '@/hooks/useHomeData';
import * as Haptics from 'expo-haptics';

// Components
import HeaderSection from '../components/home/HeaderSection';
import ServicesSection from '../components/home/ServicesSection';
import NewsSection from '../components/home/NewsSection';
import OrderFormModal from '../components/modals/OrderFormModal';
import PaymentModal from '../components/modals/PaymentModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import LoadingScreen from '../components/shared/LoadingScreen';

const HomeScreen = () => {
  const { 
    loading,
    user,
    products,
    news,
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
  } = useHomeData();

  const { refreshing, onRefresh } = useRefreshable(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    fetchData();
  });

  if (loading) {
    return <LoadingScreen message="Memuat data..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
        <HeaderSection user={user} />
        
        <ServicesSection 
          products={products} 
          onProductPress={handleProductPress} 
        />
        
        <NewsSection 
          news={news} 
          expandedNewsId={expandedNewsId} 
          onNewsPress={(id) => setExpandedNewsId(expandedNewsId === id ? null : id)} 
        />
      </ScrollView>

      {/* Modals */}
      <OrderFormModal
        visible={formVisible}
        product={selectedProduct}
        formData={formData}
        onClose={() => setFormVisible(false)}
        onFormChange={setFormData}
        onSubmit={handleFormSubmit}
        onDateChange={handleDateChange}
      />

      <PaymentModal
        visible={paymentVisible}
        product={selectedProduct}
        formData={formData}
        paymentMethods={paymentMethods}
        selectedPaymentMethod={selectedPaymentMethod}
        isProcessing={isProcessing}
        onClose={() => setPaymentVisible(false)}
        onSelectPaymentMethod={setSelectedPaymentMethod}
        onSubmit={handlePaymentSubmit}
      />

      <ConfirmationModal
        visible={confirmationVisible}
        product={selectedProduct}
        formData={formData}
        paymentMethods={paymentMethods}
        selectedPaymentMethod={selectedPaymentMethod}
        orderNumber={orderNumber}
        onClose={closeAllModals}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
});

export default HomeScreen;