import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface ServicesSectionProps {
  products: any[];
  onProductPress: (product: any) => void;
}

const ServicesSection = ({ products, onProductPress }: ServicesSectionProps) => {
  const handleProductPress = (product: any) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onProductPress(product);
  };

  const handleSeeAllPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    router.push('/products');
  };

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <MaterialIcons name="star" size={22} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Layanan Kami</Text>
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
                activeOpacity={0.8}
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
        <Animated.View entering={FadeInDown.duration(500)} style={styles.emptyState}>
          <MaterialIcons name="error-outline" size={36} color="#3B82F6" />
          <Text style={styles.emptyStateText}>Tidak ada layanan tersedia saat ini</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
    marginLeft: 8,
  },
  seeAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceGridItem: {
    width: width / 2 - 24,
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    flex: 1,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  orderButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    marginVertical: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#1E40AF',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default ServicesSection;