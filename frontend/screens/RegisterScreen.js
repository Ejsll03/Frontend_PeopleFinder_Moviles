import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Image, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker'; // npm: expo-image-picker
import { Colors as BaseColors, Fonts, Radius, useThemeMode } from '../theme';

let Colors = BaseColors;

const STEPS = ['Perfil', 'Intereses', 'Ubicación'];
const ALL_INTERESTS = ['Diseño', 'Música', 'Café', 'Viajes', 'Fotografía', 'Arte', 'Deporte', 'Cocina', 'Tecnología', 'Lectura', 'Gaming', 'Moda'];

function StepDots({ current }) {
  return (
    <View style={styles.stepRow}>
      {STEPS.map((_, i) => (
        <Animated.View key={i} style={[styles.stepDot, i === current && styles.stepDotActive, i < current && styles.stepDotDone]} />
      ))}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline }) {
  const border = useRef(new Animated.Value(0)).current;
  const borderColor = border.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.08)', 'rgba(124,58,237,0.6)'] });
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.fieldWrap, multiline && { height: 80, alignItems: 'flex-start' }, { borderColor }]}>
        <TextInput
          style={[styles.fieldInput, multiline && { height: 70, textAlignVertical: 'top', paddingTop: 4 }]}
          value={value} onChangeText={onChangeText} placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)" secureTextEntry={secureTextEntry}
          keyboardType={keyboardType} multiline={multiline}
          onFocus={() => Animated.timing(border, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
          onBlur={() => Animated.timing(border, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
        />
      </Animated.View>
    </View>
  );
}

// ─── Paso 1: Info básica + foto ─────────────────────────────────────────────
function Step1({ data, setData }) {
  const glowAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.3, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setData(d => ({ ...d, avatar: result.assets[0].uri }));
  };

  return (
    <View>
      {/* Avatar upload */}
      <TouchableOpacity onPress={pickImage} style={styles.avatarZone} activeOpacity={0.8}>
        <Animated.View style={[styles.avatarGlow, { transform: [{ scale: glowAnim }] }]} />
        {data.avatar ? (
          <Image source={{ uri: data.avatar }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarPlus}>+</Text>
          </View>
        )}
        <Text style={styles.avatarLabel}><Text style={{ color: Colors.purple }}>Sube tu foto</Text></Text>
        <Text style={styles.avatarSub}>JPG, PNG o GIF · Max 10MB</Text>
      </TouchableOpacity>

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Field label="NOMBRE" value={data.firstName} onChangeText={v => setData(d => ({ ...d, firstName: v }))} placeholder="Ana" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="APELLIDO" value={data.lastName} onChangeText={v => setData(d => ({ ...d, lastName: v }))} placeholder="García" />
        </View>
      </View>
      <Field label="USERNAME" value={data.username} onChangeText={v => setData(d => ({ ...d, username: v }))} placeholder="ana.garcia" />
      <Field label="CORREO ELECTRÓNICO" value={data.email} onChangeText={v => setData(d => ({ ...d, email: v }))} placeholder="hola@email.com" keyboardType="email-address" />
      <Field label="CONTRASEÑA" value={data.password} onChangeText={v => setData(d => ({ ...d, password: v }))} placeholder="Mínimo 8 caracteres" secureTextEntry />
    </View>
  );
}

// ─── Paso 2: Intereses ──────────────────────────────────────────────────────
function Step2({ data, setData }) {
  const toggle = (item) => {
    setData(d => ({
      ...d,
      interests: d.interests.includes(item) ? d.interests.filter(i => i !== item) : [...d.interests, item],
    }));
  };
  return (
    <View>
      <Text style={styles.stepHint}>Elige al menos 3 intereses para encontrar mejores matches</Text>
      <View style={styles.interestGrid}>
        {ALL_INTERESTS.map(item => {
          const selected = data.interests.includes(item);
          return (
            <TouchableOpacity key={item} onPress={() => toggle(item)} activeOpacity={0.75}
              style={[styles.interestTag, selected && styles.interestTagActive]}>
              {selected && (
                <LinearGradient colors={[Colors.accent, Colors.accentPink]}
                  style={StyleSheet.absoluteFill} />
              )}
              <Text style={[styles.interestText, selected && styles.interestTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Paso 3: Ubicación y bio ─────────────────────────────────────────────────
function Step3({ data, setData }) {
  return (
    <View>
      <Field label="CIUDAD" value={data.city} onChangeText={v => setData(d => ({ ...d, city: v }))} placeholder="Ciudad de México" />
      <Field label="BIO (OPCIONAL)" value={data.bio} onChangeText={v => setData(d => ({ ...d, bio: v }))} placeholder="Cuéntanos algo sobre ti..." multiline />
      <Text style={styles.stepHint}>Podrás editar esto después desde tu perfil</Text>
    </View>
  );
}

// ─── Screen principal ────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation, onRegisterSuccess, apiBaseUrl }) {
  const { colors, mode } = useThemeMode();
  Colors = colors;
  styles = React.useMemo(() => createStyles(colors), [colors]);
  const pageGradient = mode === 'light' ? ['#F7F7FB', '#EEF2FF', '#F7F7FB'] : [Colors.bg, '#0d0a1a', Colors.bg];

  const [step, setStep] = useState(0);
  const [data, setData] = useState({ firstName: '', lastName: '', username: '', email: '', password: '', interests: [], city: '', bio: '', avatar: null });
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goNext = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(s => s + 1);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  };

  const goBack = () => {
    if (step === 0) { navigation?.goBack(); return; }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(s => s - 1);
      slideAnim.setValue(-30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleFinish = async () => {
    if (!data.firstName.trim() || !data.lastName.trim() || !data.username.trim() || !data.email.trim() || !data.password.trim()) {
      Alert.alert('Campos incompletos', 'Nombre, apellido, username, correo y contraseña son obligatorios.');
      return;
    }

    if (!data.avatar) {
      Alert.alert('Foto requerida', 'Debes subir una imagen de perfil para registrarte.');
      return;
    }

    try {
      setLoading(true);
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
      const formData = new FormData();
      formData.append('username', data.username.trim());
      formData.append('email', data.email.trim().toLowerCase());
      formData.append('password', data.password);
      formData.append('fullName', fullName);
      formData.append('city', (data.city || '').trim());
      formData.append('interests', JSON.stringify(data.interests || []));
      if (data.bio?.trim()) {
        formData.append('bio', data.bio.trim());
      }

      formData.append('profileImage', {
        uri: data.avatar,
        type: 'image/jpeg',
        name: `profile-${Date.now()}.jpg`,
      });

      const registerResponse = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        Alert.alert('Error al registrar', registerData.message || 'No fue posible crear la cuenta.');
        return;
      }

      const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          usernameOrEmail: data.username.trim(),
          password: data.password,
        }),
      });
      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        Alert.alert('Registro exitoso', 'Cuenta creada. Inicia sesión con tus credenciales.');
        navigation?.replace('Login');
        return;
      }

      onRegisterSuccess?.(loginData.user);
      navigation?.replace('Main');
    } catch (error) {
      Alert.alert('Error de conexión', `No se pudo conectar con el servidor en ${apiBaseUrl}.`);
    } finally {
      setLoading(false);
    }
  };

  const stepComponents = [
    <Step1 data={data} setData={setData} />,
    <Step2 data={data} setData={setData} />,
    <Step3 data={data} setData={setData} />,
  ];

  return (
    <View style={styles.container}>
      {/* Fondo */}
      <LinearGradient colors={pageGradient} style={StyleSheet.absoluteFill} />
      <View style={[styles.orbBg, { backgroundColor: 'rgba(236,72,153,0.15)', top: -80, right: -80, width: 200, height: 200, borderRadius: 100 }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Crea tu perfil</Text>
          <Text style={styles.headerSub}>Paso {step + 1} de {STEPS.length}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <StepDots current={step} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {stepComponents[step]}
        </Animated.View>
      </ScrollView>

      {/* Botón continuar */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={step < STEPS.length - 1 ? goNext : handleFinish} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={styles.nextBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.nextBtnText}>
              {step < STEPS.length - 1 ? 'Continuar' : (loading ? 'Creando cuenta...' : 'Crear mi cuenta')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  orbBg: { position: 'absolute' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backText: { color: Colors.text, fontSize: 22, lineHeight: 26 },
  headerTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.text },
  headerSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2, letterSpacing: 0.5 },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 20 },
  stepDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  stepDotActive: { width: 40, backgroundColor: Colors.accent },
  stepDotDone: { backgroundColor: Colors.green },
  scroll: { paddingHorizontal: 24, paddingBottom: 20 },
  avatarZone: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: Radius.xl, padding: 24, alignItems: 'center', marginBottom: 20,
    backgroundColor: 'rgba(124,58,237,0.04)', overflow: 'hidden',
  },
  avatarGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(124,58,237,0.25)' },
  avatarImg: { width: 72, height: 72, borderRadius: 36, marginBottom: 10 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(124,58,237,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarPlus: { fontSize: 28, color: Colors.purple },
  avatarLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.textSub, marginBottom: 3 },
  avatarSub: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.textMuted },
  row2: { flexDirection: 'row', gap: 10 },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 5 },
  fieldWrap: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 11 },
  fieldInput: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.text },
  stepHint: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  interestTagActive: { borderColor: 'transparent' },
  interestText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.textSub },
  interestTextActive: { color: Colors.text, position: 'relative', zIndex: 1 },
  footer: { paddingHorizontal: 24, paddingBottom: Platform?.OS === 'ios' ? 40 : 24, paddingTop: 12 },
  nextBtn: { borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center' },
  nextBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: '#fff' },
});

let styles = createStyles(BaseColors);
