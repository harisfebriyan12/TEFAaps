import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
  const logoScale = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const subtextFade = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(subtextFade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 3500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      router.push('/(auth)/login');
    }, 4000);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.container}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/splash.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: textFade }]}>
          TEACHING FACTORY
        </Animated.Text>

        <Animated.Text style={[styles.subtext, { opacity: subtextFade }]}>
          Bersama Kami Tugas Anda Selesai
        </Animated.Text>

        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <Animated.Text style={[styles.loadingText, { opacity: subtextFade }]}>
          Memuat aplikasi...
        </Animated.Text>

        <Text style={styles.version}>v1.0.3 • Haris Febriyan</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#4F46E5',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#A5B4FC',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1E88E5',
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  subtext: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 36,
    fontStyle: 'italic',
  },
  progressContainer: {
    width: width * 0.6,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1E88E5',
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 10,
  },
  version: {
    position: 'absolute',
    bottom: 24,
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
