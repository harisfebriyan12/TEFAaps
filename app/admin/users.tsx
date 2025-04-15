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
  Image,
} from 'react-native';
import { collection, query, getDocs, doc, deleteDoc, where } from 'firebase/firestore';
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
  PhoneCall,
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

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
          // Pastikan profilePicture ada, jika tidak gunakan default
          profilePicture: doc.data().profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doc.data().name || 'User')
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
      setProcessingAction(true);
      // Cek transaksi aktif sebelum menonaktifkan
      if (!isActive) {
        // Jika mengaktifkan kembali, tidak perlu cek transaksi
        Alert.alert(
          'Info',
          'Fitur aktivasi pengguna memerlukan implementasi Firebase Auth Admin SDK di backend'
        );
      } else {
        // Jika menonaktifkan, cek transaksi dulu
        const hasActiveTransactions = await checkUserTransactions(userId);
        if (hasActiveTransactions) {
          Alert.alert(
            'Tidak Dapat Menonaktifkan Pengguna',
            'Pengguna memiliki transaksi yang sedang diproses atau ditunggu. Silahkan hubungi admin untuk bantuan lebih lanjut.',
            [
              { text: 'OK' },
              { 
                text: 'Hubungi Admin', 
                onPress: () => {
                  Alert.alert('Info', 'Fitur hubungi admin akan segera tersedia');
                } 
              }
            ]
          );
          return;
        } else {
          Alert.alert(
            'Info',
            'Fitur nonaktifkan pengguna memerlukan implementasi Firebase Auth Admin SDK di backend'
          );
        }
      }
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      Alert.alert('Error', 'Gagal mengubah status pengguna');
    } finally {
      setProcessingAction(false);
    }
  };

  const checkUserTransactions = async (userId) => {
    try {
      // Check for active transactions
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef, 
        where('userId', '==', userId), 
        where('status', 'in', ['processing', 'pending', 'waiting'])
      );
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user transactions:', error);
      throw error;
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
              setProcessingAction(true);
              
              // Check for active transactions first
              const hasActiveTransactions = await checkUserTransactions(userId);
              
              if (hasActiveTransactions) {
                Alert.alert(
                  'Tidak Dapat Menghapus Pengguna',
                  'Pengguna memiliki transaksi yang sedang diproses atau ditunggu. Silahkan hubungi admin untuk bantuan lebih lanjut.',
                  [
                    { text: 'OK' },
                    { 
                      text: 'Hubungi Admin', 
                      onPress: () => {
                        // Implementasi untuk menghubungi admin bisa ditambahkan disini
                        Alert.alert('Info', 'Fitur hubungi admin akan segera tersedia');
                      } 
                    }
                  ]
                );
                return;
              }
              
              // Hapus dari Firestore
              await deleteDoc(doc(db, 'users', userId));

              // Kemudian hapus dari Authentication
              // Catatan: Ini memerlukan hak admin dalam aplikasi sebenarnya
              Alert.alert(
                'Sukses',
                'Data pengguna berhasil dihapus. Penghapusan dari sistem autentikasi memerlukan implementasi Firebase Admin SDK.'
              );

              loadUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Gagal menghapus pengguna');
            } finally {
              setProcessingAction(false);
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
        <Text style={styles.loadingText}>Memuat data pengguna...</Text>
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

      {/* User Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Pengguna</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {users.filter(user => user.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Pengguna Aktif</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {users.filter(user => !user.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Tidak Aktif</Text>
        </View>
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
                <Image
                  source={{ uri: item.profilePicture }}
                  style={styles.avatarImage}
                  defaultSource={require('../../assets/images/avatar-default.png')}
                />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {item.name || 'Nama tidak tersedia'}
                </Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <View style={styles.badgeContainer}>
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
                  </View>
                  {item.role === 'admin' && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>Admin</Text>
                    </View>
                  )}
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
                disabled={processingAction}
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
                disabled={processingAction || item.role === 'admin'}
              >
                <Trash2 size={20} color={item.role === 'admin' ? '#9CA3AF' : '#DC2626'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {processingAction && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.processingText}>Memproses...</Text>
        </View>
      )}
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#7C3AED',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  listContent: {
    paddingTop: 8,
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
    textAlign: 'center',
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
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  roleBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#7C3AED',
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
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    marginTop: 16,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
    fontSize: 16,
  },
});