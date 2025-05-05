import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell, Calendar, Clock, ChevronRight } from 'lucide-react-native';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState({});

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('targetAudience', 'array-contains', 'students'),
        orderBy('createdAt', 'desc')
      );
      const announcementsSnapshot = await getDocs(announcementsQuery);
      const announcementsData = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpandAnnouncement = (id) => {
    setExpandedAnnouncements(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Memuat pengumuman...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengumuman</Text>
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1D4ED8"]}
          />
        }
      >
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <View key={announcement.id} style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <View style={styles.announcementIcon}>
                  <Bell size={20} color="#1D4ED8" />
                </View>
                <View style={styles.announcementTitleContainer}>
                  <Text style={styles.announcementTitle} numberOfLines={2}>
                    {announcement.title}
                  </Text>
                </View>
              </View>

              <View style={styles.dateTimeContainer}>
                <View style={styles.dateTimeItem}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.dateTimeText}>
                    {formatDate(announcement.createdAt)}
                  </Text>
                </View>
                <View style={styles.dateTimeItem}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.dateTimeText}>
                    {formatTime(announcement.createdAt)}
                  </Text>
                </View>
              </View>
              
              {announcement.imageUrl && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: announcement.imageUrl }}
                    style={styles.announcementImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              <Text 
                style={styles.announcementContent}
                numberOfLines={expandedAnnouncements[announcement.id] ? null : 3}
              >
                {announcement.content}
              </Text>
              
              {announcement.content.length > 150 && (
                <TouchableOpacity 
                  style={styles.readMoreButton}
                  onPress={() => toggleExpandAnnouncement(announcement.id)}
                >
                  <Text style={styles.readMoreText}>
                    {expandedAnnouncements[announcement.id] ? 'Tutup' : 'Baca selengkapnya'}
                  </Text>
                  <ChevronRight 
                    size={16} 
                    color="#1D4ED8" 
                    style={expandedAnnouncements[announcement.id] ? { transform: [{ rotate: '90deg' }] } : {}} 
                  />
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Belum ada pengumuman saat ini</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    marginTop: 12,
    color: '#4B5563',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementTitleContainer: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  announcementImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  announcementContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D4ED8',
    marginRight: 4,
  },
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});