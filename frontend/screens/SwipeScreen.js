import React, { useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Platform, Image, Alert, ActivityIndicator,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors as BaseColors, Fonts, Radius, Shadows, useThemeMode } from '../theme';

let Colors = BaseColors;

const { width: W } = Dimensions.get('window');
const SWIPE_THRESHOLD = W * 0.28;
const ROTATION_FACTOR = 12;
const CARD_THEMES = [
  { colors: ['#6D28D9', '#2d0a5e', '#0f1a3d'], accent: '#A78BFA' },
  { colors: ['#9D174D', '#1a0533', '#0d2b3d'], accent: '#F472B6' },
  { colors: ['#065F46', '#0d2b3d', '#1a0533'], accent: '#6EE7B7' },
  { colors: ['#92400E', '#1a0533', '#2d1a0a'], accent: '#FCD34D' },
];

function resolveMediaUrl(imagePath, apiBaseUrl) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return `${apiBaseUrl}${imagePath}`;
}

function getInitials(fullName = '', username = '') {
  const words = (fullName || '').trim().split(' ').filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (username || 'U').slice(0, 2).toUpperCase();
}

function normalizeInterest(value = '') {
  return String(value || '').trim().toLowerCase();
}

function mapDiscoverUser(user, apiBaseUrl, index, currentInterestSet) {
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const tags = Array.isArray(user.interests) ? user.interests.slice(0, 4) : [];
  const commonInterests = tags.filter((tag) => currentInterestSet.has(normalizeInterest(tag)));

  return {
    id: user._id,
    initials: getInitials(user.fullName, user.username),
    name: user.fullName || user.username,
    username: user.username || '',
    city: user.city || 'Sin ciudad',
    tags,
    commonInterests,
    colors: theme.colors,
    accent: theme.accent,
    profileImage: resolveMediaUrl(user.profileImage, apiBaseUrl),
  };
}

