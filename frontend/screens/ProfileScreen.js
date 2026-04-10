import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Image, Animated, Alert, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors as BaseColors, Fonts, Radius, Shadows, useThemeMode } from '../theme';

let Colors = BaseColors;

const ALL_INTERESTS = ['Diseño', 'Música', 'Café', 'Viajes', 'Fotografía', 'Arte', 'Deporte', 'Tecnología'];
const DEFAULT_PRIVACY_SETTINGS = {
  profileVisibility: 'public',
  friendRequestPermission: 'everyone',
  messagePermission: 'friends',
  showCity: true,
  showOnlineStatus: true,
  showReadReceipts: true,
  showLastSeen: true,
};

const USER_DATA = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  city: '',
  bio: '',
  gender: '',
  interests: [],
  emailVerified: false,
  privacySettings: DEFAULT_PRIVACY_SETTINGS,
};

function resolveMediaUrl(imagePath, apiBaseUrl) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return `${apiBaseUrl}${imagePath}`;
}

function mapBackendUserToProfile(user, apiBaseUrl) {
  if (!user) return USER_DATA;
  const fullName = (user.fullName || '').trim();
  const [firstName = '', ...rest] = fullName.split(' ');
  const lastName = rest.join(' ');
  return {
    firstName,
    lastName,
    username: user.username || '',
    email: user.email || '',
    city: user.city || '',
    bio: user.bio || '',
    gender: user.gender || '',
    interests: Array.isArray(user.interests) ? user.interests : [],
    emailVerified: Boolean(user.emailVerified),
    privacySettings: {
      ...DEFAULT_PRIVACY_SETTINGS,
      ...(user.privacySettings || {}),
    },
    avatar: resolveMediaUrl(user.profileImage, apiBaseUrl),
  };
}

