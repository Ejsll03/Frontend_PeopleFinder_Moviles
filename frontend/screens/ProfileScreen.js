import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Image, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Shadows } from '../theme';

const ALL_INTERESTS = ['Diseño', 'Música', 'Café', 'Viajes', 'Fotografía', 'Arte', 'Deporte', 'Tecnología'];
const USER_DATA = { firstName: '', lastName: '', username: '', email: '', city: '', bio: '', gender: '', interests: [] };

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
function ProfileView({ userData, avatar, onEdit, onEditAvatar, onLogout, stats }) {
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
    { icon: 'lock-outline', label: 'Privacidad', sub: 'Visibilidad · bloqueos', color: Colors.green },
    { icon: 'bell-outline', label: 'Notificaciones', sub: 'Push · email', color: Colors.accentCyan },
    { icon: 'weather-night', label: 'Apariencia', sub: 'Tema oscuro activo', color: Colors.yellow },
    { icon: 'logout', label: 'Cerrar sesión', sub: '', color: Colors.red, onPress: onLogout },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Hero con cover */}
      <Animated.View style={[styles.heroSection, { opacity: headerAnim }]}>
        <View style={styles.coverBg}>
          <LinearGradient colors={['#1a0533', '#0d1a3d', '#2d0a3a']} style={StyleSheet.absoluteFill} />
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
            <View style={styles.badge}>
              <MaterialCommunityIcons name="check-decagram" size={12} color={Colors.purple} />
              <Text style={styles.badgeText}>Verificada</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.2)' }]}>
              <Ionicons name="location-outline" size={12} color={Colors.cyan} />
              <Text style={[styles.badgeText, { color: Colors.cyan }]}>2 km</Text>
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

// ─── Screen principal ─────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation, currentUser, setCurrentUser, apiBaseUrl }) {
  const [editing, setEditing] = useState(false);
  const initialProfile = mapBackendUserToProfile(currentUser, apiBaseUrl);
  const [userData, setUserData] = useState(initialProfile);
  const [avatar, setAvatar] = useState(initialProfile.avatar || null);

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
  }, [currentUser, apiBaseUrl]);

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

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.bg, '#0d0818', Colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={{ paddingTop: 56, flex: 1 }}>
        {editing
          ? <EditView userData={userData} setUserData={setUserData} avatar={avatar} onEditAvatar={pickAvatar} onSave={handleSave} onCancel={() => setEditing(false)} />
          : <ProfileView userData={userData} avatar={avatar} onEdit={() => setEditing(true)} onEditAvatar={pickAvatar} onLogout={handleLogout} stats={stats} />
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  profileAvText: { fontFamily: Fonts.display, fontSize: 26, color: '#fff', fontWeight: '700' },
  onlineIndicator: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.green, borderWidth: 3, borderColor: Colors.bg, position: 'absolute', bottom: 0, right: -2 },
  profileInfoSection: { paddingTop: 48, alignItems: 'center', paddingBottom: 12, paddingHorizontal: 20 },
  profileName: { fontFamily: Fonts.display, fontSize: 22, color: '#fff', letterSpacing: -0.5 },
  profileHandle: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  badgeText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.purple },
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
  menuLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: '#fff' },
  menuSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  menuArrow: { fontFamily: Fonts.sans, fontSize: 18, color: 'rgba(255,255,255,0.2)' },
  editHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  editCancel: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.textMuted },
  editTitle: { fontFamily: Fonts.display, fontSize: 17, color: '#fff' },
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
  editFieldInput: { fontFamily: Fonts.sans, fontSize: 14, color: '#fff' },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  interestTag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  interestTagActive: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  interestTagText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  saveBtn: { borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: '#fff' },
  deleteBtn: { marginTop: 12, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.06)', alignItems: 'center' },
  deleteBtnText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: 'rgba(239,68,68,0.7)' },
});
