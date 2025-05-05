// ManageUsers.js (Frontend)
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
  Modal,
  ScrollView,
} from 'react-native';
import { collection, query, getDocs, doc, where, addDoc, getDoc } from 'firebase/firestore';
import { db, auth, functions } from '@/lib/firebase'; // Make sure to import functions
import { httpsCallable } from 'firebase/functions';
import {
  Search,
  User,
  ChevronDown,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowLeft,
  PhoneCall,
  Plus,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form states for new user
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Default role as 'user'
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // Verify that the current user is an admin
    checkAdminStatus();
    loadUsers();
  }, []);

  useEffect(() => {
    // Check if form is valid
    setIsFormValid(
      name.trim() !== '' && 
      email.trim() !== '' && 
      password.length >= 6
    );
  }, [name, email, password]);

  // Function to check if current user is an admin
  const checkAdminStatus = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert('Akses Ditolak', 'Anda harus login terlebih dahulu');
        router.replace('/login');
        return;
      }

      // Get current user's role from Firestore
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        Alert.alert('Akses Ditolak', 'Anda tidak memiliki izin untuk mengakses halaman ini');
        router.replace('/');
        return;
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      Alert.alert('Error', 'Gagal memverifikasi status admin');
      router.replace('/');
    }
  };

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
          // Ensure profilePicture exists, if not use default
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
      
      // Check for active transactions before deactivating
      if (isActive) {
        const hasActiveTransactions = await checkUserTransactions(userId);
        if (hasActiveTransactions) {
          Alert.alert(
            'Tidak Dapat Menonaktifkan Pengguna',
            'Pengguna memiliki transaksi yang sedang diproses atau ditunggu.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      // Call Firebase Cloud Function to toggle user status
      const toggleUserStatusFunc = httpsCallable(functions, 'toggleUserStatus');
      const result = await toggleUserStatusFunc({ userId, setActive: !isActive });
      
      if (result.data.success) {
        Alert.alert('Sukses', `Pengguna berhasil ${!isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        loadUsers(); // Reload user list
      } else {
        throw new Error(result.data.error || 'Gagal mengubah status pengguna');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      Alert.alert('Error', `Gagal ${isActive ? 'menonaktifkan' : 'mengaktifkan'} pengguna: ${error.message}`);
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
                  'Pengguna memiliki transaksi yang sedang diproses atau ditunggu.'
                );
                return;
              }
              
              // Call Firebase Cloud Function to delete user
              const deleteUserFunc = httpsCallable(functions, 'deleteUser');
              const result = await deleteUserFunc({ userId });
              
              if (result.data.success) {
                Alert.alert('Sukses', 'Pengguna berhasil dihapus dari sistem');
                loadUsers(); // Reload user list
              } else {
                throw new Error(result.data.error || 'Gagal menghapus pengguna');
              }
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', `Gagal menghapus pengguna: ${error.message}`);
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  const createNewUser = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Mohon lengkapi semua field dengan benar');
      return;
    }

    try {
      setProcessingAction(true);
      
      // Call Firebase Cloud Function to create a new user
      const createUserFunc = httpsCallable(functions, 'createUser');
      const result = await createUserFunc({
        name,
        email,
        password,
        role
      });
      
      if (result.data.success) {
        Alert.alert('Sukses', `Pengguna ${role} berhasil ditambahkan!`);
        
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
        setRole('user');
        setModalVisible(false);
        
        // Reload user list
        loadUsers();
      } else {
        throw new Error(result.data.error || 'Gagal membuat pengguna baru');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', `Gagal membuat pengguna baru: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRoleBadge = (userRole) => {
    let badgeStyle = styles.roleBadge;
    let textStyle = styles.roleText;
    let roleLabel = userRole;

    switch(userRole) {
      case 'admin':
        badgeStyle = { ...styles.roleBadge, backgroundColor: '#EDE9FE' };
        textStyle = { ...styles.roleText, color: '#7C3AED' };
        roleLabel = 'Admin';
        break;
      case 'siswa':
        badgeStyle = { ...styles.roleBadge, backgroundColor: '#E0F2FE' };
        textStyle = { ...styles.roleText, color: '#0369A1' };
        roleLabel = 'Siswa';
        break;
      default:
        badgeStyle = { ...styles.roleBadge, backgroundColor: '#E5E7EB' };
        textStyle = { ...styles.roleText, color: '#4B5563' };
        roleLabel = 'Pengguna';
    }

    return (
      <View style={badgeStyle}>
        <Text style={textStyle}>{roleLabel}</Text>
      </View>
    );
  };

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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Pengguna</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={24} color="#7C3AED" />
        </TouchableOpacity>
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
            {users.filter(user => user.role === 'siswa').length}
          </Text>
          <Text style={styles.statLabel}>Siswa</Text>
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
                  {renderRoleBadge(item.role)}
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

      {/* Add User Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Pengguna Baru</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama lengkap"
                value={name}
                onChangeText={setName}
              />
              
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimal 6 karakter"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              
              <Text style={styles.inputLabel}>Peran (Role)</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    role === 'user' && styles.roleOptionSelected
                  ]}
                  onPress={() => setRole('user')}
                >
                  <User size={16} color={role === 'user' ? '#7C3AED' : '#6B7280'} />
                  <Text style={[
                    styles.roleText,
                    role === 'user' && styles.roleTextSelected
                  ]}>Pengguna</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    role === 'siswa' && styles.roleOptionSelected
                  ]}
                  onPress={() => setRole('siswa')}
                >
                  <CheckCircle size={16} color={role === 'siswa' ? '#0369A1' : '#6B7280'} />
                  <Text style={[
                    styles.roleText,
                    role === 'siswa' && { color: '#0369A1' }
                  ]}>Siswa</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !isFormValid && styles.submitButtonDisabled
                ]}
                onPress={createNewUser}
                disabled={!isFormValid || processingAction}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Tambah Pengguna</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {processingAction && !modalVisible && (
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
  addButton: {
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
  // Rest of the styles remain unchanged
  
  // The rest of the style object is the same as in your original code...
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1F2937',
  },
  roleSelector: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  roleOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  roleTextSelected: {
    color: '#7C3AED',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
  },
  submitButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
});