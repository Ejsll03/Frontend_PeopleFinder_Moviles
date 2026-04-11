import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors as BaseColors, Fonts, Radius, useThemeMode } from '../theme';

let Colors = BaseColors;

function PrimaryButton({ label, onPress, disabled }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={disabled}>
      <LinearGradient
        colors={disabled ? [Colors.textMuted, Colors.textMuted] : [Colors.accent, Colors.accentPink]}
        style={[styles.button, disabled && { opacity: 0.7 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function ForgotPasswordScreen({ navigation, apiBaseUrl }) {
  const { colors } = useThemeMode();
  Colors = colors;
  styles = React.useMemo(() => createStyles(colors), [colors]);
  const effectiveApiBaseUrl = React.useMemo(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return apiBaseUrl;
    }

    const host = window.location?.hostname || '';
    const base = String(apiBaseUrl || '').trim();
    const isLocalBase = base.includes('localhost') || base.includes('127.0.0.1');
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalHost && isLocalBase) {
      return 'https://api.testerick.site';
    }

    return apiBaseUrl;
  }, [apiBaseUrl]);

  const [email, setEmail] = React.useState('');
  const [token, setToken] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [requested, setRequested] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleRequest = async () => {
    if (!email.trim()) {
      Alert.alert('Email requerido', 'Ingresa el correo de tu cuenta.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${effectiveApiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('No se pudo enviar', data.error || data.message || 'Intenta de nuevo.');
        return;
      }

      setRequested(true);
      Alert.alert('Revisa tu correo', data.message || 'Te enviamos un token para recuperar tu contraseña.');
    } catch (_error) {
      Alert.alert('Error de conexión', `No se pudo conectar con el servidor en ${effectiveApiBaseUrl}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!token.trim() || !newPassword.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa token y nueva contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Contraseña inválida', 'Debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const verifyRes = await fetch(
        `${effectiveApiBaseUrl}/auth/reset-password/verify?token=${encodeURIComponent(token.trim())}`,
        { method: 'GET', credentials: 'include' }
      );
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        Alert.alert('Token inválido', verifyData.error || verifyData.message || 'El token no es válido.');
        return;
      }

      const response = await fetch(`${effectiveApiBaseUrl}/auth/reset-password/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('No se pudo actualizar', data.error || data.message || 'Intenta nuevamente.');
        return;
      }

      Alert.alert('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña.', [
        {
          text: 'Ir a Login',
          onPress: () => navigation?.goBack(),
        },
      ]);
    } catch (_error) {
      Alert.alert('Error de conexión', `No se pudo conectar con el servidor en ${effectiveApiBaseUrl}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Te enviaremos un token por correo para restablecer el acceso a tu cuenta.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="tu-correo@ejemplo.com"
              placeholderTextColor={Colors.textMuted}
            />

            {!requested ? (
              <PrimaryButton
                label={loading ? 'Enviando...' : 'Enviar token'}
                onPress={handleRequest}
                disabled={loading}
              />
            ) : (
              <>
                <Text style={styles.label}>Token</Text>
                <TextInput
                  style={styles.input}
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="characters"
                  placeholder="ABC123"
                  placeholderTextColor={Colors.textMuted}
                />

                <Text style={styles.label}>Nueva contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={Colors.textMuted}
                />

                <PrimaryButton
                  label={loading ? 'Actualizando...' : 'Cambiar contraseña'}
                  onPress={handleConfirm}
                  disabled={loading}
                />
              </>
            )}

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
              <Text style={styles.backText}>Volver a iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { paddingHorizontal: 22, paddingTop: 80, paddingBottom: 36 },
    title: {
      color: Colors.text,
      fontFamily: Fonts.display,
      fontSize: 30,
      letterSpacing: -0.7,
    },
    subtitle: {
      marginTop: 10,
      color: Colors.textSub,
      fontFamily: Fonts.sans,
      fontSize: 14,
      lineHeight: 20,
    },
    card: {
      marginTop: 26,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.card,
      padding: 18,
    },
    label: {
      color: Colors.textMuted,
      fontFamily: Fonts.sansMedium,
      fontSize: 11,
      letterSpacing: 1.1,
      marginBottom: 8,
      marginTop: 8,
      textTransform: 'uppercase',
    },
    input: {
      color: Colors.text,
      borderWidth: 1,
      borderColor: Colors.border2,
      backgroundColor: Colors.input,
      borderRadius: Radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: Fonts.sans,
      fontSize: 14,
    },
    button: {
      marginTop: 16,
      borderRadius: Radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontFamily: Fonts.sansSemiBold,
      fontSize: 15,
    },
    backBtn: { alignItems: 'center', marginTop: 18 },
    backText: {
      color: Colors.purple,
      fontFamily: Fonts.sans,
      fontSize: 13,
    },
  });

let styles = createStyles(BaseColors);