function ProfileCard({ profile, onSwipeLeft, onSwipeRight, isTop, style }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const rotate = translateX.interpolate({ inputRange: [-W, 0, W], outputRange: [`-${ROTATION_FACTOR}deg`, '0deg', `${ROTATION_FACTOR}deg`] });
  const yesOpacity = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const noOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = useCallback(({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      const { translationX } = nativeEvent;
      if (translationX > SWIPE_THRESHOLD) {
        Animated.timing(translateX, { toValue: W * 1.5, duration: 320, useNativeDriver: true }).start(() => onSwipeRight());
      } else if (translationX < -SWIPE_THRESHOLD) {
        Animated.timing(translateX, { toValue: -W * 1.5, duration: 320, useNativeDriver: true }).start(() => onSwipeLeft());
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }).start();
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }).start();
      }
    }
  }, [onSwipeLeft, onSwipeRight]);

  return (
    <Animated.View style={[cardStyles.wrapper, style, isTop && { transform: [{ translateX }, { translateY }, { rotate }] }]}>
      <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange} enabled={isTop}>
        <Animated.View style={cardStyles.card}>
          <LinearGradient colors={profile.colors} style={StyleSheet.absoluteFill} />

          <View style={[cardStyles.innerOrb, { width: 180, height: 180, top: -40, left: -40, backgroundColor: `${profile.accent}33` }]} />
          <View style={[cardStyles.innerOrb, { width: 140, height: 140, bottom: 60, right: -20, backgroundColor: `${profile.accent}22` }]} />

          <LinearGradient colors={['transparent', 'transparent', 'rgba(0,0,0,0.92)']} style={[StyleSheet.absoluteFill, { top: '30%' }]} />

          <View style={cardStyles.avatarWrap}>
            <View style={[cardStyles.onlineRing, { borderColor: `${Colors.green}80` }]} />
            <View style={[cardStyles.avatar, { backgroundColor: `${profile.accent}33` }]}>
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={cardStyles.avatarImage} />
              ) : (
                <Text style={[cardStyles.avatarText, { color: profile.accent }]}>{profile.initials}</Text>
              )}
            </View>
          </View>

          {isTop && (
            <>
              <Animated.View style={[cardStyles.swipeLabel, cardStyles.swipeLabelYes, { opacity: yesOpacity }]}>
                <Text style={cardStyles.swipeLabelText}>ME GUSTA</Text>
              </Animated.View>
              <Animated.View style={[cardStyles.swipeLabel, cardStyles.swipeLabelNo, { opacity: noOpacity }]}>
                <Text style={cardStyles.swipeLabelText}>PASAR</Text>
              </Animated.View>
            </>
          )}

          <View style={cardStyles.info}>
            <View style={cardStyles.nameRow}>
              <Text style={cardStyles.name}>{profile.name}</Text>
            </View>
            <Text style={cardStyles.meta}>◎ {profile.city} · @{profile.username}</Text>
            <View style={cardStyles.tags}>
              {profile.tags.map((tag) => {
                const isCommon = profile.commonInterests.includes(tag);
                return (
                  <View key={tag} style={[cardStyles.tag, isCommon && cardStyles.tagCommon]}>
                    <Text style={[cardStyles.tagText, isCommon && cardStyles.tagCommonText]}>{tag}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: { position: 'absolute', width: '100%', height: '100%' },
  card: { flex: 1, borderRadius: Radius.xl, overflow: 'hidden' },
  innerOrb: { position: 'absolute', borderRadius: 999 },
  avatarWrap: { position: 'absolute', top: 18, right: 18, zIndex: 5 },
  onlineRing: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2, top: -6, left: -6, zIndex: 0 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontFamily: Fonts.display, fontSize: 14, fontWeight: '700' },
  swipeLabel: { position: 'absolute', top: 28, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, zIndex: 10 },
  swipeLabelYes: { left: 18, backgroundColor: 'rgba(74,222,128,0.9)', transform: [{ rotate: '-20deg' }] },
  swipeLabelNo: { right: 18, backgroundColor: 'rgba(239,68,68,0.9)', transform: [{ rotate: '20deg' }] },
  swipeLabelText: { fontFamily: Fonts.display, fontSize: 13, color: '#fff', letterSpacing: 0.5 },
  info: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 6 },
  name: { fontFamily: Fonts.display, fontSize: 26, color: '#fff', letterSpacing: -0.5 },
  meta: { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  tagCommon: { backgroundColor: 'rgba(74,222,128,0.2)', borderColor: 'rgba(74,222,128,0.45)' },
  tagCommonText: { color: '#A7F3D0' },
});

function ActionBtn({ onPress, size = 56, children, bg, border: bc, glowColor, glow = true }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
    ]).start();
    onPress?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {(() => {
        const glowStyle = glow ? Shadows.glow(glowColor, 16, 0.3) : {};
        return (
          <TouchableOpacity
            onPress={press}
            activeOpacity={0.9}
            style={[styles.actionBtn, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderColor: bc, ...glowStyle }]}
          >
            {children}
          </TouchableOpacity>
        );
      })()}
    </Animated.View>
  );
}

