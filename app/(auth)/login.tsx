import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Mail, Lock, ArrowRight, User, Eye, EyeOff, Key, LogIn } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));

  // Animasi saat komponen muncul
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email dan password harus diisi!');
      triggerShake();
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Ambil data pengguna dari Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/(app)/(tabs)');
        }
      } else {
        setError('Akun tidak ditemukan!');
        triggerShake();
      }
    } catch (err) {
      setError('Email atau password salah!');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Animasi error shake
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const shakeStyle = {
    transform: [{ translateX: shakeAnim }],
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      }}
      style={styles.background}
      blurRadius={3}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)']}
        style={styles.gradientOverlay}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }, shakeStyle]}>
            <Animatable.View animation="fadeInDown" duration={1500} style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <LogIn size={32} color="#fff" />
              </View>
              <Text style={styles.title}>Masuk ke Akun Anda</Text>
              <Text style={styles.subtitle}>Silakan isi email dan password</Text>
            </Animatable.View>

            {error && (
              <Animatable.View animation="fadeIn" duration={500} style={styles.errorBox}>
                <Key size={18} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </Animatable.View>
            )}

            <Animatable.View animation="fadeInUp" duration={1000} style={styles.form}>
              <View style={styles.inputBox}>
                <Mail size={20} color="#A1A1AA" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#A1A1AA"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputBox}>
                <Lock size={20} color="#A1A1AA" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#A1A1AA"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#A78BFA" />
                  ) : (
                    <Eye size={20} color="#A78BFA" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#7C3AED', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.loginButton, loading && styles.buttonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>MASUK</Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Link href="/forgot-password" style={styles.forgotLink}>
                  Lupa Password?
                </Link>
                <View style={styles.registerText}>
                  <Text style={{ color: '#E5E7EB' }}>Belum punya akun? </Text>
                  <Link href="/register" style={styles.registerLink}>
                    Daftar Sekarang
                  </Link>
                </View>
              </View>
            </Animatable.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoCircle: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.5)',
    marginBottom: 15,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#A1A1AA',
  },
  form: {
    gap: 15,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(63, 63, 70, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(113, 113, 122, 0.3)',
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 5,
  },
  loginButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 15,
    gap: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  forgotLink: {
    color: '#A78BFA',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  registerText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerLink: {
    color: '#A78BFA',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});