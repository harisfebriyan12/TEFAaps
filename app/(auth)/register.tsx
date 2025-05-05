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
  Keyboard,
  Modal,
  Animated,
} from 'react-native';
import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, X, ChevronLeft, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

const { height, width } = Dimensions.get('window');

export default function Register() {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // UI state
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Form validation states
  const [nameValid, setNameValid] = useState(null);
  const [emailValid, setEmailValid] = useState(null);
  const [passwordValid, setPasswordValid] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-3 for strength indicator
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.5)).current;
  const successOpacityAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;
  const circleScaleAnim = useRef(new Animated.Value(0)).current;
  const confettiOpacityAnim = useRef(new Animated.Value(0)).current;
  const headerHeightAnim = useRef(new Animated.Value(height * 0.35)).current;
  const countdownAnim = useRef(new Animated.Value(3)).current;
  const modalBgAnim = useRef(new Animated.Value(0)).current;

  // Countdown timer ref
  const timerRef = useRef(null);
  const [countdown, setCountdown] = useState(3);

  // Animation ref
  const lottieRef = useRef(null);

  // Refs for input navigation
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Component mount animations
  useEffect(() => {
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

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(headerHeightAnim, {
          toValue: height * 0.2,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(headerHeightAnim, {
          toValue: height * 0.35,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Animation for error message
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(errorAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(errorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error]);

  // Start countdown timer when success modal shows
  useEffect(() => {
    if (showSuccessModal) {
      setCountdown(3);
      countdownAnim.setValue(3);
      
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          const newValue = prev - 1;
          countdownAnim.setValue(newValue);
          
          if (newValue <= 0) {
            clearInterval(timerRef.current);
          }
          return newValue;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [showSuccessModal]);

  // Animation for success modal
  const animateSuccess = () => {
    // Fade in modal background
    Animated.timing(modalBgAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Scale up modal
    Animated.spring(successScaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    // Fade in modal content
    Animated.timing(successOpacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Animate checkmark circle
    Animated.sequence([
      Animated.spring(circleScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
        delay: 150,
      }),
      Animated.spring(checkmarkScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Start confetti animation
    Animated.timing(confettiOpacityAnim, {
      toValue: 1,
      duration: 300,
      delay: 300,
      useNativeDriver: true,
    }).start();
    
    // Start lottie animation
    if (lottieRef.current) {
      setTimeout(() => {
        lottieRef.current.play();
      }, 300);
    }
  };

  // Validate name
  const validateName = (text) => {
    setName(text);
    if (text.length >= 3) {
      setNameValid(true);
    } else if (text.length > 0) {
      setNameValid(false);
    } else {
      setNameValid(null);
    }
  };

  // Validate email format
  const validateEmailFormat = (text) => {
    setEmail(text);
    if (text.length === 0) {
      setEmailValid(null);
      return;
    }
    
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(re.test(text));
  };

  // Validate password strength
  const validatePasswordStrength = (text) => {
    setPassword(text);
    if (text.length === 0) {
      setPasswordValid(null);
      setPasswordStrength(0);
      return;
    }
    
    // Basic password strength calculation
    let strength = 0;
    if (text.length >= 8) strength += 1;
    if (/[A-Z]/.test(text)) strength += 1;
    if (/[0-9]/.test(text)) strength += 1;
    if (/[^A-Za-z0-9]/.test(text)) strength += 1;
    
    setPasswordStrength(strength);
    setPasswordValid(strength >= 2);
  };

  // Handle registration
  const handleRegister = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');

    // Validate fields
    if (!name) {
      setError('Nama tidak boleh kosong');
      nameInputRef.current?.focus();
      return;
    }
    
    if (!email) {
      setError('Email tidak boleh kosong');
      emailInputRef.current?.focus();
      return;
    }
    
    if (!emailValid) {
      setError('Format email tidak valid');
      emailInputRef.current?.focus();
      return;
    }
    
    if (!password) {
      setError('Password tidak boleh kosong');
      passwordInputRef.current?.focus();
      return;
    }
    
    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      passwordInputRef.current?.focus();
      return;
    }
    
    if (passwordStrength < 2) {
      setError('Password terlalu lemah. Tambahkan huruf besar, angka, atau karakter khusus');
      passwordInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        role: 'user',
        createdAt: new Date().toISOString(),
      });
      
      // Show success message and trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset animation values
      successScaleAnim.setValue(0.5);
      successOpacityAnim.setValue(0);
      checkmarkScaleAnim.setValue(0);
      circleScaleAnim.setValue(0);
      confettiOpacityAnim.setValue(0);
      modalBgAnim.setValue(0);
      
      // Show success modal and start animations
      setShowSuccessModal(true);
      animateSuccess();
      
      // Auto-redirect after countdown finishes
      setTimeout(() => {
        if (countdown <= 0) {
          setShowSuccessModal(false);
          router.replace('/login');
        }
      }, 3000);
      
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('Email sudah digunakan. Silakan gunakan email lain.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password terlalu lemah, gunakan minimal 8 karakter.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Koneksi terputus. Periksa koneksi internet Anda.');
      } else {
        setError('Gagal mendaftar. Silakan coba lagi nanti.');
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // Handle login navigation
  const handleLoginNow = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    Haptics.selectionAsync();
    setShowSuccessModal(false);
    router.replace('/login');
  };

  // Handle back navigation
  const handleBack = () => {
    Haptics.selectionAsync();
    router.back();
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Gradient */}
          <Animated.View style={{ height: headerHeightAnim }}>
            <LinearGradient
              colors={['#42A5F5', '#1E88E5', '#1565C0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <Image source={require('../../assets/images/splash.png')} style={styles.logo} />
                {!isKeyboardVisible && (
                  <>
                    <Text style={styles.title}>Daftar Akun Baru</Text>
                    <Text style={styles.subtitle}>Buat akun dan mulai bersama kami</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Register Form */}
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
              {/* Error Alert */}
              {error ? (
                <Animated.View 
                  style={[
                    styles.errorBox,
                    { 
                      opacity: errorAnim,
                      transform: [{ translateY: errorAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0]
                      })}]
                    }
                  ]}
                >
                  <View style={styles.errorIconContainer}>
                    <AlertCircle size={20} color="#FFF" />
                  </View>
                  <View style={styles.errorTextContainer}>
                    <Text style={styles.errorTitle}>Error</Text>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeErrorButton}
                    onPress={() => setError('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={16} color="#9B1C1C" />
                  </TouchableOpacity>
                </Animated.View>
              ) : null}

              {/* Name Input */}
              <View style={styles.inputGroupContainer}>
                <View style={styles.labelContainer}>
                  <Text style={styles.inputLabel}>Nama Lengkap</Text>
                  {nameValid !== null && (
                    <Text style={nameValid ? styles.validText : styles.invalidText}>
                      {nameValid ? 'Valid' : 'Minimal 3 karakter'}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.inputContainer,
                  nameFocused && styles.inputContainerFocused,
                  nameValid === false && styles.inputContainerError,
                  nameValid === true && styles.inputContainerValid
                ]}>
                  <View style={[
                    styles.inputIconContainer,
                    nameValid === false && styles.inputIconError,
                    nameValid === true && styles.inputIconValid
                  ]}>
                    <User size={20} color={
                      nameValid === false ? "#EF4444" : 
                      nameValid === true ? "#10B981" : 
                      (name || nameFocused) ? "#1E88E5" : "#6B7280"
                    } />
                  </View>
                  <TextInput
                    ref={nameInputRef}
                    style={styles.input}
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={validateName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                  {nameValid === true && (
                    <View style={styles.validIndicator}>
                      <CheckCircle2 size={18} color="#10B981" />
                    </View>
                  )}
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroupContainer}>
                <View style={styles.labelContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  {emailValid !== null && (
                    <Text style={emailValid ? styles.validText : styles.invalidText}>
                      {emailValid ? 'Valid' : 'Format email tidak valid'}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.inputContainer,
                  emailFocused && styles.inputContainerFocused,
                  emailValid === false && styles.inputContainerError,
                  emailValid === true && styles.inputContainerValid
                ]}>
                  <View style={[
                    styles.inputIconContainer,
                    emailValid === false && styles.inputIconError,
                    emailValid === true && styles.inputIconValid
                  ]}>
                    <Mail size={20} color={
                      emailValid === false ? "#EF4444" : 
                      emailValid === true ? "#10B981" : 
                      (email || emailFocused) ? "#1E88E5" : "#6B7280"
                    } />
                  </View>
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    placeholder="Masukkan alamat email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={validateEmailFormat}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                  {emailValid === true && (
                    <View style={styles.validIndicator}>
                      <CheckCircle2 size={18} color="#10B981" />
                    </View>
                  )}
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroupContainer}>
                <View style={styles.labelContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  {passwordStrength > 0 && (
                    <Text 
                      style={[
                        styles.passwordStrengthText,
                        passwordStrength === 1 ? styles.passwordWeak : 
                        passwordStrength === 2 ? styles.passwordMedium : 
                        styles.passwordStrong
                      ]}
                    >
                      {passwordStrength === 1 ? 'Lemah' : 
                       passwordStrength === 2 ? 'Sedang' : 
                       'Kuat'}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.inputContainer,
                  passwordFocused && styles.inputContainerFocused,
                  passwordValid === false && styles.inputContainerError,
                  passwordValid === true && styles.inputContainerValid
                ]}>
                  <View style={[
                    styles.inputIconContainer,
                    passwordValid === false && styles.inputIconError,
                    passwordValid === true && styles.inputIconValid
                  ]}>
                    <Lock size={20} color={
                      passwordValid === false ? "#EF4444" : 
                      passwordValid === true ? "#10B981" : 
                      (password || passwordFocused) ? "#1E88E5" : "#6B7280"
                    } />
                  </View>
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder="Minimal 8 karakter"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={validatePasswordStrength}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity 
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowPassword(!showPassword);
                    }} 
                    style={styles.eyeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? 
                      <EyeOff size={20} color={passwordFocused ? "#1E88E5" : "#6B7280"} /> : 
                      <Eye size={20} color={passwordFocused ? "#1E88E5" : "#6B7280"} />
                    }
                  </TouchableOpacity>
                </View>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={[
                      styles.strengthBar, 
                      passwordStrength >= 1 ? styles.strengthActive : {},
                      passwordStrength === 1 ? styles.strengthWeak : {},
                    ]} />
                    <View style={[
                      styles.strengthBar, 
                      passwordStrength >= 2 ? styles.strengthActive : {},
                      passwordStrength === 2 ? styles.strengthMedium : {},
                    ]} />
                    <View style={[
                      styles.strengthBar, 
                      passwordStrength >= 3 ? styles.strengthActive : {},
                      passwordStrength >= 3 ? styles.strengthStrong : {},
                    ]} />
                    <View style={[
                      styles.strengthBar, 
                      passwordStrength >= 4 ? styles.strengthActive : {},
                      passwordStrength >= 4 ? styles.strengthStrong : {},
                    ]} />
                  </View>
                )}

                {password.length > 0 && (
                  <Text style={styles.passwordHintText}>
                    Password harus minimal 8 karakter. Tambahkan huruf besar, angka, dan simbol untuk keamanan lebih.
                  </Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity 
                onPress={handleRegister} 
                disabled={loading} 
                style={[
                  styles.registerButton, 
                  loading && styles.disabledButton,
                  (!name || !email || !password || !nameValid || !emailValid || !passwordValid) && styles.inactiveButton
                ]}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.registerText}>Daftar Sekarang</Text>
                    <ArrowRight size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Sudah punya akun? </Text>
                <Link href="/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.loginLinkText}>Masuk</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </View>
        </ScrollView>

        {/* Enhanced Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="none"
          statusBarTranslucent={true}
        >
          <Animated.View style={[
            styles.modalOverlay,
            { opacity: modalBgAnim }
          ]}>
            <View style={styles.modalBackground}>
              <Animated.View 
                style={[
                  styles.successModalContainer,
                  {
                    transform: [{ scale: successScaleAnim }],
                    opacity: successOpacityAnim
                  }
                ]}
              >
                {/* Confetti animation */}
                <Animated.View 
                  style={[
                    styles.confettiContainer,
                    { opacity: confettiOpacityAnim }
                  ]}
                >
            
                </Animated.View>
                
                {/* Success icon */}
                <View style={styles.successIconContainer}>
                  <Animated.View 
                    style={[
                      styles.successCircle,
                      {
                        transform: [{ scale: circleScaleAnim }]
                      }
                    ]}
                  >
                    <Animated.View 
                      style={{
                        transform: [{ scale: checkmarkScaleAnim }]
                      }}
                    >
                      <Check size={38} color="#FFFFFF" strokeWidth={2.5} />
                    </Animated.View>
                  </Animated.View>
                </View>
                
                {/* Success message */}
                <Text style={styles.successTitle}>Pendaftaran Berhasil!</Text>
                <Text style={styles.successMessage}>
                  Akun kamu berhasil dibuat. Silakan masuk untuk melanjutkan.
                </Text>
                
                {/* Countdown */}
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>
                    Kamu akan dialihkan otomatis dalam 
                  </Text>
                  <View style={styles.countdownBadge}>
                    <Animated.Text style={styles.countdownNumber}>
                      {countdown}
                    </Animated.Text>
                  </View>
                  <Text style={styles.countdownText}> detik</Text>
                </View>
                
                {/* CTA Buttons */}
                <View style={styles.successButtonsContainer}>
                  <TouchableOpacity
                    style={styles.loginNowButton}
                    onPress={handleLoginNow}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#42A5F5', '#1E88E5', '#1565C0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.loginNowButtonGradient}
                    >
                      <Text style={styles.loginNowButtonText}>Masuk Sekarang</Text>
                      <ArrowRight size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerGradient: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4
},
formContainer: {
  paddingHorizontal: 20,
  paddingTop: 30,
  paddingBottom: 40,
},
card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 5,
},
errorBox: {
  backgroundColor: '#FECACA',
  borderRadius: 12,
  padding: 12,
  marginBottom: 20,
  flexDirection: 'row',
  alignItems: 'center',
  borderLeftWidth: 4,
  borderLeftColor: '#EF4444',
},
errorIconContainer: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#EF4444',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
errorTextContainer: {
  flex: 1,
},
errorTitle: {
  fontFamily: 'Poppins_600SemiBold',
  fontSize: 14,
  color: '#9B1C1C',
  marginBottom: 2,
},
errorText: {
  fontFamily: 'Poppins_400Regular',
  fontSize: 13,
  color: '#7F1D1D',
},
closeErrorButton: {
  padding: 5,
},
inputGroupContainer: {
  marginBottom: 20,
},
labelContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
inputLabel: {
  fontFamily: 'Poppins_500Medium',
  fontSize: 14,
  color: '#374151',
},
validText: {
  fontFamily: 'Poppins_400Regular',
  fontSize: 13,
  color: '#10B981',
},
invalidText: {
  fontFamily: 'Poppins_400Regular',
  fontSize: 13,
  color: '#EF4444',
},
inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1.5,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  height: 52,
  backgroundColor: '#F9FAFB',
  paddingHorizontal: 2,
},
inputContainerFocused: {
  borderColor: '#1E88E5',
  backgroundColor: '#FFFFFF',
},
inputContainerError: {
  borderColor: '#EF4444',
  backgroundColor: '#FFFFFF',
},
inputContainerValid: {
  borderColor: '#10B981',
  backgroundColor: '#FFFFFF',
},
inputIconContainer: {
  width: 48,
  height: 48,
  justifyContent: 'center',
  alignItems: 'center',
},
inputIconError: {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  borderRadius: 10,
  marginLeft: 2,
},
inputIconValid: {
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  borderRadius: 10,
  marginLeft: 2,
},
input: {
  flex: 1,
  fontFamily: 'Poppins_400Regular',
  fontSize: 14,
  color: '#1F2937',
  paddingVertical: 12,
},
eyeButton: {
  padding: 10,
  marginRight: 5,
},
validIndicator: {
  marginRight: 12,
},
passwordStrengthContainer: {
  flexDirection: 'row',
  marginTop: 10,
  height: 4,
},
strengthBar: {
  flex: 1,
  backgroundColor: '#E5E7EB',
  borderRadius: 2,
  marginHorizontal: 2,
},
strengthActive: {
  backgroundColor: '#10B981',
},
strengthWeak: {
  backgroundColor: '#EF4444',
},
strengthMedium: {
  backgroundColor: '#F59E0B',
},
strengthStrong: {
  backgroundColor: '#10B981',
},
passwordStrengthText: {
  fontFamily: 'Poppins_500Medium',
  fontSize: 13,
},
passwordWeak: {
  color: '#EF4444',
},
passwordMedium: {
  color: '#F59E0B',
},
passwordStrong: {
  color: '#10B981',
},
passwordHintText: {
  fontFamily: 'Poppins_400Regular',
  fontSize: 12,
  color: '#6B7280',
  marginTop: 8,
  lineHeight: 18,
},
registerButton: {
  backgroundColor: '#1E88E5',
  borderRadius: 12,
  height: 52,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 10,
  shadowColor: '#1E88E5',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
},
disabledButton: {
  backgroundColor: '#94A3B8',
  shadowColor: '#94A3B8',
},
inactiveButton: {
  backgroundColor: '#90CAF9',
  shadowOpacity: 0.2,
},
registerText: {
  fontFamily: 'Poppins_600SemiBold',
  fontSize: 16,
  color: '#FFFFFF',
},
buttonIcon: {
  marginLeft: 8,
},
loginContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 20,
},
loginText: {
  fontFamily: 'Poppins_400Regular',
  fontSize: 14,
  color: '#6B7280',
},
loginLinkText: {
  fontFamily: 'Poppins_600SemiBold',
  fontSize: 14,
  color: '#1E88E5',
},

// Enhanced Success Modal Styles
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(17, 24, 39, 0.7)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalBackground: {
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},
successModalContainer: {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  width: '100%',
  padding: 24,
  alignItems: 'center',
  overflow: 'hidden',
  maxWidth: 340,
  elevation: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.15,
  shadowRadius: 24,
},
confettiContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 0,
},
confettiAnimation: {
  width: 400,
  height: 400,
  position: 'absolute',
  zIndex: 0,
},
successIconContainer: {
  marginVertical: 20,
  zIndex: 1,
},
successCircle: {
  width: 90,
  height: 90,
  borderRadius: 45,
  backgroundColor: '#10B981',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#10B981',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
},
successTitle: {
  fontFamily: 'Poppins_700Bold',
  fontSize: 22,
  color: '#111827',
  textAlign: 'center',
  marginTop: 12,
  zIndex: 1,
},
successMessage: {
  fontFamily: 'Poppins_400Regular',
  fontSize: 15,
  color: '#4B5563',
  textAlign: 'center',
  marginTop: 8,
  lineHeight: 22,
  marginHorizontal: 10,
  zIndex: 1,
},
countdownContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 16,
  marginBottom: 8,
  zIndex: 1,
},
countdownText: {
  fontFamily: 'Poppins_400Regular',
  fontSize: 14,
  color: '#6B7280',
},
countdownBadge: {
  backgroundColor: '#EFF6FF',
  borderRadius: 10,
  width: 24,
  height: 24,
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 4,
},
countdownNumber: {
  fontFamily: 'Poppins_700Bold',
  fontSize: 14,
  color: '#2563EB',
},
successButtonsContainer: {
  width: '100%',
  marginTop: 20,
  zIndex: 1,
},
loginNowButton: {
  width: '100%',
  height: 52,
  borderRadius: 12,
  overflow: 'hidden',
  shadowColor: '#1E88E5',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
},
loginNowButtonGradient: {
  width: '100%',
  height: '100%',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
},
loginNowButtonText: {
  fontFamily: 'Poppins_600SemiBold',
  fontSize: 16,
  color: '#FFFFFF',
},
});