import React from 'react';

export const DarkColors = {
  bg: '#050510',
  card: '#0A0818',
  card2: '#13131F',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  accent: '#7C3AED',
  accentPink: '#EC4899',
  accentCyan: '#06B6D4',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.35)',
  textSub: 'rgba(255,255,255,0.6)',
  input: 'rgba(255,255,255,0.05)',
  green: '#4ADE80',
  red: '#EF4444',
  yellow: '#FCD34D',
  purple: '#C4B5FD',
  pink: '#F472B6',
  cyan: '#67E8F9',
};

export const LightColors = {
  bg: '#F7F7FB',
  card: '#FFFFFF',
  card2: '#EEF1F8',
  border: 'rgba(15,23,42,0.08)',
  border2: 'rgba(15,23,42,0.14)',
  accent: '#4F46E5',
  accentPink: '#DB2777',
  accentCyan: '#0891B2',
  text: '#0F172A',
  textMuted: 'rgba(15,23,42,0.55)',
  textSub: 'rgba(15,23,42,0.72)',
  input: 'rgba(15,23,42,0.05)',
  green: '#16A34A',
  red: '#DC2626',
  yellow: '#CA8A04',
  purple: '#4F46E5',
  pink: '#DB2777',
  cyan: '#0E7490',
};

export const Colors = DarkColors;

export function getThemeColors(mode = 'dark') {
  return mode === 'light' ? LightColors : DarkColors;
}

export const ThemeModeContext = React.createContext({
  mode: 'dark',
  colors: DarkColors,
  setMode: () => {},
});

export function useThemeMode() {
  return React.useContext(ThemeModeContext);
}

export const Fonts = {
  display: 'ClashDisplay-Bold',      // npm: react-native-clash-display OR use expo-google-fonts
  displaySemi: 'ClashDisplay-SemiBold',
  sans: 'PlusJakartaSans-Regular',
  sansMedium: 'PlusJakartaSans-Medium',
  sansSemiBold: 'PlusJakartaSans-SemiBold',
};

// Fallback si no tienes las fuentes instaladas:
// export const Fonts = {
//   display: 'System',
//   displaySemi: 'System',
//   sans: 'System',
//   sansMedium: 'System',
//   sansSemiBold: 'System',
// };

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const Shadows = {
  glow: (color = '#7C3AED', radius = 20, opacity = 0.4) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: 16,
  }),
};
