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
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import SwipeScreen from './screens/SwipeScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import { Colors, Fonts, ThemeModeContext, getThemeColors } from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppTheme = {
  dark: {
    bg: '#050510',
    card: '#0A0818',
    border: 'rgba(255,255,255,0.07)',
    iconActive: '#C4B5FD',
    iconInactive: 'rgba(255,255,255,0.35)',
    textActive: '#C4B5FD',
    textInactive: 'rgba(255,255,255,0.3)',
    tabGradient: [Colors.card, '#0d0818'],
  },
  light: {
    bg: '#F7F7FB',
    card: '#FFFFFF',
    border: 'rgba(15,23,42,0.08)',
    iconActive: '#4F46E5',
    iconInactive: 'rgba(15,23,42,0.45)',
    textActive: '#4F46E5',
    textInactive: 'rgba(15,23,42,0.55)',
    tabGradient: ['#FFFFFF', '#F2F4FB'],
  },
};

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
function TabIcon({ focused, icon, label, uiColors }) {
  return (
    <View style={{ alignItems: 'center', gap: 3, minWidth: 82 }}>
      {focused && (
        <LinearGradient colors={[Colors.accent, Colors.accentPink]}
          style={{ position: 'absolute', bottom: -6, width: 28, height: 2.5, borderRadius: 2, opacity: 0.9 }} />
      )}
      <Ionicons
        name={icon}
        size={20}
        color={focused ? uiColors.iconActive : uiColors.iconInactive}
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
          color: focused ? uiColors.textActive : uiColors.textInactive,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Tab Navigator (pantallas principales) ────────────────────────────────────
function MainTabs({ currentUser, setCurrentUser, themeMode, setThemeMode }) {
  const uiColors = AppTheme[themeMode] || AppTheme.dark;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: uiColors.card,
          borderTopWidth: 1,
          borderTopColor: uiColors.border,
          height: 80,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <LinearGradient colors={uiColors.tabGradient} style={{ flex: 1 }} />
        ),
      }}
    >
      <Tab.Screen
        name="Descubrir"
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="sparkles-outline" label="Descubrir" uiColors={uiColors} /> }}
      >
        {(props) => (
          <SwipeScreen
            {...props}
            apiBaseUrl={API_BASE_URL}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Chats" component={ChatScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="chatbubble-ellipses-outline" label="Chats" uiColors={uiColors} /> }} />
      <Tab.Screen
        name="Perfil"
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="person-circle-outline" label="Perfil" uiColors={uiColors} /> }}
      >
        {(props) => (
          <ProfileScreen
            {...props}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            apiBaseUrl={API_BASE_URL}
            themeMode={themeMode}
            onThemeModeChange={setThemeMode}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ─── Stack Navigator raíz ─────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [themeMode, setThemeMode] = React.useState('dark');
  const themeColors = getThemeColors(themeMode);

  const navigationTheme = themeMode === 'light'
    ? {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: AppTheme.light.bg,
          card: AppTheme.light.card,
          border: AppTheme.light.border,
        },
      }
    : {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: AppTheme.dark.bg,
          card: AppTheme.dark.card,
          border: AppTheme.dark.border,
        },
      };

  const handleAuthSuccess = React.useCallback((user) => {
    setCurrentUser(user);
    const mode = user?.privacySettings?.appearanceMode;
    if (mode === 'light' || mode === 'dark') {
      setThemeMode(mode);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeModeContext.Provider value={{ mode: themeMode, colors: themeColors, setMode: setThemeMode }}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={handleAuthSuccess}
                  apiBaseUrl={API_BASE_URL}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {(props) => (
                <RegisterScreen
                  {...props}
                  onRegisterSuccess={handleAuthSuccess}
                  apiBaseUrl={API_BASE_URL}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="ForgotPassword">
              {(props) => (
                <ForgotPasswordScreen
                  {...props}
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
                  themeMode={themeMode}
                  setThemeMode={setThemeMode}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Notifications">
              {(props) => (
                <NotificationsScreen
                  {...props}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeModeContext.Provider>
    </GestureHandlerRootView>
  );
}
