import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Image, ActivityIndicator, Alert, TextInput 
} from 'react-native';
import { Camera, Image as ImageIcon, Sparkles, CheckCircle, Receipt, ShieldCheck } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { fetchApi, UserSession } from '../services/api';

export default function ReceiptScanScreen({ user }: { user: UserSession }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  const pickImageFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Galeriye erişim izni vermeniz gerekmektedir.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setBase64Data(result.assets[0].base64 || null);
      setMimeType(result.assets[0].mimeType || 'image/jpeg');
      setParsedResult(null);
    }
  };

  const takePhotoWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Kamera kullanım izni vermeniz gerekmektedir.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setBase64Data(result.assets[0].base64 || null);
      setMimeType(result.assets[0].mimeType || 'image/jpeg');
      setParsedResult(null);
    }
  };

  const handleScanReceipt = async () => {
    if (!base64Data) {
      Alert.alert('Görsel Eksik', 'Lütfen önce bir fiş fotoğrafı çekin veya galeriden seçin.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchApi('/api/receipts/upload', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          imageBase64: base64Data,
          mimeType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Fiş analiz edilemedi.');
      }

      setParsedResult(data.parsedReceipt);
    } catch (err: any) {
      Alert.alert('Fiş Analiz Hatası', err.message || 'Gemini Vision servisi yanıt vermedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAsTransaction = async () => {
    if (!parsedResult) return;

    setConfirming(true);
    try {
      const response = await fetchApi('/api/parse-transaction', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          inputText: `${parsedResult.merchantName} ${parsedResult.totalAmount} TL ${parsedResult.category}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Harcama kaydedilemedi.');
      }

      Alert.alert('✨ Başarılı', 'Fiş harcaması bütçenize kaydedildi!');
      setSelectedImage(null);
      setBase64Data(null);
      setParsedResult(null);
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Title Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerIcon}>
          <Receipt size={22} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.badgePill}>
            <Sparkles size={10} color="#a5b4fc" />
            <Text style={styles.badgeText}>GEMINI VISION OCR</Text>
          </View>
          <Text style={styles.title}>Fiş & Fatura Tarama</Text>
          <Text style={styles.subtitle}>Görselden anında harcama tutarını ve kategorisini ayırın</Text>
        </View>
      </View>

      {/* Action Pickers */}
      <View style={styles.pickerRow}>
        <TouchableOpacity style={styles.pickerBtn} onPress={takePhotoWithCamera} activeOpacity={0.8}>
          <Camera size={22} color="#ffffff" />
          <Text style={styles.pickerText}>Fotoğraf Çek</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.pickerBtn, styles.galleryBtn]} onPress={pickImageFromGallery} activeOpacity={0.8}>
          <ImageIcon size={22} color="#ffffff" />
          <Text style={styles.pickerText}>Galeriden Seç</Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview Card */}
      {selectedImage && (
        <View style={styles.previewCard}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />

          <TouchableOpacity 
            style={[styles.scanBtn, loading && styles.btnDisabled]} 
            onPress={handleScanReceipt}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.scanBtnContent}>
                <Sparkles size={18} color="#ffffff" />
                <Text style={styles.scanBtnText}>AI İle Analiz Et & Çözümle</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* OCR Result Card */}
      {parsedResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeaderRow}>
            <Text style={styles.resultHeaderTitle}>Yapay Zeka Fiş Analiz Sonucu</Text>
            {parsedResult.confidenceScore && (
              <View style={styles.confidenceChip}>
                <ShieldCheck size={12} color="#34d399" />
                <Text style={styles.confidenceText}>
                  %{(parsedResult.confidenceScore * 100).toFixed(0)} Doğruluk
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.inputFieldGroup}>
            <Text style={styles.fieldLabel}>İŞYERİ / MAĞAZA ADI</Text>
            <TextInput
              style={styles.fieldInput}
              value={parsedResult.merchantName}
              onChangeText={(text) => setParsedResult({ ...parsedResult, merchantName: text })}
            />
          </View>

          <View style={styles.inputFieldGroup}>
            <Text style={styles.fieldLabel}>KATEGORİ</Text>
            <TextInput
              style={[styles.fieldInput, { color: '#a5b4fc' }]}
              value={parsedResult.category}
              onChangeText={(text) => setParsedResult({ ...parsedResult, category: text })}
            />
          </View>

          <View style={styles.inputFieldGroup}>
            <Text style={styles.fieldLabel}>TOPLAM TUTAR (₺)</Text>
            <TextInput
              style={[styles.fieldInput, { color: '#34d399', fontSize: 16 }]}
              keyboardType="numeric"
              value={parsedResult.totalAmount?.toString()}
              onChangeText={(text) => setParsedResult({ ...parsedResult, totalAmount: parseFloat(text) || 0 })}
            />
          </View>

          <TouchableOpacity 
            style={styles.confirmBtn} 
            onPress={handleConfirmAsTransaction}
            disabled={confirming}
            activeOpacity={0.8}
          >
            {confirming ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.scanBtnContent}>
                <CheckCircle size={18} color="#ffffff" />
                <Text style={styles.scanBtnText}>Doğrula & Bütçeye Ekle</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712', // Slate-950
  },
  scrollContent: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#c7d2fe',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  galleryBtn: {
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
  },
  pickerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  previewCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 14,
  },
  scanBtn: {
    backgroundColor: '#059669',
    width: '100%',
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  resultCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  resultHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  confidenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  confidenceText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  inputFieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#030712',
    color: '#ffffff',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    fontSize: 14,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  confirmBtn: {
    backgroundColor: '#4f46e5',
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
});
