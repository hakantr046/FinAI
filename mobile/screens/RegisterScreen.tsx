import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { Sparkles, User, Mail, Lock, UserPlus, Eye, EyeOff, Check, ChevronDown } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { fetchApi, saveUserSession } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const { googleWebClientId, googleIosClientId, googleAndroidClientId } =
  (Constants.expoConfig?.extra as Record<string, string>) || {};

const KVKK_TEXT = `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kayıt formunda paylaştığınız ad-soyad, e-posta adresi ve (varsa) Google hesap bilgileriniz; FinAI hesabınızın oluşturulması, kimlik doğrulaması, hizmetin sunulması ve yasal yükümlülüklerin yerine getirilmesi amacıyla veri sorumlusu sıfatıyla FinAI tarafından işlenmektedir. Verileriniz, KVKK'nın 5. ve 6. maddelerinde belirtilen işleme şartlarına uygun olarak, yalnızca hizmetin sunulması için gerekli süre boyunca saklanır ve açık rızanız ya da kanunda öngörülen istisnalar dışında üçüncü kişilerle paylaşılmaz. KVKK'nın 11. maddesi kapsamındaki haklarınızı (verilerinize erişme, düzeltme, silme, işlenmesine itiraz etme dahil) kullanmak için bizimle iletişime geçebilirsiniz.`;

export default function RegisterScreen({ onRegisterSuccess, onNavigateLogin, onLoginSuccess }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [kvkkExpanded, setKvkkExpanded] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleWebClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    webClientId: googleWebClientId,
  });

  const loginWithGoogleIdToken = async (idToken: string) => {
    if (!kvkkAccepted) {
      Alert.alert('KVKK Onayı Gerekli', 'Google ile devam etmeden önce KVKK Aydınlatma Metni\'ni onaylamalısınız.');
      return;
    }
    setGoogleLoading(true);
    try {
      const response = await fetchApi('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, allowRegister: true }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Google ile kayıt/giriş başarısız.');
      }

      const userSession = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        token: data.accessToken || data.token,
        isAdmin: data.user.isAdmin,
      };

      await saveUserSession(userSession);
      onLoginSuccess?.(userSession);
    } catch (err: any) {
      Alert.alert('Google ile Kayıt Hatası', err.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setGoogleLoading(false);
    }
  };

  React.useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      loginWithGoogleIdToken(response.params.id_token);
    }
  }, [response]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen ad, e-posta ve şifrenizi girin.');
      return;
    }

    if (!kvkkAccepted) {
      Alert.alert('KVKK Onayı Gerekli', 'Kayıt olabilmek için KVKK Aydınlatma Metni\'ni onaylamalısınız.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchApi('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Kayıt başarısız.');
      }

      Alert.alert('Tebrikler!', 'Kayıt başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: onNavigateLogin }
      ]);
    } catch (err: any) {
      Alert.alert('Kayıt Hatası', err.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandContainer}>
          <View style={styles.iconCircle}>
            <Sparkles size={32} color="#ffffff" />
          </View>
          <Text style={styles.brandTitle}>FinAI Mobil</Text>
          <Text style={styles.brandSubtitle}>Hemen Ücretsiz Hesabınızı Oluşturun</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kayıt Ol</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad Soyad</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adınız Soyadınız"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta Adresi</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ornek@domain.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="En az 6 karakter"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, (loading || !kvkkAccepted) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading || !kvkkAccepted}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.buttonContent} pointerEvents="none">
                <UserPlus size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Kayıt Ol</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* KVKK Consent */}
          <View style={styles.kvkkContainer}>
            <TouchableOpacity
              style={styles.kvkkRow}
              onPress={() => setKvkkAccepted(!kvkkAccepted)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, kvkkAccepted && styles.checkboxChecked]}>
                {kvkkAccepted && <Check size={13} color="#ffffff" strokeWidth={3} />}
              </View>
              <Text style={styles.kvkkText}>
                <Text style={styles.kvkkLink} onPress={() => setKvkkExpanded(!kvkkExpanded)}>KVKK Aydınlatma Metni'ni</Text>
                {' '}okudum, anladım ve kişisel verilerimin işlenmesini kabul ediyorum.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.kvkkToggle} onPress={() => setKvkkExpanded(!kvkkExpanded)} activeOpacity={0.7}>
              <Text style={styles.kvkkToggleText}>{kvkkExpanded ? 'Metni gizle' : 'Metnin tamamını göster'}</Text>
              <ChevronDown size={13} color="#64748b" style={{ transform: [{ rotate: kvkkExpanded ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>

            {kvkkExpanded && (
              <ScrollView style={styles.kvkkBox} nestedScrollEnabled>
                <Text style={styles.kvkkBoxText}>{KVKK_TEXT}</Text>
              </ScrollView>
            )}
          </View>

          {!!googleWebClientId && !googleWebClientId.startsWith('REPLACE_WITH') && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, (googleLoading || !request || !kvkkAccepted) && styles.buttonDisabled]}
                onPress={() => promptAsync()}
                disabled={googleLoading || !request || !kvkkAccepted}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#4f46e5" />
                ) : (
                  <Text style={styles.googleButtonText}>Google ile Kayıt Ol</Text>
                )}
              </TouchableOpacity>
              {!kvkkAccepted && (
                <Text style={styles.kvkkHint}>Google ile devam etmek için önce KVKK onayını işaretleyin.</Text>
              )}
            </>
          )}

          <TouchableOpacity style={styles.linkButton} onPress={onNavigateLogin} activeOpacity={0.7}>
            <Text style={styles.linkText}>Zaten hesabınız var mı? <Text style={styles.boldLink}>Giriş Yapın</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#ffffff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#6366f1',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  kvkkContainer: {
    marginTop: 14,
    gap: 8,
  },
  kvkkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  kvkkText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#94a3b8',
  },
  kvkkLink: {
    color: '#818cf8',
    fontWeight: '700',
  },
  kvkkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingLeft: 30,
  },
  kvkkToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  kvkkBox: {
    maxHeight: 130,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    marginLeft: 30,
  },
  kvkkBoxText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#94a3b8',
  },
  kvkkHint: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '800',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  boldLink: {
    color: '#818cf8',
    fontWeight: 'bold',
  },
});
