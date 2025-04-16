import { useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
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
import * as SplashScreen from 'expo-splash-screen'; // ini perlu dari expo-splash-screen langsung
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();

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
        // Cegah splash langsung hilang
        await SplashScreen.preventAutoHideAsync();

        if (fontsLoaded || fontError) {
          // Tunggu minimal 1.5 detik agar splash terlihat
          setTimeout(async () => {
            await SplashScreen.hideAsync();
            router.replace('/login');
          }, 50000); // waktu ideal: 1800ms
        }
      } catch (err) {
        console.warn(err);
      }
    };

    prepare();
  }, [fontsLoaded, fontError]);

  // Jangan render dulu sebelum font siap
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <Slot />;
}
