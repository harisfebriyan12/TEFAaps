import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut, sendEmailVerification, updatePassword } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  User,
  Phone,
  MapPin,
  LogOut,
  Edit2,
  Mail,
  CheckCircle,
  Lock,
  Trash2,
  Info,
  HelpCircle,
} from 'lucide-react-native';

export default function Profile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar:
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasActiveOrders, setHasActiveOrders] = useState(false);

  useEffect(() => {
    loadProfile();
    checkActiveOrders();
  }, []);

  const loadProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile({ ...profile, ...userData });
          setEditedProfile({ ...profile, ...userData });
          setIsEmailVerified(user.emailVerified);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data.');
    }
  };

  const checkActiveOrders = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Periksa jika pengguna memiliki pesanan yang masih dalam proses
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('userId', '==', user.uid),
          where('status', 'in', ['pending', 'processing', 'shipping'])
        );
        
        const querySnapshot = await getDocs(q);
        setHasActiveOrders(!querySnapshot.empty);
      }
    } catch (error) {
      console.error('Error checking active orders:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), editedProfile);
        setProfile(editedProfile);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const handleNavigateToAboutUs = () => {
    router.push('../about');
  };

  const handleSendVerificationEmail = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setIsVerificationSent(true);
        Alert.alert(
          'Success',
          'Verification email sent. Please check your inbox.'
        );
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      Alert.alert('Error', 'Failed to send verification email.');
    }
  };

  const handleChangeProfilePicture = async () => {
    try {
      // Request permission for media library
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission required',
          'Please allow access to your photo library.'
        );
        return;
      }

      // Open document picker instead of image library
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!pickerResult.canceled && pickerResult.assets) {
        const user = auth.currentUser;
        if (user) {
          setIsLoading(true);
          const { uri } = pickerResult.assets[0];
          const response = await fetch(uri);
          const blob = await response.blob();
          const storageRef = ref(storage, `profile-pictures/${user.uid}`);
          await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(storageRef);

          await updateDoc(doc(db, 'users', user.uid), { avatar: downloadURL });
          setProfile({ ...profile, avatar: downloadURL });
          setEditedProfile({ ...editedProfile, avatar: downloadURL });
          Alert.alert('Success', 'Profile picture updated successfully.');
        }
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Password updated successfully.');
        setIsChangingPassword(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Periksa jika pengguna memiliki pesanan yang aktif
    if (hasActiveOrders) {
      Alert.alert(
        'Tidak Dapat Menghapus Akun',
        'Anda masih memiliki pesanan yang sedang diproses. Silahkan hubungi admin untuk bantuan lebih lanjut.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Hapus Akun',
      'Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                await user.delete();
                Alert.alert('Berhasil', 'Akun berhasil dihapus.');
                router.replace('/login');
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Gagal menghapus akun.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleChangeProfilePicture}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            <View style={styles.editIcon}>
              <Edit2 size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          {isEmailVerified ? (
            <View style={styles.verifiedBadge}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.verifiedText}>Email Terverifikasi</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSendVerificationEmail}
              style={styles.verifyButton}
              disabled={isVerificationSent}
            >
              <Text style={styles.verifyButtonText}>
                {isVerificationSent
                  ? 'Verifikasi Email Dikirim'
                  : 'Verifikasi Email Sekarang'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editButton}
            >
              <Edit2 size={20} color={isEditing ? '#1E88E5' : '#666'} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <User size={20} color="#666" />
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedProfile.name}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, name: text })
                  }
                />
              ) : (
                <Text style={styles.infoText}>{profile.name}</Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Mail size={20} color="#666" />
              <Text style={styles.infoText}>{profile.email}</Text>
            </View>

            <View style={styles.infoItem}>
              <Phone size={20} color="#666" />
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedProfile.phone}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, phone: text })
                  }
                  placeholder="Tambahkan No telepon Anda"
                />
              ) : (
                <Text style={styles.infoText}>
                  {profile.phone || 'Tidak ada no Telepon'}
                </Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <MapPin size={20} color="#666" />
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedProfile.address}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, address: text })
                  }
                  placeholder="Tambahkan Alamat"
                  multiline
                />
              ) : (
                <Text style={styles.infoText}>
                  {profile.address || 'Belum ada alamat'}
                </Text>
              )}
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
          <TouchableOpacity
            onPress={() => setIsChangingPassword(!isChangingPassword)}
            style={styles.settingButton}
          >
            <Lock size={20} color="#666" />
            <Text style={styles.settingText}>Ganti Kata Sandi</Text>
          </TouchableOpacity>
          {isChangingPassword && (
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Kata Sandi Baru"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Konfirmasi Kata Sandi"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={handleChangePassword}
                style={styles.saveButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan Kata Sandi</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informasi Aplikasi</Text>
          <TouchableOpacity style={styles.settingButton}>
            <Info size={20} color="#666" />
            <Text style={styles.settingText}>VERSI APK 1.0</Text>
          </TouchableOpacity>
          
        
        </View>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={[styles.settingButton, { marginTop: 16 }]}
        >
          <Trash2 size={20} color="#EF4444" />
          <Text style={[styles.settingText, { color: '#EF4444' }]}>Hapus Akun</Text>
        </TouchableOpacity>
        
        {hasActiveOrders && (
          <Text style={styles.warningText}>
            *Tidak dapat menghapus akun karena masih memiliki pesanan aktif. Silahkan hubungi admin untuk bantuan.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 24,
    paddingTop: 10,
    backgroundColor: '#1E88E5', // Warna header diubah menjadi biru
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF', // Warna text diubah menjadi putih untuk kontras
    fontFamily: 'Poppins_600SemiBold',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    padding: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1E88E5', // Diubah untuk konsistensi warna biru
    borderRadius: 20,
    padding: 6,
  },
  name: {
    fontSize: 24,
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  email: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  verifiedText: {
    color: '#10b981',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  verifyButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#1E88E5', // Warna tombol diubah menjadi biru
    borderRadius: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1a1a1a',
    fontFamily: 'Poppins_600SemiBold',
  },
  editButton: {
    padding: 8,
  },
  infoContainer: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter_400Regular',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter_400Regular',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  saveButton: {
    backgroundColor: '#1E88E5', // Warna tombol diubah menjadi biru
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter_400Regular',
  },
  passwordContainer: {
    gap: 16,
    marginTop: 16,
  },
  warningText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});