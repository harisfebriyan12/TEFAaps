import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Trophy,
  DollarSign,
  Shield,
  FileCheck,
  Code,
  Smartphone,
  Palette,
} from 'lucide-react-native';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

const serviceData = {
  'web-development': {
    name: 'Joki Website',
    image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800',
    description:
      'Jasa pembuatan dan pengembangan website profesional. Kami membantu Anda membuat website yang responsif, modern, dan sesuai kebutuhan.',
    services: [
      {
        id: 'landing-page',
        name: 'Landing Page',
        price: 500000,
        duration: '3-5 hari',
        description: 'Website landing page responsif dengan desain modern',
      },
      {
        id: 'company-website',
        name: 'Website Perusahaan',
        price: 2000000,
        duration: '7-14 hari',
        description: 'Website perusahaan lengkap dengan CMS',
      },
      {
        id: 'e-commerce',
        name: 'E-Commerce',
        price: 5000000,
        duration: '14-21 hari',
        description: 'Website toko online lengkap dengan sistem pembayaran',
      },
    ],
  },
  'mobile-development': {
    name: 'Joki Mobile App',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    description:
      'Jasa pembuatan aplikasi mobile untuk Android dan iOS. Kembangkan ide Anda menjadi aplikasi yang powerful dan user-friendly.',
    services: [
      {
        id: 'mvp',
        name: 'MVP Development',
        price: 750000,
        duration: '5-7 hari',
        description: 'Aplikasi mobile sederhana untuk validasi ide',
      },
      {
        id: 'full-app',
        name: 'Full App Development',
        price: 3000000,
        duration: '14-21 hari',
        description: 'Aplikasi mobile lengkap dengan backend',
      },
      {
        id: 'app-maintenance',
        name: 'App Maintenance',
        price: 1000000,
        duration: 'per bulan',
        description: 'Pemeliharaan dan update aplikasi mobile',
      },
    ],
  },
  'ui-design': {
    name: 'Joki UI/UX Design',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
    description:
      'Jasa desain UI/UX profesional untuk website dan aplikasi mobile. Buat interface yang menarik dan mudah digunakan.',
    services: [
      {
        id: 'ui-design',
        name: 'UI Design',
        price: 400000,
        duration: '3-5 hari',
        description: 'Desain interface untuk website atau aplikasi',
      },
      {
        id: 'ux-research',
        name: 'UX Research',
        price: 1000000,
        duration: '7-10 hari',
        description: 'Penelitian pengguna dan wireframing',
      },
      {
        id: 'design-system',
        name: 'Design System',
        price: 2000000,
        duration: '10-14 hari',
        description: 'Sistem desain lengkap untuk produk digital',
      },
    ],
  },
};

const ServiceIcon = {
  'web-development': Code,
  'mobile-development': Smartphone,
  'ui-design': Palette,
};

export default function ServiceDetails() {
  const { id } = useLocalSearchParams();
  const service = serviceData[id as keyof typeof serviceData];
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState('');
  const [timeline, setTimeline] = useState('');
  const [error, setError] = useState('');

  const Icon = ServiceIcon[id as keyof typeof ServiceIcon];

  if (!service) {
    router.replace('/');
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedService) {
      setError('Silakan pilih layanan');
      return;
    }

    if (!projectDetails.trim()) {
      setError('Silakan isi detail project');
      return;
    }

    try {
      const selectedServiceData = service.services.find(
        (s) => s.id === selectedService
      );
      await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser?.uid,
        serviceId: id,
        serviceName: service.name,
        packageId: selectedService,
        packageName: selectedServiceData?.name,
        description: projectDetails,
        timeline: timeline,
        status: 'pending',
        price: selectedServiceData?.price,
        createdAt: new Date().toISOString(),
      });

      router.push('/payment');
    } catch (err) {
      setError('Gagal membuat pesanan. Silakan coba lagi.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: service.image }} style={styles.headerImage} />
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <Icon size={40} color="#fff" />
          <Text style={styles.title}>{service.name}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>{service.description}</Text>

        <Text style={styles.sectionTitle}>Pilihan Paket</Text>
        {service.services.map((serviceOption) => (
          <TouchableOpacity
            key={serviceOption.id}
            style={[
              styles.serviceCard,
              selectedService === serviceOption.id && styles.selectedService,
            ]}
            onPress={() => setSelectedService(serviceOption.id)}
          >
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{serviceOption.name}</Text>
              <Text style={styles.servicePrice}>
                Rp {serviceOption.price.toLocaleString('id-ID')}
              </Text>
            </View>
            <Text style={styles.serviceDescription}>
              {serviceOption.description}
            </Text>
            <View style={styles.serviceDetails}>
              <View style={styles.serviceDetail}>
                <Clock size={16} color="#666" />
                <Text style={styles.serviceDetailText}>
                  {serviceOption.duration}
                </Text>
              </View>
              <View style={styles.serviceDetail}>
                <Shield size={16} color="#666" />
                <Text style={styles.serviceDetailText}>Garansi Revisi</Text>
              </View>
              <View style={styles.serviceDetail}>
                <FileCheck size={16} color="#666" />
                <Text style={styles.serviceDetailText}>Source Code</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Detail Project</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Deskripsi Project</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={projectDetails}
              onChangeText={setProjectDetails}
              placeholder="Jelaskan detail project Anda"
              multiline
              numberOfLines={Platform.OS === 'ios' ? undefined : 4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Link Rekomendasi Web/aplikasi Sebagai Referensi </Text>
            <TextInput
              style={styles.input}
              value={timeline}
              onChangeText={setTimeline}
              placeholder="Masukkan Disini "
            />
          </View>

          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Lanjut ke Pembayaran</Text>
            <DollarSign size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 250,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  headerContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 10,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    marginTop: 16,
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1a1a1a',
    marginBottom: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f5f5f5',
  },
  selectedService: {
    borderColor: '#7C3AED',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    color: '#1a1a1a',
    fontFamily: 'Poppins_600SemiBold',
  },
  servicePrice: {
    fontSize: 18,
    color: '#7C3AED',
    fontFamily: 'Poppins_700Bold',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Inter_400Regular',
  },
  serviceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  error: {
    color: '#ef4444',
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
});