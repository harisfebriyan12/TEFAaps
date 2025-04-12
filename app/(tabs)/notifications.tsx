import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Bell, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';

const NOTIFICATIONS = [
  {
    id: '1',
    type: 'success',
    title: 'Pesanan Selesai',
    message: 'Pesanan website landing page Anda telah selesai',
    time: '5 menit yang lalu',
    icon: CheckCircle,
    color: '#10B981',
  },
  {
    id: '2',
    type: 'pending',
    title: 'Pesanan Dalam Proses',
    message: 'Designer sedang mengerjakan UI/UX aplikasi Anda',
    time: '1 jam yang lalu',
    icon: Clock,
    color: '#F59E0B',
  },
  {
    id: '3',
    type: 'info',
    title: 'Promo Spesial',
    message: 'Dapatkan diskon 20% untuk pembuatan website',
    time: '2 jam yang lalu',
    icon: Bell,
    color: '#3B82F6',
  },
  {
    id: '4',
    type: 'warning',
    title: 'Pembayaran Pending',
    message: 'Segera selesaikan pembayaran untuk pesanan Anda',
    time: '3 jam yang lalu',
    icon: AlertCircle,
    color: '#EF4444',
  },
];

export default function Notifications() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifikasi</Text>
      </View>

      <ScrollView style={styles.content}>
        {NOTIFICATIONS.map((notification) => {
          const Icon = notification.icon;
          return (
            <TouchableOpacity key={notification.id} style={styles.notificationCard}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${notification.color}20` },
                ]}
              >
                <Icon size={24} color={notification.color} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#999',
  },
});