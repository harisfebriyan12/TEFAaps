import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Search,
  User,
  ArrowLeft,
  Trash2,
  MoreVertical,
  Check,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  // Load data users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');

      // Query untuk mendapatkan semua user kecuali admin
      const q = query(usersRef, where('role', '!=', 'admin'));
      const querySnapshot = await getDocs(q);

      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('error', 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data
  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  // Handle toggle status user
  const toggleUserStatus = async (userId, isActive) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !isActive,
        updatedAt: new Date(),
      });
      showToast(
        'success',
        `Pengguna telah di${isActive ? 'nonaktifkan' : 'aktifkan'}`
      );
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      showToast('error', 'Gagal memperbarui status pengguna');
    }
  };

  // Konfirmasi penghapusan user
  const confirmDelete = (userId, userName) => {
    Alert.alert(
      'Konfirmasi Penghapusan',
      `Anda yakin ingin menghapus ${userName}?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deleteUser(userId, userName),
        },
      ],
      { cancelable: true }
    );
  };

  // Handle penghapusan user
  const deleteUser = async (userId, userName) => {
    try {
      // Hard delete (penghapusan permanen)
      await deleteDoc(doc(db, 'users', userId));

      // Alternatif soft delete (jika ingin menyimpan data)
      // await updateDoc(doc(db, 'users', userId), {
      //   deleted: true,
      //   deletedAt: new Date(),
      //   isActive: false
      // });

      showToast('success', `${userName} berhasil dihapus`);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('error', 'Gagal menghapus pengguna');
    }
  };

  // Tampilkan toast notification
  const showToast = (type, message) => {
    Toast.show({
      type,
      text1: message,
      position: 'bottom',
      visibilityTime: 3000,
    });
  };

  // Filter users berdasarkan search query
  const filteredUsers = users.filter((user) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      user.phone?.toLowerCase().includes(searchTerm)
    );
  });

  // Tampilan loading
  if (loading && users.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Kelola Pengguna</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari pengguna..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Daftar Pengguna */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7C3AED']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0
                ? 'Tidak ada hasil pencarian'
                : 'Tidak ada pengguna'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[styles.userCard, !item.isActive && styles.inactiveCard]}
          >
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <User size={24} color="#666" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.isActive ? styles.activeBadge : styles.inactiveBadge,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={() => toggleUserStatus(item.id, item.isActive)}
                style={styles.actionButton}
              >
                <MoreVertical size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDelete(item.id, item.name)}
                style={styles.deleteButton}
              >
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    marginRight: 12,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inactiveCard: {
    opacity: 0.8,
    backgroundColor: '#f9f9f9',
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
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
