import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Linking
} from 'react-native';
import { Sparkles, Mail, Lock, LogIn, Eye, EyeOff, ShieldCheck, Cpu } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { fetchApi, saveUserSession } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const { googleWebClientId, googleIosClientId, googleAndroidClientId } =
  (Constants.expoConfig?.extra as Record<string, string>) || {};

export default function LoginScreen({ onLoginSuccess, onNavigateRegister }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleWebClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    webClientId: googleWebClientId,
  });

  const loginWithGoogleIdToken = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const response = await fetchApi('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, allowRegister: false }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404 && data.accountNotFound) {
          Alert.alert(
            'Hesap Bulunamadı',
            'Bu Google hesabına ait bir FinAI hesabı yok. KVKK metnini onaylayarak Kayıt Ol ekranından devam edin.',
            [{ text: 'Kayıt Ol\'a Git', onPress: onNavigateRegister }]
          );
          return;
        }
        throw new Error(data.message || 'Google ile giriş başarısız.');
      }

      const userSession = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        token: data.accessToken || data.token,
        isAdmin: data.user.isAdmin,
      };

      await saveUserSession(userSession);
      onLoginSuccess(userSession);
    } catch (err: any) {
      Alert.alert('Google ile Giriş Hatası', err.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setGoogleLoading(false);
    }
  };

  React.useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      loginWithGoogleIdToken(response.params.id_token);
    }
  }, [response]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Giriş başarısız.');
      }

      const userSession = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        token: data.accessToken || data.token,
        isAdmin: data.user.isAdmin,
      };

      await saveUserSession(userSession);
      onLoginSuccess(userSession);
    } catch (err: any) {
      Alert.alert('Giriş Hatası', err.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.prompt(
      'Şifre Sıfırlama E-Postası',
      'Lütfen kayıtlı e-posta adresinizi girin:',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'E-Posta Gönder',
          onPress: async (inputEmail?: string) => {
            const targetEmail = inputEmail?.trim() || email.trim();
            if (!targetEmail || !targetEmail.includes('@')) {
              Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
              return;
            }
            try {
              const res = await fetchApi('/api/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email: targetEmail }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.message);

              Alert.alert(
                '📩 E-Posta Gönderildi!',
                `Şifre sıfırlama bağlantısı ${targetEmail} adresine gönderildi.\n\nGmail uygulamanızı kontrol edip sıfırlama bağlantısına tıklayabilirsiniz.`,
                [
                  {
                    text: 'Gmail Uygulamasını Aç',
                    onPress: () => {
                      Linking.openURL('https://mail.google.com').catch(() => {
                        Linking.openURL('mailto:');
                      });
                    },
                  },
                  { text: 'Tamam', style: 'cancel' },
                ]
              );
            } catch (e: any) {
              Alert.alert('Hata', e.message || 'E-posta gönderilemedi.');
            }
          },
        },
      ],
      'plain-text',
      email || ''
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Background Glow Orbs */}
      <View style={styles.glowOrbTop} pointerEvents="none" />
      <View style={styles.glowOrbBottom} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Section */}
        <View style={styles.brandContainer}>
          <View style={styles.badgePill}>
            <Sparkles size={12} color="#a5b4fc" />
            <Text style={styles.badgeText}>CANLI YAPAY ZEKA FİNANS</Text>
          </View>

          <View style={styles.logoHalo}>
            <View style={styles.iconCircle}>
              <Sparkles size={34} color="#ffffff" />
            </View>
          </View>
          
          <Text style={styles.brandTitle}>FinAI Mobil</Text>
          <Text style={styles.brandSubtitle}>Akıllı Bütçe ve Nakit Akışı Yönetimi</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.topGradientBar} />

          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Hoş Geldiniz 👋</Text>
            <Text style={styles.cardSubTitle}>Hesabınıza erişmek için bilgilerinizi girin.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-POSTA ADRESİ</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#818cf8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-posta adresinizi giriniz"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ŞİFRE</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#818cf8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
                {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 16 }} onPress={handleForgotPassword}>
            <Text style={{ color: '#a5b4fc', fontSize: 12, fontWeight: '700' }}>Şifremi Unuttum?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.buttonContent} pointerEvents="none">
                <Text style={styles.buttonText}>Giriş Yap</Text>
                <LogIn size={18} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          {!!googleWebClientId && !googleWebClientId.startsWith('REPLACE_WITH') && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, (googleLoading || !request) && styles.buttonDisabled]}
                onPress={() => promptAsync()}
                disabled={googleLoading || !request}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#4f46e5" />
                ) : (
                  <Text style={styles.googleButtonText}>Google ile Giriş Yap</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.linkButton} onPress={onNavigateRegister} activeOpacity={0.7}>
            <Text style={styles.linkText}>Hesabınız yok mu? <Text style={styles.boldLink}>Hemen Kayıt Olun</Text></Text>
          </TouchableOpacity>
        </View>

        {/* Feature Badges Footer */}
        <View style={styles.footerBadges}>
          <View style={styles.footerChip}>
            <ShieldCheck size={12} color="#818cf8" />
            <Text style={styles.footerChipText}>256-Bit PII Maskeleme</Text>
          </View>
          <View style={styles.footerChip}>
            <Cpu size={12} color="#34d399" />
            <Text style={styles.footerChipText}>%98.4 AI Doğruluk</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712', // Deep slate-950
  },
  glowOrbTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(99, 102, 241, 0.25)', // Indigo ambient glow
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(124, 58, 237, 0.2)', // Purple ambient glow
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c7d2fe',
    letterSpacing: 0.8,
  },
  logoHalo: {
    padding: 6,
    borderRadius: 26,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(165, 180, 252, 0.4)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  topGradientBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#6366f1',
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardSubTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4f46e5',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e293b',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '800',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  boldLink: {
    color: '#818cf8',
    fontWeight: '800',
  },
  footerBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
  },
  footerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
  },
});