export default function SwipeScreen({ navigation, apiBaseUrl, currentUser }) {
  const { colors, mode } = useThemeMode();
  Colors = colors;
  styles = React.useMemo(() => createStyles(colors), [colors]);
  const pageGradient = mode === 'light' ? ['#F7F7FB', '#EEF2FF', '#F7F7FB'] : [Colors.bg, '#0d0818', Colors.bg];

  const [profiles, setProfiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [processingSwipe, setProcessingSwipe] = React.useState(false);
  const [lastAction, setLastAction] = React.useState(null);

  const currentInterestSet = React.useMemo(() => {
    const source = Array.isArray(currentUser?.interests) ? currentUser.interests : [];
    return new Set(source.map((interest) => normalizeInterest(interest)).filter(Boolean));
  }, [currentUser]);

  const fetchDiscoverUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/friends/discover`, {
        method: 'GET',
        credentials: 'include',
      });
      const payload = await response.json();

      if (!response.ok) {
        Alert.alert('No se pudo cargar Descubrir', payload.error || 'Error al obtener usuarios.');
        setProfiles([]);
        return;
      }

      const mapped = (Array.isArray(payload) ? payload : []).map((user, index) =>
        mapDiscoverUser(user, apiBaseUrl, index, currentInterestSet)
      );
      setProfiles(mapped);
    } catch (_error) {
      Alert.alert('Error de conexión', `No se pudo conectar con el servidor en ${apiBaseUrl}.`);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, currentInterestSet]);

  React.useEffect(() => {
    fetchDiscoverUsers();
  }, [fetchDiscoverUsers]);

  const processSwipe = useCallback(async (direction) => {
    if (processingSwipe || !profiles.length) return;

    const target = profiles[0];
    setProcessingSwipe(true);
    try {
      const response = await fetch(`${apiBaseUrl}/friends/swipe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: target.id,
          direction,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        Alert.alert('No se pudo procesar swipe', payload.error || 'Intenta nuevamente.');
        return;
      }

      setProfiles((p) => p.slice(1));
      setLastAction(direction === 'right' ? 'like' : 'skip');
      setTimeout(() => setLastAction(null), 1500);
    } catch (_error) {
      Alert.alert('Error de conexión', `No se pudo conectar con el servidor en ${apiBaseUrl}.`);
    } finally {
      setProcessingSwipe(false);
    }
  }, [apiBaseUrl, processingSwipe, profiles]);

  const handleSwipeLeft = useCallback(() => {
    processSwipe('left');
  }, [processSwipe]);

  const handleSwipeRight = useCallback(() => {
    processSwipe('right');
  }, [processSwipe]);

  const triggerSwipe = (dir) => {
    if (!profiles.length) return;
    if (dir === 'right') handleSwipeRight();
    else handleSwipeLeft();
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (_error) {
      // Ignorado.
    }

    navigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={pageGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.topbar}>
        <View>
          <Text style={styles.topTitle}>Descubrir</Text>
          <Text style={styles.topSub}>▲ {profiles.length} personas disponibles</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.red} />
        </TouchableOpacity>
      </View>

      <View style={styles.stackArea}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={Colors.purple} />
            <Text style={styles.emptySub}>Cargando personas reales...</Text>
          </View>
        ) : profiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={44} color={Colors.purple} style={styles.emptyEmoji} />
            <Text style={styles.emptyTitle}>No hay personas por mostrar</Text>
            <Text style={styles.emptySub}>Aparecerán usuarios reales cuando haya disponibles.</Text>
          </View>
        ) : (
          profiles.slice(0, 3).reverse().map((profile, idx, arr) => {
            const position = arr.length - 1 - idx;
            const isTop = position === arr.length - 1;
            const scale = 1 - (position * 0.035);
            const translateY = position * 10;
            const opacity = 0.5 + position * 0.25;
            return (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isTop={isTop}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                style={!isTop ? { transform: [{ scale }, { translateY: -translateY }], opacity } : {}}
              />
            );
          })
        )}
      </View>

      <View style={styles.actionsRow}>
        <ActionBtn onPress={() => triggerSwipe('left')} size={68} bg="rgba(239,68,68,0.12)" bc="rgba(239,68,68,0.3)" glowColor="#EF4444" glow={false}>
          <Ionicons name="close" size={24} color={Colors.red} />
        </ActionBtn>

        <ActionBtn onPress={() => triggerSwipe('right')} size={68} bg={undefined} bc="transparent" glowColor={Colors.accent}>
          <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={[StyleSheet.absoluteFill, { borderRadius: 34 }]} />
          <Ionicons name="heart" size={30} color="#fff" style={{ zIndex: 1 }} />
        </ActionBtn>
      </View>

      {!!lastAction && (
        <View style={styles.hint}>
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>{lastAction === 'like' ? 'Te gusta' : 'Pasaste'}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 56, paddingBottom: 12 },
  topTitle: { fontFamily: Fonts.display, fontSize: 24, color: Colors.text, letterSpacing: -0.5 },
  topSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  filterBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stackArea: { flex: 1, marginHorizontal: 20, marginBottom: 12 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontFamily: Fonts.display, fontSize: 20, color: Colors.text, marginBottom: 6 },
  emptySub: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.textMuted },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, paddingHorizontal: 20, paddingBottom: 10 },
  actionBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, overflow: 'hidden' },
  hint: { alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 36 : 20, paddingTop: 6 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, letterSpacing: 0.4 },
});

let styles = createStyles(BaseColors);
