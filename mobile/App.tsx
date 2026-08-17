import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { getSavedUser, UserSession } from './services/api';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import BottomTabNavigator from './navigation/BottomTabNavigator';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedUser()
      .then((session) => setUser(session))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {user ? (
        <BottomTabNavigator user={user} onLogout={() => setUser(null)} />
      ) : isRegisterMode ? (
        <RegisterScreen
          onRegisterSuccess={() => setIsRegisterMode(false)}
          onNavigateLogin={() => setIsRegisterMode(false)}
          onLoginSuccess={(session: UserSession) => setUser(session)}
        />
      ) : (
        <LoginScreen 
          onLoginSuccess={(session: UserSession) => setUser(session)} 
          onNavigateRegister={() => setIsRegisterMode(true)} 
        />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
