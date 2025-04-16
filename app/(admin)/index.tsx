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

const { width, height } = Dimensions.get('window');

export default function LoadingScreen() {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const runnerAnim = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const subtextFade = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  
  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    // Logo scale and rotation animation
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ]).start();

    // Runner animation - more complex movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(runnerAnim, {
          toValue: -15,
          duration: 300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(runnerAnim, {
          toValue: 15,
          duration: 300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(runnerAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Text animations with staggered timing
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(subtextFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();
    }, 1200);

    // Progress bar animation
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 4000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Navigate to login after delay
    setTimeout(() => {
      router.push('/login');
    }, 4500);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient 
        colors={['#EEF2FF', '#F9FAFB', '#E0E7FF']}
        style={styles.container}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: logoScale },
                { rotate: spin }
              ],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Runner animation */}
        <Animated.View
          style={[styles.runnerContainer, {
            transform: [{ translateX: runnerAnim }],
          }]}
        >
          <Text style={styles.pushIcon}>🏃‍♂️</Text>
          
          {/* Dust effect */}
          <View style={styles.dustEffect}>
            <Text style={styles.dustParticle}></Text>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: textFade }]}>
          APLIKASI TEFAA
        </Animated.Text>

        <Animated.Text style={[styles.subtext, { opacity: subtextFade }]}>
          Kami Siap Mmebantu Anda
        </Animated.Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })}
            ]} 
          />
        </View>

        <Text style={styles.version}>v1.0.2 • Haris Febriyan</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 3,
    borderColor: '#F5F3FF',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  runnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    height: 60,
  },
  pushIcon: {
    fontSize: 46,
  },
  dustEffect: {
    position: 'absolute',
    left: -20,
  },
  dustParticle: {
    fontSize: 24,
    opacity: 0.7,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#4C1D95',
    marginBottom: 12,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(76, 29, 149, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtext: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 40,
  },
  progressContainer: {
    width: width * 0.7,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6D28D9',
    borderRadius: 3,
  },
  version: {
    position: 'absolute',
    bottom: 24,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});