import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Camera, Target, Repeat, Bot, Shield } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import ReceiptScanScreen from '../screens/ReceiptScanScreen';
import GoalsScreen from '../screens/GoalsScreen';
import RecurringScreen from '../screens/RecurringScreen';
import AiChatScreen from '../screens/AiChatScreen';
import AdminScreen from '../screens/AdminScreen';
import { UserSession } from '../services/api';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator({ user, onLogout }: { user: UserSession; onLogout: () => void }) {
  // If user is Admin, strictly show ONLY the Admin Management screen
  if (user.isAdmin) {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: 'rgba(255, 255, 255, 0.08)',
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          },
          tabBarActiveTintColor: '#818cf8',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginTop: 2,
          },
        }}
      >
        <Tab.Screen 
          name="AdminPanel" 
          options={{
            tabBarLabel: 'Yönetici Paneli',
            tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />,
          }}
        >
          {() => <AdminScreen user={user} onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    );
  }

  // Standard user experience with personal budget tabs
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarActiveTintColor: '#818cf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        options={{
          tabBarLabel: 'Özet',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      >
        {() => <HomeScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen 
        name="ReceiptScan" 
        options={{
          tabBarLabel: 'Fiş Tara',
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
        }}
      >
        {() => <ReceiptScanScreen user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="Goals" 
        options={{
          tabBarLabel: 'Hedefler',
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      >
        {() => <GoalsScreen user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="Recurring" 
        options={{
          tabBarLabel: 'Giderler',
          tabBarIcon: ({ color, size }) => <Repeat size={size} color={color} />,
        }}
      >
        {() => <RecurringScreen user={user} />}
      </Tab.Screen>

      {/* AI Asistan sekmesi geçici olarak devre dışı
      <Tab.Screen
        name="AiChat"
        options={{
          tabBarLabel: 'AI Asistan',
          tabBarIcon: ({ color, size }) => <Bot size={size} color={color} />,
        }}
      >
        {() => <AiChatScreen user={user} />}
      </Tab.Screen>
      */}
    </Tab.Navigator>
  );
}
