import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Clock, Trophy, DollarSign, Shield } from 'lucide-react-native';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

const gameData = {
  'mobile-legends': {
    name: 'Mobile Legends',
    image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=800',
    description: 'Professional boosting service for Mobile Legends. Get to your desired rank with our experienced players.',
    services: [
      {
        id: 'rank-boost',
        name: 'Rank Boosting',
        price: 50,
        duration: '2-3 days',
        description: 'Boost your account to your desired rank',
      },
      {
        id: 'classic-matches',
        name: 'Classic Matches',
        price: 30,
        duration: '1-2 days',
        description: 'Play classic matches to improve win rate',
      },
      {
        id: 'custom-games',
        name: 'Custom Games',
        price: 40,
        duration: '1 day',
        description: 'Custom game training with pro players',
      },
    ],
  },
  'pubg-mobile': {
    name: 'PUBG Mobile',
    image: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=800',
    description: 'Expert PUBG Mobile boosting services. Improve your stats and reach higher tiers.',
    services: [
      {
        id: 'rank-push',
        name: 'Rank Push',
        price: 60,
        duration: '3-4 days',
        description: 'Push your account to higher tiers',
      },
      {
        id: 'kd-improvement',
        name: 'K/D Improvement',
        price: 45,
        duration: '2-3 days',
        description: 'Improve your Kill/Death ratio',
      },
      {
        id: 'achievement',
        name: 'Achievement Completion',
        price: 35,
        duration: '1-2 days',
        description: 'Complete specific achievements',
      },
    ],
  },
  'valorant': {
    name: 'Valorant',
    image: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=800',
    description: 'Professional Valorant boosting and coaching services. Reach your peak performance.',
    services: [
      {
        id: 'rank-boost',
        name: 'Rank Boosting',
        price: 70,
        duration: '3-4 days',
        description: 'Boost your competitive rank',
      },
      {
        id: 'placement',
        name: 'Placement Matches',
        price: 50,
        duration: '1-2 days',
        description: 'Professional play of placement matches',
      },
      {
        id: 'agent-training',
        name: 'Agent Training',
        price: 40,
        duration: '2-3 hours',
        description: 'Specific agent gameplay training',
      },
    ],
  },
};

export default function GameDetails() {
  const { id } = useLocalSearchParams();
  const game = gameData[id as keyof typeof gameData];
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [currentRank, setCurrentRank] = useState('');
  const [targetRank, setTargetRank] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!game) {
    router.replace('/');
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedService) {
      setError('Please select a service');
      return;
    }

    if (!currentRank || !targetRank) {
      setError('Please fill in your current and target ranks');
      return;
    }

    try {
      const service = game.services.find(s => s.id === selectedService);
      await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser?.uid,
        gameId: id,
        gameName: game.name,
        serviceId: selectedService,
        serviceName: service?.name,
        currentRank,
        targetRank,
        notes,
        status: 'pending',
        price: service?.price,
        createdAt: new Date().toISOString(),
      });

      router.push('/orders');
    } catch (err) {
      setError('Failed to submit order. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: game.image }} style={styles.headerImage} />
        <View style={styles.headerOverlay} />
        <Text style={styles.title}>{game.name}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>{game.description}</Text>

        <Text style={styles.sectionTitle}>Available Services</Text>
        {game.services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              selectedService === service.id && styles.selectedService,
            ]}
            onPress={() => setSelectedService(service.id)}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>${service.price}</Text>
            </View>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            <View style={styles.serviceDetails}>
              <View style={styles.serviceDetail}>
                <Clock size={16} color="#666" />
                <Text style={styles.serviceDetailText}>{service.duration}</Text>
              </View>
              <View style={styles.serviceDetail}>
                <Shield size={16} color="#666" />
                <Text style={styles.serviceDetailText}>Safe & Secure</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Order Details</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Rank</Text>
            <TextInput
              style={styles.input}
              value={currentRank}
              onChangeText={setCurrentRank}
              placeholder="Enter your current rank"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Target Rank</Text>
            <TextInput
              style={styles.input}
              value={targetRank}
              onChangeText={setTargetRank}
              placeholder="Enter your desired rank"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any specific requirements or preferences"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Continue to Payment</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 10,
  },
  title: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
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
    height: 100,
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