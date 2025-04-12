import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { Svg, Circle, Path } from 'react-native-svg';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const spinValue = new Animated.Value(0);
  const progressAnim = new Animated.Value(0);
  const blinkAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 200000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        router.push('/login');
      }
    });

    progressAnim.addListener(({ value }) => {
      setProgress(Math.floor(value * 100));
    });

    // Blink footer text
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      progressAnim.removeAllListeners();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const Logo = () => (
    <Svg width={120} height={120} viewBox="0 0 120 120" style={styles.logo}>
      <Circle cx="60" cy="60" r="50" fill="#7C3AED" />
      <Path d="M60 30L75 50H45L60 30Z" fill="#FFFFFF" />
      <Path d="M60 90L45 70H75L60 90Z" fill="#FFFFFF" />
      <Path d="M30 60L50 45V75L30 60Z" fill="#FFFFFF" />
      <Path d="M90 60L70 75V45L90 60Z" fill="#FFFFFF" />
    </Svg>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        <Logo />

        <Text style={styles.title}>TEFAA APPS</Text>
        <Text style={styles.subtitle}>
          JOKI APLIKASI ANDA BERSAMA {'\n'}<Text style={styles.author}>TEFA BY HARIS FEBRIYAN</Text>
        </Text>

        <Animated.View style={{ transform: [{ rotate: spin }], marginVertical: 25 }}>
          <Svg width={40} height={40} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="40" stroke="#7C3AED" strokeWidth="8" fill="none" strokeDasharray="200" strokeDashoffset="100" />
          </Svg>
        </Animated.View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <Animated.Text style={[styles.footerText, { opacity: blinkAnim }]}>
          Memuat aplikasi...
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    marginBottom: 25,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  author: {
    fontWeight: '700',
    color: '#7C3AED',
  },
  progressContainer: {
    width: '80%',
    marginTop: 10,
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 30,
    fontStyle: 'italic',
  },
});
