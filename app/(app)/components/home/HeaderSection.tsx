import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, SlideInLeft, SlideInRight, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient'; // tambahan untuk gradasi

interface HeaderSectionProps {
  user: any;
}

const HeaderSection = ({ user }: HeaderSectionProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <Animated.View entering={FadeIn.duration(800)}>
      <LinearGradient
        colors={['#2196F3', '#64B5F6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Animated.View entering={ZoomIn.duration(500)}>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <Image
                source={user?.photoURL ? { uri: user.photoURL } : require('../../../../assets/images/icon.png')}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.headerText}>
            {user ? (
              <>
                <Animated.Text
                  entering={SlideInRight.delay(100).duration(500)}
                  style={styles.greeting}
                >
                  {getGreeting()}, {user.name}
                </Animated.Text>
                <Animated.Text
                  entering={SlideInRight.delay(300).duration(500)}
                  style={styles.welcomeSubtext}
                >
                  Semoga harimu menyenangkan ✨
                </Animated.Text>
              </>
            ) : (
              <Text style={styles.greeting}>Memuat data pengguna...</Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerText: {
    marginLeft: 18,
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtext: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '400',
    color: '#E3F2FD',
    letterSpacing: 0.5,
  },
});

export default HeaderSection;
