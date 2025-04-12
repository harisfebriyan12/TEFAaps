import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, query, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { deleteUser as deleteAuthUser } from 'firebase/auth';
import {
  Search,
  User,
  ChevronDown,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowLeft,
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);

      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      // In a real app, you would disable the auth user first
      // Then update Firestore
      Alert.alert(
        'Info',
        'Fitur nonaktifkan pengguna memerlukan implementasi Firebase Auth Admin SDK di backend'
      );
      // Then reload users
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      Alert.alert('Error', 'Gagal mengubah status pengguna');
    }
  };

  const deleteUser = async (userId, email) => {
    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin menghapus pengguna ${email}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              // First delete from Firestore
              await deleteDoc(doc(db, 'users', userId));

              // Then delete from Authentication
              // Note: This requires admin privileges in a real app
              // For client-side, you would typically call a Cloud Function
              Alert.alert(
                'Info',
                'Penghapusan pengguna dari autentikasi memerlukan implementasi Firebase Admin SDK atau Cloud Function'
              );

              loadUsers();
              Alert.alert('Sukses', 'Data pengguna berhasil dihapus');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Gagal menghapus pengguna');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Pengguna</Text>
        <View style={{ width: 24 }} /> {/* Spacer for alignment */}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari pengguna..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada pengguna ditemukan</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <User size={24} color="#7C3AED" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {item.name || 'Nama tidak tersedia'}
                </Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: item.isActive ? '#DCFCE7' : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: item.isActive ? '#166534' : '#991B1B',
                        },
                      ]}
                    >
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </Text>
                    <ChevronDown
                      size={14}
                      color={item.isActive ? '#166534' : '#991B1B'}
                    />
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => toggleUserStatus(item.id, item.isActive)}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: item.isActive ? '#FEE2E2' : '#DCFCE7',
                  },
                ]}
              >
                {item.isActive ? (
                  <XCircle size={20} color="#DC2626" />
                ) : (
                  <CheckCircle size={20} color="#16A34A" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteUser(item.id, item.email)}
                style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
              >
                <Trash2 size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

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
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1F2937',
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
