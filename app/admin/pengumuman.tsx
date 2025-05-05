import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Bell, Plus, Trash2, Edit2, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedAnnouncement, setDeletedAnnouncement] = useState(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('targetAudience', 'array-contains', 'students')
      );
      const announcementsSnapshot = await getDocs(announcementsQuery);
      const announcementsData = announcementsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => (b.createdAt?.toDate?.() || new Date(b.createdAt)) - (a.createdAt?.toDate?.() || new Date(a.createdAt)));
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error loading announcements:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Gagal memuat pengumuman.',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateImageUrl = (url) => {
    if (!url) return true;
    const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif))$/i;
    return urlPattern.test(url);
  };

  const handleAddOrUpdateAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Judul dan konten wajib diisi.',
      });
      return;
    }

    if (imageUrl && !validateImageUrl(imageUrl)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'URL gambar tidak valid.',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const announcementRef = doc(db, 'announcements', editingId);
        await updateDoc(announcementRef, {
          title: title.trim(),
          content: content.trim(),
          imageUrl: imageUrl.trim() || null,
          updatedAt: serverTimestamp(),
        });
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: 'Pengumuman berhasil diperbarui.',
        });
      } else {
        await addDoc(collection(db, 'announcements'), {
          title: title.trim(),
          content: content.trim(),
          imageUrl: imageUrl.trim() || null,
          createdAt: serverTimestamp(),
          targetAudience: ['students'],
          createdBy: auth.currentUser.uid,
        });
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: 'Pengumuman berhasil ditambahkan.',
        });
      }
      setTitle('');
      setContent('');
      setImageUrl('');
      setEditingId(null);
      setImageError(null);
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Gagal ${editingId ? 'memperbarui' : 'menambahkan'} pengumuman.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setTitle(announcement.title);
    setContent(announcement.content);
    setImageUrl(announcement.imageUrl || '');
    setEditingId(announcement.id);
    setImageError(null);
  };

  const handleDeleteAnnouncement = async (id) => {
    const announcementToDelete = announcements.find(ann => ann.id === id);
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements(announcements.filter(ann => ann.id !== id));
      setDeletedAnnouncement(announcementToDelete);
      Toast.show({
        type: 'success',
        text1: 'Sukses',
        text2: 'Pengumuman dihapus.',
        autoHide: false,
        bottomOffset: 60,
        onPress: () => Toast.hide(),
        renderTrailingIcon: () => (
          <TouchableOpacity
            onPress={async () => {
              try {
                await addDoc(collection(db, 'announcements'), {
                  ...announcementToDelete,
                  createdAt: serverTimestamp(),
                });
                Toast.hide();
                loadAnnouncements();
              } catch (error) {
                console.error('Error undoing delete:', error);
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: 'Gagal mengembalikan pengumuman.',
                });
              }
            }}
            style={{ padding: 10 }}
          >
            <Text style={{ color: '#1D4ED8', fontWeight: '600' }}>Undo</Text>
          </TouchableOpacity>
        ),
      });
      setTimeout(() => {
        if (deletedAnnouncement?.id === id) setDeletedAnnouncement(null);
      }, 5000);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Gagal menghapus pengumuman.',
      });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredAnnouncements = announcements.filter(
    (ann) =>
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>
            {editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Judul Pengumuman"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Isi Pengumuman"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
          />
          <View style={styles.imageInputContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="URL Gambar (Opsional)"
              value={imageUrl}
              onChangeText={(text) => {
                setImageUrl(text);
                setImageError(null);
              }}
              keyboardType="url"
            />
            {imageUrl && (
              <TouchableOpacity
                onPress={() => {
                  setImageUrl('');
                  setImageError(null);
                }}
                style={styles.clearImageButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          {imageUrl && (
            <View style={styles.imagePreviewContainer}>
              {imageError ? (
                <Text style={styles.imageErrorText}>Gagal memuat gambar</Text>
              ) : (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.imagePreview}
                  onError={() => setImageError('URL gambar tidak valid')}
                  resizeMode="cover"
                />
              )}
            </View>
          )}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleAddOrUpdateAnnouncement}
            disabled={submitting}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {submitting ? 'Menyimpan...' : editingId ? 'Perbarui Pengumuman' : 'Tambah Pengumuman'}
            </Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setTitle('');
                setContent('');
                setImageUrl('');
                setEditingId(null);
                setImageError(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Batal Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Daftar Pengumuman</Text>
          <TextInput
            style={styles.input}
            placeholder="Cari pengumuman..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {loading ? (
            <ActivityIndicator size="large" color="#1D4ED8" style={styles.loadingSpinner} />
          ) : filteredAnnouncements.length > 0 ? (
            <View style={styles.announcementsList}>
              {filteredAnnouncements.map((announcement, index) => (
                <Animated.View
                  key={announcement.id}
                  entering={FadeInDown.delay(index * 100).duration(300)}
                  style={styles.announcementCard}
                >
                  <View style={styles.announcementIcon}>
                    <Bell size={20} color="#1D4ED8" />
                  </View>
                  <View style={styles.announcementContent}>
                    <Text style={styles.announcementTitle} numberOfLines={2}>
                      {announcement.title}
                    </Text>
                    <Text style={styles.announcementDate}>
                      {formatDate(announcement.createdAt)}
                    </Text>
                    <Text style={styles.announcementPreview} numberOfLines={2}>
                      {announcement.content}
                    </Text>
                    {announcement.imageUrl && (
                      <Image
                        source={{ uri: announcement.imageUrl }}
                        style={styles.announcementImage}
                        resizeMode="cover"
                        onError={() => {}}
                      />
                    )}
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditAnnouncement(announcement)}
                    >
                      <Edit2 size={20} color="#1D4ED8" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAnnouncement(announcement.id)}
                    >
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada pengumuman'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: { paddingTop: 60 },
      android: { paddingTop: 40 },
    }),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  imageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearImageButton: {
    padding: 10,
    marginLeft: 10,
  },
  imagePreviewContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  imageErrorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  announcementsList: {
    gap: 16,
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'center',
  },
  announcementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  announcementDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  announcementPreview: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
  },
  announcementImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 10,
  },
  deleteButton: {
    padding: 10,
  },
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingSpinner: {
    marginVertical: 20,
  },
});