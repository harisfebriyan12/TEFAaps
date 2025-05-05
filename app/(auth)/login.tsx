import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
  Keyboard,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');

export default function Login() {
  // State variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Refs
  const passwordInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Font loading
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Animation and keyboard effect
  useEffect(() => {
    // Run animations only once when component mounts
    const animateIn = () => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    };
    
    animateIn();

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    // Clean up animations and listeners
    return () => {
      slideAnim.setValue(40);
      fadeAnim.setValue(0);
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle loading or error state for fonts
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#1E88E5" size="large" />
      </View>
    );
  }

  // If there was a font loading error, fallback to system fonts
  if (fontError) {
    console.warn('Error loading fonts:', fontError);
    // Continue with system fonts as fallback
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email && emailRegex.test(email.trim());
  };

  const validatePassword = (password) => {
    return password && password.length >= 6;
  };

  const handleLogin = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setError('');
      
      // Validate input fields
      if (!email.trim()) {
        setError('Email wajib diisi.');
        setTimeout(() => emailInputRef.current?.focus(), 100);
        return;
      }
      
      if (!password) {
        setError('Password wajib diisi.');
        setTimeout(() => passwordInputRef.current?.focus(), 100);
        return;
      }

      if (!validateEmail(email)) {
        setError('Format email tidak valid.');
        setTimeout(() => emailInputRef.current?.focus(), 100);
        return;
      }

      if (!validatePassword(password)) {
        setError('Password minimal 6 karakter.');
        setTimeout(() => passwordInputRef.current?.focus(), 100);
        return;
      }

      setLoading(true);
      
      // Firebase authentication
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // Get user data to determine role
      const docSnap = await getDoc(doc(db, 'users', user.uid));

      if (docSnap.exists()) {
        const userData = docSnap.data();
        
        // Redirect based on user role
        if (userData.role === 'admin') {
          router.replace('/admin');
        } else if (userData.role === 'student' || userData.role === 'siswa') {
          router.replace('/siswa');
        } else {
          router.replace('/(app)/(tabs)');
        }
      } else {
        setError('Data pengguna tidak ditemukan.');
        throw new Error('User data not found');
      }
    } catch (err) {
      console.error('Login error:', err.code, err.message);
      
      // More specific error messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email atau password salah.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Coba lagi nanti.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Masalah koneksi internet. Periksa koneksi Anda.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Akun Anda telah dinonaktifkan. Hubungi admin.');
      } else {
        setError('Gagal masuk. Silakan coba lagi.');
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Haptics.selectionAsync();
    router.push('/forgot-password');
  };

  const handleTogglePasswordVisibility = () => {
    Haptics.selectionAsync();
    setShowPassword(!showPassword);
  };

  const focusNextInput = () => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Gradient */}
          <LinearGradient
            colors={['#42A5F5', '#1E88E5', '#1565C0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.headerGradient,
              isKeyboardVisible && styles.headerGradientCompact
            ]}
          >
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/splash.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
              {!isKeyboardVisible && (
                <>
                  <Text style={styles.title}>Selamat Datang</Text>
                  <Text style={styles.subtitle}>Silahkan masuk untuk melanjutkan</Text>
                </>
              )}
            </View>
          </LinearGradient>
          
          {/* Login Form */}
          <View style={styles.formContainer}>
            <Animated.View 
              style={[
                styles.card,
                { 
                  transform: [{ translateY: slideAnim }],
                  opacity: fadeAnim
                }
              ]}
            >
              {error ? (
                <View style={styles.errorBox}>
                  <AlertTriangle size={18} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroupContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[
                  styles.inputContainer,
                  emailFocused && styles.inputContainerFocused
                ]}>
                  <View style={styles.inputIconContainer}>
                    <Mail size={20} color={(email || emailFocused) ? "#1E88E5" : "#6B7280"} />
                  </View>
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    placeholder="Masukkan alamat email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={focusNextInput}
                    blurOnSubmit={false}
                    autoComplete="email"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    testID="email-input"
                  />
                </View>
              </View>

              <View style={styles.inputGroupContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[
                  styles.inputContainer,
                  passwordFocused && styles.inputContainerFocused
                ]}>
                  <View style={styles.inputIconContainer}>
                    <Lock size={20} color={(password || passwordFocused) ? "#1E88E5" : "#6B7280"} />
                  </View>
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder="Masukkan password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    autoComplete="password"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    testID="password-input"
                  />
                  <TouchableOpacity 
                    onPress={handleTogglePasswordVisibility} 
                    style={styles.eyeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    testID="toggle-password-visibility"
                  >
                    {showPassword ? 
                      <EyeOff size={20} color={passwordFocused ? "#1E88E5" : "#6B7280"} /> : 
                      <Eye size={20} color={passwordFocused ? "#1E88E5" : "#6B7280"} />
                    }
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleForgotPassword} 
                style={styles.forgotPasswordContainer}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID="forgot-password-button"
              >
                <Text style={styles.forgotPassword}>Lupa Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleLogin} 
                disabled={loading} 
                style={[
                  styles.loginButton, 
                  loading && styles.disabledButton,
                  (!email || !password) && styles.inactiveButton
                ]}
                activeOpacity={0.8}
                testID="login-button"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginText}>Masuk</Text>
                    <ArrowRight size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Belum punya akun? </Text>
                <Link href="/register" asChild>
                  <TouchableOpacity testID="register-link">
                    <Text style={styles.registerLinkText}>Daftar</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerGradient: {
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerGradientCompact: {
    height: height * 0.20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 35,
    backgroundColor: 'white',
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    marginTop: -40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEEAEF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCCD8',
  },
  errorText: {
    fontFamily: 'Poppins_500Medium',
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  inputGroupContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputContainerFocused: {
    borderColor: '#1E88E5',
    borderWidth: 1.5,
    shadowColor: "#1E88E5",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIconContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 12,
  },
  eyeButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    height: '100%',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: 6,
  },
  forgotPassword: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#1E88E5',
  },
  loginButton: {
    backgroundColor: '#1E88E5',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    shadowColor: "#1976D2",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#90CAF9',
  },
  inactiveButton: {
    backgroundColor: '#90CAF9',
  },
  loginText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  registerLinkText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1E88E5',
  },
});