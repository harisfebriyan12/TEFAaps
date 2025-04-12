import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Key, LogIn } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeAnim] = useState(new Animated.Value(0));

  const ADMIN_SECRET_CODE = 'ADMIN123'; // (Di aplikasi nyata, simpan di environment)

  const handleRegister = useCallback(async () => {
    setError('');
    if (!name || !email || !password) {
      setError('Harap isi semua kolom!');
      triggerShake();
      return;
    }

    if (isAdmin && adminCode !== ADMIN_SECRET_CODE) {
      setError('Kode admin salah!');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Sukses!', 'Akun berhasil dibuat. Silakan masuk.');
      router.replace('/login');
    } catch (err) {
      setError(err.message || 'Gagal membuat akun. Coba lagi.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  }, [name, email, password, isAdmin, adminCode]);

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
          <Animated.View style={[styles.content, shakeStyle]}>
            <Animatable.View animation="fadeInDown" duration={1000} style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <User size={28} color="#fff" />
              </View>
              <Text style={styles.title}>Daftar Akun Baru</Text>
              <Text style={styles.subtitle}>Bergabung dengan komunitas kami</Text>
            </Animatable.View>

            {error && (
              <Animatable.View animation="fadeIn" duration={500} style={styles.errorBox}>
                <Key size={18} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </Animatable.View>
            )}

            <Animatable.View animation="fadeInUp" duration={800} style={styles.form}>
              <View style={styles.inputBox}>
                <User size={20} color="#A1A1AA" />
                <TextInput
                  style={styles.input}
                  placeholder="Nama Lengkap"
                  placeholderTextColor="#A1A1AA"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

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

              <View style={styles.adminSection}>
                <TouchableOpacity
                  onPress={() => setIsAdmin(!isAdmin)}
                  style={styles.checkboxContainer}
                >
                  <View style={[styles.checkbox, isAdmin && styles.checkboxChecked]}>
                    {isAdmin && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Daftar sebagai Admin</Text>
                </TouchableOpacity>

                {isAdmin && (
                  <Animatable.View animation="fadeIn" duration={500} style={styles.adminCodeBox}>
                    <TextInput
                      style={styles.adminInput}
                      placeholder="Masukkan Kode Admin"
                      placeholderTextColor="#A1A1AA"
                      value={adminCode}
                      onChangeText={setAdminCode}
                      secureTextEntry
                    />
                  </Animatable.View>
                )}
              </View>

              <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#7C3AED', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.registerButton, loading && styles.buttonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>DAFTAR SEKARANG</Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.loginText}>Sudah punya akun? </Text>
                <Link href="/login" style={styles.loginLink}>
                  Masuk di sini
                </Link>
              </View>
            </Animatable.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
};

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
    width: 60,
    height: 60,
    borderRadius: 30,
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
  adminSection: {
    marginVertical: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#7C3AED',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  checkboxLabel: {
    color: '#E5E7EB',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  adminCodeBox: {
    marginTop: 10,
    backgroundColor: 'rgba(63, 63, 70, 0.7)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(113, 113, 122, 0.3)',
  },
  adminInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  registerButton: {
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#E5E7EB',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  loginLink: {
    color: '#A78BFA',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default Register;