import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Phone,
  Github,
  Linkedin,
  Instagram,
  BookOpen,
  Goal,
  Award,
  Calendar,
  Laptop,
  School,
} from 'lucide-react-native';

// Import gambar lokal menggunakan require untuk performa dan reliabilitas yang lebih baik
const IMAGES = {
  appLogo: require('../../../assets/images/icon.png'),
  developer: require('../../../assets/images/foto.png'),
};

export default function AboutUs() {
  const handleGoBack = () => {
    router.back();
  };

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch((err) => {
      console.error('Terjadi kesalahan saat membuka tautan: ', err);
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleGoBack} 
          style={styles.backButton}
          accessibilityLabel="Kembali"
          accessibilityHint="Kembali ke layar sebelumnya"
        >
          <ArrowLeft size={24} color="#7C3AED" />
        </TouchableOpacity>
        <Text style={styles.title}>Tentang Kami</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Bagian Informasi Aplikasi */}
        <View style={styles.appSection}>
          <Text style={styles.sectionTitle}>Aplikasi TEFA</Text>
        
          <Text style={styles.appDescription}>
            Aplikasi TEFA merupakan platform inovatif yang dikembangkan sebagai
            bagian dari program Teaching Factory di Perguruan Tinggi. Aplikasi
            ini dirancang untuk membantu mahasiswa mengintegrasikan pembelajaran
            teoretis dengan praktik industri yang relevan.
          </Text>
        </View>

        {/* Bagian Visi & Misi - dipindahkan ke bagian atas */}
        <View style={styles.visionSection}>
          <Text style={styles.sectionTitle}>Visi & Misi</Text>
          <View style={styles.missionCard}>
            <View style={styles.missionItem}>
              <View style={styles.missionIconContainer}>
                <BookOpen size={24} color="#7C3AED" />
              </View>
              <Text style={styles.missionTitle}>Visi</Text>
              <Text style={styles.missionText}>
                Menjadi platform pembelajaran terdepan yang menghubungkan dunia
                akademik dengan kebutuhan industri, menciptakan generasi digital
                yang siap bersaing di era industri 4.0.
              </Text>
            </View>

            <View style={styles.missionItem}>
              <View style={styles.missionIconContainer}>
                <Goal size={24} color="#7C3AED" />
              </View>
              <Text style={styles.missionTitle}>Misi</Text>
              <View style={styles.missionListContainer}>
                {[
                  'Mengembangkan aplikasi yang berfokus pada pengalaman pengguna',
                  'Memfasilitasi pembelajaran praktis berbasis proyek',
                  'Menyediakan platform kolaborasi antara mahasiswa, dosen dan industri',
                  'Mendorong inovasi dalam pendidikan kejuruan'
                ].map((item, index) => (
                  <View key={index} style={styles.missionListItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.missionListText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Bagian Prestasi & Pengalaman */}
        <View style={styles.achievementSection}>
          <Text style={styles.sectionTitle}>Prestasi & Pengalaman</Text>
          <View style={styles.achievementCard}>
            {[
              'Finalis Kompetisi Aplikasi Mobile Tingkat Nasional 2023',
              'Asisten Dosen Pemrograman Mobile 2023-2024'
            ].map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <Award size={20} color="#7C3AED" />
                <Text style={styles.achievementText}>{achievement}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bagian Pengembang - dipindahkan ke bagian bawah */}
        <View style={styles.developerSection}>
          <Text style={styles.sectionTitle}>Pengembang</Text>
          <View style={styles.developerCard}>
            <Image
              source={IMAGES.developer}
              style={styles.developerImage}
              resizeMode="cover"
            />
            <Text style={styles.developerName}>Haris Febriyan</Text>
            <Text style={styles.developerTitle}>
              Pengembang Full Stack & Desainer UI/UX
            </Text>

            <View style={styles.bioSection}>
              <View style={styles.bioItem}>
                <School size={20} color="#7C3AED" />
                <Text style={styles.bioText}>
                  Mahasiswa Informatika Semester 6
                </Text>
              </View>
              <View style={styles.bioItem}>
                <Laptop size={20} color="#7C3AED" />
                <Text style={styles.bioText}>
                  Spesialisasi: Pengembangan Aplikasi Mobile
                </Text>
              </View>
              <View style={styles.bioItem}>
                <Calendar size={20} color="#7C3AED" />
                <Text style={styles.bioText}>Angkatan 2022</Text>
              </View>
            </View>

            <View style={styles.contactSection}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleOpenLink('mailto:haris.febriyan.stmik@krw.horizon.ac.id')}
                accessibilityLabel="Email Pengembang"
                accessibilityHint="Membuka aplikasi email untuk menghubungi pengembang"
              >
                <Mail size={20} color="#7C3AED" />
                <Text style={styles.contactText}>haris.febriyan.stmik@krw.horizon.ac.id</Text>
              </TouchableOpacity>
              
            
            </View>

            <View style={styles.socialLinks}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleOpenLink('https://github.com/harisfebriyan')}
                accessibilityLabel="Profil GitHub"
              >
                <Github size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleOpenLink('https://linkedin.com/in/harisfebriyan')}
                accessibilityLabel="Profil LinkedIn"
              >
                <Linkedin size={24} color="#0077B5" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleOpenLink('https://instagram.com/sylent02')}
                accessibilityLabel="Profil Instagram"
              >
                <Instagram size={24} color="#E1306C" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bagian Versi */}
        <View style={styles.versionSection}>
          <Image 
            source={IMAGES.appLogo} 
            style={styles.footerLogo} 
            resizeMode="contain"
          />
          <Text style={styles.versionText}>Aplikasi TEFA Versi 1.0</Text>
          <Text style={styles.copyrightText}>
            © 2025 TEFA. Hak Cipta Dilindungi.
          </Text>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#fff',
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
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    color: '#1a1a1a',
    fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    padding: 24,
  },
  appSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1a1a1a',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 16,
  },
  appImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  developerSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  developerCard: {
    alignItems: 'center',
  },
  developerImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  developerName: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  developerTitle: {
    fontSize: 16,
    color: '#7C3AED',
    fontFamily: 'Inter_500Medium',
    marginBottom: 16,
  },
  bioSection: {
    width: '100%',
    marginBottom: 20,
  },
  bioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  contactSection: {
    width: '100%',
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Inter_400Regular',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  visionSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  missionCard: {
    gap: 24,
  },
  missionItem: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
  },
  missionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  missionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  missionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  missionListContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  missionListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
    marginTop: 8,
    marginRight: 10,
  },
  missionListText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  achievementSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementCard: {
    gap: 14,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  achievementText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  versionSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
    borderRadius: 40, // setengah dari 80
    overflow: 'hidden', // opsional, biar isinya juga ikut bulet
  },  
  versionText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
});