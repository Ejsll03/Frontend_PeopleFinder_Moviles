// ─── App.js (entry point) ─────────────────────────────────────────────────────
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import SwipeScreen from './screens/SwipeScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import { Colors, Fonts } from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function resolveApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
}

const API_BASE_URL = resolveApiBaseUrl();

// ─── Tab bar personalizada ────────────────────────────────────────────────────
function TabIcon({ focused, icon, label }) {
  return (
    <View style={{ alignItems: 'center', gap: 3, minWidth: 82 }}>
      {focused && (
        <LinearGradient colors={[Colors.accent, Colors.accentPink]}
          style={{ position: 'absolute', bottom: -6, width: 28, height: 2.5, borderRadius: 2, opacity: 0.9 }} />
      )}
      <Ionicons
        name={icon}
        size={20}
        color={focused ? Colors.purple : 'rgba(255,255,255,0.35)'}
        style={{ opacity: focused ? 1 : 0.7 }}
      />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={{
          fontFamily: Fonts.sansMedium,
          fontSize: 10,
          lineHeight: 12,
          letterSpacing: 0.2,
          includeFontPadding: false,
          color: focused ? Colors.purple : 'rgba(255,255,255,0.3)',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Tab Navigator (pantallas principales) ────────────────────────────────────
function MainTabs({ currentUser, setCurrentUser }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 80,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <LinearGradient colors={[Colors.card, '#0d0818']} style={{ flex: 1 }} />
        ),
      }}
    >
      <Tab.Screen name="Descubrir" component={SwipeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="sparkles-outline" label="Descubrir" /> }} />
      <Tab.Screen name="Chats" component={ChatScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="chatbubble-ellipses-outline" label="Chats" /> }} />
      <Tab.Screen
        name="Perfil"
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="person-circle-outline" label="Perfil" /> }}
      >
        {(props) => (
          <ProfileScreen
            {...props}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            apiBaseUrl={API_BASE_URL}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ─── Stack Navigator raíz ─────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = React.useState(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={setCurrentUser}
                apiBaseUrl={API_BASE_URL}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Register">
            {(props) => (
              <RegisterScreen
                {...props}
                onRegisterSuccess={setCurrentUser}
                apiBaseUrl={API_BASE_URL}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Main">
            {(props) => (
              <MainTabs
                {...props}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
