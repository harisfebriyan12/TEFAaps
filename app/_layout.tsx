import { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { View, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();

        if (fontsLoaded || fontError) {
          setTimeout(async () => {
            await SplashScreen.hideAsync();
            setIsLoading(false);
            setTimeout(() => {
              router.push('/(auth)/login');
            }, 500); // Add a small delay after animations before routing
          }, 1800); // Ideal splash screen time
        }
      } catch (err) {
        console.warn(err);
        setIsLoading(false);
      }
    };

    prepare();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Background circles */}
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
        
        {/* Logo with animations */}
        <Animated.View 
          entering={ZoomIn.duration(800).delay(200)}
          style={styles.logoContainer}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* App name or tagline with fade-in animation */}
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Large background circle positioned to top-right
  backgroundCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#F0F7FF',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  // Medium background circle positioned to bottom-left
  backgroundCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#E6F0FF',
    bottom: -width * 0.1,
    left: -width * 0.2,
  },
  // Small background circle positioned near center
  backgroundCircle3: {
    position: 'absolute',
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: '#F0F9FF',
    top: height * 0.15,
    left: width * 0.15,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 24,
  },
  logo: {
    width: width * 0.25,
    height: width * 0.25,
  },
  appName: {
    marginTop: 16,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: '#2563EB',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(37, 99, 235, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});