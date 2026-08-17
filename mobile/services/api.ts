import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Standard localhost for Web/Simulator, 192.168.1.13 for Physical Phone, 10.0.2.2 for Android Emulator
export const API_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:5115'
  : 'http://192.168.1.13:5115';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  token: string;
  isAdmin: boolean;
}

export const getSavedUser = async (): Promise<UserSession | null> => {
  try {
    const json = await AsyncStorage.getItem('finai_user');
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
};

export const saveUserSession = async (user: UserSession): Promise<void> => {
  await AsyncStorage.setItem('finai_user', JSON.stringify(user));
};

export const clearUserSession = async (): Promise<void> => {
  await AsyncStorage.removeItem('finai_user');
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const user = await getSavedUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (user?.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return fetch(url, { ...options, headers });
};
