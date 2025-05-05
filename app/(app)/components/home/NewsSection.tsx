import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import moment from 'moment';

interface NewsSectionProps {
  news: any[];
  expandedNewsId: string | null;
  onNewsPress: (id: string) => void;
}

const NewsSection = ({ news, expandedNewsId, onNewsPress }: NewsSectionProps) => {
  const handleNewsPress = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onNewsPress(id);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderWithLine}>
        <View style={styles.sectionHeaderLine} />
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="newspaper-outline" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Berita Terbaru</Text>
        </View>
        <View style={styles.sectionHeaderLine} />
      </View>

      <View style={styles.newsGrid}>
        {news.length > 0 ? (
          news.slice(0, 3).map((item, index) => {
            const isExpanded = expandedNewsId === item.id;

            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(100 + index * 100).duration(500)}
                style={styles.newsItem}
              >
                <TouchableOpacity
                  style={styles.newsCard}
                  activeOpacity={0.9}
                  onPress={() => handleNewsPress(item.id)}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.newsImage}
                    resizeMode="cover"
                  />
                  <View style={styles.newsContent}>
                    <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                    <Animated.Text 
                      style={styles.newsDescription} 
                      numberOfLines={isExpanded ? undefined : 2}
                    >
                      {item.content}
                    </Animated.Text>
                    <View style={styles.newsFooter}>
                      <Text style={styles.newsDate}>
                        {item.createdAt ? moment(item.createdAt.toDate()).format('DD MMM YYYY') : 'Tanggal tidak tersedia'}
                      </Text>
                      <Text style={styles.readMoreText}>
                        {isExpanded ? 'Sembunyikan' : 'Baca Selengkapnya'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        ) : (
          <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={36} color="#3B82F6" />
            <Text style={styles.emptyStateText}>Tidak ada berita tersedia saat ini</Text>
          </Animated.View>
        )}
      </View>
      
      <View style={styles.footerSpace} />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeaderWithLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
    marginLeft: 8,
  },
  newsGrid: {
    marginTop: 8,
  },
  newsItem: {
    marginBottom: 16,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  newsImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8,
    lineHeight: 24,
  },
  newsDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  newsDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
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
  footerSpace: {
    height: 80,
  },
});

export default NewsSection;