// ─── Stat animado ─────────────────────────────────────────────────────────────
function StatBox({ label, value, delay = 0 }) {
  const countAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(countAnim, { toValue: value, duration: 1000, delay, useNativeDriver: false }).start();
  }, []);
  return (
    <View style={styles.statBox}>
      <Animated.Text style={styles.statNum}>
        {countAnim.interpolate ? String(Math.round(value)) : value}
      </Animated.Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Campo del formulario de edición ──────────────────────────────────────────
function EditField({ label, value, onChangeText, multiline, keyboardType, secureTextEntry }) {
  const border = useRef(new Animated.Value(0)).current;
  const borderColor = border.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.08)', 'rgba(124,58,237,0.5)'] });
  return (
    <View style={styles.editFieldGroup}>
      <Text style={styles.editFieldLabel}>{label}</Text>
      <Animated.View style={[styles.editFieldWrap, multiline && { height: 80, alignItems: 'flex-start' }, { borderColor }]}>
        <TextInput
          style={[styles.editFieldInput, multiline && { height: 70, textAlignVertical: 'top', paddingTop: 4 }]}
          value={value} onChangeText={onChangeText} multiline={multiline}
          keyboardType={keyboardType} secureTextEntry={secureTextEntry}
          placeholderTextColor="rgba(255,255,255,0.2)"
          onFocus={() => Animated.timing(border, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
          onBlur={() => Animated.timing(border, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
        />
      </Animated.View>
    </View>
  );
}

// ─── Vista de perfil ──────────────────────────────────────────────────────────
function ProfileView({ userData, avatar, onEdit, onPrivacy, onAppearance, onNotifications, onEditAvatar, onLogout, onResendVerification, stats, themeMode, coverGradient }) {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(contentAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const menuItems = [
    { icon: 'account-edit-outline', label: 'Editar perfil', sub: 'Nombre, foto, bio', color: Colors.accent, onPress: onEdit },
    ...(!userData.emailVerified
      ? [{ icon: 'email-fast-outline', label: 'Verificar email', sub: 'Enviar token de verificación', color: Colors.cyan, onPress: onResendVerification }]
      : []),
    { icon: 'lock-outline', label: 'Privacidad', sub: 'Visibilidad · bloqueos', color: Colors.green, onPress: onPrivacy },
    { icon: 'bell-outline', label: 'Notificaciones', sub: 'Push · email', color: Colors.accentCyan, onPress: onNotifications },
    { icon: 'weather-night', label: 'Apariencia', sub: themeMode === 'light' ? 'Tema claro activo' : 'Tema oscuro activo', color: Colors.yellow, onPress: onAppearance },
    { icon: 'logout', label: 'Cerrar sesión', sub: '', color: Colors.red, onPress: onLogout },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Hero con cover */}
      <Animated.View style={[styles.heroSection, { opacity: headerAnim }]}>
        <View style={styles.coverBg}>
          <LinearGradient colors={coverGradient} style={StyleSheet.absoluteFill} />
          <View style={[styles.coverOrb, { backgroundColor: 'rgba(124,58,237,0.3)', width: 250, height: 250, top: -80, left: -60 }]} />
          <View style={[styles.coverOrb, { backgroundColor: 'rgba(236,72,153,0.25)', width: 180, height: 180, bottom: -40, right: -40 }]} />
        </View>
        <TouchableOpacity style={styles.coverEditBtn}>
          <View style={styles.coverEditRow}>
            <MaterialCommunityIcons name="pencil" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.coverEditText}>Portada</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={onEditAvatar} activeOpacity={0.8}>
            <Animated.View style={[styles.profileAvBorder, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={styles.profileAv}>
                {avatar
                  ? <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} borderRadius={36} />
                  : <Text style={styles.profileAvText}>{(userData.firstName?.[0] || 'U')}{(userData.lastName?.[0] || '')}</Text>
                }
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.onlineIndicator} />
        </View>
      </Animated.View>

      {/* Info + stats */}
      <Animated.View style={{ transform: [{ translateY: contentAnim }] }}>
        <View style={styles.profileInfoSection}>
          <Text style={styles.profileName}>{userData.firstName} {userData.lastName}</Text>
          <Text style={styles.profileHandle}>@{userData.username} · {userData.city || 'Sin ciudad'}</Text>
          <View style={styles.badgesRow}>
            <View style={[styles.badge, !userData.emailVerified && styles.badgeWarning]}>
              <MaterialCommunityIcons
                name={userData.emailVerified ? 'check-decagram' : 'email-alert-outline'}
                size={12}
                color={userData.emailVerified ? Colors.purple : Colors.yellow}
              />
              <Text style={[styles.badgeText, !userData.emailVerified && styles.badgeWarningText]}>
                {userData.emailVerified ? 'Verificada' : 'Email no verificado'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Amigos" value={stats.friends} delay={0} />
          <View style={styles.statDivider} />
          <StatBox label="Matches" value={stats.matches} delay={150} />
          <View style={styles.statDivider} />
          <StatBox label="Rating" value={stats.rating} delay={300} />
        </View>

        {/* Intereses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>INTERESES</Text>
            <TouchableOpacity><Text style={styles.sectionEdit}>+ Añadir</Text></TouchableOpacity>
          </View>
          <View style={styles.interestsWrap}>
            {(userData.interests || []).map(i => (
              <LinearGradient key={i} colors={[`${Colors.accent}22`, `${Colors.accentPink}11`]} style={styles.interestPill}>
                <Text style={styles.interestPillText}>{i}</Text>
              </LinearGradient>
            ))}
          </View>
        </View>

        {/* Menú */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>
          <View style={styles.menuList}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity key={idx} onPress={item.onPress} activeOpacity={0.7}
                style={[styles.menuItem, idx === menuItems.length - 1 && styles.menuItemDanger]}>
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}18` }]}>
                  <MaterialCommunityIcons name={item.icon} size={16} color={item.color} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuLabel, idx === menuItems.length - 1 && { color: Colors.red }]}>{item.label}</Text>
                  {item.sub ? <Text style={styles.menuSub}>{item.sub}</Text> : null}
                </View>
                {idx < menuItems.length - 1 && <Text style={styles.menuArrow}>›</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </Animated.View>
    </ScrollView>
  );
}

// ─── Vista de edición ─────────────────────────────────────────────────────────
function EditView({ userData, setUserData, avatar, onEditAvatar, onSave, onCancel }) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 90, friction: 9 }).start();
  }, []);

  return (
    <Animated.ScrollView style={{ transform: [{ translateY: slideAnim }] }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.editCancel}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.editTitle}>Editar perfil</Text>
        <TouchableOpacity onPress={onSave}>
          <Text style={styles.editSave}>Guardar</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <TouchableOpacity onPress={onEditAvatar} style={styles.editAvatarWrap} activeOpacity={0.8}>
        <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={styles.editAvatar}>
          {avatar
            ? <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} borderRadius={36} />
            : <Text style={styles.profileAvText}>{userData.firstName[0]}{userData.lastName[0]}</Text>
          }
          <View style={styles.editAvatarOverlay}>
            <Ionicons name="camera-outline" size={22} color="rgba(255,255,255,0.85)" />
            <Text style={styles.editAvatarOverlayText}>Cambiar</Text>
          </View>
        </LinearGradient>
        <Text style={styles.changePhotoText}>Elegir nueva foto o GIF</Text>
      </TouchableOpacity>

      {/* Campos */}
      <View style={styles.editFields}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <EditField label="NOMBRE" value={userData.firstName} onChangeText={v => setUserData(d => ({ ...d, firstName: v }))} />
          </View>
          <View style={{ flex: 1 }}>
            <EditField label="APELLIDO" value={userData.lastName} onChangeText={v => setUserData(d => ({ ...d, lastName: v }))} />
          </View>
        </View>
        <EditField label="USUARIO" value={userData.username} onChangeText={v => setUserData(d => ({ ...d, username: v }))} />
        <EditField label="BIO" value={userData.bio} onChangeText={v => setUserData(d => ({ ...d, bio: v }))} multiline />
        <EditField label="CIUDAD" value={userData.city} onChangeText={v => setUserData(d => ({ ...d, city: v }))} />
        <EditField label="CORREO" value={userData.email} onChangeText={v => setUserData(d => ({ ...d, email: v }))} keyboardType="email-address" />

        {/* Intereses en edición */}
        <View style={styles.editFieldGroup}>
          <Text style={styles.editFieldLabel}>INTERESES</Text>
          <View style={styles.interestGrid}>
            {ALL_INTERESTS.map(item => {
              const selected = userData.interests.includes(item);
              return (
                <TouchableOpacity key={item} activeOpacity={0.75}
                  onPress={() => setUserData(d => ({
                    ...d,
                    interests: selected ? d.interests.filter(i => i !== item) : [...d.interests, item],
                  }))}>
                  {selected
                    ? <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={styles.interestTagActive}>
                        <Text style={[styles.interestTagText, { color: '#fff' }]}>{item}</Text>
                      </LinearGradient>
                    : <View style={styles.interestTag}><Text style={styles.interestTagText}>{item}</Text></View>
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Guardar */}
        <TouchableOpacity onPress={onSave} activeOpacity={0.85} style={{ marginTop: 8 }}>
          <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Guardar cambios</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn}
          onPress={() => Alert.alert('Eliminar cuenta', '¿Estás seguro? Esta acción no se puede deshacer.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => {} },
          ])}>
          <Text style={styles.deleteBtnText}>Eliminar cuenta</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </Animated.ScrollView>
  );
}

// ─── Vista de privacidad ─────────────────────────────────────────────────────
function PrivacyOptionPills({ options, value, onChange }) {
  return (
    <View style={styles.privacyPillsRow}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
            style={[styles.privacyPill, selected && styles.privacyPillActive]}
          >
            <Text style={[styles.privacyPillText, selected && styles.privacyPillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PrivacyRow({ label, sublabel, value, onChange }) {
  return (
    <View style={styles.privacySwitchRow}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.privacySwitchLabel}>{label}</Text>
        {!!sublabel && <Text style={styles.privacySwitchSub}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(124,58,237,0.7)' }}
        thumbColor={value ? '#ffffff' : '#e5e7eb'}
      />
    </View>
  );
}

function PrivacyView({ settings, setSettings, onSave, onCancel }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.editCancel}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.editTitle}>Privacidad</Text>
        <TouchableOpacity onPress={onSave}>
          <Text style={styles.editSave}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.editFields}>
        <View style={styles.privacyCard}>
          <Text style={styles.privacyGroupTitle}>Visibilidad de perfil</Text>
          <PrivacyOptionPills
            value={settings.profileVisibility}
            onChange={(v) => setSettings((prev) => ({ ...prev, profileVisibility: v }))}
            options={[
              { value: 'public', label: 'Público' },
              { value: 'friends', label: 'Amigos' },
              { value: 'private', label: 'Privado' },
            ]}
          />

          <Text style={styles.privacyGroupTitle}>Solicitudes de amistad</Text>
          <PrivacyOptionPills
            value={settings.friendRequestPermission}
            onChange={(v) => setSettings((prev) => ({ ...prev, friendRequestPermission: v }))}
            options={[
              { value: 'everyone', label: 'Todos' },
              { value: 'friends_of_friends', label: 'Amigos de amigos' },
              { value: 'nobody', label: 'Nadie' },
            ]}
          />

          <Text style={styles.privacyGroupTitle}>Quién puede escribirme</Text>
          <PrivacyOptionPills
            value={settings.messagePermission}
            onChange={(v) => setSettings((prev) => ({ ...prev, messagePermission: v }))}
            options={[
              { value: 'friends', label: 'Solo amigos' },
              { value: 'everyone', label: 'Todos' },
            ]}
          />
        </View>

        <View style={styles.privacyCard}>
          <PrivacyRow
            label="Mostrar ciudad"
            sublabel="Define si otros usuarios pueden verla"
            value={Boolean(settings.showCity)}
            onChange={(v) => setSettings((prev) => ({ ...prev, showCity: v }))}
          />
          <PrivacyRow
            label="Mostrar estado en línea"
            sublabel="Disponible o activo ahora"
            value={Boolean(settings.showOnlineStatus)}
            onChange={(v) => setSettings((prev) => ({ ...prev, showOnlineStatus: v }))}
          />
          <PrivacyRow
            label="Confirmación de lectura"
            sublabel="Permite mostrar visto en chats"
            value={Boolean(settings.showReadReceipts)}
            onChange={(v) => setSettings((prev) => ({ ...prev, showReadReceipts: v }))}
          />
          <PrivacyRow
            label="Mostrar última conexión"
            sublabel="Hora de última actividad"
            value={Boolean(settings.showLastSeen)}
            onChange={(v) => setSettings((prev) => ({ ...prev, showLastSeen: v }))}
          />
        </View>

        <TouchableOpacity onPress={onSave} activeOpacity={0.85} style={{ marginTop: 8 }}>
          <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Guardar privacidad</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

function AppearanceView({ mode, onChangeMode, onSave, onCancel }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.editCancel}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.editTitle}>Apariencia</Text>
        <TouchableOpacity onPress={onSave}>
          <Text style={styles.editSave}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.editFields}>
        <View style={styles.privacyCard}>
          <Text style={styles.privacyGroupTitle}>Selecciona tema</Text>
          <View style={styles.appearanceRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onChangeMode('dark')}
              style={[styles.appearanceCard, mode === 'dark' && styles.appearanceCardSelected]}
            >
              <View style={[styles.appearancePreview, { backgroundColor: '#0A0818' }]}>
                <View style={{ width: 46, height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.22)' }} />
                <View style={{ width: 30, height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.14)', marginTop: 8 }} />
              </View>
              <Text style={styles.appearanceLabel}>Oscuro</Text>
              <Text style={styles.appearanceMeta}>Contraste alto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onChangeMode('light')}
              style={[styles.appearanceCard, mode === 'light' && styles.appearanceCardSelected]}
            >
              <View style={[styles.appearancePreview, { backgroundColor: '#F8FAFC', borderColor: 'rgba(15,23,42,0.08)', borderWidth: 1 }]}>
                <View style={{ width: 46, height: 6, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.22)' }} />
                <View style={{ width: 30, height: 6, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.14)', marginTop: 8 }} />
              </View>
              <Text style={styles.appearanceLabel}>Claro</Text>
              <Text style={styles.appearanceMeta}>Más luminoso</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.privacySwitchSub}>Este ajuste se guarda en tu perfil y se aplica al abrir sesión.</Text>
        </View>

        <TouchableOpacity onPress={onSave} activeOpacity={0.85} style={{ marginTop: 8 }}>
          <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Guardar apariencia</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation, currentUser, setCurrentUser, apiBaseUrl, themeMode = 'dark', onThemeModeChange }) {
  const { colors, mode } = useThemeMode();
  Colors = colors;
  styles = React.useMemo(() => createStyles(colors), [colors]);
  const pageGradient = mode === 'light' ? ['#F7F7FB', '#EEF2FF', '#F7F7FB'] : [Colors.bg, '#0d0818', Colors.bg];
  const coverGradient = mode === 'light' ? ['#E9E7FF', '#E0EEFF', '#F3E8FF'] : ['#1a0533', '#0d1a3d', '#2d0a3a'];

  const [editing, setEditing] = useState(false);
  const [privacyEditing, setPrivacyEditing] = useState(false);
  const [appearanceEditing, setAppearanceEditing] = useState(false);
  const initialProfile = mapBackendUserToProfile(currentUser, apiBaseUrl);
  const [userData, setUserData] = useState(initialProfile);
  const [avatar, setAvatar] = useState(initialProfile.avatar || null);
  const [privacySettings, setPrivacySettings] = useState(
    initialProfile.privacySettings || DEFAULT_PRIVACY_SETTINGS
  );
  const [appearanceMode, setAppearanceMode] = useState(
    initialProfile.privacySettings?.appearanceMode || themeMode || 'dark'
  );

  const stats = React.useMemo(() => {
    const friendsCount = Array.isArray(currentUser?.friends)
      ? currentUser.friends.length
      : 0;
    const hasFriends = friendsCount > 0;

    const matchesCount = hasFriends && Number.isFinite(currentUser?.matchesCount)
      ? Number(currentUser.matchesCount)
      : 0;

    const ratingValue = hasFriends && Number.isFinite(currentUser?.rating)
      ? Number(currentUser.rating)
      : 0;

    return {
      friends: friendsCount,
      matches: matchesCount,
      rating: ratingValue,
    };
  }, [currentUser]);

  useEffect(() => {
    const mapped = mapBackendUserToProfile(currentUser, apiBaseUrl);
    setUserData(mapped);
    setAvatar(mapped.avatar || null);
    setPrivacySettings(mapped.privacySettings || DEFAULT_PRIVACY_SETTINGS);
    setAppearanceMode(mapped.privacySettings?.appearanceMode || themeMode || 'dark');
  }, [currentUser, apiBaseUrl, themeMode]);

  const loadPrivacySettings = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/privacy`, {
        method: 'GET',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) return;

      setPrivacySettings({
        ...DEFAULT_PRIVACY_SETTINGS,
        ...(payload.privacySettings || {}),
      });
      setAppearanceMode(
        payload?.privacySettings?.appearanceMode ||
          DEFAULT_PRIVACY_SETTINGS.appearanceMode
      );
    } catch (_error) {
      // Estado local ya tiene defaults y datos previos.
    }
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const handleSave = async () => {
    try {
      const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      const formData = new FormData();
      formData.append('username', (userData.username || '').trim());
      formData.append('email', (userData.email || '').trim().toLowerCase());
      formData.append('fullName', fullName);
      formData.append('city', (userData.city || '').trim());
      formData.append('bio', userData.bio || '');
      formData.append('interests', JSON.stringify(userData.interests || []));

      if (avatar && !avatar.startsWith('http://') && !avatar.startsWith('https://')) {
        formData.append('profileImage', {
          uri: avatar,
          type: 'image/jpeg',
          name: `profile-${Date.now()}.jpg`,
        });
      }

      const response = await fetch(`${apiBaseUrl}/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        Alert.alert('No se pudo guardar', payload.message || 'Intenta nuevamente.');
        return;
      }

      setCurrentUser?.(payload.user);
      setEditing(false);
    } catch (error) {
      Alert.alert('Error de conexión', 'No fue posible actualizar tu perfil.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      // Ignorado a propósito: hacemos logout local aunque falle la red.
    }
    setCurrentUser?.(null);
    navigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/resend-verification`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json();

      if (!response.ok) {
        Alert.alert('Error', payload.error || 'No se pudo reenviar la verificación.');
        return;
      }

      const nextEmailVerified = Boolean(
        payload?.emailVerified ?? payload?.user?.emailVerified ?? userData.emailVerified
      );

      setCurrentUser?.((prev) => ({
        ...(prev || {}),
        emailVerified: nextEmailVerified,
      }));

      setUserData((prev) => ({
        ...prev,
        emailVerified: nextEmailVerified,
      }));

      Alert.alert('Listo', payload.message || 'Te enviamos un correo de verificación.');
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  const handleOpenPrivacy = async () => {
    await loadPrivacySettings();
    setPrivacyEditing(true);
  };

  const handleSavePrivacy = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/privacy`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacySettings }),
      });
      const payload = await response.json();

      if (!response.ok) {
        Alert.alert('No se pudo guardar', payload.error || 'Intenta nuevamente.');
        return;
      }

      setPrivacySettings({
        ...DEFAULT_PRIVACY_SETTINGS,
        ...(payload.privacySettings || {}),
      });

      setCurrentUser?.((prev) => ({
        ...(prev || {}),
        privacySettings: {
          ...DEFAULT_PRIVACY_SETTINGS,
          ...(payload.privacySettings || {}),
        },
      }));

      setUserData((prev) => ({
        ...prev,
        privacySettings: {
          ...DEFAULT_PRIVACY_SETTINGS,
          ...(payload.privacySettings || {}),
        },
      }));

      setPrivacyEditing(false);
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo guardar la privacidad.');
    }
  };

  const handleOpenAppearance = async () => {
    await loadPrivacySettings();
    setAppearanceEditing(true);
  };

  const handleSaveAppearance = async () => {
    try {
      const mergedSettings = {
        ...privacySettings,
        appearanceMode,
      };

      const response = await fetch(`${apiBaseUrl}/auth/privacy`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacySettings: mergedSettings }),
      });
      const payload = await response.json();

      if (!response.ok) {
        Alert.alert('No se pudo guardar', payload.error || 'Intenta nuevamente.');
        return;
      }

      const nextPrivacy = {
        ...DEFAULT_PRIVACY_SETTINGS,
        ...(payload.privacySettings || {}),
      };
      setPrivacySettings(nextPrivacy);
      setAppearanceMode(nextPrivacy.appearanceMode || 'dark');
      onThemeModeChange?.(nextPrivacy.appearanceMode || 'dark');

      setCurrentUser?.((prev) => ({
        ...(prev || {}),
        privacySettings: nextPrivacy,
      }));

      setAppearanceEditing(false);
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo guardar la apariencia.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={pageGradient} style={StyleSheet.absoluteFill} />
      <View style={{ paddingTop: 56, flex: 1 }}>
        {appearanceEditing
          ? <AppearanceView mode={appearanceMode} onChangeMode={setAppearanceMode} onSave={handleSaveAppearance} onCancel={() => setAppearanceEditing(false)} />
          : privacyEditing
          ? <PrivacyView settings={privacySettings} setSettings={setPrivacySettings} onSave={handleSavePrivacy} onCancel={() => setPrivacyEditing(false)} />
          : editing
          ? <EditView userData={userData} setUserData={setUserData} avatar={avatar} onEditAvatar={pickAvatar} onSave={handleSave} onCancel={() => setEditing(false)} />
          : <ProfileView
              userData={userData}
              avatar={avatar}
              onEdit={() => setEditing(true)}
              onPrivacy={handleOpenPrivacy}
              onAppearance={handleOpenAppearance}
              onNotifications={() => navigation?.navigate('Notifications', { apiBaseUrl })}
              onEditAvatar={pickAvatar}
              onLogout={handleLogout}
              onResendVerification={handleResendVerification}
              stats={stats}
              themeMode={themeMode}
              coverGradient={coverGradient}
            />
        }
      </View>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  heroSection: { height: 200 },
  coverBg: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  coverOrb: { position: 'absolute', borderRadius: 999 },
  coverEditBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  coverEditRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coverEditText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  avatarWrap: { position: 'absolute', bottom: -36, left: '50%', marginLeft: -40, alignItems: 'center' },
  profileAvBorder: { width: 80, height: 80, borderRadius: 40, padding: 3, backgroundColor: Colors.card },
  profileAv: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileAvText: { fontFamily: Fonts.display, fontSize: 26, color: Colors.text, fontWeight: '700' },
  onlineIndicator: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.green, borderWidth: 3, borderColor: Colors.bg, position: 'absolute', bottom: 0, right: -2 },
  profileInfoSection: { paddingTop: 48, alignItems: 'center', paddingBottom: 12, paddingHorizontal: 20 },
  profileName: { fontFamily: Fonts.display, fontSize: 22, color: Colors.text, letterSpacing: -0.5 },
  profileHandle: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  badgeText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.purple },
  badgeWarning: { backgroundColor: 'rgba(234,179,8,0.12)', borderColor: 'rgba(234,179,8,0.25)' },
  badgeWarningText: { color: Colors.yellow },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  statBox: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  statNum: { fontFamily: Fonts.display, fontSize: 22, color: Colors.purple, fontWeight: '700' },
  statLabel: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.textMuted, marginTop: 3, letterSpacing: 0.5, textTransform: 'uppercase' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 10 },
  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5 },
  sectionEdit: { fontFamily: Fonts.sansSemiBold, fontSize: 11, color: Colors.accent },
  interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  interestPill: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  interestPillText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.purple },
  menuList: { gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  menuItemDanger: { borderColor: 'rgba(239,68,68,0.12)', backgroundColor: 'rgba(239,68,68,0.04)' },
  menuIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.text },
  menuSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  menuArrow: { fontFamily: Fonts.sans, fontSize: 18, color: 'rgba(255,255,255,0.2)' },
  editHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  editCancel: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.textMuted },
  editTitle: { fontFamily: Fonts.display, fontSize: 17, color: Colors.text },
  editSave: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.purple },
  editAvatarWrap: { alignItems: 'center', marginBottom: 20 },
  editAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  editAvatarOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: 3 },
  editAvatarOverlayText: { fontFamily: Fonts.sansMedium, fontSize: 9, color: 'rgba(255,255,255,0.7)' },
  changePhotoText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.purple, marginTop: 8 },
  editFields: { paddingHorizontal: 20 },
  editFieldGroup: { marginBottom: 12 },
  editFieldLabel: { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 5 },
  editFieldWrap: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 11 },
  editFieldInput: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.text },
  privacyCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  privacyGroupTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
  },
  privacyPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  privacyPill: {
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.input,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  privacyPillActive: {
    borderColor: 'rgba(124,58,237,0.35)',
    backgroundColor: 'rgba(124,58,237,0.2)',
  },
  privacyPillText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.textSub },
  privacyPillTextActive: { color: '#fff' },
  appearanceRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  appearanceCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.input,
    borderRadius: 12,
    padding: 10,
  },
  appearanceCardSelected: {
    borderColor: 'rgba(124,58,237,0.45)',
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  appearancePreview: {
    height: 64,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  appearanceLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.text, marginTop: 8 },
  appearanceMeta: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  privacySwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  privacySwitchLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.text },
  privacySwitchSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  interestTag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  interestTagActive: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  interestTagText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  saveBtn: { borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: '#fff' },
  deleteBtn: { marginTop: 12, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.06)', alignItems: 'center' },
  deleteBtnText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: 'rgba(239,68,68,0.7)' },
});

let styles = createStyles(BaseColors);
