import React, { useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // npm: expo-linear-gradient
import { Colors as BaseColors, Fonts, Radius, useThemeMode } from '../theme';

let Colors = BaseColors;

// ─── Orbe decorativo animado ───────────────────────────────────────────────
function Orb({ color1, color2, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  return (
    <Animated.View style={[styles.orb, style, { transform: [{ translateY }] }]}>
      <LinearGradient colors={[color1, 'transparent']} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

// ─── Logo pulsante ──────────────────────────────────────────────────────────
function LogoRing() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.logoRing, { transform: [{ scale: pulse }] }]}>
      <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={styles.logoInner}>
        <Text style={styles.logoText}>PF</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Campo de texto personalizado ──────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType }) {
  const border = useRef(new Animated.Value(0)).current;
  const borderColor = border.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.08)', 'rgba(124,58,237,0.6)'],
  });
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.fieldInner, { borderColor }]}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => Animated.timing(border, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
          onBlur={() => Animated.timing(border, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
        />
      </Animated.View>
    </View>
  );
}

// ─── Botón principal con shimmer ────────────────────────────────────────────
function PrimaryButton({ label, onPress }) {
  const shimmer = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, { toValue: 2, duration: 2500, useNativeDriver: true })
    ).start();
  }, []);
  const translateX = shimmer.interpolate({ inputRange: [-1, 2], outputRange: [-200, 400] });
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={styles.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={styles.primaryBtnText}>{label}</Text>
        <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
          <LinearGradient colors={['transparent', 'rgba(255,255,255,0.18)', 'transparent']} style={{ flex: 1, width: 80 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Pantalla de Login ──────────────────────────────────────────────────────
export default function LoginScreen({ navigation, onLoginSuccess, apiBaseUrl }) {
  const { colors } = useThemeMode();
  Colors = colors;
  styles = React.useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Ingresa tu usuario/correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          usernameOrEmail: email.trim(),
          password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error al iniciar sesión', data.message || 'Verifica tus credenciales.');
        return;
      }

      onLoginSuccess?.(data.user);
      navigation?.replace('Main');
    } catch (error) {
      Alert.alert('Error de conexión', `No se pudo conectar con el servidor en ${apiBaseUrl}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Fondo con orbes */}
      <Orb color1="rgba(124,58,237,0.6)" color2="transparent" style={{ top: -60, left: -60, width: 220, height: 220 }} />
      <Orb color1="rgba(236,72,153,0.5)" color2="transparent" style={{ top: 40, right: -40, width: 180, height: 180 }} />
      <Orb color1="rgba(6,182,212,0.4)" color2="transparent" style={{ bottom: 80, left: '30%', width: 150, height: 150 }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <LogoRing />
            <Text style={styles.heroTitle}>PeopleFinder</Text>
            <Text style={styles.heroSub}>CONECTA · DESCUBRE · VIVE</Text>
          </View>

          {/* Formulario */}
          <Animated.View style={[styles.glassCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Field label="USUARIO O CORREO" value={email} onChangeText={setEmail} placeholder="usuario o correo" keyboardType="email-address" />
            <Field label="CONTRASEÑA" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
            <PrimaryButton label={loading ? 'Ingresando...' : 'Entrar a PeopleFinder'} onPress={handleLogin} />
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>O CONTINÚA CON</Text>
            <View style={styles.divLine} />
          </View>

          {/* Sociales */}
          <View style={styles.socialsRow}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75}>
              <Text style={styles.socialText}>G  Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75}>
              <Text style={styles.socialText}> Apple</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.registerRow} onPress={() => navigation?.navigate('Register')}>
            <Text style={styles.registerText}>¿Sin cuenta? <Text style={{ color: colors.purple }}>Regístrate gratis</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  orb: { position: 'absolute', borderRadius: 999 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  logoRing: {
    width: 80, height: 80, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontFamily: Fonts.display, fontSize: 24, color: Colors.text },
  heroTitle: { fontFamily: Fonts.display, fontSize: 28, color: Colors.text, marginTop: 14, letterSpacing: -1 },
  heroSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted, marginTop: 5, letterSpacing: 2 },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: 20,
  },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 6 },
  fieldInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12,
  },
  fieldInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, color: Colors.text },
  primaryBtn: {
    borderRadius: Radius.lg, paddingVertical: 15,
    alignItems: 'center', overflow: 'hidden', marginTop: 4,
  },
  primaryBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: '#fff' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 80 },
  forgotBtn: { alignItems: 'center', marginTop: 14 },
  forgotText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.purple },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  divText: { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.textMuted, letterSpacing: 1 },
  socialsRow: { flexDirection: 'row', gap: 10 },
  socialBtn: {
    flex: 1, paddingVertical: 13, borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  socialText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.textSub },
  registerRow: { alignItems: 'center', marginTop: 22 },
  registerText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.textMuted },
});

let styles = createStyles(BaseColors);
